

const BRIDGE_URL = (import.meta.env.VITE_BRIDGE_URL ?? "").trim();
const BRIDGE_TOKEN = (import.meta.env.VITE_OPEN_COMPUTER_TOKEN ?? "").trim();

export type CdpTarget = {
  targetId: string;
  type: string;
  title: string;
  url: string;
};

export type CdpTab = {
  targetId: string;
  title: string;
  url: string;
};


export type CdpExtension = {
  id: string;
  name: string;
  description: string;
};


export type CdpPageRect = {
  x: number;
  y: number;
  width: number;
  height: number;
  innerWidth: number;
  innerHeight: number;
  outerWidth: number;
  outerHeight: number;
  dpr: number;
  
  screenWidth: number;
  screenHeight: number;
};

export type CdpClientEvents = {
  onTabs?: (tabs: CdpTab[]) => void;
  onState?: (state: "connecting" | "connected" | "disconnected" | "error") => void;
  onActiveTab?: (targetId: string | null) => void;
  onLoading?: (loading: boolean) => void;
  
  onLastTabClosed?: () => void;
  
  onBrowserGone?: () => void;
  
  onFileChooser?: (request: ChromiumFileChooser) => void;
};


export type ChromiumFileChooser = {
  
  backendNodeId: number;
  
  mode: string;
  
  sessionId: string | null;
};

type CdpMessage = {
  id?: number;
  method?: string;
  params?: Record<string, unknown>;
  result?: Record<string, unknown>;
  sessionId?: string;
  error?: { message?: string };
};


const MAX_RECONNECTS = 12;


const TARGETS_REFRESH_MS = 1500;


const REQUEST_TIMEOUT_MS = 5000;


export const NEW_TAB_URL = "https://www.google.com";

const EXTENSIONS_PAGE = "chrome://extensions";


const EXTENSIONS_JS = `(() => {
  const manager = document.querySelector('extensions-manager');
  if (!manager || !manager.shadowRoot) return '[]';
  const list = manager.shadowRoot.querySelector('extensions-item-list');
  if (!list || !list.shadowRoot) return '[]';
  const items = list.shadowRoot.querySelectorAll('extensions-item');
  return JSON.stringify(Array.from(items).map((item) => {
    const root = item.shadowRoot;
    const name = root ? root.querySelector('#name') : null;
    const description = root ? root.querySelector('#description') : null;
    return {
      id: item.id,
      name: name ? name.textContent.trim() : '',
      description: description ? description.textContent.trim() : '',
    };
  }));
})()`;

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}


function sameTabs(
  first: Map<string, CdpTab>,
  second: Map<string, CdpTab>,
): boolean {
  if (first.size !== second.size) return false;

  for (const [targetId, tab] of first) {
    const other = second.get(targetId);
    if (!other) return false;
    if (other.title !== tab.title || other.url !== tab.url) return false;
  }

  return true;
}

function socketUrl(): string {
  const base = BRIDGE_URL
    ? `${BRIDGE_URL.replace(/\/+$/, "")}/ws/cdp`
    : `${window.location.protocol === "https:" ? "wss:" : "ws:"}//${window.location.host}/ws/cdp`;

  const url = new URL(base);

  if (BRIDGE_TOKEN) {
    url.searchParams.set("token", BRIDGE_TOKEN);
  }

  return url.toString();
}

export class ChromiumCdpClient {
  private socket: WebSocket | null = null;
  private events: CdpClientEvents;
  private commandId = 0;
  private targetsRequestIds = new Set<number>();
  private sessionId: string | null = null;
  private sessions = new Map<string, string>();
  private targets = new Map<string, CdpTab>();
  private activeTargetId: string | null = null;
  private pendingTargetId: string | null = null;
  private pending = new Map<
    number,
    (result: Record<string, unknown>) => void
  >();
  private reconnectTimer: number | null = null;
  private refreshTimer: number | null = null;
  private attempts = 0;
  private isDisposed = false;
  private loading = false;
  private lastRect: CdpPageRect | null = null;

  constructor(events: CdpClientEvents = {}) {
    this.events = events;
  }

  connect() {
    
    
    this.isDisposed = false;

    if (this.reconnectTimer !== null) {
      window.clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    const old = this.socket;
    this.socket = null;
    old?.close();

    this.events.onState?.("connecting");

    let socket: WebSocket;
    try {
      socket = new WebSocket(socketUrl());
    } catch {
      this.events.onState?.("error");
      return;
    }

    this.socket = socket;

    socket.onopen = () => {
      this.attempts = 0;
      this.events.onState?.("connected");
      this.send("Target.setDiscoverTargets", { discover: true });
      this.requestTargets();
      this.startRefresh();
    };

    socket.onmessage = (event) => {
      if (typeof event.data !== "string") return;

      let message: CdpMessage;
      try {
        message = JSON.parse(event.data) as CdpMessage;
      } catch {
        return;
      }

      this.handleMessage(message);
    };

    socket.onerror = () => {
      this.events.onState?.("error");
    };

    socket.onclose = () => {
      if (this.isDisposed) return;
      
      if (this.socket !== socket) return;

      this.events.onState?.("disconnected");
      this.stopRefresh();
      this.sessionId = null;
      this.sessions.clear();
      this.activeTargetId = null;
      this.pendingTargetId = null;
      this.targetsRequestIds.clear();
      this.clearPending();

      if (this.attempts >= MAX_RECONNECTS) {
        
        
        this.targets.clear();
        this.publishTabs();
        this.events.onBrowserGone?.();
        return;
      }

      this.attempts += 1;
      this.reconnectTimer = window.setTimeout(() => this.connect(), 1200);
    };
  }

  
  private clearPending() {
    const waiting = [...this.pending.values()];

    this.pending.clear();

    for (const resolve of waiting) resolve({});
  }

  dispose() {
    this.isDisposed = true;

    this.stopRefresh();

    if (this.reconnectTimer !== null) {
      window.clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    const socket = this.socket;
    this.socket = null;

    this.clearPending();

    socket?.close();
  }

  
  private requestTargets() {
    const id = this.send("Target.getTargets");
    if (!id) return;

    this.targetsRequestIds.add(id);

    if (this.targetsRequestIds.size > 20) {
      const oldest = this.targetsRequestIds.values().next();
      if (!oldest.done) this.targetsRequestIds.delete(oldest.value);
    }
  }

  
  private startRefresh() {
    this.stopRefresh();

    this.refreshTimer = window.setInterval(() => {
      this.requestTargets();
    }, TARGETS_REFRESH_MS);
  }

  private stopRefresh() {
    if (this.refreshTimer !== null) {
      window.clearInterval(this.refreshTimer);
      this.refreshTimer = null;
    }
  }

  get activeSessionId(): string | null {
    return this.sessionId;
  }

  

  private send(
    method: string,
    params: Record<string, unknown> = {},
    sessionId?: string | null,
  ) {
    const socket = this.socket;
    if (!socket || socket.readyState !== WebSocket.OPEN) return 0;

    this.commandId += 1;
    socket.send(
      JSON.stringify({ id: this.commandId, method, params, sessionId: sessionId ?? undefined }),
    );

    return this.commandId;
  }

  private toSession(method: string, params: Record<string, unknown> = {}) {
    if (!this.sessionId) return;
    this.send(method, params, this.sessionId);
  }

  private request(
    method: string,
    params: Record<string, unknown> = {},
    sessionId?: string | null,
  ): Promise<Record<string, unknown>> {
    const socket = this.socket;
    if (!socket || socket.readyState !== WebSocket.OPEN) {
      return Promise.resolve({});
    }

    this.commandId += 1;
    const id = this.commandId;

    return new Promise((resolve) => {
      const timer = window.setTimeout(() => {
        
        
        this.pending.delete(id);
        resolve({});
      }, REQUEST_TIMEOUT_MS);

      this.pending.set(id, (result) => {
        window.clearTimeout(timer);
        resolve(result);
      });

      socket.send(
        JSON.stringify({
          id,
          method,
          params,
          sessionId: sessionId ?? undefined,
        }),
      );
    });
  }

  
  async evaluate(expression: string): Promise<unknown> {
    const result = await this.request(
      "Runtime.evaluate",
      { expression, returnByValue: true },
      this.sessionId,
    );

    const value = (result.result as { value?: unknown } | undefined)?.value;

    return value;
  }

  
  command(
    method: string,
    params: Record<string, unknown> = {},
  ): Promise<Record<string, unknown>> {
    return this.request(method, params);
  }

  
  async pageRect(frameWidth = 0): Promise<CdpPageRect | null> {
    const metrics = await this.pageMetrics();

    if (!metrics) return null;

    const window = await this.browserWindow();

    if (!window) return null;

    
    
    
    const scale =
      metrics.screenWidth > 0 && frameWidth > 0
        ? frameWidth / metrics.screenWidth
        : 1;

    const rect: CdpPageRect = {
      x: Math.round(window.left * scale),
      y: Math.round(window.top * scale),
      width: Math.round(window.width * scale),
      height: Math.round(window.height * scale),
      innerWidth: metrics.innerWidth,
      innerHeight: metrics.innerHeight,
      outerWidth: metrics.outerWidth,
      outerHeight: metrics.outerHeight,
      dpr: scale,
      screenWidth: metrics.screenWidth,
      screenHeight: metrics.screenHeight,
    };

    this.lastRect = rect;

    return rect;
  }

  
  private async pageMetrics(): Promise<{
    outerWidth: number;
    outerHeight: number;
    innerWidth: number;
    innerHeight: number;
    screenWidth: number;
    screenHeight: number;
  } | null> {
    const raw = await this.evaluate(
      "JSON.stringify({ow: outerWidth, oh: outerHeight, iw: innerWidth, ih: innerHeight, sw: screen.width, sh: screen.height})",
    );

    if (typeof raw !== "string") return null;

    try {
      const metrics = JSON.parse(raw) as {
        ow: number;
        oh: number;
        iw: number;
        ih: number;
        sw: number;
        sh: number;
      };

      if (!Number.isFinite(metrics.ih) || metrics.ih <= 0) return null;
      if (!Number.isFinite(metrics.iw) || metrics.iw <= 0) return null;

      return {
        outerWidth: metrics.ow,
        outerHeight: metrics.oh,
        innerWidth: metrics.iw,
        innerHeight: metrics.ih,
        screenWidth: metrics.sw,
        screenHeight: metrics.sh,
      };
    } catch {
      return null;
    }
  }

  
  async setFiles(
    backendNodeId: number,
    files: string[],
    sessionId?: string | null,
  ): Promise<void> {
    await this.request(
      "DOM.setFileInputFiles",
      { files, backendNodeId },
      sessionId ?? this.sessionId,
    );
  }

  navigate(url: string) {
    this.setLoading(true);
    this.toSession("Page.navigate", { url });
  }

  goBack() {
    this.setLoading(true);
    void this.request("Page.getNavigationHistory", {}, this.sessionId).then(
      (history) => {
        const entries = (history.entries as Array<{ id: number }> | undefined) ?? [];
        const index = (history.currentIndex as number | undefined) ?? 0;

        if (index <= 0) return;

        this.toSession("Page.navigateToHistoryEntry", {
          entryId: entries[index - 1].id,
        });
      },
    );
  }

  goForward() {
    this.setLoading(true);
    void this.request("Page.getNavigationHistory", {}, this.sessionId).then(
      (history) => {
        const entries = (history.entries as Array<{ id: number }> | undefined) ?? [];
        const index = (history.currentIndex as number | undefined) ?? 0;

        if (index >= entries.length - 1) return;

        this.toSession("Page.navigateToHistoryEntry", {
          entryId: entries[index + 1].id,
        });
      },
    );
  }

  reload() {
    this.setLoading(true);
    this.toSession("Page.reload", { ignoreCache: false });
  }

  
  async fitWindow(
    viewportWidth: number,
    viewportHeight: number,
    frameWidth = 0,
  ): Promise<CdpPageRect | null> {
    if (viewportWidth <= 0 || viewportHeight <= 0) return null;

    const window = await this.browserWindow();

    if (!window) return null;

    const width = Math.round(viewportWidth);
    const height = Math.round(viewportHeight);

    if (
      Math.abs(width - window.width) < 2 &&
      Math.abs(height - window.height) < 2 &&
      Math.abs(window.left) < 2 &&
      Math.abs(window.top) < 2
    ) {
      return this.pageRect(frameWidth);
    }

    await this.request("Browser.setWindowBounds", {
      windowId: window.windowId,
      bounds: { left: 0, top: 0, width, height },
    });

    
    
    return this.pageRect(frameWidth);
  }

  
  async fillScreen(): Promise<boolean> {
    const metrics = await this.pageMetrics();

    if (!metrics) return false;

    const window = await this.browserWindow();

    if (!window) return false;

    const width = Math.round(metrics.screenWidth);
    const height = Math.round(metrics.screenHeight);

    
    
    if (
      window.width >= width &&
      window.height >= height &&
      window.left <= 0 &&
      window.top <= 0
    ) {
      return false;
    }

    
    
    await this.request("Browser.setWindowBounds", {
      windowId: window.windowId,
      bounds: { left: 0, top: 0, width: width + 1, height: height + 1 },
    });

    return true;
  }

  

  private handleMessage(message: CdpMessage) {
    if (message.id !== undefined && this.pending.has(message.id)) {
      const resolve = this.pending.get(message.id);
      this.pending.delete(message.id);
      resolve?.(message.result ?? {});
      return;
    }

    if (message.method === "Target.targetCreated") {
      const info = message.params?.targetInfo as CdpTarget | undefined;
      if (info?.type === "page") {
        this.targets.set(info.targetId, {
          targetId: info.targetId,
          title: info.title,
          url: info.url,
        });
        this.publishTabs();
      }
      return;
    }

    if (message.method === "Target.targetInfoChanged") {
      const info = message.params?.targetInfo as CdpTarget | undefined;
      if (info?.type === "page" && this.targets.has(info.targetId)) {
        this.targets.set(info.targetId, {
          targetId: info.targetId,
          title: info.title,
          url: info.url,
        });
        this.publishTabs();
      }
      return;
    }

    if (message.method === "Target.targetDestroyed") {
      const targetId = message.params?.targetId as string | undefined;
      if (targetId) {
        this.targets.delete(targetId);
        this.publishTabs();
      }
      return;
    }

    if (message.method === "Target.attachedToTarget") {
      const sessionId = message.params?.sessionId as string | undefined;
      const targetInfo = message.params?.targetInfo as CdpTarget | undefined;
      if (!sessionId || !targetInfo) return;

      this.sessions.set(targetInfo.targetId, sessionId);

      
      
      if (this.activeTargetId && this.activeTargetId !== targetInfo.targetId) {
        return;
      }

      this.sessionId = sessionId;
      this.activeTargetId = targetInfo.targetId;

      this.send("Page.enable", {}, sessionId);
      this.send("Runtime.enable", {}, sessionId);
      this.send("DOM.enable", {}, sessionId);
      this.send("Page.setLifecycleEventsEnabled", { enabled: true }, sessionId);
      
      
      this.send("Page.setInterceptFileChooserDialog", { enabled: true }, sessionId);

      
      
      if (this.pendingTargetId === targetInfo.targetId) {
        this.pendingTargetId = null;
        this.send("Page.bringToFront", {}, sessionId);
        this.wakeUp(sessionId);
      }

      this.events.onActiveTab?.(targetInfo.targetId);
      return;
    }

    if (message.method === "Page.frameStartedLoading") {
      this.setLoading(true);
      return;
    }

    if (message.method === "Page.fileChooserOpened") {
      const params = message.params as
        | { backendNodeId?: number; mode?: string }
        | undefined;

      if (typeof params?.backendNodeId === "number") {
        this.events.onFileChooser?.({
          backendNodeId: params.backendNodeId,
          mode: params.mode ?? "selectSingle",
          sessionId: message.sessionId ?? null,
        });
      }
      return;
    }

    if (message.method === "Page.frameStoppedLoading") {
      this.setLoading(false);
      return;
    }

    if (message.method === "Page.lifecycleEvent") {
      const name = message.params?.name as string | undefined;
      if (name === "load") this.setLoading(false);
      return;
    }

    if (
      message.id !== undefined &&
      this.targetsRequestIds.has(message.id) &&
      message.result
    ) {
      this.targetsRequestIds.delete(message.id);

      const targetInfos = (message.result.targetInfos as CdpTarget[] | undefined) ?? [];
      const targets = new Map<string, CdpTab>();

      for (const info of targetInfos) {
        if (info.type !== "page") continue;
        targets.set(info.targetId, {
          targetId: info.targetId,
          title: info.title,
          url: info.url,
        });
      }

      const changed = !sameTabs(this.targets, targets);

      this.targets = targets;

      if (changed) this.publishTabs();

      
      
      if (this.activeTargetId && !targets.has(this.activeTargetId)) {
        this.sessionId = null;
        this.sessions.clear();
        this.activeTargetId = null;
        this.pendingTargetId = null;
      }

      if (!this.sessionId) {
        void this.attachToVisibleTab();
      }
    }
  }

  attachTo(targetId: string) {
    if (this.activeTargetId === targetId && this.sessionId) return;

    this.activeTargetId = targetId;
    this.send("Target.attachToTarget", { targetId, flatten: true });
  }

  
  private async attachToVisibleTab(): Promise<void> {
    const tabs = [...this.targets.values()];

    for (const tab of tabs) {
      const sessionId = await this.attachFor(tab.targetId);
      if (!sessionId) continue;

      const state = await this.request(
        "Runtime.evaluate",
        { expression: "document.visibilityState", returnByValue: true },
        sessionId,
      );

      const value = (state.result as { value?: unknown } | undefined)?.value;

      if (value === "visible") {
        this.activeTargetId = tab.targetId;
        this.sessionId = sessionId;
        this.events.onActiveTab?.(tab.targetId);
        return;
      }
    }

    const first = tabs[0];
    if (first) this.attachTo(first.targetId);
  }

  
  private async attachFor(targetId: string): Promise<string | null> {
    const known = this.sessions.get(targetId);
    if (known) return known;

    this.send("Target.attachToTarget", { targetId, flatten: true });

    for (let attempt = 0; attempt < 40; attempt += 1) {
      await wait(50);

      const sessionId = this.sessions.get(targetId);
      if (sessionId) {
        this.send("Page.enable", {}, sessionId);
        this.send("Runtime.enable", {}, sessionId);
        this.send("DOM.enable", {}, sessionId);
        this.send("Page.setInterceptFileChooserDialog", { enabled: true }, sessionId);
        return sessionId;
      }
    }

    return null;
  }

  
  activateTab(targetId: string) {
    this.activeTargetId = targetId;
    this.pendingTargetId = targetId;
    this.send("Target.activateTarget", { targetId });
    this.attachTo(targetId);

    
    
    this.events.onActiveTab?.(targetId);
  }

  createTab(url = NEW_TAB_URL) {
    this.send("Target.createTarget", { url });
  }

  
  closeAllTabs() {
    for (const target of this.targets.values()) {
      this.send("Target.closeTarget", { targetId: target.targetId });
    }
  }

  closeTab(targetId: string) {
    
    
    const isLastTab = this.targets.size <= 1;

    this.send("Target.closeTarget", { targetId });

    if (isLastTab) {
      this.events.onLastTabClosed?.();
      return;
    }

    if (this.activeTargetId !== targetId) return;

    
    
    const tabs = [...this.targets.values()];
    const index = tabs.findIndex((tab) => tab.targetId === targetId);
    const next = tabs[index + 1] ?? tabs[index - 1] ?? null;

    if (!next) return;

    this.activeTargetId = next.targetId;
    this.events.onActiveTab?.(next.targetId);
  }

  
  async listExtensions(): Promise<CdpExtension[]> {
    const created = await this.request("Target.createTarget", {
      url: EXTENSIONS_PAGE,
      background: true,
    });

    const targetId = created.targetId as string | undefined;
    if (!targetId) return [];

    try {
      const attached = await this.request("Target.attachToTarget", {
        targetId,
        flatten: true,
      });

      const sessionId = attached.sessionId as string | undefined;
      if (!sessionId) return [];

      this.send("Runtime.enable", {}, sessionId);
      await wait(1200);

      const raw = await this.request(
        "Runtime.evaluate",
        { expression: EXTENSIONS_JS, returnByValue: true },
        sessionId,
      );

      const value = (raw.result as { value?: unknown } | undefined)?.value;
      if (typeof value !== "string") return [];

      const items = JSON.parse(value) as CdpExtension[];

      return items.filter((item) => Boolean(item?.id));
    } catch {
      return [];
    } finally {
      this.send("Target.closeTarget", { targetId });
    }
  }

  
  async openExtension(id: string): Promise<void> {
    const page = await this.extensionPage(id);
    const created = await this.request("Target.createTarget", { url: page });
    const targetId = created.targetId as string | undefined;

    if (targetId) this.activateTab(targetId);
  }

  
  async openExtensionManager(): Promise<void> {
    const created = await this.request("Target.createTarget", {
      url: EXTENSIONS_PAGE,
    });

    const targetId = created.targetId as string | undefined;
    if (targetId) this.activateTab(targetId);
  }

  get currentTargetId(): string | null {
    return this.activeTargetId;
  }

  get isLoading(): boolean {
    return this.loading;
  }

  private setLoading(loading: boolean) {
    if (this.loading === loading) return;

    this.loading = loading;
    this.events.onLoading?.(loading);
  }

  
  private wakeUp(sessionId: string) {
    const rect = this.lastRect;

    this.send(
      "Input.dispatchMouseEvent",
      {
        type: "mouseMoved",
        x: Math.round((rect?.innerWidth ?? 100) / 2),
        y: Math.round((rect?.innerHeight ?? 100) / 2),
        button: "none",
      },
      sessionId,
    );
  }

  
  private async browserWindow(): Promise<{
    windowId: number;
    left: number;
    top: number;
    width: number;
    height: number;
    state: string;
  } | null> {
    if (!this.activeTargetId) return null;

    const result = await this.request("Browser.getWindowForTarget", {
      targetId: this.activeTargetId,
    });

    const windowId = result.windowId;
    const bounds = result.bounds as
      | {
          left?: number;
          top?: number;
          width?: number;
          height?: number;
          windowState?: string;
        }
      | undefined;

    if (typeof windowId !== "number" || !bounds?.width || !bounds?.height) {
      return null;
    }

    const state =
      typeof result.windowState === "string"
        ? result.windowState
        : typeof bounds.windowState === "string"
          ? bounds.windowState
          : "normal";

    return {
      windowId,
      left: bounds.left ?? 0,
      top: bounds.top ?? 0,
      width: bounds.width,
      height: bounds.height,
      state,
    };
  }

  
  private async extensionPage(id: string): Promise<string> {
    const created = await this.request("Target.createTarget", {
      url: `chrome-extension://${id}/manifest.json`,
      background: true,
    });

    const targetId = created.targetId as string | undefined;
    if (!targetId) return `chrome-extension://${id}/`;

    try {
      const attached = await this.request("Target.attachToTarget", {
        targetId,
        flatten: true,
      });

      const sessionId = attached.sessionId as string | undefined;
      if (!sessionId) return `chrome-extension://${id}/`;

      this.send("Runtime.enable", {}, sessionId);
      await wait(700);

      const raw = await this.request(
        "Runtime.evaluate",
        { expression: "document.body ? document.body.innerText : ''", returnByValue: true },
        sessionId,
      );

      const text = (raw.result as { value?: unknown } | undefined)?.value;
      if (typeof text !== "string") return `chrome-extension://${id}/`;

      const manifest = JSON.parse(text) as {
        action?: { default_popup?: string };
        browser_action?: { default_popup?: string };
      };

      const popup =
        manifest.action?.default_popup ?? manifest.browser_action?.default_popup;

      if (!popup) return `chrome-extension://${id}/`;

      return `chrome-extension://${id}/${popup.replace(/^\//, "")}`;
    } catch {
      return `chrome-extension://${id}/`;
    } finally {
      this.send("Target.closeTarget", { targetId });
    }
  }

  private publishTabs() {
    const tabs = [...this.targets.values()];
    this.events.onTabs?.(tabs);
  }
}

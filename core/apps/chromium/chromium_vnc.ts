import type { CdpPageRect } from "./chromium_cdp.ts";



type DisplayLike = {
  clipViewport: boolean;
  scale: number;
  width: number;
  height: number;
  _viewportLoc: { x: number; y: number; w: number; h: number };
  viewportChangeSize: (width: number, height: number) => void;
  viewportChangePos: (deltaX: number, deltaY: number) => void;
};

type CursorImage = {
  rgbaPixels: Uint8Array;
  hotx: number;
  hoty: number;
  w: number;
  h: number;
};

type RfbLike = {
  clipViewport: boolean;
  scaleViewport: boolean;
  _display?: DisplayLike;
  _screen?: HTMLElement;
  _canvas?: HTMLCanvasElement;
  _cursorImage?: CursorImage;
  _updateCursor?: (
    rgba: Uint8Array,
    hotx: number,
    hoty: number,
    w: number,
    h: number,
  ) => void;
  _refreshCursor?: () => void;
  addEventListener: (type: string, listener: (event: Event) => void) => void;
  removeEventListener: (type: string, listener: (event: Event) => void) => void;
  disconnect: () => void;
  focus: () => void;
};

type RfbConstructor = new (
  target: HTMLElement,
  url: string,
  options?: Record<string, unknown>,
) => RfbLike;

export type ChromiumVncHandlers = {
  
  onReady?: () => void;
  
  onLost?: () => void;
  
  onScreenSize?: (width: number, height: number) => void;
};


const RECONNECT_DELAY_MS = 1200;


const MAX_RECONNECT_DELAY_MS = 5000;


function scaleCursorImage(image: CursorImage, scale: number): CursorImage {
  if (!(scale > 0) || scale >= 1) return image;

  const width = Math.max(1, Math.round(image.w * scale));
  const height = Math.max(1, Math.round(image.h * scale));
  const pixels = new Uint8Array(width * height * 4);

  for (let y = 0; y < height; y += 1) {
    const sourceY = Math.min(image.h - 1, Math.floor(y / scale));

    for (let x = 0; x < width; x += 1) {
      const sourceX = Math.min(image.w - 1, Math.floor(x / scale));
      const source = (sourceY * image.w + sourceX) * 4;
      const target = (y * width + x) * 4;

      pixels[target] = image.rgbaPixels[source];
      pixels[target + 1] = image.rgbaPixels[source + 1];
      pixels[target + 2] = image.rgbaPixels[source + 2];
      pixels[target + 3] = image.rgbaPixels[source + 3];
    }
  }

  return {
    rgbaPixels: pixels,
    hotx: Math.round(image.hotx * scale),
    hoty: Math.round(image.hoty * scale),
    w: width,
    h: height,
  };
}


function websockifyUrl(): string {
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";

  return `${protocol}//${window.location.host}/websockify`;
}


function novncModuleUrl(): string {
  return `${window.location.origin}/novnc/core/rfb.js`;
}

export class ChromiumVnc {
  private host: HTMLElement | null = null;
  private screen: HTMLDivElement | null = null;
  private rfb: RfbLike | null = null;
  private observer: ResizeObserver | null = null;
  private rect: CdpPageRect | null = null;
  private cursor: CursorImage | null = null;
  private scale = 0;
  private attempts = 0;
  private retryTimer: number | null = null;
  private disposed = false;
  private handlers: ChromiumVncHandlers = {};

  
  async connect(host: HTMLElement, handlers: ChromiumVncHandlers): Promise<void> {
    this.dispose();

    this.disposed = false;
    this.host = host;
    this.handlers = handlers;

    await this.start();

    if (this.disposed) return;

    this.observer = new ResizeObserver(() => this.applyCrop());
    this.observer.observe(host);
  }

  
  setPageRect(rect: CdpPageRect | null) {
    this.rect = rect;
    this.applyCrop();
  }

  
  focus() {
    this.rfb?.focus();
  }

  dispose() {
    this.disposed = true;

    if (this.retryTimer !== null) {
      window.clearTimeout(this.retryTimer);
      this.retryTimer = null;
    }

    this.observer?.disconnect();
    this.observer = null;

    const rfb = this.rfb;
    this.rfb = null;

    
    
    this.screen?.remove();
    this.screen = null;
    this.host = null;

    try {
      rfb?.disconnect();
    } catch {
      
    }
  }

  

  private async start(): Promise<void> {
    const host = this.host;
    if (!host) return;

    let module: { default?: RfbConstructor };

    try {
      module = (await import( novncModuleUrl())) as {
        default?: RfbConstructor;
      };
    } catch {
      this.handlers.onLost?.();
      return;
    }

    if (this.disposed || !module.default) return;

    const screen = document.createElement("div");
    screen.className = "oc-chromium__screen-host";
    host.appendChild(screen);
    this.screen = screen;

    let rfb: RfbLike;

    try {
      rfb = new module.default(screen, websockifyUrl(), {});
    } catch {
      this.screen?.remove();
      this.screen = null;
      this.handlers.onLost?.();
      return;
    }

    this.rfb = rfb;

    
    
    
    rfb.clipViewport = true;
    rfb.scaleViewport = false;

    (rfb as unknown as { _updateScale?: () => void })._updateScale = () => {
      const display = this.rfb?._display;
      const scale = this.scale;

      if (display && scale) display.scale = scale;
    };

    
    
    (
      rfb as unknown as { _updateCursor?: RfbLike["_updateCursor"] }
    )._updateCursor = (rgba, hotx, hoty, w, h) => {
      this.cursor = { rgbaPixels: rgba, hotx, hoty, w, h };
      this.applyCursorScale();
    };

    
    
    
    (rfb as unknown as { _updateClip?: () => void })._updateClip = () => {
      this.applyCrop();
    };

    rfb.addEventListener("connect", () => {
      if (this.disposed) return;

      this.attempts = 0;
      this.applyCrop();

      
      
      rfb.focus();

      const display = rfb._display;
      if (display) {
        this.handlers.onScreenSize?.(display.width, display.height);
      }

      this.handlers.onReady?.();
    });

    rfb.addEventListener("disconnect", () => {
      if (this.disposed) return;

      this.handlers.onLost?.();

      
      
      
      this.attempts += 1;

      const delay = Math.min(
        RECONNECT_DELAY_MS * this.attempts,
        MAX_RECONNECT_DELAY_MS,
      );

      this.retryTimer = window.setTimeout(() => {
        this.retryTimer = null;
        void this.reconnect();
      }, delay);
    });
  }

  
  private async reconnect(): Promise<void> {
    if (this.disposed) return;

    const host = this.host;
    if (!host) return;

    const rfb = this.rfb;
    this.rfb = null;
    this.screen?.remove();
    this.screen = null;

    try {
      rfb?.disconnect();
    } catch {
      
    }

    await this.start();
  }

  
  private applyCursorScale() {
    const rfb = this.rfb;
    const image = this.cursor;

    if (!rfb || !image) return;

    rfb._cursorImage = scaleCursorImage(image, this.scale);
    rfb._refreshCursor?.();
  }

  
  private applyCrop() {
    const host = this.host;
    const rfb = this.rfb;

    if (!host || !rfb) return;

    const display = rfb._display;
    const screen = rfb._screen;
    const canvas = rfb._canvas;

    if (!display || !screen || !canvas) return;

    const bounds = host.getBoundingClientRect();

    if (bounds.width <= 0 || bounds.height <= 0) return;

    const whole = this.rect === null;
    const page = this.rect ?? {
      x: 0,
      y: 0,
      width: display.width,
      height: display.height,
    };

    if (page.width <= 0 || page.height <= 0) return;

    const boxAspect = bounds.width / bounds.height;
    const pageAspect = page.width / page.height;

    let cutWidth: number;
    let cutHeight: number;
    let cutX: number;
    let cutY: number;

    if (whole) {
      
      cutWidth = page.width;
      cutHeight = page.height;
      cutX = page.x;
      cutY = page.y;
    } else if (pageAspect > boxAspect) {
      
      cutHeight = page.height;
      cutWidth = Math.round(cutHeight * boxAspect);
      cutX = page.x + Math.round((page.width - cutWidth) / 2);
      cutY = page.y;
    } else {
      
      
      cutWidth = page.width;
      cutHeight = Math.round(cutWidth / boxAspect);
      cutX = page.x;
      cutY = page.y;
    }

    
    const screenWidth = display.width;
    const screenHeight = display.height;

    cutWidth = Math.min(cutWidth, screenWidth);
    cutHeight = Math.min(cutHeight, screenHeight);
    cutX = Math.max(0, Math.min(cutX, screenWidth - cutWidth));
    cutY = Math.max(0, Math.min(cutY, screenHeight - cutHeight));

    
    
    const scale = Math.max(
      bounds.width / cutWidth,
      bounds.height / cutHeight,
    );

    display.clipViewport = true;
    display.viewportChangeSize(cutWidth, cutHeight);

    
    
    const viewport = display._viewportLoc;

    display.viewportChangePos(cutX - viewport.x, cutY - viewport.y);
    display.scale = scale;

    
    
    const pictureWidth = cutWidth * scale;
    const pictureHeight = cutHeight * scale;

    screen.style.position = "absolute";
    screen.style.display = "block";
    screen.style.overflow = "visible";
    screen.style.width = `${pictureWidth}px`;
    screen.style.height = `${pictureHeight}px`;
    screen.style.left = "0px";
    screen.style.top = "0px";

    canvas.style.display = "block";
    canvas.style.margin = "0";
    canvas.style.position = "relative";

    
    
    this.scale = scale;
    window.requestAnimationFrame(() => {
      const current = this.rfb?._display;
      if (current) current.scale = scale;
    });

    
    
    this.applyCursorScale();

    this.handlers.onScreenSize?.(display.width, display.height);
  }
}

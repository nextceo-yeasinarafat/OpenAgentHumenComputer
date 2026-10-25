import { FitAddon } from "@xterm/addon-fit";
import { Terminal } from "@xterm/xterm";
import "@xterm/xterm/css/xterm.css";



export type TerminalConnectionState =
  | "connecting"
  | "connected"
  | "reconnecting"
  | "closed"
  | "error";

export type TerminalContentConnection = {
  terminal: Terminal;
  fit: () => void;
  refresh: () => void;
  dispose: () => void;
};


export function quoteTerminalPath(path: string): string {
  return `'${path.replace(/'/g, "'\\''")}'`;
}

type TerminalContentOptions = {
  onStateChange?: (state: TerminalConnectionState) => void;
  
  initialCommand?: string;
  
  onCwdChange?: (path: string) => void;
};




const BRIDGE_URL = (import.meta.env.VITE_BRIDGE_URL ?? "").trim();
const BRIDGE_TOKEN = (import.meta.env.VITE_OPEN_COMPUTER_TOKEN ?? "").trim();

const MAX_RECONNECTS = 5;
const RECONNECT_DELAY_MS = 1000;
const MIN_PANE_SIZE = 20;




const OSC_7_PREFIX = "\x1b]7;";



const OSC_7_MAX_CARRY = 1024;

function parseOsc7Folder(payload: string): string | null {
  if (!payload.startsWith("file://")) return null;

  const rest = payload.slice("file://".length);
  const slash = rest.indexOf("/");
  if (slash === -1) return null;

  const raw = rest.slice(slash);
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

function buildSocketUrl(cols: number, rows: number): string {
  const base = BRIDGE_URL
    ? `${BRIDGE_URL.replace(/\/+$/, "")}/ws/pty`
    : `${window.location.protocol === "https:" ? "wss:" : "ws:"}//${window.location.host}/ws/pty`;

  const params = new URLSearchParams({
    cols: String(cols),
    rows: String(rows),
  });

  if (BRIDGE_TOKEN) {
    params.set("token", BRIDGE_TOKEN);
  }

  return `${base}?${params.toString()}`;
}


export function createTerminalContent(
  container: HTMLElement,
  options: TerminalContentOptions = {},
): TerminalContentConnection {
  const terminal = new Terminal({
    allowProposedApi: true,
    cursorBlink: true,
    cursorStyle: "block",
    cursorWidth: 8,
    fontFamily:
      'Menlo, "SF Mono", "JetBrains Mono", "DejaVu Sans Mono", Monaco, "Courier New", monospace',
    fontSize: 13,
    lineHeight: 1.25,
    scrollback: 5000,
    theme: {
      background: "#000000",
      foreground: "#f2f2f2",
      cursor: "#f2f2f2",
      cursorAccent: "#000000",
      selectionBackground: "rgba(255, 255, 255, 0.28)",
      selectionForeground: "#ffffff",
    },
  });

  const fitAddon = new FitAddon();
  terminal.loadAddon(fitAddon);
  terminal.open(container);

  let socket: WebSocket | null = null;
  let reconnectTimer: number | null = null;
  let reconnectAttempts = 0;
  let isDisposed = false;

  
  
  
  
  let osc7Carry = "";

  const takeFoldersOutOf = (data: string): string => {
    let buffer = osc7Carry + data;
    osc7Carry = "";
    let visible = "";
    let cursor = 0;

    for (;;) {
      const start = buffer.indexOf(OSC_7_PREFIX, cursor);
      if (start === -1) {
        visible += buffer.slice(cursor);
        return visible;
      }

      visible += buffer.slice(cursor, start);

      const bodyStart = start + OSC_7_PREFIX.length;
      let end = -1;
      let terminatorLength = 0;

      for (let index = bodyStart; index < buffer.length; index += 1) {
        const character = buffer[index];
        if (character === "\x07") {
          end = index;
          terminatorLength = 1;
          break;
        }
        if (character === "\x1b") {
          
          
          if (buffer[index + 1] === "\\") {
            end = index;
            terminatorLength = 2;
          }
          break;
        }
      }

      if (end === -1) {
        const rest = buffer.slice(start);
        if (rest.length <= OSC_7_MAX_CARRY) {
          osc7Carry = rest;
          return visible;
        }

        visible += rest;
        return visible;
      }

      const folder = parseOsc7Folder(buffer.slice(bodyStart, end));
      if (folder) options.onCwdChange?.(folder);
      cursor = end + terminatorLength;
    }
  };

  const fit = () => {
    if (container.clientWidth < MIN_PANE_SIZE) return;
    if (container.clientHeight < MIN_PANE_SIZE) return;

    try {
      fitAddon.fit();
    } catch {
      
    }
  };

  const refresh = () => {
    try {
      terminal.refresh(0, Math.max(0, terminal.rows - 1));
    } catch {
      
    }
  };

  const sendResize = () => {
    if (!socket || socket.readyState !== WebSocket.OPEN) return;

    socket.send(
      JSON.stringify({
        type: "resize",
        cols: terminal.cols,
        rows: terminal.rows,
      }),
    );
  };

  const sendInput = (data: string) => {
    if (!socket || socket.readyState !== WebSocket.OPEN) return;

    socket.send(JSON.stringify({ type: "input", data }));
  };

  const connect = () => {
    if (isDisposed) return;

    options.onStateChange?.(
      reconnectAttempts === 0 ? "connecting" : "reconnecting",
    );

    socket = new WebSocket(buildSocketUrl(terminal.cols, terminal.rows));

    socket.onopen = () => {
      reconnectAttempts = 0;
      options.onStateChange?.("connected");
      fit();
      sendResize();

      
      
      if (options.initialCommand) {
        sendInput(`${options.initialCommand}\r`);
      }

      terminal.focus();
    };

    socket.onmessage = (event) => {
      if (typeof event.data !== "string") return;

      let message: { type?: string; data?: string; detail?: string };
      try {
        message = JSON.parse(event.data) as {
          type?: string;
          data?: string;
          detail?: string;
        };
      } catch {
        terminal.write(event.data);
        return;
      }

      if (message.type === "output") {
        terminal.write(takeFoldersOutOf(message.data ?? ""));
      } else if (message.type === "exit") {
        terminal.write("\r\n\x1b[90m[session ended]\x1b[0m\r\n");
      } else if (message.type === "error") {
        terminal.write(
          `\r\n\x1b[31m${message.detail ?? "the computer is not available"}\x1b[0m\r\n`,
        );
      }
    };

    socket.onerror = () => {
      options.onStateChange?.("error");
    };

    socket.onclose = () => {
      if (isDisposed) return;

      options.onStateChange?.("closed");

      if (reconnectAttempts >= MAX_RECONNECTS) {
        terminal.write(
          "\r\n\x1b[31mCannot reach the computer. Is the bridge running?\x1b[0m\r\n",
        );
        return;
      }

      reconnectAttempts += 1;
      reconnectTimer = window.setTimeout(connect, RECONNECT_DELAY_MS);
    };
  };

  const disposable = terminal.onData((data) => sendInput(data));

  const observer = new ResizeObserver(() => {
    fit();
    sendResize();
  });
  observer.observe(container);

  const focusOnClick = () => terminal.focus();
  container.addEventListener("mousedown", focusOnClick);

  fit();
  connect();

  return {
    terminal,
    fit,
    refresh,
    dispose: () => {
      isDisposed = true;

      if (reconnectTimer !== null) {
        window.clearTimeout(reconnectTimer);
        reconnectTimer = null;
      }

      observer.disconnect();
      container.removeEventListener("mousedown", focusOnClick);
      disposable.dispose();

      if (socket) {
        socket.onclose = null;
        socket.close();
        socket = null;
      }

      terminal.dispose();
    },
  };
}
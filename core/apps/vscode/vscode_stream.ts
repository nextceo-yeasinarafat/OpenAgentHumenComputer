import { useCallback, useEffect, useRef, useState } from "react";



export type VscodeStreamStatus = "loading" | "ready" | "error";

const VSCODE_PATH = `${import.meta.env.BASE_URL}vscode/`;
const INITIAL_TIMEOUT_MS = 30_000;
const SETTLE_MS = 1_200;
const WATCHDOG_MS = 2_000;
const MAX_RETRIES = 10;
const RETRY_DELAY_MS = 800;
const RETRY_MAX_DELAY_MS = 8_000;


const DISCONNECT_MARKERS = [
  "WebSocket close",
  "requires a reload of this page",
  "workbench failed to connect",
];




export const VSCODE_STREAM_URL = VSCODE_PATH;

export function useVscodeStream({
  onActivate,
}: {
  onActivate?: () => void;
} = {}) {
  const frameRef = useRef<HTMLIFrameElement | null>(null);
  const initialTimer = useRef<number | null>(null);
  const settleTimer = useRef<number | null>(null);
  const retryTimer = useRef<number | null>(null);
  const retries = useRef(0);
  const [status, setStatus] = useState<VscodeStreamStatus>("loading");

  const clearTimer = useCallback(
    (timer: { current: number | null }) => {
      if (timer.current !== null) {
        window.clearTimeout(timer.current);
        timer.current = null;
      }
    },
    [],
  );

  const clearAllTimers = useCallback(() => {
    clearTimer(initialTimer);
    clearTimer(settleTimer);
    clearTimer(retryTimer);
  }, [clearTimer]);

  useEffect(() => clearAllTimers, [clearAllTimers]);

  const workbenchIsThere = useCallback(() => {
    try {
      return !!frameRef.current?.contentDocument?.querySelector(
        ".monaco-workbench",
      );
    } catch {
      return false;
    }
  }, []);

  const streamIsDisconnected = useCallback(() => {
    const text = frameRef.current?.contentDocument?.body?.innerText ?? "";
    return DISCONNECT_MARKERS.some((marker) => text.includes(marker));
  }, []);

  const reloadFrame = useCallback(() => {
    const frame = frameRef.current;
    if (!frame) return;

    try {
      frame.contentWindow?.location.reload();
    } catch {
      
      
      frame.src = VSCODE_STREAM_URL;
    }
  }, []);

  const scheduleRetry = useCallback(
    (immediate = false) => {
      if (retryTimer.current !== null) return;

      clearTimer(initialTimer);

      if (retries.current >= MAX_RETRIES) {
        setStatus("error");
        return;
      }

      const attempt = retries.current;
      retries.current += 1;
      const delay = immediate
        ? 0
        : Math.min(RETRY_DELAY_MS * 2 ** attempt, RETRY_MAX_DELAY_MS);

      retryTimer.current = window.setTimeout(() => {
        retryTimer.current = null;
        setStatus("loading");
        reloadFrame();
      }, delay);
    },
    [clearTimer, reloadFrame],
  );

  const markReady = useCallback(() => {
    const ready = () => workbenchIsThere() && !streamIsDisconnected();

    if (ready()) {
      clearAllTimers();
      retries.current = 0;
      setStatus("ready");
      return;
    }

    
    
    
    clearTimer(settleTimer);
    settleTimer.current = window.setTimeout(() => {
      settleTimer.current = null;
      if (ready()) {
        clearAllTimers();
        retries.current = 0;
        setStatus("ready");
      } else {
        scheduleRetry();
      }
    }, SETTLE_MS);
  }, [
    clearAllTimers,
    clearTimer,
    scheduleRetry,
    streamIsDisconnected,
    workbenchIsThere,
  ]);

  const markError = useCallback(() => {
    scheduleRetry();
  }, [scheduleRetry]);

  
  
  
  
  useEffect(() => {
    if (!onActivate) return;

    const handleFocus = () => {
      if (status === "ready" && streamIsDisconnected()) {
        retries.current = 0;
        setStatus("loading");
        scheduleRetry(true);
      }
    };

    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [onActivate, retries, scheduleRetry, status, streamIsDisconnected]);

  
  
  useEffect(() => {
    if (status !== "loading") return;

    clearTimer(initialTimer);
    initialTimer.current = window.setTimeout(() => {
      if (!workbenchIsThere()) setStatus("error");
    }, INITIAL_TIMEOUT_MS);

    return () => clearTimer(initialTimer);
  }, [clearTimer, status, workbenchIsThere]);

  
  
  
  useEffect(() => {
    if (status !== "ready") return;

    const interval = window.setInterval(() => {
      if (!streamIsDisconnected()) return;

      retries.current = 0;
      setStatus("loading");
      scheduleRetry(true);
    }, WATCHDOG_MS);

    return () => window.clearInterval(interval);
  }, [scheduleRetry, status, streamIsDisconnected]);

  const reload = useCallback(() => {
    clearAllTimers();
    retries.current = 0;
    setStatus("loading");
    reloadFrame();
  }, [clearAllTimers, reloadFrame]);

  
  
  
  useEffect(() => {
    if (!onActivate) return;

    const handleBlur = () => {
      if (document.activeElement === frameRef.current) onActivate();
    };

    window.addEventListener("blur", handleBlur);
    return () => window.removeEventListener("blur", handleBlur);
  }, [onActivate]);

  return {
    frameRef,
    status,
    src: VSCODE_STREAM_URL,
    reload,
    markReady,
    markError,
  };
}

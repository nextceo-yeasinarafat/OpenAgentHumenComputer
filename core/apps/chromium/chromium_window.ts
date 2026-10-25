import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ChromiumCdpClient,
  type CdpPageRect,
  type CdpTab,
  type ChromiumFileChooser,
} from "./chromium_cdp.ts";
import { sleepComputerBrowser, wakeComputerBrowser } from "./chromium_sleep.ts";



export type ChromiumBrowserState =
  | "connecting"
  | "connected"
  | "disconnected"
  | "error";

export type ChromiumBrowser = {
  client: ChromiumCdpClient;
  tabs: CdpTab[];
  activeTabId: string | null;
  
  pageRect: CdpPageRect | null;
  state: ChromiumBrowserState;
  
  isConnected: boolean;
  
  screenSize: { width: number; height: number };
  
  setScreenSize: (width: number, height: number) => void;
  
  sleep: () => void;
  
  fileChooser: ChromiumFileChooser | null;
  
  chooseFiles: (paths: string[]) => void;
  
  cancelFileChooser: () => void;
};


const RECT_REFRESH_MS = 400;


function sameRect(first: CdpPageRect | null, second: CdpPageRect): boolean {
  if (!first) return false;

  return (
    first.x === second.x &&
    first.y === second.y &&
    first.width === second.width &&
    first.height === second.height
  );
}

export function useChromiumWindow(enabled: boolean): ChromiumBrowser {
  const [tabs, setTabs] = useState<CdpTab[]>([]);
  const [activeTabId, setActiveTabId] = useState<string | null>(null);
  const [state, setState] = useState<ChromiumBrowserState>("connecting");
  const [pageRect, setPageRect] = useState<CdpPageRect | null>(null);
  const [screenSize, setScreenSizeState] = useState({ width: 0, height: 0 });
  const [fileChooser, setFileChooser] = useState<ChromiumFileChooser | null>(null);

  const screenRef = useRef({ width: 0, height: 0 });
  
  const waking = useRef<Promise<void> | null>(null);
  
  const sleeping = useRef<Promise<void> | null>(null);

  const client = useMemo(
    () =>
      new ChromiumCdpClient({
        onTabs: (nextTabs) => {
          setTabs(nextTabs);
        },
        onState: (next) => {
          setState(next);
        },
        onActiveTab: (targetId) => {
          setActiveTabId(targetId);
        },
        onFileChooser: (request) => {
          setFileChooser(request);
        },
      }),
    [],
  );

  
  
  
  
  
  useEffect(() => {
    if (!enabled) return;

    void (waking.current = wakeComputerBrowser());

    client.connect();

    return () => {
      const sleep = sleeping.current;

      
      
      setFileChooser(null);

      if (!sleep) {
        client.dispose();
        return;
      }

      void sleep.finally(() => {
        sleeping.current = null;
        client.dispose();
      });
    };
  }, [client, enabled]);

  
  
  
  
  useEffect(() => {
    if (!enabled || state !== "disconnected") return;

    const timer = window.setTimeout(() => {
      client.connect();
    }, 5000);

    return () => window.clearTimeout(timer);
  }, [client, enabled, state]);

  const setScreenSize = useCallback((width: number, height: number) => {
    const current = screenRef.current;

    if (current.width === width && current.height === height) return;

    screenRef.current = { width, height };
    setScreenSizeState({ width, height });
  }, []);

  
  const sleep = useCallback(() => {
    if (!enabled || sleeping.current) return;

    sleeping.current = (async () => {
      
      
      
      await waking.current;
      waking.current = null;

      await sleepComputerBrowser(client);
    })().then(
      () => undefined,
      () => undefined,
    );
  }, [client, enabled]);

  
  const chooseFiles = useCallback(
    (paths: string[]) => {
      const request = fileChooser;
      if (!request) return;

      setFileChooser(null);
      void client.setFiles(request.backendNodeId, paths, request.sessionId);
    },
    [client, fileChooser],
  );

  const cancelFileChooser = useCallback(() => {
    const request = fileChooser;
    if (!request) return;

    setFileChooser(null);
    void client.setFiles(request.backendNodeId, [], request.sessionId);
  }, [client, fileChooser]);

  
  
  useEffect(() => {
    if (!enabled) return;

    let cancelled = false;

    const refresh = async () => {
      if (client.activeSessionId === null) return;
      if (screenRef.current.width <= 0) return;

      const rect = await client.pageRect(screenRef.current.width);

      if (cancelled || !rect) return;

      setPageRect((current) => (sameRect(current, rect) ? current : rect));
    };

    const timer = window.setInterval(() => {
      void refresh();
    }, RECT_REFRESH_MS);

    void refresh();

    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [client, enabled, activeTabId, state]);

  return {
    client,
    tabs,
    activeTabId,
    pageRect,
    state,
    isConnected: state === "connected",
    screenSize,
    setScreenSize,
    sleep,
    fileChooser,
    chooseFiles,
    cancelFileChooser,
  };
}

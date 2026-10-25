import { useEffect, useRef, useState } from "react";

import ChromiumLoading from "./chromium_loading.tsx";
import {
  CHROMIUM_LOADING_FADE_MS,
  useChromiumLoading,
} from "./chromium_loading.ts";
import { ChromiumVnc } from "./chromium_vnc.ts";
import type { ChromiumBrowser } from "./chromium_window.ts";



type ChromiumWindowProps = {
  browser: ChromiumBrowser;
  
  isOpen: boolean;
};

export default function ChromiumWindow({ browser, isOpen }: ChromiumWindowProps) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const vncRef = useRef<ChromiumVnc | null>(null);
  const [isPictureReady, setIsPictureReady] = useState(false);
  
  const [hasBrowserShown, setHasBrowserShown] = useState(false);

  const { isConnected, pageRect, setScreenSize } = browser;

  useEffect(() => {
    if (isConnected) setHasBrowserShown(true);
  }, [isConnected]);

  
  
  
  useEffect(() => {
    if (!isOpen) return;

    const host = hostRef.current;
    if (!host) return;

    const vnc = new ChromiumVnc();
    vncRef.current = vnc;
    setIsPictureReady(false);

    void vnc.connect(host, {
      onReady: () => setIsPictureReady(true),
      onLost: () => setIsPictureReady(false),
      onScreenSize: setScreenSize,
    });

    return () => {
      vncRef.current = null;
      setIsPictureReady(false);
      vnc.dispose();
    };
  }, [isOpen, setScreenSize]);

  
  
  useEffect(() => {
    vncRef.current?.setPageRect(pageRect);
  }, [isPictureReady, pageRect]);

  const isLoading = useChromiumLoading({
    isOpen,
    isReady: isPictureReady && (isConnected || hasBrowserShown),
  });

  
  
  
  const [isLoadingShown, setIsLoadingShown] = useState(isLoading);
  const [isLoadingLeaving, setIsLoadingLeaving] = useState(false);

  useEffect(() => {
    if (isLoading) {
      setIsLoadingShown(true);
      setIsLoadingLeaving(false);
      return;
    }

    if (!isLoadingShown) return;

    setIsLoadingLeaving(true);

    const timer = window.setTimeout(() => {
      setIsLoadingShown(false);
      setIsLoadingLeaving(false);
    }, CHROMIUM_LOADING_FADE_MS);

    return () => window.clearTimeout(timer);
  }, [isLoading, isLoadingShown]);

  return (
    <div
      className="oc-chromium__screen"
      ref={hostRef}
      onPointerDown={() => vncRef.current?.focus()}
    >
      {isLoadingShown ? <ChromiumLoading leaving={isLoadingLeaving} /> : null}

      <style>{`
        .oc-chromium__screen {
          position: absolute;
          inset: 0;
          overflow: hidden;
          background: #0e0e0e;
          user-select: none;
          touch-action: none;
        }

        .oc-chromium__screen-host {
          position: absolute;
          inset: 0;
          overflow: hidden;
        }

        .oc-chromium__screen-host canvas {
          display: block;
          outline: none;
          image-rendering: auto;
        }
      `}</style>
    </div>
  );
}

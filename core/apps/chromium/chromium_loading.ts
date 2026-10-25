import { useEffect, useRef, useState } from "react";


export const CHROMIUM_LOADING_MINIMUM_MS = 3000;


export const CHROMIUM_LOADING_FADE_MS = 220;


const NOT_READY_GRACE_MS = 2000;

type ChromiumLoadingOptions = {
  
  isOpen: boolean;
  
  isReady: boolean;
  
  minimumMs?: number;
};


export function useChromiumLoading({
  isOpen,
  isReady,
  minimumMs = CHROMIUM_LOADING_MINIMUM_MS,
}: ChromiumLoadingOptions): boolean {
  const [isShowing, setIsShowing] = useState(isOpen);
  const [openedAt, setOpenedAt] = useState<number | null>(null);
  const openedAtRef = useRef<number | null>(null);

  
  
  useEffect(() => {
    if (!isOpen) {
      openedAtRef.current = null;
      setOpenedAt(null);
      setIsShowing(false);
      return;
    }

    if (openedAtRef.current !== null) return;

    openedAtRef.current = Date.now();
    setOpenedAt(openedAtRef.current);
    setIsShowing(true);
  }, [isOpen]);

  
  
  useEffect(() => {
    if (!isOpen || !isShowing || !isReady) return;

    const startedAt = openedAt ?? Date.now();
    const remaining = minimumMs - (Date.now() - startedAt);

    if (remaining <= 0) {
      setIsShowing(false);
      return;
    }

    const timer = window.setTimeout(() => {
      setIsShowing(false);
    }, remaining);

    return () => window.clearTimeout(timer);
  }, [isOpen, isReady, isShowing, minimumMs, openedAt]);

  
  
  useEffect(() => {
    if (!isOpen || isReady) return;

    const timer = window.setTimeout(() => {
      setIsShowing(true);
    }, NOT_READY_GRACE_MS);

    return () => window.clearTimeout(timer);
  }, [isOpen, isReady]);

  return isOpen && isShowing;
}

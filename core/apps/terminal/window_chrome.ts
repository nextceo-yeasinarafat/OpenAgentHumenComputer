import { useEffect, useRef, useState } from "react";

const REVEAL_ZONE_PX = 52;
const HIDE_DELAY_MS = 900;

let lastPointerY = Number.POSITIVE_INFINITY;

export function useWindowChromeAutoHide(isMaximized: boolean) {
  const [isChromeVisible, setIsChromeVisible] = useState(true);
  const hideTimer = useRef<number | null>(null);

  useEffect(() => {
    const clearHideTimer = () => {
      if (hideTimer.current !== null) {
        window.clearTimeout(hideTimer.current);
        hideTimer.current = null;
      }
    };

    const reveal = () => {
      clearHideTimer();
      setIsChromeVisible(true);
    };

    const scheduleHide = () => {
      if (hideTimer.current !== null) return;

      hideTimer.current = window.setTimeout(() => {
        hideTimer.current = null;
        setIsChromeVisible(false);
      }, HIDE_DELAY_MS);
    };

    const handleMouseMove = (event: MouseEvent) => {
      lastPointerY = event.clientY;

      if (!isMaximized) return;

      if (event.clientY <= REVEAL_ZONE_PX) {
        reveal();
        return;
      }

      scheduleHide();
    };

    
    
    
    window.addEventListener("mousemove", handleMouseMove, true);

    if (isMaximized) {
      if (lastPointerY <= REVEAL_ZONE_PX) {
        reveal();
      } else {
        scheduleHide();
      }
    } else {
      setIsChromeVisible(true);
    }

    return () => {
      window.removeEventListener("mousemove", handleMouseMove, true);
      clearHideTimer();
    };
  }, [isMaximized]);

  return isChromeVisible;
}

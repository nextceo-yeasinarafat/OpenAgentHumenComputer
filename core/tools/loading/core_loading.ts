import type { CSSProperties } from "react";
import { useEffect, useState } from "react";




export const LOADING_LOGO_URL = "/loading_logo/openhumen-computer.svg";


export const LOADING_HOLD_MS = 3000;


export const LOADING_FADE_MS = 600;


export type CoreLoading = {
  
  visible: boolean;
  
  leaving: boolean;
};


export function useCoreLoading(): CoreLoading {
  const [visible, setVisible] = useState(true);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    const hold = window.setTimeout(() => setLeaving(true), LOADING_HOLD_MS);
    const gone = window.setTimeout(
      () => setVisible(false),
      LOADING_HOLD_MS + LOADING_FADE_MS,
    );
    return () => {
      window.clearTimeout(hold);
      window.clearTimeout(gone);
    };
  }, []);

  return { visible, leaving };
}


export function loadingPageStyle(leaving: boolean): CSSProperties {
  return {
    position: "fixed",
    inset: 0,
    zIndex: 100,
    display: "grid",
    placeItems: "center",
    background: "#0E0E0E",
    opacity: leaving ? 0 : 1,
    transition: `opacity ${LOADING_FADE_MS}ms ease`,
    pointerEvents: leaving ? "none" : "auto",
  };
}


export function loadingLogoStyle(): CSSProperties {
  return {
    width: "min(30vmin, 160px)",
    height: "auto",
    userSelect: "none",
  };
}

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, type Transition } from "framer-motion";

import { DOCK_APPS, type DockAppId } from "./core_dock.ts";




const DOCK_HIDE_DELAY_MS = 260;


const DOCK_REVEAL_ZONE_PX = 12;


const DOCK_SPRING: Transition = {
  type: "spring",
  stiffness: 620,
  damping: 34,
  mass: 0.6,
};


const DOCK_SHELL_MOTION = {
  initial: { opacity: 0, y: 140 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 140 },
  transition: {
    type: "spring",
    stiffness: 360,
    damping: 34,
    mass: 0.8,
  } satisfies Transition,
};


const DOCK_ITEM_MOTION = {
  whileHover: { y: -12, scale: 1.22 },
  whileTap: { y: -6, scale: 1.06 },
  transition: DOCK_SPRING,
};


const DOCK_LABEL_MOTION = {
  initial: { opacity: 0, x: "-50%", scale: 0.94 },
  animate: { opacity: 1, x: "-50%", scale: 1 },
  exit: { opacity: 0, x: "-50%", scale: 0.96 },
  transition: {
    type: "spring",
    stiffness: 540,
    damping: 34,
    mass: 0.6,
  } satisfies Transition,
};


const DOCK_DOT_MOTION = {
  initial: { opacity: 0, x: "-50%", scale: 0.4 },
  animate: { opacity: 1, x: "-50%", scale: 1 },
  exit: { opacity: 0, x: "-50%", scale: 0.4 },
  transition: DOCK_SPRING,
};


const dockRule = `
  .oc-dock-shell {
    position: fixed;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 60;
    display: flex;
    justify-content: center;
    padding-bottom: 14px;
    pointer-events: none;
  }

  .oc-dock {
    position: relative;
    display: flex;
    align-items: center;
    padding: 7px;
    border: 1px solid rgba(255, 255, 255, 0.18);
    border-radius: 30px;
    background: linear-gradient(
      180deg,
      rgba(255, 255, 255, 0.09),
      rgba(255, 255, 255, 0.02) 55%,
      rgba(255, 255, 255, 0.045)
    );
    box-shadow:
      0 12px 38px rgba(0, 0, 0, 0.16),
      inset 0 1px 0 rgba(255, 255, 255, 0.22),
      inset 0 -1px 0 rgba(255, 255, 255, 0.06),
      inset 0 0 24px rgba(255, 255, 255, 0.025);
    backdrop-filter: blur(8px) saturate(155%) brightness(1.04);
    -webkit-backdrop-filter: blur(8px) saturate(155%) brightness(1.04);
    pointer-events: auto;
  }

  .oc-dock::before {
    content: "";
    position: absolute;
    inset: 0;
    z-index: 0;
    border-radius: inherit;
    background: radial-gradient(
      120% 100% at 50% -20%,
      rgba(255, 255, 255, 0.12),
      transparent 60%
    );
    pointer-events: none;
  }

  .oc-dock__items {
    position: relative;
    z-index: 1;
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .oc-dock__item-wrap {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: default;
  }

  .oc-dock__item {
    position: relative;
    display: grid;
    place-items: center;
    width: 72px;
    height: 72px;
    padding: 0;
    border: 0;
    border-radius: 18px;
    background: transparent;
    cursor: default;
    outline: none;
    user-select: none;
    transform-origin: 50% 100%;
    -webkit-tap-highlight-color: transparent;
  }

  .oc-dock__icon {
    display: grid;
    place-items: center;
    width: 64px;
    height: 64px;
  }

  .oc-dock__icon-image {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: contain;
    user-select: none;
    -webkit-user-drag: none;
  }.oc-dock__label {
    position: absolute;
    bottom: calc(100% + 26px);
    left: 50%;
    z-index: 3;
    padding: 4px 9px;
    border: 1px solid rgba(255, 255, 255, 0.18);
    border-radius: 8px;
    background: linear-gradient(
      180deg,
      rgba(255, 255, 255, 0.14),
      rgba(255, 255, 255, 0.04) 55%,
      rgba(255, 255, 255, 0.07)
    );
    box-shadow:
      inset 0 1px 0 rgba(255, 255, 255, 0.22),
      inset 0 -1px 0 rgba(255, 255, 255, 0.06);
    color: rgba(255, 255, 255, 0.92);
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    font-size: 11.5px;
    font-weight: 500;
    line-height: 1;
    letter-spacing: 0.01em;
    white-space: nowrap;
    pointer-events: none;
    backdrop-filter: blur(18px) saturate(160%) brightness(1.04);
    -webkit-backdrop-filter: blur(18px) saturate(160%) brightness(1.04);
  }.oc-dock__running-dot {
    position: absolute;
    bottom: 3px;
    left: 50%;
    z-index: 2;
    width: 4px;
    height: 4px;
    border-radius: 999px;
    background: #ff453a;
    box-shadow: 0 0 8px rgba(255, 69, 58, 0.6);
    pointer-events: none;
    transition:
      background 160ms ease,
      box-shadow 160ms ease;
  }

  .oc-dock__running-dot--minimized {
    background: rgba(255, 255, 255, 0.92);
    box-shadow: 0 0 8px rgba(255, 255, 255, 0.5);
  }

  .oc-dock-trigger {
    position: fixed;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 61;
    height: ${DOCK_REVEAL_ZONE_PX}px;
    pointer-events: auto;
  }

  @media (max-width: 640px) {
    .oc-dock-shell {
      padding-bottom: 10px;
    }

    .oc-dock {
      padding: 5px;
      border-radius: 22px;
    }

    .oc-dock__item {
      width: 54px;
      height: 54px;
      border-radius: 14px;
    }

    .oc-dock__icon {
      width: 48px;
      height: 48px;
    }
  }
`;

export default function CoreDock({
  onOpenApp,
  runningAppIds = [],
  minimizedAppIds = [],
  autoHide = false,
}: {
  onOpenApp?: (id: DockAppId) => void;
  runningAppIds?: string[];
  minimizedAppIds?: string[];
  
  autoHide?: boolean;
}) {
  const [hoveredId, setHoveredId] = useState<DockAppId | null>(null);
  const [isVisible, setIsVisible] = useState(true);
  const hideTimer = useRef<number | null>(null);
  const hoveringDock = useRef(false);
  const hoveringTrigger = useRef(false);

  const clearHideTimer = useCallback(() => {
    if (hideTimer.current === null) return;
    window.clearTimeout(hideTimer.current);
    hideTimer.current = null;
  }, []);

  const show = useCallback(() => {
    clearHideTimer();
    setIsVisible(true);
  }, [clearHideTimer]);

  const hide = useCallback(() => {
    if (!autoHide) return;

    clearHideTimer();
    hideTimer.current = window.setTimeout(() => {
      hideTimer.current = null;
      setIsVisible(false);
    }, DOCK_HIDE_DELAY_MS);
  }, [autoHide, clearHideTimer]);

  
  
  useEffect(() => {
    if (!autoHide) {
      show();
      return;
    }

    if (hoveringDock.current || hoveringTrigger.current) return;
    hide();
  }, [autoHide, show, hide]);

  useEffect(() => clearHideTimer, [clearHideTimer]);

  const enterDock = useCallback(() => {
    hoveringDock.current = true;
    show();
  }, [show]);

  const leaveDock = useCallback(() => {
    hoveringDock.current = false;
    if (!hoveringTrigger.current) hide();
  }, [hide]);

  const enterTrigger = useCallback(() => {
    hoveringTrigger.current = true;
    show();
  }, [show]);

  const leaveTrigger = useCallback(() => {
    hoveringTrigger.current = false;
    if (!hoveringDock.current) hide();
  }, [hide]);

  return (
    <>
      <style>{dockRule}</style>
      {autoHide ? (
        <div
          className="oc-dock-trigger"
          aria-hidden="true"
          onMouseEnter={enterTrigger}
          onMouseLeave={leaveTrigger}
        />
      ) : null}
      <AnimatePresence>
        {isVisible ? (
          <motion.div
            className="oc-dock-shell"
            {...DOCK_SHELL_MOTION}
            onMouseEnter={enterDock}
            onMouseLeave={leaveDock}
          >
            <nav className="oc-dock" aria-label="Dock">
              <div className="oc-dock__items">
                {DOCK_APPS.map((app) => {
                  const isRunning = runningAppIds.includes(app.id);
                  const isMinimized = minimizedAppIds.includes(app.id);

                  return (
                    <div key={app.id} className="oc-dock__item-wrap">
                      <motion.button
                        type="button"
                        className="oc-dock__item"
                        title={app.label}
                        aria-label={app.label}
                        onClick={() => {
                          setHoveredId(null);
                          onOpenApp?.(app.id);
                        }}
                        onMouseEnter={() => setHoveredId(app.id)}
                        onMouseLeave={() => setHoveredId(null)}
                        onFocus={() => setHoveredId(app.id)}
                        onBlur={() => setHoveredId(null)}
                        {...DOCK_ITEM_MOTION}
                      >
                        <span className="oc-dock__icon">
                          <img
                            className="oc-dock__icon-image"
                            src={app.icon}
                            alt=""
                            draggable={false}
                          />
                        </span>

                        <AnimatePresence>
                          {isRunning ? (
                            <motion.span
                              key="dot"
                              className={
                                isMinimized
                                  ? "oc-dock__running-dot oc-dock__running-dot--minimized"
                                  : "oc-dock__running-dot"
                              }
                              aria-hidden="true"
                              {...DOCK_DOT_MOTION}
                            />
                          ) : null}
                        </AnimatePresence>
                      </motion.button>

                      <AnimatePresence>
                        {hoveredId === app.id ? (
                          <motion.span className="oc-dock__label" {...DOCK_LABEL_MOTION}>
                            {app.label}
                          </motion.span>
                        ) : null}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            </nav>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}

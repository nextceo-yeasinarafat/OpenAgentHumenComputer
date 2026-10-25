import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";

import VscodeStream from "./vscode_stream.tsx";
import type { ComputerVscodeController } from "./computer_vscode.ts";



type ComputerVscodeProps = {
  controller: ComputerVscodeController;
  zIndex?: number;
  onActivate?: () => void;
  onClose?: () => void;
  onMinimize?: () => void;
};

export default function ComputerVscode({
  controller,
  zIndex,
  onActivate,
  onClose,
  onMinimize,
}: ComputerVscodeProps) {
  const {
    isOpen,
    isMinimized,
    isMaximized,
    isMinimizing,
    isClosing,
    position,
    size,
    isDragging,
    isResizing,
    close,
    minimize,
    toggleMaximize,
    dragHandlers,
    resizeHandlers,
  } = controller;

  
  
  
  
  
  const [isBarShown, setIsBarShown] = useState(true);
  const hideTimer = useRef<number | null>(null);

  const cancelHide = useCallback(() => {
    if (hideTimer.current !== null) {
      window.clearTimeout(hideTimer.current);
      hideTimer.current = null;
    }
  }, []);

  const showBar = useCallback(() => {
    cancelHide();
    setIsBarShown(true);
  }, [cancelHide]);

  const scheduleHide = useCallback(() => {
    if (!isMaximized) return;

    cancelHide();
    hideTimer.current = window.setTimeout(() => {
      hideTimer.current = null;
      setIsBarShown(false);
    }, 320);
  }, [cancelHide, isMaximized]);

  
  useEffect(() => {
    if (isMaximized) return;
    cancelHide();
    setIsBarShown(true);
  }, [cancelHide, isMaximized]);

  useEffect(() => cancelHide, [cancelHide]);

  if (!isOpen) return null;

  const isBarHidden = isMaximized && !isBarShown;

  const className = [
    "oc-vscode",
    isMaximized ? "oc-vscode--maximized" : "",
    isBarHidden ? "oc-vscode--bar-hidden" : "",
    isMinimized ? "oc-vscode--minimized" : "",
    isDragging ? "oc-vscode--dragging" : "",
    isResizing ? "oc-vscode--resizing" : "",
    isMinimizing ? "oc-vscode--minimizing" : "",
    isClosing ? "oc-vscode--closing" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <>
      <style>{`
        .oc-vscode {
          position: fixed;
          z-index: 50;
          display: flex;
          flex-direction: column;
          min-width: 560px;
          min-height: 360px;
          max-width: calc(100vw - 32px);
          max-height: calc(100vh - 128px);
          box-sizing: border-box;
          overflow: hidden;
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 10px;
          background: #0e0e0e;
          box-shadow:
            0 30px 80px rgba(0, 0, 0, 0.55),
            0 2px 8px rgba(0, 0, 0, 0.35),
            inset 0 1px 0 rgba(255, 255, 255, 0.06);
          color: #ffffff;
          font-family:
            -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
          text-rendering: optimizeLegibility;
          will-change: transform, opacity;
          animation: oc-vscode-open 200ms cubic-bezier(0.2, 0.8, 0.2, 1);
        }

        .oc-vscode--maximized {
          inset: 0;
          width: auto;
          height: auto;
          min-width: 0;
          min-height: 0;
          max-width: none;
          max-height: none;
          border: 0;
          border-radius: 0;
        }

        .oc-vscode--minimized {
          visibility: hidden;
          pointer-events: none;
        }

        .oc-vscode--minimizing {
          transform-origin: 50% 100%;
          pointer-events: none;
          animation: oc-vscode-minimize 240ms cubic-bezier(0.4, 0, 0.6, 1)
            forwards;
        }

        .oc-vscode--closing {
          pointer-events: none;
          animation: oc-vscode-close 200ms cubic-bezier(0.4, 0, 0.2, 1)
            forwards;
        }

        @keyframes oc-vscode-open {
          from {
            opacity: 0;
            transform: translateY(8px) scale(0.96);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @keyframes oc-vscode-minimize {
          from {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
          to {
            opacity: 0;
            transform: translateY(45vh) scale(0.08);
          }
        }

        @keyframes oc-vscode-close {
          from {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
          to {
            opacity: 0;
            transform: translateY(10px) scale(0.92);
          }
        }

        .oc-vscode__header {
          position: relative;
          display: flex;
          flex: 0 0 auto;
          align-items: center;
          height: 38px;
          padding: 0 12px;
          box-sizing: border-box;
          border-bottom: 0.5px solid rgba(255, 255, 255, 0.06);
          transition: border-bottom-color 240ms ease;
          background: #0e0e0e;
          cursor: default;
          touch-action: none;
          user-select: none;
          overflow: hidden;
        }

        .oc-vscode--bar-hidden .oc-vscode__header {
          border-bottom-color: transparent;
        }

        .oc-vscode__hot-zone {
          position: absolute;
          top: 0;
          right: 0;
          left: 0;
          z-index: 6;
          height: 10px;
        }

        .oc-vscode__traffic {
          display: flex;
          flex: 0 0 auto;
          align-items: center;
          gap: 8px;
          padding: 0;
          border: 0;
          border-radius: 0;
          background: none;
          box-shadow: none;
          backdrop-filter: none;
          -webkit-backdrop-filter: none;
        }

        .oc-vscode__light {
          display: grid;
          place-items: center;
          width: 13px;
          height: 13px;
          padding: 0;
          border: 0;
          border-radius: 50%;
          appearance: none;
          box-shadow: none;
          color: rgba(0, 0, 0, 0.8);
          font-size: 9.5px;
          font-weight: 700;
          line-height: 1;
          cursor: default;
          transition: filter 120ms ease;
        }

        .oc-vscode__light:hover {
          filter: brightness(1.1);
        }

        .oc-vscode__light-glyph {
          opacity: 0;
          transition: opacity 120ms ease;
        }

        .oc-vscode__light:hover .oc-vscode__light-glyph,
        .oc-vscode__light:focus-visible .oc-vscode__light-glyph {
          opacity: 1;
        }

        .oc-vscode__light--close {
          background: #ff5f57;
        }

        .oc-vscode__light--minimize {
          background: #febc2e;
        }

        .oc-vscode__light--maximize {
          background: #28c840;
        }

        .oc-vscode__title {
          position: absolute;
          left: 50%;
          max-width: calc(100% - 220px);
          overflow: hidden;
          color: rgba(255, 255, 255, 0.68);
          font-size: 12px;
          font-weight: 500;
          letter-spacing: -0.006em;
          line-height: 1;
          text-overflow: ellipsis;
          white-space: nowrap;
          transform: translateX(-50%);
          pointer-events: none;
        }

        .oc-vscode__body {
          position: relative;
          flex: 1 1 auto;
          min-height: 0;
          background: #0e0e0e;
        }

        .oc-vscode__resize-handle {
          position: absolute;
          right: 0;
          bottom: 0;
          z-index: 2;
          width: 18px;
          height: 18px;
          cursor: nwse-resize;
          touch-action: none;
        }

        @media (max-width: 640px) {
          .oc-vscode {
            min-width: 0;
            min-height: 0;
          }
        }
      `}</style>

      <section
        className={className}
        style={
          isMaximized
            ? { zIndex }
            : {
                left: position.x,
                top: position.y,
                width: size.width,
                height: size.height,
                zIndex,
              }
        }
        aria-label="VS Code window"
        aria-hidden={isMinimized || undefined}
        onPointerDown={onActivate}
      >
        {isBarHidden ? (
          <div
            className="oc-vscode__hot-zone"
            aria-hidden="true"
            onPointerEnter={showBar}
          />
        ) : null}

        <motion.header
          className="oc-vscode__header"
          {...dragHandlers}
          onPointerEnter={showBar}
          onPointerLeave={scheduleHide}
          initial={false}
          animate={
            isBarHidden ? { height: 0, opacity: 0 } : { height: 38, opacity: 1 }
          }
          transition={{ duration: 0.24, ease: [0.32, 0.72, 0, 1] }}
        >
          <div
            className="oc-vscode__traffic"
            role="group"
            aria-label="Window controls"
          >
            <button
              type="button"
              className="oc-vscode__light oc-vscode__light--close"
              aria-label="Close VS Code window"
              title="Close"
              onClick={onClose ?? close}
            >
              <span className="oc-vscode__light-glyph" aria-hidden="true">
                ×
              </span>
            </button>
            <button
              type="button"
              className="oc-vscode__light oc-vscode__light--minimize"
              aria-label="Minimize VS Code window"
              title="Minimize"
              onClick={onMinimize ?? minimize}
            >
              <span className="oc-vscode__light-glyph" aria-hidden="true">
                −
              </span>
            </button>
            <button
              type="button"
              className="oc-vscode__light oc-vscode__light--maximize"
              aria-label={
                isMaximized
                  ? "Restore VS Code window"
                  : "Maximize VS Code window"
              }
              title={isMaximized ? "Restore" : "Maximize"}
              onClick={toggleMaximize}
            >
              <span className="oc-vscode__light-glyph" aria-hidden="true">
                +
              </span>
            </button>
          </div>

          <span className="oc-vscode__title">VS Code</span>
        </motion.header>

        <div className="oc-vscode__body" aria-label="VS Code content">
          {!isMinimized && !isMinimizing && !isClosing ? (
            <VscodeStream onActivate={onActivate} />
          ) : null}
        </div>

        {!isMaximized && (
          <div
            className="oc-vscode__resize-handle"
            aria-hidden="true"
            {...resizeHandlers}
          />
        )}
      </section>
    </>
  );
}

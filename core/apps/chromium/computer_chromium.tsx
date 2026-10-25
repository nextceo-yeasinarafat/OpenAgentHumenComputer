import { useCallback, useEffect, useRef, useState } from "react";

import type { ComputerChromiumController } from "./computer_chromium.ts";
import ChromiumWindow from "./chromium_window.tsx";
import { useChromiumWindow } from "./chromium_window.ts";
import ChromiumFilePicker from "./chromium_filepicker.tsx";



type ComputerChromiumProps = {
  controller: ComputerChromiumController;
  zIndex?: number;
  onActivate?: () => void;
};

export default function ComputerChromium({
  controller,
  zIndex,
  onActivate,
}: ComputerChromiumProps) {
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
    setScreenAspect,
    dragHandlers,
    resizeHandlers,
  } = controller;

  const browser = useChromiumWindow(isOpen);
  const { sleep } = browser;

  
  
  
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

  
  
  
  
  const closeWindow = useCallback(() => {
    sleep();
    close();
  }, [close, sleep]);

  
  
  useEffect(() => {
    setScreenAspect(browser.screenSize.width, browser.screenSize.height);
  }, [browser.screenSize.height, browser.screenSize.width, setScreenAspect]);

  if (!isOpen) return null;

  const className = [
    "oc-chromium",
    isMaximized ? "oc-chromium--maximized" : "",
    isMaximized && !isBarShown ? "oc-chromium--bar-hidden" : "",
    isMinimized ? "oc-chromium--minimized" : "",
    isDragging ? "oc-chromium--dragging" : "",
    isResizing ? "oc-chromium--resizing" : "",
    isMinimizing ? "oc-chromium--minimizing" : "",
    isClosing ? "oc-chromium--closing" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <>
      <style>{`
        .oc-chromium {
          position: fixed;
          z-index: 50;
          display: flex;
          flex-direction: column;
          min-width: 520px;
          min-height: 340px;
          max-width: calc(100vw - 32px);
          max-height: calc(100vh - 128px);
          box-sizing: border-box;
          overflow: hidden;
          border: 0.5px solid rgba(255, 255, 255, 0.18);
          border-radius: 12px;background: rgba(18, 18, 20, 0.52);
          box-shadow:
            0 40px 120px rgba(0, 0, 0, 0.58),
            0 2px 10px rgba(0, 0, 0, 0.32),
            inset 0 1px 0 rgba(255, 255, 255, 0.16),
            inset 0 -1px 0 rgba(255, 255, 255, 0.04);
          color: #fff;
          font-family:
            -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
          text-rendering: optimizeLegibility;
          user-select: none;
          backdrop-filter: blur(28px) saturate(180%);
          -webkit-backdrop-filter: blur(28px) saturate(180%);
          will-change: transform, opacity;
          animation: oc-chromium-open 200ms cubic-bezier(0.2, 0.8, 0.2, 1);transition:
            left 260ms cubic-bezier(0.32, 0.72, 0, 1),
            top 260ms cubic-bezier(0.32, 0.72, 0, 1),
            width 260ms cubic-bezier(0.32, 0.72, 0, 1),
            height 260ms cubic-bezier(0.32, 0.72, 0, 1),
            border-radius 220ms ease;
        }

        .oc-chromium--maximized {
          min-width: 0;
          min-height: 0;
          max-width: none;
          max-height: none;
          border: 0;
          border-radius: 0;
        }

        .oc-chromium--minimized {
          visibility: hidden;
          pointer-events: none;
        }

        .oc-chromium--minimizing {
          transform-origin: 50% 100%;
          pointer-events: none;
          animation: oc-chromium-minimize 240ms cubic-bezier(0.4, 0, 0.6, 1)
            forwards;
        }

        .oc-chromium--closing {
          pointer-events: none;
          animation: oc-chromium-close 200ms cubic-bezier(0.4, 0, 0.2, 1)
            forwards;
        }

        .oc-chromium--dragging,
        .oc-chromium--resizing {
          transition: none;
        }

        @keyframes oc-chromium-open {
          from {
            opacity: 0;
            transform: translateY(8px) scale(0.96);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @keyframes oc-chromium-minimize {
          from {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
          to {
            opacity: 0;
            transform: translateY(45vh) scale(0.08);
          }
        }

        @keyframes oc-chromium-close {
          from {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
          to {
            opacity: 0;
            transform: translateY(10px) scale(0.92);
          }
        }

        .oc-chromium__bar {
          position: relative;
          z-index: 3;
          display: flex;
          flex: 0 0 44px;
          align-items: center;
          gap: 12px;
          height: 44px;
          padding: 0 14px;
          overflow: hidden;
          border-bottom: 0.5px solid rgba(255, 255, 255, 0.08);background: #0e0e0e;
          cursor: default;
          touch-action: none;transition:
            height 240ms cubic-bezier(0.32, 0.72, 0, 1),
            flex-basis 240ms cubic-bezier(0.32, 0.72, 0, 1),
            padding 240ms cubic-bezier(0.32, 0.72, 0, 1),
            opacity 180ms ease,
            border-bottom-width 240ms ease,
            border-bottom-color 240ms ease;
        }.oc-chromium--bar-hidden .oc-chromium__bar {
          height: 0;
          flex-basis: 0;
          padding-top: 0;
          padding-bottom: 0;
          border-bottom-width: 0;
          border-bottom-color: transparent;
          opacity: 0;
          pointer-events: none;
        }

        .oc-chromium__hot-zone {
          position: absolute;
          top: 0;
          right: 0;
          left: 0;
          z-index: 6;
          height: 10px;
        }

        .oc-chromium__traffic {
          position: relative;
          z-index: 1;
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

        .oc-chromium__light {
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

        .oc-chromium__light:hover {
          filter: brightness(1.1);
        }

        .oc-chromium__light-glyph {
          opacity: 0;
          transition: opacity 120ms ease;
        }

        .oc-chromium__light:hover .oc-chromium__light-glyph,
        .oc-chromium__light:focus-visible .oc-chromium__light-glyph {
          opacity: 1;
        }

        .oc-chromium__light--close {
          background: #ff5f57;
        }

        .oc-chromium__light--minimize {
          background: #febc2e;
        }

        .oc-chromium__light--maximize {
          background: #28c840;
        }

        .oc-chromium__body {
          position: relative;
          flex: 1 1 auto;
          min-height: 0;
          background: #0e0e0e;
        }

        .oc-chromium__resize-handle {
          position: absolute;
          right: 0;
          bottom: 0;
          z-index: 4;
          width: 18px;
          height: 18px;
          cursor: nwse-resize;
          touch-action: none;
        }

        @media (max-width: 640px) {
          .oc-chromium {
            min-width: 0;
            min-height: 0;
          }
        }
      `}</style>

      <section
        className={className}
        style={
          isMaximized
            ? { left: 0, top: 0, width: "100vw", height: "100vh", zIndex }
            : {
                left: position.x,
                top: position.y,
                width: size.width,
                height: size.height,
                zIndex,
              }
        }
        aria-label="Chromium window"
        aria-hidden={isMinimized || undefined}
        onPointerDown={onActivate}
      >
        {isMaximized && !isBarShown ? (
          <div
            className="oc-chromium__hot-zone"
            aria-hidden="true"
            onPointerEnter={showBar}
          />
        ) : null}

        <header
          className="oc-chromium__bar"
          {...dragHandlers}
          onPointerEnter={showBar}
          onPointerLeave={scheduleHide}
        >
          <div
            className="oc-chromium__traffic"
            role="group"
            aria-label="Window controls"
          >
            <button
              type="button"
              className="oc-chromium__light oc-chromium__light--close"
              aria-label="Close Chromium window"
              title="Close"
              onClick={closeWindow}
            >
              <span className="oc-chromium__light-glyph" aria-hidden="true">
                ×
              </span>
            </button>
            <button
              type="button"
              className="oc-chromium__light oc-chromium__light--minimize"
              aria-label="Minimize Chromium window"
              title="Minimize"
              onClick={minimize}
            >
              <span className="oc-chromium__light-glyph" aria-hidden="true">
                −
              </span>
            </button>
            <button
              type="button"
              className="oc-chromium__light oc-chromium__light--maximize"
              aria-label={
                isMaximized
                  ? "Restore Chromium window"
                  : "Maximize Chromium window"
              }
              title={isMaximized ? "Restore" : "Maximize"}
              onClick={toggleMaximize}
            >
              <span className="oc-chromium__light-glyph" aria-hidden="true">
                +
              </span>
            </button>
          </div>
        </header>

        <div className="oc-chromium__body">
          <ChromiumWindow browser={browser} isOpen={isOpen} />

          {}
          {browser.fileChooser ? (
            <ChromiumFilePicker
              mode={browser.fileChooser.mode}
              onCancel={browser.cancelFileChooser}
              onChoose={browser.chooseFiles}
            />
          ) : null}
        </div>

        {!isMaximized && (
          <div
            className="oc-chromium__resize-handle"
            aria-hidden="true"
            {...resizeHandlers}
          />
        )}
      </section>
    </>
  );
}

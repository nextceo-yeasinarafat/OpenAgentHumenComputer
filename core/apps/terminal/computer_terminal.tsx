import { useCallback, useEffect, useRef, type KeyboardEvent } from "react";

import { useWindowChromeAutoHide } from "./window_chrome.ts";
import type { ComputerTerminalController } from "./computer_terminal.ts";
import { quoteTerminalPath } from "./terminal_content.ts";
import TerminalContent from "./terminal_content.tsx";
import {
  terminalTabTitleForPath,
  useTerminalTabs,
} from "./terminal_tabs.ts";
import TerminalTabs from "./terminal_tabs.tsx";



type ComputerTerminalProps = {
  controller: ComputerTerminalController;
  zIndex?: number;
  onActivate?: () => void;
};

export default function ComputerTerminal({
  controller,
  zIndex,
  onActivate,
}: ComputerTerminalProps) {
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
    pendingFolder,
    finishOpenAt,
    close,
    minimize,
    toggleMaximize,
    dragHandlers,
    resizeHandlers,
  } = controller;

  const {
    tabs,
    activeTabId,
    addTab,
    closeTab,
    selectTab,
    resetTabs,
    updateTabCwd,
    home,
  } = useTerminalTabs();
  const wasOpenRef = useRef(false);
  const isChromeVisible = useWindowChromeAutoHide(isMaximized);

  
  useEffect(() => {
    if (!isOpen && wasOpenRef.current) {
      resetTabs();
    }
    wasOpenRef.current = isOpen;
  }, [isOpen, resetTabs]);

  
  
  
  useEffect(() => {
    if (!pendingFolder) return;

    addTab(
      terminalTabTitleForPath(pendingFolder, home.current),
      `cd -- ${quoteTerminalPath(pendingFolder)}`,
    );
    finishOpenAt();
  }, [addTab, finishOpenAt, pendingFolder]);

  
  const handleTabCwd = useCallback(
    (tabId: string, path: string) => {
      updateTabCwd(tabId, path);
    },
    [updateTabCwd],
  );

  const handleCloseTab = useCallback(
    (id: string) => {
      if (tabs.length <= 1) {
        close();
        return;
      }

      closeTab(id);
    },
    [close, closeTab, tabs.length],
  );

  const handleKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (!(event.metaKey || event.ctrlKey)) return;

    const key = event.key.toLowerCase();
    if (key === "t") {
      event.preventDefault();
      addTab();
    } else if (key === "w") {
      event.preventDefault();
      handleCloseTab(activeTabId);
    }
  };

  if (!isOpen) return null;

  const className = [
    "oc-terminal",
    isMaximized ? "oc-terminal--maximized" : "",
    isMaximized && !isChromeVisible ? "oc-terminal--chrome-hidden" : "",
    isMinimized ? "oc-terminal--minimized" : "",
    isDragging ? "oc-terminal--dragging" : "",
    isResizing ? "oc-terminal--resizing" : "",
    isMinimizing ? "oc-terminal--minimizing" : "",
    isClosing ? "oc-terminal--closing" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <>
      <style>{`
        .oc-terminal {
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
          border: 1px solid rgba(255, 255, 255, 0.14);
          border-radius: 12px;
          background: #0e0e0e;
          box-shadow:
            0 30px 80px rgba(0, 0, 0, 0.55),
            0 2px 8px rgba(0, 0, 0, 0.35),
            inset 0 1px 0 rgba(255, 255, 255, 0.08);
          color: #fff;
          font-family:
            -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
          text-rendering: optimizeLegibility;
          will-change: transform, opacity;
          animation: oc-terminal-open 200ms cubic-bezier(0.2, 0.8, 0.2, 1);
        }

        .oc-terminal--maximized {
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

        .oc-terminal--minimized {
          visibility: hidden;
          pointer-events: none;
        }

        .oc-terminal--minimizing {
          transform-origin: 50% 100%;
          pointer-events: none;
          animation: oc-terminal-minimize 240ms cubic-bezier(0.4, 0, 0.6, 1)
            forwards;
        }

        .oc-terminal--closing {
          pointer-events: none;
          animation: oc-terminal-close 200ms cubic-bezier(0.4, 0, 0.2, 1)
            forwards;
        }

        @keyframes oc-terminal-open {
          from {
            opacity: 0;
            transform: translateY(8px) scale(0.96);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @keyframes oc-terminal-minimize {
          from {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
          to {
            opacity: 0;
            transform: translateY(45vh) scale(0.08);
          }
        }

        @keyframes oc-terminal-close {
          from {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
          to {
            opacity: 0;
            transform: translateY(10px) scale(0.92);
          }
        }

        .oc-terminal__header {
          position: relative;
          display: flex;
          flex: 0 0 44px;
          align-items: center;
          gap: 12px;
          height: 44px;
          padding: 0 12px;
          border-bottom: 0.5px solid rgba(255, 255, 255, 0.06);
          background: #0e0e0e;
          cursor: default;
          touch-action: none;
          user-select: none;
          transition:
            flex-basis 220ms cubic-bezier(0.4, 0, 0.2, 1),
            height 220ms cubic-bezier(0.4, 0, 0.2, 1),
            opacity 180ms ease;
        }

        .oc-terminal--chrome-hidden .oc-terminal__header {
          flex-basis: 0;
          height: 0;
          padding: 0;
          border-bottom-width: 0;
          opacity: 0;
          overflow: hidden;
        }

        .oc-terminal__traffic {
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

        .oc-terminal__light {
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

        .oc-terminal__light:hover {
          filter: brightness(1.1);
        }

        .oc-terminal__light-glyph {
          opacity: 0;
          transition: opacity 120ms ease;
        }

        .oc-terminal__light:hover .oc-terminal__light-glyph,
        .oc-terminal__light:focus-visible .oc-terminal__light-glyph {
          opacity: 1;
        }

        .oc-terminal__light--close {
          background: #ff5f57;
        }

        .oc-terminal__light--minimize {
          background: #febc2e;
        }

        .oc-terminal__light--maximize {
          background: #28c840;
        }

        .oc-terminal__body {
          position: relative;
          flex: 1 1 auto;
          min-height: 0;
          background: #000000;
        }

        .oc-terminal__resize-handle {
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
          .oc-terminal {
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
        aria-label="Terminal window"
        aria-hidden={isMinimized || undefined}
        onPointerDown={onActivate}
        onKeyDown={handleKeyDown}
      >
        <header className="oc-terminal__header" {...dragHandlers}>
          <div
            className="oc-terminal__traffic"
            role="group"
            aria-label="Window controls"
          >
            <button
              type="button"
              className="oc-terminal__light oc-terminal__light--close"
              aria-label="Close Terminal window"
              title="Close"
              onClick={close}
            >
              <span className="oc-terminal__light-glyph" aria-hidden="true">
                ×
              </span>
            </button>
            <button
              type="button"
              className="oc-terminal__light oc-terminal__light--minimize"
              aria-label="Minimize Terminal window"
              title="Minimize"
              onClick={minimize}
            >
              <span className="oc-terminal__light-glyph" aria-hidden="true">
                −
              </span>
            </button>
            <button
              type="button"
              className="oc-terminal__light oc-terminal__light--maximize"
              aria-label={
                isMaximized
                  ? "Restore Terminal window"
                  : "Maximize Terminal window"
              }
              title={isMaximized ? "Restore" : "Maximize"}
              onClick={toggleMaximize}
            >
              <span className="oc-terminal__light-glyph" aria-hidden="true">
                +
              </span>
            </button>
          </div>

          <TerminalTabs
            tabs={tabs}
            activeTabId={activeTabId}
            onSelect={selectTab}
            onClose={handleCloseTab}
            onAdd={() => addTab()}
          />
        </header>

        <div className="oc-terminal__body" aria-label="Terminal content">
          <TerminalContent
            tabs={tabs}
            activeTabId={activeTabId}
            onTabCwd={handleTabCwd}
          />
        </div>

        {!isMaximized && (
          <div
            className="oc-terminal__resize-handle"
            aria-hidden="true"
            {...resizeHandlers}
          />
        )}
      </section>
    </>
  );
}
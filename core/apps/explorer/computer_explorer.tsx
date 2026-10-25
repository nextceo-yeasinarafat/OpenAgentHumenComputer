import { motion } from "framer-motion";
import { HugeiconsIcon } from "@hugeicons/react";
import ArrowLeft01Icon from "@hugeicons/core-free-icons/ArrowLeft01Icon";
import ArrowRight01Icon from "@hugeicons/core-free-icons/ArrowRight01Icon";

import type { ComputerExplorerController } from "./computer_explorer.ts";
import {
  EXPLORER_WINDOW_INSTANT,
  EXPLORER_WINDOW_SPRING,
  explorerWindowInitial,
  explorerWindowTarget,
} from "./computer_explorer.ts";
import ExplorerActions from "./explorer_actions.tsx";
import ExplorerFinder from "./explorer_finder.tsx";
import ExplorerFolders from "./explorer_folders.tsx";
import ExplorerHiddenShortcut from "./explorer_hidden.tsx";
import ExplorerStyleControl from "./explorer_style.tsx";



type ComputerExplorerProps = {
  controller: ComputerExplorerController;
  zIndex?: number;
  
  isActive?: boolean;
  onActivate?: () => void;
};

export default function ComputerExplorer({
  controller,
  zIndex,
  isActive = false,
  onActivate,
}: ComputerExplorerProps) {
  const {
    viewport,
    isOpen,
    isMinimized,
    isMaximized,
    isClosing,
    position,
    size,
    isDragging,
    isResizing,
    positionX,
    positionY,
    close,
    finishClose,
    minimize,
    toggleMaximize,
    dragHandlers,
    resizeHandlers,
    finder,
    style,
    folders,
    entries,
    hidden,
    actions,
    storage,
    openEntry,
  } = controller;

  if (!isOpen) return null;

  const target = explorerWindowTarget({
    isMaximized,
    isMinimized,
    isClosing,
    position,
    size,
    viewport,
  });

  const className = [
    "oc-finder",
    isMaximized ? "oc-finder--maximized" : "",
    isMinimized ? "oc-finder--minimized" : "",
    isDragging ? "oc-finder--dragging" : "",
    isResizing ? "oc-finder--resizing" : "",
    isClosing ? "oc-finder--closing" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <>
      <style>{`
        .oc-finder {
          position: fixed;
          top: 0;
          left: 0;
          display: flex;
          flex-direction: column;
          box-sizing: border-box;
          overflow: hidden;
          border: 0;
          border-radius: 18px;
          background: transparent;
          box-shadow:
            0 34px 90px rgba(0, 0, 0, 0.65),
            0 4px 18px rgba(0, 0, 0, 0.4);
          color: #fff;
          font-family:
            -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
          -webkit-font-smoothing: antialiased;
          user-select: none;
        }

        .oc-finder--maximized {
          border-radius: 0;
        }

        .oc-finder--minimized,
        .oc-finder--closing {
          pointer-events: none;
        }

        .oc-finder__shell {
          position: relative;
          z-index: 1;
          display: flex;
          flex: 1 1 auto;
          min-height: 0;
          box-sizing: border-box;
        }

        .oc-finder__main {
          position: relative;
          display: flex;
          flex: 1 1 auto;
          flex-direction: column;
          min-width: 0;
          min-height: 0;
          background: #0e0e0e;
        }

        .oc-finder__toolbar {
          display: flex;
          flex: 0 0 56px;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          height: 56px;
          box-sizing: border-box;
          padding: 0 16px;
          cursor: default;
          touch-action: none;
        }

        .oc-finder__toolbar-left,
        .oc-finder__toolbar-right {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .oc-finder__nav {
          display: flex;
          flex: 0 0 auto;
          align-items: center;
          gap: 2px;
          padding: 2px;
          border: 1px solid rgba(255, 255, 255, 0.18);
          border-radius: 12px;
          background: linear-gradient(
            180deg,
            rgba(255, 255, 255, 0.09),
            rgba(255, 255, 255, 0.02) 55%,
            rgba(255, 255, 255, 0.045)
          );
          box-shadow:
            0 10px 26px rgba(0, 0, 0, 0.16),
            inset 0 1px 0 rgba(255, 255, 255, 0.22);
          backdrop-filter: blur(8px) saturate(155%) brightness(1.04);
          -webkit-backdrop-filter: blur(8px) saturate(155%) brightness(1.04);
        }

        .oc-finder__nav-button {
          display: grid;
          place-items: center;
          width: 30px;
          height: 26px;
          padding: 0;
          border: 0;
          border-radius: 7px;
          background: transparent;
          color: rgba(255, 255, 255, 0.7);
          cursor: default;
          outline: none;
          transition:
            background 110ms ease,
            color 110ms ease;
        }

        .oc-finder__nav-button:hover:not(:disabled) {
          background: rgba(255, 255, 255, 0.1);
          color: #ffffff;
        }

        .oc-finder__nav-button:disabled {
          color: rgba(255, 255, 255, 0.25);
          opacity: 0.55;
        }

        .oc-finder__window-controls {
          position: absolute;
          top: 32px;
          left: 16px;
          z-index: 5;
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 4px 8px;
          border: 0;
          border-radius: 999px;
          background: linear-gradient(
            180deg,
            rgba(255, 255, 255, 0.09),
            rgba(255, 255, 255, 0.02) 55%,
            rgba(255, 255, 255, 0.045)
          );
          backdrop-filter: blur(8px) saturate(155%) brightness(1.04);
          -webkit-backdrop-filter: blur(8px) saturate(155%) brightness(1.04);
        }

        .oc-finder__light {
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
          transition:
            filter 120ms ease,
            transform 120ms ease;
        }

        .oc-finder__light:hover {
          filter: brightness(1.12);
        }

        .oc-finder__light:active {
          transform: scale(0.94);
        }

        .oc-finder__light-glyph {
          opacity: 0;
          transition: opacity 120ms ease;
        }

        .oc-finder__light:hover .oc-finder__light-glyph,
        .oc-finder__light:focus-visible .oc-finder__light-glyph {
          opacity: 1;
        }

        .oc-finder__light--close {
          background: #ff5f57;
        }

        .oc-finder__light--minimize {
          background: #febc2e;
        }

        .oc-finder__light--maximize {
          background: #28c840;
        }

        .oc-finder__resize-handle {
          position: absolute;
          right: 0;
          bottom: 0;
          z-index: 2;
          width: 18px;
          height: 18px;
          cursor: nwse-resize;
          touch-action: none;
        }

        @media (max-width: 760px) {
          .oc-finder__toolbar {
            gap: 8px;
            padding: 0 10px;
          }
        }
      `}</style>

      <motion.section
        className={className}
        style={{ zIndex, left: positionX, top: positionY }}
        initial={{ ...target, ...explorerWindowInitial }}
        animate={target}
        transition={
          isDragging || isResizing
            ? EXPLORER_WINDOW_INSTANT
            : EXPLORER_WINDOW_SPRING
        }
        onAnimationComplete={() => {
          if (isClosing) finishClose();
        }}
        aria-label="Explorer window"
        aria-hidden={isMinimized || undefined}
        onPointerDown={onActivate}
      >
        <div className="oc-finder__shell">
          <ExplorerFinder
            locations={finder.locations}
            activeLocationId={finder.activeLocationId}
            storage={storage.storage}
            isStorageLoading={storage.isLoading}
            onChooseLocation={finder.chooseLocation}
            dragHandlers={dragHandlers}
          />

          <div className="oc-finder__main">
            <div className="oc-finder__toolbar" {...dragHandlers}>
              <div className="oc-finder__toolbar-left">
                <div
                  className="oc-finder__nav"
                  role="group"
                  aria-label="Folder navigation"
                >
                  <button
                    type="button"
                    className="oc-finder__nav-button"
                    aria-label="Go back"
                    title="Back"
                    disabled={!finder.canGoBack}
                    onClick={finder.goBack}
                  >
                    <HugeiconsIcon
                      icon={ArrowLeft01Icon}
                      size={16}
                      strokeWidth={1.5}
                      aria-hidden="true"
                    />
                  </button>
                  <button
                    type="button"
                    className="oc-finder__nav-button"
                    aria-label="Go forward"
                    title="Forward"
                    disabled={!finder.canGoForward}
                    onClick={finder.goForward}
                  >
                    <HugeiconsIcon
                      icon={ArrowRight01Icon}
                      size={16}
                      strokeWidth={1.5}
                      aria-hidden="true"
                    />
                  </button>
                </div>
              </div>

              <div className="oc-finder__toolbar-right">
                <ExplorerStyleControl
                  viewMode={style.viewMode}
                  hoveredView={style.hoveredView}
                  onSelectView={style.selectView}
                  onHoverView={style.hoverView}
                />
              </div>
            </div>

            <ExplorerFolders
              entries={entries}
              isLoading={folders.isLoading}
              error={folders.error}
              viewMode={style.viewMode}
              cutPath={
                actions.clipboard?.mode === "cut"
                  ? actions.clipboard.entry.path
                  : null
              }
              onOpenEntry={openEntry}
              onContextMenu={actions.openMenu}
              onRetry={folders.refresh}
            />
          </div>
        </div>

        <div
          className="oc-finder__window-controls"
          role="group"
          aria-label="Window controls"
        >
          <button
            type="button"
            className="oc-finder__light oc-finder__light--close"
            aria-label="Close Explorer window"
            title="Close"
            onClick={close}
          >
            <span className="oc-finder__light-glyph" aria-hidden="true">
              ×
            </span>
          </button>
          <button
            type="button"
            className="oc-finder__light oc-finder__light--minimize"
            aria-label="Minimize Explorer window"
            title="Minimize"
            onClick={minimize}
          >
            <span className="oc-finder__light-glyph" aria-hidden="true">
              −
            </span>
          </button>
          <button
            type="button"
            className="oc-finder__light oc-finder__light--maximize"
            aria-label={
              isMaximized
                ? "Restore Explorer window"
                : "Maximize Explorer window"
            }
            title={isMaximized ? "Restore" : "Maximize"}
            onClick={toggleMaximize}
          >
            <span className="oc-finder__light-glyph" aria-hidden="true">
              +
            </span>
          </button>
        </div>

        {isMaximized ? null : (
          <div
            className="oc-finder__resize-handle"
            aria-hidden="true"
            {...resizeHandlers}
          />
        )}

        {}
        <ExplorerActions controller={actions} />

        {}
        <ExplorerHiddenShortcut
          enabled={!isMinimized && !isClosing && isActive}
          onToggle={hidden.toggleHidden}
        />
      </motion.section>
    </>
  );
}
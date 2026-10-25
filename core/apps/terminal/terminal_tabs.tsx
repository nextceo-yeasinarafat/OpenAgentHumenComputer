import type { KeyboardEvent } from "react";
import type { TerminalTab } from "./terminal_tabs.ts";



type TerminalTabsProps = {
  tabs: TerminalTab[];
  activeTabId: string;
  onSelect: (id: string) => void;
  onClose: (id: string) => void;
  onAdd: () => void;
};

export default function TerminalTabs({
  tabs,
  activeTabId,
  onSelect,
  onClose,
  onAdd,
}: TerminalTabsProps) {
  const handleTabKeyDown = (
    event: KeyboardEvent<HTMLDivElement>,
    id: string,
  ) => {
    if (event.key !== "Enter" && event.key !== " ") return;

    event.preventDefault();
    onSelect(id);
  };

  return (
    <div className="oc-terminal-tabs" role="tablist" aria-label="Terminal tabs">
      <div className="oc-terminal-tabs__scroll">
        {tabs.map((tab) => {
          const isActive = tab.id === activeTabId;

          return (
            <div
              key={tab.id}
              className={`oc-terminal-tab${isActive ? " oc-terminal-tab--active" : ""}`}
              role="tab"
              aria-selected={isActive}
              tabIndex={0}
              
              title={tab.path ?? tab.title}
              onClick={() => onSelect(tab.id)}
              onKeyDown={(event) => handleTabKeyDown(event, tab.id)}
            >
              <span className="oc-terminal-tab__title">{tab.title}</span>
              <button
                type="button"
                className="oc-terminal-tab__close"
                aria-label={`Close ${tab.title} tab`}
                title="Close tab"
                onClick={(event) => {
                  event.stopPropagation();
                  onClose(tab.id);
                }}
              >
                <span aria-hidden="true">×</span>
              </button>
            </div>
          );
        })}
      </div>

      <button
        type="button"
        className="oc-terminal-tabs__add"
        aria-label="New terminal tab"
        title="New tab"
        onClick={onAdd}
      >
        <span aria-hidden="true">+</span>
      </button>

      <style>{`
        .oc-terminal-tabs {
          display: flex;
          flex: 1 1 auto;
          align-items: center;
          gap: 6px;
          min-width: 0;
          height: 100%;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }

        .oc-terminal-tabs__scroll {
          display: flex;
          align-items: center;
          gap: 6px;
          min-width: 0;
          height: 100%;
          padding: 0 2px;
          overflow-x: auto;
          overflow-y: hidden;
          scrollbar-width: none;
          scroll-behavior: smooth;
          overscroll-behavior-x: contain;
        }

        .oc-terminal-tabs__scroll::-webkit-scrollbar {
          display: none;
        }.oc-terminal-tab {
          display: flex;
          flex: 0 0 auto;
          align-items: center;
          gap: 6px;
          max-width: 190px;
          height: 28px;
          padding: 0 6px 0 10px;
          border: 0.5px solid rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          background: linear-gradient(
            180deg,
            rgba(125, 211, 252, 0.16) 0%,
            rgba(56, 189, 248, 0.085) 42%,
            rgba(14, 165, 233, 0.03) 78%,
            rgba(14, 165, 233, 0.012) 100%
          );
          box-shadow: none;
          color: rgba(255, 255, 255, 0.62);
          cursor: default;
          outline: none;
          backdrop-filter: blur(10px) saturate(150%);
          -webkit-backdrop-filter: blur(10px) saturate(150%);
          transition:
            background 140ms ease,
            border-color 140ms ease,
            color 140ms ease;
        }

        .oc-terminal-tab:hover {
          border-color: rgba(255, 255, 255, 0.14);
          background: linear-gradient(
            180deg,
            rgba(125, 211, 252, 0.21) 0%,
            rgba(56, 189, 248, 0.11) 42%,
            rgba(14, 165, 233, 0.04) 78%,
            rgba(14, 165, 233, 0.016) 100%
          );
          color: rgba(255, 255, 255, 0.84);
        }

        .oc-terminal-tab:focus-visible {
          border-color: rgba(125, 211, 252, 0.5);
          outline: none;
        }

        .oc-terminal-tab.oc-terminal-tab--active {
          border-color: rgba(255, 255, 255, 0.16);
          background: linear-gradient(
            180deg,
            rgba(125, 211, 252, 0.26) 0%,
            rgba(56, 189, 248, 0.14) 42%,
            rgba(14, 165, 233, 0.05) 78%,
            rgba(14, 165, 233, 0.02) 100%
          );
          color: #fff;
        }

        .oc-terminal-tab__title {
          overflow: hidden;
          font-size: 12px;
          font-weight: 500;
          letter-spacing: 0.01em;
          line-height: 1;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .oc-terminal-tab__close {
          display: grid;
          place-items: center;
          width: 18px;
          height: 18px;
          padding: 0;
          border: 0;
          border-radius: 5px;
          background: transparent;
          color: rgba(255, 255, 255, 0.45);
          font-family: inherit;
          font-size: 14px;
          line-height: 1;
          cursor: default;
          opacity: 0;
          transition:
            opacity 140ms ease,
            background 140ms ease,
            color 140ms ease;
        }

        .oc-terminal-tab:hover .oc-terminal-tab__close,
        .oc-terminal-tab--active .oc-terminal-tab__close {
          opacity: 1;
        }

        .oc-terminal-tab__close:hover {
          background: rgba(255, 255, 255, 0.14);
          color: #fff;
        }

        .oc-terminal-tabs__add {
          display: grid;
          place-items: center;
          flex: 0 0 auto;
          width: 28px;
          height: 28px;
          padding: 0;
          border: 0.5px solid rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          background: linear-gradient(
            180deg,
            rgba(125, 211, 252, 0.16) 0%,
            rgba(56, 189, 248, 0.085) 42%,
            rgba(14, 165, 233, 0.03) 78%,
            rgba(14, 165, 233, 0.012) 100%
          );
          box-shadow: none;
          color: rgba(255, 255, 255, 0.6);
          font-family: inherit;
          font-size: 18px;
          font-weight: 400;
          line-height: 1;
          cursor: default;
          backdrop-filter: blur(10px) saturate(150%);
          -webkit-backdrop-filter: blur(10px) saturate(150%);
          transition:
            background 140ms ease,
            border-color 140ms ease,
            color 140ms ease;
        }

        .oc-terminal-tabs__add:hover {
          border-color: rgba(255, 255, 255, 0.14);
          background: linear-gradient(
            180deg,
            rgba(125, 211, 252, 0.21) 0%,
            rgba(56, 189, 248, 0.11) 42%,
            rgba(14, 165, 233, 0.04) 78%,
            rgba(14, 165, 233, 0.016) 100%
          );
          color: rgba(255, 255, 255, 0.9);
        }
      `}</style>
    </div>
  );
}
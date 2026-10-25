import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";
import { createPortal } from "react-dom";

import type { ExplorerActionsController } from "./explorer_actions.ts";



type ExplorerActionsProps = {
  controller: ExplorerActionsController;
};


const SCREEN_GAP = 8;

export default function ExplorerActions({ controller }: ExplorerActionsProps) {
  const { menu, menuSections, prompt, isWorking, closeMenu } = controller;
  const panelRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [value, setValue] = useState("");

  
  
  useLayoutEffect(() => {
    if (!menu) {
      setOffset({ x: 0, y: 0 });
      return;
    }

    const panel = panelRef.current;
    if (!panel) return;

    const rect = panel.getBoundingClientRect();
    const fitX = window.innerWidth - SCREEN_GAP - rect.width;
    const fitY = window.innerHeight - SCREEN_GAP - rect.height;

    setOffset({
      x: menu.x > fitX ? fitX - menu.x : 0,
      y: menu.y > fitY ? fitY - menu.y : 0,
    });
  }, [menu]);

  
  useEffect(() => {
    if (!menu) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (panelRef.current?.contains(event.target as Node)) return;

      closeMenu();
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;

      event.preventDefault();
      closeMenu();
    };

    window.addEventListener("pointerdown", handlePointerDown, true);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("pointerdown", handlePointerDown, true);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [closeMenu, menu]);

  
  
  const promptId = prompt?.id ?? null;
  const promptValue = prompt?.value ?? "";

  useEffect(() => {
    setValue(promptValue);

    const input = inputRef.current;
    if (!input) return;

    input.focus();
    input.select();
  }, [promptId, promptValue]);

  const handleSheetKeyDown = (event: ReactKeyboardEvent<HTMLFormElement>) => {
    if (event.key !== "Escape") return;

    event.preventDefault();
    controller.cancelPrompt();
  };

  if (!menu && !prompt) return null;

  return createPortal(
    <>
      {menu ? (
        <div
          ref={panelRef}
          className="oc-finder-menu"
          role="menu"
          aria-label="Explorer actions"
          style={{ left: menu.x + offset.x, top: menu.y + offset.y }}
          onContextMenu={(event) => event.preventDefault()}
        >
          {menuSections.map((section, index) => (
            <div className="oc-finder-menu__section" key={section.id}>
              {index > 0 ? (
                <span
                  className="oc-finder-menu__separator"
                  aria-hidden="true"
                />
              ) : null}

              {section.items.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  role="menuitem"
                  className={`oc-finder-menu__item${
                    item.tone === "danger"
                      ? " oc-finder-menu__item--danger"
                      : ""
                  }`}
                  onClick={() => controller.choose(item.id)}
                >
                  {item.label}
                </button>
              ))}
            </div>
          ))}
        </div>
      ) : null}

      {prompt ? (
        <form
          className="oc-finder-sheet"
          aria-label={prompt.title}
          onSubmit={(event) => {
            event.preventDefault();
            controller.confirmPrompt(value);
          }}
          onKeyDown={handleSheetKeyDown}
        >
          <span className="oc-finder-sheet__title">{prompt.title}</span>
          <span className="oc-finder-sheet__detail">{prompt.detail}</span>

          {prompt.label ? (
            <input
              ref={inputRef}
              className="oc-finder-sheet__input"
              aria-label={prompt.label}
              value={value}
              spellCheck={false}
              autoComplete="off"
              onChange={(event) => setValue(event.target.value)}
            />
          ) : null}

          {prompt.error ? (
            <span className="oc-finder-sheet__error" role="alert">
              {prompt.error}
            </span>
          ) : null}

          <div className="oc-finder-sheet__buttons">
            <button
              type="button"
              className="oc-finder-sheet__button"
              onClick={controller.cancelPrompt}
            >
              {prompt.cancel}
            </button>
            <button
              type="submit"
              className={`oc-finder-sheet__button oc-finder-sheet__button--${
                prompt.tone === "danger" ? "danger" : "primary"
              }`}
              disabled={isWorking}
            >
              {isWorking ? "Working…" : prompt.confirm}
            </button>
          </div>
        </form>
      ) : null}

      <style>{`
        .oc-finder-menu {
          position: fixed;
          z-index: 74;
          display: flex;
          flex-direction: column;
          box-sizing: border-box;
          min-width: 200px;
          padding: 5px;
          border: 1px solid rgba(255, 255, 255, 0.22);
          border-radius: 12px;
          background: linear-gradient(
            180deg,
            rgba(125, 211, 252, 0.34) 0%,
            rgba(56, 189, 248, 0.2) 42%,
            rgba(14, 165, 233, 0.1) 100%
          );
          backdrop-filter: blur(26px) saturate(165%);
          -webkit-backdrop-filter: blur(26px) saturate(165%);
          box-shadow:
            0 26px 60px rgba(0, 0, 0, 0.45),
            0 2px 8px rgba(0, 0, 0, 0.32),
            inset 0 1px 0 rgba(255, 255, 255, 0.22);
          color: #f6f9fc;
          font-family:
            -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
          font-size: 12.5px;
          -webkit-font-smoothing: antialiased;
          user-select: none;
        }

        .oc-finder-menu__section {
          display: flex;
          flex-direction: column;
        }

        .oc-finder-menu__item {
          display: block;
          box-sizing: border-box;
          width: 100%;
          padding: 5px 10px;
          border: 0;
          border-radius: 6px;
          background: transparent;
          color: inherit;
          font: inherit;
          text-align: left;
          white-space: nowrap;
          cursor: default;
        }

        .oc-finder-menu__item:hover,
        .oc-finder-menu__item:focus-visible {
          background: rgba(255, 255, 255, 0.18);
          outline: none;
        }

        .oc-finder-menu__item--danger {
          color: #ff9a9a;
        }

        .oc-finder-menu__item--danger:hover,
        .oc-finder-menu__item--danger:focus-visible {
          background: rgba(255, 96, 96, 0.28);
          color: #ffffff;
        }

        .oc-finder-menu__separator {
          display: block;
          height: 1px;
          margin: 4px 6px;
          background: rgba(255, 255, 255, 0.18);
        }

        .oc-finder-sheet {
          position: fixed;
          z-index: 75;
          top: 50%;
          left: 50%;
          display: flex;
          flex-direction: column;
          gap: 9px;
          box-sizing: border-box;
          width: min(360px, calc(100vw - 32px));
          padding: 16px;
          border: 1px solid rgba(255, 255, 255, 0.22);
          border-radius: 14px;
          background: linear-gradient(
            180deg,
            rgba(125, 211, 252, 0.34) 0%,
            rgba(56, 189, 248, 0.2) 42%,
            rgba(14, 165, 233, 0.1) 100%
          );
          backdrop-filter: blur(26px) saturate(165%);
          -webkit-backdrop-filter: blur(26px) saturate(165%);
          box-shadow:
            0 30px 70px rgba(0, 0, 0, 0.5),
            inset 0 1px 0 rgba(255, 255, 255, 0.22);
          transform: translate(-50%, -50%);
          color: #f6f9fc;
          font-family:
            -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
          font-size: 12.5px;
          -webkit-font-smoothing: antialiased;
          user-select: none;
        }

        .oc-finder-sheet__title {
          font-size: 13px;
          font-weight: 600;
        }

        .oc-finder-sheet__detail {
          color: rgba(244, 249, 255, 0.72);
          font-size: 11.5px;
          line-height: 1.45;
          word-break: break-word;
        }

        .oc-finder-sheet__input {
          box-sizing: border-box;
          width: 100%;
          padding: 7px 9px;
          border: 1px solid rgba(255, 255, 255, 0.26);
          border-radius: 8px;
          background: rgba(10, 16, 24, 0.38);
          color: #ffffff;
          font: inherit;
          font-size: 12.5px;
          outline: none;
        }

        .oc-finder-sheet__input:focus {
          border-color: rgba(125, 211, 252, 0.85);
          box-shadow: 0 0 0 3px rgba(56, 189, 248, 0.2);
        }

        .oc-finder-sheet__error {
          color: #ffb3b3;
          font-size: 11.5px;
        }

        .oc-finder-sheet__buttons {
          display: flex;
          justify-content: flex-end;
          gap: 8px;
          margin-top: 2px;
        }

        .oc-finder-sheet__button {
          padding: 6px 14px;
          border: 1px solid rgba(255, 255, 255, 0.24);
          border-radius: 8px;
          background: rgba(255, 255, 255, 0.12);
          color: #ffffff;
          font: inherit;
          font-size: 12px;
          cursor: pointer;
        }

        .oc-finder-sheet__button:hover:not(:disabled) {
          background: rgba(255, 255, 255, 0.2);
        }

        .oc-finder-sheet__button--primary {
          border-color: rgba(125, 211, 252, 0.75);
          background: rgba(56, 189, 248, 0.55);
        }

        .oc-finder-sheet__button--primary:hover:not(:disabled) {
          background: rgba(56, 189, 248, 0.72);
        }

        .oc-finder-sheet__button--danger {
          border-color: rgba(255, 150, 150, 0.7);
          background: rgba(255, 88, 88, 0.62);
        }

        .oc-finder-sheet__button--danger:hover:not(:disabled) {
          background: rgba(255, 88, 88, 0.8);
        }

        .oc-finder-sheet__button:disabled {
          opacity: 0.6;
          cursor: default;
        }
      `}</style>
    </>,
    document.body,
  );
}

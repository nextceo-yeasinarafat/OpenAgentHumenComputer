import { useCallback, useEffect, useRef, useState } from "react";

import {
  readComputerFile,
  writeComputerFile,
  type TextEditorController,
} from "./text_editor_window.ts";



type TextEditorWindowProps = {
  controller: TextEditorController;
  zIndex?: number;
  onActivate?: () => void;
};

export default function TextEditorWindow({
  controller,
  zIndex,
  onActivate,
}: TextEditorWindowProps) {
  const { isOpen, file, position, size, close, move, resize } = controller;

  const [content, setContent] = useState("");
  const [isDirty, setIsDirty] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [isLeaveWarned, setIsLeaveWarned] = useState(false);

  const area = useRef<HTMLTextAreaElement | null>(null);
  const numbers = useRef<HTMLPreElement | null>(null);
  const drag = useRef<{
    pointerX: number;
    pointerY: number;
    left: number;
    top: number;
  } | null>(null);
  const stretch = useRef<{
    pointerX: number;
    pointerY: number;
    width: number;
    height: number;
  } | null>(null);

  
  
  useEffect(() => {
    if (!isOpen || !file) return;

    let cancelled = false;

    setIsLoading(true);
    setError(null);
    setNote(null);
    setIsDirty(false);
    setIsLeaveWarned(false);

    void readComputerFile(file.path)
      .then((answer) => {
        if (cancelled) return;

        setContent(answer.content);
        setNote(`${answer.size.toLocaleString("en-US")} bytes`);
      })
      .catch((cause) => {
        if (cancelled) return;

        setContent("");
        setError(cause instanceof Error ? cause.message : String(cause));
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [file?.path, isOpen]);

  
  useEffect(() => {
    if (!isOpen || isLoading) return;

    area.current?.focus();
  }, [isLoading, isOpen, file?.path]);

  const save = useCallback(async () => {
    if (!file || isSaving) return;

    setIsSaving(true);
    setError(null);

    try {
      await writeComputerFile(file.path, content);
      setIsDirty(false);
      setIsLeaveWarned(false);
      setNote("Saved");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause));
    } finally {
      setIsSaving(false);
    }
  }, [content, file, isSaving]);

  const closeWindow = useCallback(() => {
    if (isDirty && !isLeaveWarned) {
      setIsLeaveWarned(true);
      setNote("Unsaved changes — press the red light again to close without saving");
      return;
    }

    close();
  }, [close, isDirty, isLeaveWarned]);

  if (!isOpen || !file) return null;

  const lines = content.split("\n").length;
  const lineNumbers = Array.from({ length: lines }, (_, index) => index + 1).join("\n");

  return (
    <section
      className="oc-editor"
      style={{
        left: position.x,
        top: position.y,
        width: size.width,
        height: size.height,
        zIndex: zIndex ?? 50,
      }}
      aria-label={`Text editor: ${file.name}`}
      onPointerDown={onActivate}
    >
      <header
        className="oc-editor__bar"
        onPointerDown={(event) => {
          if (event.button !== 0) return;
          if ((event.target as HTMLElement).closest("button")) return;

          drag.current = {
            pointerX: event.clientX,
            pointerY: event.clientY,
            left: position.x,
            top: position.y,
          };

          event.currentTarget.setPointerCapture(event.pointerId);
        }}
        onPointerMove={(event) => {
          const started = drag.current;
          if (!started) return;

          move({
            x: started.left + (event.clientX - started.pointerX),
            y: started.top + (event.clientY - started.pointerY),
          });
        }}
        onPointerUp={(event) => {
          drag.current = null;
          event.currentTarget.releasePointerCapture?.(event.pointerId);
        }}
        onPointerCancel={() => {
          drag.current = null;
        }}
      >
        <span className="oc-editor__lights" aria-hidden="true">
          <button
            type="button"
            className="oc-editor__light oc-editor__light--close"
            aria-label="Close Text Editor window"
            title="Close"
            onClick={closeWindow}
          >
            <span className="oc-editor__glyph">×</span>
          </button>
        </span>

        <span className="oc-editor__title" title={file.path}>
          {file.name}
          {isDirty ? <span className="oc-editor__dot" aria-label="unsaved" /> : null}
        </span>

        <button
          type="button"
          className="oc-editor__save"
          onClick={() => void save()}
          disabled={isSaving || isLoading || !isDirty}
          title="Save (Ctrl+S)"
        >
          {isSaving ? "Saving…" : "Save"}
        </button>
      </header>

      <div className="oc-editor__body">
        <pre className="oc-editor__numbers" ref={numbers} aria-hidden="true">
          {lineNumbers}
        </pre>

        <textarea
          ref={area}
          className="oc-editor__text"
          value={content}
          readOnly={isLoading}
          spellCheck={false}
          autoCapitalize="off"
          autoCorrect="off"
          wrap="off"
          aria-label={`Text of ${file.name}`}
          onChange={(event) => {
            setContent(event.target.value);
            setIsDirty(true);
            setIsLeaveWarned(false);
            setNote(null);
          }}
          onScroll={(event) => {
            if (numbers.current) {
              numbers.current.scrollTop = event.currentTarget.scrollTop;
            }
          }}
          onKeyDown={(event) => {
            if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s") {
              event.preventDefault();
              void save();
              return;
            }

            if (event.key === "Tab") {
              event.preventDefault();

              const field = event.currentTarget;
              const start = field.selectionStart;
              const end = field.selectionEnd;
              const withSpaces = `${content.slice(0, start)}  ${content.slice(end)}`;

              setContent(withSpaces);
              setIsDirty(true);
              setNote(null);

              window.requestAnimationFrame(() => {
                field.selectionStart = start + 2;
                field.selectionEnd = start + 2;
              });
            }
          }}
        />
      </div>

      <footer className="oc-editor__foot">
        <span className="oc-editor__path" title={file.path}>
          {file.path}
        </span>
        <span className="oc-editor__count">
          {lines} {lines === 1 ? "line" : "lines"}
        </span>
        {error ? (
          <span className="oc-editor__note" data-tone="bad">{error}</span>
        ) : note ? (
          <span className="oc-editor__note" data-tone={isDirty ? "quiet" : "good"}>
            {note}
          </span>
        ) : null}
      </footer>

      <div
        className="oc-editor__grip"
        aria-hidden="true"
        onPointerDown={(event) => {
          if (event.button !== 0) return;

          stretch.current = {
            pointerX: event.clientX,
            pointerY: event.clientY,
            width: size.width,
            height: size.height,
          };

          event.currentTarget.setPointerCapture(event.pointerId);
        }}
        onPointerMove={(event) => {
          const started = stretch.current;
          if (!started) return;

          resize({
            width: started.width + (event.clientX - started.pointerX),
            height: started.height + (event.clientY - started.pointerY),
          });
        }}
        onPointerUp={(event) => {
          stretch.current = null;
          event.currentTarget.releasePointerCapture?.(event.pointerId);
        }}
        onPointerCancel={() => {
          stretch.current = null;
        }}
      />

      <style>{`
        .oc-editor {
          position: fixed;
          display: flex;
          flex-direction: column;
          min-width: 420px;
          min-height: 260px;
          box-sizing: border-box;
          overflow: hidden;
          border: 1px solid #26282C;
          border-radius: 0;
          background: #0E0E0E;
          color: #FFFFFF;
          font-family: ui-monospace, "SF Mono", Menlo, Consolas, monospace;
          font-size: 12px;
          box-shadow: 0 32px 90px rgba(0, 0, 0, 0.6);
          animation: oc-editor-open 170ms ease-out;
        }

        @keyframes oc-editor-open {
          from {
            opacity: 0;
            transform: translateY(6px) scale(0.99);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        .oc-editor__bar {
          display: flex;
          flex: 0 0 40px;
          align-items: center;
          gap: 10px;
          padding: 0 12px;
          border-bottom: 1px solid #1B1D21;
          background: #121212;
          cursor: move;
          touch-action: none;
          user-select: none;
        }

        .oc-editor__lights {
          display: flex;
          flex: 0 0 auto;
          align-items: center;
        }

        .oc-editor__light {
          display: grid;
          place-items: center;
          width: 13px;
          height: 13px;
          padding: 0;
          border: 0;
          border-radius: 50%;
          appearance: none;
          color: rgba(0, 0, 0, 0.8);
          font-size: 9px;
          font-weight: 700;
          line-height: 1;
          cursor: pointer;
        }

        .oc-editor__light--close {
          background: #ff5f57;
        }

        .oc-editor__glyph {
          opacity: 0;
          transition: opacity 120ms ease;
        }

        .oc-editor__light:hover .oc-editor__glyph,
        .oc-editor__light:focus-visible .oc-editor__glyph {
          opacity: 1;
        }

        .oc-editor__title {
          display: flex;
          flex: 1 1 auto;
          align-items: center;
          gap: 8px;
          min-width: 0;
          overflow: hidden;
          color: rgba(255, 255, 255, 0.82);
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .oc-editor__dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #4363F6;
        }

        .oc-editor__save {
          flex: 0 0 auto;
          padding: 5px 12px;
          border: 1px solid #26282C;
          border-radius: 0;
          background: #0E0E0E;
          color: rgba(255, 255, 255, 0.82);
          font: inherit;
          font-size: 10px;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          cursor: pointer;
        }

        .oc-editor__save:hover:not(:disabled) {
          border-color: #4363F6;
          color: #FFFFFF;
        }

        .oc-editor__save:disabled {
          opacity: 0.42;
          cursor: default;
        }

        .oc-editor__body {
          display: flex;
          flex: 1 1 auto;
          min-height: 0;
          background: #0B0B0B;
        }

        .oc-editor__numbers {
          flex: 0 0 auto;
          width: 52px;
          margin: 0;
          padding: 10px 8px 10px 0;
          overflow: hidden;
          border-right: 1px solid #1B1D21;
          background: #0E0E0E;
          color: rgba(255, 255, 255, 0.28);
          font: inherit;
          font-size: 12px;
          line-height: 20px;
          text-align: right;
          user-select: none;
        }

        .oc-editor__text {
          flex: 1 1 auto;
          min-width: 0;
          margin: 0;
          padding: 10px 12px;
          border: 0;
          outline: none;
          background: #0B0B0B;
          color: #E7E7E7;
          font: inherit;
          font-size: 12px;
          line-height: 20px;
          tab-size: 2;
          white-space: pre;
          overflow: auto;
          resize: none;
        }

        .oc-editor__text::selection {
          background: rgba(67, 99, 246, 0.4);
        }

        .oc-editor__foot {
          display: flex;
          flex: 0 0 28px;
          align-items: center;
          gap: 14px;
          padding: 0 12px;
          border-top: 1px solid #1B1D21;
          background: #121212;
          color: rgba(255, 255, 255, 0.4);
          font-size: 10px;
        }

        .oc-editor__path {
          flex: 1 1 auto;
          min-width: 0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .oc-editor__count {
          flex: 0 0 auto;
        }

        .oc-editor__note {
          flex: 0 0 auto;
          max-width: 50%;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .oc-editor__note[data-tone="good"] {
          color: #9FB2FF;
        }

        .oc-editor__note[data-tone="bad"] {
          color: #FFB4B4;
        }

        .oc-editor__grip {
          position: absolute;
          right: 0;
          bottom: 0;
          width: 16px;
          height: 16px;
          cursor: nwse-resize;
          touch-action: none;
        }
      `}</style>
    </section>
  );
}

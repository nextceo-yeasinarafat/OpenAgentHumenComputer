import { useVscodeStream } from "./vscode_stream.ts";



type VscodeStreamProps = {
  onActivate?: () => void;
};

export default function VscodeStream({ onActivate }: VscodeStreamProps) {
  const { frameRef, status, src, reload, markReady, markError } =
    useVscodeStream({ onActivate });

  const isReady = status === "ready";

  return (
    <div
      className={
        isReady ? "oc-vscode__stream oc-vscode__stream--ready" : "oc-vscode__stream"
      }
    >
      <iframe
        ref={frameRef}
        className="oc-vscode__frame"
        src={src}
        title="Visual Studio Code"
        allow="clipboard-read; clipboard-write; fullscreen; autoplay"
        onLoad={markReady}
        onError={markError}
      />

      {!isReady ? (
        <div className="oc-vscode__veil" role="status" aria-live="polite">
          {status === "error" ? (
            <>
              <span className="oc-vscode__veil-text">
                VS Code did not answer.
              </span>
              <button
                type="button"
                className="oc-vscode__retry"
                onClick={reload}
              >
                Try again
              </button>
            </>
          ) : (
            <>
              <span className="oc-vscode__spinner" aria-hidden="true" />
              <span className="oc-vscode__veil-text">Opening VS Code…</span>
            </>
          )}
        </div>
      ) : null}

      <style>{`
        .oc-vscode__stream {
          position: absolute;
          inset: 0;
          overflow: hidden;
          background: #0e0e0e;
        }

        .oc-vscode__frame {
          display: block;
          width: 100%;
          height: 100%;
          border: 0;
          background: #0e0e0e;
          opacity: 0;
          transition: opacity 180ms ease;
        }

        .oc-vscode__stream--ready .oc-vscode__frame {
          opacity: 1;
        }

        .oc-vscode__veil {
          position: absolute;
          inset: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 12px;
          background: #0e0e0e;
          color: rgba(255, 255, 255, 0.55);
          font-family:
            -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
          font-size: 12.5px;
          letter-spacing: -0.006em;
          -webkit-font-smoothing: antialiased;
        }

        .oc-vscode__spinner {
          width: 18px;
          height: 18px;
          border: 2px solid rgba(255, 255, 255, 0.14);
          border-top-color: rgba(255, 255, 255, 0.62);
          border-radius: 50%;
          animation: oc-vscode-spin 800ms linear infinite;
        }

        .oc-vscode__veil-text {
          line-height: 1;
        }

        .oc-vscode__retry {
          padding: 6px 12px;
          border: 1px solid rgba(255, 255, 255, 0.16);
          border-radius: 7px;
          background: rgba(255, 255, 255, 0.06);
          color: rgba(255, 255, 255, 0.82);
          font: inherit;
          cursor: pointer;
          transition:
            background 120ms ease,
            border-color 120ms ease;
        }

        .oc-vscode__retry:hover {
          border-color: rgba(255, 255, 255, 0.26);
          background: rgba(255, 255, 255, 0.1);
        }

        @keyframes oc-vscode-spin {
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
}

import { useCallback, useEffect, useRef, useState } from "react";

import { copyText } from "./settings_clipboard.ts";
import { fetchMcpConfig, fetchMcpState, setMcpRunning } from "./settings_mcp.ts";



export default function SettingsMcp() {
  const [running, setRunning] = useState<boolean | null>(null);
  const [config, setConfig] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(0);
  const copiedTimer = useRef<number | null>(null);

  useEffect(() => {
    let live = true;
    fetchMcpState()
      .then((state) => live && setRunning(state.running))
      .catch((cause) => live && setError(String(cause)));
    fetchMcpConfig()
      .then((piece) => live && setConfig(piece))
      .catch(() => {});
    return () => {
      live = false;
    };
  }, []);

  useEffect(() => {
    return () => {
      if (copiedTimer.current !== null) window.clearTimeout(copiedTimer.current);
    };
  }, []);

  const toggle = useCallback(async () => {
    if (running === null || busy) return;
    setBusy(true);
    setError(null);
    try {
      const state = await setMcpRunning(!running);
      setRunning(state.running);
    } catch (cause) {
      setError(String(cause));
    } finally {
      setBusy(false);
    }
  }, [busy, running]);

  const copy = useCallback(async () => {
    if (!(await copyText(config))) return;
    setCopied((count) => count + 1);
    if (copiedTimer.current !== null) window.clearTimeout(copiedTimer.current);
    copiedTimer.current = window.setTimeout(() => setCopied(0), 1600);
  }, [config]);

  return (
    <>
      <style>{`
        .oc-mcp {
          padding: 18px 20px;
          border: 1px solid #26282C;
          border-radius: 0;
          background: #0E0E0E;
          box-shadow: none;
        }

        .oc-mcp__row {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .oc-mcp__switch {
          position: relative;
          flex: none;
          width: 40px;
          height: 22px;
          padding: 0;
          border: 1px solid #26282C;
          border-radius: 0;
          background: #212121;
          cursor: default;
          transition:
            background 180ms ease,
            border-color 180ms ease;
        }

        .oc-mcp__switch[data-on="true"] {
          border-color: #D6E2F0;
          background: #D6E2F0;
        }

        .oc-mcp__knob {
          position: absolute;
          top: 2px;
          left: 2px;
          width: 16px;
          height: 16px;
          background: #9A968E;
          transition:
            transform 180ms ease,
            background 180ms ease;
        }

        .oc-mcp__switch[data-on="true"] .oc-mcp__knob {
          background: #0E0E0E;
          transform: translateX(18px);
        }

        .oc-mcp__switch:disabled {
          opacity: 0.4;
        }

        .oc-mcp__switch:focus-visible {
          outline: 1px solid #D6E2F0;
          outline-offset: 2px;
        }

        .oc-mcp__meta {
          display: flex;
          flex: 1 1 auto;
          flex-direction: column;
          gap: 2px;
          min-width: 0;
        }

        .oc-mcp__title {
          color: #ECEAE5;
          font-family: ui-monospace, "SF Mono", Menlo, Consolas, monospace;
          font-size: 11px;
          letter-spacing: 0.14em;
          text-transform: uppercase;
        }

        .oc-mcp__note {
          color: #9A968E;
          font-family: ui-monospace, "SF Mono", Menlo, Consolas, monospace;
          font-size: 11px;
        }

        .oc-mcp__code {
          margin: 0;
          padding: 12px;
          border: 1px solid #26282C;
          background: #212121;
          color: #ECEAE5;
          font-family: ui-monospace, "SF Mono", Menlo, Consolas, monospace;
          font-size: 11.5px;
          line-height: 1.7;
          white-space: pre-wrap;
          overflow-wrap: anywhere;
          user-select: text;
        }

        .oc-mcp__foot {
          display: flex;
          justify-content: flex-end;
          margin-top: 10px;
        }

        .oc-mcp__copy {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          height: 30px;
          padding: 0 14px;
          border: 1px solid #26282C;
          border-radius: 0;
          background: #212121;
          color: #ECEAE5;
          font-family: ui-monospace, "SF Mono", Menlo, Consolas, monospace;
          font-size: 11px;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          line-height: 1;
          cursor: default;
          transition:
            border-color 120ms ease,
            color 120ms ease,
            background 120ms ease;
        }

        .oc-mcp__copy:hover {
          border-color: #D6E2F0;
          color: #D6E2F0;
        }

        .oc-mcp__copy[data-copied="true"] {
          border-color: rgba(48, 209, 88, 0.45);
          color: #30D158;
        }

        .oc-mcp__copy:focus-visible {
          outline: 1px solid #D6E2F0;
          outline-offset: 2px;
        }

        .oc-mcp__copy-label {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          animation: oc-mcp-in 200ms ease;
        }

        .oc-mcp__check {
          width: 11px;
          height: 11px;
        }

        @keyframes oc-mcp-in {
          from {
            opacity: 0;
            transform: translateY(3px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>

      <div className="oc-settings__card oc-mcp">
        <div className="oc-mcp__row">
          <button
            type="button"
            role="switch"
            className="oc-mcp__switch"
            data-on={running === true}
            aria-checked={running === true}
            aria-label="MCP server"
            disabled={busy || running === null}
            onClick={() => void toggle()}
          >
            <span className="oc-mcp__knob" aria-hidden="true" />
          </button>
          <div className="oc-mcp__meta">
            <span className="oc-mcp__title">MCP Server</span>
            <span className="oc-mcp__note">
              {running === null
                ? "asking the machine…"
                : running
                  ? "the machine is speaking the protocol on port 7072"
                  : "the machine is silent"}
            </span>
          </div>
        </div>
        {error ? <div className="oc-settings__card-error">{error}</div> : null}
      </div>

      <div className="oc-settings__card oc-mcp">
        <pre className="oc-mcp__code">{config || "…"}</pre>
        <div className="oc-mcp__foot">
          <button
            type="button"
            className="oc-mcp__copy"
            data-copied={copied > 0}
            onClick={() => void copy()}
          >
            {copied > 0 ? (
              <span className="oc-mcp__copy-label" key={`ok-${copied}`}>
                <svg className="oc-mcp__check" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                  <path
                    d="M2 6.5 4.8 9.2 10 3.4"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                Copied
              </span>
            ) : (
              <span className="oc-mcp__copy-label" key="idle">
                Copy
              </span>
            )}
          </button>
        </div>
      </div>
    </>
  );
}

import { useCallback, useEffect, useRef, useState } from "react";

import {
  fetchServices,
  SERVICE_NOTES,
  serviceAction,
} from "./settings_restart.ts";
import type { ServiceName, ServicesState } from "./settings_restart.ts";



const ORDER: ServiceName[] = ["bridge", "computer", "screen", "browser", "mcp", "vscode"];


const LOCKED: ServiceName[] = ["bridge", "computer", "screen"];

const NOTICE_MS = 2600;

export default function SettingsRestart() {
  const [services, setServices] = useState<ServicesState | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [restarting, setRestarting] = useState(false);
  const [restarted, setRestarted] = useState(0);
  const [notice, setNotice] = useState<string | null>(null);
  const restartTimer = useRef<number | null>(null);
  const noticeTimer = useRef<number | null>(null);

  const read = useCallback(async () => {
    try {
      setServices(await fetchServices());
      setError(null);
    } catch (cause) {
      setError(String(cause));
    }
  }, []);

  useEffect(() => {
    void read();
    const timer = window.setInterval(() => void read(), 4000);
    return () => window.clearInterval(timer);
  }, [read]);

  useEffect(() => {
    return () => {
      if (restartTimer.current !== null) window.clearTimeout(restartTimer.current);
      if (noticeTimer.current !== null) window.clearTimeout(noticeTimer.current);
    };
  }, []);

  const act = useCallback(
    async (action: "start" | "stop", name: ServiceName) => {
      setBusy(`${action}-${name}`);
      setError(null);
      try {
        await serviceAction(action, name);
        await read();
      } catch (cause) {
        setError(String(cause));
      } finally {
        setBusy(null);
      }
    },
    [read],
  );

  const refuse = useCallback((name: ServiceName) => {
    setNotice(`${name.toUpperCase()} cannot be turned off — the machine needs it.`);
    if (noticeTimer.current !== null) window.clearTimeout(noticeTimer.current);
    noticeTimer.current = window.setTimeout(() => setNotice(null), NOTICE_MS);
  }, []);

  const restartSystem = useCallback(async () => {
    if (restarting) return;
    setRestarting(true);
    setError(null);
    try {
      await serviceAction("restart", "all");
      setRestarted((count) => count + 1);
      if (restartTimer.current !== null) window.clearTimeout(restartTimer.current);
      restartTimer.current = window.setTimeout(() => setRestarted(0), 2400);
      await read();
    } catch (cause) {
      setError(String(cause));
    } finally {
      setRestarting(false);
    }
  }, [read, restarting]);

  return (
    <>
      <style>{`
        .oc-serve {
          padding: 18px 20px;
          border: 1px solid #26282C;
          border-radius: 0;
          background: #0E0E0E;
          box-shadow: none;
        }

        .oc-serve .oc-settings__card-head {
          margin-bottom: 10px;
        }

        .oc-serve .oc-settings__card-title {
          color: #FFFFFF;
          font-family: ui-monospace, "SF Mono", Menlo, Consolas, monospace;
          font-size: 11px;
          font-weight: 500;
          letter-spacing: 0.14em;
          text-transform: uppercase;
        }

        .oc-serve .oc-settings__card-note {
          color: #FFFFFF;
          font-family: ui-monospace, "SF Mono", Menlo, Consolas, monospace;
          font-size: 11px;
        }

        .oc-serve__rows {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .oc-serve__row {
          display: flex;
          box-sizing: border-box;
          align-items: center;
          gap: 12px;
          padding: 9px 12px;
          border: 1px solid #26282C;
          background: #212121;
        }

        .oc-serve .oc-serve__switch {
          position: relative;
          flex: none;
          width: 40px;
          height: 22px;
          padding: 0;
          border: 1px solid rgba(255, 255, 255, 0.45);
          border-radius: 0;
          background: transparent;
          box-shadow: none;
          cursor: default;
          transition:
            background 180ms ease,
            border-color 180ms ease,
            box-shadow 180ms ease;
        }

        .oc-serve .oc-serve__switch[data-on="true"] {
          border-color: #4363F6;
          background: #4363F6;
          box-shadow: 0 0 10px rgba(67, 99, 246, 0.3);
        }

        .oc-serve .oc-serve__switch-knob {
          position: absolute;
          top: 2px;
          left: 2px;
          width: 16px;
          height: 16px;
          background: #FFFFFF;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
          transition:
            transform 180ms ease,
            background 180ms ease;
        }

        .oc-serve .oc-serve__switch[data-on="true"] .oc-serve__switch-knob {
          background: #FFFFFF;
          transform: translateX(18px);
        }

        .oc-serve .oc-serve__switch[data-locked="true"] {
          cursor: default;
        }

        .oc-serve__lock {
          position: absolute;
          top: 50%;
          left: 50%;
          width: 12px;
          height: 12px;
          color: #FFFFFF;
          transform: translate(-50%, -50%);
        }

        .oc-serve__switch:disabled {
          opacity: 0.4;
        }

        .oc-serve__switch:focus-visible {
          outline: 1px solid #D6E2F0;
          outline-offset: 2px;
        }

        .oc-serve__meta {
          display: flex;
          flex: 1 1 auto;
          flex-direction: column;
          gap: 2px;
          min-width: 0;
        }

        .oc-serve__name {
          color: #FFFFFF;
          font-family: ui-monospace, "SF Mono", Menlo, Consolas, monospace;
          font-size: 11px;
          letter-spacing: 0.12em;
          text-transform: uppercase;
        }

        .oc-serve__note {
          overflow: hidden;
          color: #FFFFFF;
          font-family: ui-monospace, "SF Mono", Menlo, Consolas, monospace;
          font-size: 11px;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .oc-serve__state {
          flex: none;
          color: #FFFFFF;
          font-family: ui-monospace, "SF Mono", Menlo, Consolas, monospace;
          font-size: 10px;
          letter-spacing: 0.14em;
          text-transform: uppercase;
        }

        .oc-serve .oc-settings__card-foot {
          color: #FFFFFF;
          font-family: ui-monospace, "SF Mono", Menlo, Consolas, monospace;
          font-size: 11px;
        }

        .oc-serve .oc-settings__card-error {
          color: #F40000;
          font-family: ui-monospace, "SF Mono", Menlo, Consolas, monospace;
          font-size: 11.5px;
        }

        .oc-serve .oc-restart {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          height: 32px;
          padding: 0 16px;
          border: 1px solid #F40000;
          border-radius: 0;
          background: #F40000;
          box-shadow: none;
          color: #FFFFFF;
          font-family: ui-monospace, "SF Mono", Menlo, Consolas, monospace;
          font-size: 11px;
          font-weight: 500;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          cursor: default;
          transition:
            background 120ms ease,
            color 120ms ease,
            filter 120ms ease;
        }

        .oc-serve .oc-restart:hover:not(:disabled) {
          background: #F40000;
          border-color: #F40000;
          color: #FFFFFF;
          filter: brightness(1.15);
          transform: none;
          box-shadow: none;
        }

        .oc-serve .oc-restart:active:not(:disabled) {
          transform: none;
        }

        .oc-serve .oc-restart:disabled {
          opacity: 0.45;
        }

        .oc-serve .oc-restart:focus-visible {
          outline: 1px solid #D6E2F0;
          outline-offset: 2px;
        }

        .oc-restart__label {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          animation: oc-serve-in 200ms ease;
        }

        .oc-restart__spin {
          width: 11px;
          height: 11px;
          border: 1.5px solid currentColor;
          border-top-color: transparent;
          border-radius: 50%;
          animation: oc-serve-rotate 800ms linear infinite;
        }

        .oc-restart__check {
          width: 11px;
          height: 11px;
        }

        .oc-serve__toast {
          position: fixed;
          left: 50%;
          bottom: 32px;
          z-index: 60;
          box-sizing: border-box;
          max-width: min(440px, calc(100vw - 48px));
          padding: 11px 16px;
          border: 1px solid #26282C;
          border-left: 2px solid #F40000;
          border-radius: 0;
          background: #212121;
          box-shadow: 0 12px 32px rgba(0, 0, 0, 0.55);
          color: #FFFFFF;
          font-family: ui-monospace, "SF Mono", Menlo, Consolas, monospace;
          font-size: 11px;
          letter-spacing: 0.06em;
          line-height: 1.5;
          pointer-events: none;
          transform: translate(-50%, 0);
          animation: oc-serve-toast 180ms ease;
        }

        @keyframes oc-serve-toast {
          from {
            opacity: 0;
            transform: translate(-50%, 6px);
          }
          to {
            opacity: 1;
            transform: translate(-50%, 0);
          }
        }

        @keyframes oc-serve-in {
          from {
            opacity: 0;
            transform: translateY(3px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes oc-serve-rotate {
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>

      <div className="oc-settings__card oc-serve">
        <div className="oc-settings__card-head">
          <span className="oc-settings__card-title">Services</span>
          <span className="oc-settings__card-note">
            everything of the machine, on and off from here
          </span>
        </div>

        {error ? <div className="oc-settings__card-error">{error}</div> : null}

        <div className="oc-serve__rows">
          {(services ? ORDER : []).map((name) => {
            const state = services?.[name] ?? "off";
            const on = state === "on";
            const locked = LOCKED.includes(name);
            return (
              <div key={name} className="oc-serve__row">
                <div className="oc-serve__meta">
                  <span className="oc-serve__name">{name}</span>
                  <span className="oc-serve__note">{SERVICE_NOTES[name]}</span>
                </div>
                <span className="oc-serve__state" data-on={on}>{state}</span>
                <button
                  type="button"
                  role="switch"
                  className="oc-serve__switch"
                  data-on={on}
                  data-locked={locked}
                  aria-checked={on}
                  aria-disabled={locked || undefined}
                  aria-label={locked ? `${name}, locked on` : name}
                  disabled={!locked && (busy !== null || state === "none")}
                  onClick={() => {
                    if (locked) {
                      refuse(name);
                      return;
                    }
                    void act(on ? "stop" : "start", name);
                  }}
                >
                  {locked ? (
                    <svg className="oc-serve__lock" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                      <rect x="2.5" y="5.2" width="7" height="5.3" stroke="currentColor" strokeWidth="1.2" />
                      <path d="M4.2 5.2V3.9a1.8 1.8 0 0 1 3.6 0v1.3" stroke="currentColor" strokeWidth="1.2" />
                    </svg>
                  ) : (
                    <span className="oc-serve__switch-knob" aria-hidden="true" />
                  )}
                </button>
              </div>
            );
          })}
        </div>

        {!services && !error ? (
          <div className="oc-settings__card-note">asking the machine…</div>
        ) : null}
      </div>

      <div className="oc-settings__card oc-serve">
        <div className="oc-settings__card-head">
          <span className="oc-settings__card-title">Restart System</span>
          <span className="oc-settings__card-note">
            brings every service down and back, in the order they lean on each other
          </span>
        </div>
        <button
          type="button"
          className="oc-restart"
          disabled={restarting}
          onClick={() => void restartSystem()}
        >
          {restarting ? (
            <span className="oc-restart__label" key="busy">
              <span className="oc-restart__spin" aria-hidden="true" />
              Restarting…
            </span>
          ) : restarted > 0 ? (
            <span className="oc-restart__label" key="done">
              <svg className="oc-restart__check" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                <path d="M2 6.5 4.8 9.2 10 3.4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Restarted
            </span>
          ) : (
            <span className="oc-restart__label" key="idle">
              Restart System
            </span>
          )}
        </button>
        <div className="oc-settings__card-foot">
          The watchman of the machine (core-systeam) brings the bridge and the
          computer back from every boot on its own; this hand is for the rest.
        </div>
      </div>

      {notice ? (
        <div className="oc-serve__toast" role="status" aria-live="polite">
          {notice}
        </div>
      ) : null}
    </>
  );
}

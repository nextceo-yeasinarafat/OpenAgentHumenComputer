import { useEffect, useRef, useState } from "react";

import { fetchMachineAnalyse, MetricHistory } from "./settings_analyse.ts";
import type { Metric } from "./settings_analyse.ts";



const COLUMNS = 32;   
const ROWS = 5;       
const POLL_MS = 1500; 


function filledRows(percent: number | null): number {
  if (percent === null) return 0;
  return Math.max(percent > 0 ? 1 : 0, Math.round((percent / 100) * ROWS));
}

function Meter({
  label,
  metric,
  history,
}: {
  label: string;
  metric: Metric;
  history: MetricHistory;
}) {
  const rows = Array.from({ length: ROWS }, (_, index) => ROWS - 1 - index);
  const columns = Array.from({ length: COLUMNS }, (_, index) => index);

  return (
    <div className="oc-metre">
      <div className="oc-metre__head">
        <span className="oc-metre__label">{label}</span>
        <span className="oc-metre__given">{metric.given}</span>
        <span className="oc-metre__value">
          {metric.percent === null ? "—" : `${Math.round(metric.percent)}%`}
        </span>
      </div>

      <div
        className="oc-metre__field"
        role="img"
        aria-label={`${label}: ${metric.percent === null ? "not fitted" : `${Math.round(metric.percent)} percent`}`}
      >
        {rows.map((row) => (
          <div key={row} className="oc-metre__row">
            {columns.map((column) => {
              const on = column < history.length && row < filledRows(history.column(column));
              const lived = column < history.length;
              return (
                <span
                  key={column}
                  className="oc-metre__dot"
                  data-on={on}
                  data-lived={lived}
                />
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function SettingsAnalyse() {
  const [cpu, setCpu] = useState<MetricHistory | null>(null);
  const [gpu, setGpu] = useState<MetricHistory | null>(null);
  const [ram, setRam] = useState<MetricHistory | null>(null);
  const [storage, setStorage] = useState<MetricHistory | null>(null);
  const [latest, setLatest] = useState<Awaited<ReturnType<typeof fetchMachineAnalyse>> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const alive = useRef(true);

  useEffect(() => {
    alive.current = true;

    const beat = async () => {
      try {
        const reading = await fetchMachineAnalyse();
        if (!alive.current) return;
        setError(null);
        setLatest(reading);
        setCpu((current) => {
          const next = current ?? new MetricHistory(COLUMNS);
          next.push(reading.cpu.percent);
          return next;
        });
        setGpu((current) => {
          const next = current ?? new MetricHistory(COLUMNS);
          next.push(reading.gpu.percent);
          return next;
        });
        setRam((current) => {
          const next = current ?? new MetricHistory(COLUMNS);
          next.push(reading.ram.percent);
          return next;
        });
        setStorage((current) => {
          const next = current ?? new MetricHistory(COLUMNS);
          next.push(reading.storage.percent);
          return next;
        });
      } catch (cause) {
        if (alive.current) setError(String(cause));
      }
    };

    void beat();
    const timer = window.setInterval(() => void beat(), POLL_MS);
    return () => {
      alive.current = false;
      window.clearInterval(timer);
    };
  }, []);

  return (
    <>
      <style>{`
        .oc-analyse {
          display: grid;
          grid-template-columns: 1fr;
          gap: 12px;
        }

        .oc-metre {
          box-sizing: border-box;
          margin: 0;
          padding: 14px 16px;
          border: 1px solid #26282C;
          border-radius: 0;
          background: #0E0E0E;
        }

        .oc-metre__head {
          display: flex;
          align-items: baseline;
          gap: 6px;
          min-width: 0;
          margin-bottom: 9px;
        }

        .oc-metre__label {
          flex: none;
          color: #ECEAE5;
          font-family: ui-monospace, "SF Mono", Menlo, Consolas, monospace;
          font-size: 10px;
          letter-spacing: 0.14em;
        }

        .oc-metre__given {
          flex: 1 1 auto;
          overflow: hidden;
          color: #9A968E;
          font-family: ui-monospace, "SF Mono", Menlo, Consolas, monospace;
          font-size: 10px;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .oc-metre__value {
          flex: none;
          color: #ECEAE5;
          font-family: ui-monospace, "SF Mono", Menlo, Consolas, monospace;
          font-size: 11.5px;
          font-variant-numeric: tabular-nums;
        }

        .oc-metre__field {
          display: flex;
          flex-direction: column;
          gap: 3px;
        }

        .oc-metre__row {
          display: flex;
          gap: 3px;
        }

        .oc-metre__dot {
          flex: 1 1 0;
          aspect-ratio: 1 / 1;
          width: 100%;
          min-width: 0;
          border-radius: 0;
          background: #1A1C1F;
          transition: background 240ms ease, box-shadow 240ms ease;
        }

        .oc-metre__dot[data-lived="true"] {
          background: #26282C;
        }

        .oc-metre__dot[data-on="true"] {
          background: #D6E2F0;
          box-shadow: 0 0 5px rgba(214, 226, 240, 0.18);
        }
      `}</style>

      {error ? (
        <div className="oc-settings__card">
          <div className="oc-settings__card-error">{error}</div>
        </div>
      ) : null}

      {latest && cpu && gpu && ram && storage ? (
        <div className="oc-analyse">
          <Meter label="CPU" metric={latest.cpu} history={cpu} />
          <Meter label="GPU" metric={latest.gpu} history={gpu} />
          <Meter label="RAM" metric={latest.ram} history={ram} />
          <Meter label="STORAGE" metric={latest.storage} history={storage} />
        </div>
      ) : !error ? (
        <div className="oc-settings__card">
          <div className="oc-settings__card-note">asking the machine…</div>
        </div>
      ) : null}
    </>
  );
}

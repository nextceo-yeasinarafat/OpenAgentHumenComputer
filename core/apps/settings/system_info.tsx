import { useEffect, useState } from "react";

import { fetchMachineDetails, hardwareRows, identityRows } from "./system_info.ts";
import type { MachineDetails } from "./system_info.ts";



function Row({ name, value }: { name: string; value: string }) {
  return (
    <div className="oc-settings__row">
      <span className="oc-settings__row-key">{name}</span>
      <span className="oc-settings__row-value">{value}</span>
    </div>
  );
}

export default function SystemInfo() {
  const [details, setDetails] = useState<MachineDetails | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let live = true;
    fetchMachineDetails()
      .then((found) => live && setDetails(found))
      .catch((cause) => live && setError(String(cause)));
    return () => {
      live = false;
    };
  }, []);

  return (
    <>
      <style>{`
        .oc-info {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .oc-info .oc-settings__card {
          margin-bottom: 0;
          padding: 18px 20px;
          border: 1px solid #26282C;
          border-radius: 0;
          background: #0E0E0E;
          box-shadow: none;
        }

        .oc-info .oc-about {
          margin-bottom: 14px;
          padding-bottom: 14px;
          border-bottom: 1px solid #26282C;
        }

        .oc-info .oc-about__name {
          color: #ECEAE5;
          font-family: ui-monospace, "SF Mono", Menlo, Consolas, monospace;
          font-size: 18px;
          font-weight: 500;
          letter-spacing: 0;
        }

        .oc-info .oc-about__pill {
          padding: 3px 8px;
          border: 1px solid #26282C;
          border-radius: 0;
          background: #212121;
          color: #9A968E;
          font-family: ui-monospace, "SF Mono", Menlo, Consolas, monospace;
          font-size: 10px;
          font-weight: 500;
          letter-spacing: 0.14em;
          text-transform: uppercase;
        }

        .oc-info .oc-about__pill[data-on="true"] {
          border-color: #D6E2F0;
          background: #D6E2F0;
          color: #0E0E0E;
        }

        .oc-info .oc-settings__group-label {
          margin-bottom: 8px;
          color: #9A968E;
          font-family: ui-monospace, "SF Mono", Menlo, Consolas, monospace;
          font-size: 10px;
          letter-spacing: 0.14em;
        }

        .oc-info .oc-settings__row {
          padding: 8px 0;
          gap: 12px;
          border-bottom: 1px solid #26282C;
          font-family: ui-monospace, "SF Mono", Menlo, Consolas, monospace;
          font-size: 12.5px;
        }

        .oc-info .oc-settings__row:last-of-type {
          border-bottom: 0;
        }

        .oc-info .oc-settings__row-key {
          color: #9A968E;
          font-family: ui-monospace, "SF Mono", Menlo, Consolas, monospace;
          font-size: 10px;
          letter-spacing: 0.14em;
        }

        .oc-info .oc-settings__row-value {
          color: #ECEAE5;
          font-family: ui-monospace, "SF Mono", Menlo, Consolas, monospace;
          font-size: 12.5px;
        }

        .oc-info .oc-settings__card-note {
          color: #9A968E;
          font-family: ui-monospace, "SF Mono", Menlo, Consolas, monospace;
          font-size: 11px;
        }

        .oc-info .oc-settings__card-error {
          color: #C47A6D;
          font-family: ui-monospace, "SF Mono", Menlo, Consolas, monospace;
          font-size: 12px;
        }
      `}</style>

      <div className="oc-info">
        {error ? (
          <div className="oc-settings__card">
            <div className="oc-settings__card-error">{error}</div>
          </div>
        ) : (
          <>
            <div className="oc-settings__card" style={{ paddingBottom: 20 }}>
              <div className="oc-about">
                <span className="oc-about__name">{details?.name ?? "…"}</span>
                <span className="oc-about__pill" data-on={details?.status === "running"}>
                  {details?.status ?? "asking"}
                </span>
              </div>
              {details ? (
                identityRows(details).map(([name, value]) => (
                  <Row key={name} name={name} value={value} />
                ))
              ) : (
                <div className="oc-settings__card-note">asking the machine…</div>
              )}
            </div>

            <div className="oc-settings__card">
              <div className="oc-settings__group-label">Hardware</div>
              {details ? (
                hardwareRows(details).map(([name, value]) => (
                  <Row key={name} name={name} value={value} />
                ))
              ) : (
                <div className="oc-settings__card-note">asking the machine…</div>
              )}
            </div>
          </>
        )}
      </div>
    </>
  );
}

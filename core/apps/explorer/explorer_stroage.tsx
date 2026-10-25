import { HugeiconsIcon } from "@hugeicons/react";
import HardDriveIcon from "@hugeicons/core-free-icons/HardDriveIcon";

import {
  explorerStorageStrip,
  type ExplorerStorage,
} from "./explorer_stroage.ts";



type ExplorerStorageProps = {
  storage: ExplorerStorage | null;
  isLoading: boolean;
};

export default function ExplorerStorageStrip({
  storage,
  isLoading,
}: ExplorerStorageProps) {
  const { isWaiting, percent, fillWidth, note } = explorerStorageStrip(
    storage,
    isLoading,
  );

  return (
    <>
      <button
        type="button"
        className="oc-finder__storage"
        aria-label="Storage"
        title={storage ? `${storage.name} (${storage.source})` : note}
      >
        <span className="oc-finder__storage-head">
          <HugeiconsIcon
            icon={HardDriveIcon}
            size={13}
            strokeWidth={1.6}
            aria-hidden="true"
          />
          <span className="oc-finder__storage-name">
            {storage ? storage.name : "Storage"}
          </span>
        </span>

        <span className="oc-finder__storage-bar"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={percent}
          aria-label="Used storage"
        >
          {storage ? (
            <span
              className="oc-finder__storage-fill"
              style={{ width: fillWidth }}
            />
          ) : isWaiting ? (
            <span className="oc-finder__storage-skeleton" />
          ) : null}
        </span>

        <span className="oc-finder__storage-note">
          {storage || !isWaiting ? (
            note
          ) : (
            <span className="oc-finder__storage-skeleton-line" />
          )}
        </span>
      </button>

      <style>{`
        .oc-finder__storage {
          position: relative;
          z-index: 1;
          display: flex;
          flex: 0 0 auto;
          flex-direction: column;
          align-items: stretch;
          gap: 6px;
          width: calc(100% - 20px);
          margin: 0 10px 12px;
          box-sizing: border-box;
          padding: 9px 12px 10px;
          border: 1px solid rgba(255, 255, 255, 0.22);
          border-radius: 14px;
          background: linear-gradient(
            180deg,
            rgba(255, 255, 255, 0.16),
            rgba(255, 255, 255, 0.05) 60%,
            rgba(255, 255, 255, 0.09)
          );
          box-shadow:
            0 10px 26px rgba(0, 0, 0, 0.16),
            inset 0 1px 0 rgba(255, 255, 255, 0.22);
          backdrop-filter: blur(26px) saturate(150%);
          -webkit-backdrop-filter: blur(26px) saturate(150%);
          color: rgba(255, 255, 255, 0.6);
          font-family: inherit;
          text-align: left;
          cursor: default;
          outline: none;
          transition:
            filter 110ms ease,
            transform 110ms ease;
        }

        .oc-finder__storage:hover {
          filter: brightness(1.08);
        }

        .oc-finder__storage:active {
          transform: scale(0.985);
        }

        .oc-finder__storage-head {
          display: flex;
          align-items: center;
          gap: 6px;
          color: rgba(255, 255, 255, 0.62);
        }

        .oc-finder__storage-name {
          overflow: hidden;
          color: rgba(255, 255, 255, 0.78);
          font-size: 11.5px;
          font-weight: 500;
          line-height: 1;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .oc-finder__storage-bar {
          position: relative;
          display: block;
          height: 5px;
          overflow: hidden;
          border-radius: 999px;background: rgba(23, 32, 51, 0.28);
          box-shadow: inset 0 1px 1px rgba(0, 0, 0, 0.12);
        }

        .oc-finder__storage-fill {
          display: block;
          height: 100%;
          border-radius: 999px;background: linear-gradient(90deg, #9db9ff, #4f7df1);
          box-shadow: 0 0 5px rgba(79, 125, 241, 0.35);
          transition: width 320ms cubic-bezier(0.2, 0.8, 0.2, 1);
        }

        .oc-finder__storage-note {
          display: block;
          min-height: 11px;
          color: rgba(255, 255, 255, 0.45);
          font-size: 10.5px;
          line-height: 1.1;
          white-space: nowrap;
        }

        .oc-finder__storage-skeleton,
        .oc-finder__storage-skeleton-line {
          display: block;
          border-radius: 999px;
          background: linear-gradient(
            90deg,
            rgba(255, 255, 255, 0.08),
            rgba(255, 255, 255, 0.22),
            rgba(255, 255, 255, 0.08)
          );
          background-size: 200% 100%;
          animation: oc-finder-shimmer 1.2s ease-in-out infinite;
        }

        .oc-finder__storage-skeleton {
          width: 100%;
          height: 100%;
        }

        .oc-finder__storage-skeleton-line {
          width: 68%;
          height: 9px;
        }

        @keyframes oc-finder-shimmer {
          from {
            background-position: 200% 0;
          }
          to {
            background-position: -200% 0;
          }
        }
      `}</style>
    </>
  );
}
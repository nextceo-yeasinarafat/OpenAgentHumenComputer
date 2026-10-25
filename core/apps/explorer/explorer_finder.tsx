import type { HTMLAttributes } from "react";
import type { IconSvgElement } from "@hugeicons/react";
import ComputerIcon from "@hugeicons/core-free-icons/ComputerIcon";
import Download01Icon from "@hugeicons/core-free-icons/Download01Icon";
import File01Icon from "@hugeicons/core-free-icons/File01Icon";

import type {
  FinderLocation,
  FinderLocationId,
} from "./explorer_finder.ts";
import type { ExplorerStorage } from "./explorer_stroage.ts";
import ExplorerStorageStrip from "./explorer_stroage.tsx";
import { ExplorerFolderGlyph } from "./explorer_folders.tsx";



const locationGlyphs: Record<FinderLocationId, IconSvgElement> = {
  downloads: Download01Icon,
  desktop: ComputerIcon,
  documents: File01Icon,
};

type ExplorerFinderProps = {
  locations: FinderLocation[];
  activeLocationId: FinderLocationId | null;
  storage: ExplorerStorage | null;
  isStorageLoading: boolean;
  onChooseLocation: (location: FinderLocation) => void;
  dragHandlers?: HTMLAttributes<HTMLDivElement>;
};

export default function ExplorerFinder({
  locations,
  activeLocationId,
  storage,
  isStorageLoading,
  onChooseLocation,
  dragHandlers,
}: ExplorerFinderProps) {
  return (
    <>
      <aside className="oc-finder__sidebar" aria-label="Finder sidebar">
        <div className="oc-finder__sidebar-header" {...dragHandlers}>
          <span className="oc-finder__sidebar-title">Files</span>
        </div>

        <div className="oc-finder__sidebar-scroll">
          <div className="oc-finder__sidebar-items">
            {locations.map((location) => {
              const isActive = location.id === activeLocationId;

              return (
                <button
                  key={location.id}
                  type="button"
                  className={`oc-finder__sidebar-item${
                    isActive ? " oc-finder__sidebar-item--active" : ""
                  }`}
                  aria-label={location.label}
                  aria-current={isActive ? "page" : undefined}
                  title={location.path}
                  onClick={() => onChooseLocation(location)}
                >
                  <span className="oc-finder__sidebar-icon">
                    <ExplorerFolderGlyph
                      size={19}
                      glyph={locationGlyphs[location.id]}
                      glyphSize={8}
                    />
                  </span>
                  <span className="oc-finder__sidebar-label">
                    {location.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <ExplorerStorageStrip storage={storage} isLoading={isStorageLoading} />
      </aside>

      <style>{`
        .oc-finder__sidebar {
          position: relative;
          display: flex;
          flex: 0 0 232px;
          flex-direction: column;
          align-self: stretch;
          box-sizing: border-box;
          width: 232px;
          min-height: 0;
          margin: 10px 12px 10px 10px;
          overflow: hidden;
          border: 1px solid rgba(255, 255, 255, 0.18);
          border-radius: 18px;
          background: linear-gradient(
            180deg,
            rgba(125, 211, 252, 0.2) 0%,
            rgba(56, 189, 248, 0.1) 34%,
            rgba(14, 165, 233, 0.03) 62%,
            rgba(14, 14, 14, 0) 88%
          );box-shadow:
            0 0 0 28px #0e0e0e,
            0 18px 44px rgba(0, 0, 0, 0.3);
          backdrop-filter: blur(10px) saturate(150%);
          -webkit-backdrop-filter: blur(10px) saturate(150%);
        }

        .oc-finder__sidebar-header {
          position: relative;
          z-index: 2;
          display: flex;
          flex: 0 0 56px;
          align-items: center;
          justify-content: flex-end;
          height: 56px;
          box-sizing: border-box;
          padding: 0 12px 0 84px;
          touch-action: none;
        }

        .oc-finder__sidebar-title {
          position: absolute;
          left: 50%;
          color: rgba(255, 255, 255, 0.92);
          font-size: 13px;
          font-weight: 600;
          letter-spacing: 0.01em;
          line-height: 1;
          transform: translate(-50%, -2px);
        }

        .oc-finder__sidebar-scroll {
          position: relative;
          z-index: 1;
          flex: 1 1 auto;
          min-height: 0;
          padding: 10px 10px 18px;
          overflow-y: auto;
          scrollbar-color: rgba(255, 255, 255, 0.16) transparent;
          scrollbar-width: thin;
        }

        .oc-finder__sidebar-items {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .oc-finder__sidebar-item {
          display: flex;
          align-items: center;
          gap: 9px;
          width: 100%;
          height: 30px;
          box-sizing: border-box;
          padding: 0 10px;
          border: 0;
          border-radius: 8px;
          background: transparent;
          color: rgba(255, 255, 255, 0.72);
          font-family: inherit;
          font-size: 12.5px;
          font-weight: 450;
          line-height: 1;
          text-align: left;
          cursor: default;
          transition:
            background 110ms ease,
            color 110ms ease;
        }

        .oc-finder__sidebar-item:hover {
          background: rgba(255, 255, 255, 0.07);
          color: rgba(255, 255, 255, 0.92);
        }

        .oc-finder__sidebar-item--active {
          background: rgba(255, 255, 255, 0.1);
          color: #ffffff;
        }

        .oc-finder__sidebar-icon {
          display: grid;
          flex: 0 0 19px;
          place-items: center;
          width: 19px;
          height: 19px;
        }

        .oc-finder__sidebar-label {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        @media (max-width: 760px) {
          .oc-finder__sidebar {
            flex-basis: 204px;
            width: 204px;
          }

          .oc-finder__sidebar-header {
            padding-left: 80px;
          }
        }
      `}</style>
    </>
  );
}
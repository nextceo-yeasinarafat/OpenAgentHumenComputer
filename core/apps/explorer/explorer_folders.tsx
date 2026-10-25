import { type IconSvgElement, HugeiconsIcon } from "@hugeicons/react";
import File01Icon from "@hugeicons/core-free-icons/File01Icon";
import FileCodeIcon from "@hugeicons/core-free-icons/FileCodeIcon";
import FileImageIcon from "@hugeicons/core-free-icons/FileImageIcon";
import FileMusicIcon from "@hugeicons/core-free-icons/FileMusicIcon";
import FileSpreadsheetIcon from "@hugeicons/core-free-icons/FileSpreadsheetIcon";
import FileTextIcon from "@hugeicons/core-free-icons/FileTextIcon";
import FileVideoIcon from "@hugeicons/core-free-icons/FileVideoIcon";
import FileZipIcon from "@hugeicons/core-free-icons/FileZipIcon";

import {
  explorerFileKind,
  explorerFileKindLabels,
  formatExplorerDate,
  formatExplorerSize,
  type ExplorerEntry,
  type ExplorerFileKind,
} from "./explorer_folders.ts";
import type { ExplorerViewMode } from "./explorer_style.ts";



const MACTAHOE_FOLDER_ICON = `${import.meta.env.BASE_URL}explorer_icons/mactahoe-folder.svg`;

const fileKindIcons: Record<ExplorerFileKind, IconSvgElement> = {
  folder: File01Icon,
  code: FileCodeIcon,
  text: FileTextIcon,
  image: FileImageIcon,
  audio: FileMusicIcon,
  video: FileVideoIcon,
  archive: FileZipIcon,
  spreadsheet: FileSpreadsheetIcon,
  file: File01Icon,
};

const SKELETON_TILES = 12;
const SKELETON_ROWS = 9;


export function ExplorerFolderGlyph({
  size = 48,
  glyph,
  glyphSize,
}: {
  size?: number;
  glyph?: IconSvgElement;
  glyphSize?: number;
}) {
  return (
    <span
      className="oc-finder__folder-icon"
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <img
        src={MACTAHOE_FOLDER_ICON}
        alt=""
        className="oc-finder__folder-icon-image"
        width={size}
        height={size}
        draggable={false}
      />
      {glyph ? (
        <HugeiconsIcon
          icon={glyph}
          size={glyphSize ?? Math.max(7, Math.round(size * 0.36))}
          strokeWidth={1.8}
          className="oc-finder__folder-icon-glyph"
          aria-hidden="true"
        />
      ) : null}
    </span>
  );
}export function ExplorerFileGlyph({
  kind,
  size = 32,
}: {
  kind: ExplorerFileKind;
  size?: number;
}) {
  return (
    <HugeiconsIcon
      icon={fileKindIcons[kind]}
      size={size}
      strokeWidth={1.5}
      className="oc-finder__file-icon"
      aria-hidden="true"
    />
  );
}

type ExplorerFoldersProps = {
  entries: ExplorerEntry[];
  isLoading: boolean;
  error: string | null;
  viewMode: ExplorerViewMode;
  
  cutPath: string | null;
  onOpenEntry: (entry: ExplorerEntry) => void;
  onContextMenu: (
    entry: ExplorerEntry | null,
    x: number,
    y: number,
  ) => void;
  onRetry: () => void;
};

export default function ExplorerFolders({
  entries,
  isLoading,
  error,
  viewMode,
  cutPath,
  onOpenEntry,
  onContextMenu,
  onRetry,
}: ExplorerFoldersProps) {
  const renderGrid = () => (
    <div className="oc-finder__grid">
      {entries.map((entry) => {
        const kind = entry.isDirectory ? "folder" : explorerFileKind(entry.name);

        return (
          <div
            className={`oc-finder__grid-card${
              entry.path === cutPath ? " oc-finder__grid-card--cut" : ""
            }`}
            key={entry.path}
            title={entry.name}
            onDoubleClick={() => onOpenEntry(entry)}
            onContextMenu={(event) => {
              event.preventDefault();
              event.stopPropagation();
              onContextMenu(entry, event.clientX, event.clientY);
            }}
          >
            <span className="oc-finder__grid-preview">
              {entry.isDirectory ? (
                <ExplorerFolderGlyph size={48} />
              ) : (
                <span className="oc-finder__grid-file">
                  <ExplorerFileGlyph kind={kind} size={32} />
                </span>
              )}
            </span>
            <span className="oc-finder__grid-name">{entry.name}</span>
            <span className="oc-finder__grid-meta">
              {entry.isDirectory
                ? "Folder"
                : `${explorerFileKindLabels[kind]} · ${formatExplorerSize(entry.size)}`}
            </span>
          </div>
        );
      })}
    </div>
  );

  const renderList = () => (
    <div className="oc-finder__list">
      <div className="oc-finder__list-header">
        <span>Name</span>
        <span>Date Modified</span>
        <span>Size</span>
        <span>Kind</span>
      </div>

      {entries.map((entry) => {
        const kind = entry.isDirectory ? "folder" : explorerFileKind(entry.name);

        return (
          <div
            className={`oc-finder__list-row${
              entry.path === cutPath ? " oc-finder__list-row--cut" : ""
            }`}
            key={entry.path}
            title={entry.name}
            onDoubleClick={() => onOpenEntry(entry)}
            onContextMenu={(event) => {
              event.preventDefault();
              event.stopPropagation();
              onContextMenu(entry, event.clientX, event.clientY);
            }}
          >
            <span className="oc-finder__list-name">
              {entry.isDirectory ? (
                <ExplorerFolderGlyph size={22} />
              ) : (
                <span className="oc-finder__list-file">
                  <ExplorerFileGlyph kind={kind} size={17} />
                </span>
              )}
              <span className="oc-finder__list-label">{entry.name}</span>
              {entry.isSymbolicLink ? (
                <span className="oc-finder__list-link">link</span>
              ) : null}
            </span>
            <span className="oc-finder__list-meta">
              {formatExplorerDate(entry.modified)}
            </span>
            <span className="oc-finder__list-meta">
              {entry.isDirectory ? "--" : formatExplorerSize(entry.size)}
            </span>
            <span className="oc-finder__list-meta">
              {explorerFileKindLabels[kind]}
            </span>
          </div>
        );
      })}
    </div>
  );

  const renderSkeleton = () =>
    viewMode === "list" ? (
      <div className="oc-finder__list" aria-hidden="true">
        <div className="oc-finder__list-header">
          <span>Name</span>
          <span>Date Modified</span>
          <span>Size</span>
          <span>Kind</span>
        </div>

        {Array.from({ length: SKELETON_ROWS }, (_, index) => (
          <div className="oc-finder__list-row" key={index}>
            <span className="oc-finder__list-name">
              <span className="oc-finder__skeleton-icon" />
              <span className="oc-finder__skeleton-line" />
            </span>
            <span className="oc-finder__skeleton-line" />
            <span className="oc-finder__skeleton-line" />
            <span className="oc-finder__skeleton-line" />
          </div>
        ))}
      </div>
    ) : (
      <div className="oc-finder__grid" aria-hidden="true">
        {Array.from({ length: SKELETON_TILES }, (_, index) => (
          <div className="oc-finder__grid-card" key={index}>
            <span className="oc-finder__grid-preview">
              <span className="oc-finder__skeleton-tile" />
            </span>
            <span className="oc-finder__skeleton-line" />
          </div>
        ))}
      </div>
    );

  return (
    <>
      <div
        className="oc-finder__content"
        aria-busy={isLoading || undefined}
        aria-label="Folder contents"
        onContextMenu={(event) => {
          event.preventDefault();
          onContextMenu(null, event.clientX, event.clientY);
        }}
      >
        {error ? (
          <div className="oc-finder__state">
            <span className="oc-finder__state-title">
              The computer did not answer
            </span>
            <span className="oc-finder__state-detail">{error}</span>

            <button
              type="button"
              className="oc-finder__state-button"
              onClick={onRetry}
            >
              Try again
            </button>
          </div>
        ) : isLoading ? (
          renderSkeleton()
        ) : entries.length === 0 ? (
          <div className="oc-finder__state">
            <span className="oc-finder__state-title">This folder is empty</span>
          </div>
        ) : viewMode === "list" ? (
          renderList()
        ) : (
          renderGrid()
        )}
      </div>

      <style>{`
        .oc-finder__content {
          position: relative;
          display: flex;
          flex: 1 1 auto;
          flex-direction: column;
          min-width: 0;
          min-height: 0;
          padding: 0 16px 18px;
          overflow: auto;
          background: #0e0e0e;
          scrollbar-color: rgba(255, 255, 255, 0.14) transparent;
          scrollbar-width: thin;
        }

        .oc-finder__state {
          display: flex;
          flex: 1;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 60px 20px;
          color: rgba(255, 255, 255, 0.45);
          font-size: 12.5px;
          text-align: center;
        }

        .oc-finder__state-title {
          color: rgba(255, 255, 255, 0.7);
          font-size: 13px;
        }

        .oc-finder__state-detail {
          max-width: 420px;
          font-size: 11.5px;
          line-height: 1.5;
        }

        .oc-finder__state-button {
          margin-top: 6px;
          padding: 6px 14px;
          border: 1px solid rgba(255, 255, 255, 0.18);
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.06);
          color: rgba(255, 255, 255, 0.85);
          font-family: inherit;
          font-size: 12px;
          cursor: default;
        }

        .oc-finder__state-button:hover {
          background: rgba(255, 255, 255, 0.12);
        }

        .oc-finder__folder-icon {
          position: relative;
          display: inline-flex;
          flex: 0 0 auto;
          align-items: center;
          justify-content: center;
        }

        .oc-finder__folder-icon-image {
          display: block;
          width: 100%;
          height: 100%;
          object-fit: contain;
          user-select: none;
        }

        .oc-finder__folder-icon-glyph {
          position: absolute;
          top: 55%;
          left: 50%;
          color: rgba(255, 255, 255, 0.92);
          filter: drop-shadow(0 1px 1px rgba(0, 0, 0, 0.22));
          transform: translate(-50%, -50%);
          pointer-events: none;
        }

        .oc-finder__file-icon {
          color: rgba(255, 255, 255, 0.62);
        }

        .oc-finder__list {
          width: 100%;
          padding-top: 10px;
        }

        .oc-finder__list-header,
        .oc-finder__list-row {
          display: grid;
          grid-template-columns: minmax(0, 1fr) 150px 78px 110px;
          align-items: center;
          gap: 10px;
        }

        .oc-finder__list-header {
          padding: 8px 10px 7px;
          border-radius: 8px;
          background: rgba(255, 255, 255, 0.025);
          color: rgba(255, 255, 255, 0.35);
          font-size: 10.5px;
        }

        .oc-finder__list-row {
          min-height: 36px;
          box-sizing: border-box;
          padding: 7px 10px;
          border: 0;
          border-radius: 8px;
          color: rgba(255, 255, 255, 0.82);
          font-size: 12px;
          cursor: default;
        }

        .oc-finder__list-row:hover {
          background: rgba(255, 255, 255, 0.05);
        }

        .oc-finder__list-row--cut .oc-finder__list-name,
        .oc-finder__list-row--cut .oc-finder__list-meta {
          opacity: 0.45;
        }

        .oc-finder__list-name {
          display: flex;
          align-items: center;
          gap: 9px;
          min-width: 0;
        }

        .oc-finder__list-label {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .oc-finder__list-link {
          flex: 0 0 auto;
          padding: 1px 6px;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.08);
          color: rgba(255, 255, 255, 0.5);
          font-size: 9.5px;
        }

        .oc-finder__list-file {
          display: grid;
          flex: 0 0 auto;
          place-items: center;
          width: 22px;
          height: 22px;
        }

        .oc-finder__list-meta {
          overflow: hidden;
          color: rgba(255, 255, 255, 0.42);
          font-size: 11px;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .oc-finder__grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(104px, 1fr));
          align-content: start;
          gap: 16px 8px;
          padding: 20px 4px 0;
        }

        .oc-finder__grid-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          box-sizing: border-box;
          padding: 8px 6px 10px;
          border: 0;
          border-radius: 12px;
          background: transparent;
          cursor: default;
        }

        .oc-finder__grid-card:hover {
          background: rgba(255, 255, 255, 0.05);
        }

        .oc-finder__grid-card--cut .oc-finder__grid-preview,
        .oc-finder__grid-card--cut .oc-finder__grid-name,
        .oc-finder__grid-card--cut .oc-finder__grid-meta {
          opacity: 0.45;
        }

        .oc-finder__grid-preview {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 54px;
        }

        .oc-finder__grid-file {
          display: grid;
          place-items: center;
          width: 46px;
          height: 46px;
        }

        .oc-finder__grid-name {
          max-width: 100%;
          overflow: hidden;
          color: rgba(255, 255, 255, 0.86);
          font-size: 11.5px;
          text-align: center;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .oc-finder__grid-meta {
          max-width: 100%;
          overflow: hidden;
          color: rgba(255, 255, 255, 0.4);
          font-size: 10px;
          text-align: center;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .oc-finder__skeleton-tile {
          display: block;
          width: 44px;
          height: 38px;
          border-radius: 7px;
        }

        .oc-finder__skeleton-icon {
          display: block;
          flex: 0 0 auto;
          width: 22px;
          height: 18px;
          margin-right: 9px;
          border-radius: 5px;
        }

        .oc-finder__skeleton-line {
          display: block;
          width: 42%;
          height: 8px;
          border-radius: 999px;
        }

        .oc-finder__skeleton-tile,
        .oc-finder__skeleton-icon,
        .oc-finder__skeleton-line {
          background: linear-gradient(
            90deg,
            rgba(255, 255, 255, 0.05),
            rgba(255, 255, 255, 0.14),
            rgba(255, 255, 255, 0.05)
          );
          background-size: 200% 100%;
          animation: oc-finder-shimmer 1.2s ease-in-out infinite;
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
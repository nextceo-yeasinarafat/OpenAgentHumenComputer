import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  explorerHome,
  fetchExplorerFolder,
  type ExplorerEntry,
  type ExplorerFolder,
} from "../explorer/explorer_folders.ts";
import { formatFileSize, uploadFileToComputer } from "./chromium_filepicker.ts";



type ChromiumFilePickerProps = {
  
  mode: string;
  
  onCancel: () => void;
  
  onChoose: (paths: string[]) => void;
};

export default function ChromiumFilePicker({
  mode,
  onCancel,
  onChoose,
}: ChromiumFilePickerProps) {
  const multiple = mode === "selectMultiple";

  const [path, setPath] = useState(explorerHome());
  const [folder, setFolder] = useState<ExplorerFolder | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [round, setRound] = useState(0);

  const uploadRef = useRef<HTMLInputElement | null>(null);

  
  
  useEffect(() => {
    let cancelled = false;

    setBusy(true);

    void fetchExplorerFolder(path || undefined)
      .then((next) => {
        if (cancelled) return;
        setFolder(next);
        setError(null);
        if (!path) setPath(next.path);
      })
      .catch((cause) => {
        if (!cancelled) setError(String(cause));
      })
      .finally(() => {
        if (!cancelled) setBusy(false);
      });

    return () => {
      cancelled = true;
    };
  }, [path, round]);

  
  useEffect(() => {
    setSelected([]);
  }, [path]);

  const chooseEntry = useCallback(
    (entry: ExplorerEntry) => {
      if (entry.isDirectory) {
        setPath(entry.path);
        return;
      }

      setSelected((current) => {
        if (!multiple) return [entry.path];
        if (current.includes(entry.path)) {
          return current.filter((one) => one !== entry.path);
        }
        return [...current, entry.path];
      });
    },
    [multiple],
  );

  const upload = useCallback(
    async (files: FileList | null) => {
      if (!files || files.length === 0) return;

      setBusy(true);
      setError(null);

      try {
        const uploaded = [];

        for (const file of Array.from(files)) {
          uploaded.push(await uploadFileToComputer(file, path));
        }

        setRound((count) => count + 1);
        setSelected(uploaded.map((one) => one.path).filter(Boolean));
      } catch (cause) {
        setError(String(cause));
      } finally {
        setBusy(false);
      }
    },
    [path],
  );

  const home = useMemo(() => explorerHome(), []);
  const chosen = selected.length;

  return (
    <div className="oc-files" role="dialog" aria-label="Choose a file from the computer">
      <header className="oc-files__head">
        <span className="oc-files__title">
          {multiple ? "Choose files from the computer" : "Choose a file from the computer"}
        </span>
        <button
          type="button"
          className="oc-files__close"
          onClick={onCancel}
          aria-label="Cancel"
          title="Cancel"
        >
          ×
        </button>
      </header>

      <div className="oc-files__path">
        <button
          type="button"
          className="oc-files__step"
          onClick={() => setPath(home)}
          disabled={!home || path === home}
        >
          Home
        </button>
        <button
          type="button"
          className="oc-files__step"
          onClick={() => folder?.parent && setPath(folder.parent)}
          disabled={!folder?.parent}
        >
          Up
        </button>
        <span className="oc-files__where" title={path}>
          {path || "…"}
        </span>
      </div>

      {error ? <div className="oc-files__error">{error}</div> : null}

      <div className="oc-files__list">
        {folder?.entries.map((entry) => (
          <button
            key={entry.path}
            type="button"
            className="oc-files__row"
            data-selected={selected.includes(entry.path)}
            onClick={() => chooseEntry(entry)}
            onDoubleClick={() => {
              if (!entry.isDirectory) onChoose([entry.path]);
            }}
            title={entry.path}
          >
            <span className="oc-files__mark" data-dir={entry.isDirectory}>
              {entry.isDirectory ? "DIR" : "FILE"}
            </span>
            <span className="oc-files__name">{entry.name}</span>
            <span className="oc-files__size">
              {entry.isDirectory ? "" : formatFileSize(entry.size)}
            </span>
          </button>
        ))}

        {folder && folder.entries.length === 0 ? (
          <div className="oc-files__empty">this folder is empty</div>
        ) : null}

        {!folder && busy ? (
          <div className="oc-files__empty">reading the folder…</div>
        ) : null}
      </div>

      <footer className="oc-files__foot">
        <input
          ref={uploadRef}
          type="file"
          multiple
          hidden
          onChange={(event) => {
            const files = event.target.files;
            event.target.value = "";
            void upload(files);
          }}
        />
        <button
          type="button"
          className="oc-files__button"
          onClick={() => uploadRef.current?.click()}
          disabled={busy}
        >
          Upload from this computer
        </button>

        <span className="oc-files__count">
          {chosen ? `${chosen} chosen` : "choose a file"}
        </span>

        <button type="button" className="oc-files__button" onClick={onCancel}>
          Cancel
        </button>
        <button
          type="button"
          className="oc-files__button oc-files__button--primary"
          onClick={() => onChoose(selected)}
          disabled={chosen === 0 || busy}
        >
          Choose
        </button>
      </footer>

      <style>{`
        .oc-files {
          position: absolute;
          inset: 0;
          z-index: 9;
          display: flex;
          flex-direction: column;
          min-height: 0;
          padding: 14px;
          border: 1px solid #26282C;
          border-radius: 0;
          background: #0E0E0E;
          color: #FFFFFF;
          font-family: ui-monospace, "SF Mono", Menlo, Consolas, monospace;
          font-size: 11px;
          letter-spacing: 0.02em;
          animation: oc-files-in 180ms ease-out;
        }

        @keyframes oc-files-in {
          from {
            opacity: 0;
            transform: translateY(4px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .oc-files__head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding-bottom: 10px;
        }

        .oc-files__title {
          font-size: 11px;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: rgba(255, 255, 255, 0.72);
        }

        .oc-files__close {
          display: grid;
          place-items: center;
          width: 22px;
          height: 22px;
          padding: 0;
          border: 1px solid #26282C;
          border-radius: 0;
          background: #121212;
          color: rgba(255, 255, 255, 0.7);
          font-size: 13px;
          line-height: 1;
          cursor: pointer;
        }

        .oc-files__close:hover {
          border-color: #3A3D42;
          color: #FFFFFF;
        }

        .oc-files__path {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 0 10px;
          border-top: 1px solid #1B1D21;
        }

        .oc-files__step {
          flex: 0 0 auto;
          padding: 5px 10px;
          border: 1px solid #26282C;
          border-radius: 0;
          background: #121212;
          color: rgba(255, 255, 255, 0.78);
          font: inherit;
          cursor: pointer;
        }

        .oc-files__step:disabled {
          opacity: 0.45;
          cursor: default;
        }

        .oc-files__where {
          flex: 1 1 auto;
          min-width: 0;
          overflow: hidden;
          color: rgba(255, 255, 255, 0.5);
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .oc-files__error {
          margin-bottom: 8px;
          padding: 8px 10px;
          border-left: 2px solid #F40000;
          background: #1A1010;
          color: #FFB4B4;
          line-height: 1.5;
        }

        .oc-files__list {
          flex: 1 1 auto;
          min-height: 0;
          overflow: auto;
          border: 1px solid #1B1D21;
          background: #0B0B0B;
        }

        .oc-files__row {
          display: flex;
          align-items: center;
          gap: 10px;
          width: 100%;
          padding: 8px 10px;
          border: 0;
          border-bottom: 1px solid #141619;
          background: transparent;
          color: rgba(255, 255, 255, 0.86);
          font: inherit;
          text-align: left;
          cursor: pointer;
        }

        .oc-files__row:hover {
          background: #141619;
        }

        .oc-files__row[data-selected="true"] {
          background: rgba(67, 99, 246, 0.16);
        }

        .oc-files__mark {
          flex: 0 0 auto;
          width: 34px;
          color: rgba(255, 255, 255, 0.38);
          font-size: 9px;
          letter-spacing: 0.08em;
        }

        .oc-files__mark[data-dir="true"] {
          color: #4363F6;
        }

        .oc-files__name {
          flex: 1 1 auto;
          min-width: 0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .oc-files__size {
          flex: 0 0 auto;
          color: rgba(255, 255, 255, 0.38);
          font-size: 10px;
        }

        .oc-files__empty {
          padding: 16px 12px;
          color: rgba(255, 255, 255, 0.42);
        }

        .oc-files__foot {
          display: flex;
          align-items: center;
          gap: 8px;
          padding-top: 12px;
        }

        .oc-files__button {
          flex: 0 0 auto;
          padding: 7px 12px;
          border: 1px solid #26282C;
          border-radius: 0;
          background: #121212;
          color: rgba(255, 255, 255, 0.82);
          font: inherit;
          cursor: pointer;
        }

        .oc-files__button:hover:not(:disabled) {
          border-color: #3A3D42;
          background: #17191D;
        }

        .oc-files__button:disabled {
          opacity: 0.45;
          cursor: default;
        }

        .oc-files__button--primary {
          border-color: #4363F6;
          background: #4363F6;
          color: #FFFFFF;
        }

        .oc-files__button--primary:hover:not(:disabled) {
          background: #5271FF;
        }

        .oc-files__count {
          flex: 1 1 auto;
          min-width: 0;
          overflow: hidden;
          color: rgba(255, 255, 255, 0.42);
          text-align: right;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
      `}</style>
    </div>
  );
}

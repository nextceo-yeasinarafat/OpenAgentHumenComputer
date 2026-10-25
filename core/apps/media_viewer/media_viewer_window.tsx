import { useCallback, useEffect, useRef, useState } from "react";

import { MEDIA_LABEL, mediaKindOf, mediaUrl } from "./tools/media_source.ts";
import type { MediaViewerController } from "./media_viewer_window.ts";



type MediaViewerWindowProps = {
  controller: MediaViewerController;
  zIndex?: number;
  onActivate?: () => void;
};

export default function MediaViewerWindow({
  controller,
  zIndex,
  onActivate,
}: MediaViewerWindowProps) {
  const { isOpen, file, position, size, close, move, resize } = controller;

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  const kind = file ? mediaKindOf(file.name) : null;

  
  useEffect(() => {
    setError(null);
    setIsLoading(true);
  }, [file?.path]);

  
  
  
  useEffect(() => {
    if (kind === "pdf") setIsLoading(false);
  }, [kind, file?.path]);

  const opened = useCallback(() => {
    setIsLoading(false);
    setError(null);
  }, []);

  const failed = useCallback(() => {
    setIsLoading(false);
    setError("this file cannot be shown here");
  }, []);

  if (!isOpen || !file || !kind) return null;

  const src = mediaUrl(file.path);

  return (
    <section
      className="oc-media"
      style={{
        left: position.x,
        top: position.y,
        width: size.width,
        height: size.height,
        zIndex: zIndex ?? 50,
      }}
      aria-label={`${MEDIA_LABEL[kind]}: ${file.name}`}
      onPointerDown={onActivate}
    >
      <header
        className="oc-media__bar"
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
        <span className="oc-media__lights" aria-hidden="true">
          <button
            type="button"
            className="oc-media__light"
            aria-label="Close viewer"
            title="Close"
            onClick={close}
          >
            <span className="oc-media__glyph">×</span>
          </button>
        </span>

        <span className="oc-media__title" title={file.path}>
          {file.name}
        </span>

        <span className="oc-media__kind">{MEDIA_LABEL[kind]}</span>
      </header>

      <div className="oc-media__body">
        {kind === "image" ? (
          <img
            className="oc-media__image"
            src={src}
            alt={file.name}
            onLoad={opened}
            onError={failed}
            draggable={false}
          />
        ) : null}

        {kind === "pdf" ? (
          <iframe className="oc-media__frame" src={src} title={file.name} />
        ) : null}

        {kind === "video" ? (
          <video
            className="oc-media__video"
            src={src}
            controls
            playsInline
            preload="metadata"
            onLoadedMetadata={opened}
            onError={failed}
          />
        ) : null}

        {kind === "sound" ? (
          <div className="oc-media__sound">
            <span className="oc-media__sound-mark" aria-hidden="true">
              ♪
            </span>
            <audio
              className="oc-media__audio"
              src={src}
              controls
              preload="metadata"
              onLoadedMetadata={opened}
              onError={failed}
            />
          </div>
        ) : null}

        {isLoading ? <div className="oc-media__state">opening…</div> : null}
        {error ? <div className="oc-media__state oc-media__state--bad">{error}</div> : null}
      </div>

      <footer className="oc-media__foot">
        <span className="oc-media__path" title={file.path}>
          {file.path}
        </span>
      </footer>

      <div
        className="oc-media__grip"
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
        .oc-media {
          position: fixed;
          display: flex;
          flex-direction: column;
          min-width: 360px;
          min-height: 240px;
          box-sizing: border-box;
          overflow: hidden;
          border: 1px solid #26282C;
          border-radius: 0;
          background: #0E0E0E;
          color: #FFFFFF;
          font-family: ui-monospace, "SF Mono", Menlo, Consolas, monospace;
          font-size: 11px;
          box-shadow: 0 32px 90px rgba(0, 0, 0, 0.6);
          animation: oc-media-open 170ms ease-out;
        }

        @keyframes oc-media-open {
          from {
            opacity: 0;
            transform: translateY(6px) scale(0.99);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        .oc-media__bar {
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

        .oc-media__lights {
          display: flex;
          flex: 0 0 auto;
          align-items: center;
        }

        .oc-media__light {
          display: grid;
          place-items: center;
          width: 13px;
          height: 13px;
          padding: 0;
          border: 0;
          border-radius: 50%;
          appearance: none;
          background: #ff5f57;
          color: rgba(0, 0, 0, 0.8);
          font-size: 9px;
          font-weight: 700;
          line-height: 1;
          cursor: pointer;
        }

        .oc-media__glyph {
          opacity: 0;
          transition: opacity 120ms ease;
        }

        .oc-media__light:hover .oc-media__glyph,
        .oc-media__light:focus-visible .oc-media__glyph {
          opacity: 1;
        }

        .oc-media__title {
          flex: 1 1 auto;
          min-width: 0;
          overflow: hidden;
          color: rgba(255, 255, 255, 0.82);
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .oc-media__kind {
          flex: 0 0 auto;
          color: rgba(255, 255, 255, 0.32);
          font-size: 10px;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        .oc-media__body {
          position: relative;
          display: grid;
          flex: 1 1 auto;
          min-height: 0;
          place-items: center;
          background: #0B0B0B;
          overflow: hidden;
        }

        .oc-media__image,
        .oc-media__video {
          max-width: 100%;
          max-height: 100%;
          width: auto;
          height: auto;
          object-fit: contain;
        }

        .oc-media__frame {
          width: 100%;
          height: 100%;
          border: 0;
          background: #0B0B0B;
        }

        .oc-media__sound {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 18px;
          padding: 24px;
        }

        .oc-media__sound-mark {
          display: grid;
          place-items: center;
          width: 84px;
          height: 84px;
          border: 1px solid #26282C;
          border-radius: 50%;
          background: #121212;
          color: #4363F6;
          font-size: 34px;
        }

        .oc-media__audio {
          width: min(420px, 70vw);
        }

        .oc-media__state {
          position: absolute;
          inset: auto 0 0 0;
          padding: 8px 12px;
          background: rgba(14, 14, 14, 0.86);
          color: rgba(255, 255, 255, 0.5);
        }

        .oc-media__state--bad {
          border-top: 1px solid #F40000;
          color: #FFB4B4;
        }

        .oc-media__foot {
          display: flex;
          flex: 0 0 26px;
          align-items: center;
          padding: 0 12px;
          border-top: 1px solid #1B1D21;
          background: #121212;
          color: rgba(255, 255, 255, 0.4);
          font-size: 10px;
        }

        .oc-media__path {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .oc-media__grip {
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

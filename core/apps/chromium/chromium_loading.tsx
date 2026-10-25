

import { CHROMIUM_LOADING_FADE_MS } from "./chromium_loading.ts";

type ChromiumLoadingProps = {
  
  leaving?: boolean;
};

export default function ChromiumLoading({ leaving = false }: ChromiumLoadingProps) {
  return (
    <div
      className="oc-chromium__loading"
      data-leaving={leaving}
      role="status"
      aria-label="Opening the browser"
      style={{ transitionDuration: `${CHROMIUM_LOADING_FADE_MS}ms` }}
    >
      <img
        className="oc-chromium__loading-mark"
        src="/chromium_loading/chromium_loading.svg"
        alt=""
        width={96}
        height={96}
        draggable={false}
      />

      <style>{`
        .oc-chromium__loading {
          position: absolute;
          inset: 0;
          z-index: 2;
          display: grid;
          place-items: center;
          background: #0e0e0e;
          opacity: 1;
          transition-property: opacity;
          transition-timing-function: ease;
          animation: oc-chromium-loading-in 220ms ease-out;
        }.oc-chromium__loading[data-leaving="true"] {
          opacity: 0;
          pointer-events: none;
        }

        .oc-chromium__loading-mark {
          display: block;
          width: 96px;
          height: 96px;
          border-radius: 50%;
          opacity: 0.92;
          user-select: none;
          -webkit-user-drag: none;
          animation: oc-chromium-loading-breathe 2.4s ease-in-out infinite;
        }

        @keyframes oc-chromium-loading-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes oc-chromium-loading-breathe {
          0%,
          100% {
            opacity: 0.82;
            transform: scale(1);
          }
          50% {
            opacity: 1;
            transform: scale(1.04);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .oc-chromium__loading,
          .oc-chromium__loading-mark {
            animation: none;
          }
        }
      `}</style>
    </div>
  );
}

import type { CoreSettingsController } from "./core_settings.ts";
import SettingBer from "./settings_left.tsx";
import type { SettingBarController } from "./settings_left.ts";
import SettingsApiToken from "./settings_api_token.tsx";
import SettingsMcp from "./settings_mcp.tsx";
import SystemInfo from "./system_info.tsx";
import SettingsAnalyse from "./settings_analyse.tsx";
import SettingsRestart from "./settings_restart.tsx";



type CoreSettingsProps = {
  controller: CoreSettingsController;
  
  bar: SettingBarController;
  zIndex?: number;
  onActivate?: () => void;
};

export default function CoreSettings({
  controller,
  bar,
  zIndex,
  onActivate,
}: CoreSettingsProps) {
  const {
    isOpen,
    isMinimized,
    isMinimizing,
    isClosing,
    position,
    size,
    isDragging,
    isResizing,
    close,
    minimize,
    dragHandlers,
    resizeHandlers,
  } = controller;

  const { sections, activeSection, chooseSection } = bar;

  if (!isOpen) return null;

  
  
  const className = [
    "oc-settings",
    isMinimized ? "oc-settings--minimized" : "",
    isDragging ? "oc-settings--dragging" : "",
    isResizing ? "oc-settings--resizing" : "",
    isMinimizing ? "oc-settings--minimizing" : "",
    isClosing ? "oc-settings--closing" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <>
      <style>{`
        .oc-settings {
          position: fixed;
          top: 0;
          left: 0;
          display: flex;
          flex-direction: column;
          box-sizing: border-box;
          overflow: hidden;
          border: 0;
          border-radius: 20px;
          background: transparent;
          box-shadow:
            0 42px 110px rgba(0, 0, 0, 0.68),
            0 12px 32px rgba(0, 0, 0, 0.42);
          color: #fff;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
          text-rendering: optimizeLegibility;
          user-select: none;
        }

        .oc-settings--maximized {
          border-radius: 0;
        }

        .oc-settings--minimized,
        .oc-settings--closing {
          pointer-events: none;
        }

        .oc-settings__shell {
          position: relative;
          z-index: 1;
          display: flex;
          flex: 1 1 auto;
          min-height: 0;
          box-sizing: border-box;
        }

        .oc-settings__main {
          position: relative;
          display: flex;
          flex: 1 1 auto;
          flex-direction: column;
          min-width: 0;
          min-height: 0;
          background:
            radial-gradient(
              90% 64% at 100% 0%,
              rgba(56, 189, 248, 0.055) 0%,
              rgba(56, 189, 248, 0) 62%
            ),
            #0e0e0e;
        }

        .oc-settings__toolbar {
          display: flex;
          flex: 0 0 56px;
          align-items: center;
          gap: 12px;
          height: 56px;
          box-sizing: border-box;
          padding: 0 16px;
          cursor: default;
          touch-action: none;
        }

        .oc-settings__toolbar-title {
          overflow: hidden;
          color: rgba(255, 255, 255, 0.82);
          font-size: 13px;
          font-weight: 600;
          letter-spacing: 0.01em;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .oc-settings__window-controls {
          position: absolute;
          top: 32px;
          left: 16px;
          z-index: 5;
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 4px 8px;
          border: 0;
          border-radius: 999px;
          background: linear-gradient(
            180deg,
            rgba(255, 255, 255, 0.11),
            rgba(255, 255, 255, 0.025) 55%,
            rgba(255, 255, 255, 0.05)
          );
          box-shadow:
            inset 0 1px 0 rgba(255, 255, 255, 0.08),
            0 4px 12px rgba(0, 0, 0, 0.28);
          backdrop-filter: blur(10px) saturate(160%) brightness(1.05);
          -webkit-backdrop-filter: blur(10px) saturate(160%) brightness(1.05);
        }

        .oc-settings__light {
          display: grid;
          place-items: center;
          width: 13px;
          height: 13px;
          padding: 0;
          border: 0;
          border-radius: 50%;
          appearance: none;
          box-shadow:
            inset 0 0 0 0.5px rgba(0, 0, 0, 0.18),
            0 1px 2px rgba(0, 0, 0, 0.25);
          color: rgba(0, 0, 0, 0.8);
          font-size: 9.5px;
          font-weight: 700;
          line-height: 1;
          cursor: default;
          transition:
            filter 120ms ease,
            transform 120ms ease;
        }

        .oc-settings__light:hover {
          filter: brightness(1.12);
        }

        .oc-settings__light:active {
          transform: scale(0.94);
        }

        .oc-settings__light-glyph {
          opacity: 0;
          transition: opacity 120ms ease;
        }

        .oc-settings__light:hover .oc-settings__light-glyph,
        .oc-settings__light:focus-visible .oc-settings__light-glyph {
          opacity: 1;
        }

        .oc-settings__light--close { background: #ff5f57; }
        .oc-settings__light--minimize { background: #febc2e; }
        .oc-settings__light--maximize { background: #28c840; }

        .oc-settings__pane {
          position: relative;
          flex: 1 1 auto;
          min-height: 0;
          box-sizing: border-box;
          padding: 24px 26px 26px;
          overflow-y: auto;
          border-top: 0.5px solid rgba(255, 255, 255, 0.055);
          scrollbar-color: rgba(255, 255, 255, 0.16) transparent;
          scrollbar-width: thin;
        }

        .oc-settings__card {
          box-sizing: border-box;
          margin-bottom: 14px;
          padding: 18px 20px;
          border: 0.5px solid rgba(255, 255, 255, 0.09);
          border-radius: 14px;
          background: linear-gradient(
            180deg,
            rgba(255, 255, 255, 0.05) 0%,
            rgba(255, 255, 255, 0.022) 100%
          );
          box-shadow:
            inset 0 1px 0 rgba(255, 255, 255, 0.05),
            0 10px 28px rgba(0, 0, 0, 0.16);
        }

        .oc-settings__card-head {
          display: flex;
          align-items: baseline;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 12px;
        }

        .oc-settings__card-title {
          color: #ffffff;
          font-size: 13.5px;
          font-weight: 600;
          letter-spacing: 0.01em;
        }

        .oc-settings__card-note {
          color: rgba(255, 255, 255, 0.45);
          font-size: 11.5px;
          text-align: right;
        }

        .oc-settings__card-foot {
          margin-top: 12px;
          color: rgba(255, 255, 255, 0.4);
          font-size: 11.5px;
          line-height: 1.6;
        }

        .oc-settings__card-error {
          margin-top: 10px;
          color: #c47a6d;
          font-size: 12px;
        }

        .oc-about {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 14px;
          padding-bottom: 14px;
          border-bottom: 0.5px solid rgba(255, 255, 255, 0.08);
        }

        .oc-about__name {
          overflow: hidden;
          color: #ffffff;
          font-size: 19px;
          font-weight: 600;
          letter-spacing: -0.01em;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .oc-about__pill {
          flex: none;
          padding: 3px 9px;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.08);
          color: rgba(255, 255, 255, 0.6);
          font-size: 10.5px;
          font-weight: 500;
          letter-spacing: 0.03em;
          text-transform: capitalize;
        }

        .oc-about__pill[data-on="true"] {
          background: rgba(48, 209, 88, 0.14);
          color: #30d158;
        }

        .oc-settings__group-label {
          margin-bottom: 6px;
          color: rgba(255, 255, 255, 0.42);
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 0.12em;
          text-transform: uppercase;
        }

        .oc-settings__row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 9px 0;
          border-bottom: 0.5px solid rgba(255, 255, 255, 0.07);
          font-size: 12.5px;
        }

        .oc-settings__row:last-of-type { border-bottom: 0; }

        .oc-settings__row-key {
          flex: none;
          color: rgba(255, 255, 255, 0.5);
          font-size: 11px;
          letter-spacing: 0.04em;
          text-transform: uppercase;
        }

        .oc-settings__row-value {
          color: #ffffff;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .oc-settings__token-row {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .oc-settings__token-field {
          flex: 1 1 auto;
          min-width: 0;
          height: 30px;
          box-sizing: border-box;
          padding: 0 10px;
          border: 0.5px solid rgba(255, 255, 255, 0.12);
          border-radius: 8px;
          background: rgba(0, 0, 0, 0.35);
          color: rgba(255, 255, 255, 0.85);
          font-family: ui-monospace, "SF Mono", Menlo, Consolas, monospace;
          font-size: 11.5px;
          outline: none;
        }

        .oc-settings__token-field:focus {
          border-color: rgba(125, 211, 252, 0.6);
        }

        .oc-settings__pane .oc-settings__button {
          display: inline-flex;
          flex: none;
          align-items: center;
          justify-content: center;
          gap: 6px;
          min-width: 64px;
          height: 32px;
          box-sizing: border-box;
          padding: 0 16px;
          border: 0.5px solid rgba(255, 255, 255, 0.14);
          border-radius: 9px;
          background: linear-gradient(
            180deg,
            rgba(255, 255, 255, 0.16) 0%,
            rgba(255, 255, 255, 0.06) 100%
          );
          box-shadow:
            inset 0 1px 0 rgba(255, 255, 255, 0.14),
            0 1px 2px rgba(0, 0, 0, 0.26);
          color: #ffffff;
          font-family: inherit;
          font-size: 12px;
          font-weight: 550;
          line-height: 1;
          cursor: default;
          transition:
            filter 120ms ease,
            transform 120ms ease,
            box-shadow 120ms ease,
            border-color 120ms ease;
        }

        .oc-settings__pane .oc-settings__button:hover:not(:disabled) {
          filter: brightness(1.15);
          transform: translateY(-1px);
          box-shadow:
            inset 0 1px 0 rgba(255, 255, 255, 0.18),
            0 6px 16px rgba(0, 0, 0, 0.32);
        }

        .oc-settings__pane .oc-settings__button:active:not(:disabled) {
          filter: brightness(1);
          transform: translateY(0) scale(0.985);
        }

        .oc-settings__pane .oc-settings__button:disabled {
          opacity: 0.45;
        }

        .oc-settings__pane .oc-settings__button--danger {
          border-color: rgba(255, 105, 97, 0.32);
          background: linear-gradient(
            180deg,
            rgba(255, 105, 97, 0.18) 0%,
            rgba(255, 105, 97, 0.06) 100%
          );
          box-shadow:
            inset 0 1px 0 rgba(255, 255, 255, 0.08),
            0 1px 2px rgba(0, 0, 0, 0.22);
          color: #ff8b84;
        }

        .oc-settings__pane .oc-settings__button--danger:hover:not(:disabled) {
          filter: brightness(1.18);
          border-color: rgba(255, 105, 97, 0.48);
        }

        .oc-settings__pane .oc-reset {
          color: #ff8b84;
        }

        .oc-settings__pane .oc-restart {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 7px;
          height: 34px;
          padding: 0 18px;
          border: 0.5px solid rgba(255, 105, 97, 0.32);
          border-radius: 9px;
          background: linear-gradient(
            180deg,
            rgba(255, 105, 97, 0.18) 0%,
            rgba(255, 105, 97, 0.06) 100%
          );
          box-shadow:
            inset 0 1px 0 rgba(255, 255, 255, 0.08),
            0 1px 2px rgba(0, 0, 0, 0.22);
          color: #ff8b84;
          font-family: inherit;
          font-size: 12px;
          font-weight: 550;
          cursor: default;
          transition:
            filter 120ms ease,
            transform 120ms ease,
            box-shadow 120ms ease;
        }

        .oc-settings__pane .oc-restart:hover:not(:disabled) {
          filter: brightness(1.16);
          transform: translateY(-1px);
          box-shadow:
            inset 0 1px 0 rgba(255, 255, 255, 0.1),
            0 6px 16px rgba(255, 105, 97, 0.18);
        }

        .oc-settings__pane .oc-restart:active:not(:disabled) {
          filter: brightness(1);
          transform: translateY(0) scale(0.985);
        }

        .oc-settings__pane .oc-restart:disabled {
          opacity: 0.5;
        }

        .oc-settings__pane button:focus-visible {
          outline: 2px solid rgba(125, 211, 252, 0.6);
          outline-offset: 2px;
        }

        .oc-settings__pane .oc-settings__switch,
        .oc-settings__pane .oc-serve__switch {
          box-shadow: inset 0 0 0 0.5px rgba(0, 0, 0, 0.22);
        }

        .oc-settings__pane .oc-settings__switch[data-on="true"],
        .oc-settings__pane .oc-serve__switch[data-on="true"] {
          background: linear-gradient(180deg, #35d968 0%, #22b84e 100%);
          box-shadow:
            inset 0 0 0 0.5px rgba(0, 0, 0, 0.16),
            0 0 12px rgba(48, 209, 88, 0.3);
        }

        .oc-settings__pane .oc-settings__switch-knob,
        .oc-settings__pane .oc-serve__switch-knob {
          box-shadow:
            0 1px 3px rgba(0, 0, 0, 0.42),
            0 0 0 0.5px rgba(0, 0, 0, 0.08);
        }

        .oc-settings__switch-row {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .oc-settings__switch-row .oc-settings__card-note {
          flex: 1 1 auto;
          min-width: 0;
          text-align: left;
        }

        .oc-settings__dot {
          flex: none;
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.25);
          transition: background 150ms ease, box-shadow 150ms ease;
        }

        .oc-settings__dot[data-on="true"] {
          background: #28c840;
          box-shadow: 0 0 8px rgba(40, 200, 64, 0.5);
        }

        .oc-settings__code {
          box-sizing: border-box;
          max-height: 260px;
          margin: 0;
          padding: 12px 14px;
          overflow: auto;
          border: 0.5px solid rgba(255, 255, 255, 0.1);
          border-radius: 10px;
          background: rgba(0, 0, 0, 0.4);
          color: rgba(255, 255, 255, 0.82);
          font-family: ui-monospace, "SF Mono", Menlo, Consolas, monospace;
          font-size: 11px;
          line-height: 1.6;
          scrollbar-color: rgba(255, 255, 255, 0.16) transparent;
          scrollbar-width: thin;
          user-select: text;
        }

        .oc-settings__code + .oc-settings__token-row { margin-top: 10px; }

        .oc-settings__gauges {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 10px;
        }

        .oc-settings__gauge {
          display: flex;
          flex-direction: column;
          gap: 4px;
          box-sizing: border-box;
          padding: 14px;
          border: 0.5px solid rgba(255, 255, 255, 0.08);
          border-radius: 10px;
          background: rgba(255, 255, 255, 0.03);
        }

        .oc-settings__gauge-value {
          color: #ffffff;
          font-size: 20px;
          font-weight: 600;
          letter-spacing: 0.01em;
        }

        .oc-settings__gauge-label {
          color: rgba(255, 255, 255, 0.45);
          font-size: 10px;
          letter-spacing: 0.08em;
        }

        .oc-settings__gauge-hint {
          color: rgba(255, 255, 255, 0.35);
          font-size: 10.5px;
        }

        .oc-settings__bar {
          margin-top: 12px;
          height: 5px;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.08);
          overflow: hidden;
        }

        .oc-settings__bar-fill {
          height: 100%;
          border-radius: 999px;
          background: linear-gradient(90deg, #7dd3fc, #38bdf8);
        }

        .oc-settings__resize-handle {
          position: absolute;
          right: 0;
          bottom: 0;
          z-index: 2;
          width: 18px;
          height: 18px;
          cursor: nwse-resize;
          touch-action: none;
        }

        @media (max-width: 760px) {
          .oc-settings__toolbar { padding: 0 10px; }
        }
      `}</style>

      <section
        className={className}
        style={{
          zIndex,
          left: position.x,
          top: position.y,
          width: size.width,
          height: size.height,
        }}
        aria-label="Settings window"
        aria-hidden={isMinimized || undefined}
        onPointerDown={onActivate}
      >
        <div className="oc-settings__shell">
          <div
            className="oc-settings__window-controls"
            role="group"
            aria-label="Window controls"
          >
            <button
              type="button"
              className="oc-settings__light oc-settings__light--close"
              aria-label="Close Settings window"
              title="Close"
              onClick={close}
            >
              <span className="oc-settings__light-glyph" aria-hidden="true">×</span>
            </button>
            <button
              type="button"
              className="oc-settings__light oc-settings__light--minimize"
              aria-label="Minimize Settings window"
              title="Minimize"
              onClick={minimize}
            >
              <span className="oc-settings__light-glyph" aria-hidden="true">−</span>
            </button>
          </div>

          <SettingBer
            sections={sections}
            activeSectionId={activeSection.id}
            onChooseSection={chooseSection}
            dragHandlers={dragHandlers}
          />

          <div className="oc-settings__main">
            <div className="oc-settings__toolbar" {...dragHandlers}>
              <span className="oc-settings__toolbar-title">{activeSection.label}</span>
            </div>
            <div className="oc-settings__pane" aria-label="Settings content">
              {activeSection.id === "api-token" ? <SettingsApiToken /> : null}
              {activeSection.id === "mcp" ? <SettingsMcp /> : null}
              {activeSection.id === "details" ? <SystemInfo /> : null}
              {activeSection.id === "analyse" ? <SettingsAnalyse /> : null}
              {activeSection.id === "restart" ? <SettingsRestart /> : null}
            </div>
          </div>
        </div>

        <div
          className="oc-settings__resize-handle"
          aria-hidden="true"
          {...resizeHandlers}
        />
      </section>
    </>
  );
}

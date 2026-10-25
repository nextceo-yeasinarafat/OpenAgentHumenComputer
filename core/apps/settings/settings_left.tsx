import type { HTMLAttributes } from "react";
import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react";
import AlignKeyObjectIcon from "@hugeicons/core-free-icons/AlignKeyObjectIcon";
import Analytics01Icon from "@hugeicons/core-free-icons/Analytics01Icon";
import CovidInfoIcon from "@hugeicons/core-free-icons/CovidInfoIcon";
import GithubIcon from "@hugeicons/core-free-icons/GithubIcon";
import McpServerIcon from "@hugeicons/core-free-icons/McpServerIcon";
import NewTwitterIcon from "@hugeicons/core-free-icons/NewTwitterIcon";
import ReloadIcon from "@hugeicons/core-free-icons/ReloadIcon";

import type { SettingSection, SettingSectionId } from "./settings_left.ts";



const sectionIcons: Record<SettingSectionId, IconSvgElement> = {
  "api-token": AlignKeyObjectIcon,
  mcp: McpServerIcon,
  details: CovidInfoIcon,
  analyse: Analytics01Icon,
  restart: ReloadIcon,
};

const X_URL = "https://x.com/KhalidAyaanY";
const GITHUB_URL = "https://github.com/nextceo-yeasinarafat";

type SettingBerProps = {
  sections: readonly SettingSection[];
  activeSectionId: SettingSectionId;
  onChooseSection: (section: SettingSection) => void;
  dragHandlers?: HTMLAttributes<HTMLDivElement>;
};

export default function SettingBer({
  sections,
  activeSectionId,
  onChooseSection,
  dragHandlers,
}: SettingBerProps) {
  return (
    <>
      <aside className="oc-settings__ber" aria-label="Settings sections">
        <div className="oc-settings__ber-header" {...dragHandlers}>
          <span className="oc-settings__ber-title">Settings</span>
        </div>

        <div className="oc-settings__ber-scroll">
          <div className="oc-settings__ber-items">
            {sections.map((section) => {
              const isActive = section.id === activeSectionId;

              return (
                <button
                  key={section.id}
                  type="button"
                  className={`oc-settings__ber-item${
                    isActive ? " oc-settings__ber-item--active" : ""
                  }`}
                  aria-label={section.label}
                  aria-current={isActive ? "page" : undefined}
                  onClick={() => onChooseSection(section)}
                >
                  <span className="oc-settings__ber-icon" aria-hidden="true">
                    <HugeiconsIcon
                      icon={sectionIcons[section.id]}
                      size={17}
                      strokeWidth={1.6}
                      color="currentColor"
                    />
                  </span>
                  <span className="oc-settings__ber-label">{section.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="oc-settings__ber-foot">
          <a
            className="oc-settings__ber-link"
            href={X_URL}
            target="_blank"
            rel="noreferrer"
            aria-label="X"
            title="X"
          >
            <HugeiconsIcon
              icon={NewTwitterIcon}
              size={16}
              strokeWidth={1.6}
              color="currentColor"
            />
          </a>
          <a
            className="oc-settings__ber-link"
            href={GITHUB_URL}
            target="_blank"
            rel="noreferrer"
            aria-label="GitHub"
            title="GitHub"
          >
            <HugeiconsIcon
              icon={GithubIcon}
              size={16}
              strokeWidth={1.6}
              color="currentColor"
            />
          </a>
        </div>
      </aside>

      <style>{`
        .oc-settings__ber {
          position: relative;
          display: flex;
          flex: 0 0 236px;
          flex-direction: column;
          align-self: stretch;
          box-sizing: border-box;
          width: 236px;
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

        .oc-settings__ber-header {
          position: relative;
          z-index: 2;
          display: flex;
          flex: 0 0 54px;
          align-items: center;
          justify-content: flex-end;
          height: 54px;
          box-sizing: border-box;
          padding: 0 12px 0 84px;
          touch-action: none;
        }

        .oc-settings__ber-title {
          position: absolute;
          left: 50%;
          color: rgba(255, 255, 255, 0.92);
          font-size: 13px;
          font-weight: 600;
          letter-spacing: 0.01em;
          line-height: 1;
          transform: translate(-50%, -2px);
        }

        .oc-settings__ber-scroll {
          position: relative;
          z-index: 1;
          flex: 1 1 auto;
          min-height: 0;
          padding: 10px;
          overflow-y: auto;
          scrollbar-color: rgba(255, 255, 255, 0.16) transparent;
          scrollbar-width: thin;
        }

        .oc-settings__ber-items {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .oc-settings__ber-item {
          position: relative;
          display: flex;
          box-sizing: border-box;
          align-items: center;
          gap: 9px;
          width: 100%;
          height: 30px;
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

        .oc-settings__ber-item:hover {
          background: rgba(255, 255, 255, 0.07);
          color: rgba(255, 255, 255, 0.92);
        }

        .oc-settings__ber-item--active,
        .oc-settings__ber-item--active:hover {
          background: rgba(255, 255, 255, 0.1);
          color: #FFFFFF;
        }

        .oc-settings__ber-item:focus-visible {
          outline: 1px solid rgba(214, 226, 240, 0.6);
          outline-offset: 2px;
        }

        .oc-settings__ber-icon {
          display: grid;
          flex: 0 0 19px;
          place-items: center;
          width: 19px;
          height: 19px;
          color: inherit;
        }

        .oc-settings__ber-label {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .oc-settings__ber-foot {
          display: flex;
          flex: none;
          gap: 8px;
          padding: 10px;
          border-top: 1px solid rgba(255, 255, 255, 0.08);
        }

        .oc-settings__ber-link {
          display: flex;
          flex: 1 1 0;
          align-items: center;
          justify-content: center;
          height: 32px;
          border: 0;
          border-radius: 8px;
          background: transparent;
          color: rgba(255, 255, 255, 0.85);
          text-decoration: none;
          transition:
            background 110ms ease,
            color 110ms ease;
        }

        .oc-settings__ber-link:hover {
          background: rgba(255, 255, 255, 0.07);
          color: #FFFFFF;
        }

        .oc-settings__ber-link:focus-visible {
          outline: 1px solid rgba(214, 226, 240, 0.6);
          outline-offset: 2px;
        }

        @media (max-width: 760px) {
          .oc-settings__ber {
            flex-basis: 208px;
            width: 208px;
          }
        }
      `}</style>
    </>
  );
}

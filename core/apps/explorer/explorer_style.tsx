import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react";
import GridViewIcon from "@hugeicons/core-free-icons/GridViewIcon";
import ListViewIcon from "@hugeicons/core-free-icons/ListViewIcon";

import {
  EXPLORER_VIEW_ICON_SIZE,
  explorerViewButtonStyle,
  explorerViewControlStyle,
  type ExplorerViewMode,
} from "./explorer_style.ts";



const viewOptions: Array<{
  mode: ExplorerViewMode;
  label: string;
  icon: IconSvgElement;
}> = [
  { mode: "grid", label: "Grid view", icon: GridViewIcon },
  { mode: "list", label: "List view", icon: ListViewIcon },
];

type ExplorerStyleControlProps = {
  viewMode: ExplorerViewMode;
  hoveredView: ExplorerViewMode | null;
  onSelectView: (mode: ExplorerViewMode) => void;
  onHoverView: (mode: ExplorerViewMode | null) => void;
};

export default function ExplorerStyleControl({
  viewMode,
  hoveredView,
  onSelectView,
  onHoverView,
}: ExplorerStyleControlProps) {
  return (
    <div
      className="oc-finder__view-toggle"
      role="group"
      aria-label="View"
      style={explorerViewControlStyle()}
    >
      {viewOptions.map((option) => {
        const isActive = option.mode === viewMode;

        return (
          <button
            key={option.mode}
            type="button"
            className="oc-finder__view-button"
            aria-label={option.label}
            aria-pressed={isActive}
            title={option.label}
            style={explorerViewButtonStyle(isActive, hoveredView === option.mode)}
            onClick={() => onSelectView(option.mode)}
            onMouseEnter={() => onHoverView(option.mode)}
            onMouseLeave={() => onHoverView(null)}
            onFocus={() => onHoverView(option.mode)}
            onBlur={() => onHoverView(null)}
          >
            <HugeiconsIcon
              icon={option.icon}
              size={EXPLORER_VIEW_ICON_SIZE}
              strokeWidth={1.5}
              aria-hidden="true"
            />
          </button>
        );
      })}
    </div>
  );
}
import { useCallback, useState, type CSSProperties } from "react";



export type ExplorerViewMode = "grid" | "list";


export const EXPLORER_VIEW_ICON_SIZE = 15;


export function explorerViewControlStyle(): CSSProperties {
  return {
    display: "inline-flex",
    flex: "0 0 auto",
    alignItems: "center",
    gap: 3,
    padding: 3,
    border: "1px solid rgba(255, 255, 255, 0.18)",
    borderRadius: 12,
    background:
      "linear-gradient(180deg, rgba(255, 255, 255, 0.09), rgba(255, 255, 255, 0.02) 55%, rgba(255, 255, 255, 0.045))",
    boxShadow:
      "0 10px 26px rgba(0, 0, 0, 0.16), inset 0 1px 0 rgba(255, 255, 255, 0.22)",
    backdropFilter: "blur(8px) saturate(155%) brightness(1.04)",
    WebkitBackdropFilter: "blur(8px) saturate(155%) brightness(1.04)",
  };
}


export function explorerViewButtonStyle(
  isActive: boolean,
  isHovered: boolean,
): CSSProperties {
  return {
    position: "relative",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: 32,
    height: 26,
    padding: 0,
    border: 0,
    borderRadius: 8,
    background: isActive
      ? "rgba(255, 255, 255, 0.08)"
      : isHovered
        ? "rgba(255, 255, 255, 0.07)"
        : "transparent",
    boxShadow: isActive ? "inset 0 1px 0 rgba(255, 255, 255, 0.12)" : "none",
    color: isActive
      ? "#ffffff"
      : isHovered
        ? "rgba(255, 255, 255, 0.82)"
        : "rgba(255, 255, 255, 0.48)",
    cursor: "default",
    outline: "none",
    transition: "background 110ms ease, color 110ms ease",
    WebkitTapHighlightColor: "transparent",
  };
}


export function useExplorerStyle(initialViewMode: ExplorerViewMode = "grid") {
  const [viewMode, setViewMode] = useState<ExplorerViewMode>(initialViewMode);
  const [hoveredView, setHoveredView] = useState<ExplorerViewMode | null>(null);

  const selectView = useCallback((mode: ExplorerViewMode) => {
    setViewMode(mode);
  }, []);

  const hoverView = useCallback((mode: ExplorerViewMode | null) => {
    setHoveredView(mode);
  }, []);

  return {
    viewMode,
    isGrid: viewMode === "grid",
    isList: viewMode === "list",
    hoveredView,
    selectView,
    hoverView,
  };
}

export type ExplorerStyleController = ReturnType<typeof useExplorerStyle>;
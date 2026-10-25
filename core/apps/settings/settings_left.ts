import { useCallback, useState } from "react";



export type SettingSectionId =
  | "api-token"
  | "mcp"
  | "details"
  | "analyse"
  | "restart";

export type SettingSection = {
  id: SettingSectionId;
  label: string;
};


export const SETTING_SECTIONS: readonly SettingSection[] = [
  { id: "api-token", label: "System API Token" },
  { id: "mcp", label: "System MCP" },
  { id: "details", label: "System Details" },
  { id: "analyse", label: "System Analyse" },
  { id: "restart", label: "System Control" },
];

export function useSettingBar() {
  const [activeSectionId, setActiveSectionId] =
    useState<SettingSectionId>("details");

  const chooseSection = useCallback((section: SettingSection) => {
    setActiveSectionId(section.id);
  }, []);

  const activeSection =
    SETTING_SECTIONS.find((section) => section.id === activeSectionId) ??
    SETTING_SECTIONS[0];

  return {
    sections: SETTING_SECTIONS,
    activeSectionId,
    activeSection,
    chooseSection,
  };
}

export type SettingBarController = ReturnType<typeof useSettingBar>;

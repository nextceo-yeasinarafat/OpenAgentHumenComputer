

export type DockAppId = "chromium" | "vscode" | "terminal" | "explorer" | "settings";

export type DockApp = {
  id: DockAppId;
  label: string;
  icon: string;
};


export const DOCK_APPS: readonly DockApp[] = [
  { id: "chromium", label: "Chromium", icon: "/dock_icons/chromium.svg" },
  { id: "vscode", label: "VS Code", icon: "/dock_icons/vscode.svg" },
  { id: "terminal", label: "Terminal", icon: "/dock_icons/terminal.svg" },
  { id: "explorer", label: "Explorer", icon: "/dock_icons/explorer.svg" },
  { id: "settings", label: "Settings", icon: "/dock_icons/settings.svg" },
];

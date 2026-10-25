import { useCallback, useState } from "react";

import CoreDock from "../dock/core_dock.tsx";
import ComputerTerminal from "../terminal/computer_terminal.tsx";
import { useComputerTerminal } from "../terminal/computer_terminal.ts";
import ComputerExplorer from "../explorer/computer_explorer.tsx";
import { useComputerExplorer } from "../explorer/computer_explorer.ts";
import ComputerChromium from "../chromium/computer_chromium.tsx";
import { useComputerChromium } from "../chromium/computer_chromium.ts";
import { wakeComputerBrowser } from "../chromium/chromium_sleep.ts";
import ComputerVscode from "../vscode/computer_vscode.tsx";
import { useComputerVscode } from "../vscode/computer_vscode.ts";
import { useVscodeClose } from "../vscode/vscode_close.ts";
import { useVscodeSleep } from "../vscode/vscode_sleep.ts";
import CoreSettings from "../settings/core_settings.tsx";
import { useCoreSettings } from "../settings/core_settings.ts";
import { useSettingBar } from "../settings/settings_left.ts";
import TextEditorWindow from "../text_editor/text_editor_window.tsx";
import { useTextEditor } from "../text_editor/text_editor_window.ts";
import MediaViewerWindow from "../media_viewer/media_viewer_window.tsx";
import { useMediaViewer } from "../media_viewer/media_viewer_window.ts";
import { isMediaFile } from "../media_viewer/tools/media_source.ts";

import { wallpaperStyle } from "./core_layout.ts";




type ActiveApp =
  | "chromium"
  | "vscode"
  | "terminal"
  | "explorer"
  | "editor"
  | "media"
  | "settings"
  | null;

export default function CoreLayout() {
  const [activeApp, setActiveApp] = useState<ActiveApp>(null);
  const chromium = useComputerChromium();
  const vscodeWindow = useComputerVscode();
  const vscodeClose = useVscodeClose(vscodeWindow);
  const vscodeSleep = useVscodeSleep(vscodeWindow);
  const settings = useCoreSettings();
  const settingBar = useSettingBar();
  const terminal = useComputerTerminal();
  const editor = useTextEditor();
  const mediaViewer = useMediaViewer();
  const explorer = useComputerExplorer({
    
    
    
    onOpenTerminal: useCallback(
      (path: string) => {
        setActiveApp("terminal");
        terminal.openAt(path);
      },
      [terminal],
    ),
    
    
    
    
    onOpenFile: useCallback(
      (path: string, name: string) => {
        if (isMediaFile(name)) {
          setActiveApp("media");
          mediaViewer.openFile(path, name);
          return;
        }

        setActiveApp("editor");
        editor.openFile(path, name);
      },
      [editor, mediaViewer],
    ),
  });

  
  
  const runningAppIds = [
    chromium.isOpen && "chromium",
    vscodeWindow.isOpen && "vscode",
    terminal.isOpen && "terminal",
    explorer.isOpen && "explorer",
    settings.isOpen && "settings",
  ].filter((id): id is string => Boolean(id));

  const minimizedAppIds = [
    chromium.isMinimized && "chromium",
    vscodeWindow.isMinimized && "vscode",
    terminal.isMinimized && "terminal",
    explorer.isMinimized && "explorer",
    settings.isMinimized && "settings",
  ].filter((id): id is string => Boolean(id));

  
  
  const fullscreen = [
    chromium.isOpen && !chromium.isMinimized && chromium.isMaximized,
    vscodeWindow.isOpen && !vscodeWindow.isMinimized && vscodeWindow.isMaximized,
    terminal.isOpen && !terminal.isMinimized && terminal.isMaximized,
    explorer.isOpen && !explorer.isMinimized && explorer.isMaximized,
    settings.isOpen && !settings.isMinimized && settings.isMaximized,
  ].some(Boolean);

  return (
    <div style={wallpaperStyle()} aria-label="the computer">
      <ComputerChromium
        controller={chromium}
        zIndex={activeApp === "chromium" ? 52 : 50}
        onActivate={() => setActiveApp("chromium")}
      />
      <ComputerVscode
        controller={vscodeWindow}
        zIndex={activeApp === "vscode" ? 52 : 50}
        onActivate={() => setActiveApp("vscode")}
        onClose={vscodeClose.close}
        onMinimize={vscodeSleep.minimize}
      />
      <CoreSettings
        controller={settings}
        bar={settingBar}
        zIndex={activeApp === "settings" ? 52 : 50}
        onActivate={() => setActiveApp("settings")}
      />
      <ComputerTerminal
        controller={terminal}
        zIndex={activeApp === "terminal" ? 52 : 50}
        onActivate={() => setActiveApp("terminal")}
      />
      <ComputerExplorer
        controller={explorer}
        zIndex={activeApp === "explorer" ? 52 : 50}
        isActive={activeApp === "explorer"}
        onActivate={() => setActiveApp("explorer")}
      />
      <TextEditorWindow
        controller={editor}
        zIndex={activeApp === "editor" ? 53 : 51}
        onActivate={() => setActiveApp("editor")}
      />
      <MediaViewerWindow
        controller={mediaViewer}
        zIndex={activeApp === "media" ? 53 : 51}
        onActivate={() => setActiveApp("media")}
      />
      <CoreDock
        runningAppIds={runningAppIds}
        minimizedAppIds={minimizedAppIds}
        autoHide={fullscreen}
        onOpenApp={(id) => {
          if (id === "chromium") {
            setActiveApp("chromium");
            
            
            
            void wakeComputerBrowser();
            chromium.open();
          } else if (id === "vscode") {
            setActiveApp("vscode");
            vscodeClose.open();
          } else if (id === "terminal") {
            setActiveApp("terminal");
            terminal.open();
          } else if (id === "explorer") {
            setActiveApp("explorer");
            explorer.open();
          } else if (id === "settings") {
            setActiveApp("settings");
            settings.open();
          }
        }}
      />
    </div>
  );
}

import { useCallback } from "react";
import type { ComputerVscodeController } from "./computer_vscode.ts";



const VSCODE_API = "/api/vscode";



let pending: Promise<void> = Promise.resolve();


export function controlVscodeServer(action: "start" | "stop"): Promise<void> {
  pending = pending.then(async () => {
    try {
      await fetch(`${VSCODE_API}/${action}`, { method: "POST" });
    } catch {
      
      
    }
  });

  return pending;
}

export function useVscodeClose(controller: ComputerVscodeController) {
  const { open: openWindow, close: closeWindow } = controller;

  const open = useCallback(() => {
    openWindow();
    void controlVscodeServer("start");
  }, [openWindow]);

  const close = useCallback(() => {
    closeWindow();
    void controlVscodeServer("stop");
  }, [closeWindow]);

  return { open, close };
}

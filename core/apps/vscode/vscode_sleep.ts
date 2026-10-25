import { useCallback } from "react";
import type { ComputerVscodeController } from "./computer_vscode.ts";
import { controlVscodeServer } from "./vscode_close.ts";



export function useVscodeSleep(controller: ComputerVscodeController) {
  const { minimize: minimizeWindow } = controller;

  const minimize = useCallback(() => {
    minimizeWindow();
    void controlVscodeServer("stop");
  }, [minimizeWindow]);

  return { minimize };
}

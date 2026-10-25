import { useEffect } from "react";

import { EXPLORER_HIDDEN_SHORTCUT } from "./explorer_hidden.ts";



type ExplorerHiddenShortcutProps = {
  enabled: boolean;
  onToggle: () => void;
};


function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable) return true;

  return target.tagName === "INPUT" || target.tagName === "TEXTAREA";
}

export default function ExplorerHiddenShortcut({
  enabled,
  onToggle,
}: ExplorerHiddenShortcutProps) {
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (!event.ctrlKey || event.metaKey || event.altKey || event.shiftKey) {
        return;
      }

      if (event.key.toLowerCase() !== EXPLORER_HIDDEN_SHORTCUT) return;
      if (isTypingTarget(event.target)) return;

      
      
      event.preventDefault();
      onToggle();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [enabled, onToggle]);

  return null;
}

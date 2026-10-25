import { useCallback, useState } from "react";

import type { ExplorerEntry } from "./explorer_folders.ts";




export const EXPLORER_HIDDEN_SHORTCUT = "h";


export function isExplorerHiddenName(name: string): boolean {
  return name.startsWith(".");
}


export function visibleExplorerEntries(
  entries: ExplorerEntry[],
  showHidden: boolean,
): ExplorerEntry[] {
  if (showHidden) return entries;

  return entries.filter((entry) => !isExplorerHiddenName(entry.name));
}

export type ExplorerHiddenState = {
  showHidden: boolean;
  toggleHidden: () => void;
  setShowHidden: (showHidden: boolean) => void;
};


export function useExplorerHidden(): ExplorerHiddenState {
  const [showHidden, setShowHidden] = useState(false);

  const toggleHidden = useCallback(() => {
    setShowHidden((current) => !current);
  }, []);

  return { showHidden, toggleHidden, setShowHidden };
}

import { useCallback, useEffect, useMemo, useState } from "react";

import {
  explorerHome,
  fetchExplorerFolder,
  noteExplorerHome,
} from "./explorer_folders.ts";



export type FinderLocationId = "downloads" | "desktop" | "documents";

export type FinderLocation = {
  id: FinderLocationId;
  label: string;
  path: string;
};


export function finderLocationsFor(home: string): FinderLocation[] {
  if (!home) return [];

  return [
    { id: "downloads", label: "Downloads", path: `${home}/Downloads` },
    { id: "desktop", label: "Desktop", path: `${home}/Desktop` },
    { id: "documents", label: "Documents", path: `${home}/Documents` },
  ];
}


export function useExplorerFinder() {
  const [home, setHome] = useState(() => explorerHome());
  
  const [chosen, setChosen] = useState<string | null>(null);

  useEffect(() => {
    if (home) return;

    let live = true;
    void fetchExplorerFolder()
      .then((folder) => {
        if (!live) return;
        noteExplorerHome(folder.path);
        setHome(folder.path);
      })
      .catch(() => {
        
        
      });
    return () => {
      live = false;
    };
  }, [home]);

  const locations = useMemo(() => finderLocationsFor(home), [home]);
  const path = home ? (chosen ?? home) : "";

  const chooseLocation = useCallback((location: FinderLocation) => {
    setChosen(location.path);
  }, []);

  const openFolder = useCallback((nextPath: string) => {
    setChosen(nextPath);
  }, []);

  const resetFinder = useCallback(() => {
    setChosen(null);
  }, []);

  const activeLocation =
    locations.find((location) => location.path === path) ?? null;

  return {
    home,
    locations,
    path,
    activeLocationId: activeLocation?.id ?? null,
    chooseLocation,
    openFolder,
    resetFinder,
  };
}

export type ExplorerFinderController = ReturnType<typeof useExplorerFinder>;

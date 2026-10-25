import { useCallback, useEffect, useState } from "react";
import { explorerApiUrl } from "./explorer_folders.ts";




export const EXPLORER_STORAGE_INTERVAL_MS = 10000;

export type ExplorerStorage = {
  
  name: string;
  
  source: string;
  total: number;
  used: number;
  available: number;
};


export async function fetchExplorerStorage(): Promise<ExplorerStorage> {
  const response = await fetch(explorerApiUrl("/api/disk"), {
    headers: { Accept: "application/json" },
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(detail.trim() || `the computer answered ${response.status}`);
  }

  const payload = (await response.json()) as ExplorerStorage;

  return {
    name: payload.name,
    source: payload.source,
    total: payload.total,
    used: payload.used,
    available: payload.available,
  };
}


export function formatStorageSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 GB";

  const units = ["GB", "TB"];
  let value = bytes / 1024 ** 3;
  let unitIndex = 0;

  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }

  const rounded =
    value >= 100 ? Math.round(value) : Math.round(value * 10) / 10;

  return `${rounded} ${units[unitIndex]}`;
}


export function storageUsedRatio(storage: ExplorerStorage): number {
  if (!Number.isFinite(storage.total) || storage.total <= 0) return 0;

  return Math.min(1, Math.max(0, storage.used / storage.total));
}


export function explorerStorageStrip(
  storage: ExplorerStorage | null,
  isLoading: boolean,
): {
  isWaiting: boolean;
  percent: number;
  fillWidth: string;
  note: string;
} {
  const isWaiting = storage === null && isLoading;
  const ratio = storage ? storageUsedRatio(storage) : 0;
  const percent = Math.round(ratio * 100);
  const fillWidth =
    storage && ratio > 0 ? `max(${(ratio * 100).toFixed(3)}%, 6px)` : "0%";
  const note = storage
    ?
      `${formatStorageSize(storage.available)} of ${formatStorageSize(
        storage.total,
      )} available`
    : "The disk was not reported";

  return { isWaiting, percent, fillWidth, note };
}

export type ExplorerStorageState = {
  storage: ExplorerStorage | null;
  isLoading: boolean;
  error: string | null;
};


export function useExplorerStorage(enabled: boolean): ExplorerStorageState {
  const [storage, setStorage] = useState<ExplorerStorage | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const result = await fetchExplorerStorage();
      setStorage(result);
      setError(null);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "the computer did not report its disk",
      );
    }
  }, []);

  useEffect(() => {
    if (!enabled) return;

    void load();
  }, [enabled, load]);

  useEffect(() => {
    if (!enabled) return;

    const timer = window.setInterval(() => {
      void load();
    }, EXPLORER_STORAGE_INTERVAL_MS);

    return () => window.clearInterval(timer);
  }, [enabled, load]);

  return { storage, isLoading: enabled && !storage && !error, error };
}
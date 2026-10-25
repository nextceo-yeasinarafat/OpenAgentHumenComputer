import { useCallback, useEffect, useState } from "react";




let explorerHomePath = "";


export function explorerHome(): string {
  return explorerHomePath;
}


export function noteExplorerHome(path: string | null | undefined): void {
  if (path && !explorerHomePath) explorerHomePath = path;
}


export const EXPLORER_SYNC_INTERVAL_MS = 5000;

const BRIDGE_URL = (import.meta.env.VITE_BRIDGE_URL ?? "").trim();
const BRIDGE_TOKEN = (import.meta.env.VITE_OPEN_COMPUTER_TOKEN ?? "").trim();

export type ExplorerEntry = {
  name: string;
  path: string;
  isDirectory: boolean;
  isSymbolicLink: boolean;
  size: number;
  modified: number;
};

export type ExplorerFolder = {
  path: string;
  parent: string | null;
  entries: ExplorerEntry[];
};


export function explorerApiUrl(
  endpoint: string,
  params: Record<string, string> = {},
): string {
  const base = BRIDGE_URL || window.location.origin;
  const url = new URL(endpoint, base);

  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }

  if (BRIDGE_TOKEN) {
    url.searchParams.set("token", BRIDGE_TOKEN);
  }

  return url.toString();
}


export async function fetchExplorerFolder(
  path?: string,
): Promise<ExplorerFolder> {
  const response = await fetch(explorerApiUrl("/api/fs", path ? { path } : {}), {
    headers: { Accept: "application/json" },
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(detail.trim() || `the computer answered ${response.status}`);
  }

  const payload = (await response.json()) as {
    path: string;
    parent: string | null;
    entries: Array<{
      name: string;
      path: string;
      is_dir: boolean;
      is_symlink: boolean;
      size: number;
      modified: number;
    }>;
  };

  noteExplorerHome(payload.path);

  return {
    path: payload.path,
    parent: payload.parent,
    entries: payload.entries.map((entry) => ({
      name: entry.name,
      path: entry.path,
      isDirectory: entry.is_dir,
      isSymbolicLink: entry.is_symlink,
      size: entry.size,
      modified: entry.modified,
    })),
  };
}


export function sortExplorerEntries(
  entries: ExplorerEntry[],
): ExplorerEntry[] {
  return [...entries].sort((left, right) => {
    if (left.isDirectory !== right.isDirectory) {
      return left.isDirectory ? -1 : 1;
    }

    return left.name.localeCompare(right.name, undefined, {
      numeric: true,
      sensitivity: "base",
    });
  });
}


export function formatExplorerSize(size: number): string {
  if (!Number.isFinite(size) || size < 0) return "--";
  if (size < 1024) return `${size} bytes`;

  const units = ["KB", "MB", "GB", "TB"];
  let value = size / 1024;
  let unitIndex = 0;

  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }

  const rounded =
    value >= 100 ? Math.round(value) : Math.round(value * 10) / 10;

  return `${rounded} ${units[unitIndex]}`;
}


export function formatExplorerDate(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds <= 0) return "--";

  return new Date(seconds * 1000).toLocaleString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export type ExplorerFileKind =
  | "folder"
  | "code"
  | "text"
  | "image"
  | "audio"
  | "video"
  | "archive"
  | "spreadsheet"
  | "file";


export const explorerFileKindLabels: Record<ExplorerFileKind, string> = {
  folder: "Folder",
  code: "Source File",
  text: "Text Document",
  image: "Image",
  audio: "Audio File",
  video: "Movie",
  archive: "Archive",
  spreadsheet: "Spreadsheet",
  file: "Document",
};

const kindExtensions: Record<Exclude<ExplorerFileKind, "folder" | "file">, Set<string>> = {
  code: new Set([
    "bash", "c", "cc", "cpp", "css", "go", "h", "hpp", "html", "java", "js",
    "json", "jsx", "kt", "lua", "php", "py", "rb", "rs", "scss", "sh", "sql",
    "swift", "toml", "ts", "tsx", "vue", "xml", "yaml", "yml", "zsh",
  ]),
  text: new Set(["log", "md", "rst", "txt"]),
  image: new Set([
    "bmp", "gif", "heic", "jpeg", "jpg", "png", "svg", "tif", "tiff", "webp",
  ]),
  audio: new Set(["aac", "flac", "m4a", "mp3", "oga", "ogg", "wav"]),
  video: new Set(["avi", "m4v", "mkv", "mov", "mp4", "mpeg", "webm", "wmv"]),
  archive: new Set(["7z", "bz2", "gz", "rar", "tar", "tgz", "xz", "zip"]),
  spreadsheet: new Set(["csv", "numbers", "ods", "tsv", "xls", "xlsx"]),
};


export function explorerFileExtension(name: string): string {
  const index = name.lastIndexOf(".");

  if (index <= 0 || index === name.length - 1) return "";

  return name.slice(index + 1).toLowerCase();
}


export function explorerFileKind(name: string): ExplorerFileKind {
  const extension = explorerFileExtension(name);
  if (!extension) return "file";

  for (const [kind, extensions] of Object.entries(kindExtensions)) {
    if (extensions.has(extension)) return kind as ExplorerFileKind;
  }

  return "file";
}

export type ExplorerFoldersState = {
  folder: ExplorerFolder | null;
  entries: ExplorerEntry[];
  isLoading: boolean;
  error: string | null;
  refresh: () => void;
};


export function useExplorerFolders(
  path: string,
  enabled: boolean,
): ExplorerFoldersState {
  const [loaded, setLoaded] = useState<{
    path: string;
    folder: ExplorerFolder;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const folder = await fetchExplorerFolder(path);
      setLoaded({ path, folder });
      setError(null);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "the computer is not reachable",
      );
    }
  }, [path]);

  useEffect(() => {
    if (!enabled) return;

    void load();
  }, [enabled, load]);

  
  
  useEffect(() => {
    if (!enabled) return;

    const timer = window.setInterval(() => {
      void load();
    }, EXPLORER_SYNC_INTERVAL_MS);

    return () => window.clearInterval(timer);
  }, [enabled, load]);

  const refresh = useCallback(() => {
    void load();
  }, [load]);

  const folder = loaded?.path === path ? loaded.folder : null;

  return {
    folder,
    entries: folder ? sortExplorerEntries(folder.entries) : [],
    isLoading: enabled && folder === null,
    error,
    refresh,
  };
}
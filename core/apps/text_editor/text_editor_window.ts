

import { useCallback, useState } from "react";

import { explorerApiUrl } from "../explorer/explorer_folders.ts";

export type TextEditorFile = {
  
  path: string;
  
  name: string;
};

export type TextEditorPosition = { x: number; y: number };
export type TextEditorSize = { width: number; height: number };

export type TextEditorController = {
  
  isOpen: boolean;
  
  file: TextEditorFile | null;
  position: TextEditorPosition;
  size: TextEditorSize;
  
  openFile: (path: string, name?: string) => void;
  close: () => void;
  move: (position: TextEditorPosition) => void;
  resize: (size: TextEditorSize) => void;
};

const OPEN_WIDTH = 760;
const OPEN_HEIGHT = 540;
const MIN_WIDTH = 420;
const MIN_HEIGHT = 260;


export function fileNameOf(path: string): string {
  const parts = path.split("/").filter(Boolean);
  return parts[parts.length - 1] ?? path;
}

export function useTextEditor(): TextEditorController {
  const [isOpen, setIsOpen] = useState(false);
  const [file, setFile] = useState<TextEditorFile | null>(null);

  const [position, setPosition] = useState<TextEditorPosition>(() => {
    const width = typeof window === "undefined" ? 1280 : window.innerWidth;
    const height = typeof window === "undefined" ? 800 : window.innerHeight;

    return {
      x: Math.max(16, Math.round((width - OPEN_WIDTH) / 2)),
      y: Math.max(16, Math.round((height - OPEN_HEIGHT) / 2) - 30),
    };
  });

  const [size, setSize] = useState<TextEditorSize>({
    width: OPEN_WIDTH,
    height: OPEN_HEIGHT,
  });

  const openFile = useCallback((path: string, name?: string) => {
    setFile({ path, name: name ?? fileNameOf(path) });
    setIsOpen(true);
  }, []);

  const close = useCallback(() => setIsOpen(false), []);

  const move = useCallback((next: TextEditorPosition) => {
    const width = typeof window === "undefined" ? 1280 : window.innerWidth;
    const height = typeof window === "undefined" ? 800 : window.innerHeight;

    setPosition({
      x: Math.max(8, Math.min(next.x, width - 160)),
      y: Math.max(8, Math.min(next.y, height - 60)),
    });
  }, []);

  const resize = useCallback((next: TextEditorSize) => {
    const width = typeof window === "undefined" ? 1280 : window.innerWidth;
    const height = typeof window === "undefined" ? 800 : window.innerHeight;

    setSize({
      width: Math.max(MIN_WIDTH, Math.min(next.width, width - 24)),
      height: Math.max(MIN_HEIGHT, Math.min(next.height, height - 24)),
    });
  }, []);

  return { isOpen, file, position, size, openFile, close, move, resize };
}


async function answerDetail(response: Response): Promise<string> {
  const text = await response.text();

  try {
    const body = JSON.parse(text) as { detail?: string };
    if (body?.detail) return body.detail;
  } catch {
    
  }

  return text.trim() || `the computer answered ${response.status}`;
}


export async function readComputerFile(
  path: string,
): Promise<{ path: string; content: string; size: number }> {
  const response = await fetch(explorerApiUrl("/api/file", { path }), {
    headers: { Accept: "application/json" },
  });

  if (!response.ok) throw new Error(await answerDetail(response));

  const payload = (await response.json()) as {
    path?: string;
    content?: string;
    size?: number;
  };

  return {
    path: payload.path ?? path,
    content: payload.content ?? "",
    size: payload.size ?? 0,
  };
}


export async function writeComputerFile(
  path: string,
  content: string,
): Promise<void> {
  const response = await fetch(explorerApiUrl("/api/file"), {
    method: "PUT",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ path, content }),
  });

  if (!response.ok) throw new Error(await answerDetail(response));
}

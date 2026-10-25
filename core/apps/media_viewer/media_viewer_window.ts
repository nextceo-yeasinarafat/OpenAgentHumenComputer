

import { useCallback, useState } from "react";

export type MediaViewerFile = {
  
  path: string;
  
  name: string;
};

export type MediaViewerPosition = { x: number; y: number };
export type MediaViewerSize = { width: number; height: number };

export type MediaViewerController = {
  isOpen: boolean;
  file: MediaViewerFile | null;
  position: MediaViewerPosition;
  size: MediaViewerSize;
  openFile: (path: string, name?: string) => void;
  close: () => void;
  move: (position: MediaViewerPosition) => void;
  resize: (size: MediaViewerSize) => void;
};

const OPEN_WIDTH = 860;
const OPEN_HEIGHT = 620;
const MIN_WIDTH = 360;
const MIN_HEIGHT = 240;


export function fileNameOf(path: string): string {
  const parts = path.split("/").filter(Boolean);
  return parts[parts.length - 1] ?? path;
}

export function useMediaViewer(): MediaViewerController {
  const [isOpen, setIsOpen] = useState(false);
  const [file, setFile] = useState<MediaViewerFile | null>(null);

  const [position, setPosition] = useState<MediaViewerPosition>(() => {
    const width = typeof window === "undefined" ? 1280 : window.innerWidth;
    const height = typeof window === "undefined" ? 800 : window.innerHeight;

    return {
      x: Math.max(16, Math.round((width - OPEN_WIDTH) / 2)),
      y: Math.max(16, Math.round((height - OPEN_HEIGHT) / 2) - 20),
    };
  });

  const [size, setSize] = useState<MediaViewerSize>({
    width: OPEN_WIDTH,
    height: OPEN_HEIGHT,
  });

  const openFile = useCallback((path: string, name?: string) => {
    setFile({ path, name: name ?? fileNameOf(path) });
    setIsOpen(true);
  }, []);

  const close = useCallback(() => setIsOpen(false), []);

  const move = useCallback((next: MediaViewerPosition) => {
    const width = typeof window === "undefined" ? 1280 : window.innerWidth;
    const height = typeof window === "undefined" ? 800 : window.innerHeight;

    setPosition({
      x: Math.max(8, Math.min(next.x, width - 160)),
      y: Math.max(8, Math.min(next.y, height - 60)),
    });
  }, []);

  const resize = useCallback((next: MediaViewerSize) => {
    const width = typeof window === "undefined" ? 1280 : window.innerWidth;
    const height = typeof window === "undefined" ? 800 : window.innerHeight;

    setSize({
      width: Math.max(MIN_WIDTH, Math.min(next.width, width - 24)),
      height: Math.max(MIN_HEIGHT, Math.min(next.height, height - 24)),
    });
  }, []);

  return { isOpen, file, position, size, openFile, close, move, resize };
}

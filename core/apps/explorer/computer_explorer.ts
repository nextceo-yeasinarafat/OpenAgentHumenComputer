import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { useMotionValue, type Transition } from "framer-motion";

import {
  useExplorerFinder,
  type ExplorerFinderController,
  type FinderLocation,
} from "./explorer_finder.ts";
import {
  useExplorerFolders,
  type ExplorerEntry,
} from "./explorer_folders.ts";
import { useExplorerActions } from "./explorer_actions.ts";
import { useExplorerHidden, visibleExplorerEntries } from "./explorer_hidden.ts";
import { useExplorerStorage } from "./explorer_stroage.ts";
import { useExplorerStyle } from "./explorer_style.ts";



export const EXPLORER_WINDOW_DEFAULT_SIZE: ExplorerWindowSize = {
  width: 940,
  height: 600,
};

export const EXPLORER_WINDOW_MIN_SIZE: ExplorerWindowSize = {
  width: 620,
  height: 400,
};


export const EXPLORER_WINDOW_SPRING: Transition = {
  type: "spring",
  stiffness: 380,
  damping: 34,
  mass: 0.85,
};


export const EXPLORER_WINDOW_INSTANT: Transition = { duration: 0 };

export const explorerWindowInitial = { opacity: 0, scale: 0.97 };


const MINIMIZED_SINK_RATIO = 0.45;
const MINIMIZED_SCALE = 0.08;
const CLOSED_SCALE = 0.94;

const EXPLORER_TITLEBAR_HEIGHT = 38;
const MIN_VISIBLE_WIDTH = 200;
const EDGE_GAP = 8;

export type ExplorerWindowPosition = {
  x: number;
  y: number;
};

export type ExplorerWindowSize = {
  width: number;
  height: number;
};

export type ExplorerViewport = {
  width: number;
  height: number;
};

export type ExplorerWindowTarget = {
  left: number;
  top: number;
  width: number;
  height: number;
  opacity: number;
  scale: number;
};

type DragState = {
  pointerId: number;
  startX: number;
  startY: number;
  originX: number;
  originY: number;
  latestX: number;
  latestY: number;
};

type ResizeState = {
  pointerId: number;
  startX: number;
  startY: number;
  startWidth: number;
  startHeight: number;
};


export function explorerWindowTarget({
  isMaximized,
  isMinimized,
  isClosing,
  position,
  size,
  viewport,
}: {
  isMaximized: boolean;
  isMinimized: boolean;
  isClosing: boolean;
  position: ExplorerWindowPosition;
  size: ExplorerWindowSize;
  viewport: ExplorerViewport;
}): ExplorerWindowTarget {
  return {
    left: isMaximized ? 0 : position.x,
    top: isMaximized
      ? 0
      : isMinimized
        ? position.y + viewport.height * MINIMIZED_SINK_RATIO
        : position.y,
    width: isMaximized ? viewport.width : size.width,
    height: isMaximized ? viewport.height : size.height,
    opacity: isClosing || isMinimized ? 0 : 1,
    scale: isClosing ? CLOSED_SCALE : isMinimized ? MINIMIZED_SCALE : 1,
  };
}


function useViewportSize(): ExplorerViewport {
  const [viewport, setViewport] = useState<ExplorerViewport>(() => ({
    width: window.innerWidth,
    height: window.innerHeight,
  }));

  useEffect(() => {
    const handleResize = () => {
      setViewport({ width: window.innerWidth, height: window.innerHeight });
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return viewport;
}

function getInitialSize(viewport: ExplorerViewport): ExplorerWindowSize {
  return {
    width: Math.min(
      EXPLORER_WINDOW_DEFAULT_SIZE.width,
      Math.max(EXPLORER_WINDOW_MIN_SIZE.width, viewport.width - 32),
    ),
    height: Math.min(
      EXPLORER_WINDOW_DEFAULT_SIZE.height,
      Math.max(EXPLORER_WINDOW_MIN_SIZE.height, viewport.height - 128),
    ),
  };
}

function getInitialPosition(
  size: ExplorerWindowSize,
  viewport: ExplorerViewport,
): ExplorerWindowPosition {
  return {
    x: Math.max(16, (viewport.width - size.width) / 2 + 32),
    y: Math.max(16, (viewport.height - size.height) / 2 - 24),
  };
}


function clampExplorerPosition(
  x: number,
  y: number,
  width: number,
  viewport: ExplorerViewport,
): ExplorerWindowPosition {
  const minX = Math.min(0, MIN_VISIBLE_WIDTH - width);
  const maxX = Math.max(0, viewport.width - MIN_VISIBLE_WIDTH);
  const maxY = Math.max(
    0,
    viewport.height - EXPLORER_TITLEBAR_HEIGHT - EDGE_GAP,
  );

  return {
    x: Math.min(maxX, Math.max(minX, x)),
    y: Math.min(maxY, Math.max(0, y)),
  };
}


function useExplorerWindow() {
  const viewport = useViewportSize();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [size, setSize] = useState<ExplorerWindowSize>(() =>
    getInitialSize({ width: window.innerWidth, height: window.innerHeight }),
  );
  const [position, setPosition] = useState<ExplorerWindowPosition>(() =>
    getInitialPosition(
      getInitialSize({ width: window.innerWidth, height: window.innerHeight }),
      { width: window.innerWidth, height: window.innerHeight },
    ),
  );
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const dragState = useRef<DragState | null>(null);
  const resizeState = useRef<ResizeState | null>(null);

  
  
  
  
  
  
  
  
  
  
  
  
  
  const positionX = useMotionValue(position.x);
  const positionY = useMotionValue(position.y);

  const open = useCallback(() => {
    setIsClosing(false);
    setIsMinimized(false);
    setIsOpen(true);
  }, []);

  
  
  const close = useCallback(() => {
    if (isClosing) return;

    setIsMinimized(false);
    setIsClosing(true);
  }, [isClosing]);

  const finishClose = useCallback(() => {
    setIsOpen(false);
    setIsMaximized(false);
    setIsClosing(false);
  }, []);

  const minimize = useCallback(() => {
    if (isClosing) return;

    setIsMinimized(true);
  }, [isClosing]);

  const toggleMaximize = useCallback(() => {
    if (isClosing) return;

    setIsMaximized((current) => !current);
  }, [isClosing]);

  
  
  useEffect(() => {
    setPosition((current) =>
      clampExplorerPosition(current.x, current.y, size.width, viewport),
    );
  }, [size.width, viewport]);

  const startDrag = useCallback(
    (event: ReactPointerEvent<HTMLElement>) => {
      if (isMaximized || isClosing || event.button !== 0) return;
      if ((event.target as HTMLElement).closest("button")) return;

      event.preventDefault();
      event.currentTarget.setPointerCapture(event.pointerId);
      dragState.current = {
        pointerId: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
        originX: position.x,
        originY: position.y,
        latestX: position.x,
        latestY: position.y,
      };
      setIsDragging(true);
    },
    [isClosing, isMaximized, position.x, position.y],
  );

  const moveDrag = useCallback(
    (event: ReactPointerEvent<HTMLElement>) => {
      const drag = dragState.current;
      if (!drag || drag.pointerId !== event.pointerId) return;

      const next = clampExplorerPosition(
        drag.originX + event.clientX - drag.startX,
        drag.originY + event.clientY - drag.startY,
        size.width,
        viewport,
      );

      drag.latestX = next.x;
      drag.latestY = next.y;

      
      
      
      
      positionX.jump(next.x);
      positionY.jump(next.y);
    },
    [positionX, positionY, size.width, viewport],
  );

  const endDrag = useCallback(
    (event: ReactPointerEvent<HTMLElement>) => {
      const drag = dragState.current;
      if (!drag || drag.pointerId !== event.pointerId) return;

      dragState.current = null;
      setPosition({ x: drag.latestX, y: drag.latestY });
      setIsDragging(false);

      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }
    },
    [],
  );

  
  
  
  
  
  
  
  useLayoutEffect(() => {
    positionX.jump(position.x);
    positionY.jump(position.y);
  }, [positionX, positionY, position.x, position.y]);

  const startResize = useCallback(
    (event: ReactPointerEvent<HTMLElement>) => {
      if (isMaximized || isClosing || event.button !== 0) return;

      event.preventDefault();
      event.stopPropagation();
      event.currentTarget.setPointerCapture(event.pointerId);
      resizeState.current = {
        pointerId: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
        startWidth: size.width,
        startHeight: size.height,
      };
      setIsResizing(true);
    },
    [isClosing, isMaximized, size.height, size.width],
  );

  const moveResize = useCallback(
    (event: ReactPointerEvent<HTMLElement>) => {
      const resize = resizeState.current;
      if (!resize || resize.pointerId !== event.pointerId) return;

      const maxWidth = Math.max(
        EXPLORER_WINDOW_MIN_SIZE.width,
        viewport.width - position.x - 16,
      );
      const maxHeight = Math.max(
        EXPLORER_WINDOW_MIN_SIZE.height,
        viewport.height - position.y - 16,
      );

      setSize({
        width: Math.min(
          maxWidth,
          Math.max(
            EXPLORER_WINDOW_MIN_SIZE.width,
            resize.startWidth + event.clientX - resize.startX,
          ),
        ),
        height: Math.min(
          maxHeight,
          Math.max(
            EXPLORER_WINDOW_MIN_SIZE.height,
            resize.startHeight + event.clientY - resize.startY,
          ),
        ),
      });
    },
    [position.x, position.y, viewport],
  );

  const endResize = useCallback((event: ReactPointerEvent<HTMLElement>) => {
    const resize = resizeState.current;
    if (!resize || resize.pointerId !== event.pointerId) return;

    resizeState.current = null;
    setIsResizing(false);

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }, []);

  return {
    viewport,
    isOpen,
    isMinimized,
    isMaximized,
    isClosing,
    position,
    size,
    isDragging,
    isResizing,
    open,
    close,
    finishClose,
    minimize,
    toggleMaximize,
    dragHandlers: {
      onPointerDown: startDrag,
      onPointerMove: moveDrag,
      onPointerUp: endDrag,
      onPointerCancel: endDrag,
    },
    positionX,
    positionY,
    resizeHandlers: {
      onPointerDown: startResize,
      onPointerMove: moveResize,
      onPointerUp: endResize,
      onPointerCancel: endResize,
    },
  };
}


function useExplorerNavigation(finder: ExplorerFinderController) {
  const [behind, setBehind] = useState<string[]>([]);
  const [ahead, setAhead] = useState<string[]>([]);
  const path = finder.path;

  const remember = useCallback(
    (nextPath: string) => {
      if (nextPath === path) return false;

      setBehind((current) => [...current, path]);
      setAhead([]);
      return true;
    },
    [path],
  );

  const openFolder = useCallback(
    (nextPath: string) => {
      if (!remember(nextPath)) return;

      finder.openFolder(nextPath);
    },
    [finder.openFolder, remember],
  );

  const chooseLocation = useCallback(
    (location: FinderLocation) => {
      if (!remember(location.path)) return;

      finder.chooseLocation(location);
    },
    [finder.chooseLocation, remember],
  );

  const goBack = useCallback(() => {
    const previous = behind[behind.length - 1];
    if (previous === undefined) return;

    setBehind((current) => current.slice(0, -1));
    setAhead((current) => [path, ...current]);
    finder.openFolder(previous);
  }, [behind, finder.openFolder, path]);

  const goForward = useCallback(() => {
    const [next, ...rest] = ahead;
    if (next === undefined) return;

    setAhead(rest);
    setBehind((current) => [...current, path]);
    finder.openFolder(next);
  }, [ahead, finder.openFolder, path]);

  const resetNavigation = useCallback(() => {
    setBehind([]);
    setAhead([]);
    finder.resetFinder();
  }, [finder.resetFinder]);

  return {
    ...finder,
    canGoBack: behind.length > 0,
    canGoForward: ahead.length > 0,
    openFolder,
    chooseLocation,
    goBack,
    goForward,
    resetNavigation,
  };
}


export type ComputerExplorerOptions = {
  onOpenTerminal: (path: string) => void;
  
  onOpenFile: (path: string, name: string) => void;
};

export function useComputerExplorer({
  onOpenTerminal,
  onOpenFile,
}: ComputerExplorerOptions) {
  const windowState = useExplorerWindow();
  const finder = useExplorerNavigation(useExplorerFinder());
  const style = useExplorerStyle("grid");
  const hidden = useExplorerHidden();
  const wasOpenRef = useRef(false);

  
  const isReading = windowState.isOpen && !windowState.isMinimized;
  const folders = useExplorerFolders(finder.path, isReading);
  const storage = useExplorerStorage(isReading);

  
  
  const entries = visibleExplorerEntries(folders.entries, hidden.showHidden);

  
  
  const actions = useExplorerActions({
    folderPath: finder.path,
    entries: folders.entries,
    refresh: folders.refresh,
    onOpenTerminal,
  });

  
  
  useEffect(() => {
    if (!windowState.isOpen && wasOpenRef.current) {
      finder.resetNavigation();
    }
    wasOpenRef.current = windowState.isOpen;
  }, [finder.resetNavigation, windowState.isOpen]);

  
  
  const openEntry = useCallback(
    (entry: ExplorerEntry) => {
      if (entry.isDirectory) {
        finder.openFolder(entry.path);
        return;
      }

      onOpenFile(entry.path, entry.name);
    },
    [finder.openFolder, onOpenFile],
  );

  return {
    ...windowState,
    finder,
    style,
    folders,
    entries,
    hidden,
    actions,
    storage,
    openEntry,
  };
}

export type ComputerExplorerController = ReturnType<
  typeof useComputerExplorer
>;
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";



export type VscodeWindowPosition = {
  x: number;
  y: number;
};

export type VscodeWindowSize = {
  width: number;
  height: number;
};

export const VSCODE_WINDOW_DEFAULT_SIZE: VscodeWindowSize = {
  width: 980,
  height: 620,
};

export const VSCODE_WINDOW_MIN_SIZE: VscodeWindowSize = {
  width: 560,
  height: 360,
};

const VSCODE_HEADER_HEIGHT = 38;
const MIN_VISIBLE_WIDTH = 180;
const EDGE_GAP = 8;
const MINIMIZE_ANIMATION_MS = 240;
const CLOSE_ANIMATION_MS = 200;
const ANIMATION_BUFFER_MS = 20;

type DragState = {
  pointerId: number;
  startX: number;
  startY: number;
  originX: number;
  originY: number;
};

type ResizeState = {
  pointerId: number;
  startX: number;
  startY: number;
  startWidth: number;
  startHeight: number;
};

function getInitialSize(): VscodeWindowSize {
  const maxWidth = Math.max(
    VSCODE_WINDOW_MIN_SIZE.width,
    window.innerWidth - 32,
  );
  const maxHeight = Math.max(
    VSCODE_WINDOW_MIN_SIZE.height,
    window.innerHeight - 128,
  );

  return {
    width: Math.min(VSCODE_WINDOW_DEFAULT_SIZE.width, maxWidth),
    height: Math.min(VSCODE_WINDOW_DEFAULT_SIZE.height, maxHeight),
  };
}

function getInitialPosition(size: VscodeWindowSize): VscodeWindowPosition {
  return {
    x: Math.max(16, (window.innerWidth - size.width) / 2 - 24),
    y: Math.max(16, (window.innerHeight - size.height) / 2 - 28),
  };
}

function clampVscodePosition(
  x: number,
  y: number,
  width: number,
): VscodeWindowPosition {
  const minX = Math.min(0, MIN_VISIBLE_WIDTH - width);
  const maxX = Math.max(0, window.innerWidth - MIN_VISIBLE_WIDTH);
  const maxY = Math.max(0, window.innerHeight - VSCODE_HEADER_HEIGHT - EDGE_GAP);

  return {
    x: Math.min(maxX, Math.max(minX, x)),
    y: Math.min(maxY, Math.max(0, y)),
  };
}

export function useComputerVscode() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [isMinimizing, setIsMinimizing] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [size, setSize] = useState<VscodeWindowSize>(getInitialSize);
  const [position, setPosition] = useState<VscodeWindowPosition>(() =>
    getInitialPosition(getInitialSize()),
  );
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const dragState = useRef<DragState | null>(null);
  const resizeState = useRef<ResizeState | null>(null);
  const animationTimer = useRef<number | null>(null);

  const clearAnimationTimer = useCallback(() => {
    if (animationTimer.current !== null) {
      window.clearTimeout(animationTimer.current);
      animationTimer.current = null;
    }
  }, []);

  useEffect(() => {
    return () => clearAnimationTimer();
  }, [clearAnimationTimer]);

  const open = useCallback(() => {
    clearAnimationTimer();
    setIsClosing(false);
    setIsMinimizing(false);
    setIsOpen(true);
    setIsMinimized(false);
  }, [clearAnimationTimer]);

  const close = useCallback(() => {
    if (isClosing) return;

    clearAnimationTimer();
    setIsMinimizing(false);
    setIsClosing(true);

    animationTimer.current = window.setTimeout(() => {
      setIsOpen(false);
      setIsMinimized(false);
      setIsMaximized(false);
      setIsClosing(false);
      animationTimer.current = null;
    }, CLOSE_ANIMATION_MS + ANIMATION_BUFFER_MS);
  }, [clearAnimationTimer, isClosing]);

  const minimize = useCallback(() => {
    if (isMinimizing || isClosing) return;

    clearAnimationTimer();
    setIsMinimizing(true);

    animationTimer.current = window.setTimeout(() => {
      setIsMinimized(true);
      setIsMinimizing(false);
      animationTimer.current = null;
    }, MINIMIZE_ANIMATION_MS + ANIMATION_BUFFER_MS);
  }, [clearAnimationTimer, isClosing, isMinimizing]);

  const toggleMaximize = useCallback(() => {
    if (isMinimizing || isClosing) return;
    setIsMaximized((current) => !current);
  }, [isClosing, isMinimizing]);

  const startDrag = useCallback(
    (event: ReactPointerEvent<HTMLElement>) => {
      if (isMaximized || isMinimizing || isClosing || event.button !== 0) {
        return;
      }

      const target = event.target as HTMLElement;
      if (target.closest("button")) return;

      event.preventDefault();
      event.currentTarget.setPointerCapture(event.pointerId);
      dragState.current = {
        pointerId: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
        originX: position.x,
        originY: position.y,
      };
      setIsDragging(true);
    },
    [isClosing, isMaximized, isMinimizing, position.x, position.y],
  );

  const moveDrag = useCallback(
    (event: ReactPointerEvent<HTMLElement>) => {
      const drag = dragState.current;
      if (!drag || drag.pointerId !== event.pointerId) return;

      setPosition(
        clampVscodePosition(
          drag.originX + event.clientX - drag.startX,
          drag.originY + event.clientY - drag.startY,
          size.width,
        ),
      );
    },
    [size.width],
  );

  const endDrag = useCallback((event: ReactPointerEvent<HTMLElement>) => {
    const drag = dragState.current;
    if (!drag || drag.pointerId !== event.pointerId) return;

    dragState.current = null;
    setIsDragging(false);

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }, []);

  const startResize = useCallback(
    (event: ReactPointerEvent<HTMLElement>) => {
      if (isMaximized || isMinimizing || isClosing || event.button !== 0) {
        return;
      }

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
    [isClosing, isMaximized, isMinimizing, size.height, size.width],
  );

  const moveResize = useCallback(
    (event: ReactPointerEvent<HTMLElement>) => {
      const resize = resizeState.current;
      if (!resize || resize.pointerId !== event.pointerId) return;

      const maxWidth = Math.max(
        VSCODE_WINDOW_MIN_SIZE.width,
        window.innerWidth - position.x - 16,
      );
      const maxHeight = Math.max(
        VSCODE_WINDOW_MIN_SIZE.height,
        window.innerHeight - position.y - 16,
      );

      setSize({
        width: Math.min(
          maxWidth,
          Math.max(
            VSCODE_WINDOW_MIN_SIZE.width,
            resize.startWidth + event.clientX - resize.startX,
          ),
        ),
        height: Math.min(
          maxHeight,
          Math.max(
            VSCODE_WINDOW_MIN_SIZE.height,
            resize.startHeight + event.clientY - resize.startY,
          ),
        ),
      });
    },
    [position.x, position.y],
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
    isOpen,
    isMinimized,
    isMaximized,
    isMinimizing,
    isClosing,
    position,
    size,
    isDragging,
    isResizing,
    open,
    close,
    minimize,
    toggleMaximize,
    dragHandlers: {
      onPointerDown: startDrag,
      onPointerMove: moveDrag,
      onPointerUp: endDrag,
      onPointerCancel: endDrag,
    },
    resizeHandlers: {
      onPointerDown: startResize,
      onPointerMove: moveResize,
      onPointerUp: endResize,
      onPointerCancel: endResize,
    },
  };
}

export type ComputerVscodeController = ReturnType<typeof useComputerVscode>;

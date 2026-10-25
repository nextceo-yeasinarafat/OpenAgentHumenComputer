import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";



export type WindowPosition = {
  x: number;
  y: number;
};

export type WindowSize = {
  width: number;
  height: number;
};


export const CHROMIUM_WINDOW_DEFAULT_SIZE: WindowSize = {
  width: 1440,
  height: 810,
};

export const CHROMIUM_WINDOW_MIN_SIZE: WindowSize = {
  width: 640,
  height: 400,
};


const DEFAULT_ASPECT = 16 / 9;


const CHROMIUM_WINDOW_BAR_HEIGHT = 44;


const CHROMIUM_WINDOW_BORDER = 1;


const MIN_BODY_HEIGHT = 300;

const HEADER_HEIGHT = 44;
const MIN_VISIBLE_WIDTH = 160;
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

function getInitialSize(): WindowSize {
  const maxBodyWidth =
    Math.max(CHROMIUM_WINDOW_MIN_SIZE.width, window.innerWidth - 32) -
    CHROMIUM_WINDOW_BORDER;
  const maxBodyHeight =
    Math.max(CHROMIUM_WINDOW_MIN_SIZE.height, window.innerHeight - 128) -
    CHROMIUM_WINDOW_BAR_HEIGHT -
    CHROMIUM_WINDOW_BORDER;

  let bodyWidth = Math.min(CHROMIUM_WINDOW_DEFAULT_SIZE.width, maxBodyWidth);
  let bodyHeight = Math.round(bodyWidth / DEFAULT_ASPECT);

  if (bodyHeight > maxBodyHeight) {
    bodyHeight = maxBodyHeight;
    bodyWidth = Math.round(bodyHeight * DEFAULT_ASPECT);
  }

  return {
    width: bodyWidth + CHROMIUM_WINDOW_BORDER,
    height: bodyHeight + CHROMIUM_WINDOW_BAR_HEIGHT + CHROMIUM_WINDOW_BORDER,
  };
}

function getInitialPosition(size: WindowSize): WindowPosition {
  return {
    x: Math.max(16, (window.innerWidth - size.width) / 2),
    y: Math.max(16, (window.innerHeight - size.height) / 2 - 40),
  };
}

function clampWindowPosition(
  x: number,
  y: number,
  width: number,
): WindowPosition {
  const minX = Math.min(0, MIN_VISIBLE_WIDTH - width);
  const maxX = Math.max(0, window.innerWidth - MIN_VISIBLE_WIDTH);
  const maxY = Math.max(0, window.innerHeight - HEADER_HEIGHT - EDGE_GAP);

  return {
    x: Math.min(maxX, Math.max(minX, x)),
    y: Math.min(maxY, Math.max(0, y)),
  };
}

export function useComputerChromium() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [isMinimizing, setIsMinimizing] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [size, setSize] = useState<WindowSize>(getInitialSize);
  const [position, setPosition] = useState<WindowPosition>(() =>
    getInitialPosition(getInitialSize()),
  );
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const dragState = useRef<DragState | null>(null);
  const resizeState = useRef<ResizeState | null>(null);
  const animationTimer = useRef<number | null>(null);
  
  
  const aspectRef = useRef(DEFAULT_ASPECT);

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
    dragState.current = null;
    resizeState.current = null;
    setIsDragging(false);
    setIsResizing(false);

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

  
  const setScreenAspect = useCallback((width: number, height: number) => {
    if (width <= 0 || height <= 0) return;

    aspectRef.current = width / height;
  }, []);

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
        clampWindowPosition(
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
        CHROMIUM_WINDOW_MIN_SIZE.width,
        window.innerWidth - position.x - 16,
      );
      const maxHeight = Math.max(
        CHROMIUM_WINDOW_MIN_SIZE.height,
        window.innerHeight - position.y - 16,
      );

      const width = Math.min(
        maxWidth,
        Math.max(
          CHROMIUM_WINDOW_MIN_SIZE.width,
          resize.startWidth + event.clientX - resize.startX,
        ),
      );

      
      
      const bodyWidth = Math.max(1, width - CHROMIUM_WINDOW_BORDER * 2);
      const maxBodyHeight = Math.max(
        MIN_BODY_HEIGHT,
        maxHeight - CHROMIUM_WINDOW_BAR_HEIGHT - CHROMIUM_WINDOW_BORDER * 2,
      );

      let bodyHeight = Math.round(bodyWidth / aspectRef.current);

      if (bodyHeight > maxBodyHeight) bodyHeight = maxBodyHeight;
      if (bodyHeight < MIN_BODY_HEIGHT) bodyHeight = MIN_BODY_HEIGHT;

      setSize({
        width: Math.round(bodyHeight * aspectRef.current) + CHROMIUM_WINDOW_BORDER * 2,
        height:
          bodyHeight + CHROMIUM_WINDOW_BAR_HEIGHT + CHROMIUM_WINDOW_BORDER * 2,
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
    setScreenAspect,
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

export type ComputerChromiumController = ReturnType<typeof useComputerChromium>;

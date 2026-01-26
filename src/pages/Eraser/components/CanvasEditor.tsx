
import React, { useRef, useEffect, useState } from 'react';
import { Point } from '../types';
import { ToolMode } from './Toolbar';

interface CanvasEditorProps {
  image: HTMLImageElement;
  brushSize: number;
  tolerance: number;
  zoom: number;
  toolMode: ToolMode;
  bgColor: string;
  onSaveHistory: (dataUrl: string) => void;
  triggerUndo: string | null;
  triggerRedo: string | null;
}

const CanvasEditor: React.FC<CanvasEditorProps> = ({
  image,
  brushSize,
  tolerance,
  zoom,
  toolMode,
  bgColor,
  onSaveHistory,
  triggerUndo,
  triggerRedo
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const contextRef = useRef<CanvasRenderingContext2D | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const sourceCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const [isDrawing, setIsDrawing] = useState(false);
  const [cursorPos, setCursorPos] = useState<Point | null>(null);
  const [isHovering, setIsHovering] = useState(false);
  const [pan, setPan] = useState<Point>({ x: 0, y: 0 }); // Pan state

  // Refs for panning
  const isPanning = useRef(false);
  const lastPanPos = useRef<Point>({ x: 0, y: 0 });

  // Keep track of toolMode for event listeners
  const toolModeRef = useRef(toolMode);
  useEffect(() => {
    toolModeRef.current = toolMode;
  }, [toolMode]);

  // Initialize canvas
  useEffect(() => {
    setPan({ x: 0, y: 0 }); // Reset pan on new image
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !image || !container) return;

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    const maxWidth = container.clientWidth - 80;
    const maxHeight = window.innerHeight * 0.6;

    let displayWidth = image.width;
    let displayHeight = image.height;

    const ratio = Math.min(maxWidth / displayWidth, maxHeight / displayHeight, 1);
    displayWidth *= ratio;
    displayHeight *= ratio;

    canvas.width = displayWidth;
    canvas.height = displayHeight;

    // Create source canvas for restoration
    const sourceCanvas = document.createElement('canvas');
    sourceCanvas.width = displayWidth;
    sourceCanvas.height = displayHeight;
    const sCtx = sourceCanvas.getContext('2d');
    if (sCtx) {
      sCtx.drawImage(image, 0, 0, displayWidth, displayHeight);
      sourceCanvasRef.current = sourceCanvas;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(image, 0, 0, displayWidth, displayHeight);

    contextRef.current = ctx;
    onSaveHistory(canvas.toDataURL());

    // Add non-passive event listeners to ensure we can prevent default
    const preventDefault = (e: TouchEvent) => {
      // We handle prevention in the React handlers now, but we need this listener to be non-passive
      // to allow preventDefault() to work there? No, React's event system might be passive.
      // Actually providing non-passive listeners here is safer for `touchmove`.
      if (e.cancelable) e.preventDefault();
    };

    // We can't attach directly to React events with passive:false easily.
    // So we attach native listeners.
    const handleTouchStart = (e: TouchEvent) => {
      if (e.cancelable) e.preventDefault();
      // Forwarding to React handler isn't easy here. 
      // But since we prevent default, React might not get it if we stop propagation?
      // Actually, if we just want to stop SCROLLING, `e.preventDefault` in React handler works IF the event is not passive.
      // React 18+ touches are passive by default?
      // Let's just enforce `e.preventDefault` for all touches on canvas via native listener
      // EXCEPT if we want to allow something?
      // But we want to BLOCK scrolling always now (since we use JS pan).
    };

    // Actually, just blocking everything is fine, we handle logic in React handlers.
    // Wait, if I add a native listener that calls preventDefault, React's onClick might effectively be blocked or work?
    // React `onTouchStart` will fire.

    canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
    canvas.addEventListener('touchmove', handleTouchStart, { passive: false });
    canvas.addEventListener('touchend', handleTouchStart, { passive: false });

    return () => {
      canvas.removeEventListener('touchstart', handleTouchStart);
      canvas.removeEventListener('touchmove', handleTouchStart);
      canvas.removeEventListener('touchend', handleTouchStart);
    };
  }, [image]);

  // Handle Undo/Redo
  useEffect(() => {
    const dataUrl = triggerUndo || triggerRedo;
    if (!dataUrl) return;

    const canvas = canvasRef.current;
    const ctx = contextRef.current;
    if (!canvas || !ctx) return;

    const img = new Image();
    img.onload = () => {
      ctx.save();
      ctx.globalCompositeOperation = 'source-over';
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      ctx.restore();
    };
    img.src = dataUrl;
  }, [triggerUndo, triggerRedo]);

  // Helper: Get Coordinates
  const getCoordinates = (e: React.MouseEvent | React.TouchEvent | MouseEvent | TouchEvent): Point => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    let clientX, clientY;

    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = (e as MouseEvent).clientX;
      clientY = (e as MouseEvent).clientY;
    }

    return {
      x: (clientX - rect.left) * (canvas.width / rect.width),
      y: (clientY - rect.top) * (canvas.height / rect.height)
    };
  };

  // Helper: Flood Fill
  const performFloodFill = (startX: number, startY: number) => {
    const canvas = canvasRef.current;
    const ctx = contextRef.current;
    if (!canvas || !ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;
    const startPos = (Math.round(startY) * width + Math.round(startX)) * 4;
    const startR = data[startPos];
    const startG = data[startPos + 1];
    const startB = data[startPos + 2];
    const startA = data[startPos + 3];

    if (startA === 0) return;

    const stack = [[Math.round(startX), Math.round(startY)]];
    const visited = new Uint8Array(width * height);

    while (stack.length) {
      const [x, y] = stack.pop()!;
      const pixelIndex = (y * width + x);
      const pos = pixelIndex * 4;

      if (x < 0 || x >= width || y < 0 || y >= height || visited[pixelIndex]) continue;

      visited[pixelIndex] = 1;

      const r = data[pos];
      const g = data[pos + 1];
      const b = data[pos + 2];
      const a = data[pos + 3];

      const diff = Math.pow(r - startR, 2) + Math.pow(g - startG, 2) + Math.pow(b - startB, 2) + Math.pow(a - startA, 2);
      const threshold = (tolerance / 100) * (255 * 255 * 4);

      if (diff <= threshold) {
        data[pos + 3] = 0;
        stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
      }
    }
    ctx.putImageData(imageData, 0, 0);
    onSaveHistory(canvas.toDataURL());
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    if (e.cancelable) e.preventDefault(); // Always prevent default to stop scrolling
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;

    if (toolMode === 'move') {
      isPanning.current = true;
      lastPanPos.current = { x: clientX, y: clientY };
      return;
    }

    // Only allow drawing if clicking on canvas
    if (e.target !== canvasRef.current) return;

    const pos = getCoordinates(e);

    if (toolMode === 'magic-wand') {
      performFloodFill(pos.x, pos.y);
      return;
    }

    setIsDrawing(true);
    const ctx = contextRef.current;

    if (ctx) {
      if (toolMode === 'erase') {
        ctx.globalCompositeOperation = 'destination-out';
        ctx.strokeStyle = 'rgba(0,0,0,1)';
      } else {
        ctx.globalCompositeOperation = 'source-over';
        if (sourceCanvasRef.current) {
          const pattern = ctx.createPattern(sourceCanvasRef.current, 'no-repeat');
          if (pattern) ctx.strokeStyle = pattern;
        }
      }

      ctx.beginPath();
      ctx.moveTo(pos.x, pos.y);
      ctx.lineWidth = brushSize;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
    }
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (e.cancelable) e.preventDefault();
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;

    if (isPanning.current && toolMode === 'move') {
      const dx = clientX - lastPanPos.current.x;
      const dy = clientY - lastPanPos.current.y;
      setPan(prev => ({ x: prev.x + dx, y: prev.y + dy }));
      lastPanPos.current = { x: clientX, y: clientY };
      return;
    }

    const pos = getCoordinates(e);
    setCursorPos(pos);

    if (!isDrawing) return;

    const ctx = contextRef.current;
    if (ctx) {
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
    }
  };

  const stopDrawing = () => {
    if (isPanning.current) {
      isPanning.current = false;
      return;
    }
    if (isDrawing) {
      setIsDrawing(false);
      const canvas = canvasRef.current;
      if (canvas) {
        onSaveHistory(canvas.toDataURL());
      }
    }
  };

  const getVisibleCursorPos = () => {
    if (!cursorPos || !canvasRef.current) return null;
    const canvas = canvasRef.current;
    return {
      x: cursorPos.x * (canvas.offsetWidth / canvas.width),
      y: cursorPos.y * (canvas.offsetHeight / canvas.height)
    };
  };

  const visibleCursor = getVisibleCursorPos();

  const getCursorStyle = () => {
    if (toolMode === 'magic-wand') {
      return (
        <div
          className="absolute pointer-events-none text-purple-600 drop-shadow-md"
          style={{
            left: `${visibleCursor!.x}px`,
            top: `${visibleCursor!.y}px`,
            transform: 'translate(-0%, -100%)', // Tip of wand at cursor
            fontSize: '24px',
            zIndex: 50
          }}
        >
          🪄
        </div>
      );
    }

    return (
      <div
        className={`absolute pointer-events-none rounded-full border border-white shadow-[0_0_0_1px_rgba(0,0,0,0.3)] ${toolMode === 'erase' ? 'bg-blue-400/30' : 'bg-green-400/30'}`}
        style={{
          width: `${brushSize}px`,
          height: `${brushSize}px`,
          left: `${visibleCursor!.x}px`,
          top: `${visibleCursor!.y}px`,
          transform: 'translate(-50%, -50%)',
          zIndex: 50
        }}
      >
        <div className="absolute inset-0 flex items-center justify-center opacity-30">
          {toolMode === 'erase' ? (
            <svg className="w-1/2 h-1/2 text-white" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
          ) : (
            <svg className="w-1/2 h-1/2 text-white" viewBox="0 0 20 20" fill="currentColor"><path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" /></svg>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="w-full flex flex-col items-center justify-center p-0 overflow-hidden relative"
      style={{ height: '70vh' }}
    >
      <div
        className="w-full h-full overflow-hidden bg-transparent flex items-center justify-center touch-none"
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
        onTouchStart={startDrawing}
        onTouchMove={draw}
        onTouchEnd={stopDrawing}
      >
        <div
          className={`relative shadow-2xl transition-all duration-75 ${toolMode === 'move' ? 'cursor-grab active:cursor-grabbing' : 'cursor-none'} ${bgColor === 'checkerboard' ? 'checkerboard-lg shadow-black/10' : 'shadow-black/20'}`}
          onMouseEnter={() => setIsHovering(true)}
          onMouseLeave={() => setIsHovering(false)}
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: 'center center',
            // smoother panning
            transition: isPanning.current ? 'none' : 'transform 0.1s cubic-bezier(0.4, 0, 0.2, 1)',
            flexShrink: 0,
            backgroundColor: bgColor !== 'checkerboard' ? bgColor : undefined,
            // Add a subtle border for white images on white bg
            border: bgColor === '#ffffff' ? '1px solid #e2e8f0' : 'none'
          }}
        >
          <canvas
            ref={canvasRef}
            className={`block rounded-[2px] touch-none`}
          />

          {isHovering && visibleCursor && getCursorStyle()}
        </div>
      </div>
    </div>
  );
};

export default CanvasEditor;

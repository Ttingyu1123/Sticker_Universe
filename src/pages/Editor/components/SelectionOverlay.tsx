import React, { useState, useEffect, useRef } from 'react';
import { Layer } from '../types';
import { Maximize, RotateCw } from 'lucide-react';

interface SelectionOverlayProps {
  layer: Layer;
  onUpdate: (updates: Partial<Layer>) => void;
  onCommit: (updates: Partial<Layer>) => void;
}

export const SelectionOverlay: React.FC<SelectionOverlayProps> = ({
  layer,
  onUpdate,
  onCommit,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeOperation, setActiveOperation] = useState<'move' | 'resize' | 'rotate' | null>(null);

  // Store initial state for calculations
  const initialData = useRef({
    startX: 0,
    startY: 0,
    layerX: 0,
    layerY: 0,
    centerX: 0,
    centerY: 0,
    startScale: 1,
    startDist: 0,
    startAngle: 0, // Angle of the mouse relative to center at start
    initialRotation: 0, // Layer rotation at start
  });

  // Helper to get client coordinates from Mouse or Touch events
  const getCoords = (e: MouseEvent | TouchEvent | React.MouseEvent | React.TouchEvent) => {
    if ('touches' in e && e.touches.length > 0) {
      return { x: e.touches[0].clientX, y: e.touches[0].clientY };
    } else if ('clientX' in e) {
      return { x: (e as MouseEvent).clientX, y: (e as MouseEvent).clientY };
    }
    return { x: 0, y: 0 };
  };

  const handleStart = (
    e: React.MouseEvent | React.TouchEvent,
    operation: 'move' | 'resize' | 'rotate'
  ) => {
    // Prevent default browser zooming/scrolling on touch
    // But allow default if we are not processing (e.g. multi-touch) - simple case for now
    e.stopPropagation();
    // Only prevent default for mouse to avoid text selection. 
    // For touch, preventing default might block scroll if missed, but here we hit the target.
    if (e.type === 'mousedown') e.preventDefault();

    const coords = getCoords(e);

    // Calculate reliable center based on the overlay element's screen position
    // This accounts for Zoom, Scroll, and Parent offsets automatically
    const rect = containerRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    initialData.current = {
      startX: coords.x,
      startY: coords.y,
      layerX: layer.x,
      layerY: layer.y,
      centerX,
      centerY,
      startScale: layer.scale,
      startDist: Math.hypot(coords.x - centerX, coords.y - centerY),
      startAngle: Math.atan2(coords.y - centerY, coords.x - centerX),
      initialRotation: layer.rotation,
    };

    setActiveOperation(operation);
  };

  useEffect(() => {
    if (!activeOperation) return;

    const onMove = (e: MouseEvent | TouchEvent) => {
      e.preventDefault(); // Prevent scrolling while dragging
      const coords = getCoords(e);
      const {
        startX, startY, layerX, layerY,
        centerX, centerY,
        startScale, startDist, startAngle, initialRotation
      } = initialData.current;

      if (activeOperation === 'move') {
        const dx = coords.x - startX;
        const dy = coords.y - startY;
        onUpdate({ x: layerX + dx, y: layerY + dy });
      }
      else if (activeOperation === 'resize') {
        const currentDist = Math.hypot(coords.x - centerX, coords.y - centerY);
        // Avoid division by zero
        const scaleFactor = startDist > 0 ? currentDist / startDist : 1;
        const newScale = Math.max(0.1, startScale * scaleFactor);
        onUpdate({ scale: newScale });
      }
      else if (activeOperation === 'rotate') {
        const currentAngle = Math.atan2(coords.y - centerY, coords.x - centerX);
        const angleDiff = currentAngle - startAngle;
        const angleDeg = angleDiff * (180 / Math.PI);
        onUpdate({ rotation: initialRotation + angleDeg });
      }
    };

    const onEnd = () => {
      setActiveOperation(null);
      onCommit({});
    };

    window.addEventListener('mousemove', onMove, { passive: false });
    window.addEventListener('mouseup', onEnd);
    window.addEventListener('touchmove', onMove, { passive: false });
    window.addEventListener('touchend', onEnd);

    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onEnd);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend', onEnd);
    };
  }, [activeOperation, onUpdate, onCommit]);

  // Scaled dimensions for the overlay box
  const scaledWidth = layer.width * layer.scale;
  const scaledHeight = layer.height * layer.scale;

  return (
    <div
      className="absolute top-0 left-0 pointer-events-none z-[9999]"
      style={{ width: 0, height: 0, overflow: 'visible' }}
    >
      <div
        ref={containerRef}
        className="absolute group cursor-move pointer-events-auto touch-none" // touch-none prevents browser gestures
        style={{
          left: layer.x,
          top: layer.y,
          width: scaledWidth,
          height: scaledHeight,
          transform: `translate(-50%, -50%) rotate(${layer.rotation}deg)`,
          transformOrigin: 'center center',
        }}
        onMouseDown={(e) => handleStart(e, 'move')}
        onTouchStart={(e) => handleStart(e, 'move')}
      >
        {/* Selection Border */}
        <div className="absolute inset-0 border-2 border-blue-500 rounded-sm"></div>

        {/* Resize Handles */}
        {[
          { pos: '-top-4 -left-4', cursor: 'cursor-nwse-resize' },
          { pos: '-top-4 -right-4', cursor: 'cursor-nesw-resize' },
          { pos: '-bottom-4 -left-4', cursor: 'cursor-nesw-resize' },
          { pos: '-bottom-4 -right-4', cursor: 'cursor-nwse-resize' }
        ].map((handle, i) => (
          <div
            key={i}
            className={`absolute ${handle.pos} w-8 h-8 flex items-center justify-center ${handle.cursor} z-20`}
            onMouseDown={(e) => handleStart(e, 'resize')}
            onTouchStart={(e) => handleStart(e, 'resize')}
          >
            <div className="w-4 h-4 bg-white border-2 border-blue-500 rounded-full shadow-sm hover:bg-blue-50" />
          </div>
        ))}

        {/* Rotate Handle (Top Center) */}
        <div
          className="absolute -top-10 left-1/2 -translate-x-1/2 w-8 h-8 flex items-center justify-center cursor-grab z-20"
          onMouseDown={(e) => handleStart(e, 'rotate')}
          onTouchStart={(e) => handleStart(e, 'rotate')}
        >
          <div className="w-4 h-4 bg-white border-2 border-blue-500 rounded-full shadow-sm hover:bg-blue-50 flex items-center justify-center">
            <RotateCw size={10} className="text-blue-500" />
          </div>
          {/* Visual connection line */}
          <div className="absolute top-full left-1/2 w-0.5 h-4 bg-blue-500 -translate-x-1/2 pointer-events-none" />
        </div>
      </div>
    </div>
  );
};

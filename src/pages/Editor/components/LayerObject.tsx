import React, { useRef, useEffect, useState } from 'react';
import { Layer } from '../types';

interface LayerObjectProps {
  layer: Layer;
  isSelected: boolean;
  onSelect: () => void;
  onUpdate: (updates: Partial<Layer>) => void;
  onCommit: (updates: Partial<Layer>) => void;
}

export const LayerObject: React.FC<LayerObjectProps> = ({
  layer,
  isSelected,
  onSelect,
  onUpdate,
  onCommit,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [initialPos, setInitialPos] = useState({ x: 0, y: 0 });

  // Handle Dragging (Only for unselected layers to select-and-drag, or just click-select)
  // If selected, the Overlay handles the events (as it's on top)
  const handleMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect();

    // Logic: If I click an unselected layer, I select it.
    // I also want to start dragging it immediately.
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
    setInitialPos({ x: layer.x, y: layer.y });
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        const dx = e.clientX - dragStart.x;
        const dy = e.clientY - dragStart.y;
        onUpdate({ x: initialPos.x + dx, y: initialPos.y + dy });
      }
    };

    const handleMouseUp = () => {
      if (isDragging) {
        setIsDragging(false);
        onCommit({});
      }
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragStart, initialPos, onUpdate, onCommit]);

  // SVG Text Rendering Logic
  const renderTextLayer = () => {
    if (!layer.textProps) return null;
    const {
      color,
      fontSize,
      fontFamily,
      strokeColor,
      strokeWidth,
      doubleStroke,
      doubleStrokeColor,
      doubleStrokeWidth,
      shadow,
      shadowColor,
      shadowBlur,
      shadowOffsetX,
      shadowOffsetY
    } = layer.textProps;

    const totalWidth = layer.width || 300;
    const totalHeight = layer.height || 150;

    return (
      <svg
        width="100%"
        height="100%"
        viewBox={`0 0 ${totalWidth} ${totalHeight}`}
        style={{ overflow: 'visible' }}
      >
        <g
          style={{
            fontFamily,
            fontSize: `${fontSize}px`,
            fontWeight: 'bold',
            textAnchor: 'middle',
            dominantBaseline: 'middle',
            filter: shadow ? `drop-shadow(${shadowOffsetX}px ${shadowOffsetY}px ${shadowBlur}px ${shadowColor})` : 'none'
          }}
          transform={`translate(${totalWidth / 2}, ${totalHeight / 2})`}
        >
          {doubleStroke && (
            <text
              stroke={doubleStrokeColor}
              strokeWidth={doubleStrokeWidth + strokeWidth}
              strokeLinejoin="round"
              strokeLinecap="round"
              fill="none"
            >
              {layer.content}
            </text>
          )}

          <text
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            strokeLinejoin="round"
            strokeLinecap="round"
            fill="none"
          >
            {layer.content}
          </text>

          <text fill={color}>
            {layer.content}
          </text>
        </g>
      </svg>
    );
  };

  return (
    <div
      className="absolute group select-none"
      style={{
        left: layer.x,
        top: layer.y,
        width: layer.width,
        height: layer.height,
        transform: `translate(-50%, -50%) rotate(${layer.rotation}deg) scale(${layer.scale}) scaleX(${layer.flipX ? -1 : 1})`,
        transformOrigin: 'center center',
      }}
      onMouseDown={handleMouseDown}
    >
      <div className="w-full h-full relative">
        {layer.type === 'text' ? (
          renderTextLayer()
        ) : (
          <img
            src={layer.content}
            alt="Layer"
            className="w-full h-full object-contain pointer-events-none"
            draggable={false}
          />
        )}
      </div>

      {/* Note: No Selection controls here. They are in SelectionOverlay now. */}
    </div>
  );
};

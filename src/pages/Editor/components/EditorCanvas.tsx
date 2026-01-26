import React, { useRef } from 'react';
import { Layer, CanvasConfig } from '../types';
import { LayerObject } from './LayerObject';
import { SelectionOverlay } from './SelectionOverlay';

interface EditorCanvasProps {
  layers: Layer[];
  selectedLayerId: string | null;
  onSelectLayer: (id: string | null) => void;
  onUpdateLayer: (id: string, updates: Partial<Layer>) => Layer[];
  onCommitLayer: (layers: Layer[]) => void;
  config: CanvasConfig;
  zoom: number;
}

export const EditorCanvas: React.FC<EditorCanvasProps> = ({
  layers,
  selectedLayerId,
  config,
  zoom,
  onSelectLayer,
  onUpdateLayer,
  onCommitLayer,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const selectedLayer = layers.find(l => l.id === selectedLayerId);

  // Deselect when clicking empty background
  const handleBackgroundClick = (e: React.MouseEvent) => {
    // If clicking the gray area (container) or the artboard itself directly (not a layer)
    // We deselect.
    // Note: Layers stopPropagation, so this only fires for background.
    onSelectLayer(null);
  };

  // We scale the artboard visually using transform
  // To make scrollbars work, we need the container to maintain the correct "scrollable" size
  // or use the flex-center strategy with adequate padding.

  return (
    <div
      ref={containerRef}
      className="w-full h-full overflow-auto flex items-center justify-center bg-slate-200/50 p-12 cursor-default select-none relative"
      onMouseDown={handleBackgroundClick}
    >
      {/* Artboard Wrapper to fix scale/scroll issues if needed, currently direct scale works with flex-center if items shrink/grow */}
      <div
        className="relative transition-all duration-200 ease-out flex-shrink-0"
        style={{
          width: config.width,
          height: config.height,
          transform: `scale(${zoom})`,
          transformOrigin: 'center center'
        }}
      >
        {/* Content Layer (Clipped) */}
        <div
          className={`absolute inset-0 shadow-2xl ${config.showGrid && 'bg-grid-pattern'} ${config.shape === 'circle' ? 'rounded-full overflow-hidden' :
              config.shape === 'rounded' ? 'rounded-[3rem] overflow-hidden' : ''
            }`}
          style={{ backgroundColor: config.showGrid ? 'transparent' : config.backgroundColor }}
        >
          {/* Center Marker for Visual Aid */}
          {config.showGrid && (
            <>
              <div className="absolute top-1/2 left-1/2 w-4 h-0.5 bg-blue-500/30 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-50" />
              <div className="absolute top-1/2 left-1/2 w-0.5 h-4 bg-blue-500/30 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-50" />
            </>
          )}

          {layers.map((layer) => (
            <LayerObject
              key={layer.id}
              layer={layer}
              isSelected={layer.id === selectedLayerId}
              onSelect={() => onSelectLayer(layer.id)}
              onUpdate={(updates) => onUpdateLayer(layer.id, updates)}
              onCommit={(updates) => {
                const updated = onUpdateLayer(layer.id, updates);
                onCommitLayer(updated);
              }}
            />
          ))}
        </div>

        {/* Render Selection Overlay on TOP of clipped content, in the non-clipped parent */}
        {selectedLayer && (
          <SelectionOverlay
            layer={selectedLayer}
            onUpdate={(updates) => onUpdateLayer(selectedLayer.id, updates)}
            onCommit={(updates) => {
              const updated = onUpdateLayer(selectedLayer.id, updates);
              onCommitLayer(updated);
            }}
          />
        )}
      </div>
    </div>
  );
};

import React from 'react';
import { Layer } from '../types';
import { SelectionOverlay } from '../../../features/editor-core';

interface LayerCanvasProps {
    layers: Layer[];
    selectedLayerId: string | null;
    onSelectLayer: (id: string | null) => void;
    onUpdateLayer: (id: string, updates: Partial<Layer>) => void;
    canvasRef: React.RefObject<HTMLDivElement>;
    zoom?: number;
    width?: number;
    height?: number;
}

// ... TextLayerRenderer ...
const TextLayerRenderer: React.FC<{ layer: Layer }> = ({ layer }) => {
    // Dynamic Sizing Logic
    const padding = (layer.doubleStrokeWidth || 0) * 4 + (layer.strokeWidth || 0) * 2 + 20; // Extra padding for strokes

    // Approximate width helper
    // We can't easily use canvas measureText inside render without side effects or memo, 
    // but doing it on the fly is "okay" for this scale. 
    // Ideally this should be calculated in the parent or memoized.
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (ctx) {
        ctx.font = `bold ${layer.fontSize || 24}px ${layer.fontFamily || 'sans-serif'}`;
    }
    const textMetrics = ctx ? ctx.measureText(layer.content) : { width: layer.content.length * (layer.fontSize || 24) * 0.6 };

    // We override these locally for rendering the SVG, but the layer.width/height is used for the selection box
    const textWidth = textMetrics.width;
    const textHeight = (layer.fontSize || 24) * 1.2; // Approximation

    const svgWidth = textWidth + padding * 2;
    const svgHeight = textHeight + padding * 2;
    const centerX = svgWidth / 2;
    const centerY = svgHeight / 2;

    return (
        <div className={`relative animate-${layer.animation}`}>
            <svg
                width={svgWidth}
                height={svgHeight}
                viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                style={{ overflow: 'visible' }}
            >
                <g
                    transform={`translate(${centerX}, ${centerY})`}
                    style={{
                        fontSize: layer.fontSize || 24,
                        fontFamily: layer.fontFamily || 'sans-serif',
                        fontWeight: 'bold',
                        textAnchor: 'middle',
                        dominantBaseline: 'middle'
                    }}
                >
                    {/* Double Stroke Layer */}
                    {layer.doubleStrokeWidth && layer.doubleStrokeWidth > 0 && (
                        <text
                            stroke={layer.doubleStrokeColor || '#000000'}
                            strokeWidth={(layer.strokeWidth || 0) + (layer.doubleStrokeWidth * 2)}
                            strokeLinejoin="round"
                            strokeLinecap="round"
                            fill="none"
                        >
                            {layer.content}
                        </text>
                    )}

                    {/* Primary Stroke Layer */}
                    {layer.strokeWidth && layer.strokeWidth > 0 && (
                        <text
                            stroke={layer.strokeColor || '#ffffff'}
                            strokeWidth={layer.strokeWidth}
                            strokeLinejoin="round"
                            strokeLinecap="round"
                            fill="none"
                        >
                            {layer.content}
                        </text>
                    )}

                    {/* Fill Layer */}
                    <text fill={layer.color || '#000000'}>
                        {layer.content}
                    </text>
                </g>
            </svg>
        </div>
    );
};

export const LayerCanvas: React.FC<LayerCanvasProps> = ({
    layers,
    selectedLayerId,
    onSelectLayer,
    onUpdateLayer,
    canvasRef,
    zoom = 1,
    width = 320,
    height = 270
}) => {
    // When clicking the background (not a layer), deselect.
    const handleBackgroundClick = () => {
        onSelectLayer(null);
    };

    const selectedLayer = layers.find(l => l.id === selectedLayerId);

    // Update text layer width/height roughly if it's way off (optional refinement)
    // For now, we rely on the initial width/height or manual updates. 
    // A robust system would update layer.width/height whenever content/font changes via useEffect in the parent or here.

    return (
        <div
            className="w-full h-full overflow-auto flex items-center justify-center bg-gray-100/50 p-8 cursor-default select-none relative"
            onClick={handleBackgroundClick}
        >
            {/* 
              Wrapper to handle Zoom and isolating the overflow:hidden content 
              from the overflow:visible controls 
            */}
            <div
                className="relative transition-all duration-200 ease-out flex-shrink-0 shadow-xl"
                style={{
                    width: width,
                    height: height,
                    transform: `scale(${zoom})`,
                    transformOrigin: 'center center',
                    backgroundImage: `
                        linear-gradient(45deg, #f0f0f0 25%, transparent 25%),
                        linear-gradient(-45deg, #f0f0f0 25%, transparent 25%),
                        linear-gradient(45deg, transparent 75%, #f0f0f0 75%),
                        linear-gradient(-45deg, transparent 75%, #f0f0f0 75%)
                    `,
                    backgroundSize: '20px 20px',
                    backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px',
                    backgroundColor: 'white'
                }}
            >
                {/* 
                   Content Area - Clipped
                   This is what gets exported (ref=canvasRef)
                */}
                <div
                    ref={canvasRef}
                    className="absolute inset-0 overflow-hidden"
                >
                    {layers.map(layer => (
                        <div
                            key={layer.id}
                            className={`absolute select-none cursor-pointer ${selectedLayerId === layer.id ? 'z-10' : 'z-0'}`}
                            style={{
                                left: layer.x,
                                top: layer.y,
                                width: layer.width,
                                height: layer.height,
                                transform: `translate(-50%, -50%) scale(${layer.scale}) rotate(${layer.rotation}deg)`,
                                transformOrigin: 'center center',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}
                            onClick={(e) => {
                                e.stopPropagation();
                                onSelectLayer(layer.id);
                            }}
                        >
                            {/* Inner content wrapper */}
                            <div className="relative w-full h-full flex items-center justify-center">
                                {layer.type === 'image' ? (
                                    <img
                                        src={layer.content}
                                        alt="layer"
                                        className={`filter drop-shadow-lg animate-${layer.animation}`}
                                        style={{
                                            width: '100%',
                                            height: '100%',
                                            objectFit: 'contain'
                                        }}
                                        draggable={false}
                                    />
                                ) : (
                                    <TextLayerRenderer layer={layer} />
                                )}
                            </div>
                        </div>
                    ))}

                    {layers.length === 0 && (
                        <div className="absolute inset-0 flex items-center justify-center text-slate-300 pointer-events-none">
                            Empty Canvas
                        </div>
                    )}
                </div>

                {/* 
                   Selection Overlay - Visible (Not Clipped)
                   Placed on top of the clipped content but within the scaled wrapper
                */}
                {selectedLayer && (
                    <SelectionOverlay
                        // @ts-ignore - Types might mismatch slightly but we aligned width/height requirements
                        layer={selectedLayer}
                        onUpdate={(updates) => onUpdateLayer(selectedLayer.id, updates)}
                        onCommit={(updates) => onUpdateLayer(selectedLayer.id, updates)}
                    />
                )}
            </div>
        </div>
    );
};

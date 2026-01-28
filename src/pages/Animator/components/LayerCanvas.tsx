import React, { useRef, useState, useEffect } from 'react';
import { Layer } from '../types';

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
    // Basic Drag Logic
    const [isDragging, setIsDragging] = useState(false);
    const dragStartPos = useRef({ x: 0, y: 0 });
    const layerStartPos = useRef({ x: 0, y: 0 });

    const handlePointerDown = (e: React.PointerEvent, layer: Layer) => {
        e.stopPropagation();
        onSelectLayer(layer.id);
        setIsDragging(true);
        dragStartPos.current = { x: e.clientX, y: e.clientY };
        layerStartPos.current = { x: layer.x, y: layer.y };

        // Capture pointer so we don't lose drag if moving fast
        (e.target as HTMLElement).setPointerCapture(e.pointerId);
    };

    const handlePointerMove = (e: React.PointerEvent) => {
        if (!isDragging || !selectedLayerId) return;

        const dx = (e.clientX - dragStartPos.current.x) / zoom;
        const dy = (e.clientY - dragStartPos.current.y) / zoom;

        onUpdateLayer(selectedLayerId, {
            x: layerStartPos.current.x + dx,
            y: layerStartPos.current.y + dy
        });
    };

    const handlePointerUp = (e: React.PointerEvent) => {
        setIsDragging(false);
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    };

    return (
        <div
            className="border border-slate-200 relative overflow-hidden select-none bg-white shadow-lg mx-auto"
            style={{
                width: width,
                height: height,
                backgroundImage: `
                    linear-gradient(45deg, #f0f0f0 25%, transparent 25%),
                    linear-gradient(-45deg, #f0f0f0 25%, transparent 25%),
                    linear-gradient(45deg, transparent 75%, #f0f0f0 75%),
                    linear-gradient(-45deg, transparent 75%, #f0f0f0 75%)
                `,
                backgroundSize: '20px 20px',
                backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px'
            }}
            onClick={() => onSelectLayer(null)} // Click background to deselect
        >
            {/* Export Container - Fully Transparent */}
            <div
                ref={canvasRef}
                className="w-full h-full relative"
            >
                {layers.map(layer => (
                    <div
                        key={layer.id}
                        className={`absolute cursor-move group select-none ${selectedLayerId === layer.id ? 'z-10 ring-2 ring-violet-500' : 'z-0'}`}
                        style={{
                            transform: `translate(${layer.x}px, ${layer.y}px) scale(${layer.scale}) rotate(${layer.rotation}deg)`,
                            transformOrigin: 'center',
                        }}
                        onPointerDown={(e) => handlePointerDown(e, layer)}
                        onPointerMove={handlePointerMove}
                        onPointerUp={handlePointerUp}
                    >
                        {/* Render Content */}
                        <div id={`layer-${layer.id}`} className="relative">
                            {/* We add id here for the exporter to find it */}
                            {layer.type === 'image' ? (
                                <img
                                    src={layer.content}
                                    alt="layer"
                                    className={`w-32 h-32 object-contain filter drop-shadow-lg animate-${layer.animation}`}
                                    draggable={false}
                                />
                            ) : <TextLayerRenderer layer={layer} />
                            }
                        </div>

                        {/* Selection Indicator (optional, ring handles it above) */}
                    </div>
                ))}

                {layers.length === 0 && (
                    <div className="absolute inset-0 flex items-center justify-center text-slate-300 pointer-events-none">
                        Empty Canvas
                    </div>
                )}
            </div>
        </div>
    );
};

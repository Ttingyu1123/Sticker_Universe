import React, { useRef, useState, useEffect } from 'react';
import { Layer } from '../types';

interface LayerCanvasProps {
    layers: Layer[];
    selectedLayerId: string | null;
    onSelectLayer: (id: string | null) => void;
    onUpdateLayer: (id: string, updates: Partial<Layer>) => void;
    canvasRef: React.RefObject<HTMLDivElement>;
}

export const LayerCanvas: React.FC<LayerCanvasProps> = ({
    layers,
    selectedLayerId,
    onSelectLayer,
    onUpdateLayer,
    canvasRef
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

        const dx = e.clientX - dragStartPos.current.x;
        const dy = e.clientY - dragStartPos.current.y;

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
            className="w-[320px] h-[270px] border border-slate-200 relative overflow-hidden select-none bg-white shadow-lg mx-auto"
            style={{
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
                            ) : (
                                <div
                                    className={`whitespace-nowrap font-bold filter drop-shadow-md animate-${layer.animation}`}
                                    style={{
                                        fontSize: layer.fontSize || 24,
                                        color: layer.color || '#000000',
                                        fontFamily: layer.fontFamily || 'sans-serif'
                                    }}
                                >
                                    {layer.content}
                                </div>
                            )}
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

import React, { useRef, useState } from 'react';
import Draggable from 'react-draggable';
import { X, Maximize2 } from 'lucide-react';

interface DraggableImageProps {
    id: string;
    src: string;
    width: number;
    height: number;
    isSelected: boolean;
    onSelect: (id: string) => void;
    onDelete: (id: string) => void;
    gridSize?: number;
    isExporting?: boolean;
}

export const DraggableImage: React.FC<DraggableImageProps> = ({
    id,
    src,
    width,
    height,
    isSelected,
    onSelect,
    onDelete,
    gridSize = 0,
    isExporting = false
}) => {
    const nodeRef = useRef(null);
    const [scale, setScale] = useState(1);

    const handleWheel = (e: React.WheelEvent) => {
        if (isSelected) {
            e.stopPropagation();
            const delta = e.deltaY * -0.001;
            setScale(prev => Math.min(Math.max(0.5, prev + delta), 3));
        }
    };

    const handleResizeMouseDown = (e: React.MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();
        const startY = e.clientY;
        const startScale = scale;

        const handleMouseMove = (moveEvent: MouseEvent) => {
            const deltaY = moveEvent.clientY - startY;
            const newScale = Math.min(Math.max(0.5, startScale + deltaY * 0.01), 3);
            setScale(newScale);
        };

        const handleMouseUp = () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
    };

    const handleResizeTouchStart = (e: React.TouchEvent) => {
        e.stopPropagation();
        // Don't prevent default here immediately or it might block other things, 
        // but for a dedicated resize handle it's usually fine.
        // e.preventDefault(); 
        const touch = e.touches[0];
        const startY = touch.clientY;
        const startScale = scale;

        const handleTouchMove = (moveEvent: TouchEvent) => {
            // Prevent scrolling while resizing
            if (moveEvent.cancelable) moveEvent.preventDefault();

            const touchMove = moveEvent.touches[0];
            const deltaY = touchMove.clientY - startY;
            const newScale = Math.min(Math.max(0.5, startScale + deltaY * 0.01), 3);
            setScale(newScale);
        };

        const handleTouchEnd = () => {
            window.removeEventListener('touchmove', handleTouchMove);
            window.removeEventListener('touchend', handleTouchEnd);
        };

        window.addEventListener('touchmove', handleTouchMove, { passive: false });
        window.addEventListener('touchend', handleTouchEnd);
    };

    return (
        <Draggable
            nodeRef={nodeRef}
            handle=".drag-handle"
            defaultPosition={{ x: 0, y: 0 }}
            grid={gridSize > 0 ? [gridSize, gridSize] : undefined}
            onStart={() => onSelect(id)}
        >
            <div
                ref={nodeRef}
                className={`absolute inline-block group ${isSelected ? 'z-50' : 'z-10 hover:z-[40]'}`}
                style={{ width: width * scale, height: height * scale }}
                onWheel={handleWheel}
            >
                <div
                    className="relative w-full h-full drag-handle cursor-move transition-all duration-200"
                    style={{
                        boxShadow: isSelected
                            ? '0 0 0 2px #8b5cf6, 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' // isSelected: Ring + Shadow XL
                            : '0 0 0 0 transparent' // Default: no ring
                    }}
                    onMouseEnter={(e) => {
                        if (!isSelected) e.currentTarget.style.boxShadow = '0 0 0 1px #c4b5fd';
                    }}
                    onMouseLeave={(e) => {
                        if (!isSelected) e.currentTarget.style.boxShadow = '0 0 0 0 transparent';
                    }}
                >
                    <img
                        src={src}
                        alt="Sticker"
                        className="w-full h-full object-contain pointer-events-none"
                    />

                    {/* Controls overlay - Conditionally rendered during export to prevent html2canvas errors */}
                    {!isExporting && (
                        <div className={`export-ignore transition-opacity duration-200 ${isSelected ? 'opacity-100 pointer-events-auto' : 'opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto'}`}>
                            <button
                                onClick={(e) => { e.stopPropagation(); onDelete(id); }}
                                onTouchEnd={(e) => { e.stopPropagation(); onDelete(id); }} // Add touch support for delete
                                className="absolute -top-3 -right-3 w-6 h-6 rounded-full flex items-center justify-center transition-colors z-50 hover:brightness-110"
                                style={{
                                    backgroundColor: '#ef4444',
                                    color: '#ffffff',
                                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
                                }}
                            >
                                <X size={12} />
                            </button>

                            {/* Resize Handle - Increased touch target for mobile (40px) */}
                            <div
                                onMouseDown={handleResizeMouseDown}
                                onTouchStart={handleResizeTouchStart}
                                className="absolute -bottom-5 -right-5 w-10 h-10 rounded-full flex items-center justify-center cursor-se-resize z-50 transition-transform active:scale-90 hover:brightness-110"
                                style={{
                                    backgroundColor: '#7c3aed',
                                    color: '#ffffff',
                                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
                                }}
                            >
                                <Maximize2 size={16} className="rotate-90" />
                            </div>

                            <div
                                className="absolute -bottom-8 left-1/2 -translate-x-1/2 px-2 py-1 rounded-full whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50"
                                style={{
                                    backgroundColor: '#1e293b',
                                    color: '#ffffff',
                                    fontSize: '10px',
                                    boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
                                }}
                            >
                                Drag corner to Scale
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </Draggable>
    );
};

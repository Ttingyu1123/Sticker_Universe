import React, { useRef, useEffect, useState } from 'react';
import { EditorTool, CropRect, Guide } from '../types';
import { composeImage } from '../utils/exportUtils';

interface EditorCanvasProps {
    originalImage: HTMLImageElement | null;
    maskCanvas: HTMLCanvasElement | null;
    tool: EditorTool;
    brushSize: number;
    brushHardness: number;

    // Viewport
    zoom: number;
    pan: { x: number, y: number };
    bgColor?: 'checkerboard' | 'white' | 'black';
    tolerance?: number;

    // Advanced Data
    cropRect: CropRect | null;
    guides: Guide[];

    // Callbacks
    onPanChange: (newPan: { x: number, y: number }) => void;
    onCropChange?: (rect: CropRect) => void;
    onGuidesChange?: (guides: Guide[]) => void;
    onInteractionEnd: () => void;

    // Effects (Legacy/Future)
    strokeConfig?: { enabled: boolean; color: string; size: number; };
    shadowConfig?: { enabled: boolean; color: string; blur: number; offset: { x: number, y: number }; };
}

export const EditorCanvas: React.FC<EditorCanvasProps> = ({
    originalImage,
    maskCanvas,
    tool,
    brushSize,
    brushHardness,
    zoom,
    pan,
    bgColor = 'checkerboard',
    tolerance = 10,
    cropRect,
    guides,
    onPanChange,
    onCropChange,
    onGuidesChange,
    onInteractionEnd,
    strokeConfig,
    shadowConfig
}) => {
    // 3 Layers
    const previewCanvasRef = useRef<HTMLCanvasElement>(null); // Layer 1: Image + Mask + Crop Dimming
    const brushCanvasRef = useRef<HTMLCanvasElement>(null);   // Layer 2: Active Brush Strokes
    const overlayCanvasRef = useRef<HTMLCanvasElement>(null); // Layer 3: UI (Crop Frame, Guides, Cursor)
    const containerRef = useRef<HTMLDivElement>(null);

    const [isDrawing, setIsDrawing] = useState(false);
    const lastPanPos = useRef<{ x: number, y: number } | null>(null);
    const [cursorPos, setCursorPos] = useState({ x: -1000, y: -1000 });
    const [cropCursor, setCropCursor] = useState('default');

    // Crop Interaction State
    const [activeHandle, setActiveHandle] = useState<string | null>(null); // 'tl', 'tr', 'bl', 'br', 'body' or guide-id
    const dragStartRef = useRef<{ x: number, y: number, rect: CropRect } | null>(null);
    const guideStartRef = useRef<{ id: string, pos: number } | null>(null); // For guides

    // Hit Testing for Crop Handles
    const getCropHandle = (x: number, y: number, zoom: number): string | null => {
        if (!cropRect) return null;
        const { x: cx, y: cy, width: cw, height: ch } = cropRect;
        const s = 20 / zoom; // Handle size (internal pixels) - make it generous

        // Corners
        if (Math.abs(x - cx) < s && Math.abs(y - cy) < s) return 'tl';
        if (Math.abs(x - (cx + cw)) < s && Math.abs(y - cy) < s) return 'tr';
        if (Math.abs(x - cx) < s && Math.abs(y - (cy + ch)) < s) return 'bl';
        if (Math.abs(x - (cx + cw)) < s && Math.abs(y - (cy + ch)) < s) return 'br';

        // Edges (Optional, simple rect check for body move?)
        // if (x > cx && x < cx + cw && y > cy && y < cy + ch) return 'body';

    };

    const getGuideHandle = (x: number, y: number, zoom: number): string | null => {
        if (!cropRect) return null;
        const s = 10 / zoom; // Hit margin
        for (const g of guides) {
            if (g.type === 'horizontal') {
                if (Math.abs(y - g.pos) < s && x >= cropRect.x && x <= cropRect.x + cropRect.width) return g.id;
            } else {
                if (Math.abs(x - g.pos) < s && y >= cropRect.y && y <= cropRect.y + cropRect.height) return g.id;
            }
        }
        return null;
    };

    // --- RENDER PIPELINE ---

    // 1. Preview Layer: Renders Original masked by Mask + Effects
    const renderPreview = () => {
        const canvas = previewCanvasRef.current;
        if (!canvas || !originalImage || !maskCanvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Use shared logic to compose image with effects
        const composed = composeImage(originalImage, maskCanvas, strokeConfig, shadowConfig);

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        if (composed) {
            ctx.globalCompositeOperation = 'source-over';
            ctx.drawImage(composed, 0, 0);
        } else {
            // Fallback
            ctx.globalCompositeOperation = 'source-over';
            ctx.drawImage(originalImage, 0, 0);
            ctx.globalCompositeOperation = 'destination-in';
            ctx.drawImage(maskCanvas, 0, 0);
        }

        // Apply Crop Dimming
        if (cropRect) {
            ctx.globalCompositeOperation = 'source-over';
            ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            ctx.fillRect(0, 0, canvas.width, cropRect.y);
            ctx.fillRect(0, cropRect.y + cropRect.height, canvas.width, canvas.height - (cropRect.y + cropRect.height));
            ctx.fillRect(0, cropRect.y, cropRect.x, cropRect.height);
            ctx.fillRect(cropRect.x + cropRect.width, cropRect.y, canvas.width - (cropRect.x + cropRect.width), cropRect.height);
        }
    };

    useEffect(() => {
        const canvas = previewCanvasRef.current;
        if (canvas && originalImage) {
            if (canvas.width !== originalImage.width || canvas.height !== originalImage.height) {
                canvas.width = originalImage.width;
                canvas.height = originalImage.height;
            }
        }
        renderPreview();
    }, [originalImage, maskCanvas, cropRect, strokeConfig, shadowConfig]);


    // 2. Brush Layer & Logic (Ported from MaskCanvas)
    const paint = (x: number, y: number) => {
        if (!maskCanvas || tool === 'move' || tool === 'crop') return;
        const ctx = maskCanvas.getContext('2d');
        if (!ctx) return;

        if (tool === 'magic-wand') {
            performMagicWand(x, y);
            return;
        }

        // Configuration
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.lineWidth = brushSize;

        ctx.save();
        const softness = (1 - brushHardness) * 20;
        ctx.shadowBlur = softness;
        ctx.shadowColor = 'black';

        if (tool === 'erase') {
            ctx.globalCompositeOperation = 'destination-out';
            ctx.strokeStyle = 'rgba(0,0,0,1)';
            ctx.fillStyle = 'rgba(0,0,0,1)';
        } else if (tool === 'restore') {
            ctx.globalCompositeOperation = 'source-over';
            ctx.strokeStyle = 'rgba(0,0,0,1)';
            ctx.fillStyle = 'rgba(0,0,0,1)';
        }

        ctx.beginPath();
        ctx.arc(x, y, brushSize / 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.restore();

        // Trigger Preview Update
        renderPreview();
    };


    // Magic Wand Implementation
    const performMagicWand = (startX: number, startY: number) => {
        if (!maskCanvas || !originalImage) return;
        const width = maskCanvas.width;
        const height = maskCanvas.height;

        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = width;
        tempCanvas.height = height;
        const tempCtx = tempCanvas.getContext('2d');
        if (!tempCtx) return;
        tempCtx.drawImage(originalImage, 0, 0);
        const imagePixelData = tempCtx.getImageData(0, 0, width, height);

        const maskCtx = maskCanvas.getContext('2d', { willReadFrequently: true });
        if (!maskCtx) return;
        const maskPixelData = maskCtx.getImageData(0, 0, width, height);

        const srcData = imagePixelData.data;
        const destData = maskPixelData.data;

        const pX = Math.round(startX);
        const pY = Math.round(startY);
        if (pX < 0 || pX >= width || pY < 0 || pY >= height) return;

        const startIdx = (pY * width + pX) * 4;
        const startR = srcData[startIdx];
        const startG = srcData[startIdx + 1];
        const startB = srcData[startIdx + 2];
        const startA = srcData[startIdx + 3];

        const stack = [[pX, pY]];
        const visited = new Uint8Array(width * height);
        const tol = (tolerance || 10) * 1;

        while (stack.length) {
            const [x, y] = stack.pop()!;
            const idx = (y * width + x);
            if (visited[idx]) continue;

            visited[idx] = 1;

            const pos = idx * 4;
            const r = srcData[pos];
            const g = srcData[pos + 1];
            const b = srcData[pos + 2];
            const a = srcData[pos + 3];

            const diff = Math.abs(r - startR) + Math.abs(g - startG) + Math.abs(b - startB) + Math.abs(a - startA);

            if (diff <= tol * 3) {
                destData[pos + 3] = 0; // Erase
                if (x > 0) stack.push([x - 1, y]);
                if (x < width - 1) stack.push([x + 1, y]);
                if (y > 0) stack.push([x, y - 1]);
                if (y < height - 1) stack.push([x, y + 1]);
            }
        }

        maskCtx.putImageData(maskPixelData, 0, 0);
        renderPreview();
    };

    // 3. Overlay Layer: Renders Crop Frame & Guides
    // We render this in standard React render or Canvas?
    // User requested "Overlay Canvas".
    useEffect(() => {
        const canvas = overlayCanvasRef.current;
        if (!canvas || !originalImage) return;

        if (canvas.width !== originalImage.width || canvas.height !== originalImage.height) {
            canvas.width = originalImage.width;
            canvas.height = originalImage.height;
        }

        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw Crop Rect
        if (cropRect) {
            ctx.strokeStyle = 'white';
            ctx.lineWidth = 2 / zoom; // Keep 2px visual
            ctx.setLineDash([5 / zoom, 5 / zoom]);
            ctx.strokeRect(cropRect.x, cropRect.y, cropRect.width, cropRect.height);
            ctx.setLineDash([]);

            // Draw Corners (Simple)
            ctx.fillStyle = 'white';
            const s = 10 / zoom;
            ctx.fillRect(cropRect.x - s / 2, cropRect.y - s / 2, s, s); // TL
            ctx.fillRect(cropRect.x + cropRect.width - s / 2, cropRect.y - s / 2, s, s); // TR
            ctx.fillRect(cropRect.x - s / 2, cropRect.y + cropRect.height - s / 2, s, s); // BL
            ctx.fillRect(cropRect.x + cropRect.width - s / 2, cropRect.y + cropRect.height - s / 2, s, s); // BR
        }

        // Draw Guides
        ctx.strokeStyle = 'cyan';
        ctx.lineWidth = 1 / zoom;
        guides.forEach(g => {
            ctx.beginPath();
            if (g.type === 'horizontal') {
                ctx.moveTo(0, g.pos);
                ctx.lineTo(canvas.width, g.pos);
            } else {
                ctx.moveTo(g.pos, 0);
                ctx.lineTo(g.pos, canvas.height);
            }
            ctx.stroke();
        });

    }, [cropRect, guides, zoom, originalImage]);


    // Interaction Handling (Pointer Events)
    const getPointerPos = (e: React.MouseEvent | React.TouchEvent) => {
        if (!containerRef.current || !originalImage) return { x: 0, y: 0 };
        const rect = containerRef.current.getBoundingClientRect();
        const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;

        // Calculate offset within container (Visual)
        const offsetX = clientX - rect.left;
        const offsetY = clientY - rect.top;

        // Map to Canvas Internal Coordinate (Image pixels)
        // logic: (offset - pan) / zoom
        // Center is at 50% 50%, processed by CSS transform. 
        // But our container handles the events.
        // Wait, the CSS transform is on the CANVAS elements, not the container? 
        // In MaskCanvas, transform was on canvas. Attempts to map pointer were complex.

        // Let's use the same logic as MaskCanvas:
        // MaskCanvas used:
        // offsetX * scaleX where scaleX = internal / visual.
        // But internal canvas is FULL SIZE. visual is transformed.

        // Easier approach: Reverse the CSS Transform.
        // Center of image is at container center + pan.
        // x_visual = (x_img - w/2) * zoom + pan_x + container_w/2
        // x_img = ((x_visual - container_w/2 - pan_x) / zoom) + w/2

        const containerW = rect.width;
        const containerH = rect.height;
        const imgW = originalImage.width;
        const imgH = originalImage.height;

        const x_img = ((offsetX - containerW / 2 - pan.x) / zoom) + imgW / 2;
        const y_img = ((offsetY - containerH / 2 - pan.y) / zoom) + imgH / 2;

        return { x: x_img, y: y_img };
    };

    const handleMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
        e.stopPropagation(); // Prevent drag on parent

        const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;

        if (tool === 'move') {
            lastPanPos.current = { x: clientX, y: clientY };
            setIsDrawing(true);
            return;
        }

        const { x, y } = getPointerPos(e);

        if (tool === 'crop' && cropRect) {
            // Check Guides
            if (onGuidesChange) {
                const guideId = getGuideHandle(x, y, zoom);
                if (guideId) {
                    const g = guides.find(gd => gd.id === guideId);
                    if (g) {
                        setActiveHandle('guide');
                        guideStartRef.current = { id: guideId, pos: g.pos };
                        dragStartRef.current = { x, y, rect: cropRect };
                        setIsDrawing(true);
                        return;
                    }
                }
            }

            const handle = getCropHandle(x, y, zoom);
            if (handle) {
                setActiveHandle(handle);
                dragStartRef.current = { x, y, rect: { ...cropRect } };
                setIsDrawing(true);
                return;
            }
        }

        setIsDrawing(true);
        paint(x, y);
    };

    const handleMouseMove = (e: React.MouseEvent | React.TouchEvent) => {
        // Handle Pan
        if (tool === 'move' && isDrawing && lastPanPos.current) {
            const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
            const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
            const dx = clientX - lastPanPos.current.x;
            const dy = clientY - lastPanPos.current.y;
            onPanChange({ x: pan.x + dx, y: pan.y + dy });
            lastPanPos.current = { x: clientX, y: clientY };
            return;
        }

        const { x, y } = getPointerPos(e);

        // Update Cursor UI
        const rect = containerRef.current?.getBoundingClientRect();
        if (rect) {
            const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
            const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
            setCursorPos({ x: clientX - rect.left, y: clientY - rect.top });
        }

        // Update Crop/Guide Cursor (Hover)
        if (tool === 'crop' && !isDrawing) {
            const guideId = getGuideHandle(x, y, zoom);
            if (guideId) {
                const g = guides.find(gd => gd.id === guideId);
                setCropCursor(g?.type === 'horizontal' ? 'row-resize' : 'col-resize');
            } else {
                const handle = getCropHandle(x, y, zoom);
                if (handle === 'tl' || handle === 'br') setCropCursor('nwse-resize');
                else if (handle === 'tr' || handle === 'bl') setCropCursor('nesw-resize');
                else setCropCursor('default');
            }
        }

        if (isDrawing && tool !== 'move') {
            if (tool === 'crop' && dragStartRef.current) {
                // Drag Guide
                if (activeHandle === 'guide' && guideStartRef.current && onGuidesChange) {
                    const dx = x - dragStartRef.current.x;
                    const dy = y - dragStartRef.current.y;
                    const { id, pos } = guideStartRef.current;
                    const guide = guides.find(g => g.id === id);
                    if (guide) {
                        const newPos = pos + (guide.type === 'horizontal' ? dy : dx);

                        // Clamp to crop area
                        if (cropRect) {
                            const min = (guide.type === 'horizontal' ? cropRect.y : cropRect.x);
                            const max = (guide.type === 'horizontal' ? cropRect.y + cropRect.height : cropRect.x + cropRect.width);
                            const clampedPos = Math.max(min, Math.min(max, newPos));
                            const newGuides = guides.map(g => g.id === id ? { ...g, pos: clampedPos } : g);
                            onGuidesChange(newGuides);
                        }
                    }
                }
                // Drag Crop Handle
                else if (activeHandle && activeHandle !== 'guide' && onCropChange) {
                    // Calculate Delta
                    const dx = x - dragStartRef.current.x;
                    const dy = y - dragStartRef.current.y;
                    const startRect = dragStartRef.current.rect;

                    let newRect = { ...startRect };

                    if (activeHandle === 'tl') {
                        newRect.x += dx; newRect.y += dy;
                        newRect.width -= dx; newRect.height -= dy;
                    } else if (activeHandle === 'tr') {
                        newRect.y += dy;
                        newRect.width += dx; newRect.height -= dy;
                    } else if (activeHandle === 'bl') {
                        newRect.x += dx;
                        newRect.width -= dx; newRect.height += dy;
                    } else if (activeHandle === 'br') {
                        newRect.width += dx; newRect.height += dy;
                    }

                    // Constraints
                    const minSize = 10;

                    // Horizontal Constraint
                    if (activeHandle === 'tl' || activeHandle === 'bl') {
                        const right = startRect.x + startRect.width;
                        if (newRect.x > right - minSize) {
                            newRect.x = right - minSize;
                            newRect.width = minSize;
                        }
                    } else {
                        if (newRect.width < minSize) {
                            newRect.width = minSize;
                        }
                    }

                    // Vertical Constraint
                    if (activeHandle === 'tl' || activeHandle === 'tr') {
                        const bottom = startRect.y + startRect.height;
                        if (newRect.y > bottom - minSize) {
                            newRect.y = bottom - minSize;
                            newRect.height = minSize;
                        }
                    } else {
                        if (newRect.height < minSize) {
                            newRect.height = minSize;
                        }
                    }

                    onCropChange(newRect);
                }
            } else {
                paint(x, y);
            }
        }
    };

    const handleMouseUp = () => {
        if (isDrawing && tool !== 'move') {
            onInteractionEnd();
        }
        setIsDrawing(false);
        lastPanPos.current = null;
        setActiveHandle(null);
        dragStartRef.current = null;
        guideStartRef.current = null;
    };


    return (
        <div
            ref={containerRef}
            className="relative w-full h-full overflow-hidden touch-none select-none flex items-center justify-center"
            style={{ cursor: tool === 'move' ? 'grab' : (tool === 'crop' ? cropCursor : 'none') }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={() => { handleMouseUp(); setCursorPos({ x: -1000, y: -1000 }); }}
            onTouchStart={handleMouseDown}
            onTouchMove={handleMouseMove}
            onTouchEnd={handleMouseUp}
        >
            {/* Canvas Stack Container - Transformed via CSS */}
            <div
                className="absolute shadow-2xl"
                style={{
                    width: originalImage?.width || 0,
                    height: originalImage?.height || 0,
                    transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                    transformOrigin: 'center',
                }}
            >
                {/* 1. Preview Layer (Bottom) */}
                <canvas
                    ref={previewCanvasRef}
                    className={`absolute inset-0 pointer-events-none ${bgColor === 'checkerboard' ? 'bg-[url(https://img.ly/assets/demo-assets/transparent-bg.png)]' : ''}`}
                    style={{
                        backgroundColor: bgColor === 'checkerboard' ? 'transparent' : bgColor,
                        backgroundSize: '20px 20px'
                    }}
                />

                {/* 2. Brush Layer (Middle) - Optional if we just draw to Mask directly. 
                    Actually we draw to offscreen maskCanvas, so this layer might be redundant 
                    if 'Preview' renders everything. 
                    BUT for performance we might want to draw transient strokes here before committing?
                    For now, simplifed: Preview Layer renders everything.
                */}

                {/* 3. Overlay Layer (Top) - Crop & Guides */}
                <canvas
                    ref={overlayCanvasRef}
                    className="absolute inset-0 pointer-events-none"
                />
            </div>

            {/* Cursor (Screen Space) */}
            {(tool === 'erase' || tool === 'restore') && (
                <div
                    className="absolute pointer-events-none rounded-full border border-white shadow-[0_0_2px_rgba(0,0,0,0.8)] z-50 mix-blend-difference box-content"
                    style={{
                        width: (brushSize * 2 + (1 - brushHardness) * 40) * zoom,
                        height: (brushSize * 2 + (1 - brushHardness) * 40) * zoom,
                        left: cursorPos.x,
                        top: cursorPos.y,
                        transform: 'translate(-50%, -50%)',
                    }}
                />
            )}
        </div>
    );
};

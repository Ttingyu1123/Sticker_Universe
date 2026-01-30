import React, { useRef, useEffect, useState } from 'react';

interface MaskCanvasProps {
    originalImage: HTMLImageElement | null;
    maskCanvas: HTMLCanvasElement | null;
    tool: 'erase' | 'restore' | 'magic-wand' | 'move' | 'crop';
    brushSize: number;
    brushHardness: number; // 0 to 1
    zoom?: number;
    pan?: { x: number, y: number };
    bgColor?: 'checkerboard' | 'white' | 'black';
    tolerance?: number;
    onPanChange?: (newPan: { x: number, y: number }) => void;
    onInteractionEnd?: () => void;
    historyVersion?: number;
    // Effects
    strokeConfig?: {
        enabled: boolean;
        color: string;
        size: number;
    };
    shadowConfig?: {
        enabled: boolean;
        color: string;
        blur: number;
        offset: { x: number, y: number };
    };
}

export const MaskCanvas: React.FC<MaskCanvasProps> = ({
    originalImage,
    maskCanvas,
    tool,
    brushSize,
    brushHardness,
    zoom = 1,
    pan = { x: 0, y: 0 },
    bgColor = 'checkerboard',
    tolerance = 10,
    onPanChange,

    onInteractionEnd,
    historyVersion = 0,
    strokeConfig,
    shadowConfig
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);

    const lastPanPos = useRef<{ x: number, y: number } | null>(null);
    const [cursorPos, setCursorPos] = useState({ x: -1000, y: -1000 });
    // Cache for effects to avoid continuous re-calculation if possible, 
    // though simplicity favors re-running render.

    const requestRef = useRef<number>();

    // Initial Setup & Redraw Loop
    useEffect(() => {
        if (!canvasRef.current || !originalImage || !maskCanvas) return;

        const canvas = canvasRef.current;

        // Match canvas size to image size
        // We render at full resolution, but scale via CSS
        if (canvas.width !== originalImage.width || canvas.height !== originalImage.height) {
            canvas.width = originalImage.width;
            canvas.height = originalImage.height;
        }

        const render = () => {
            const ctx = canvas.getContext('2d');
            if (!ctx) return;

            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // 1. Draw Original Image
            ctx.globalCompositeOperation = 'source-over';
            ctx.drawImage(originalImage, 0, 0);

            // 2. Apply Mask (Destination-In)
            // This crops the original image to the shape of the mask
            ctx.globalCompositeOperation = 'destination-in';
            ctx.drawImage(maskCanvas, 0, 0);

            // Reset
            ctx.globalCompositeOperation = 'source-over';
        };

        render();

        // We could run a loop, but we only strictly need to re-render when interactions happen.
        // For smoother brush strokes, we might trigger render on mouse move.

    }, [originalImage, maskCanvas, tool, brushSize, bgColor, historyVersion, strokeConfig, shadowConfig]);

    const renderCanvas = () => {
        if (!canvasRef.current || !originalImage || !maskCanvas) return;
        const ctx = canvasRef.current.getContext('2d');
        if (!ctx) return;

        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);

        // 1. Draw Original (or Effects Result)
        // If we have effects, we need to process the whole stack
        if ((strokeConfig?.enabled || shadowConfig?.enabled) && !isDrawing) {
            drawWithEffects(ctx);
        } else {
            // Standard Fast Render
            ctx.globalCompositeOperation = 'source-over';
            ctx.drawImage(originalImage, 0, 0);
            ctx.globalCompositeOperation = 'destination-in';
            ctx.drawImage(maskCanvas, 0, 0);
            ctx.globalCompositeOperation = 'source-over';
        }
    };

    const drawWithEffects = (ctx: CanvasRenderingContext2D) => {
        if (!originalImage || !maskCanvas) return;
        const w = originalImage.width;
        const h = originalImage.height;

        // 1. Create Cutout
        const cutoutCanvas = document.createElement('canvas');
        cutoutCanvas.width = w; cutoutCanvas.height = h;
        const cCtx = cutoutCanvas.getContext('2d')!;
        cCtx.drawImage(originalImage, 0, 0);
        cCtx.globalCompositeOperation = 'destination-in';
        cCtx.drawImage(maskCanvas, 0, 0);
        cCtx.globalCompositeOperation = 'source-over';

        // 2. Stroke
        if (strokeConfig?.enabled) {
            const sCanvas = document.createElement('canvas');
            sCanvas.width = w; sCanvas.height = h;
            const sCtx = sCanvas.getContext('2d')!;

            // Naive multi-pass stroke
            const size = strokeConfig.size;
            const steps = 12; // Quality
            for (let i = 0; i < steps; i++) {
                const angle = (i * 2 * Math.PI) / steps;
                const dx = Math.cos(angle) * size;
                const dy = Math.sin(angle) * size;
                sCtx.drawImage(cutoutCanvas, dx, dy);
            }

            // Colorize stroke
            sCtx.globalCompositeOperation = 'source-in';
            sCtx.fillStyle = strokeConfig.color;
            sCtx.fillRect(0, 0, w, h);

            // Draw stroke under cutout? No, usually stroke is behind.
            // Actually stroke is bigger than cutout.
            // We draw stroke first.

            // Apply Shadow to Stroke + Cutout? Or just Cutout?
            // Usually shadow applies to the whole opaque body.

            // Let's combine Stroke + Cutout into one "Body" canvas
            const bodyCanvas = document.createElement('canvas');
            bodyCanvas.width = w; bodyCanvas.height = h;
            const bCtx = bodyCanvas.getContext('2d')!;
            bCtx.drawImage(sCanvas, 0, 0); // Draw Stroke
            bCtx.drawImage(cutoutCanvas, 0, 0); // Draw Cutout on top

            // Now draw Body to Main Context (with potential Shadow)
            if (shadowConfig?.enabled) {
                ctx.shadowColor = shadowConfig.color;
                ctx.shadowBlur = shadowConfig.blur;
                ctx.shadowOffsetX = shadowConfig.offset.x;
                ctx.shadowOffsetY = shadowConfig.offset.y;
            }
            ctx.drawImage(bodyCanvas, 0, 0);

            // Reset shadow
            ctx.shadowColor = 'transparent';
            ctx.shadowBlur = 0;
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 0;

        } else {
            // Just Shadow on Cutout
            if (shadowConfig?.enabled) {
                ctx.shadowColor = shadowConfig.color;
                ctx.shadowBlur = shadowConfig.blur;
                ctx.shadowOffsetX = shadowConfig.offset.x;
                ctx.shadowOffsetY = shadowConfig.offset.y;
            }
            ctx.drawImage(cutoutCanvas, 0, 0);
            ctx.shadowColor = 'transparent';
            ctx.shadowBlur = 0;
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 0;
        }
    };

    // Update redrawing to use the new render logic
    useEffect(() => {
        renderCanvas();
    }, [originalImage, maskCanvas, tool, brushSize, bgColor, historyVersion, strokeConfig, shadowConfig, isDrawing]);

    // Override paint triggers
    const redrawVisible = () => {
        renderCanvas();
    };
    const paint = (x: number, y: number) => {
        // Prevent drawing if no canvas or if tool is move/crop
        if (!maskCanvas || tool === 'move' || tool === 'crop') return;

        const ctx = maskCanvas.getContext('2d');
        if (!ctx) return;

        // Magic Wand Logic
        if (tool === 'magic-wand') {
            performMagicWand(x, y);
            return;
        }

        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.lineWidth = brushSize;

        // Configure Brush Softness (Gradient)
        // Creating a true soft brush with 'lineTo' is complex because strokes overlap.
        // A simple approach is using shadowBlur or radial gradients for stamps.
        // For continuous strokes, standard solid brush with some feathering or just hardness support is tricky.
        // Simplest "Hardness" implementation:
        // Hardness 1 = standard stroke.
        // Hardness < 1 = use shadowBlur? Or just simple discrete circles?

        // For now, let's use standard strokes. To support hardness proper, generally we need to draw stamps.
        // Let's stick to standard opaque strokes for performace first.
        // We can simulate softness by using `shadowBlur`.

        ctx.save();

        const softness = (1 - brushHardness) * 20;
        ctx.shadowBlur = softness;
        ctx.shadowColor = 'black';

        if (tool === 'erase') {
            // Erase = Make Transparent
            ctx.globalCompositeOperation = 'destination-out';
            ctx.strokeStyle = 'rgba(0,0,0,1)';
            ctx.fillStyle = 'rgba(0,0,0,1)';
        } else {
            // Restore = Make Opaque (draw content back into mask)
            ctx.globalCompositeOperation = 'source-over';
            ctx.strokeStyle = 'rgba(0,0,0,1)';
            ctx.fillStyle = 'rgba(0,0,0,1)';
        }

        // We draw a single point (circle) for now if it's a click, or line if dragging.
        ctx.beginPath();
        ctx.arc(x, y, brushSize / 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.restore();

        // Trigger Re-render of the visible canvas
        redrawVisible();
    };

    // We need a separate redraw function to call during painting




    // Magic Wand Implementation
    const performMagicWand = (startX: number, startY: number) => {
        if (!maskCanvas || !originalImage) return;
        const width = maskCanvas.width;
        const height = maskCanvas.height;

        // 1. Get Original Image Data (we need a read-only canvas for this)
        // We could cache this, but for now lets create temp to read.
        // Actually, performace might be partial concern.
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = width;
        tempCanvas.height = height;
        const tempCtx = tempCanvas.getContext('2d');
        if (!tempCtx) return;
        tempCtx.drawImage(originalImage, 0, 0);
        const imagePixelData = tempCtx.getImageData(0, 0, width, height);

        // 2. Prepare Mask Data (we will write to this)
        const maskCtx = maskCanvas.getContext('2d', { willReadFrequently: true });
        if (!maskCtx) return;
        const maskPixelData = maskCtx.getImageData(0, 0, width, height);

        // Data arrays
        const srcData = imagePixelData.data;
        const destData = maskPixelData.data;

        // Starting Pixel
        const pX = Math.round(startX);
        const pY = Math.round(startY);
        if (pX < 0 || pX >= width || pY < 0 || pY >= height) return;

        const startIdx = (pY * width + pX) * 4;
        const startR = srcData[startIdx];
        const startG = srcData[startIdx + 1];
        const startB = srcData[startIdx + 2];
        const startA = srcData[startIdx + 3];

        // If clicked transparent area of original, maybe ignore?
        // if (startA === 0) return; 

        // Flood Fill BFS
        const stack = [[pX, pY]];
        const visited = new Uint8Array(width * height);
        const tol = (tolerance || 10) * 1; // Simplify tolerance scaling

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

            // Calculate Difference
            const diff = Math.abs(r - startR) + Math.abs(g - startG) + Math.abs(b - startB) + Math.abs(a - startA);

            if (diff <= tol * 3) { // Rough Euclidian approx
                // Match! Erase this pixel (Make transparent)
                // We typically use Magic Wand to ERASE background.
                // So we set Alpha to 0.
                destData[pos + 3] = 0; // Alpha 0 = Erased

                // Add neighbors
                if (x > 0) stack.push([x - 1, y]);
                if (x < width - 1) stack.push([x + 1, y]);
                if (y > 0) stack.push([x, y - 1]);
                if (y < height - 1) stack.push([x, y + 1]);
            }
        }

        // 3. Put data back to Mask Canvas
        maskCtx.putImageData(maskPixelData, 0, 0);
        redrawVisible();
    };

    // Interaction Handlers
    const getPointerPos = (e: React.MouseEvent | React.TouchEvent) => {
        if (!canvasRef.current || !originalImage) return { x: 0, y: 0 };
        const rect = canvasRef.current.getBoundingClientRect();

        // Handle Touch vs Mouse
        const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;

        // The canvas is scaled visually by CSS transform (zoom) and translation (pan).
        // getBoundingClientRect returns the VISUAL size/pos on screen.
        // We want the coordinate relative to the unscaled canvas internal resolution.

        // Calculate offset within the rect
        const offsetX = clientX - rect.left;
        const offsetY = clientY - rect.top;

        // Map to internal resolution
        // rect.width = internalWidth * zoom
        // So scale factor = internalWidth / rect.width
        const scaleX = canvasRef.current.width / rect.width;
        const scaleY = canvasRef.current.height / rect.height;

        return {
            x: offsetX * scaleX,
            y: offsetY * scaleY
        };
    };

    const handleMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
        // Stop propagation so the parent (App.tsx) doesn't double-handle or interfere
        e.stopPropagation();

        const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;

        if (tool === 'move') {
            lastPanPos.current = { x: clientX, y: clientY };
            setIsDrawing(true);
            return;
        }

        setIsDrawing(true);
        const { x, y } = getPointerPos(e);
        paint(x, y);
    };

    const handleMouseMove = (e: React.MouseEvent | React.TouchEvent) => {
        const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;

        if (tool === 'move' && isDrawing && lastPanPos.current && onPanChange) {
            const dx = clientX - lastPanPos.current.x;
            const dy = clientY - lastPanPos.current.y;
            onPanChange({ x: pan.x + dx, y: pan.y + dy });
            lastPanPos.current = { x: clientX, y: clientY };
            return;
        }

        const { x, y } = getPointerPos(e);

        // Update custom cursor position if we add one later
        // setCursorPos({x, y});

        if (isDrawing && tool !== 'move') {
            paint(x, y);
        }
    };

    const handleMouseUp = () => {
        if (isDrawing && tool !== 'move' && onInteractionEnd) {
            onInteractionEnd();
        }
        setIsDrawing(false);
        lastPanPos.current = null;
    };

    // Cursor Rendering
    useEffect(() => {
        if (!canvasRef.current || !originalImage) return;

        // If we want a smooth 60fps cursor without lagging the React render cycle, 
        // we might stick to simple CSS cursor or efficient overlay.
        // But for "Brush Size", we need a circle.
        // Let's attach a "pointer-move" listener that re-renders the canvas WITH the cursor.
        // But wait, re-rendering the whole image on every mouse move is expensive (4k images).

        // Better approach: Floating <div> cursor!
        // Much cheaper.
    }, []);

    return (
        <div
            ref={containerRef}
            className="relative overflow-hidden flex items-center justify-center p-0 m-0 w-full h-full touch-none select-none"
            style={{
                cursor: tool === 'move' ? 'grab' : 'none' // Hide default cursor for brushes
            }}
            onMouseDown={handleMouseDown}
            onMouseMove={(e) => {
                handleMouseMove(e);
                // Update Cursor UI Pos
                const rect = containerRef.current?.getBoundingClientRect();
                if (rect) {
                    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
                    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
                    setCursorPos({ x: clientX - rect.left, y: clientY - rect.top });
                }
            }}
            onMouseUp={handleMouseUp}
            onMouseLeave={() => {
                handleMouseUp();
                setCursorPos({ x: -1000, y: -1000 });
            }}
            onTouchStart={handleMouseDown}
            onTouchMove={handleMouseMove}
            onTouchEnd={handleMouseUp}
        >
            <canvas
                ref={canvasRef}
                className={`max-w-none shrink-0 block shadow-2xl origin-center ${tool === 'erase' || tool === 'restore' || tool === 'magic-wand' ? 'cursor-none' : ''
                    } ${bgColor === 'checkerboard' ? 'bg-[url(https://img.ly/assets/demo-assets/transparent-bg.png)]' : ''}`}
                style={{
                    display: 'block',
                    width: originalImage?.width ? `${originalImage.width}px` : 'auto',
                    height: originalImage?.height ? `${originalImage.height}px` : 'auto',
                    backgroundColor: bgColor === 'checkerboard' ? 'transparent' : bgColor,
                    backgroundImage: bgColor === 'checkerboard' ?
                        'linear-gradient(45deg, #eee 25%, transparent 25%), linear-gradient(-45deg, #eee 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #eee 75%), linear-gradient(-45deg, transparent 75%, #eee 75%)'
                        : 'none',
                    backgroundSize: '20px 20px',
                    backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px',
                    // Flex parent centers us. We just scale/pan from center.
                    transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                    transformOrigin: 'center center'
                }}
            />
            {/* Custom Brush Cursor (High Performance CSS) */}
            {(tool === 'erase' || tool === 'restore') && (
                <div
                    className="absolute pointer-events-none rounded-full border border-white shadow-[0_0_2px_rgba(0,0,0,0.8)] z-50 mix-blend-difference box-content"
                    style={{
                        // Account for shadowBlur spread (approx 2x softness on each side)
                        width: (brushSize * 2 + (1 - brushHardness) * 40) * zoom,
                        height: (brushSize * 2 + (1 - brushHardness) * 40) * zoom,
                        // Cursor position is relative to the container (viewport), 
                        // but getPointerPos calculates relative to unscaled canvas?
                        // Wait, simple CSS cursor follows mouse pointer in the viewport.
                        // But here we set left/top based on cursorPos.
                        left: cursorPos.x, // These need to be viewport coordinates?
                        top: cursorPos.y,
                        transform: 'translate(-50%, -50%)',
                        // backgroundColor: 'rgba(255, 255, 255, 0.1)' // Optional: Slight fill
                    }}
                />
            )}
            {/* Crosshair for Magic Wand */}
            {tool === 'magic-wand' && (
                <div
                    className="absolute pointer-events-none text-white drop-shadow-md z-50 mix-blend-difference"
                    style={{
                        left: cursorPos.x,
                        top: cursorPos.y,
                        transform: 'translate(-50%, -50%)'
                    }}
                >
                    +
                </div>
            )}
        </div>
    );
};

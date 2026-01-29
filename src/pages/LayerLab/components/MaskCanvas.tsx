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
    historyVersion = 0
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const lastPanPos = useRef<{ x: number, y: number } | null>(null);
    const [cursorPos, setCursorPos] = useState({ x: -100, y: -100 });
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

    }, [originalImage, maskCanvas, tool, brushSize, bgColor, historyVersion]);

    // Function to draw on the MASK canvas
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
    const redrawVisible = () => {
        if (!canvasRef.current || !originalImage || !maskCanvas) return;
        const ctx = canvasRef.current.getContext('2d');
        if (!ctx) return;

        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);

        // Draw Original
        ctx.globalCompositeOperation = 'source-over';
        ctx.drawImage(originalImage, 0, 0);

        // Apply Mask
        ctx.globalCompositeOperation = 'destination-in';
        ctx.drawImage(maskCanvas, 0, 0);

        ctx.globalCompositeOperation = 'source-over';
    };



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

    return (
        <div
            ref={containerRef}
            className="relative overflow-hidden flex items-center justify-center p-0 m-0 w-full h-full touch-none select-none"
            style={{
                cursor: tool === 'move' ? 'grab' : 'default'
            }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleMouseDown}
            onTouchMove={handleMouseMove}
            onTouchEnd={handleMouseUp}
        >
            <canvas
                ref={canvasRef}
                className={`max-w-none block shadow-2xl origin-center ${tool === 'erase' || tool === 'restore' || tool === 'magic-wand' ? 'cursor-crosshair' : ''
                    } ${bgColor === 'checkerboard' ? 'bg-[url(https://img.ly/assets/demo-assets/transparent-bg.png)]' : ''}`}
                style={{
                    position: 'absolute',
                    left: '50%',
                    top: '50%',
                    width: originalImage?.width ? `${originalImage.width}px` : 'auto',
                    height: originalImage?.height ? `${originalImage.height}px` : 'auto',
                    backgroundColor: bgColor === 'checkerboard' ? 'transparent' : bgColor,
                    backgroundImage: bgColor === 'checkerboard' ?
                        'linear-gradient(45deg, #eee 25%, transparent 25%), linear-gradient(-45deg, #eee 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #eee 75%), linear-gradient(-45deg, transparent 75%, #eee 75%)'
                        : 'none',
                    backgroundSize: '20px 20px',
                    backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px',
                    transform: `translate(-50%, -50%) translate(${pan.x}px, ${pan.y}px) scale(${zoom})`
                }}
            />
        </div>
    );
};

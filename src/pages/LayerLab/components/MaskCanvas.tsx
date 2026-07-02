import React, { useRef, useEffect, useState } from 'react';

interface MaskCanvasProps {
    originalImage: HTMLImageElement | null;
    maskCanvas: HTMLCanvasElement | null;
    tool: 'erase' | 'restore' | 'magic-wand' | 'move' | 'crop';
    brushSize: number;
    brushHardness: number; // 0 to 1
    zoom?: number;
    pan?: { x: number, y: number };
    bgColor?: 'checkerboard' | 'white' | 'black' | 'green';
    tolerance?: number;
    magicToolMode?: 'fill' | 'brush'; // New prop
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
    magicToolMode = 'fill',
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

    // Magic Brush Refs
    const magicStartColor = useRef<[number, number, number, number] | null>(null);
    const cachedOriginalData = useRef<Uint8ClampedArray | null>(null);

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

    }, [originalImage, maskCanvas, tool, brushSize, bgColor, historyVersion, strokeConfig, shadowConfig]);

    // Cache Original Image Data when image changes
    useEffect(() => {
        if (!originalImage) return;
        const c = document.createElement('canvas');
        c.width = originalImage.width;
        c.height = originalImage.height;
        const ctx = c.getContext('2d');
        if (ctx) {
            ctx.drawImage(originalImage, 0, 0);
            cachedOriginalData.current = ctx.getImageData(0, 0, c.width, c.height).data;
        }
    }, [originalImage]);

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
            if (magicToolMode === 'brush') {
                performMagicBrush(x, y);
            } else {
                performMagicWand(x, y);
            }
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




    // Magic Brush: Erase pixels that match the start color within tolerance
    const performMagicBrush = (x: number, y: number) => {
        if (!maskCanvas || !magicStartColor.current || !cachedOriginalData.current) return;

        const width = maskCanvas.width;
        const height = maskCanvas.height;
        const ctx = maskCanvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) return;

        const srcData = cachedOriginalData.current;
        const [targetR, targetG, targetB, targetA] = magicStartColor.current;

        const tol = (tolerance || 10) * 3;

        // Localized Flood Fill
        // We only process within the bounding box of the brush for efficiency,
        // but we follow connectivity from the center.

        const r = Math.ceil(brushSize / 2);
        const startX = Math.round(x);
        const startY = Math.round(y);

        // Stack for BFS: [x, y]
        const stack = [[startX, startY]];

        // Track visited pixels for this stroke to avoid loops
        // Using a Set might be slow for many pixels, but efficiently we can use a small Uint8Array relative to the brush box?
        // Or simpler: just use a Set for now as brush is small.
        // Or even better: direct check.
        // Since we are modifing 'maskData', we can read 'maskData' to see if already erased?
        // NO, maskData might be erased by PREVIOUS strokes. We need to distinguish "erased by previous" vs "visited in this BFS".
        // Actually, if it's already erased (alpha=0), we don't need to process it again to erase it.
        // But we DO need to traverse THROUGH it if it matches color? 
        // Wait, mask is separate from image color.

        // Let's use a flat set for visited within the bounding box.
        const boxX = Math.max(0, startX - r);
        const boxY = Math.max(0, startY - r);
        const boxW = Math.min(width, startX + r) - boxX;
        const boxH = Math.min(height, startY + r) - boxY;

        if (boxW <= 0 || boxH <= 0) return;

        // We need to read/write mask data
        // For performance, get the whole box
        const maskData = ctx.getImageData(boxX, boxY, boxW, boxH);

        const visited = new Uint8Array(boxW * boxH); // 0 = unvisited, 1 = visited

        // Check if start point matches color (it should, as it's the sample source usually, but we check tolerance)
        // Also check if start point is inside bounds
        if (startX < 0 || startX >= width || startY < 0 || startY >= height) return;

        // Helper to get local index
        const getIndex = (lx: number, ly: number) => (ly * boxW + lx);

        // Add start node
        // Local coordinates
        const localStartX = startX - boxX;
        const localStartY = startY - boxY;

        if (localStartX < 0 || localStartX >= boxW || localStartY < 0 || localStartY >= boxH) return;

        stack.length = 0; // Clear
        stack.push([localStartX, localStartY]);
        visited[getIndex(localStartX, localStartY)] = 1;

        while (stack.length > 0) {
            const [lx, ly] = stack.pop()!;

            const globalX = boxX + lx;
            const globalY = boxY + ly;

            // Check distance to cursor center
            const distSq = (globalX - x) ** 2 + (globalY - y) ** 2;
            if (distSq > r * r) continue;

            const srcIdx = (globalY * width + globalX) * 4;
            const rVal = srcData[srcIdx];
            const gVal = srcData[srcIdx + 1];
            const bVal = srcData[srcIdx + 2];
            const aVal = srcData[srcIdx + 3];

            // If completely transparent in SOURCE, consider it matching? 
            // Or if we are erasing a color, we expect it to be opaque.
            // If source is transparent, nothing to erase?
            // Let's assume we match non-transparent colors.

            let isMatch = false;

            if (targetA === 0) {
                // Special case: Erasing transparency? No, usually erasing color.
                // If target is transparent, maybe match transparent?
                isMatch = (aVal < 10);
            } else {
                const diff = Math.abs(rVal - targetR) + Math.abs(gVal - targetG) + Math.abs(bVal - targetB) + Math.abs(aVal - targetA);
                isMatch = (diff <= tol * 4);
            }

            if (isMatch) {
                // Erase in Mask
                const maskIdx = (ly * boxW + lx) * 4;
                maskData.data[maskIdx + 3] = 0; // Set Alpha to 0

                // Add neighbors
                const neighbors = [
                    [lx + 1, ly],
                    [lx - 1, ly],
                    [lx, ly + 1],
                    [lx, ly - 1]
                ];

                for (const [nx, ny] of neighbors) {
                    if (nx >= 0 && nx < boxW && ny >= 0 && ny < boxH) {
                        const vIdx = getIndex(nx, ny);
                        if (visited[vIdx] === 0) {
                            visited[vIdx] = 1;
                            stack.push([nx, ny]);
                        }
                    }
                }
            }
        }

        ctx.putImageData(maskData, boxX, boxY);
        redrawVisible();
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

        // For Magic Brush, sample the color at start
        if (tool === 'magic-wand' && magicToolMode === 'brush' && cachedOriginalData.current && maskCanvas) {
            const width = maskCanvas.width;
            const ix = Math.floor(x);
            const iy = Math.floor(y);
            // Handle out of bounds
            if (ix >= 0 && ix < width && iy >= 0 && iy < maskCanvas.height) {
                const idx = (iy * width + ix) * 4;
                const data = cachedOriginalData.current;
                magicStartColor.current = [data[idx], data[idx + 1], data[idx + 2], data[idx + 3]];
            }
        }

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
                    setCursorPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
                }
            }}
            onMouseUp={handleMouseUp}
            onMouseLeave={() => {
                handleMouseUp();
                setCursorPos({ x: -1000, y: -1000 });
            }}
            onTouchStart={(e) => {
                handleMouseDown(e);
                const rect = containerRef.current?.getBoundingClientRect();
                if (rect) {
                    const clientX = e.touches[0].clientX;
                    const clientY = e.touches[0].clientY;
                    setCursorPos({ x: clientX - rect.left, y: clientY - rect.top });
                }
            }}
            onTouchMove={(e) => {
                handleMouseMove(e);
                const rect = containerRef.current?.getBoundingClientRect();
                if (rect) {
                    const clientX = e.touches[0].clientX;
                    const clientY = e.touches[0].clientY;
                    setCursorPos({ x: clientX - rect.left, y: clientY - rect.top });
                }
            }}
            onTouchEnd={() => {
                handleMouseUp();
                setCursorPos({ x: -1000, y: -1000 });
            }}
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
            {(tool === 'erase' || tool === 'restore' || (tool === 'magic-wand' && magicToolMode === 'brush')) && (
                <div
                    className={`absolute pointer-events-none rounded-full border border-white/80 outline outline-1 outline-black/20 z-50 mix-blend-normal shadow-sm ${tool === 'restore' ? 'bg-green-500/20' : tool === 'magic-wand' ? 'bg-indigo-500/20' : ''}`}
                    style={{
                        // Account for shadowBlur spread if needed, but for precision we show the core brush size
                        width: brushSize * zoom,
                        height: brushSize * zoom,
                        left: cursorPos.x,
                        top: cursorPos.y,
                        transform: 'translate(-50%, -50%)',
                    }}
                />
            )}
            {/* Crosshair for Magic Wand */}
            {tool === 'magic-wand' && magicToolMode === 'fill' && (
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

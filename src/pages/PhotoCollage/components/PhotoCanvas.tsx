import React, { useEffect, useRef, useState, useCallback, useImperativeHandle, forwardRef } from 'react';
import { calculateFrames, getCaptionHeight, getCanvasDimensions } from '../utils/geometry';
import { generateTornEdgePoints } from '../utils/tornEdge';
import { resolveFreeformFrames, snapFreeformRect, MIN_FREEFORM_SIZE } from '../utils/freeform';
import { drawBackgroundPreset } from '../utils/backgroundPresets';
import { CollageSettings, FreeformRect, ImageFrame, LayoutType, UploadedImage } from '../types';

interface PhotoCanvasProps {
    images: UploadedImage[];
    settings: CollageSettings;
    onCanvasReady: (dataUrl: string) => void;
    onImageUpdate?: (id: string, updates: Partial<UploadedImage>) => void;
    onImageSwap?: (id1: string, id2: string) => void;
    onImageToFront?: (id: string) => void;
    /** Fired once when a drag actually starts moving — parent snapshots undo history here */
    onInteractionStart?: () => void;
    className?: string;
    style?: React.CSSProperties;
    interactive?: boolean;
}

export interface PhotoCanvasHandle {
    exportImage: (format: 'png' | 'jpeg', scale: number, overrides?: Partial<CollageSettings>) => Promise<string>;
}

// Helper: Draw rounded rectangle path
const roundRect = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) => {
    const radius = Math.min(Number(r) || 0, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + w - radius, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
    ctx.lineTo(x + w, y + h - radius);
    ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
    ctx.lineTo(x + radius, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
};

const fillCustomGradient = (
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    startColor: string,
    endColor: string,
    direction: 'diagonal' | 'horizontal' | 'vertical' = 'diagonal'
) => {
    const gradient = direction === 'horizontal'
        ? ctx.createLinearGradient(0, 0, w, 0)
        : direction === 'vertical'
            ? ctx.createLinearGradient(0, 0, 0, h)
            : ctx.createLinearGradient(0, 0, w, h);
    gradient.addColorStop(0, startColor);
    gradient.addColorStop(1, endColor);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, w, h);
};

const fillCanvasSurface = (
    ctx: CanvasRenderingContext2D,
    settings: CollageSettings,
    w: number,
    h: number
) => {
    const bgDrawn = settings.backgroundId ? drawBackgroundPreset(ctx, w, h, settings.backgroundId) : false;
    if (bgDrawn) return;

    if (settings.customGradientEnabled) {
        fillCustomGradient(
            ctx,
            w,
            h,
            settings.customGradientStart || '#ff9a9e',
            settings.customGradientEnd || '#fecfef',
            settings.customGradientDirection || 'diagonal'
        );
        return;
    }

    if (settings.backgroundColor === 'transparent') {
        ctx.clearRect(0, 0, w, h);
        return;
    }

    ctx.fillStyle = settings.backgroundColor;
    ctx.fillRect(0, 0, w, h);
};

const fillFrameSurface = (
    ctx: CanvasRenderingContext2D,
    settings: CollageSettings,
    x: number,
    y: number,
    w: number,
    h: number,
    radius: number
) => {
    ctx.save();
    ctx.beginPath();
    if (radius > 0) {
        roundRect(ctx, x, y, w, h, radius);
    } else {
        ctx.rect(x, y, w, h);
    }
    ctx.clip();

    ctx.translate(x, y);
    const presetDrawn = settings.backgroundId ? drawBackgroundPreset(ctx, w, h, settings.backgroundId) : false;
    if (presetDrawn) {
        ctx.restore();
        return;
    }

    if (settings.customGradientEnabled) {
        fillCustomGradient(
            ctx,
            w,
            h,
            settings.customGradientStart || '#ff9a9e',
            settings.customGradientEnd || '#fecfef',
            settings.customGradientDirection || 'diagonal'
        );
        ctx.restore();
        return;
    }

    const frameColor = settings.backgroundColor === 'transparent' ? '#ffffff' : settings.backgroundColor;
    ctx.fillStyle = frameColor;
    ctx.fillRect(0, 0, w, h);

    ctx.restore();
};

// Washi tape strips across two diagonal corners. Deterministic per-frame
// angles so the tape doesn't shimmer during interactive re-renders.
const drawTapeDecoration = (
    ctx: CanvasRenderingContext2D,
    frame: ImageFrame,
    index: number
) => {
    const { x, y, width: fW, height: fH } = frame;
    const len = Math.min(fW, fH) * 0.3;
    const wid = len * 0.34;
    const rnd = (k: number) => {
        const s = Math.sin(index * 12.9898 + k * 78.233) * 43758.5453;
        return s - Math.floor(s);
    };

    ctx.save();
    ctx.translate(x + fW / 2, y + fH / 2);
    if (frame.rotation) {
        ctx.rotate((frame.rotation * Math.PI) / 180);
    }

    [
        { cx: -fW / 2, cy: -fH / 2 },
        { cx: fW / 2, cy: fH / 2 },
    ].forEach((corner, i) => {
        ctx.save();
        ctx.translate(corner.cx, corner.cy);
        ctx.rotate(((-45 + (rnd(i) * 14 - 7)) * Math.PI) / 180);
        ctx.fillStyle = 'rgba(247, 240, 213, 0.75)';
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.08)';
        ctx.lineWidth = 1;
        ctx.fillRect(-len / 2, -wid / 2, len, wid);
        ctx.strokeRect(-len / 2, -wid / 2, len, wid);
        ctx.restore();
    });

    ctx.restore();
};

// Standalone render function to support both preview and export
const renderCollageToContext = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    scaleFactor: number,
    images: UploadedImage[],
    settings: CollageSettings,
    imageCache: Map<string, HTMLImageElement>
): ImageFrame[] => {

    // 1. Draw Background
    fillCanvasSurface(ctx, settings, width, height);

    // 2. Calculate frames (with hero photo indices for smart positioning)
    const heroIndices = images
        .map((img, idx) => img.isHero ? idx : -1)
        .filter(idx => idx !== -1);

    const captionPos = settings.captionPosition || 'none';
    const topFontSize = settings.captionFontSize || 20;
    const bottomFontSize = settings.globalCaptionFontSize || 20;
    const topHR = settings.captionHeightRatio ?? 1.8;
    const bottomHR = settings.globalCaptionHeightRatio ?? 1.8;
    const captionColor = settings.captionColor || '#333333';
    const captionFont = settings.captionFont || '"Inter", "Noto Sans TC", system-ui, sans-serif';
    const globalAlign = settings.globalCaptionAlign || 'center';

    const hasBottomGlobal = captionPos === 'bottom' || captionPos === 'both';
    const globalCapH = hasBottomGlobal ? getCaptionHeight(bottomFontSize * scaleFactor, 1, bottomHR) : 0;
    const effectiveHeight = height - globalCapH;

    const hasTopCaption = captionPos === 'top' || captionPos === 'both';
    // FREEFORM uses the full canvas as its basis (frames may overlap the
    // caption strip — placement is entirely user-managed)
    const frames = settings.layout === LayoutType.FREEFORM
        ? resolveFreeformFrames(images.map(img => img.freeform), width, height)
        : calculateFrames(
            images.length,
            settings.layout,
            width,
            effectiveHeight,
            settings.gap * scaleFactor,
            settings.padding * scaleFactor,
            heroIndices.length > 0 ? heroIndices : undefined,
            captionPos,
            hasTopCaption ? topFontSize * scaleFactor : undefined,
            topHR,
            settings.bentoVariant ?? 0
        );

    if (images.length === 0) return frames;

    // 3. Draw Images
    images.forEach((imgData, index) => {
        const img = imageCache.get(imgData.id);
        const frame = frames[index];

        if (!img || !frame) return;

        const { x, y, width: fW, height: fH } = frame;
        const baseUserScale = imgData.scale || 1;
        // Make hero effect visible across all layouts, not only hero-aware frame algorithms.
        const heroBoost = imgData.isHero ? 1.15 : 1;
        const imgScale = baseUserScale * heroBoost;

        // Combine base layout rotation + user adjustment
        const baseRotation = frame.rotation || 0;
        const userRotation = imgData.rotation || 0;
        const totalRotation = baseRotation + userRotation;
        const rotationRad = (totalRotation * Math.PI) / 180;

        ctx.save();

        // 3a. Apply Shadow (if enabled and gap > 0 to see it, or padding exists)
        // We apply shadow to the clipping path shape
        if (settings.shadow > 0) {
            const shadowScale = settings.shadow / 5; // normalize 0-100 to reasonable pixels
            ctx.shadowColor = 'rgba(0, 0, 0, 0.35)';
            ctx.shadowBlur = (shadowScale * 2) * scaleFactor;
            ctx.shadowOffsetX = (shadowScale * 0.5) * scaleFactor;
            ctx.shadowOffsetY = (shadowScale * 0.5) * scaleFactor;
        }

        // 3b. Create Clipping Region (The Frame)
        // If FILM style, we draw white border + holes, then shrink clip region
        let clipX = x;
        let clipY = y;
        let clipW = fW;
        let clipH = fH;

        // Rotate canvas context for frame drawing if needed (e.g. for Scatter layout)
        // However, existing logic rotates AFTER clipping.
        // For Scatter, the FRAME itself is rotated. 
        // We should pivot around the frame center for the whole operation if frame.rotation exists.

        // New Logic: Global Frame Transform
        // Move to center of frame
        const centerX = x + fW / 2;
        const centerY = y + fH / 2;
        ctx.translate(centerX, centerY);

        // Apply Base Rotation (Layout-driven) 
        // User rotation applies to the IMAGE inside the frame, but for SCATTER, the frame effectively rotates.
        // Let's assume frame.rotation means "Rotate the whole card".
        if (frame.rotation) {
            ctx.rotate((frame.rotation * Math.PI) / 180);
        }

        // Now drawing relative to center (-fW/2, -fH/2)
        const localX = -fW / 2;
        const localY = -fH / 2;

        const radius = Number(settings.cornerRadius) * scaleFactor;

        if (settings.frameStyle === 'film') {
            fillFrameSurface(ctx, settings, localX, localY, fW, fH, radius);

            // Holes
            const holeSize = Math.max(4, Math.min(fW, fH) * 0.04);
            const holeCount = Math.floor(fH / (holeSize * 2));
            const holeGap = (fH - (holeCount * holeSize)) / (holeCount + 1);

            ctx.fillStyle = '#e5e5e5'; // Subtle faint hole color (or transparent if possible but we are in canvas stack)
            // Actually, if background is not white, we want holes to punch through.
            // Since we can't easily punch through existing drawing without composite operations, let's draw darker grey to simulate hole?
            // Or uses 'destination-out' if we want transparency?
            // Let's use dark gray '#d1d5db' to look like "empty" slot on white paper.
            ctx.fillStyle = '#d4d4d4';

            // Left Holes
            for (let i = 0; i < holeCount; i++) {
                const hy = localY + holeGap + i * (holeSize + holeGap);
                ctx.fillRect(localX + holeSize / 2, hy, holeSize, holeSize);
            }
            // Right Holes
            for (let i = 0; i < holeCount; i++) {
                const hy = localY + holeGap + i * (holeSize + holeGap);
                ctx.fillRect(localX + fW - holeSize * 1.5, hy, holeSize, holeSize);
            }

            // Update Clip Rect to be inside the film
            // Maintain aspect ratio of inner content closely
            const borderX = holeSize * 2.5;
            const borderY = holeSize;
            clipX = localX + borderX;
            clipY = localY + borderY;
            clipW = fW - borderX * 2;
            clipH = fH - borderY * 2;

            // Visual Inner Rect (White/Black?)
            // Usually image fits in here.
        } else if (settings.frameStyle === 'polaroid') {
            fillFrameSurface(ctx, settings, localX, localY, fW, fH, 2);

            // Polaroid: Image is consistent square-ish on top, large chin on bottom
            const border = Math.min(fW, fH) * 0.08;
            const chin = Math.min(fW, fH) * 0.25;

            clipX = localX + border;
            clipY = localY + border;
            clipW = fW - border * 2;
            clipH = fH - border - chin;

            // Draw subtle inner shadow or border for depth?
            ctx.fillStyle = '#f9fafb'; // faint grey for photo slot
            ctx.fillRect(clipX, clipY, clipW, clipH);

        } else if (settings.frameStyle === 'torn') {
            // Torn paper: jagged deckle silhouette (inherits the shadow set
            // above), photo sits inset on the paper scrap
            const torn = generateTornEdgePoints(fW, fH, index);
            ctx.beginPath();
            torn.forEach((p, i) => {
                if (i === 0) ctx.moveTo(localX + p.x, localY + p.y);
                else ctx.lineTo(localX + p.x, localY + p.y);
            });
            ctx.closePath();
            ctx.fillStyle = '#fbfaf4';
            ctx.fill();

            const border = Math.min(fW, fH) * 0.05;
            clipX = localX + border;
            clipY = localY + border;
            clipW = fW - border * 2;
            clipH = fH - border * 2;
        } else {
            // Normal
            if (radius > 0) {
                roundRect(ctx, localX, localY, fW, fH, radius);
            } else {
                ctx.beginPath();
                ctx.rect(localX, localY, fW, fH);
            }
            ctx.fillStyle = '#ffffff';
            ctx.fill();

            clipX = localX;
            clipY = localY;
            clipW = fW;
            clipH = fH;
        }

        // Reset shadow
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;

        // Create Clip
        ctx.beginPath();
        // Ensure clip is rounded if style warrants, or just rect
        if (frame.clipPath) {
            frame.clipPath.forEach((p, i) => {
                const px = clipX + p.x * clipW;
                const py = clipY + p.y * clipH;
                if (i === 0) ctx.moveTo(px, py);
                else ctx.lineTo(px, py);
            });
            ctx.closePath();
        } else if (settings.frameStyle === 'polaroid' || settings.frameStyle === 'film' || settings.frameStyle === 'torn') {
            ctx.rect(clipX, clipY, clipW, clipH);
        } else {
            if (radius > 0) {
                roundRect(ctx, clipX, clipY, clipW, clipH, radius);
            } else {
                ctx.rect(clipX, clipY, clipW, clipH);
            }
        }
        ctx.clip();


        // 3c. Handle Rotation & Transform OF IMAGE (Inside the localized frame)
        // We are already at Center of Frame (translated).
        // Now we rotate the IMAGE relative to the frame center (which is now 0,0)
        // BUT clip area center might be offset (e.g. Polaroid).
        // Let's find center of CLIP area.

        const clipCenterX = clipX + clipW / 2;
        const clipCenterY = clipY + clipH / 2;

        ctx.translate(clipCenterX, clipCenterY); // Move to center of visible image area

        // Blur-fill mode: blurred cover-scaled underlay fills the letterbox area
        // left by the contain-scaled photo. Drawn before user rotation so the
        // backdrop stays aligned with the frame, not the photo.
        if (settings.imageFit === 'blur-fill') {
            const coverScale = Math.max(clipW / img.width, clipH / img.height);
            const containScale = Math.min(clipW / img.width, clipH / img.height);
            if (coverScale / containScale > 1.01) {
                // 1.06 overscan hides the transparent halo blur creates at edges
                const uW = img.width * coverScale * 1.06;
                const uH = img.height * coverScale * 1.06;
                ctx.save();
                ctx.filter = `blur(${Math.max(6, Math.min(clipW, clipH) * 0.03)}px)`;
                ctx.drawImage(img, -uW / 2, -uH / 2, uW, uH);
                ctx.restore();
            }
        }

        // Apply User Rotation
        ctx.rotate((userRotation * Math.PI) / 180);

        // 3d. Calculate Image Dimensions Logic
        // We need to cover 'clipW' and 'clipH'

        const absCos = Math.abs(Math.cos((userRotation * Math.PI) / 180));
        const absSin = Math.abs(Math.sin((userRotation * Math.PI) / 180));

        // Use proper dimensions of the CLIP area, not the full frame
        const reqW = clipW * absCos + clipH * absSin;
        const reqH = clipW * absSin + clipH * absCos;

        // Calculate scaling needed to cover this projected bounding box
        const scaleX = reqW / img.width;
        const scaleY = reqH / img.height;

        // cover: larger scale crops to fill; blur-fill: smaller scale shows the
        // whole photo (contain) over the blurred underlay
        const baseScale = settings.imageFit === 'blur-fill'
            ? Math.min(scaleX, scaleY)
            : Math.max(scaleX, scaleY);

        const renderW = img.width * baseScale * imgScale;
        const renderH = img.height * baseScale * imgScale;

        // 3e. Offsets & Filters
        // Offsets are stored in "User Screen Space" (X is always Right, Y is always Down)
        // But we are drawing in a Rotated Coordinate Space.
        // We need to transform the screen-space offsets (dx, dy) into the local rotated space (dx', dy')
        // Rotation matrix for vector rotation by angle -theta (because we want to move image, not axes):
        // x' = x * cos(theta) + y * sin(theta)
        // y' = -x * sin(theta) + y * cos(theta)
        // (Note: standard 2D rotation matrix)

        const offsetX = imgData.offsetX * scaleFactor;
        const offsetY = imgData.offsetY * scaleFactor;

        const rotatedOffsetX = offsetX * Math.cos(rotationRad) + offsetY * Math.sin(rotationRad);
        const rotatedOffsetY = -offsetX * Math.sin(rotationRad) + offsetY * Math.cos(rotationRad);

        // Draw centered at (0,0) + offset

        // 1. Draw Base Image (No Filter)
        // If intensity is 100, we can skip base image for performance IF transparency is not involved (but let's be safe and draw base if < 100)
        // Actually, just drawing base then overlay is simplest blending.

        const intensity = imgData.filterIntensity ?? 100;

        // Optimization: If intensity is 100, just draw filtered. If 0, just draw base.

        if (imgData.filter && intensity > 0) {
            // If intensity < 100, we need the base image first
            if (intensity < 100) {
                ctx.filter = 'none';
                ctx.drawImage(
                    img,
                    -renderW / 2 + rotatedOffsetX,
                    -renderH / 2 + rotatedOffsetY,
                    renderW,
                    renderH
                );
            }

            // Draw Filtered Overlay
            ctx.globalAlpha = intensity / 100;
            ctx.filter = imgData.filter;
            ctx.drawImage(
                img,
                -renderW / 2 + rotatedOffsetX,
                -renderH / 2 + rotatedOffsetY,
                renderW,
                renderH
            );
            // Reset
            ctx.filter = 'none';
            ctx.globalAlpha = 1.0;

        } else {
            // Default "effect intensity" behavior even without selected preset filter.
            // 100 = neutral, below reduces richness/contrast, above increases it.
            if (intensity !== 100) {
                const saturation = Math.max(0.4, Math.min(1.6, 1 + (intensity - 100) * 0.006));
                const contrast = Math.max(0.7, Math.min(1.3, 1 + (intensity - 100) * 0.003));
                const brightness = Math.max(0.9, Math.min(1.1, 1 + (intensity - 100) * 0.001));
                ctx.filter = `saturate(${saturation}) contrast(${contrast}) brightness(${brightness})`;
            } else {
                ctx.filter = 'none';
            }
            ctx.drawImage(
                img,
                -renderW / 2 + rotatedOffsetX,
                -renderH / 2 + rotatedOffsetY,
                renderW,
                renderH
            );
            ctx.filter = 'none';
        }

        ctx.restore();

        // Tape sits on top of the photo, outside its clip
        if (settings.tapeDecoration) {
            drawTapeDecoration(ctx, frame, index);
        }
    });

    // 4. Draw Captions
    if (captionPos !== 'none') {
        // 4a. Per-image captions (top)
        if (hasTopCaption) {
            const scaledTop = topFontSize * scaleFactor;
            const capH = getCaptionHeight(scaledTop, 1, topHR);
            images.forEach((imgData, index) => {
                const caption = imgData.caption;
                if (!caption) return;
                const frame = frames[index];
                if (!frame) return;

                ctx.save();
                ctx.font = `bold ${scaledTop}px ${captionFont}`;
                ctx.fillStyle = captionColor;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(caption, frame.x + frame.width / 2, frame.y - capH / 2, frame.width - 8 * scaleFactor);
                ctx.restore();
            });
        }

        // 4b. Global caption (bottom)
        if (hasBottomGlobal && settings.globalCaption) {
            const scaledBottom = bottomFontSize * scaleFactor;
            const pad = 16 * scaleFactor;
            let textX: number;
            if (globalAlign === 'left') {
                textX = pad;
            } else if (globalAlign === 'right') {
                textX = width - pad;
            } else {
                textX = width / 2;
            }

            ctx.save();
            ctx.font = `bold ${scaledBottom}px ${captionFont}`;
            ctx.fillStyle = captionColor;
            ctx.textAlign = globalAlign;
            ctx.textBaseline = 'middle';
            ctx.fillText(settings.globalCaption, textX, effectiveHeight + globalCapH / 2, width - pad * 2);
            ctx.restore();
        }
    }

    return frames;
};

export const PhotoCanvas = forwardRef<PhotoCanvasHandle, PhotoCanvasProps>(({
    images,
    settings,
    onCanvasReady,
    onImageUpdate,
    onImageSwap,
    onImageToFront,
    onInteractionStart,
    className,
    style,
    interactive = false
}, ref) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const imageCache = useRef<Map<string, HTMLImageElement>>(new Map());
    const framesRef = useRef<ImageFrame[]>([]);

    const isFreeform = settings.layout === LayoutType.FREEFORM;

    // Dragging State
    // mode: 'image' pans the photo inside its frame (classic layouts);
    // 'frame-move'/'frame-resize' manipulate the frame itself (FREEFORM)
    const dragRef = useRef<{
        activeId: string | null;
        startX: number;
        startY: number;
        initialOffsetX: number;
        initialOffsetY: number;
        mode: 'image' | 'frame-move' | 'frame-resize';
        initialRect: FreeformRect | null;
        checkpointed: boolean;
    }>({
        activeId: null,
        startX: 0,
        startY: 0,
        initialOffsetX: 0,
        initialOffsetY: 0,
        mode: 'image',
        initialRect: null,
        checkpointed: false
    });

    const [isDragging, setIsDragging] = useState(false);
    // Alignment guide lines shown while a freeform frame is being dragged
    const [snapGuides, setSnapGuides] = useState<{ x: number[]; y: number[] }>({ x: [], y: [] });

    // Expose export function
    useImperativeHandle(ref, () => ({
        // overrides lets callers export the same composition at a different
        // ratio (multi-size bundle) without touching the live settings
        exportImage: async (format: 'png' | 'jpeg', scale: number, overrides?: Partial<CollageSettings>) => {
            const baseSettings = { ...settings, ...(overrides ?? {}) };
            const canvas = document.createElement('canvas');
            const { width, height } = getCanvasDimensions(
                baseSettings.ratio,
                baseSettings.customRatioW,
                baseSettings.customRatioH,
                scale
            );
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            if (!ctx) throw new Error("Could not create canvas context");

            if (format === 'jpeg' && baseSettings.backgroundColor === 'transparent') {
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(0, 0, width, height);
            }

            let effectiveSettings = baseSettings;
            if (format === 'jpeg' && baseSettings.backgroundColor === 'transparent') {
                effectiveSettings = { ...baseSettings, backgroundColor: '#ffffff' };
            }

            renderCollageToContext(ctx, width, height, scale, images, effectiveSettings, imageCache.current);
            return canvas.toDataURL(`image/${format}`, format === 'jpeg' ? 0.9 : 1.0);
        }
    }));

    // Helper: Draw the preview canvas
    const draw = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const scale = 1;
        const { width, height } = getCanvasDimensions(
            settings.ratio,
            settings.customRatioW,
            settings.customRatioH,
            scale
        );

        if (canvas.width !== width || canvas.height !== height) {
            canvas.width = width;
            canvas.height = height;
        }

        const frames = renderCollageToContext(ctx, width, height, scale, images, settings, imageCache.current);
        framesRef.current = frames;

        // Notify parent only if not dragging to prevent spamming
        if (!dragRef.current.activeId) {
            onCanvasReady(canvas.toDataURL('image/png'));
        }

    }, [images, settings, onCanvasReady]);

    // Debounced Draw Effect
    useEffect(() => {
        let animationFrameId: number;
        let isCancelled = false;

        const renderLoop = async () => {
            // 1. Load images if needed
            const promises = images.map(async (imgData) => {
                if (imageCache.current.has(imgData.id)) return;
                return new Promise<void>((resolve) => {
                    const img = new Image();
                    img.crossOrigin = "anonymous";
                    img.src = imgData.url;
                    img.onload = () => {
                        if (!isCancelled) imageCache.current.set(imgData.id, img);
                        resolve();
                    };
                    img.onerror = () => resolve();
                });
            });

            await Promise.all(promises);
            if (isCancelled) return;

            // 2. Draw with RAF for smooth performance
            animationFrameId = requestAnimationFrame(draw);
        };

        renderLoop();

        return () => {
            isCancelled = true;
            cancelAnimationFrame(animationFrameId);
        };
    }, [images, settings, draw]);


    // Interaction Handlers
    // Double Click Detection
    const lastClickRef = useRef<{ id: string | null; time: number }>({ id: null, time: 0 });

    // Interaction Handlers
    const handlePointerDown = (e: React.PointerEvent) => {
        if (!interactive || !canvasRef.current) return;

        // Check for double click
        const now = Date.now();
        const isDoubleClick = (now - lastClickRef.current.time) < 300; // 300ms threshold

        const rect = canvasRef.current.getBoundingClientRect();
        const scaleX = canvasRef.current.width / rect.width;
        const scaleY = canvasRef.current.height / rect.height;

        const clickX = (e.clientX - rect.left) * scaleX;
        const clickY = (e.clientY - rect.top) * scaleY;

        const hitTest = (f: ImageFrame) =>
            clickX >= f.x && clickX <= f.x + f.width &&
            clickY >= f.y && clickY <= f.y + f.height;

        // FREEFORM frames may overlap: pick the topmost (last drawn)
        let clickedIndex = -1;
        if (isFreeform) {
            for (let i = framesRef.current.length - 1; i >= 0; i--) {
                if (hitTest(framesRef.current[i])) { clickedIndex = i; break; }
            }
        } else {
            clickedIndex = framesRef.current.findIndex(hitTest);
        }

        if (clickedIndex !== -1) {
            const img = images[clickedIndex];
            if (img) {

                // Handle Double Click Reset
                if (isDoubleClick && lastClickRef.current.id === img.id) {
                    if (onImageUpdate) {
                        onImageUpdate(img.id, {
                            scale: 1,
                            rotation: 0,
                            offsetX: 0,
                            offsetY: 0
                        });
                    }
                    lastClickRef.current = { id: null, time: 0 };
                    return;
                }

                lastClickRef.current = { id: img.id, time: now };

                let mode: 'image' | 'frame-move' | 'frame-resize' = 'image';
                let initialRect: FreeformRect | null = null;
                if (isFreeform) {
                    const f = framesRef.current[clickedIndex];
                    const canvas = canvasRef.current;
                    // Hit zone sized in CSS px (44px touch target on mobile),
                    // converted to canvas px; capped so tiny frames stay movable
                    const zoneCss = e.pointerType === 'touch' ? 44 : 18;
                    const handleZone = Math.min(
                        Math.max(zoneCss * scaleX, Math.min(f.width, f.height) * 0.15),
                        Math.min(f.width, f.height) * 0.5
                    );
                    const inResize =
                        clickX >= f.x + f.width - handleZone &&
                        clickY >= f.y + f.height - handleZone;
                    mode = inResize ? 'frame-resize' : 'frame-move';
                    initialRect = {
                        x: f.x / canvas.width,
                        y: f.y / canvas.height,
                        width: f.width / canvas.width,
                        height: f.height / canvas.height,
                    };
                    if (onImageToFront) onImageToFront(img.id);
                }

                setIsDragging(true);
                dragRef.current = {
                    activeId: img.id,
                    startX: e.clientX,
                    startY: e.clientY,
                    initialOffsetX: img.offsetX,
                    initialOffsetY: img.offsetY,
                    mode,
                    initialRect,
                    checkpointed: false,
                };
                (e.target as HTMLElement).setPointerCapture(e.pointerId);
                // Select image in parent
                if (onImageUpdate) onImageUpdate(img.id, {});
            }
        }
    };

    const handlePointerMove = (e: React.PointerEvent) => {
        if (!isDragging || !dragRef.current.activeId || !canvasRef.current) return;

        const { startX, startY, initialOffsetX, initialOffsetY, activeId, mode, initialRect } = dragRef.current;

        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        // Use average scale to handle non-square pixels roughly, though usually square
        const scaleMult = canvas.width / rect.width;
        const scaleMultY = canvas.height / rect.height;

        // We calculate delta in Screen Space
        const deltaX = (e.clientX - startX) * scaleMult;
        const deltaY = (e.clientY - startY) * scaleMultY;

        if (!onImageUpdate) return;

        // Snapshot undo history once, when the pointer actually starts moving
        // (a plain click never pollutes the history)
        if (!dragRef.current.checkpointed && Math.hypot(e.clientX - startX, e.clientY - startY) > 3) {
            dragRef.current.checkpointed = true;
            if (onInteractionStart) onInteractionStart();
        }

        if (mode === 'frame-move' && initialRect) {
            const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
            // Allow partial off-canvas, but keep a grabbable sliver visible
            const proposed = {
                ...initialRect,
                x: clamp(initialRect.x + deltaX / canvas.width, -initialRect.width + 0.04, 0.96),
                y: clamp(initialRect.y + deltaY / canvas.height, -initialRect.height + 0.04, 0.96),
            };
            const otherRects = images
                .filter(img => img.id !== activeId)
                .map(img => img.freeform)
                .filter((r): r is FreeformRect => !!r);
            const snapped = snapFreeformRect(proposed, otherRects);
            setSnapGuides({ x: snapped.guidesX, y: snapped.guidesY });
            onImageUpdate(activeId, {
                freeform: { ...proposed, x: snapped.x, y: snapped.y },
            });
            return;
        }

        if (mode === 'frame-resize' && initialRect) {
            const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
            onImageUpdate(activeId, {
                freeform: {
                    ...initialRect,
                    width: clamp(initialRect.width + deltaX / canvas.width, MIN_FREEFORM_SIZE, 2),
                    height: clamp(initialRect.height + deltaY / canvas.height, MIN_FREEFORM_SIZE, 2),
                },
            });
            return;
        }

        // We store Offset in Screen Space (relative to the un-rotated frame center conceptually)
        // The render function handles mapping this back to the rotated coordinate system
        onImageUpdate(activeId, {
            offsetX: initialOffsetX + deltaX,
            offsetY: initialOffsetY + deltaY
        });
    };

    const handlePointerUp = (e: React.PointerEvent) => {
        setSnapGuides({ x: [], y: [] });
        if (isDragging) {
            const { activeId, startX, startY } = dragRef.current;

            // Check for Swap (Drop on another image)
            // Only if moved significantly to differentiate from a click/nudge
            const dist = Math.hypot(e.clientX - startX, e.clientY - startY);

            // No drop-swap in FREEFORM — frames are freely positioned, not slots
            if (dist > 20 && activeId && canvasRef.current && onImageSwap && dragRef.current.mode === 'image') { // Threshold for drag vs click
                const rect = canvasRef.current.getBoundingClientRect();
                const scaleX = canvasRef.current.width / rect.width;
                const scaleY = canvasRef.current.height / rect.height;
                const dropX = (e.clientX - rect.left) * scaleX;
                const dropY = (e.clientY - rect.top) * scaleY;

                const dropIndex = framesRef.current.findIndex(f =>
                    dropX >= f.x && dropX <= f.x + f.width &&
                    dropY >= f.y && dropY <= f.y + f.height
                );

                if (dropIndex !== -1) {
                    const targetImg = images[dropIndex];
                    if (targetImg && targetImg.id !== activeId) {
                        // Performed a swap!
                        onImageSwap(activeId, targetImg.id);

                        // Optional: Reset offsets of swapped images so they don't jump weirdly
                        if (onImageUpdate) {
                            onImageUpdate(activeId, { offsetX: 0, offsetY: 0 });
                            onImageUpdate(targetImg.id, { offsetX: 0, offsetY: 0 });
                        }

                        setIsDragging(false);
                        dragRef.current.activeId = null;
                        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
                        return;
                    }
                }
            }

            setIsDragging(false);
            dragRef.current.activeId = null;
            (e.target as HTMLElement).releasePointerCapture(e.pointerId);
            // Trigger one final draw to ensure high-res output is captured if needed
            if (canvasRef.current) {
                onCanvasReady(canvasRef.current.toDataURL('image/png'));
            }
        }
    };

    // Frame affordances for FREEFORM: dashed outline + SE resize dot.
    // Pure DOM overlay (pointer-events none) so exports stay clean.
    const overlay = (() => {
        if (!interactive || !isFreeform || images.length === 0) return null;
        const { width, height } = getCanvasDimensions(
            settings.ratio, settings.customRatioW, settings.customRatioH, 1);
        const rects = resolveFreeformFrames(images.map(img => img.freeform), width, height);
        return rects.map((f, i) => (
            <div
                key={images[i].id}
                className="absolute border-2 border-dashed border-primary/50 pointer-events-none"
                style={{
                    left: `${(f.x / width) * 100}%`,
                    top: `${(f.y / height) * 100}%`,
                    width: `${(f.width / width) * 100}%`,
                    height: `${(f.height / height) * 100}%`,
                }}
            >
                <div className="absolute bottom-0 right-0 w-3.5 h-3.5 translate-x-1/2 translate-y-1/2 bg-primary rounded-full border-2 border-white shadow" />
            </div>
        ));
    })();

    const guideLines = (!interactive || !isFreeform) ? null : (
        <>
            {snapGuides.x.map(gx => (
                <div
                    key={`gx-${gx}`}
                    className="absolute top-0 bottom-0 w-px bg-primary pointer-events-none"
                    data-snap-guide="x"
                    style={{ left: `${gx * 100}%` }}
                />
            ))}
            {snapGuides.y.map(gy => (
                <div
                    key={`gy-${gy}`}
                    className="absolute left-0 right-0 h-px bg-primary pointer-events-none"
                    data-snap-guide="y"
                    style={{ top: `${gy * 100}%` }}
                />
            ))}
        </>
    );

    return (
        <div className={`${className ?? ''} relative`} style={style}>
            <canvas
                ref={canvasRef}
                className={`w-full h-full object-contain touch-none ${interactive ? (isFreeform ? 'cursor-move' : 'cursor-grab active:cursor-grabbing') : ''}`}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerLeave={handlePointerUp}
            />
            {overlay}
            {guideLines}
        </div>
    );
});

PhotoCanvas.displayName = "PhotoCanvas";

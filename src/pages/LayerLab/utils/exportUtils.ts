import { CropRect, Guide } from '../types';
import JSZip from 'jszip';

export interface SplitImage {
    blob: Blob;
    url: string;
    name: string;
}

export const generateSplitImages = async (
    sourceCanvas: HTMLCanvasElement, // This should be the maskCanvas (containing the edit)
    originalImage: HTMLImageElement, // We need original image to composite if mask is just alpha? No, maskCanvas usually has the full staged image.
    // Wait, in current arch: 
    // - previewCanvas (Layer 1) has Original + Mask. 
    // - maskCanvas has just the brush strokes (alpha mask). 
    // actually, `previewCanvas` is what the user sees. We should ideally export `previewCanvas` but restricted to cropRect.
    // However, `previewCanvas` is "Screen Resolution" or "Image Resolution"?
    // In EditorCanvas: canvas.width = originalImage.width. So it is full resolution.
    // We can grab the `previewCanvas` from the DOM or reconstruct it.
    // Reconstructing is safer/cleaner.

    cropRect: CropRect | null,
    guides: Guide[],
    strokeConfig?: { enabled: boolean; color: string; size: number; },
    shadowConfig?: { enabled: boolean; color: string; blur: number; offset: { x: number, y: number }; }
): Promise<SplitImage[]> => {
    if (!cropRect) return [];

    // 1. Create a composition canvas
    const compCanvas = await composeImage(originalImage, sourceCanvas, strokeConfig, shadowConfig);
    if (!compCanvas) return [];

    // 2. Determine Grid Segments
    // We have horizontal and vertical guides. 
    // We need to sort them to form a grid.

    // Add crop boundaries as implicit guides
    const hGuides = guides.filter(g => g.type === 'horizontal').map(g => g.pos).sort((a, b) => a - b);
    const vGuides = guides.filter(g => g.type === 'vertical').map(g => g.pos).sort((a, b) => a - b);

    const matchValue = (val: number, target: number) => Math.abs(val - target) < 1;

    // Ensure crop boundaries are included (deduplicate if guides are exactly on edge)
    // Note: Use cropRect coordinates
    if (!hGuides.some(p => matchValue(p, cropRect.y))) hGuides.unshift(cropRect.y);
    if (!hGuides.some(p => matchValue(p, cropRect.y + cropRect.height))) hGuides.push(cropRect.y + cropRect.height);

    if (!vGuides.some(p => matchValue(p, cropRect.x))) vGuides.unshift(cropRect.x);
    if (!vGuides.some(p => matchValue(p, cropRect.x + cropRect.width))) vGuides.push(cropRect.x + cropRect.width);

    // Now we have cut points.
    // Segments are intervals between points.

    const splits: SplitImage[] = [];
    let count = 1;

    for (let r = 0; r < hGuides.length - 1; r++) {
        for (let c = 0; c < vGuides.length - 1; c++) {
            const y = hGuides[r];
            const h = hGuides[r + 1] - y;
            const x = vGuides[c];
            const w = vGuides[c + 1] - x;

            if (w <= 0 || h <= 0) continue;

            const cellCanvas = document.createElement('canvas');
            cellCanvas.width = w;
            cellCanvas.height = h;
            const cCtx = cellCanvas.getContext('2d');
            if (cCtx) {
                cCtx.drawImage(compCanvas, x, y, w, h, 0, 0, w, h);
                const blob = await new Promise<Blob | null>(resolve => cellCanvas.toBlob(resolve, 'image/png'));
                if (blob) {
                    splits.push({
                        blob,
                        url: URL.createObjectURL(blob),
                        name: `sticker_${count++}.png`
                    });
                }
            }
        }
    }

    return splits;
};

export const downloadZip = async (images: SplitImage[]) => {
    const zip = new JSZip();
    images.forEach(img => {
        zip.file(img.name, img.blob);
    });

    const content = await zip.generateAsync({ type: 'blob' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(content);
    link.download = 'stickers.zip';
    link.click();
};

export const exportCroppedImage = async (
    sourceCanvas: HTMLCanvasElement,
    originalImage: HTMLImageElement,
    cropRect: CropRect | null,
    strokeConfig?: { enabled: boolean; color: string; size: number; },
    shadowConfig?: { enabled: boolean; color: string; blur: number; offset: { x: number, y: number }; }
): Promise<string | null> => {
    // 1. Create Composition
    const compCanvas = await composeImage(originalImage, sourceCanvas, null, null);
    if (!compCanvas) return null;

    // Mask is already applied in composeImage
    // ctx.globalCompositeOperation = 'source-over';
    // ctx.drawImage(originalImage, 0, 0);

    // Apply Mask
    // if (sourceCanvas) {
    //    ctx.globalCompositeOperation = 'destination-in';
    //    ctx.drawImage(sourceCanvas, 0, 0);
    // }

    // 2. Crop
    if (cropRect) {
        const cropCanvas = document.createElement('canvas');
        cropCanvas.width = cropRect.width;
        cropCanvas.height = cropRect.height;
        const cCtx = cropCanvas.getContext('2d');
        if (!cCtx) return null;

        cCtx.drawImage(compCanvas,
            cropRect.x, cropRect.y, cropRect.width, cropRect.height,
            0, 0, cropRect.width, cropRect.height
        );
        return cropCanvas.toDataURL('image/png');
    }

    return compCanvas.toDataURL('image/png');
};

/**
 * Creates a composed canvas with Mask + Stroke + Shadow applied.
 * Returns an HTMLCanvasElement that contains the final full-resolution image.
 */
export const composeImage = (
    originalImage: HTMLImageElement,
    maskCanvas: HTMLCanvasElement | null,
    strokeConfig: { enabled: boolean; color: string; size: number; } | null | undefined,
    shadowConfig: { enabled: boolean; color: string; blur: number; offset: { x: number, y: number }; } | null | undefined
): HTMLCanvasElement | null => {
    const w = originalImage.width;
    const h = originalImage.height;

    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    if (!maskCanvas) {
        ctx.drawImage(originalImage, 0, 0);
        return canvas;
    }

    // 1. Create Cutout
    const cutoutCanvas = document.createElement('canvas');
    cutoutCanvas.width = w;
    cutoutCanvas.height = h;
    const cCtx = cutoutCanvas.getContext('2d')!;
    cCtx.drawImage(originalImage, 0, 0);
    cCtx.globalCompositeOperation = 'destination-in';
    cCtx.drawImage(maskCanvas, 0, 0);
    cCtx.globalCompositeOperation = 'source-over';

    // 2. Stroke
    if (strokeConfig?.enabled) {
        const sCanvas = document.createElement('canvas');
        sCanvas.width = w;
        sCanvas.height = h;
        const sCtx = sCanvas.getContext('2d')!;

        // Naive multi-pass stroke
        const size = strokeConfig.size;
        const steps = 36; // Higher quality for export
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

        // Render to Main Context
        // Apply Shadow to Body (Stroke + Cutout)
        if (shadowConfig?.enabled) {
            ctx.shadowColor = shadowConfig.color;
            ctx.shadowBlur = shadowConfig.blur;
            ctx.shadowOffsetX = shadowConfig.offset.x;
            ctx.shadowOffsetY = shadowConfig.offset.y;
        }

        // Draw Stroke then Cutout
        // We need to group them to apply shadow properly to the union?
        // Standard "Drop Shadow" applies to the alpha shape.
        // So drawing Stroke then Cutout sequentially with shadow set works if they overlap opaque?
        // Actually shadow might double up.
        // Best: combine to body canvas.

        const bodyCanvas = document.createElement('canvas');
        bodyCanvas.width = w; bodyCanvas.height = h;
        const bCtx = bodyCanvas.getContext('2d')!;
        bCtx.drawImage(sCanvas, 0, 0);
        bCtx.drawImage(cutoutCanvas, 0, 0);

        ctx.drawImage(bodyCanvas, 0, 0);
    } else {
        // Just Cutout
        if (shadowConfig?.enabled) {
            ctx.shadowColor = shadowConfig.color;
            ctx.shadowBlur = shadowConfig.blur;
            ctx.shadowOffsetX = shadowConfig.offset.x;
            ctx.shadowOffsetY = shadowConfig.offset.y;
        }
        ctx.drawImage(cutoutCanvas, 0, 0);
    }

    return canvas;
};

import removeBackground from "@imgly/background-removal";

/**
 * Loads an image from a URL or Object URL.
 */
export const loadImage = (src: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = src;
    });
};

/**
 * Generates an Alpha Mask from an image using AI background removal.
 * Returns the original image element and the generated mask as a HTMLCanvasElement.
 */
export const generateMaskFromAI = async (imageSrc: string): Promise<{ original: HTMLImageElement, maskCanvas: HTMLCanvasElement }> => {
    // 1. Load Original Image
    const original = await loadImage(imageSrc);
    const { width, height } = original;

    // 2. Perform AI Removal
    // returns a Blob (PNG)
    const pngBlob = await removeBackground(imageSrc, {
        publicPath: window.location.origin + '/imgly-data/', // Use local assets
        progress: (key: string, current: number, total: number) => {
            console.log(`AI Removing: ${key} ${current}/${total}`);
        }
    });
    const pngUrl = URL.createObjectURL(pngBlob);
    const transparentImage = await loadImage(pngUrl);

    // 3. Create Mask Canvas
    // We want a canvas that represents the opaque areas.
    // The AI result is already: Object=Opaque, Background=Transparent.
    // This is EXACTLY what we need for our "Mask Canvas".
    // We will draw it onto a canvas so we can edit it later.
    const maskCanvas = document.createElement('canvas');
    maskCanvas.width = width;
    maskCanvas.height = height;
    const ctx = maskCanvas.getContext('2d', { willReadFrequently: true });

    if (!ctx) throw new Error("Failed to get mask context");

    // Draw the transparent PNG.
    // Result on canvas:
    // - Object pixels have alpha > 0
    // - Background pixels have alpha = 0
    ctx.drawImage(transparentImage, 0, 0);

    // Clean up
    URL.revokeObjectURL(pngUrl);

    return { original, maskCanvas };
};

/**
 * Creates a blank mask (fully opaque) for manual start.
 */
export const createBlankMask = (width: number, height: number): HTMLCanvasElement => {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (ctx) {
        ctx.fillStyle = 'black'; // Or white?
        // If we want FULLY VISIBLE, we need alpha 255.
        // If we use 'destination-in', anything drawn preserves the content.
        ctx.fillStyle = '#000000'; // Color doesn't matter for destination-in, only Alpha matters.
        ctx.fillRect(0, 0, width, height);
    }
    return canvas;
};

/**
 * Settings for advanced mask processing.
 */
export interface AISettings {
    edgeTolerance: number; // -10 to 10. < 0 = Erode (Shrink), > 0 = Dilate (Grow). Actually implemented as Alpha Shift.
    protectHoles: boolean; // Fill holes inside the object
    enhanceText: boolean; // Placeholder for now (maybe sharpen?)
}

/**
 * Post-processes the generated mask based on settings.
 * operations: Alpha Thresholding (Edge Tolerance), Hole Filling.
 */
export const processMask = (maskCanvas: HTMLCanvasElement, settings: AISettings): HTMLCanvasElement => {
    const w = maskCanvas.width;
    const h = maskCanvas.height;

    // Create a working copy
    const ctx = maskCanvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return maskCanvas;

    const imageData = ctx.getImageData(0, 0, w, h);
    const data = imageData.data;
    const len = data.length;

    // 1. Edge Tolerance (Alpha Shift)
    // Tolerance range: -10 to 10.
    // Negative = Shrink (Make semi-transparent pixels transparent) -> Increase Threshold
    // Positive = Grow (Make semi-transparent pixels opaque) -> Decrease Threshold (or Boost Alpha)

    // Base threshold for "ignoring" background is usually very low (e.g. 10).
    // User tolerance shifts the curve.
    // map tolerance -10..10 to a shift factor?

    // Improved logic:
    // If tolerance > 0 (Grow): Multiply Alpha.
    // If tolerance < 0 (Shrink): Power curve or subtract Alpha.

    if (settings.edgeTolerance !== 0) {
        const t = settings.edgeTolerance; // -10 to 10

        for (let i = 3; i < len; i += 4) {
            let a = data[i];
            if (a === 0) continue; // Pure transparent stays transparent (unless we do morphological dilation, which is hard per-pixel)

            // Normalize 0-1
            let norm = a / 255;

            if (t > 0) {
                // Dilate/Grow: Boost alpha. 
                // Simple boost: a = a + t * 10?
                // Curve: norm = norm ^ (1 - t/20)? (makes <1 values bigger)
                norm = Math.pow(norm, 1 - (t / 15));
            } else {
                // Erode/Shrink: Cut alpha.
                // Curve: norm = norm ^ (1 + |t|/5)? (makes <1 values smaller)
                norm = Math.pow(norm, 1 + (Math.abs(t) / 5));
            }

            // Hard Cutoff for extreme shrinkage
            if (t < -5 && norm < 0.2) norm = 0;

            data[i] = Math.min(255, Math.floor(norm * 255));
        }
    }

    // 2. Protect Holes (Fill Holes)
    if (settings.protectHoles) {
        // Algorithm: Flood fill visual background (alpha=0 or low) from corners.
        // Any unvisited low-alpha pixel is a hole -> set to 255.

        // Threshold for "background"
        const bgThreshold = 50;
        const visited = new Uint8Array(w * h); // 0=unvisited, 1=background
        const stack: number[] = [];

        // Seed corners
        // Top-Left
        stack.push(0);
        // Top-Right
        stack.push(w - 1);
        // Bottom-Left
        stack.push((h - 1) * w);
        // Bottom-Right
        stack.push((h - 1) * w + (w - 1));

        while (stack.length > 0) {
            const idx = stack.pop()!;
            if (visited[idx]) continue;

            // Check if this pixel is actually background
            // If it's FOREGROUND (alpha > threshold), it block the flood fill
            const alpha = data[idx * 4 + 3];
            if (alpha > bgThreshold) {
                continue; // It's a wall
            }

            visited[idx] = 1; // Mark as true background

            // Add neighbors
            const x = idx % w;
            const y = Math.floor(idx / w);

            if (x > 0) stack.push(idx - 1);
            if (x < w - 1) stack.push(idx + 1);
            if (y > 0) stack.push(idx - w);
            if (y < h - 1) stack.push(idx + w);
        }

        // Now, fill holes
        for (let i = 0; i < w * h; i++) {
            if (!visited[i]) {
                // If not visited by background flood fill, it's either object or hole.
                // Make it fully opaque object.
                data[i * 4 + 3] = 255;
            }
        }
    }

    ctx.putImageData(imageData, 0, 0);
    return maskCanvas;
};

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

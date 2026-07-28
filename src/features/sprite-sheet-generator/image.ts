import { SPRITE_SHEET_HEIGHT, SPRITE_SHEET_WIDTH } from './prompt';

export const fileToDataUrl = (file: File): Promise<string> => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error ?? new Error('Unable to read image.'));
    reader.readAsDataURL(file);
});

export const prepareAnalysisImage = (imageUrl: string, maxEdge = 1024): Promise<string> => new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
        const scale = Math.min(1, maxEdge / Math.max(image.naturalWidth, image.naturalHeight));
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
        canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
        const context = canvas.getContext('2d');
        if (!context) {
            reject(new Error('Canvas is unavailable in this browser.'));
            return;
        }
        context.fillStyle = '#FFFFFF';
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.imageSmoothingEnabled = true;
        context.imageSmoothingQuality = 'high';
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.82));
    };
    image.onerror = () => reject(new Error('Reference image could not be prepared for analysis.'));
    image.src = imageUrl;
});

export const normalizeSpriteSheet = (imageUrl: string): Promise<string> => new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = SPRITE_SHEET_WIDTH;
        canvas.height = SPRITE_SHEET_HEIGHT;
        const context = canvas.getContext('2d');
        if (!context) {
            reject(new Error('Canvas is unavailable in this browser.'));
            return;
        }
        context.imageSmoothingEnabled = true;
        context.imageSmoothingQuality = 'high';
        context.drawImage(image, 0, 0, SPRITE_SHEET_WIDTH, SPRITE_SHEET_HEIGHT);
        resolve(canvas.toDataURL('image/png'));
    };
    image.onerror = () => reject(new Error('Generated image could not be loaded.'));
    image.src = imageUrl;
});

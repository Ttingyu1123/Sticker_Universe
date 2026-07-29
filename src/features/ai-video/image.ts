export const blobToDataUrl = (blob: Blob): Promise<string> => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error ?? new Error('Unable to read the source image.'));
    reader.readAsDataURL(blob);
});

export const dataUrlToBlob = (dataUrl: string): Blob => {
    const [header, encoded = ''] = dataUrl.split(',');
    const mimeType = header.match(/data:([^;]+)/)?.[1] ?? 'image/png';
    const binary = atob(encoded);
    const bytes = new Uint8Array(binary.length);
    for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
    return new Blob([bytes], { type: mimeType });
};

export const prepareAiVideoInput = (blob: Blob, maxWidth = 1280, maxHeight = 720): Promise<string> => new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(blob);
    const image = new Image();
    image.onload = () => {
        try {
            const scale = Math.min(1, maxWidth / image.naturalWidth, maxHeight / image.naturalHeight);
            const canvas = document.createElement('canvas');
            canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
            canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
            const context = canvas.getContext('2d');
            if (!context) throw new Error('Canvas is unavailable in this browser.');
            context.imageSmoothingEnabled = true;
            context.imageSmoothingQuality = 'high';
            context.drawImage(image, 0, 0, canvas.width, canvas.height);
            resolve(canvas.toDataURL('image/jpeg', 0.9));
        } catch (error) {
            reject(error);
        } finally {
            URL.revokeObjectURL(objectUrl);
        }
    };
    image.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        reject(new Error('The source image could not be prepared.'));
    };
    image.src = objectUrl;
});

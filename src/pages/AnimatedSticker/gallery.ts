import { saveStickerToDB } from '../../db';
import type { Sticker } from '../../shared/types/sticker';
import type { AnimatedStickerResult } from './types';

interface AnimatedStickerGalleryOptions {
    batchId: string;
    timestamp: number;
    phrase: (number: number) => string;
    description: string;
}

export const blobToDataUrl = (blob: Blob): Promise<string> => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
        if (typeof reader.result === 'string') {
            resolve(reader.result);
            return;
        }
        reject(new Error('Blob could not be converted to a data URL.'));
    };
    reader.onerror = () => reject(reader.error ?? new Error('Blob could not be read.'));
    reader.readAsDataURL(blob);
});

export const createAnimatedStickerGalleryItems = (
    results: AnimatedStickerResult[],
    imageUrls: string[],
    options: AnimatedStickerGalleryOptions,
): Sticker[] => {
    if (results.length !== imageUrls.length) {
        throw new Error('Each animated sticker result requires one image URL.');
    }

    return results.map((result, index) => ({
        id: `animated-sticker-${options.batchId}-${String(result.index + 1).padStart(2, '0')}`,
        imageUrl: imageUrls[index],
        phrase: options.phrase(result.index + 1),
        description: options.description,
        timestamp: options.timestamp,
    }));
};

export const saveAnimatedStickerResults = async (
    results: AnimatedStickerResult[],
    options: AnimatedStickerGalleryOptions,
): Promise<Sticker[]> => {
    const imageUrls = await Promise.all(results.map((result) => blobToDataUrl(result.blob)));
    const items = createAnimatedStickerGalleryItems(results, imageUrls, options);
    await Promise.all(items.map((item) => saveStickerToDB(item)));
    return items;
};

export const createAnimatedStickerBatchId = (): string => {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        return crypto.randomUUID();
    }
    return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
};

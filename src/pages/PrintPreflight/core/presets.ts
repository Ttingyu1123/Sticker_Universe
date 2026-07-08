import type { ViewingDistanceId } from './types';

export const MM_PER_INCH = 25.4;

export interface ViewingDistancePreset {
    id: ViewingDistanceId;
    labelKey: string;
    requiredDpi: number;
    acceptableDpi: number;
}

// Required DPI drops with viewing distance; values follow common print-shop
// guidance (300 close-up, ~150 posters, ~100 large format).
export const VIEWING_DISTANCES: ViewingDistancePreset[] = [
    { id: 'handheld', labelKey: 'printPreflight.distance.handheld', requiredDpi: 300, acceptableDpi: 240 },
    { id: 'wall', labelKey: 'printPreflight.distance.wall', requiredDpi: 200, acceptableDpi: 150 },
    { id: 'poster', labelKey: 'printPreflight.distance.poster', requiredDpi: 150, acceptableDpi: 100 },
    { id: 'large', labelKey: 'printPreflight.distance.large', requiredDpi: 100, acceptableDpi: 70 },
];

export interface SizePreset {
    id: string;
    labelKey: string;
    widthMm: number;
    heightMm: number;
    viewingDistance: ViewingDistanceId;
}

export const SIZE_PRESETS: SizePreset[] = [
    { id: 'sticker', labelKey: 'printPreflight.presets.sticker', widthMm: 50, heightMm: 50, viewingDistance: 'handheld' },
    { id: 'businessCard', labelKey: 'printPreflight.presets.businessCard', widthMm: 90, heightMm: 54, viewingDistance: 'handheld' },
    { id: 'postcard', labelKey: 'printPreflight.presets.postcard', widthMm: 148, heightMm: 100, viewingDistance: 'handheld' },
    { id: 'a4', labelKey: 'printPreflight.presets.a4', widthMm: 210, heightMm: 297, viewingDistance: 'wall' },
    { id: 'a3', labelKey: 'printPreflight.presets.a3', widthMm: 297, heightMm: 420, viewingDistance: 'wall' },
    { id: 'a2', labelKey: 'printPreflight.presets.a2', widthMm: 420, heightMm: 594, viewingDistance: 'poster' },
    { id: 'a1', labelKey: 'printPreflight.presets.a1', widthMm: 594, heightMm: 841, viewingDistance: 'poster' },
    { id: 'b2', labelKey: 'printPreflight.presets.b2', widthMm: 515, heightMm: 728, viewingDistance: 'poster' },
    { id: 'canvas', labelKey: 'printPreflight.presets.canvas', widthMm: 600, heightMm: 900, viewingDistance: 'large' },
];

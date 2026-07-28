import { safeLoadFromLocalStorage, safeSaveToLocalStorage } from '../../shared/localStorage';

const BACKGROUND_COLOR_STORAGE_KEY = 'sticker-chroma-key-color-v1';
const HEX_COLOR_PATTERN = /^#[0-9a-fA-F]{6}$/;

export const normalizeStickerBackgroundColor = (
    value: unknown,
    fallback = '#00FF00',
): string => {
    if (typeof value !== 'string' || !HEX_COLOR_PATTERN.test(value.trim())) return fallback;
    return value.trim().toUpperCase();
};

export const saveStickerBackgroundColor = (color: string): void => {
    if (!HEX_COLOR_PATTERN.test(color.trim())) return;
    safeSaveToLocalStorage(BACKGROUND_COLOR_STORAGE_KEY, color.trim().toUpperCase());
};

export const loadStickerBackgroundColor = (fallback = '#FFFFFF'): string => {
    const stored = safeLoadFromLocalStorage<unknown>(BACKGROUND_COLOR_STORAGE_KEY);
    return normalizeStickerBackgroundColor(stored, fallback);
};

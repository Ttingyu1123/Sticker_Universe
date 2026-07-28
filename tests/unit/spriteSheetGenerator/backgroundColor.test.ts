import { beforeEach, describe, expect, it } from 'vitest';
import {
    loadStickerBackgroundColor,
    normalizeStickerBackgroundColor,
    saveStickerBackgroundColor,
} from '../../../src/features/sprite-sheet-generator/backgroundColor';

describe('shared sticker chroma-key color', () => {
    beforeEach(() => localStorage.clear());

    it('normalizes a valid AI color and rejects malformed values', () => {
        expect(normalizeStickerBackgroundColor('#0066ff')).toBe('#0066FF');
        expect(normalizeStickerBackgroundColor('blue', '#FFFFFF')).toBe('#FFFFFF');
    });

    it('shares the chosen generation color with the animated sticker page', () => {
        saveStickerBackgroundColor('#FF00FF');
        expect(loadStickerBackgroundColor()).toBe('#FF00FF');
    });
});

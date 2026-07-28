import { describe, expect, it } from 'vitest';
import {
    buildCompressionProfiles,
    selectEvenlySpacedFrames,
} from '../../../src/pages/AnimatedSticker/utils/compression';

describe('animated sticker smart compression', () => {
    it('preserves all frames while reducing colors before dropping animation frames', () => {
        expect(buildCompressionProfiles(12).slice(0, 3)).toEqual([
            { colorCount: 256, frameCount: 12 },
            { colorCount: 128, frameCount: 12 },
            { colorCount: 64, frameCount: 12 },
        ]);
    });

    it('keeps a five-frame fallback so difficult stickers can still reach the size target', () => {
        expect(buildCompressionProfiles(12)).toContainEqual({ colorCount: 16, frameCount: 5 });
        expect(buildCompressionProfiles(5).every((profile) => profile.frameCount === 5)).toBe(true);
    });

    it('selects frames across the full animation instead of truncating the ending', () => {
        expect(selectEvenlySpacedFrames(['a', 'b', 'c', 'd', 'e', 'f'], 3)).toEqual(['a', 'c', 'e']);
        expect(selectEvenlySpacedFrames(['a', 'b'], 5)).toEqual(['a', 'b']);
    });
});

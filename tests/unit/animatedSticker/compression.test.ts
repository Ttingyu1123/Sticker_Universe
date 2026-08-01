import { beforeAll, describe, expect, it, vi } from 'vitest';
import type { AnimatedStickerResult } from '../../../src/pages/AnimatedSticker/types';
import {
    buildCompressionProfiles,
    compressAnimatedSticker,
    selectEvenlySpacedFrames,
} from '../../../src/pages/AnimatedSticker/utils/compression';

vi.mock('../../../src/pages/AnimatedSticker/utils/apng', () => ({
    encodeAnimatedPng: (
        frames: Uint8ClampedArray[],
        _width: number,
        _height: number,
        _durationMs: number,
        colorCount: number,
    ) => ({
        buffer: new ArrayBuffer(frames.length * 100 + colorCount),
        loopCount: 2,
    }),
}));

describe('animated sticker smart compression', () => {
    beforeAll(() => {
        Object.defineProperty(URL, 'createObjectURL', {
            configurable: true,
            value: vi.fn(() => 'blob:compressed'),
        });
        Object.defineProperty(URL, 'revokeObjectURL', {
            configurable: true,
            value: vi.fn(),
        });
    });

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

    it('stores the actual selected frames on a frame-reduced result', () => {
        const sourceFrames = Array.from(
            { length: 6 },
            (_, index) => new Uint8ClampedArray([index]),
        );
        const result: AnimatedStickerResult = {
            index: 0,
            blob: new Blob(['original']),
            url: 'blob:original',
            sizeBytes: 1024 * 1024,
            frameCount: sourceFrames.length,
            sourceFrames,
            durationMs: 2_000,
            colorCount: 0,
            width: 320,
            height: 270,
            loopCount: 2,
            hasTransparency: true,
            hasMotion: true,
            isRgb: true,
        };

        const compressed = compressAnimatedSticker(result, 550);

        expect(compressed.frameCount).toBe(5);
        expect(compressed.sourceFrames).toEqual(selectEvenlySpacedFrames(sourceFrames, 5));
        expect(compressed.sourceFrames).toHaveLength(compressed.frameCount);
    });
});

import { beforeAll, describe, expect, it, vi } from 'vitest';
import type { AnimatedStickerResult } from '../../../src/pages/AnimatedSticker/types';
import { trimAnimatedStickerFrames } from '../../../src/pages/AnimatedSticker/utils/frameTrimming';

const createFrame = (value: number, alpha = 255): Uint8ClampedArray => new Uint8ClampedArray([
    value, 0, 0, alpha,
    0, value, 0, alpha,
]);

const createResult = (frames: Uint8ClampedArray[]): AnimatedStickerResult => ({
    index: 2,
    blob: new Blob(['original'], { type: 'image/png' }),
    url: 'blob:original',
    sizeBytes: 8,
    frameCount: frames.length,
    sourceFrames: frames,
    durationMs: 2_000,
    colorCount: 0,
    width: 2,
    height: 1,
    loopCount: 2,
    hasTransparency: false,
    hasMotion: true,
    isRgb: true,
});

describe('animated sticker frame trimming', () => {
    beforeAll(() => {
        Object.defineProperty(URL, 'createObjectURL', {
            configurable: true,
            value: vi.fn(() => 'blob:trimmed'),
        });
    });

    it('removes leading and trailing frames while preserving the LINE duration', () => {
        const frames = [
            createFrame(10),
            createFrame(20, 128),
            createFrame(30),
            createFrame(40),
            createFrame(50),
            createFrame(60),
            createFrame(70),
        ];

        const trimmed = trimAnimatedStickerFrames(createResult(frames), 1, 6);

        expect(trimmed.sourceFrames).toEqual(frames.slice(1, 6));
        expect(trimmed.frameCount).toBe(5);
        expect(trimmed.durationMs).toBe(2_000);
        expect(trimmed.loopCount).toBe(2);
        expect(trimmed.hasTransparency).toBe(true);
        expect(trimmed.hasMotion).toBe(true);
        expect(trimmed.url).toBe('blob:trimmed');
        expect(trimmed.blob.size).toBeGreaterThan(0);
        expect(trimmed.sizeBytes).toBe(trimmed.blob.size);
    });

    it('rejects ranges that retain fewer than five frames', () => {
        const result = createResult(Array.from({ length: 7 }, (_, index) => createFrame(index)));

        expect(() => trimAnimatedStickerFrames(result, 0, 4)).toThrow('at least 5 frames');
    });

    it.each([
        [-1, 5],
        [2, 2],
        [0, 8],
    ])('rejects an invalid [%i, %i) frame range', (startIndex, endIndex) => {
        const result = createResult(Array.from({ length: 7 }, (_, index) => createFrame(index)));

        expect(() => trimAnimatedStickerFrames(result, startIndex, endIndex))
            .toThrow('valid frame range');
    });

    it('recomputes motion from only the retained frames', () => {
        const repeated = createFrame(90);
        const frames = [createFrame(10), createFrame(20), repeated, repeated, repeated, repeated, repeated];

        expect(trimAnimatedStickerFrames(createResult(frames), 2, 7).hasMotion).toBe(false);
    });
});

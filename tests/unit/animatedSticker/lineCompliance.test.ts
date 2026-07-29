import { describe, expect, it } from 'vitest';
import UPNG from 'upng-js';
import * as apng from '../../../src/pages/AnimatedSticker/utils/apng';
import {
    encodeAnimatedPng,
    getApngLoopCount,
    getLineLoopCount,
    setApngLoopCount,
} from '../../../src/pages/AnimatedSticker/utils/apng';
import { validateLineAnimatedSticker } from '../../../src/pages/AnimatedSticker/utils/lineCompliance';

const createApngHeader = (loopCount = 0): ArrayBuffer => {
    const bytes = new Uint8Array(28);
    bytes.set([137, 80, 78, 71, 13, 10, 26, 10]);
    const view = new DataView(bytes.buffer);
    view.setUint32(8, 8);
    bytes.set([97, 99, 84, 76], 12);
    view.setUint32(16, 12);
    view.setUint32(20, loopCount);
    return bytes.buffer;
};

const createDistinctFrames = (frameCount: number, width: number, height: number): Uint8ClampedArray[] => (
    Array.from({ length: frameCount }, (_, frameIndex) => {
        const frame = new Uint8ClampedArray(width * height * 4);
        for (let y = 0; y < height; y += 1) {
            for (let x = 0; x < width; x += 1) {
                const offset = (y * width + x) * 4;
                frame[offset] = (x * 31 + frameIndex * 17) % 256;
                frame[offset + 1] = (y * 29 + frameIndex * 23) % 256;
                frame[offset + 2] = (x * y + frameIndex * 41) % 256;
                frame[offset + 3] = (x + frameIndex) % width < width / 2 ? 255 : 100;
            }
        }
        return frame;
    })
);

const readApngDurationMs = (buffer: ArrayBuffer): number => {
    const bytes = new Uint8Array(buffer);
    const view = new DataView(buffer);
    let offset = 8;
    let durationMs = 0;
    while (offset + 12 <= bytes.length) {
        const length = view.getUint32(offset);
        const typeOffset = offset + 4;
        const type = String.fromCharCode(...bytes.slice(typeOffset, typeOffset + 4));
        if (type === 'fcTL' && length >= 26) {
            const numerator = view.getUint16(typeOffset + 24);
            const denominator = view.getUint16(typeOffset + 26) || 100;
            durationMs += (numerator * 1000) / denominator;
        }
        offset = typeOffset + 4 + length + 4;
    }
    return durationMs;
};

describe('LINE APNG loop encoding', () => {
    it('keeps the full RGBA color data when encoding a static tab PNG', () => {
        const encodeStatic = (apng as typeof apng & {
            encodeStaticPng?: (
                frame: Uint8ClampedArray,
                width: number,
                height: number,
            ) => ArrayBuffer;
        }).encodeStaticPng;
        const frame = new Uint8ClampedArray(257 * 4);
        for (let index = 0; index < 257; index += 1) {
            const offset = index * 4;
            frame[offset] = index % 256;
            frame[offset + 1] = Math.floor(index / 2) % 256;
            frame[offset + 2] = Math.floor(index / 3) % 256;
            frame[offset + 3] = index % 5 === 0 ? 128 : 255;
        }

        expect(encodeStatic).toBeTypeOf('function');
        if (!encodeStatic) return;
        const decoded = UPNG.decode(encodeStatic(frame, 257, 1));
        const rgba = new Uint8ClampedArray(UPNG.toRGBA8(decoded)[0]);
        expect(rgba).toEqual(frame);
    });

    it('chooses a finite loop count whose total playback stays within four seconds', () => {
        expect([1, 2, 3, 4].map(getLineLoopCount)).toEqual([4, 2, 1, 1]);
    });

    it('replaces APNG infinite looping with the requested finite loop count', () => {
        const patched = setApngLoopCount(createApngHeader(0), 2);
        expect(getApngLoopCount(patched)).toBe(2);
        expect(new DataView(patched).getUint32(24)).not.toBe(0);
    });

    it.each([1000, 2000, 3000, 4000])(
        'encodes 12 frames to exactly %i ms',
        (durationMs) => {
            const encoded = encodeAnimatedPng(createDistinctFrames(12, 16, 16), 16, 16, durationMs, 0);
            expect(readApngDurationMs(encoded.buffer)).toBe(durationMs);
        },
    );
});

describe('LINE animated sticker validation', () => {
    const validSticker = {
        width: 320,
        height: 270,
        sizeBytes: 340 * 1024,
        frameCount: 12,
        durationMs: 2000,
        loopCount: 2,
        hasTransparency: true,
        isRgb: true,
        hasMotion: true,
    };

    it('passes a complete 320x270 two-second APNG with two loops', () => {
        const validation = validateLineAnimatedSticker(validSticker);
        expect(validation.isCompliant).toBe(true);
        expect(validation.failures).toEqual([]);
    });

    it('rejects an infinite-loop APNG even when its size is below one megabyte', () => {
        const validation = validateLineAnimatedSticker({ ...validSticker, loopCount: 0 });
        expect(validation.isCompliant).toBe(false);
        expect(validation.failures).toContain('loopCount');
    });

    it('rejects an APNG whose frames are all identical', () => {
        const validation = validateLineAnimatedSticker({ ...validSticker, hasMotion: false });
        expect(validation.failures).toContain('motion');
    });
});

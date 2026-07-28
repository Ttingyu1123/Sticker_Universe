import { describe, expect, it } from 'vitest';
import {
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

describe('LINE APNG loop encoding', () => {
    it('chooses a finite loop count whose total playback stays within four seconds', () => {
        expect([1, 2, 3, 4].map(getLineLoopCount)).toEqual([4, 2, 1, 1]);
    });

    it('replaces APNG infinite looping with the requested finite loop count', () => {
        const patched = setApngLoopCount(createApngHeader(0), 2);
        expect(getApngLoopCount(patched)).toBe(2);
        expect(new DataView(patched).getUint32(24)).not.toBe(0);
    });
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

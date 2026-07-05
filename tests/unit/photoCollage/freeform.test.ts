import { describe, it, expect } from 'vitest';
import {
    resolveFreeformFrames,
    normalizeFrames,
    DEFAULT_FREEFORM_SIZE,
    MIN_FREEFORM_SIZE,
} from '../../../src/pages/PhotoCollage/utils/freeform';

describe('freeform frame resolution', () => {
    const W = 1200;
    const H = 900;

    it('maps normalized rects to pixel frames', () => {
        const frames = resolveFreeformFrames(
            [{ x: 0.1, y: 0.2, width: 0.5, height: 0.4 }], W, H);
        expect(frames[0]).toEqual({ x: 120, y: 180, width: 600, height: 360 });
    });

    it('round-trips: normalize(resolve(rects)) === rects', () => {
        const rects = [
            { x: 0.05, y: 0.1, width: 0.4, height: 0.3 },
            { x: 0.5, y: 0.45, width: 0.45, height: 0.5 },
        ];
        const back = normalizeFrames(resolveFreeformFrames(rects, W, H), W, H);
        back.forEach((r, i) => {
            expect(r.x).toBeCloseTo(rects[i].x, 6);
            expect(r.y).toBeCloseTo(rects[i].y, 6);
            expect(r.width).toBeCloseTo(rects[i].width, 6);
            expect(r.height).toBeCloseTo(rects[i].height, 6);
        });
    });

    it('gives images without a stored rect a deterministic cascade default inside the canvas', () => {
        const a = resolveFreeformFrames([undefined, undefined, undefined], W, H);
        const b = resolveFreeformFrames([undefined, undefined, undefined], W, H);
        expect(a).toEqual(b);
        // cascade: consecutive defaults must not sit on the exact same spot
        expect(a[0].x).not.toEqual(a[1].x);
        for (const f of a) {
            expect(f.x).toBeGreaterThanOrEqual(0);
            expect(f.y).toBeGreaterThanOrEqual(0);
            expect(f.x + f.width).toBeLessThanOrEqual(W);
            expect(f.y + f.height).toBeLessThanOrEqual(H);
            expect(f.width).toBeCloseTo(W * DEFAULT_FREEFORM_SIZE, 3);
        }
    });

    it('enforces the minimum size so a frame cannot be resized away', () => {
        const frames = resolveFreeformFrames(
            [{ x: 0.2, y: 0.2, width: 0.001, height: 0.001 }], W, H);
        expect(frames[0].width).toBeGreaterThanOrEqual(W * MIN_FREEFORM_SIZE - 1e-6);
        expect(frames[0].height).toBeGreaterThanOrEqual(H * MIN_FREEFORM_SIZE - 1e-6);
    });

    it('handles mixed stored/missing rects by index', () => {
        const frames = resolveFreeformFrames(
            [undefined, { x: 0.25, y: 0.25, width: 0.5, height: 0.5 }], W, H);
        expect(frames).toHaveLength(2);
        expect(frames[1]).toEqual({ x: 300, y: 225, width: 600, height: 450 });
    });
});

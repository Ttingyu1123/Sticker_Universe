import { describe, it, expect } from 'vitest';
import { generateTornEdgePoints, TORN_AMPLITUDE_RATIO } from '../../../src/pages/PhotoCollage/utils/tornEdge';

describe('generateTornEdgePoints', () => {
    const W = 600;
    const H = 400;
    const AMP = Math.min(W, H) * TORN_AMPLITUDE_RATIO;

    it('is deterministic for the same seed (stable across re-renders)', () => {
        const a = generateTornEdgePoints(W, H, 3);
        const b = generateTornEdgePoints(W, H, 3);
        expect(a).toEqual(b);
    });

    it('differs between seeds so each photo tears differently', () => {
        const a = generateTornEdgePoints(W, H, 1);
        const b = generateTornEdgePoints(W, H, 2);
        expect(JSON.stringify(a)).not.toEqual(JSON.stringify(b));
    });

    it('keeps every point within the amplitude band around the rect', () => {
        const pts = generateTornEdgePoints(W, H, 7);
        for (const p of pts) {
            expect(p.x).toBeGreaterThanOrEqual(-AMP);
            expect(p.x).toBeLessThanOrEqual(W + AMP);
            expect(p.y).toBeGreaterThanOrEqual(-AMP);
            expect(p.y).toBeLessThanOrEqual(H + AMP);
        }
    });

    it('produces enough points to read as a torn edge on all four sides', () => {
        const pts = generateTornEdgePoints(W, H, 5);
        expect(pts.length).toBeGreaterThanOrEqual(16);
        const nearTop = pts.filter(p => Math.abs(p.y) <= AMP).length;
        const nearBottom = pts.filter(p => Math.abs(p.y - H) <= AMP).length;
        const nearLeft = pts.filter(p => Math.abs(p.x) <= AMP).length;
        const nearRight = pts.filter(p => Math.abs(p.x - W) <= AMP).length;
        expect(nearTop).toBeGreaterThanOrEqual(3);
        expect(nearBottom).toBeGreaterThanOrEqual(3);
        expect(nearLeft).toBeGreaterThanOrEqual(3);
        expect(nearRight).toBeGreaterThanOrEqual(3);
    });

    it('actually jitters (not a plain rectangle)', () => {
        const pts = generateTornEdgePoints(W, H, 9);
        const onNominalEdge = pts.every(p =>
            p.x === 0 || p.x === W || p.y === 0 || p.y === H);
        expect(onNominalEdge).toBe(false);
    });
});

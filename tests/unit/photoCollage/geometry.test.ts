import { describe, it, expect } from 'vitest';
import { calculateFrames } from '../../../src/pages/PhotoCollage/utils/geometry';
import { LayoutType } from '../../../src/pages/PhotoCollage/types';

const distinct = (values: number[]) => [...new Set(values.map(v => Math.round(v)))];

const gridShape = (frames: { x: number; y: number }[]) => ({
    cols: distinct(frames.map(f => f.x)).length,
    rows: distinct(frames.map(f => f.y)).length,
});

describe('calculateFrames GRID layout', () => {
    it('keeps 4 images in a 2x2 grid on a 16:9 canvas', () => {
        const frames = calculateFrames(4, LayoutType.GRID, 1200, 675, 0, 0);
        expect(frames).toHaveLength(4);
        expect(gridShape(frames)).toEqual({ cols: 2, rows: 2 });
    });

    it('keeps 4 images in a 2x2 grid on a 9:16 canvas', () => {
        const frames = calculateFrames(4, LayoutType.GRID, 675, 1200, 0, 0);
        expect(frames).toHaveLength(4);
        expect(gridShape(frames)).toEqual({ cols: 2, rows: 2 });
    });

    it('keeps 4 images in a 2x2 grid on a 1:1 canvas', () => {
        const frames = calculateFrames(4, LayoutType.GRID, 1200, 1200, 0, 0);
        expect(frames).toHaveLength(4);
        expect(gridShape(frames)).toEqual({ cols: 2, rows: 2 });
    });

    it('gives every cell the full-canvas aspect ratio in a 2x2 grid, so 16:9 photos fit a 16:9 canvas uncropped', () => {
        const frames = calculateFrames(4, LayoutType.GRID, 1200, 675, 0, 0);
        for (const f of frames) {
            expect(f.width / f.height).toBeCloseTo(16 / 9, 5);
        }
    });

    it('keeps 9 images in a 3x3 grid on a 16:9 canvas', () => {
        const frames = calculateFrames(9, LayoutType.GRID, 1200, 675, 0, 0);
        expect(frames).toHaveLength(9);
        expect(gridShape(frames)).toEqual({ cols: 3, rows: 3 });
    });

    it('still adapts non-square counts to the canvas ratio (6 images, wide canvas)', () => {
        const frames = calculateFrames(6, LayoutType.GRID, 1200, 675, 0, 0);
        expect(frames).toHaveLength(6);
        expect(gridShape(frames).cols).toBeGreaterThan(2);
    });
});

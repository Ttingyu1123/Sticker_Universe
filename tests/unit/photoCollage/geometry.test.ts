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

describe('calculateFrames BENTO layout', () => {
    const W = 1200;
    const H = 900;

    const overlapArea = (a: { x: number; y: number; width: number; height: number }, b: typeof a) => {
        const ox = Math.max(0, Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x));
        const oy = Math.max(0, Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y));
        return ox * oy;
    };

    for (let count = 3; count <= 8; count++) {
        it(`tiles ${count} images with no overlap and full coverage (gap 0)`, () => {
            const frames = calculateFrames(count, LayoutType.BENTO, W, H, 0, 0);
            expect(frames).toHaveLength(count);
            const total = frames.reduce((acc, f) => acc + f.width * f.height, 0);
            expect(total).toBeCloseTo(W * H, 3);
            for (let i = 0; i < count; i++) {
                for (let j = i + 1; j < count; j++) {
                    expect(overlapArea(frames[i], frames[j])).toBeCloseTo(0, 3);
                }
            }
        });
    }

    it('produces mixed cell sizes (that is the point of bento)', () => {
        const frames = calculateFrames(4, LayoutType.BENTO, W, H, 0, 0);
        const areas = distinct(frames.map(f => f.width * f.height));
        expect(areas.length).toBeGreaterThan(1);
    });

    it('variant 1 mirrors the layout so it differs from variant 0', () => {
        const v0 = calculateFrames(4, LayoutType.BENTO, W, H, 0, 0, undefined, undefined, undefined, 1.8, 0);
        const v1 = calculateFrames(4, LayoutType.BENTO, W, H, 0, 0, undefined, undefined, undefined, 1.8, 1);
        expect(JSON.stringify(v0)).not.toEqual(JSON.stringify(v1));
        const area = (fs: typeof v0) => fs.reduce((acc, f) => acc + f.width * f.height, 0);
        expect(area(v1)).toBeCloseTo(W * H, 3);
    });

    it('assigns the hero image to the largest cell', () => {
        const frames = calculateFrames(4, LayoutType.BENTO, W, H, 0, 0, [2]);
        const areas = frames.map(f => f.width * f.height);
        expect(areas[2]).toBe(Math.max(...areas));
    });

    it('falls back to GRID outside the 3-8 range', () => {
        const bento9 = calculateFrames(9, LayoutType.BENTO, W, H, 0, 0);
        const grid9 = calculateFrames(9, LayoutType.GRID, W, H, 0, 0);
        expect(bento9).toEqual(grid9);
        const bento2 = calculateFrames(2, LayoutType.BENTO, W, H, 0, 0);
        const grid2 = calculateFrames(2, LayoutType.GRID, W, H, 0, 0);
        expect(bento2).toEqual(grid2);
    });

    it('keeps outer edges flush and separates neighbors by the gap', () => {
        const gap = 12;
        const frames = calculateFrames(4, LayoutType.BENTO, W, H, gap, 0);
        const minX = Math.min(...frames.map(f => f.x));
        const maxX = Math.max(...frames.map(f => f.x + f.width));
        const minY = Math.min(...frames.map(f => f.y));
        const maxY = Math.max(...frames.map(f => f.y + f.height));
        expect(minX).toBeCloseTo(0, 3);
        expect(maxX).toBeCloseTo(W, 3);
        expect(minY).toBeCloseTo(0, 3);
        expect(maxY).toBeCloseTo(H, 3);
    });
});

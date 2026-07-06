import { FreeformRect, ImageFrame } from '../types';

// Freeform frames are stored normalized (0-1 of canvas size) so switching
// canvas ratio or export scale keeps the composition.

/** Default cell size (fraction of canvas) for images without a stored rect. */
export const DEFAULT_FREEFORM_SIZE = 0.45;
/** Smallest a frame can be resized to (fraction of canvas). */
export const MIN_FREEFORM_SIZE = 0.08;

/** Deterministic staircase placement for images that have no stored rect yet. */
const cascadeDefault = (index: number): FreeformRect => {
    const offset = 0.06 + (index % 5) * 0.05;
    return {
        x: offset,
        y: offset,
        width: DEFAULT_FREEFORM_SIZE,
        height: DEFAULT_FREEFORM_SIZE,
    };
};

/** Converts per-image normalized rects to pixel frames. `undefined` entries get cascade defaults. */
export const resolveFreeformFrames = (
    rects: (FreeformRect | undefined)[],
    width: number,
    height: number
): ImageFrame[] => {
    return rects.map((rect, index) => {
        const r = rect ?? cascadeDefault(index);
        return {
            x: r.x * width,
            y: r.y * height,
            width: Math.max(MIN_FREEFORM_SIZE, r.width) * width,
            height: Math.max(MIN_FREEFORM_SIZE, r.height) * height,
        };
    });
};

/** How close (fraction of canvas) an edge must be to a guide before it snaps. */
export const SNAP_THRESHOLD = 0.008;

export interface SnapResult {
    x: number;
    y: number;
    guidesX: number[];
    guidesY: number[];
}

/**
 * Snaps a dragged frame onto alignment guides: canvas edges/center and the
 * edges/centers of the other frames. Returns the adjusted position plus the
 * guide lines that matched (for the visual overlay). Move-only — width and
 * height are never changed.
 */
export const snapFreeformRect = (
    rect: FreeformRect,
    others: FreeformRect[],
    threshold: number = SNAP_THRESHOLD
): SnapResult => {
    const candX = new Set<number>([0, 0.5, 1]);
    const candY = new Set<number>([0, 0.5, 1]);
    for (const o of others) {
        candX.add(o.x); candX.add(o.x + o.width); candX.add(o.x + o.width / 2);
        candY.add(o.y); candY.add(o.y + o.height); candY.add(o.y + o.height / 2);
    }

    const bestShift = (edges: number[], candidates: Set<number>) => {
        let best: { delta: number; guide: number } | null = null;
        for (const c of candidates) {
            for (const e of edges) {
                const delta = c - e;
                if (Math.abs(delta) <= threshold && (!best || Math.abs(delta) < Math.abs(best.delta))) {
                    best = { delta, guide: c };
                }
            }
        }
        return best;
    };

    const sx = bestShift([rect.x, rect.x + rect.width / 2, rect.x + rect.width], candX);
    const sy = bestShift([rect.y, rect.y + rect.height / 2, rect.y + rect.height], candY);

    return {
        x: rect.x + (sx?.delta ?? 0),
        y: rect.y + (sy?.delta ?? 0),
        guidesX: sx ? [sx.guide] : [],
        guidesY: sy ? [sy.guide] : [],
    };
};

/** Inverse of resolveFreeformFrames — used when entering freeform mode to keep the current layout. */
export const normalizeFrames = (
    frames: ImageFrame[],
    width: number,
    height: number
): FreeformRect[] => {
    return frames.map(f => ({
        x: f.x / width,
        y: f.y / height,
        width: f.width / width,
        height: f.height / height,
    }));
};

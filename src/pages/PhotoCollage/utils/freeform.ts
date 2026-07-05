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

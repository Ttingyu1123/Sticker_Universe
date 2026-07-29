import { describe, expect, it } from 'vitest';
import * as frameProcessing from '../../../src/pages/AnimatedSticker/utils/frameProcessing';
import {
    applyChromaKey,
    calculateStabilizationOffsets,
    DEFAULT_GRID_CALIBRATION,
    getCombinedOpaqueBounds,
    getGridCellRect,
    getOpaqueBounds,
    getSampleTimes,
    setGridGuide,
    parseHexColor,
    shiftRgbaFrame,
    STICKER_COUNT,
} from '../../../src/pages/AnimatedSticker/utils/frameProcessing';

const createFrame = (width: number, height: number, x: number, y: number) => {
    const frame = new Uint8ClampedArray(width * height * 4);
    const offset = (y * width + x) * 4;
    frame[offset] = 40;
    frame[offset + 1] = 80;
    frame[offset + 2] = 120;
    frame[offset + 3] = 255;
    return frame;
};

describe('animated sticker 4x2 full-canvas geometry', () => {
    it('uses the LINE-supported 8-sticker count', () => {
        expect(STICKER_COUNT).toBe(8);
    });

    it('cuts the complete 720p canvas into eight exact 320x360 cells', () => {
        expect(getGridCellRect(1280, 720, 0)).toEqual({ x: 0, y: 0, width: 320, height: 360 });
        expect(getGridCellRect(1280, 720, 7)).toEqual({ x: 960, y: 360, width: 320, height: 360 });
    });

    it('uses movable guide ratios for non-uniform Grok video cells', () => {
        const calibration = {
            columnGuides: [0.23, 0.49, 0.76] as [number, number, number],
            rowGuide: 0.53,
        };
        expect(getGridCellRect(1000, 500, 0, calibration)).toEqual({ x: 0, y: 0, width: 230, height: 265 });
        expect(getGridCellRect(1000, 500, 7, calibration)).toEqual({ x: 760, y: 265, width: 240, height: 235 });
    });

    it('keeps dragged guides ordered with enough room for every cell', () => {
        expect(setGridGuide(DEFAULT_GRID_CALIBRATION, 'column', 0, 0.49).columnGuides[0]).toBe(0.42);
        expect(setGridGuide(DEFAULT_GRID_CALIBRATION, 'column', 2, 0.51).columnGuides[2]).toBe(0.58);
        expect(setGridGuide(DEFAULT_GRID_CALIBRATION, 'row', 0, 0.99).rowGuide).toBe(0.92);
    });

    it('samples frames evenly while excluding the duplicate end point', () => {
        expect(getSampleTimes(1, 3, 4)).toEqual([1, 1.5, 2, 2.5]);
    });

    it('creates a positionable square crop for the 240x240 main image', () => {
        const cropper = (frameProcessing as typeof frameProcessing & {
            getSquareCropRect?: (width: number, height: number, position: number) => {
                x: number;
                y: number;
                width: number;
                height: number;
            };
        }).getSquareCropRect;

        expect(cropper).toBeTypeOf('function');
        expect(cropper?.(320, 270, 0)).toEqual({ x: 0, y: 0, width: 270, height: 270 });
        expect(cropper?.(320, 270, 0.5)).toEqual({ x: 25, y: 0, width: 270, height: 270 });
        expect(cropper?.(320, 270, 1)).toEqual({ x: 50, y: 0, width: 270, height: 270 });
    });

    it('crops and resizes RGBA pixels using the selected main-image position', () => {
        const resize = (frameProcessing as typeof frameProcessing & {
            resizeSquareRgbaFrame?: (
                frame: Uint8ClampedArray,
                width: number,
                height: number,
                targetSize: number,
                position: number,
            ) => Uint8ClampedArray;
        }).resizeSquareRgbaFrame;
        const frame = new Uint8ClampedArray(4 * 2 * 4);
        for (let y = 0; y < 2; y += 1) {
            for (let x = 0; x < 4; x += 1) {
                const offset = (y * 4 + x) * 4;
                frame[offset] = x * 10;
                frame[offset + 3] = 255;
            }
        }

        expect(resize).toBeTypeOf('function');
        const output = resize?.(frame, 4, 2, 2, 1);
        expect(Array.from(output ?? [])).toEqual([
            20, 0, 0, 255, 30, 0, 0, 255,
            20, 0, 0, 255, 30, 0, 0, 255,
        ]);
    });

    it('creates a vertically positionable 96x74 cover crop for the tab image', () => {
        const cropper = (frameProcessing as typeof frameProcessing & {
            getAspectCropRect?: (
                width: number,
                height: number,
                targetWidth: number,
                targetHeight: number,
                position: number,
            ) => { x: number; y: number; width: number; height: number };
        }).getAspectCropRect;

        expect(cropper).toBeTypeOf('function');
        const top = cropper?.(320, 270, 96, 74, 0);
        const center = cropper?.(320, 270, 96, 74, 0.5);
        const bottom = cropper?.(320, 270, 96, 74, 1);
        expect(top).toEqual({ x: 0, y: 0, width: 320, height: 320 * 74 / 96 });
        expect(center?.y).toBeCloseTo((270 - 320 * 74 / 96) / 2);
        expect(bottom?.y).toBeCloseTo(270 - 320 * 74 / 96);
    });

    it('resizes a selected rectangular crop to the exact tab dimensions', () => {
        const resize = (frameProcessing as typeof frameProcessing & {
            resizeRgbaFrameToAspect?: (
                frame: Uint8ClampedArray,
                width: number,
                height: number,
                targetWidth: number,
                targetHeight: number,
                position: number,
            ) => Uint8ClampedArray;
        }).resizeRgbaFrameToAspect;
        const frame = new Uint8ClampedArray(2 * 4 * 4);
        for (let y = 0; y < 4; y += 1) {
            for (let x = 0; x < 2; x += 1) {
                const offset = (y * 2 + x) * 4;
                frame[offset] = y * 10 + x;
                frame[offset + 3] = 255;
            }
        }

        expect(resize).toBeTypeOf('function');
        expect(Array.from(resize?.(frame, 2, 4, 2, 1, 1) ?? [])).toEqual([
            30, 0, 0, 255, 31, 0, 0, 255,
        ]);
    });

    it('adds transparent breathing room when the tab image is scaled down', () => {
        const resize = (frameProcessing as typeof frameProcessing & {
            resizeRgbaFrameWithZoom?: (
                frame: Uint8ClampedArray,
                width: number,
                height: number,
                targetWidth: number,
                targetHeight: number,
                position: number,
                zoom: number,
            ) => Uint8ClampedArray;
        }).resizeRgbaFrameWithZoom;
        const frame = new Uint8ClampedArray(2 * 2 * 4);
        for (let offset = 0; offset < frame.length; offset += 4) {
            frame[offset] = 120;
            frame[offset + 3] = 255;
        }

        expect(resize).toBeTypeOf('function');
        const output = resize?.(frame, 2, 2, 4, 4, 0.5, 0.5);
        expect(output?.length).toBe(4 * 4 * 4);
        expect(output?.[3]).toBe(0);
        expect(output?.[(1 * 4 + 1) * 4 + 3]).toBe(255);
        expect(output?.[(2 * 4 + 2) * 4 + 3]).toBe(255);
        expect(output?.[(3 * 4 + 3) * 4 + 3]).toBe(0);
    });

    it('preserves the coverage of fine details during a large downscale', () => {
        const resize = (frameProcessing as typeof frameProcessing & {
            resizeRgbaFrameWithZoom?: (
                frame: Uint8ClampedArray,
                width: number,
                height: number,
                targetWidth: number,
                targetHeight: number,
                position: number,
                zoom: number,
            ) => Uint8ClampedArray;
        }).resizeRgbaFrameWithZoom;
        const frame = new Uint8ClampedArray(4 * 4 * 4);
        frame[0] = 255;
        frame[1] = 255;
        frame[2] = 255;
        frame[3] = 255;

        const output = resize?.(frame, 4, 4, 1, 1, 0.5, 1);

        expect(output?.[0]).toBe(255);
        expect(output?.[1]).toBe(255);
        expect(output?.[2]).toBe(255);
        expect(output?.[3]).toBeGreaterThanOrEqual(15);
        expect(output?.[3]).toBeLessThanOrEqual(17);
    });
});

describe('animated sticker background removal', () => {
    it('parses a six-digit key color', () => {
        expect(parseHexColor('#11aaFF')).toEqual({ r: 17, g: 170, b: 255 });
    });

    it('makes matching background pixels transparent while preserving the subject', () => {
        const rgba = new Uint8ClampedArray([
            255, 255, 255, 255,
            20, 30, 40, 255,
        ]);
        const keyed = applyChromaKey(rgba, { r: 255, g: 255, b: 255 }, 20);
        expect(keyed[3]).toBe(0);
        expect(keyed[7]).toBe(255);
    });
});

describe('animated sticker stabilization', () => {
    it('finds the visible silhouette bounds from alpha', () => {
        const frame = createFrame(6, 6, 4, 3);
        expect(getOpaqueBounds(frame, 6, 6)).toEqual({ left: 4, top: 3, right: 4, bottom: 3 });
    });

    it('uses one union silhouette for all frames so animation scale stays stable', () => {
        const frames = [createFrame(6, 6, 1, 2), createFrame(6, 6, 4, 5)];
        expect(getCombinedOpaqueBounds(frames, 6, 6)).toEqual({
            left: 1,
            top: 2,
            right: 4,
            bottom: 5,
        });
    });

    it('calculates bounded corrections toward the median anchor', () => {
        const frames = [createFrame(8, 8, 2, 2), createFrame(8, 8, 6, 6)];
        expect(calculateStabilizationOffsets(frames, 8, 8, 1, 18)).toEqual([
            { x: 2, y: 2 },
            { x: -2, y: -2 },
        ]);
    });

    it('moves RGBA pixels without wrapping at canvas edges', () => {
        const frame = createFrame(4, 4, 1, 1);
        const shifted = shiftRgbaFrame(frame, 4, 4, { x: 1, y: 2 });
        expect(shifted[(3 * 4 + 2) * 4 + 3]).toBe(255);
        expect(shifted[(1 * 4 + 1) * 4 + 3]).toBe(0);
    });
});

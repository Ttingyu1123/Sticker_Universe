import { describe, expect, it } from 'vitest';
import * as precisionCrop from '../../../src/pages/ImageEditor/utils/precisionCrop';

describe('precision image crop geometry', () => {
    it('creates a centered fixed-size crop in source pixels', () => {
        const createCrop = (precisionCrop as typeof precisionCrop & {
            createCenteredPixelCrop?: (
                imageWidth: number,
                imageHeight: number,
                cropWidth: number,
                cropHeight: number,
            ) => { x: number; y: number; width: number; height: number };
        }).createCenteredPixelCrop;

        expect(createCrop).toBeTypeOf('function');
        expect(createCrop?.(400, 300, 100, 100)).toEqual({
            x: 150,
            y: 100,
            width: 100,
            height: 100,
        });
    });

    it('keeps a moved crop fully inside the source image', () => {
        const moveCrop = (precisionCrop as typeof precisionCrop & {
            movePixelCrop?: (
                crop: { x: number; y: number; width: number; height: number },
                x: number,
                y: number,
                imageWidth: number,
                imageHeight: number,
            ) => { x: number; y: number; width: number; height: number };
        }).movePixelCrop;
        const crop = { x: 0, y: 0, width: 100, height: 80 };

        expect(moveCrop).toBeTypeOf('function');
        expect(moveCrop?.(crop, 999, -20, 320, 270)).toEqual({
            x: 220,
            y: 0,
            width: 100,
            height: 80,
        });
    });

    it('extracts the selected pixels without resizing them', () => {
        const extractCrop = (precisionCrop as typeof precisionCrop & {
            extractRgbaCrop?: (
                frame: Uint8ClampedArray,
                imageWidth: number,
                imageHeight: number,
                crop: { x: number; y: number; width: number; height: number },
            ) => Uint8ClampedArray;
        }).extractRgbaCrop;
        const frame = new Uint8ClampedArray(4 * 3 * 4);
        for (let index = 0; index < 12; index += 1) {
            frame[index * 4] = index;
            frame[index * 4 + 3] = 255;
        }

        expect(extractCrop).toBeTypeOf('function');
        expect(Array.from(extractCrop?.(frame, 4, 3, {
            x: 1,
            y: 1,
            width: 2,
            height: 2,
        }) ?? [])).toEqual([
            5, 0, 0, 255, 6, 0, 0, 255,
            9, 0, 0, 255, 10, 0, 0, 255,
        ]);
    });

    it('uses a smaller source region when the image is enlarged', () => {
        const getSourceCrop = (precisionCrop as typeof precisionCrop & {
            getScaledSourceCrop?: (
                crop: { x: number; y: number; width: number; height: number },
                imageScale: number,
                imageWidth: number,
                imageHeight: number,
            ) => { x: number; y: number; width: number; height: number };
        }).getScaledSourceCrop;

        expect(getSourceCrop).toBeTypeOf('function');
        expect(getSourceCrop?.(
            { x: 175, y: 125, width: 100, height: 100 },
            2,
            400,
            300,
        )).toEqual({ x: 175, y: 125, width: 50, height: 50 });
    });

    it('preserves the crop center when the image scale changes', () => {
        const changeScale = (precisionCrop as typeof precisionCrop & {
            changePixelCropScale?: (
                crop: { x: number; y: number; width: number; height: number },
                previousScale: number,
                nextScale: number,
                imageWidth: number,
                imageHeight: number,
            ) => { x: number; y: number; width: number; height: number };
        }).changePixelCropScale;

        expect(changeScale).toBeTypeOf('function');
        expect(changeScale?.(
            { x: 150, y: 100, width: 100, height: 100 },
            1,
            2,
            400,
            300,
        )).toEqual({ x: 175, y: 125, width: 100, height: 100 });
    });

    it('prevents zooming out farther than the source image can cover', () => {
        const getMinimumScale = (precisionCrop as typeof precisionCrop & {
            getMinimumImageScale?: (
                cropWidth: number,
                cropHeight: number,
                imageWidth: number,
                imageHeight: number,
            ) => number;
        }).getMinimumImageScale;

        expect(getMinimumScale).toBeTypeOf('function');
        expect(getMinimumScale?.(100, 100, 400, 300)).toBeCloseTo(1 / 3);
    });

    it('clamps a scaled crop using the visible source region', () => {
        const moveScaledCrop = (precisionCrop as typeof precisionCrop & {
            movePixelCropAtScale?: (
                crop: { x: number; y: number; width: number; height: number },
                x: number,
                y: number,
                imageWidth: number,
                imageHeight: number,
                imageScale: number,
            ) => { x: number; y: number; width: number; height: number };
        }).movePixelCropAtScale;

        expect(moveScaledCrop).toBeTypeOf('function');
        expect(moveScaledCrop?.(
            { x: 0, y: 0, width: 100, height: 80 },
            999,
            999,
            320,
            270,
            2,
        )).toEqual({ x: 270, y: 230, width: 100, height: 80 });
    });

    it('resizes the fixed output while preserving its source center at the current scale', () => {
        const resizeScaledCrop = (precisionCrop as typeof precisionCrop & {
            resizePixelCropAtScale?: (
                crop: { x: number; y: number; width: number; height: number },
                width: number,
                height: number,
                imageWidth: number,
                imageHeight: number,
                imageScale: number,
            ) => { x: number; y: number; width: number; height: number };
        }).resizePixelCropAtScale;

        expect(resizeScaledCrop).toBeTypeOf('function');
        expect(resizeScaledCrop?.(
            { x: 175, y: 125, width: 100, height: 100 },
            120,
            80,
            400,
            300,
            2,
        )).toEqual({ x: 170, y: 130, width: 120, height: 80 });
    });

    it('maps the source image behind a fixed crop viewport', () => {
        const getPreviewTransform = (precisionCrop as typeof precisionCrop & {
            getFixedCropPreviewTransform?: (
                imageWidth: number,
                imageHeight: number,
                sourceCrop: { x: number; y: number; width: number; height: number },
            ) => {
                widthPercent: number;
                heightPercent: number;
                leftPercent: number;
                topPercent: number;
            };
        }).getFixedCropPreviewTransform;

        expect(getPreviewTransform).toBeTypeOf('function');
        expect(getPreviewTransform?.(400, 300, {
            x: 175,
            y: 125,
            width: 50,
            height: 50,
        })).toEqual({
            widthPercent: 800,
            heightPercent: 600,
            leftPercent: -350,
            topPercent: -250,
        });
    });
});

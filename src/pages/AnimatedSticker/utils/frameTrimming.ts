import type { AnimatedStickerResult } from '../types';
import { encodeAnimatedPng } from './apng';

export const MIN_ANIMATED_STICKER_FRAMES = 5;

const hasFrameTransparency = (frames: Uint8ClampedArray[]): boolean => frames.some((frame) => {
    for (let alphaIndex = 3; alphaIndex < frame.length; alphaIndex += 4) {
        if (frame[alphaIndex] < 255) return true;
    }
    return false;
});

const framesHaveMotion = (frames: Uint8ClampedArray[]): boolean => {
    const firstFrame = frames[0];
    return frames.slice(1).some((frame) => {
        for (let pixelIndex = 0; pixelIndex < frame.length; pixelIndex += 1) {
            if (frame[pixelIndex] !== firstFrame[pixelIndex]) return true;
        }
        return false;
    });
};

export const trimAnimatedStickerFrames = (
    result: AnimatedStickerResult,
    startIndex: number,
    endIndex: number,
): AnimatedStickerResult => {
    if (
        !Number.isInteger(startIndex)
        || !Number.isInteger(endIndex)
        || startIndex < 0
        || endIndex > result.sourceFrames.length
        || startIndex >= endIndex
    ) {
        throw new Error('Select a valid frame range.');
    }

    const sourceFrames = result.sourceFrames.slice(startIndex, endIndex);
    if (sourceFrames.length < MIN_ANIMATED_STICKER_FRAMES) {
        throw new Error(`Keep at least ${MIN_ANIMATED_STICKER_FRAMES} frames.`);
    }

    const encoded = encodeAnimatedPng(
        sourceFrames,
        result.width,
        result.height,
        result.durationMs,
        result.colorCount,
    );
    const blob = new Blob([encoded.buffer], { type: 'image/png' });

    return {
        ...result,
        blob,
        url: URL.createObjectURL(blob),
        sizeBytes: blob.size,
        frameCount: sourceFrames.length,
        sourceFrames,
        loopCount: encoded.loopCount,
        hasTransparency: hasFrameTransparency(sourceFrames),
        hasMotion: framesHaveMotion(sourceFrames),
        originalSizeBytes: result.originalSizeBytes ?? result.sizeBytes,
    };
};

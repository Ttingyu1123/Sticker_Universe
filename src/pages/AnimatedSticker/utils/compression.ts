import type { AnimatedStickerResult } from '../types';
import {
    MAX_LINE_FILE_SIZE,
    OUTPUT_HEIGHT,
    OUTPUT_WIDTH,
} from './frameProcessing';
import { encodeAnimatedPng } from './apng';

export interface CompressionProfile {
    colorCount: number;
    frameCount: number;
}

export const LINE_SAFE_FILE_SIZE = 950 * 1024;

const uniqueProfiles = (profiles: CompressionProfile[]): CompressionProfile[] => {
    const seen = new Set<string>();
    return profiles.filter((profile) => {
        const key = `${profile.colorCount}-${profile.frameCount}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });
};

export const buildCompressionProfiles = (sourceFrameCount: number): CompressionProfile[] => {
    const frameCount = Math.max(1, Math.round(sourceFrameCount));
    const reducedFrameCount = Math.max(5, Math.round(frameCount * 0.75));
    const halfFrameCount = Math.max(5, Math.round(frameCount * 0.5));
    const minimumFrameCount = Math.min(frameCount, 5);

    return uniqueProfiles([
        { colorCount: 256, frameCount },
        { colorCount: 128, frameCount },
        { colorCount: 64, frameCount },
        { colorCount: 128, frameCount: Math.min(frameCount, reducedFrameCount) },
        { colorCount: 64, frameCount: Math.min(frameCount, reducedFrameCount) },
        { colorCount: 32, frameCount: Math.min(frameCount, reducedFrameCount) },
        { colorCount: 32, frameCount: Math.min(frameCount, halfFrameCount) },
        { colorCount: 16, frameCount: minimumFrameCount },
    ]);
};

export const selectEvenlySpacedFrames = <Frame,>(
    frames: Frame[],
    requestedCount: number,
): Frame[] => {
    const count = Math.min(frames.length, Math.max(1, Math.round(requestedCount)));
    if (count >= frames.length) return [...frames];
    return Array.from({ length: count }, (_, index) => (
        frames[Math.floor((index * frames.length) / count)]
    ));
};

const encodeFrames = (
    frames: Uint8ClampedArray[],
    durationMs: number,
    colorCount: number,
): Blob => {
    const encoded = encodeAnimatedPng(frames, OUTPUT_WIDTH, OUTPUT_HEIGHT, durationMs, colorCount);
    return new Blob([encoded.buffer], { type: 'image/png' });
};

export const compressAnimatedSticker = (
    result: AnimatedStickerResult,
    targetSize = LINE_SAFE_FILE_SIZE,
): AnimatedStickerResult => {
    if (result.sizeBytes < MAX_LINE_FILE_SIZE) return result;

    let smallest: AnimatedStickerResult | null = null;
    for (const profile of buildCompressionProfiles(result.sourceFrames.length)) {
        const selectedFrames = selectEvenlySpacedFrames(result.sourceFrames, profile.frameCount);
        const blob = encodeFrames(selectedFrames, result.durationMs, profile.colorCount);
        const candidate: AnimatedStickerResult = {
            ...result,
            blob,
            url: URL.createObjectURL(blob),
            sizeBytes: blob.size,
            frameCount: selectedFrames.length,
            colorCount: profile.colorCount,
            originalSizeBytes: result.originalSizeBytes ?? result.sizeBytes,
        };

        if (candidate.sizeBytes <= targetSize) {
            if (smallest) URL.revokeObjectURL(smallest.url);
            return candidate;
        }

        if (!smallest || candidate.sizeBytes < smallest.sizeBytes) {
            if (smallest) URL.revokeObjectURL(smallest.url);
            smallest = candidate;
        } else {
            URL.revokeObjectURL(candidate.url);
        }
    }

    if (!smallest) return result;
    return smallest;
};

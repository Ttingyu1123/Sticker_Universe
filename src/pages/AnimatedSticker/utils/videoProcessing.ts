import type {
    AnimatedStickerResult,
    ProcessingProgress,
    ProcessingSettings,
} from '../types';
import {
    applyChromaKey,
    calculateStabilizationOffsets,
    getCombinedOpaqueBounds,
    getContainRect,
    getGridCellRect,
    getSampleTimes,
    OUTPUT_HEIGHT,
    OUTPUT_WIDTH,
    parseHexColor,
    shiftRgbaFrame,
    STICKER_COUNT,
} from './frameProcessing';
import { encodeAnimatedPng } from './apng';

interface ProcessVideoOptions {
    video: HTMLVideoElement;
    settings: ProcessingSettings;
    onProgress?: (progress: ProcessingProgress) => void;
}

const waitForVideoFrame = (): Promise<void> => new Promise((resolve) => {
    window.requestAnimationFrame(() => resolve());
});

const seekVideo = async (video: HTMLVideoElement, time: number): Promise<void> => {
    const safeTime = Math.min(Math.max(0, time), Math.max(0, video.duration - 0.001));
    if (Math.abs(video.currentTime - safeTime) < 0.002 && video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
        await waitForVideoFrame();
        return;
    }

    await new Promise<void>((resolve, reject) => {
        const cleanup = () => {
            video.removeEventListener('seeked', handleSeeked);
            video.removeEventListener('error', handleError);
        };
        const handleSeeked = () => {
            cleanup();
            resolve();
        };
        const handleError = () => {
            cleanup();
            reject(new Error('Unable to read the selected point in the video.'));
        };
        video.addEventListener('seeked', handleSeeked, { once: true });
        video.addEventListener('error', handleError, { once: true });
        video.currentTime = safeTime;
    });

    await waitForVideoFrame();
};

const encodeApng = (
    frames: Uint8ClampedArray[],
    durationMs: number,
): { blob: Blob; loopCount: number } => {
    const encoded = encodeAnimatedPng(frames, OUTPUT_WIDTH, OUTPUT_HEIGHT, durationMs, 0);
    return { blob: new Blob([encoded.buffer], { type: 'image/png' }), loopCount: encoded.loopCount };
};

export const processVideoBoard = async ({
    video,
    settings,
    onProgress,
}: ProcessVideoOptions): Promise<AnimatedStickerResult[]> => {
    if (!Number.isFinite(video.duration) || video.videoWidth === 0 || video.videoHeight === 0) {
        throw new Error('Video metadata is not ready.');
    }

    const sampleTimes = getSampleTimes(settings.startTime, settings.endTime, settings.frameCount);
    const sourceFramesBySticker: Uint8ClampedArray[][] = Array.from(
        { length: STICKER_COUNT },
        () => [],
    );
    const sourceLayers = Array.from({ length: STICKER_COUNT }, (_, stickerIndex) => {
        const rect = getGridCellRect(
            video.videoWidth,
            video.videoHeight,
            stickerIndex,
            settings.gridCalibration,
        );
        const width = Math.max(1, Math.round(rect.width));
        const height = Math.max(1, Math.round(rect.height));
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const context = canvas.getContext('2d', { willReadFrequently: true });
        if (!context) throw new Error('Canvas is unavailable in this browser.');
        return { rect, width, height, canvas, context };
    });
    const outputCanvas = document.createElement('canvas');
    outputCanvas.width = OUTPUT_WIDTH;
    outputCanvas.height = OUTPUT_HEIGHT;
    const outputContext = outputCanvas.getContext('2d', { willReadFrequently: true });
    if (!outputContext) throw new Error('Canvas is unavailable in this browser.');

    const background = parseHexColor(settings.backgroundColor);

    for (let frameIndex = 0; frameIndex < sampleTimes.length; frameIndex += 1) {
        await seekVideo(video, sampleTimes[frameIndex]);

        for (let stickerIndex = 0; stickerIndex < STICKER_COUNT; stickerIndex += 1) {
            const source = sourceLayers[stickerIndex];
            source.context.clearRect(0, 0, source.width, source.height);
            source.context.drawImage(
                video,
                source.rect.x,
                source.rect.y,
                source.rect.width,
                source.rect.height,
                0,
                0,
                source.width,
                source.height,
            );
            const imageData = source.context.getImageData(0, 0, source.width, source.height);
            const rgba = settings.removeBackground
                ? applyChromaKey(imageData.data, background, settings.colorTolerance)
                : new Uint8ClampedArray(imageData.data);
            sourceFramesBySticker[stickerIndex].push(rgba);
        }

        onProgress?.({ phase: 'extracting', completed: frameIndex + 1, total: sampleTimes.length });
    }

    const framesBySticker: Uint8ClampedArray[][] = sourceFramesBySticker.map((sourceFrames, stickerIndex) => {
        const source = sourceLayers[stickerIndex];
        const bounds = getCombinedOpaqueBounds(sourceFrames, source.width, source.height);
        if (!bounds) {
            return sourceFrames.map(() => new Uint8ClampedArray(OUTPUT_WIDTH * OUTPUT_HEIGHT * 4));
        }

        const cropWidth = bounds.right - bounds.left + 1;
        const cropHeight = bounds.bottom - bounds.top + 1;
        const target = getContainRect(cropWidth, cropHeight, OUTPUT_WIDTH, OUTPUT_HEIGHT);

        return sourceFrames.map((frame) => {
            const sourceImage = source.context.createImageData(source.width, source.height);
            sourceImage.data.set(frame);
            source.context.putImageData(sourceImage, 0, 0);
            outputContext.clearRect(0, 0, OUTPUT_WIDTH, OUTPUT_HEIGHT);
            outputContext.drawImage(
                source.canvas,
                bounds.left,
                bounds.top,
                cropWidth,
                cropHeight,
                target.x,
                target.y,
                target.width,
                target.height,
            );
            return new Uint8ClampedArray(
                outputContext.getImageData(0, 0, OUTPUT_WIDTH, OUTPUT_HEIGHT).data,
            );
        });
    });

    if (settings.stabilize && settings.removeBackground) {
        for (let stickerIndex = 0; stickerIndex < STICKER_COUNT; stickerIndex += 1) {
            const stickerFrames = framesBySticker[stickerIndex];
            const offsets = calculateStabilizationOffsets(stickerFrames, OUTPUT_WIDTH, OUTPUT_HEIGHT);
            framesBySticker[stickerIndex] = stickerFrames.map((frame, index) => (
                shiftRgbaFrame(frame, OUTPUT_WIDTH, OUTPUT_HEIGHT, offsets[index])
            ));
            onProgress?.({ phase: 'stabilizing', completed: stickerIndex + 1, total: STICKER_COUNT });
        }
    }

    const durationMs = settings.outputDuration * 1000;
    const results: AnimatedStickerResult[] = [];

    for (let stickerIndex = 0; stickerIndex < STICKER_COUNT; stickerIndex += 1) {
        const { blob, loopCount } = encodeApng(framesBySticker[stickerIndex], durationMs);
        const hasTransparency = framesBySticker[stickerIndex].some((frame) => {
            for (let alphaIndex = 3; alphaIndex < frame.length; alphaIndex += 4) {
                if (frame[alphaIndex] < 255) return true;
            }
            return false;
        });
        const firstFrame = framesBySticker[stickerIndex][0];
        const hasMotion = framesBySticker[stickerIndex].slice(1).some((frame) => {
            for (let pixelIndex = 0; pixelIndex < frame.length; pixelIndex += 1) {
                if (frame[pixelIndex] !== firstFrame[pixelIndex]) return true;
            }
            return false;
        });
        results.push({
            index: stickerIndex,
            blob,
            url: URL.createObjectURL(blob),
            sizeBytes: blob.size,
            frameCount: settings.frameCount,
            sourceFrames: framesBySticker[stickerIndex],
            durationMs,
            colorCount: 0,
            width: OUTPUT_WIDTH,
            height: OUTPUT_HEIGHT,
            loopCount,
            hasTransparency,
            hasMotion,
            isRgb: true,
        });
        onProgress?.({ phase: 'encoding', completed: stickerIndex + 1, total: STICKER_COUNT });
    }

    return results;
};

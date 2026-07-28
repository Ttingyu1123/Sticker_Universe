import type { AnimatedStickerResult } from '../types';
import { MAX_LINE_FILE_SIZE } from './frameProcessing';

export type LineComplianceFailure =
    | 'dimensions'
    | 'fileSize'
    | 'frameCount'
    | 'duration'
    | 'loopCount'
    | 'motion'
    | 'transparency'
    | 'colorSpace';

export interface LineAnimatedStickerMetadata {
    width: number;
    height: number;
    sizeBytes: number;
    frameCount: number;
    durationMs: number;
    loopCount: number;
    hasTransparency: boolean;
    hasMotion: boolean;
    isRgb: boolean;
}

export interface LineComplianceResult {
    isCompliant: boolean;
    failures: LineComplianceFailure[];
}

export const validateLineAnimatedSticker = (
    sticker: LineAnimatedStickerMetadata | AnimatedStickerResult,
): LineComplianceResult => {
    const failures: LineComplianceFailure[] = [];
    const durationSeconds = sticker.durationMs / 1000;
    const dimensionsValid = sticker.width > 0
        && sticker.height > 0
        && sticker.width <= 320
        && sticker.height <= 270
        && (sticker.width >= 270 || sticker.height >= 270);

    if (!dimensionsValid) failures.push('dimensions');
    if (sticker.sizeBytes > MAX_LINE_FILE_SIZE) failures.push('fileSize');
    if (sticker.frameCount < 5 || sticker.frameCount > 20) failures.push('frameCount');
    if (![1, 2, 3, 4].includes(durationSeconds)) failures.push('duration');
    if (sticker.loopCount < 1 || sticker.loopCount > 4 || durationSeconds * sticker.loopCount > 4) {
        failures.push('loopCount');
    }
    if (!sticker.hasMotion) failures.push('motion');
    if (!sticker.hasTransparency) failures.push('transparency');
    if (!sticker.isRgb) failures.push('colorSpace');

    return { isCompliant: failures.length === 0, failures };
};

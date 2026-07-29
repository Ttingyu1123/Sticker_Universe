import type { GridCalibration } from '../types';

export const GRID_COLUMNS = 4;
export const GRID_ROWS = 2;
export const STICKER_COUNT = GRID_COLUMNS * GRID_ROWS;
export const OUTPUT_WIDTH = 320;
export const OUTPUT_HEIGHT = 270;
export const MAX_LINE_FILE_SIZE = 1024 * 1024;
export const DEFAULT_GRID_CALIBRATION: GridCalibration = {
    columnGuides: [0.25, 0.5, 0.75],
    rowGuide: 0.5,
};
const MIN_CELL_RATIO = 0.08;

export interface GridCellRect {
    x: number;
    y: number;
    width: number;
    height: number;
}

export interface RgbColor {
    r: number;
    g: number;
    b: number;
}

export interface OpaqueBounds {
    left: number;
    top: number;
    right: number;
    bottom: number;
}

export interface FrameOffset {
    x: number;
    y: number;
}

export const detectSolidBackgroundColor = (
    rgba: Uint8ClampedArray,
    width: number,
    height: number,
): string | null => {
    if (width < 1 || height < 1 || rgba.length < width * height * 4) return null;

    const borderDepth = Math.max(1, Math.ceil(Math.min(width, height) * 0.08));
    const buckets = new Map<string, { count: number; r: number; g: number; b: number }>();

    for (let y = 0; y < height; y += 1) {
        for (let x = 0; x < width; x += 1) {
            if (x >= borderDepth && x < width - borderDepth
                && y >= borderDepth && y < height - borderDepth) continue;
            const offset = (y * width + x) * 4;
            if (rgba[offset + 3] === 0) continue;
            const r = rgba[offset];
            const g = rgba[offset + 1];
            const b = rgba[offset + 2];
            const key = `${r >> 4},${g >> 4},${b >> 4}`;
            const bucket = buckets.get(key) ?? { count: 0, r: 0, g: 0, b: 0 };
            bucket.count += 1;
            bucket.r += r;
            bucket.g += g;
            bucket.b += b;
            buckets.set(key, bucket);
        }
    }

    const dominant = [...buckets.values()].sort((a, b) => b.count - a.count)[0];
    if (!dominant) return null;
    const toHex = (channel: number) => Math.round(channel / dominant.count)
        .toString(16)
        .padStart(2, '0');
    return `#${toHex(dominant.r)}${toHex(dominant.g)}${toHex(dominant.b)}`;
};

export const detectVideoBackgroundColor = (video: HTMLVideoElement): string | null => {
    if (video.videoWidth < 1 || video.videoHeight < 1) return null;

    const sampleWidth = Math.min(320, video.videoWidth);
    const sampleHeight = Math.max(1, Math.round(video.videoHeight * sampleWidth / video.videoWidth));
    const canvas = document.createElement('canvas');
    canvas.width = sampleWidth;
    canvas.height = sampleHeight;
    const context = canvas.getContext('2d', { willReadFrequently: true });
    if (!context) return null;

    try {
        context.drawImage(video, 0, 0, sampleWidth, sampleHeight);
        const frame = context.getImageData(0, 0, sampleWidth, sampleHeight);
        return detectSolidBackgroundColor(frame.data, sampleWidth, sampleHeight);
    } catch {
        return null;
    }
};

export const getGridCellRect = (
    width: number,
    height: number,
    index: number,
    calibration: GridCalibration = DEFAULT_GRID_CALIBRATION,
): GridCellRect => {
    if (index < 0 || index >= STICKER_COUNT) {
        throw new RangeError(`Grid index must be between 0 and ${STICKER_COUNT - 1}`);
    }

    const column = index % GRID_COLUMNS;
    const row = Math.floor(index / GRID_COLUMNS);
    const columnBoundaries = [0, ...calibration.columnGuides, 1];
    const rowBoundaries = [0, calibration.rowGuide, 1];
    const left = columnBoundaries[column];
    const right = columnBoundaries[column + 1];
    const top = rowBoundaries[row];
    const bottom = rowBoundaries[row + 1];

    return {
        x: left * width,
        y: top * height,
        width: (right - left) * width,
        height: (bottom - top) * height,
    };
};

export const setGridGuide = (
    calibration: GridCalibration,
    axis: 'column' | 'row',
    index: number,
    ratio: number,
): GridCalibration => {
    if (axis === 'row') {
        return {
            columnGuides: [...calibration.columnGuides],
            rowGuide: Math.max(MIN_CELL_RATIO, Math.min(1 - MIN_CELL_RATIO, ratio)),
        };
    }

    if (index < 0 || index >= calibration.columnGuides.length) return calibration;
    const guides = [...calibration.columnGuides] as [number, number, number];
    const minimum = index === 0 ? MIN_CELL_RATIO : guides[index - 1] + MIN_CELL_RATIO;
    const maximum = index === guides.length - 1 ? 1 - MIN_CELL_RATIO : guides[index + 1] - MIN_CELL_RATIO;
    guides[index] = Math.max(minimum, Math.min(maximum, ratio));
    return { columnGuides: guides, rowGuide: calibration.rowGuide };
};

export const getSampleTimes = (startTime: number, endTime: number, frameCount: number): number[] => {
    if (frameCount < 1) return [];
    const safeStart = Math.max(0, startTime);
    const safeEnd = Math.max(safeStart, endTime);
    const span = safeEnd - safeStart;

    // The end point is deliberately excluded so a looping source does not duplicate its first frame.
    return Array.from({ length: frameCount }, (_, index) => safeStart + (span * index) / frameCount);
};

export const getContainRect = (
    sourceWidth: number,
    sourceHeight: number,
    targetWidth: number,
    targetHeight: number,
    padding = 8,
): GridCellRect => {
    const availableWidth = Math.max(1, targetWidth - padding * 2);
    const availableHeight = Math.max(1, targetHeight - padding * 2);
    const scale = Math.min(availableWidth / sourceWidth, availableHeight / sourceHeight);
    const width = sourceWidth * scale;
    const height = sourceHeight * scale;

    return {
        x: (targetWidth - width) / 2,
        y: (targetHeight - height) / 2,
        width,
        height,
    };
};

export const getAspectCropRect = (
    sourceWidth: number,
    sourceHeight: number,
    targetWidth: number,
    targetHeight: number,
    position = 0.5,
): GridCellRect => {
    const width = Math.max(1, sourceWidth);
    const height = Math.max(1, sourceHeight);
    const targetRatio = Math.max(1, targetWidth) / Math.max(1, targetHeight);
    const sourceRatio = width / height;
    const safePosition = Math.max(0, Math.min(1, position));

    if (sourceRatio > targetRatio) {
        const cropWidth = height * targetRatio;
        return {
            x: (width - cropWidth) * safePosition,
            y: 0,
            width: cropWidth,
            height,
        };
    }

    const cropHeight = width / targetRatio;

    return {
        x: 0,
        y: (height - cropHeight) * safePosition,
        width,
        height: cropHeight,
    };
};

export const getSquareCropRect = (
    sourceWidth: number,
    sourceHeight: number,
    position = 0.5,
): GridCellRect => getAspectCropRect(sourceWidth, sourceHeight, 1, 1, position);

export const resizeRgbaFrameWithZoom = (
    frame: Uint8ClampedArray,
    sourceWidth: number,
    sourceHeight: number,
    targetWidth: number,
    targetHeight: number,
    position = 0.5,
    zoom = 1,
): Uint8ClampedArray => {
    const width = Math.max(1, Math.round(sourceWidth));
    const height = Math.max(1, Math.round(sourceHeight));
    const outputWidth = Math.max(1, Math.round(targetWidth));
    const outputHeight = Math.max(1, Math.round(targetHeight));
    if (frame.length !== width * height * 4) {
        throw new RangeError('RGBA frame dimensions do not match its pixel data.');
    }

    const safePosition = Math.max(0, Math.min(1, position));
    const safeZoom = Math.max(0.05, zoom);
    const scale = Math.max(outputWidth / width, outputHeight / height) * safeZoom;
    const renderedWidth = width * scale;
    const renderedHeight = height * scale;
    const sourceRatio = width / height;
    const targetRatio = outputWidth / outputHeight;
    const offsetX = (outputWidth - renderedWidth)
        * (sourceRatio > targetRatio ? safePosition : 0.5);
    const offsetY = (outputHeight - renderedHeight)
        * (sourceRatio < targetRatio ? safePosition : 0.5);
    const output = new Uint8ClampedArray(outputWidth * outputHeight * 4);

    for (let targetY = 0; targetY < outputHeight; targetY += 1) {
        if (scale < 1) {
            const sourceTop = (targetY - offsetY) / scale;
            const sourceBottom = (targetY + 1 - offsetY) / scale;
            const firstSourceY = Math.floor(sourceTop);
            const lastSourceY = Math.ceil(sourceBottom) - 1;

            for (let targetX = 0; targetX < outputWidth; targetX += 1) {
                const sourceLeft = (targetX - offsetX) / scale;
                const sourceRight = (targetX + 1 - offsetX) / scale;
                const firstSourceX = Math.floor(sourceLeft);
                const lastSourceX = Math.ceil(sourceRight) - 1;
                const sampleArea = (sourceRight - sourceLeft) * (sourceBottom - sourceTop);
                const outputOffset = (targetY * outputWidth + targetX) * 4;
                let alpha = 0;
                const premultiplied = [0, 0, 0];

                for (let sourceY = firstSourceY; sourceY <= lastSourceY; sourceY += 1) {
                    if (sourceY < 0 || sourceY >= height) continue;
                    const overlapY = Math.max(0, Math.min(sourceBottom, sourceY + 1) - Math.max(sourceTop, sourceY));
                    for (let sourceX = firstSourceX; sourceX <= lastSourceX; sourceX += 1) {
                        if (sourceX < 0 || sourceX >= width) continue;
                        const overlapX = Math.max(0, Math.min(sourceRight, sourceX + 1) - Math.max(sourceLeft, sourceX));
                        const weight = (overlapX * overlapY) / sampleArea;
                        if (weight <= 0) continue;
                        const sourceOffset = (sourceY * width + sourceX) * 4;
                        const sourceAlpha = frame[sourceOffset + 3] / 255;
                        alpha += sourceAlpha * weight;
                        for (let channel = 0; channel < 3; channel += 1) {
                            premultiplied[channel] += frame[sourceOffset + channel] * sourceAlpha * weight;
                        }
                    }
                }

                for (let channel = 0; channel < 3; channel += 1) {
                    output[outputOffset + channel] = alpha > 0
                        ? Math.round(premultiplied[channel] / alpha)
                        : 0;
                }
                output[outputOffset + 3] = Math.round(alpha * 255);
            }
            continue;
        }

        const sourceY = (targetY + 0.5 - offsetY) / scale - 0.5;
        const y0 = Math.floor(sourceY);
        const y1 = y0 + 1;
        const yWeight = sourceY - y0;

        for (let targetX = 0; targetX < outputWidth; targetX += 1) {
            const sourceX = (targetX + 0.5 - offsetX) / scale - 0.5;
            const x0 = Math.floor(sourceX);
            const x1 = x0 + 1;
            const xWeight = sourceX - x0;
            const samples = [
                { x: x0, y: y0, weight: (1 - xWeight) * (1 - yWeight) },
                { x: x1, y: y0, weight: xWeight * (1 - yWeight) },
                { x: x0, y: y1, weight: (1 - xWeight) * yWeight },
                { x: x1, y: y1, weight: xWeight * yWeight },
            ].map((sample) => ({
                ...sample,
                offset: sample.x >= 0 && sample.x < width && sample.y >= 0 && sample.y < height
                    ? (sample.y * width + sample.x) * 4
                    : -1,
            }));
            const visibleSamples = samples.filter((sample) => sample.offset >= 0);
            const outputOffset = (targetY * outputWidth + targetX) * 4;
            const alpha = visibleSamples.reduce(
                (total, sample) => total + (frame[sample.offset + 3] / 255) * sample.weight,
                0,
            );

            for (let channel = 0; channel < 3; channel += 1) {
                const premultiplied = visibleSamples.reduce(
                    (total, sample) => total
                        + frame[sample.offset + channel]
                        * (frame[sample.offset + 3] / 255)
                        * sample.weight,
                    0,
                );
                output[outputOffset + channel] = alpha > 0 ? Math.round(premultiplied / alpha) : 0;
            }
            output[outputOffset + 3] = Math.round(alpha * 255);
        }
    }

    return output;
};

export const resizeRgbaFrameToAspect = (
    frame: Uint8ClampedArray,
    sourceWidth: number,
    sourceHeight: number,
    targetWidth: number,
    targetHeight: number,
    position = 0.5,
): Uint8ClampedArray => resizeRgbaFrameWithZoom(
    frame,
    sourceWidth,
    sourceHeight,
    targetWidth,
    targetHeight,
    position,
    1,
);

export const resizeSquareRgbaFrame = (
    frame: Uint8ClampedArray,
    sourceWidth: number,
    sourceHeight: number,
    targetSize: number,
    position = 0.5,
): Uint8ClampedArray => resizeRgbaFrameToAspect(
    frame,
    sourceWidth,
    sourceHeight,
    targetSize,
    targetSize,
    position,
);

export const parseHexColor = (value: string): RgbColor => {
    const normalized = value.trim().replace(/^#/, '');
    if (!/^[0-9a-fA-F]{6}$/.test(normalized)) return { r: 255, g: 255, b: 255 };
    return {
        r: Number.parseInt(normalized.slice(0, 2), 16),
        g: Number.parseInt(normalized.slice(2, 4), 16),
        b: Number.parseInt(normalized.slice(4, 6), 16),
    };
};

export const applyChromaKey = (
    rgba: Uint8ClampedArray,
    background: RgbColor,
    tolerance: number,
    softness = 24,
): Uint8ClampedArray => {
    const result = new Uint8ClampedArray(rgba);
    const softEdge = Math.max(1, softness);

    for (let offset = 0; offset < result.length; offset += 4) {
        const redDelta = result[offset] - background.r;
        const greenDelta = result[offset + 1] - background.g;
        const blueDelta = result[offset + 2] - background.b;
        const distance = Math.sqrt(redDelta ** 2 + greenDelta ** 2 + blueDelta ** 2);

        if (distance <= tolerance) {
            result[offset + 3] = 0;
        } else if (distance < tolerance + softEdge) {
            const edgeAlpha = Math.round(((distance - tolerance) / softEdge) * result[offset + 3]);
            result[offset + 3] = Math.min(result[offset + 3], edgeAlpha);
        }
    }

    return result;
};

export const getOpaqueBounds = (
    rgba: Uint8ClampedArray,
    width: number,
    height: number,
    alphaThreshold = 24,
): OpaqueBounds | null => {
    let left = width;
    let top = height;
    let right = -1;
    let bottom = -1;

    for (let y = 0; y < height; y += 1) {
        for (let x = 0; x < width; x += 1) {
            const alpha = rgba[(y * width + x) * 4 + 3];
            if (alpha <= alphaThreshold) continue;
            left = Math.min(left, x);
            right = Math.max(right, x);
            top = Math.min(top, y);
            bottom = Math.max(bottom, y);
        }
    }

    return right >= left && bottom >= top ? { left, top, right, bottom } : null;
};

export const getCombinedOpaqueBounds = (
    frames: Uint8ClampedArray[],
    width: number,
    height: number,
    alphaThreshold = 24,
): OpaqueBounds | null => frames.reduce<OpaqueBounds | null>((combined, frame) => {
    const bounds = getOpaqueBounds(frame, width, height, alphaThreshold);
    if (!bounds) return combined;
    if (!combined) return bounds;
    return {
        left: Math.min(combined.left, bounds.left),
        top: Math.min(combined.top, bounds.top),
        right: Math.max(combined.right, bounds.right),
        bottom: Math.max(combined.bottom, bounds.bottom),
    };
}, null);

const median = (values: number[]): number => {
    if (values.length === 0) return 0;
    const sorted = [...values].sort((a, b) => a - b);
    const middle = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0 ? (sorted[middle - 1] + sorted[middle]) / 2 : sorted[middle];
};

export const calculateStabilizationOffsets = (
    frames: Uint8ClampedArray[],
    width: number,
    height: number,
    strength = 0.72,
    maxCorrection = 18,
): FrameOffset[] => {
    const bounds = frames.map((frame) => getOpaqueBounds(frame, width, height));
    const validBounds = bounds.filter((bound): bound is OpaqueBounds => Boolean(bound));
    if (validBounds.length === 0) return frames.map(() => ({ x: 0, y: 0 }));

    const targetCenterX = median(validBounds.map((bound) => (bound.left + bound.right) / 2));
    const targetBottom = median(validBounds.map((bound) => bound.bottom));

    return bounds.map((bound) => {
        if (!bound) return { x: 0, y: 0 };
        const centerX = (bound.left + bound.right) / 2;
        const x = Math.max(-maxCorrection, Math.min(maxCorrection, (targetCenterX - centerX) * strength));
        const y = Math.max(-maxCorrection, Math.min(maxCorrection, (targetBottom - bound.bottom) * strength));
        return { x: Math.round(x), y: Math.round(y) };
    });
};

export const shiftRgbaFrame = (
    rgba: Uint8ClampedArray,
    width: number,
    height: number,
    offset: FrameOffset,
): Uint8ClampedArray => {
    if (offset.x === 0 && offset.y === 0) return new Uint8ClampedArray(rgba);
    const shifted = new Uint8ClampedArray(rgba.length);

    for (let sourceY = 0; sourceY < height; sourceY += 1) {
        const targetY = sourceY + offset.y;
        if (targetY < 0 || targetY >= height) continue;
        for (let sourceX = 0; sourceX < width; sourceX += 1) {
            const targetX = sourceX + offset.x;
            if (targetX < 0 || targetX >= width) continue;
            const sourceOffset = (sourceY * width + sourceX) * 4;
            const targetOffset = (targetY * width + targetX) * 4;
            shifted[targetOffset] = rgba[sourceOffset];
            shifted[targetOffset + 1] = rgba[sourceOffset + 1];
            shifted[targetOffset + 2] = rgba[sourceOffset + 2];
            shifted[targetOffset + 3] = rgba[sourceOffset + 3];
        }
    }

    return shifted;
};

export const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

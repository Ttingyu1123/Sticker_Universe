export interface VideoMetadata {
    duration: number;
    width: number;
    height: number;
    name: string;
}

export interface GridCalibration {
    columnGuides: [number, number, number];
    rowGuide: number;
}

export interface ProcessingSettings {
    frameCount: number;
    outputDuration: 1 | 2 | 3 | 4;
    startTime: number;
    endTime: number;
    removeBackground: boolean;
    backgroundColor: string;
    colorTolerance: number;
    stabilize: boolean;
    gridCalibration: GridCalibration;
}

export interface AnimatedStickerResult {
    index: number;
    blob: Blob;
    url: string;
    sizeBytes: number;
    frameCount: number;
    sourceFrames: Uint8ClampedArray[];
    durationMs: number;
    colorCount: number;
    width: number;
    height: number;
    loopCount: number;
    hasTransparency: boolean;
    hasMotion: boolean;
    isRgb: boolean;
    originalSizeBytes?: number;
}

export interface ProcessingProgress {
    phase: 'extracting' | 'stabilizing' | 'encoding';
    completed: number;
    total: number;
}

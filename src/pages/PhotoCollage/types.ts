export enum LayoutType {
    GRID = 'GRID',
    VERTICAL = 'VERTICAL',
    HORIZONTAL = 'HORIZONTAL',
    FEATURED = 'FEATURED', // One big, rest small
    MASONRY = 'MASONRY',   // Alternating row counts
    CENTER = 'CENTER',     // Hero in middle, cols on sides
    SCATTER = 'SCATTER',   // Random/Scattered polaroids

    // Phase 1: New creative layouts
    DIAGONAL_SPLIT = 'DIAGONAL_SPLIT',  // Diagonal line split (2 photos)
    L_LEFT = 'L_LEFT',                   // L-shape: big left, stack right
    L_RIGHT = 'L_RIGHT',                 // L-shape: big right, stack left
    T_SHAPE = 'T_SHAPE',                 // T-shape: top bar + bottom grid
    CROSS_FOCUS = 'CROSS_FOCUS',         // Cross: center big + 4 corners
}

export enum AspectRatio {
    SQUARE = '1:1',
    PORTRAIT = '3:4',
    LANDSCAPE = '4:3',
    STORY = '9:16',
    CINEMA = '16:9',
    A4 = 'A4',          // ISO 216
    PHOTO_2X3 = '2:3',  // 4x6 inches
    PHOTO_5X7 = '5:7',  // 5x7 inches
    CUSTOM = 'CUSTOM',
}

export interface CollageSettings {
    layout: LayoutType;
    ratio: AspectRatio;
    gap: number;
    backgroundColor: string;
    padding: number;
    cornerRadius: number;
    frameStyle: 'normal' | 'film' | 'polaroid'; // New: Frame decoration
    shadow: number; // New: 0 to 100 opacity/blur mix
    customRatioW: number;
    customRatioH: number;
    backgroundId?: string; // New: ID for smart backgrounds (gradients, patterns)
}

export interface UploadedImage {
    id: string;
    url: string;
    file: File;
    scale: number;
    rotation: number; // 0, 90, 180, 270...
    filter?: string;  // New: CSS filter string (e.g. 'grayscale(1)')
    filterIntensity?: number; // 0 to 100
    offsetX: number;
    offsetY: number;
}

// Represents a calculated frame for an image on the canvas
export interface ImageFrame {
    x: number;
    y: number;
    width: number;
    height: number;
    rotation?: number; // Base rotation from layout
    clipPath?: { x: number; y: number }[]; // Normalized 0-1 coordinates for custom clipping
}

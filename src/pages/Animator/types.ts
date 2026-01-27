
export type AnimationType = 'none' | 'shake' | 'pulse' | 'spin' | 'wobble' | 'bounce';

export type LayerType = 'image' | 'text';

export interface Layer {
    id: string;
    type: LayerType;
    content: string; // Blob URL or text string

    // Transform
    x: number;
    y: number;
    scale: number;
    rotation: number;

    // Style
    animation: AnimationType;
    width?: number; // for Image
    height?: number; // for Image

    // Text specific
    fontSize?: number;
    color?: string;
    fontFamily?: string;
    fontWeight?: string;
}

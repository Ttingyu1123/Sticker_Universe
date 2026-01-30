export interface CropRect {
    x: number;
    y: number;
    width: number;
    height: number;
}

export type GuideType = 'horizontal' | 'vertical';

export interface Guide {
    id: string;
    type: GuideType;
    pos: number; // Pixel position relative to original image
}

export type EditorTool = 'move' | 'erase' | 'restore' | 'magic-wand' | 'crop' | 'guide';

export interface EditorState {
    zoom: number;
    pan: { x: number, y: number };
    cropRect: CropRect | null; // null means full image
    guides: Guide[];
}

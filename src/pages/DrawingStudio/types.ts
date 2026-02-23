export type BrushType = 'pen' | 'pencil' | 'marker' | 'airbrush' | 'eraser';
export type BlendMode = GlobalCompositeOperation;
export type InteractionMode = 'draw' | 'transform' | 'select';

export interface VectorPoint {
    x: number;
    y: number;
    pressure: number;
}

export interface VectorStroke {
    brushType: Exclude<BrushType, 'eraser'>;
    brushColor: string;
    brushSize: number;
    brushOpacity: number;
    points: VectorPoint[];
}

export interface LayerMeta {
    id: string;
    name: string;
    visible: boolean;
    locked: boolean;
    opacity: number;
    blendMode: BlendMode;
    maskEnabled: boolean;
    fillColor?: string;
    fillX?: number;
    fillY?: number;
    fillWidth?: number;
    fillHeight?: number;
}

export interface Point {
    x: number;
    y: number;
    pressure: number;
}

export interface LayerImageObject {
    dataUrl: string;
    x: number;
    y: number;
    width: number;
    height: number;
    bgColor?: string;
    sourceWidth?: number;
    sourceHeight?: number;
}

export interface Snapshot {
    layers: Record<string, string>;
    layerImages: Record<string, LayerImageObject | null>;
    masks: Record<string, string>;
    imageMasks: Record<string, string | null>;
    fillMasks: Record<string, string | null>;
    vectorStrokes: Record<string, VectorStroke[]>;
    selection: SelectionRect | null;
}

export interface SelectionRect {
    x: number;
    y: number;
    width: number;
    height: number;
}

export interface TransformRect {
    x: number;
    y: number;
    width: number;
    height: number;
}

export interface BrushPreset {
    id: string;
    name: string;
    brushType: BrushType;
    brushColor: string;
    brushSize: number;
    brushOpacity: number;
    pressureEnabled: boolean;
    pressureCurve: number;
    smoothing: number;
    spacing: number;
}

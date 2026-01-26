
export type LayerType = 'text' | 'image';
export type CanvasShape = 'rectangle' | 'circle' | 'rounded';

export interface CanvasConfig {
  width: number;
  height: number;
  backgroundColor: string;
  showGrid: boolean; // Replaces 'grid' background type logic
  shape: CanvasShape;
}

export type CanvasBackground = 'grid' | 'black' | 'white' | 'green'; // Keeping for now to avoid breaking Toolbar immediately, will refactor.

export interface TextProperties {
  fontSize: number;
  fontFamily: string;
  color: string;
  strokeColor: string;
  strokeWidth: number;
  doubleStroke: boolean;
  doubleStrokeColor: string;
  doubleStrokeWidth: number;
  // Shadow properties
  shadow: boolean;
  shadowColor: string;
  shadowBlur: number;
  shadowOffsetX: number;
  shadowOffsetY: number;
}

export interface Layer {
  id: string;
  type: LayerType;
  name?: string; // Custom display name for the layer
  x: number;
  y: number;
  rotation: number;
  scale: number;
  flipX?: boolean;
  content: string; // Text content or Image URL
  textProps?: TextProperties;
  width: number; // Estimated width for bounding box
  height: number;
}

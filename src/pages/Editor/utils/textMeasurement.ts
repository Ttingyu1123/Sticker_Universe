
import { TextProperties } from '../types';

let canvas: HTMLCanvasElement | null = null;

export const measureText = (text: string, props: TextProperties) => {
  if (!canvas) {
    canvas = document.createElement('canvas');
  }
  const ctx = canvas.getContext('2d');
  if (!ctx) return { width: 200, height: 100 };

  // Set font
  ctx.font = `bold ${props.fontSize}px "${props.fontFamily}"`;
  
  const metrics = ctx.measureText(text);
  const textWidth = metrics.width;
  // Estimate height roughly as fontSize * 1.2 or actual bounding box if supported
  const textHeight = metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent || props.fontSize * 1.2;

  // Add padding for strokes
  const strokePadding = props.doubleStroke 
    ? (props.strokeWidth + props.doubleStrokeWidth) 
    : props.strokeWidth;
  
  // Add padding for Shadow
  let shadowPadding = 0;
  if (props.shadow) {
      // Blur adds size in all directions, Offset shifts it
      shadowPadding = props.shadowBlur + Math.max(Math.abs(props.shadowOffsetX), Math.abs(props.shadowOffsetY));
  }
  
  // Extra padding for safety + shadow
  const padding = strokePadding + shadowPadding + 20;

  return {
    width: Math.ceil(textWidth + padding * 2),
    height: Math.ceil(textHeight + padding * 2)
  };
};

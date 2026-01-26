import { Layer, CanvasConfig } from '../types';

const loadImage = (src: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous"; // Attempt to handle CORS if it's a URL
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(e);
    img.src = src;
  });
};

export const downloadCanvasAsImage = async (layers: Layer[], config: CanvasConfig) => {
  const { width, height, backgroundColor, showGrid, shape } = config;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    console.error('Could not get canvas context');
    return;
  }

  // 1. Pre-load all images
  const imageLayers = layers.filter(l => l.type === 'image');
  const imageMap = new Map<string, HTMLImageElement>();

  try {
    await Promise.all(imageLayers.map(async (layer) => {
      const img = await loadImage(layer.content);
      imageMap.set(layer.id, img);
    }));
  } catch (err) {
    console.error("Failed to load images for export", err);
    alert("Some images could not be loaded for export.");
    return;
  }

  // 2. Clear and Prepare
  ctx.clearRect(0, 0, width, height);

  // 3. Handle Clipping & Background
  // 3. Handle Clipping & Background
  if (shape === 'circle') {
    ctx.beginPath();
    ctx.arc(width / 2, height / 2, Math.min(width, height) / 2, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();
  } else if (shape === 'rounded') {
    const radius = 48; // Match the 3rem (48px) used in CSS
    ctx.beginPath();
    ctx.roundRect(0, 0, width, height, radius);
    ctx.closePath();
    ctx.clip();
  }

  // Fill background if not transparent (grid mode)
  if (!showGrid) {
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, width, height);
  } else {
    // Even in transparent mode, if it's a circle, we effectively just leave it transparent outside.
    // Inside is also transparent unless filled manually.
  }

  // 4. Draw Layers
  for (const layer of layers) {
    ctx.save();

    // Move to the center of the layer
    ctx.translate(layer.x, layer.y);
    ctx.rotate((layer.rotation * Math.PI) / 180);
    ctx.scale(layer.scale * (layer.flipX ? -1 : 1), layer.scale);

    if (layer.type === 'image') {
      const img = imageMap.get(layer.id);
      if (img) {
        // Draw centered
        ctx.drawImage(
          img,
          -layer.width / 2,
          -layer.height / 2,
          layer.width,
          layer.height
        );
      }
    } else if (layer.type === 'text' && layer.textProps) {
      const {
        content,
        textProps: {
          fontSize,
          fontFamily,
          color,
          strokeColor,
          strokeWidth,
          doubleStroke,
          doubleStrokeColor,
          doubleStrokeWidth,
          shadow,
          shadowColor,
          shadowBlur,
          shadowOffsetX,
          shadowOffsetY
        }
      } = layer;

      // Create an offscreen canvas for the text so we can apply shadow to the group 
      // (composite shape) rather than individual strokes
      // Buffer size needs to be large enough to hold the text + strokes + shadows
      const bufferPadding = 100;
      const bufferWidth = layer.width + bufferPadding * 2;
      const bufferHeight = layer.height + bufferPadding * 2;
      const bufferCanvas = document.createElement('canvas');
      bufferCanvas.width = bufferWidth;
      bufferCanvas.height = bufferHeight;
      const bCtx = bufferCanvas.getContext('2d');

      if (bCtx) {
        bCtx.translate(bufferWidth / 2, bufferHeight / 2);
        bCtx.font = `bold ${fontSize}px "${fontFamily}"`;
        bCtx.textAlign = 'center';
        bCtx.textBaseline = 'middle';
        bCtx.lineJoin = 'round';
        bCtx.lineCap = 'round';

        // Draw normal text stack onto buffer (NO shadow yet)
        if (doubleStroke) {
          bCtx.strokeStyle = doubleStrokeColor;
          bCtx.lineWidth = strokeWidth + doubleStrokeWidth;
          bCtx.strokeText(content, 0, 0);
        }
        if (strokeWidth > 0) {
          bCtx.strokeStyle = strokeColor;
          bCtx.lineWidth = strokeWidth;
          bCtx.strokeText(content, 0, 0);
        }
        bCtx.fillStyle = color;
        bCtx.fillText(content, 0, 0);

        // Now draw the buffer onto the main canvas WITH shadow
        if (shadow) {
          ctx.shadowColor = shadowColor;
          ctx.shadowBlur = shadowBlur;
          ctx.shadowOffsetX = shadowOffsetX;
          ctx.shadowOffsetY = shadowOffsetY;
        }

        ctx.drawImage(bufferCanvas, -bufferWidth / 2, -bufferHeight / 2);

        // Reset shadow for next layer
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
      }
    }

    ctx.restore();
  }

  // 5. Download
  try {
    const pngUrl = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    link.download = `layer-lab-${timestamp}.png`;
    link.href = pngUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (e) {
    console.error("Export failed", e);
    alert("Export failed. The canvas might be tainted by external images.");
  }
};

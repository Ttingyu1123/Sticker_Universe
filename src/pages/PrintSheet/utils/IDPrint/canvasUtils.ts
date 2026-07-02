import { AppConfig, CropArea, PhotoAsset } from '../../types/idPrint';
import { mmToPx, PAPER_DIMENSIONS, PHOTO_DIMENSIONS_MM } from './constants';

const createImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', (error) => reject(error));
    image.setAttribute('crossOrigin', 'anonymous'); // needed to avoid CORS issues on CodeSandbox
    image.src = url;
  });

/**
 * Crops the source image based on the area selected in the UI.
 * Returns a base64 string of the single ID photo.
 */
export async function getCroppedImg(
  imageSrc: string,
  pixelCrop: CropArea
): Promise<string> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('No 2d context');
  }

  // set canvas size to match the bounding box
  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  // draw the image
  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  );

  return canvas.toDataURL('image/png');
}

/**
 * Calculate the maximum number of photos that can fit on a page
 * based on paper size, photo size, margins, and gaps.
 */
export function calculateMaxPhotosPerPage(config: AppConfig): number {
  const paperSpec = PAPER_DIMENSIONS[config.paperSize];
  const isPortrait = config.paperOrientation === 'portrait';

  const paperW = isPortrait ? paperSpec.width : paperSpec.height;
  const paperH = isPortrait ? paperSpec.height : paperSpec.width;

  const photoDimMm = PHOTO_DIMENSIONS_MM[config.photoSize];
  const photoW = mmToPx(photoDimMm.width);
  const photoH = mmToPx(photoDimMm.height);
  const marginPx = mmToPx(config.marginMm);
  const gapPx = mmToPx(config.gapMm);

  const availableW = paperW - (marginPx * 2);
  const availableH = paperH - (marginPx * 2);

  if (availableW < photoW || availableH < photoH) return 0;

  const maxCols = Math.floor((availableW + gapPx) / (photoW + gapPx));
  const maxRows = Math.floor((availableH + gapPx) / (photoH + gapPx));

  return maxCols * maxRows;
}

/**
 * Generates the final layout based on selected paper size.
 */
export async function generatePhotoSheet(
  assets: PhotoAsset[],
  config: AppConfig
): Promise<{ url: string; count: number; width: number; height: number }> {

  // 0. Pre-load all unique images
  const uniqueUrls = Array.from(new Set(assets.map(a => a.croppedUrl)));
  const loadedImages: Record<string, HTMLImageElement> = {};

  await Promise.all(uniqueUrls.map(async (url) => {
    try {
      loadedImages[url] = await createImage(url);
    } catch (e) {
      console.error("Failed to load image", url, e);
    }
  }));

  // Build the draw queue based on quantities
  const drawQueue: HTMLImageElement[] = [];
  for (const asset of assets) {
    const img = loadedImages[asset.croppedUrl];
    if (img) {
      for (let i = 0; i < asset.quantity; i++) {
        drawQueue.push(img);
      }
    }
  }

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) throw new Error('Context not available');

  // 1. Determine Paper Size & Orientation
  const paperSpec = PAPER_DIMENSIONS[config.paperSize];
  const isPortrait = config.paperOrientation === 'portrait';

  // Swap width/height if landscape
  const paperW = isPortrait ? paperSpec.width : paperSpec.height;
  const paperH = isPortrait ? paperSpec.height : paperSpec.width;

  canvas.width = paperW;
  canvas.height = paperH;

  // 2. Fill Background White
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, paperW, paperH);

  // 3. Calculate Dimensions in Pixels
  const photoDimMm = PHOTO_DIMENSIONS_MM[config.photoSize];
  const photoW = mmToPx(photoDimMm.width);
  const photoH = mmToPx(photoDimMm.height);
  const marginPx = mmToPx(config.marginMm);
  const gapPx = mmToPx(config.gapMm);

  // 4. Calculate Grid Logic
  // Available area for photos
  const availableW = paperW - (marginPx * 2);
  const availableH = paperH - (marginPx * 2);

  if (availableW < photoW || availableH < photoH) {
    // Too small to fit even one
    return { url: canvas.toDataURL(config.outputFormat), count: 0, width: paperW, height: paperH };
  }

  // Max columns and rows that physically fit
  const maxCols = Math.floor((availableW + gapPx) / (photoW + gapPx));
  const maxRows = Math.floor((availableH + gapPx) / (photoH + gapPx));

  const maxPhotos = maxCols * maxRows;

  // We draw as many as requested, capped by physical space
  const totalPhotosToDraw = Math.min(drawQueue.length, maxPhotos);

  if (totalPhotosToDraw === 0) {
    return { url: canvas.toDataURL(config.outputFormat), count: 0, width: paperW, height: paperH };
  }

  // 5. Layout Calculation (Centering)
  // We fill row by row.
  const rowsNeeded = Math.ceil(totalPhotosToDraw / maxCols);

  // Calculate total block size to center it vertically
  const totalContentHeight = (rowsNeeded * photoH) + ((rowsNeeded - 1) * gapPx);
  const startY = marginPx + (availableH - totalContentHeight) / 2;

  let drawnCount = 0;

  for (let r = 0; r < rowsNeeded; r++) {
    // How many items in this row?
    const remaining = totalPhotosToDraw - drawnCount;
    const colsInThisRow = Math.min(remaining, maxCols);

    // Center horizontally for this specific row
    const rowContentWidth = (colsInThisRow * photoW) + ((colsInThisRow - 1) * gapPx);
    const startX = marginPx + (availableW - rowContentWidth) / 2;

    const y = startY + r * (photoH + gapPx);

    for (let c = 0; c < colsInThisRow; c++) {
      const x = startX + c * (photoW + gapPx);

      ctx.save();

      // Move to center of image position for mirroring
      ctx.translate(x + photoW / 2, y + photoH / 2);

      if (config.enableMirror) {
        ctx.scale(-1, 1);
      }

      // Draw Image (offset by half size because of translate)
      const img = drawQueue[drawnCount];
      if (img) {
        ctx.drawImage(img, -photoW / 2, -photoH / 2, photoW, photoH);
      }

      // Restore for subsequent drawing (cut lines)
      ctx.restore();

      if (config.showCutLines) {
        ctx.save();
        ctx.strokeStyle = '#cccccc'; // Light gray
        ctx.lineWidth = 2; // High res requires thicker line to be visible
        // Draw rectangle around photo
        ctx.strokeRect(x, y, photoW, photoH);
        ctx.restore();
      }

      drawnCount++;
    }
  }

  return { url: canvas.toDataURL(config.outputFormat), count: drawnCount, width: paperW, height: paperH };
}

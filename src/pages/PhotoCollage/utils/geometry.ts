import { AspectRatio, LayoutType, ImageFrame } from '../types';

/**
 * Calculates the dimensions of the final canvas based on requested aspect ratio.
 * Base width is fixed at 1200px for high quality output.
 * @param scale Multiplier for the base size (default 1).
 */
export const getCanvasDimensions = (
    ratio: AspectRatio,
    customW: number = 1,
    customH: number = 1,
    scale: number = 1
): { width: number; height: number } => {
    const baseSize = 1200 * scale;
    switch (ratio) {
        case AspectRatio.SQUARE: return { width: baseSize, height: baseSize };
        case AspectRatio.PORTRAIT: return { width: baseSize, height: (baseSize * 4) / 3 };
        case AspectRatio.LANDSCAPE: return { width: baseSize, height: (baseSize * 3) / 4 };
        case AspectRatio.STORY: return { width: baseSize, height: (baseSize * 16) / 9 };
        case AspectRatio.CINEMA: return { width: baseSize, height: (baseSize * 9) / 16 };

        // Print Sizes (Vertical orientation by default)
        case AspectRatio.A4: return { width: baseSize, height: Math.floor(baseSize * 1.414) }; // ISO A-series ratio sqrt(2)
        case AspectRatio.PHOTO_2X3: return { width: baseSize, height: (baseSize * 3) / 2 };    // 4x6 inches
        case AspectRatio.PHOTO_5X7: return { width: baseSize, height: (baseSize * 7) / 5 };    // 5x7 inches

        case AspectRatio.CUSTOM: {
            // Avoid division by zero
            const safeW = Math.max(0.1, customW);
            const safeH = Math.max(0.1, customH);
            return { width: baseSize, height: (baseSize * safeH) / safeW };
        }
        default: return { width: baseSize, height: baseSize };
    }
};

/**
 * Generates rectangle coordinates for each image based on the count and layout mode.
 */
export const calculateFrames = (
    count: number,
    layout: LayoutType,
    containerWidth: number,
    containerHeight: number,
    gap: number,
    padding: number
): ImageFrame[] => {
    // Effective area after padding
    const w = containerWidth - padding * 2;
    const h = containerHeight - padding * 2;
    const startX = padding;
    const startY = padding;

    if (count === 0) return [];

    const frames: ImageFrame[] = [];

    switch (layout) {
        case LayoutType.HORIZONTAL: {
            const itemW = (w - (count - 1) * gap) / count;
            for (let i = 0; i < count; i++) {
                frames.push({
                    x: startX + i * (itemW + gap),
                    y: startY,
                    width: itemW,
                    height: h,
                });
            }
            break;
        }

        case LayoutType.VERTICAL: {
            const itemH = (h - (count - 1) * gap) / count;
            for (let i = 0; i < count; i++) {
                frames.push({
                    x: startX,
                    y: startY + i * (itemH + gap),
                    width: w,
                    height: itemH,
                });
            }
            break;
        }

        case LayoutType.GRID: {
            // Calculate best fit grid cols/rows
            const cols = Math.ceil(Math.sqrt(count));
            const rows = Math.ceil(count / cols);

            const itemW = (w - (cols - 1) * gap) / cols;
            const itemH = (h - (rows - 1) * gap) / rows;

            for (let i = 0; i < count; i++) {
                const col = i % cols;
                const row = Math.floor(i / cols);

                frames.push({
                    x: startX + col * (itemW + gap),
                    y: startY + row * (itemH + gap),
                    width: itemW,
                    height: itemH,
                });
            }
            break;
        }

        case LayoutType.FEATURED: {
            if (count === 2) {
                // Fallback to vertical split for 2
                const itemH = (h - gap) / 2;
                frames.push({ x: startX, y: startY, width: w, height: itemH });
                frames.push({ x: startX, y: startY + itemH + gap, width: w, height: itemH });
            } else {
                // First image is big (Left half), others grid on Right half
                const leftW = (w - gap) * 0.6; // 60% width
                const rightW = w - leftW - gap;

                // First frame
                frames.push({ x: startX, y: startY, width: leftW, height: h });

                // Rest frames
                const remaining = count - 1;
                const rCols = 1;
                const rRows = remaining;
                const rItemH = (h - (rRows - 1) * gap) / rRows;

                for (let i = 0; i < remaining; i++) {
                    frames.push({
                        x: startX + leftW + gap,
                        y: startY + i * (rItemH + gap),
                        width: rightW,
                        height: rItemH
                    });
                }
            }
            break;
        }

        case LayoutType.MASONRY: {
            // Logic: Define row patterns [itemsInRow1, itemsInRow2, ...]
            let pattern: number[] = [];
            if (count <= 2) pattern = [1, 1]; // Vertical stack
            else if (count === 3) pattern = [1, 2]; // 1 Top, 2 Bottom
            else if (count === 4) pattern = [1, 2, 1];
            else if (count === 5) pattern = [2, 3];
            else if (count === 6) pattern = [3, 3];
            else if (count === 7) pattern = [2, 3, 2];
            else if (count === 8) pattern = [2, 4, 2];
            else if (count === 9) pattern = [3, 3, 3];
            else if (count === 10) pattern = [3, 4, 3];
            else if (count === 11) pattern = [4, 3, 4];
            else if (count === 12) pattern = [4, 4, 4];
            else pattern = [4, 4, 4]; // Fallback for > 12

            const rowCount = pattern.length;
            const itemH = (h - (rowCount - 1) * gap) / rowCount;

            let imgIndex = 0;
            for (let r = 0; r < rowCount; r++) {
                const itemsInRow = pattern[r];
                const itemW = (w - (itemsInRow - 1) * gap) / itemsInRow;

                for (let c = 0; c < itemsInRow; c++) {
                    if (imgIndex < count) {
                        frames.push({
                            x: startX + c * (itemW + gap),
                            y: startY + r * (itemH + gap),
                            width: itemW,
                            height: itemH
                        });
                        imgIndex++;
                    }
                }
            }
            break;
        }

        case LayoutType.CENTER: {
            if (count < 3) {
                // Fallback to GRID for less than 3
                return calculateFrames(count, LayoutType.GRID, containerWidth, containerHeight, gap, padding);
            }

            // Layout: Left Column (25%), Center Column (50%), Right Column (25%)
            const centerW = (w - 2 * gap) * 0.5;
            const sideW = (w - 2 * gap) * 0.25;

            const remaining = count - 1;
            const leftCount = Math.floor(remaining / 2);
            const rightCount = Math.ceil(remaining / 2);

            // 1. Center Hero Image (Index 0)
            frames.push({
                x: startX + sideW + gap,
                y: startY,
                width: centerW,
                height: h
            });

            // 2. Left Column Images
            const leftH = leftCount > 0 ? (h - (leftCount - 1) * gap) / leftCount : h;
            for (let i = 0; i < leftCount; i++) {
                frames.push({
                    x: startX,
                    y: startY + i * (leftH + gap),
                    width: sideW,
                    height: leftH
                });
            }

            // 3. Right Column Images
            const rightH = rightCount > 0 ? (h - (rightCount - 1) * gap) / rightCount : h;
            for (let i = 0; i < rightCount; i++) {
                frames.push({
                    x: startX + sideW + centerW + 2 * gap,
                    y: startY + i * (rightH + gap),
                    width: sideW,
                    height: rightH
                });
            }
            break;
        }

        case LayoutType.SCATTER: {
            // "Scattered" look: Images are smaller, tilted, and overlapping slightly 
            // We use a pseudo-random placement based on index to keep it deterministic

            // Scale down images to 60-70% of what a normal grid cell would be to allow "scatter" space
            const cols = Math.ceil(Math.sqrt(count));
            const gridW = w / cols;
            const gridH = h / Math.ceil(count / cols);

            const cardW = gridW * 0.85;
            const cardH = gridH * 0.85;

            for (let i = 0; i < count; i++) {
                const col = i % cols;
                const row = Math.floor(i / cols);

                // Deterministic "Randomness"
                const angle = ((i * 1337) % 20) - 10; // -10 to 10 degrees
                const offsetX = ((i * 7) % 20) - 10;
                const offsetY = ((i * 11) % 20) - 10;

                frames.push({
                    x: startX + col * gridW + (gridW - cardW) / 2 + offsetX,
                    y: startY + row * gridH + (gridH - cardH) / 2 + offsetY,
                    width: cardW,
                    height: cardH,
                    rotation: angle
                });
            }
            break;
        }
    }

    return frames;
};

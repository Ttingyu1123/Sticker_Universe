import { AspectRatio, CaptionPosition, LayoutType, ImageFrame } from '../types';

export const getCaptionHeight = (
    fontSize: number,
    scaleFactor: number = 1,
    heightRatio: number = 1.8
): number => {
    return (fontSize * heightRatio + 8) * scaleFactor;
};

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
 * @param heroIndices Optional array of indices marking "hero" photos that should get prominent placement
 * @param captionPosition Where captions appear — shrinks image frames to make room
 * @param captionFontSize Font size used to compute reserved caption height
 */
export const calculateFrames = (
    count: number,
    layout: LayoutType,
    containerWidth: number,
    containerHeight: number,
    gap: number,
    padding: number,
    heroIndices?: number[],
    captionPosition?: CaptionPosition,
    captionFontSize?: number,
    captionHeightRatio: number = 1.8
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
            // Enhanced GRID with hero support
            const hasHero = heroIndices && heroIndices.length > 0;

            if (hasHero && count > 2) {
                // Compact hero layout:
                // One hero block on the left, remaining images packed tightly on the right.
                const primaryHero = heroIndices![0];
                const sideRatio = count >= 5 ? 0.58 : 0.52;
                const leftW = (w - gap) * sideRatio;
                const rightW = w - leftW - gap;

                frames[primaryHero] = {
                    x: startX,
                    y: startY,
                    width: leftW,
                    height: h
                };

                const nonHeroIndices = Array.from({ length: count }, (_, i) => i).filter(i => i !== primaryHero);
                const rightCols = nonHeroIndices.length >= 4 ? 2 : 1;

                // Place right-side items in a compact row-fill grid (last row expands to avoid blank cells).
                const tempFrames: ImageFrame[] = [];
                const cols = Math.max(1, Math.min(rightCols, nonHeroIndices.length));
                const rows = Math.ceil(nonHeroIndices.length / cols);
                const rowH = (h - (rows - 1) * gap) / rows;
                let placed = 0;
                for (let row = 0; row < rows; row++) {
                    const remaining = nonHeroIndices.length - placed;
                    const rowCount = row === rows - 1 ? remaining : cols;
                    const rowW = (rightW - (rowCount - 1) * gap) / rowCount;

                    for (let col = 0; col < rowCount; col++) {
                        tempFrames.push({
                            x: startX + leftW + gap + col * (rowW + gap),
                            y: startY + row * (rowH + gap),
                            width: rowW,
                            height: rowH
                        });
                        placed++;
                    }
                }

                nonHeroIndices.forEach((imgIndex, i) => {
                    frames[imgIndex] = tempFrames[i];
                });
            } else {
                // Standard grid without hero - optimize for container aspect ratio
                const aspectRatio = w / h;
                let cols, rows;

                if (count === 1) {
                    cols = 1;
                    rows = 1;
                } else if (count === 2) {
                    // 2 items: side by side
                    cols = 2;
                    rows = 1;
                } else if (count === 3) {
                    // 3 items: prefer horizontal if wide, otherwise triangle
                    cols = aspectRatio > 1.5 ? 3 : 2;
                    rows = Math.ceil(count / cols);
                } else {
                    // For 4+ items: optimize based on aspect ratio
                    // Start with square-ish and adjust based on container shape
                    const sqrtCount = Math.sqrt(count);

                    if (aspectRatio > 1.3) {
                        // Wide container: prefer more columns
                        cols = Math.ceil(sqrtCount * 1.2);
                    } else if (aspectRatio < 0.8) {
                        // Tall container: prefer more rows
                        cols = Math.floor(sqrtCount * 0.8);
                    } else {
                        // Roughly square container
                        cols = Math.ceil(sqrtCount);
                    }

                    cols = Math.max(1, Math.min(cols, count)); // At least 1, at most count
                    rows = Math.ceil(count / cols);
                }

                const itemH = (h - (rows - 1) * gap) / rows;

                let placed = 0;
                for (let row = 0; row < rows; row++) {
                    const remaining = count - placed;
                    const rowCount = row === rows - 1 ? remaining : cols;
                    const itemW = (w - (rowCount - 1) * gap) / rowCount;

                    for (let col = 0; col < rowCount; col++) {
                        frames.push({
                            x: startX + col * (itemW + gap),
                            y: startY + row * (itemH + gap),
                            width: itemW,
                            height: itemH
                        });
                        placed++;
                    }
                }
            }
            break;
        }

        case LayoutType.FEATURED: {
            // Enhanced FEATURED: Auto-promote hero to the big position
            const hasHero = heroIndices && heroIndices.length > 0;
            const featuredIndex = hasHero ? heroIndices![0] : 0; // Use first hero or first image

            if (count <= 2) {
                // Feature: Strict Vertical Stack for 2 items (1 Top, 1 Bottom)
                const itemH = (h - gap) / 2;
                frames.push({ x: startX, y: startY, width: w, height: itemH }); // Top
                if (count > 1) {
                    frames.push({ x: startX, y: startY + itemH + gap, width: w, height: itemH }); // Bottom
                }
            } else {
                // First image (or hero) is big (Left 60%), others grid on Right
                const leftW = (w - gap) * 0.6;
                const rightW = w - leftW - gap;

                // Featured frame (will be filled by hero or first image)
                const featuredFrame = { x: startX, y: startY, width: leftW, height: h };

                // Rest frames
                const remaining = count - 1;
                const rRows = remaining;
                const rItemH = (h - (rRows - 1) * gap) / rRows;

                // Assign frames in original order, but swap the featured image to position 0
                for (let i = 0; i < count; i++) {
                    if (i === featuredIndex) {
                        frames[i] = featuredFrame;
                    } else {
                        // Calculate position in the right column
                        const rightIndex = i < featuredIndex ? i : i - 1;
                        frames[i] = {
                            x: startX + leftW + gap,
                            y: startY + rightIndex * (rItemH + gap),
                            width: rightW,
                            height: rItemH
                        };
                    }
                }
            }
            break;
        }

        case LayoutType.MASONRY: {
            // Logic: Define row patterns [itemsInRow1, itemsInRow2, ...]
            let pattern: number[] = [];
            if (count === 1) pattern = [1];
            else if (count === 2) pattern = [1, 1]; // Vertical stack for 2
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
            const rows = Math.ceil(count / cols);
            const gridW = w / cols;
            const gridH = h / rows;

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

        case LayoutType.DIAGONAL_SPLIT: {
            // Diagonal split: 2 triangular photos separated by diagonal line
            if (count < 2) {
                // Fallback to grid for less than 2
                return calculateFrames(count, LayoutType.GRID, containerWidth, containerHeight, gap, padding);
            }

            // Top-left triangle
            frames.push({
                x: startX,
                y: startY,
                width: w,
                height: h,
                clipPath: [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 0, y: 1 }]
            });

            // Bottom-right triangle
            frames.push({
                x: startX,
                y: startY,
                width: w,
                height: h,
                clipPath: [{ x: 1, y: 1 }, { x: 0, y: 1 }, { x: 1, y: 0 }]
            });
            break;
        }

        case LayoutType.L_LEFT: {
            // L-shape: Big photo on left (60%), stacked small photos on right
            if (count < 2) {
                return calculateFrames(count, LayoutType.GRID, containerWidth, containerHeight, gap, padding);
            }

            const leftW = (w - gap) * 0.6;
            const rightW = w - leftW - gap;

            // Left big photo
            frames.push({ x: startX, y: startY, width: leftW, height: h });

            // Right stacked photos
            const remaining = count - 1;
            const itemH = (h - (remaining - 1) * gap) / remaining;

            for (let i = 0; i < remaining; i++) {
                frames.push({
                    x: startX + leftW + gap,
                    y: startY + i * (itemH + gap),
                    width: rightW,
                    height: itemH
                });
            }
            break;
        }

        case LayoutType.L_RIGHT: {
            // L-shape: Big photo on right (60%), stacked small photos on left
            if (count < 2) {
                return calculateFrames(count, LayoutType.GRID, containerWidth, containerHeight, gap, padding);
            }

            const rightW = (w - gap) * 0.6;
            const leftW = w - rightW - gap;

            // Left stacked photos
            const remaining = count - 1;
            const itemH = (h - (remaining - 1) * gap) / remaining;

            for (let i = 0; i < remaining; i++) {
                frames.push({
                    x: startX,
                    y: startY + i * (itemH + gap),
                    width: leftW,
                    height: itemH
                });
            }

            // Right big photo
            frames.push({
                x: startX + leftW + gap,
                y: startY,
                width: rightW,
                height: h
            });
            break;
        }

        case LayoutType.T_SHAPE: {
            // T-shape: Top horizontal bar + bottom grid
            if (count < 2) {
                return calculateFrames(count, LayoutType.GRID, containerWidth, containerHeight, gap, padding);
            }

            if (count === 2) {
                // Simple vertical split for 2, same as Featured 2 -> Top/Bottom
                const itemH = (h - gap) / 2;
                frames.push({ x: startX, y: startY, width: w, height: itemH });
                frames.push({ x: startX, y: startY + itemH + gap, width: w, height: itemH });
            } else {
                // Top bar takes 50% height, bottom grid takes 50%
                const topH = (h - gap) * 0.5;
                const bottomH = h - topH - gap;

                // Top bar (first photo)
                frames.push({ x: startX, y: startY, width: w, height: topH });

                // Bottom grid (remaining photos)
                const remaining = count - 1;
                const cols = Math.ceil(Math.sqrt(remaining));
                const rows = Math.ceil(remaining / cols);

                const itemW = (w - (cols - 1) * gap) / cols;
                const itemH = (bottomH - (rows - 1) * gap) / rows;

                for (let i = 0; i < remaining; i++) {
                    const col = i % cols;
                    const row = Math.floor(i / cols);

                    frames.push({
                        x: startX + col * (itemW + gap),
                        y: startY + topH + gap + row * (itemH + gap),
                        width: itemW,
                        height: itemH
                    });
                }
            }
            break;
        }

        case LayoutType.CROSS_FOCUS: {
            // Cross focus: Center big square + 4 corner photos
            if (count < 5) {
                // Need at least 5 photos for this layout
                return calculateFrames(count, LayoutType.GRID, containerWidth, containerHeight, gap, padding);
            }

            // Center takes 50% width and 50% height
            const centerSize = Math.min(w, h) * 0.5;
            const centerX = startX + (w - centerSize) / 2;
            const centerY = startY + (h - centerSize) / 2;

            // Center photo (first one)
            frames.push({
                x: centerX,
                y: centerY,
                width: centerSize,
                height: centerSize
            });

            // Calculate corner photo sizes
            const cornerW = (w - centerSize - gap * 2) / 2;
            const cornerH = (h - centerSize - gap * 2) / 2;

            // Top-left corner
            frames.push({ x: startX, y: startY, width: cornerW, height: cornerH });

            // Top-right corner
            frames.push({ x: startX + w - cornerW, y: startY, width: cornerW, height: cornerH });

            // Bottom-left corner
            frames.push({ x: startX, y: startY + h - cornerH, width: cornerW, height: cornerH });

            // Bottom-right corner
            frames.push({ x: startX + w - cornerW, y: startY + h - cornerH, width: cornerW, height: cornerH });

            // If more than 5 photos, distribute extras in available spaces
            if (count > 5) {
                const extras = count - 5;
                // Place extras in top and bottom bars (simply overlap or fallback logic for deeper nesting logic omitted for simplicity)
                // For proper UI, we might limit this, but let's just place them small
                const extraH = (h - centerSize - gap * 2) / 2;
                const extraW = (centerSize - (extras - 1) * gap) / extras;

                for (let i = 0; i < Math.min(extras, 2); i++) {
                    frames.push({
                        x: centerX + i * (extraW + gap),
                        y: startY,
                        width: extraW,
                        height: extraH
                    });
                }
            }
            break;
        }
    }

    if (captionPosition && captionPosition !== 'none' && captionFontSize) {
        const capH = getCaptionHeight(captionFontSize, 1, captionHeightRatio);
        if (captionPosition === 'top' || captionPosition === 'both') {
            for (const frame of frames) {
                if (frame.height <= capH * 2) continue;
                frame.height -= capH;
                frame.y += capH;
            }
        }
    }

    return frames;
};

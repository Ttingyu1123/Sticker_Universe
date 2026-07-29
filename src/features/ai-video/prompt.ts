import type { StickerConcept } from '../sprite-sheet-generator/types';

const CORE_INSTRUCTIONS = `Animate this exact image as a single 4x2 sticker contact-sheet video with a locked camera. Preserve the full 16:9 canvas, all eight equal cells, every caption, character design, background color, and cell boundary. Each character may make only a small, expressive looping motion inside its original cell. Never crop, zoom, pan, shake, reframe, add grid lines, alter text, swap cells, or let any object cross a cell boundary. Keep the first and last pose visually close for a clean loop.`;

export const buildStickerVideoPrompt = (concepts: StickerConcept[] = []) => {
    const cellDirections = concepts
        .slice(0, 8)
        .map((concept, index) => `Cell ${index + 1} — caption “${concept.caption}”: ${concept.visual}`)
        .join('\n');

    return cellDirections
        ? `${CORE_INSTRUCTIONS}\n\nAnimate each cell independently:\n${cellDirections}`
        : CORE_INSTRUCTIONS;
};

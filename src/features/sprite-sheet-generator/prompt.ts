import type { SpriteSheetPromptOptions, SpriteSheetStyle, StickerConcept } from './types';

export const SPRITE_SHEET_WIDTH = 1280;
export const SPRITE_SHEET_HEIGHT = 720;
export const SPRITE_COLUMNS = 4;
export const SPRITE_ROWS = 2;
export const SPRITE_FRAME_COUNT = SPRITE_COLUMNS * SPRITE_ROWS;

export const STYLE_PROMPTS: Record<SpriteSheetStyle, string> = {
    reference: 'Preserve the reference image style, rendering method, proportions, colors, line weight, and material appearance.',
    chibi: 'Cute chibi sticker illustration, oversized head, compact body, rounded shapes, expressive face, polished clean edges.',
    cel: 'High-quality cel-shaded animation art, confident dark linework, flat controlled colors, readable silhouette, production model-sheet consistency.',
    clay: 'Soft handcrafted 3D clay character, rounded forms, tactile clay material, gentle studio lighting, consistent sculpt and proportions.',
    sketch: 'Warm hand-drawn colored-pencil illustration, clean expressive strokes, restrained paper texture only on the character, consistent linework.',
};

const normalizeColor = (color: string): string => (
    /^#[0-9a-fA-F]{6}$/.test(color.trim()) ? color.trim().toUpperCase() : '#00FF00'
);

const sanitizeConcept = (concept: StickerConcept): StickerConcept => ({
    theme: concept.theme.trim().slice(0, 40),
    caption: concept.caption.trim().slice(0, 12),
    visual: concept.visual.trim().slice(0, 240),
});

export const buildSpriteSheetPrompt = ({
    concepts,
    characterDescription,
    style,
    backgroundColor,
    includeText,
}: SpriteSheetPromptOptions): string => {
    if (concepts.length !== SPRITE_FRAME_COUNT) {
        throw new Error(`Exactly ${SPRITE_FRAME_COUNT} sticker concepts are required.`);
    }

    const safeDescription = characterDescription.trim() || 'Use the attached character reference as the exact identity and design source.';
    const safeColor = normalizeColor(backgroundColor);
    const cellPlan = concepts.map((rawConcept, index) => {
        const concept = sanitizeConcept(rawConcept);
        const captionInstruction = includeText
            ? `Render this exact Traditional Chinese caption: "${concept.caption}".`
            : `Do not render text; use "${concept.caption}" only as the intended chat meaning.`;
        return `CELL ${index + 1} — ${concept.theme || `Sticker ${index + 1}`}: ${captionInstruction} Visual performance: ${concept.visual}.`;
    }).join('\n');

    return `
Create ONE production-ready 8-STICKER COLLECTION using the attached character reference.

CANVAS AND GRID — STRICT:
- Final canvas: exactly 1280 × 720 px, 16:9 landscape.
- Use the complete canvas with no reserved outer safe-board margins.
- Divide the full canvas into exactly 4 columns × 2 rows. Each cell is exactly 320 × 360 px.
- Invisible cell boundaries are x=0/320/640/960/1280 and y=0/360/720.
- Reading order is left to right, then top to bottom: stickers 1 through 8.
- These are 8 INDEPENDENT chat stickers, NOT consecutive animation frames.
- Do not draw grid lines, panel borders, numbers, labels, gutters, captions outside the artwork, or separators.
- Every character, limb, prop, effect, shadow, and caption must stay fully inside its own cell.
- Nothing may cross into another cell or touch the outer canvas edge.

CHARACTER LOCK:
- Character description: ${safeDescription}
- Preserve the exact identity, face, hairstyle, clothing, signature accessories, colors, proportions, and rendering style from the reference in all 8 cells.
- Keep the character clearly recognizable while changing pose, facial expression, gesture, and small supporting props to fit each sticker meaning.
- Do not redesign, age, recolor, mirror, or replace the character.
- Style direction: ${STYLE_PROMPTS[style]}

EIGHT DISTINCT STICKERS — FOLLOW EACH CELL EXACTLY:
${cellPlan}

COLLECTION DIVERSITY:
- Every cell must communicate a clearly different chat intent at thumbnail size.
- Use visibly different facial expressions, hand gestures, body poses, energy, and composition across all 8 cells.
- Do not repeat the same pose or merely make tiny sequential changes.
- Supporting props or effects may be used only when they strengthen that cell's meaning and remain inside the cell.

BACKGROUND AND EDGES:
- Every cell must use the exact same flat solid background color ${safeColor}.
- Foreground artwork — including the character, clothing, hair, skin, accessories, props, effects, outlines, and captions — must not use ${safeColor} or a visually similar color.
- Background must be perfectly uniform: no gradient, texture, scenery, vignette, floor, or cast shadow.
- No white sticker border, glow, halo, frame, or edge residue.
- Keep every subject edge closed, crisp, and separated from the background for later chroma-key removal.

TEXT RULE:
${includeText
        ? '- Render only the exact caption assigned to each cell. Use bold, legible Traditional Chinese lettering and do not translate, paraphrase, duplicate, or move a caption to another cell.'
        : '- STRICTLY no text, letters, symbols, logos, watermarks, signatures, or frame numbers anywhere in the image.'}

Return one clean 16:9 image whose complete canvas is a 4×2 board containing 8 different stickers, not 8 separate files.
`.trim();
};

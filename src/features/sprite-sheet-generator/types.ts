export const SPRITE_SHEET_STYLES = [
    'reference',
    'chibi',
    'cel',
    'clay',
    'sketch',
    'flat-vector',
    'bold-cartoon',
    'retro-comic',
    'pixel-art',
] as const;

export type SpriteSheetStyle = typeof SPRITE_SHEET_STYLES[number];

export interface StickerConcept {
    theme: string;
    caption: string;
    visual: string;
}

export interface SpriteSheetPromptOptions {
    concepts: StickerConcept[];
    characterDescription: string;
    contentGuidance?: string;
    requiredCaptionGuidance?: Record<string, string>;
    style: SpriteSheetStyle;
    backgroundColor: string;
    includeText: boolean;
}

export type SpriteSheetStyle = 'reference' | 'chibi' | 'cel' | 'clay' | 'sketch';

export interface StickerConcept {
    theme: string;
    caption: string;
    visual: string;
}

export interface SpriteSheetPromptOptions {
    concepts: StickerConcept[];
    characterDescription: string;
    style: SpriteSheetStyle;
    backgroundColor: string;
    includeText: boolean;
}

import { describe, expect, it } from 'vitest';
import { buildConceptPlanningPrompt } from '../../../src/features/sprite-sheet-generator/concepts';
import {
    buildSpriteSheetPrompt,
    SPRITE_COLUMNS,
    SPRITE_FRAME_COUNT,
    SPRITE_ROWS,
    SPRITE_SHEET_HEIGHT,
    SPRITE_SHEET_WIDTH,
} from '../../../src/features/sprite-sheet-generator/prompt';
import type { StickerConcept } from '../../../src/features/sprite-sheet-generator/types';

const concepts: StickerConcept[] = Array.from({ length: 8 }, (_, index) => ({
    theme: `用途 ${index + 1}`,
    caption: `短句${index + 1}`,
    visual: `第 ${index + 1} 種獨特表情與動作`,
}));

describe('sticker collection prompt', () => {
    it('uses a 720p canvas with a 4x2 full-canvas board', () => {
        expect(SPRITE_SHEET_WIDTH).toBe(1280);
        expect(SPRITE_SHEET_HEIGHT).toBe(720);
        expect(SPRITE_COLUMNS).toBe(4);
        expect(SPRITE_ROWS).toBe(2);
        expect(SPRITE_FRAME_COUNT).toBe(8);
    });

    it('assigns a different editable concept to every cell', () => {
        const prompt = buildSpriteSheetPrompt({
            concepts,
            characterDescription: 'orange cat wearing a blue scarf',
            style: 'cel',
            backgroundColor: '#12ab34',
            includeText: true,
        });

        expect(prompt).toContain('8 INDEPENDENT chat stickers');
        expect(prompt).toContain('Each cell is exactly 320');
        expect(prompt).toContain('Use the complete canvas with no reserved outer safe-board margins');
        expect(prompt).toContain('CELL 1 — 用途 1');
        expect(prompt).toContain('CELL 8 — 用途 8');
        expect(prompt).toContain('Render this exact Traditional Chinese caption: "短句8"');
        expect(prompt).toContain('第 7 種獨特表情與動作');
        expect(prompt).toContain('#12AB34');
        expect(prompt).toContain('must not use #12AB34');
        expect(prompt).toContain('Do not repeat the same pose');
    });

    it('requires all 8 concepts before image generation', () => {
        expect(() => buildSpriteSheetPrompt({
            concepts: concepts.slice(0, 7),
            characterDescription: '',
            style: 'reference',
            backgroundColor: '#00FF00',
            includeText: false,
        })).toThrow('Exactly 8 sticker concepts are required');
    });

    it('asks the planning model for image-specific, non-sensitive ideas', () => {
        const prompt = buildConceptPlanningPrompt('角色是咖啡店吉祥物');
        expect(prompt).toContain('specific character');
        expect(prompt).toContain('角色是咖啡店吉祥物');
        expect(prompt).toContain('visible signature details');
        expect(prompt).toContain('Never infer sensitive identity');
        expect(prompt).toContain('exactly 8');
    });

    it('lists all earlier series concepts as forbidden content for the next batch', () => {
        const previousConcepts = concepts.slice(0, 2);
        const prompt = buildConceptPlanningPrompt('角色是咖啡店吉祥物', previousConcepts);

        expect(prompt).toContain('ALREADY USED — DO NOT REPEAT OR PARAPHRASE');
        expect(prompt).toContain('用途 1');
        expect(prompt).toContain('短句1');
        expect(prompt).toContain('第 1 種獨特表情與動作');
        expect(prompt).toContain('This is the next batch in the same sticker series');
    });

    it('requires the planning model to use user-specified captions verbatim', () => {
        const prompt = buildConceptPlanningPrompt(
            '角色是咖啡店吉祥物',
            concepts.slice(0, 2),
            ['路上小心', '我到家了'],
        );

        expect(prompt).toContain('REQUIRED CAPTIONS — USE VERBATIM');
        expect(prompt).toContain('1. 路上小心');
        expect(prompt).toContain('2. 我到家了');
        expect(prompt).toContain('Do not alter, paraphrase, shorten, or add punctuation');
    });
});

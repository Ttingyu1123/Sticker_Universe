import { describe, expect, it } from 'vitest';
import {
    createSpriteSheetPlanGalleryItem,
    parseSpriteSheetPlanGalleryItem,
    SPRITE_SHEET_DRAFT_ID,
    type SpriteSheetPlanDraft,
} from '../../../src/features/sprite-sheet-generator/planPersistence';

const draft: SpriteSheetPlanDraft = {
    referenceImage: 'data:image/png;base64,AA==',
    characterDescription: '粉紅色機器人女孩',
    characterSummary: '粉紅帽、機械手臂與透明心臟容器',
    concepts: Array.from({ length: 8 }, (_, index) => ({
        theme: `主題 ${index + 1}`,
        caption: `短句 ${index + 1}`,
        visual: `第 ${index + 1} 種表情與動作`,
    })),
    style: 'reference',
    backgroundColor: '#0066FF',
    backgroundRecommendation: {
        color: '#0066FF',
        reason: '角色沒有亮藍色。',
    },
    includeText: true,
    completedBatches: [],
    editingBatchIndex: null,
};

describe('sprite-sheet plan persistence', () => {
    it('creates a readable Gallery item with resumable structured data', () => {
        const item = createSpriteSheetPlanGalleryItem(draft, {
            id: 'plan-1',
            timestamp: 123,
            title: 'AI 貼圖文字企劃',
        });

        expect(item.imageUrl).toBe(draft.referenceImage);
        expect(item.project?.type).toBe('sprite-sheet-plan');
        expect(item.description).toContain('短句 8');
        expect(item.description).toContain('角色沒有亮藍色');
        expect(parseSpriteSheetPlanGalleryItem(item)).toEqual(draft);
    });

    it('uses one stable id for the automatically updated current draft', () => {
        expect(SPRITE_SHEET_DRAFT_ID).toBe('sprite-sheet-plan-current-draft');
    });

    it('remembers which completed batch a resumed revision will replace', () => {
        const revision = {
            ...draft,
            completedBatches: [{ signature: 'batch-1', createdAt: 1, concepts: draft.concepts }],
            editingBatchIndex: 0,
        };
        const item = createSpriteSheetPlanGalleryItem(revision, {
            id: 'batch-1-revision',
            timestamp: 456,
            title: '第一批新版',
        });

        expect(parseSpriteSheetPlanGalleryItem(item)?.editingBatchIndex).toBe(0);
    });
});

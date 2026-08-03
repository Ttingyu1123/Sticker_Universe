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
    contentGuidance: '欠揍又調皮，每張都要有拖鞋',
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
    seriesName: '上班貓 Vol.2',
    requiredCaptions: ['早安', '路上小心'],
    requiredCaptionGuidance: {
        '早安': '睡眼惺忪抱著拖鞋',
        '路上小心': '認真揮手提醒',
    },
    excludedSeriesIds: ['series-1'],
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
        expect(item.description).toContain('欠揍又調皮，每張都要有拖鞋');
        expect(item.description).toContain('早安（睡眼惺忪抱著拖鞋）');
        expect(parseSpriteSheetPlanGalleryItem(item, 'My sticker series')).toEqual(draft);
    });

    it('uses one stable id for the automatically updated current draft', () => {
        expect(SPRITE_SHEET_DRAFT_ID).toBe('sprite-sheet-plan-current-draft');
    });

    it('preserves a chroma-friendly style when saving and restoring a plan', () => {
        const pixelArtDraft: SpriteSheetPlanDraft = {
            ...draft,
            style: 'pixel-art',
        };
        const item = createSpriteSheetPlanGalleryItem(pixelArtDraft, {
            id: 'pixel-art-plan',
            timestamp: 321,
            title: '像素貼圖企劃',
        });

        expect(parseSpriteSheetPlanGalleryItem(item, 'My sticker series')?.style).toBe('pixel-art');
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

        expect(parseSpriteSheetPlanGalleryItem(item, 'My sticker series')?.editingBatchIndex).toBe(0);
    });

    it('restores safe defaults from plans saved before series controls existed', () => {
        const item = createSpriteSheetPlanGalleryItem(draft, {
            id: 'legacy-plan',
            timestamp: 789,
            title: '舊版企劃',
        });
        const data = item.project?.data as Record<string, unknown>;
        delete data.seriesName;
        delete data.contentGuidance;
        delete data.requiredCaptions;
        delete data.requiredCaptionGuidance;
        delete data.excludedSeriesIds;

        expect(parseSpriteSheetPlanGalleryItem(item, 'My sticker series')).toEqual({
            ...draft,
            seriesName: 'My sticker series',
            contentGuidance: '',
            requiredCaptions: [],
            requiredCaptionGuidance: {},
            excludedSeriesIds: [],
        });
    });
});

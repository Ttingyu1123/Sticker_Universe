import type { Sticker } from '../../shared/types/sticker';
import { SPRITE_SHEET_STYLES, type SpriteSheetStyle, type StickerConcept } from './types';
import type { StickerSeriesBatch } from './series';

export const SPRITE_SHEET_PROJECT_TYPE = 'sprite-sheet-plan';
export const SPRITE_SHEET_DRAFT_ID = 'sprite-sheet-plan-current-draft';
const PROJECT_VERSION = 1;

export interface SpriteSheetPlanDraft {
    referenceImage: string;
    characterDescription: string;
    characterSummary: string;
    concepts: StickerConcept[];
    style: SpriteSheetStyle;
    backgroundColor: string;
    backgroundRecommendation: {
        color: string;
        reason: string;
    } | null;
    includeText: boolean;
    completedBatches: StickerSeriesBatch[];
    editingBatchIndex: number | null;
    seriesName: string;
    requiredCaptions: string[];
    excludedSeriesIds: string[];
}

interface StoredSpriteSheetPlan extends Omit<SpriteSheetPlanDraft, 'referenceImage'> {}

interface CreatePlanItemOptions {
    id: string;
    timestamp: number;
    title: string;
}

const buildPlanDescription = (draft: SpriteSheetPlanDraft): string => {
    const character = draft.characterSummary || draft.characterDescription || '未填寫角色描述';
    const backgroundReason = draft.backgroundRecommendation?.reason || '使用者手動選擇';
    const concepts = draft.concepts.map((concept, index) => [
        `## ${String(index + 1).padStart(2, '0')} · ${concept.caption}`,
        `- **用途：** ${concept.theme}`,
        `- **表情與動作：** ${concept.visual}`,
    ].join('\n')).join('\n\n');

    return [
        '# AI 貼圖文字企劃',
        `- **角色：** ${character}`,
        `- **去背色：** ${draft.backgroundColor.toUpperCase()}`,
        `- **選色原因：** ${backgroundReason}`,
        `- **系列進度：** ${draft.completedBatches.length * 8} / 24 張已生成`,
        `- **系列名稱：** ${draft.seriesName}`,
        `- **必做貼圖詞：** ${draft.requiredCaptions.join('、') || '未指定'}`,
        '',
        concepts,
    ].join('\n');
};

export const createSpriteSheetPlanGalleryItem = (
    draft: SpriteSheetPlanDraft,
    { id, timestamp, title }: CreatePlanItemOptions,
): Sticker => {
    const { referenceImage, ...storedData } = draft;
    return {
        id,
        imageUrl: referenceImage,
        phrase: title,
        description: buildPlanDescription(draft),
        timestamp,
        project: {
            type: SPRITE_SHEET_PROJECT_TYPE,
            version: PROJECT_VERSION,
            data: storedData satisfies StoredSpriteSheetPlan,
        },
    };
};

export const parseSpriteSheetPlanGalleryItem = (
    item: Sticker,
    fallbackSeriesName: string,
): SpriteSheetPlanDraft | null => {
    if (item.project?.type !== SPRITE_SHEET_PROJECT_TYPE || item.project.version !== PROJECT_VERSION) {
        return null;
    }

    const data = item.project.data as Partial<StoredSpriteSheetPlan> | null;
    if (
        !data
        || typeof item.imageUrl !== 'string'
        || !Array.isArray(data.concepts)
        || !Array.isArray(data.completedBatches)
        || typeof data.characterDescription !== 'string'
        || typeof data.characterSummary !== 'string'
        || typeof data.backgroundColor !== 'string'
        || typeof data.includeText !== 'boolean'
        || !SPRITE_SHEET_STYLES.includes(String(data.style) as SpriteSheetStyle)
    ) {
        return null;
    }

    return {
        referenceImage: item.imageUrl,
        characterDescription: data.characterDescription,
        characterSummary: data.characterSummary,
        concepts: data.concepts.map((concept) => ({ ...concept })),
        style: data.style as SpriteSheetStyle,
        backgroundColor: data.backgroundColor,
        backgroundRecommendation: data.backgroundRecommendation
            ? { ...data.backgroundRecommendation }
            : null,
        includeText: data.includeText,
        editingBatchIndex: Number.isInteger(data.editingBatchIndex)
            && Number(data.editingBatchIndex) >= 0
            && Number(data.editingBatchIndex) < data.completedBatches.length
            ? Number(data.editingBatchIndex)
            : null,
        completedBatches: data.completedBatches.map((batch) => ({
            ...batch,
            concepts: batch.concepts.map((concept) => ({ ...concept })),
        })),
        seriesName: typeof data.seriesName === 'string' && data.seriesName.trim()
            ? data.seriesName
            : fallbackSeriesName,
        requiredCaptions: Array.isArray(data.requiredCaptions)
            ? data.requiredCaptions.filter((caption): caption is string => typeof caption === 'string').slice(0, 24)
            : [],
        excludedSeriesIds: Array.isArray(data.excludedSeriesIds)
            ? data.excludedSeriesIds.filter((id): id is string => typeof id === 'string')
            : [],
    };
};

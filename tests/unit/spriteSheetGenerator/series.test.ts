import { describe, expect, it } from 'vitest';
import * as seriesControls from '../../../src/features/sprite-sheet-generator/series';
import type { StickerConcept } from '../../../src/features/sprite-sheet-generator/types';
import {
    appendStickerBatch,
    findConceptConflicts,
    getSeriesConcepts,
    getSeriesConceptsExcludingBatch,
    MAX_SERIES_BATCHES,
    MAX_SERIES_STICKERS,
    replaceStickerBatch,
} from '../../../src/features/sprite-sheet-generator/series';

const requiredCaptionControls = seriesControls as typeof seriesControls & {
    parseRequiredCaptions?: (input: string) => string[];
    normalizeRequiredCaptionGuidance?: (value: unknown) => Record<string, string>;
    selectRequiredCaptionGuidance?: (
        captions: string[],
        guidance: Record<string, string>,
    ) => Record<string, string>;
    getRequiredCaptionsForBatch?: (
        requiredCaptions: string[],
        batches: import('../../../src/features/sprite-sheet-generator/series').StickerSeriesBatch[],
        editingBatchIndex: number | null,
    ) => string[];
    findRequiredCaptionConflicts?: (
        requiredCaptions: string[],
        excludedConcepts: StickerConcept[],
    ) => string[];
    findMissingRequiredCaptions?: (
        requiredCaptions: string[],
        concepts: StickerConcept[],
    ) => string[];
    findOverlongRequiredCaptions?: (
        requiredCaptions: string[],
    ) => string[];
    createStickerSeriesArchive?: (
        name: string,
        batches: import('../../../src/features/sprite-sheet-generator/series').StickerSeriesBatch[],
        fallbackName: string,
        createdAt?: number,
    ) => {
        id: string;
        name: string;
        createdAt: number;
        concepts: StickerConcept[];
    } | null;
    parseStickerSeriesArchives?: (value: unknown) => Array<{
        id: string;
        name: string;
        createdAt: number;
        concepts: StickerConcept[];
    }>;
    getSelectedArchiveConcepts?: (
        archives: Array<{
            id: string;
            name: string;
            createdAt: number;
            concepts: StickerConcept[];
        }>,
        selectedIds: string[],
    ) => StickerConcept[];
};

const createBatch = (prefix: string): StickerConcept[] => Array.from({ length: 8 }, (_, index) => ({
    theme: `${prefix}用途${index + 1}`,
    caption: `${prefix}短句${index + 1}`,
    visual: `${prefix}第${index + 1}種動作`,
}));

describe('sticker collection series', () => {
    it('parses required captions from common separators and removes normalized duplicates', () => {
        expect(requiredCaptionControls.parseRequiredCaptions).toBeTypeOf('function');
        expect(requiredCaptionControls.parseRequiredCaptions?.(
            '早安\n 謝謝、早 安！, 晚安，謝謝',
        )).toEqual(['早安', '謝謝', '晚安']);
    });

    it('limits one series to 24 required captions', () => {
        const input = Array.from({ length: 30 }, (_, index) => `貼圖詞${index + 1}`).join('\n');
        expect(requiredCaptionControls.parseRequiredCaptions?.(input)).toHaveLength(24);
    });

    it('normalizes and selects per-caption content directions', () => {
        expect(requiredCaptionControls.normalizeRequiredCaptionGuidance).toBeTypeOf('function');
        expect(requiredCaptionControls.selectRequiredCaptionGuidance).toBeTypeOf('function');
        const normalized = requiredCaptionControls.normalizeRequiredCaptionGuidance?.({
            ' 早安 ': ' 睡眼惺忪抱著拖鞋 ',
            '路上小心': ' ',
            invalid: 123,
        }) || {};

        expect(normalized).toEqual({ 早安: '睡眼惺忪抱著拖鞋' });
        expect(requiredCaptionControls.selectRequiredCaptionGuidance?.(
            ['早安', '晚安'],
            { ...normalized, 晚安: '蓋著棉被揮手', 不相關: '不應保留' },
        )).toEqual({
            早安: '睡眼惺忪抱著拖鞋',
            晚安: '蓋著棉被揮手',
        });
    });

    it('allocates only required captions not used outside the active batch', () => {
        const first = appendStickerBatch([], createBatch('A'), 1);
        const second = appendStickerBatch(first, createBatch('B'), 2);
        const required = ['A短句1', 'B短句1', '新詞1', '新詞2'];

        expect(requiredCaptionControls.getRequiredCaptionsForBatch?.(required, second, null))
            .toEqual(['新詞1', '新詞2']);
        expect(requiredCaptionControls.getRequiredCaptionsForBatch?.(required, second, 0))
            .toEqual(['A短句1', '新詞1', '新詞2']);
    });

    it('finds required captions already used by an excluded series', () => {
        expect(requiredCaptionControls.findRequiredCaptionConflicts?.(
            ['早安', '全新詞'],
            [{ theme: '問候', caption: '早 安！', visual: '揮手' }],
        )).toEqual(['早安']);
    });

    it('finds required captions removed from an edited batch', () => {
        expect(requiredCaptionControls.findMissingRequiredCaptions).toBeTypeOf('function');
        expect(requiredCaptionControls.findMissingRequiredCaptions?.(
            ['早安', '路上小心'],
            [
                { theme: '問候', caption: '早安', visual: '揮手' },
                { theme: '叮嚀', caption: '路上 小心', visual: '目送' },
            ],
        )).toEqual(['路上小心']);
    });

    it('finds required captions that exceed the sticker text limit', () => {
        expect(requiredCaptionControls.findOverlongRequiredCaptions).toBeTypeOf('function');
        expect(requiredCaptionControls.findOverlongRequiredCaptions?.([
            '一二三四五六七八九十甲乙',
            '一二三四五六七八九十甲乙丙',
        ])).toEqual(['一二三四五六七八九十甲乙丙']);
    });

    it('archives completed batches as one named historical series', () => {
        const first = appendStickerBatch([], createBatch('A'), 1);
        const second = appendStickerBatch(first, createBatch('B'), 2);

        expect(requiredCaptionControls.createStickerSeriesArchive).toBeTypeOf('function');
        expect(requiredCaptionControls.createStickerSeriesArchive?.(
            ' 上班貓 Vol.1 ',
            second,
            'Untitled series',
            123,
        ))
            .toEqual({
                id: 'series-123',
                name: '上班貓 Vol.1',
                createdAt: 123,
                concepts: [...createBatch('A'), ...createBatch('B')],
            });
    });

    it('uses the caller-provided localized fallback for a blank archive name', () => {
        const batch = appendStickerBatch([], createBatch('A'), 1);

        expect(requiredCaptionControls.createStickerSeriesArchive?.(
            '   ',
            batch,
            'Untitled series',
            456,
        )).toMatchObject({
            id: 'series-456',
            name: 'Untitled series',
        });
    });

    it('loads only valid historical series data', () => {
        const valid = {
            id: 'series-1',
            name: '第一套',
            createdAt: 1,
            concepts: createBatch('A'),
        };

        expect(requiredCaptionControls.parseStickerSeriesArchives).toBeTypeOf('function');
        expect(requiredCaptionControls.parseStickerSeriesArchives?.([
            valid,
            { ...valid, id: '', name: '壞資料' },
            { ...valid, id: 'series-2', concepts: [{ caption: '缺欄位' }] },
        ])).toEqual([valid]);
        expect(requiredCaptionControls.parseStickerSeriesArchives?.({ invalid: true })).toEqual([]);
    });

    it('collects concepts only from selected historical series', () => {
        const archives = [
            {
                id: 'series-1',
                name: '第一套',
                createdAt: 1,
                concepts: createBatch('A'),
            },
            {
                id: 'series-2',
                name: '第二套',
                createdAt: 2,
                concepts: createBatch('B'),
            },
        ];

        expect(requiredCaptionControls.getSelectedArchiveConcepts).toBeTypeOf('function');
        expect(requiredCaptionControls.getSelectedArchiveConcepts?.(archives, ['series-2']))
            .toEqual(createBatch('B'));
    });

    it('collects three successful 8-sticker batches into one 24-sticker series', () => {
        const first = appendStickerBatch([], createBatch('A'), 1);
        const second = appendStickerBatch(first, createBatch('B'), 2);
        const third = appendStickerBatch(second, createBatch('C'), 3);

        expect(third).toHaveLength(MAX_SERIES_BATCHES);
        expect(getSeriesConcepts(third)).toHaveLength(MAX_SERIES_STICKERS);
    });

    it('does not count regenerating the same batch twice', () => {
        const concepts = createBatch('A');
        const first = appendStickerBatch([], concepts, 1);

        expect(appendStickerBatch(first, concepts, 2)).toEqual(first);
    });

    it('rejects a fourth distinct batch after the series reaches 24 stickers', () => {
        const fullSeries = [
            ...appendStickerBatch([], createBatch('A'), 1),
        ];
        const twoBatches = appendStickerBatch(fullSeries, createBatch('B'), 2);
        const threeBatches = appendStickerBatch(twoBatches, createBatch('C'), 3);

        expect(() => appendStickerBatch(threeBatches, createBatch('D'), 4)).toThrow('24 stickers');
    });

    it('excludes only the selected batch while re-planning it', () => {
        const first = appendStickerBatch([], createBatch('A'), 1);
        const second = appendStickerBatch(first, createBatch('B'), 2);
        const third = appendStickerBatch(second, createBatch('C'), 3);

        expect(getSeriesConceptsExcludingBatch(third, 0)).toEqual([
            ...createBatch('B'),
            ...createBatch('C'),
        ]);
    });

    it('replaces one completed batch without changing the other two', () => {
        const first = appendStickerBatch([], createBatch('A'), 1);
        const second = appendStickerBatch(first, createBatch('B'), 2);
        const third = appendStickerBatch(second, createBatch('C'), 3);
        const replaced = replaceStickerBatch(third, 0, createBatch('R'), 4);

        expect(replaced).toHaveLength(3);
        expect(replaced[0].concepts).toEqual(createBatch('R'));
        expect(replaced[1]).toEqual(third[1]);
        expect(replaced[2]).toEqual(third[2]);
    });

    it('stores the exact generation metadata on a completed batch', () => {
        const generation = {
            prompt: 'Exact prompt sent to the image model',
            provider: 'gemini',
            model: 'gemini-3-pro-image-preview',
        };

        const batches = appendStickerBatch([], createBatch('A'), 1, generation);

        expect(batches[0].generation).toEqual(generation);
        expect(batches[0].generation).not.toBe(generation);
    });

    it('replaces generation metadata while keeping legacy prompt-less batches valid', () => {
        const legacy = appendStickerBatch([], createBatch('A'), 1);
        expect(legacy[0].generation).toBeUndefined();

        const generation = {
            prompt: 'Replacement prompt',
            provider: 'openai',
            model: 'gpt-image-2',
        };
        const replaced = replaceStickerBatch(legacy, 0, createBatch('R'), 2, generation);

        expect(replaced[0].generation).toEqual(generation);
    });

    it('detects reused captions and themes even when spacing or punctuation changes', () => {
        const used: StickerConcept[] = [{ theme: '早安問候', caption: '早安！', visual: '揮手微笑' }];
        const candidates: StickerConcept[] = [
            { theme: '全新用途', caption: '早 安', visual: '伸懶腰' },
            { theme: '早安，問候', caption: '你好呀', visual: '點頭' },
        ];

        expect(findConceptConflicts(candidates, used)).toEqual([
            { index: 0, field: 'caption', value: '早 安' },
            { index: 1, field: 'theme', value: '早安，問候' },
        ]);
    });

    it('caps appended archives at the retention limit, newest first', () => {
        const makeArchive = (id: number) => ({
            id: `series-${id}`,
            name: `Series ${id}`,
            createdAt: id,
            concepts: [{ theme: `t${id}`, caption: `c${id}`, visual: `v${id}` }],
        });
        const full = Array.from(
            { length: seriesControls.MAX_SERIES_ARCHIVES },
            (_, index) => makeArchive(index),
        );

        const appended = seriesControls.appendStickerSeriesArchive(full, makeArchive(999));

        expect(appended).toHaveLength(seriesControls.MAX_SERIES_ARCHIVES);
        expect(appended[0].id).toBe('series-999');
        expect(appended.some((archive) => archive.id === full.at(-1)!.id)).toBe(false);
    });

    it('replaces an archive with the same id instead of duplicating it', () => {
        const original = {
            id: 'series-1',
            name: 'Old',
            createdAt: 1,
            concepts: [{ theme: 't', caption: 'c', visual: 'v' }],
        };
        const replacement = { ...original, name: 'New' };

        const appended = seriesControls.appendStickerSeriesArchive([original], replacement);

        expect(appended).toHaveLength(1);
        expect(appended[0].name).toBe('New');
    });

    it('drops parsed archives beyond the retention limit', () => {
        const oversized = Array.from({ length: seriesControls.MAX_SERIES_ARCHIVES + 5 }, (_, index) => ({
            id: `series-${index}`,
            name: `Series ${index}`,
            createdAt: index,
            concepts: [{ theme: 't', caption: 'c', visual: 'v' }],
        }));

        expect(seriesControls.parseStickerSeriesArchives(oversized))
            .toHaveLength(seriesControls.MAX_SERIES_ARCHIVES);
    });
});

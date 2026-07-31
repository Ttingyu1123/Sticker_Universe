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
    getRequiredCaptionsForBatch?: (
        requiredCaptions: string[],
        batches: import('../../../src/features/sprite-sheet-generator/series').StickerSeriesBatch[],
        editingBatchIndex: number | null,
    ) => string[];
    findRequiredCaptionConflicts?: (
        requiredCaptions: string[],
        excludedConcepts: StickerConcept[],
    ) => string[];
    createStickerSeriesArchive?: (
        name: string,
        batches: import('../../../src/features/sprite-sheet-generator/series').StickerSeriesBatch[],
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

    it('archives completed batches as one named historical series', () => {
        const first = appendStickerBatch([], createBatch('A'), 1);
        const second = appendStickerBatch(first, createBatch('B'), 2);

        expect(requiredCaptionControls.createStickerSeriesArchive).toBeTypeOf('function');
        expect(requiredCaptionControls.createStickerSeriesArchive?.(' 上班貓 Vol.1 ', second, 123))
            .toEqual({
                id: 'series-123',
                name: '上班貓 Vol.1',
                createdAt: 123,
                concepts: [...createBatch('A'), ...createBatch('B')],
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
});

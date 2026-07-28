import { describe, expect, it } from 'vitest';
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

const createBatch = (prefix: string): StickerConcept[] => Array.from({ length: 8 }, (_, index) => ({
    theme: `${prefix}用途${index + 1}`,
    caption: `${prefix}短句${index + 1}`,
    visual: `${prefix}第${index + 1}種動作`,
}));

describe('sticker collection series', () => {
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

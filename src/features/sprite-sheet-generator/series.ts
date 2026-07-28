import type { StickerConcept } from './types';

export const STICKERS_PER_BATCH = 8;
export const MAX_SERIES_BATCHES = 3;
export const MAX_SERIES_STICKERS = STICKERS_PER_BATCH * MAX_SERIES_BATCHES;

export interface StickerSeriesBatch {
    signature: string;
    createdAt: number;
    concepts: StickerConcept[];
}

const normalizeForComparison = (value: string): string => value
    .normalize('NFKC')
    .toLocaleLowerCase('zh-TW')
    .replace(/[\p{P}\p{S}\s]/gu, '');

const getBatchSignature = (concepts: StickerConcept[]): string => concepts
    .map((concept) => [concept.theme, concept.caption, concept.visual]
        .map(normalizeForComparison)
        .join('|'))
    .join('::');

export const getSeriesConcepts = (batches: StickerSeriesBatch[]): StickerConcept[] => (
    batches.flatMap((batch) => batch.concepts)
);

export const getSeriesConceptsExcludingBatch = (
    batches: StickerSeriesBatch[],
    excludedIndex: number,
): StickerConcept[] => batches.flatMap((batch, index) => (
    index === excludedIndex ? [] : batch.concepts
));

export interface ConceptConflict {
    index: number;
    field: 'caption' | 'theme';
    value: string;
}

export const findConceptConflicts = (
    candidates: StickerConcept[],
    usedConcepts: StickerConcept[],
): ConceptConflict[] => {
    const usedCaptions = new Set(usedConcepts.map((concept) => normalizeForComparison(concept.caption)));
    const usedThemes = new Set(usedConcepts.map((concept) => normalizeForComparison(concept.theme)));
    const conflicts: ConceptConflict[] = [];

    candidates.forEach((concept, index) => {
        const caption = normalizeForComparison(concept.caption);
        const theme = normalizeForComparison(concept.theme);

        if (caption && usedCaptions.has(caption)) {
            conflicts.push({ index, field: 'caption', value: concept.caption });
        } else if (theme && usedThemes.has(theme)) {
            conflicts.push({ index, field: 'theme', value: concept.theme });
        }

        if (caption) usedCaptions.add(caption);
        if (theme) usedThemes.add(theme);
    });

    return conflicts;
};

export const isBatchInSeries = (
    batches: StickerSeriesBatch[],
    concepts: StickerConcept[],
): boolean => batches.some((batch) => batch.signature === getBatchSignature(concepts));

export const appendStickerBatch = (
    batches: StickerSeriesBatch[],
    concepts: StickerConcept[],
    createdAt = Date.now(),
): StickerSeriesBatch[] => {
    if (concepts.length !== STICKERS_PER_BATCH) {
        throw new Error(`A sticker batch must contain exactly ${STICKERS_PER_BATCH} stickers.`);
    }

    const signature = getBatchSignature(concepts);
    if (batches.some((batch) => batch.signature === signature)) return batches;
    if (batches.length >= MAX_SERIES_BATCHES) {
        throw new Error(`This series already contains ${MAX_SERIES_STICKERS} stickers.`);
    }

    return [...batches, {
        signature,
        createdAt,
        concepts: concepts.map((concept) => ({ ...concept })),
    }];
};

export const replaceStickerBatch = (
    batches: StickerSeriesBatch[],
    batchIndex: number,
    concepts: StickerConcept[],
    createdAt = Date.now(),
): StickerSeriesBatch[] => {
    if (batchIndex < 0 || batchIndex >= batches.length) {
        throw new Error('The selected sticker batch does not exist.');
    }
    if (concepts.length !== STICKERS_PER_BATCH) {
        throw new Error(`A sticker batch must contain exactly ${STICKERS_PER_BATCH} stickers.`);
    }

    const signature = getBatchSignature(concepts);
    if (batches.some((batch, index) => index !== batchIndex && batch.signature === signature)) {
        throw new Error('This sticker batch duplicates another batch in the series.');
    }

    return batches.map((batch, index) => index === batchIndex ? {
        signature,
        createdAt,
        concepts: concepts.map((concept) => ({ ...concept })),
    } : batch);
};

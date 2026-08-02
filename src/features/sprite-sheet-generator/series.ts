import type { StickerConcept } from './types';
import type { AiProvider } from '../../shared/geminiApiKey';

export const STICKERS_PER_BATCH = 8;
export const MAX_SERIES_BATCHES = 3;
export const MAX_SERIES_STICKERS = STICKERS_PER_BATCH * MAX_SERIES_BATCHES;
export const MAX_STICKER_CAPTION_LENGTH = 12;
export const MAX_SERIES_ARCHIVES = 20;

export interface StickerSeriesBatch {
    signature: string;
    createdAt: number;
    concepts: StickerConcept[];
    generation?: StickerBatchGeneration;
}

export interface StickerBatchGeneration {
    prompt: string;
    provider: AiProvider;
    model: string;
}

export interface StickerSeriesArchive {
    id: string;
    name: string;
    createdAt: number;
    concepts: StickerConcept[];
}

const normalizeForComparison = (value: string): string => value
    .normalize('NFKC')
    .toLocaleLowerCase('zh-TW')
    .replace(/[\p{P}\p{S}\s]/gu, '');

export const parseRequiredCaptions = (input: string): string[] => {
    const seen = new Set<string>();
    const captions: string[] = [];

    for (const value of input.split(/[\n\r,，、]+/)) {
        const caption = value.trim();
        const normalized = normalizeForComparison(caption);
        if (!normalized || seen.has(normalized)) continue;
        seen.add(normalized);
        captions.push(caption);
        if (captions.length === MAX_SERIES_STICKERS) break;
    }

    return captions;
};

export const getRequiredCaptionsForBatch = (
    requiredCaptions: string[],
    batches: StickerSeriesBatch[],
    editingBatchIndex: number | null,
): string[] => {
    const usedConcepts = editingBatchIndex === null
        ? getSeriesConcepts(batches)
        : getSeriesConceptsExcludingBatch(batches, editingBatchIndex);
    const usedCaptions = new Set(usedConcepts.map((concept) => normalizeForComparison(concept.caption)));
    return requiredCaptions
        .filter((caption) => !usedCaptions.has(normalizeForComparison(caption)))
        .slice(0, STICKERS_PER_BATCH);
};

export const findRequiredCaptionConflicts = (
    requiredCaptions: string[],
    excludedConcepts: StickerConcept[],
): string[] => {
    const excludedCaptions = new Set(
        excludedConcepts.map((concept) => normalizeForComparison(concept.caption)),
    );
    return requiredCaptions.filter((caption) => (
        excludedCaptions.has(normalizeForComparison(caption))
    ));
};

export const findMissingRequiredCaptions = (
    requiredCaptions: string[],
    concepts: StickerConcept[],
): string[] => {
    const captions = new Set(
        concepts.map((concept) => concept.caption.normalize('NFKC').trim()),
    );
    return requiredCaptions.filter((caption) => (
        !captions.has(caption.normalize('NFKC').trim())
    ));
};

export const findOverlongRequiredCaptions = (
    requiredCaptions: string[],
): string[] => requiredCaptions.filter((caption) => (
    caption.normalize('NFKC').trim().length > MAX_STICKER_CAPTION_LENGTH
));

export const createStickerSeriesArchive = (
    name: string,
    batches: StickerSeriesBatch[],
    fallbackName: string,
    createdAt = Date.now(),
): StickerSeriesArchive | null => {
    const concepts = getSeriesConcepts(batches);
    if (concepts.length === 0) return null;
    return {
        id: `series-${createdAt}`,
        name: name.trim() || fallbackName,
        createdAt,
        concepts: concepts.map((concept) => ({ ...concept })),
    };
};

const isStickerConcept = (value: unknown): value is StickerConcept => {
    if (!value || typeof value !== 'object') return false;
    const concept = value as Partial<StickerConcept>;
    return typeof concept.theme === 'string'
        && concept.theme.trim().length > 0
        && typeof concept.caption === 'string'
        && concept.caption.trim().length > 0
        && typeof concept.visual === 'string'
        && concept.visual.trim().length > 0;
};

export const appendStickerSeriesArchive = (
    archives: StickerSeriesArchive[],
    archive: StickerSeriesArchive,
): StickerSeriesArchive[] => [
    archive,
    ...archives.filter((item) => item.id !== archive.id),
].slice(0, MAX_SERIES_ARCHIVES);

export const parseStickerSeriesArchives = (value: unknown): StickerSeriesArchive[] => {
    if (!Array.isArray(value)) return [];
    return value.flatMap((item) => {
        if (!item || typeof item !== 'object') return [];
        const archive = item as Partial<StickerSeriesArchive>;
        if (
            typeof archive.id !== 'string'
            || archive.id.trim().length === 0
            || typeof archive.name !== 'string'
            || archive.name.trim().length === 0
            || typeof archive.createdAt !== 'number'
            || !Number.isFinite(archive.createdAt)
            || !Array.isArray(archive.concepts)
            || archive.concepts.length === 0
            || !archive.concepts.every(isStickerConcept)
        ) return [];
        return [{
            id: archive.id,
            name: archive.name,
            createdAt: archive.createdAt,
            concepts: archive.concepts.map((concept) => ({ ...concept })),
        }];
    }).slice(0, MAX_SERIES_ARCHIVES);
};

export const getSelectedArchiveConcepts = (
    archives: StickerSeriesArchive[],
    selectedIds: string[],
): StickerConcept[] => {
    const selected = new Set(selectedIds);
    return archives.flatMap((archive) => (
        selected.has(archive.id)
            ? archive.concepts.map((concept) => ({ ...concept }))
            : []
    ));
};

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
    generation?: StickerBatchGeneration,
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
        ...(generation ? { generation: { ...generation } } : {}),
    }];
};

export const replaceStickerBatch = (
    batches: StickerSeriesBatch[],
    batchIndex: number,
    concepts: StickerConcept[],
    createdAt = Date.now(),
    generation?: StickerBatchGeneration,
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
        ...(generation ? { generation: { ...generation } } : {}),
    } : batch);
};

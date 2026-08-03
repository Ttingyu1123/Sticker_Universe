import JSZip from 'jszip';
import type { SpriteSheetPlanDraft } from './planPersistence';
import type { StickerSeriesArchive, StickerSeriesBatch } from './series';
import {
    getSeriesConcepts,
    isBatchInSeries,
    MAX_SERIES_BATCHES,
    normalizeRequiredCaptionGuidance,
    STICKERS_PER_BATCH,
} from './series';
import {
    SPRITE_SHEET_STYLES,
    type SpriteSheetStyle,
    type StickerConcept,
} from './types';

export const STICKER_SERIES_BACKUP_FORMAT = 'sticker-universe-series';
export const STICKER_SERIES_BACKUP_VERSION = 1;
export const MAX_STICKER_SERIES_BACKUP_SIZE = 25 * 1024 * 1024;

const MAX_REFERENCE_IMAGE_SIZE = 15 * 1024 * 1024;
const MAX_MANIFEST_SIZE = 1024 * 1024;

export interface StickerSeriesBackupProject {
    id: string;
    name: string;
    createdAt: number;
    referenceImage: string;
    characterDescription: string;
    characterSummary: string;
    contentGuidance: string;
    style: SpriteSheetStyle;
    backgroundColor: string;
    includeText: boolean;
    requiredCaptions: string[];
    requiredCaptionGuidance: Record<string, string>;
    completedBatches: StickerSeriesBatch[];
    draftConcepts: StickerConcept[];
}

type StoredStickerSeriesBackupProject = Omit<StickerSeriesBackupProject, 'referenceImage'>;

export interface StickerSeriesBackupManifest {
    format: typeof STICKER_SERIES_BACKUP_FORMAT;
    version: typeof STICKER_SERIES_BACKUP_VERSION;
    exportedAt: number;
    referenceImageFile: string;
    project: StoredStickerSeriesBackupProject;
}

export interface ParsedStickerSeriesBackup {
    manifest: StickerSeriesBackupManifest;
    project: StickerSeriesBackupProject;
    promptCoverage: {
        recorded: number;
        total: number;
        complete: boolean;
    };
}

const isRecord = (value: unknown): value is Record<string, unknown> => (
    !!value && typeof value === 'object' && !Array.isArray(value)
);

const isConcept = (value: unknown): value is StickerConcept => {
    if (!isRecord(value)) return false;
    return ['theme', 'caption', 'visual'].every((field) => (
        typeof value[field] === 'string' && value[field].trim().length > 0
    ));
};

const normalizeConcepts = (
    value: unknown,
    expectedLength: number | null,
): StickerConcept[] => {
    if (
        !Array.isArray(value)
        || (expectedLength !== null && value.length !== expectedLength)
        || !value.every(isConcept)
    ) {
        throw new Error('The sticker series backup contains invalid concept data.');
    }
    return value.map((concept) => ({
        theme: concept.theme,
        caption: concept.caption,
        visual: concept.visual,
    }));
};

const normalizeBatch = (value: unknown): StickerSeriesBatch => {
    if (
        !isRecord(value)
        || typeof value.signature !== 'string'
        || !value.signature.trim()
        || typeof value.createdAt !== 'number'
        || !Number.isFinite(value.createdAt)
    ) {
        throw new Error('The sticker series backup contains an invalid completed batch.');
    }

    let generation: StickerSeriesBatch['generation'];
    if (value.generation !== undefined) {
        if (
            !isRecord(value.generation)
            || typeof value.generation.prompt !== 'string'
            || !value.generation.prompt.trim()
            || (value.generation.provider !== 'gemini' && value.generation.provider !== 'openai')
            || typeof value.generation.model !== 'string'
            || !value.generation.model.trim()
        ) {
            throw new Error('The sticker series backup contains invalid generation metadata.');
        }
        generation = {
            prompt: value.generation.prompt,
            provider: value.generation.provider,
            model: value.generation.model,
        };
    }

    return {
        signature: value.signature,
        createdAt: value.createdAt,
        concepts: normalizeConcepts(value.concepts, STICKERS_PER_BATCH),
        ...(generation ? { generation } : {}),
    };
};

const normalizeStoredProject = (value: unknown): StoredStickerSeriesBackupProject => {
    if (
        !isRecord(value)
        || typeof value.id !== 'string'
        || !value.id.trim()
        || typeof value.name !== 'string'
        || !value.name.trim()
        || typeof value.createdAt !== 'number'
        || !Number.isFinite(value.createdAt)
        || typeof value.characterDescription !== 'string'
        || typeof value.characterSummary !== 'string'
        || (value.contentGuidance !== undefined && typeof value.contentGuidance !== 'string')
        || !SPRITE_SHEET_STYLES.includes(value.style as SpriteSheetStyle)
        || typeof value.backgroundColor !== 'string'
        || !/^#[0-9a-f]{6}$/i.test(value.backgroundColor)
        || typeof value.includeText !== 'boolean'
        || !Array.isArray(value.requiredCaptions)
        || !value.requiredCaptions.every((caption) => typeof caption === 'string')
        || value.requiredCaptions.length > 24
        || (value.requiredCaptionGuidance !== undefined && !isRecord(value.requiredCaptionGuidance))
        || !Array.isArray(value.completedBatches)
        || value.completedBatches.length === 0
        || value.completedBatches.length > MAX_SERIES_BATCHES
        || !Array.isArray(value.draftConcepts)
        || (value.draftConcepts.length !== 0 && value.draftConcepts.length !== STICKERS_PER_BATCH)
    ) {
        throw new Error('The sticker series backup project is invalid.');
    }

    return {
        id: value.id,
        name: value.name,
        createdAt: value.createdAt,
        characterDescription: value.characterDescription,
        characterSummary: value.characterSummary,
        contentGuidance: typeof value.contentGuidance === 'string'
            ? value.contentGuidance.slice(0, 500)
            : '',
        style: value.style as SpriteSheetStyle,
        backgroundColor: value.backgroundColor.toUpperCase(),
        includeText: value.includeText,
        requiredCaptions: value.requiredCaptions.map((caption) => caption.trim()).filter(Boolean),
        requiredCaptionGuidance: normalizeRequiredCaptionGuidance(
            value.requiredCaptionGuidance,
        ),
        completedBatches: value.completedBatches.map(normalizeBatch),
        draftConcepts: normalizeConcepts(value.draftConcepts, value.draftConcepts.length),
    };
};

const parseDataUrl = (value: string): { mimeType: string; bytes: Uint8Array } => {
    const match = /^data:(image\/(?:png|jpeg|webp));base64,([a-z0-9+/=]+)$/i.exec(value);
    if (!match) throw new Error('The sticker series reference image is invalid.');
    const binary = atob(match[2]);
    const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
    if (bytes.length === 0 || bytes.length > MAX_REFERENCE_IMAGE_SIZE) {
        throw new Error('The sticker series reference image is invalid or too large.');
    }
    return { mimeType: match[1].toLowerCase(), bytes };
};

const extensionForMimeType = (mimeType: string): string => (
    mimeType === 'image/jpeg' ? 'jpg' : mimeType.split('/')[1]
);

const bytesToDataUrl = (bytes: Uint8Array, mimeType: string): string => {
    let binary = '';
    const chunkSize = 0x8000;
    for (let offset = 0; offset < bytes.length; offset += chunkSize) {
        binary += String.fromCharCode(...bytes.subarray(offset, offset + chunkSize));
    }
    return `data:${mimeType};base64,${btoa(binary)}`;
};

const blobToArrayBuffer = (blob: Blob): Promise<ArrayBuffer> => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error ?? new Error('Could not read the backup file.'));
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.readAsArrayBuffer(blob);
});

const getPromptCoverage = (batches: StickerSeriesBatch[]) => {
    const recorded = batches.filter((batch) => !!batch.generation?.prompt.trim()).length;
    return {
        recorded,
        total: batches.length,
        complete: recorded === batches.length,
    };
};

export const createStickerSeriesBackupProject = (
    draft: SpriteSheetPlanDraft,
    fallbackName: string,
): StickerSeriesBackupProject => {
    const firstBatch = draft.completedBatches[0];
    if (!firstBatch) throw new Error('Complete at least one sticker batch before exporting.');
    return {
        id: `series-${firstBatch.createdAt}`,
        name: draft.seriesName.trim() || fallbackName,
        createdAt: firstBatch.createdAt,
        referenceImage: draft.referenceImage,
        characterDescription: draft.characterDescription,
        characterSummary: draft.characterSummary,
        contentGuidance: draft.contentGuidance,
        style: draft.style,
        backgroundColor: draft.backgroundColor,
        includeText: draft.includeText,
        requiredCaptions: [...draft.requiredCaptions],
        requiredCaptionGuidance: { ...draft.requiredCaptionGuidance },
        completedBatches: draft.completedBatches,
        draftConcepts: isBatchInSeries(draft.completedBatches, draft.concepts)
            ? []
            : draft.concepts,
    };
};

export const createSpriteSheetDraftFromBackup = (
    project: StickerSeriesBackupProject,
    excludedSeriesIds: string[],
): SpriteSheetPlanDraft => ({
    referenceImage: project.referenceImage,
    characterDescription: project.characterDescription,
    characterSummary: project.characterSummary,
    contentGuidance: project.contentGuidance,
    concepts: project.draftConcepts,
    style: project.style,
    backgroundColor: project.backgroundColor,
    backgroundRecommendation: null,
    includeText: project.includeText,
    completedBatches: project.completedBatches,
    editingBatchIndex: null,
    seriesName: project.name,
    requiredCaptions: project.requiredCaptions,
    requiredCaptionGuidance: { ...project.requiredCaptionGuidance },
    excludedSeriesIds: [...excludedSeriesIds],
});

export const createStickerSeriesArchiveFromBackup = (
    project: StickerSeriesBackupProject,
): StickerSeriesArchive => ({
    id: project.id,
    name: project.name,
    createdAt: project.createdAt,
    concepts: getSeriesConcepts(project.completedBatches),
});

export const getStickerSeriesBackupFilename = (seriesName: string): string => {
    const safeName = seriesName
        .normalize('NFKC')
        .trim()
        .replace(/[<>:"/\\|?*\u0000-\u001f]+/g, ' ')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')
        .slice(0, 80) || 'sticker-series';
    return `${safeName}.sticker-series.zip`;
};

export const createStickerSeriesBackup = async (
    project: StickerSeriesBackupProject,
    exportedAt = Date.now(),
): Promise<Blob> => {
    const { referenceImage, ...storedProjectInput } = project;
    const storedProject = normalizeStoredProject(storedProjectInput);
    const { mimeType, bytes } = parseDataUrl(referenceImage);
    const referenceImageFile = `reference-image.${extensionForMimeType(mimeType)}`;
    const manifest: StickerSeriesBackupManifest = {
        format: STICKER_SERIES_BACKUP_FORMAT,
        version: STICKER_SERIES_BACKUP_VERSION,
        exportedAt,
        referenceImageFile,
        project: storedProject,
    };

    const zip = new JSZip();
    zip.file('manifest.json', JSON.stringify(manifest, null, 2));
    zip.file(referenceImageFile, bytes);
    return zip.generateAsync({ type: 'blob', mimeType: 'application/zip' });
};

export const parseStickerSeriesBackup = async (
    file: Blob,
): Promise<ParsedStickerSeriesBackup> => {
    if (file.size === 0 || file.size > MAX_STICKER_SERIES_BACKUP_SIZE) {
        throw new Error('The sticker series backup file is empty or too large.');
    }

    let zip: JSZip;
    try {
        zip = await JSZip.loadAsync(await blobToArrayBuffer(file));
    } catch {
        throw new Error('The selected file is not a valid sticker series ZIP backup.');
    }

    const manifestEntry = zip.file('manifest.json');
    if (!manifestEntry) throw new Error('The sticker series backup manifest is missing.');
    const manifestText = await manifestEntry.async('string');
    if (manifestText.length > MAX_MANIFEST_SIZE) {
        throw new Error('The sticker series backup manifest is too large.');
    }

    let rawManifest: unknown;
    try {
        rawManifest = JSON.parse(manifestText);
    } catch {
        throw new Error('The sticker series backup manifest is invalid JSON.');
    }
    if (!isRecord(rawManifest) || rawManifest.format !== STICKER_SERIES_BACKUP_FORMAT) {
        throw new Error('The selected file has an unsupported sticker series backup format.');
    }
    if (rawManifest.version !== STICKER_SERIES_BACKUP_VERSION) {
        throw new Error('The selected sticker series backup version is not supported.');
    }
    if (
        typeof rawManifest.exportedAt !== 'number'
        || !Number.isFinite(rawManifest.exportedAt)
        || typeof rawManifest.referenceImageFile !== 'string'
        || !/^reference-image\.(?:png|jpg|webp)$/.test(rawManifest.referenceImageFile)
    ) {
        throw new Error('The sticker series backup manifest is invalid.');
    }

    const project = normalizeStoredProject(rawManifest.project);
    const imageEntry = zip.file(rawManifest.referenceImageFile);
    if (!imageEntry) throw new Error('The sticker series backup reference image is missing.');
    const imageBytes = await imageEntry.async('uint8array');
    if (imageBytes.length === 0 || imageBytes.length > MAX_REFERENCE_IMAGE_SIZE) {
        throw new Error('The sticker series backup reference image is invalid or too large.');
    }
    const extension = rawManifest.referenceImageFile.split('.').at(-1);
    const mimeType = extension === 'jpg' ? 'image/jpeg' : `image/${extension}`;
    const manifest: StickerSeriesBackupManifest = {
        format: STICKER_SERIES_BACKUP_FORMAT,
        version: STICKER_SERIES_BACKUP_VERSION,
        exportedAt: rawManifest.exportedAt,
        referenceImageFile: rawManifest.referenceImageFile,
        project,
    };

    return {
        manifest,
        project: {
            ...project,
            referenceImage: bytesToDataUrl(imageBytes, mimeType),
        },
        promptCoverage: getPromptCoverage(project.completedBatches),
    };
};

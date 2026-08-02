import JSZip from 'jszip';
import { describe, expect, it } from 'vitest';
import type { StickerConcept } from '../../../src/features/sprite-sheet-generator/types';
import {
    createStickerSeriesBackup,
    getStickerSeriesBackupFilename,
    parseStickerSeriesBackup,
    STICKER_SERIES_BACKUP_FORMAT,
    STICKER_SERIES_BACKUP_VERSION,
    type StickerSeriesBackupProject,
} from '../../../src/features/sprite-sheet-generator/seriesBackup';

const REFERENCE_IMAGE = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADElEQVR42mNk+M/wHwAF/gL+Xw9uAAAAAElFTkSuQmCC';

const createConcepts = (prefix: string): StickerConcept[] => Array.from(
    { length: 8 },
    (_, index) => ({
        theme: `${prefix} theme ${index + 1}`,
        caption: `${prefix} ${index + 1}`,
        visual: `${prefix} visual ${index + 1}`,
    }),
);

const createProject = (): StickerSeriesBackupProject => ({
    id: 'series-123',
    name: 'Daily Cat Vol. 1',
    createdAt: 123,
    referenceImage: REFERENCE_IMAGE,
    characterDescription: 'A round orange cat',
    characterSummary: 'Orange cat with a striped tail',
    style: 'bold-cartoon',
    backgroundColor: '#00FF00',
    includeText: true,
    requiredCaptions: ['Hello', 'Thanks'],
    completedBatches: [{
        signature: 'batch-a',
        createdAt: 124,
        concepts: createConcepts('A'),
        generation: {
            prompt: 'The exact full image-generation prompt',
            provider: 'gemini',
            model: 'gemini-3-pro-image-preview',
        },
    }],
    draftConcepts: createConcepts('B'),
});

const blobToArrayBuffer = (blob: Blob): Promise<ArrayBuffer> => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error);
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.readAsArrayBuffer(blob);
});

const buildZip = async (manifest: unknown, includeReference = true): Promise<Blob> => {
    const zip = new JSZip();
    zip.file('manifest.json', JSON.stringify(manifest));
    if (includeReference) zip.file('reference-image.png', 'image');
    return zip.generateAsync({ type: 'blob' });
};

describe('portable sticker series backups', () => {
    it('round-trips series settings, concepts, reference image, and exact generation prompts', async () => {
        const project = createProject();
        const blob = await createStickerSeriesBackup(project, 456);
        const parsed = await parseStickerSeriesBackup(blob);

        expect(parsed.manifest).toMatchObject({
            format: STICKER_SERIES_BACKUP_FORMAT,
            version: STICKER_SERIES_BACKUP_VERSION,
            exportedAt: 456,
            referenceImageFile: 'reference-image.png',
        });
        expect(parsed.project).toEqual(project);
        expect(parsed.promptCoverage).toEqual({ recorded: 1, total: 1, complete: true });

        const zip = await JSZip.loadAsync(await blobToArrayBuffer(blob));
        expect(Object.keys(zip.files).sort()).toEqual(['manifest.json', 'reference-image.png']);
        const rawManifest = await zip.file('manifest.json')!.async('string');
        expect(rawManifest).not.toContain('apiKey');
        expect(rawManifest).not.toContain('generatedImage');
        expect(rawManifest).not.toContain(REFERENCE_IMAGE);
    });

    it('supports legacy completed batches whose original prompts were not recorded', async () => {
        const project = createProject();
        delete project.completedBatches[0].generation;

        const parsed = await parseStickerSeriesBackup(
            await createStickerSeriesBackup(project, 456),
        );

        expect(parsed.project.completedBatches[0].generation).toBeUndefined();
        expect(parsed.promptCoverage).toEqual({ recorded: 0, total: 1, complete: false });
    });

    it('creates a safe, recognizable filename from the series name', () => {
        expect(getStickerSeriesBackupFilename('  Daily / Cat: Vol. 1?  '))
            .toBe('Daily-Cat-Vol.-1.sticker-series.zip');
        expect(getStickerSeriesBackupFilename('***')).toBe('sticker-series.sticker-series.zip');
    });

    it('rejects unsupported formats and versions', async () => {
        const project = createProject();
        const baseManifest = {
            format: STICKER_SERIES_BACKUP_FORMAT,
            version: STICKER_SERIES_BACKUP_VERSION,
            exportedAt: 456,
            referenceImageFile: 'reference-image.png',
            project: { ...project, referenceImage: undefined },
        };

        await expect(parseStickerSeriesBackup(await buildZip({
            ...baseManifest,
            format: 'another-product',
        }))).rejects.toThrow('format');
        await expect(parseStickerSeriesBackup(await buildZip({
            ...baseManifest,
            version: 99,
        }))).rejects.toThrow('version');
    });

    it('rejects missing reference images and malformed concepts', async () => {
        const project = createProject();
        const manifest = {
            format: STICKER_SERIES_BACKUP_FORMAT,
            version: STICKER_SERIES_BACKUP_VERSION,
            exportedAt: 456,
            referenceImageFile: 'reference-image.png',
            project: { ...project, referenceImage: undefined },
        };

        await expect(parseStickerSeriesBackup(await buildZip(manifest, false)))
            .rejects.toThrow('reference image');
        await expect(parseStickerSeriesBackup(await buildZip({
            ...manifest,
            project: {
                ...manifest.project,
                completedBatches: [{
                    ...project.completedBatches[0],
                    concepts: [{ caption: 'Missing theme and visual' }],
                }],
            },
        }))).rejects.toThrow('concept');
    });
});

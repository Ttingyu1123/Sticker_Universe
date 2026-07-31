import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const source = readFileSync(
    resolve(process.cwd(), 'src/features/sprite-sheet-generator/SpriteSheetGeneratorTab.tsx'),
    'utf8',
);
const gallerySource = readFileSync(
    resolve(process.cwd(), 'src/pages/Gallery/App.tsx'),
    'utf8',
);
const zhTw = JSON.parse(readFileSync(
    resolve(process.cwd(), 'src/locales/zh-TW.json'),
    'utf8',
)) as { spriteSheet: { styles: Record<string, string> } };
const en = JSON.parse(readFileSync(
    resolve(process.cwd(), 'src/locales/en.json'),
    'utf8',
)) as { spriteSheet: { styles: Record<string, string> } };

describe('sprite sheet page readability', () => {
    it('does not use sub-12px utility text in the page UI', () => {
        expect(source).not.toMatch(/text-\[(?:9|10|11)px\]/);
    });

    it('alternates mint-ice and cream surfaces for visible panel contrast', () => {
        expect(source).toContain('border border-cream-dark bg-cream-light');
        expect(source).toContain('border border-cream-dark bg-cream');
    });

    it('enlarges the shared provider switcher only within this page', () => {
        expect(source).toContain('[&_button]:text-sm');
        expect(source).toContain('[&_button]:py-3');
    });

    it('shows all supported visual styles in a responsive three-column grid', () => {
        expect(source).toContain('SPRITE_SHEET_STYLES.map');
        expect(source).toContain('sm:grid-cols-3');
        expect(source).toContain("t(`spriteSheet.styles.${option}`)");
    });

    it('provides localized names for the four chroma-friendly styles', () => {
        expect(zhTw.spriteSheet.styles).toMatchObject({
            'flat-vector': '扁平向量',
            'bold-cartoon': '粗線條卡通',
            'retro-comic': '復古漫畫',
            'pixel-art': '像素藝術',
        });
        expect(en.spriteSheet.styles).toMatchObject({
            'flat-vector': 'Flat vector',
            'bold-cartoon': 'Bold cartoon',
            'retro-comic': 'Retro comic',
            'pixel-art': 'Pixel art',
        });
    });

    it('shows the AI background-color recommendation in art direction', () => {
        expect(source).toContain("t('spriteSheet.backgroundAiRecommended')");
        expect(source).toContain('backgroundRecommendation.reason');
    });

    it('draws the generated-image guide over all eight full-canvas cells', () => {
        expect(source).not.toContain('left-[5%] top-[16.25%]');
        expect(source).toContain('absolute inset-0 grid grid-cols-4 grid-rows-2');
    });

    it('auto-saves an editable draft after planning changes', () => {
        expect(source).toContain('SPRITE_SHEET_DRAFT_ID');
        expect(source).toContain('createSpriteSheetPlanGalleryItem');
        expect(source).toContain("t('spriteSheet.draftSaved')");
    });

    it('lets a saved text plan resume from Gallery', () => {
        expect(gallerySource).toContain("sticker.project?.type === 'sprite-sheet-plan'");
        expect(gallerySource).toContain('tab=sprite-sheet&plan=');
        expect(gallerySource).toContain("t('gallery.continueStickerPlan')");
    });

    it('lets a completed batch be selected, regenerated, or re-planned in place', () => {
        expect(source).toContain('editingBatchIndex');
        expect(source).toContain('handleSelectBatch');
        expect(source).toContain('replaceStickerBatch');
        expect(source).toContain('getSeriesConceptsExcludingBatch');
        expect(source).toContain("t('spriteSheet.regenerateBatchImage'");
        expect(source).toContain("t('spriteSheet.replanBatch'");
    });

    it('lets users name a series and enter captions that AI must include', () => {
        expect(source).toContain("t('spriteSheet.seriesName')");
        expect(source).toContain("t('spriteSheet.requiredCaptions')");
        expect(source).toContain('requiredCaptionsInput');
        expect(source).toContain('parseRequiredCaptions(requiredCaptionsInput)');
        expect(source).toContain('requiredCaptions: batchRequiredCaptions');
    });

    it('lets users exclude selected historical series from new planning', () => {
        expect(source).toContain("t('spriteSheet.previousSeries')");
        expect(source).toContain('archivedSeries');
        expect(source).toContain('excludedSeriesIds');
        expect(source).toContain('getSelectedArchiveConcepts(archivedSeries, excludedSeriesIds)');
    });

    it('archives the current batches before starting a new series', () => {
        expect(source).toContain('createStickerSeriesArchive(');
        expect(source).toContain("t('spriteSheet.unnamedSeries')");
        expect(source).toContain('setArchivedSeries');
        expect(source).toContain("t('spriteSheet.startNewSeries')");
    });

    it('blocks generation when edits remove required captions or reuse archived content', () => {
        expect(source).toContain('findMissingRequiredCaptions(batchRequiredCaptions, concepts)');
        expect(source).toContain('...selectedArchiveConcepts');
        expect(source).toContain("t('spriteSheet.missingRequiredCaptions'");
        expect(source).toContain("t('spriteSheet.seriesConflict'");
    });
});

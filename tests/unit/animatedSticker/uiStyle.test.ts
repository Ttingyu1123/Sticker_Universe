import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const readSource = (relativePath: string) => readFileSync(resolve(process.cwd(), relativePath), 'utf8');
const appSource = readSource('src/pages/AnimatedSticker/App.tsx');
const previewSource = readSource('src/pages/AnimatedSticker/components/VideoBoardPreview.tsx');
const resultCardSource = readSource('src/pages/AnimatedSticker/components/StickerResultCard.tsx');
const tabMakerSource = readSource('src/pages/AnimatedSticker/components/TabImageMaker.tsx');
const videoProcessingSource = readSource('src/pages/AnimatedSticker/utils/videoProcessing.ts');
const compressionSource = readSource('src/pages/AnimatedSticker/utils/compression.ts');
const complianceSource = readSource('src/pages/AnimatedSticker/utils/lineCompliance.ts');
const combinedSource = `${appSource}\n${previewSource}\n${resultCardSource}`;

describe('animated sticker page readability', () => {
    it('does not use sub-12px utility text anywhere in the workflow', () => {
        expect(combinedSource).not.toMatch(/text-\[(?:9|10|11)px\]/);
    });

    it('uses alternating mint-ice and cream workflow surfaces', () => {
        expect(appSource).toContain('border border-cream-dark bg-cream-light');
        expect(appSource).toContain('border border-cream-dark bg-cream');
    });

    it('previews the same full-canvas 4x2 cells used by the cutter', () => {
        expect(previewSource).not.toContain('left-[5%] top-[16.25%]');
        expect(previewSource).toContain('getGridCellRect(100, 100, index, calibration)');
    });

    it('lets users drag and reset the crop guides', () => {
        expect(previewSource).toContain('onPointerMove');
        expect(previewSource).toContain('cursor-col-resize');
        expect(previewSource).toContain("t('animatedSticker.resetGrid')");
        expect(appSource).toContain('gridCalibration={settings.gridCalibration}');
        expect(videoProcessingSource).toContain('settings.gridCalibration');
    });

    it('sizes the loaded preview from the real video instead of forcing 16:9', () => {
        expect(previewSource).toContain('className="block w-full"');
        expect(previewSource).toContain("src ? 'relative bg-bronze-text'");
    });

    it('detects the solid background after the uploaded video has decoded its first frame', () => {
        expect(previewSource).toContain('onLoadedData={onLoadedData}');
        expect(appSource).toContain('detectVideoBackgroundColor(video)');
        expect(appSource).toContain('onLoadedData={handleLoadedData}');
    });

    it('offers one-click compression for oversized APNG results', () => {
        expect(appSource).toContain('handleCompressResults');
        expect(appSource).toContain("t('animatedSticker.compressButton'");
        expect(appSource).toContain('overLimitCount > 0');
        expect(compressionSource).toContain('MAX_LINE_FILE_SIZE');
        expect(resultCardSource).toContain('originalSizeBytes');
    });

    it('labels results from all LINE requirements instead of file size alone', () => {
        expect(resultCardSource).toContain('validateLineAnimatedSticker(result)');
        expect(resultCardSource).toContain("t('animatedSticker.lineCompliant')");
        expect(complianceSource).toContain('loopCount');
        expect(complianceSource).toContain('hasTransparency');
    });

    it('reminds users about the two additional images required for submission', () => {
        expect(appSource).toContain("t('animatedSticker.submissionReminderTitle')");
        expect(appSource).toContain("t('animatedSticker.mainImageRequirement')");
        expect(appSource).toContain("t('animatedSticker.tabImageRequirement')");
    });

    it('offers an integrated 240x240 APNG main-image maker', () => {
        expect(appSource).toContain("from './components/MainImageMaker'");
        expect(appSource).toContain('<MainImageMaker results={results}');
    });

    it('places a 96x74 static tab-image maker below the main-image maker', () => {
        expect(appSource).toContain("from './components/TabImageMaker'");
        expect(appSource).toContain('<TabImageMaker results={results}');
        expect(appSource.indexOf('<TabImageMaker')).toBeGreaterThan(appSource.indexOf('<MainImageMaker'));
    });

    it('lets users scale the subject down or up in the tab image', () => {
        expect(tabMakerSource).toContain('imageScale');
        expect(tabMakerSource).toContain("t('animatedSticker.tabMakerScale')");
        expect(tabMakerSource).toContain('min={50}');
        expect(tabMakerSource).toContain('max={180}');
    });

    it('exports the small tab image without reusing the sticker color limit', () => {
        expect(tabMakerSource).toContain('encodeStaticPng(previewFrame');
        expect(tabMakerSource).not.toContain('selectedResult.colorCount');
    });
});

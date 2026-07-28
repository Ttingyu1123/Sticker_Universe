import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const readSource = (relativePath: string) => readFileSync(resolve(process.cwd(), relativePath), 'utf8');
const appSource = readSource('src/pages/AnimatedSticker/App.tsx');
const previewSource = readSource('src/pages/AnimatedSticker/components/VideoBoardPreview.tsx');
const resultCardSource = readSource('src/pages/AnimatedSticker/components/StickerResultCard.tsx');
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
});

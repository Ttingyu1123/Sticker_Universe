import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const readSource = (relativePath: string) => readFileSync(resolve(process.cwd(), relativePath), 'utf8');

describe('precision crop integration', () => {
    it('places precision crop and whole-image resize in one image-editor tab', () => {
        const appSource = readSource('src/pages/ImageEditor/App.tsx');
        const wrapperSource = readSource('src/pages/ImageEditor/components/CropResizeTab.tsx');

        expect(appSource).toContain("from './components/CropResizeTab'");
        expect(appSource).toContain('<CropResizeTab />');
        expect(wrapperSource).toContain('<PrecisionCropTool />');
        expect(wrapperSource).toContain('<ImageResizerTab />');
    });

    it('supports a movable fixed pixel crop and exact PNG export', () => {
        const source = readSource('src/pages/ImageEditor/components/PrecisionCropTool.tsx');

        expect(source).toContain('onPointerDown');
        expect(source).toContain('onKeyDown');
        expect(source).toContain('crop.width');
        expect(source).toContain('crop.height');
        expect(source).toContain('crop.x');
        expect(source).toContain('crop.y');
        expect(source).toContain('canvas.toBlob');
    });

    it('keeps precision-crop labels at least 12px for readability', () => {
        const source = readSource('src/pages/ImageEditor/components/PrecisionCropTool.tsx');

        expect(source).not.toMatch(/text-\[(?:9|10|11)px\]/);
    });

    it('lets users resize the image while keeping the output dimensions fixed', () => {
        const source = readSource('src/pages/ImageEditor/components/PrecisionCropTool.tsx');

        expect(source).toContain('imageScale');
        expect(source).toContain('getScaledSourceCrop');
        expect(source).toContain('changePixelCropScale');
        expect(source).toContain('type="range"');
        expect(source).toContain("t('editor.cropResize.imageScale'");
        expect(source).toContain('sourceCrop.width');
        expect(source).toContain('crop.width');
    });

    it('keeps the crop viewport fixed while scaling and moving the image behind it', () => {
        const source = readSource('src/pages/ImageEditor/components/PrecisionCropTool.tsx');

        expect(source).toContain('getFixedCropPreviewTransform');
        expect(source).toContain('imagePreviewTransform');
        expect(source).toContain("aspectRatio: `${crop.width} / ${crop.height}`");
        expect(source).not.toContain('sourceCrop.width / source.width * 100');
        expect(source).not.toContain('sourceCrop.height / source.height * 100');
    });
});

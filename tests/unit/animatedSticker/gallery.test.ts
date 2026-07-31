import { beforeEach, describe, expect, it, vi } from 'vitest';
import { saveStickerToDB } from '../../../src/db';
import {
    blobToDataUrl,
    createAnimatedStickerGalleryItems,
    saveAnimatedStickerResults,
} from '../../../src/pages/AnimatedSticker/gallery';
import type { AnimatedStickerResult } from '../../../src/pages/AnimatedSticker/types';

vi.mock('../../../src/db', () => ({
    saveStickerToDB: vi.fn(),
}));

const createResult = (index: number, bytes: number[]): AnimatedStickerResult => ({
    index,
    blob: new Blob([new Uint8Array(bytes)], { type: 'image/png' }),
    url: `blob:result-${index}`,
    sizeBytes: bytes.length,
    frameCount: 12,
    sourceFrames: [],
    durationMs: 2_000,
    colorCount: 128,
    width: 320,
    height: 270,
    loopCount: 2,
    hasTransparency: true,
    hasMotion: true,
    isRgb: true,
});

const labels = {
    phrase: (number: number) => `Animated sticker ${number}`,
    description: 'Created from board.mp4',
};

describe('animated sticker Gallery persistence', () => {
    beforeEach(() => {
        vi.mocked(saveStickerToDB).mockReset();
    });

    it('converts an APNG Blob into a durable data URL', async () => {
        await expect(blobToDataUrl(createResult(0, [1, 2, 3]).blob))
            .resolves.toMatch(/^data:image\/png;base64,/);
    });

    it('maps one extraction batch to deterministic Gallery ids', () => {
        const results = [createResult(0, [1]), createResult(1, [2])];
        const first = createAnimatedStickerGalleryItems(results, ['data:first', 'data:second'], {
            batchId: 'batch-123',
            timestamp: 123,
            ...labels,
        });
        const compressed = createAnimatedStickerGalleryItems(results, ['data:compressed-1', 'data:compressed-2'], {
            batchId: 'batch-123',
            timestamp: 456,
            ...labels,
        });

        expect(first.map((item) => item.id)).toEqual([
            'animated-sticker-batch-123-01',
            'animated-sticker-batch-123-02',
        ]);
        expect(compressed.map((item) => item.id)).toEqual(first.map((item) => item.id));
        expect(compressed[0].imageUrl).toBe('data:compressed-1');
        expect(first[1]).toMatchObject({
            phrase: 'Animated sticker 2',
            description: 'Created from board.mp4',
            timestamp: 123,
        });
    });

    it('writes every generated result through the shared Gallery database API', async () => {
        vi.mocked(saveStickerToDB).mockResolvedValue(undefined);

        const items = await saveAnimatedStickerResults(
            [createResult(0, [1]), createResult(1, [2])],
            { batchId: 'batch-456', timestamp: 456, ...labels },
        );

        expect(items).toHaveLength(2);
        expect(saveStickerToDB).toHaveBeenCalledTimes(2);
        expect(saveStickerToDB).toHaveBeenNthCalledWith(1, items[0]);
        expect(saveStickerToDB).toHaveBeenNthCalledWith(2, items[1]);
    });
});

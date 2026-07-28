import { afterEach, describe, expect, it, vi } from 'vitest';
import { generateOpenAiImage } from '../../../src/pages/Generator/services/openaiImageService';

describe('generateOpenAiImage proxy errors', () => {
    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it('explains a missing local proxy route instead of reporting an ambiguous 404', async () => {
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
            ok: false,
            status: 404,
            json: vi.fn().mockRejectedValue(new SyntaxError('empty response')),
        }));

        await expect(generateOpenAiImage(
            'sk-test-key-that-is-long-enough',
            'test prompt',
            null,
        )).rejects.toThrow('OpenAI image proxy endpoint is unavailable');
    });
});

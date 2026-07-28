import { beforeEach, describe, expect, it, vi } from 'vitest';

const { generateOpenAiJsonMock } = vi.hoisted(() => ({
    generateOpenAiJsonMock: vi.fn(),
}));

vi.mock('../../../src/features/image-generation-core', () => ({
    generateOpenAiJson: generateOpenAiJsonMock,
}));

import { suggestStickerConcepts } from '../../../src/features/sprite-sheet-generator/concepts';

const completePlan = {
    recommendedBackgroundColor: '#0066FF',
    backgroundColorReason: '角色沒有亮藍色，與膚色、服裝和配件有明顯色差。',
    characterSummary: '戴著藍色圍巾的橘貓角色',
    concepts: Array.from({ length: 8 }, (_, index) => ({
        theme: `用途 ${index + 1}`,
        caption: `短句${index + 1}`,
        visual: `第 ${index + 1} 種不同表情與動作`,
    })),
};

describe('OpenAI sticker concept planning', () => {
    beforeEach(() => {
        generateOpenAiJsonMock.mockReset();
        generateOpenAiJsonMock.mockResolvedValue(completePlan);
    });

    it('reserves the full proxy output budget for all 8 structured concepts', async () => {
        const result = await suggestStickerConcepts({
            provider: 'openai',
            apiKey: 'sk-test-key',
            referenceImage: 'data:image/jpeg;base64,AA==',
        });

        expect(generateOpenAiJsonMock).toHaveBeenCalledOnce();
        expect(generateOpenAiJsonMock.mock.calls[0][2]).toEqual(expect.objectContaining({
            maxOutputTokens: 4096,
        }));
        expect(result.recommendedBackgroundColor).toBe('#0066FF');
        expect(result.backgroundColorReason).toContain('明顯色差');

        const requestInput = generateOpenAiJsonMock.mock.calls[0][1][0].content[0].text;
        expect(requestInput).toContain('chroma-key background color');
        expect(requestInput).toContain('clothing, hair, skin, accessories');
    });

    it('rejects concepts that repeat an earlier batch in the same series', async () => {
        const previousConcept = completePlan.concepts[0];
        generateOpenAiJsonMock.mockResolvedValue({
            ...completePlan,
            concepts: completePlan.concepts.map((concept, index) => (
                index === 1 ? { ...concept, caption: previousConcept.caption } : concept
            )),
        });

        await expect(suggestStickerConcepts({
            provider: 'openai',
            apiKey: 'sk-test-key',
            referenceImage: 'data:image/jpeg;base64,AA==',
            previousConcepts: [previousConcept],
        })).rejects.toThrow('repeats earlier sticker content');

        const requestInput = generateOpenAiJsonMock.mock.calls[0][1][0].content[0].text;
        expect(requestInput).toContain(previousConcept.caption);
    });
});

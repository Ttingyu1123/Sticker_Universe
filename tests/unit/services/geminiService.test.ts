import { describe, it, expect, vi, beforeEach } from 'vitest';

// vi.hoisted ensures these mocks are available before vi.mock factory runs
const { mockGenerateContent, mockList } = vi.hoisted(() => ({
    mockGenerateContent: vi.fn(),
    mockList: vi.fn(),
}));

vi.mock('@google/genai', () => ({
    GoogleGenAI: vi.fn().mockImplementation(function() {
        return {
            models: {
                generateContent: mockGenerateContent,
                list: mockList,
            },
        };
    }),
}));

const { GoogleGenAI } = await import('@google/genai');
const { generateCaptions, suggestStickerPhrases, listAvailableModels } = await import(
    '../../../src/pages/Generator/services/geminiService'
);

const FAKE_API_KEY = 'AIzaFakeKey1234567890123456789012345';
const FAKE_IMAGE = 'data:image/jpeg;base64,/9j/abc123';

beforeEach(() => {
    vi.clearAllMocks();
});

describe('generateCaptions', () => {
    it('returns up to 5 parsed captions from response', async () => {
        mockGenerateContent.mockResolvedValue({
            candidates: [{
                content: {
                    parts: [{ text: '笑死\n哭阿\n真的假的\n歸剛欸\n有料' }],
                },
            }],
        });

        const captions = await generateCaptions(FAKE_API_KEY, FAKE_IMAGE);
        expect(captions).toHaveLength(5);
        expect(captions).toContain('笑死');
        expect(captions).toContain('有料');
    });

    it('splits captions by comma as well as newline', async () => {
        mockGenerateContent.mockResolvedValue({
            candidates: [{
                content: { parts: [{ text: '笑死,哭阿,真的假的' }] },
            }],
        });

        const captions = await generateCaptions(FAKE_API_KEY, FAKE_IMAGE);
        expect(captions).toHaveLength(3);
    });

    it('throws when no candidates returned', async () => {
        mockGenerateContent.mockResolvedValue({ candidates: [] });
        await expect(generateCaptions(FAKE_API_KEY, FAKE_IMAGE)).rejects.toThrow('No captions generated.');
    });

    it('throws when API call fails', async () => {
        mockGenerateContent.mockRejectedValue(new Error('API error'));
        await expect(generateCaptions(FAKE_API_KEY, FAKE_IMAGE)).rejects.toThrow('API error');
    });
});

describe('suggestStickerPhrases', () => {
    it('returns requested number of phrases', async () => {
        mockGenerateContent.mockResolvedValue({
            candidates: [{
                content: { parts: [{ text: '加油\n感謝\n謝謝\n開心\n難過\n生氣' }] },
            }],
        });

        const phrases = await suggestStickerPhrases(FAKE_API_KEY, '日常', 6);
        expect(phrases).toHaveLength(6);
    });

    it('pads with fallbacks when API returns fewer lines than requested', async () => {
        mockGenerateContent.mockResolvedValue({
            candidates: [{
                content: { parts: [{ text: '加油' }] },
            }],
        });

        const phrases = await suggestStickerPhrases(FAKE_API_KEY, '日常', 3);
        expect(phrases).toHaveLength(3);
        expect(phrases.some(p => p.startsWith('貼圖'))).toBe(true);
    });

    it('deduplicates phrases', async () => {
        mockGenerateContent.mockResolvedValue({
            candidates: [{
                content: { parts: [{ text: '加油\n加油\n加油\n感謝\n感謝' }] },
            }],
        });

        const phrases = await suggestStickerPhrases(FAKE_API_KEY, '日常', 5);
        const unique = new Set(phrases);
        expect(unique.size).toBe(phrases.length);
    });

    it('clamps count to max 32', async () => {
        const manyLines = Array(40).fill('加油').join('\n');
        mockGenerateContent.mockResolvedValue({
            candidates: [{
                content: { parts: [{ text: manyLines }] },
            }],
        });

        const phrases = await suggestStickerPhrases(FAKE_API_KEY, '日常', 100);
        expect(phrases.length).toBeLessThanOrEqual(32);
    });

    it('throws KEY_NOT_FOUND when entity not found error occurs', async () => {
        mockGenerateContent.mockRejectedValue(new Error('Requested entity was not found'));
        await expect(suggestStickerPhrases(FAKE_API_KEY, '日常', 5)).rejects.toThrow('KEY_NOT_FOUND');
    });
});

describe('GoogleGenAI singleton (getClient)', () => {
    // Use fresh keys unique to this describe block to avoid clientCache collisions
    const SINGLETON_KEY_A = 'AIzaSingletonTestKeyAAAAAAAAAAAAAAAAAAA';
    const SINGLETON_KEY_B = 'AIzaSingletonTestKeyBBBBBBBBBBBBBBBBBBB';

    it('reuses the same instance for the same apiKey across functions', async () => {
        mockGenerateContent.mockResolvedValue({
            candidates: [{ content: { parts: [{ text: '笑死' }] } }],
        });
        mockList.mockResolvedValue({ models: [] });

        await generateCaptions(SINGLETON_KEY_A, FAKE_IMAGE);
        await listAvailableModels(SINGLETON_KEY_A);

        // GoogleGenAI constructor should only be called once for the same key
        expect(GoogleGenAI).toHaveBeenCalledTimes(1);
    });

    it('creates a new instance for a different apiKey', async () => {
        mockGenerateContent.mockResolvedValue({
            candidates: [{ content: { parts: [{ text: '笑死' }] } }],
        });

        await generateCaptions(SINGLETON_KEY_B, FAKE_IMAGE);
        await generateCaptions('AIzaSingletonTestKeyCCCCCCCCCCCCCCCCCCC', FAKE_IMAGE);

        // Both are new keys not seen before, so each should create one instance
        expect(GoogleGenAI).toHaveBeenCalledTimes(2);
    });
});

describe('listAvailableModels', () => {
    it('returns model names without "models/" prefix', async () => {
        mockList.mockResolvedValue({
            models: [
                { name: 'models/gemini-1.5-pro' },
                { name: 'models/gemini-2.0-flash' },
            ],
        });

        const models = await listAvailableModels(FAKE_API_KEY);
        expect(models).toEqual(['gemini-1.5-pro', 'gemini-2.0-flash']);
    });

    it('returns empty array when models key is missing', async () => {
        mockList.mockResolvedValue({});
        const models = await listAvailableModels(FAKE_API_KEY);
        expect(models).toEqual([]);
    });

    it('returns empty array when API throws', async () => {
        mockList.mockRejectedValue(new Error('network error'));
        const models = await listAvailableModels(FAKE_API_KEY);
        expect(models).toEqual([]);
    });
});

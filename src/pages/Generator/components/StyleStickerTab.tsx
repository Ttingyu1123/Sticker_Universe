import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Upload, Wand2, Download, Sparkles, Type, Palette,
    Image as ImageIcon, Zap, Feather, Cloud, Disc, Tv, Heart,
    Scissors, AlertTriangle, Trash2, Star, Eye, FileArchive, FolderHeart, Key
} from 'lucide-react';
import JSZip from 'jszip';
import { saveStickerToDB } from '../../../db';
import { Sticker, StickerTheme, THEMES } from '../types';
import { generateSticker, suggestStickerPhrases } from '../services/geminiService';
import { Button } from '../../../components/ui/Button';
import { GalleryPicker } from '../../../components/GalleryPicker';
import { useImageShare } from '../../../hooks/useImageShare';
import { AiProvider, isApiKeyError } from '../../../shared/geminiApiKey';
import { generateOpenAiImage } from '../services/openaiImageService';
import { generateOpenAiJson } from '../services/openaiTextService';
import { useToast } from '../../../components/shared/ToastProvider';
import { ProviderSwitcher } from '../../../components/shared/ProviderSwitcher';

// Helper for Theme Icons
const getThemeIcon = (iconName: string) => {
    switch (iconName) {
        case 'Zap': return <Zap size={20} />;
        case 'Feather': return <Feather size={20} />;
        case 'Cloud': return <Cloud size={20} />;
        case 'Disc': return <Disc size={20} />;
        case 'Tv': return <Tv size={20} />;
        case 'Heart': return <Heart size={20} />;
        default: return <Sparkles size={20} />;
    }
};

interface StyleStickerTabProps {
    provider: AiProvider;
    apiKeys: Record<AiProvider, string>;
    onProviderChange: (provider: AiProvider) => void;
    onError: (error: string) => void;
    onNeedApiKey: (provider: AiProvider) => void;
}

type PromptOption = {
    id: string;
    label: string;
    prompt: string;
};

type PriorityMode = 'style' | 'semantic';
type BatchPhraseMode = 'same' | 'theme' | 'custom';

const THEME_PROMPT_OPTIONS: PromptOption[] = [
    { id: 'office', label: '社畜日常 (預設)', prompt: 'Corporate slave daily office life. tired, fake smile, coffee, deadline, overtime, salary day, want to go home.' },
    { id: 'daily', label: '日常生活', prompt: 'Daily life interactions, greeting stickers, sleeping, eating, commuting, checking phone, tiny daily struggles.' },
    { id: 'emotion', label: '喜怒哀樂', prompt: 'Exaggerated emotional expressions: happy, angry, sad, joyful, crying, laughing, shocked, eye-roll.' },
    { id: 'japan', label: '日本旅遊', prompt: 'Japan travel vibe: ramen, hot spring, kimono, shopping, taking photos, airport and luggage.' },
    { id: 'couple', label: '情侶放閃', prompt: 'Romantic couple gestures: hugging, kissing, missing you, heart eyes, sweet date moments.' },
    { id: 'lazy', label: '耍廢人生', prompt: 'Lazy life: lying in bed, couch potato, sleepy face, messy hair, snack mode, do-not-disturb.' },
    { id: 'foodie', label: '美食吃貨', prompt: 'Foodie life: drooling, huge meals, bubble tea, hungry mode, satisfied mode, midnight snack.' },
    { id: 'fitness', label: '運動健身', prompt: 'Workout and fitness: gym, running, yoga, sweat, muscles, protein shake, motivation.' },
    { id: 'cat', label: '貓奴日常', prompt: 'Cat lover life: feeding cat, litter cleaning, ignored by cat, meow, cat ears, cute paws.' },
    { id: 'dog', label: '狗派生活', prompt: 'Dog lover life: walk dog, fetch game, tail wagging, puppy eyes, loyal companion, woof.' },
    { id: 'parents', label: '新手爸媽', prompt: 'New parents life: feeding baby, changing diapers, tired eyes, baby crying, happy family.' },
    { id: 'school', label: '校園生活', prompt: 'School life: exam stress, homework, classmate interaction, graduation, teacher scolding.' },
    { id: 'festival', label: '節日慶祝', prompt: 'Festival celebration: birthday, new year, christmas, red envelope, cake, fireworks, congrats.' },
    { id: 'slang', label: '網路用語', prompt: 'Internet slang expression set: LOL, OMG, facepalm, +1, keyboard-warrior vibe.' },
    { id: 'meme', label: '迷因梗圖', prompt: 'Trending meme energy: funny pose, ironic humor, viral expression, playful sarcasm.' },
    { id: 'positive', label: '正能量語錄', prompt: 'Positive vibe sticker set: fighting, you can do it, good morning, thumbs up, cheer up.' },
    { id: 'negative', label: '負能量釋放', prompt: 'Negative energy release: social battery dead, soul leaving body, burnout, giving up.' }
];

const STICKER_PHRASES_SCHEMA = {
    type: 'object',
    additionalProperties: false,
    required: ['phrases'],
    properties: {
        phrases: {
            type: 'array',
            items: { type: 'string' },
        },
    },
};

const CUSTOM_THEME_OPTION_ID = 'custom';

const STYLE_PROMPT_OPTIONS: PromptOption[] = [
    { id: 'original', label: '原版風格', prompt: 'Keep the original style of the input character and keep design consistency.' },
    { id: 'realistic-lighting', label: '寫實光影', prompt: 'Photorealistic lighting, highly detailed textures, realistic shadows, depth of field.' },
    { id: 'japanese-anime', label: '日式漫畫', prompt: 'Japanese anime illustration, vibrant cel shading, bloom, rim light, polished finish.' },
    { id: 'american-comic', label: '美式漫畫', prompt: 'American comic style, bold outlines, heavy inking, high contrast, halftone dots.' },
    { id: 'korean-webtoon', label: '韓式漫畫', prompt: 'Korean webtoon style, smooth coloring, clean lineart, pastel volumetric lighting.' },
    { id: 'ink-painting', label: '中式水墨畫', prompt: 'Traditional Chinese ink wash painting with expressive brush strokes and negative space.' },
    { id: 'chibi', label: '可愛Q版漫畫', prompt: 'Chibi super-deformed, big head small body, soft pastel, cute sticker-ready emotion.' },
    { id: 'disney', label: '迪士尼風格動畫', prompt: 'Stylized Disney/Pixar-like animation render, appealing shape language, warm cinematic color.' },
    { id: 'pixel', label: '像素風格', prompt: '8-bit/16-bit pixel art, visible grid, limited palette, retro game sprite aesthetic.' },
    { id: 'cgi-3d', label: '3D渲染風格', prompt: 'CGI 3D render with PBR textures, volumetric light, high detail and clean render pass.' }
];

const FONT_STYLE_OPTIONS: PromptOption[] = [
    { id: 'heiti', label: '黑體 (預設)', prompt: 'Bold sans-serif, modern and clean, high legibility sticker typography.' },
    { id: 'rounded', label: '圓體 (可愛柔和)', prompt: 'Rounded sans-serif, soft edge, cute and friendly kawaii typography.' },
    { id: 'handwrite', label: '手寫體 (隨性塗鴉)', prompt: 'Handwritten marker style, casual doodle texture, personal and playful.' },
    { id: 'calligraphy', label: '書法體 (氣勢磅礡)', prompt: 'Chinese calligraphy brush style, energetic strokes and strong traditional rhythm.' },
    { id: 'pop', label: 'POP體 (活潑海報)', prompt: 'POP style bubble letters, heavy outline, vivid and bouncy poster feeling.' },
    { id: 'pixel-font', label: '像素體 (復古遊戲)', prompt: 'Pixel font, retro game-like block text with jagged digital edge.' },
    { id: 'variety', label: '綜藝體 (誇張醒目)', prompt: 'Variety-show subtitle style, extra bold, exaggerated and attention-grabbing.' },
    { id: 'kids', label: '娃娃體 (童趣可愛)', prompt: 'Childlike crayon typography, playful irregular size, naive and cute.' }
];

const THEME_CONFLICT_KEYWORDS: Record<string, string[]> = {
    office: ['上班', '開會', '加班', '薪水', '社畜', 'deadline', 'office', 'overtime'],
    japan: ['日本', '旅遊', '拉麵', '溫泉', '和服', 'japan', 'ramen', 'kimono'],
    couple: ['愛你', '想你', '抱抱', '親親', '戀愛', '約會', 'love', 'kiss', 'hug'],
    foodie: ['好餓', '吃飯', '美食', '奶茶', '宵夜', 'food', 'hungry', 'boba'],
    fitness: ['運動', '健身', '跑步', '重訓', '流汗', 'gym', 'workout', 'running'],
    cat: ['貓', '喵', '貓咪', 'cat', 'meow'],
    dog: ['狗', '汪', '狗狗', '遛狗', 'dog', 'woof'],
    school: ['考試', '作業', '上課', '老師', 'school', 'exam', 'homework'],
    festival: ['生日', '新年', '聖誕', '恭喜', '紅包', 'birthday', 'christmas', 'congrats'],
    meme: ['迷因', '梗圖', 'meme', 'lol'],
    positive: ['加油', '早安', '讚', 'you can do it', 'thumbs up'],
    negative: ['好累', '厭世', '崩潰', '社交電量', 'burnout', 'dead inside'],
};

const StyleStickerTab: React.FC<StyleStickerTabProps> = ({
    provider,
    apiKeys,
    onProviderChange,
    onNeedApiKey,
}) => {
    const { shareImage } = useImageShare();
    const { t } = useTranslation();
    const { showToast } = useToast();
    const apiKey = apiKeys[provider];
    const [currentTheme, setCurrentTheme] = useState<StickerTheme>(THEMES[0]);
    const [image, setImage] = useState<string | null>(null);
    const [selectedPhrase, setSelectedPhrase] = useState<string>('');
    const [customPhrase, setCustomPhrase] = useState<string>('');
    const [selectedStyleId, setSelectedStyleId] = useState<string>(THEMES[0].styles[0].id);
    const [selectedThemePromptId, setSelectedThemePromptId] = useState<string>(THEME_PROMPT_OPTIONS[0].id);
    const [customThemePrompt, setCustomThemePrompt] = useState<string>('');
    const [selectedStylePromptId, setSelectedStylePromptId] = useState<string>(STYLE_PROMPT_OPTIONS[0].id);
    const [selectedFontStyleId, setSelectedFontStyleId] = useState<string>(FONT_STYLE_OPTIONS[0].id);
    const [priorityMode, setPriorityMode] = useState<PriorityMode>('style');
    const [characterLock, setCharacterLock] = useState<boolean>(true);
    const [preserveComposition, setPreserveComposition] = useState<boolean>(false);
    const [variationStrength, setVariationStrength] = useState<number>(3);
    const [includeText, setIncludeText] = useState<boolean>(false);
    const [autoRemoveBg, setAutoRemoveBg] = useState<boolean>(true);
    const [batchSize, setBatchSize] = useState<number>(1);
    const [batchPhrasesText, setBatchPhrasesText] = useState<string>('');
    const [batchPhraseMode, setBatchPhraseMode] = useState<BatchPhraseMode>('theme');
    const [isSuggestingPhrases, setIsSuggestingPhrases] = useState<boolean>(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [progress, setProgress] = useState({ current: 0, total: 0 });
    const [stickers, setStickers] = useState<Sticker[]>([]);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [isZipping, setIsZipping] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [previewImage, setPreviewImage] = useState<string | null>(null);
    const [showGallery, setShowGallery] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const GEMINI_STICKER_MODEL = 'gemini-3-pro-image-preview';
    const OPENAI_STICKER_MODEL = 'gpt-image-2';

    const sanitizeFilename = (value: string) =>
        (value || 'sticker')
            .toLowerCase()
            .replace(/[^\w\u4e00-\u9fff-]+/g, '_')
            .replace(/_+/g, '_')
            .replace(/^_+|_+$/g, '')
            .slice(0, 48) || 'sticker';

    const buildSemanticLabel = (phrase: string, index: number, styleId: string) => {
        const cleanPhrase = (phrase || '').trim();
        if (cleanPhrase) return cleanPhrase;
        return `free-${currentTheme.id}-${styleId}-${index + 1}`;
    };

    const getThemeOptionLabel = (id: string) => THEME_PROMPT_OPTIONS.find(opt => opt.id === id)?.label || id;

    const buildStickerPrompt = (
        phrase: string,
        styleSnippet: string,
        includeStickerText: boolean,
        fontPrompt: string,
        mode: PriorityMode,
        lockCharacter: boolean,
        strength: number,
        keepComposition: boolean,
    ) => {
        const normalizedPhrase = (phrase || '').trim();
        const phraseForPrompt = normalizedPhrase || 'a context-appropriate sticker meaning chosen by the model';

        const priorityInstruction = mode === 'semantic'
            ? `PRIORITY MODE: MEANING FIRST
       - Prioritize clear semantic meaning and expression readability over decorative style details.
       - Style should support readability, not overpower it.`
            : `PRIORITY MODE: STYLE FIRST
       - Prioritize style fidelity, rendering quality, and visual consistency first.
       - Preserve readable expression and semantic clarity as secondary goals.`;

        const characterLockInstruction = lockCharacter
            ? `CHARACTER LOCK: ON
       - Keep identity highly consistent with the reference image (face shape, eyes, nose, mouth, hairline, hair color).
       - Avoid changing identity-defining attributes between outputs.`
            : `CHARACTER LOCK: OFF
       - Keep broad resemblance to the reference image, but allow looser character reinterpretation.`;

        const clampedVariation = Math.max(1, Math.min(5, strength));
        const variationInstruction =
            clampedVariation <= 2
                ? 'VARIATION LEVEL: LOW. Keep pose, composition, and details relatively stable.'
                : clampedVariation === 3
                    ? 'VARIATION LEVEL: MEDIUM. Balance consistency and expressive changes.'
                    : 'VARIATION LEVEL: HIGH. Allow larger pose/expression/detail variation while preserving character identity.';

        const compositionInstruction = keepComposition
            ? `COMPOSITION LOCK: ON
       - Keep pose, camera angle, framing, and subject placement close to the original reference.
       - Prefer detail/style updates over changing the overall composition.`
            : `COMPOSITION LOCK: OFF
       - You may freely choose pose, camera angle, framing, and subject placement based on the target style.`;

        const textInstruction = includeStickerText
            ? `TYPOGRAPHY:
       - ${normalizedPhrase
                ? `Overlay the Traditional Chinese text "${normalizedPhrase}" in a large, bold, playful font.`
                : 'Generate a short Traditional Chinese sticker caption (2-6 chars) that matches the expression.'}
       - The text should be clear and well-integrated into the composition.
       - Font direction: ${fontPrompt || 'Bold sans-serif with clear readability for sticker usage.'}`
            : `STRICT RULE - NO TEXT:
       - DO NOT include any text, letters, symbols, or characters in the image. 
       - Focus 100% on the character's expression and dynamic pose to convey "${phraseForPrompt}".`;

        const isStickerWithBorder = styleSnippet.includes('OFFSET BORDER');

        return `
    TASK: Create a professional illustration based on the provided character reference image.
    
    STYLE & CHARACTER:
    - ${styleSnippet}
    - ${priorityInstruction}
    - ${characterLockInstruction}
    - ${variationInstruction}
    - ${compositionInstruction}
    - FACIAL IDENTITY: Preserve the character's facial structure and features from the original photo.
    - EXPRESSION & POSE: Exaggerate the expression to match "${phraseForPrompt}".
    
    BORDER & EDGES (CRITICAL):
    ${isStickerWithBorder
                ? '- This specific style MUST have a thick, solid white sticker border.'
                : "- STRICT FORBIDDEN: DO NOT add any white border, offset, outline, or glow. The character's outermost lines must be the black ink lines or the character colors themselves, touching the green background directly."}
    
    BACKGROUND (CRITICAL CHROMA KEY):
    - The background MUST be a 100% SOLID, FLAT, PURE NEON GREEN (#00FF00). 
    - No gradients, no textures, no shadows, no background objects.
    - Think of this as a character sprite for a game engine.
    
    ${textInstruction}
    
    FINAL VALIDATION:
    - If there is a white border and the style is NOT "撖怠祕鞎潛?", the generation is WRONG.
    - For anime styles, ensure the edges are sharp and clean against the green.
  `;
    };

    const generateStickerWithProvider = async (
        sourceImage: string,
        phrase: string,
        styleSnippet: string,
        fontPrompt: string,
    ): Promise<{ imageUrl: string; prompt: string }> => {
        if (provider === 'openai') {
            const prompt = buildStickerPrompt(
                phrase,
                styleSnippet,
                includeText,
                fontPrompt,
                priorityMode,
                characterLock,
                variationStrength,
                preserveComposition,
            );

            const imageUrl = await generateOpenAiImage(
                apiKey,
                prompt,
                sourceImage,
                '1:1',
                OPENAI_STICKER_MODEL,
                'high',
            );

            return { imageUrl, prompt };
        }

        return generateSticker(
            apiKey,
            sourceImage,
            phrase,
            GEMINI_STICKER_MODEL,
            styleSnippet,
            includeText,
            fontPrompt,
            priorityMode,
            characterLock,
            variationStrength,
            preserveComposition
        );
    };

    const getPhraseConflictMessage = (phrase: string, selectedThemeId: string): string | null => {
        const normalized = phrase.trim().toLowerCase();
        if (!normalized) return null;

        const selectedKeywords = THEME_CONFLICT_KEYWORDS[selectedThemeId] || [];
        if (selectedKeywords.some((kw) => normalized.includes(kw.toLowerCase()))) {
            return null;
        }

        for (const [themeId, keywords] of Object.entries(THEME_CONFLICT_KEYWORDS)) {
            if (themeId === selectedThemeId) continue;
            if (keywords.some((kw) => normalized.includes(kw.toLowerCase()))) {
                return `台詞看起來比較像「${getThemeOptionLabel(themeId)}」，與目前主題「${getThemeOptionLabel(selectedThemeId)}」可能衝突。`;
            }
        }

        return null;
    };

    const phraseConflictMessage =
        batchSize === 1 && selectedThemePromptId !== CUSTOM_THEME_OPTION_ID
            ? getPhraseConflictMessage((customPhrase || selectedPhrase).trim(), selectedThemePromptId)
            : null;

    const parsePhraseList = (text: string) =>
        text
            .split(/[\n,]/)
            .map((item) => item.trim())
            .filter(Boolean);

    const getBatchPhrasesForCount = (count: number): string[] => {
        const manual = parsePhraseList(batchPhrasesText);
        const themeDefaults = currentTheme.phrases.map((p) => p.text).filter(Boolean);

        if (manual.length >= count) {
            return manual.slice(0, count);
        }

        const output: string[] = [...manual];
        const fallbackPool = themeDefaults.filter((p) => !output.includes(p));
        let i = 0;
        while (output.length < count) {
            const fallback = fallbackPool.length > 0
                ? fallbackPool[i % fallbackPool.length]
                : `貼圖${output.length + 1}`;
            output.push(fallback);
            i += 1;
        }
        return output;
    };

    const buildSuggestedBatchPhrases = (count: number): string[] => {
        const themeDefaults = currentTheme.phrases.map((p) => p.text).filter(Boolean);
        if (selectedThemePromptId !== CUSTOM_THEME_OPTION_ID) {
            const output = [...themeDefaults];
            let i = 0;
            while (output.length < count) {
                output.push(themeDefaults[i % Math.max(1, themeDefaults.length)] || `貼圖${output.length + 1}`);
                i += 1;
            }
            return output.slice(0, count);
        }

        const rawTopic = customThemePrompt.trim();
        const topic = rawTopic.length > 8 ? rawTopic.slice(0, 8) : rawTopic || '主題';
        const templates = ['登場', '出發', '集合', '收到', '拜託', '加油', '辛苦', '太棒了', '笑一個', '好耶', '安排', '確認', '馬上', '我來', '交給我', '完成'];
        return templates.slice(0, count).map((suffix) => `${topic}${suffix}`);
    };

    const handleAutoFillBatchPhrases = () => {
        if (batchSize <= 1) return;
        const suggested = buildSuggestedBatchPhrases(batchSize);
        setBatchPhrasesText(suggested.join('\n'));
        setBatchPhraseMode('custom');
    };

    const getThemePromptText = () =>
        selectedThemePromptId === CUSTOM_THEME_OPTION_ID
            ? customThemePrompt.trim()
            : (THEME_PROMPT_OPTIONS.find(item => item.id === selectedThemePromptId)?.prompt || '');

    const getThemeDefaultPhrases = (count: number): string[] => {
        const defaults = currentTheme.phrases.map((p) => p.text).filter(Boolean);
        const output: string[] = [];
        for (let i = 0; i < count; i++) {
            output.push(defaults[i % Math.max(1, defaults.length)] || `貼圖${i + 1}`);
        }
        return output;
    };

    const buildBatchPhrasesByMode = (count: number, singlePhrase: string): string[] => {
        if (batchPhraseMode === 'same') {
            return Array.from({ length: count }, () => singlePhrase);
        }
        if (batchPhraseMode === 'theme') {
            return getThemeDefaultPhrases(count);
        }
        return getBatchPhrasesForCount(count);
    };

    const handleAiSuggestBatchPhrases = async () => {
        if (!apiKey) {
            onNeedApiKey(provider);
            return;
        }
        if (batchSize <= 1) return;

        try {
            setIsSuggestingPhrases(true);
            if (provider === 'openai') {
                const result = await generateOpenAiJson<{ phrases: string[] }>(
                    apiKey,
                    `Theme prompt: ${getThemePromptText()}
Sticker theme: ${currentTheme.name}
Requested phrase count: ${batchSize}`,
                    {
                        instructions: 'Create short sticker phrases in Traditional Chinese suitable for chat stickers. Keep each line concise, expressive, and distinct. Return JSON only with a "phrases" array.',
                        schemaName: 'sticker_phrase_suggestions',
                        schemaDescription: 'Suggested sticker phrases for batch generation',
                        schema: STICKER_PHRASES_SCHEMA,
                        maxOutputTokens: 260,
                    },
                );
                const merged = [
                    ...(Array.isArray(result.phrases) ? result.phrases : []),
                    ...buildSuggestedBatchPhrases(batchSize),
                ]
                    .map((item) => item.trim())
                    .filter(Boolean);
                setBatchPhrasesText(merged.slice(0, batchSize).join('\n'));
                setBatchPhraseMode('custom');
                return;
            }
            const phrases = await suggestStickerPhrases(apiKey, getThemePromptText(), batchSize);
            setBatchPhrasesText(phrases.join('\n'));
            setBatchPhraseMode('custom');
        } catch (err: any) {
            if (isApiKeyError(err)) {
                onNeedApiKey(provider);
                return;
            }
            setErrorMessage(t('generator.styleSticker.errors.suggestPhrasesFailed', {
                message: err.message || t('generator.errors.unknown', { defaultValue: '未知錯誤' }),
                defaultValue: `AI 產生台詞失敗：${err.message || '未知錯誤'}`,
            }));
        } finally {
            setIsSuggestingPhrases(false);
        }
    };

    // Update selected style when theme changes
    useEffect(() => {
        setSelectedStyleId(currentTheme.styles[0].id);
        setSelectedPhrase('');
        setCustomPhrase('');
        setBatchPhrasesText('');
        setBatchPhraseMode('theme');
    }, [currentTheme]);

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setImage(reader.result as string);
                setErrorMessage(null);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files?.[0];
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setImage(reader.result as string);
                setErrorMessage(null);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleGallerySelect = async (blobs: Blob[]) => {
        if (blobs.length > 0) {
            const blob = blobs[0];
            const reader = new FileReader();
            reader.onloadend = () => {
                setImage(reader.result as string);
                setErrorMessage(null);
            };
            reader.readAsDataURL(blob);
        }
        setShowGallery(false);
    };

    // SMART REMOVE BACKGROUND LOGIC (Copied from App.tsx)
    const smartRemoveBackground = (base64: string): Promise<string> => {
        return new Promise((resolve) => {
            const img = new Image();
            img.crossOrigin = "anonymous";
            img.onload = () => {
                const width = img.width;
                const height = img.height;
                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
                ctx.drawImage(img, 0, 0);

                const imageData = ctx.getImageData(0, 0, width, height);
                const data = imageData.data;
                const isBg = new Uint8Array(width * height);

                // 1. Detect if the background is actually green
                const corners = [[0, 0], [width - 1, 0], [0, height - 1], [width - 1, height - 1]];

                // 2. Flood Fill starting from corners
                const queue: [number, number][] = [...corners as [number, number][]];
                const visited = new Uint8Array(width * height);

                const isGreen = (r: number, g: number, b: number) => {
                    return g > 80 && g > r * 1.15 && g > b * 1.15;
                };

                while (queue.length > 0) {
                    const [x, y] = queue.shift()!;
                    const idx = y * width + x;
                    if (visited[idx]) continue;
                    visited[idx] = 1;

                    const i = idx * 4;
                    if (isGreen(data[i], data[i + 1], data[i + 2])) {
                        isBg[idx] = 1;
                        if (x > 0) queue.push([x - 1, y]);
                        if (x < width - 1) queue.push([x + 1, y]);
                        if (y > 0) queue.push([x, y - 1]);
                        if (y < height - 1) queue.push([x, y + 1]);
                    }
                }

                // 3. Dilation (Halo Cleanup)
                const expandedBg = new Uint8Array(isBg);
                for (let y = 1; y < height - 1; y++) {
                    for (let x = 1; x < width - 1; x++) {
                        const idx = y * width + x;
                        if (isBg[idx] === 0) {
                            if (isBg[idx - 1] || isBg[idx + 1] || isBg[idx - width] || isBg[idx + width]) {
                                expandedBg[idx] = 1;
                            }
                        }
                    }
                }

                // 4. Final Alpha Application
                for (let i = 0; i < width * height; i++) {
                    if (expandedBg[i]) {
                        data[i * 4 + 3] = 0;
                    }
                }

                ctx.putImageData(imageData, 0, 0);
                resolve(canvas.toDataURL('image/png'));
            };
            img.src = base64;
        });
    };

    const handleGenerate = async () => {
        if (!apiKey) {
            onNeedApiKey(provider);
            return;
        }
        if (!image) {
            setErrorMessage('請先上傳圖片');
            return;
        }

        const singlePhrase = (customPhrase || selectedPhrase).trim();
        if (batchSize > 1 && batchPhraseMode === 'same' && !singlePhrase) {
            setErrorMessage('同一句模式需要先輸入台詞');
            return;
        }
        const conflictMessage =
            batchSize === 1 && selectedThemePromptId !== CUSTOM_THEME_OPTION_ID
                ? getPhraseConflictMessage(singlePhrase, selectedThemePromptId)
                : null;
        if (conflictMessage) {
            setErrorMessage(`主題衝突保護：${conflictMessage}`);
            return;
        }

        setIsGenerating(true);
        setErrorMessage(null);
        setProgress({ current: 0, total: batchSize });

        const style = currentTheme.styles.find(s => s.id === selectedStyleId) || currentTheme.styles[0];
        const themePrompt = getThemePromptText();
        const stylePrompt = STYLE_PROMPT_OPTIONS.find(item => item.id === selectedStylePromptId)?.prompt || '';
        const fontPrompt = FONT_STYLE_OPTIONS.find(item => item.id === selectedFontStyleId)?.prompt || '';
        const mergedStylePrompt = [style.promptSnippet, themePrompt, stylePrompt].filter(Boolean).join('\n');
        const batchPhrases = batchSize > 1 ? buildBatchPhrasesByMode(batchSize, singlePhrase) : [];

        try {
            for (let i = 0; i < batchSize; i++) {
                let phraseToUse = '';
                if (batchSize === 1) {
                    phraseToUse = singlePhrase;
                } else {
                    phraseToUse = batchPhrases[i] || '';
                }

                const { imageUrl: resultImageUrl, prompt: usedPrompt } = await generateStickerWithProvider(
                    image,
                    phraseToUse,
                    mergedStylePrompt,
                    fontPrompt,
                );

                let finalImageUrl = resultImageUrl;

                if (autoRemoveBg) {
                    finalImageUrl = await smartRemoveBackground(resultImageUrl);
                }

                const qcIssues = await analyzeStickerQuality(finalImageUrl);

                const semanticLabel = buildSemanticLabel(phraseToUse, i, style.id);
                const newSticker: Sticker = {
                    id: `${Date.now()}-${i}`,
                    imageUrl: finalImageUrl,
                    phrase: phraseToUse || semanticLabel,
                    semanticLabel,
                    qcIssues,
                    timestamp: Date.now(),
                    description: usedPrompt // Save the prompt!
                };

                setStickers(prev => [newSticker, ...prev]);
                setProgress(prev => ({ ...prev, current: i + 1 }));

                // Auto-save to gallery
                saveStickerToDB(newSticker).catch(err => console.error("Failed to auto-save:", err));
            }
        } catch (err: any) {
            console.error(err);
            if (isApiKeyError(err)) {
                onNeedApiKey(provider);
            } else {
                setErrorMessage(t('generator.styleSticker.errors.generateFailed', {
                    message: err.message || t('generator.errors.unknown', { defaultValue: '未知錯誤' }),
                    defaultValue: `生成失敗：${err.message || '未知錯誤'}`,
                }));
            }
        } finally {
            setIsGenerating(false);
        }
    };

    const handleIndividualBgRemoval = async (stickerId: string) => {
        const stickerToProcess = stickers.find(s => s.id === stickerId);
        if (!stickerToProcess) return;

        setIsGenerating(true);
        setErrorMessage(null);

        try {
            const processedImageUrl = await smartRemoveBackground(stickerToProcess.imageUrl);
            const updatedSticker = { ...stickerToProcess, imageUrl: processedImageUrl };
            setStickers(prev => prev.map(s => s.id === stickerId ? updatedSticker : s));
            saveStickerToDB(updatedSticker).catch(err => console.error("Failed to update sticker in DB:", err));
        } catch (err: any) {
            console.error("Failed to remove background:", err);
            setErrorMessage(`背景移除失敗：${err.message || '未知錯誤'}`);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleRegenerateSticker = async (stickerId: string) => {
        if (!apiKey) {
            onNeedApiKey(provider);
            return;
        }
        if (!image) {
            setErrorMessage('請先上傳圖片');
            return;
        }

        const target = stickers.find((s) => s.id === stickerId);
        if (!target) return;

        setIsGenerating(true);
        setErrorMessage(null);

        try {
            const style = currentTheme.styles.find(s => s.id === selectedStyleId) || currentTheme.styles[0];
            const themePrompt = getThemePromptText();
            const stylePrompt = STYLE_PROMPT_OPTIONS.find(item => item.id === selectedStylePromptId)?.prompt || '';
            const fontPrompt = FONT_STYLE_OPTIONS.find(item => item.id === selectedFontStyleId)?.prompt || '';
            const mergedStylePrompt = [style.promptSnippet, themePrompt, stylePrompt].filter(Boolean).join('\n');

            const phraseToUse = (target.phrase || target.semanticLabel || '').trim();
            const { imageUrl: resultImageUrl, prompt: usedPrompt } = await generateStickerWithProvider(
                image,
                phraseToUse,
                mergedStylePrompt,
                fontPrompt,
            );

            const finalImageUrl = autoRemoveBg ? await smartRemoveBackground(resultImageUrl) : resultImageUrl;
            const qcIssues = await analyzeStickerQuality(finalImageUrl);

            setStickers((prev) => prev.map((s) => {
                if (s.id !== stickerId) return s;
                return {
                    ...s,
                    imageUrl: finalImageUrl,
                    description: usedPrompt,
                    qcIssues,
                    timestamp: Date.now(),
                };
            }));
        } catch (err: any) {
            if (isApiKeyError(err)) {
                onNeedApiKey(provider);
                return;
            }
            setErrorMessage(t('generator.styleSticker.errors.rerollFailed', {
                message: err.message || t('generator.errors.unknown', { defaultValue: '未知錯誤' }),
                defaultValue: `重抽失敗：${err.message || '未知錯誤'}`,
            }));
        } finally {
            setIsGenerating(false);
        }
    };

    const handleDownloadImage = async (imageUrl: string, phrase: string, style: string, semanticLabel?: string) => {
        const nameLabel = sanitizeFilename(semanticLabel || phrase || style || 'sticker');
        await shareImage(imageUrl, {
            filename: `sticker_${nameLabel}`,
            metadata: {
                type: 'sticker',
                style: style,
                phrase: semanticLabel || phrase
            },
            title: '風格貼圖',
            text: `${style} - ${semanticLabel || phrase}`
        });
    };

    const analyzeStickerQuality = (base64: string): Promise<string[]> => {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext('2d', { willReadFrequently: true });
                if (!ctx) {
                    resolve([]);
                    return;
                }
                ctx.drawImage(img, 0, 0);
                const data = ctx.getImageData(0, 0, img.width, img.height).data;

                let alphaPixels = 0;
                let minX = img.width;
                let minY = img.height;
                let maxX = -1;
                let maxY = -1;

                for (let y = 0; y < img.height; y++) {
                    for (let x = 0; x < img.width; x++) {
                        const idx = (y * img.width + x) * 4 + 3;
                        if (data[idx] > 16) {
                            alphaPixels += 1;
                            if (x < minX) minX = x;
                            if (y < minY) minY = y;
                            if (x > maxX) maxX = x;
                            if (y > maxY) maxY = y;
                        }
                    }
                }

                const issues: string[] = [];
                const coverage = alphaPixels / (img.width * img.height);
                if (coverage < 0.08) issues.push('主體偏小');
                if (coverage > 0.92) issues.push('主體過滿');

                if (maxX >= 0 && maxY >= 0) {
                    const edgePadding = 3;
                    if (minX <= edgePadding || minY <= edgePadding || maxX >= img.width - 1 - edgePadding || maxY >= img.height - 1 - edgePadding) {
                        issues.push('主體貼近邊界');
                    }
                }

                resolve(issues);
            };
            img.onerror = () => resolve([]);
            img.src = base64;
        });
    };

    const downloadAllAsZip = async () => {
        if (stickers.length === 0) return;

        setIsZipping(true);
        const zip = new JSZip();
        const folder = zip.folder("stickers");

        for (const sticker of stickers) {
            try {
                const response = await fetch(sticker.imageUrl);
                const blob = await response.blob();
                const semanticName = sanitizeFilename(sticker.semanticLabel || sticker.phrase || `sticker_${sticker.id}`);
                folder?.file(`${semanticName}_${sticker.id}.png`, blob);
            } catch (error) {
                console.error(`Failed to add sticker ${sticker.id} to zip: `, error);
            }
        }

        zip.generateAsync({ type: "blob" })
            .then((content) => {
                const link = document.createElement('a');
                link.href = URL.createObjectURL(content);
                link.download = `${t('generator.action.zipName')}.zip`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            })
            .catch(err => {
                console.error("Failed to generate zip:", err);
                showToast(t('generator.styleSticker.errors.zipFailed', { defaultValue: 'ZIP 打包失敗，請稍後再試' }), 'error');
            })
            .finally(() => {
                setIsZipping(false);
            });
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                {/* Left Panel: Controls */}
                <div className="space-y-6">

                    {/* Theme Selector */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {THEMES.map(theme => (
                            <button
                                key={theme.id}
                                onClick={() => setCurrentTheme(theme)}
                                className={`flex items-center gap-3 p-3 rounded-2xl border transition-all cursor-pointer text-left ${currentTheme.id === theme.id ? `bg-white border-${theme.colors.primary.split('-')[1]}-500 shadow-md transform scale-[1.02]` : 'bg-white/40 border-cream-dark hover:bg-white hover:border-primary/30'}`}
                            >
                                <div className={`w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center text-white shadow-sm ${theme.id === currentTheme.id ? `bg-gradient-to-br ${theme.colors.secondary} to-bronze-light` : 'bg-cream-dark'}`}>
                                    {getThemeIcon(theme.icon)}
                                </div>
                                <span className={`text-xs font-black truncate ${currentTheme.id === theme.id ? theme.colors.primary : 'text-bronze-light'}`}>
                                    {t(`generator.themes.${theme.id}.name`)}
                                </span>
                            </button>
                        ))}
                    </div>

                    <div className="bg-cream backdrop-blur-md border border-cream-dark shadow-sm rounded-[2rem] p-8 space-y-6">

                        <div className="space-y-3">
                            <div className="flex items-center justify-between gap-3">
                                <label className="text-xs font-bold text-bronze-light uppercase tracking-widest">Provider</label>
                                <button
                                    type="button"
                                    onClick={() => onNeedApiKey(provider)}
                                    className="text-xs font-bold text-primary hover:text-primary-hover flex items-center gap-1"
                                >
                                    <Key size={14} />
                                    Set API Key
                                </button>
                            </div>
                            <ProviderSwitcher value={provider} onChange={onProviderChange} />
                            <p className="text-[11px] text-bronze-light">
                                {provider === 'openai' ? `Model: ${OPENAI_STICKER_MODEL}` : `Model: ${GEMINI_STICKER_MODEL}`}
                            </p>
                        </div>

                        {/* Upload */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <h2 className="text-sm font-black flex items-center gap-2 text-bronze-light uppercase tracking-widest"><ImageIcon size={18} className="text-primary" /> {t('generator.phases.upload')}</h2>
                                {image && <button onClick={() => setImage(null)} className="text-xs font-bold text-secondary hover:text-secondary-hover flex items-center gap-1 bg-secondary/10 px-3 py-1.5 rounded-lg transition-colors"><Trash2 size={12} /> {t('generator.upload.remove')}</button>}
                            </div>

                            {!image ? (
                                <div
                                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                                    onDragLeave={() => setIsDragging(false)}
                                    onDrop={handleDrop}
                                    onClick={() => fileInputRef.current?.click()}
                                    className={`group border-3 border-dashed rounded-[2rem] p-8 flex flex-col items-center justify-center cursor-pointer transition-all duration-300 min-h-[200px] ${isDragging ? 'drag-active border-primary bg-primary/10' : 'border-cream-dark bg-cream-light/50 hover:border-primary/50 hover:bg-white/60'}`}
                                >
                                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} title={t('generator.action.uploadImage')} />
                                    <div className="bg-white p-4 rounded-3xl group-hover:scale-110 transition-transform duration-500 shadow-lg shadow-primary/10 border border-cream-light text-primary mb-4">
                                        <Upload size={24} />
                                    </div>
                                    <h3 className="text-sm font-black text-bronze tracking-tight">{t('generator.upload.dragDrop')}</h3>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); setShowGallery(true); }}
                                        className="mt-3 flex items-center gap-2 px-4 py-2 bg-secondary/10 hover:bg-secondary/20 text-bronze-text rounded-xl text-sm font-bold transition-colors"
                                    >
                                        <FolderHeart size={16} />
                                        {t('printSheet.fromGallery')}
                                    </button>
                                </div>
                            ) : (
                                <div className="relative rounded-[2rem] overflow-hidden border border-cream-dark bg-cream-light/50 shadow-inner max-h-[300px] flex items-center justify-center p-4">
                                    <img src={image} alt="Preview" className="max-w-full max-h-full object-contain rounded-xl drop-shadow-xl" />
                                </div>
                            )}
                        </div>

                        {/* Style Selection */}
                        <div className="space-y-3">
                            <h2 className="text-sm font-black flex items-center gap-2 text-bronze-light uppercase tracking-widest"><Palette size={18} className={currentTheme.id === 'taiwanese' ? 'text-secondary' : 'text-primary'} /> {t('generator.phases.style')}</h2>
                            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
                                {currentTheme.styles.map((style) => (
                                    <button
                                        key={style.id}
                                        onClick={() => setSelectedStyleId(style.id)}
                                        className={`p-3 rounded-2xl border transition-all flex flex-col items-center gap-2 text-center group ${selectedStyleId === style.id ? 'bg-white border-primary shadow-inner' : 'bg-white/40 border-cream-dark hover:bg-white'}`}
                                    >
                                        <div className={`p-2 rounded-full transition-colors ${selectedStyleId === style.id ? 'bg-primary text-white shadow-md' : 'bg-cream-dark text-bronze-light'}`}>
                                            <Palette size={14} />
                                        </div>
                                        <span className={`text-[10px] font-black ${selectedStyleId === style.id ? 'text-primary' : 'text-bronze-light'}`}>{t(`generator.themes.${currentTheme.id}.styles.${style.id}.name`)}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-3">
                            <div>
                                <h2 className="text-sm font-black flex items-center gap-2 text-bronze-light uppercase tracking-widest"><Sparkles size={18} className="text-primary" /> 貼圖主題</h2>
                                <select
                                    value={selectedThemePromptId}
                                    onChange={(e) => setSelectedThemePromptId(e.target.value)}
                                    className="mt-2 w-full px-4 py-3 bg-white border border-cream-dark rounded-xl font-bold text-sm outline-none focus:border-primary text-bronze-text"
                                >
                                    {THEME_PROMPT_OPTIONS.map((opt) => (
                                        <option key={opt.id} value={opt.id}>{opt.label}</option>
                                    ))}
                                    <option value={CUSTOM_THEME_OPTION_ID}>自訂</option>
                                </select>
                                {selectedThemePromptId === CUSTOM_THEME_OPTION_ID && (
                                    <input
                                        type="text"
                                        value={customThemePrompt}
                                        onChange={(e) => setCustomThemePrompt(e.target.value)}
                                        placeholder="輸入自訂貼圖主題（例如：東方民族角色、傣族、藏族、京劇）"
                                        className="mt-2 w-full px-4 py-3 bg-cream-light border border-cream-dark rounded-xl font-bold text-xs outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 text-bronze-text shadow-inner placeholder-bronze-light"
                                    />
                                )}
                            </div>
                            <div>
                                <h2 className="text-sm font-black flex items-center gap-2 text-bronze-light uppercase tracking-widest"><Wand2 size={18} className="text-primary" /> 參考風格增強</h2>
                                <select
                                    value={selectedStylePromptId}
                                    onChange={(e) => setSelectedStylePromptId(e.target.value)}
                                    className="mt-2 w-full px-4 py-3 bg-white border border-cream-dark rounded-xl font-bold text-sm outline-none focus:border-primary text-bronze-text"
                                >
                                    {STYLE_PROMPT_OPTIONS.map((opt) => (
                                        <option key={opt.id} value={opt.id}>{opt.label}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Phrase Selection */}
                        <div className="space-y-3">
                            <h2 className="text-sm font-black flex items-center gap-2 text-bronze-light uppercase tracking-widest"><Type size={18} className={currentTheme.id === 'taiwanese' ? 'text-primary' : 'text-orange-500'} /> {t('generator.phases.phrase')}</h2>
                            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-2">
                                {currentTheme.phrases.map((phrase) => (
                                    <button
                                        key={phrase.text}
                                        onClick={() => { setSelectedPhrase(phrase.text); setCustomPhrase(''); setBatchSize(1); }}
                                        className={`p-2 rounded-xl border transition-all text-xs font-bold truncate ${selectedPhrase === phrase.text ? 'bg-primary text-white border-primary shadow-md' : 'bg-white/40 text-bronze-text border-cream-dark hover:bg-white'}`}
                                        title={phrase.text}
                                    >
                                        {phrase.text}
                                    </button>
                                ))}
                            </div>
                            <input
                                type="text"
                                value={customPhrase}
                                onChange={(e) => { setCustomPhrase(e.target.value); setSelectedPhrase(''); setBatchSize(1); }}
                                placeholder={t('generator.phrase.customPlaceholder')}
                                className="w-full px-4 py-3 bg-cream-light border border-cream-dark rounded-xl font-bold text-xs outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 text-bronze-text shadow-inner placeholder-bronze-light"
                            />
                            <div className="text-[10px] text-bronze-light space-y-1">
                                <p>台詞可留白，生成邏輯如下：</p>
                                <p>1. 有填台詞：優先使用你輸入的台詞。</p>
                                <p>2. 沒填台詞 + 包含文字開啟：依貼圖主題自動產生短台詞。</p>
                                <p>3. 自訂主題：自動台詞會配合你的自訂主題內容。</p>
                            </div>
                            {batchSize > 1 && (
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-bronze-light uppercase tracking-widest">批次台詞模式</label>
                                    <div className="grid grid-cols-3 gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setBatchPhraseMode('same')}
                                            className={`py-2 rounded-xl font-bold text-[10px] transition-all border ${batchPhraseMode === 'same' ? 'bg-primary text-white border-primary shadow-md' : 'bg-white/40 border-cream-dark text-bronze-light hover:bg-white'}`}
                                        >
                                            全部同句
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setBatchPhraseMode('theme')}
                                            className={`py-2 rounded-xl font-bold text-[10px] transition-all border ${batchPhraseMode === 'theme' ? 'bg-primary text-white border-primary shadow-md' : 'bg-white/40 border-cream-dark text-bronze-light hover:bg-white'}`}
                                        >
                                            主題自動
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setBatchPhraseMode('custom')}
                                            className={`py-2 rounded-xl font-bold text-[10px] transition-all border ${batchPhraseMode === 'custom' ? 'bg-primary text-white border-primary shadow-md' : 'bg-white/40 border-cream-dark text-bronze-light hover:bg-white'}`}
                                        >
                                            自訂清單
                                        </button>
                                    </div>
                                    {batchPhraseMode === 'custom' && (
                                        <>
                                            <div className="flex items-center justify-between">
                                                <label className="text-xs font-bold text-bronze-light uppercase tracking-widest">批次台詞清單</label>
                                                <div className="flex gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={handleAutoFillBatchPhrases}
                                                        className="px-3 py-1.5 rounded-lg bg-white border border-cream-dark text-[10px] font-bold text-bronze-text hover:bg-cream-light transition-colors"
                                                    >
                                                        一鍵補齊台詞
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={handleAiSuggestBatchPhrases}
                                                        disabled={isSuggestingPhrases}
                                                        className="px-3 py-1.5 rounded-lg bg-white border border-cream-dark text-[10px] font-bold text-bronze-text hover:bg-cream-light transition-colors disabled:opacity-60"
                                                    >
                                                        {isSuggestingPhrases ? 'AI 生成中...' : 'AI 幫想台詞'}
                                                    </button>
                                                </div>
                                            </div>
                                            <textarea
                                                value={batchPhrasesText}
                                                onChange={(e) => setBatchPhrasesText(e.target.value)}
                                                placeholder={`每行一個台詞，建議輸入 ${batchSize} 行`}
                                                rows={Math.min(8, Math.max(4, batchSize))}
                                                className="w-full px-4 py-3 bg-cream-light border border-cream-dark rounded-xl font-bold text-xs outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 text-bronze-text shadow-inner placeholder-bronze-light resize-y"
                                            />
                                        </>
                                    )}
                                    {batchPhraseMode === 'theme' && (
                                        <div className="flex items-center justify-between rounded-xl border border-cream-dark bg-cream-light/60 px-3 py-2">
                                            <span className="text-[10px] font-bold text-bronze-light">依貼圖主題自動分配台詞</span>
                                            <button
                                                type="button"
                                                onClick={handleAiSuggestBatchPhrases}
                                                disabled={isSuggestingPhrases}
                                                className="px-3 py-1 rounded-lg bg-white border border-cream-dark text-[10px] font-bold text-bronze-text hover:bg-cream-light transition-colors disabled:opacity-60"
                                            >
                                                {isSuggestingPhrases ? 'AI 生成中...' : 'AI 幫想台詞'}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}
                            {phraseConflictMessage && (
                                <p className="text-[10px] text-amber-700 flex items-center gap-1">
                                    <AlertTriangle size={10} /> {phraseConflictMessage}
                                </p>
                            )}
                        </div>

                        {/* Settings */}
                        <div className="space-y-4 pt-4 border-t border-cream-dark/50">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-bronze-light uppercase tracking-widest">文字字體風格</label>
                                <select
                                    value={selectedFontStyleId}
                                    onChange={(e) => setSelectedFontStyleId(e.target.value)}
                                    className="w-full px-4 py-3 bg-white border border-cream-dark rounded-xl font-bold text-sm outline-none focus:border-primary text-bronze-text"
                                >
                                    {FONT_STYLE_OPTIONS.map((opt) => (
                                        <option key={opt.id} value={opt.id}>{opt.label}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-bronze-light uppercase tracking-widest">優先權</label>
                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        onClick={() => setPriorityMode('style')}
                                        className={`py-2 rounded-xl font-bold text-xs transition-all border ${priorityMode === 'style' ? 'bg-primary text-white border-primary shadow-md' : 'bg-white/40 border-cream-dark text-bronze-light hover:bg-white'}`}
                                    >
                                        風格優先
                                    </button>
                                    <button
                                        onClick={() => setPriorityMode('semantic')}
                                        className={`py-2 rounded-xl font-bold text-xs transition-all border ${priorityMode === 'semantic' ? 'bg-primary text-white border-primary shadow-md' : 'bg-white/40 border-cream-dark text-bronze-light hover:bg-white'}`}
                                    >
                                        語義優先
                                    </button>
                                </div>
                            </div>

                            {/* Batch Size */}
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-bronze-light uppercase tracking-widest">{t('generator.settings.batchSize')}</label>
                                <div className="flex gap-2">
                                    {[1, 4, 8, 12, 16].map((size) => (
                                        <button
                                            key={size}
                                            onClick={() => { setBatchSize(size); }}
                                            className={`flex-1 py-2 rounded-xl font-bold text-xs transition-all border ${batchSize === size ? 'bg-primary text-white border-primary shadow-md' : 'bg-white/40 border-cream-dark text-bronze-light hover:bg-white'}`}
                                        >
                                            {size}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <label className="text-xs font-bold text-bronze-light uppercase tracking-widest">角色一致性鎖定</label>
                                    <button
                                        type="button"
                                        onClick={() => setCharacterLock(!characterLock)}
                                        className={`w-10 h-6 rounded-full relative transition-colors ${characterLock ? 'bg-primary' : 'bg-cream-dark'}`}
                                        aria-label="Toggle character lock"
                                    >
                                        <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${characterLock ? 'right-1' : 'left-1'}`} />
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <label className="text-xs font-bold text-bronze-light uppercase tracking-widest">保留姿勢/構圖</label>
                                    <button
                                        type="button"
                                        onClick={() => setPreserveComposition(!preserveComposition)}
                                        className={`w-10 h-6 rounded-full relative transition-colors ${preserveComposition ? 'bg-primary' : 'bg-cream-dark'}`}
                                        aria-label="Toggle preserve composition"
                                    >
                                        <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${preserveComposition ? 'right-1' : 'left-1'}`} />
                                    </button>
                                </div>
                                <p className="text-[10px] text-bronze-light">開啟後會盡量保留原圖姿勢與構圖，只改風格與細節。</p>
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <label className="text-xs font-bold text-bronze-light uppercase tracking-widest">變化度</label>
                                    <span className="text-xs font-bold text-bronze-text">{variationStrength}</span>
                                </div>
                                <input
                                    type="range"
                                    min={1}
                                    max={5}
                                    step={1}
                                    value={variationStrength}
                                    onChange={(e) => setVariationStrength(Number(e.target.value))}
                                    className="w-full accent-primary"
                                />
                                <p className="text-[10px] text-bronze-light">1-2 穩定一致、3 平衡、4-5 變化更大。</p>
                            </div>

                            {/* Toggles */}
                            <div className="grid grid-cols-2 gap-3">
                                <div onClick={() => setIncludeText(!includeText)} className={`flex items-center justify-between p-3 rounded-2xl border cursor-pointer transition-all ${includeText ? 'bg-white border-primary/30 shadow-sm ring-1 ring-primary/10' : 'bg-cream-light/50 border-cream-dark opacity-70'}`}>
                                    <span className="text-xs font-bold text-bronze-text">{t('generator.settings.includeText')}</span>
                                    <div className={`w-8 h-5 rounded-full relative transition-colors ${includeText ? 'bg-primary' : 'bg-cream-dark'}`}>
                                        <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all shadow-sm ${includeText ? 'right-1' : 'left-1'}`} />
                                    </div>
                                </div>
                                <div onClick={() => setAutoRemoveBg(!autoRemoveBg)} className={`flex items-center justify-between p-3 rounded-2xl border cursor-pointer transition-all ${autoRemoveBg ? 'bg-white border-primary/30 shadow-sm ring-1 ring-primary/10' : 'bg-cream-light/50 border-cream-dark opacity-70'}`}>
                                    <span className="text-xs font-bold text-bronze-text">{t('generator.settings.smartRemoveBg')}</span>
                                    <div className={`w-8 h-5 rounded-full relative transition-colors ${autoRemoveBg ? 'bg-primary' : 'bg-cream-dark'}`}>
                                        <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all shadow-sm ${autoRemoveBg ? 'right-1' : 'left-1'}`} />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Error Message */}
                        {errorMessage && (
                            <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
                                <AlertTriangle size={16} className="text-red-600 mt-0.5" />
                                <span className="text-xs font-bold text-red-600">{errorMessage}</span>
                            </div>
                        )}

                        {/* Generate Button */}
                        <Button
                            onClick={handleGenerate}
                            disabled={!image || isGenerating}
                            className="w-full text-lg h-14 shadow-xl shadow-primary/20 bg-primary hover:bg-primary-hover active:scale-[0.99] transition-all rounded-2xl border-none"
                        >
                            <Wand2 size={24} className={`mr-2 ${isGenerating ? 'animate-spin' : ''}`} />
                            {isGenerating ? t('generator.action.generating') : t('generator.action.generate')}
                        </Button>
                    </div>
                </div>

                {/* Right Panel: Results */}
                <div className="space-y-6 bg-cream backdrop-blur-md border border-cream-dark shadow-sm rounded-[2rem] p-8 h-fit">
                    <div className="flex items-center justify-between border-b border-cream-dark/50 pb-4">
                        <h2 className="text-sm font-black flex items-center gap-2 text-bronze-light uppercase tracking-widest">
                            <Star size={18} className="text-yellow-400" /> {t('generator.action.results')} ({stickers.length})
                        </h2>
                        {stickers.length > 0 && (
                            <button onClick={downloadAllAsZip} disabled={isZipping} className="bg-white hover:bg-cream-light text-bronze-text border border-cream-dark px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-sm">
                                <FileArchive size={14} /> {t('generator.action.downloadZip')}
                            </button>
                        )}
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
                        {stickers.map((sticker) => (
                            <div key={sticker.id} className="bg-white/40 backdrop-blur-md border border-cream-dark p-3 rounded-3xl group hover:shadow-xl transition-all animate-in zoom-in-95 duration-300 hover:-translate-y-1">
                                <div className="aspect-square rounded-2xl bg-cream-light/50 overflow-hidden relative border border-cream-dark/50" style={{ backgroundImage: 'radial-gradient(#d6d3d1 1px, transparent 1px)', backgroundSize: '8px 8px' }}>
                                    <img src={sticker.imageUrl} alt={sticker.phrase} className="w-full h-full object-contain p-2" />
                                    {sticker.qcIssues && sticker.qcIssues.length > 0 && (
                                        <div
                                            className="absolute top-2 left-2 z-10 px-2 py-1 rounded-lg bg-amber-100 text-amber-700 text-[10px] font-bold border border-amber-300"
                                            title={sticker.qcIssues.join('、')}
                                        >
                                            QC 警示
                                        </div>
                                    )}
                                    <div className="absolute inset-0 bg-bronze-text/10 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2 items-center justify-center backdrop-blur-[2px]">
                                        <button onClick={() => setPreviewImage(sticker.imageUrl)} className="bg-white p-2.5 rounded-full text-bronze-text shadow-lg hover:scale-110 transition-transform" title={t('generator.action.preview')}><Eye size={18} /></button>
                                        <button onClick={() => handleRegenerateSticker(sticker.id)} className="bg-white p-2.5 rounded-full text-purple-600 shadow-lg hover:scale-110 transition-transform" title="重抽這張"><Wand2 size={18} /></button>
                                        <button onClick={() => handleDownloadImage(sticker.imageUrl, sticker.phrase, currentTheme.name, sticker.semanticLabel)} className="bg-white p-2.5 rounded-full text-primary shadow-lg hover:scale-110 transition-transform active:scale-95" title={t('generator.action.download')}><Download size={18} strokeWidth={2.5} /></button>
                                        <button onClick={() => handleIndividualBgRemoval(sticker.id)} className="bg-white p-2.5 rounded-full text-secondary shadow-lg hover:scale-110 transition-transform" title={t('generator.action.removeBg')}><Scissors size={18} /></button>
                                    </div>
                                </div>
                                <div className="mt-3 text-center font-black text-bronze-text tracking-wider text-xs truncate opacity-80 px-2">{sticker.semanticLabel || sticker.phrase}</div>
                                {sticker.qcIssues && sticker.qcIssues.length > 0 && (
                                    <div className="mt-1 text-[10px] text-amber-700 text-center truncate" title={sticker.qcIssues.join('、')}>
                                        {sticker.qcIssues.join('、')}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    {stickers.length === 0 && !isGenerating && (
                        <div className="text-center py-12 px-6 rounded-3xl border-2 border-dashed border-cream-dark bg-cream-light/30">
                            <h3 className="text-bronze text-sm font-black mb-2">{t('generator.result.emptyTitle')}</h3>
                            <p className="text-xs text-bronze-light">{t('generator.result.emptyDesc')}</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Custom Loading Overlay */}
            {
                isGenerating && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-white/95 backdrop-blur-md animate-in fade-in duration-500">
                        <div className="flex flex-col items-center gap-8">
                            <div className="relative">
                                {/* Outer Ring */}
                                <div className="w-32 h-32 rounded-full border-[6px] border-primary/20"></div>
                                {/* Spinning Segment */}
                                <div className="absolute top-0 left-0 w-32 h-32 rounded-full border-[6px] border-primary border-t-transparent animate-spin duration-1000"></div>

                                {/* Icon in Center */}
                                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                                    <Sparkles size={48} className="text-primary animate-pulse" />
                                </div>
                            </div>

                            <div className="text-center space-y-3">
                                <h3 className="text-2xl font-bold text-bronze-dark tracking-wide animate-pulse">
                                    {batchSize > 1 ? `${t('generator.action.batchProcessing')} (${progress.current} /${batchSize})` : t('generator.action.generatingArt')}
                                </h3>
                                <div className="text-bronze-light font-bold text-xs tracking-wide uppercase">{t('generator.action.applyingMagic')}</div>
                                {batchSize > 1 && (
                                    <div className="w-64 bg-cream-dark h-1.5 rounded-full mt-6 overflow-hidden mx-auto">
                                        <div className="bg-gradient-to-r from-primary to-secondary h-full transition-all duration-300" style={{ width: `${(progress.current / batchSize) * 100}%` }}></div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Image Preview Modal */}
            {previewImage && (
                <div
                    className="fixed inset-0 z-[110] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in"
                    onClick={() => setPreviewImage(null)}
                >
                    <div className="relative max-w-4xl w-full max-h-[90vh] flex items-center justify-center">
                        <img
                            src={previewImage}
                            alt="Preview"
                            className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl"
                            onClick={(e) => e.stopPropagation()}
                        />
                        <button
                            className="absolute -top-12 right-0 text-white hover:text-gray-300 transition-colors"
                            onClick={() => setPreviewImage(null)}
                        >
                            <Trash2 className="hidden" /> {/* Dummy to keep import used if needed, or use X */}
                            <span className="text-xl font-bold">X {t('generator.action.close')}</span>
                        </button>
                    </div>
                </div>
            )}

            {/* Gallery Picker Modal */}
            {showGallery && (
                <GalleryPicker
                    onSelect={handleGallerySelect}
                    onClose={() => setShowGallery(false)}
                />
            )}
        </div>
    );
};

export default StyleStickerTab;




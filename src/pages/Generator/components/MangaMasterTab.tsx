import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Wand2, RefreshCw, Sparkles, Image as ImageIcon, Download, Settings2, MessageSquare, MessageSquareOff, Palette, Lightbulb, Key } from 'lucide-react';
import { LayoutSelector } from './Manga/LayoutSelector';
import { CharacterCreator } from './Manga/CharacterCreator';
import { ComicConfig, ComicLayout, ComicStyle, ColorMode, Resolution } from './Manga/types';
import { STYLE_OPTIONS, ASPECT_RATIOS, COLOR_OPTIONS, TEXT_LANGUAGES, RESOLUTION_OPTIONS } from './Manga/constants';
import { generateComicImage, optimizeStory } from '../services/geminiMangaService';
import { useImageShare } from '../../../hooks/useImageShare';
import { AiProvider } from '../../../shared/geminiApiKey';
import { generateOpenAiImage } from '../services/openaiImageService';

interface Props {
    provider: AiProvider;
    apiKeys: Record<AiProvider, string>;
    onProviderChange: (provider: AiProvider) => void;
    onNeedApiKey: (provider: AiProvider) => void;
    onSuccess: (imageUrl: string, prompt: string) => void;
    onError: (msg: string) => void;
}

const PROVIDER_LABELS: Record<AiProvider, string> = {
    gemini: 'Gemini',
    openai: 'OpenAI',
};

const GEMINI_MANGA_MODEL = 'gemini-3-pro-image-preview';
const OPENAI_MANGA_MODEL = 'gpt-image-2';

const STORY_INSPIRATIONS_BY_STYLE: Record<ComicStyle, string[]> = {
    [ComicStyle.Cute]: [
        '實習魔女與會說話的貓在小鎮開甜點店，每天用甜點解決客人的心事。',
        '三個性格不同的室友一起經營手作貼圖工作室，意外變成網路爆紅團隊。',
    ],
    [ComicStyle.American]: [
        '失敗記者獲得讀心能力，被迫揭發城市英雄聯盟背後的黑幕。',
        '退休特工重返街頭，只為找回被竊取的超能核心。',
    ],
    [ComicStyle.Anime]: [
        '轉學生其實來自未來，他必須阻止校園裡即將發生的時間災難。',
        '少年在社團倉庫發現封印古劍，從此與神祕少女共同戰鬥。',
    ],
    [ComicStyle.Horror]: [
        '社群爆紅的靈異直播主，真的拍到了不該出現的影子。',
        '小鎮每逢滿月就會重啟同一天，主角必須找出破局方式。',
    ],
    [ComicStyle.Webtoon]: [
        '人氣美食外送員白天送餐、晚上追查失蹤案件，意外捲入財團陰謀。',
        '看似普通的便利商店，半夜會接待來自不同世界的客人。',
    ],
    [ComicStyle.Ink]: [
        '落魄書生在古寺借宿，與畫中仙共同尋找失傳畫卷。',
        '江湖女俠為查滅門真相，與神祕琴師同行踏上千里路。',
    ],
    [ComicStyle.Realistic]: [
        '考古團隊在古城地下發現會改寫記憶的壁畫。',
        '颱風夜停電的大樓裡，三位陌生人被迫合作找出失蹤小孩。',
    ],
    [ComicStyle.Cyberpunk]: [
        '地下駭客偷走企業AI主腦備份，整座城市開始出現人格錯亂。',
        '改造人警探在霓虹雨夜追查器官黑市，卻發現自己也是目標。',
    ],
    [ComicStyle.Watercolor]: [
        '旅行畫家在海邊小鎮重逢童年好友，兩人一起完成未竟畫展。',
        '遺忘記憶的女孩透過一本舊日記，拼回自己的家族故事。',
    ],
    [ComicStyle.Vintage]: [
        '1990年代錄影帶店店員，意外在禁播錄影帶裡看見未來犯罪線索。',
        '老派搖滾樂團最後一場巡演，揭開成員塵封多年的秘密。',
    ],
    [ComicStyle.Flat]: [
        '新創團隊為了拯救快倒閉的APP，展開一場72小時極限改版。',
        '城市裡的匿名志工社群，在一次大型停電中完成不可能任務。',
    ],
    [ComicStyle.Photorealism]: [
        '刑警與法醫搭檔追查連環縱火案，真相指向一場被掩蓋的實驗。',
        '戰地攝影師回到故鄉後，發現照片中的陌生人竟與自己高度相似。',
    ],
};

const MangaMasterTab: React.FC<Props> = ({
    provider,
    apiKeys,
    onProviderChange,
    onNeedApiKey,
    onSuccess,
    onError,
}) => {
    const { t } = useTranslation();
    const { shareImage, isSharing } = useImageShare();
    const apiKey = apiKeys[provider];
    const [isLoading, setIsLoading] = useState(false);
    const [generatedImage, setGeneratedImage] = useState<string | null>(null);
    const [showAdvanced, setShowAdvanced] = useState(false);

    const [config, setConfig] = useState<ComicConfig>({
        layout: ComicLayout.Single,
        style: ComicStyle.Cute,
        colorMode: ColorMode.Color,
        aspectRatio: '1:1',
        theme: '',
        withText: true,
        textLanguage: 'zh-TW',
        resolution: Resolution.R1K,
        negativePrompt: '',
        characters: []
    });
    const [isOptimizing, setIsOptimizing] = useState(false);

    const applyInspiration = () => {
        const pool = STORY_INSPIRATIONS_BY_STYLE[config.style] || STORY_INSPIRATIONS_BY_STYLE[ComicStyle.Anime];
        const pick = pool[Math.floor(Math.random() * pool.length)];
        setConfig(prev => ({ ...prev, theme: pick }));
    };

    const buildFallbackStory = (rawStory: string) => {
        const panels = (() => {
            if (config.layout.includes('Eight')) return 8;
            if (config.layout.includes('Six')) return 6;
            if (config.layout.includes('Five')) return 5;
            if (config.layout.includes('Four')) return 4;
            if (config.layout.includes('Three')) return 3;
            if (config.layout.includes('Two')) return 2;
            return 1;
        })();

        const characterSummary = config.characters.length > 0
            ? config.characters.map((char) => `${char.name || 'Unnamed character'}: ${char.description || 'use uploaded visual reference'}`).join('; ')
            : 'No named characters provided.';

        const lines = Array.from({ length: panels }, (_, index) => {
            const shotType = index === 0
                ? 'establishing shot'
                : index === panels - 1
                    ? 'emotional payoff shot'
                    : 'character-focused story beat';
            return `Panel ${index + 1}: ${shotType}. Advance the story "${rawStory}" in ${config.style} with ${config.colorMode.toLowerCase()} rendering, clear composition, and strong continuity.`;
        });

        return [
            `Layout: ${config.layout}`,
            `Style: ${config.style}`,
            `Characters: ${characterSummary}`,
            ...lines,
        ].join('\n');
    };

    const buildOpenAiComicPrompt = (storyBlock: string) => {
        const characterDetails = config.characters.map((char) => {
            if (char.previewUrl) {
                return `- Character "${char.name || 'Unnamed'}": use the attached reference image and this description: ${char.description || 'Maintain recognizable identity across panels.'}`;
            }
            return `- Character "${char.name || 'Unnamed'}": ${char.description || 'Maintain consistent appearance across all panels.'}`;
        });

        const textInstruction = config.withText
            ? `Include speech bubbles and place all dialogue in ${config.textLanguage === 'zh-TW' ? 'Traditional Chinese' : config.textLanguage}. Keep text legible, concise, and naturally placed.`
            : 'Do not include speech bubbles, dialogue, captions, sound effects, or any visible text.';

        return `Generate a polished comic page illustration.

Visual Configuration:
- Layout Structure: ${config.layout}
- Art Style: ${config.style}
- Color Palette: ${config.colorMode}
- Aspect Ratio: ${config.aspectRatio}
- Target Quality: ${config.resolution}

Script and Panel Flow:
${storyBlock}

Character References:
${characterDetails.length > 0 ? characterDetails.join('\n') : '- No specific character references provided.'}

Technical Requirements:
- Follow the requested layout exactly and keep panel borders clear.
- Maintain strong character consistency across all panels.
- Use cinematic framing, readable storytelling, and high visual clarity.
- ${textInstruction}

Negative Constraints:
${config.negativePrompt ? config.negativePrompt : 'blurry, low quality, distorted anatomy, extra limbs, watermark'}
${!config.withText ? ', text, speech bubbles, letters, words' : ''}`.trim();
    };

    const handleOptimizeTheme = async () => {
        if (!apiKey) {
            onNeedApiKey(provider);
            return;
        }
        if (!config.theme.trim()) return;
        setIsOptimizing(true);
        try {
            const optimized = provider === 'openai'
                ? buildFallbackStory(config.theme)
                : await optimizeStory(apiKey, config.theme, config.layout, config.style);
            setConfig(prev => ({ ...prev, theme: optimized }));
        } catch (e: any) {
            onError(e.message);
        } finally {
            setIsOptimizing(false);
        }
    };

    const handleGenerate = async () => {
        if (!apiKey) {
            onNeedApiKey(provider);
            return;
        }
        if (!config.theme.trim()) {
            onError(t('generator.phrase.errorNoPhrase'));
            return;
        }
        setIsLoading(true);
        setGeneratedImage(null);
        const resultSection = document.getElementById('result-section');
        if (resultSection) {
            resultSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }

        try {
            const promptUsed = provider === 'openai'
                ? buildOpenAiComicPrompt(config.theme)
                : config.theme;
            const imageUrl = provider === 'openai'
                ? await generateOpenAiImage(
                    apiKey,
                    promptUsed,
                    config.characters.map((char) => char.previewUrl).filter(Boolean) as string[],
                    config.aspectRatio,
                    OPENAI_MANGA_MODEL,
                    config.resolution === Resolution.R1K ? 'medium' : 'high',
                )
                : await generateComicImage(apiKey, config);
            setGeneratedImage(imageUrl);
            onSuccess(imageUrl, `Manga: ${promptUsed.substring(0, 30)}...`);
        } catch (error: any) {
            console.error(error);
            onError(error.message || t('generator.errors.general') + "Manga");
        } finally {
            setIsLoading(false);
        }
    };

    // Scroll to result on success
    React.useEffect(() => {
        if (generatedImage) {
            const resultSection = document.getElementById('result-section');
            if (resultSection) {
                resultSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }
    }, [generatedImage]);

    const handleDownload = async () => {
        if (!generatedImage) return;

        // Determine Direction
        let direction = 'Square';
        const [w, h] = config.aspectRatio.split(':').map(Number);
        if (w > h) direction = 'Horizontal';
        if (h > w) direction = 'Vertical';

        // Determine Count (Panels)
        let count = 1;
        if (config.layout.includes('Two')) count = 2;
        if (config.layout.includes('Three')) count = 3;
        if (config.layout.includes('Four')) count = 4;
        if (config.layout.includes('Five')) count = 5;
        if (config.layout.includes('Six')) count = 6;
        if (config.layout.includes('Eight')) count = 8;

        await shareImage(generatedImage, {
            filename: 'MangaMaster',
            metadata: {
                type: 'manga',
                style: config.style,
                size: `${config.resolution}_${config.aspectRatio}`,
                direction: direction,
                count: count,
                phrase: config.theme.substring(0, 15)
            }
        });
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start animate-in fade-in duration-500">

            {/* LEFT COLUMN: Configuration */}
            <div className="lg:col-span-5 space-y-6">

                <div className="bg-cream border border-cream-dark rounded-[2rem] p-6 backdrop-blur-sm shadow-sm space-y-3">
                    <div className="flex items-center justify-between gap-3">
                        <h2 className="text-lg font-black text-bronze">Provider</h2>
                        <button
                            type="button"
                            onClick={() => onNeedApiKey(provider)}
                            className="text-xs font-bold text-primary hover:text-primary-hover flex items-center gap-1"
                        >
                            <Key size={14} />
                            Set API Key
                        </button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        {(['gemini', 'openai'] as AiProvider[]).map((option) => (
                            <button
                                key={option}
                                type="button"
                                onClick={() => onProviderChange(option)}
                                className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all ${provider === option
                                    ? 'bg-primary text-white border-primary shadow-md'
                                    : 'bg-white border-cream-dark text-bronze-text hover:bg-white/80'}`}
                            >
                                {PROVIDER_LABELS[option]}
                            </button>
                        ))}
                    </div>
                    <p className="text-[11px] text-bronze-light">
                        {provider === 'openai' ? `Model: ${OPENAI_MANGA_MODEL}` : `Model: ${GEMINI_MANGA_MODEL}`}
                    </p>
                </div>

                {/* 1. Characters Section */}
                <div className="bg-cream border border-cream-dark rounded-[2rem] p-6 backdrop-blur-sm shadow-sm">
                    <h2 className="text-lg font-black text-bronze mb-4 flex items-center gap-2">
                        <span className="bg-primary/10 text-primary w-6 h-6 rounded-full flex items-center justify-center text-xs border border-primary/20">1</span>
                        {t('generator.manga.sections.characters')}
                    </h2>
                    <CharacterCreator
                        characters={config.characters}
                        onChange={(chars) => setConfig({ ...config, characters: chars })}
                    />
                </div>

                {/* 2. Style Section */}
                <div className="bg-cream border border-cream-dark rounded-[2rem] p-6 backdrop-blur-sm shadow-sm">
                    <h2 className="text-lg font-black text-bronze mb-4 flex items-center gap-2">
                        <span className="bg-primary/10 text-primary w-6 h-6 rounded-full flex items-center justify-center text-xs border border-primary/20">2</span>
                        {t('generator.manga.sections.style')}
                    </h2>

                    {/* Color Mode Selection */}
                    <div className="flex bg-cream-light p-1 rounded-xl border border-cream-dark mb-4">
                        {COLOR_OPTIONS.map((option) => (
                            <button
                                key={option.id}
                                onClick={() => setConfig({ ...config, colorMode: option.id })}
                                className={`
                                    flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5
                                    ${config.colorMode === option.id
                                        ? 'bg-white text-primary shadow-sm ring-1 ring-black/5'
                                        : 'text-bronze-light hover:text-bronze-text hover:bg-white/50'
                                    }
                                `}
                            >
                                {option.id === ColorMode.Color && <Palette className="w-3 h-3" />}
                                {t(`generator.manga.labels.options.colors.${option.id}`)}
                            </button>
                        ))}
                    </div>

                    <div className="grid grid-cols-2 gap-3 max-h-60 overflow-y-auto pr-1 custom-scrollbar">
                        {STYLE_OPTIONS.map((option) => (
                            <button
                                key={option.id}
                                onClick={() => setConfig({ ...config, style: option.id })}
                                className={`
                                    px-3 py-2.5 rounded-xl border text-sm text-left transition-all truncate font-bold
                                    ${config.style === option.id
                                        ? 'border-primary bg-primary/5 text-primary shadow-sm'
                                        : 'border-cream-dark bg-white text-bronze-light hover:bg-cream-light hover:text-bronze-text'
                                    }
                                `}
                                title={t(`generator.manga.labels.options.styles.${option.id}`)}
                            >
                                {t(`generator.manga.labels.options.styles.${option.id}`)}
                            </button>
                        ))}
                    </div>
                </div>

                {/* 3. Layout Section */}
                <div className="bg-cream border border-cream-dark rounded-[2rem] p-6 backdrop-blur-sm shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-black text-bronze flex items-center gap-2">
                            <span className="bg-primary/10 text-primary w-6 h-6 rounded-full flex items-center justify-center text-xs border border-primary/20">3</span>
                            {t('generator.manga.sections.layout')}
                        </h2>

                        {/* Aspect Ratio Selector */}
                        <div className="flex items-center space-x-1 bg-cream-light rounded-lg p-1 border border-cream-dark">
                            {ASPECT_RATIOS.map((ratio) => (
                                <button
                                    key={ratio.id}
                                    onClick={() => setConfig({ ...config, aspectRatio: ratio.id })}
                                    className={`
                                        px-2 py-1 text-[10px] rounded font-bold transition-all
                                        ${config.aspectRatio === ratio.id
                                            ? 'bg-white text-primary shadow-sm'
                                            : 'text-bronze-light hover:text-bronze-text hover:bg-white/50'
                                        }
                                    `}
                                    title={ratio.label}
                                >
                                    {ratio.id}
                                </button>
                            ))}
                        </div>
                    </div>

                    <LayoutSelector
                        selected={config.layout}
                        onSelect={(layout) => setConfig({ ...config, layout })}
                    />
                </div>

                {/* 4. Story Section (Moved Here) */}
                <div className="bg-cream border border-cream-dark rounded-[2rem] p-6 backdrop-blur-sm shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-black text-bronze flex items-center gap-2">
                            <span className="bg-primary/10 text-primary w-6 h-6 rounded-full flex items-center justify-center text-xs border border-primary/20">4</span>
                            {t('generator.manga.sections.story')}
                        </h2>
                        <button
                            onClick={handleOptimizeTheme}
                            disabled={isOptimizing || !config.theme || !apiKey}
                            className="text-xs flex items-center space-x-1 bg-white hover:bg-cream-light text-primary border border-primary/20 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50 font-bold"
                            title={t('generator.manga.actions.optimize')}
                        >
                            {isOptimizing ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                            <span>{isOptimizing ? t('generator.manga.actions.optimizing') : t('generator.manga.actions.optimize')}</span>
                        </button>
                    </div>
                    <button
                        onClick={applyInspiration}
                        className="mb-3 text-xs flex items-center gap-1 bg-white hover:bg-cream-light text-secondary border border-secondary/30 px-3 py-1.5 rounded-lg transition-colors font-bold"
                        title="沒有靈感？幫我抽一個故事"
                    >
                        <Lightbulb className="w-3 h-3" />
                        靈感一下
                    </button>
                    <textarea
                        value={config.theme}
                        onChange={(e) => setConfig({ ...config, theme: e.target.value })}
                        placeholder={t('generator.manga.placeholders.story')}
                        className="w-full h-32 bg-white border border-cream-dark rounded-xl p-3 text-bronze-text placeholder-bronze-light/50 focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none resize-none text-sm leading-relaxed shadow-inner"
                        aria-label={t('generator.manga.sections.story')}
                    />
                </div>

                {/* Advanced Settings Accordion */}
                <div className="bg-cream border border-cream-dark rounded-[2rem] overflow-hidden backdrop-blur-sm shadow-sm">
                    <button
                        onClick={() => setShowAdvanced(!showAdvanced)}
                        className="w-full flex items-center justify-between p-4 text-left text-bronze hover:bg-cream-light transition-colors"
                    >
                        <div className="flex items-center gap-2 text-sm font-bold">
                            <Settings2 className="w-4 h-4 text-primary" />
                            {t('generator.manga.sections.advanced')}
                        </div>
                        <span className="text-xs text-bronze-light">{showAdvanced ? t('generator.manga.labels.hide') : t('generator.manga.labels.show')}</span>
                    </button>

                    {showAdvanced && (
                        <div className="p-4 pt-0 space-y-4 border-t border-cream-dark/50 animate-in slide-in-from-top-2">

                            {/* Text Toggle & Language */}
                            <div className="flex items-center justify-between mt-4">
                                <div className="flex items-center gap-2">
                                    {config.withText ? <MessageSquare className="w-4 h-4 text-bronze" /> : <MessageSquareOff className="w-4 h-4 text-bronze-light" />}
                                    <span className="text-sm font-bold text-bronze">{t('generator.manga.labels.dialogBubbles')}</span>
                                </div>

                                <div className="flex items-center gap-3">
                                    {config.withText && (
                                        <select
                                            value={config.textLanguage || 'zh-TW'}
                                            onChange={(e) => setConfig({ ...config, textLanguage: e.target.value })}
                                            className="bg-cream-light border border-cream-dark rounded-lg px-2 py-1 text-xs font-bold text-bronze-text outline-none focus:border-primary"
                                            title={t('generator.manga.labels.dialogBubbles')}
                                        >
                                            {TEXT_LANGUAGES.map(lang => (
                                                <option key={lang.id} value={lang.id}>{lang.label}</option>
                                            ))}
                                        </select>
                                    )}
                                    <button
                                        onClick={() => setConfig({ ...config, withText: !config.withText })}
                                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${config.withText ? 'bg-primary' : 'bg-cream-dark'}`}
                                        title={t('generator.manga.labels.dialogBubbles')}
                                    >
                                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${config.withText ? 'translate-x-6' : 'translate-x-1'}`} />
                                    </button>
                                </div>
                            </div>

                            {/* Resolution Selector */}
                            <div className="space-y-1">
                                <label className="text-xs text-bronze-light font-bold ml-1">{t('generator.manga.labels.outputQuality')}</label>
                                <div className="flex bg-cream-light p-1 rounded-lg border border-cream-dark">
                                    {RESOLUTION_OPTIONS.map((opt) => (
                                        <button
                                            key={opt.id}
                                            onClick={() => setConfig({ ...config, resolution: opt.id })}
                                            className={`
                                            flex-1 py-1.5 text-xs font-bold rounded-md transition-all
                                            ${config.resolution === opt.id
                                                    ? 'bg-white text-primary shadow-sm ring-1 ring-black/5'
                                                    : 'text-bronze-light hover:text-bronze-text hover:bg-white/50'
                                                }
                            `}
                                        >
                                            {t(`generator.manga.labels.options.resolutions.${opt.id}`)}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Negative Prompt */}
                            <div className="space-y-1">
                                <label className="text-xs text-bronze-light font-bold ml-1">{t('generator.manga.labels.negativePrompt')}</label>
                                <textarea
                                    value={config.negativePrompt}
                                    onChange={(e) => setConfig({ ...config, negativePrompt: e.target.value })}
                                    placeholder={t('generator.manga.placeholders.negative')}
                                    className="w-full bg-white border border-cream-dark rounded-lg p-2 text-xs text-bronze-text placeholder-bronze-light/50 focus:border-primary outline-none resize-none h-16"
                                    aria-label={t('generator.manga.labels.negativePrompt')}
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* Action Button */}
                <div className="sticky bottom-6 z-10">
                    <button
                        onClick={handleGenerate}
                        disabled={isLoading}
                        className="w-full group relative flex items-center justify-center px-8 py-4 font-black text-white transition-all duration-200 bg-primary hover:bg-primary-hover rounded-[2rem] hover:shadow-lg hover:shadow-primary/30 disabled:opacity-70 disabled:cursor-not-allowed hover:scale-[1.01] active:scale-[0.99]"
                    >
                        {isLoading ? (
                            <RefreshCw className="w-5 h-5 animate-spin mr-2" />
                        ) : (
                            <Wand2 className="w-5 h-5 mr-2 group-hover:rotate-12 transition-transform" />
                        )}
                        <span>{isLoading ? t('generator.manga.actions.generating') : t('generator.manga.actions.generate')}</span>
                    </button>
                </div>
            </div>

            {/* RIGHT COLUMN: Preview & Results */}
            <div id="result-section" className="lg:col-span-7 lg:sticky lg:top-24 min-h-[500px] flex flex-col">
                <div
                    className={`relative flex-1 bg-white border border-cream-dark rounded-[3rem] overflow-hidden shadow-xl transition-all duration-500 min-h-[600px] ${
                        !generatedImage && !isLoading ? 'border-dashed border-cream-dark bg-cream-light/30' : 'border-primary/30'
                    }`}
                >

                    {/* Empty State */}
                    {!generatedImage && !isLoading && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-bronze-light p-8 text-center">
                            <div className="w-24 h-24 bg-cream-light rounded-full flex items-center justify-center mb-6 border border-cream-dark">
                                <Sparkles className="w-10 h-10 text-bronze-light/50" />
                            </div>
                            <h3 className="text-xl font-black text-bronze mb-2">{t('generator.manga.labels.readyTitle')}</h3>
                            <p className="max-w-md text-bronze-light leading-relaxed whitespace-pre-line">
                                {t('generator.manga.labels.readyDesc')}
                            </p>
                        </div>
                    )}

                    {/* Loading State */}
                    {isLoading && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm z-20">
                            <div className="relative w-24 h-24 mb-8">
                                <div className="absolute inset-0 border-4 border-primary/30 rounded-full animate-ping"></div>
                                <div className="absolute inset-0 border-4 border-t-primary rounded-full animate-spin"></div>
                                <ImageIcon className="absolute inset-0 m-auto text-primary w-10 h-10 animate-pulse" />
                            </div>
                            <h2 className="text-2xl font-black text-bronze mb-2 animate-pulse">{t('generator.manga.labels.sketching')}</h2>
                            <p className="text-bronze-light font-bold">{t('generator.manga.labels.sketchingDesc')}</p>
                        </div>
                    )}

                    {/* Result Image */}
                    {generatedImage && (
                        <div className="relative w-full h-full min-h-[600px] bg-slate-50 flex items-center justify-center p-4">
                            <img
                                src={generatedImage}
                                alt="Generated Comic"
                                className="max-w-full h-auto max-h-[85vh] rounded-xl shadow-2xl object-contain"
                            />

                            {/* Floating Action Bar */}
                            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center space-x-3 bg-white/90 backdrop-blur-md border border-cream-dark p-2 rounded-full shadow-2xl">
                                <button
                                    onClick={() => setGeneratedImage(null)}
                                    className="p-3 hover:bg-cream-light rounded-full text-bronze-light hover:text-bronze transition-colors"
                                    title={t('generator.manga.actions.restart')}
                                >
                                    <RefreshCw className="w-5 h-5" />
                                </button>
                                <div className="w-px h-6 bg-cream-dark"></div>
                                <button
                                    onClick={handleDownload}
                                    disabled={isSharing}
                                    className="flex items-center space-x-2 px-6 py-3 bg-primary hover:bg-primary-hover text-white rounded-full font-bold transition-colors shadow-lg shadow-primary/20"
                                >
                                    {isSharing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                                    <span>{isSharing ? t('app.processing') : t('generator.manga.actions.download')}</span>
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div >
    );
};

export default MangaMasterTab;

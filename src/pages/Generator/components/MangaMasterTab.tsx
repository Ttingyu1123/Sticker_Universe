import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Wand2, RefreshCw, Sparkles, Image as ImageIcon, Download, Settings2, MessageSquare, MessageSquareOff, Palette } from 'lucide-react';
import { LayoutSelector } from './Manga/LayoutSelector';
import { CharacterCreator } from './Manga/CharacterCreator';
import { ComicConfig, ComicLayout, ComicStyle, ColorMode } from './Manga/types';
import { STYLE_OPTIONS, ASPECT_RATIOS, COLOR_OPTIONS, TEXT_LANGUAGES } from './Manga/constants';
import { generateComicImage, optimizeStory } from '../services/geminiMangaService';
import { useImageShare } from '../../../hooks/useImageShare';

interface Props {
    apiKey: string;
    onNeedApiKey: () => void;
    onSuccess: (imageUrl: string, prompt: string) => void;
    onError: (msg: string) => void;
}

const MangaMasterTab: React.FC<Props> = ({ apiKey, onNeedApiKey, onSuccess, onError }) => {
    const { t } = useTranslation();
    const { shareImage, isSharing } = useImageShare();
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
        negativePrompt: '',
        characters: []
    });
    const [isOptimizing, setIsOptimizing] = useState(false);

    const handleOptimizeTheme = async () => {
        if (!apiKey) {
            onNeedApiKey();
            return;
        }
        if (!config.theme.trim()) return;
        setIsOptimizing(true);
        try {
            const optimized = await optimizeStory(apiKey, config.theme, config.layout, config.style);
            setConfig(prev => ({ ...prev, theme: optimized }));
        } catch (e: any) {
            onError(e.message);
        } finally {
            setIsOptimizing(false);
        }
    };

    const handleGenerate = async () => {
        if (!apiKey) {
            onNeedApiKey();
            return;
        }
        if (!config.theme.trim()) {
            onError("請輸入故事描述");
            return;
        }
        setIsLoading(true);
        setGeneratedImage(null);
        window.scrollTo({ top: 0, behavior: 'smooth' }); // Scroll to top to see preview area usually

        try {
            const imageUrl = await generateComicImage(apiKey, config);
            setGeneratedImage(imageUrl);
            onSuccess(imageUrl, `Manga: ${config.theme.substring(0, 30)}...`);
        } catch (error: any) {
            console.error(error);
            onError(error.message || "產生漫畫失敗，請檢查 API Key 或重試。");
        } finally {
            setIsLoading(false);
        }
    };

    const handleDownload = async () => {
        if (!generatedImage) return;
        await shareImage(generatedImage, {
            filename: 'manga',
            metadata: {
                type: 'image',
                style: config.style,
                size: config.aspectRatio,
                phrase: config.theme.substring(0, 20)
            }
        });
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start animate-in fade-in duration-500">

            {/* LEFT COLUMN: Configuration */}
            <div className="lg:col-span-5 space-y-6">

                {/* 1. Characters Section */}
                <div className="bg-white/60 border border-cream-dark rounded-[2rem] p-6 backdrop-blur-sm shadow-sm">
                    <h2 className="text-lg font-black text-bronze mb-4 flex items-center gap-2">
                        <span className="bg-primary/10 text-primary w-6 h-6 rounded-full flex items-center justify-center text-xs border border-primary/20">1</span>
                        角色設定
                    </h2>
                    <CharacterCreator
                        characters={config.characters}
                        onChange={(chars) => setConfig({ ...config, characters: chars })}
                    />
                </div>

                {/* 2. Style Section */}
                <div className="bg-white/60 border border-cream-dark rounded-[2rem] p-6 backdrop-blur-sm shadow-sm">
                    <h2 className="text-lg font-black text-bronze mb-4 flex items-center gap-2">
                        <span className="bg-primary/10 text-primary w-6 h-6 rounded-full flex items-center justify-center text-xs border border-primary/20">2</span>
                        繪畫風格
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
                                        : 'text-bronze-light hover:text-bronze-text hover:bg-white/50'}
                `}
                            >
                                {option.id === ColorMode.Color && <Palette className="w-3 h-3" />}
                                {option.label}
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
                                        : 'border-cream-dark bg-white text-bronze-light hover:bg-cream-light hover:text-bronze-text'}
                `}
                                title={option.label}
                            >
                                {option.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* 3. Layout Section */}
                <div className="bg-white/60 border border-cream-dark rounded-[2rem] p-6 backdrop-blur-sm shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-black text-bronze flex items-center gap-2">
                            <span className="bg-primary/10 text-primary w-6 h-6 rounded-full flex items-center justify-center text-xs border border-primary/20">3</span>
                            分鏡佈局
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
                                            : 'text-bronze-light hover:text-bronze-text hover:bg-white/50'}
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
                <div className="bg-white/60 border border-cream-dark rounded-[2rem] p-6 backdrop-blur-sm shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-black text-bronze flex items-center gap-2">
                            <span className="bg-primary/10 text-primary w-6 h-6 rounded-full flex items-center justify-center text-xs border border-primary/20">4</span>
                            故事劇本
                        </h2>
                        <button
                            onClick={handleOptimizeTheme}
                            disabled={isOptimizing || !config.theme || !apiKey}
                            className="text-xs flex items-center space-x-1 bg-white hover:bg-cream-light text-primary border border-primary/20 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50 font-bold"
                            title="AI 協助分鏡"
                        >
                            {isOptimizing ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                            <span>AI 分鏡優化</span>
                        </button>
                    </div>
                    <textarea
                        value={config.theme}
                        onChange={(e) => setConfig({ ...config, theme: e.target.value })}
                        placeholder="描述你的漫畫場景：一個賽博龐克偵探走在雨夜的街道..."
                        className="w-full h-32 bg-white border border-cream-dark rounded-xl p-3 text-bronze-text placeholder-bronze-light/50 focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none resize-none text-sm leading-relaxed shadow-inner"
                    />
                </div>

                {/* Advanced Settings Accordion */}
                <div className="bg-white/60 border border-cream-dark rounded-[2rem] overflow-hidden backdrop-blur-sm shadow-sm">
                    <button
                        onClick={() => setShowAdvanced(!showAdvanced)}
                        className="w-full flex items-center justify-between p-4 text-left text-bronze hover:bg-cream-light transition-colors"
                    >
                        <div className="flex items-center gap-2 text-sm font-bold">
                            <Settings2 className="w-4 h-4 text-primary" />
                            進階設定
                        </div>
                        <span className="text-xs text-bronze-light">{showAdvanced ? '隱藏' : '顯示'}</span>
                    </button>

                    {showAdvanced && (
                        <div className="p-4 pt-0 space-y-4 border-t border-cream-dark/50 animate-in slide-in-from-top-2">

                            {/* Text Toggle & Language */}
                            <div className="flex items-center justify-between mt-4">
                                <div className="flex items-center gap-2">
                                    {config.withText ? <MessageSquare className="w-4 h-4 text-bronze" /> : <MessageSquareOff className="w-4 h-4 text-bronze-light" />}
                                    <span className="text-sm font-bold text-bronze">生成對話框</span>
                                </div>

                                <div className="flex items-center gap-3">
                                    {config.withText && (
                                        <select
                                            value={config.textLanguage || 'zh-TW'}
                                            onChange={(e) => setConfig({ ...config, textLanguage: e.target.value })}
                                            className="bg-cream-light border border-cream-dark rounded-lg px-2 py-1 text-xs font-bold text-bronze-text outline-none focus:border-primary"
                                        >
                                            {TEXT_LANGUAGES.map(lang => (
                                                <option key={lang.id} value={lang.id}>{lang.label}</option>
                                            ))}
                                        </select>
                                    )}
                                    <button
                                        onClick={() => setConfig({ ...config, withText: !config.withText })}
                                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${config.withText ? 'bg-primary' : 'bg-cream-dark'}`}
                                    >
                                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${config.withText ? 'translate-x-6' : 'translate-x-1'}`} />
                                    </button>
                                </div>
                            </div>

                            {/* Negative Prompt */}
                            <div className="space-y-1">
                                <label className="text-xs text-bronze-light font-bold ml-1">負面提示詞 (排除)</label>
                                <textarea
                                    value={config.negativePrompt}
                                    onChange={(e) => setConfig({ ...config, negativePrompt: e.target.value })}
                                    placeholder="low quality, bad anatomy, text, watermark..."
                                    className="w-full bg-white border border-cream-dark rounded-lg p-2 text-xs text-bronze-text placeholder-bronze-light/50 focus:border-primary outline-none resize-none h-16"
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
                        className="w-full group relative flex items-center justify-center px-8 py-4 font-black text-white transition-all duration-200 bg-gradient-to-r from-primary to-rose-400 rounded-[2rem] hover:shadow-lg hover:shadow-primary/30 disabled:opacity-70 disabled:cursor-not-allowed hover:scale-[1.01] active:scale-[0.99]"
                    >
                        {isLoading ? (
                            <RefreshCw className="w-5 h-5 animate-spin mr-2" />
                        ) : (
                            <Wand2 className="w-5 h-5 mr-2 group-hover:rotate-12 transition-transform" />
                        )}
                        <span>{isLoading ? '繪製漫畫中...' : '開始生成漫畫'}</span>
                    </button>
                </div>
            </div>

            {/* RIGHT COLUMN: Preview & Results */}
            <div id="result-section" className="lg:col-span-7 lg:sticky lg:top-24 min-h-[500px] flex flex-col">
                <div className={`
          relative flex-1 bg-white border border-cream-dark rounded-[3rem] overflow-hidden shadow-xl transition-all duration-500 min-h-[600px]
          ${!generatedImage && !isLoading ? 'border-dashed border-cream-dark bg-cream-light/30' : 'border-primary/30'}
        `}>

                    {/* Empty State */}
                    {!generatedImage && !isLoading && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-bronze-light p-8 text-center">
                            <div className="w-24 h-24 bg-cream-light rounded-full flex items-center justify-center mb-6 border border-cream-dark">
                                <Sparkles className="w-10 h-10 text-bronze-light/50" />
                            </div>
                            <h3 className="text-xl font-black text-bronze mb-2">準備好開始了嗎？</h3>
                            <p className="max-w-md text-bronze-light leading-relaxed">
                                在左側設定你的故事腳本、風格與角色，<br />AI 將為你繪製精彩的漫畫頁面。
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
                            <h2 className="text-2xl font-black text-bronze mb-2 animate-pulse">正在繪製漫畫...</h2>
                            <p className="text-bronze-light font-bold">AI 漫畫家正在構圖分鏡中</p>
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
                                    title="重新開始"
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
                                    <span>{isSharing ? '處理中...' : '下載作品'}</span>
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MangaMasterTab;

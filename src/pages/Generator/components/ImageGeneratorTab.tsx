import React, { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Upload, Camera, FileText, Wand2, Sparkles, ChevronDown, ChevronRight, X, Image as ImageIcon, FolderHeart } from 'lucide-react';
// @ts-ignore
import { ART_STYLES_CATEGORIES, ASPECT_RATIOS, EDITING_EXAMPLES, EXAMPLE_PROMPTS, FUNCTION_BUTTONS, TWELVE_GRID_CATEGORIES } from '../../../../constants';
import { generateImage } from '../services/geminiService';
import { Button } from '../../../components/ui/Button';
import { GalleryPicker } from '../../../components/GalleryPicker';

interface ImageGeneratorTabProps {
    apiKey: string;
    onSuccess: (imageUrl: string, prompt: string) => void;
    onError: (error: string) => void;
}

const ImageGeneratorTab: React.FC<ImageGeneratorTabProps> = ({ apiKey, onSuccess, onError }) => {
    const { t } = useTranslation();
    const [prompt, setPrompt] = useState('');
    const [aspectRatio, setAspectRatio] = useState<string>('1:1');
    const [isStyleOpen, setIsStyleOpen] = useState(false);
    const [isTwelveGridOpen, setIsTwelveGridOpen] = useState(false);
    const [isGuideOpen, setIsGuideOpen] = useState(false);
    const [referenceImage, setReferenceImage] = useState<string | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [customWidth, setCustomWidth] = useState('1280');
    const [customHeight, setCustomHeight] = useState('720');
    const [isCustomRatio, setIsCustomRatio] = useState(false);
    const [showGallery, setShowGallery] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setReferenceImage(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handlePaste = async () => {
        try {
            const items = await navigator.clipboard.read();
            for (const item of items) {
                if (item.types.includes('image/png') || item.types.includes('image/jpeg')) {
                    const blob = await item.getType(item.types.includes('image/png') ? 'image/png' : 'image/jpeg');
                    const reader = new FileReader();
                    reader.onloadend = () => setReferenceImage(reader.result as string);
                    reader.readAsDataURL(blob);
                    break;
                }
            }
        } catch (err) {
            console.error('Failed to paste image:', err);
            onError('無法從剪貼簿讀取圖片');
        }
    };

    const handleGallerySelect = async (blobs: Blob[]) => {
        if (blobs.length > 0) {
            const blob = blobs[0];
            const reader = new FileReader();
            reader.onloadend = () => {
                setReferenceImage(reader.result as string);
            };
            reader.readAsDataURL(blob);
        }
        setShowGallery(false);
    };

    const handleGenerate = async () => {
        if (!prompt && !referenceImage) {
            onError('請輸入提示詞或上傳參考圖');
            return;
        }
        if (!apiKey) {
            onError('請先設定 API Key');
            return;
        }

        setIsGenerating(true);
        setErrorMessage(null);
        try {
            const imageUrl = await generateImage(
                apiKey,
                prompt,
                referenceImage,
                aspectRatio
            );

            onSuccess(imageUrl, prompt || 'Generated Image');
        } catch (err: any) {
            let errorMessage = err.message || '生成失敗';

            // Check for 503 Overloaded error
            if (errorMessage.includes('503') || errorMessage.includes('overloaded')) {
                errorMessage = '伺服器目前忙碌中 (Model Overloaded)，由 Google Gemini API 回傳，請稍後再試。';
            } else if (errorMessage.includes('KEY_NOT_FOUND')) {
                errorMessage = '找不到有效的 API Key，請檢查設定。';
            }

            setErrorMessage(errorMessage);
            onError(errorMessage);
        } finally {
            setIsGenerating(false);
        }
    };

    const addPrompt = (text: string) => {
        setPrompt(prev => prev ? `${prev}, ${text}` : text);
    };

    const autoOptimize = () => {
        if (!prompt) return;
        setPrompt(prev => `Best quality, masterpiece, ultra high res, ${prev}, detailed lighting, 8k wallpaper`);
    };

    const luckyPrompt = () => {
        const random = EXAMPLE_PROMPTS[Math.floor(Math.random() * EXAMPLE_PROMPTS.length)];
        setPrompt(random);
    };

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                {/* Left Panel: Styles & Inspiration */}
                <div className="space-y-6 bg-white/40 backdrop-blur-md border border-cream-dark shadow-sm rounded-[2rem] p-8 h-fit">
                    <div className="flex items-center gap-2 border-b border-cream-dark/50 pb-4 mb-2">
                        <Sparkles size={18} className="text-yellow-400" />
                        <h2 className="text-sm font-black text-bronze-light uppercase tracking-widest">風格與靈感 (Styles & Inspiration)</h2>
                    </div>

                    {/* Hot Apps */}
                    <div className="space-y-3">
                        <h3 className="text-xs font-black text-primary uppercase tracking-widest pl-1">熱門應用 (Hot Apps)</h3>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                            {FUNCTION_BUTTONS.map((btn: any, idx: number) => (
                                <button
                                    key={idx}
                                    onClick={() => setPrompt(btn.prompt)}
                                    className="px-2 py-3 bg-gradient-to-br from-white to-cream-light border border-cream-dark rounded-xl text-[10px] sm:text-xs font-bold text-bronze-text shadow-sm hover:shadow-md hover:-translate-y-0.5 hover:border-primary/30 transition-all truncate"
                                    title={btn.label}
                                >
                                    {btn.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Dropdowns */}
                    <div className="space-y-3">
                        {/* 12-Grid Style Stickers */}
                        <div className="border border-cream-dark rounded-2xl bg-white/60 overflow-hidden">
                            <button
                                onClick={() => setIsTwelveGridOpen(!isTwelveGridOpen)}
                                className="w-full flex items-center justify-between p-4 text-xs font-bold text-bronze-text hover:bg-white/80 transition-colors"
                            >
                                <span>貼圖十二宮格 (12-Grid Styles)</span>
                                <ChevronDown size={16} className={`transition-transform ${isTwelveGridOpen ? 'rotate-180' : ''}`} />
                            </button>

                            {isTwelveGridOpen && (
                                <div className="p-4 border-t border-cream-dark bg-white/40 max-h-80 overflow-y-auto custom-scrollbar space-y-6">
                                    {TWELVE_GRID_CATEGORIES?.map((category: any, idx: number) => (
                                        <div key={idx} className="space-y-2">
                                            <h4 className="text-[10px] font-black text-bronze-light uppercase tracking-wider sticky top-0 bg-white/90 backdrop-blur-sm p-1 z-10 rounded-md">{category.categoryName}</h4>
                                            <div className="grid grid-cols-2 gap-2">
                                                {category.items.map((style: any, sIdx: number) => (
                                                    <button
                                                        key={sIdx}
                                                        onClick={() => { addPrompt(style.prompt); setIsTwelveGridOpen(false); }}
                                                        className="p-2 rounded-lg text-[10px] sm:text-xs text-left truncate transition-colors hover:bg-primary/10 text-bronze-light hover:text-primary border border-transparent hover:border-primary/20"
                                                        title={style.prompt}
                                                    >
                                                        {style.label}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Art Styles */}
                        <div className="border border-cream-dark rounded-2xl bg-white/60 overflow-hidden">
                            <button
                                onClick={() => setIsStyleOpen(!isStyleOpen)}
                                className="w-full flex items-center justify-between p-4 text-xs font-bold text-bronze-text hover:bg-white/80 transition-colors"
                            >
                                <span>Top100藝術風格 (Art Styles)</span>
                                <ChevronDown size={16} className={`transition-transform ${isStyleOpen ? 'rotate-180' : ''}`} />
                            </button>

                            {isStyleOpen && (
                                <div className="p-4 border-t border-cream-dark bg-white/40 max-h-80 overflow-y-auto custom-scrollbar space-y-6">
                                    {ART_STYLES_CATEGORIES.map((category: any, idx: number) => (
                                        <div key={idx} className="space-y-2">
                                            <h4 className="text-[10px] font-black text-bronze-light uppercase tracking-wider sticky top-0 bg-white/90 backdrop-blur-sm p-1 z-10 rounded-md">{category.name}</h4>
                                            <div className="grid grid-cols-2 gap-2">
                                                {category.styles.map((style: any, sIdx: number) => (
                                                    <button
                                                        key={sIdx}
                                                        onClick={() => { addPrompt(`${style.en} style`); setIsStyleOpen(false); }}
                                                        className="p-2 rounded-lg text-[10px] sm:text-xs text-left truncate transition-colors hover:bg-primary/10 text-bronze-light hover:text-primary border border-transparent hover:border-primary/20"
                                                        title={style.zh}
                                                    >
                                                        {style.zh} <span className="opacity-60 text-[9px]">({style.en})</span>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Editing Guide */}
                        <div className="border border-cream-dark rounded-2xl bg-white/60 overflow-hidden">
                            <button
                                onClick={() => setIsGuideOpen(!isGuideOpen)}
                                className="w-full flex items-center justify-between p-4 text-xs font-bold text-bronze-text hover:bg-white/80 transition-colors"
                            >
                                <span>各種改圖指南 (Modification Guide)</span>
                                <ChevronDown size={16} className={`transition-transform ${isGuideOpen ? 'rotate-180' : ''}`} />
                            </button>

                            {isGuideOpen && (
                                <div className="p-4 border-t border-cream-dark bg-white/40 space-y-4 max-h-80 overflow-y-auto custom-scrollbar">
                                    {EDITING_EXAMPLES.map((category: any, idx: number) => (
                                        <div key={idx}>
                                            <h4 className="text-[10px] font-black text-bronze-light uppercase tracking-wider mb-2 sticky top-0 bg-white/90 backdrop-blur-sm p-1 z-10 rounded-md">{category.category}</h4>
                                            <div className="grid grid-cols-1 gap-2">
                                                {category.examples.map((ex: any, eIdx: number) => (
                                                    <button
                                                        key={eIdx}
                                                        onClick={() => { addPrompt(ex.prompt); setIsGuideOpen(false); }}
                                                        className="text-left text-xs p-2 rounded-lg hover:bg-primary/10 text-bronze-text border border-transparent hover:border-primary/20 transition-all"
                                                    >
                                                        <div className="font-bold">{ex.title}</div>
                                                        <div className="text-[10px] opacity-70 truncate">{ex.prompt}</div>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Panel: Generation Controls */}
                <div className="space-y-6 bg-white/40 backdrop-blur-md border border-cream-dark shadow-sm rounded-[2rem] p-8 h-fit">
                    <div className="flex items-center gap-2 border-b border-cream-dark/50 pb-4 mb-2">
                        <Wand2 size={18} className="text-primary" />
                        <h2 className="text-sm font-black text-bronze-light uppercase tracking-widest">生成設定 (Settings)</h2>
                    </div>

                    {/* Prompt Input */}
                    <div className="space-y-3">
                        <label className="text-xs font-black text-bronze-light uppercase tracking-widest pl-1">提示詞 (Prompt)</label>
                        <textarea
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            placeholder="請輸入提示詞，或選擇左側風格..."
                            className="w-full h-32 p-4 rounded-2xl border border-cream-dark bg-cream-light text-bronze-text text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary transition-all resize-none shadow-inner placeholder-bronze-light/50"
                        />
                    </div>

                    {/* Prompt Controls */}
                    <div className="grid grid-cols-2 gap-3">
                        <button
                            onClick={autoOptimize}
                            className="flex items-center justify-center gap-2 p-3 bg-violet-600/5 hover:bg-violet-600/10 border border-violet-600/20 rounded-2xl text-violet-700 font-bold text-xs transition-all hover:scale-[1.02]"
                        >
                            <Sparkles size={16} /> 自動優化
                        </button>
                        <button
                            onClick={luckyPrompt}
                            className="flex items-center justify-center gap-2 p-3 bg-amber-600/5 hover:bg-amber-600/10 border border-amber-600/20 rounded-2xl text-amber-700 font-bold text-xs transition-all hover:scale-[1.02]"
                        >
                            <Wand2 size={16} /> 靈感提示
                        </button>
                    </div>

                    {/* Reference Image */}
                    <div className="space-y-3">
                        <div className="flex justify-between items-center pl-1">
                            <label className="text-xs font-black text-bronze-light uppercase tracking-widest">參考圖 (選填)</label>
                            {referenceImage && (
                                <button onClick={() => setReferenceImage(null)} className="text-[10px] text-red-500 hover:text-red-600 font-bold flex items-center gap-1 bg-red-50 px-2 py-1 rounded-full">
                                    <X size={12} /> 清除
                                </button>
                            )}
                        </div>

                        {!referenceImage ? (
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-cream-dark rounded-2xl hover:border-primary/50 hover:bg-white/60 transition-all text-bronze-light hover:text-primary gap-2 bg-cream-light/30"
                                >
                                    <Upload size={20} />
                                    <span className="text-xs font-bold">上傳圖片</span>
                                </button>
                                <button
                                    onClick={handlePaste}
                                    className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-cream-dark rounded-2xl hover:border-primary/50 hover:bg-white/60 transition-all text-bronze-light hover:text-primary gap-2 bg-cream-light/30"
                                >
                                    <FileText size={20} />
                                    <span className="text-xs font-bold">貼上圖片</span>
                                </button>
                                <button
                                    onClick={() => setShowGallery(true)}
                                    className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-cream-dark rounded-2xl hover:border-primary/50 hover:bg-white/60 transition-all text-bronze-light hover:text-primary gap-2 bg-cream-light/30"
                                >
                                    <FolderHeart size={20} />
                                    <span className="text-xs font-bold">從作品集</span>
                                </button>
                                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
                            </div>
                        ) : (
                            <div className="relative rounded-2xl overflow-hidden border border-cream-dark bg-black/5 aspect-video flex items-center justify-center group">
                                <img src={referenceImage} alt="Ref" className="max-w-full max-h-48 object-contain" />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                                    <span className="text-white text-xs font-bold">已載入參考圖</span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Aspect Ratio */}
                    <div className="space-y-3">
                        <label className="text-xs font-black text-bronze-light uppercase tracking-widest pl-1">長寬比例</label>
                        <div className="flex flex-wrap gap-2">
                            {ASPECT_RATIOS.map((ratio: string) => (
                                <button
                                    key={ratio}
                                    onClick={() => {
                                        setAspectRatio(ratio);
                                        setIsCustomRatio(false);
                                    }}
                                    className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all ${!isCustomRatio && aspectRatio === ratio
                                        ? 'bg-primary text-white border-primary shadow-md'
                                        : 'bg-cream-light border-cream-dark text-bronze-light hover:bg-white hover:border-primary/30'}`}
                                >
                                    {ratio}
                                </button>
                            ))}
                            <button
                                onClick={() => {
                                    setIsCustomRatio(true);
                                    setAspectRatio(`${customWidth}:${customHeight}`);
                                }}
                                className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all ${isCustomRatio
                                    ? 'bg-primary text-white border-primary shadow-md'
                                    : 'bg-cream-light border-cream-dark text-bronze-light hover:bg-white hover:border-primary/30'}`}
                            >
                                自訂
                            </button>
                        </div>

                        {isCustomRatio && (
                            <div className="grid grid-cols-2 gap-3 mt-3 animate-in fade-in slide-in-from-top-2 p-4 bg-cream-light/50 rounded-2xl border border-cream-dark/50">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-bronze-light uppercase tracking-wider pl-1">寬度 (Width)</label>
                                    <input
                                        type="number"
                                        value={customWidth}
                                        onChange={(e) => {
                                            setCustomWidth(e.target.value);
                                            setAspectRatio(`${e.target.value}:${customHeight}`);
                                        }}
                                        className="w-full p-2 text-xs rounded-xl border border-cream-dark bg-white focus:ring-2 focus:ring-primary/10 focus:border-primary transition-all text-center font-bold text-bronze-text outline-none"
                                        placeholder="1280"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-bronze-light uppercase tracking-wider pl-1">高度 (Height)</label>
                                    <input
                                        type="number"
                                        value={customHeight}
                                        onChange={(e) => {
                                            setCustomHeight(e.target.value);
                                            setAspectRatio(`${customWidth}:${e.target.value}`);
                                        }}
                                        className="w-full p-2 text-xs rounded-xl border border-cream-dark bg-white focus:ring-2 focus:ring-primary/10 focus:border-primary transition-all text-center font-bold text-bronze-text outline-none"
                                        placeholder="720"
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Generate Button */}
                    <Button
                        onClick={handleGenerate}
                        disabled={isGenerating || (!prompt && !referenceImage)}
                        className="w-full text-lg h-16 mt-4 shadow-xl shadow-primary/20 bg-primary hover:bg-primary-hover active:scale-[0.99] transition-all rounded-2xl border-none"
                    >
                        <Wand2 size={24} className={`mr-2 ${isGenerating ? 'animate-spin' : ''}`} />
                        {isGenerating ? '生成中 (Generating)...' : '開始生成圖片 (Generate)'}
                    </Button>

                    {/* Error Message Display */}
                    {
                        errorMessage && (
                            <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
                                <div className="bg-red-100 p-1.5 rounded-full mt-0.5">
                                    <X size={14} className="text-red-600" />
                                </div>
                                <div className="flex-1">
                                    <h4 className="text-xs font-bold text-red-700 mb-0.5">生成失敗 (Generation Failed)</h4>
                                    <p className="text-xs text-red-600 leading-relaxed">{errorMessage}</p>
                                </div>
                            </div>
                        )
                    }
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
                                <h3 className="text-2xl font-bold text-bronze-dark tracking-wide animate-pulse">正在生成 AI 藝術...</h3>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Gallery Picker Modal */}
            {showGallery && (
                <GalleryPicker
                    onSelect={handleGallerySelect}
                    onClose={() => setShowGallery(false)}
                />
            )}
        </div >
    );
};

export default ImageGeneratorTab;

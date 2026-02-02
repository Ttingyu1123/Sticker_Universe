import React, { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Upload, Camera, FileText, Wand2, Sparkles, ChevronDown, ChevronRight, X, Image as ImageIcon } from 'lucide-react';
// @ts-ignore
import { ART_STYLES_CATEGORIES, ASPECT_RATIOS, EDITING_EXAMPLES, EXAMPLE_PROMPTS, FUNCTION_BUTTONS, TWELVE_GRID_CATEGORIES } from '../../../../constants';
import { generateImage } from '../services/geminiService';
import { Button } from '../../../components/ui/Button';

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
        try {
            const imageUrl = await generateImage(
                apiKey,
                prompt,
                referenceImage,
                aspectRatio
            );

            onSuccess(imageUrl, prompt || 'Generated Image');
        } catch (err: any) {
            onError(err.message || '生成失敗');
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
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

            {/* Top Controls */}
            <div className="grid grid-cols-2 gap-3">
                <button
                    onClick={autoOptimize}
                    className="flex items-center justify-center gap-2 p-3 bg-violet-600/10 hover:bg-violet-600/20 border border-violet-600/30 rounded-xl text-violet-700 font-bold text-xs transition-all"
                >
                    <Sparkles size={16} /> 自動優化 (Auto Optimize)
                </button>
                <button
                    onClick={luckyPrompt}
                    className="flex items-center justify-center gap-2 p-3 bg-amber-600/10 hover:bg-amber-600/20 border border-amber-600/30 rounded-xl text-amber-700 font-bold text-xs transition-all"
                >
                    <Wand2 size={16} /> 靈感提示 (Inspiration)
                </button>
            </div>

            {/* Dropdowns */}
            <div className="space-y-3">
                {/* 12-Grid Style Stickers */}
                <div className="border border-cream-dark rounded-2xl bg-white/40 overflow-hidden">
                    <button
                        onClick={() => setIsTwelveGridOpen(!isTwelveGridOpen)}
                        className="w-full flex items-center justify-between p-4 text-xs font-bold text-bronze-text hover:bg-white/60 transition-colors"
                    >
                        <span>貼圖十二宮格：100+種爆款Prompt (12-Grid Styles)</span>
                        <ChevronDown size={16} className={`transition-transform ${isTwelveGridOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {isTwelveGridOpen && (
                        <div className="p-4 border-t border-cream-dark bg-white/60 max-h-80 overflow-y-auto custom-scrollbar space-y-6">
                            {TWELVE_GRID_CATEGORIES?.map((category: any, idx: number) => (
                                <div key={idx} className="space-y-2">
                                    <h4 className="text-[10px] font-black text-bronze-light uppercase tracking-wider sticky top-0 bg-white/80 backdrop-blur-sm p-1 z-10">{category.categoryName}</h4>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                        {category.items.map((style: any, sIdx: number) => (
                                            <button
                                                key={sIdx}
                                                onClick={() => { addPrompt(style.prompt); setIsTwelveGridOpen(false); }}
                                                className="p-2 rounded-lg text-[10px] sm:text-xs text-left truncate transition-colors hover:bg-cream-dark text-bronze-light hover:text-bronze-text border border-transparent hover:border-cream-dark"
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
                <div className="border border-cream-dark rounded-2xl bg-white/40 overflow-hidden">
                    <button
                        onClick={() => setIsStyleOpen(!isStyleOpen)}
                        className="w-full flex items-center justify-between p-4 text-xs font-bold text-bronze-text hover:bg-white/60 transition-colors"
                    >
                        <span>Top100藝術風格 (Top 100 Art Styles)</span>
                        <ChevronDown size={16} className={`transition-transform ${isStyleOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {isStyleOpen && (
                        <div className="p-4 border-t border-cream-dark bg-white/60 max-h-80 overflow-y-auto custom-scrollbar space-y-6">
                            {ART_STYLES_CATEGORIES.map((category: any, idx: number) => (
                                <div key={idx} className="space-y-2">
                                    <h4 className="text-[10px] font-black text-bronze-light uppercase tracking-wider sticky top-0 bg-white/80 backdrop-blur-sm p-1 z-10">{category.name}</h4>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                        {category.styles.map((style: any, sIdx: number) => (
                                            <button
                                                key={sIdx}
                                                onClick={() => { addPrompt(`${style.en} style`); setIsStyleOpen(false); }}
                                                className="p-2 rounded-lg text-[10px] sm:text-xs text-left truncate transition-colors hover:bg-cream-dark text-bronze-light hover:text-bronze-text border border-transparent hover:border-cream-dark"
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
                <div className="border border-cream-dark rounded-2xl bg-white/40 overflow-hidden">
                    <button
                        onClick={() => setIsGuideOpen(!isGuideOpen)}
                        className="w-full flex items-center justify-between p-4 text-xs font-bold text-bronze-text hover:bg-white/60 transition-colors"
                    >
                        <span>各種改圖指南 (Modification Guide)</span>
                        <ChevronDown size={16} className={`transition-transform ${isGuideOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {isGuideOpen && (
                        <div className="p-4 border-t border-cream-dark bg-white/60 space-y-4 max-h-80 overflow-y-auto custom-scrollbar">
                            {EDITING_EXAMPLES.map((category: any, idx: number) => (
                                <div key={idx}>
                                    <h4 className="text-[10px] font-black text-bronze-light uppercase tracking-wider mb-2 sticky top-0 bg-white/80 backdrop-blur-sm p-1 z-10">{category.category}</h4>
                                    <div className="grid grid-cols-1 gap-2">
                                        {category.examples.map((ex: any, eIdx: number) => (
                                            <button
                                                key={eIdx}
                                                onClick={() => { addPrompt(ex.prompt); setIsGuideOpen(false); }}
                                                className="text-left text-xs p-2 rounded-lg hover:bg-cream-light text-bronze-text border border-transparent hover:border-cream-dark transition-all"
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

            {/* Hot Apps */}
            <div className="space-y-2">
                <h3 className="text-xs font-black text-primary uppercase tracking-widest pl-1">熱門應用 (Hot Apps)</h3>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {FUNCTION_BUTTONS.map((btn: any, idx: number) => (
                        <button
                            key={idx}
                            onClick={() => setPrompt(btn.prompt)}
                            className="px-2 py-2 bg-gradient-to-br from-white to-cream-light border border-cream-dark rounded-xl text-[10px] sm:text-xs font-bold text-bronze-text shadow-sm hover:shadow-md hover:-translate-y-0.5 hover:border-primary/30 transition-all truncate"
                            title={btn.label}
                        >
                            {btn.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Prompt Input */}
            <div className="space-y-2">
                <label className="text-xs font-black text-bronze-light uppercase tracking-widest pl-1">提示詞 (Prompt)</label>
                <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="請輸入提示詞，或選擇上方功能..."
                    className="w-full h-24 p-4 rounded-2xl border border-cream-dark bg-white/60 text-bronze-text text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none shadow-inner"
                />
            </div>

            {/* Reference Image */}
            <div className="space-y-2">
                <div className="flex justify-between items-center pl-1">
                    <label className="text-xs font-black text-bronze-light uppercase tracking-widest">參考圖 (Reference Image)</label>
                    {referenceImage && (
                        <button onClick={() => setReferenceImage(null)} className="text-[10px] text-red-500 hover:text-red-600 font-bold flex items-center gap-1">
                            <X size={12} /> 清除圖片 (Clear)
                        </button>
                    )}
                </div>

                {!referenceImage ? (
                    <div className="grid grid-cols-2 gap-3">
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-cream-dark rounded-2xl hover:border-primary/50 hover:bg-white/50 transition-all text-bronze-light hover:text-primary gap-2"
                        >
                            <Upload size={20} />
                            <span className="text-xs font-bold">從檔案上傳 (Upload)</span>
                        </button>
                        <button
                            onClick={handlePaste}
                            className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-cream-dark rounded-2xl hover:border-primary/50 hover:bg-white/50 transition-all text-bronze-light hover:text-primary gap-2"
                        >
                            <FileText size={20} />
                            <span className="text-xs font-bold">從剪貼簿貼上 (Paste)</span>
                        </button>
                        <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
                    </div>
                ) : (
                    <div className="relative rounded-2xl overflow-hidden border border-cream-dark bg-black/5 aspect-video flex items-center justify-center">
                        <img src={referenceImage} alt="Ref" className="max-w-full max-h-48 object-contain" />
                    </div>
                )}
            </div>

            {/* Aspect Ratio */}
            <div className="space-y-2">
                <label className="text-xs font-black text-bronze-light uppercase tracking-widest pl-1">長寬比例 (Aspect Ratio)</label>
                <div className="flex flex-wrap gap-2">
                    {ASPECT_RATIOS.map((ratio: string) => (
                        <button
                            key={ratio}
                            onClick={() => setAspectRatio(ratio)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${aspectRatio === ratio ? 'bg-bronze-text text-white border-bronze-text' : 'bg-white border-cream-dark text-bronze-light hover:border-bronze-light'}`}
                        >
                            {ratio}
                        </button>
                    ))}
                </div>
            </div>

            {/* Generate Button */}
            <Button
                onClick={handleGenerate}
                disabled={isGenerating || (!prompt && !referenceImage)}
                className="w-full text-lg h-14 shadow-xl shadow-primary/20 bg-primary hover:bg-primary-hover active:scale-[0.99] transition-all rounded-2xl border-none"
            >
                <Wand2 size={24} className={`mr-2 ${isGenerating ? 'animate-spin' : ''}`} />
                {isGenerating ? '生成中... (Generating...)' : '生成圖片 (Generate)'}
            </Button>

        </div>
    );
};

export default ImageGeneratorTab;

import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Upload, Wand2, Download, Sparkles, Type, Palette,
    Image as ImageIcon, Zap, Feather, Cloud, Disc, Tv, Heart,
    Scissors, AlertTriangle, Check, Trash2, Settings, Star, Eye, FileArchive, FolderHeart
} from 'lucide-react';
import JSZip from 'jszip';
import { saveStickerToDB } from '../../../db';
import { Sticker, StickerTheme, THEMES } from '../types';
import { generateSticker } from '../services/geminiService';
import { Button } from '../../../components/ui/Button';
import { GalleryPicker } from '../../../components/GalleryPicker';

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
    apiKey: string;
    onError: (error: string) => void;
    onNeedApiKey: () => void;
}

const StyleStickerTab: React.FC<StyleStickerTabProps> = ({ apiKey, onError, onNeedApiKey }) => {
    const { t } = useTranslation();
    const [currentTheme, setCurrentTheme] = useState<StickerTheme>(THEMES[0]);
    const [image, setImage] = useState<string | null>(null);
    const [selectedPhrase, setSelectedPhrase] = useState<string>('');
    const [customPhrase, setCustomPhrase] = useState<string>('');
    const [selectedStyleId, setSelectedStyleId] = useState<string>(THEMES[0].styles[0].id);
    const [includeText, setIncludeText] = useState<boolean>(false);
    const [autoRemoveBg, setAutoRemoveBg] = useState<boolean>(true);
    const [batchSize, setBatchSize] = useState<number>(1);
    const [isGenerating, setIsGenerating] = useState(false);
    const [progress, setProgress] = useState({ current: 0, total: 0 });
    const [stickers, setStickers] = useState<Sticker[]>([]);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [isZipping, setIsZipping] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [previewImage, setPreviewImage] = useState<string | null>(null);
    const [showGallery, setShowGallery] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const STICKER_MODEL = 'gemini-3-pro-image-preview';

    // Update selected style when theme changes
    useEffect(() => {
        setSelectedStyleId(currentTheme.styles[0].id);
        setSelectedPhrase('');
        setCustomPhrase('');
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
            onNeedApiKey();
            return;
        }
        if (!image) {
            setErrorMessage("請先上傳照片！");
            return;
        }

        const singlePhrase = customPhrase || selectedPhrase;
        if (batchSize === 1 && !singlePhrase) {
            setErrorMessage("請選擇或輸入一個慣用語！");
            return;
        }

        setIsGenerating(true);
        setErrorMessage(null);
        setProgress({ current: 0, total: batchSize });

        const style = currentTheme.styles.find(s => s.id === selectedStyleId) || currentTheme.styles[0];

        try {
            for (let i = 0; i < batchSize; i++) {
                let phraseToUse = '';
                if (batchSize === 1) {
                    phraseToUse = singlePhrase;
                } else {
                    const phrases = currentTheme.phrases;
                    phraseToUse = i < phrases.length ? phrases[i].text : phrases[i % phrases.length].text;
                }

                let resultImageUrl = await generateSticker(
                    apiKey,
                    image,
                    phraseToUse,
                    STICKER_MODEL,
                    style.promptSnippet,
                    includeText
                );

                if (autoRemoveBg) {
                    resultImageUrl = await smartRemoveBackground(resultImageUrl);
                }

                const newSticker: Sticker = {
                    id: `${Date.now()}-${i}`,
                    imageUrl: resultImageUrl,
                    phrase: phraseToUse,
                    timestamp: Date.now()
                };

                setStickers(prev => [newSticker, ...prev]);
                setProgress(prev => ({ ...prev, current: i + 1 }));

                // Auto-save to gallery
                saveStickerToDB(newSticker).catch(err => console.error("Failed to auto-save:", err));
            }
        } catch (err: any) {
            console.error(err);
            if (err.message === "KEY_NOT_FOUND" || err.message?.includes("403") || err.message?.includes("401")) {
                onNeedApiKey();
            } else {
                setErrorMessage(`生成失敗，錯誤訊息: ${err.message || '未知錯誤'}`);
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
            setErrorMessage(`背景移除失敗: ${err.message || '未知錯誤'}`);
        } finally {
            setIsGenerating(false);
        }
    };

    const downloadImage = (imageUrl: string, filename: string) => {
        const link = document.createElement('a');
        link.href = imageUrl;
        link.download = `${filename.replace(/\\s/g, '_')}_sticker.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
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
                folder?.file(`${sticker.phrase.replace(/\\s/g, '_')}_${sticker.id}.png`, blob);
            } catch (error) {
                console.error(`Failed to add sticker ${sticker.id} to zip: `, error);
            }
        }

        zip.generateAsync({ type: "blob" })
            .then((content) => {
                const link = document.createElement('a');
                link.href = URL.createObjectURL(content);
                link.download = "stickers.zip";
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            })
            .catch(err => {
                console.error("Failed to generate zip:", err);
                setErrorMessage("壓縮檔案失敗。");
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

                    <div className="bg-white/40 backdrop-blur-md border border-cream-dark shadow-sm rounded-[2rem] p-8 space-y-6">

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
                                    <input ref={fileInputRef} type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                                    <div className="bg-white p-4 rounded-3xl group-hover:scale-110 transition-transform duration-500 shadow-lg shadow-primary/10 border border-cream-light text-primary mb-4">
                                        <Upload size={24} />
                                    </div>
                                    <h3 className="text-sm font-black text-bronze tracking-tight">{t('generator.upload.dragDrop')}</h3>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); setShowGallery(true); }}
                                        className="mt-3 flex items-center gap-2 px-4 py-2 bg-secondary/10 hover:bg-secondary/20 text-secondary rounded-xl text-sm font-bold transition-colors"
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
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                {currentTheme.styles.map((style) => (
                                    <button
                                        key={style.id}
                                        onClick={() => setSelectedStyleId(style.id)}
                                        className={`p-3 rounded-2xl border transition-all flex flex-col items-center gap-2 text-center group ${selectedStyleId === style.id ? `bg-white ${currentTheme.id === 'taiwanese' ? 'border-secondary' : 'border-primary'} shadow-inner` : 'bg-white/40 border-cream-dark hover:bg-white'}`}
                                    >
                                        <div className={`p-2 rounded-full transition-colors ${selectedStyleId === style.id ? `${currentTheme.id === 'taiwanese' ? 'bg-secondary' : 'bg-primary'} text-white shadow-md` : 'bg-cream-dark text-bronze-light'}`}>
                                            <Palette size={14} />
                                        </div>
                                        <span className={`text-[10px] font-black ${selectedStyleId === style.id ? (currentTheme.id === 'taiwanese' ? 'text-secondary' : 'text-primary') : 'text-bronze-light'}`}>{t(`generator.themes.${currentTheme.id}.styles.${style.id}.name`)}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Phrase Selection */}
                        <div className="space-y-3">
                            <h2 className="text-sm font-black flex items-center gap-2 text-bronze-light uppercase tracking-widest"><Type size={18} className={currentTheme.id === 'taiwanese' ? 'text-primary' : 'text-orange-500'} /> {t('generator.phases.phrase')}</h2>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                {currentTheme.phrases.map((phrase) => (
                                    <button
                                        key={phrase.text}
                                        onClick={() => { setSelectedPhrase(phrase.text); setCustomPhrase(''); setBatchSize(1); }}
                                        className={`p-2 rounded-xl border transition-all text-xs font-bold truncate ${selectedPhrase === phrase.text ? 'bg-bronze-text text-white border-bronze-text shadow-md' : 'bg-white/40 text-bronze-text border-cream-dark hover:bg-white'}`}
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
                                placeholder={t('generator.phrase.custom')}
                                className="w-full px-4 py-3 bg-cream-light border border-cream-dark rounded-xl font-bold text-xs outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 text-bronze-text shadow-inner placeholder-bronze-light"
                            />
                        </div>

                        {/* Settings */}
                        <div className="space-y-4 pt-4 border-t border-cream-dark/50">
                            {/* Batch Size */}
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-bronze-light uppercase tracking-widest">{t('generator.settings.batchSize')}</label>
                                <div className="flex gap-2">
                                    {[1, 4, 8].map((size) => (
                                        <button
                                            key={size}
                                            onClick={() => { setBatchSize(size); }}
                                            className={`flex-1 py-2 rounded-xl font-bold text-xs transition-all border ${batchSize === size ? 'bg-bronze-text text-white border-bronze-text shadow-md' : 'bg-white/40 border-cream-dark text-bronze-light hover:bg-white'}`}
                                            disabled={size > 1 && !!(selectedPhrase || customPhrase)}
                                        >
                                            {size}
                                        </button>
                                    ))}
                                </div>
                                {(selectedPhrase || customPhrase) && (
                                    <p className="text-[10px] text-bronze-light flex items-center gap-1"><AlertTriangle size={10} /> {t('generator.settings.batchBatchWarning')}</p>
                                )}
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
                            disabled={!image || (batchSize === 1 && !selectedPhrase && !customPhrase) || isGenerating}
                            className="w-full text-lg h-14 shadow-xl shadow-primary/20 bg-primary hover:bg-primary-hover active:scale-[0.99] transition-all rounded-2xl border-none"
                        >
                            <Wand2 size={24} className={`mr-2 ${isGenerating ? 'animate-spin' : ''}`} />
                            {isGenerating ? t('generator.action.generating') : t('generator.action.generate')}
                        </Button>
                    </div>
                </div>

                {/* Right Panel: Results */}
                <div className="space-y-6 bg-white/40 backdrop-blur-md border border-cream-dark shadow-sm rounded-[2rem] p-8 h-fit">
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

                    <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                        {stickers.map((sticker) => (
                            <div key={sticker.id} className="bg-white/40 backdrop-blur-md border border-cream-dark p-3 rounded-3xl group hover:shadow-xl transition-all animate-in zoom-in-95 duration-300 hover:-translate-y-1">
                                <div className="aspect-square rounded-2xl bg-cream-light/50 overflow-hidden relative border border-cream-dark/50" style={{ backgroundImage: 'radial-gradient(#d6d3d1 1px, transparent 1px)', backgroundSize: '8px 8px' }}>
                                    <img src={sticker.imageUrl} alt={sticker.phrase} className="w-full h-full object-contain p-2" />
                                    <div className="absolute inset-0 bg-bronze-text/10 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2 items-center justify-center backdrop-blur-[2px]">
                                        <button onClick={() => setPreviewImage(sticker.imageUrl)} className="bg-white p-2.5 rounded-full text-bronze-text shadow-lg hover:scale-110 transition-transform" title={t('generator.action.preview')}><Eye size={18} /></button>
                                        <button onClick={() => downloadImage(sticker.imageUrl, sticker.phrase)} className="bg-white p-2.5 rounded-full text-primary shadow-lg hover:scale-110 transition-transform" title={t('generator.action.download')}><Download size={18} /></button>
                                        <button onClick={() => handleIndividualBgRemoval(sticker.id)} className="bg-white p-2.5 rounded-full text-secondary shadow-lg hover:scale-110 transition-transform" title={t('generator.action.removeBg')}><Scissors size={18} /></button>
                                    </div>
                                </div>
                                <div className="mt-3 text-center font-black text-bronze-text tracking-wider text-xs truncate opacity-80 px-2">{sticker.phrase}</div>
                            </div>
                        ))}
                    </div>

                    {stickers.length === 0 && !isGenerating && (
                        <div className="text-center py-12 px-6 rounded-3xl border-2 border-dashed border-cream-dark bg-cream-light/30">
                            <h3 className="text-bronze text-sm font-black mb-2">準備開始製作！</h3>
                            <p className="text-xs text-bronze-light">請在左側選擇主題與風格，AI 將為您生成獨一無二的貼圖。</p>
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
                            <span className="text-xl font-bold">✕ 關閉</span>
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

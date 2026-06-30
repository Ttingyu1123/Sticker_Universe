import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { X, Download, Image as ImageIcon, Trash2, ZoomIn, ZoomOut, Edit2, Check, Wand2, RotateCw, Scaling, Plus, FolderHeart, Save, Star, Key, Sparkles, Type } from 'lucide-react';
import { AspectRatio, CollageSettings, LayoutType, UploadedImage } from './types';
import { Controls } from './components/Controls';
import { PhotoCanvas, PhotoCanvasHandle } from './components/PhotoCanvas';
import { generateImage } from './geminiService';
import { generateOpenAiImage } from '../Generator/services/openaiImageService';
import { calculateFrames, getCanvasDimensions } from './utils/geometry';
import { useTranslation } from 'react-i18next';
import { GalleryPicker } from '../../components/GalleryPicker';
import { saveStickerToDB } from '../../db';
import { AiProvider, clearApiKey, getApiKeyUrl, isValidApiKey, loadApiKey, saveApiKey } from '../../shared/geminiApiKey';

const BASE_EXPORT_WIDTH = 1200;
const EXPORT_SIZE_OPTIONS = [
    { label: '1024 px', width: 1024 },
    { label: '1200 px', width: 1200 },
    { label: '1600 px', width: 1600 },
    { label: '2048 px', width: 2048 },
    { label: '3000 px', width: 3000 },
];
const MIN_EXPORT_WIDTH = 512;
const MAX_EXPORT_WIDTH = 6000;
const AUTO_AVOID_BLANK_CANDIDATES: LayoutType[] = [
    LayoutType.GRID,
    LayoutType.MASONRY,
    LayoutType.HORIZONTAL,
    LayoutType.VERTICAL,
    LayoutType.CENTER,
    LayoutType.L_LEFT,
    LayoutType.L_RIGHT,
    LayoutType.T_SHAPE,
    LayoutType.CROSS_FOCUS,
];

const PROVIDER_LABELS: Record<AiProvider, string> = {
    gemini: 'Gemini',
    openai: 'OpenAI',
};

const GEMINI_COLLAGE_MODEL = 'gemini-3-pro-image-preview';
const OPENAI_COLLAGE_MODEL = 'gpt-image-2';

export const AutoCollageTab: React.FC = () => {
    const { t } = useTranslation();
    const [images, setImages] = useState<UploadedImage[]>([]);
    const [editorMode, setEditorMode] = useState<'collage' | 'single'>('collage');
    const [selectedImageId, setSelectedImageId] = useState<string | null>(null);
    const [settings, setSettings] = useState<CollageSettings>({
        layout: LayoutType.GRID,
        autoAvoidBlank: false,
        autoAvoidBlankThreshold: 0.12,
        ratio: AspectRatio.SQUARE,
        gap: 10,
        padding: 20,
        cornerRadius: 0,
        shadow: 0,
        frameStyle: 'normal',
        backgroundColor: '#ffffff',
        customGradientEnabled: false,
        customGradientStart: '#ff9a9e',
        customGradientEnd: '#fecfef',
        customGradientDirection: 'diagonal',
        customRatioW: 4,
        customRatioH: 5,
    });

    // AI State
    const [isAiLoading, setIsAiLoading] = useState(false);
    const [prompt, setPrompt] = useState<string>('');
    const [showAiModal, setShowAiModal] = useState(false);

    // Gallery State
    const [showGalleryPicker, setShowGalleryPicker] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [exportWidth, setExportWidth] = useState<number>(1200);
    const [isCustomExport, setIsCustomExport] = useState(false);

    // Zoom State
    const [zoomLevel, setZoomLevel] = useState(1);
    const handleZoomIn = () => setZoomLevel(prev => Math.min(prev + 0.1, 3));
    const handleZoomOut = () => setZoomLevel(prev => Math.max(prev - 0.1, 0.1));
    const resetZoom = () => setZoomLevel(1);

    // Download State
    const canvasRef = useRef<PhotoCanvasHandle>(null);

    // API Key State
    const [provider, setProvider] = useState<AiProvider>('gemini');
    const [providerKeys, setProviderKeys] = useState<Record<AiProvider, string>>({ gemini: '', openai: '' });
    const [showKeyModal, setShowKeyModal] = useState(false);
    const [keyProvider, setKeyProvider] = useState<AiProvider>('gemini');
    const [tempKey, setTempKey] = useState('');

    // History State
    const [, setHistory] = useState<{
        past: { images: UploadedImage[], settings: CollageSettings }[];
        future: { images: UploadedImage[], settings: CollageSettings }[];
    }>({ past: [], future: [] });

    const saveCheckpoint = useCallback(() => {
        setHistory(prev => ({
            past: [...prev.past, { images: [...images], settings: { ...settings } }],
            future: []
        }));
    }, [images, settings]);

    const undo = useCallback(() => {
        setHistory(prev => {
            if (prev.past.length === 0) return prev;
            const newPast = [...prev.past];
            const previousState = newPast.pop()!;

            setImages(previousState.images);
            setSettings(previousState.settings);

            return {
                past: newPast,
                future: [{ images, settings }, ...prev.future]
            };
        });
    }, [images, settings]);

    const redo = useCallback(() => {
        setHistory(prev => {
            if (prev.future.length === 0) return prev;
            const newFuture = [...prev.future];
            const nextState = newFuture.shift()!;

            setImages(nextState.images);
            setSettings(nextState.settings);

            return {
                past: [...prev.past, { images, settings }],
                future: newFuture
            };
        });
    }, [images, settings]);

    // Keyboard Shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

            if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
                if (e.shiftKey) redo();
                else undo();
                e.preventDefault();
            }
            if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
                redo();
                e.preventDefault();
            }
            if (e.key === 'Delete' || e.key === 'Backspace') {
                if (selectedImageId) {
                    saveCheckpoint();
                    removeImage(selectedImageId);
                }
            }
            if (e.key === 'Escape') setSelectedImageId(null);
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [selectedImageId, undo, redo, saveCheckpoint]);

    // API Key Loading
    const syncKeyModalState = useCallback((nextProvider: AiProvider, nextKeys = providerKeys) => {
        const stored = loadApiKey(nextProvider);
        setKeyProvider(nextProvider);
        setTempKey(stored?.key || nextKeys[nextProvider] || '');
    }, [providerKeys]);

    useEffect(() => {
        const geminiStored = loadApiKey('gemini');
        const openAiStored = loadApiKey('openai');
        const nextKeys = {
            gemini: geminiStored?.key || '',
            openai: openAiStored?.key || '',
        };
        setProviderKeys(nextKeys);

        if (geminiStored) {
            return;
        }

        if (openAiStored) {
            setProvider('openai');
            return;
        }
    }, []);

    const handleSaveKey = () => {
        const key = tempKey.trim();
        if (!isValidApiKey(keyProvider, key)) return;
        saveApiKey(keyProvider, key, true);
        const nextKeys = { ...providerKeys, [keyProvider]: key };
        setProviderKeys(nextKeys);
        setProvider(keyProvider);
        setShowKeyModal(false);
    };

    const handleClearKey = () => {
        clearApiKey(keyProvider);
        const nextKeys = { ...providerKeys, [keyProvider]: '' };
        setProviderKeys(nextKeys);
        setTempKey('');
        if (provider === keyProvider) {
            if (keyProvider === 'openai' && nextKeys.gemini) {
                setProvider('gemini');
            }
            if (keyProvider === 'gemini' && nextKeys.openai) {
                setProvider('openai');
            }
        }
        syncKeyModalState(keyProvider, nextKeys);
    };

    // Image Processing
    const fileInputRef = useRef<HTMLInputElement>(null);
    const customWidthRef = useRef<HTMLInputElement>(null);
    const exportScale = Math.max(0.25, exportWidth / BASE_EXPORT_WIDTH);
    const selectedExportPreset = isCustomExport ? 'custom' : (EXPORT_SIZE_OPTIONS.some((opt) => opt.width === exportWidth) ? String(exportWidth) : 'custom');

    const loadImageDimensions = (url: string): Promise<{ width: number; height: number } | null> =>
        new Promise((resolve) => {
            const img = new Image();
            img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
            img.onerror = () => resolve(null);
            img.src = url;
        });

    const clearImages = useCallback(() => {
        setImages(prev => {
            prev.forEach(img => URL.revokeObjectURL(img.url));
            return [];
        });
        setSelectedImageId(null);
    }, []);

    const processFiles = async (files: File[]) => {
        const maxCount = editorMode === 'single' ? 1 : 12;
        const newFiles = editorMode === 'single'
            ? files.slice(0, 1)
            : files.slice(0, maxCount - images.length);
        if (newFiles.length === 0) return;

        saveCheckpoint();
        const newImages: UploadedImage[] = await Promise.all(newFiles.map(async (file) => {
            const url = URL.createObjectURL(file);
            const dimensions = await loadImageDimensions(url);
            return {
                id: Math.random().toString(36).substr(2, 9),
                url,
                file,
                originalWidth: dimensions?.width,
                originalHeight: dimensions?.height,
                scale: 1,
                rotation: 0,
                filter: '',
                filterIntensity: 100,
                offsetX: 0,
                offsetY: 0,
            };
        }));

        if (editorMode === 'single') {
            setImages(prev => {
                prev.forEach(img => URL.revokeObjectURL(img.url));
                return newImages.slice(0, 1);
            });
            setSelectedImageId(newImages[0]?.id ?? null);
            return;
        }

        setImages(prev => [...prev, ...newImages].slice(0, 12));
    };

    const handleFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) void processFiles(Array.from(e.target.files));
    };

    // Canvas Logic
    const handleCanvasDragOver = (e: React.DragEvent) => { e.preventDefault(); };
    const handleCanvasDrop = (e: React.DragEvent) => {
        e.preventDefault();
        if (e.dataTransfer.files?.length > 0) void processFiles(Array.from(e.dataTransfer.files));
    };

    const removeImage = (id: string, e?: React.MouseEvent) => {
        e?.stopPropagation();
        saveCheckpoint();
        setImages(prev => {
            const target = prev.find(i => i.id === id);
            if (target) URL.revokeObjectURL(target.url);
            return prev.filter(i => i.id !== id);
        });
        if (selectedImageId === id) setSelectedImageId(null);
    };

    const updateImageProperty = (id: string, updates: Partial<UploadedImage>) => {
        // Note: Debouncing saveCheckpoint for high-frequency updates like sliders should be done in UI
        // For now we just update state
        setImages(prev => prev.map(img => img.id === id ? { ...img, ...updates } : img));
        if (selectedImageId !== id) setSelectedImageId(id);
    };

    const toggleHero = (id: string) => {
        const heroCount = images.filter(img => img.isHero).length;
        const targetImage = images.find(img => img.id === id);

        if (targetImage?.isHero || heroCount < 2) {
            saveCheckpoint();
            updateImageProperty(id, { isHero: !targetImage?.isHero });
        } else {
            alert(t('collage.maxHeroLimit'));
        }
    };

    const handleImageSwap = (id1: string, id2: string) => {
        saveCheckpoint();
        setImages(prev => {
            const idx1 = prev.findIndex(i => i.id === id1);
            const idx2 = prev.findIndex(i => i.id === id2);
            if (idx1 === -1 || idx2 === -1) return prev;
            const newImages = [...prev];
            [newImages[idx1], newImages[idx2]] = [newImages[idx2], newImages[idx1]];
            return newImages;
        });
    };

    const handleDownload = async () => {
        if (canvasRef.current) {
            try {
                const dataUrl = await canvasRef.current.exportImage('png', exportScale);
                try {
                    await saveStickerToDB({
                        id: crypto.randomUUID(),
                        imageUrl: dataUrl,
                        phrase: `Collage ${exportWidth}px ${new Date().toLocaleString()}`,
                        timestamp: Date.now(),
                        description: 'Created with Photo Collage'
                    });
                } catch (saveErr) {
                    console.error('Auto-save on download failed', saveErr);
                }
                const link = document.createElement('a');
                link.download = `collage-${exportWidth}px-${Date.now()}.png`;
                link.href = dataUrl;
                link.click();
            } catch (e) {
                console.error("Download failed", e);
            }
        }
    };

    const handleSaveToGallery = async () => {
        if (!canvasRef.current || isSaving) return;
        setIsSaving(true);
        try {
            const dataUrl = await canvasRef.current.exportImage('png', exportScale);

            const newSticker = {
                id: crypto.randomUUID(),
                imageUrl: dataUrl,
                phrase: `Collage ${exportWidth}px ${new Date().toLocaleString()}`,
                timestamp: Date.now(),
                description: 'Created with Photo Collage'
            };

            await saveStickerToDB(newSticker);
            alert(t('gallery.saved') || 'Saved to Gallery!');
        } catch (error) {
            console.error("Failed to save to gallery:", error);
            alert("Failed to save to gallery");
        } finally {
            setIsSaving(false);
        }
    };

    const handleGallerySelect = async (blobs: Blob[]) => {
        console.log('[AutoCollageTab] handleGallerySelect called with blobs:', blobs.length, blobs);
        if (blobs.length === 0) return;

        // Convert blobs to files
        const files = blobs.map((blob, index) =>
            new File([blob], `gallery-image-${index}.png`, { type: blob.type })
        );
        console.log('[AutoCollageTab] Created files from blobs:', files.length);

        void processFiles(editorMode === 'single' ? files.slice(0, 1) : files);
        console.log('[AutoCollageTab] processFiles called');
    };

    const handleModeChange = (mode: 'collage' | 'single') => {
        if (mode === editorMode) return;
        saveCheckpoint();
        clearImages();
        setEditorMode(mode);
        if (mode === 'single') {
            setSettings(prev => ({ ...prev, layout: LayoutType.GRID }));
        }
    };

    const clampExportWidth = (value: number) => {
        if (!Number.isFinite(value)) return exportWidth;
        return Math.min(MAX_EXPORT_WIDTH, Math.max(MIN_EXPORT_WIDTH, Math.round(value)));
    };

    const isLayoutAvailable = useCallback((layout: LayoutType, count: number) => {
        if (layout === LayoutType.CENTER && count < 3) return false;
        if (layout === LayoutType.L_LEFT && count < 2) return false;
        if (layout === LayoutType.L_RIGHT && count < 2) return false;
        if (layout === LayoutType.T_SHAPE && count < 2) return false;
        if (layout === LayoutType.CROSS_FOCUS && count < 5) return false;
        return true;
    }, []);

    const getBlankRatioForLayout = useCallback((layout: LayoutType) => {
        if (images.length === 0) return 0;

        const { width, height } = getCanvasDimensions(
            settings.ratio,
            settings.customRatioW,
            settings.customRatioH,
            1
        );
        const heroIndices = images
            .map((img, idx) => (img.isHero ? idx : -1))
            .filter((idx) => idx !== -1);

        const frames = calculateFrames(
            images.length,
            layout,
            width,
            height,
            settings.gap,
            settings.padding,
            heroIndices.length > 0 ? heroIndices : undefined
        );

        const usedArea = frames.reduce((acc, frame) => acc + Math.max(0, frame.width * frame.height), 0);
        const totalArea = Math.max(1, width * height);
        const coverage = Math.min(1, usedArea / totalArea);
        return 1 - coverage;
    }, [images, settings.customRatioH, settings.customRatioW, settings.gap, settings.padding, settings.ratio]);

    useEffect(() => {
        if (!settings.autoAvoidBlank || images.length === 0) return;

        const threshold = settings.autoAvoidBlankThreshold ?? 0.12;
        const currentBlank = getBlankRatioForLayout(settings.layout);
        if (currentBlank <= threshold) return;

        const candidates = AUTO_AVOID_BLANK_CANDIDATES
            .filter((layout) => isLayoutAvailable(layout, images.length))
            .map((layout) => ({ layout, blank: getBlankRatioForLayout(layout) }))
            .sort((a, b) => a.blank - b.blank);

        const best = candidates[0];
        if (!best) return;

        if (best.layout !== settings.layout && best.blank + 0.01 < currentBlank) {
            setSettings((prev) => ({ ...prev, layout: best.layout }));
        }
    }, [images.length, settings.autoAvoidBlank, settings.autoAvoidBlankThreshold, settings.layout, getBlankRatioForLayout, isLayoutAvailable]);

    // AI Generation
    const handleGenerate = async () => {
        if (!prompt.trim()) return;
        const apiKey = providerKeys[provider];
        if (!apiKey) {
            syncKeyModalState(provider);
            setShowKeyModal(true);
            return;
        }

        setIsAiLoading(true);
        try {
            const generationPrompt = [
                editorMode === 'single'
                    ? 'Generate one polished standalone photo/collage asset that can be placed on a design canvas.'
                    : 'Generate one polished photo/collage element that fits a scrapbook or modern collage composition.',
                prompt.trim(),
            ].join('\n\n');

            const dataUrl = provider === 'openai'
                ? await generateOpenAiImage(
                    apiKey,
                    generationPrompt,
                    null,
                    '1:1',
                    OPENAI_COLLAGE_MODEL,
                    'high',
                )
                : await generateImage(apiKey, generationPrompt);

            // Convert Data URL to a File object to re-use processFiles logic
            const res = await fetch(dataUrl);
            const blob = await res.blob();
            const file = new File([blob], "generated-image.png", { type: "image/png" });

            void processFiles([file]);
            setShowAiModal(false);
            setPrompt('');
        } catch (err: any) {
            console.error(err);
            if (err.message?.includes("403") || err.message?.includes("401")) { // Check for auth errors
                alert("API Key issue. Please check your key.");
                syncKeyModalState(provider);
                setShowKeyModal(true);
            } else {
                alert("Generation failed: " + err.message);
            }
        } finally {
            setIsAiLoading(false);
        }
    };

    const selectedImage = images.find(i => i.id === selectedImageId);
    const maxUpscaleFactor = useMemo(() => {
        if (images.length === 0) return 1;

        const { width: canvasW, height: canvasH } = getCanvasDimensions(
            settings.ratio,
            settings.customRatioW,
            settings.customRatioH,
            exportScale
        );

        const heroIndices = images
            .map((img, idx) => (img.isHero ? idx : -1))
            .filter((idx) => idx !== -1);

        const frames = calculateFrames(
            images.length,
            settings.layout,
            canvasW,
            canvasH,
            settings.gap * exportScale,
            settings.padding * exportScale,
            heroIndices.length > 0 ? heroIndices : undefined
        );

        let maxFactor = 1;

        images.forEach((img, idx) => {
            if (!img.originalWidth || !img.originalHeight) return false;
            const frame = frames[idx];
            if (!frame) return false;

            const frameW = Math.max(1, frame.width);
            const frameH = Math.max(1, frame.height);
            const userScale = Math.max(0.1, img.scale || 1);
            const fitScale = Math.max(frameW / img.originalWidth, frameH / img.originalHeight);

            maxFactor = Math.max(maxFactor, fitScale * userScale);
        });

        return maxFactor;
    }, [images, settings, exportScale]);

    return (
        <div className="flex flex-col md:flex-row w-full bg-cream-light relative px-4 md:px-0 md:h-[calc(100vh-5rem)] min-h-0 md:overflow-hidden md:-m-6">

            {showKeyModal && (
                <div className="fixed inset-0 z-50 bg-bronze-text/30 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="w-full max-w-md bg-white rounded-3xl border border-cream-dark shadow-2xl p-6 space-y-4">
                        <div className="flex items-center justify-between gap-3">
                            <div>
                                <h3 className="text-lg font-black text-bronze">API Key</h3>
                                <p className="text-xs text-bronze-light">Set a key for the provider you want to use in Photo Collage AI.</p>
                            </div>
                            <button onClick={() => setShowKeyModal(false)} className="text-bronze-light hover:text-bronze">
                                <X size={18} />
                            </button>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                            {(['gemini', 'openai'] as AiProvider[]).map((option) => (
                                <button
                                    key={option}
                                    type="button"
                                    onClick={() => syncKeyModalState(option)}
                                    className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all ${keyProvider === option
                                        ? 'bg-primary text-white border-primary shadow-md'
                                        : 'bg-cream-light border-cream-dark text-bronze-text hover:bg-white'}`}
                                >
                                    {PROVIDER_LABELS[option]}
                                </button>
                            ))}
                        </div>

                        <a
                            href={getApiKeyUrl(keyProvider)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex text-xs font-bold text-primary hover:text-primary-hover"
                        >
                            Get {PROVIDER_LABELS[keyProvider]} API Key
                        </a>

                        <input
                            type="password"
                            value={tempKey}
                            onChange={(e) => setTempKey(e.target.value)}
                            placeholder={keyProvider === 'openai' ? 'Paste your OpenAI API key' : 'Paste your Gemini API key'}
                            className="w-full px-4 py-3 bg-cream-light border border-cream-dark rounded-xl font-bold text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 text-bronze-text"
                        />

                        {!isValidApiKey(keyProvider, tempKey) && tempKey.trim() && (
                            <p className="text-xs font-bold text-red-500">
                                {keyProvider === 'openai' ? 'Please enter a valid OpenAI API key.' : 'Please enter a valid Gemini API key.'}
                            </p>
                        )}

                        <div className="flex gap-3">
                            <button
                                onClick={handleSaveKey}
                                disabled={!isValidApiKey(keyProvider, tempKey)}
                                className="flex-1 px-4 py-2.5 rounded-xl bg-primary text-white font-black hover:bg-primary-hover disabled:opacity-60"
                            >
                                Save Key
                            </button>
                            {providerKeys[keyProvider] && (
                                <button
                                    onClick={handleClearKey}
                                    className="px-4 py-2.5 rounded-xl bg-red-50 text-red-500 font-black border border-red-200 hover:bg-red-100"
                                >
                                    Clear
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {showAiModal && (
                <div className="fixed inset-0 z-50 bg-bronze-text/30 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="w-full max-w-xl bg-white rounded-3xl border border-cream-dark shadow-2xl p-6 space-y-4">
                        <div className="flex items-center justify-between gap-3">
                            <div>
                                <h3 className="text-lg font-black text-bronze">AI Generate</h3>
                                <p className="text-xs text-bronze-light">Create a new image asset and place it into the collage canvas.</p>
                            </div>
                            <button onClick={() => setShowAiModal(false)} className="text-bronze-light hover:text-bronze">
                                <X size={18} />
                            </button>
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center justify-between gap-3">
                                <label className="text-xs font-bold text-bronze-light uppercase tracking-widest">Provider</label>
                                <button
                                    type="button"
                                    onClick={() => {
                                        syncKeyModalState(provider);
                                        setShowKeyModal(true);
                                    }}
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
                                        onClick={() => setProvider(option)}
                                        className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all ${provider === option
                                            ? 'bg-primary text-white border-primary shadow-md'
                                            : 'bg-cream-light border-cream-dark text-bronze-text hover:bg-white'}`}
                                    >
                                        {PROVIDER_LABELS[option]}
                                    </button>
                                ))}
                            </div>
                            <p className="text-[11px] text-bronze-light">
                                {provider === 'openai' ? `Model: ${OPENAI_COLLAGE_MODEL}` : `Model: ${GEMINI_COLLAGE_MODEL}`}
                            </p>
                        </div>

                        <textarea
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            placeholder="Describe the image you want to generate for this collage."
                            rows={5}
                            className="w-full px-4 py-3 bg-cream-light border border-cream-dark rounded-xl text-sm font-bold text-bronze-text outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 resize-none"
                        />

                        <div className="flex gap-3">
                            <button
                                onClick={handleGenerate}
                                disabled={isAiLoading || !prompt.trim()}
                                className="flex-1 px-4 py-3 rounded-xl bg-primary text-white font-black hover:bg-primary-hover disabled:opacity-60 inline-flex items-center justify-center gap-2"
                            >
                                <Sparkles size={16} className={isAiLoading ? 'animate-spin' : ''} />
                                {isAiLoading ? 'Generating...' : 'Generate'}
                            </button>
                            <button
                                onClick={() => setShowAiModal(false)}
                                className="px-4 py-3 rounded-xl bg-cream-light text-bronze-text font-black border border-cream-dark hover:bg-white"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Gallery Picker Modal */}
            {showGalleryPicker && (
                <GalleryPicker
                    onSelect={handleGallerySelect}
                    onClose={() => setShowGalleryPicker(false)}
                />
            )}


            {/* Main Content (Canvas) - LEFT SIDE */}
            <main className="w-full md:flex-1 flex flex-col relative border-b md:border-b-0 border-cream-dark mb-2 md:mb-0 min-h-0">

                {/* Toolbar (Zoom & Actions) */}
                <div className="absolute top-4 left-4 right-4 z-10 flex justify-between items-start pointer-events-none">
                    <div className="pointer-events-auto flex items-center gap-2 bg-cream/90 backdrop-blur shadow-sm p-1.5 rounded-xl border border-cream-dark">
                        <button
                            onClick={handleZoomOut}
                            className="p-2 hover:bg-cream-light rounded-lg text-bronze-light hover:text-bronze"
                            title={t('editor.controls.zoomOut')}
                        ><ZoomOut size={16} /></button>
                        <span className="text-xs font-mono w-10 text-center text-bronze-text font-bold">{Math.round(zoomLevel * 100)}%</span>
                        <button
                            onClick={handleZoomIn}
                            className="p-2 hover:bg-cream-light rounded-lg text-bronze-light hover:text-bronze"
                            title={t('editor.controls.zoomIn')}
                        ><ZoomIn size={16} /></button>
                        <div className="w-px h-4 bg-cream-dark mx-1" />
                        <button onClick={resetZoom} className="px-2 text-xs font-bold text-bronze-light hover:text-primary">{t('collage.reset')}</button>
                    </div>

                    <div className="pointer-events-auto flex items-center gap-2">
                        <button
                            onClick={handleSaveToGallery}
                            disabled={isSaving}
                            className="bg-cream/90 backdrop-blur shadow-sm text-secondary px-3 md:px-4 py-2 rounded-xl border border-secondary/20 flex items-center gap-2 font-black hover:bg-secondary/5 transition-colors disabled:opacity-50"
                            title={t('editor.toolbar.saveToGallery')}
                        >
                            <Save size={16} />
                            <span className="hidden xs:inline">{isSaving ? t('gallery.loading') : t('editor.toolbar.saveToGallery')}</span>
                        </button>
                        <button
                            onClick={handleDownload}
                            className="bg-primary text-white px-3 md:px-4 py-2 rounded-xl shadow-lg shadow-primary/20 flex items-center gap-2 font-black hover:bg-primary-hover transition-colors"
                            title={t('gallery.download')}
                        >
                            <Download size={16} />
                            <span className="hidden xs:inline">{t('gallery.download')}</span>
                        </button>
                    </div>
                </div>

                {/* Canvas Area */}
                <div
                    className="bg-cream-light flex items-start justify-center overflow-auto p-3 pt-20 pb-24 md:p-8 md:pt-16 md:pb-8 min-h-[50vh] md:h-full"
                    onDragOver={handleCanvasDragOver}
                    onDrop={handleCanvasDrop}
                >
                    {images.length === 0 ? (
                        <div className="text-center p-6 md:p-10 border-4 border-dashed border-cream-dark rounded-3xl bg-cream/60 backdrop-blur-sm max-w-md mx-4">
                            <div className="w-16 h-16 md:w-20 md:h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 text-primary">
                                <ImageIcon size={32} />
                            </div>
                            <h2 className="text-lg md:text-xl font-black text-bronze mb-2">
                                {editorMode === 'single' ? '單張邊框輸出' : t('collage.create')}
                            </h2>
                            <p className="text-xs md:text-sm text-bronze-light mb-6">
                                {editorMode === 'single' ? '上傳一張圖，選擇拍立得或底片框後下載。' : t('collage.dragDrop')}
                            </p>
                            <div className="flex gap-3 justify-center">
                                <button onClick={() => fileInputRef.current?.click()} className="px-4 md:px-6 py-2.5 bg-white border border-cream-dark shadow-sm rounded-xl font-bold text-xs md:text-sm text-bronze-text hover:bg-cream-light transition-colors">{t('collage.upload')}</button>
                                <button onClick={() => setShowGalleryPicker(true)} className="px-4 md:px-6 py-2.5 bg-white border border-secondary/20 text-secondary shadow-sm rounded-xl font-bold text-xs md:text-sm hover:bg-secondary/5 flex items-center gap-2 transition-colors">
                                    <FolderHeart size={18} /> {t('collage.gallery')}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div
                            style={{
                                transform: `scale(${zoomLevel})`,
                                transformOrigin: 'top center',
                                transition: 'transform 0.2s'
                            }}
                            className="shadow-2xl"
                        >
                            <PhotoCanvas
                                ref={canvasRef}
                                images={images}
                                settings={settings}
                                interactive={true}
                                onCanvasReady={() => { }}
                                onImageUpdate={(id, updates) => updateImageProperty(id, updates)}
                                onImageSwap={handleImageSwap}
                            />
                        </div>
                    )}
                </div>

                {/* Mobile Quick Editor: keep image controls close to canvas */}
                {selectedImage && (
                    <div className="md:hidden absolute left-2 right-2 bottom-2 z-20 bg-white/95 backdrop-blur-md border border-cream-dark rounded-2xl shadow-xl p-3">
                        <div className="flex justify-between items-center mb-2">
                            <h3 className="text-[11px] font-black uppercase text-primary flex items-center gap-1"><Edit2 size={10} /> {t('collage.editImage')}</h3>
                            <button onClick={() => setSelectedImageId(null)} className="text-bronze-light hover:text-bronze"><X size={12} /></button>
                        </div>

                        <div className="space-y-2.5">
                            <div className="grid grid-cols-[auto_auto_1fr] items-center gap-2">
                                <RotateCw size={13} className="text-bronze-light" />
                                <span className="text-[10px] font-bold text-bronze-light min-w-[30px]">{t('collage.image.rotation')}</span>
                                <input type="range" min="-180" max="180" value={selectedImage.rotation} onChange={e => updateImageProperty(selectedImage.id, { rotation: parseInt(e.target.value) })} className="flex-1 h-1.5 bg-cream-dark rounded-lg appearance-none cursor-pointer accent-primary" title={t('collage.image.rotation')} />
                            </div>
                            <div className="grid grid-cols-[auto_auto_1fr] items-center gap-2">
                                <Scaling size={13} className="text-bronze-light" />
                                <span className="text-[10px] font-bold text-bronze-light min-w-[30px]">{t('collage.image.scale')}</span>
                                <input type="range" min="0.5" max="3" step="0.1" value={selectedImage.scale} onChange={e => updateImageProperty(selectedImage.id, { scale: parseFloat(e.target.value) })} className="flex-1 h-1.5 bg-cream-dark rounded-lg appearance-none cursor-pointer accent-primary" title={t('collage.image.scale')} />
                            </div>
                            <div className="grid grid-cols-[auto_auto_1fr] items-center gap-2">
                                <Wand2 size={13} className="text-bronze-light" />
                                <span className="text-[10px] font-bold text-bronze-light min-w-[30px]">{t('collage.image.effect')}</span>
                                <input type="range" min="0" max="100" value={selectedImage.filterIntensity ?? 100} onChange={e => updateImageProperty(selectedImage.id, { filterIntensity: parseInt(e.target.value) })} className="flex-1 h-1.5 bg-cream-dark rounded-lg appearance-none cursor-pointer accent-primary" title={t('collage.image.effect')} />
                            </div>
                            {(settings.captionPosition === 'top' || settings.captionPosition === 'both') && (
                                <div className="grid grid-cols-[auto_1fr] items-center gap-2">
                                    <Type size={13} className="text-bronze-light" />
                                    <input
                                        type="text"
                                        value={selectedImage.caption || ''}
                                        onChange={e => updateImageProperty(selectedImage.id, { caption: e.target.value })}
                                        placeholder={t('collage.image.captionPlaceholder', { defaultValue: 'Add caption...' })}
                                        className="w-full px-2 py-1.5 bg-cream-light border border-cream-dark rounded-lg text-xs font-bold text-bronze-text outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
                                    />
                                </div>
                            )}
                            <div className="flex justify-end">
                                <button onClick={() => removeImage(selectedImage.id)} className="text-xs text-red-500 hover:underline font-bold">{t('collage.remove')}</button>
                            </div>
                        </div>
                    </div>
                )}
            </main>

            {/* Sidebar Controls - RIGHT SIDE */}
            <aside className="w-full md:w-80 bg-cream/90 backdrop-blur-md border-l border-cream-dark flex flex-col md:h-full md:overflow-y-auto min-h-0 shadow-xl shadow-bronze/5 rounded-t-3xl md:rounded-none custom-scrollbar">
                <div className="p-4 border-b border-cream-dark/50">
                    <div className="flex justify-between items-center mb-4">
                        <div className="flex flex-col gap-2">
                            <h2 className="font-black text-bronze text-sm md:text-base">
                                {editorMode === 'single' ? '單張編輯' : t('collage.photos')} ({images.length}/{editorMode === 'single' ? 1 : 12})
                            </h2>
                            {editorMode === 'collage' && (
                                <p className="text-[10px] text-bronze-light">{t('collage.heroHint', { defaultValue: 'Star marks Hero photos: prioritized in focus layouts (max 2).' })}</p>
                            )}
                            <div className="inline-flex p-1 rounded-lg bg-cream-light border border-cream-dark">
                                <button
                                    onClick={() => handleModeChange('collage')}
                                    className={`px-2.5 py-1 text-xs font-black rounded-md transition-colors ${editorMode === 'collage' ? 'bg-primary text-white' : 'text-bronze-light hover:text-primary'}`}
                                >
                                    拼貼
                                </button>
                                <button
                                    onClick={() => handleModeChange('single')}
                                    className={`px-2.5 py-1 text-xs font-black rounded-md transition-colors ${editorMode === 'single' ? 'bg-primary text-white' : 'text-bronze-light hover:text-primary'}`}
                                >
                                    單張邊框
                                </button>
                            </div>
                        </div>
                        <div className="flex gap-1">
                            <button onClick={() => setShowAiModal(true)} className="p-2 hover:bg-primary/10 rounded-lg text-primary" title="AI Generate"><Sparkles size={18} /></button>
                            <button onClick={() => { syncKeyModalState(provider); setShowKeyModal(true); }} className="p-2 hover:bg-primary/10 rounded-lg text-primary" title="API Key"><Key size={18} /></button>
                            <button onClick={() => setShowGalleryPicker(true)} className="p-2 hover:bg-secondary/10 rounded-lg text-secondary" title={t('collage.addFromGallery')}><FolderHeart size={18} /></button>
                            <button onClick={() => fileInputRef.current?.click()} className="p-2 hover:bg-primary/10 rounded-lg text-primary" title={t('collage.addPhoto')}><Plus size={18} /></button>
                            {images.length > 0 && <button onClick={() => { saveCheckpoint(); clearImages(); }} className="p-2 hover:bg-red-50 rounded-lg text-red-500" title={t('collage.clearAll')}><Trash2 size={18} /></button>}
                        </div>
                    </div>
                    <input type="file" ref={fileInputRef} onChange={handleFiles} className="hidden" multiple={editorMode === 'collage'} accept="image/*" />

                    <div className="p-4">
                        <div className={`${editorMode === 'single' ? 'grid grid-cols-1 gap-2' : 'grid grid-cols-3 gap-2'}`}>
                            {images.map((img) => (
                                <div
                                    key={img.id}
                                    onClick={() => setSelectedImageId(img.id)}
                                    draggable
                                    onDragStart={(e) => e.dataTransfer.setData('text/plain', img.id)}
                                    className={`relative aspect-square rounded-lg overflow-hidden border cursor-pointer ${editorMode === 'collage' && img.isHero
                                        ? 'ring-2 ring-yellow-500 border-yellow-500'
                                        : selectedImageId === img.id
                                            ? 'ring-2 ring-primary border-transparent'
                                            : 'border-gray-200 hover:border-primary/50'
                                        }`}
                                >
                                    <img src={img.url} alt="Thumbnail" className="w-full h-full object-cover" />

                                    {/* Hero Star Badge */}
                                    {editorMode === 'collage' && img.isHero && (
                                        <div className="absolute top-1 left-1 bg-yellow-500 text-white rounded-full px-1.5 py-0.5 flex items-center gap-1">
                                            <Star size={10} fill="white" />
                                            <span className="text-[9px] font-black leading-none">{t('collage.heroBadge', { defaultValue: 'Hero' })}</span>
                                        </div>
                                    )}

                                    {/* Hero Toggle Button */}
                                    {editorMode === 'collage' && (
                                        <button
                                            onClick={(e) => { e.stopPropagation(); toggleHero(img.id); }}
                                            className="absolute top-1 right-1 bg-black/50 hover:bg-black/70 text-white rounded-full p-1 transition-colors"
                                            title={img.isHero ? t('collage.removeHero') : t('collage.setHero')}
                                        >
                                            <Star size={12} fill={img.isHero ? '#fbbf24' : 'none'} stroke={img.isHero ? '#fbbf24' : 'white'} />
                                        </button>
                                    )}

                                    {selectedImageId === img.id && <div className="absolute inset-0 bg-primary/20 flex items-center justify-center"><Check size={16} className="text-white drop-shadow-md" /></div>}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Selected Image Editor */}
                {selectedImage && (
                    <div className="hidden md:block bg-primary/5 p-4 border-b border-primary/10 animate-in slide-in-from-right-4">
                        <div className="flex justify-between items-center mb-2">
                            <h3 className="text-xs font-black uppercase text-primary flex items-center gap-1"><Edit2 size={10} /> {t('collage.editImage')}</h3>
                            <button onClick={() => setSelectedImageId(null)} className="text-bronze-light hover:text-bronze"><X size={12} /></button>
                        </div>

                        <div className="space-y-3">
                            {/* Rotation */}
                            <div className="grid grid-cols-[auto_auto_1fr] items-center gap-2">
                                <RotateCw size={14} className="text-bronze-light" />
                                <span className="text-[10px] font-bold text-bronze-light min-w-[30px]">{t('collage.image.rotation')}</span>
                                <input type="range" min="-180" max="180" value={selectedImage.rotation} onChange={e => updateImageProperty(selectedImage.id, { rotation: parseInt(e.target.value) })} className="flex-1 h-1.5 bg-cream-dark rounded-lg appearance-none cursor-pointer accent-primary" title={t('collage.image.rotation')} />
                            </div>
                            {/* Scale */}
                            <div className="grid grid-cols-[auto_auto_1fr] items-center gap-2">
                                <Scaling size={14} className="text-bronze-light" />
                                <span className="text-[10px] font-bold text-bronze-light min-w-[30px]">{t('collage.image.scale')}</span>
                                <input type="range" min="0.5" max="3" step="0.1" value={selectedImage.scale} onChange={e => updateImageProperty(selectedImage.id, { scale: parseFloat(e.target.value) })} className="flex-1 h-1.5 bg-cream-dark rounded-lg appearance-none cursor-pointer accent-primary" title={t('collage.image.scale')} />
                            </div>
                            {/* Filter Intensity */}
                            <div className="grid grid-cols-[auto_auto_1fr] items-center gap-2">
                                <Wand2 size={14} className="text-bronze-light" />
                                <span className="text-[10px] font-bold text-bronze-light min-w-[30px]">{t('collage.image.effect')}</span>
                                <input type="range" min="0" max="100" value={selectedImage.filterIntensity ?? 100} onChange={e => updateImageProperty(selectedImage.id, { filterIntensity: parseInt(e.target.value) })} className="flex-1 h-1.5 bg-cream-dark rounded-lg appearance-none cursor-pointer accent-primary" title={t('collage.image.effect')} />
                            </div>
                            <p className="text-[10px] text-bronze-light leading-tight">{t('collage.image.effectHint', { defaultValue: 'Adjust color richness and contrast. 100 means neutral.' })}</p>
                            {/* Caption */}
                            {(settings.captionPosition === 'top' || settings.captionPosition === 'both') && (
                                <div className="grid grid-cols-[auto_1fr] items-center gap-2">
                                    <Type size={14} className="text-bronze-light" />
                                    <input
                                        type="text"
                                        value={selectedImage.caption || ''}
                                        onChange={e => updateImageProperty(selectedImage.id, { caption: e.target.value })}
                                        placeholder={t('collage.image.captionPlaceholder', { defaultValue: 'Add caption...' })}
                                        className="w-full px-2 py-1.5 bg-cream-light border border-cream-dark rounded-lg text-xs font-bold text-bronze-text outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
                                    />
                                </div>
                            )}
                            <div className="flex gap-2 justify-end">
                                <button onClick={() => removeImage(selectedImage.id)} className="text-xs text-red-500 hover:underline font-bold">{t('collage.remove')}</button>
                            </div>
                        </div>
                    </div>
                )}

                <div className="px-4 pt-4">
                    <div className="bg-white border border-cream-dark rounded-xl p-3 space-y-2">
                        <div className="text-xs font-black text-bronze uppercase tracking-wide">{t('collage.export.title')}</div>
                        <div className="grid grid-cols-2 gap-2">
                            <select
                                value={selectedExportPreset}
                                onChange={(e) => {
                                    if (e.target.value === 'custom') {
                                        setIsCustomExport(true);
                                        requestAnimationFrame(() => {
                                            customWidthRef.current?.focus();
                                            customWidthRef.current?.select();
                                        });
                                        return;
                                    }
                                    setIsCustomExport(false);
                                    setExportWidth(parseInt(e.target.value, 10));
                                }}
                                className="bg-cream-light border border-cream-dark rounded-lg px-2 py-1.5 text-xs font-bold text-bronze"
                            >
                                {EXPORT_SIZE_OPTIONS.map((option) => (
                                    <option key={option.width} value={option.width}>{option.label}</option>
                                ))}
                                <option value="custom">{t('collage.export.custom')}</option>
                            </select>
                            <input
                                ref={customWidthRef}
                                type="number"
                                min={MIN_EXPORT_WIDTH}
                                max={MAX_EXPORT_WIDTH}
                                step={1}
                                value={exportWidth}
                                onChange={(e) => {
                                    const parsed = Number(e.target.value);
                                    if (!Number.isNaN(parsed)) setExportWidth(parsed);
                                }}
                                onBlur={() => setExportWidth((prev) => clampExportWidth(prev))}
                                className={`border rounded-lg px-2 py-1.5 text-xs font-bold text-bronze transition-all ${selectedExportPreset === 'custom' ? 'bg-white border-primary ring-2 ring-primary/30' : 'bg-cream-light border-cream-dark'}`}
                                title={t('collage.export.customWidthTitle')}
                            />
                        </div>
                        <div className="text-[10px] text-bronze-light leading-tight">{t('collage.export.widthHint')}</div>
                        {maxUpscaleFactor > 1.5 && (
                            <div className="text-[10px] text-red-600 leading-tight font-bold">{t('collage.export.warnUpscaleHigh', { factor: maxUpscaleFactor.toFixed(2) })}</div>
                        )}
                        {maxUpscaleFactor > 1.02 && maxUpscaleFactor <= 1.5 && (
                            <div className="text-[10px] text-orange-600 leading-tight font-bold">{t('collage.export.warnUpscaleMild', { factor: maxUpscaleFactor.toFixed(2) })}</div>
                        )}
                    </div>
                </div>

                <div className="p-4">
                    <Controls
                        settings={settings}
                        onUpdate={(s) => {
                            if (s.layout !== settings.layout) saveCheckpoint();
                            setSettings(s);
                        }}
                        imageCount={images.length}
                        onShuffle={() => {
                            saveCheckpoint();
                            setImages(prev => [...prev].sort(() => Math.random() - 0.5));
                        }}
                        showLayout={editorMode === 'collage'}
                    />
                </div>
            </aside>
        </div>
    );
};

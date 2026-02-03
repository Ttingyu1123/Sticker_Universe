import React, { useState, useCallback, useRef, useEffect } from 'react';
import { X, Download, Image as ImageIcon, Trash2, ZoomIn, ZoomOut, Edit2, Check, Wand2, RotateCw, Scaling, Plus, FolderHeart, Save } from 'lucide-react';
import { AspectRatio, CollageSettings, LayoutType, UploadedImage } from './types';
import { Controls } from './components/Controls';
import { PhotoCanvas, PhotoCanvasHandle } from './components/PhotoCanvas';
import { generateImage } from './geminiService';
import { useTranslation } from 'react-i18next';
import { GalleryPicker } from '../../components/GalleryPicker';
import { saveStickerToDB } from '../../db';

export const AutoCollageTab: React.FC = () => {
    const { t } = useTranslation();
    const [images, setImages] = useState<UploadedImage[]>([]);
    const [selectedImageId, setSelectedImageId] = useState<string | null>(null);
    const [settings, setSettings] = useState<CollageSettings>({
        layout: LayoutType.GRID,
        ratio: AspectRatio.SQUARE,
        gap: 10,
        padding: 20,
        cornerRadius: 0,
        shadow: 0,
        frameStyle: 'normal',
        backgroundColor: '#ffffff',
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

    // Zoom State
    const [zoomLevel, setZoomLevel] = useState(1);
    const handleZoomIn = () => setZoomLevel(prev => Math.min(prev + 0.1, 3));
    const handleZoomOut = () => setZoomLevel(prev => Math.max(prev - 0.1, 0.1));
    const resetZoom = () => setZoomLevel(1);

    // Download State
    const canvasRef = useRef<PhotoCanvasHandle>(null);

    // API Key State
    const [apiKey, setApiKey] = useState<string>('');
    const [showKeyModal, setShowKeyModal] = useState(false);
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
    useEffect(() => {
        const storedKey = localStorage.getItem('gemini_api_key');
        if (storedKey) setApiKey(storedKey);
    }, []);

    const handleSaveKey = () => {
        if (!tempKey.trim()) return;
        setApiKey(tempKey.trim());
        localStorage.setItem('gemini_api_key', tempKey.trim());
        setShowKeyModal(false);
    };

    const handleClearKey = () => {
        setApiKey('');
        localStorage.removeItem('gemini_api_key');
        setTempKey('');
        setShowKeyModal(true);
    };

    // Image Processing
    const fileInputRef = useRef<HTMLInputElement>(null);

    const processFiles = (files: File[]) => {
        const newFiles = files.slice(0, 12 - images.length);
        if (newFiles.length === 0) return;

        saveCheckpoint();
        const newImages: UploadedImage[] = newFiles.map(file => ({
            id: Math.random().toString(36).substr(2, 9),
            url: URL.createObjectURL(file),
            file,
            scale: 1,
            rotation: 0,
            filter: '',
            filterIntensity: 100,
            offsetX: 0,
            offsetY: 0,
        }));

        setImages(prev => [...prev, ...newImages].slice(0, 12));
    };

    const handleFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) processFiles(Array.from(e.target.files));
    };

    // Canvas Logic
    const handleCanvasDragOver = (e: React.DragEvent) => { e.preventDefault(); };
    const handleCanvasDrop = (e: React.DragEvent) => {
        e.preventDefault();
        if (e.dataTransfer.files?.length > 0) processFiles(Array.from(e.dataTransfer.files));
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
                const dataUrl = await canvasRef.current.exportImage('png', 2); // 2x High Res
                const link = document.createElement('a');
                link.download = `collage-${Date.now()}.png`;
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
            const dataUrl = await canvasRef.current.exportImage('png', 2);

            const newSticker = {
                id: crypto.randomUUID(),
                imageUrl: dataUrl,
                phrase: `Collage ${new Date().toLocaleString()}`,
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
        if (blobs.length === 0) return;

        // Convert blobs to files
        const files = blobs.map((blob, index) =>
            new File([blob], `gallery-image-${index}.png`, { type: blob.type })
        );

        processFiles(files);
    };

    // AI Generation
    const handleGenerate = async () => {
        if (!prompt.trim()) return;
        if (!apiKey) {
            setShowKeyModal(true);
            return;
        }

        setIsAiLoading(true);
        try {
            const dataUrl = await generateImage(apiKey, prompt);

            // Convert Data URL to a File object to re-use processFiles logic
            const res = await fetch(dataUrl);
            const blob = await res.blob();
            const file = new File([blob], "generated-image.png", { type: "image/png" });

            processFiles([file]);
            setShowAiModal(false);
            setPrompt('');
        } catch (err: any) {
            console.error(err);
            if (err.message?.includes("403") || err.message?.includes("401")) { // Check for auth errors
                alert("API Key issue. Please check your key.");
                setShowKeyModal(true);
            } else {
                alert("Generation failed: " + err.message);
            }
        } finally {
            setIsAiLoading(false);
        }
    };

    const selectedImage = images.find(i => i.id === selectedImageId);

    return (
        <div className="flex h-[calc(100vh-140px)] w-full flex-col md:flex-row overflow-hidden bg-slate-50 relative">

            {/* Gallery Picker Modal */}
            {showGalleryPicker && (
                <GalleryPicker
                    onSelect={handleGallerySelect}
                    onClose={() => setShowGalleryPicker(false)}
                />
            )}


            {/* Main Content (Canvas) - LEFT SIDE */}
            <main className="flex-1 flex flex-col h-full relative overflow-hidden">

                {/* Toolbar (Zoom & Actions) */}
                <div className="absolute top-4 left-4 right-4 z-10 flex justify-between items-start pointer-events-none">
                    <div className="pointer-events-auto flex items-center gap-2 bg-white/90 backdrop-blur shadow-sm p-1.5 rounded-xl border border-cream-dark">
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

                    <div className="pointer-events-auto flex gap-2">
                        <button
                            onClick={handleSaveToGallery}
                            disabled={isSaving}
                            className="bg-white/90 backdrop-blur shadow-sm text-secondary px-4 py-2 rounded-xl border border-secondary/20 flex items-center gap-2 font-black hover:bg-secondary/5 transition-colors disabled:opacity-50"
                            title={t('editor.toolbar.saveToGallery')}
                        >
                            <Save size={16} />
                            {isSaving ? t('gallery.loading') : t('editor.toolbar.saveToGallery')}
                        </button>
                        <button
                            onClick={handleDownload}
                            className="bg-primary text-white px-4 py-2 rounded-xl shadow-lg shadow-primary/20 flex items-center gap-2 font-black hover:bg-primary-hover transition-colors"
                            title={t('gallery.download')}
                        >
                            <Download size={16} />
                            {t('gallery.download')}
                        </button>
                    </div>
                </div>

                {/* Canvas Area */}
                <div
                    className="flex-1 bg-slate-50 flex items-center justify-center overflow-hidden p-8"
                    onDragOver={handleCanvasDragOver}
                    onDrop={handleCanvasDrop}
                >
                    {images.length === 0 ? (
                        <div className="text-center p-10 border-4 border-dashed border-cream-dark rounded-3xl bg-white/40 backdrop-blur-sm max-w-md">
                            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 text-primary">
                                <ImageIcon size={40} />
                            </div>
                            <h2 className="text-xl font-black text-bronze mb-2">{t('collage.create')}</h2>
                            <p className="text-bronze-light mb-6">{t('collage.dragDrop')}</p>
                            <div className="flex gap-3 justify-center">
                                <button onClick={() => fileInputRef.current?.click()} className="px-6 py-2.5 bg-white border border-cream-dark shadow-sm rounded-xl font-bold text-bronze-text hover:bg-cream-light transition-colors">{t('collage.upload')}</button>
                                <button onClick={() => setShowGalleryPicker(true)} className="px-6 py-2.5 bg-white border border-secondary/20 text-secondary shadow-sm rounded-xl font-bold hover:bg-secondary/5 flex items-center gap-2 transition-colors">
                                    <FolderHeart size={18} /> {t('collage.gallery')}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div style={{ transform: `scale(${zoomLevel})`, transition: 'transform 0.2s' }} className="shadow-2xl">
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
            </main>

            {/* Sidebar Controls - RIGHT SIDE */}
            <aside className="w-full md:w-80 bg-white/80 backdrop-blur-md border-l border-cream-dark h-full overflow-y-auto flex flex-col z-20 shadow-xl shadow-bronze/5">
                <div className="p-4 border-b border-cream-dark/50">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="font-black text-bronze">{t('collage.photos')} ({images.length}/12)</h2>
                        <div className="flex gap-1">
                            <button onClick={() => setShowGalleryPicker(true)} className="p-2 hover:bg-secondary/10 rounded-lg text-secondary" title={t('collage.addFromGallery')}><FolderHeart size={18} /></button>
                            <button onClick={() => fileInputRef.current?.click()} className="p-2 hover:bg-primary/10 rounded-lg text-primary" title={t('collage.addPhoto')}><Plus size={18} /></button>
                            {images.length > 0 && <button onClick={() => { saveCheckpoint(); setImages([]); }} className="p-2 hover:bg-red-50 rounded-lg text-red-500" title={t('collage.clearAll')}><Trash2 size={18} /></button>}
                        </div>
                    </div>
                    <input type="file" ref={fileInputRef} onChange={handleFiles} className="hidden" multiple accept="image/*" />

                    {/* Thumbnail Grid */}
                    <div className="grid grid-cols-4 gap-2">
                        {images.map((img) => (
                            <div
                                key={img.id}
                                onClick={() => setSelectedImageId(img.id)}
                                draggable
                                onDragStart={(e) => e.dataTransfer.setData('text/plain', img.id)}
                                // Simple drag handling for thumbnails could be added here similar to App.tsx
                                className={`relative aspect-square rounded-lg overflow-hidden border cursor-pointer ${selectedImageId === img.id ? 'ring-2 ring-primary border-transparent' : 'border-gray-200 hover:border-primary/50'}`}
                            >
                                <img src={img.url} alt="Thumbnail" className="w-full h-full object-cover" />
                                {selectedImageId === img.id && <div className="absolute inset-0 bg-primary/20 flex items-center justify-center"><Check size={16} className="text-white drop-shadow-md" /></div>}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Selected Image Editor */}
                {selectedImage && (
                    <div className="bg-primary/5 p-4 border-b border-primary/10 animate-in slide-in-from-right-4">
                        <div className="flex justify-between items-center mb-2">
                            <h3 className="text-xs font-black uppercase text-primary flex items-center gap-1"><Edit2 size={10} /> {t('collage.editImage')}</h3>
                            <button onClick={() => setSelectedImageId(null)} className="text-bronze-light hover:text-bronze"><X size={12} /></button>
                        </div>

                        <div className="space-y-3">
                            {/* Rotation */}
                            <div className="flex items-center gap-2">
                                <RotateCw size={14} className="text-bronze-light" />
                                <input type="range" min="-180" max="180" value={selectedImage.rotation} onChange={e => updateImageProperty(selectedImage.id, { rotation: parseInt(e.target.value) })} className="flex-1 h-1.5 bg-cream-dark rounded-lg appearance-none cursor-pointer accent-primary" title={t('collage.image.rotation')} />
                            </div>
                            {/* Scale */}
                            <div className="flex items-center gap-2">
                                <Scaling size={14} className="text-bronze-light" />
                                <input type="range" min="0.5" max="3" step="0.1" value={selectedImage.scale} onChange={e => updateImageProperty(selectedImage.id, { scale: parseFloat(e.target.value) })} className="flex-1 h-1.5 bg-cream-dark rounded-lg appearance-none cursor-pointer accent-primary" title={t('collage.image.scale')} />
                            </div>
                            {/* Filter Intensity */}
                            <div className="flex items-center gap-2">
                                <Wand2 size={14} className="text-bronze-light" />
                                <input type="range" min="0" max="100" value={selectedImage.filterIntensity ?? 100} onChange={e => updateImageProperty(selectedImage.id, { filterIntensity: parseInt(e.target.value) })} className="flex-1 h-1.5 bg-cream-dark rounded-lg appearance-none cursor-pointer accent-primary" title={t('collage.image.effect')} />
                            </div>
                            <div className="flex gap-2 justify-end">
                                <button onClick={() => removeImage(selectedImage.id)} className="text-xs text-red-500 hover:underline font-bold">{t('collage.remove')}</button>
                            </div>
                        </div>
                    </div>
                )}

                <div className="p-4 flex-1 overflow-y-auto">
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
                    />
                </div>
            </aside>
        </div>
    );
};

import React, { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Download, Image as ImageIcon, Video, Upload, Type, Layers, ChevronUp, ChevronDown, Settings, ZoomIn, ZoomOut, Smartphone, Loader2 } from 'lucide-react';
import './animations.css';
import { GalleryPicker } from '../../components/GalleryPicker';
import { LinePreviewModal } from '../../components/LinePreviewModal';
// @ts-ignore
import UPNG from 'upng-js';
import GIF from 'gif.js';
import { toPng } from 'html-to-image';
import { Layer, AnimationType } from './types';
import { LayerCanvas } from './components/LayerCanvas';
import { LayerProperties } from './components/LayerProperties';
// import { v4 as uuidv4 } from 'uuid'; 

export const AnimatorApp = () => {
    const { t } = useTranslation();
    const [layers, setLayers] = useState<Layer[]>([]);
    const [selectedLayerId, setSelectedLayerId] = useState<string | null>(null);
    const [isExporting, setIsExporting] = useState(false);
    const [showGallery, setShowGallery] = useState(false);

    // LINE Preview State
    const [showLinePreview, setShowLinePreview] = useState(false);
    const [previewImage, setPreviewImage] = useState<string | null>(null);
    const [isPreviewLoading, setIsPreviewLoading] = useState(false);

    // Animation Settings (LINE Constraints)
    const [duration, setDuration] = useState(2); // 1, 2, 3, 4
    const [fps, setFps] = useState(10); // 5, 10, 15, 20 (LINE recommends < 20 for file size)

    // We target the Canvas wrapper for export
    const containerRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [zoom, setZoom] = useState(1);
    const [canvasSize, setCanvasSize] = useState({ width: 320, height: 270 });
    const [editingLayerId, setEditingLayerId] = useState<string | null>(null);

    // Helpers
    const generateId = () => Math.random().toString(36).substr(2, 9);

    const handleSelectImage = (blobs: Blob[]) => {
        const newLayers = blobs.map((blob, i) => ({
            id: generateId(),
            name: `Image ${layers.length + i + 1}`,
            type: 'image' as const,
            content: URL.createObjectURL(blob),
            x: 0,
            y: 0,
            scale: 1,
            rotation: 0,
            animation: 'none' as AnimationType
        }));

        setLayers(prev => [...prev, ...newLayers]);
        if (newLayers.length > 0) setSelectedLayerId(newLayers[newLayers.length - 1].id);
        setShowGallery(false);
    };

    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const newLayer: Layer = {
                id: generateId(),
                name: file.name.split('.')[0] || 'Image',
                type: 'image',
                content: URL.createObjectURL(file),
                x: 0,
                y: 0,
                scale: 1,
                rotation: 0,
                animation: 'none'
            };
            setLayers(prev => [...prev, newLayer]);
            setSelectedLayerId(newLayer.id);
        }
        // Reset input
        if (event.target) event.target.value = '';
    };

    const handleAddText = () => {
        const newLayer: Layer = {
            id: generateId(),
            name: 'Text',
            type: 'text',
            content: 'Text',
            x: 0,
            y: 0,
            scale: 1,
            rotation: 0,
            animation: 'none',
            fontSize: 24,
            color: '#000000',
            fontFamily: 'sans-serif'
        };
        setLayers(prev => [...prev, newLayer]);
        setSelectedLayerId(newLayer.id);
    };

    const handleUpdateLayer = (id: string, updates: Partial<Layer>) => {
        setLayers(prev => prev.map(l => l.id === id ? { ...l, ...updates } : l));
    };

    const handleDeleteLayer = (id: string) => {
        setLayers(prev => prev.filter(l => l.id !== id));
        if (selectedLayerId === id) setSelectedLayerId(null);
    };

    const handleMoveLayer = (id: string, direction: 'up' | 'down') => {
        setLayers(prev => {
            const index = prev.findIndex(l => l.id === id);
            if (index === -1) return prev;

            const newLayers = [...prev];
            if (direction === 'up' && index < newLayers.length - 1) {
                [newLayers[index], newLayers[index + 1]] = [newLayers[index + 1], newLayers[index]];
            } else if (direction === 'down' && index > 0) {
                [newLayers[index], newLayers[index - 1]] = [newLayers[index - 1], newLayers[index]];
            }
            return newLayers;
        });
    };

    const handleRenameLayer = (id: string, newName: string) => {
        setLayers(prev => prev.map(l => l.id === id ? { ...l, name: newName } : l));
        setEditingLayerId(null);
    };

    const handleCanvasResize = (width: number, height: number) => {
        setCanvasSize({ width, height });
    };

    const generateAnimation = async (format: 'apng' | 'gif'): Promise<string | null> => {
        if (!containerRef.current || layers.length === 0) return null;

        const layerElements: { el: HTMLElement, originalState: string, originalDelay: string }[] = [];

        // 1. Prepare Layers
        layers.forEach(layer => {
            const wrapper = containerRef.current?.querySelector(`#layer-${layer.id}`);
            const animElement = wrapper?.firstElementChild as HTMLElement;
            if (animElement) {
                layerElements.push({
                    el: animElement,
                    originalState: animElement.style.animationPlayState,
                    originalDelay: animElement.style.animationDelay
                });
                animElement.style.animationPlayState = 'paused';
            }
        });

        try {
            const frames: string[] = [];
            const totalFrames = duration * fps;
            const delay = 1000 / fps;
            const WIDTH = canvasSize.width;
            const HEIGHT = canvasSize.height;

            for (let i = 0; i < totalFrames; i++) {
                const currentTime = i * delay;
                layerElements.forEach(item => { item.el.style.animationDelay = `-${currentTime}ms`; });
                // @ts-ignore
                const dataUrl = await toPng(containerRef.current, { width: WIDTH, height: HEIGHT, pixelRatio: 1, cacheBust: false, backgroundColor: null });
                frames.push(dataUrl);
            }

            // Restore Styles
            layerElements.forEach(item => {
                item.el.style.animationPlayState = item.originalState || '';
                item.el.style.animationDelay = item.originalDelay || '';
            });

            // 2. Encode
            if (format === 'apng') {
                const canvas = document.createElement('canvas');
                canvas.width = WIDTH; canvas.height = HEIGHT;
                const ctx = canvas.getContext('2d', { willReadFrequently: true });
                if (!ctx) throw new Error("No Context");

                const rgbaFrames: ArrayBuffer[] = [];
                for (const frameUrl of frames) {
                    const img = new Image();
                    await new Promise((resolve) => { img.onload = resolve; img.src = frameUrl; });
                    ctx.clearRect(0, 0, WIDTH, HEIGHT);
                    ctx.drawImage(img, 0, 0, WIDTH, HEIGHT);
                    rgbaFrames.push(ctx.getImageData(0, 0, WIDTH, HEIGHT).data.buffer);
                }

                const apng = UPNG.encode(rgbaFrames, WIDTH, HEIGHT, 0, new Array(rgbaFrames.length).fill(delay));
                return URL.createObjectURL(new Blob([apng], { type: 'image/png' }));

            } else if (format === 'gif') {
                // @ts-ignore
                const gif = new GIF({ workers: 2, quality: 10, width: WIDTH, height: HEIGHT, workerScript: '/gif.worker.js', transparent: 'rgba(0,0,0,0)' });
                for (const frameUrl of frames) {
                    const img = new Image();
                    await new Promise((resolve) => { img.onload = resolve; img.src = frameUrl; });
                    gif.addFrame(img, { delay: delay });
                }
                return new Promise((resolve) => {
                    gif.on('finished', (blob: Blob) => resolve(URL.createObjectURL(blob)));
                    gif.render();
                });
            }
            return null;
        } catch (err) {
            console.error(err);
            layerElements.forEach(item => {
                item.el.style.animationPlayState = item.originalState || '';
                item.el.style.animationDelay = item.originalDelay || '';
            });
            throw err;
        }
    };

    const handleExport = async (format: 'apng' | 'gif') => {
        setIsExporting(true);
        try {
            const url = await generateAnimation(format);
            if (url) downloadFile(url, `sticker-animated-${Date.now()}.${format === 'apng' ? 'png' : 'gif'}`);
        } catch (e) { alert("Export failed: " + e); }
        finally { setIsExporting(false); }
    };

    const handleLinePreview = async () => {
        setIsPreviewLoading(true);
        try {
            // Generate APNG for preview (most accurate for stickers)
            const url = await generateAnimation('apng');
            if (url) {
                setPreviewImage(url);
                setShowLinePreview(true);
            }
        } catch (e) { alert("Preview failed: " + e); }
        finally { setIsPreviewLoading(false); }
    };

    const downloadFile = (url: string, name: string) => {
        const a = document.createElement('a');
        a.href = url;
        a.download = name;
        a.click();
    };

    // ... (existing code)

    return (
        <div className="min-h-screen bg-background p-6 flex flex-col items-center">
            {/* ... header ... */}
            <header className="w-full max-w-5xl flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-black text-bronze tracking-tight flex items-center gap-2">
                        <Video className="text-primary" />
                        {t('animator.title')}
                    </h1>
                    <p className="text-bronze-light">{t('animator.subtitle')}</p>
                </div>
                <div className="flex gap-2">
                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileUpload} title="Upload" />
                    <button onClick={() => setShowGallery(true)} className="px-4 py-2 bg-cream-medium text-bronze-text rounded-lg hover:bg-cream-dark font-bold flex items-center gap-2 border border-cream-dark">
                        <ImageIcon size={18} /> {t('animator.sticker')}
                    </button>
                    <button onClick={() => fileInputRef.current?.click()} className="px-4 py-2 bg-cream-medium text-bronze-text rounded-lg hover:bg-cream-dark font-bold flex items-center gap-2 border border-cream-dark">
                        <Upload size={18} /> {t('animator.image')}
                    </button>
                    <button onClick={handleAddText} className="px-4 py-2 bg-cream-medium text-bronze-text rounded-lg hover:bg-cream-dark font-bold flex items-center gap-2 border border-cream-dark">
                        <Type size={18} /> {t('animator.text')}
                    </button>
                </div>
            </header>

            <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Left: Canvas Area (Span 2) */}
                <div className="md:col-span-2 flex flex-col items-center">
                    {/* Zoom Controls */}
                    <div className="flex items-center gap-2 mb-2 bg-white/40 backdrop-blur-md px-3 py-1.5 rounded-full shadow-sm border border-cream-dark">
                        <button
                            onClick={() => setZoom(z => Math.max(0.5, z - 0.1))}
                            className="p-1 hover:bg-cream-light rounded-full text-bronze-light"
                            title="Zoom Out"
                        >
                            <ZoomOut size={14} />
                        </button>
                        <span className="text-xs font-mono w-12 text-center text-bronze-text">{Math.round(zoom * 100)}%</span>
                        <button
                            onClick={() => setZoom(z => Math.min(2.0, z + 0.1))}
                            className="p-1 hover:bg-cream-light rounded-full text-bronze-light"
                            title="Zoom In"
                        >
                            <ZoomIn size={14} />
                        </button>
                        <button
                            onClick={() => setZoom(1)}
                            className="text-[10px] text-bronze-light hover:text-bronze ml-1 uppercase"
                        >
                            {t('animator.reset')}
                        </button>
                    </div>

                    <div className="bg-cream-medium/50 p-10 rounded-3xl shadow-inner mb-4 flex items-center justify-center min-h-[400px] w-full overflow-hidden border border-cream-dark">
                        <div style={{ transform: `scale(${zoom})`, transition: 'transform 0.2s ease-out' }}>
                            <LayerCanvas
                                layers={layers}
                                selectedLayerId={selectedLayerId}
                                onSelectLayer={setSelectedLayerId}
                                onUpdateLayer={handleUpdateLayer}
                                canvasRef={containerRef}
                                zoom={zoom}
                                width={canvasSize.width}
                                height={canvasSize.height}
                            />
                        </div>
                    </div>
                    <p className="text-bronze-light text-xs">{t('animator.dragHint')}</p>
                </div>

                {/* Right: Properties & Layers */}
                <div className="flex flex-col gap-6">
                    {/* Settings Panel */}
                    <div className="bg-white/40 backdrop-blur-md rounded-2xl shadow-sm border border-cream-dark p-4">
                        <h3 className="font-bold text-bronze-text mb-3 flex items-center gap-2 text-sm uppercase tracking-wider">
                            <Settings size={16} className="text-bronze-light" /> {t('animator.settings')}
                        </h3>
                        {/* Canvas Size */}
                        <div className="mb-4 pb-4 border-b border-cream-dark/50">
                            <label className="text-xs font-bold text-bronze-light mb-1 block">{t('animator.canvasSize')}</label>
                            <div className="flex gap-2 mb-2">
                                <select
                                    className="flex-1 text-xs border border-cream-dark rounded p-1.5 bg-cream-light text-bronze-text"
                                    value={
                                        canvasSize.width === 320 && canvasSize.height === 270 ? 'line' :
                                            canvasSize.width === 1080 && canvasSize.height === 1080 ? 'square' : 'custom'
                                    }
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        if (val === 'line') handleCanvasResize(320, 270);
                                        else if (val === 'square') handleCanvasResize(1080, 1080);
                                    }}
                                >
                                    <option value="line">LINE Sticker (320x270)</option>
                                    <option value="square">Square / IG (1080x1080)</option>
                                    <option value="custom">Custom</option>
                                </select>
                            </div>
                            <div className="flex gap-2 items-center">
                                <input
                                    type="number"
                                    className="w-16 text-xs p-1 border border-cream-dark rounded bg-cream-light text-bronze-text"
                                    value={canvasSize.width}
                                    onChange={(e) => handleCanvasResize(Number(e.target.value), canvasSize.height)}
                                    title="Width"
                                    placeholder="W"
                                />
                                <span className="text-bronze-light">x</span>
                                <input
                                    type="number"
                                    className="w-16 text-xs p-1 border border-cream-dark rounded bg-cream-light text-bronze-text"
                                    value={canvasSize.height}
                                    onChange={(e) => handleCanvasResize(canvasSize.width, Number(e.target.value))}
                                    title="Height"
                                    placeholder="H"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs font-bold text-bronze-light mb-1 block">{t('animator.duration')}</label>
                                <div className="flex bg-cream-light/50 rounded-lg p-1 border border-cream-dark/50">
                                    {[1, 2, 3, 4].map(s => (
                                        <button
                                            key={s}
                                            onClick={() => setDuration(s)}
                                            className={`flex-1 text-xs py-1 rounded font-bold transition-all ${duration === s ? 'bg-white shadow text-primary' : 'text-bronze-light hover:text-bronze-text'}`}
                                        >
                                            {s}s
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-bronze-light mb-1 block">{t('animator.fps')}</label>
                                <div className="flex bg-cream-light/50 rounded-lg p-1 border border-cream-dark/50">
                                    {[5, 10, 15, 20].map(f => (
                                        <button
                                            key={f}
                                            onClick={() => setFps(f)}
                                            className={`flex-1 text-xs py-1 rounded font-bold transition-all ${fps === f ? 'bg-white shadow text-primary' : 'text-bronze-light hover:text-bronze-text'}`}
                                        >
                                            {f}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <div className="mt-3 pt-3 border-t border-cream-dark/50 text-[10px] text-bronze-light flex justify-between">
                            <span>{t('animator.canvasSize')}: {canvasSize.width} x {canvasSize.height}</span>
                            <span>{t('animator.totalFrames')}: {duration * fps}</span>
                        </div>
                    </div>

                    <div className="bg-white/40 backdrop-blur-md rounded-2xl shadow-sm border border-cream-dark p-4">
                        <h3 className="font-bold text-bronze-text mb-2 flex items-center gap-2">
                            <Layers size={16} /> {t('animator.layers')}
                        </h3>
                        {/* Layer List */}
                        <div className="max-h-48 overflow-y-auto space-y-2 mb-4 pr-2">
                            {[...layers].reverse().map((layer) => {
                                // Find real index to determine if buttons should be disabled
                                const realIndex = layers.findIndex(l => l.id === layer.id);
                                const isTop = realIndex === layers.length - 1;
                                const isBottom = realIndex === 0;

                                return (
                                    <div
                                        key={layer.id}
                                        onClick={() => setSelectedLayerId(layer.id)}
                                        onDoubleClick={() => setEditingLayerId(layer.id)}
                                        className={`p-2 rounded-lg border flex items-center gap-2 cursor-pointer transition-all ${selectedLayerId === layer.id ? 'border-primary bg-primary/10' : 'border-cream-dark/50 hover:bg-cream-light'
                                            }`}
                                    >
                                        <div className="flex flex-col gap-0.5" onClick={(e) => e.stopPropagation()}>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleMoveLayer(layer.id, 'up'); }}
                                                className="p-0.5 hover:bg-cream-medium rounded text-bronze-light hover:text-bronze-text disabled:opacity-30"
                                                disabled={isTop}
                                                title="Move Up"
                                            >
                                                <ChevronUp size={12} />
                                            </button>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleMoveLayer(layer.id, 'down'); }}
                                                className="p-0.5 hover:bg-cream-medium rounded text-bronze-light hover:text-bronze-text disabled:opacity-30"
                                                disabled={isBottom}
                                                title="Move Down"
                                            >
                                                <ChevronDown size={12} />
                                            </button>
                                        </div>

                                        {layer.type === 'image' ? <ImageIcon size={14} className="text-bronze-light" /> : <Type size={14} className="text-bronze-light" />}

                                        {/* Rename Input or Label */}
                                        {editingLayerId === layer.id ? (
                                            <input
                                                autoFocus
                                                type="text"
                                                className="flex-1 text-xs border rounded p-1 bg-white text-bronze-text"
                                                defaultValue={layer.name || (layer.type === 'image' ? t('animator.imageLayer') : layer.content)}
                                                onBlur={(e) => handleRenameLayer(layer.id, e.target.value)}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') handleRenameLayer(layer.id, e.currentTarget.value)
                                                }}
                                                onClick={(e) => e.stopPropagation()}
                                            />
                                        ) : (
                                            <span className="text-xs font-bold truncate flex-1 leading-tight text-bronze-text">
                                                {layer.name || (layer.type === 'text' ? layer.content : t('animator.imageLayer'))}
                                            </span>
                                        )}

                                        <button onClick={(e) => { e.stopPropagation(); handleDeleteLayer(layer.id); }} className="text-xs text-secondary/70 hover:text-secondary p-1 hover:bg-secondary/10 rounded">×</button>
                                    </div>
                                );
                            })}
                            {layers.length === 0 && <p className="text-xs text-bronze-light text-center py-4">{t('animator.noLayers')}</p>}
                        </div>
                    </div>

                    <LayerProperties
                        selectedLayer={layers.find(l => l.id === selectedLayerId) || null}
                        onUpdateLayer={handleUpdateLayer}
                        onDeleteLayer={handleDeleteLayer}
                    />

                    {/* Export */}
                    <div className="bg-white/40 backdrop-blur-md border border-cream-dark rounded-2xl p-6 text-bronze-text mt-auto shadow-sm">
                        <h3 className="font-bold mb-4 flex items-center gap-2">
                            <Download size={20} className="text-secondary" /> {t('animator.export')}
                        </h3>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={() => handleExport('apng')}
                                disabled={isExporting || layers.length === 0}
                                className="bg-secondary hover:bg-secondary-hover text-white py-2 rounded-lg font-bold text-sm disabled:opacity-50 transition-colors shadow-lg shadow-secondary/20"
                            >
                                {isExporting ? '...' : 'APNG'}
                            </button>

                            <button
                                onClick={() => handleExport('gif')}
                                disabled={isExporting || layers.length === 0}
                                className="bg-cream-medium hover:bg-cream-dark text-bronze-text py-2 rounded-lg font-bold text-sm disabled:opacity-50 transition-colors border border-cream-dark"
                            >
                                {isExporting ? '...' : 'GIF'}
                            </button>
                            <button
                                onClick={handleLinePreview}
                                disabled={isExporting || isPreviewLoading || layers.length === 0}
                                className="col-span-2 bg-primary/10 hover:bg-primary/20 text-primary py-2 rounded-lg font-bold text-sm disabled:opacity-50 transition-colors flex items-center justify-center gap-2 border border-primary/20"
                            >
                                {isPreviewLoading ? <Loader2 size={16} className="animate-spin" /> : <Smartphone size={16} />}
                                {t('animator.linePreview')}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Gallery Modal */}
            {
                showGallery && (
                    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
                            <div className="p-4 border-b flex justify-between items-center">
                                <h3 className="font-bold">Select from Gallery</h3>
                                <button onClick={() => setShowGallery(false)} className="p-2 hover:bg-slate-100 rounded-full">✕</button>
                            </div>
                            <div className="flex-1 overflow-auto p-4">
                                <GalleryPicker onSelect={handleSelectImage} onClose={() => setShowGallery(false)} />
                            </div>
                        </div>
                    </div>
                )
            }

            {/* LINE Preview Modal */}
            <LinePreviewModal
                isOpen={showLinePreview}
                onClose={() => setShowLinePreview(false)}
                imageSrc={previewImage}
            />

        </div >
    );
};

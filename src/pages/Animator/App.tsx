import React, { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Download, Image as ImageIcon, Video, RotateCw, Activity, Move, Upload, Type, Plus, Layers, ChevronUp, ChevronDown } from 'lucide-react';
import './animations.css';
import { GalleryPicker } from '../../components/GalleryPicker';
// @ts-ignore
import UPNG from 'upng-js';
import GIF from 'gif.js';
import { toPng } from 'html-to-image';
import { Layer, AnimationType } from './types';
import { LayerCanvas } from './components/LayerCanvas';
import { LayerProperties } from './components/LayerProperties';
// import { v4 as uuidv4 } from 'uuid'; 

export const AnimatorApp = () => {
    const [layers, setLayers] = useState<Layer[]>([]);
    const [selectedLayerId, setSelectedLayerId] = useState<string | null>(null);
    const [isExporting, setIsExporting] = useState(false);
    const [showGallery, setShowGallery] = useState(false);

    // We target the Canvas wrapper for export
    const containerRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Helpers
    const generateId = () => Math.random().toString(36).substr(2, 9);

    const handleSelectImage = (blobs: Blob[]) => {
        const newLayers = blobs.map(blob => ({
            id: generateId(),
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

    const handleExport = async (format: 'apng' | 'gif') => {
        if (!containerRef.current || layers.length === 0) return;
        setIsExporting(true);

        const layerElements: { el: HTMLElement, originalState: string, originalDelay: string }[] = [];

        // 1. Prepare Layers for Animation Seeking
        layers.forEach(layer => {
            // Find specific element inside the DOM
            // We search for #layer-{id} 
            // Note: toPng might re-render, so we operate on the live DOM first.

            const wrapper = containerRef.current?.querySelector(`#layer-${layer.id}`);
            // The animation class is on the direct child (img or div)
            const animElement = wrapper?.firstElementChild as HTMLElement;

            if (animElement) {
                // Store original state
                layerElements.push({
                    el: animElement,
                    originalState: animElement.style.animationPlayState,
                    originalDelay: animElement.style.animationDelay
                });

                // Set to paused initially
                animElement.style.animationPlayState = 'paused';
            }
        });


        try {
            const frames: string[] = [];
            const fps = 20;
            const duration = 2000;
            const totalFrames = (duration / 1000) * fps;
            const delay = 1000 / fps;

            for (let i = 0; i < totalFrames; i++) {
                const currentTime = i * delay;

                // Sync all layers
                layerElements.forEach(item => {
                    item.el.style.animationDelay = `-${currentTime}ms`;
                });

                // Allow browser paint (awaiting tick)
                // In some environments, we might need a requestAnimationFrame or tight timeout
                // But usually toPng captures the current computed style.

                // Capture
                const dataUrl = await toPng(containerRef.current, {
                    width: 320,
                    height: 320,
                    pixelRatio: 1,
                    cacheBust: false,
                    backgroundColor: null,
                });

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
                canvas.width = 320;
                canvas.height = 320;
                const ctx = canvas.getContext('2d', { willReadFrequently: true });
                if (!ctx) throw new Error("No Canvas Context");

                const rgbaFrames: ArrayBuffer[] = [];
                for (const frameUrl of frames) {
                    const img = new Image();
                    await new Promise((resolve) => { img.onload = resolve; img.src = frameUrl; });
                    ctx.clearRect(0, 0, 320, 320);
                    ctx.drawImage(img, 0, 0, 320, 320);
                    rgbaFrames.push(ctx.getImageData(0, 0, 320, 320).data.buffer);
                }

                const apng = UPNG.encode(rgbaFrames, 320, 320, 0, new Array(rgbaFrames.length).fill(delay));
                const url = URL.createObjectURL(new Blob([apng], { type: 'image/png' }));
                downloadFile(url, `sticker-animated-${Date.now()}.png`);

            } else if (format === 'gif') {
                // @ts-ignore
                const gif = new GIF({
                    workers: 2,
                    quality: 10,
                    width: 320,
                    height: 320,
                    workerScript: '/gif.worker.js',
                    transparent: 'rgba(0,0,0,0)'
                });

                for (const frameUrl of frames) {
                    const img = new Image();
                    await new Promise((resolve) => { img.onload = resolve; img.src = frameUrl; });
                    gif.addFrame(img, { delay: delay });
                }

                gif.on('finished', (blob: Blob) => {
                    downloadFile(URL.createObjectURL(blob), `sticker-animated-${Date.now()}.gif`);
                });
                gif.render();
            }

        } catch (err) {
            console.error(err);
            alert("Export failed: " + err);
            // Emergency Restore in case of error
            layerElements.forEach(item => {
                item.el.style.animationPlayState = item.originalState || '';
                item.el.style.animationDelay = item.originalDelay || '';
            });
        } finally {
            setIsExporting(false);
        }
    };

    const downloadFile = (url: string, name: string) => {
        const a = document.createElement('a');
        a.href = url;
        a.download = name;
        a.click();
    };

    return (
        <div className="min-h-screen bg-slate-50 p-6 flex flex-col items-center">
            <header className="w-full max-w-5xl flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                        <Video className="text-violet-600" />
                        Administrator
                    </h1>
                    <p className="text-slate-500">Video Animator - Multi-Layer Composition</p>
                </div>
                <div className="flex gap-2">
                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileUpload} title="Upload" />
                    <button onClick={() => setShowGallery(true)} className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 font-bold flex items-center gap-2">
                        <ImageIcon size={18} /> Sticker
                    </button>
                    <button onClick={() => fileInputRef.current?.click()} className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 font-bold flex items-center gap-2">
                        <Upload size={18} /> Image
                    </button>
                    <button onClick={handleAddText} className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 font-bold flex items-center gap-2">
                        <Type size={18} /> Text
                    </button>
                </div>
            </header>

            <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Left: Canvas Area (Span 2) */}
                <div className="md:col-span-2 flex flex-col items-center">
                    <div className="bg-slate-200 p-10 rounded-3xl shadow-inner mb-4">
                        <LayerCanvas
                            layers={layers}
                            selectedLayerId={selectedLayerId}
                            onSelectLayer={setSelectedLayerId}
                            onUpdateLayer={handleUpdateLayer}
                            canvasRef={containerRef}
                        />
                    </div>
                    <p className="text-slate-400 text-xs">Drag to move layers • Click to select</p>
                </div>

                {/* Right: Properties & Layers */}
                <div className="flex flex-col gap-6">
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4">
                        <h3 className="font-bold text-slate-800 mb-2 flex items-center gap-2">
                            <Layers size={16} /> Layers
                        </h3>
                        {/* Layer List */}
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
                                        className={`p-2 rounded-lg border flex items-center gap-2 cursor-pointer transition-all ${selectedLayerId === layer.id ? 'border-violet-500 bg-violet-50' : 'border-slate-100 hover:bg-slate-50'
                                            }`}
                                    >
                                        <div className="flex flex-col gap-0.5" onClick={(e) => e.stopPropagation()}>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleMoveLayer(layer.id, 'up'); }}
                                                className="p-0.5 hover:bg-slate-200 rounded text-slate-400 hover:text-slate-600 disabled:opacity-30"
                                                disabled={isTop}
                                                title="Move Up"
                                            >
                                                <ChevronUp size={12} />
                                            </button>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleMoveLayer(layer.id, 'down'); }}
                                                className="p-0.5 hover:bg-slate-200 rounded text-slate-400 hover:text-slate-600 disabled:opacity-30"
                                                disabled={isBottom}
                                                title="Move Down"
                                            >
                                                <ChevronDown size={12} />
                                            </button>
                                        </div>

                                        {layer.type === 'image' ? <ImageIcon size={14} className="text-slate-400" /> : <Type size={14} className="text-slate-400" />}
                                        <span className="text-xs font-bold truncate flex-1">{layer.type === 'text' ? layer.content : 'Image Layer'}</span>
                                        <button onClick={(e) => { e.stopPropagation(); handleDeleteLayer(layer.id); }} className="text-xs text-red-300 hover:text-red-500 p-1 hover:bg-red-50 rounded">×</button>
                                    </div>
                                );
                            })}
                            {layers.length === 0 && <p className="text-xs text-slate-300 text-center py-4">No layers added</p>}
                        </div>
                    </div>

                    <LayerProperties
                        selectedLayer={layers.find(l => l.id === selectedLayerId) || null}
                        onUpdateLayer={handleUpdateLayer}
                        onDeleteLayer={handleDeleteLayer}
                    />

                    {/* Export */}
                    <div className="bg-slate-900 rounded-2xl p-6 text-white mt-auto">
                        <h3 className="font-bold mb-4 flex items-center gap-2">
                            <Download size={20} className="text-emerald-400" /> Export
                        </h3>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={() => handleExport('apng')}
                                disabled={isExporting || layers.length === 0}
                                className="bg-emerald-500 hover:bg-emerald-600 py-2 rounded-lg font-bold text-sm disabled:opacity-50"
                            >
                                {isExporting ? '...' : 'APNG'}
                            </button>
                            <button
                                onClick={() => handleExport('gif')}
                                disabled={isExporting || layers.length === 0}
                                className="bg-white/10 hover:bg-white/20 py-2 rounded-lg font-bold text-sm disabled:opacity-50"
                            >
                                {isExporting ? '...' : 'GIF'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Gallery Modal */}
            {showGallery && (
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
            )}

        </div>
    );
};

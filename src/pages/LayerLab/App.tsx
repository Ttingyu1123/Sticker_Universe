import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Upload, Eraser, Brush, Download, Image as ImageIcon, Loader2, Layers, Undo, Redo, Save } from 'lucide-react';
import { Link } from 'react-router-dom';
import { MaskCanvas } from './components/MaskCanvas';
import { generateMaskFromAI } from './utils/maskUtils';
import { GalleryPicker } from '../../components/GalleryPicker';
import { saveStickerToDB } from '../../db';

export const LayerLabApp = () => {
    const { t } = useTranslation();
    const [originalImage, setOriginalImage] = useState<HTMLImageElement | null>(null);
    const [maskCanvas, setMaskCanvas] = useState<HTMLCanvasElement | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);

    // Tools: 'erase', 'restore', 'magic-wand' (new), 'move' (new), 'crop' (new)
    const [tool, setTool] = useState<'erase' | 'restore' | 'magic-wand' | 'move' | 'crop'>('erase');
    const [brushSize, setBrushSize] = useState(40);
    const [brushHardness, setBrushHardness] = useState(0.5);
    const [tolerance, setTolerance] = useState(10); // For Magic Wand

    const [zoom, setZoom] = useState(1);
    const [pan, setPan] = useState({ x: 0, y: 0 });
    const [bgColor, setBgColor] = useState<'checkerboard' | 'white' | 'black'>('checkerboard');
    const [layoutDims, setLayoutDims] = useState<{ width: number, height: number } | null>(null);

    // History & Gallery
    const [history, setHistory] = useState<ImageData[]>([]);
    const [historyIndex, setHistoryIndex] = useState(-1);
    const [historyVersion, setHistoryVersion] = useState(0); // To force re-render
    const [showGalleryPicker, setShowGalleryPicker] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const workspaceRef = useRef<HTMLDivElement>(null);

    // Auto-Fit Image on Load
    useEffect(() => {
        if (originalImage && workspaceRef.current) {
            const { width: wsW, height: wsH } = workspaceRef.current.getBoundingClientRect();
            const { width: imgW, height: imgH } = originalImage;

            // Calculate fit scale (with some padding)
            const padding = 64;
            const scaleX = (wsW - padding) / imgW;
            const scaleY = (wsH - padding) / imgH;
            const fitScale = Math.min(scaleX, scaleY, 1); // Don't zoom in greater than 1x by default

            setZoom(fitScale);
            setPan({ x: 0, y: 0 });
            setLayoutDims({
                width: imgW * fitScale,
                height: imgH * fitScale
            });
        }
    }, [originalImage]);

    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            loadImage(file);
        }
    };

    const loadImage = (blob: Blob) => {
        const url = URL.createObjectURL(blob);
        const img = new Image();
        img.onload = () => {
            setOriginalImage(img);
            setMaskCanvas(null);
            setHistory([]);
            setHistoryIndex(-1);
        };
        img.src = url;
    };

    const handleGallerySelect = async (blobs: Blob[]) => {
        if (blobs.length > 0) {
            loadImage(blobs[0]);
        }
    };

    const handleRunAI = async () => {
        if (!originalImage) return;
        setIsProcessing(true);
        try {
            const { maskCanvas: generatedMask } = await generateMaskFromAI(originalImage.src);
            setMaskCanvas(generatedMask);

            // Push initial state to history
            const ctx = generatedMask.getContext('2d');
            if (ctx) {
                const data = ctx.getImageData(0, 0, generatedMask.width, generatedMask.height);
                setHistory([data]);
                setHistoryIndex(0);
            }
        } catch (e) {
            console.error(e);
            alert("AI Removal Failed");
        } finally {
            setIsProcessing(false);
        }
    };

    // HISTORY LOGIC
    const handleInteractionEnd = () => {
        if (!maskCanvas) return;
        const ctx = maskCanvas.getContext('2d');
        if (!ctx) return;

        const newData = ctx.getImageData(0, 0, maskCanvas.width, maskCanvas.height);

        const newHistory = history.slice(0, historyIndex + 1);
        newHistory.push(newData);

        // Cap history at 20 steps
        if (newHistory.length > 20) newHistory.shift();

        setHistory(newHistory);
        setHistoryIndex(newHistory.length - 1);
    };

    const handleUndo = () => {
        if (historyIndex <= 0 || !maskCanvas) return;
        const newIndex = historyIndex - 1;
        const data = history[newIndex];

        const ctx = maskCanvas.getContext('2d');
        if (ctx) {
            ctx.putImageData(data, 0, 0);
            setHistoryIndex(newIndex);
            setHistoryVersion(v => v + 1);
        }
    };

    const handleRedo = () => {
        if (historyIndex >= history.length - 1 || !maskCanvas) return;
        const newIndex = historyIndex + 1;
        const data = history[newIndex];

        const ctx = maskCanvas.getContext('2d');
        if (ctx) {
            ctx.putImageData(data, 0, 0);
            setHistoryIndex(newIndex);
            setHistoryVersion(v => v + 1);
        }
    };


    const getExportUrl = (): string | null => {
        const canvas = document.querySelector('main canvas') as HTMLCanvasElement;
        return canvas ? canvas.toDataURL('image/png') : null;
    };

    const handleExport = () => {
        const url = getExportUrl();
        if (url) {
            const a = document.createElement('a');
            a.href = url;
            a.download = 'smart-eraser-export.png';
            a.click();
        }
    };

    const handleSaveToGallery = async () => {
        const url = getExportUrl();
        if (!url) return;
        setIsSaving(true);
        try {
            await saveStickerToDB({
                id: crypto.randomUUID(),
                imageUrl: url,
                timestamp: Date.now(),
                phrase: 'Smart Eraser Edit'
            });
            alert(t('packager.status.complete') || 'Saved to Gallery!');
        } catch (error) {
            console.error(error);
            alert('Failed to save');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            {/* Header */}
            <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between sticky top-0 z-10 shadow-sm">
                <div className="flex items-center gap-4">
                    <Link to="/" className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors">
                        <ArrowLeft size={20} />
                    </Link>
                    <div>
                        <h1 className="text-xl font-black text-slate-800 flex items-center gap-2">
                            <Layers className="text-violet-600" />
                            {t('app.smartEraser') || 'Smart Eraser'}
                        </h1>
                        <p className="text-xs text-slate-500 font-medium">{t('eraser.subtitle') || 'Non-destructive Mask Editor'}</p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-sm transition-colors flex items-center gap-2"
                    >
                        <Upload size={18} />
                        {t('eraser.upload.title') || 'Load Image'}
                    </button>
                    <button
                        onClick={() => setShowGalleryPicker(true)}
                        className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-sm transition-colors flex items-center gap-2"
                    >
                        <ImageIcon size={18} />
                        {t('app.selectFromGallery') || 'From Gallery'}
                    </button>
                    <button
                        onClick={handleSaveToGallery}
                        disabled={!originalImage || !maskCanvas || isSaving}
                        className="px-4 py-2 bg-pink-100 hover:bg-pink-200 text-pink-700 rounded-xl font-bold text-sm transition-colors flex items-center gap-2 disabled:opacity-50"
                    >
                        {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                        {t('eraser.toolbar.saveToGallery') || 'Save to Gallery'}
                    </button>
                    <button
                        onClick={handleExport}
                        disabled={!originalImage || !maskCanvas}
                        className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-bold text-sm transition-colors flex items-center gap-2 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Download size={18} />
                        {t('eraser.toolbar.export') || 'Export PNG'}
                    </button>
                </div>
            </header>

            {/* Main Workspace */}
            <main className="flex-1 flex overflow-hidden">
                {/* Left: Toolbar */}
                <div className="w-64 flex-shrink-0 bg-white border-r border-slate-200 p-4 flex flex-col gap-6 z-10 overflow-y-auto">

                    {/* Tool Selection */}
                    <div className="space-y-3">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t('eraser.toolbar.tools')}</label>
                        <div className="grid grid-cols-2 gap-2">
                            <button
                                onClick={() => setTool('erase')}
                                className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all ${tool === 'erase' ? 'border-violet-500 bg-violet-50 text-violet-700' : 'border-slate-100 hover:border-slate-200 text-slate-500'}`}
                            >
                                <Eraser size={24} className="mb-1" />
                                <span className="text-xs font-bold">{t('eraser.toolbar.eraser')}</span>
                            </button>
                            <button
                                onClick={() => setTool('restore')}
                                className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all ${tool === 'restore' ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-slate-100 hover:border-slate-200 text-slate-500'}`}
                            >
                                <Brush size={24} className="mb-1" />
                                <span className="text-xs font-bold">{t('eraser.toolbar.restore')}</span>
                            </button>
                            <button
                                onClick={() => setTool('magic-wand')}
                                className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all ${tool === 'magic-wand' ? 'border-purple-500 bg-purple-50 text-purple-700' : 'border-slate-100 hover:border-slate-200 text-slate-500'}`}
                            >
                                <div className="text-2xl mb-1">🪄</div>
                                <span className="text-xs font-bold">{t('eraser.toolbar.magic')}</span>
                            </button>
                            <button
                                onClick={() => setTool('move')}
                                className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all ${tool === 'move' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-100 hover:border-slate-200 text-slate-500'}`}
                            >
                                <div className="text-2xl mb-1">✋</div>
                                <span className="text-xs font-bold">{t('eraser.toolbar.move')}</span>
                            </button>
                        </div>
                    </div>

                    {/* Tool Settings (Dynamic based on Tool) */}
                    <div className="space-y-4">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t('app.settings')}</label>

                        {tool === 'magic-wand' ? (
                            <div className="space-y-2">
                                <div className="flex justify-between text-xs font-bold text-slate-600">
                                    <span>{t('eraser.toolbar.tolerance')}</span>
                                    <span>{tolerance}</span>
                                </div>
                                <input
                                    type="range"
                                    min="1" max="100"
                                    value={tolerance}
                                    onChange={(e) => setTolerance(Number(e.target.value))}
                                    className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
                                />
                            </div>
                        ) : (tool === 'erase' || tool === 'restore') ? (
                            <>
                                <div className="space-y-2">
                                    <div className="flex justify-between text-xs font-bold text-slate-600">
                                        <span>{t('eraser.toolbar.size')}</span>
                                        <span>{brushSize}px</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="1" max="200"
                                        value={brushSize}
                                        onChange={(e) => setBrushSize(Number(e.target.value))}
                                        className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-violet-600"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <div className="flex justify-between text-xs font-bold text-slate-600">
                                        <span>Hardness</span>
                                        <span>{Math.round(brushHardness * 100)}%</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="0" max="1" step="0.1"
                                        value={brushHardness}
                                        onChange={(e) => setBrushHardness(Number(e.target.value))}
                                        className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-violet-600"
                                    />
                                </div>
                            </>
                        ) : (
                            <div className="text-xs text-slate-400 italic">No settings for this tool</div>
                        )}
                    </div>

                    {/* History Controls */}
                    <div className="space-y-3">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t('eraser.history')}</label>
                        <div className="flex gap-2">
                            <button
                                onClick={handleUndo}
                                disabled={historyIndex <= 0}
                                className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl flex items-center justify-center gap-2 disabled:opacity-50"
                                title={t('eraser.toolbar.undo') || "Undo"}
                            >
                                <Undo size={18} />
                            </button>
                            <button
                                onClick={handleRedo}
                                disabled={historyIndex >= history.length - 1}
                                className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl flex items-center justify-center gap-2 disabled:opacity-50"
                                title={t('eraser.toolbar.redo') || "Redo"}
                            >
                                <Redo size={18} />
                            </button>
                        </div>
                    </div>

                    {/* View Controls */}
                    <div className="space-y-4 pt-4 border-t border-slate-100">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t('eraser.zoom') || 'View'}</label>

                        {/* Zoom */}
                        <div className="flex items-center gap-2">
                            <button onClick={() => setZoom(z => Math.max(0.1, z - 0.1))} className="p-1 bg-slate-100 rounded hover:bg-slate-200 w-8">-</button>
                            <span className="text-xs font-bold text-slate-600 flex-1 text-center">{Math.round(zoom * 100)}%</span>
                            <button onClick={() => setZoom(z => Math.min(5, z + 0.1))} className="p-1 bg-slate-100 rounded hover:bg-slate-200 w-8">+</button>
                        </div>

                        {/* Background */}
                        <div className="flex gap-1 bg-slate-100 p-1 rounded-lg">
                            {['checkerboard', 'white', 'black'].map((bg) => (
                                <button
                                    key={bg}
                                    onClick={() => setBgColor(bg as any)}
                                    className={`flex-1 h-6 rounded-md border ${bgColor === bg ? 'border-violet-500 shadow-sm' : 'border-transparent'} ${bg === 'checkerboard' ? 'bg-[url(https://img.ly/assets/demo-assets/transparent-bg.png)] bg-[length:10px_10px]' : bg === 'white' ? 'bg-white' : 'bg-black'}`}
                                    title={bg}
                                />
                            ))}
                        </div>
                    </div>

                    {/* AI Actions */}
                    <div className="mt-auto">
                        <button
                            onClick={handleRunAI}
                            disabled={!originalImage || isProcessing}
                            className="w-full py-3 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white rounded-xl font-bold text-sm shadow-lg shadow-violet-200 transition-all flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isProcessing ? <Loader2 size={18} className="animate-spin" /> : <ImageIcon size={18} />}
                            {t('packager.phase1.aiRemoveBg') || 'AI Auto Remove'}
                        </button>
                        <p className="text-[10px] text-slate-400 text-center mt-2">Powered by @imgly/background-removal</p>
                    </div>
                </div>

                {/* Center: Canvas Area */}
                <div
                    ref={workspaceRef}
                    className={`flex-1 flex items-center justify-center p-8 relative overflow-hidden transition-colors duration-300 ${bgColor === 'checkerboard' ? 'bg-slate-100' :
                        bgColor === 'white' ? 'bg-white' : 'bg-slate-900'
                        }`}
                >
                    {/* Workspace Background (Optional Global Pattern, currently solid/neutral) */}
                    {bgColor === 'checkerboard' && (
                        <div className="absolute inset-0 opacity-5 pointer-events-none"
                            style={{
                                backgroundImage: 'radial-gradient(#000 1px, transparent 1px)',
                                backgroundSize: '20px 20px'
                            }}
                        />
                    )}

                    {originalImage ? (
                        <div
                            className="relative shadow-2xl rounded-lg overflow-hidden bg-white"
                            style={{
                                width: layoutDims ? layoutDims.width : 'auto',
                                height: layoutDims ? layoutDims.height : 'auto'
                            }}
                        >
                            {maskCanvas ? (
                                <MaskCanvas
                                    originalImage={originalImage}
                                    maskCanvas={maskCanvas}
                                    tool={tool}
                                    brushSize={brushSize}
                                    brushHardness={brushHardness}
                                    zoom={zoom}
                                    pan={pan}
                                    bgColor={bgColor}
                                    tolerance={tolerance}
                                    onPanChange={setPan}
                                    onInteractionEnd={handleInteractionEnd}
                                    historyVersion={historyVersion}
                                />
                            ) : (
                                <img src={originalImage.src} alt="Original" className="max-w-full max-h-[80vh] object-contain" />
                            )}

                            {/* Quick Hint if no mask yet */}
                            {!maskCanvas && !isProcessing && (
                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                    <div className="bg-black/60 text-white px-4 py-2 rounded-full font-bold backdrop-blur-sm animate-pulse">
                                        Click "AI Auto Remove" to start
                                    </div>
                                </div>
                            )}

                            {isProcessing && (
                                <div className="absolute inset-0 flex items-center justify-center bg-white/50 backdrop-blur-sm z-20">
                                    <div className="flex flex-col items-center">
                                        <Loader2 size={40} className="text-violet-600 animate-spin mb-2" />
                                        <span className="font-bold text-violet-800">Processing AI...</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="text-center text-slate-400">
                            <div className="w-24 h-24 bg-slate-200 rounded-full flex items-center justify-center mx-auto mb-4">
                                <ImageIcon size={48} className="text-slate-300" />
                            </div>
                            <p className="text-lg font-bold text-slate-500">{t('eraser.upload.title')}</p>
                            <p className="text-sm">{t('eraser.upload.dragDrop')}</p>
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="mt-4 px-6 py-2 bg-white border border-slate-300 hover:border-violet-500 hover:text-violet-600 rounded-lg font-bold text-sm transition-all"
                            >
                                {t('eraser.upload.title')}
                            </button>
                        </div>
                    )}
                </div>
            </main>

            {/* Hidden Input */}
            <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                accept="image/*"
                onChange={handleFileUpload}
            />

            {/* Gallery Picker Modal */}
            {showGalleryPicker && (
                <GalleryPicker
                    onSelect={handleGallerySelect}
                    onClose={() => setShowGalleryPicker(false)}
                />
            )}
        </div>
    );
};

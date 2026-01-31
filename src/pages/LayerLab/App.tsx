import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Upload, Eraser, Brush, Download, Image as ImageIcon, Loader2, Undo, Redo, Save, Palette, Sun, Sparkles, Trash2, Settings } from 'lucide-react';
import { MaskCanvas } from './components/MaskCanvas';
import { generateMaskFromAI, processMask, AISettings } from './utils/maskUtils';
import { GalleryPicker } from '../../components/GalleryPicker';
import { saveStickerToDB } from '../../db';

export const LayerLabApp = () => {
    const { t } = useTranslation();
    const [originalImage, setOriginalImage] = useState<HTMLImageElement | null>(null);
    const [maskCanvas, setMaskCanvas] = useState<HTMLCanvasElement | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);

    // AI Settings
    const [aiSettings, setAiSettings] = useState<AISettings>({
        edgeTolerance: 0,
        protectHoles: false,
        enhanceText: false
    });
    const rawAiMaskRef = useRef<HTMLCanvasElement | null>(null); // Store raw AI result for re-processing

    // Tools: 'erase', 'restore', 'magic-wand' (new), 'move' (new), 'crop' (new)
    const [tool, setTool] = useState<'erase' | 'restore' | 'magic-wand' | 'move' | 'crop'>('erase');
    const [brushSize, setBrushSize] = useState(40);
    const [brushHardness, setBrushHardness] = useState(0.5);
    const [tolerance, setTolerance] = useState(10); // For Magic Wand

    const [zoom, setZoom] = useState(1);
    const [pan, setPan] = useState({ x: 0, y: 0 });
    const [bgColor, setBgColor] = useState<'checkerboard' | 'white' | 'black'>('checkerboard');

    // History & Gallery
    const [history, setHistory] = useState<ImageData[]>([]);
    const [historyIndex, setHistoryIndex] = useState(-1);
    const [historyVersion, setHistoryVersion] = useState(0); // To force re-render
    const [showGalleryPicker, setShowGalleryPicker] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Effects State
    const [strokeConfig, setStrokeConfig] = useState({ enabled: false, color: '#ffffff', size: 10 });
    const [shadowConfig, setShadowConfig] = useState({ enabled: false, color: 'rgba(0,0,0,0.5)', blur: 20, offset: { x: 5, y: 5 } });

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
            setZoom(fitScale);
            setPan({ x: 0, y: 0 });
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

    const handleFitView = () => {
        if (originalImage && workspaceRef.current) {
            const { width: wsW, height: wsH } = workspaceRef.current.getBoundingClientRect();
            const { width: imgW, height: imgH } = originalImage;

            // Calculate fit scale (with some padding)
            // Mobile: Reduced padding as requested by user to maximize view
            const padding = 16;
            const scaleX = (wsW - padding) / imgW;
            const scaleY = (wsH - padding) / imgH;

            const fitScale = Math.min(scaleX, scaleY, 1);

            setZoom(fitScale);
            setPan({ x: 0, y: 0 });
        }
    };

    const handleRunAI = async () => {
        if (!originalImage) return;
        setIsProcessing(true);
        try {
            const { maskCanvas: generatedMask } = await generateMaskFromAI(originalImage.src);

            // Store RAW copy for re-processing
            const raw = document.createElement('canvas');
            raw.width = generatedMask.width;
            raw.height = generatedMask.height;
            raw.getContext('2d')?.drawImage(generatedMask, 0, 0);
            rawAiMaskRef.current = raw;

            // Apply current settings
            const processed = processMask(generatedMask, aiSettings);
            setMaskCanvas(processed);

            // Push initial state to history
            const ctx = processed.getContext('2d');
            if (ctx) {
                const data = ctx.getImageData(0, 0, processed.width, processed.height);
                setHistory([data]);
                setHistoryIndex(0);
            }

            // Auto-fit view after generation to ensure visibility
            setTimeout(handleFitView, 100);

        } catch (e) {
            console.error(e);
            alert("AI Removal Failed");
        } finally {
            setIsProcessing(false);
        }
    };

    // Helper to update mask when settings change
    const updateMaskSettings = (newSettings: AISettings) => {
        setAiSettings(newSettings);
        if (rawAiMaskRef.current) {
            const clone = document.createElement('canvas');
            clone.width = rawAiMaskRef.current.width;
            clone.height = rawAiMaskRef.current.height;
            clone.getContext('2d')?.drawImage(rawAiMaskRef.current, 0, 0);

            const processed = processMask(clone, newSettings);
            setMaskCanvas(processed);
            // Note: We don't push to history on every slider change to avoid spam. 
            // Ideally we should push on mouseUp.
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

    const [isPanning, setIsPanning] = useState(false);
    const lastPanPosition = useRef<{ x: number, y: number } | null>(null);

    // Auto-fit when image loads
    useEffect(() => {
        if (originalImage) {
            // Small timeout to ensure DOM is ready
            setTimeout(handleFitView, 50);
        }
    }, [originalImage]);

    const handlePointerDown = (e: React.MouseEvent | React.TouchEvent) => {
        // If we are mostly interacting with MaskCanvas (which stops propagation), this won't fire.
        // But for Preview Mode, this fires.
        setIsPanning(true);
        const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
        lastPanPosition.current = { x: clientX, y: clientY };
    };

    const handlePointerMove = (e: React.MouseEvent | React.TouchEvent) => {
        if (!isPanning || !lastPanPosition.current) return;

        const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;

        const dx = clientX - lastPanPosition.current.x;
        const dy = clientY - lastPanPosition.current.y;

        setPan(p => ({ x: p.x + dx, y: p.y + dy }));
        lastPanPosition.current = { x: clientX, y: clientY };
    };

    const handlePointerUp = () => {
        setIsPanning(false);
        lastPanPosition.current = null;
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
        <div className="h-[100dvh] bg-background flex flex-col overflow-hidden text-bronze-text">
            {/* Header */}
            <header className="bg-white border-b border-cream-dark px-6 py-4 flex items-center justify-between sticky top-0 z-10 shadow-sm flex-shrink-0">
                <div className="flex-1"></div> {/* Spacer to push buttons right if justify-between is used, or just let justify-end work */}

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        className="p-2 md:px-4 md:py-2 bg-cream-light hover:bg-cream-medium text-bronze-text border border-cream-dark hover:border-bronze-light rounded-xl font-bold text-sm transition-colors flex items-center gap-2"
                        title={t('eraser.upload.title') || 'Load Image'}
                    >
                        <Upload size={18} />
                        <span className="hidden md:inline">{t('eraser.upload.title') || 'Load Image'}</span>
                    </button>
                    <button
                        onClick={() => setShowGalleryPicker(true)}
                        className="p-2 md:px-4 md:py-2 bg-cream-light hover:bg-cream-medium text-bronze-text border border-cream-dark hover:border-bronze-light rounded-xl font-bold text-sm transition-colors flex items-center gap-2"
                        title={t('app.selectFromGallery')}
                    >
                        <ImageIcon size={18} />
                        <span className="hidden md:inline">{t('app.selectFromGallery') || 'From Gallery'}</span>
                    </button>
                    <button
                        onClick={handleSaveToGallery}
                        disabled={!originalImage || !maskCanvas || isSaving}
                        className="p-2 md:px-4 md:py-2 bg-secondary/10 hover:bg-secondary/20 text-secondary border border-secondary/30 rounded-xl font-bold text-sm transition-colors flex items-center gap-2 disabled:opacity-50"
                        title={t('eraser.toolbar.saveToGallery')}
                    >
                        {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                        <span className="hidden md:inline">{t('eraser.toolbar.saveToGallery') || 'Save to Gallery'}</span>
                    </button>
                    <button
                        onClick={handleExport}
                        disabled={!originalImage || !maskCanvas}
                        className="p-2 md:px-4 md:py-2 bg-primary hover:bg-primary-hover text-white rounded-xl font-bold text-sm transition-colors flex items-center gap-2 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                        title={t('eraser.toolbar.export')}
                    >
                        <Download size={18} />
                        <span className="hidden md:inline">{t('eraser.toolbar.export') || 'Export PNG'}</span>
                    </button>
                </div>
            </header>

            {/* Main Workspace */}
            <main className="flex-1 flex flex-col lg:flex-row overflow-hidden">
                {/* Center: Canvas Area (Top on mobile) */}
                {/* Center: Canvas Area (Top on mobile) */}
                <div
                    ref={workspaceRef}
                    className={`flex-1 flex items-center justify-center p-4 lg:p-8 relative overflow-hidden transition-colors duration-300 lg:order-2 touch-none select-none cursor-grab active:cursor-grabbing ${bgColor === 'checkerboard' ? 'bg-cream-medium' :
                        bgColor === 'white' ? 'bg-white' : bgColor === 'black' ? 'bg-slate-900' : 'bg-[#00FF00]'
                        }`}
                    onMouseDown={handlePointerDown}
                    onMouseMove={handlePointerMove}
                    onMouseUp={handlePointerUp}
                    onMouseLeave={handlePointerUp}
                    onTouchStart={handlePointerDown}
                    onTouchMove={handlePointerMove}
                    onTouchEnd={handlePointerUp}
                >
                    {/* Workspace Background (Optional Global Pattern, currently solid/neutral) */}
                    {
                        bgColor === 'checkerboard' && (
                            <div className="absolute inset-0 opacity-5 pointer-events-none"
                                style={{
                                    backgroundImage: 'radial-gradient(#000 1px, transparent 1px)',
                                    backgroundSize: '20px 20px'
                                }}
                            />
                        )
                    }

                    {
                        originalImage ? (
                            <>
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
                                        strokeConfig={strokeConfig}
                                        shadowConfig={shadowConfig}
                                    />
                                ) : (
                                    /* Wrapped Preview Image for robust rendering */
                                    <div
                                        className="max-w-none shrink-0 pointer-events-none origin-center"
                                        style={{
                                            width: `${originalImage.width}px`,
                                            height: `${originalImage.height}px`,
                                            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                                            transformOrigin: 'center center',
                                            willChange: 'transform'
                                        }}
                                    >
                                        <img
                                            src={originalImage.src}
                                            alt="Original"
                                            className="w-full h-full object-contain block"
                                            draggable={false}
                                        />
                                    </div>
                                )}

                                {/* Quick Hint if no mask yet */}
                                {!maskCanvas && !isProcessing && (
                                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                        <div className="bg-bronze-text/80 text-white px-4 py-2 rounded-full font-bold backdrop-blur-sm animate-pulse z-10">
                                            Click "AI Auto Remove" to start
                                        </div>
                                    </div>
                                )}

                                {isProcessing && (
                                    <div className="absolute inset-0 flex items-center justify-center bg-white/50 backdrop-blur-sm z-20">
                                        <div className="flex flex-col items-center">
                                            <Loader2 size={40} className="text-primary animate-spin mb-2" />
                                            <span className="font-bold text-primary-dark">Processing AI...</span>
                                        </div>
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="text-center text-bronze-light">
                                <div className="w-24 h-24 bg-cream-light rounded-full flex items-center justify-center mx-auto mb-4 border border-cream-dark">
                                    <ImageIcon size={48} className="text-bronze-light/50" />
                                </div>
                                <p className="text-lg font-bold text-bronze-text">{t('eraser.upload.title')}</p>
                                <p className="text-sm text-bronze-light/80">{t('eraser.upload.dragDrop')}</p>
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    className="mt-4 px-6 py-2 bg-white border border-cream-dark hover:border-primary/50 hover:text-primary rounded-lg font-bold text-sm transition-all shadow-sm"
                                >
                                    {t('eraser.upload.title')}
                                </button>
                            </div>
                        )
                    }
                </div>

                {/* Left: Toolbar (Bottom on mobile) */}
                <div className="w-full lg:w-64 h-[45vh] lg:h-auto flex-shrink-0 bg-white border-t lg:border-t-0 lg:border-r border-cream-dark p-4 flex flex-col gap-6 z-10 overflow-y-auto lg:order-1 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] lg:shadow-none">

                    {/* Top: AI Actions & Reset */}
                    <div className="space-y-3 pb-4 border-b border-cream-light">
                        <button
                            onClick={handleRunAI}
                            disabled={!originalImage || isProcessing}
                            className="w-full py-3 bg-primary hover:bg-primary-hover text-white rounded-xl font-bold text-sm shadow-lg shadow-primary/20 transition-all flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isProcessing ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
                            {t('packager.phase1.aiRemoveBg') || 'AI Auto Remove'}
                        </button>

                        {/* Advanced Settings */}
                        {
                            originalImage && (
                                <div className="space-y-3 bg-cream-light p-3 rounded-xl border border-cream-dark">
                                    <div className="flex items-center gap-2 text-xs font-bold text-bronze-light mb-2">
                                        <Settings size={14} />
                                        <span>{t('eraser.toolbar.advancedSettings') || 'Advanced AI Settings'}</span>
                                    </div>

                                    {/* Edge Tolerance */}
                                    <div className="space-y-1">
                                        <div className="flex justify-between text-[10px] font-bold text-bronze-light uppercase">
                                            <span>{t('eraser.toolbar.edgeTolerance') || 'Edge Tolerance'}</span>
                                            <span>{aiSettings.edgeTolerance}</span>
                                        </div>
                                        <input
                                            type="range"
                                            min="-10" max="10"
                                            value={aiSettings.edgeTolerance}
                                            onChange={(e) => updateMaskSettings({ ...aiSettings, edgeTolerance: Number(e.target.value) })}
                                            className="w-full h-1.5 bg-cream-medium rounded-lg appearance-none cursor-pointer accent-primary"
                                        />
                                        <div className="flex justify-between text-[10px] text-bronze-light/70">
                                            <span>{t('eraser.toolbar.shrink') || 'Shrink'}</span>
                                            <span>{t('eraser.toolbar.grow') || 'Grow'}</span>
                                        </div>
                                    </div>

                                    {/* Toggles */}
                                    <div className="flex flex-col gap-2">
                                        <label className="flex items-center justify-between cursor-pointer">
                                            <span className="text-xs font-medium text-bronze-text">{t('eraser.toolbar.protectClosed') || 'Protect Closed Areas'}</span>
                                            <input
                                                type="checkbox"
                                                checked={aiSettings.protectHoles}
                                                onChange={(e) => updateMaskSettings({ ...aiSettings, protectHoles: e.target.checked })}
                                                className="w-4 h-4 rounded text-primary focus:ring-primary border-cream-dark"
                                            />
                                        </label>
                                        <label className="flex items-center justify-between cursor-pointer">
                                            <span className="text-xs font-medium text-bronze-text">{t('eraser.toolbar.enhanceText') || 'Enhance Text'}</span>
                                            <input
                                                type="checkbox"
                                                checked={aiSettings.enhanceText}
                                                onChange={(e) => updateMaskSettings({ ...aiSettings, enhanceText: e.target.checked })}
                                                className="w-4 h-4 rounded text-primary focus:ring-primary border-cream-dark"
                                            />
                                        </label>
                                    </div>
                                </div>
                            )
                        }

                        <button
                            onClick={() => {
                                setOriginalImage(null);
                                setMaskCanvas(null);
                                setAiSettings({ edgeTolerance: 0, protectHoles: false, enhanceText: false });
                                rawAiMaskRef.current = null;
                            }}
                            disabled={!originalImage}
                            className="w-full py-2 bg-cream-light hover:bg-cream-medium text-bronze-text rounded-lg font-bold text-xs transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            <Trash2 size={16} />
                            {t('eraser.toolbar.reset') || 'Reset'}
                        </button>
                    </div>

                    {/* Tool Selection */}
                    <div className="space-y-3">
                        <label className="text-xs font-bold text-bronze-light uppercase tracking-wider">{t('eraser.toolbar.tools')}</label>
                        <div className="grid grid-cols-2 gap-2">
                            <button
                                onClick={() => setTool('erase')}
                                className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all ${tool === 'erase' ? 'border-primary bg-primary/10 text-primary font-bold shadow-sm' : 'border-cream-dark hover:border-primary/50 text-bronze-light hover:text-bronze-text hover:bg-cream-light'}`}
                            >
                                <Eraser size={24} className="mb-1" />
                                <span className="text-xs font-bold">{t('eraser.toolbar.eraser')}</span>
                            </button>
                            <button
                                onClick={() => setTool('restore')}
                                className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all ${tool === 'restore' ? 'border-secondary bg-secondary/10 text-secondary font-bold shadow-sm' : 'border-cream-dark hover:border-secondary/50 text-bronze-light hover:text-bronze-text hover:bg-cream-light'}`}
                            >
                                <Brush size={24} className="mb-1" />
                                <span className="text-xs font-bold">{t('eraser.toolbar.restore')}</span>
                            </button>
                            <button
                                onClick={() => setTool('magic-wand')}
                                className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all ${tool === 'magic-wand' ? 'border-primary bg-primary/10 text-primary font-bold shadow-sm' : 'border-cream-dark hover:border-primary/50 text-bronze-light hover:text-bronze-text hover:bg-cream-light'}`}
                            >
                                <div className="text-2xl mb-1">🪄</div>
                                <span className="text-xs font-bold">{t('eraser.toolbar.magic')}</span>
                            </button>
                            <button
                                onClick={() => setTool('move')}
                                className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all ${tool === 'move' ? 'border-bronze-text bg-bronze-light/10 text-bronze-text font-bold shadow-sm' : 'border-cream-dark hover:border-bronze-text/50 text-bronze-light hover:text-bronze-text hover:bg-cream-light'}`}
                            >
                                <div className="text-2xl mb-1">✋</div>
                                <span className="text-xs font-bold">{t('eraser.toolbar.move')}</span>
                            </button>
                        </div>
                    </div>

                    {/* Tool Settings (Dynamic based on Tool) */}
                    <div className="space-y-4">
                        <label className="text-xs font-bold text-bronze-light uppercase tracking-wider">{t('app.settings')}</label>

                        {
                            tool === 'magic-wand' ? (
                                <div className="space-y-2">
                                    <div className="flex justify-between text-xs font-bold text-bronze-text">
                                        <span>{t('eraser.toolbar.tolerance')}</span>
                                        <span>{tolerance}</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="1" max="100"
                                        value={tolerance}
                                        onChange={(e) => setTolerance(Number(e.target.value))}
                                        className="w-full h-1.5 bg-cream-medium rounded-lg appearance-none cursor-pointer accent-accent"
                                    />
                                </div>
                            ) : (tool === 'erase' || tool === 'restore') ? (
                                <>
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-xs font-bold text-bronze-text">
                                            <span>{t('eraser.toolbar.size')}</span>
                                            <span>{brushSize}px</span>
                                        </div>
                                        <input
                                            type="range"
                                            min="1" max="200"
                                            value={brushSize}
                                            onChange={(e) => setBrushSize(Number(e.target.value))}
                                            className="w-full h-1.5 bg-cream-medium rounded-lg appearance-none cursor-pointer accent-primary"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <div className="flex justify-between text-xs font-bold text-bronze-text">
                                            <span>{t('eraser.toolbar.hardness') || 'Hardness'}</span>
                                            <span>{Math.round(brushHardness * 100)}%</span>
                                        </div>
                                        <input
                                            type="range"
                                            min="0" max="1" step="0.1"
                                            value={brushHardness}
                                            onChange={(e) => setBrushHardness(Number(e.target.value))}
                                            className="w-full h-1.5 bg-cream-medium rounded-lg appearance-none cursor-pointer accent-primary"
                                        />
                                    </div>
                                </>
                            ) : (
                                <div className="text-xs text-bronze-light italic">No settings for this tool</div>
                            )
                        }
                    </div>

                    {/* History Controls */}
                    <div className="space-y-3">
                        <label className="text-xs font-bold text-bronze-light uppercase tracking-wider">{t('eraser.history')}</label>
                        <div className="flex gap-2">
                            <button
                                onClick={handleUndo}
                                disabled={historyIndex <= 0}
                                className="flex-1 py-2 bg-cream-light hover:bg-cream-medium text-bronze-text rounded-xl flex items-center justify-center gap-2 disabled:opacity-50 transition-colors"
                                title={t('eraser.toolbar.undo') || "Undo"}
                            >
                                <Undo size={18} />
                            </button>
                            <button
                                onClick={handleRedo}
                                disabled={historyIndex >= history.length - 1}
                                className="flex-1 py-2 bg-cream-light hover:bg-cream-medium text-bronze-text rounded-xl flex items-center justify-center gap-2 disabled:opacity-50 transition-colors"
                                title={t('eraser.toolbar.redo') || "Redo"}
                            >
                                <Redo size={18} />
                            </button>
                        </div>
                    </div>

                    {/* Effects Controls */}
                    <div className="space-y-4 pt-4 border-t border-cream-light">
                        <label className="text-xs font-bold text-bronze-light uppercase tracking-wider">{t('packager.phase2.stroke') || 'Stroke'}</label>

                        {/* Stroke Toggle */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Palette size={18} className={strokeConfig.enabled ? 'text-primary' : 'text-bronze-light'} />
                                <span className="text-xs font-bold text-bronze-text">{t('eraser.toolbar.enableStroke') || 'Enable Stroke'}</span>
                            </div>
                            <div
                                onClick={() => setStrokeConfig(prev => ({ ...prev, enabled: !prev.enabled }))}
                                className={`w-10 h-6 rounded-full relative cursor-pointer transition-colors ${strokeConfig.enabled ? 'bg-primary' : 'bg-cream-dark'}`}
                            >
                                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${strokeConfig.enabled ? 'right-1' : 'left-1'}`} />
                            </div>
                        </div>

                        {
                            strokeConfig.enabled && (
                                <div className="space-y-3 pl-2 animate-in slide-in-from-left-2">
                                    {/* Size */}
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-xs font-bold text-bronze-text">
                                            <span>Size</span>
                                            <span>{strokeConfig.size}px</span>
                                        </div>
                                        <input
                                            type="range"
                                            min="1" max="50"
                                            value={strokeConfig.size}
                                            onChange={(e) => setStrokeConfig(prev => ({ ...prev, size: Number(e.target.value) }))}
                                            className="w-full h-1.5 bg-cream-medium rounded-lg appearance-none cursor-pointer accent-primary"
                                        />
                                    </div>
                                    {/* Color */}
                                    <div className="flex gap-2 flex-wrap">
                                        {['#ffffff', '#000000', '#FF0000', '#FFFF00', '#0000FF'].map(c => (
                                            <button
                                                key={c}
                                                onClick={() => setStrokeConfig(prev => ({ ...prev, color: c }))}
                                                className={`w-5 h-5 rounded-full border border-cream-dark ${strokeConfig.color === c ? 'ring-2 ring-primary scale-110' : ''}`}
                                                style={{ backgroundColor: c }}
                                            />
                                        ))}
                                        <input
                                            type="color"
                                            value={strokeConfig.color}
                                            onChange={(e) => setStrokeConfig(prev => ({ ...prev, color: e.target.value }))}
                                            className="w-6 h-6 p-0 border-0 rounded overflow-hidden"
                                        />
                                    </div>
                                </div>
                            )
                        }

                        {/* Shadow Toggle */}
                        <label className="text-xs font-bold text-bronze-light uppercase tracking-wider mt-4 block">{t('packager.phase2.shadow') || 'Shadow'}</label>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Sun size={18} className={shadowConfig.enabled ? 'text-secondary' : 'text-bronze-light'} />
                                <span className="text-xs font-bold text-bronze-text">{t('eraser.toolbar.enableShadow') || 'Enable Shadow'}</span>
                            </div>
                            <div
                                onClick={() => setShadowConfig(prev => ({ ...prev, enabled: !prev.enabled }))}
                                className={`w-10 h-6 rounded-full relative cursor-pointer transition-colors ${shadowConfig.enabled ? 'bg-secondary' : 'bg-cream-dark'}`}
                            >
                                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${shadowConfig.enabled ? 'right-1' : 'left-1'}`} />
                            </div>
                        </div>

                    </div>

                    {/* View Controls */}
                    <div className="space-y-4 pt-4 border-t border-cream-light">
                        <label className="text-xs font-bold text-bronze-light uppercase tracking-wider">{t('eraser.zoom') || 'View'}</label>

                        {/* Zoom */}
                        <div className="flex items-center gap-2">
                            <button onClick={() => setZoom(z => Math.max(0.1, z - 0.1))} className="p-1 bg-cream-light rounded hover:bg-cream-medium w-8 text-bronze-text">-</button>
                            <span className="text-xs font-bold text-bronze-text flex-1 text-center">{Math.round(zoom * 100)}%</span>
                            <button onClick={() => setZoom(z => Math.min(5, z + 0.1))} className="p-1 bg-cream-light rounded hover:bg-cream-medium w-8 text-bronze-text">+</button>
                        </div>

                        {/* Background */}
                        <div className="flex gap-1 bg-cream-light p-1 rounded-lg">
                            {['checkerboard', 'white', 'black', 'green'].map((bg) => (
                                <button
                                    key={bg}
                                    onClick={() => setBgColor(bg as any)}
                                    className={`flex-1 h-6 rounded-md border ${bgColor === bg ? 'border-primary shadow-sm' : 'border-transparent'} ${bg === 'checkerboard' ? 'bg-[url(https://img.ly/assets/demo-assets/transparent-bg.png)] bg-[length:10px_10px]' : bg === 'white' ? 'bg-white' : bg === 'black' ? 'bg-black' : 'bg-[#00FF00]'}`}
                                    title={bg}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            </main>

            {/* Hidden Input */}
            < input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"

                onChange={handleFileUpload}
            />

            {/* Gallery Picker Modal */}
            {
                showGalleryPicker && (
                    <GalleryPicker
                        onSelect={handleGallerySelect}
                        onClose={() => setShowGalleryPicker(false)}
                    />
                )
            }
        </div >
    );
};

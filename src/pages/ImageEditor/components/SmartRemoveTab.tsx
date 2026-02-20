import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Upload, Eraser, Brush, Download, Image as ImageIcon, Loader2, Undo, Redo, Save, Palette, Sun, Sparkles, Trash2, Settings, Hand, X } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { MaskCanvas, generateMaskFromAI, processMask } from '../../../features/mask-core';
import type { AISettings } from '../../../features/mask-core';
import { GalleryPicker } from '../../../components/GalleryPicker';
import { saveStickerToDB } from '../../../db';

const SmartRemoveTab = () => {
    const { t } = useTranslation();
    const location = useLocation();
    const [originalImage, setOriginalImage] = useState<HTMLImageElement | null>(null);
    const [maskCanvas, setMaskCanvas] = useState<HTMLCanvasElement | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);

    const initializeMask = (img: HTMLImageElement) => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
            ctx.drawImage(img, 0, 0);
            setMaskCanvas(canvas);

            // Initialize history
            const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
            setHistory([data]);
            setHistoryIndex(0);
        }
    };

    useEffect(() => {
        const state = location.state as { image?: string };
        if (state?.image) {
            const img = new Image();
            img.onload = () => {
                setOriginalImage(img);
                initializeMask(img);
            };
            img.src = state.image;
            // Clear state to avoid reloading on refresh if desired, but harmless here
            window.history.replaceState({}, document.title);
        }
    }, []);

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
    const [magicToolMode, setMagicToolMode] = useState<'fill' | 'brush'>('fill');
    const [tolerance, setTolerance] = useState(10); // For Magic Wand

    const [zoom, setZoom] = useState(1);
    const [pan, setPan] = useState({ x: 0, y: 0 });
    const [bgColor, setBgColor] = useState<'checkerboard' | 'white' | 'black' | 'green'>('checkerboard');

    // History & Gallery
    const [history, setHistory] = useState<ImageData[]>([]);
    const [historyIndex, setHistoryIndex] = useState(-1);
    const [historyVersion, setHistoryVersion] = useState(0); // To force re-render
    const [showGalleryPicker, setShowGalleryPicker] = useState(false);
    const [showMobileMoreTools, setShowMobileMoreTools] = useState(false);
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
            initializeMask(img);
        };
        img.src = url;
    };

    const handleGallerySelect = async (blobs: Blob[]) => {
        if (blobs.length > 0) {
            loadImage(blobs[0]);
        }
        setShowGalleryPicker(false);
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
            console.error('AI Background Removal Error:', e);
            const errorMsg = e instanceof Error ? e.message : String(e);
            alert(
                t('editor.aiRemoval.error') ||
                `AI 去背失敗。\n\n錯誤詳情：${errorMsg}`
            );
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

    const handleExport = async () => {
        const url = getExportUrl();
        if (url) {
            try {
                await saveStickerToDB({
                    id: `smartremove_auto_${Date.now()}`,
                    imageUrl: url,
                    timestamp: Date.now(),
                    phrase: '智慧去背編輯'
                });
            } catch (error) {
                console.error('Auto-save on export failed', error);
            }
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
                phrase: '智慧去背編輯'
            });
            alert(t('packager.status.complete') || '已儲存到作品集！');
        } catch (error) {
            console.error(error);
            alert('儲存失敗');
        } finally {
            setIsSaving(false);
        }
    };

    const getToolShortLabel = (value: typeof tool) => {
        switch (value) {
            case 'erase':
                return '橡皮擦';
            case 'restore':
                return '還原筆刷';
            case 'magic-wand':
                return '魔術棒';
            case 'move':
                return '移動';
            case 'crop':
                return '裁切';
            default:
                return '';
        }
    };

    return (
        <div className="h-full flex flex-col overflow-hidden text-bronze-text bg-white/50">
            {/* Header/Toolbar */}
            <div className="bg-white/80 backdrop-blur-sm border-b border-cream-dark px-4 py-2 flex items-center justify-between shadow-sm flex-shrink-0 rounded-t-3xl">
                <div className="flex-1"></div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        className="p-2 md:px-4 md:py-2 bg-cream-light hover:bg-cream-medium text-bronze-text border border-cream-dark hover:border-bronze-light rounded-xl font-bold text-sm transition-colors flex items-center gap-2"
                        title={t('eraser.upload.title') || '\u8f09\u5165\u5716\u7247'}
                    >
                        <Upload size={18} />
                        <span className="hidden md:inline">{t('eraser.upload.title') || '\u8f09\u5165\u5716\u7247'}</span>
                    </button>
                    <button
                        onClick={() => setShowGalleryPicker(true)}
                        className="p-2 md:px-4 md:py-2 bg-cream-light hover:bg-cream-medium text-bronze-text border border-cream-dark hover:border-bronze-light rounded-xl font-bold text-sm transition-colors flex items-center gap-2"
                        title={t('app.selectFromGallery')}
                    >
                        <ImageIcon size={18} />
                        <span className="hidden md:inline">{t('app.selectFromGallery') || '\u5f9e\u4f5c\u54c1\u96c6\u9078\u53d6'}</span>
                    </button>
                    <button
                        onClick={handleSaveToGallery}
                        disabled={!originalImage || !maskCanvas || isSaving}
                        className="p-2 md:px-4 md:py-2 bg-secondary/10 hover:bg-secondary/20 text-secondary border border-secondary/30 rounded-xl font-bold text-sm transition-colors flex items-center gap-2 disabled:opacity-50"
                        title={t('eraser.toolbar.saveToGallery')}
                    >
                        {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                        <span className="hidden md:inline">{t('eraser.toolbar.saveToGallery') || '\u5132\u5b58\u5230\u4f5c\u54c1\u96c6'}</span>
                    </button>
                    <button
                        onClick={handleExport}
                        disabled={!originalImage || !maskCanvas}
                        className="p-2 md:px-4 md:py-2 bg-primary hover:bg-primary-hover text-white rounded-xl font-bold text-sm transition-colors flex items-center gap-2 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                        title={t('eraser.toolbar.export')}
                    >
                        <Download size={18} />
                        <span className="hidden md:inline">{t('eraser.toolbar.export') || '?? PNG'}</span>
                    </button>
                </div>
            </div>

            {/* Main Workspace */}
            <main className="flex-1 flex flex-col lg:flex-row overflow-hidden">
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
                    {/* Workspace Background */}
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
                                        magicToolMode={magicToolMode}
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
                                            alt="原圖"
                                            className="w-full h-full object-contain block"
                                            draggable={false}
                                        />
                                    </div>
                                )}

                                {/* Quick Hint removed as tools are now available instantly */}

                                {isProcessing && (
                                    <div className="absolute inset-0 flex items-center justify-center bg-white/50 backdrop-blur-sm z-20">
                                        <div className="flex flex-col items-center">
                                            <Loader2 size={40} className="text-primary animate-spin mb-2" />
                                            <span className="font-bold text-primary-dark">AI 處理中...</span>
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
                                <button
                                    onClick={() => setShowGalleryPicker(true)}
                                    className="mt-2 px-6 py-2 bg-white border border-secondary/20 hover:border-secondary/40 text-bronze-text rounded-lg font-bold text-sm transition-all shadow-sm inline-flex items-center gap-2"
                                >
                                    <ImageIcon size={16} />
                                    {t('app.selectFromGallery') || '\u5f9e\u4f5c\u54c1\u96c6\u9078\u53d6'}
                                </button>
                            </div>
                        )
                    }

                    {/* Mobile Quick Controls: keep zoom/background close to canvas */}
                    {originalImage && (
                        <div className="lg:hidden absolute left-3 right-3 bottom-3 z-10 rounded-2xl border border-cream-dark bg-white/95 backdrop-blur-sm shadow-xl p-2 space-y-2">
                            <div className="flex items-center justify-between px-1">
                                <span className="text-[11px] font-bold text-bronze-light">目前工具：<span className="text-bronze-text">{getToolShortLabel(tool)}</span></span>
                                <button
                                    onClick={() => setShowMobileMoreTools(true)}
                                    className="px-2 py-1 rounded-md bg-cream-light border border-cream-dark text-[11px] font-bold text-bronze-text inline-flex items-center gap-1"
                                    title="更多工具"
                                >
                                    <Settings size={12} />
                                    更多工具
                                </button>
                            </div>
                            <div className="grid grid-cols-4 gap-1">
                                <button
                                    onClick={() => setTool('erase')}
                                    className={`h-12 rounded-lg border flex flex-col items-center justify-center gap-0.5 ${tool === 'erase' ? 'border-primary bg-primary/10 text-primary' : 'border-cream-dark bg-cream-light text-bronze-text'}`}
                                    title={t('eraser.toolbar.eraser')}
                                    aria-label={t('eraser.toolbar.eraser') || '\u6a61\u76ae\u64e6'}
                                >
                                    <Eraser size={16} />
                                    <span className="text-[10px] font-bold leading-none">橡皮擦</span>
                                </button>
                                <button
                                    onClick={() => setTool('restore')}
                                    className={`h-12 rounded-lg border flex flex-col items-center justify-center gap-0.5 ${tool === 'restore' ? 'border-secondary bg-secondary/10 text-secondary' : 'border-cream-dark bg-cream-light text-bronze-text'}`}
                                    title={t('eraser.toolbar.restore')}
                                    aria-label={t('eraser.toolbar.restore') || '\u9084\u539f\u7b46\u5237'}
                                >
                                    <Brush size={16} />
                                    <span className="text-[10px] font-bold leading-none">還原筆刷</span>
                                </button>
                                <button
                                    onClick={() => setTool('magic-wand')}
                                    className={`h-12 rounded-lg border flex flex-col items-center justify-center gap-0.5 ${tool === 'magic-wand' ? 'border-primary bg-primary/10 text-primary' : 'border-cream-dark bg-cream-light text-bronze-text'}`}
                                    title={t('eraser.toolbar.magic')}
                                    aria-label={t('eraser.toolbar.magic') || '\u9b54\u8853\u68d2'}
                                >
                                    <Sparkles size={16} />
                                    <span className="text-[10px] font-bold leading-none">魔術棒</span>
                                </button>
                                <button
                                    onClick={() => setTool('move')}
                                    className={`h-12 rounded-lg border flex flex-col items-center justify-center gap-0.5 ${tool === 'move' ? 'border-bronze-text bg-bronze-light/10 text-bronze-text' : 'border-cream-dark bg-cream-light text-bronze-text'}`}
                                    title={t('eraser.toolbar.move')}
                                    aria-label={t('eraser.toolbar.move') || '??'}
                                >
                                    <Hand size={16} />
                                    <span className="text-[10px] font-bold leading-none">移動</span>
                                </button>
                            </div>
                            <div className="grid grid-cols-2 gap-1">
                                <button
                                    onClick={handleUndo}
                                    disabled={historyIndex <= 0}
                                    className="h-9 rounded-lg border border-cream-dark bg-cream-light text-bronze-text flex items-center justify-center gap-1 disabled:opacity-50"
                                    title={t('eraser.toolbar.undo') || '??'}
                                >
                                    <Undo size={14} />
                                    <span className="text-[11px] font-bold">復原</span>
                                </button>
                                <button
                                    onClick={handleRedo}
                                    disabled={historyIndex >= history.length - 1}
                                    className="h-9 rounded-lg border border-cream-dark bg-cream-light text-bronze-text flex items-center justify-center gap-1 disabled:opacity-50"
                                    title={t('eraser.toolbar.redo') || '??'}
                                >
                                    <Redo size={14} />
                                    <span className="text-[11px] font-bold">重做</span>
                                </button>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setZoom(z => Math.max(0.1, z - 0.1))}
                                    className="px-3 py-1.5 bg-cream-light rounded-lg hover:bg-cream-medium text-bronze-text font-bold text-sm"
                                >
                                    -
                                </button>
                                <span className="text-xs font-bold text-bronze-text flex-1 text-center">{Math.round(zoom * 100)}%</span>
                                <button
                                    onClick={() => setZoom(z => Math.min(5, z + 0.1))}
                                    className="px-3 py-1.5 bg-cream-light rounded-lg hover:bg-cream-medium text-bronze-text font-bold text-sm"
                                >
                                    +
                                </button>
                            </div>
                            <div className="grid grid-cols-4 gap-1 bg-cream-light p-1 rounded-lg">
                                {(['checkerboard', 'white', 'black', 'green'] as const).map((bg) => (
                                    <button
                                        key={bg}
                                        onClick={() => setBgColor(bg)}
                                        className={`h-7 rounded-md border ${bgColor === bg ? 'border-primary shadow-sm' : 'border-transparent'} ${bg === 'checkerboard' ? 'bg-[url(https://img.ly/assets/demo-assets/transparent-bg.png)] bg-[length:10px_10px]' : bg === 'white' ? 'bg-white' : bg === 'black' ? 'bg-black' : 'bg-[#00FF00]'}`}
                                        title={bg}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Left: Toolbar (Bottom on mobile) */}
                <div className="hidden lg:flex w-full lg:w-64 h-[45vh] lg:h-auto flex-shrink-0 bg-white border-t lg:border-t-0 lg:border-r border-cream-dark p-4 flex flex-col gap-6 z-10 overflow-y-auto lg:order-1 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] lg:shadow-none">

                    {/* Top: AI Actions & Reset */}
                    <div className="space-y-3 pb-4 border-b border-cream-light">
                        <button
                            onClick={handleRunAI}
                            disabled={!originalImage || isProcessing}
                            className="w-full py-3 bg-primary hover:bg-primary-hover text-white rounded-xl font-bold text-sm shadow-lg shadow-primary/20 transition-all flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isProcessing ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
                            {t('packager.phase1.aiRemoveBg') || 'AI \u81ea\u52d5\u53bb\u80cc'}
                        </button>

                        {/* Advanced Settings */}
                        {
                            originalImage && (
                                <div className="space-y-3 bg-cream-light p-3 rounded-xl border border-cream-dark">
                                    <div className="flex items-center gap-2 text-xs font-bold text-bronze-light mb-2">
                                        <Settings size={14} />
                                        <span>{t('eraser.toolbar.advancedSettings') || 'AI \u9032\u968e\u8a2d\u5b9a'}</span>
                                    </div>

                                    {/* Edge Tolerance */}
                                    <div className="space-y-1">
                                        <div className="flex justify-between text-[10px] font-bold text-bronze-light uppercase">
                                            <span>{t('eraser.toolbar.edgeTolerance') || '\u908a\u7de3\u5bb9\u5dee'}</span>
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
                                            <span>{t('eraser.toolbar.shrink') || '??'}</span>
                                            <span>{t('eraser.toolbar.grow') || '??'}</span>
                                        </div>
                                    </div>

                                    {/* Toggles */}
                                    <div className="flex flex-col gap-2">
                                        <label className="flex items-center justify-between cursor-pointer">
                                            <span className="text-xs font-medium text-bronze-text">{t('eraser.toolbar.protectClosed') || '\u4fdd\u8b77\u5c01\u9589\u5340\u57df'}</span>
                                            <input
                                                type="checkbox"
                                                checked={aiSettings.protectHoles}
                                                onChange={(e) => updateMaskSettings({ ...aiSettings, protectHoles: e.target.checked })}
                                                className="w-4 h-4 rounded text-primary focus:ring-primary border-cream-dark"
                                            />
                                        </label>
                                        <label className="flex items-center justify-between cursor-pointer">
                                            <span className="text-xs font-medium text-bronze-text">{t('eraser.toolbar.enhanceText') || '\u6587\u5b57\u5f37\u5316'}</span>
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
                            {t('eraser.toolbar.reset') || '??'}
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
                                <Sparkles size={24} className="mb-1" />
                                <span className="text-xs font-bold">{t('eraser.toolbar.magic')}</span>
                            </button>
                            <button
                                onClick={() => setTool('move')}
                                className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all ${tool === 'move' ? 'border-bronze-text bg-bronze-light/10 text-bronze-text font-bold shadow-sm' : 'border-cream-dark hover:border-bronze-text/50 text-bronze-light hover:text-bronze-text hover:bg-cream-light'}`}
                            >
                                <Hand size={24} className="mb-1" />
                                <span className="text-xs font-bold">{t('eraser.toolbar.move')}</span>
                            </button>
                        </div>
                    </div>

                    {/* Tool Settings (Dynamic based on Tool) */}
                    <div className="space-y-4">
                        <label className="text-xs font-bold text-bronze-light uppercase tracking-wider">{t('app.settings')}</label>

                        {
                            tool === 'magic-wand' ? (
                                <>
                                    <div className="flex bg-cream-medium p-1 rounded-lg mb-2">
                                        <button
                                            className={`flex-1 py-1 text-[10px] font-bold rounded-md transition-all ${magicToolMode === 'fill' ? 'bg-white shadow-sm text-primary' : 'text-bronze-light hover:text-bronze-text'}`}
                                            onClick={() => setMagicToolMode('fill')}
                                        >
                                            {t('eraser.magic.fill') || '\u5340\u57df\u586b\u6eff'}
                                        </button>
                                        <button
                                            className={`flex-1 py-1 text-[10px] font-bold rounded-md transition-all ${magicToolMode === 'brush' ? 'bg-white shadow-sm text-primary' : 'text-bronze-light hover:text-bronze-text'}`}
                                            onClick={() => setMagicToolMode('brush')}
                                        >
                                            {t('eraser.magic.brush') || '\u9b54\u8853\u7b46\u5237'}
                                        </button>
                                    </div>

                                    {magicToolMode === 'brush' && (
                                        <div className="space-y-2 mb-2">
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
                                    )}

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
                                            className="w-full h-1.5 bg-cream-medium rounded-lg appearance-none cursor-pointer accent-primary"
                                        />
                                    </div>
                                </>
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
                                            <span>{t('eraser.toolbar.hardness') || '??'}</span>
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
                                <div className="text-xs text-bronze-light italic">此工具目前沒有額外設定</div>
                            )
                        }
                    </div>

                    {/* History Controls */}
                    <div className="hidden lg:block space-y-3">
                        <label className="text-xs font-bold text-bronze-light uppercase tracking-wider">{t('eraser.history')}</label>
                        <div className="flex gap-2">
                            <button
                                onClick={handleUndo}
                                disabled={historyIndex <= 0}
                                className="flex-1 py-2 bg-cream-light hover:bg-cream-medium text-bronze-text rounded-xl flex items-center justify-center gap-2 disabled:opacity-50 transition-colors"
                                title={t('eraser.toolbar.undo') || "??"}
                            >
                                <Undo size={18} />
                            </button>
                            <button
                                onClick={handleRedo}
                                disabled={historyIndex >= history.length - 1}
                                className="flex-1 py-2 bg-cream-light hover:bg-cream-medium text-bronze-text rounded-xl flex items-center justify-center gap-2 disabled:opacity-50 transition-colors"
                                title={t('eraser.toolbar.redo') || "??"}
                            >
                                <Redo size={18} />
                            </button>
                        </div>
                    </div>

                    {/* Effects Controls */}
                    <div className="space-y-4 pt-4 border-t border-cream-light">
                        <label className="text-xs font-bold text-bronze-light uppercase tracking-wider">{t('packager.phase2.stroke') || '??'}</label>

                        {/* Stroke Toggle */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Palette size={18} className={strokeConfig.enabled ? 'text-primary' : 'text-bronze-light'} />
                                <span className="text-xs font-bold text-bronze-text">{t('eraser.toolbar.enableStroke') || '\u555f\u7528\u63cf\u908a'}</span>
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
                        <label className="text-xs font-bold text-bronze-light uppercase tracking-wider mt-4 block">{t('packager.phase2.shadow') || '??'}</label>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Sun size={18} className={shadowConfig.enabled ? 'text-secondary' : 'text-bronze-light'} />
                                <span className="text-xs font-bold text-bronze-text">{t('eraser.toolbar.enableShadow') || '\u555f\u7528\u9670\u5f71'}</span>
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
                    <div className="hidden lg:block space-y-4 pt-4 border-t border-cream-light">
                        <label className="text-xs font-bold text-bronze-light uppercase tracking-wider">{t('eraser.zoom') || '??'}</label>

                        {/* Zoom */}
                        <div className="flex items-center gap-2">
                            <button onClick={() => setZoom(z => Math.max(0.1, z - 0.1))} className="p-1 bg-cream-light rounded hover:bg-cream-medium w-8 text-bronze-text">-</button>
                            <span className="text-xs font-bold text-bronze-text flex-1 text-center">{Math.round(zoom * 100)}%</span>
                            <button onClick={() => setZoom(z => Math.min(5, z + 0.1))} className="p-1 bg-cream-light rounded hover:bg-cream-medium w-8 text-bronze-text">+</button>
                        </div>

                        {/* Background */}
                        <div className="flex gap-1 bg-cream-light p-1 rounded-lg">
                            {(['checkerboard', 'white', 'black', 'green'] as const).map((bg) => (
                                <button
                                    key={bg}
                                    onClick={() => setBgColor(bg)}
                                    className={`flex-1 h-6 rounded-md border ${bgColor === bg ? 'border-primary shadow-sm' : 'border-transparent'} ${bg === 'checkerboard' ? 'bg-[url(https://img.ly/assets/demo-assets/transparent-bg.png)] bg-[length:10px_10px]' : bg === 'white' ? 'bg-white' : bg === 'black' ? 'bg-black' : 'bg-[#00FF00]'}`}
                                    title={bg}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            </main>

            {/* Mobile More Tools Drawer */}
            {showMobileMoreTools && (
                <div className="lg:hidden fixed inset-0 z-40" onClick={() => setShowMobileMoreTools(false)}>
                    <div className="absolute inset-0 bg-black/40" />
                    <div
                        className="absolute inset-x-0 bottom-0 max-h-[78dvh] rounded-t-3xl border-t border-cream-dark bg-white p-4 shadow-2xl overflow-y-auto"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="mb-3 flex items-center justify-between">
                            <h3 className="text-sm font-bold text-bronze-text">更多工具</h3>
                            <button
                                onClick={() => setShowMobileMoreTools(false)}
                                className="h-8 w-8 rounded-lg border border-cream-dark bg-cream-light text-bronze-text flex items-center justify-center"
                                title="關閉"
                            >
                                <X size={16} />
                            </button>
                        </div>

                        <div className="space-y-3 pb-4 border-b border-cream-light">
                            <button
                                onClick={handleRunAI}
                                disabled={!originalImage || isProcessing}
                                className="w-full py-3 bg-primary hover:bg-primary-hover text-white rounded-xl font-bold text-sm shadow-lg shadow-primary/20 transition-all flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isProcessing ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
                                {t('packager.phase1.aiRemoveBg') || 'AI \u81ea\u52d5\u53bb\u80cc'}
                            </button>

                            {originalImage && (
                                <div className="space-y-3 bg-cream-light p-3 rounded-xl border border-cream-dark">
                                    <div className="flex items-center gap-2 text-xs font-bold text-bronze-light mb-2">
                                        <Settings size={14} />
                                        <span>{t('eraser.toolbar.advancedSettings') || 'AI \u9032\u968e\u8a2d\u5b9a'}</span>
                                    </div>

                                    <div className="space-y-1">
                                        <div className="flex justify-between text-[10px] font-bold text-bronze-light uppercase">
                                            <span>{t('eraser.toolbar.edgeTolerance') || '\u908a\u7de3\u5bb9\u5dee'}</span>
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
                                            <span>{t('eraser.toolbar.shrink') || '??'}</span>
                                            <span>{t('eraser.toolbar.grow') || '??'}</span>
                                        </div>
                                    </div>

                                    <div className="flex flex-col gap-2">
                                        <label className="flex items-center justify-between cursor-pointer">
                                            <span className="text-xs font-medium text-bronze-text">{t('eraser.toolbar.protectClosed') || '\u4fdd\u8b77\u5c01\u9589\u5340\u57df'}</span>
                                            <input
                                                type="checkbox"
                                                checked={aiSettings.protectHoles}
                                                onChange={(e) => updateMaskSettings({ ...aiSettings, protectHoles: e.target.checked })}
                                                className="w-4 h-4 rounded text-primary focus:ring-primary border-cream-dark"
                                            />
                                        </label>
                                        <label className="flex items-center justify-between cursor-pointer">
                                            <span className="text-xs font-medium text-bronze-text">{t('eraser.toolbar.enhanceText') || '\u6587\u5b57\u5f37\u5316'}</span>
                                            <input
                                                type="checkbox"
                                                checked={aiSettings.enhanceText}
                                                onChange={(e) => updateMaskSettings({ ...aiSettings, enhanceText: e.target.checked })}
                                                className="w-4 h-4 rounded text-primary focus:ring-primary border-cream-dark"
                                            />
                                        </label>
                                    </div>
                                </div>
                            )}

                            <button
                                onClick={() => {
                                    setOriginalImage(null);
                                    setMaskCanvas(null);
                                    setAiSettings({ edgeTolerance: 0, protectHoles: false, enhanceText: false });
                                    rawAiMaskRef.current = null;
                                    setShowMobileMoreTools(false);
                                }}
                                disabled={!originalImage}
                                className="w-full py-2 bg-cream-light hover:bg-cream-medium text-bronze-text rounded-lg font-bold text-xs transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                <Trash2 size={16} />
                                {t('eraser.toolbar.reset') || '??'}
                            </button>
                        </div>

                        <div className="space-y-3 pt-4">
                            <label className="text-xs font-bold text-bronze-light uppercase tracking-wider">{t('eraser.toolbar.tools')}</label>
                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    onClick={() => setTool('erase')}
                                    className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all ${tool === 'erase' ? 'border-primary bg-primary/10 text-primary font-bold shadow-sm' : 'border-cream-dark hover:border-primary/50 text-bronze-light hover:text-bronze-text hover:bg-cream-light'}`}
                                >
                                    <Eraser size={22} className="mb-1" />
                                    <span className="text-xs font-bold">{t('eraser.toolbar.eraser')}</span>
                                </button>
                                <button
                                    onClick={() => setTool('restore')}
                                    className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all ${tool === 'restore' ? 'border-secondary bg-secondary/10 text-secondary font-bold shadow-sm' : 'border-cream-dark hover:border-secondary/50 text-bronze-light hover:text-bronze-text hover:bg-cream-light'}`}
                                >
                                    <Brush size={22} className="mb-1" />
                                    <span className="text-xs font-bold">{t('eraser.toolbar.restore')}</span>
                                </button>
                                <button
                                    onClick={() => setTool('magic-wand')}
                                    className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all ${tool === 'magic-wand' ? 'border-primary bg-primary/10 text-primary font-bold shadow-sm' : 'border-cream-dark hover:border-primary/50 text-bronze-light hover:text-bronze-text hover:bg-cream-light'}`}
                                >
                                    <Sparkles size={22} className="mb-1" />
                                    <span className="text-xs font-bold">{t('eraser.toolbar.magic')}</span>
                                </button>
                                <button
                                    onClick={() => setTool('move')}
                                    className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all ${tool === 'move' ? 'border-bronze-text bg-bronze-light/10 text-bronze-text font-bold shadow-sm' : 'border-cream-dark hover:border-bronze-text/50 text-bronze-light hover:text-bronze-text hover:bg-cream-light'}`}
                                >
                                    <Hand size={22} className="mb-1" />
                                    <span className="text-xs font-bold">{t('eraser.toolbar.move')}</span>
                                </button>
                            </div>
                        </div>

                        <div className="space-y-4 pt-4 border-t border-cream-light">
                            <label className="text-xs font-bold text-bronze-light uppercase tracking-wider">{t('app.settings')}</label>

                            {tool === 'magic-wand' ? (
                                <>
                                    <div className="flex bg-cream-medium p-1 rounded-lg mb-2">
                                        <button
                                            className={`flex-1 py-1 text-[10px] font-bold rounded-md transition-all ${magicToolMode === 'fill' ? 'bg-white shadow-sm text-primary' : 'text-bronze-light hover:text-bronze-text'}`}
                                            onClick={() => setMagicToolMode('fill')}
                                        >
                                            {t('eraser.magic.fill') || '\u5340\u57df\u586b\u6eff'}
                                        </button>
                                        <button
                                            className={`flex-1 py-1 text-[10px] font-bold rounded-md transition-all ${magicToolMode === 'brush' ? 'bg-white shadow-sm text-primary' : 'text-bronze-light hover:text-bronze-text'}`}
                                            onClick={() => setMagicToolMode('brush')}
                                        >
                                            {t('eraser.magic.brush') || '\u9b54\u8853\u7b46\u5237'}
                                        </button>
                                    </div>

                                    {magicToolMode === 'brush' && (
                                        <div className="space-y-2 mb-2">
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
                                    )}

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
                                            className="w-full h-1.5 bg-cream-medium rounded-lg appearance-none cursor-pointer accent-primary"
                                        />
                                    </div>
                                </>
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
                                            <span>{t('eraser.toolbar.hardness') || '??'}</span>
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
                                <div className="text-xs text-bronze-light italic">此工具目前沒有額外設定</div>
                            )}
                        </div>

                        <div className="space-y-4 pt-4 border-t border-cream-light pb-4">
                            <label className="text-xs font-bold text-bronze-light uppercase tracking-wider">{t('packager.phase2.stroke') || '??'}</label>

                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Palette size={18} className={strokeConfig.enabled ? 'text-primary' : 'text-bronze-light'} />
                                    <span className="text-xs font-bold text-bronze-text">{t('eraser.toolbar.enableStroke') || '\u555f\u7528\u63cf\u908a'}</span>
                                </div>
                                <div
                                    onClick={() => setStrokeConfig(prev => ({ ...prev, enabled: !prev.enabled }))}
                                    className={`w-10 h-6 rounded-full relative cursor-pointer transition-colors ${strokeConfig.enabled ? 'bg-primary' : 'bg-cream-dark'}`}
                                >
                                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${strokeConfig.enabled ? 'right-1' : 'left-1'}`} />
                                </div>
                            </div>

                            {strokeConfig.enabled && (
                                <div className="space-y-3 pl-2 animate-in slide-in-from-left-2">
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
                            )}

                            <label className="text-xs font-bold text-bronze-light uppercase tracking-wider mt-4 block">{t('packager.phase2.shadow') || '??'}</label>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Sun size={18} className={shadowConfig.enabled ? 'text-secondary' : 'text-bronze-light'} />
                                    <span className="text-xs font-bold text-bronze-text">{t('eraser.toolbar.enableShadow') || '\u555f\u7528\u9670\u5f71'}</span>
                                </div>
                                <div
                                    onClick={() => setShadowConfig(prev => ({ ...prev, enabled: !prev.enabled }))}
                                    className={`w-10 h-6 rounded-full relative cursor-pointer transition-colors ${shadowConfig.enabled ? 'bg-secondary' : 'bg-cream-dark'}`}
                                >
                                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${shadowConfig.enabled ? 'right-1' : 'left-1'}`} />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Hidden Input */}
            <input
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
        </div>
    );
};

export default SmartRemoveTab;



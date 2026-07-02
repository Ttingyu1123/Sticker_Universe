import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Download, Sparkles, Palette, Sun, CheckCircle2, AlertCircle, Trash2, FileArchive, Plus, Image as ImageIcon, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import JSZip from 'jszip';
import saveAs from 'file-saver';
import { useTranslation } from 'react-i18next';
import { GalleryPicker } from '../../../components/GalleryPicker';
import { saveStickerToDB } from '../../../db';
import { loadImage } from '../../../features/packager-core';
import { useToast } from '../../../components/shared/ToastProvider';

const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
};

interface BeautifyConfig {
    preset: 'none' | 'line' | 'telegram';
    margin: number;
    outputFormat: 'png' | 'webp';
    filenamePrefix: string;
    useStroke: boolean;
    strokeThickness: number;
    strokeColor: string;
    useShadow: boolean;
    useFeathering: boolean;
}

interface ProcessedFile {
    id: string;
    original: File;
    preview: string;
    width: number;
    height: number;
    processedUrl: string | null;
}

const BeautifyTab: React.FC = () => {
    const { t } = useTranslation();
    const { showToast } = useToast();
    const [fileQueue, setFileQueue] = useState<ProcessedFile[]>([]);
    const [status, setStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
    const [statusMsg, setStatusMsg] = useState('');
    const [elapsedTime, setElapsedTime] = useState<string | null>(null);
    const [zipBlob, setZipBlob] = useState<Blob | null>(null);
    const [showGallery, setShowGallery] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [activeFileId, setActiveFileId] = useState<string | null>(null);
    const [zoom, setZoom] = useState(1);
    const [pan, setPan] = useState({ x: 0, y: 0 });
    const [isPanning, setIsPanning] = useState(false);
    const [helperBg, setHelperBg] = useState<'checkerboard' | 'green' | 'black' | 'white'>('checkerboard');
    const lastMousePos = useRef({ x: 0, y: 0 });

    const activeFile = useMemo(() => fileQueue.find(f => f.id === activeFileId), [fileQueue, activeFileId]);

    const [config, setConfig] = useState<BeautifyConfig>({
        preset: 'none',
        margin: 0.05,
        outputFormat: 'png',
        filenamePrefix: 'sticker',
        useStroke: false,
        strokeThickness: 5,
        strokeColor: '#ffffff',
        useShadow: false,
        useFeathering: false
    });

    // Real-time preview effect
    useEffect(() => {
        if (activeFile) {
            generateSinglePreview(activeFile);
        }
    }, [activeFileId, config]);

    const generateSinglePreview = async (item: ProcessedFile) => {
        try {
            const mimeType = config.outputFormat === 'webp' ? 'image/webp' : 'image/png';
            const presetSize = { none: null, line: { w: 370, h: 320 }, telegram: { w: 512, h: 512 } }[config.preset];
            const img = await loadImage(item.preview);

            const finalW = presetSize ? presetSize.w : img.width;
            const finalH = presetSize ? presetSize.h : img.height;

            const canvas = document.createElement('canvas');
            canvas.width = finalW;
            canvas.height = finalH;
            const ctx = canvas.getContext('2d')!;

            const safeW = finalW * (1 - config.margin * 2);
            const safeH = finalH * (1 - config.margin * 2);
            const scale = Math.min(safeW / img.width, safeH / img.height, 100);
            const dw = img.width * scale;
            const dh = img.height * scale;
            const dx = (finalW - dw) / 2;
            const dy = (finalH - dh) / 2;

            if (config.useFeathering) ctx.filter = 'blur(1px)';

            if (config.useShadow) {
                ctx.shadowColor = 'rgba(0,0,0,0.25)';
                ctx.shadowBlur = 12 * scale;
                ctx.shadowOffsetX = 3 * scale;
                ctx.shadowOffsetY = 3 * scale;
            }

            if (config.useStroke) {
                const sCanvas = document.createElement('canvas');
                sCanvas.width = finalW;
                sCanvas.height = finalH;
                const sCtx = sCanvas.getContext('2d')!;
                const st = config.strokeThickness * scale;
                for (let a = 0; a < 360; a += 30) {
                    const rad = a * Math.PI / 180;
                    sCtx.drawImage(img, dx + Math.cos(rad) * st, dy + Math.sin(rad) * st, dw, dh);
                }
                sCtx.globalCompositeOperation = 'source-in';
                sCtx.fillStyle = config.strokeColor;
                sCtx.fillRect(0, 0, finalW, finalH);
                ctx.drawImage(sCanvas, 0, 0);
            }

            ctx.drawImage(img, dx, dy, dw, dh);

            const finalBlob = await new Promise<Blob | null>(r => canvas.toBlob(r, mimeType, 0.92));
            if (finalBlob) {
                const newUrl = URL.createObjectURL(finalBlob);
                setFileQueue(prev => prev.map(f => {
                    if (f.id === item.id) {
                        if (f.processedUrl) URL.revokeObjectURL(f.processedUrl);
                        return { ...f, processedUrl: newUrl };
                    }
                    return f;
                }));
            }
        } catch (e) {
            console.error("Preview generation failed", e);
        }
    };

    const handleWheel = (e: React.WheelEvent) => {
        if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            const delta = e.deltaY > 0 ? 0.9 : 1.1;
            setZoom(prev => Math.max(0.5, Math.min(5, prev * delta)));
        }
    };

    const startPan = (e: React.MouseEvent) => {
        if (e.button === 1 || (e.button === 0 && e.altKey)) {
            setIsPanning(true);
            lastMousePos.current = { x: e.clientX, y: e.clientY };
        }
    };

    const onPan = (e: React.MouseEvent) => {
        if (isPanning) {
            const dx = e.clientX - lastMousePos.current.x;
            const dy = e.clientY - lastMousePos.current.y;
            setPan(prev => ({ x: prev.x + dx, y: prev.y + dy }));
            lastMousePos.current = { x: e.clientX, y: e.clientY };
        }
    };

    const getHelperBgClass = () => {
        switch (helperBg) {
            case 'green': return 'bg-[#B0C4B1]';
            case 'black': return 'bg-[#4A4238]';
            case 'white': return 'bg-white';
            case 'checkerboard': return 'bg-slate-50';
            default: return '';
        }
    };

    const handleFiles = async (files: FileList) => {
        const newItems: ProcessedFile[] = [];
        for (let i = 0; i < files.length; i++) {
            const f = files[i];
            if (!f.type.startsWith('image/')) continue;
            const id = Math.random().toString(36).substr(2, 9);
            const preview = URL.createObjectURL(f);
            const img = await loadImage(preview);
            newItems.push({
                id,
                original: f,
                preview,
                width: img.width,
                height: img.height,
                processedUrl: null // Initially null until applied
            });
        }
        setFileQueue(prev => [...prev, ...newItems]);
        if (!activeFileId && newItems.length > 0) setActiveFileId(newItems[0].id);
        setStatus('idle');
        setZipBlob(null);
    };

    const removeFile = (id: string) => {
        setFileQueue(prev => {
            const target = prev.find(f => f.id === id);
            if (target) {
                URL.revokeObjectURL(target.preview);
                if (target.processedUrl) URL.revokeObjectURL(target.processedUrl);
            }
            const filtered = prev.filter(f => f.id !== id);
            if (activeFileId === id) setActiveFileId(filtered.length > 0 ? filtered[0].id : null);
            return filtered;
        });
    };

    const applyBeautification = async () => {
        if (fileQueue.length === 0) return;
        setStatus('processing');
        setStatusMsg(t('packager.status.applying') || 'Applying effects...');
        const startTime = Date.now();
        const zip = new JSZip();
        const mimeType = config.outputFormat === 'webp' ? 'image/webp' : 'image/png';
        const extension = config.outputFormat === 'webp' ? 'webp' : 'png';
        const newQueue = [...fileQueue];
        let autoSavedCount = 0;

        try {
            const presetSize = { none: null, line: { w: 370, h: 320 }, telegram: { w: 512, h: 512 } }[config.preset];

            for (let i = 0; i < newQueue.length; i++) {
                const item = newQueue[i];
                const img = await loadImage(item.preview);

                const finalW = presetSize ? presetSize.w : img.width;
                const finalH = presetSize ? presetSize.h : img.height;

                const canvas = document.createElement('canvas');
                canvas.width = finalW;
                canvas.height = finalH;
                const ctx = canvas.getContext('2d')!;

                const safeW = finalW * (1 - config.margin * 2);
                const safeH = finalH * (1 - config.margin * 2);
                const scale = Math.min(safeW / img.width, safeH / img.height, 100);
                const dw = img.width * scale;
                const dh = img.height * scale;
                const dx = (finalW - dw) / 2;
                const dy = (finalH - dh) / 2;

                if (config.useFeathering) ctx.filter = 'blur(1px)';

                if (config.useShadow) {
                    ctx.shadowColor = 'rgba(0,0,0,0.25)';
                    ctx.shadowBlur = 12 * scale;
                    ctx.shadowOffsetX = 3 * scale;
                    ctx.shadowOffsetY = 3 * scale;
                }

                if (config.useStroke) {
                    const sCanvas = document.createElement('canvas');
                    sCanvas.width = finalW;
                    sCanvas.height = finalH;
                    const sCtx = sCanvas.getContext('2d')!;
                    const st = config.strokeThickness * scale;
                    // Simple stroke implementation by drawing multiple times
                    // For better stroke, consider dilate or specialized libraries, but sticking to existing logic for now
                    for (let a = 0; a < 360; a += 30) {
                        const rad = a * Math.PI / 180;
                        sCtx.drawImage(img, dx + Math.cos(rad) * st, dy + Math.sin(rad) * st, dw, dh);
                    }
                    sCtx.globalCompositeOperation = 'source-in';
                    sCtx.fillStyle = config.strokeColor;
                    sCtx.fillRect(0, 0, finalW, finalH);
                    ctx.drawImage(sCanvas, 0, 0);
                }

                ctx.drawImage(img, dx, dy, dw, dh);

                const finalBlob = await new Promise<Blob | null>(r => canvas.toBlob(r, mimeType, 0.92));
                if (finalBlob) {
                    const name = `${config.filenamePrefix}_${i + 1}.${extension}`;
                    zip.file(name, finalBlob);
                    try {
                        const base64 = await blobToBase64(finalBlob);
                        await saveStickerToDB({
                            id: `bty_auto_${Date.now()}_${i}`,
                            imageUrl: base64,
                            phrase: `${config.filenamePrefix} #${i + 1}`,
                            timestamp: Date.now()
                        });
                        autoSavedCount++;
                    } catch (saveErr) {
                        console.error('Auto-save failed for beautified image', saveErr);
                    }
                    const newUrl = URL.createObjectURL(finalBlob);
                    if (item.processedUrl) URL.revokeObjectURL(item.processedUrl);
                    item.processedUrl = newUrl;
                }
            }

            setFileQueue(newQueue);
            setZipBlob(await zip.generateAsync({ type: 'blob' }));
            setStatus('success');
            setElapsedTime(((Date.now() - startTime) / 1000).toFixed(1));
            setStatusMsg(`${t('packager.status.complete') || 'Done!'} (Auto-saved ${autoSavedCount})`);
        } catch (e: any) {
            setStatus('error');
            setStatusMsg(`${t('packager.status.failed') || 'Failed:'} ${e.message}`);
            console.error(e);
        }
    };

    const reset = () => {
        fileQueue.forEach(f => {
            URL.revokeObjectURL(f.preview);
            if (f.processedUrl) URL.revokeObjectURL(f.processedUrl);
        });
        setFileQueue([]);
        setActiveFileId(null);
        setZipBlob(null);
        setStatus('idle');
        setElapsedTime(null);
    };

    return (
        <div className="h-full select-none font-sans text-slate-700 bg-transparent flex flex-col">

            {showGallery && (
                <GalleryPicker
                    onSelect={(blobs) => {
                        const dataTransfer = new DataTransfer();
                        blobs.forEach(blob => {
                            const file = new File([blob], `gallery_${Date.now()}.png`, { type: blob.type });
                            dataTransfer.items.add(file);
                        });
                        handleFiles(dataTransfer.files);
                        setShowGallery(false);
                    }}
                    onClose={() => setShowGallery(false)}
                />
            )}

            <div className="flex-1 max-w-7xl mx-auto px-4 md:px-6 w-full grid grid-cols-1 lg:grid-cols-12 gap-8 h-full overflow-hidden pb-20">

                {/* Left: Input/Preview */}
                <div className="lg:col-span-8 space-y-6 h-full overflow-y-auto pr-2 scrollbar-thin">
                    {fileQueue.length === 0 ? (
                        <div
                            onClick={() => fileInputRef.current?.click()}
                            className="border-3 border-dashed border-cream-dark bg-cream-medium/50 hover:bg-white/50 hover:border-primary/50 rounded-[2rem] p-20 flex flex-col items-center justify-center cursor-pointer transition-all duration-300 min-h-[400px]">
                            <input ref={fileInputRef} type="file" multiple className="hidden" onChange={(e) => e.target.files && handleFiles(e.target.files)} accept="image/*" />
                            <div className="bg-white p-8 rounded-full shadow-xl shadow-indigo-100 text-indigo-500 mb-6"><Sparkles size={48} /></div>
                            <h3 className="text-xl font-black text-bronze-text mb-2">{t('packager.upload.dragDrop') || 'Upload Images'}</h3>
                            <p className="text-bronze-light font-bold text-sm uppercase mb-6">{t('packager.upload.support') || 'JPG, PNG, WebP'}</p>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setShowGallery(true);
                                }}
                                className="px-6 py-2 bg-white text-indigo-600 border border-indigo-100 rounded-full font-bold text-sm shadow-sm hover:bg-indigo-50 transition-colors flex items-center gap-2"
                            >
                                <ImageIcon size={16} />
                                {t('packager.upload.gallery') || 'From Gallery'}
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {/* Toolbar */}
                            <div className="flex items-center justify-between bg-white/50 p-2 rounded-2xl border border-cream-dark backdrop-blur-sm">
                                <div className="flex gap-2 overflow-x-auto p-1 scrollbar-hide flex-1">
                                    <button onClick={() => fileInputRef.current?.click()} className="w-12 h-12 flex items-center justify-center rounded-xl border-2 border-dashed border-cream-dark text-bronze-light hover:text-primary hover:border-primary transition-colors flex-shrink-0"><Plus size={20} /></button>
                                    <button onClick={() => setShowGallery(true)} className="w-12 h-12 flex items-center justify-center rounded-xl border-2 border-dashed border-secondary/30 text-secondary bg-secondary/5 hover:bg-secondary/10 transition-colors flex-shrink-0"><ImageIcon size={20} /></button>
                                    <div className="w-px h-8 bg-cream-dark mx-1 self-center" />
                                    {fileQueue.map((item) => (
                                        <div key={item.id} className="relative group w-12 h-12 flex-shrink-0">
                                            <img
                                                src={item.preview}
                                                className={`w-full h-full object-cover rounded-xl border-2 cursor-pointer transition-all ${activeFileId === item.id ? 'border-primary shadow-md ring-2 ring-primary/20 scale-105' : 'border-transparent hover:border-cream-dark'}`}
                                                onClick={() => setActiveFileId(item.id)}
                                            />
                                            <button onClick={(e) => { e.stopPropagation(); removeFile(item.id); }} className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={10} /></button>
                                        </div>
                                    ))}
                                </div>
                                <button onClick={reset} className="px-4 py-2 text-xs font-bold text-bronze-light hover:text-red-500 transition-colors">
                                    {t('common.reset') || 'Reset'}
                                </button>
                            </div>

                            {/* Canvas Area */}
                            <div className="bg-cream-light/30 border border-cream-dark backdrop-blur-xl rounded-3xl p-4 relative shadow-sm">
                                <div className="relative rounded-2xl border border-cream-dark min-h-[500px] bg-cream-medium/20 overflow-hidden flex items-center justify-center cursor-grab active:cursor-grabbing shadow-inner" onWheel={handleWheel} onMouseDown={startPan} onMouseMove={onPan} onMouseUp={() => setIsPanning(false)}>

                                    {/* Zoom Controls */}
                                    <div className="absolute top-4 left-4 z-40 flex flex-col gap-2">
                                        <div className="bg-white/90 backdrop-blur-md p-1 rounded-xl shadow-lg border border-white flex flex-col gap-1">
                                            <button onClick={() => setZoom(prev => Math.min(5, prev + 0.25))} className="p-2 hover:bg-primary/10 rounded-lg text-primary transition-colors"><ZoomIn size={16} /></button>
                                            <button onClick={() => setZoom(prev => Math.max(0.5, prev - 0.25))} className="p-2 hover:bg-primary/10 rounded-lg text-primary transition-colors"><ZoomOut size={16} /></button>
                                            <button onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }} className="p-2 hover:bg-primary/10 rounded-lg text-primary transition-colors"><RotateCcw size={16} /></button>
                                        </div>
                                    </div>

                                    {/* Main Canvas Content */}
                                    <div className={`w-full h-full flex flex-col items-center justify-center relative ${getHelperBgClass()}`} style={{ transform: `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)`, ...(helperBg === 'checkerboard' ? { backgroundImage: 'conic-gradient(#eee 90deg,#fff 90deg 180deg,#eee 180deg 270deg,#fff 270deg)', backgroundSize: '16px 16px' } : {}) }}>
                                        {activeFile ? (
                                            <img
                                                src={activeFile.processedUrl || activeFile.preview}
                                                className="max-w-[90%] max-h-[90%] object-contain shadow-2xl transition-all duration-300"
                                                draggable={false}
                                            />
                                        ) : (
                                            <div className="text-bronze-light/50 font-bold text-sm">No image selected</div>
                                        )}
                                    </div>

                                    {/* Info Overlay */}
                                    {activeFile && (
                                        <div className="absolute bottom-4 left-4 bg-black/50 text-white px-3 py-1.5 rounded-full text-[10px] font-bold backdrop-blur-sm pointer-events-none">
                                            {activeFile.width} × {activeFile.height} px {activeFile.processedUrl ? '(Processed)' : '(Original)'}
                                        </div>
                                    )}
                                </div>

                                <div className="flex justify-center gap-3 mt-4">
                                    {(['checkerboard', 'white', 'black', 'green'] as const).map(bg => (
                                        <button key={bg} onClick={() => setHelperBg(bg)} className={`w-6 h-6 rounded-full border-2 transition-all ${helperBg === bg ? 'border-indigo-600 scale-125 ring-2 ring-indigo-100' : 'border-white'} ${bg === 'checkerboard' ? 'bg-slate-200' : bg === 'green' ? 'bg-[#00ff00]' : bg === 'black' ? 'bg-black' : 'bg-white'}`} />
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Right: Controls */}
                <div className="lg:col-span-4 space-y-6 overflow-y-auto max-h-[calc(100vh-120px)] pr-2 scrollbar-thin">

                    {/* Status Card */}
                    {status !== 'idle' && (
                        <div className={`p-4 rounded-2xl border transition-all shadow-lg animate-in slide-in-from-right-4 ${status === 'error' ? 'bg-red-500/10 border-red-200 text-red-700' : 'bg-cream-light/30 border-cream-dark backdrop-blur-xl'}`}>
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 rounded-xl bg-cream-medium/50 text-bronze-text shadow-inner">
                                    {status === 'success' ? <CheckCircle2 size={22} className="text-emerald-500" /> : status === 'error' ? <AlertCircle size={22} /> : <div className="animate-spin rounded-full h-5 w-5 border-3 border-secondary border-t-transparent" />}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <span className="block text-[10px] font-black uppercase tracking-tighter opacity-50 text-bronze-light">{status === 'success' ? 'Success' : 'Processing'}</span>
                                    <p className="text-xs font-bold truncate text-bronze-text">{statusMsg}</p>
                                </div>
                                {elapsedTime && <div className="text-[10px] font-black px-2.5 py-1 bg-cream-medium rounded-lg text-bronze-light">{elapsedTime}s</div>}
                            </div>
                        </div>
                    )}

                    <section className={`bg-cream-light/30 border border-cream-dark backdrop-blur-xl rounded-[2rem] p-6 space-y-5 transition-all ${fileQueue.length === 0 ? 'opacity-50 pointer-events-none grayscale' : 'opacity-100'}`}>
                        <h2 className="text-sm font-black flex items-center gap-2 text-bronze-text uppercase tracking-wider"><Sparkles size={16} className="text-secondary" /> {t('packager.phase2.title') || 'Beautify & Export'}</h2>

                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-bronze-light uppercase">{t('packager.phase2.presets') || 'Presets'}</label>
                            <div className="grid grid-cols-3 gap-2">
                                <button onClick={() => setConfig(prev => ({ ...prev, preset: 'none' }))} className={`py-2 rounded-xl font-bold text-[10px] border transition-all ${config.preset === 'none' ? 'bg-primary text-white border-secondary shadow-md' : 'bg-white text-bronze-light hover:border-secondary/30'}`}>{t('packager.phase2.custom') || 'Custom'}</button>
                                <button onClick={() => setConfig(prev => ({ ...prev, preset: 'line' }))} className={`py-2 rounded-xl font-bold text-[10px] border transition-all ${config.preset === 'line' ? 'bg-accent text-white border-accent shadow-md' : 'bg-white text-bronze-light hover:border-accent/30'}`}>{t('packager.phase2.line') || 'Line'}</button>
                                <button onClick={() => setConfig(prev => ({ ...prev, preset: 'telegram' }))} className={`py-2 rounded-xl font-bold text-[10px] border transition-all ${config.preset === 'telegram' ? 'bg-primary/80 text-white border-primary/80 shadow-md' : 'bg-white text-bronze-light hover:border-primary/30'}`}>{t('packager.phase2.telegram') || 'TG'}</button>
                            </div>
                        </div>

                        <div className="space-y-2 pt-1">
                            <div className="flex justify-between items-center"><label className="text-[10px] font-bold text-bronze-light uppercase">{t('packager.phase2.margin') || 'Margin'} {Math.round(config.margin * 100)}%</label></div>
                            <input type="range" min="0" max="0.3" step="0.01" value={config.margin} onChange={(e) => setConfig(prev => ({ ...prev, margin: parseFloat(e.target.value) }))} className="w-full h-1.5 bg-cream-dark/50 rounded-lg accent-secondary" />
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-cream-medium">
                            <div className="flex items-center gap-3"><Palette size={18} className={config.useStroke ? 'text-secondary' : 'text-bronze-light'} /><span className="text-xs font-bold text-bronze-text">{t('packager.phase2.stroke') || 'Stroke'}</span></div>
                            <div onClick={() => setConfig(prev => ({ ...prev, useStroke: !prev.useStroke }))} className={`w-9 h-5 rounded-full relative cursor-pointer transition-colors ${config.useStroke ? 'bg-secondary' : 'bg-cream-dark/30'}`}><div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${config.useStroke ? 'right-1' : 'left-1'}`} /></div>
                        </div>

                        {config.useStroke && (
                            <div className="pl-9 space-y-4 animate-in slide-in-from-left-4">
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center"><label className="text-[9px] font-bold text-bronze-light uppercase">{t('packager.phase2.strokeSize') || 'Size'}</label><span className="text-[9px] font-black text-secondary">{config.strokeThickness}px</span></div>
                                    <input type="range" min="1" max="25" value={config.strokeThickness} onChange={(e) => setConfig(prev => ({ ...prev, strokeThickness: parseInt(e.target.value) }))} className="w-full h-1 bg-secondary/10 rounded-lg accent-secondary" />
                                </div>
                                <div className="flex items-center gap-3">
                                    <label className="text-[9px] font-bold text-bronze-light uppercase">{t('packager.phase2.strokeColor') || 'Color'}</label>
                                    <div className="flex gap-2">
                                        {(['#ffffff', '#000000', '#facc15', '#f87171', '#818cf8']).map(c => (
                                            <button key={c} onClick={() => setConfig(prev => ({ ...prev, strokeColor: c }))} className={`w-5 h-5 rounded-full border border-cream-dark shadow-sm transition-transform ${config.strokeColor === c ? 'scale-125 ring-2 ring-secondary/20' : ''}`} style={{ backgroundColor: c }} />
                                        ))}
                                        <input type="color" value={config.strokeColor} onChange={(e) => setConfig(prev => ({ ...prev, strokeColor: e.target.value }))} className="w-5 h-5 p-0 border-0 bg-transparent cursor-pointer" />
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3"><Sun size={18} className={config.useShadow ? 'text-primary' : 'text-bronze-light'} /><span className="text-xs font-bold text-bronze-text">{t('packager.phase2.shadow') || 'Shadow'}</span></div>
                            <div onClick={() => setConfig(prev => ({ ...prev, useShadow: !prev.useShadow }))} className={`w-9 h-5 rounded-full relative cursor-pointer transition-colors ${config.useShadow ? 'bg-primary' : 'bg-cream-dark/30'}`}><div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${config.useShadow ? 'right-1' : 'left-1'}`} /></div>
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3"><Sparkles size={18} className={config.useFeathering ? 'text-accent' : 'text-bronze-light'} /><span className="text-xs font-bold text-bronze-text">{t('packager.phase2.feather') || 'Feather'}</span></div>
                            <div onClick={() => setConfig(prev => ({ ...prev, useFeathering: !prev.useFeathering }))} className={`w-9 h-5 rounded-full relative cursor-pointer transition-colors ${config.useFeathering ? 'bg-accent' : 'bg-cream-dark/30'}`}><div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${config.useFeathering ? 'right-1' : 'left-1'}`} /></div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 pt-2">
                            <div className="space-y-1"><label className="text-[10px] font-bold text-bronze-light uppercase">{t('packager.phase2.format') || 'Format'}</label><select value={config.outputFormat} onChange={(e) => setConfig(prev => ({ ...prev, outputFormat: e.target.value as any }))} className="w-full px-3 py-2 bg-cream-medium/50 border border-cream-dark rounded-xl font-bold text-[10px] text-bronze-text outline-none shadow-inner"><option value="png">PNG</option><option value="webp">WebP</option></select></div>
                            <div className="space-y-1"><label className="text-[10px] font-bold text-bronze-light uppercase">{t('packager.phase2.prefix') || 'Prefix'}</label><input type="text" value={config.filenamePrefix} onChange={(e) => setConfig(prev => ({ ...prev, filenamePrefix: e.target.value }))} className="w-full px-3 py-2 bg-cream-medium/50 border border-cream-dark rounded-xl font-bold text-[10px] text-bronze-text outline-none shadow-inner" /></div>
                        </div>

                        <div className="flex flex-col gap-3 pt-4">
                            <button onClick={applyBeautification} className="w-full bg-bronze-medium hover:bg-bronze-dark text-white py-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-3 shadow-lg shadow-bronze-medium/20 transition-all active:scale-95">
                                <Sparkles size={22} /> {t('packager.phase2.apply') || 'Process All'}
                            </button>

                            {zipBlob && (
                                <div className="grid grid-cols-2 gap-3 animate-in fade-in slide-in-from-bottom-4">
                                    <button
                                        onClick={async () => {
                                            if (fileQueue.length === 0) return;
                                            let savedCount = 0;
                                            try {
                                                for (let i = 0; i < fileQueue.length; i++) {
                                                    const item = fileQueue[i];
                                                    if (!item.processedUrl) continue;
                                                    const blob = await fetch(item.processedUrl).then(r => r.blob());
                                                    const base64 = await blobToBase64(blob);
                                                    await saveStickerToDB({
                                                        id: `bty_${Date.now()}_${i}_${Math.random().toString(36).substr(2, 5)}`,
                                                        imageUrl: base64,
                                                        phrase: `${config.filenamePrefix} #${i + 1}`,
                                                        timestamp: Date.now()
                                                    });
                                                    savedCount++;
                                                }
                                                showToast(`${t('packager.status.savedToCollection') || 'Saved'} (${savedCount})`, 'success');
                                            } catch (err) {
                                                console.error("Failed to save", err);
                                                showToast(t('common.toast.saveSomeFailed', { defaultValue: 'Failed to save some images.' }), 'error');
                                            }
                                        }}
                                        className="w-full bg-gradient-to-r from-secondary to-accent hover:brightness-110 text-white py-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-secondary/20 active:scale-95 transition-all"
                                    >
                                        <Download size={20} className="rotate-180" /> {t('packager.phase2.saveToGallery') || 'Save'}
                                    </button>

                                    <button
                                        onClick={() => zipBlob && saveAs(zipBlob, `${config.filenamePrefix}_beautified_${Date.now()}.zip`)}
                                        className="w-full bg-gradient-to-r from-primary to-primary-hover hover:brightness-110 text-white py-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-primary/20 active:scale-95 transition-all"
                                    >
                                        <FileArchive size={20} /> {t('packager.phase2.downloadZip') || 'Download'}
                                    </button>
                                </div>
                            )}
                        </div>
                    </section>
                </div>
            </div>

            <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                multiple
                onChange={(e) => e.target.files && handleFiles(e.target.files)}
            />

        </div>
    );
};

export default BeautifyTab;

import React, { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Upload, Download, Expand, Shrink, ImageIcon, RotateCw, FolderOpen } from 'lucide-react';
import { GalleryPicker } from '../../../components/GalleryPicker';

const ImageResizerTab: React.FC = () => {
    const { t } = useTranslation();
    const [originalImage, setOriginalImage] = useState<string | null>(null);
    const [originalDimensions, setOriginalDimensions] = useState({ width: 0, height: 0 });

    // Resize State
    const [targetWidth, setTargetWidth] = useState<number>(0);
    const [targetHeight, setTargetHeight] = useState<number>(0);
    const [lockAspectRatio, setLockAspectRatio] = useState(true);
    const [scalePercent, setScalePercent] = useState<number>(100);

    const [resizedImage, setResizedImage] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [originalFileSize, setOriginalFileSize] = useState<number>(0);
    const [resizedFileSize, setResizedFileSize] = useState<number>(0);

    // Upscale State
    const [isUpscaling, setIsUpscaling] = useState(false);
    const [upscaleProgress, setUpscaleProgress] = useState<number>(0);
    const [upscaleStatus, setUpscaleStatus] = useState<string>('');
    const [showGalleryPicker, setShowGalleryPicker] = useState(false);
    const [resizeMode, setResizeMode] = useState<'stretch' | 'crop' | 'contain'>('crop'); // Default to crop to avoid distortion

    const fileInputRef = useRef<HTMLInputElement>(null);

    // Load Image
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setOriginalFileSize(file.size);
            const reader = new FileReader();
            reader.onload = (event) => {
                const img = new Image();
                img.onload = () => {
                    setOriginalImage(event.target?.result as string);
                    setOriginalDimensions({ width: img.width, height: img.height });
                    setTargetWidth(img.width);
                    setTargetHeight(img.height);
                    setScalePercent(100);
                    setResizedImage(null); // Reset previous result
                    setResizedFileSize(0);
                };
                img.src = event.target?.result as string;
            };
            reader.readAsDataURL(file);
        }
    };

    // Load Image from Gallery
    const handleGallerySelect = (blobs: Blob[]) => {
        if (blobs.length > 0) {
            const blob = blobs[0]; // Use first image selected
            setOriginalFileSize(blob.size);
            const reader = new FileReader();
            reader.onload = (event) => {
                const img = new Image();
                img.onload = () => {
                    setOriginalImage(event.target?.result as string);
                    setOriginalDimensions({ width: img.width, height: img.height });
                    setTargetWidth(img.width);
                    setTargetHeight(img.height);
                    setScalePercent(100);
                    setResizedImage(null); // Reset previous result
                    setResizedFileSize(0);
                };
                img.src = event.target?.result as string;
            };
            reader.readAsDataURL(blob);
        }
    };

    // Reset all state
    const handleReset = () => {
        setOriginalImage(null);
        setResizedImage(null);
        setOriginalDimensions({ width: 0, height: 0 });
        setTargetWidth(0);
        setTargetHeight(0);
        setScalePercent(100);
        setOriginalFileSize(0);
        setResizedFileSize(0);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    // Helper: Format file size
    const formatFileSize = (bytes: number): string => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    };

    // Update Dimensions based on Scale
    const handleScaleChange = (percent: number) => {
        setScalePercent(percent);
        const newWidth = Math.round(originalDimensions.width * (percent / 100));
        const newHeight = Math.round(originalDimensions.height * (percent / 100));
        setTargetWidth(newWidth);
        setTargetHeight(newHeight);
    };

    // Update Dimensions manually
    const handleWidthChange = (w: number) => {
        setTargetWidth(w);
        if (lockAspectRatio && originalDimensions.width > 0) {
            const ratio = originalDimensions.height / originalDimensions.width;
            setTargetHeight(Math.round(w * ratio));
        }
        // Update scale percent roughly
        if (originalDimensions.width > 0) {
            setScalePercent(Math.round((w / originalDimensions.width) * 100));
        }
    };

    const handleHeightChange = (h: number) => {
        setTargetHeight(h);
        if (lockAspectRatio && originalDimensions.height > 0) {
            const ratio = originalDimensions.width / originalDimensions.height;
            setTargetWidth(Math.round(h * ratio));
        }
        if (originalDimensions.height > 0) {
            setScalePercent(Math.round((h / originalDimensions.height) * 100));
        }
    };

    // Process Resize
    const processResize = async () => {
        if (!originalImage) return;
        setIsProcessing(true);

        // Slight delay to allow UI to update
        setTimeout(() => {
            const canvas = document.createElement('canvas');
            canvas.width = targetWidth;
            canvas.height = targetHeight;
            const ctx = canvas.getContext('2d');

            const img = new Image();
            img.onload = () => {
                if (ctx) {
                    // Better quality scaling
                    ctx.imageSmoothingEnabled = true;
                    ctx.imageSmoothingQuality = 'high';

                    if (resizeMode === 'stretch') {
                        // Mode 1: Stretch - fill entire canvas (may distort)
                        ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
                    } else if (resizeMode === 'crop') {
                        // Mode 2: Crop - maintain aspect ratio, crop excess
                        const imgAspect = img.width / img.height;
                        const targetAspect = targetWidth / targetHeight;

                        let sourceX = 0, sourceY = 0, sourceW = img.width, sourceH = img.height;

                        if (imgAspect > targetAspect) {
                            // Image is wider, crop sides
                            sourceW = img.height * targetAspect;
                            sourceX = (img.width - sourceW) / 2;
                        } else {
                            // Image is taller, crop top/bottom
                            sourceH = img.width / targetAspect;
                            sourceY = (img.height - sourceH) / 2;
                        }

                        ctx.drawImage(img, sourceX, sourceY, sourceW, sourceH, 0, 0, targetWidth, targetHeight);
                    } else {
                        // Mode 3: Contain - maintain aspect ratio, add padding
                        const imgAspect = img.width / img.height;
                        const targetAspect = targetWidth / targetHeight;

                        let drawWidth = targetWidth;
                        let drawHeight = targetHeight;
                        let offsetX = 0;
                        let offsetY = 0;

                        if (imgAspect > targetAspect) {
                            // Image is wider, fit width
                            drawHeight = targetWidth / imgAspect;
                            offsetY = (targetHeight - drawHeight) / 2;
                        } else {
                            // Image is taller, fit height
                            drawWidth = targetHeight * imgAspect;
                            offsetX = (targetWidth - drawWidth) / 2;
                        }

                        // Fill with white background
                        ctx.fillStyle = '#FFFFFF';
                        ctx.fillRect(0, 0, targetWidth, targetHeight);

                        ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
                    }

                    const dataUrl = canvas.toDataURL('image/png');
                    setResizedImage(dataUrl);

                    // Calculate file size from dataUrl
                    const base64 = dataUrl.split(',')[1];
                    const binaryLen = atob(base64).length;
                    setResizedFileSize(binaryLen);

                    setIsProcessing(false);
                }
            };
            img.src = originalImage;
        }, 100);
    };

    // Traditional High-Quality Upscale (Multi-stage Canvas Interpolation)
    const handleTraditionalUpscale = async (factor: number = 4) => {
        console.log("Starting traditional upscale with factor:", factor);
        if (!originalImage) {
            console.error("No original image found!");
            alert("請先上傳圖片！");
            return;
        }

        setIsUpscaling(true);
        setUpscaleProgress(0);
        setUpscaleStatus('準備放大圖片...');

        try {
            // Create source image
            const img = new Image();
            img.src = originalImage;

            await new Promise((resolve, reject) => {
                img.onload = resolve;
                img.onerror = reject;
            });

            setUpscaleStatus(`正在使用高質量插值放大 ${factor}x...`);
            setUpscaleProgress(30);

            // Multi-stage upscaling for better quality
            // Instead of scaling directly to 4x, we scale in steps (2x -> 2x for 4x)
            const stages = factor === 4 ? [2, 2] : [factor];
            let currentCanvas = document.createElement('canvas');
            let currentCtx = currentCanvas.getContext('2d')!;

            // Initial setup
            currentCanvas.width = img.width;
            currentCanvas.height = img.height;
            currentCtx.drawImage(img, 0, 0);

            // Progressive upscaling
            for (let i = 0; i < stages.length; i++) {
                const stageFactor = stages[i];
                const newWidth = currentCanvas.width * stageFactor;
                const newHeight = currentCanvas.height * stageFactor;

                const tempCanvas = document.createElement('canvas');
                tempCanvas.width = newWidth;
                tempCanvas.height = newHeight;
                const tempCtx = tempCanvas.getContext('2d')!;

                // Use high-quality interpolation
                tempCtx.imageSmoothingEnabled = true;
                tempCtx.imageSmoothingQuality = 'high';

                // Draw scaled image
                tempCtx.drawImage(currentCanvas, 0, 0, newWidth, newHeight);

                currentCanvas = tempCanvas;
                currentCtx = tempCtx;

                setUpscaleProgress(30 + (60 * (i + 1) / stages.length));
            }

            setUpscaleStatus('完成放大，正在生成預覽...');
            setUpscaleProgress(95);

            const upscaledDataUrl = currentCanvas.toDataURL('image/png');
            setResizedImage(upscaledDataUrl);

            const newWidth = originalDimensions.width * factor;
            const newHeight = originalDimensions.height * factor;
            setTargetWidth(newWidth);
            setTargetHeight(newHeight);
            setOriginalDimensions({ width: newWidth, height: newHeight });

            setUpscaleProgress(100);
            setUpscaleStatus(`完成！圖片已放大至 ${factor}x`);

        } catch (error) {
            console.error("Traditional upscale failed:", error);
            const errorMessage = error instanceof Error ? error.message : String(error);
            setUpscaleStatus(`錯誤: ${errorMessage}`);
            alert(`放大失敗\n\n${errorMessage}`);
        } finally {
            setTimeout(() => setIsUpscaling(false), 500);
        }
    };

    const handleDownload = () => {
        if (!resizedImage) return;
        const link = document.createElement('a');
        link.download = `resized_${targetWidth}x${targetHeight}_${Date.now()}.png`;
        link.href = resizedImage;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="flex flex-col h-full bg-slate-50/50 p-6 rounded-3xl gap-6 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-black text-slate-800 flex items-center gap-2">
                        <Expand className="text-indigo-600" />
                        {t('editor.resize.title') || 'Resize Image'}
                    </h2>
                    <p className="text-slate-500 text-sm mt-1">
                        {t('editor.resize.subtitle') || 'Easily resize, scale, and optimize your images dimensions.'}
                    </p>
                </div>

                {resizedImage && (
                    <button
                        onClick={handleDownload}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-indigo-200 transition-all hover:scale-105 active:scale-95"
                    >
                        <Download size={18} />
                        {t('common.download') || 'Download Image'}
                    </button>
                )}
            </div>

            <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 overflow-hidden">
                {/* Left: Controls */}
                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col gap-6 overflow-y-auto custom-scrollbar">

                    {/* Upload */}
                    {!originalImage ? (
                        <div className="space-y-4 h-full flex flex-col justify-center min-h-[300px]">
                            <div
                                onClick={() => fileInputRef.current?.click()}
                                className="border-2 border-dashed border-slate-300 rounded-2xl p-8 flex flex-col items-center justify-center text-slate-400 hover:text-indigo-500 hover:border-indigo-400 hover:bg-indigo-50/50 transition-all cursor-pointer"
                            >
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleFileChange}
                                    className="hidden"
                                    accept="image/*"
                                />
                                <div className="bg-slate-100 p-4 rounded-full mb-3 group-hover:bg-indigo-100 transition-colors">
                                    <Upload size={28} />
                                </div>
                                <p className="font-bold text-base">{t('editor.resize.uploadPrompt') || '點擊上傳圖片'}</p>
                                <p className="text-xs opacity-70">{t('editor.resize.uploadHint') || '支援 JPG, PNG, WEBP'}</p>
                            </div>

                            <div className="flex items-center gap-3">
                                <div className="flex-1 h-px bg-slate-200"></div>
                                <span className="text-xs text-slate-400 font-bold">{t('common.or') || '或'}</span>
                                <div className="flex-1 h-px bg-slate-200"></div>
                            </div>

                            <button
                                onClick={() => setShowGalleryPicker(true)}
                                className="w-full bg-white hover:bg-violet-50 border-2 border-slate-200 hover:border-violet-400 text-slate-600 hover:text-violet-600 px-6 py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all"
                            >
                                <FolderOpen size={20} />
                                {t('app.selectFromGallery') || '從作品集選取'}
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {/* Original Info + Reset */}
                            <div className="flex items-center justify-between gap-2">
                                <div className="flex-1 bg-slate-50 p-3 rounded-xl border border-slate-100 text-sm">
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-slate-500 text-xs">原始尺寸</span>
                                        <span className="font-mono font-bold text-slate-700 text-sm">{originalDimensions.width} x {originalDimensions.height} px</span>
                                    </div>
                                    {originalFileSize > 0 && (
                                        <div className="flex items-center justify-between">
                                            <span className="text-slate-500 text-xs">檔案大小</span>
                                            <span className="font-mono text-slate-600 text-xs">{formatFileSize(originalFileSize)}</span>
                                        </div>
                                    )}
                                </div>
                                <button
                                    onClick={handleReset}
                                    className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl font-bold text-sm transition-all flex-shrink-0"
                                >
                                    重置
                                </button>
                            </div>

                            {/* Resized Image Info */}
                            {resizedImage && resizedFileSize > 0 && (
                                <div className="bg-indigo-50 p-3 rounded-xl border border-indigo-100 text-sm">
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-indigo-600 text-xs font-bold">✨ 處理後尺寸</span>
                                        <span className="font-mono font-bold text-indigo-700 text-sm">{targetWidth} x {targetHeight} px</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-indigo-600 text-xs">檔案大小</span>
                                        <span className="font-mono text-indigo-700 text-xs">{formatFileSize(resizedFileSize)}</span>
                                    </div>
                                </div>
                            )}

                            <hr className="border-slate-100" />

                            {/* Scale Sections */}
                            <div className="space-y-6">
                                {/* Section 1: Common Presets */}
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2 text-slate-700 font-bold text-sm">
                                            <Expand size={14} className="text-violet-500" />
                                            <span>常用尺寸</span>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        <button
                                            onClick={() => { setTargetWidth(370); setTargetHeight(320); setScalePercent(Math.round((370 / originalDimensions.width) * 100)); }}
                                            className="px-3 py-2 bg-white hover:bg-violet-50 border border-slate-200 hover:border-violet-400 rounded-lg text-xs font-bold text-slate-600 hover:text-violet-600 transition-all"
                                        >
                                            LINE 貼圖 (370x320)
                                        </button>
                                        <button
                                            onClick={() => { setTargetWidth(1080); setTargetHeight(1080); setScalePercent(Math.round((1080 / originalDimensions.width) * 100)); }}
                                            className="px-3 py-2 bg-white hover:bg-violet-50 border border-slate-200 hover:border-violet-400 rounded-lg text-xs font-bold text-slate-600 hover:text-violet-600 transition-all"
                                        >
                                            IG 正方形 (1080x1080)
                                        </button>
                                        <button
                                            onClick={() => { setTargetWidth(1920); setTargetHeight(1080); setScalePercent(Math.round((1920 / originalDimensions.width) * 100)); }}
                                            className="px-3 py-2 bg-white hover:bg-violet-50 border border-slate-200 hover:border-violet-400 rounded-lg text-xs font-bold text-slate-600 hover:text-violet-600 transition-all"
                                        >
                                            Full HD (1920x1080)
                                        </button>
                                        <button
                                            onClick={() => { setTargetWidth(800); setTargetHeight(600); setScalePercent(Math.round((800 / originalDimensions.width) * 100)); }}
                                            className="px-3 py-2 bg-white hover:bg-violet-50 border border-slate-200 hover:border-violet-400 rounded-lg text-xs font-bold text-slate-600 hover:text-violet-600 transition-all"
                                        >
                                            標準 (800x600)
                                        </button>
                                    </div>
                                </div>

                                <hr className="border-slate-100" />

                                {/* Section 2: Thumbnail / Reduce */}
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2 text-slate-700 font-bold text-sm">
                                        <Shrink size={14} className="text-indigo-500" />
                                        <span>{t('editor.resize.reduceSection') || '縮小與縮圖'}</span>
                                    </div>
                                    <div className="grid grid-cols-4 gap-2">
                                        {[25, 50, 75].map(p => (
                                            <button
                                                key={p}
                                                onClick={() => handleScaleChange(p)}
                                                className={`py-2 rounded-lg text-xs font-bold transition-all ${scalePercent === p ? 'bg-indigo-100 text-indigo-700 border border-indigo-200' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                                            >
                                                {p}%
                                            </button>
                                        ))}
                                        <div className="relative">
                                            <input
                                                type="number"
                                                placeholder="%"
                                                className="w-full h-full text-center text-xs font-bold border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                                onChange={(e) => handleScaleChange(Number(e.target.value))}
                                            />
                                        </div>
                                    </div>

                                    {/* Manual Dimensions moved here for context */}
                                    <div className="grid grid-cols-2 gap-4 pt-2">
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t('editor.resize.width') || '寬度'}</label>
                                            <input
                                                type="number"
                                                value={targetWidth}
                                                onChange={(e) => handleWidthChange(Number(e.target.value))}
                                                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 font-mono text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t('editor.resize.height') || '高度'}</label>
                                            <input
                                                type="number"
                                                value={targetHeight}
                                                onChange={(e) => handleHeightChange(Number(e.target.value))}
                                                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 font-mono text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                            />
                                        </div>
                                    </div>

                                    {/* Resize Mode Selection */}
                                    <div className="space-y-2 pt-2">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">調整模式</label>
                                        <div className="grid grid-cols-3 gap-2">
                                            <button
                                                onClick={() => setResizeMode('crop')}
                                                className={`px-3 py-2.5 rounded-lg text-xs font-bold transition-all ${resizeMode === 'crop' ? 'bg-indigo-600 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                                            >
                                                ✂️ 裁切
                                            </button>
                                            <button
                                                onClick={() => setResizeMode('contain')}
                                                className={`px-3 py-2.5 rounded-lg text-xs font-bold transition-all ${resizeMode === 'contain' ? 'bg-indigo-600 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                                            >
                                                📐 填充
                                            </button>
                                            <button
                                                onClick={() => setResizeMode('stretch')}
                                                className={`px-3 py-2.5 rounded-lg text-xs font-bold transition-all ${resizeMode === 'stretch' ? 'bg-indigo-600 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                                            >
                                                ↔️ 拉伸
                                            </button>
                                        </div>
                                        <p className="text-[9px] text-slate-400 px-1">
                                            {resizeMode === 'crop' && '保持比例，裁切多餘部分'}
                                            {resizeMode === 'contain' && '保持比例，白色背景填充'}
                                            {resizeMode === 'stretch' && '強制縮放（可能變形）'}
                                        </p>
                                    </div>

                                    <button
                                        onClick={processResize}
                                        disabled={isProcessing}
                                        className="w-full bg-slate-100 text-slate-600 hover:bg-indigo-600 hover:text-white py-2.5 rounded-xl font-bold transition-all flex items-center justify-center gap-2 mt-2"
                                    >
                                        {isProcessing ? <RotateCw className="animate-spin" size={16} /> : <Expand size={16} />}
                                        {t('editor.resize.applyResize') || '套用調整大小'}
                                    </button>
                                </div>

                                <hr className="border-slate-100" />

                                {/* Section 2: Upscale / Enlarge */}
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2 text-slate-700 font-bold">
                                        <Expand size={16} className="text-amber-500" />
                                        <span>高質量放大（傳統插值）</span>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <button
                                            onClick={() => handleTraditionalUpscale(2)}
                                            disabled={isProcessing || isUpscaling}
                                            className="relative overflow-hidden group bg-slate-50 hover:bg-slate-900 border border-slate-200 hover:border-slate-900 rounded-xl p-3 text-left transition-all"
                                        >
                                            <span className="block text-lg font-black text-slate-800 group-hover:text-white">2x</span>
                                            <span className="text-[10px] text-slate-400 font-bold group-hover:text-slate-300">快速放大</span>
                                            <Expand size={64} className="absolute -bottom-4 -right-4 text-amber-500/10 group-hover:text-amber-500/20 rotate-12" />
                                        </button>
                                        <button
                                            onClick={() => handleTraditionalUpscale(4)}
                                            disabled={isProcessing || isUpscaling}
                                            className="relative overflow-hidden group bg-slate-900 hover:bg-black text-white rounded-xl p-3 text-left shadow-lg shadow-indigo-200/50 transition-all hover:scale-[1.02]"
                                        >
                                            <span className="block text-lg font-black text-amber-400">4x</span>
                                            <span className="text-[10px] text-slate-300 font-bold">多階段放大</span>
                                            <Expand size={64} className="absolute -bottom-4 -right-4 text-white/5 group-hover:text-white/10 rotate-12" />
                                        </button>
                                    </div>

                                    {/* Loading State Display */}
                                    {isUpscaling && (
                                        <div className="bg-slate-900 text-white p-3 rounded-lg text-xs flex items-center gap-3">
                                            <RotateCw className="animate-spin text-amber-400 flex-shrink-0" size={16} />
                                            <div className="flex-1 min-w-0">
                                                <div className="font-bold truncate">{upscaleStatus || 'Processing...'}</div>
                                                <div className="h-1 bg-slate-700 rounded-full mt-1.5 overflow-hidden">
                                                    <div className="h-full bg-amber-400 transition-all duration-300" style={{ width: `${upscaleProgress}%` }}></div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    <div className="text-[10px] text-slate-400 leading-relaxed text-center">
                                        {t('editor.resize.upscaleNote') || '使用本地瀏覽器處理，速度快且完全離線'}
                                    </div>

                                </div>
                            </div>

                            {/* Info */}
                            <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 text-xs text-amber-800 flex gap-2 items-start">
                                <span className="text-lg">💡</span>
                                <p>{t('editor.resize.qualityWarning') || '放大圖片（超過100%）可能導致畫質下降或像素化。縮小圖片通常適合製作縮圖。'}</p>
                            </div>

                        </div>
                    )}
                </div>

                {/* Right: Preview */}
                <div className="col-span-1 lg:col-span-2 bg-slate-200/50 rounded-2xl border border-slate-200/50 p-6 flex items-center justify-center relative overflow-hidden checkerboard-bg">
                    {!originalImage ? (
                        <div className="text-center opacity-40">
                            <ImageIcon size={64} className="mx-auto mb-4 text-slate-400" />
                            <p className="font-bold text-slate-500">Preview Area</p>
                        </div>
                    ) : (
                        <div className="relative max-w-full max-h-full shadow-2xl rounded-lg overflow-hidden transition-all duration-500">
                            <img
                                src={resizedImage || originalImage}
                                alt="Preview"
                                className="max-w-full max-h-[600px] object-contain"
                            />
                            <div className="absolute bottom-2 right-2 bg-black/60 text-white text-[10px] px-2 py-1 rounded-md backdrop-blur-sm">
                                {resizedImage ? `${targetWidth} x ${targetHeight}` : `${originalDimensions.width} x ${originalDimensions.height}`}
                            </div>
                        </div>
                    )}
                </div>
            </div>

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

export default ImageResizerTab;

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { saveAs } from 'file-saver';
import {
    Crop,
    Download,
    FolderOpen,
    Image as ImageIcon,
    Move,
    RotateCcw,
    Save,
    Upload,
    ZoomIn,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { GalleryPicker } from '../../../components/GalleryPicker';
import { useToast } from '../../../components/shared/ToastProvider';
import { saveStickerToDB } from '../../../db';
import {
    changePixelCropScale,
    createCenteredPixelCrop,
    getFixedCropPreviewTransform,
    getMinimumImageScale,
    getScaledSourceCrop,
    movePixelCropAtScale,
    resizePixelCropAtScale,
    type PixelCropRect,
} from '../utils/precisionCrop';

interface LoadedImage {
    element: HTMLImageElement;
    url: string;
    name: string;
    width: number;
    height: number;
}

interface DragState {
    pointerId: number;
    clientX: number;
    clientY: number;
    crop: PixelCropRect;
}

const DEFAULT_CROP_SIZE = 100;
const CROP_PRESETS = [
    { label: '100×100', width: 100, height: 100 },
    { label: 'LINE 96×74', width: 96, height: 74 },
    { label: 'LINE 240×240', width: 240, height: 240 },
    { label: 'LINE 320×270', width: 320, height: 270 },
];

const PrecisionCropTool = () => {
    const { t } = useTranslation();
    const { showToast } = useToast();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const previewCanvasRef = useRef<HTMLCanvasElement>(null);
    const ownedUrlRef = useRef<string | null>(null);
    const dragRef = useRef<DragState | null>(null);
    const [source, setSource] = useState<LoadedImage | null>(null);
    const [crop, setCrop] = useState<PixelCropRect>({
        x: 0,
        y: 0,
        width: DEFAULT_CROP_SIZE,
        height: DEFAULT_CROP_SIZE,
    });
    const [imageScale, setImageScale] = useState(1);
    const [showGalleryPicker, setShowGalleryPicker] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const releaseOwnedUrl = useCallback(() => {
        if (!ownedUrlRef.current) return;
        URL.revokeObjectURL(ownedUrlRef.current);
        ownedUrlRef.current = null;
    }, []);

    useEffect(() => releaseOwnedUrl, [releaseOwnedUrl]);

    const loadBlob = useCallback((blob: Blob, name = 'image') => {
        const url = URL.createObjectURL(blob);
        const image = new Image();
        image.onload = () => {
            releaseOwnedUrl();
            ownedUrlRef.current = url;
            const nextSource = {
                element: image,
                url,
                name,
                width: image.naturalWidth,
                height: image.naturalHeight,
            };
            setSource(nextSource);
            setCrop(createCenteredPixelCrop(
                nextSource.width,
                nextSource.height,
                DEFAULT_CROP_SIZE,
                DEFAULT_CROP_SIZE,
            ));
            setImageScale(1);
        };
        image.onerror = () => {
            URL.revokeObjectURL(url);
            showToast(t('editor.cropResize.loadError', { defaultValue: '圖片載入失敗，請更換檔案。' }), 'error');
        };
        image.src = url;
    }, [releaseOwnedUrl, showToast, t]);

    const resetSource = () => {
        releaseOwnedUrl();
        setSource(null);
        setCrop({ x: 0, y: 0, width: DEFAULT_CROP_SIZE, height: DEFAULT_CROP_SIZE });
        setImageScale(1);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const minimumScalePercent = useMemo(() => {
        if (!source) return 25;
        return Math.max(25, Math.ceil(getMinimumImageScale(
            crop.width,
            crop.height,
            source.width,
            source.height,
        ) * 100));
    }, [source, crop.width, crop.height]);
    const sourceCrop = useMemo(() => (
        source
            ? getScaledSourceCrop(crop, imageScale, source.width, source.height)
            : null
    ), [source, crop, imageScale]);
    const imagePreviewTransform = useMemo(() => (
        source && sourceCrop
            ? getFixedCropPreviewTransform(source.width, source.height, sourceCrop)
            : null
    ), [source, sourceCrop]);

    useEffect(() => {
        const canvas = previewCanvasRef.current;
        if (!canvas || !source || !sourceCrop) return;
        canvas.width = crop.width;
        canvas.height = crop.height;
        const context = canvas.getContext('2d');
        if (!context) return;
        context.imageSmoothingEnabled = true;
        context.imageSmoothingQuality = 'high';
        context.clearRect(0, 0, crop.width, crop.height);
        context.drawImage(
            source.element,
            sourceCrop.x,
            sourceCrop.y,
            sourceCrop.width,
            sourceCrop.height,
            0,
            0,
            crop.width,
            crop.height,
        );
    }, [source, sourceCrop, crop.width, crop.height]);

    const updateCropSize = (width: number, height: number) => {
        if (!source) return;
        const safeWidth = Math.max(1, Math.min(source.width, Math.round(width)));
        const safeHeight = Math.max(1, Math.min(source.height, Math.round(height)));
        const nextMinimumScale = Math.max(0.25, Math.ceil(getMinimumImageScale(
            safeWidth,
            safeHeight,
            source.width,
            source.height,
        ) * 100) / 100);
        const nextScale = Math.max(imageScale, nextMinimumScale);
        setImageScale(nextScale);
        setCrop((current) => resizePixelCropAtScale(
            current,
            safeWidth,
            safeHeight,
            source.width,
            source.height,
            nextScale,
        ));
    };

    const updateCropPosition = (x: number, y: number) => {
        if (!source) return;
        setCrop((current) => movePixelCropAtScale(
            current,
            x,
            y,
            source.width,
            source.height,
            imageScale,
        ));
    };

    const updateImageScale = (nextScale: number) => {
        if (!source) return;
        const safeScale = Math.max(minimumScalePercent / 100, Math.min(4, nextScale));
        setCrop((current) => changePixelCropScale(
            current,
            imageScale,
            safeScale,
            source.width,
            source.height,
        ));
        setImageScale(safeScale);
    };

    const handlePointerDown = (event: React.PointerEvent<HTMLButtonElement>) => {
        if (!source) return;
        event.preventDefault();
        event.currentTarget.setPointerCapture(event.pointerId);
        dragRef.current = {
            pointerId: event.pointerId,
            clientX: event.clientX,
            clientY: event.clientY,
            crop,
        };
    };

    const handlePointerMove = (event: React.PointerEvent<HTMLButtonElement>) => {
        const drag = dragRef.current;
        if (!source || !drag || drag.pointerId !== event.pointerId) return;
        const displayRect = event.currentTarget.getBoundingClientRect();
        if (displayRect.width <= 0 || displayRect.height <= 0) return;
        const visibleSourceWidth = drag.crop.width / imageScale;
        const visibleSourceHeight = drag.crop.height / imageScale;
        const deltaX = -(event.clientX - drag.clientX) * visibleSourceWidth / displayRect.width;
        const deltaY = -(event.clientY - drag.clientY) * visibleSourceHeight / displayRect.height;
        setCrop(movePixelCropAtScale(
            drag.crop,
            drag.crop.x + deltaX,
            drag.crop.y + deltaY,
            source.width,
            source.height,
            imageScale,
        ));
    };

    const handlePointerUp = (event: React.PointerEvent<HTMLButtonElement>) => {
        if (dragRef.current?.pointerId !== event.pointerId) return;
        dragRef.current = null;
        if (event.currentTarget.hasPointerCapture(event.pointerId)) {
            event.currentTarget.releasePointerCapture(event.pointerId);
        }
    };

    const handleKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
        const offsets: Record<string, [number, number]> = {
            ArrowUp: [0, -1],
            ArrowDown: [0, 1],
            ArrowLeft: [-1, 0],
            ArrowRight: [1, 0],
        };
        const offset = offsets[event.key];
        if (!offset) return;
        event.preventDefault();
        const step = event.shiftKey ? 10 : 1;
        updateCropPosition(crop.x + offset[0] * step, crop.y + offset[1] * step);
    };

    const handleDownload = () => {
        const canvas = previewCanvasRef.current;
        if (!canvas || !source) return;
        canvas.toBlob((blob) => {
            if (!blob) {
                showToast(t('editor.cropResize.exportError', { defaultValue: '無法產生裁切圖片。' }), 'error');
                return;
            }
            const baseName = source.name.replace(/\.[^.]+$/, '') || 'image';
            saveAs(blob, `${baseName}_crop_${crop.width}x${crop.height}.png`);
        }, 'image/png');
    };

    const handleSaveToGallery = async () => {
        const canvas = previewCanvasRef.current;
        if (!canvas || !source) return;
        setIsSaving(true);
        try {
            await saveStickerToDB({
                id: `precision_crop_${Date.now()}_${crypto.randomUUID().slice(0, 8)}`,
                imageUrl: canvas.toDataURL('image/png'),
                phrase: `${crop.width}×${crop.height} ${t('editor.cropResize.galleryPhrase', { defaultValue: '精準裁切' })}`,
                timestamp: Date.now(),
            });
            showToast(t('editor.cropResize.saved', { defaultValue: '裁切圖片已儲存到作品集。' }), 'success');
        } catch (error) {
            console.error('Failed to save precision crop', error);
            showToast(t('editor.cropResize.saveError', { defaultValue: '儲存失敗，請再試一次。' }), 'error');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="min-h-full bg-secondary/10 p-4 text-bronze-text md:p-6">
            <div className="mx-auto max-w-[1500px] overflow-hidden rounded-3xl border border-cream-dark bg-cream-light shadow-xl shadow-primary/10">
                <header className="flex flex-wrap items-start justify-between gap-4 border-b border-cream-dark bg-cream px-5 py-5 md:px-7">
                    <div>
                        <p className="text-xs font-black uppercase tracking-[0.18em] text-primary">
                            {t('editor.cropResize.eyebrow', { defaultValue: 'PIXEL CROP' })}
                        </p>
                        <h2 className="mt-1 flex items-center gap-2 text-2xl font-black text-bronze-text">
                            <Crop className="text-primary" size={24} />
                            {t('editor.cropResize.title', { defaultValue: '固定像素精準裁切' })}
                        </h2>
                        <p className="mt-2 max-w-2xl text-sm font-medium leading-6 text-bronze-light">
                            {t('editor.cropResize.subtitle', { defaultValue: '指定輸出尺寸後，移動裁切框並縮放圖片，精準決定框內保留的內容。' })}
                        </p>
                    </div>
                    {source && (
                        <div className="rounded-xl border border-secondary-hover/60 bg-secondary/30 px-3 py-2 text-sm font-black text-bronze-text">
                            {source.width}×{source.height} px
                        </div>
                    )}
                </header>

                {!source ? (
                    <div className="grid min-h-[520px] place-items-center p-6">
                        <div className="w-full max-w-2xl rounded-3xl border border-dashed border-primary/35 bg-white/75 p-8 text-center shadow-sm md:p-12">
                            <div className="mx-auto grid h-20 w-20 place-items-center rounded-3xl bg-secondary/35 text-primary shadow-inner">
                                <ImageIcon size={38} />
                            </div>
                            <h3 className="mt-5 text-xl font-black text-bronze-text">
                                {t('editor.cropResize.uploadTitle', { defaultValue: '上傳要裁切的圖片' })}
                            </h3>
                            <p className="mt-2 text-sm font-medium text-bronze-light">
                                {t('editor.cropResize.uploadHint', { defaultValue: '支援 PNG、JPG、WebP；全部在瀏覽器本機處理。' })}
                            </p>
                            <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-black text-white shadow-lg shadow-primary/20 transition-all hover:-translate-y-0.5 hover:bg-primary-hover"
                                >
                                    <Upload size={18} />
                                    {t('editor.cropResize.upload', { defaultValue: '選擇圖片' })}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowGalleryPicker(true)}
                                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-cream-dark bg-cream px-6 py-3 text-sm font-black text-bronze-text transition-colors hover:border-primary/40 hover:text-primary"
                                >
                                    <FolderOpen size={18} />
                                    {t('app.selectFromGallery', { defaultValue: '從作品集選取' })}
                                </button>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="grid gap-5 p-4 md:p-6 xl:grid-cols-[300px_minmax(0,1fr)_300px]">
                        <aside className="space-y-4 rounded-2xl border border-cream-dark bg-cream p-4 shadow-sm">
                            <div className="flex items-center justify-between gap-3">
                                <div>
                                    <p className="text-sm font-black text-bronze-text">
                                        {t('editor.cropResize.sizeTitle', { defaultValue: '裁切框尺寸' })}
                                    </p>
                                    <p className="mt-1 text-xs font-bold text-bronze-light">
                                        {t('editor.cropResize.sizeHint', { defaultValue: '寬高固定輸出尺寸；圖片比例另外調整。' })}
                                    </p>
                                </div>
                                <span className="rounded-lg bg-white px-2 py-1 text-xs font-black text-primary shadow-sm">
                                    {crop.width}×{crop.height}
                                </span>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <label className="text-xs font-black text-bronze-light">
                                    {t('editor.cropResize.width', { defaultValue: '寬度 px' })}
                                    <input
                                        type="number"
                                        min={1}
                                        max={source.width}
                                        value={crop.width}
                                        onChange={(event) => updateCropSize(Number(event.target.value), crop.height)}
                                        className="mt-1.5 w-full rounded-xl border border-cream-dark bg-white px-3 py-2.5 text-sm font-black text-bronze-text outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15"
                                    />
                                </label>
                                <label className="text-xs font-black text-bronze-light">
                                    {t('editor.cropResize.height', { defaultValue: '高度 px' })}
                                    <input
                                        type="number"
                                        min={1}
                                        max={source.height}
                                        value={crop.height}
                                        onChange={(event) => updateCropSize(crop.width, Number(event.target.value))}
                                        className="mt-1.5 w-full rounded-xl border border-cream-dark bg-white px-3 py-2.5 text-sm font-black text-bronze-text outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15"
                                    />
                                </label>
                            </div>

                            <div>
                                <p className="mb-2 text-xs font-black text-bronze-light">
                                    {t('editor.cropResize.presets', { defaultValue: '常用尺寸' })}
                                </p>
                                <div className="grid grid-cols-2 gap-2">
                                    {CROP_PRESETS.map((preset) => (
                                        <button
                                            key={preset.label}
                                            type="button"
                                            onClick={() => updateCropSize(preset.width, preset.height)}
                                            className={`rounded-xl border px-2 py-2 text-xs font-black transition-colors ${crop.width === Math.min(preset.width, source.width) && crop.height === Math.min(preset.height, source.height) ? 'border-primary bg-primary text-white' : 'border-cream-dark bg-white text-bronze-text hover:border-primary/40 hover:text-primary'}`}
                                        >
                                            {preset.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="border-t border-cream-dark pt-4">
                                <div className="mb-3 flex items-center justify-between gap-3">
                                    <div className="flex items-center gap-2 text-sm font-black text-bronze-text">
                                        <ZoomIn size={16} className="text-primary" />
                                        {t('editor.cropResize.imageScale', { defaultValue: '圖片大小' })}
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => updateImageScale(1)}
                                        className="rounded-lg bg-white px-2.5 py-1 text-xs font-black text-primary shadow-sm transition-colors hover:bg-primary hover:text-white"
                                    >
                                        {Math.round(imageScale * 100)}%
                                    </button>
                                </div>
                                <input
                                    type="range"
                                    min={minimumScalePercent}
                                    max={400}
                                    step={5}
                                    value={Math.round(imageScale * 100)}
                                    onChange={(event) => updateImageScale(Number(event.target.value) / 100)}
                                    className="w-full accent-primary"
                                    aria-label={t('editor.cropResize.imageScale', { defaultValue: '圖片大小' })}
                                />
                                <div className="mt-2 flex justify-between text-xs font-bold text-bronze-light">
                                    <span>{t('editor.cropResize.scaleDown', { defaultValue: '縮小' })}</span>
                                    <span>100%</span>
                                    <span>{t('editor.cropResize.scaleUp', { defaultValue: '放大' })}</span>
                                </div>
                                {sourceCrop && (
                                    <p className="mt-3 rounded-xl border border-secondary-hover/50 bg-secondary/25 px-3 py-2 text-xs font-bold leading-5 text-bronze-light">
                                        {t('editor.cropResize.sourceRegion', {
                                            width: Math.round(sourceCrop.width),
                                            height: Math.round(sourceCrop.height),
                                            outputWidth: crop.width,
                                            outputHeight: crop.height,
                                            defaultValue: `取樣 ${Math.round(sourceCrop.width)}×${Math.round(sourceCrop.height)} → 輸出 ${crop.width}×${crop.height}`,
                                        })}
                                    </p>
                                )}
                            </div>

                            <div className="border-t border-cream-dark pt-4">
                                <div className="mb-2 flex items-center gap-2 text-sm font-black text-bronze-text">
                                    <Move size={16} className="text-primary" />
                                    {t('editor.cropResize.positionTitle', { defaultValue: '精準位置' })}
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <label className="text-xs font-black text-bronze-light">
                                        X
                                        <input
                                            type="number"
                                            min={0}
                                            max={Math.max(0, Math.floor(source.width - (sourceCrop?.width ?? crop.width)))}
                                            value={crop.x}
                                            onChange={(event) => updateCropPosition(Number(event.target.value), crop.y)}
                                            className="mt-1.5 w-full rounded-xl border border-cream-dark bg-white px-3 py-2.5 text-sm font-black text-bronze-text outline-none focus:border-primary"
                                        />
                                    </label>
                                    <label className="text-xs font-black text-bronze-light">
                                        Y
                                        <input
                                            type="number"
                                            min={0}
                                            max={Math.max(0, Math.floor(source.height - (sourceCrop?.height ?? crop.height)))}
                                            value={crop.y}
                                            onChange={(event) => updateCropPosition(crop.x, Number(event.target.value))}
                                            className="mt-1.5 w-full rounded-xl border border-cream-dark bg-white px-3 py-2.5 text-sm font-black text-bronze-text outline-none focus:border-primary"
                                        />
                                    </label>
                                </div>
                                <p className="mt-3 rounded-xl border border-secondary-hover/50 bg-secondary/25 px-3 py-2 text-xs font-bold leading-5 text-bronze-light">
                                    {t('editor.cropResize.keyboardHint', { defaultValue: '方向鍵移動 1px；Shift + 方向鍵移動 10px。' })}
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={resetSource}
                                className="flex w-full items-center justify-center gap-2 rounded-xl border border-cream-dark bg-white px-4 py-2.5 text-sm font-black text-bronze-text transition-colors hover:border-primary/40 hover:text-primary"
                            >
                                <RotateCcw size={16} />
                                {t('editor.cropResize.changeImage', { defaultValue: '更換圖片' })}
                            </button>
                        </aside>

                        <section className="min-h-[480px] overflow-hidden rounded-2xl border border-cream-dark bg-bronze-text p-4 shadow-inner md:p-6">
                            <div className="mb-3 flex items-center justify-between gap-3 text-white">
                                <div>
                                    <p className="text-sm font-black">
                                        {t('editor.cropResize.workspaceTitle', { defaultValue: '拖曳圖片調整取景' })}
                                    </p>
                                    <p className="mt-1 text-xs font-bold text-white/65">
                                        {t('editor.cropResize.workspaceHint', { defaultValue: '裁切框保持固定；縮放或拖曳框內圖片來決定保留內容。' })}
                                    </p>
                                </div>
                                <span className="rounded-lg bg-white/10 px-2.5 py-1 text-xs font-black text-secondary">
                                    X {crop.x} · Y {crop.y}
                                </span>
                            </div>
                            <div className="grid min-h-[400px] place-items-center overflow-auto rounded-xl bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.1),transparent_65%)] p-4">
                                <button
                                    type="button"
                                    onPointerDown={handlePointerDown}
                                    onPointerMove={handlePointerMove}
                                    onPointerUp={handlePointerUp}
                                    onPointerCancel={handlePointerUp}
                                    onKeyDown={handleKeyDown}
                                    className="relative block max-w-full cursor-grab touch-none overflow-hidden rounded-lg border-2 border-white bg-black/20 outline-none shadow-2xl ring-primary active:cursor-grabbing focus:ring-4"
                                    style={{
                                        aspectRatio: `${crop.width} / ${crop.height}`,
                                        width: `min(100%, ${Math.min(160, 56 * crop.width / crop.height)}vh)`,
                                    }}
                                    aria-label={t('editor.cropResize.cropAreaLabel', { defaultValue: '固定裁切框；拖曳圖片調整取景' })}
                                >
                                    {imagePreviewTransform && (
                                        <img
                                            src={source.url}
                                            alt={t('editor.cropResize.sourceAlt', { defaultValue: '待裁切原圖' })}
                                            className="pointer-events-none absolute max-w-none select-none"
                                            style={{
                                                width: `${imagePreviewTransform.widthPercent}%`,
                                                height: `${imagePreviewTransform.heightPercent}%`,
                                                left: `${imagePreviewTransform.leftPercent}%`,
                                                top: `${imagePreviewTransform.topPercent}%`,
                                            }}
                                            draggable={false}
                                        />
                                    )}
                                    <span className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-white/70" />
                                    <span className="pointer-events-none absolute inset-x-0 top-1/3 border-t border-dashed border-white/45" />
                                    <span className="pointer-events-none absolute inset-x-0 top-2/3 border-t border-dashed border-white/45" />
                                    <span className="pointer-events-none absolute inset-y-0 left-1/3 border-l border-dashed border-white/45" />
                                    <span className="pointer-events-none absolute inset-y-0 left-2/3 border-l border-dashed border-white/45" />
                                    <span className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-lg bg-bronze-text/80 px-2 py-1 text-xs font-black text-white backdrop-blur-sm">
                                        {crop.width}×{crop.height} · {Math.round(imageScale * 100)}%
                                    </span>
                                </button>
                            </div>
                        </section>

                        <aside className="flex flex-col rounded-2xl border border-secondary-hover/60 bg-secondary/20 p-4">
                            <div>
                                <p className="text-sm font-black text-bronze-text">
                                    {t('editor.cropResize.previewTitle', { defaultValue: '實際輸出預覽' })}
                                </p>
                                <p className="mt-1 text-xs font-bold leading-5 text-bronze-light">
                                    {t('editor.cropResize.previewHint', { defaultValue: '輸出尺寸固定；預覽與下載會套用目前的圖片縮放比例。' })}
                                </p>
                            </div>
                            <div className="my-4 grid min-h-56 flex-1 place-items-center overflow-auto rounded-2xl border border-secondary-hover/50 bg-grid-pattern p-3">
                                <canvas
                                    ref={previewCanvasRef}
                                    width={crop.width}
                                    height={crop.height}
                                    className="max-h-[360px] max-w-full shadow-lg"
                                    aria-label={t('editor.cropResize.previewAlt', { defaultValue: '裁切結果預覽' })}
                                />
                            </div>
                            <div className="rounded-xl border border-secondary-hover/50 bg-white/75 px-3 py-2 text-center text-sm font-black text-bronze-text">
                                PNG · {crop.width}×{crop.height} px
                            </div>
                            <div className="mt-3 grid gap-2">
                                <button
                                    type="button"
                                    onClick={handleDownload}
                                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-black text-white shadow-lg shadow-primary/20 transition-all hover:-translate-y-0.5 hover:bg-primary-hover"
                                >
                                    <Download size={17} />
                                    {t('editor.cropResize.download', { defaultValue: '下載裁切 PNG' })}
                                </button>
                                <button
                                    type="button"
                                    onClick={handleSaveToGallery}
                                    disabled={isSaving}
                                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-cream-dark bg-cream px-4 py-3 text-sm font-black text-bronze-text transition-colors hover:border-primary/40 hover:text-primary disabled:opacity-50"
                                >
                                    <Save size={17} />
                                    {isSaving
                                        ? t('editor.cropResize.saving', { defaultValue: '儲存中…' })
                                        : t('editor.cropResize.save', { defaultValue: '儲存到作品集' })}
                                </button>
                            </div>
                        </aside>
                    </div>
                )}
            </div>

            <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) loadBlob(file, file.name);
                    event.currentTarget.value = '';
                }}
            />

            {showGalleryPicker && (
                <GalleryPicker
                    onSelect={(blobs) => {
                        if (blobs[0]) loadBlob(blobs[0], 'gallery-image');
                        setShowGalleryPicker(false);
                    }}
                    onClose={() => setShowGalleryPicker(false)}
                />
            )}
        </div>
    );
};

export default PrecisionCropTool;

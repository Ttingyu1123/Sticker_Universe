import React, { useState, useRef, DragEvent, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import { Upload, Layout, Trash2, Plus, Edit2, Copy, Grid, FolderHeart } from 'lucide-react';
import { AppConfig, DEFAULT_CONFIG, PhotoAsset, PhotoSize, PaperSize } from '../types/idPrint';
import { PHOTO_DIMENSIONS_MM, PAPER_DIMENSIONS } from '../utils/IDPrint/constants';
import { calculateMaxPhotosPerPage } from '../utils/IDPrint/canvasUtils';
import PhotoCropper from './IDPrint/PhotoCropper';
import LayoutPreview from './IDPrint/LayoutPreview';
import { GalleryPicker } from '../../../components/GalleryPicker';

type CropSession = {
    sourceUrl: string;
    editAssetId?: string;
};

const IDPrintStudioTab: React.FC = () => {
    const { t } = useTranslation();

    // State
    const [assets, setAssets] = useState<PhotoAsset[]>([]);
    const [cropSession, setCropSession] = useState<CropSession | null>(null);
    const [config, setConfig] = useState<AppConfig>(DEFAULT_CONFIG);
    const [isDragging, setIsDragging] = useState(false);
    const [showGallery, setShowGallery] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [searchParams, setSearchParams] = useSearchParams();

    // 自動載入來自 HeadshotGeneratorTab 的圖片
    useEffect(() => {
        const autoLoad = searchParams.get('autoLoad');
        if (autoLoad === 'true') {
            const headshotImage = localStorage.getItem('headshot_to_print');
            if (headshotImage) {
                // 載入圖片到裁剪器
                setCropSession({ sourceUrl: headshotImage });
                // 清除 localStorage 和 URL 參數
                localStorage.removeItem('headshot_to_print');
                searchParams.delete('autoLoad');
                setSearchParams(searchParams);
            }
        }
    }, [searchParams, setSearchParams]);

    // Actions
    const handleFile = (file: File) => {
        if (!file.type.startsWith('image/')) return;

        const reader = new FileReader();
        reader.onload = () => {
            setCropSession({ sourceUrl: reader.result as string });
        };
        reader.readAsDataURL(file);
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            handleFile(e.target.files[0]);
        }
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            handleFile(e.dataTransfer.files[0]);
        }
    };

    const updateConfig = (key: keyof AppConfig, value: any) => {
        setConfig((prev) => ({ ...prev, [key]: value }));
    };

    const handleCropComplete = (croppedUrl: string) => {
        if (!cropSession) return;

        if (cropSession.editAssetId) {
            setAssets(prev => prev.map(a =>
                a.id === cropSession.editAssetId
                    ? { ...a, croppedUrl }
                    : a
            ));
        } else {
            const newAsset: PhotoAsset = {
                id: Date.now().toString(),
                sourceUrl: cropSession.sourceUrl,
                croppedUrl,
                quantity: 1
            };
            setAssets(prev => [...prev, newAsset]);
        }
        setCropSession(null);
    };

    const updateAssetQuantity = (id: string, delta: number) => {
        setAssets(prev => prev.map(a => {
            if (a.id === id) {
                const newQ = Math.max(1, a.quantity + delta);
                return { ...a, quantity: newQ };
            }
            return a;
        }));
    };

    const setAssetQuantity = (id: string, qty: number) => {
        setAssets(prev => prev.map(a => a.id === id ? { ...a, quantity: Math.max(1, qty) } : a));
    }

    const deleteAsset = (id: string) => {
        setAssets(prev => prev.filter(a => a.id !== id));
    };

    const editAsset = (asset: PhotoAsset) => {
        setCropSession({ sourceUrl: asset.sourceUrl, editAssetId: asset.id });
    };

    const duplicateAsset = (asset: PhotoAsset) => {
        const newAsset = { ...asset, id: Date.now().toString() };
        setAssets(prev => [...prev, newAsset]);
    };

    const fillPageWith = (id: string) => {
        const maxPhotos = calculateMaxPhotosPerPage(config);
        setAssetQuantity(id, maxPhotos);
    };

    const handleGallerySelect = async (blobs: Blob[]) => {
        blobs.forEach(blob => {
            const file = new File([blob], 'gallery-image.png', { type: blob.type });
            handleFile(file);
        });
        setShowGallery(false);
    };

    const triggerUpload = () => {
        fileInputRef.current?.click();
    };

    return (
        <div
            className="flex flex-col lg:flex-row h-full bg-cream-light text-bronze-text font-sans overflow-hidden"
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
        >
            {showGallery && <GalleryPicker onSelect={handleGallerySelect} onClose={() => setShowGallery(false)} />}

            <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
                aria-label={t('printSheet.idPrint.sidebar.addPhoto')}
            />

            {/* Drag Overlay */}
            {isDragging && (
                <div className="absolute inset-0 bg-primary/10 backdrop-blur-sm z-50 flex items-center justify-center border-4 border-primary border-dashed m-4 rounded-3xl pointer-events-none">
                    <div className="bg-white p-8 rounded-full shadow-2xl flex flex-col items-center animate-bounce">
                        <Upload size={48} className="text-primary mb-2" />
                        <span className="text-bronze font-bold text-xl">{t('printSheet.idPrint.workspace.dropHere')}</span>
                    </div>
                </div>
            )}

            {/* Sidebar / Control Panel */}
            <aside className="w-full lg:w-96 bg-white border-r border-cream-dark flex flex-col lg:h-full max-h-[45vh] lg:max-h-none z-10 shadow-sm flex-shrink-0 overflow-hidden">
                <div className="p-4 border-b border-cream-dark/30">
                    <div className="flex items-center gap-2 text-bronze font-bold text-lg mb-1">
                        <Layout size={24} />
                        <span>{t('printSheet.idPrint.sidebar.title')}</span>
                    </div>
                    <p className="text-xs text-bronze-text/60">{t('printSheet.idPrint.sidebar.subtitle')}</p>
                </div>

                <div className="flex-1 overflow-y-auto flex flex-col">

                    {/* Section 1: Asset List */}
                    <div className="p-4 space-y-4 flex-1">
                        <div className="flex items-center justify-between">
                            <h3 className="text-xs font-bold uppercase text-bronze-text/60">{t('printSheet.idPrint.sidebar.photosSection')}</h3>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setShowGallery(true)}
                                    className="text-xs bg-primary/10 text-primary px-2.5 py-1.5 rounded-lg font-bold hover:bg-primary/20 flex items-center gap-1.5 transition-colors"
                                    aria-label={t('printSheet.idPrint.sidebar.fromGallery')}
                                    title={t('printSheet.idPrint.sidebar.fromGallery')}
                                >
                                    <FolderHeart size={14} />
                                </button>
                                <button
                                    onClick={triggerUpload}
                                    className="text-xs bg-primary/10 text-primary px-3 py-1.5 rounded-lg font-bold hover:bg-primary/20 flex items-center gap-1.5 transition-colors"
                                    aria-label={t('printSheet.idPrint.sidebar.addPhoto')}
                                >
                                    <Plus size={14} /> {t('printSheet.idPrint.sidebar.addPhoto')}
                                </button>
                            </div>
                        </div>

                        <div className="space-y-3">
                            {assets.length === 0 ? (
                                <button
                                    onClick={triggerUpload}
                                    className="w-full border-2 border-dashed border-cream-dark/40 rounded-xl p-6 text-center text-bronze-text/50 hover:border-primary/50 hover:text-primary hover:bg-primary/5 cursor-pointer transition-all"
                                >
                                    <Upload size={24} className="mx-auto mb-2" />
                                    <p className="text-sm font-medium">{t('printSheet.idPrint.sidebar.emptyPhotos')}</p>
                                </button>
                            ) : (
                                assets.map(asset => (
                                    <div key={asset.id} className="bg-cream-light/50 border border-cream-dark/30 rounded-lg p-3 shadow-sm flex gap-3 group hover:border-primary/30 hover:bg-white transition-all">
                                        {/* Thumb */}
                                        <div className="w-16 h-20 bg-white rounded overflow-hidden flex-shrink-0 border border-cream-dark/20 relative shadow-sm">
                                            <img src={asset.croppedUrl} className="w-full h-full object-contain" alt={`Photo ${asset.id}`} />
                                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors" />
                                        </div>

                                        {/* Controls */}
                                        <div className="flex-1 flex flex-col justify-between py-0.5">
                                            <div className="flex justify-between items-start">
                                                <div className="text-xs text-bronze-text/40 font-mono truncate w-24">#{asset.id.slice(-4)}</div>
                                                <div className="flex gap-1">
                                                    <button
                                                        onClick={() => editAsset(asset)}
                                                        className="p-1.5 text-bronze-text/40 hover:text-primary hover:bg-primary/10 rounded transition-colors"
                                                        title={t('printSheet.idPrint.photoCard.recrop')}
                                                        aria-label={t('printSheet.idPrint.photoCard.recrop')}
                                                    >
                                                        <Edit2 size={14} />
                                                    </button>
                                                    <button
                                                        onClick={() => duplicateAsset(asset)}
                                                        className="p-1.5 text-bronze-text/40 hover:text-primary hover:bg-primary/10 rounded transition-colors"
                                                        title={t('printSheet.idPrint.photoCard.duplicate')}
                                                        aria-label={t('printSheet.idPrint.photoCard.duplicate')}
                                                    >
                                                        <Copy size={14} />
                                                    </button>
                                                    <button
                                                        onClick={() => deleteAsset(asset.id)}
                                                        className="p-1.5 text-bronze-text/40 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                                        title={t('printSheet.idPrint.photoCard.delete')}
                                                        aria-label={t('printSheet.idPrint.photoCard.delete')}
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            </div>

                                            <div className="flex items-center justify-between mt-2">
                                                <div className="flex items-center border border-cream-dark/30 rounded-md bg-white shadow-sm">
                                                    <button
                                                        onClick={() => updateAssetQuantity(asset.id, -1)}
                                                        className="px-2 py-1 text-bronze-text/60 hover:bg-cream-light rounded-l-md hover:text-bronze font-bold transition-colors"
                                                        aria-label="Decrease quantity"
                                                    >-</button>
                                                    <input
                                                        className="w-8 text-center bg-transparent text-sm font-bold text-bronze-text outline-none"
                                                        value={asset.quantity}
                                                        readOnly
                                                        aria-label="Quantity"
                                                    />
                                                    <button
                                                        onClick={() => updateAssetQuantity(asset.id, 1)}
                                                        className="px-2 py-1 text-bronze-text/60 hover:bg-cream-light rounded-r-md hover:text-bronze font-bold transition-colors"
                                                        aria-label="Increase quantity"
                                                    >+</button>
                                                </div>
                                                <button
                                                    onClick={() => fillPageWith(asset.id)}
                                                    className="text-[10px] font-bold text-primary hover:underline flex items-center gap-1"
                                                >
                                                    <Grid size={12} /> {t('printSheet.idPrint.sidebar.fillPage')}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Section 2: Global Config */}
                    <div className="p-4 bg-cream-light/50 border-t border-cream-dark/30 space-y-4">
                        <h3 className="text-xs font-bold uppercase text-bronze-text/60">{t('printSheet.idPrint.sidebar.settingsSection')}</h3>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-xs text-bronze-text/70 block mb-1.5 font-medium">
                                    {t('printSheet.idPrint.settings.photoSize')}
                                </label>
                                <select
                                    value={config.photoSize}
                                    onChange={(e) => updateConfig('photoSize', e.target.value as PhotoSize)}
                                    className="w-full bg-white border border-cream-dark/30 text-bronze-text py-2 px-2 rounded-md text-xs focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none shadow-sm"
                                    aria-label={t('printSheet.idPrint.settings.photoSize')}
                                >
                                    {Object.entries(PHOTO_DIMENSIONS_MM).map(([key, spec]) => (
                                        <option key={key} value={key}>{spec.label.split('(')[0]}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="text-xs text-bronze-text/70 block mb-1.5 font-medium">
                                    {t('printSheet.idPrint.settings.paperSize')}
                                </label>
                                <select
                                    value={config.paperSize}
                                    onChange={(e) => updateConfig('paperSize', e.target.value as PaperSize)}
                                    className="w-full bg-white border border-cream-dark/30 text-bronze-text py-2 px-2 rounded-md text-xs focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none shadow-sm"
                                    aria-label={t('printSheet.idPrint.settings.paperSize')}
                                >
                                    {Object.entries(PAPER_DIMENSIONS).map(([key, spec]) => (
                                        <option key={key} value={key}>{spec.label.split('(')[0]}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="text-xs text-bronze-text/70 block mb-1.5 font-medium">
                                {t('printSheet.idPrint.settings.paperOrientation')}
                            </label>
                            <select
                                value={config.paperOrientation}
                                onChange={(e) => updateConfig('paperOrientation', e.target.value as 'portrait' | 'landscape')}
                                className="w-full bg-white border border-cream-dark/30 text-bronze-text py-2 px-2 rounded-md text-xs focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none shadow-sm"
                                aria-label={t('printSheet.idPrint.settings.paperOrientation')}
                            >
                                <option value="portrait">{t('printSheet.idPrint.settings.portrait')}</option>
                                <option value="landscape">{t('printSheet.idPrint.settings.landscape')}</option>
                            </select>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-xs text-bronze-text/70 block mb-1.5 font-medium">
                                    {t('printSheet.idPrint.settings.margin')}
                                </label>
                                <input
                                    type="number"
                                    value={config.marginMm}
                                    onChange={(e) => updateConfig('marginMm', Number(e.target.value))}
                                    className="w-full border-cream-dark/30 rounded-md text-xs p-2 border bg-white shadow-sm focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none"
                                    aria-label={t('printSheet.idPrint.settings.margin')}
                                />
                            </div>
                            <div>
                                <label className="text-xs text-bronze-text/70 block mb-1.5 font-medium">
                                    {t('printSheet.idPrint.settings.gap')}
                                </label>
                                <input
                                    type="number"
                                    value={config.gapMm}
                                    onChange={(e) => updateConfig('gapMm', Number(e.target.value))}
                                    className="w-full border-cream-dark/30 rounded-md text-xs p-2 border bg-white shadow-sm focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none"
                                    aria-label={t('printSheet.idPrint.settings.gap')}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="text-xs text-bronze-text/70 block mb-1.5 font-medium">
                                {t('printSheet.idPrint.settings.outputFormat')}
                            </label>
                            <select
                                value={config.outputFormat}
                                onChange={(e) => updateConfig('outputFormat', e.target.value as 'image/png' | 'image/jpeg' | 'application/pdf')}
                                className="w-full bg-white border border-cream-dark/30 text-bronze-text py-2 px-2 rounded-md text-xs focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none shadow-sm"
                                aria-label={t('printSheet.idPrint.settings.outputFormat')}
                            >
                                <option value="image/png">PNG</option>
                                <option value="image/jpeg">JPEG</option>
                                <option value="application/pdf">PDF</option>
                            </select>
                        </div>

                        <div className="flex gap-4 pt-1">
                            <label className="flex items-center gap-2 cursor-pointer text-sm">
                                <input
                                    type="checkbox"
                                    checked={config.showCutLines}
                                    onChange={(e) => updateConfig('showCutLines', e.target.checked)}
                                    className="text-primary rounded focus:ring-primary focus:ring-2"
                                />
                                <span className="text-xs text-bronze-text/80">{t('printSheet.idPrint.settings.showCutLines')}</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer text-sm">
                                <input
                                    type="checkbox"
                                    checked={config.enableMirror}
                                    onChange={(e) => updateConfig('enableMirror', e.target.checked)}
                                    className="text-primary rounded focus:ring-primary focus:ring-2"
                                />
                                <span className="text-xs text-bronze-text/80">{t('printSheet.idPrint.settings.enableMirror')}</span>
                            </label>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main Content / Workspace */}
            <main className="flex-1 bg-slate-50 relative overflow-hidden flex flex-col">
                {/* State: Cropping */}
                {cropSession ? (
                    <div className="flex-1 p-2 md:p-8 flex flex-col h-full bg-slate-50">
                        <header className="flex justify-between items-center mb-2 md:mb-4 flex-shrink-0">
                            <div>
                                <h2 className="text-lg md:text-2xl font-bold text-bronze">
                                    {t('printSheet.idPrint.workspace.cropTitle')}
                                </h2>
                                <p className="text-bronze-text/60 text-xs md:text-sm hidden sm:block">{t('printSheet.idPrint.workspace.cropSubtitle')}: {PHOTO_DIMENSIONS_MM[config.photoSize].label}</p>
                            </div>
                        </header>
                        <div className="flex-1 min-h-0 bg-white rounded-xl shadow-lg border border-cream-dark/20 overflow-hidden relative">
                            <PhotoCropper
                                imageSrc={cropSession.sourceUrl}
                                targetSize={config.photoSize}
                                onCancel={() => setCropSession(null)}
                                onComplete={handleCropComplete}
                            />
                        </div>
                    </div>
                ) : (
                    // State: Preview / Empty
                    <div className="flex-1 flex flex-col h-full">
                        {assets.length === 0 ? (
                            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center" onClick={triggerUpload}>
                                <div className="w-full max-w-lg border-4 border-dashed border-cream-dark/30 rounded-3xl flex flex-col items-center justify-center p-12 bg-white/50 hover:bg-white/80 hover:border-primary/40 cursor-pointer group transition-all">
                                    <div className="w-20 h-20 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                        <Upload size={40} />
                                    </div>
                                    <h2 className="text-2xl font-bold text-bronze">{t('printSheet.idPrint.workspace.emptyTitle')}</h2>
                                    <p className="text-bronze-text/60 mt-2">{t('printSheet.idPrint.workspace.emptyDescription')}</p>
                                </div>
                            </div>
                        ) : (
                            <div className="flex-1 p-2 md:p-8 flex flex-col min-h-[50vh] lg:min-h-0">
                                <header className="flex justify-between items-center mb-2 md:mb-4 flex-shrink-0">
                                    <div>
                                        <h2 className="text-lg md:text-2xl font-bold text-bronze">{t('printSheet.idPrint.workspace.previewTitle')}</h2>
                                        <p className="text-bronze-text/60 text-xs md:text-sm">
                                            {PAPER_DIMENSIONS[config.paperSize].label} • 300 DPI
                                        </p>
                                    </div>
                                </header>
                                <div className="flex-1 min-h-0 bg-slate-100/50 rounded-lg md:rounded-xl border border-cream-dark/20 flex flex-col relative overflow-hidden shadow-sm">
                                    <div className="absolute inset-0 overflow-auto p-2 md:p-4 flex items-center justify-center">
                                        <LayoutPreview assets={assets} config={config} />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </main>
        </div>
    );
}

export default IDPrintStudioTab;

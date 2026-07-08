import React, { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FolderOpen, Info, Upload } from 'lucide-react';
import { GalleryPicker } from '../../components/GalleryPicker';
import { useToast } from '../../components/shared/ToastProvider';
import { SIZE_PRESETS, type PreflightSettings } from './core';
import { usePreflight } from './hooks/usePreflight';
import { SettingsPanel } from './components/SettingsPanel';
import { PreviewPanel } from './components/PreviewPanel';
import { ResultsPanel } from './components/ResultsPanel';

const DEFAULT_PRESET = SIZE_PRESETS.find(p => p.id === 'a3') ?? SIZE_PRESETS[0];

const DEFAULT_SETTINGS: PreflightSettings = {
    targetWidthMm: DEFAULT_PRESET.widthMm,
    targetHeightMm: DEFAULT_PRESET.heightMm,
    bleedMm: 3,
    viewingDistance: DEFAULT_PRESET.viewingDistance,
    hasFineDetail: false,
};

const PrintPreflightApp: React.FC = () => {
    const { t } = useTranslation();
    const { showToast } = useToast();
    const [settings, setSettings] = useState<PreflightSettings>(DEFAULT_SETTINGS);
    const [presetId, setPresetId] = useState(DEFAULT_PRESET.id);
    const [showGalleryPicker, setShowGalleryPicker] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const { image, report, loading, analyzing, error, loadImage } = usePreflight(settings);

    React.useEffect(() => {
        if (error === 'load') showToast(t('printPreflight.errors.loadFailed'), 'error');
    }, [error, showToast, t]);

    const handleFile = (file: File) => {
        void loadImage(file, file.name);
    };

    const handleGallerySelect = (blobs: Blob[]) => {
        setShowGalleryPicker(false);
        if (blobs[0]) void loadImage(blobs[0], t('printPreflight.upload.galleryImageName'));
    };

    return (
        <div className="container mx-auto px-4 max-w-[1920px] space-y-5">
            {/* Disclaimer */}
            <div className="flex items-start gap-3 bg-cream border border-cream-dark rounded-2xl px-4 py-3">
                <Info size={18} className="text-primary shrink-0 mt-0.5" />
                <p className="text-sm text-bronze-text/80 leading-relaxed">{t('printPreflight.disclaimer')}</p>
            </div>

            {/* Upload bar */}
            <div className="flex flex-wrap items-center justify-between gap-4 bg-cream border border-cream-dark rounded-2xl px-5 py-4">
                <div>
                    <h2 className="text-base font-black text-bronze-text">{t('printPreflight.upload.title')}</h2>
                    <p className="text-xs text-bronze-text/60 mt-0.5">{t('printPreflight.upload.hint')}</p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setShowGalleryPicker(true)}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-cream-dark bg-white text-bronze-text text-sm font-bold hover:text-primary hover:border-primary/40 transition-colors"
                    >
                        <FolderOpen size={16} /> {t('printPreflight.upload.fromGallery')}
                    </button>
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-white text-sm font-bold hover:bg-primary-hover transition-colors"
                    >
                        <Upload size={16} /> {t('printPreflight.upload.select')}
                    </button>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        className="hidden"
                        onChange={e => {
                            const file = e.target.files?.[0];
                            if (file) handleFile(file);
                            e.target.value = '';
                        }}
                    />
                </div>
            </div>

            {/* Main grid */}
            <div className="grid grid-cols-1 lg:grid-cols-[280px_minmax(0,1fr)_340px] gap-5 items-start">
                <SettingsPanel
                    settings={settings}
                    presetId={presetId}
                    onChange={(next, id) => { setSettings(next); setPresetId(id); }}
                />
                <PreviewPanel
                    image={image}
                    report={report}
                    settings={settings}
                    loading={loading}
                    onDropFile={handleFile}
                />
                <ResultsPanel image={image} report={report} analyzing={analyzing || loading} />
            </div>

            {showGalleryPicker && (
                <GalleryPicker
                    onSelect={handleGallerySelect}
                    onClose={() => setShowGalleryPicker(false)}
                />
            )}
        </div>
    );
};

export default PrintPreflightApp;

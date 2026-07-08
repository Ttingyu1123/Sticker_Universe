import React, { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ImageIcon } from 'lucide-react';
import { MM_PER_INCH, VIEWING_DISTANCES, type PreflightReport, type PreflightSettings } from '../core';
import type { LoadedImage } from '../hooks/usePreflight';

interface PreviewPanelProps {
    image: LoadedImage | null;
    report: PreflightReport | null;
    settings: PreflightSettings;
    loading: boolean;
    onDropFile: (file: File) => void;
}

const CHECKERBOARD: React.CSSProperties = {
    backgroundImage:
        'linear-gradient(45deg, #d8d7ce 25%, transparent 25%, transparent 75%, #d8d7ce 75%), linear-gradient(45deg, #d8d7ce 25%, transparent 25%, transparent 75%, #d8d7ce 75%)',
    backgroundSize: '20px 20px',
    backgroundPosition: '0 0, 10px 10px',
    backgroundColor: '#f8f7ee',
};

const InfoItem = ({ label, value }: { label: string; value: string }) => (
    <div className="min-w-0">
        <p className="text-[11px] font-bold text-bronze-text/60">{label}</p>
        <p className="text-sm font-bold text-bronze-text truncate">{value}</p>
    </div>
);

/**
 * Simulates physical print size on screen: CSS defines 1in = 96px, so an
 * image laid out at (print inches × 96) CSS px approximates its real-world
 * printed size at 100% browser zoom. Scroll or drag to inspect regions.
 */
const PrintSizeSimulation = ({ image, settings }: { image: LoadedImage; settings: PreflightSettings }) => {
    const { t } = useTranslation();
    const scrollRef = useRef<HTMLDivElement>(null);
    const dragRef = useRef<{ x: number; y: number; left: number; top: number } | null>(null);
    const [dragging, setDragging] = useState(false);

    const printWidthPx = ((settings.targetWidthMm + settings.bleedMm * 2) / MM_PER_INCH) * 96;
    const printHeightPx = ((settings.targetHeightMm + settings.bleedMm * 2) / MM_PER_INCH) * 96;

    const onPointerDown = (e: React.PointerEvent) => {
        const el = scrollRef.current;
        if (!el) return;
        dragRef.current = { x: e.clientX, y: e.clientY, left: el.scrollLeft, top: el.scrollTop };
        setDragging(true);
        (e.target as HTMLElement).setPointerCapture(e.pointerId);
    };
    const onPointerMove = (e: React.PointerEvent) => {
        const el = scrollRef.current;
        const start = dragRef.current;
        if (!el || !start) return;
        el.scrollLeft = start.left - (e.clientX - start.x);
        el.scrollTop = start.top - (e.clientY - start.y);
    };
    const endDrag = () => {
        dragRef.current = null;
        setDragging(false);
    };

    return (
        <div>
            <div className="flex items-baseline justify-between mb-2">
                <h3 className="text-sm font-black text-bronze-text">{t('printPreflight.preview.simTitle')}</h3>
                <p className="text-[11px] text-bronze-text/60">{t('printPreflight.preview.simHint')}</p>
            </div>
            <div
                ref={scrollRef}
                className={`h-72 overflow-auto rounded-2xl border border-cream-dark select-none ${dragging ? 'cursor-grabbing' : 'cursor-grab'}`}
                style={CHECKERBOARD}
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={endDrag}
                onPointerCancel={endDrag}
            >
                <img
                    src={image.objectUrl}
                    alt=""
                    draggable={false}
                    style={{ width: printWidthPx, height: printHeightPx, maxWidth: 'none' }}
                />
            </div>
        </div>
    );
};

export const PreviewPanel: React.FC<PreviewPanelProps> = ({ image, report, settings, loading, onDropFile }) => {
    const { t } = useTranslation();
    const [dragOver, setDragOver] = useState(false);

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(false);
        const file = e.dataTransfer.files?.[0];
        if (file && file.type.startsWith('image/')) onDropFile(file);
    };

    const distanceLabel = VIEWING_DISTANCES.find(v => v.id === settings.viewingDistance);
    const fileSizeMb = image ? (image.fileSizeBytes / 1024 / 1024).toFixed(2) : '';

    return (
        <div className="bg-cream rounded-3xl border border-cream-dark p-5 space-y-5">
            <div
                className={`rounded-2xl border-2 border-dashed transition-colors ${dragOver ? 'border-primary bg-primary/5' : 'border-cream-dark'}`}
                style={image ? undefined : CHECKERBOARD}
                onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
            >
                {image ? (
                    <div className="flex items-center justify-center p-4" style={CHECKERBOARD}>
                        <img
                            src={image.objectUrl}
                            alt={image.fileName}
                            className="max-h-80 max-w-full object-contain rounded-lg shadow-md"
                        />
                    </div>
                ) : (
                    <div className="h-80 flex flex-col items-center justify-center gap-3 text-bronze-text/60">
                        <ImageIcon size={40} strokeWidth={1.5} />
                        <p className="text-sm font-bold text-center px-6">
                            {loading ? t('printPreflight.status.analyzing') : t('printPreflight.preview.empty')}
                        </p>
                    </div>
                )}
            </div>

            {image && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-white rounded-2xl border border-cream-dark p-4">
                    <InfoItem
                        label={t('printPreflight.info.sourceSize')}
                        value={`${image.width} x ${image.height} px`}
                    />
                    <InfoItem
                        label={t('printPreflight.info.targetOutput')}
                        value={`${settings.targetWidthMm} x ${settings.targetHeightMm} mm`}
                    />
                    <InfoItem
                        label={t('printPreflight.info.effectiveDpi')}
                        value={report ? `${report.dpi.effectiveDpi} DPI` : '--'}
                    />
                    <InfoItem
                        label={t('printPreflight.info.usage')}
                        value={distanceLabel ? `${t(distanceLabel.labelKey)}・${fileSizeMb} MB` : `${fileSizeMb} MB`}
                    />
                </div>
            )}

            {image && <PrintSizeSimulation image={image} settings={settings} />}
        </div>
    );
};

import { useEffect, useMemo, useRef, useState } from 'react';
import { saveAs } from 'file-saver';
import { CheckCircle2, Download, Image, MoveVertical, Play, TriangleAlert, ZoomIn } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { AnimatedStickerResult } from '../types';
import { encodeStaticPng } from '../utils/apng';
import { formatFileSize, resizeRgbaFrameWithZoom } from '../utils/frameProcessing';

const TAB_WIDTH = 96;
const TAB_HEIGHT = 74;

interface TabImageMakerProps {
    results: AnimatedStickerResult[];
}

export const TabImageMaker = ({ results }: TabImageMakerProps) => {
    const { t } = useTranslation();
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [selectedIndex, setSelectedIndex] = useState(results[0]?.index ?? 0);
    const [cropPosition, setCropPosition] = useState(0.5);
    const [imageScale, setImageScale] = useState(1);
    const [downloadedSize, setDownloadedSize] = useState<number | null>(null);
    const [error, setError] = useState('');
    const selectedResult = useMemo(
        () => results.find((result) => result.index === selectedIndex) ?? results[0],
        [results, selectedIndex],
    );
    const previewFrame = useMemo(() => {
        const firstFrame = selectedResult?.sourceFrames[0];
        if (!selectedResult || !firstFrame) return null;
        return resizeRgbaFrameWithZoom(
            firstFrame,
            selectedResult.width,
            selectedResult.height,
            TAB_WIDTH,
            TAB_HEIGHT,
            cropPosition,
            imageScale,
        );
    }, [selectedResult, cropPosition, imageScale]);

    useEffect(() => {
        if (results.length > 0 && !results.some((result) => result.index === selectedIndex)) {
            setSelectedIndex(results[0].index);
        }
    }, [results, selectedIndex]);

    useEffect(() => {
        setDownloadedSize(null);
        setError('');
    }, [selectedResult, cropPosition, imageScale]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas || !previewFrame) return;
        const context = canvas.getContext('2d');
        if (!context) return;
        const image = context.createImageData(TAB_WIDTH, TAB_HEIGHT);
        image.data.set(previewFrame);
        context.putImageData(image, 0, 0);
    }, [previewFrame]);

    if (!selectedResult || !previewFrame) return null;

    const handleDownload = () => {
        setError('');
        try {
            const encoded = encodeStaticPng(previewFrame, TAB_WIDTH, TAB_HEIGHT);
            const blob = new Blob([encoded], { type: 'image/png' });
            setDownloadedSize(blob.size);
            saveAs(blob, 'tab.png');
        } catch (reason) {
            setError(reason instanceof Error ? reason.message : String(reason));
        }
    };

    return (
        <section className="mt-4 overflow-hidden rounded-3xl border border-cream-dark bg-cream-light">
            <div className="flex flex-wrap items-start justify-between gap-4 border-b border-cream-dark bg-cream px-5 py-5 md:px-6">
                <div>
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-primary">
                        {t('animatedSticker.tabMakerEyebrow')}
                    </p>
                    <h4 className="mt-1 text-xl font-black text-bronze-text">
                        {t('animatedSticker.tabMakerTitle')}
                    </h4>
                    <p className="mt-2 max-w-2xl text-sm leading-6 text-bronze-light">
                        {t('animatedSticker.tabMakerHint')}
                    </p>
                </div>
                <div className="rounded-xl border border-secondary-hover/60 bg-secondary/40 px-3 py-2 text-sm font-black text-bronze-text">
                    PNG · 96×74
                </div>
            </div>

            <div className="grid gap-6 p-5 md:p-6 lg:grid-cols-[minmax(0,1fr)_320px]">
                <div>
                    <p className="mb-3 text-sm font-black text-bronze-text">
                        {t('animatedSticker.tabMakerSelect')}
                    </p>
                    <div className="grid grid-cols-4 gap-2 sm:grid-cols-8">
                        {results.map((result) => {
                            const selected = result.index === selectedResult.index;
                            return (
                                <button
                                    key={result.index}
                                    type="button"
                                    onClick={() => setSelectedIndex(result.index)}
                                    className={`relative aspect-square overflow-hidden rounded-xl border-2 bg-grid-pattern p-1 transition-all ${selected ? 'border-primary shadow-md shadow-primary/15' : 'border-cream-dark opacity-70 hover:border-primary/40 hover:opacity-100'}`}
                                    aria-label={t('animatedSticker.tabMakerSelectNumber', { number: result.index + 1 })}
                                    aria-pressed={selected}
                                >
                                    <img src={result.url} alt="" className="h-full w-full object-contain" />
                                    <span className={`absolute left-1 top-1 rounded-md px-1.5 py-0.5 text-xs font-black ${selected ? 'bg-primary text-white' : 'bg-bronze-text/80 text-white'}`}>
                                        {String(result.index + 1).padStart(2, '0')}
                                    </span>
                                </button>
                            );
                        })}
                    </div>

                    <div className="mt-5 grid gap-3 md:grid-cols-2">
                        <div className="rounded-2xl border border-cream-dark bg-cream p-4">
                            <div className="mb-3 flex items-center justify-between gap-3">
                                <label htmlFor="tab-image-position" className="flex items-center gap-2 text-sm font-black text-bronze-text">
                                    <MoveVertical size={17} /> {t('animatedSticker.tabMakerPosition')}
                                </label>
                                <span className="rounded-lg bg-white px-2.5 py-1 text-xs font-black text-primary shadow-sm">
                                    {Math.round(cropPosition * 100)}%
                                </span>
                            </div>
                            <input
                                id="tab-image-position"
                                type="range"
                                min={0}
                                max={100}
                                value={Math.round(cropPosition * 100)}
                                onChange={(event) => setCropPosition(Number(event.target.value) / 100)}
                                className="w-full accent-primary"
                            />
                            <div className="mt-2 flex justify-between text-xs font-bold text-bronze-light">
                                <span>{t('animatedSticker.tabMakerTop')}</span>
                                <span>{t('animatedSticker.tabMakerCenter')}</span>
                                <span>{t('animatedSticker.tabMakerBottom')}</span>
                            </div>
                        </div>

                        <div className="rounded-2xl border border-secondary-hover/60 bg-secondary/25 p-4">
                            <div className="mb-3 flex items-center justify-between gap-3">
                                <label htmlFor="tab-image-scale" className="flex items-center gap-2 text-sm font-black text-bronze-text">
                                    <ZoomIn size={17} /> {t('animatedSticker.tabMakerScale')}
                                </label>
                                <span className="rounded-lg bg-white px-2.5 py-1 text-xs font-black text-primary shadow-sm">
                                    {Math.round(imageScale * 100)}%
                                </span>
                            </div>
                            <input
                                id="tab-image-scale"
                                type="range"
                                min={50}
                                max={180}
                                step={5}
                                value={Math.round(imageScale * 100)}
                                onChange={(event) => setImageScale(Number(event.target.value) / 100)}
                                className="w-full accent-primary"
                            />
                            <div className="mt-2 flex justify-between text-xs font-bold text-bronze-light">
                                <span>{t('animatedSticker.tabMakerSmaller')}</span>
                                <span>100%</span>
                                <span>{t('animatedSticker.tabMakerLarger')}</span>
                            </div>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={handleDownload}
                        className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-bronze-text px-5 py-4 text-base font-black text-white shadow-lg shadow-bronze-text/15 transition-all hover:-translate-y-0.5 hover:bg-bronze-light"
                    >
                        <Download size={19} /> {t('animatedSticker.tabMakerDownload')}
                    </button>

                    {error && (
                        <p className="mt-3 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-bold text-red-700">
                            <TriangleAlert size={17} className="mt-0.5 shrink-0" />
                            {t('animatedSticker.tabMakerError', { reason: error })}
                        </p>
                    )}
                </div>

                <div>
                    <p className="mb-3 flex items-center gap-2 text-sm font-black text-bronze-text">
                        <Image size={17} /> {t('animatedSticker.tabMakerPreview')}
                    </p>
                    <div className="relative mx-auto aspect-[48/37] w-full max-w-72 overflow-hidden rounded-2xl border-4 border-bronze-text bg-grid-pattern shadow-xl shadow-bronze-text/10">
                        <canvas
                            ref={canvasRef}
                            width={TAB_WIDTH}
                            height={TAB_HEIGHT}
                            className="h-full w-full"
                            aria-label={t('animatedSticker.tabMakerPreviewAlt')}
                        />
                        <div className="pointer-events-none absolute right-2 top-2 grid h-9 w-9 place-items-center rounded-full border border-white/70 bg-bronze-text/75 text-white shadow-md backdrop-blur-sm">
                            <Play size={14} fill="currentColor" />
                        </div>
                        <span className="absolute bottom-2 right-2 rounded-lg bg-bronze-text/85 px-2 py-1 text-xs font-black text-white backdrop-blur-sm">
                            96×74
                        </span>
                    </div>
                    <p className="mt-3 rounded-xl border border-secondary-hover/60 bg-secondary/30 px-3 py-2 text-xs font-bold leading-5 text-bronze-light">
                        {t('animatedSticker.tabMakerPlayHint')}
                    </p>

                    {downloadedSize !== null && (
                        <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-3">
                            <p className="flex items-center gap-2 text-sm font-black text-emerald-700">
                                <CheckCircle2 size={17} /> {t('animatedSticker.tabMakerReady')}
                            </p>
                            <p className="mt-1 text-xs font-bold text-bronze-light">
                                tab.png · {formatFileSize(downloadedSize)} · 96×74
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
};

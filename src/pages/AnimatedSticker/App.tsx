import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useSearchParams } from 'react-router-dom';
import { saveAs } from 'file-saver';
import JSZip from 'jszip';
import {
    ArrowRight,
    BadgeInfo,
    Check,
    Download,
    FileVideo2,
    Film,
    Gauge,
    Grid3X3,
    LoaderCircle,
    Minimize2,
    Package,
    Play,
    Scissors,
    ShieldCheck,
    Sparkles,
    Upload,
    WandSparkles,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useToast } from '../../components/shared/ToastProvider';
import { getAiVideoJob } from '../../db';
import {
    loadStickerBackgroundColor,
    saveStickerBackgroundColor,
} from '../../features/sprite-sheet-generator/backgroundColor';
import { StickerResultCard } from './components/StickerResultCard';
import { MainImageMaker } from './components/MainImageMaker';
import { TabImageMaker } from './components/TabImageMaker';
import { VideoBoardPreview } from './components/VideoBoardPreview';
import type {
    AnimatedStickerResult,
    ProcessingProgress,
    ProcessingSettings,
    VideoMetadata,
} from './types';
import { DEFAULT_GRID_CALIBRATION, MAX_LINE_FILE_SIZE, STICKER_COUNT } from './utils/frameProcessing';
import { compressAnimatedSticker } from './utils/compression';
import { processVideoBoard } from './utils/videoProcessing';

const DEFAULT_SETTINGS: ProcessingSettings = {
    frameCount: 12,
    outputDuration: 2,
    startTime: 0,
    endTime: 0,
    removeBackground: true,
    backgroundColor: '#ffffff',
    colorTolerance: 48,
    stabilize: true,
    gridCalibration: DEFAULT_GRID_CALIBRATION,
};

const createDefaultSettings = (): ProcessingSettings => ({
    ...DEFAULT_SETTINGS,
    backgroundColor: loadStickerBackgroundColor(DEFAULT_SETTINGS.backgroundColor),
    gridCalibration: {
        columnGuides: [...DEFAULT_GRID_CALIBRATION.columnGuides],
        rowGuide: DEFAULT_GRID_CALIBRATION.rowGuide,
    },
});

const formatTime = (seconds: number): string => {
    if (!Number.isFinite(seconds)) return '0:00.0';
    const minutes = Math.floor(seconds / 60);
    const remaining = (seconds % 60).toFixed(1).padStart(4, '0');
    return `${minutes}:${remaining}`;
};

const getProgressPercent = (progress: ProcessingProgress | null): number => {
    if (!progress || progress.total === 0) return 0;
    const ratio = progress.completed / progress.total;
    if (progress.phase === 'extracting') return ratio * 55;
    if (progress.phase === 'stabilizing') return 55 + ratio * 10;
    return 65 + ratio * 35;
};

const AnimatedStickerApp = () => {
    const { t } = useTranslation();
    const { showToast } = useToast();
    const inputRef = useRef<HTMLInputElement>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const resultsRef = useRef<AnimatedStickerResult[]>([]);
    const loadedVideoJobRef = useRef<string | null>(null);
    const [searchParams] = useSearchParams();
    const [videoUrl, setVideoUrl] = useState<string | null>(null);
    const [metadata, setMetadata] = useState<VideoMetadata | null>(null);
    const [settings, setSettings] = useState<ProcessingSettings>(createDefaultSettings);
    const [isDragging, setIsDragging] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isCompressing, setIsCompressing] = useState(false);
    const [compressionProgress, setCompressionProgress] = useState(0);
    const [progress, setProgress] = useState<ProcessingProgress | null>(null);
    const [results, setResults] = useState<AnimatedStickerResult[]>([]);
    const [sourceFileName, setSourceFileName] = useState('');

    useEffect(() => () => {
        if (videoUrl) URL.revokeObjectURL(videoUrl);
    }, [videoUrl]);

    useEffect(() => {
        resultsRef.current = results;
    }, [results]);

    useEffect(() => () => {
        resultsRef.current.forEach((result) => URL.revokeObjectURL(result.url));
    }, []);

    const updateSettings = <Key extends keyof ProcessingSettings>(
        key: Key,
        value: ProcessingSettings[Key],
    ) => {
        if (key === 'backgroundColor' && typeof value === 'string') {
            saveStickerBackgroundColor(value);
        }
        setSettings((current) => ({ ...current, [key]: value }));
    };

    const resetResults = () => {
        setResults((current) => {
            current.forEach((result) => URL.revokeObjectURL(result.url));
            return [];
        });
        setProgress(null);
        setCompressionProgress(0);
    };

    const loadFile = (file: File) => {
        if (isProcessing || isCompressing) return;
        if (file.type !== 'video/mp4' && !file.name.toLowerCase().endsWith('.mp4')) {
            showToast(t('animatedSticker.errors.mp4Only'), 'error');
            return;
        }
        if (file.size > 500 * 1024 * 1024) {
            showToast(t('animatedSticker.errors.fileTooLarge'), 'error');
            return;
        }

        setVideoUrl(URL.createObjectURL(file));
        setSourceFileName(file.name);
        setMetadata(null);
        setSettings(createDefaultSettings());
        resetResults();
    };

    useEffect(() => {
        const videoJobId = searchParams.get('videoJob');
        if (!videoJobId || loadedVideoJobRef.current === videoJobId) return;
        loadedVideoJobRef.current = videoJobId;
        void getAiVideoJob(videoJobId).then((videoJob) => {
            if (!videoJob?.videoBlob) {
                showToast(t('animatedSticker.aiVideoMissing'), 'error');
                return;
            }
            const file = new File(
                [videoJob.videoBlob],
                `ai-video-${videoJob.provider}-${videoJob.id}.mp4`,
                { type: 'video/mp4' },
            );
            loadFile(file);
            showToast(t('animatedSticker.aiVideoLoaded'), 'success');
        }).catch((error) => {
            showToast(t('animatedSticker.aiVideoLoadFailed', {
                reason: error instanceof Error ? error.message : String(error),
            }), 'error');
        });
    }, [searchParams]);

    const handleLoadedMetadata = () => {
        const video = videoRef.current;
        if (!video) return;
        const duration = video.duration;
        setMetadata({
            duration,
            width: video.videoWidth,
            height: video.videoHeight,
            name: sourceFileName,
        });
        setSettings((current) => ({
            ...current,
            startTime: 0,
            endTime: Math.min(duration, 4),
        }));
    };

    const handleProcess = async () => {
        const video = videoRef.current;
        if (!video || !metadata || isCompressing) return;
        video.pause();
        resetResults();
        setIsProcessing(true);
        setProgress({ phase: 'extracting', completed: 0, total: settings.frameCount });

        try {
            const processed = await processVideoBoard({ video, settings, onProgress: setProgress });
            setResults(processed);
            showToast(t('animatedSticker.toast.ready'), 'success');
        } catch (error) {
            const reason = error instanceof Error ? error.message : String(error);
            showToast(t('animatedSticker.errors.processingFailed', { reason }), 'error');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleDownloadOne = (result: AnimatedStickerResult) => {
        saveAs(result.blob, `animated-sticker-${String(result.index + 1).padStart(2, '0')}.png`);
    };

    const handleDownloadZip = async () => {
        if (results.length === 0) return;
        const zip = new JSZip();
        results.forEach((result) => {
            zip.file(`animated-sticker-${String(result.index + 1).padStart(2, '0')}.png`, result.blob);
        });
        const blob = await zip.generateAsync({ type: 'blob' });
        saveAs(blob, `animated-stickers-${Date.now()}.zip`);
    };

    const handleCompressResults = async () => {
        if (results.length === 0 || isCompressing) return;
        setIsCompressing(true);
        setCompressionProgress(0);
        const compressedResults: AnimatedStickerResult[] = [];

        try {
            let completed = 0;
            for (let index = 0; index < results.length; index += 1) {
                if (results[index].sizeBytes < MAX_LINE_FILE_SIZE) {
                    compressedResults.push(results[index]);
                    continue;
                }
                await new Promise<void>((resolve) => window.requestAnimationFrame(() => resolve()));
                compressedResults.push(compressAnimatedSticker(results[index]));
                completed += 1;
                setCompressionProgress(completed);
            }

            setResults((current) => {
                const nextUrls = new Set(compressedResults.map((result) => result.url));
                current.forEach((result) => {
                    if (!nextUrls.has(result.url)) URL.revokeObjectURL(result.url);
                });
                return compressedResults;
            });
            const remaining = compressedResults.filter((result) => result.sizeBytes >= MAX_LINE_FILE_SIZE).length;
            showToast(
                remaining === 0
                    ? t('animatedSticker.toast.compressed')
                    : t('animatedSticker.toast.compressionPartial', { count: remaining }),
                remaining === 0 ? 'success' : 'info',
            );
        } catch (error) {
            const currentUrls = new Set(results.map((result) => result.url));
            compressedResults.forEach((result) => {
                if (!currentUrls.has(result.url)) URL.revokeObjectURL(result.url);
            });
            const reason = error instanceof Error ? error.message : String(error);
            showToast(t('animatedSticker.errors.compressionFailed', { reason }), 'error');
        } finally {
            setIsCompressing(false);
        }
    };

    const overLimitCount = useMemo(
        () => results.filter((result) => result.sizeBytes >= MAX_LINE_FILE_SIZE).length,
        [results],
    );
    const progressPercent = getProgressPercent(progress);
    const phaseLabel = progress ? t(`animatedSticker.progress.${progress.phase}`) : '';

    return (
        <div className="relative min-h-full overflow-hidden bg-background px-4 py-8 md:px-8 lg:px-10">
            <div className="pointer-events-none absolute -right-32 -top-40 h-[34rem] w-[34rem] rounded-full bg-secondary/35 blur-3xl" />
            <div className="pointer-events-none absolute -left-28 top-[42rem] h-80 w-80 rounded-full bg-primary-light/25 blur-3xl" />

            <div className="relative mx-auto max-w-[1500px]">
                <motion.header
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                    className="mb-8 grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end"
                >
                    <div>
                        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/15 bg-white/80 px-3.5 py-2 text-xs font-black uppercase tracking-[0.18em] text-primary shadow-sm">
                            <Sparkles size={15} /> {t('animatedSticker.eyebrow')}
                        </div>
                        <h2 className="max-w-4xl text-3xl font-black leading-[1.08] tracking-[-0.035em] text-bronze-text md:text-5xl">
                            {t('animatedSticker.title')}
                        </h2>
                        <p className="mt-4 max-w-3xl text-base font-medium leading-7 text-bronze-light">
                            {t('animatedSticker.subtitle')}
                        </p>
                    </div>
                    <div className="space-y-3">
                        <Link to="/generator?tab=sprite-sheet" className="flex items-center justify-center gap-2 rounded-xl border border-cream-dark bg-cream px-4 py-3 text-sm font-black text-primary shadow-sm transition-all hover:-translate-y-0.5 hover:bg-white">
                            <WandSparkles size={17} /> {t('animatedSticker.generateBoard')}
                        </Link>
                        <div className="grid grid-cols-3 gap-2 rounded-2xl border border-cream-dark bg-cream-light p-2 shadow-sm">
                            {[
                                [Grid3X3, '4×2', t('animatedSticker.statGrid')],
                                [Film, String(STICKER_COUNT), t('animatedSticker.statOutputs')],
                                [ShieldCheck, 'APNG', t('animatedSticker.statFormat')],
                            ].map(([Icon, value, label]) => {
                                const StatIcon = Icon as typeof Grid3X3;
                                return (
                                    <div key={String(label)} className="min-w-24 rounded-xl px-3 py-2 text-center">
                                        <StatIcon size={16} className="mx-auto mb-1 text-primary" />
                                        <div className="text-base font-black text-bronze-text">{String(value)}</div>
                                        <div className="text-xs font-bold uppercase tracking-wider text-bronze-light">{String(label)}</div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </motion.header>

                <div className="grid gap-6 xl:grid-cols-[minmax(0,1.65fr)_minmax(340px,0.8fr)]">
                    <section className="rounded-[2rem] border border-cream-dark bg-cream p-4 shadow-sm md:p-6">
                        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                            <div>
                                <p className="text-xs font-black uppercase tracking-[0.18em] text-primary">01 · {t('animatedSticker.source')}</p>
                                <h3 className="mt-1 text-2xl font-black text-bronze-text">{t('animatedSticker.sourceTitle')}</h3>
                            </div>
                            {metadata && (
                                <div className="flex flex-wrap gap-2 text-xs font-black text-bronze-light">
                                    <span className="rounded-lg bg-cream-light px-3 py-2">{metadata.width} × {metadata.height}</span>
                                    <span className="rounded-lg bg-cream-light px-3 py-2">{formatTime(metadata.duration)}</span>
                                    <span className="max-w-52 truncate rounded-lg bg-cream-light px-3 py-2">{metadata.name}</span>
                                </div>
                            )}
                        </div>

                        <VideoBoardPreview
                            src={videoUrl}
                            videoRef={videoRef}
                            onLoadedMetadata={handleLoadedMetadata}
                            gridCalibration={settings.gridCalibration}
                            disabled={isProcessing || isCompressing}
                            onCalibrationChange={(gridCalibration) => {
                                updateSettings('gridCalibration', gridCalibration);
                                resetResults();
                            }}
                        />

                        <input
                            ref={inputRef}
                            type="file"
                            accept="video/mp4,.mp4"
                            className="hidden"
                            onChange={(event) => {
                                const file = event.target.files?.[0];
                                if (file) loadFile(file);
                                event.currentTarget.value = '';
                            }}
                        />
                        <button
                            type="button"
                            onClick={() => inputRef.current?.click()}
                            disabled={isProcessing || isCompressing}
                            onDragEnter={(event) => { event.preventDefault(); setIsDragging(true); }}
                            onDragOver={(event) => event.preventDefault()}
                            onDragLeave={() => setIsDragging(false)}
                            onDrop={(event) => {
                                event.preventDefault();
                                setIsDragging(false);
                                const file = event.dataTransfer.files[0];
                                if (file) loadFile(file);
                            }}
                            className={`mt-4 flex w-full items-center justify-center gap-3 rounded-2xl border border-dashed px-5 py-4 text-base font-black transition-all disabled:cursor-not-allowed disabled:opacity-45 ${isDragging ? 'border-primary bg-primary/10 text-primary' : 'border-cream-dark bg-cream-light text-bronze-light hover:border-primary/40 hover:bg-white hover:text-primary'}`}
                        >
                            <Upload size={20} />
                            {videoUrl ? t('animatedSticker.replaceVideo') : t('animatedSticker.uploadVideo')}
                            <span className="hidden text-xs font-bold text-bronze-light/70 sm:inline">MP4 · {t('animatedSticker.localOnly')}</span>
                        </button>
                        <Link to="/ai-video" className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl border border-primary/25 bg-white px-5 py-4 text-base font-black text-primary shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/45 hover:bg-cream-light">
                            <Sparkles size={19} /> {t('animatedSticker.generateVideoWithAi')} <ArrowRight size={16} />
                        </Link>
                    </section>

                    <aside className="rounded-[2rem] border border-cream-dark bg-cream-light p-5 shadow-sm md:p-6">
                        <div className="mb-6">
                            <p className="text-xs font-black uppercase tracking-[0.18em] text-primary">02 · {t('animatedSticker.settings')}</p>
                            <h3 className="mt-1 text-2xl font-black text-bronze-text">{t('animatedSticker.settingsTitle')}</h3>
                        </div>

                        <div className="space-y-6">
                            <div>
                                <div className="mb-2 flex items-center justify-between">
                                    <label className="flex items-center gap-2 text-sm font-black text-bronze-text"><Scissors size={16} /> {t('animatedSticker.sourceRange')}</label>
                                    <span className="text-xs font-black text-primary">{formatTime(settings.startTime)} – {formatTime(settings.endTime)}</span>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <label className="rounded-xl border border-cream-dark bg-cream p-3 text-xs font-bold text-bronze-light">
                                        {t('animatedSticker.startTime')}
                                        <input
                                            type="number"
                                            min={0}
                                            max={Math.max(0, settings.endTime - 0.1)}
                                            step={0.1}
                                            value={settings.startTime}
                                            disabled={!metadata || isProcessing}
                                            onChange={(event) => updateSettings('startTime', Math.max(0, Math.min(Number(event.target.value), settings.endTime - 0.1)))}
                                            className="mt-1 w-full bg-transparent text-base font-black text-bronze-text outline-none"
                                        />
                                    </label>
                                    <label className="rounded-xl border border-cream-dark bg-cream p-3 text-xs font-bold text-bronze-light">
                                        {t('animatedSticker.endTime')}
                                        <input
                                            type="number"
                                            min={settings.startTime + 0.1}
                                            max={metadata?.duration ?? 0}
                                            step={0.1}
                                            value={settings.endTime}
                                            disabled={!metadata || isProcessing}
                                            onChange={(event) => updateSettings('endTime', Math.min(metadata?.duration ?? 0, Math.max(Number(event.target.value), settings.startTime + 0.1)))}
                                            className="mt-1 w-full bg-transparent text-base font-black text-bronze-text outline-none"
                                        />
                                    </label>
                                </div>
                            </div>

                            <div>
                                <div className="mb-2 flex items-center justify-between">
                                    <label htmlFor="frame-count" className="flex items-center gap-2 text-sm font-black text-bronze-text"><Film size={16} /> {t('animatedSticker.frameCount')}</label>
                                    <span className="rounded-md bg-primary/10 px-2 py-1 text-xs font-black text-primary">{settings.frameCount}</span>
                                </div>
                                <input
                                    id="frame-count"
                                    type="range"
                                    min={5}
                                    max={20}
                                    value={settings.frameCount}
                                    disabled={!metadata || isProcessing}
                                    onChange={(event) => updateSettings('frameCount', Number(event.target.value))}
                                    className="w-full accent-primary"
                                />
                                <div className="mt-1 flex justify-between text-xs font-bold text-bronze-light"><span>5</span><span>LINE</span><span>20</span></div>
                            </div>

                            <div>
                                <label className="mb-2 flex items-center gap-2 text-sm font-black text-bronze-text"><Gauge size={16} /> {t('animatedSticker.outputDuration')}</label>
                                <div className="grid grid-cols-4 gap-2 rounded-xl border border-cream-dark bg-cream p-1.5">
                                    {([1, 2, 3, 4] as const).map((duration) => (
                                        <button
                                            type="button"
                                            key={duration}
                                            disabled={!metadata || isProcessing}
                                            onClick={() => updateSettings('outputDuration', duration)}
                                            className={`rounded-lg py-2.5 text-sm font-black transition-all ${settings.outputDuration === duration ? 'bg-white text-primary shadow-sm' : 'text-bronze-light hover:text-bronze-text'}`}
                                        >
                                            {duration}s
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="rounded-2xl border border-secondary-hover/60 bg-cream p-4">
                                <label className="flex cursor-pointer items-start justify-between gap-3">
                                    <span>
                                        <span className="flex items-center gap-2 text-sm font-black text-bronze-text"><WandSparkles size={16} /> {t('animatedSticker.removeBackground')}</span>
                                        <span className="mt-1 block text-xs leading-5 text-bronze-light">{t('animatedSticker.removeBackgroundHint')}</span>
                                    </span>
                                    <input
                                        type="checkbox"
                                        checked={settings.removeBackground}
                                        disabled={!metadata || isProcessing}
                                        onChange={(event) => updateSettings('removeBackground', event.target.checked)}
                                        className="mt-0.5 h-5 w-5 accent-primary"
                                    />
                                </label>
                                {settings.removeBackground && (
                                    <div className="mt-4 grid grid-cols-[auto_1fr] items-center gap-3 border-t border-secondary-hover/60 pt-4">
                                        <input
                                            type="color"
                                            value={settings.backgroundColor}
                                            disabled={!metadata || isProcessing}
                                            onChange={(event) => updateSettings('backgroundColor', event.target.value)}
                                            className="h-10 w-12 cursor-pointer rounded-lg border-0 bg-transparent"
                                            aria-label={t('animatedSticker.backgroundColor')}
                                        />
                                        <label className="text-xs font-bold text-bronze-light">
                                            {t('animatedSticker.tolerance')} · {settings.colorTolerance}
                                            <input
                                                type="range"
                                                min={8}
                                                max={120}
                                                value={settings.colorTolerance}
                                                disabled={!metadata || isProcessing}
                                                onChange={(event) => updateSettings('colorTolerance', Number(event.target.value))}
                                                className="mt-1 block w-full accent-primary"
                                            />
                                        </label>
                                    </div>
                                )}
                            </div>

                            <label className="flex cursor-pointer items-center justify-between gap-3 rounded-2xl border border-cream-dark bg-cream p-4">
                                <span>
                                    <span className="flex items-center gap-2 text-sm font-black text-bronze-text"><ShieldCheck size={16} /> {t('animatedSticker.stabilize')}</span>
                                    <span className="mt-1 block text-xs leading-5 text-bronze-light">{t('animatedSticker.stabilizeHint')}</span>
                                </span>
                                <input
                                    type="checkbox"
                                    checked={settings.stabilize}
                                    disabled={!metadata || !settings.removeBackground || isProcessing}
                                    onChange={(event) => updateSettings('stabilize', event.target.checked)}
                                    className="h-5 w-5 accent-primary"
                                />
                            </label>
                        </div>

                        <button
                            type="button"
                            onClick={handleProcess}
                            disabled={!metadata || isProcessing || isCompressing}
                            className="mt-7 flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-5 py-4 text-base font-black text-white shadow-xl shadow-primary/20 transition-all hover:-translate-y-0.5 hover:bg-primary-hover disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                            {isProcessing ? <LoaderCircle size={20} className="animate-spin" /> : <Play size={19} fill="currentColor" />}
                            {isProcessing ? phaseLabel : t('animatedSticker.processButton')}
                        </button>

                        {isProcessing && (
                            <div className="mt-4" aria-live="polite">
                                <div className="mb-1.5 flex justify-between text-xs font-black text-bronze-light">
                                    <span>{phaseLabel}</span><span>{Math.round(progressPercent)}%</span>
                                </div>
                                <div className="h-2 overflow-hidden rounded-full bg-cream-dark/70">
                                    <div className="h-full rounded-full bg-gradient-to-r from-primary to-secondary-hover transition-[width] duration-300" style={{ width: `${progressPercent}%` }} />
                                </div>
                                <p className="mt-2 text-xs leading-5 text-bronze-light">{t('animatedSticker.processingLocal')}</p>
                            </div>
                        )}
                    </aside>
                </div>

                <section className="mt-8 rounded-[2rem] border border-cream-dark bg-cream p-5 shadow-sm md:p-7">
                    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
                        <div>
                            <p className="text-xs font-black uppercase tracking-[0.18em] text-primary">03 · {t('animatedSticker.output')}</p>
                            <h3 className="mt-1 text-2xl font-black text-bronze-text">{t('animatedSticker.outputTitle')}</h3>
                            <p className="mt-2 text-sm leading-6 text-bronze-light">
                                {results.length > 0
                                    ? t('animatedSticker.outputSummary', { count: results.length, warnings: overLimitCount })
                                    : t('animatedSticker.outputEmpty')}
                            </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                            {overLimitCount > 0 && (
                                <button
                                    type="button"
                                    onClick={handleCompressResults}
                                    disabled={isProcessing || isCompressing}
                                    className="flex items-center gap-2 rounded-xl border border-secondary-hover bg-secondary/55 px-4 py-3 text-sm font-black text-bronze-text shadow-sm transition-all hover:-translate-y-0.5 hover:bg-secondary disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-45"
                                >
                                    {isCompressing ? <LoaderCircle size={18} className="animate-spin" /> : <Minimize2 size={18} />}
                                    {isCompressing
                                        ? t('animatedSticker.compressing', { current: compressionProgress, total: overLimitCount })
                                        : t('animatedSticker.compressButton', { count: overLimitCount })}
                                </button>
                            )}
                            <button
                                type="button"
                                onClick={handleDownloadZip}
                                disabled={results.length !== STICKER_COUNT || isCompressing}
                                className="flex items-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-black text-white shadow-lg shadow-primary/20 transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-35"
                            >
                                <Package size={18} /> {t('animatedSticker.downloadZip')}
                            </button>
                        </div>
                    </div>

                    <div className="mb-6 flex flex-col gap-4 rounded-2xl border border-secondary-hover/70 bg-secondary/35 p-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-start gap-3">
                            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-primary/15 bg-white text-primary shadow-sm">
                                <BadgeInfo size={19} />
                            </div>
                            <div>
                                <p className="text-sm font-black text-bronze-text">
                                    {t('animatedSticker.submissionReminderTitle')}
                                </p>
                                <p className="mt-1 text-xs font-medium leading-5 text-bronze-light">
                                    {t('animatedSticker.submissionReminderHint')}
                                </p>
                            </div>
                        </div>
                        <div className="grid shrink-0 gap-2 sm:grid-cols-2">
                            <div className="rounded-xl border border-cream-dark bg-cream-light px-3 py-2 text-sm font-black text-bronze-text shadow-sm">
                                {t('animatedSticker.mainImageRequirement')}
                            </div>
                            <div className="rounded-xl border border-cream-dark bg-cream-light px-3 py-2 text-sm font-black text-bronze-text shadow-sm">
                                {t('animatedSticker.tabImageRequirement')}
                            </div>
                        </div>
                    </div>

                    {results.length > 0 ? (
                        <>
                            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
                                {results.map((result) => (
                                    <StickerResultCard key={result.index} result={result} onDownload={handleDownloadOne} />
                                ))}
                            </div>
                            <MainImageMaker results={results} />
                            <TabImageMaker results={results} />
                        </>
                    ) : (
                        <div className="grid min-h-64 place-items-center rounded-3xl border border-dashed border-cream-dark bg-cream-light p-8 text-center">
                            <div>
                                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-primary shadow-sm"><Download size={22} /></div>
                                <p className="mt-4 text-base font-black text-bronze-text">{t('animatedSticker.emptyOutputTitle')}</p>
                                <p className="mt-2 text-sm leading-6 text-bronze-light">{t('animatedSticker.emptyOutputHint')}</p>
                            </div>
                        </div>
                    )}
                </section>

                <div className="mt-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs font-bold text-bronze-light">
                    <span className="flex items-center gap-1.5"><Check size={14} className="text-emerald-600" /> 320 × 270</span>
                    <span className="flex items-center gap-1.5"><Check size={14} className="text-emerald-600" /> 5–20 {t('animatedSticker.frames')}</span>
                    <span className="flex items-center gap-1.5"><Check size={14} className="text-emerald-600" /> 1–4 {t('animatedSticker.seconds')}</span>
                    <span className="flex items-center gap-1.5"><FileVideo2 size={14} /> {t('animatedSticker.browserProcessing')}</span>
                </div>
            </div>
        </div>
    );
};

export default AnimatedStickerApp;

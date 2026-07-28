import { useEffect, useMemo, useState } from 'react';
import { saveAs } from 'file-saver';
import { CheckCircle2, Crop, Download, LoaderCircle, MoveHorizontal, TriangleAlert } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { AnimatedStickerResult } from '../types';
import { encodeAnimatedPng } from '../utils/apng';
import { selectEvenlySpacedFrames } from '../utils/compression';
import {
    formatFileSize,
    MAX_LINE_FILE_SIZE,
    resizeSquareRgbaFrame,
} from '../utils/frameProcessing';

const MAIN_IMAGE_SIZE = 240;

interface MainImageMakerProps {
    results: AnimatedStickerResult[];
}

interface MainImageOutput {
    blob: Blob;
    url: string;
    frameCount: number;
    durationMs: number;
    sizeBytes: number;
}

const getColorCounts = (sourceColorCount: number): number[] => {
    if (sourceColorCount > 0) {
        return [sourceColorCount, 128, 64, 32, 16]
            .filter((value, index, values) => value <= sourceColorCount && values.indexOf(value) === index);
    }
    return [0, 256, 128, 64, 32, 16];
};

export const MainImageMaker = ({ results }: MainImageMakerProps) => {
    const { t } = useTranslation();
    const [selectedIndex, setSelectedIndex] = useState(results[0]?.index ?? 0);
    const [cropPosition, setCropPosition] = useState(0.5);
    const [isGenerating, setIsGenerating] = useState(false);
    const [output, setOutput] = useState<MainImageOutput | null>(null);
    const [error, setError] = useState('');
    const selectedResult = useMemo(
        () => results.find((result) => result.index === selectedIndex) ?? results[0],
        [results, selectedIndex],
    );

    useEffect(() => {
        if (results.length > 0 && !results.some((result) => result.index === selectedIndex)) {
            setSelectedIndex(results[0].index);
        }
    }, [results, selectedIndex]);

    useEffect(() => {
        setOutput(null);
        setError('');
    }, [selectedResult, cropPosition]);

    useEffect(() => () => {
        if (output) URL.revokeObjectURL(output.url);
    }, [output]);

    if (!selectedResult) return null;

    const handleGenerate = async () => {
        if (isGenerating) return;
        setIsGenerating(true);
        setError('');

        try {
            await new Promise<void>((resolve) => window.requestAnimationFrame(() => resolve()));
            const sourceFrames = selectEvenlySpacedFrames(
                selectedResult.sourceFrames,
                selectedResult.frameCount,
            );
            const resizedFrames = sourceFrames.map((frame) => resizeSquareRgbaFrame(
                frame,
                selectedResult.width,
                selectedResult.height,
                MAIN_IMAGE_SIZE,
                cropPosition,
            ));
            let chosenBlob: Blob | null = null;

            for (const colorCount of getColorCounts(selectedResult.colorCount)) {
                const encoded = encodeAnimatedPng(
                    resizedFrames,
                    MAIN_IMAGE_SIZE,
                    MAIN_IMAGE_SIZE,
                    selectedResult.durationMs,
                    colorCount,
                );
                const candidate = new Blob([encoded.buffer], { type: 'image/png' });
                if (!chosenBlob || candidate.size < chosenBlob.size) chosenBlob = candidate;
                if (candidate.size < MAX_LINE_FILE_SIZE) {
                    chosenBlob = candidate;
                    break;
                }
            }

            if (!chosenBlob) throw new Error('Unable to encode the main APNG image.');
            const nextOutput: MainImageOutput = {
                blob: chosenBlob,
                url: URL.createObjectURL(chosenBlob),
                frameCount: resizedFrames.length,
                durationMs: selectedResult.durationMs,
                sizeBytes: chosenBlob.size,
            };
            setOutput(nextOutput);
            saveAs(chosenBlob, 'main.png');
        } catch (reason) {
            setError(reason instanceof Error ? reason.message : String(reason));
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <section className="mt-6 overflow-hidden rounded-3xl border border-secondary-hover/70 bg-secondary/25">
            <div className="flex flex-wrap items-start justify-between gap-4 border-b border-secondary-hover/50 px-5 py-5 md:px-6">
                <div>
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-primary">
                        {t('animatedSticker.mainMakerEyebrow')}
                    </p>
                    <h4 className="mt-1 text-xl font-black text-bronze-text">
                        {t('animatedSticker.mainMakerTitle')}
                    </h4>
                    <p className="mt-2 max-w-2xl text-sm leading-6 text-bronze-light">
                        {t('animatedSticker.mainMakerHint')}
                    </p>
                </div>
                <div className="rounded-xl border border-primary/15 bg-white px-3 py-2 text-sm font-black text-primary shadow-sm">
                    APNG · 240×240
                </div>
            </div>

            <div className="grid gap-6 p-5 md:p-6 lg:grid-cols-[minmax(0,1fr)_280px]">
                <div>
                    <p className="mb-3 text-sm font-black text-bronze-text">
                        {t('animatedSticker.mainMakerSelect')}
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
                                    aria-label={t('animatedSticker.mainMakerSelectNumber', { number: result.index + 1 })}
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

                    <div className="mt-5 rounded-2xl border border-cream-dark bg-cream-light p-4">
                        <div className="mb-3 flex items-center justify-between gap-3">
                            <label htmlFor="main-image-position" className="flex items-center gap-2 text-sm font-black text-bronze-text">
                                <MoveHorizontal size={17} /> {t('animatedSticker.mainMakerPosition')}
                            </label>
                            <span className="rounded-lg bg-white px-2.5 py-1 text-xs font-black text-primary shadow-sm">
                                {Math.round(cropPosition * 100)}%
                            </span>
                        </div>
                        <input
                            id="main-image-position"
                            type="range"
                            min={0}
                            max={100}
                            value={Math.round(cropPosition * 100)}
                            onChange={(event) => setCropPosition(Number(event.target.value) / 100)}
                            className="w-full accent-primary"
                        />
                        <div className="mt-2 flex justify-between text-xs font-bold text-bronze-light">
                            <span>{t('animatedSticker.mainMakerLeft')}</span>
                            <span>{t('animatedSticker.mainMakerCenter')}</span>
                            <span>{t('animatedSticker.mainMakerRight')}</span>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={handleGenerate}
                        disabled={isGenerating}
                        className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-5 py-4 text-base font-black text-white shadow-lg shadow-primary/20 transition-all hover:-translate-y-0.5 hover:bg-primary-hover disabled:translate-y-0 disabled:cursor-wait disabled:opacity-55"
                    >
                        {isGenerating ? <LoaderCircle size={19} className="animate-spin" /> : <Download size={19} />}
                        {isGenerating
                            ? t('animatedSticker.mainMakerGenerating')
                            : t('animatedSticker.mainMakerGenerate')}
                    </button>

                    {error && (
                        <p className="mt-3 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-bold text-red-700">
                            <TriangleAlert size={17} className="mt-0.5 shrink-0" />
                            {t('animatedSticker.mainMakerError', { reason: error })}
                        </p>
                    )}
                </div>

                <div>
                    <p className="mb-3 flex items-center gap-2 text-sm font-black text-bronze-text">
                        <Crop size={17} /> {t('animatedSticker.mainMakerPreview')}
                    </p>
                    <div className="relative mx-auto aspect-square w-full max-w-60 overflow-hidden rounded-3xl border-4 border-bronze-text bg-grid-pattern shadow-xl shadow-bronze-text/10">
                        <img
                            src={output?.url ?? selectedResult.url}
                            alt={t('animatedSticker.mainMakerPreviewAlt')}
                            className="h-full w-full object-cover"
                            style={output ? undefined : { objectPosition: `${cropPosition * 100}% 50%` }}
                        />
                        <span className="absolute bottom-2 right-2 rounded-lg bg-bronze-text/85 px-2 py-1 text-xs font-black text-white backdrop-blur-sm">
                            240×240
                        </span>
                    </div>

                    {output && (
                        <div className={`mt-4 rounded-2xl border p-3 ${output.sizeBytes < MAX_LINE_FILE_SIZE ? 'border-emerald-200 bg-emerald-50' : 'border-amber-200 bg-amber-50'}`}>
                            <p className={`flex items-center gap-2 text-sm font-black ${output.sizeBytes < MAX_LINE_FILE_SIZE ? 'text-emerald-700' : 'text-amber-700'}`}>
                                {output.sizeBytes < MAX_LINE_FILE_SIZE ? <CheckCircle2 size={17} /> : <TriangleAlert size={17} />}
                                {output.sizeBytes < MAX_LINE_FILE_SIZE
                                    ? t('animatedSticker.mainMakerReady')
                                    : t('animatedSticker.mainMakerTooLarge')}
                            </p>
                            <p className="mt-1 text-xs font-bold text-bronze-light">
                                {t('animatedSticker.mainMakerMeta', {
                                    size: formatFileSize(output.sizeBytes),
                                    frames: output.frameCount,
                                    seconds: output.durationMs / 1000,
                                })}
                            </p>
                            <button
                                type="button"
                                onClick={() => saveAs(output.blob, 'main.png')}
                                className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-cream-dark bg-white px-3 py-2.5 text-sm font-black text-primary transition-colors hover:border-primary/40"
                            >
                                <Download size={16} /> {t('animatedSticker.mainMakerDownloadAgain')}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
};

import { useEffect, useRef, useState } from 'react';
import { RotateCcw, Scissors, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useModalA11y } from '../../../hooks/useModalA11y';
import type { AnimatedStickerResult } from '../types';
import { MIN_ANIMATED_STICKER_FRAMES } from '../utils/frameTrimming';

interface FrameTrimDialogProps {
    result: AnimatedStickerResult;
    onApply: (startIndex: number, endIndex: number) => void;
    onClose: () => void;
}

interface FrameThumbnailProps {
    frame: Uint8ClampedArray;
    width: number;
    height: number;
    selected: boolean;
    index: number;
}

const FrameThumbnail = ({ frame, width, height, selected, index }: FrameThumbnailProps) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        const context = canvas?.getContext('2d');
        if (!canvas || !context) return;

        canvas.width = width;
        canvas.height = height;
        context.putImageData(new ImageData(new Uint8ClampedArray(frame), width, height), 0, 0);
    }, [frame, height, width]);

    return (
        <div
            className={`relative shrink-0 overflow-hidden rounded-xl border-2 transition-opacity ${
                selected
                    ? 'border-primary bg-white opacity-100 shadow-sm'
                    : 'border-cream-dark bg-cream opacity-35 grayscale'
            }`}
        >
            <canvas
                ref={canvasRef}
                className="block h-[84px] w-[100px] object-contain"
                aria-label={String(index + 1)}
            />
            <span className="absolute bottom-1 left-1 rounded-md bg-bronze-text/80 px-1.5 py-0.5 text-xs font-black text-white">
                {index + 1}
            </span>
        </div>
    );
};

export const FrameTrimDialog = ({ result, onApply, onClose }: FrameTrimDialogProps) => {
    const { t } = useTranslation();
    const modalRef = useModalA11y<HTMLDivElement>({ isOpen: true, onClose });
    const totalFrames = result.sourceFrames.length;
    const minimumFrames = Math.min(MIN_ANIMATED_STICKER_FRAMES, totalFrames);
    const [startIndex, setStartIndex] = useState(0);
    const [endIndex, setEndIndex] = useState(totalFrames);
    const selectedCount = endIndex - startIndex;
    const isUnchanged = startIndex === 0 && endIndex === totalFrames;

    useEffect(() => {
        setStartIndex(0);
        setEndIndex(totalFrames);
    }, [result.index, totalFrames]);

    const removeFirstFrame = () => {
        if (selectedCount > minimumFrames) setStartIndex((current) => current + 1);
    };

    const removeLastFrame = () => {
        if (selectedCount > minimumFrames) setEndIndex((current) => current - 1);
    };

    const resetRange = () => {
        setStartIndex(0);
        setEndIndex(totalFrames);
    };

    return (
        <div
            ref={modalRef}
            className="fixed inset-0 z-[80] flex items-center justify-center bg-bronze-text/70 p-4 backdrop-blur-sm"
            role="dialog"
            aria-modal="true"
            aria-labelledby="frame-trim-title"
            onMouseDown={(event) => {
                if (event.target === event.currentTarget) onClose();
            }}
        >
            <section className="flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-[2rem] border border-cream-dark bg-cream-light shadow-2xl">
                <header className="flex items-start justify-between gap-4 border-b border-cream-dark px-6 py-5">
                    <div>
                        <h2 id="frame-trim-title" className="flex items-center gap-2 text-xl font-black text-bronze-text">
                            <Scissors size={20} className="text-primary" />
                            {t('animatedSticker.trimTitle', { number: result.index + 1 })}
                        </h2>
                        <p className="mt-1 text-sm font-bold text-bronze-light">
                            {t('animatedSticker.trimDescription', { minimum: MIN_ANIMATED_STICKER_FRAMES })}
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-cream-dark bg-white text-bronze-light transition-colors hover:text-primary"
                        aria-label={t('common.close')}
                    >
                        <X size={19} />
                    </button>
                </header>

                <div className="overflow-y-auto px-6 py-5">
                    <div className="mx-auto aspect-[32/27] w-full max-w-xs overflow-hidden rounded-2xl border border-cream-dark bg-grid-pattern p-3">
                        <img
                            src={result.url}
                            alt={t('animatedSticker.resultAlt', { number: result.index + 1 })}
                            className="h-full w-full object-contain"
                        />
                    </div>

                    <div className="mt-5 flex gap-2 overflow-x-auto pb-3">
                        {result.sourceFrames.map((frame, index) => (
                            <FrameThumbnail
                                key={index}
                                frame={frame}
                                width={result.width}
                                height={result.height}
                                index={index}
                                selected={index >= startIndex && index < endIndex}
                            />
                        ))}
                    </div>

                    <div className="mt-3 grid gap-4 rounded-2xl border border-cream-dark bg-white p-4 md:grid-cols-2">
                        <label className="text-sm font-black text-bronze-text">
                            <span className="flex justify-between gap-3">
                                {t('animatedSticker.trimStart')}
                                <span className="text-primary">{startIndex + 1}</span>
                            </span>
                            <input
                                type="range"
                                min={0}
                                max={Math.max(0, endIndex - minimumFrames)}
                                value={startIndex}
                                onChange={(event) => setStartIndex(Math.min(
                                    Number(event.target.value),
                                    endIndex - minimumFrames,
                                ))}
                                className="mt-3 w-full accent-primary"
                            />
                        </label>
                        <label className="text-sm font-black text-bronze-text">
                            <span className="flex justify-between gap-3">
                                {t('animatedSticker.trimEnd')}
                                <span className="text-primary">{endIndex}</span>
                            </span>
                            <input
                                type="range"
                                min={Math.min(totalFrames, startIndex + minimumFrames)}
                                max={totalFrames}
                                value={endIndex}
                                onChange={(event) => setEndIndex(Math.max(
                                    Number(event.target.value),
                                    startIndex + minimumFrames,
                                ))}
                                className="mt-3 w-full accent-primary"
                            />
                        </label>
                    </div>

                    <div className="mt-4 flex flex-wrap items-center gap-2">
                        <button
                            type="button"
                            onClick={removeFirstFrame}
                            disabled={selectedCount <= minimumFrames}
                            className="rounded-xl border border-cream-dark bg-white px-4 py-2.5 text-sm font-black text-bronze-text transition-colors hover:border-primary/40 hover:text-primary disabled:cursor-not-allowed disabled:opacity-40"
                        >
                            {t('animatedSticker.trimFirstFrame')}
                        </button>
                        <button
                            type="button"
                            onClick={removeLastFrame}
                            disabled={selectedCount <= minimumFrames}
                            className="rounded-xl border border-cream-dark bg-white px-4 py-2.5 text-sm font-black text-bronze-text transition-colors hover:border-primary/40 hover:text-primary disabled:cursor-not-allowed disabled:opacity-40"
                        >
                            {t('animatedSticker.trimLastFrame')}
                        </button>
                        <button
                            type="button"
                            onClick={resetRange}
                            disabled={isUnchanged}
                            className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-black text-bronze-light transition-colors hover:bg-cream disabled:cursor-not-allowed disabled:opacity-40"
                        >
                            <RotateCcw size={16} /> {t('animatedSticker.trimReset')}
                        </button>
                        <p className="ml-auto text-sm font-black text-bronze-light">
                            {t('animatedSticker.trimFrameCount', { selected: selectedCount, total: totalFrames })}
                        </p>
                    </div>
                </div>

                <footer className="flex justify-end gap-3 border-t border-cream-dark bg-cream px-6 py-4">
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-xl border border-cream-dark bg-white px-5 py-3 text-sm font-black text-bronze-text transition-colors hover:border-primary/40"
                    >
                        {t('common.cancel')}
                    </button>
                    <button
                        type="button"
                        onClick={() => onApply(startIndex, endIndex)}
                        disabled={isUnchanged || selectedCount < minimumFrames}
                        className="rounded-xl bg-primary px-5 py-3 text-sm font-black text-white shadow-sm transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0"
                    >
                        {t('animatedSticker.trimApply')}
                    </button>
                </footer>
            </section>
        </div>
    );
};

import { useRef } from 'react';
import { Film, Move, Play, RotateCcw } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { GridCalibration } from '../types';
import {
    DEFAULT_GRID_CALIBRATION,
    getGridCellRect,
    setGridGuide,
    STICKER_COUNT,
} from '../utils/frameProcessing';

interface VideoBoardPreviewProps {
    src: string | null;
    videoRef: React.RefObject<HTMLVideoElement | null>;
    onLoadedMetadata: () => void;
    gridCalibration: GridCalibration;
    disabled?: boolean;
    onCalibrationChange: (calibration: GridCalibration) => void;
}

export const VideoBoardPreview = ({
    src,
    videoRef,
    onLoadedMetadata,
    gridCalibration: calibration,
    disabled = false,
    onCalibrationChange,
}: VideoBoardPreviewProps) => {
    const { t } = useTranslation();
    const overlayRef = useRef<HTMLDivElement>(null);

    const moveGuideFromPointer = (
        axis: 'column' | 'row',
        index: number,
        event: React.PointerEvent<HTMLButtonElement>,
    ) => {
        if (disabled || !event.currentTarget.hasPointerCapture(event.pointerId)) return;
        const rect = overlayRef.current?.getBoundingClientRect();
        if (!rect) return;
        const ratio = axis === 'column'
            ? (event.clientX - rect.left) / rect.width
            : (event.clientY - rect.top) / rect.height;
        onCalibrationChange(setGridGuide(calibration, axis, index, ratio));
    };

    const nudgeGuide = (
        axis: 'column' | 'row',
        index: number,
        event: React.KeyboardEvent<HTMLButtonElement>,
    ) => {
        const negative = axis === 'column' ? event.key === 'ArrowLeft' : event.key === 'ArrowUp';
        const positive = axis === 'column' ? event.key === 'ArrowRight' : event.key === 'ArrowDown';
        if (!negative && !positive) return;
        event.preventDefault();
        const current = axis === 'column' ? calibration.columnGuides[index] : calibration.rowGuide;
        const step = event.shiftKey ? 0.001 : 0.005;
        onCalibrationChange(setGridGuide(calibration, axis, index, current + (positive ? step : -step)));
    };

    return (
        <div className="relative overflow-hidden rounded-[1.75rem] border border-cream-dark bg-bronze-text shadow-xl">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 px-5 py-3 text-white/70">
                <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.22em]">
                    <Film size={16} /> {t('animatedSticker.boardMonitor')}
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5 text-xs font-bold">
                        <span className="h-2 w-2 rounded-full bg-secondary shadow-sm" />
                        {t('animatedSticker.boardGridLabel')}
                    </div>
                    {src && <button
                        type="button"
                        onClick={() => onCalibrationChange({
                            columnGuides: [...DEFAULT_GRID_CALIBRATION.columnGuides],
                            rowGuide: DEFAULT_GRID_CALIBRATION.rowGuide,
                        })}
                        disabled={disabled}
                        className="flex items-center gap-1.5 rounded-lg border border-white/15 bg-white/10 px-2.5 py-1.5 text-xs font-black text-white transition-colors hover:bg-white hover:text-bronze-text disabled:cursor-not-allowed disabled:opacity-40"
                    ><RotateCcw size={13} /> {t('animatedSticker.resetGrid')}</button>}
                </div>
            </div>

            <div className={src ? 'relative bg-bronze-text' : 'relative aspect-video bg-bronze-text'}>
                {src ? (
                    <video
                        ref={videoRef}
                        src={src}
                        controls
                        playsInline
                        preload="metadata"
                        onLoadedMetadata={onLoadedMetadata}
                        className="block w-full"
                    />
                ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 text-center text-white/65">
                        <div className="flex h-16 w-16 items-center justify-center rounded-full border border-white/15 bg-white/10 shadow-inner backdrop-blur-sm">
                            <Play size={24} className="ml-1" fill="currentColor" />
                        </div>
                        <div>
                            <p className="text-base font-black text-white/90">{t('animatedSticker.emptyBoardTitle')}</p>
                            <p className="mt-2 text-sm">{t('animatedSticker.emptyBoardHint')}</p>
                        </div>
                    </div>
                )}

                <div ref={overlayRef} className="pointer-events-none absolute inset-0 overflow-hidden border border-secondary/75">
                    {Array.from({ length: STICKER_COUNT }, (_, index) => {
                        const cell = getGridCellRect(100, 100, index, calibration);
                        return <span
                            key={index}
                            className="absolute flex h-6 min-w-6 items-center justify-center rounded-md bg-bronze-text/80 px-1.5 text-xs font-black text-white/90 shadow-sm backdrop-blur-sm"
                            style={{ left: `${cell.x + 1}%`, top: `${cell.y + 1}%` }}
                        >{String(index + 1).padStart(2, '0')}</span>;
                    })}

                    {calibration.columnGuides.map((ratio, index) => <button
                        key={`column-${index}`}
                        type="button"
                        aria-label={t('animatedSticker.columnGuide', { number: index + 1 })}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-valuenow={Math.round(ratio * 1000) / 10}
                        role="slider"
                        disabled={disabled || !src}
                        onPointerDown={(event) => {
                            event.preventDefault();
                            event.currentTarget.setPointerCapture(event.pointerId);
                        }}
                        onPointerMove={(event) => moveGuideFromPointer('column', index, event)}
                        onPointerUp={(event) => event.currentTarget.releasePointerCapture(event.pointerId)}
                        onKeyDown={(event) => nudgeGuide('column', index, event)}
                        className="pointer-events-auto absolute inset-y-0 z-20 w-7 -translate-x-1/2 cursor-col-resize touch-none disabled:pointer-events-none"
                        style={{ left: `${ratio * 100}%` }}
                    ><span className="absolute inset-y-0 left-1/2 border-l border-dashed border-secondary/90" /><span className="absolute left-1/2 top-1/2 grid h-8 w-5 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-white/60 bg-bronze-text/85 text-secondary shadow-lg"><Move size={12} /></span></button>)}

                    <button
                        type="button"
                        aria-label={t('animatedSticker.rowGuide')}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-valuenow={Math.round(calibration.rowGuide * 1000) / 10}
                        role="slider"
                        disabled={disabled || !src}
                        onPointerDown={(event) => {
                            event.preventDefault();
                            event.currentTarget.setPointerCapture(event.pointerId);
                        }}
                        onPointerMove={(event) => moveGuideFromPointer('row', 0, event)}
                        onPointerUp={(event) => event.currentTarget.releasePointerCapture(event.pointerId)}
                        onKeyDown={(event) => nudgeGuide('row', 0, event)}
                        className="pointer-events-auto absolute inset-x-0 z-20 h-7 -translate-y-1/2 cursor-row-resize touch-none disabled:pointer-events-none"
                        style={{ top: `${calibration.rowGuide * 100}%` }}
                    ><span className="absolute inset-x-0 top-1/2 border-t border-dashed border-secondary/90" /><span className="absolute left-1/2 top-1/2 grid h-5 w-8 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-white/60 bg-bronze-text/85 text-secondary shadow-lg"><Move size={12} /></span></button>
                </div>
            </div>

            {src && <div className="flex items-center justify-center gap-2 border-t border-white/10 bg-white/5 px-4 py-3 text-center text-xs font-bold text-white/70"><Move size={14} className="text-secondary" /> {t('animatedSticker.gridAdjustHint')}</div>}
        </div>
    );
};

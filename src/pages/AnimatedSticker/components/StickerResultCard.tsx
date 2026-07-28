import { CheckCircle2, Download, TriangleAlert } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { AnimatedStickerResult } from '../types';
import { formatFileSize } from '../utils/frameProcessing';
import { validateLineAnimatedSticker } from '../utils/lineCompliance';

interface StickerResultCardProps {
    result: AnimatedStickerResult;
    onDownload: (result: AnimatedStickerResult) => void;
}

export const StickerResultCard = ({ result, onDownload }: StickerResultCardProps) => {
    const { t } = useTranslation();
    const validation = validateLineAnimatedSticker(result);

    return (
        <article className="group overflow-hidden rounded-2xl border border-cream-dark bg-cream-light shadow-sm transition-transform duration-200 hover:-translate-y-1 hover:shadow-md">
            <div className="relative aspect-[32/27] bg-grid-pattern p-3">
                <img
                    src={result.url}
                    alt={t('animatedSticker.resultAlt', { number: result.index + 1 })}
                    className="h-full w-full object-contain drop-shadow-[0_8px_10px_rgba(74,64,85,0.14)]"
                />
                <span className="absolute left-3 top-3 rounded-lg bg-bronze-text/85 px-2 py-1 text-xs font-black tracking-wider text-white backdrop-blur-sm">
                    {String(result.index + 1).padStart(2, '0')}
                </span>
            </div>
            <div className="flex items-center justify-between gap-2 border-t border-cream-dark/60 px-3 py-3">
                <div className="min-w-0">
                    <div
                        className={`flex items-center gap-1 text-xs font-black ${validation.isCompliant ? 'text-emerald-600' : 'text-amber-600'}`}
                        title={validation.failures.map((failure) => t(`animatedSticker.compliance.${failure}`)).join('、')}
                    >
                        {validation.isCompliant ? <CheckCircle2 size={14} /> : <TriangleAlert size={14} />}
                        {validation.isCompliant ? t('animatedSticker.lineCompliant') : t('animatedSticker.lineNeedsAttention')}
                    </div>
                    <p className="mt-1 text-xs font-bold text-bronze-light">
                        {result.originalSizeBytes && result.originalSizeBytes !== result.sizeBytes ? (
                            <><span className="line-through opacity-55">{formatFileSize(result.originalSizeBytes)}</span>{' → '}{formatFileSize(result.sizeBytes)}</>
                        ) : formatFileSize(result.sizeBytes)}
                    </p>
                    {result.originalSizeBytes && (
                        <p className="mt-1 text-xs font-bold text-primary">
                            {t('animatedSticker.compressedProfile', { colors: result.colorCount, frames: result.frameCount })}
                        </p>
                    )}
                    <p className="mt-1 text-xs font-bold text-bronze-light">
                        {t('animatedSticker.lineProfile', {
                            width: result.width,
                            height: result.height,
                            frames: result.frameCount,
                            seconds: result.durationMs / 1000,
                            loops: result.loopCount,
                        })}
                    </p>
                </div>
                <button
                    type="button"
                    onClick={() => onDownload(result)}
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-cream-dark bg-cream text-bronze-light transition-colors hover:border-primary/40 hover:bg-white hover:text-primary"
                    aria-label={t('animatedSticker.downloadOne', { number: result.index + 1 })}
                >
                    <Download size={18} />
                </button>
            </div>
        </article>
    );
};

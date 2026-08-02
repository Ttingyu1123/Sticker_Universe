import { useState } from 'react';
import {
    ArchiveRestore,
    FileArchive,
    LoaderCircle,
    ShieldCheck,
    TriangleAlert,
    X,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useToast } from '../../../components/shared/ToastProvider';
import { useModalA11y } from '../../../hooks/useModalA11y';
import type { ParsedStickerSeriesBackup } from '../seriesBackup';

interface SeriesBackupImportDialogProps {
    backup: ParsedStickerSeriesBackup;
    onContinue: () => void | Promise<void>;
    onAvoidRepeats: () => void;
    onClose: () => void;
}

export const SeriesBackupImportDialog = ({
    backup,
    onContinue,
    onAvoidRepeats,
    onClose,
}: SeriesBackupImportDialogProps) => {
    const { t } = useTranslation();
    const { showToast } = useToast();
    const [isApplying, setIsApplying] = useState(false);
    const dialogRef = useModalA11y({ isOpen: true, onClose });
    const stickerCount = backup.project.completedBatches.reduce(
        (total, batch) => total + batch.concepts.length,
        0,
    );
    const exportedAt = new Date(backup.manifest.exportedAt).toLocaleString();

    const handleContinue = async () => {
        setIsApplying(true);
        try {
            await onContinue();
        } catch (error) {
            const reason = error instanceof Error ? error.message : String(error);
            showToast(t('spriteSheet.seriesBackupImportFailed', { reason }), 'error');
        } finally {
            setIsApplying(false);
        }
    };

    return (
        <div
            className="fixed inset-0 z-[100] grid place-items-center bg-bronze-text/55 p-4 backdrop-blur-sm"
            onMouseDown={(event) => event.target === event.currentTarget && onClose()}
        >
            <div
                ref={dialogRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby="series-backup-import-title"
                className="w-full max-w-xl rounded-[2rem] border border-cream-dark bg-cream-light p-5 shadow-2xl sm:p-7"
            >
                <div className="flex items-start justify-between gap-4">
                    <div className="flex min-w-0 items-start gap-3">
                        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-primary text-white">
                            <FileArchive size={21} />
                        </span>
                        <div className="min-w-0">
                            <h2 id="series-backup-import-title" className="text-xl font-black text-bronze-text">
                                {t('spriteSheet.seriesBackupImportTitle')}
                            </h2>
                            <p className="mt-1 truncate text-base font-black text-primary">{backup.project.name}</p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isApplying}
                        aria-label={t('common.close')}
                        className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-cream text-bronze-light hover:bg-white hover:text-primary disabled:opacity-45"
                    >
                        <X size={18} />
                    </button>
                </div>

                <p className="mt-5 text-sm font-medium leading-6 text-bronze-light">
                    {t('spriteSheet.seriesBackupImportHint')}
                </p>

                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl border border-cream-dark bg-white p-4">
                        <p className="text-sm font-black text-bronze-text">
                            {t('spriteSheet.seriesBackupStickerCount', { count: stickerCount })}
                        </p>
                        <p className="mt-1 text-xs font-bold text-bronze-light">
                            {t('spriteSheet.seriesBackupExportedAt', { date: exportedAt })}
                        </p>
                    </div>
                    <div className={`flex items-start gap-2 rounded-2xl border p-4 ${backup.promptCoverage.complete ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-amber-200 bg-amber-50 text-amber-800'}`}>
                        {backup.promptCoverage.complete
                            ? <ShieldCheck size={18} className="mt-0.5 shrink-0" />
                            : <TriangleAlert size={18} className="mt-0.5 shrink-0" />}
                        <p className="text-sm font-black leading-5">
                            {backup.promptCoverage.complete
                                ? t('spriteSheet.seriesBackupPromptComplete')
                                : t('spriteSheet.seriesBackupPromptIncomplete', {
                                    recorded: backup.promptCoverage.recorded,
                                    total: backup.promptCoverage.total,
                                })}
                        </p>
                    </div>
                </div>

                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                    <button
                        type="button"
                        onClick={onAvoidRepeats}
                        disabled={isApplying}
                        className="flex items-center justify-center gap-2 rounded-2xl border border-primary/25 bg-white px-4 py-3.5 text-sm font-black text-primary hover:bg-cream disabled:opacity-45"
                    >
                        <ShieldCheck size={17} />
                        {t('spriteSheet.seriesBackupAvoidRepeats')}
                    </button>
                    <button
                        type="button"
                        onClick={() => void handleContinue()}
                        disabled={isApplying}
                        className="flex items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-3.5 text-sm font-black text-white shadow-lg shadow-primary/20 hover:bg-primary-hover disabled:opacity-45"
                    >
                        {isApplying ? <LoaderCircle size={17} className="animate-spin" /> : <ArchiveRestore size={17} />}
                        {t('spriteSheet.seriesBackupContinue')}
                    </button>
                </div>
            </div>
        </div>
    );
};

import React from 'react';
import { useTranslation } from 'react-i18next';
import { Copy, Download, Loader2 } from 'lucide-react';
import { useToast } from '../../../components/shared/ToastProvider';
import type { PreflightReport, RiskLevel } from '../core';
import type { LoadedImage } from '../hooks/usePreflight';
import { buildInquiryText, buildReportText } from '../utils/reportText';

interface ResultsPanelProps {
    image: LoadedImage | null;
    report: PreflightReport | null;
    analyzing: boolean;
}

const LEVEL_BADGE: Record<RiskLevel, string> = {
    good: 'bg-emerald-100 text-emerald-700',
    warning: 'bg-amber-100 text-amber-700',
    bad: 'bg-rose-100 text-rose-700',
};

const LEVEL_SCORE_BG: Record<RiskLevel, string> = {
    good: 'from-emerald-500 to-emerald-600',
    warning: 'from-amber-500 to-amber-600',
    bad: 'from-rose-500 to-rose-600',
};

const Badge = ({ level }: { level: RiskLevel }) => {
    const { t } = useTranslation();
    return (
        <span className={`shrink-0 px-2 py-0.5 rounded-full text-[11px] font-black ${LEVEL_BADGE[level]}`}>
            {t(`printPreflight.status.${level}`)}
        </span>
    );
};

const MetricCard = ({ title, value, level, hint, extra }: {
    title: string;
    value: string;
    level: RiskLevel | null;
    hint?: string;
    extra?: string;
}) => (
    <div className="bg-white rounded-2xl border border-cream-dark p-4">
        <div className="flex items-center justify-between gap-2 mb-1">
            <p className="text-xs font-bold text-bronze-text/60">{title}</p>
            {level && <Badge level={level} />}
        </div>
        <p className="text-lg font-black text-bronze-text">{value}</p>
        {extra && <p className="text-xs font-bold text-bronze-text/80 mt-1">{extra}</p>}
        {hint && <p className="text-xs text-bronze-text/60 mt-1 leading-relaxed">{hint}</p>}
    </div>
);

export const ResultsPanel: React.FC<ResultsPanelProps> = ({ image, report, analyzing }) => {
    const { t } = useTranslation();
    const { showToast } = useToast();

    const pendingValue = analyzing ? '…' : '--';

    const handleDownload = () => {
        if (!report || !image) return;
        const text = buildReportText(report, image.fileName, t);
        const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `print-preflight-${image.fileName.replace(/\.[^.]+$/, '')}.txt`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleCopyInquiry = async () => {
        if (!report) return;
        try {
            await navigator.clipboard.writeText(buildInquiryText(report, t));
            showToast(t('printPreflight.report.copied'), 'success');
        } catch {
            showToast(t('printPreflight.report.copyFailed'), 'error');
        }
    };

    return (
        <div className="space-y-4">
            {/* Overall score */}
            <div className={`rounded-3xl p-5 text-white shadow-lg bg-gradient-to-br ${report ? LEVEL_SCORE_BG[report.overall.level] : 'from-bronze-light to-bronze'}`}>
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-xs font-bold opacity-80">
                            {report ? t('printPreflight.score.title') : t('printPreflight.score.notEvaluated')}
                        </p>
                        <p className="text-4xl font-black leading-tight">
                            {analyzing
                                ? <Loader2 className="animate-spin mt-1" size={30} />
                                : report ? report.overall.grade : '--'}
                        </p>
                    </div>
                    {report && !analyzing && (
                        <p className="text-2xl font-black opacity-90">{report.overall.score}<span className="text-sm opacity-70">/100</span></p>
                    )}
                </div>
            </div>

            {/* Report actions */}
            <div className="bg-cream rounded-3xl border border-cream-dark p-5 space-y-3">
                <h3 className="text-sm font-black text-bronze-text">{t('printPreflight.report.title')}</h3>
                <p className="text-xs text-bronze-text/60 leading-relaxed">{t('printPreflight.report.desc')}</p>
                <div className="grid grid-cols-1 gap-2">
                    <button
                        onClick={handleDownload}
                        disabled={!report || analyzing}
                        className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-white text-sm font-bold hover:bg-primary-hover transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                        <Download size={16} /> {t('printPreflight.report.download')}
                    </button>
                    <button
                        onClick={handleCopyInquiry}
                        disabled={!report || analyzing}
                        className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-cream-dark bg-white text-bronze-text text-sm font-bold hover:text-primary hover:border-primary/40 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                        <Copy size={16} /> {t('printPreflight.report.copyInquiry')}
                    </button>
                </div>
            </div>

            {/* Metric cards */}
            <MetricCard
                title={t('printPreflight.metrics.dpi.title')}
                value={report ? `${report.dpi.effectiveDpi} DPI` : pendingValue}
                level={report?.dpi.level ?? null}
                extra={report
                    ? `${t('printPreflight.metrics.dpi.maxSize')}: ${report.dpi.maxGoodWidthMm} x ${report.dpi.maxGoodHeightMm} mm`
                    : undefined}
                hint={report
                    ? `${t('printPreflight.metrics.dpi.required')} ≥${report.dpi.requiredDpi}・${t('printPreflight.metrics.dpi.acceptable')} ≥${report.dpi.acceptableDpi}` +
                      (report.dpi.rotated ? `・${t('printPreflight.metrics.dpi.rotated')}` : '') +
                      ' — ' + t(`printPreflight.metrics.dpi.hint.${report.dpi.level}`)
                    : t('printPreflight.status.pending')}
            />
            <MetricCard
                title={t('printPreflight.metrics.sharpness.title')}
                value={report ? `${report.sharpness.score}/100` : pendingValue}
                level={report?.sharpness.level ?? null}
                hint={report ? t(`printPreflight.metrics.sharpness.hint.${report.sharpness.level}`) : t('printPreflight.status.pending')}
            />
            <MetricCard
                title={t('printPreflight.metrics.noise.title')}
                value={report ? `σ ${report.noise.noiseSigma}` : pendingValue}
                level={report?.noise.level ?? null}
                hint={report ? t(`printPreflight.metrics.noise.hint.${report.noise.level}`) : t('printPreflight.status.pending')}
            />
            <MetricCard
                title={t('printPreflight.metrics.gamut.title')}
                value={report ? `${(report.gamut.riskyRatio * 100).toFixed(1)}%` : pendingValue}
                level={report?.gamut.level ?? null}
                hint={report ? t(`printPreflight.metrics.gamut.hint.${report.gamut.level}`) : t('printPreflight.status.pending')}
            />
        </div>
    );
};

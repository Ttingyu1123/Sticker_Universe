import type { TFunction } from 'i18next';
import { VIEWING_DISTANCES, type PreflightReport } from '../core';

const statusLabel = (t: TFunction, level: 'good' | 'warning' | 'bad') =>
    t(`printPreflight.status.${level}`);

export function buildReportText(report: PreflightReport, fileName: string, t: TFunction): string {
    const { settings, dpi, sharpness, noise, gamut, overall } = report;
    const bleedW = settings.targetWidthMm + settings.bleedMm * 2;
    const bleedH = settings.targetHeightMm + settings.bleedMm * 2;
    const distance = VIEWING_DISTANCES.find(v => v.id === settings.viewingDistance);

    const lines = [
        t('printPreflight.reportText.header'),
        '',
        `${t('printPreflight.reportText.file')}: ${fileName}`,
        `${t('printPreflight.info.sourceSize')}: ${report.imageWidth} x ${report.imageHeight} px`,
        `${t('printPreflight.info.targetOutput')}: ${settings.targetWidthMm} x ${settings.targetHeightMm} mm` +
            (settings.bleedMm > 0 ? `（${t('printPreflight.reportText.withBleed', { w: bleedW, h: bleedH, bleed: settings.bleedMm })}）` : ''),
        `${t('printPreflight.info.usage')}: ${distance ? t(distance.labelKey) : settings.viewingDistance}`,
        '',
        `${t('printPreflight.score.title')}: ${overall.grade}（${overall.score}/100）`,
        `${t('printPreflight.metrics.dpi.title')}: ${dpi.effectiveDpi} DPI（${t('printPreflight.metrics.dpi.required')} ≥${dpi.requiredDpi}・${t('printPreflight.metrics.dpi.acceptable')} ≥${dpi.acceptableDpi}）— ${statusLabel(t, dpi.level)}`,
        `${t('printPreflight.metrics.dpi.maxSize')}: ${dpi.maxGoodWidthMm} x ${dpi.maxGoodHeightMm} mm`,
        `${t('printPreflight.metrics.sharpness.title')}: ${statusLabel(t, sharpness.level)}（Laplacian var ${sharpness.laplacianVariance}）`,
        `${t('printPreflight.metrics.noise.title')}: ${statusLabel(t, noise.level)}（σ≈${noise.noiseSigma}・block ${noise.blockiness}）`,
        `${t('printPreflight.metrics.gamut.title')}: ${statusLabel(t, gamut.level)}（${(gamut.riskyRatio * 100).toFixed(1)}%）`,
        '',
        t('printPreflight.reportText.footer'),
    ];
    return lines.join('\n');
}

export function buildInquiryText(report: PreflightReport, t: TFunction): string {
    const { settings, dpi } = report;
    return t('printPreflight.reportText.inquiry', {
        w: settings.targetWidthMm,
        h: settings.targetHeightMm,
        bleed: settings.bleedMm,
        pxW: report.imageWidth,
        pxH: report.imageHeight,
        dpi: dpi.effectiveDpi,
    });
}

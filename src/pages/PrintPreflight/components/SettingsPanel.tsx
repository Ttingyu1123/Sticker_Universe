import React from 'react';
import { useTranslation } from 'react-i18next';
import { SIZE_PRESETS, VIEWING_DISTANCES, type PreflightSettings } from '../core';

interface SettingsPanelProps {
    settings: PreflightSettings;
    presetId: string;
    onChange: (settings: PreflightSettings, presetId: string) => void;
}

const inputClass = "w-full px-3 py-2 rounded-xl border border-cream-dark bg-white text-bronze-text text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary";
const labelClass = "block text-xs font-bold text-bronze-text/60 mb-1.5";

export const SettingsPanel: React.FC<SettingsPanelProps> = ({ settings, presetId, onChange }) => {
    const { t } = useTranslation();

    const handlePreset = (id: string) => {
        const preset = SIZE_PRESETS.find(p => p.id === id);
        if (!preset) {
            onChange(settings, 'custom');
            return;
        }
        onChange({
            ...settings,
            targetWidthMm: preset.widthMm,
            targetHeightMm: preset.heightMm,
            viewingDistance: preset.viewingDistance,
        }, id);
    };

    const handleNumber = (field: 'targetWidthMm' | 'targetHeightMm' | 'bleedMm', raw: string) => {
        const value = Number(raw);
        if (!Number.isFinite(value) || value < 0) return;
        onChange({ ...settings, [field]: value }, field === 'bleedMm' ? presetId : 'custom');
    };

    return (
        <div className="bg-cream rounded-3xl border border-cream-dark p-5 space-y-4">
            <h2 className="text-sm font-black text-bronze-text">{t('printPreflight.settings.title')}</h2>

            <div>
                <label htmlFor="pf-preset" className={labelClass}>{t('printPreflight.settings.preset')}</label>
                <select
                    id="pf-preset"
                    className={inputClass}
                    value={presetId}
                    onChange={e => handlePreset(e.target.value)}
                >
                    {SIZE_PRESETS.map(p => (
                        <option key={p.id} value={p.id}>
                            {t(p.labelKey)} {p.widthMm} x {p.heightMm} mm
                        </option>
                    ))}
                    <option value="custom">{t('printPreflight.settings.custom')}</option>
                </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
                <div>
                    <label htmlFor="pf-width" className={labelClass}>{t('printPreflight.settings.width')}</label>
                    <input
                        id="pf-width"
                        type="number"
                        min={10}
                        className={inputClass}
                        value={settings.targetWidthMm}
                        onChange={e => handleNumber('targetWidthMm', e.target.value)}
                    />
                </div>
                <div>
                    <label htmlFor="pf-height" className={labelClass}>{t('printPreflight.settings.height')}</label>
                    <input
                        id="pf-height"
                        type="number"
                        min={10}
                        className={inputClass}
                        value={settings.targetHeightMm}
                        onChange={e => handleNumber('targetHeightMm', e.target.value)}
                    />
                </div>
            </div>

            <div>
                <label htmlFor="pf-distance" className={labelClass}>{t('printPreflight.settings.viewingDistance')}</label>
                <select
                    id="pf-distance"
                    className={inputClass}
                    value={settings.viewingDistance}
                    onChange={e => onChange({ ...settings, viewingDistance: e.target.value as PreflightSettings['viewingDistance'] }, presetId)}
                >
                    {VIEWING_DISTANCES.map(v => (
                        <option key={v.id} value={v.id}>
                            {t(v.labelKey)}（≥{v.requiredDpi} DPI）
                        </option>
                    ))}
                </select>
            </div>

            <div>
                <label htmlFor="pf-bleed" className={labelClass}>{t('printPreflight.settings.bleed')}</label>
                <input
                    id="pf-bleed"
                    type="number"
                    min={0}
                    max={20}
                    className={inputClass}
                    value={settings.bleedMm}
                    onChange={e => handleNumber('bleedMm', e.target.value)}
                />
            </div>

            <label className="flex items-center gap-2 text-sm text-bronze-text cursor-pointer">
                <input
                    type="checkbox"
                    className="w-4 h-4 rounded accent-primary"
                    checked={settings.hasFineDetail}
                    onChange={e => onChange({ ...settings, hasFineDetail: e.target.checked }, presetId)}
                />
                {t('printPreflight.settings.fineDetail')}
            </label>
        </div>
    );
};

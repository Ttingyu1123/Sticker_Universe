import React from 'react';
import { useTranslation } from 'react-i18next';
import { Brush, Eraser, Save, Trash2 } from 'lucide-react';
import type { BrushType, BrushPreset } from '../types';

const BRUSH_PRESETS_CONFIG: { id: BrushType; size: number; opacity: number }[] = [
    { id: 'pen', size: 6, opacity: 1 },
    { id: 'pencil', size: 4, opacity: 0.7 },
    { id: 'marker', size: 18, opacity: 0.35 },
    { id: 'airbrush', size: 22, opacity: 0.2 },
    { id: 'eraser', size: 24, opacity: 1 },
];

interface BrushSettingsPanelProps {
    brushType: BrushType;
    brushColor: string;
    brushSize: number;
    brushOpacity: number;
    pressureEnabled: boolean;
    pressureCurve: number;
    smoothing: number;
    spacing: number;
    vectorBrushEnabled: boolean;
    vectorStabilizer: number;
    maskPaintMode: boolean;
    hexCopied: boolean;
    customPresets: BrushPreset[];
    setBrushType: (v: BrushType) => void;
    setBrushColor: (v: string) => void;
    setBrushSize: (v: number) => void;
    setBrushOpacity: (v: number) => void;
    setPressureEnabled: (v: boolean) => void;
    setPressureCurve: (v: number) => void;
    setSmoothing: (v: number) => void;
    setSpacing: (v: number) => void;
    setVectorBrushEnabled: (v: boolean) => void;
    setVectorStabilizer: (v: number) => void;
    setMaskPaintMode: (v: boolean) => void;
    onSavePreset: () => void;
    onApplyPreset: (p: BrushPreset) => void;
    onRemovePreset: (id: string) => void;
    onCopyHex: () => void;
}

export const BrushSettingsPanel: React.FC<BrushSettingsPanelProps> = ({
    brushType, brushColor, brushSize, brushOpacity,
    pressureEnabled, pressureCurve, smoothing, spacing,
    vectorBrushEnabled, vectorStabilizer, maskPaintMode,
    hexCopied, customPresets,
    setBrushType, setBrushColor, setBrushSize, setBrushOpacity,
    setPressureEnabled, setPressureCurve, setSmoothing, setSpacing,
    setVectorBrushEnabled, setVectorStabilizer, setMaskPaintMode,
    onSavePreset, onApplyPreset, onRemovePreset, onCopyHex,
}) => {
    const { t } = useTranslation();
    const brushTypeLabel = (id: BrushType) => t(`drawing.brushTypes.${id}`, { defaultValue: id });

    return (
        <div className="rounded-xl border border-cream-dark p-3 bg-white">
            <div className="flex items-center justify-between mb-2">
                <div className="text-xs font-black uppercase text-bronze-light">{t('drawing.brush', { defaultValue: '筆刷' })}</div>
                <button onClick={onSavePreset} className="p-1.5 rounded border bg-cream-light" title={t('drawing.savePreset', { defaultValue: '儲存預設' })}>
                    <Save size={14} />
                </button>
            </div>
            <div className="grid grid-cols-3 gap-2 mb-3">
                {BRUSH_PRESETS_CONFIG.map((p) => (
                    <button
                        key={p.id}
                        onClick={() => { setBrushType(p.id); setBrushSize(p.size); setBrushOpacity(p.opacity); }}
                        className={`px-2 py-2 text-xs rounded-lg border font-bold ${brushType === p.id ? 'bg-primary text-white border-primary' : 'bg-cream-light border-cream-dark text-bronze-light'}`}
                    >
                        {p.id === 'eraser' ? <Eraser size={14} className="mx-auto mb-1" /> : <Brush size={14} className="mx-auto mb-1" />}
                        {brushTypeLabel(p.id)}
                    </button>
                ))}
            </div>
            <div className="space-y-2 text-xs">
                <label className="flex items-center justify-between gap-2 font-bold text-bronze-light">
                    <span>{t('drawing.color', { defaultValue: '顏色' })}</span>
                    <span className="inline-flex items-center gap-2">
                        <input type="color" value={brushColor} onChange={(e) => setBrushColor(e.target.value)} className="w-8 h-8 border rounded" />
                        <button
                            type="button"
                            onClick={onCopyHex}
                            title={hexCopied ? '已複製' : '點擊複製 HEX'}
                            className="rounded border border-cream-dark bg-cream-light px-1.5 py-0.5 text-[10px] font-black tracking-wide text-bronze-text hover:border-primary hover:text-primary"
                        >
                            {hexCopied ? '已複製' : brushColor.toUpperCase()}
                        </button>
                    </span>
                </label>
                <label className="block font-bold text-bronze-light">
                    {t('drawing.size', { defaultValue: '大小' })}: {brushSize}px
                    <input type="range" min={1} max={96} value={brushSize} onChange={(e) => setBrushSize(parseInt(e.target.value, 10))} className="w-full" />
                </label>
                <label className="block font-bold text-bronze-light">
                    {t('drawing.opacity', { defaultValue: '透明度' })}: {(brushOpacity * 100).toFixed(0)}%
                    <input type="range" min={1} max={100} value={Math.round(brushOpacity * 100)} onChange={(e) => setBrushOpacity(parseInt(e.target.value, 10) / 100)} className="w-full" />
                </label>
                <label className="flex items-center justify-between font-bold text-bronze-light">
                    {t('drawing.pressure', { defaultValue: '壓力' })}
                    <input type="checkbox" checked={pressureEnabled} onChange={(e) => setPressureEnabled(e.target.checked)} />
                </label>
                <label className="block font-bold text-bronze-light">
                    {t('drawing.pressureCurve', { defaultValue: '壓力曲線' })}: {pressureCurve.toFixed(2)}
                    <input type="range" min={0.5} max={3} step={0.05} value={pressureCurve} onChange={(e) => setPressureCurve(parseFloat(e.target.value))} className="w-full" />
                </label>
                <label className="block font-bold text-bronze-light">
                    {t('drawing.smoothing', { defaultValue: '平滑' })}: {(smoothing * 100).toFixed(0)}%
                    <input type="range" min={0} max={95} value={Math.round(smoothing * 100)} onChange={(e) => setSmoothing(parseInt(e.target.value, 10) / 100)} className="w-full" />
                </label>
                <label className="block font-bold text-bronze-light">
                    {t('drawing.spacing', { defaultValue: '間距' })}: {spacing}%
                    <input type="range" min={2} max={80} value={spacing} onChange={(e) => setSpacing(parseInt(e.target.value, 10))} className="w-full" />
                </label>
                <label className="flex items-center justify-between font-bold text-bronze-light">
                    {t('drawing.vectorBrush', { defaultValue: '向量筆刷' })}
                    <input type="checkbox" checked={vectorBrushEnabled} onChange={(e) => setVectorBrushEnabled(e.target.checked)} />
                </label>
                <label className="block font-bold text-bronze-light">
                    {t('drawing.stabilizer', { defaultValue: '穩定器' })}: {vectorStabilizer}%
                    <input type="range" min={0} max={95} value={vectorStabilizer} onChange={(e) => setVectorStabilizer(parseInt(e.target.value, 10))} className="w-full" />
                </label>
                <label className="flex items-center justify-between font-bold text-bronze-light">
                    {t('drawing.maskPaintMode', { defaultValue: '遮罩編輯' })}
                    <input type="checkbox" checked={maskPaintMode} onChange={(e) => setMaskPaintMode(e.target.checked)} />
                </label>
                <div className="text-[10px] text-bronze-light">{t('drawing.maskPaintHint', { defaultValue: '遮罩編輯：畫筆=隱藏，橡皮擦=還原' })}</div>
            </div>
            <div className="mt-3">
                <div className="text-[10px] font-black uppercase text-bronze-light mb-2">{t('drawing.brushPresets', { defaultValue: '筆刷預設' })}</div>
                <div className="space-y-1 max-h-28 overflow-auto pr-1">
                    {customPresets.length === 0 && (
                        <div className="text-[11px] text-bronze-light">{t('drawing.noPresets', { defaultValue: '尚無已儲存預設' })}</div>
                    )}
                    {customPresets.map((p) => (
                        <div key={p.id} className="flex items-center gap-1">
                            <button
                                className="text-left flex-1 px-2 py-1.5 rounded border bg-cream-light text-[11px] font-bold hover:border-primary"
                                onClick={() => onApplyPreset(p)}
                                title={t('drawing.applyPreset', { defaultValue: '套用預設' })}
                            >
                                {p.name}
                            </button>
                            <button
                                className="p-1 rounded border bg-white text-red-500"
                                onClick={() => onRemovePreset(p.id)}
                                title={t('drawing.deletePreset', { defaultValue: '刪除預設' })}
                            >
                                <Trash2 size={12} />
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

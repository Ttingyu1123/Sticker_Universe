import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { safeSaveToLocalStorage } from '../../../shared/localStorage';
import type { BrushType, BrushPreset } from '../types';

const PRESET_KEY = 'drawing-studio-brush-presets-v1';

interface UseBrushPresetsOptions {
    brushType: BrushType;
    brushColor: string;
    brushSize: number;
    brushOpacity: number;
    pressureEnabled: boolean;
    pressureCurve: number;
    smoothing: number;
    spacing: number;
    setBrushType: (v: BrushType) => void;
    setBrushColor: (v: string) => void;
    setBrushSize: (v: number) => void;
    setBrushOpacity: (v: number) => void;
    setPressureEnabled: (v: boolean) => void;
    setPressureCurve: (v: number) => void;
    setSmoothing: (v: number) => void;
    setSpacing: (v: number) => void;
}

export function useBrushPresets({
    brushType, brushColor, brushSize, brushOpacity,
    pressureEnabled, pressureCurve, smoothing, spacing,
    setBrushType, setBrushColor, setBrushSize, setBrushOpacity,
    setPressureEnabled, setPressureCurve, setSmoothing, setSpacing,
}: UseBrushPresetsOptions) {
    const { t } = useTranslation();
    const [customPresets, setCustomPresets] = useState<BrushPreset[]>([]);
    const [hexCopied, setHexCopied] = useState(false);

    useEffect(() => {
        try {
            const raw = localStorage.getItem(PRESET_KEY);
            if (raw) {
                const arr = JSON.parse(raw);
                if (Array.isArray(arr)) setCustomPresets(arr);
            }
        } catch {}
    }, []);

    const savePresetList = useCallback((next: BrushPreset[]) => {
        setCustomPresets(next);
        safeSaveToLocalStorage(PRESET_KEY, next);
    }, []);

    const saveBrushPreset = useCallback(() => {
        const fallback = `${t(`drawing.brushTypes.${brushType}`, { defaultValue: brushType })} ${customPresets.length + 1}`;
        const name = window.prompt(t('drawing.presetNamePrompt', { defaultValue: '預設名稱' }), fallback)?.trim();
        if (!name) return;
        const next: BrushPreset = {
            id: `preset-${Math.random().toString(36).slice(2, 10)}`,
            name, brushType, brushColor, brushSize, brushOpacity,
            pressureEnabled, pressureCurve, smoothing, spacing,
        };
        savePresetList([next, ...customPresets].slice(0, 12));
    }, [brushColor, brushOpacity, brushSize, brushType, customPresets, pressureCurve, pressureEnabled, savePresetList, smoothing, spacing, t]);

    const applyBrushPreset = useCallback((p: BrushPreset) => {
        setBrushType(p.brushType);
        setBrushColor(p.brushColor);
        setBrushSize(p.brushSize);
        setBrushOpacity(p.brushOpacity);
        setPressureEnabled(p.pressureEnabled);
        setPressureCurve(p.pressureCurve);
        setSmoothing(p.smoothing);
        setSpacing(p.spacing);
    }, [setBrushColor, setBrushOpacity, setBrushSize, setBrushType, setPressureEnabled, setPressureCurve, setSmoothing, setSpacing]);

    const removeBrushPreset = useCallback((id: string) => {
        savePresetList(customPresets.filter((p) => p.id !== id));
    }, [customPresets, savePresetList]);

    const copyBrushHex = useCallback(async () => {
        try {
            if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
                await navigator.clipboard.writeText(brushColor.toUpperCase());
            } else {
                const ta = document.createElement('textarea');
                ta.value = brushColor.toUpperCase();
                ta.style.position = 'fixed';
                ta.style.opacity = '0';
                document.body.appendChild(ta);
                ta.focus();
                ta.select();
                document.execCommand('copy');
                document.body.removeChild(ta);
            }
            setHexCopied(true);
            window.setTimeout(() => setHexCopied(false), 1200);
        } catch {
            setHexCopied(false);
        }
    }, [brushColor]);

    return {
        customPresets,
        hexCopied,
        savePresetList,
        saveBrushPreset,
        applyBrushPreset,
        removeBrushPreset,
        copyBrushHex,
    };
}

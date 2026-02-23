import React from 'react';
import { useTranslation } from 'react-i18next';
import { Download, Move3D, Pipette, Redo2, Save, Trash2, Undo2, Upload } from 'lucide-react';
import type { InteractionMode } from '../types';

interface CanvasToolbarProps {
    historyIndex: number;
    historyLength: number;
    activeLocked: boolean;
    mode: InteractionMode;
    eyedropper: boolean;
    brushSummary: string;
    onUndo: () => void;
    onRedo: () => void;
    onClearLayer: () => void;
    onImportFile: (file: File) => void;
    onOpenGallery: () => void;
    onToggleEyedropper: () => void;
    onSetMode: (mode: InteractionMode) => void;
    onClearSelection: () => void;
    onSaveToGallery: () => void;
    onExportPng: () => void;
}

export const CanvasToolbar: React.FC<CanvasToolbarProps> = ({
    historyIndex, historyLength, activeLocked, mode, eyedropper, brushSummary,
    onUndo, onRedo, onClearLayer, onImportFile, onOpenGallery, onToggleEyedropper,
    onSetMode, onClearSelection, onSaveToGallery, onExportPng,
}) => {
    const { t } = useTranslation();

    return (
        <div className="flex flex-wrap items-center gap-2 mb-3">
            <div className="inline-flex rounded-lg border overflow-hidden bg-white">
                <button onClick={onUndo} disabled={historyIndex <= 0} className="px-3 py-2 disabled:opacity-40"><Undo2 size={16} /></button>
                <button onClick={onRedo} disabled={historyIndex >= historyLength - 1} className="px-3 py-2 border-l disabled:opacity-40"><Redo2 size={16} /></button>
                <button
                    onClick={onClearLayer}
                    disabled={activeLocked}
                    title={activeLocked ? t('drawing.layerLocked', { defaultValue: '圖層已鎖定' }) : t('drawing.clearLayer', { defaultValue: '清空圖層' })}
                    className="px-3 py-2 border-l text-red-600 disabled:opacity-40"
                >
                    <Trash2 size={16} />
                </button>
            </div>
            <div className="inline-flex rounded-lg border overflow-hidden bg-white">
                <label className="px-3 py-2 cursor-pointer inline-flex items-center gap-2 text-sm font-semibold border-r">
                    <Upload size={16} />
                    <span>{t('drawing.uploadImage', { defaultValue: '上傳圖片' })}</span>
                    <input
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={(e) => { const f = e.target.files?.[0]; if (f) onImportFile(f); }}
                    />
                </label>
                <button onClick={onOpenGallery} className="px-3 py-2 inline-flex items-center gap-2 text-sm font-semibold">
                    {t('drawing.fromGallery', { defaultValue: '從作品集選取' })}
                </button>
            </div>
            <button
                onClick={onToggleEyedropper}
                className={`px-3 py-2 rounded-lg border inline-flex items-center gap-2 ${eyedropper ? 'bg-primary text-white border-primary' : 'bg-white'}`}
                title={t('drawing.eyedropper', { defaultValue: '吸管' })}
            >
                <Pipette size={16} />
            </button>
            <div className="inline-flex rounded-lg border overflow-hidden">
                <button onClick={() => onSetMode('draw')} className={`px-3 py-2 inline-flex items-center gap-1 ${mode === 'draw' ? 'bg-primary text-white' : 'bg-white'}`}>
                    {t('drawing.drawMode', { defaultValue: '繪製' })}
                </button>
                <button onClick={() => onSetMode('transform')} className={`px-3 py-2 inline-flex items-center gap-1 border-l ${mode === 'transform' ? 'bg-primary text-white' : 'bg-white'}`}>
                    <Move3D size={14} />{t('drawing.transformMode', { defaultValue: '變形' })}
                </button>
                <button onClick={() => onSetMode('select')} className={`px-3 py-2 inline-flex items-center gap-1 border-l ${mode === 'select' ? 'bg-primary text-white' : 'bg-white'}`}>
                    {t('drawing.selectMode', { defaultValue: '選取' })}
                </button>
            </div>
            <button onClick={onClearSelection} className="px-3 py-2 rounded-lg border bg-white inline-flex items-center gap-2">
                {t('drawing.clearSelection', { defaultValue: '清除選取' })}
            </button>
            <button onClick={onSaveToGallery} className="px-3 py-2 rounded-lg border bg-white inline-flex items-center gap-2">
                <Save size={16} />{t('drawing.saveToGallery', { defaultValue: '儲存至作品集' })}
            </button>
            <button onClick={onExportPng} className="px-3 py-2 rounded-lg bg-primary text-white inline-flex items-center gap-2">
                <Download size={16} />PNG
            </button>
            <div className="ml-auto flex items-center gap-2 text-xs font-bold text-bronze-light">
                <Move3D size={14} /><span>{brushSummary}</span>
            </div>
        </div>
    );
};

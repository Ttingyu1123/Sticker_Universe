import React from 'react';
import { useTranslation } from 'react-i18next';
import { Layer, AnimationType } from '../types';
import { Activity, RotateCw, Move, Type, Trash2, Maximize, RotateCcw, Upload } from 'lucide-react';
import '../animations.css';

interface LayerPropertiesProps {
    selectedLayer: Layer | null;
    onUpdateLayer: (id: string, updates: Partial<Layer>) => void;
    onDeleteLayer: (id: string) => void;
}

export const LayerProperties: React.FC<LayerPropertiesProps> = ({
    selectedLayer,
    onUpdateLayer,
    onDeleteLayer
}) => {
    const { t } = useTranslation();

    if (!selectedLayer) {
        return (
            <div className="bg-white/40 backdrop-blur-md rounded-2xl shadow-sm border border-cream-dark p-8 text-center text-bronze-light">
                <p>{t('animator.selectLayerHint')}</p>
            </div>
        );
    }

    const animations = [
        { id: 'none', label: 'None', icon: <span className="text-xs">🚫</span> },
        { id: 'shake', label: 'Shake', icon: <RotateCw size={16} /> },
        { id: 'pulse', label: 'Pulse', icon: <Activity size={16} /> },
        { id: 'spin', label: 'Spin', icon: <RotateCw size={16} /> },
        { id: 'wobble', label: 'Wobble', icon: <Move size={16} /> },
        { id: 'bounce', label: 'Bounce', icon: <Activity size={16} className="rotate-90" /> },
    ];

    return (
        <div className="flex flex-col gap-4">
            {/* Animation Control */}
            <div className="bg-white/40 backdrop-blur-md rounded-2xl shadow-sm border border-cream-dark p-4">
                <h3 className="text-sm font-bold text-bronze-text mb-3 flex items-center gap-2">
                    <Activity size={16} className="text-primary" />
                    {t('animator.animation')}
                </h3>
                <div className="grid grid-cols-3 gap-2">
                    {animations.map((anim) => (
                        <button
                            key={anim.id}
                            onClick={() => onUpdateLayer(selectedLayer.id, { animation: anim.id as AnimationType })}
                            className={`p-2 rounded-lg border flex flex-col items-center gap-1 transition-all ${selectedLayer.animation === anim.id
                                ? 'border-primary bg-primary/10 text-primary'
                                : 'border-cream-dark/50 hover:border-primary/50 text-bronze-light hover:text-bronze-text hover:bg-cream-light'
                                }`}
                        >
                            {anim.icon}
                            <span className="text-[10px] font-bold uppercase">{anim.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Transform Controls */}
            <div className="bg-white/40 backdrop-blur-md rounded-2xl shadow-sm border border-cream-dark p-4">
                <h3 className="text-sm font-bold text-bronze-text mb-3 flex items-center gap-2">
                    <Maximize size={16} className="text-secondary" />
                    {t('animator.transform')}
                </h3>

                <div className="space-y-4">
                    <div className="flex items-center gap-2">
                        <label className="text-xs font-bold w-24 text-bronze-light">{t('animator.scale')}</label>
                        <input
                            type="range"
                            min="0.1"
                            max="3"
                            step="0.1"
                            value={selectedLayer.scale}
                            onChange={(e) => onUpdateLayer(selectedLayer.id, { scale: parseFloat(e.target.value) })}
                            className="flex-1 accent-primary h-2 bg-cream-medium rounded-lg appearance-none cursor-pointer"
                        />
                        <span className="text-xs w-8 text-right text-bronze-text font-mono">{selectedLayer.scale.toFixed(1)}x</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <label className="text-xs font-bold w-24 text-bronze-light">{t('animator.rotate')}</label>
                        <input
                            type="range"
                            min="-180"
                            max="180"
                            step="5"
                            value={selectedLayer.rotation}
                            onChange={(e) => onUpdateLayer(selectedLayer.id, { rotation: parseInt(e.target.value) })}
                            className="flex-1 accent-primary h-2 bg-cream-medium rounded-lg appearance-none cursor-pointer"
                        />
                        <span className="text-xs w-8 text-right text-bronze-text font-mono">{selectedLayer.rotation}°</span>
                    </div>
                </div>
            </div>

            {/* Content Controls (Text only) */}
            {selectedLayer.type === 'text' && (
                <div className="bg-white/40 backdrop-blur-md rounded-2xl shadow-sm border border-cream-dark p-4">
                    <h3 className="text-sm font-bold text-bronze-text mb-3 flex items-center gap-2">
                        <Type size={16} className="text-primary" />
                        {t('animator.textStyle')}
                    </h3>
                    <input
                        type="text"
                        value={selectedLayer.content}
                        onChange={(e) => onUpdateLayer(selectedLayer.id, { content: e.target.value })}
                        className="w-full border border-cream-dark rounded p-2 text-sm mb-2 bg-cream-light text-bronze-text focus:border-primary outline-none"
                    />

                    {/* Font Family Control */}
                    <div className="mb-3 border-b border-cream-dark/50 pb-3">
                        <div className="flex items-center justify-between mb-2">
                            <label className="text-xs font-bold flex items-center gap-1 text-bronze-light"><Type size={12} /> {t('animator.font')}</label>
                            <label className="cursor-pointer bg-cream-light hover:bg-cream-medium text-bronze-text px-2 py-1 rounded text-[10px] flex items-center gap-1 transition-colors border border-cream-dark">
                                <Upload size={10} /> {t('animator.uploadFont')}
                                <input
                                    type="file"
                                    accept=".ttf,.otf,.woff,.woff2"
                                    className="hidden"
                                    onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) {
                                            const fontName = `CustomFont_${Date.now()}`;
                                            const reader = new FileReader();
                                            reader.readAsArrayBuffer(file);
                                            reader.onload = (ev) => {
                                                if (ev.target?.result) {
                                                    const font = new FontFace(fontName, ev.target.result);
                                                    font.load().then((loadedFont) => {
                                                        document.fonts.add(loadedFont);
                                                        onUpdateLayer(selectedLayer.id, { fontFamily: fontName });
                                                    });
                                                }
                                            };
                                        }
                                        e.target.value = '';
                                    }}
                                />
                            </label>
                        </div>
                        <select
                            value={selectedLayer.fontFamily || 'sans-serif'}
                            onChange={(e) => onUpdateLayer(selectedLayer.id, { fontFamily: e.target.value })}
                            className="w-full text-xs p-2 border border-cream-dark rounded bg-cream-light text-bronze-text outline-none focus:border-primary"
                        >
                            <option value="sans-serif">Sans Serif</option>
                            <option value="serif">Serif</option>
                            <option value="cursive">Cursive</option>
                            <option value="monospace">Monospace</option>
                            <option value="Gen Jyuu Gothic">Gen Jyuu Gothic</option>
                            <option value="Noto Sans TC">Noto Sans TC</option>
                            {/* If the current font is not one of the standard ones, list it as Custom */}
                            {!['sans-serif', 'serif', 'cursive', 'monospace', 'Gen Jyuu Gothic', 'Noto Sans TC'].includes(selectedLayer.fontFamily || '') && (
                                <option value={selectedLayer.fontFamily}>{selectedLayer.fontFamily} (Custom)</option>
                            )}
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-2 mb-2">
                        <div className="flex items-center gap-2">
                            <input type="color" value={selectedLayer.color || '#000000'} onChange={(e) => onUpdateLayer(selectedLayer.id, { color: e.target.value })} className="h-8 w-8 rounded cursor-pointer" />
                            <span className="text-xs text-bronze-light">{t('animator.color')}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <input type="color" value={selectedLayer.strokeColor || '#ffffff'} onChange={(e) => onUpdateLayer(selectedLayer.id, { strokeColor: e.target.value })} className="h-8 w-8 rounded cursor-pointer" />
                            <span className="text-xs text-bronze-light">{t('animator.stroke')}</span>
                        </div>
                    </div>

                    {/* Font Size Slider */}
                    <div className="flex items-center gap-2 mb-2">
                        <label className="text-xs font-bold w-24 text-bronze-light">{t('animator.size')}</label>
                        <input
                            type="range"
                            min="10"
                            max="100"
                            value={selectedLayer.fontSize}
                            onChange={(e) => onUpdateLayer(selectedLayer.id, { fontSize: parseInt(e.target.value) })}
                            className="flex-1 accent-primary h-2 bg-cream-medium rounded-lg appearance-none cursor-pointer"
                        />
                        <span className="text-xs w-6 text-right text-bronze-text font-mono">{selectedLayer.fontSize}</span>
                    </div>

                    {/* Stroke Width Slider */}
                    <div className="flex items-center gap-2 mb-3">
                        <label className="text-xs font-bold w-24 text-bronze-light">{t('animator.strokeWidth')}</label>
                        <input
                            type="range"
                            min="0"
                            max="10"
                            step="0.5"
                            value={selectedLayer.strokeWidth || 0}
                            onChange={(e) => onUpdateLayer(selectedLayer.id, { strokeWidth: parseFloat(e.target.value) })}
                            className="flex-1 accent-primary h-2 bg-cream-medium rounded-lg appearance-none cursor-pointer"
                        />
                        <span className="text-xs w-6 text-right text-bronze-text font-mono">{selectedLayer.strokeWidth || 0}</span>
                    </div>

                    {/* Double Stroke */}
                    <div className="pt-3 border-t border-cream-dark/50">
                        <div className="flex items-center justify-between mb-2">
                            <label className="text-xs font-bold text-bronze-light">{t('animator.doubleStroke')}</label>
                            <input type="color" value={selectedLayer.doubleStrokeColor || '#000000'} onChange={(e) => onUpdateLayer(selectedLayer.id, { doubleStrokeColor: e.target.value })} className="h-6 w-6 rounded cursor-pointer" />
                        </div>
                        <div className="flex items-center gap-2">
                            <label className="text-xs font-bold w-24 text-bronze-light">{t('animator.width')}</label>
                            <input
                                type="range"
                                min="0"
                                max="10"
                                step="0.5"
                                value={selectedLayer.doubleStrokeWidth || 0}
                                onChange={(e) => onUpdateLayer(selectedLayer.id, { doubleStrokeWidth: parseFloat(e.target.value) })}
                                className="flex-1 accent-primary h-2 bg-cream-medium rounded-lg appearance-none cursor-pointer"
                            />
                            <span className="text-xs w-6 text-right text-bronze-text font-mono">{selectedLayer.doubleStrokeWidth || 0}</span>
                        </div>
                    </div>

                </div>
            )}

            {/* Delete Action */}
            <button
                onClick={() => onDeleteLayer(selectedLayer.id)}
                className="w-full py-3 bg-secondary/10 text-secondary rounded-xl font-bold hover:bg-secondary/20 flex items-center justify-center gap-2 transition-all mt-2"
            >
                <Trash2 size={16} />
                {t('animator.deleteLayer')}
            </button>
        </div>
    );
};

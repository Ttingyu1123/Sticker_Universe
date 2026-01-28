import React from 'react';
import { useTranslation } from 'react-i18next';
import { Layer, AnimationType } from '../types';
import { Activity, RotateCw, Move, Type, Trash2, Maximize, RotateCcw } from 'lucide-react';
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
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 text-center text-slate-400">
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
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4">
                <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
                    <Activity size={16} className="text-violet-500" />
                    Animation
                </h3>
                <div className="grid grid-cols-3 gap-2">
                    {animations.map((anim) => (
                        <button
                            key={anim.id}
                            onClick={() => onUpdateLayer(selectedLayer.id, { animation: anim.id as AnimationType })}
                            className={`p-2 rounded-lg border flex flex-col items-center gap-1 transition-all ${selectedLayer.animation === anim.id
                                ? 'border-violet-500 bg-violet-50 text-violet-700'
                                : 'border-slate-100 hover:border-slate-300 text-slate-600'
                                }`}
                        >
                            {anim.icon}
                            <span className="text-[10px] font-bold uppercase">{anim.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Transform Controls */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4">
                <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
                    <Maximize size={16} className="text-blue-500" />
                    Transform
                </h3>

                <div className="space-y-4">
                    <div className="flex items-center gap-2">
                        <label className="text-xs font-bold w-12">Scale</label>
                        <input
                            type="range"
                            min="0.1"
                            max="3"
                            step="0.1"
                            value={selectedLayer.scale}
                            onChange={(e) => onUpdateLayer(selectedLayer.id, { scale: parseFloat(e.target.value) })}
                            className="flex-1"
                        />
                        <span className="text-xs w-8 text-right">{selectedLayer.scale.toFixed(1)}x</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <label className="text-xs font-bold w-12">Rotate</label>
                        <input
                            type="range"
                            min="-180"
                            max="180"
                            step="5"
                            value={selectedLayer.rotation}
                            onChange={(e) => onUpdateLayer(selectedLayer.id, { rotation: parseInt(e.target.value) })}
                            className="flex-1"
                        />
                        <span className="text-xs w-8 text-right">{selectedLayer.rotation}°</span>
                    </div>
                </div>
            </div>

            {/* Content Controls (Text only) */}
            {selectedLayer.type === 'text' && (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4">
                    <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
                        <Type size={16} className="text-emerald-500" />
                        Text Style
                    </h3>
                    <input
                        type="text"
                        value={selectedLayer.content}
                        onChange={(e) => onUpdateLayer(selectedLayer.id, { content: e.target.value })}
                        className="w-full border rounded p-2 text-sm mb-2"
                    />
                    <div className="flex items-center gap-2 mb-2">
                        <input type="color" value={selectedLayer.color} onChange={(e) => onUpdateLayer(selectedLayer.id, { color: e.target.value })} />
                        <span className="text-xs">Color</span>
                    </div>
                    {/* Font Size Slider */}
                    <div className="flex items-center gap-2">
                        <label className="text-xs font-bold w-8">Size</label>
                        <input
                            type="range"
                            min="10"
                            max="100"
                            value={selectedLayer.fontSize}
                            onChange={(e) => onUpdateLayer(selectedLayer.id, { fontSize: parseInt(e.target.value) })}
                            className="flex-1"
                        />
                        <span className="text-xs w-6">{selectedLayer.fontSize}</span>
                    </div>

                </div>
            )}

            {/* Delete Action */}
            <button
                onClick={() => onDeleteLayer(selectedLayer.id)}
                className="w-full py-3 bg-red-50 text-red-600 rounded-xl font-bold hover:bg-red-100 flex items-center justify-center gap-2 transition-all mt-2"
            >
                <Trash2 size={16} />
                Delete Layer
            </button>
        </div>
    );
};

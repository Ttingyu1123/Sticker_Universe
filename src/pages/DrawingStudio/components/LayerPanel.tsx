import React, { MutableRefObject } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowDown, ArrowUp, Copy, Eye, EyeOff, Layers, Lock, Plus, Trash2, Unlock } from 'lucide-react';
import type { BlendMode, LayerImageObject, LayerMeta, TransformRect } from '../types';

const CANVAS_PRESETS = [
    { label: '1024 x 1024', width: 1024, height: 1024 },
    { label: '1200 x 1200', width: 1200, height: 1200 },
    { label: '1200 x 1600', width: 1200, height: 1600 },
    { label: '1600 x 1200', width: 1600, height: 1200 },
    { label: '1920 x 1080', width: 1920, height: 1080 },
];

const BLENDS: { value: BlendMode; key: string; fallback: string }[] = [
    { value: 'source-over', key: 'sourceOver', fallback: 'Normal' },
    { value: 'multiply', key: 'multiply', fallback: 'Multiply' },
    { value: 'screen', key: 'screen', fallback: 'Screen' },
    { value: 'overlay', key: 'overlay', fallback: 'Overlay' },
    { value: 'darken', key: 'darken', fallback: 'Darken' },
    { value: 'lighten', key: 'lighten', fallback: 'Lighten' },
];

interface LayerPanelProps {
    layers: LayerMeta[];
    activeLayerId: string;
    layerImages: Record<string, LayerImageObject | null>;
    canvasSize: { width: number; height: number };
    activeLayer: LayerMeta | undefined;
    activeLayerImage: LayerImageObject | null;
    activeLayerHasFill: boolean;
    activeLayerFillRect: TransformRect | null;
    layerLimitReached: boolean;
    customLayerWidth: string;
    customLayerHeight: string;
    customCanvasWidth: string;
    customCanvasHeight: string;
    zoom: number;
    fitCanvasToImport: boolean;
    layerCanvasesRef: MutableRefObject<Record<string, HTMLCanvasElement>>;
    setLayers: React.Dispatch<React.SetStateAction<LayerMeta[]>>;
    setActiveLayerId: (id: string) => void;
    setCanvasSize: (size: { width: number; height: number }) => void;
    setCustomLayerWidth: (v: string) => void;
    setCustomLayerHeight: (v: string) => void;
    setCustomCanvasWidth: (v: string) => void;
    setCustomCanvasHeight: (v: string) => void;
    setZoom: (v: number) => void;
    setFitCanvasToImport: (v: boolean) => void;
    onAddLayer: () => void;
    onDeleteLayer: () => void;
    onDuplicateLayer: () => void;
    onRenameLayer: (id: string) => void;
    onMoveLayer: (id: string, dir: -1 | 1) => void;
    onUpdateActiveImageScale: (v: number) => void;
    onUpdateActiveImageWidth: (v: number) => void;
    onUpdateActiveImageHeight: (v: number) => void;
    onUpdateActiveImageBgColor: (color: string) => void;
    onApplyCustomLayerSize: () => void;
    onApplyCustomCanvasSize: () => void;
    onApplyFitCanvasToActiveImage: () => void;
}

export const LayerPanel: React.FC<LayerPanelProps> = ({
    layers, activeLayerId, canvasSize, activeLayer, activeLayerImage,
    activeLayerHasFill, activeLayerFillRect, layerLimitReached,
    customLayerWidth, customLayerHeight, customCanvasWidth, customCanvasHeight,
    zoom, fitCanvasToImport, layerCanvasesRef,
    setLayers, setActiveLayerId, setCanvasSize,
    setCustomLayerWidth, setCustomLayerHeight, setCustomCanvasWidth, setCustomCanvasHeight,
    setZoom, setFitCanvasToImport,
    onAddLayer, onDeleteLayer, onDuplicateLayer, onRenameLayer, onMoveLayer,
    onUpdateActiveImageScale, onUpdateActiveImageWidth, onUpdateActiveImageHeight,
    onUpdateActiveImageBgColor, onApplyCustomLayerSize,
    onApplyCustomCanvasSize, onApplyFitCanvasToActiveImage,
}) => {
    const { t } = useTranslation();

    return (
        <>
            {/* Canvas size & zoom */}
            <div className="rounded-xl border border-cream-dark p-3 bg-white">
                <div className="text-xs font-black uppercase text-bronze-light mb-2">{t('drawing.canvas', { defaultValue: '畫布' })}</div>
                <label className="block text-xs font-bold text-bronze-light mb-2">{t('drawing.preset', { defaultValue: '預設' })}</label>
                <select
                    className="w-full border rounded-lg px-2 py-2 text-sm mb-3"
                    value={`${canvasSize.width}x${canvasSize.height}`}
                    onChange={(e) => { const [w, h] = e.target.value.split('x').map((v) => parseInt(v, 10)); setCanvasSize({ width: w, height: h }); }}
                >
                    {CANVAS_PRESETS.map((p) => <option key={p.label} value={`${p.width}x${p.height}`}>{p.label}</option>)}
                </select>
                <div className="grid grid-cols-2 gap-2 mb-2">
                    <label className="text-[10px] text-bronze-light">
                        {t('drawing.customWidth', { defaultValue: '自訂寬度' })}
                        <input type="number" min={24} max={8000} value={customCanvasWidth} onChange={(e) => setCustomCanvasWidth(e.target.value)} className="w-full mt-1 border rounded px-2 py-1.5 text-xs" />
                    </label>
                    <label className="text-[10px] text-bronze-light">
                        {t('drawing.customHeight', { defaultValue: '自訂高度' })}
                        <input type="number" min={24} max={8000} value={customCanvasHeight} onChange={(e) => setCustomCanvasHeight(e.target.value)} className="w-full mt-1 border rounded px-2 py-1.5 text-xs" />
                    </label>
                </div>
                <button onClick={onApplyCustomCanvasSize} className="w-full mb-3 px-2 py-1.5 rounded border text-xs font-bold bg-cream-light hover:bg-cream">
                    {t('drawing.applyCanvasSize', { defaultValue: '套用畫布尺寸' })}
                </button>
                <label className="flex items-center justify-between text-xs font-bold text-bronze-light mb-2">
                    {t('drawing.fitCanvasToImport', { defaultValue: '匹配匯入圖片尺寸' })}
                    <input
                        type="checkbox"
                        checked={fitCanvasToImport}
                        onChange={(e) => { const checked = e.target.checked; setFitCanvasToImport(checked); if (checked) onApplyFitCanvasToActiveImage(); }}
                    />
                </label>
                <label className="block text-xs font-bold text-bronze-light">
                    {t('drawing.zoom', { defaultValue: '縮放' })}: {zoom}%
                    <input type="range" min={25} max={200} value={zoom} onChange={(e) => setZoom(parseInt(e.target.value, 10))} className="w-full" />
                </label>
            </div>

            {/* Layers */}
            <div className="rounded-xl border border-cream-dark p-3 bg-white">
                <div className="flex items-center justify-between mb-1">
                    <div className="text-xs font-black uppercase text-bronze-light inline-flex items-center gap-1">
                        <Layers size={14} />{t('drawing.layers', { defaultValue: '圖層' })}
                    </div>
                    <div className="flex gap-1">
                        <button onClick={onAddLayer} disabled={layerLimitReached} title={layerLimitReached ? t('drawing.layerLimitReached', { defaultValue: '已達圖層上限 (30 層)' }) : t('drawing.addLayer', { defaultValue: '新增圖層' })} className="p-1.5 rounded border bg-cream-light disabled:opacity-40"><Plus size={14} /></button>
                        <button onClick={onDuplicateLayer} className="p-1.5 rounded border bg-cream-light"><Copy size={14} /></button>
                        <button onClick={onDeleteLayer} className="p-1.5 rounded border bg-cream-light text-red-600"><Trash2 size={14} /></button>
                    </div>
                </div>
                <div className="text-[10px] text-bronze-light mb-2">{t('drawing.layerLimitHint', { defaultValue: '建議 20 層內，系統上限 30 層' })}</div>
                {activeLayer && (
                    <label className="flex items-center justify-between text-[10px] text-bronze-light mb-2">
                        {t('drawing.layerFillColor', { defaultValue: '圖層填色' })}
                        <span className="inline-flex items-center gap-2">
                            <input type="color" value={activeLayer.fillColor && activeLayer.fillColor !== 'transparent' ? activeLayer.fillColor : '#ffffff'} onChange={(e) => setLayers((prev) => prev.map((x) => x.id === activeLayer.id ? { ...x, fillColor: e.target.value } : x))} className="w-6 h-6 rounded border" />
                            <button className="px-1.5 py-0.5 rounded border bg-white" onClick={() => setLayers((prev) => prev.map((x) => x.id === activeLayer.id ? { ...x, fillColor: 'transparent' } : x))}>{t('drawing.transparent', { defaultValue: '透明' })}</button>
                        </span>
                    </label>
                )}
                {activeLayerImage && (
                    <label className="block text-[10px] text-bronze-light mb-2">
                        {t('drawing.imageScale', { defaultValue: '圖片縮放' })}: {Math.round((activeLayerImage.width / Math.max(1, canvasSize.width)) * 100)}%
                        <input type="range" min={5} max={300} value={Math.round((activeLayerImage.width / Math.max(1, canvasSize.width)) * 100)} onChange={(e) => onUpdateActiveImageScale(parseInt(e.target.value, 10))} className="w-full" />
                    </label>
                )}
                {activeLayerImage && (
                    <label className="block text-[10px] text-bronze-light mb-2">
                        {t('drawing.imageWidth', { defaultValue: '圖片寬度' })}: {Math.round((activeLayerImage.width / Math.max(1, canvasSize.width)) * 100)}%
                        <input type="range" min={5} max={300} value={Math.round((activeLayerImage.width / Math.max(1, canvasSize.width)) * 100)} onChange={(e) => onUpdateActiveImageWidth(parseInt(e.target.value, 10))} className="w-full" />
                    </label>
                )}
                {activeLayerImage && (
                    <label className="block text-[10px] text-bronze-light mb-2">
                        {t('drawing.imageHeight', { defaultValue: '圖片高度' })}: {Math.round((activeLayerImage.height / Math.max(1, canvasSize.height)) * 100)}%
                        <input type="range" min={5} max={300} value={Math.round((activeLayerImage.height / Math.max(1, canvasSize.height)) * 100)} onChange={(e) => onUpdateActiveImageHeight(parseInt(e.target.value, 10))} className="w-full" />
                    </label>
                )}
                {activeLayerImage && (
                    <label className="flex items-center justify-between text-[10px] text-bronze-light mb-2">
                        {t('drawing.imageBgColor', { defaultValue: '圖層圖片底色' })}
                        <span className="inline-flex items-center gap-2">
                            <input type="color" value={activeLayerImage.bgColor && activeLayerImage.bgColor !== 'transparent' ? activeLayerImage.bgColor : '#ffffff'} onChange={(e) => onUpdateActiveImageBgColor(e.target.value)} className="w-6 h-6 rounded border" />
                            <button className="px-1.5 py-0.5 rounded border bg-white" onClick={() => onUpdateActiveImageBgColor('transparent')}>{t('drawing.transparent', { defaultValue: '透明' })}</button>
                        </span>
                    </label>
                )}
                {(activeLayerImage || (activeLayerHasFill && activeLayerFillRect)) && (
                    <>
                        <div className="grid grid-cols-2 gap-2 mb-2">
                            <label className="text-[10px] text-bronze-light">
                                {t('drawing.layerWidthPx', { defaultValue: '圖層寬度 (px)' })}
                                <input type="number" min={1} value={customLayerWidth} onChange={(e) => setCustomLayerWidth(e.target.value)} className="w-full mt-1 border rounded px-2 py-1 text-[11px]" />
                            </label>
                            <label className="text-[10px] text-bronze-light">
                                {t('drawing.layerHeightPx', { defaultValue: '圖層高度 (px)' })}
                                <input type="number" min={1} value={customLayerHeight} onChange={(e) => setCustomLayerHeight(e.target.value)} className="w-full mt-1 border rounded px-2 py-1 text-[11px]" />
                            </label>
                        </div>
                        <button onClick={onApplyCustomLayerSize} className="w-full mb-2 px-2 py-1.5 rounded border text-xs font-bold bg-cream-light hover:bg-cream">
                            {t('drawing.applyLayerSize', { defaultValue: '套用圖層尺寸' })}
                        </button>
                    </>
                )}
                <div className="text-[10px] text-bronze-light mb-2">{t('drawing.transformHint', { defaultValue: '變形模式：拖曳物件可移動，拖曳右下角可縮放。' })}</div>
                <div className="space-y-2">
                    {layers.map((l, i) => (
                        <div key={l.id} onClick={() => setActiveLayerId(l.id)} className={`border rounded-lg p-2 cursor-pointer relative ${activeLayerId === l.id ? 'border-primary bg-primary/10 ring-2 ring-primary/30 shadow-sm' : 'border-cream-dark bg-cream-light/50'}`}>
                            {activeLayerId === l.id && <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-l-lg" />}
                            <div className="flex items-center gap-2">
                                <div className="w-9 h-9 rounded border overflow-hidden bg-white shrink-0">
                                    {layerCanvasesRef.current[l.id] && <img src={layerCanvasesRef.current[l.id].toDataURL('image/png')} alt={l.name} className="w-full h-full object-cover" />}
                                </div>
                                <button onClick={(e) => { e.stopPropagation(); setLayers((prev) => prev.map((x) => x.id === l.id ? { ...x, visible: !x.visible } : x)); }} className="text-bronze-light" title={l.visible ? t('drawing.hideLayer', { defaultValue: '隱藏圖層' }) : t('drawing.showLayer', { defaultValue: '顯示圖層' })}>
                                    {l.visible ? <Eye size={14} /> : <EyeOff size={14} />}
                                </button>
                                <button onClick={(e) => { e.stopPropagation(); setLayers((prev) => prev.map((x) => x.id === l.id ? { ...x, locked: !x.locked } : x)); }} className="text-bronze-light" title={l.locked ? t('drawing.unlock', { defaultValue: '解鎖' }) : t('drawing.lock', { defaultValue: '鎖定' })}>
                                    {l.locked ? <Lock size={14} /> : <Unlock size={14} />}
                                </button>
                                <button onClick={(e) => { e.stopPropagation(); setLayers((prev) => prev.map((x) => x.id === l.id ? { ...x, maskEnabled: !x.maskEnabled } : x)); }} className={`text-[10px] font-black px-1.5 py-0.5 rounded border ${l.maskEnabled ? 'text-primary border-primary/40 bg-primary/10' : 'text-bronze-light border-cream-dark bg-white'}`} title={t('drawing.maskToggle', { defaultValue: '切換遮罩' })}>
                                    {t('drawing.maskShort', { defaultValue: '遮罩' })}
                                </button>
                                <button className="text-xs font-bold flex-1 text-left truncate inline-flex items-center gap-1" onClick={(e) => { e.stopPropagation(); setActiveLayerId(l.id); }}>
                                    <span className={activeLayerId === l.id ? 'text-primary' : ''}>{l.name}</span>
                                    {activeLayerId === l.id && (
                                        <span className="px-1.5 py-0.5 rounded bg-primary text-white text-[9px] font-black uppercase tracking-wide">
                                            {t('drawing.activeLayer', { defaultValue: '目前' })}
                                        </span>
                                    )}
                                </button>
                                <button onClick={(e) => { e.stopPropagation(); onRenameLayer(l.id); }} className="text-[10px] font-bold px-1.5 py-0.5 rounded border border-cream-dark bg-white text-bronze-light" title={t('drawing.renameLayer', { defaultValue: '重新命名圖層' })}>
                                    {t('drawing.renameShort', { defaultValue: '重新命名' })}
                                </button>
                                <button disabled={i === 0} onClick={(e) => { e.stopPropagation(); onMoveLayer(l.id, -1); }} className="text-bronze-light disabled:opacity-30" title={t('drawing.moveUp', { defaultValue: '上移' })}><ArrowUp size={12} /></button>
                                <button disabled={i === layers.length - 1} onClick={(e) => { e.stopPropagation(); onMoveLayer(l.id, 1); }} className="text-bronze-light disabled:opacity-30" title={t('drawing.moveDown', { defaultValue: '下移' })}><ArrowDown size={12} /></button>
                            </div>
                            <label className="block text-[10px] text-bronze-light mt-1">
                                {t('drawing.opacity', { defaultValue: '透明度' })} {(l.opacity * 100).toFixed(0)}%
                                <input type="range" min={0} max={100} value={Math.round(l.opacity * 100)} onChange={(e) => { const v = parseInt(e.target.value, 10) / 100; setLayers((prev) => prev.map((x) => x.id === l.id ? { ...x, opacity: v } : x)); }} onClick={(e) => e.stopPropagation()} className="w-full" />
                            </label>
                            <label className="block text-[10px] text-bronze-light mt-1">
                                {t('drawing.blendMode', { defaultValue: '混合模式' })}
                                <select className="w-full mt-1 border rounded px-1 py-1 text-[11px] bg-white" value={l.blendMode} onChange={(e) => { const v = e.target.value as BlendMode; setLayers((prev) => prev.map((x) => x.id === l.id ? { ...x, blendMode: v } : x)); }} onClick={(e) => e.stopPropagation()}>
                                    {BLENDS.map((b) => <option key={b.value} value={b.value}>{t(`drawing.blendModes.${b.key}`, { defaultValue: b.fallback })}</option>)}
                                </select>
                            </label>
                        </div>
                    ))}
                </div>
            </div>
        </>
    );
};

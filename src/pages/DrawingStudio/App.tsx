
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowDown, ArrowUp, Brush, Copy, Download, Eraser, Eye, EyeOff, Layers, Lock, Move3D, Pipette, Plus, Redo2, Save, Trash2, Undo2, Unlock, Upload } from 'lucide-react';

type BrushType = 'pen' | 'pencil' | 'marker' | 'airbrush' | 'eraser';
type BlendMode = GlobalCompositeOperation;

interface LayerMeta {
  id: string;
  name: string;
  visible: boolean;
  locked: boolean;
  opacity: number;
  blendMode: BlendMode;
}
interface Point { x: number; y: number; pressure: number; }
interface Snapshot { layers: Record<string, string>; }
interface BrushPreset {
  id: string; name: string; brushType: BrushType; brushColor: string; brushSize: number; brushOpacity: number;
  pressureEnabled: boolean; pressureCurve: number; smoothing: number; spacing: number;
}

const CANVAS_PRESETS = [
  { label: '1024 x 1024', width: 1024, height: 1024 },
  { label: '1200 x 1200', width: 1200, height: 1200 },
  { label: '1200 x 1600', width: 1200, height: 1600 },
  { label: '1600 x 1200', width: 1600, height: 1200 },
  { label: '1920 x 1080', width: 1920, height: 1080 },
];
const BRUSH_PRESETS: { id: BrushType; size: number; opacity: number }[] = [
  { id: 'pen', size: 6, opacity: 1 },
  { id: 'pencil', size: 4, opacity: 0.7 },
  { id: 'marker', size: 18, opacity: 0.35 },
  { id: 'airbrush', size: 22, opacity: 0.2 },
  { id: 'eraser', size: 24, opacity: 1 },
];
const BLENDS: { value: BlendMode; key: string; fallback: string }[] = [
  { value: 'source-over', key: 'sourceOver', fallback: 'Normal' },
  { value: 'multiply', key: 'multiply', fallback: 'Multiply' },
  { value: 'screen', key: 'screen', fallback: 'Screen' },
  { value: 'overlay', key: 'overlay', fallback: 'Overlay' },
  { value: 'darken', key: 'darken', fallback: 'Darken' },
  { value: 'lighten', key: 'lighten', fallback: 'Lighten' },
];
const MAX_HISTORY = 25;
const PRESET_KEY = 'drawing-studio-brush-presets-v1';
const makeLayerId = () => `layer-${Math.random().toString(36).slice(2, 10)}`;
const makePresetId = () => `preset-${Math.random().toString(36).slice(2, 10)}`;

const loadImage = (dataUrl: string) => new Promise<HTMLImageElement>((resolve, reject) => {
  const img = new Image(); img.onload = () => resolve(img); img.onerror = reject; img.src = dataUrl;
});

export const DrawingStudioApp: React.FC = () => {
  const { t } = useTranslation();
  const brushTypeLabel = (id: BrushType) => t(`drawing.brushTypes.${id}`, { defaultValue: id });

  const [canvasSize, setCanvasSize] = useState({ width: 1200, height: 1200 });
  const [zoom, setZoom] = useState(100);
  const [layers, setLayers] = useState<LayerMeta[]>([{ id: makeLayerId(), name: `${t('drawing.layerLabel', { defaultValue: 'Layer' })} 1`, visible: true, locked: false, opacity: 1, blendMode: 'source-over' }]);
  const [activeLayerId, setActiveLayerId] = useState('');

  const [brushType, setBrushType] = useState<BrushType>('pen');
  const [brushColor, setBrushColor] = useState('#111111');
  const [brushSize, setBrushSize] = useState(6);
  const [brushOpacity, setBrushOpacity] = useState(1);
  const [pressureEnabled, setPressureEnabled] = useState(true);
  const [pressureCurve, setPressureCurve] = useState(1.4);
  const [smoothing, setSmoothing] = useState(0.45);
  const [spacing, setSpacing] = useState(15);
  const [eyedropper, setEyedropper] = useState(false);
  const [customPresets, setCustomPresets] = useState<BrushPreset[]>([]);

  const [history, setHistory] = useState<Snapshot[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  const displayRef = useRef<HTMLCanvasElement>(null);
  const layerCanvasesRef = useRef<Record<string, HTMLCanvasElement>>({});
  const drawingRef = useRef({
    active: false,
    pointerId: null as number | null,
    layerId: '' as string,
    lastSmooth: null as Point | null
  });

  const activeLayer = useMemo(() => layers.find((l) => l.id === activeLayerId), [layers, activeLayerId]);
  const activeLocked = !!activeLayer?.locked;

  useEffect(() => { if (!activeLayerId && layers[0]) setActiveLayerId(layers[0].id); }, [activeLayerId, layers]);
  useEffect(() => {
    try { const raw = localStorage.getItem(PRESET_KEY); if (raw) { const arr = JSON.parse(raw); if (Array.isArray(arr)) setCustomPresets(arr); } } catch {}
  }, []);

  const savePresetList = useCallback((next: BrushPreset[]) => {
    setCustomPresets(next);
    try { localStorage.setItem(PRESET_KEY, JSON.stringify(next)); } catch {}
  }, []);
  const ensureLayerCanvas = useCallback((layerId: string) => {
    const existing = layerCanvasesRef.current[layerId];
    if (existing && existing.width === canvasSize.width && existing.height === canvasSize.height) return existing;
    const c = document.createElement('canvas'); c.width = canvasSize.width; c.height = canvasSize.height;
    if (existing) { const ctx = c.getContext('2d'); if (ctx) ctx.drawImage(existing, 0, 0, existing.width, existing.height, 0, 0, c.width, c.height); }
    layerCanvasesRef.current[layerId] = c; return c;
  }, [canvasSize.height, canvasSize.width]);

  const compositeDisplay = useCallback(() => {
    const display = displayRef.current; if (!display) return;
    if (display.width !== canvasSize.width || display.height !== canvasSize.height) { display.width = canvasSize.width; display.height = canvasSize.height; }
    const ctx = display.getContext('2d'); if (!ctx) return;
    ctx.clearRect(0, 0, display.width, display.height);
    const tile = 24;
    for (let y = 0; y < display.height; y += tile) for (let x = 0; x < display.width; x += tile) { ctx.fillStyle = ((x / tile + y / tile) % 2) === 0 ? '#f3f4f6' : '#e5e7eb'; ctx.fillRect(x, y, tile, tile); }
    layers.slice().reverse().forEach((layer) => {
      if (!layer.visible) return;
      const lc = ensureLayerCanvas(layer.id);
      ctx.save(); ctx.globalAlpha = layer.opacity; ctx.globalCompositeOperation = layer.blendMode; ctx.drawImage(lc, 0, 0); ctx.restore();
    });
  }, [canvasSize.height, canvasSize.width, ensureLayerCanvas, layers]);

  useEffect(() => { layers.forEach((l) => ensureLayerCanvas(l.id)); compositeDisplay(); }, [layers, canvasSize, ensureLayerCanvas, compositeDisplay]);

  const captureSnapshot = useCallback((): Snapshot => {
    const snap: Snapshot = { layers: {} }; layers.forEach((l) => { snap.layers[l.id] = ensureLayerCanvas(l.id).toDataURL('image/png'); }); return snap;
  }, [layers, ensureLayerCanvas]);

  const pushSnapshot = useCallback(() => {
    const snap = captureSnapshot();
    setHistory((prev) => {
      const trimmed = historyIndex >= 0 ? prev.slice(0, historyIndex + 1) : prev;
      const next = [...trimmed, snap];
      return next.length > MAX_HISTORY ? next.slice(next.length - MAX_HISTORY) : next;
    });
    setHistoryIndex((prev) => Math.min(prev + 1, MAX_HISTORY - 1));
  }, [captureSnapshot, historyIndex]);

  useEffect(() => { if (history.length === 0) { const s = captureSnapshot(); setHistory([s]); setHistoryIndex(0); } }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const restoreSnapshot = useCallback(async (snapshot: Snapshot) => {
    await Promise.all(layers.map(async (l) => {
      const c = ensureLayerCanvas(l.id); const ctx = c.getContext('2d'); if (!ctx) return;
      ctx.clearRect(0, 0, c.width, c.height); const data = snapshot.layers[l.id]; if (!data) return;
      try { const img = await loadImage(data); ctx.drawImage(img, 0, 0, c.width, c.height); } catch {}
    }));
    compositeDisplay();
  }, [layers, ensureLayerCanvas, compositeDisplay]);

  const undo = async () => { if (historyIndex <= 0) return; const i = historyIndex - 1; setHistoryIndex(i); await restoreSnapshot(history[i]); };
  const redo = async () => { if (historyIndex >= history.length - 1) return; const i = historyIndex + 1; setHistoryIndex(i); await restoreSnapshot(history[i]); };

  const getPoint = (e: React.PointerEvent<HTMLCanvasElement>): Point | null => {
    const c = displayRef.current; if (!c) return null; const r = c.getBoundingClientRect();
    const x = ((e.clientX - r.left) * c.width) / r.width; const y = ((e.clientY - r.top) * c.height) / r.height;
    const raw = e.pressure && e.pressure > 0 ? e.pressure : 0.5; const p = pressureEnabled ? Math.pow(raw, pressureCurve) : 1;
    return { x: Math.max(0, Math.min(c.width, x)), y: Math.max(0, Math.min(c.height, y)), pressure: p };
  };

  const pickColorAt = useCallback((pt: Point) => {
    const c = displayRef.current; const ctx = c?.getContext('2d'); if (!c || !ctx) return;
    const d = ctx.getImageData(Math.floor(pt.x), Math.floor(pt.y), 1, 1).data;
    setBrushColor(`#${[d[0], d[1], d[2]].map((v) => v.toString(16).padStart(2, '0')).join('')}`);
    setBrushOpacity(Math.max(0.05, d[3] / 255)); setEyedropper(false);
  }, []);

  const stampPoint = useCallback((pt: Point, layerId: string) => {
    const lc = ensureLayerCanvas(layerId); if (!lc) return; const ctx = lc.getContext('2d'); if (!ctx) return;
    const size = Math.max(0.5, brushSize * pt.pressure); const a = Math.max(0.02, brushOpacity);
    ctx.save();
    if (brushType === 'eraser') { ctx.globalCompositeOperation = 'destination-out'; ctx.globalAlpha = 1; ctx.fillStyle = '#000'; }
    else { ctx.globalCompositeOperation = 'source-over'; ctx.fillStyle = brushColor; ctx.globalAlpha = brushType === 'marker' ? a * 0.75 : brushType === 'pencil' ? a * 0.7 : a; }
    if (brushType === 'airbrush') {
      const dots = Math.max(8, Math.floor(size * 1.4));
      for (let i = 0; i < dots; i++) { const ang = Math.random() * Math.PI * 2; const r = Math.random() * size; const dot = Math.max(0.6, size * (0.04 + Math.random() * 0.1)); ctx.beginPath(); ctx.arc(pt.x + Math.cos(ang) * r, pt.y + Math.sin(ang) * r, dot, 0, Math.PI * 2); ctx.fill(); }
    } else { ctx.beginPath(); ctx.arc(pt.x, pt.y, size * 0.5, 0, Math.PI * 2); ctx.fill(); }
    ctx.restore();
  }, [brushColor, brushOpacity, brushSize, brushType, ensureLayerCanvas]);

  const drawSegment = useCallback((from: Point, to: Point, layerId: string) => {
    const dx = to.x - from.x, dy = to.y - from.y, dp = to.pressure - from.pressure, dist = Math.hypot(dx, dy);
    const spacingPx = Math.max(0.8, brushSize * (spacing / 100)); const steps = Math.max(1, Math.ceil(dist / spacingPx));
    for (let i = 1; i <= steps; i++) { const tr = i / steps; stampPoint({ x: from.x + dx * tr, y: from.y + dy * tr, pressure: from.pressure + dp * tr }, layerId); }
  }, [brushSize, spacing, stampPoint]);
  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!activeLayerId || activeLocked) return; const p = getPoint(e); if (!p) return;
    if (eyedropper) { pickColorAt(p); return; }
    drawingRef.current.active = true;
    drawingRef.current.pointerId = e.pointerId;
    drawingRef.current.layerId = activeLayerId;
    drawingRef.current.lastSmooth = p;
    stampPoint(p, activeLayerId);
    compositeDisplay();
    (e.currentTarget as HTMLCanvasElement).setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current.active || drawingRef.current.pointerId !== e.pointerId) return;
    const raw = getPoint(e); if (!raw) return;
    const last = drawingRef.current.lastSmooth ?? raw;
    const lerp = 1 - Math.max(0, Math.min(0.95, smoothing));
    const sp: Point = { x: last.x + (raw.x - last.x) * lerp, y: last.y + (raw.y - last.y) * lerp, pressure: last.pressure + (raw.pressure - last.pressure) * lerp };
    drawSegment(last, sp, drawingRef.current.layerId || activeLayerId); drawingRef.current.lastSmooth = sp; compositeDisplay();
  };

  const finishStroke = async (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current.active || drawingRef.current.pointerId !== e.pointerId) return;
    drawingRef.current.active = false; drawingRef.current.pointerId = null; drawingRef.current.layerId = ''; drawingRef.current.lastSmooth = null;
    (e.currentTarget as HTMLCanvasElement).releasePointerCapture(e.pointerId); pushSnapshot();
  };

  const addLayer = () => {
    const next: LayerMeta = { id: makeLayerId(), name: `${t('drawing.layerLabel', { defaultValue: 'Layer' })} ${layers.length + 1}`, visible: true, locked: false, opacity: 1, blendMode: 'source-over' };
    setLayers((prev) => [next, ...prev]); setActiveLayerId(next.id);
  };
  const moveLayer = (id: string, dir: -1 | 1) => setLayers((prev) => { const i = prev.findIndex((l) => l.id === id); const j = i + dir; if (i < 0 || j < 0 || j >= prev.length) return prev; const n = [...prev]; [n[i], n[j]] = [n[j], n[i]]; return n; });
  const deleteLayer = () => { if (layers.length <= 1 || !activeLayerId) return; const next = layers.filter((l) => l.id !== activeLayerId); delete layerCanvasesRef.current[activeLayerId]; setLayers(next); setActiveLayerId(next[0]?.id || ''); pushSnapshot(); };

  const duplicateLayer = () => {
    const src = layers.find((l) => l.id === activeLayerId); if (!src) return;
    const srcCanvas = ensureLayerCanvas(src.id);
    const clone: LayerMeta = { id: makeLayerId(), name: `${src.name} ${t('drawing.copySuffix', { defaultValue: 'Copy' })}`, visible: true, locked: false, opacity: src.opacity, blendMode: src.blendMode };
    const cc = ensureLayerCanvas(clone.id); const ctx = cc.getContext('2d'); if (ctx) ctx.drawImage(srcCanvas, 0, 0);
    setLayers((prev) => [clone, ...prev]); setActiveLayerId(clone.id); pushSnapshot();
  };

  const clearActiveLayer = () => {
    if (activeLocked) return; const c = layerCanvasesRef.current[activeLayerId]; if (!c) return; const ctx = c.getContext('2d'); if (!ctx) return;
    ctx.clearRect(0, 0, c.width, c.height); compositeDisplay(); pushSnapshot();
  };

  const importToActiveLayer = async (file: File) => {
    if (activeLocked) return;
    const dataUrl = await new Promise<string>((resolve, reject) => { const r = new FileReader(); r.onload = () => resolve(r.result as string); r.onerror = reject; r.readAsDataURL(file); });
    const img = await loadImage(dataUrl); const c = ensureLayerCanvas(activeLayerId); const ctx = c.getContext('2d'); if (!ctx) return;
    const scale = Math.min(c.width / img.width, c.height / img.height); const w = img.width * scale, h = img.height * scale; const x = (c.width - w) / 2, y = (c.height - h) / 2;
    ctx.drawImage(img, x, y, w, h); compositeDisplay(); pushSnapshot();
  };

  const exportPng = () => {
    const c = document.createElement('canvas'); c.width = canvasSize.width; c.height = canvasSize.height; const ctx = c.getContext('2d'); if (!ctx) return;
    layers.slice().reverse().forEach((l) => { if (!l.visible) return; const lc = ensureLayerCanvas(l.id); ctx.save(); ctx.globalAlpha = l.opacity; ctx.globalCompositeOperation = l.blendMode; ctx.drawImage(lc, 0, 0); ctx.restore(); });
    const a = document.createElement('a'); a.href = c.toDataURL('image/png'); a.download = `drawing-${Date.now()}.png`; a.click();
  };

  const saveBrushPreset = () => {
    const fallback = `${brushTypeLabel(brushType)} ${customPresets.length + 1}`;
    const name = window.prompt(t('drawing.presetNamePrompt', { defaultValue: 'Preset name' }), fallback)?.trim(); if (!name) return;
    const next: BrushPreset = { id: makePresetId(), name, brushType, brushColor, brushSize, brushOpacity, pressureEnabled, pressureCurve, smoothing, spacing };
    savePresetList([next, ...customPresets].slice(0, 12));
  };
  const applyBrushPreset = (p: BrushPreset) => { setBrushType(p.brushType); setBrushColor(p.brushColor); setBrushSize(p.brushSize); setBrushOpacity(p.brushOpacity); setPressureEnabled(p.pressureEnabled); setPressureCurve(p.pressureCurve); setSmoothing(p.smoothing); setSpacing(p.spacing); };
  const removeBrushPreset = (id: string) => savePresetList(customPresets.filter((p) => p.id !== id));

  const brushSummary = useMemo(() => `${brushTypeLabel(brushType)} · ${brushSize}px · ${(brushOpacity * 100).toFixed(0)}%`, [brushOpacity, brushSize, brushType]);

  return (
    <div className="flex flex-col md:flex-row h-[calc(100dvh-120px)] min-h-[640px] bg-cream-light">
      <main className="flex-1 min-w-0 p-4 md:p-6 border-b md:border-b-0 md:border-r border-cream-dark/50">
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <button onClick={() => void undo()} disabled={historyIndex <= 0} className="px-3 py-2 rounded-lg border bg-white disabled:opacity-40"><Undo2 size={16} /></button>
          <button onClick={() => void redo()} disabled={historyIndex >= history.length - 1} className="px-3 py-2 rounded-lg border bg-white disabled:opacity-40"><Redo2 size={16} /></button>
          <button onClick={clearActiveLayer} disabled={activeLocked} title={activeLocked ? t('drawing.layerLocked', { defaultValue: 'Layer is locked' }) : t('drawing.clearLayer', { defaultValue: 'Clear layer' })} className="px-3 py-2 rounded-lg border bg-white text-red-600 disabled:opacity-40"><Trash2 size={16} /></button>
          <label className="px-3 py-2 rounded-lg border bg-white cursor-pointer inline-flex items-center gap-2"><Upload size={16} /><input type="file" className="hidden" accept="image/*" onChange={(e) => { const f = e.target.files?.[0]; if (f) void importToActiveLayer(f); }} /></label>
          <button onClick={() => setEyedropper((v) => !v)} className={`px-3 py-2 rounded-lg border inline-flex items-center gap-2 ${eyedropper ? 'bg-primary text-white border-primary' : 'bg-white'}`} title={t('drawing.eyedropper', { defaultValue: 'Eyedropper' })}><Pipette size={16} /></button>
          <button onClick={exportPng} className="px-3 py-2 rounded-lg bg-primary text-white inline-flex items-center gap-2"><Download size={16} />PNG</button>
          <div className="ml-auto flex items-center gap-2 text-xs font-bold text-bronze-light"><Move3D size={14} /><span>{brushSummary}</span></div>
        </div>
        <div className="w-full h-[calc(100%-52px)] bg-[#dbe7e8] rounded-2xl border border-cream-dark/50 overflow-auto">
          <div className="sticky top-0 z-10 px-3 py-2">
            <div className="inline-flex items-center gap-2 rounded-lg border border-primary/30 bg-white/85 backdrop-blur px-2.5 py-1.5 text-[11px] font-bold text-bronze-text shadow-sm">
              <span className="text-primary">{t('drawing.activeLayer', { defaultValue: 'Active' })}:</span>
              <span className="max-w-[180px] truncate">{activeLayer?.name || '-'}</span>
              {activeLayer?.locked && (
                <span className="inline-flex items-center gap-1 text-bronze-light">
                  <Lock size={11} />
                  {t('drawing.lock', { defaultValue: 'Lock' })}
                </span>
              )}
            </div>
          </div>
          <div style={{ width: canvasSize.width * (zoom / 100), height: canvasSize.height * (zoom / 100), transformOrigin: 'top left' }}>
            <canvas ref={displayRef} className={`block touch-none ${eyedropper ? 'cursor-crosshair' : ''}`} style={{ width: '100%', height: '100%' }} onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={(e) => void finishStroke(e)} onPointerCancel={(e) => void finishStroke(e)} onPointerLeave={(e) => { if (drawingRef.current.active) void finishStroke(e); }} />
          </div>
        </div>
      </main>

      <aside className="w-full md:w-[360px] bg-white/80 backdrop-blur-md p-4 overflow-y-auto border-l border-cream-dark/50 space-y-4">
        <div className="rounded-xl border border-cream-dark p-3 bg-white">
          <div className="flex items-center justify-between mb-2"><div className="text-xs font-black uppercase text-bronze-light">{t('drawing.brush', { defaultValue: 'Brush' })}</div><button onClick={saveBrushPreset} className="p-1.5 rounded border bg-cream-light" title={t('drawing.savePreset', { defaultValue: 'Save preset' })}><Save size={14} /></button></div>
          <div className="grid grid-cols-3 gap-2 mb-3">{BRUSH_PRESETS.map((p) => <button key={p.id} onClick={() => { setBrushType(p.id); setBrushSize(p.size); setBrushOpacity(p.opacity); }} className={`px-2 py-2 text-xs rounded-lg border font-bold ${brushType === p.id ? 'bg-primary text-white border-primary' : 'bg-cream-light border-cream-dark text-bronze-light'}`}>{p.id === 'eraser' ? <Eraser size={14} className="mx-auto mb-1" /> : <Brush size={14} className="mx-auto mb-1" />}{brushTypeLabel(p.id)}</button>)}</div>
          <div className="space-y-2 text-xs">
            <label className="flex items-center gap-2 font-bold text-bronze-light">{t('drawing.color', { defaultValue: 'Color' })}<input type="color" value={brushColor} onChange={(e) => setBrushColor(e.target.value)} className="w-8 h-8 border rounded" /></label>
            <label className="block font-bold text-bronze-light">{t('drawing.size', { defaultValue: 'Size' })}: {brushSize}px<input type="range" min={1} max={96} value={brushSize} onChange={(e) => setBrushSize(parseInt(e.target.value, 10))} className="w-full" /></label>
            <label className="block font-bold text-bronze-light">{t('drawing.opacity', { defaultValue: 'Opacity' })}: {(brushOpacity * 100).toFixed(0)}%<input type="range" min={1} max={100} value={Math.round(brushOpacity * 100)} onChange={(e) => setBrushOpacity(parseInt(e.target.value, 10) / 100)} className="w-full" /></label>
            <label className="flex items-center justify-between font-bold text-bronze-light">{t('drawing.pressure', { defaultValue: 'Pressure' })}<input type="checkbox" checked={pressureEnabled} onChange={(e) => setPressureEnabled(e.target.checked)} /></label>
            <label className="block font-bold text-bronze-light">{t('drawing.pressureCurve', { defaultValue: 'Pressure Curve' })}: {pressureCurve.toFixed(2)}<input type="range" min={0.5} max={3} step={0.05} value={pressureCurve} onChange={(e) => setPressureCurve(parseFloat(e.target.value))} className="w-full" /></label>
            <label className="block font-bold text-bronze-light">{t('drawing.smoothing', { defaultValue: 'Smoothing' })}: {(smoothing * 100).toFixed(0)}%<input type="range" min={0} max={95} value={Math.round(smoothing * 100)} onChange={(e) => setSmoothing(parseInt(e.target.value, 10) / 100)} className="w-full" /></label>
            <label className="block font-bold text-bronze-light">{t('drawing.spacing', { defaultValue: 'Spacing' })}: {spacing}%<input type="range" min={2} max={80} value={spacing} onChange={(e) => setSpacing(parseInt(e.target.value, 10))} className="w-full" /></label>
          </div>
          <div className="mt-3"><div className="text-[10px] font-black uppercase text-bronze-light mb-2">{t('drawing.brushPresets', { defaultValue: 'Brush Presets' })}</div><div className="space-y-1 max-h-28 overflow-auto pr-1">{customPresets.length === 0 && <div className="text-[11px] text-bronze-light">{t('drawing.noPresets', { defaultValue: 'No saved presets' })}</div>}{customPresets.map((p) => <div key={p.id} className="flex items-center gap-1"><button className="text-left flex-1 px-2 py-1.5 rounded border bg-cream-light text-[11px] font-bold hover:border-primary" onClick={() => applyBrushPreset(p)} title={t('drawing.applyPreset', { defaultValue: 'Apply preset' })}>{p.name}</button><button className="p-1 rounded border bg-white text-red-500" onClick={() => removeBrushPreset(p.id)} title={t('drawing.deletePreset', { defaultValue: 'Delete preset' })}><Trash2 size={12} /></button></div>)}</div></div>
        </div>

        <div className="rounded-xl border border-cream-dark p-3 bg-white">
          <div className="text-xs font-black uppercase text-bronze-light mb-2">{t('drawing.canvas', { defaultValue: 'Canvas' })}</div>
          <label className="block text-xs font-bold text-bronze-light mb-2">{t('drawing.preset', { defaultValue: 'Preset' })}</label>
          <select className="w-full border rounded-lg px-2 py-2 text-sm mb-3" value={`${canvasSize.width}x${canvasSize.height}`} onChange={(e) => { const [w, h] = e.target.value.split('x').map((v) => parseInt(v, 10)); setCanvasSize({ width: w, height: h }); }}>{CANVAS_PRESETS.map((p) => <option key={p.label} value={`${p.width}x${p.height}`}>{p.label}</option>)}</select>
          <label className="block text-xs font-bold text-bronze-light">{t('drawing.zoom', { defaultValue: 'Zoom' })}: {zoom}%<input type="range" min={25} max={200} value={zoom} onChange={(e) => setZoom(parseInt(e.target.value, 10))} className="w-full" /></label>
        </div>

        <div className="rounded-xl border border-cream-dark p-3 bg-white">
          <div className="flex items-center justify-between mb-2"><div className="text-xs font-black uppercase text-bronze-light inline-flex items-center gap-1"><Layers size={14} />{t('drawing.layers', { defaultValue: 'Layers' })}</div><div className="flex gap-1"><button onClick={addLayer} className="p-1.5 rounded border bg-cream-light"><Plus size={14} /></button><button onClick={duplicateLayer} className="p-1.5 rounded border bg-cream-light"><Copy size={14} /></button><button onClick={deleteLayer} className="p-1.5 rounded border bg-cream-light text-red-600"><Trash2 size={14} /></button></div></div>
          <div className="space-y-2">
            {layers.map((l, i) => <div key={l.id} onClick={() => setActiveLayerId(l.id)} className={`border rounded-lg p-2 cursor-pointer relative ${activeLayerId === l.id ? 'border-primary bg-primary/10 ring-2 ring-primary/30 shadow-sm' : 'border-cream-dark bg-cream-light/50'}`}>
              {activeLayerId === l.id && <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-l-lg" />}
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded border overflow-hidden bg-white shrink-0">{layerCanvasesRef.current[l.id] && <img src={layerCanvasesRef.current[l.id].toDataURL('image/png')} alt={l.name} className="w-full h-full object-cover" />}</div>
                <button onClick={(e) => { e.stopPropagation(); setLayers((prev) => prev.map((x) => x.id === l.id ? { ...x, visible: !x.visible } : x)); }} className="text-bronze-light" title={l.visible ? t('drawing.hideLayer', { defaultValue: 'Hide layer' }) : t('drawing.showLayer', { defaultValue: 'Show layer' })}>{l.visible ? <Eye size={14} /> : <EyeOff size={14} />}</button>
                <button onClick={(e) => { e.stopPropagation(); setLayers((prev) => prev.map((x) => x.id === l.id ? { ...x, locked: !x.locked } : x)); }} className="text-bronze-light" title={l.locked ? t('drawing.unlock', { defaultValue: 'Unlock' }) : t('drawing.lock', { defaultValue: 'Lock' })}>{l.locked ? <Lock size={14} /> : <Unlock size={14} />}</button>
                <button className="text-xs font-bold flex-1 text-left truncate inline-flex items-center gap-1" onClick={(e) => { e.stopPropagation(); setActiveLayerId(l.id); }}>
                  <span className={activeLayerId === l.id ? 'text-primary' : ''}>{l.name}</span>
                  {activeLayerId === l.id && (
                    <span className="px-1.5 py-0.5 rounded bg-primary text-white text-[9px] font-black uppercase tracking-wide">
                      {t('drawing.activeLayer', { defaultValue: 'Active' })}
                    </span>
                  )}
                </button>
                <button disabled={i === 0} onClick={(e) => { e.stopPropagation(); moveLayer(l.id, -1); }} className="text-bronze-light disabled:opacity-30" title={t('drawing.moveUp', { defaultValue: 'Move up' })}><ArrowUp size={12} /></button>
                <button disabled={i === layers.length - 1} onClick={(e) => { e.stopPropagation(); moveLayer(l.id, 1); }} className="text-bronze-light disabled:opacity-30" title={t('drawing.moveDown', { defaultValue: 'Move down' })}><ArrowDown size={12} /></button>
              </div>
              <label className="block text-[10px] text-bronze-light mt-1">{t('drawing.opacity', { defaultValue: 'Opacity' })} {(l.opacity * 100).toFixed(0)}%<input type="range" min={0} max={100} value={Math.round(l.opacity * 100)} onChange={(e) => { const v = parseInt(e.target.value, 10) / 100; setLayers((prev) => prev.map((x) => x.id === l.id ? { ...x, opacity: v } : x)); }} onClick={(e) => e.stopPropagation()} className="w-full" /></label>
              <label className="block text-[10px] text-bronze-light mt-1">{t('drawing.blendMode', { defaultValue: 'Blend Mode' })}<select className="w-full mt-1 border rounded px-1 py-1 text-[11px] bg-white" value={l.blendMode} onChange={(e) => { const v = e.target.value as BlendMode; setLayers((prev) => prev.map((x) => x.id === l.id ? { ...x, blendMode: v } : x)); }} onClick={(e) => e.stopPropagation()}>{BLENDS.map((b) => <option key={b.value} value={b.value}>{t(`drawing.blendModes.${b.key}`, { defaultValue: b.fallback })}</option>)}</select></label>
            </div>)}
          </div>
        </div>
      </aside>
    </div>
  );
};

export default DrawingStudioApp;

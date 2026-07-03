
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Lock, Undo2, Redo2, Brush, Eraser, Save, Download, Palette, Wrench, Layers } from 'lucide-react';
import { GalleryPicker } from '../../components/GalleryPicker';
import { saveStickerToDB } from '../../db';
import { useToast } from '../../components/shared/ToastProvider';
import { useBrushPresets } from './hooks/useBrushPresets';
import { CanvasToolbar } from './components/CanvasToolbar';
import { BrushSettingsPanel } from './components/BrushSettingsPanel';
import { LayerPanel } from './components/LayerPanel';
import { MobileDrawer } from './components/MobileDrawer';
import type { BrushType, InteractionMode, VectorStroke, LayerMeta, Point, LayerImageObject, Snapshot, SelectionRect, TransformRect } from './types';

const MAX_HISTORY = 25;
const MAX_LAYERS = 30;
const HANDLE_SIZE = 18;
const makeLayerId = () => `layer-${Math.random().toString(36).slice(2, 10)}`;

const loadImage = (dataUrl: string) => new Promise<HTMLImageElement>((resolve, reject) => {
  const img = new Image(); img.onload = () => resolve(img); img.onerror = reject; img.src = dataUrl;
});

const fileToDataUrl = async (file: Blob) => new Promise<string>((resolve, reject) => {
  const r = new FileReader(); r.onload = () => resolve(r.result as string); r.onerror = reject; r.readAsDataURL(file);
});

export const DrawingStudioApp: React.FC = () => {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const brushTypeLabel = (id: BrushType) => t(`drawing.brushTypes.${id}`, { defaultValue: id });

  const [canvasSize, setCanvasSize] = useState({ width: 1200, height: 1200 });
  const [zoom, setZoom] = useState(100);
  const [layers, setLayers] = useState<LayerMeta[]>([{ id: makeLayerId(), name: `${t('drawing.layerLabel', { defaultValue: '\u5716\u5c64' })} 1`, visible: true, locked: false, opacity: 1, blendMode: 'source-over', maskEnabled: false, fillColor: 'transparent', fillX: 0, fillY: 0, fillWidth: 100, fillHeight: 100 }]);
  const [activeLayerId, setActiveLayerId] = useState('');
  const [layerImages, setLayerImages] = useState<Record<string, LayerImageObject | null>>({});

  const [brushType, setBrushType] = useState<BrushType>('pen');
  const [brushColor, setBrushColor] = useState('#111111');
  const [brushSize, setBrushSize] = useState(6);
  const [brushOpacity, setBrushOpacity] = useState(1);
  const [pressureEnabled, setPressureEnabled] = useState(true);
  const [pressureCurve, setPressureCurve] = useState(1.4);
  const [smoothing, setSmoothing] = useState(0.45);
  const [spacing, setSpacing] = useState(15);
  const [eyedropper, setEyedropper] = useState(false);
  const [mode, setMode] = useState<InteractionMode>('draw');
  const [vectorBrushEnabled, setVectorBrushEnabled] = useState(false);
  const [vectorStabilizer, setVectorStabilizer] = useState(55);
  const [maskPaintMode, setMaskPaintMode] = useState(false);
  const [hoverCursor, setHoverCursor] = useState<'default' | 'move' | 'nwse-resize' | 'crosshair'>('default');
  const [showGalleryPicker, setShowGalleryPicker] = useState(false);
  const [showMobileToolsDrawer, setShowMobileToolsDrawer] = useState(false);
  const [showMobileBrushDrawer, setShowMobileBrushDrawer] = useState(false);
  const [showMobileLayersDrawer, setShowMobileLayersDrawer] = useState(false);
  const [fitCanvasToImport, setFitCanvasToImport] = useState(false);
  const [selectionRect, setSelectionRect] = useState<SelectionRect | null>(null);
  const [vectorStrokesByLayer, setVectorStrokesByLayer] = useState<Record<string, VectorStroke[]>>({});
  const [customCanvasWidth, setCustomCanvasWidth] = useState('1200');
  const [customCanvasHeight, setCustomCanvasHeight] = useState('1200');
  const [customLayerWidth, setCustomLayerWidth] = useState('1200');
  const [customLayerHeight, setCustomLayerHeight] = useState('1200');

  const [history, setHistory] = useState<Snapshot[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  const {
    customPresets, hexCopied,
    saveBrushPreset, applyBrushPreset, removeBrushPreset, copyBrushHex,
  } = useBrushPresets({
    brushType, brushColor, brushSize, brushOpacity,
    pressureEnabled, pressureCurve, smoothing, spacing,
    setBrushType, setBrushColor, setBrushSize, setBrushOpacity,
    setPressureEnabled, setPressureCurve, setSmoothing, setSpacing,
  });

  const displayRef = useRef<HTMLCanvasElement>(null);
  const layerCanvasesRef = useRef<Record<string, HTMLCanvasElement>>({});
  const layerMasksRef = useRef<Record<string, HTMLCanvasElement>>({});
  const imageMasksRef = useRef<Record<string, HTMLCanvasElement>>({});
  const fillMasksRef = useRef<Record<string, HTMLCanvasElement>>({});
  const imageCacheRef = useRef<Record<string, HTMLImageElement>>({});
  const drawingRef = useRef({
    active: false,
    pointerId: null as number | null,
    layerId: '' as string,
    lastSmooth: null as Point | null
  });
  const transformRef = useRef({
    active: false,
    pointerId: null as number | null,
    layerId: '' as string,
    target: 'image' as 'image' | 'fill',
    action: 'move' as 'move' | 'resize',
    startPoint: { x: 0, y: 0 },
    startObj: null as LayerImageObject | null,
    startFill: null as TransformRect | null
  });
  const selectionRef = useRef({
    active: false,
    pointerId: null as number | null,
    action: 'new' as 'new' | 'move' | 'resize',
    startX: 0,
    startY: 0,
    startRect: null as SelectionRect | null
  });

  const activeLayer = useMemo(() => layers.find((l) => l.id === activeLayerId), [layers, activeLayerId]);
  const activeLocked = !!activeLayer?.locked;
  const activeLayerImage = activeLayerId ? layerImages[activeLayerId] : null;
  const activeLayerHasFill = !!(activeLayer && activeLayer.fillColor && activeLayer.fillColor !== 'transparent');

  useEffect(() => { if (!activeLayerId && layers[0]) setActiveLayerId(layers[0].id); }, [activeLayerId, layers]);
  useEffect(() => { if (mode !== 'transform') setHoverCursor('default'); }, [mode]);
  useEffect(() => {
    if (!maskPaintMode || !activeLayerId) return;
    setLayers((prev) => prev.map((layer) => layer.id === activeLayerId ? { ...layer, maskEnabled: true } : layer));
  }, [activeLayerId, maskPaintMode]);
  useEffect(() => {
    setCustomCanvasWidth(String(canvasSize.width));
    setCustomCanvasHeight(String(canvasSize.height));
  }, [canvasSize.height, canvasSize.width]);

  const ensureLayerCanvas = useCallback((layerId: string) => {
    const existing = layerCanvasesRef.current[layerId];
    if (existing && existing.width === canvasSize.width && existing.height === canvasSize.height) return existing;
    const c = document.createElement('canvas'); c.width = canvasSize.width; c.height = canvasSize.height;
    if (existing) { const ctx = c.getContext('2d'); if (ctx) ctx.drawImage(existing, 0, 0, existing.width, existing.height, 0, 0, c.width, c.height); }
    layerCanvasesRef.current[layerId] = c; return c;
  }, [canvasSize.height, canvasSize.width]);

  const ensureLayerMask = useCallback((layerId: string) => {
    const existing = layerMasksRef.current[layerId];
    if (existing && existing.width === canvasSize.width && existing.height === canvasSize.height) return existing;
    const c = document.createElement('canvas');
    c.width = canvasSize.width;
    c.height = canvasSize.height;
    const ctx = c.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, c.width, c.height);
      if (existing) {
        ctx.drawImage(existing, 0, 0, existing.width, existing.height, 0, 0, c.width, c.height);
      }
    }
    layerMasksRef.current[layerId] = c;
    return c;
  }, [canvasSize.height, canvasSize.width]);
  const ensureImageMask = useCallback((layerId: string, obj: LayerImageObject) => {
    const targetWidth = Math.max(1, Math.round(obj.sourceWidth || obj.width));
    const targetHeight = Math.max(1, Math.round(obj.sourceHeight || obj.height));
    const existing = imageMasksRef.current[layerId];
    if (existing && existing.width === targetWidth && existing.height === targetHeight) return existing;
    const c = document.createElement('canvas');
    c.width = targetWidth;
    c.height = targetHeight;
    const ctx = c.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, c.width, c.height);
      if (existing) {
        ctx.drawImage(existing, 0, 0, existing.width, existing.height, 0, 0, c.width, c.height);
      }
    }
    imageMasksRef.current[layerId] = c;
    return c;
  }, []);
  const ensureFillMask = useCallback((layerId: string, rect: TransformRect) => {
    const targetWidth = Math.max(1, Math.round(rect.width));
    const targetHeight = Math.max(1, Math.round(rect.height));
    const existing = fillMasksRef.current[layerId];
    if (existing && existing.width === targetWidth && existing.height === targetHeight) return existing;
    const c = document.createElement('canvas');
    c.width = targetWidth;
    c.height = targetHeight;
    const ctx = c.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, c.width, c.height);
      if (existing) {
        ctx.drawImage(existing, 0, 0, existing.width, existing.height, 0, 0, c.width, c.height);
      }
    }
    fillMasksRef.current[layerId] = c;
    return c;
  }, []);

  const pointInSelection = useCallback((pt: Point) => {
    if (!selectionRect) return true;
    return pt.x >= selectionRect.x && pt.x <= selectionRect.x + selectionRect.width && pt.y >= selectionRect.y && pt.y <= selectionRect.y + selectionRect.height;
  }, [selectionRect]);

  const drawVectorStroke = useCallback((ctx: CanvasRenderingContext2D, stroke: VectorStroke) => {
    if (stroke.points.length < 2) return;
    ctx.save();
    ctx.globalAlpha = Math.max(0.02, stroke.brushOpacity);
    ctx.strokeStyle = stroke.brushColor;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    const baseWidth = stroke.brushSize;
    for (let i = 1; i < stroke.points.length; i++) {
      const p0 = stroke.points[i - 1];
      const p1 = stroke.points[i];
      ctx.beginPath();
      ctx.lineWidth = Math.max(0.5, ((p0.pressure + p1.pressure) / 2) * baseWidth);
      ctx.moveTo(p0.x, p0.y);
      ctx.lineTo(p1.x, p1.y);
      ctx.stroke();
    }
    ctx.restore();
  }, []);

  const getLayerFillRect = useCallback((layer: LayerMeta): TransformRect => ({
    x: Math.max(0, ((layer.fillX ?? 0) / 100) * canvasSize.width),
    y: Math.max(0, ((layer.fillY ?? 0) / 100) * canvasSize.height),
    width: Math.max(1, ((layer.fillWidth ?? 100) / 100) * canvasSize.width),
    height: Math.max(1, ((layer.fillHeight ?? 100) / 100) * canvasSize.height),
  }), [canvasSize.height, canvasSize.width]);
  const updateActiveLayerFillRect = useCallback((rect: TransformRect) => {
    if (!activeLayerId) return;
    const x = Math.max(0, Math.min(canvasSize.width - 1, rect.x));
    const y = Math.max(0, Math.min(canvasSize.height - 1, rect.y));
    const width = Math.max(1, Math.min(canvasSize.width - x, rect.width));
    const height = Math.max(1, Math.min(canvasSize.height - y, rect.height));
    setLayers((prev) => prev.map((layer) => layer.id === activeLayerId ? {
      ...layer,
      fillX: (x / canvasSize.width) * 100,
      fillY: (y / canvasSize.height) * 100,
      fillWidth: (width / canvasSize.width) * 100,
      fillHeight: (height / canvasSize.height) * 100,
    } : layer));
  }, [activeLayerId, canvasSize.height, canvasSize.width]);
  const activeLayerFillRect = useMemo(() => activeLayer ? getLayerFillRect(activeLayer) : null, [activeLayer, getLayerFillRect]);

  const getLayerImageElement = useCallback((layerId: string, obj: LayerImageObject) => {
    const cached = imageCacheRef.current[layerId];
    if (cached?.src === obj.dataUrl) return cached;
    const img = new Image();
    img.src = obj.dataUrl;
    imageCacheRef.current[layerId] = img;
    return img;
  }, []);
  const drawLayerImageObject = useCallback((ctx: CanvasRenderingContext2D, layerId: string, obj: LayerImageObject) => {
    if (obj.bgColor && obj.bgColor !== 'transparent') {
      ctx.fillStyle = obj.bgColor;
      ctx.fillRect(obj.x, obj.y, obj.width, obj.height);
    }
    const img = getLayerImageElement(layerId, obj);
    if (!(img.complete && img.naturalWidth > 0)) return;
    const imageMask = imageMasksRef.current[layerId];
    if (!imageMask) {
      ctx.drawImage(img, obj.x, obj.y, obj.width, obj.height);
      return;
    }
    const tmp = document.createElement('canvas');
    tmp.width = Math.max(1, Math.round(obj.width));
    tmp.height = Math.max(1, Math.round(obj.height));
    const tctx = tmp.getContext('2d');
    if (!tctx) return;
    tctx.drawImage(img, 0, 0, tmp.width, tmp.height);
    tctx.globalCompositeOperation = 'destination-in';
    tctx.drawImage(imageMask, 0, 0, imageMask.width, imageMask.height, 0, 0, tmp.width, tmp.height);
    ctx.drawImage(tmp, obj.x, obj.y, obj.width, obj.height);
  }, [getLayerImageElement]);
  const drawLayerFillObject = useCallback((ctx: CanvasRenderingContext2D, layer: LayerMeta) => {
    if (!layer.fillColor || layer.fillColor === 'transparent') return;
    const rect = getLayerFillRect(layer);
    const fillMask = ensureFillMask(layer.id, rect);
    const tmp = document.createElement('canvas');
    tmp.width = Math.max(1, Math.round(rect.width));
    tmp.height = Math.max(1, Math.round(rect.height));
    const tctx = tmp.getContext('2d');
    if (!tctx) return;
    tctx.fillStyle = layer.fillColor;
    tctx.fillRect(0, 0, tmp.width, tmp.height);
    tctx.globalCompositeOperation = 'destination-in';
    tctx.drawImage(fillMask, 0, 0, fillMask.width, fillMask.height, 0, 0, tmp.width, tmp.height);
    ctx.drawImage(tmp, rect.x, rect.y, rect.width, rect.height);
  }, [ensureFillMask, getLayerFillRect]);
  useEffect(() => {
    if (activeLayerImage) {
      setCustomLayerWidth(String(Math.round(activeLayerImage.width)));
      setCustomLayerHeight(String(Math.round(activeLayerImage.height)));
      return;
    }
    if (activeLayerHasFill && activeLayerFillRect) {
      setCustomLayerWidth(String(Math.round(activeLayerFillRect.width)));
      setCustomLayerHeight(String(Math.round(activeLayerFillRect.height)));
    }
  }, [activeLayerFillRect, activeLayerHasFill, activeLayerImage]);

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
      const obj = layerImages[layer.id];
      const strokes = vectorStrokesByLayer[layer.id] || [];
      const hasMask = layer.maskEnabled;
      const mask = hasMask ? ensureLayerMask(layer.id) : null;
      ctx.save();
      ctx.globalAlpha = layer.opacity;
      ctx.globalCompositeOperation = layer.blendMode;
      if (hasMask && mask) {
        const tmp = document.createElement('canvas');
        tmp.width = canvasSize.width;
        tmp.height = canvasSize.height;
        const tctx = tmp.getContext('2d');
        if (tctx) {
          drawLayerFillObject(tctx, layer);
          if (obj) {
            drawLayerImageObject(tctx, layer.id, obj);
          }
          tctx.drawImage(lc, 0, 0);
          strokes.forEach((s) => drawVectorStroke(tctx, s));
          tctx.globalCompositeOperation = 'destination-in';
          tctx.drawImage(mask, 0, 0);
          ctx.drawImage(tmp, 0, 0);
        }
      } else {
        drawLayerFillObject(ctx, layer);
        if (obj) {
          drawLayerImageObject(ctx, layer.id, obj);
        }
        ctx.drawImage(lc, 0, 0);
        strokes.forEach((s) => drawVectorStroke(ctx, s));
      }
      ctx.restore();
    });
    if (mode === 'transform' && activeLayer?.visible && (activeLayerImage || activeLayerHasFill)) {
      const obj = activeLayerImage || activeLayerFillRect;
      if (obj) {
        ctx.save();
        ctx.strokeStyle = '#8b5cf6';
        ctx.lineWidth = 2;
        ctx.setLineDash([8, 6]);
        ctx.strokeRect(obj.x, obj.y, obj.width, obj.height);
        ctx.setLineDash([]);
        ctx.fillStyle = '#8b5cf6';
        ctx.fillRect(obj.x + obj.width - HANDLE_SIZE, obj.y + obj.height - HANDLE_SIZE, HANDLE_SIZE, HANDLE_SIZE);
        ctx.restore();
      }
    }
    if (selectionRect && mode === 'select') {
      ctx.save();
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 4]);
      ctx.strokeRect(selectionRect.x, selectionRect.y, selectionRect.width, selectionRect.height);
      ctx.restore();
    }
  }, [activeLayer?.visible, activeLayerFillRect, activeLayerHasFill, activeLayerImage, canvasSize.height, canvasSize.width, drawLayerFillObject, drawLayerImageObject, drawVectorStroke, ensureLayerCanvas, ensureLayerMask, layerImages, layers, mode, selectionRect, vectorStrokesByLayer]);

  useEffect(() => { layers.forEach((l) => ensureLayerCanvas(l.id)); compositeDisplay(); }, [layers, layerImages, canvasSize, ensureLayerCanvas, compositeDisplay]);

  const captureSnapshot = useCallback((): Snapshot => {
    const snap: Snapshot = { layers: {}, layerImages: {}, masks: {}, imageMasks: {}, fillMasks: {}, vectorStrokes: {}, selection: selectionRect ? { ...selectionRect } : null };
    layers.forEach((l) => {
      snap.layers[l.id] = ensureLayerCanvas(l.id).toDataURL('image/png');
      snap.layerImages[l.id] = layerImages[l.id] ? { ...(layerImages[l.id] as LayerImageObject) } : null;
      snap.vectorStrokes[l.id] = (vectorStrokesByLayer[l.id] || []).map((s) => ({ ...s, points: s.points.map((p) => ({ ...p })) }));
      snap.masks[l.id] = ensureLayerMask(l.id).toDataURL('image/png');
      snap.imageMasks[l.id] = imageMasksRef.current[l.id] ? imageMasksRef.current[l.id].toDataURL('image/png') : null;
      snap.fillMasks[l.id] = fillMasksRef.current[l.id] ? fillMasksRef.current[l.id].toDataURL('image/png') : null;
    });
    return snap;
  }, [layers, layerImages, selectionRect, vectorStrokesByLayer, ensureLayerCanvas, ensureLayerMask]);

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
    const nextLayerImages = snapshot.layerImages || {};
    await Promise.all(layers.map(async (l) => {
      const c = ensureLayerCanvas(l.id); const ctx = c.getContext('2d'); if (!ctx) return;
      ctx.clearRect(0, 0, c.width, c.height); const data = snapshot.layers[l.id]; if (!data) return;
      try { const img = await loadImage(data); ctx.drawImage(img, 0, 0, c.width, c.height); } catch {}
      const m = ensureLayerMask(l.id);
      const mctx = m.getContext('2d');
      if (mctx) {
        mctx.clearRect(0, 0, m.width, m.height);
        const md = snapshot.masks[l.id];
        if (md) {
          try { const maskImg = await loadImage(md); mctx.drawImage(maskImg, 0, 0, m.width, m.height); } catch {}
        } else {
          mctx.fillStyle = '#fff';
          mctx.fillRect(0, 0, m.width, m.height);
        }
      }
      const imageObj = nextLayerImages[l.id];
      if (imageObj) {
        const im = ensureImageMask(l.id, imageObj);
        const imCtx = im.getContext('2d');
        if (imCtx) {
          imCtx.clearRect(0, 0, im.width, im.height);
          const imData = snapshot.imageMasks?.[l.id];
          if (imData) {
            try { const imImg = await loadImage(imData); imCtx.drawImage(imImg, 0, 0, im.width, im.height); } catch { imCtx.fillStyle = '#fff'; imCtx.fillRect(0, 0, im.width, im.height); }
          } else {
            imCtx.fillStyle = '#fff';
            imCtx.fillRect(0, 0, im.width, im.height);
          }
        }
      } else {
        delete imageMasksRef.current[l.id];
      }
      const fillRect = getLayerFillRect(l);
      const fm = ensureFillMask(l.id, fillRect);
      const fmCtx = fm.getContext('2d');
      if (fmCtx) {
        fmCtx.clearRect(0, 0, fm.width, fm.height);
        const fmData = snapshot.fillMasks?.[l.id];
        if (fmData) {
          try { const fmImg = await loadImage(fmData); fmCtx.drawImage(fmImg, 0, 0, fm.width, fm.height); } catch { fmCtx.fillStyle = '#fff'; fmCtx.fillRect(0, 0, fm.width, fm.height); }
        } else {
          fmCtx.fillStyle = '#fff';
          fmCtx.fillRect(0, 0, fm.width, fm.height);
        }
      }
    }));
    setLayerImages(nextLayerImages);
    setVectorStrokesByLayer(snapshot.vectorStrokes || {});
    setSelectionRect(snapshot.selection || null);
    compositeDisplay();
  }, [layers, ensureFillMask, ensureImageMask, ensureLayerCanvas, ensureLayerMask, compositeDisplay, getLayerFillRect]);

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
    if (!pointInSelection(pt)) return;
    if (maskPaintMode) {
      const m = ensureLayerMask(layerId);
      const mctx = m.getContext('2d');
      if (!mctx) return;
      const size = Math.max(0.5, brushSize * pt.pressure);
      mctx.save();
      mctx.globalAlpha = 1;
      if (brushType === 'eraser') {
        mctx.globalCompositeOperation = 'source-over';
        mctx.fillStyle = '#ffffff';
      } else {
        mctx.globalCompositeOperation = 'destination-out';
        mctx.fillStyle = '#000000';
      }
      mctx.beginPath();
      mctx.arc(pt.x, pt.y, size * 0.5, 0, Math.PI * 2);
      mctx.fill();
      mctx.restore();
      return;
    }
    if (brushType === 'eraser') {
      const obj = layerImages[layerId];
      if (obj) {
        if (pt.x < obj.x || pt.x > obj.x + obj.width || pt.y < obj.y || pt.y > obj.y + obj.height) return;
        const imageMask = ensureImageMask(layerId, obj);
        const mctx = imageMask.getContext('2d');
        if (!mctx) return;
        const localX = ((pt.x - obj.x) / Math.max(1, obj.width)) * imageMask.width;
        const localY = ((pt.y - obj.y) / Math.max(1, obj.height)) * imageMask.height;
        const size = Math.max(0.5, brushSize * pt.pressure);
        const scale = ((imageMask.width / Math.max(1, obj.width)) + (imageMask.height / Math.max(1, obj.height))) / 2;
        const radius = Math.max(0.5, (size * 0.5) * scale);
        mctx.save();
        mctx.globalCompositeOperation = 'destination-out';
        mctx.fillStyle = '#000000';
        mctx.beginPath();
        mctx.arc(localX, localY, radius, 0, Math.PI * 2);
        mctx.fill();
        mctx.restore();
        return;
      }
      const layerMeta = layers.find((l) => l.id === layerId);
      if (layerMeta && layerMeta.fillColor && layerMeta.fillColor !== 'transparent') {
        const rect = getLayerFillRect(layerMeta);
        if (pt.x < rect.x || pt.x > rect.x + rect.width || pt.y < rect.y || pt.y > rect.y + rect.height) return;
        const fillMask = ensureFillMask(layerId, rect);
        const fctx = fillMask.getContext('2d');
        if (!fctx) return;
        const localX = ((pt.x - rect.x) / Math.max(1, rect.width)) * fillMask.width;
        const localY = ((pt.y - rect.y) / Math.max(1, rect.height)) * fillMask.height;
        const size = Math.max(0.5, brushSize * pt.pressure);
        const scale = ((fillMask.width / Math.max(1, rect.width)) + (fillMask.height / Math.max(1, rect.height))) / 2;
        const radius = Math.max(0.5, (size * 0.5) * scale);
        fctx.save();
        fctx.globalCompositeOperation = 'destination-out';
        fctx.fillStyle = '#000000';
        fctx.beginPath();
        fctx.arc(localX, localY, radius, 0, Math.PI * 2);
        fctx.fill();
        fctx.restore();
        return;
      }
    }
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
  }, [brushColor, brushOpacity, brushSize, brushType, ensureFillMask, ensureImageMask, ensureLayerCanvas, ensureLayerMask, getLayerFillRect, layerImages, layers, maskPaintMode, pointInSelection]);

  const drawSegment = useCallback((from: Point, to: Point, layerId: string) => {
    const dx = to.x - from.x, dy = to.y - from.y, dp = to.pressure - from.pressure, dist = Math.hypot(dx, dy);
    const spacingPx = Math.max(0.8, brushSize * (spacing / 100)); const steps = Math.max(1, Math.ceil(dist / spacingPx));
    for (let i = 1; i <= steps; i++) { const tr = i / steps; stampPoint({ x: from.x + dx * tr, y: from.y + dy * tr, pressure: from.pressure + dp * tr }, layerId); }
  }, [brushSize, spacing, stampPoint]);

  const hitOnResizeHandle = (obj: LayerImageObject, p: Point) => p.x >= obj.x + obj.width - HANDLE_SIZE && p.x <= obj.x + obj.width && p.y >= obj.y + obj.height - HANDLE_SIZE && p.y <= obj.y + obj.height;
  const hitOnObject = (obj: LayerImageObject, p: Point) => p.x >= obj.x && p.x <= obj.x + obj.width && p.y >= obj.y && p.y <= obj.y + obj.height;
  const hitOnRect = (obj: TransformRect, p: Point) => p.x >= obj.x && p.x <= obj.x + obj.width && p.y >= obj.y && p.y <= obj.y + obj.height;
  const hitOnRectResizeHandle = (obj: TransformRect, p: Point) => p.x >= obj.x + obj.width - HANDLE_SIZE && p.x <= obj.x + obj.width && p.y >= obj.y + obj.height - HANDLE_SIZE && p.y <= obj.y + obj.height;
  const hitOnSelectionResizeHandle = (sel: SelectionRect, p: Point) => p.x >= sel.x + sel.width - HANDLE_SIZE && p.x <= sel.x + sel.width && p.y >= sel.y + sel.height - HANDLE_SIZE && p.y <= sel.y + sel.height;
  const hitOnSelection = (sel: SelectionRect, p: Point) => p.x >= sel.x && p.x <= sel.x + sel.width && p.y >= sel.y && p.y <= sel.y + sel.height;

  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const p = getPoint(e); if (!p) return;
    if (mode === 'select') {
      const sel = selectionRect;
      selectionRef.current.active = true;
      selectionRef.current.pointerId = e.pointerId;
      selectionRef.current.startX = p.x;
      selectionRef.current.startY = p.y;
      selectionRef.current.startRect = sel ? { ...sel } : null;
      if (sel && hitOnSelectionResizeHandle(sel, p)) {
        selectionRef.current.action = 'resize';
      } else if (sel && hitOnSelection(sel, p)) {
        selectionRef.current.action = 'move';
      } else {
        selectionRef.current.action = 'new';
        setSelectionRect({ x: p.x, y: p.y, width: 0, height: 0 });
      }
      (e.currentTarget as HTMLCanvasElement).setPointerCapture(e.pointerId);
      return;
    }
    if (!activeLayerId || activeLocked) return;
    if (eyedropper) { pickColorAt(p); return; }
    if (mode === 'transform' && activeLayerImage) {
      let action: 'move' | 'resize' | null = null;
      if (hitOnResizeHandle(activeLayerImage, p)) action = 'resize';
      else if (hitOnObject(activeLayerImage, p)) action = 'move';
      if (action) {
        transformRef.current.active = true;
        transformRef.current.pointerId = e.pointerId;
        transformRef.current.layerId = activeLayerId;
        transformRef.current.target = 'image';
        transformRef.current.action = action;
        transformRef.current.startPoint = { x: p.x, y: p.y };
        transformRef.current.startObj = { ...activeLayerImage };
        transformRef.current.startFill = null;
        (e.currentTarget as HTMLCanvasElement).setPointerCapture(e.pointerId);
      }
      return;
    }
    if (mode === 'transform' && activeLayerHasFill && activeLayerFillRect) {
      let action: 'move' | 'resize' | null = null;
      if (hitOnRectResizeHandle(activeLayerFillRect, p)) action = 'resize';
      else if (hitOnRect(activeLayerFillRect, p)) action = 'move';
      if (action) {
        transformRef.current.active = true;
        transformRef.current.pointerId = e.pointerId;
        transformRef.current.layerId = activeLayerId;
        transformRef.current.target = 'fill';
        transformRef.current.action = action;
        transformRef.current.startPoint = { x: p.x, y: p.y };
        transformRef.current.startObj = null;
        transformRef.current.startFill = { ...activeLayerFillRect };
        (e.currentTarget as HTMLCanvasElement).setPointerCapture(e.pointerId);
      }
      return;
    }
    if (mode === 'transform') return;
    if (vectorBrushEnabled && !maskPaintMode && brushType !== 'eraser') {
      const stroke: VectorStroke = {
        brushType: brushType as Exclude<BrushType, 'eraser'>,
        brushColor,
        brushSize,
        brushOpacity,
        points: [{ x: p.x, y: p.y, pressure: p.pressure }]
      };
      setVectorStrokesByLayer((prev) => ({ ...prev, [activeLayerId]: [...(prev[activeLayerId] || []), stroke] }));
      drawingRef.current.active = true;
      drawingRef.current.pointerId = e.pointerId;
      drawingRef.current.layerId = activeLayerId;
      drawingRef.current.lastSmooth = p;
      (e.currentTarget as HTMLCanvasElement).setPointerCapture(e.pointerId);
      return;
    }
    drawingRef.current.active = true;
    drawingRef.current.pointerId = e.pointerId;
    drawingRef.current.layerId = activeLayerId;
    drawingRef.current.lastSmooth = p;
    stampPoint(p, activeLayerId);
    compositeDisplay();
    (e.currentTarget as HTMLCanvasElement).setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (selectionRef.current.active && selectionRef.current.pointerId === e.pointerId) {
      const p = getPoint(e);
      if (!p) return;
      if (selectionRef.current.action === 'new') {
        const x = Math.min(selectionRef.current.startX, p.x);
        const y = Math.min(selectionRef.current.startY, p.y);
        const width = Math.abs(p.x - selectionRef.current.startX);
        const height = Math.abs(p.y - selectionRef.current.startY);
        setSelectionRect({ x, y, width, height });
      } else if (selectionRef.current.action === 'move' && selectionRef.current.startRect) {
        const dx = p.x - selectionRef.current.startX;
        const dy = p.y - selectionRef.current.startY;
        const base = selectionRef.current.startRect;
        setSelectionRect({
          x: Math.max(0, Math.min(canvasSize.width - base.width, base.x + dx)),
          y: Math.max(0, Math.min(canvasSize.height - base.height, base.y + dy)),
          width: base.width,
          height: base.height
        });
      } else if (selectionRef.current.action === 'resize' && selectionRef.current.startRect) {
        const base = selectionRef.current.startRect;
        const nextW = Math.max(8, p.x - base.x);
        const nextH = Math.max(8, p.y - base.y);
        setSelectionRect({
          x: base.x,
          y: base.y,
          width: Math.min(nextW, canvasSize.width - base.x),
          height: Math.min(nextH, canvasSize.height - base.y)
        });
      }
      return;
    }
    if (mode === 'select' && selectionRect) {
      const p = getPoint(e);
      if (p) {
        if (hitOnSelectionResizeHandle(selectionRect, p)) setHoverCursor('nwse-resize');
        else if (hitOnSelection(selectionRect, p)) setHoverCursor('move');
        else setHoverCursor('crosshair');
      }
    } else if (mode === 'select' && !selectionRect) {
      setHoverCursor('crosshair');
    }
    if (mode === 'transform' && !transformRef.current.active) {
      const p = getPoint(e);
      if (p) {
        if (activeLayerImage) {
          if (hitOnResizeHandle(activeLayerImage, p)) setHoverCursor('nwse-resize');
          else if (hitOnObject(activeLayerImage, p)) setHoverCursor('move');
          else setHoverCursor('default');
        } else if (activeLayerHasFill && activeLayerFillRect) {
          if (hitOnRectResizeHandle(activeLayerFillRect, p)) setHoverCursor('nwse-resize');
          else if (hitOnRect(activeLayerFillRect, p)) setHoverCursor('move');
          else setHoverCursor('default');
        } else {
          setHoverCursor('default');
        }
      }
    }
    if (transformRef.current.active && transformRef.current.pointerId === e.pointerId) {
      const p = getPoint(e);
      if (!p) return;
      const dx = p.x - transformRef.current.startPoint.x;
      const dy = p.y - transformRef.current.startPoint.y;
      if (transformRef.current.target === 'image') {
        const startObj = transformRef.current.startObj;
        if (!startObj) return;
        const ratio = startObj.width / Math.max(1, startObj.height);
        setLayerImages((prev) => {
          const next = { ...prev };
          if (transformRef.current.action === 'move') {
            setHoverCursor('move');
            next[transformRef.current.layerId] = { ...startObj, x: startObj.x + dx, y: startObj.y + dy };
          } else {
            setHoverCursor('nwse-resize');
            const nextWidth = Math.max(24, startObj.width + dx);
            const nextHeight = Math.max(24, nextWidth / ratio);
            next[transformRef.current.layerId] = { ...startObj, width: nextWidth, height: nextHeight };
          }
          return next;
        });
      } else {
        const startFill = transformRef.current.startFill;
        if (!startFill) return;
        if (transformRef.current.action === 'move') {
          setHoverCursor('move');
          const x = Math.max(0, Math.min(canvasSize.width - startFill.width, startFill.x + dx));
          const y = Math.max(0, Math.min(canvasSize.height - startFill.height, startFill.y + dy));
          updateActiveLayerFillRect({ ...startFill, x, y });
        } else {
          setHoverCursor('nwse-resize');
          const width = Math.max(8, Math.min(canvasSize.width - startFill.x, startFill.width + dx));
          const height = Math.max(8, Math.min(canvasSize.height - startFill.y, startFill.height + dy));
          updateActiveLayerFillRect({ ...startFill, width, height });
        }
      }
      return;
    }
    if (!drawingRef.current.active || drawingRef.current.pointerId !== e.pointerId) return;
    const raw = getPoint(e); if (!raw) return;
    if (vectorBrushEnabled && !maskPaintMode && brushType !== 'eraser') {
      const last = drawingRef.current.lastSmooth ?? raw;
      const strength = Math.max(0.02, Math.min(0.95, vectorStabilizer / 100));
      const sp: Point = {
        x: last.x + (raw.x - last.x) * (1 - strength),
        y: last.y + (raw.y - last.y) * (1 - strength),
        pressure: last.pressure + (raw.pressure - last.pressure) * (1 - strength)
      };
      if (pointInSelection(sp)) {
        setVectorStrokesByLayer((prev) => {
          const layerStrokes = [...(prev[drawingRef.current.layerId || activeLayerId] || [])];
          if (layerStrokes.length === 0) return prev;
          const idx = layerStrokes.length - 1;
          layerStrokes[idx] = { ...layerStrokes[idx], points: [...layerStrokes[idx].points, { x: sp.x, y: sp.y, pressure: sp.pressure }] };
          return { ...prev, [drawingRef.current.layerId || activeLayerId]: layerStrokes };
        });
      }
      drawingRef.current.lastSmooth = sp;
      compositeDisplay();
      return;
    }
    const last = drawingRef.current.lastSmooth ?? raw;
    const lerp = 1 - Math.max(0, Math.min(0.95, smoothing));
    const sp: Point = { x: last.x + (raw.x - last.x) * lerp, y: last.y + (raw.y - last.y) * lerp, pressure: last.pressure + (raw.pressure - last.pressure) * lerp };
    drawSegment(last, sp, drawingRef.current.layerId || activeLayerId); drawingRef.current.lastSmooth = sp; compositeDisplay();
  };

  const finishStroke = async (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (selectionRef.current.active && selectionRef.current.pointerId === e.pointerId) {
      selectionRef.current.active = false;
      selectionRef.current.pointerId = null;
      selectionRef.current.action = 'new';
      selectionRef.current.startRect = null;
      if ((e.currentTarget as HTMLCanvasElement).hasPointerCapture(e.pointerId)) {
        (e.currentTarget as HTMLCanvasElement).releasePointerCapture(e.pointerId);
      }
      compositeDisplay();
      pushSnapshot();
      return;
    }
    if (transformRef.current.active && transformRef.current.pointerId === e.pointerId) {
      transformRef.current.active = false;
      transformRef.current.pointerId = null;
      transformRef.current.startObj = null;
      transformRef.current.startFill = null;
      if ((e.currentTarget as HTMLCanvasElement).hasPointerCapture(e.pointerId)) {
        (e.currentTarget as HTMLCanvasElement).releasePointerCapture(e.pointerId);
      }
      setHoverCursor('default');
      pushSnapshot();
      return;
    }
    if (!drawingRef.current.active || drawingRef.current.pointerId !== e.pointerId) return;
    drawingRef.current.active = false; drawingRef.current.pointerId = null; drawingRef.current.layerId = ''; drawingRef.current.lastSmooth = null;
    if ((e.currentTarget as HTMLCanvasElement).hasPointerCapture(e.pointerId)) {
      (e.currentTarget as HTMLCanvasElement).releasePointerCapture(e.pointerId);
    }
    pushSnapshot();
  };

  const addLayer = () => {
    if (layers.length >= MAX_LAYERS) return;
    const next: LayerMeta = { id: makeLayerId(), name: `${t('drawing.layerLabel', { defaultValue: '\u5716\u5c64' })} ${layers.length + 1}`, visible: true, locked: false, opacity: 1, blendMode: 'source-over', maskEnabled: false, fillColor: 'transparent', fillX: 0, fillY: 0, fillWidth: 100, fillHeight: 100 };
    setLayers((prev) => [next, ...prev]); setLayerImages((prev) => ({ ...prev, [next.id]: null })); setActiveLayerId(next.id);
  };
  const moveLayer = (id: string, dir: -1 | 1) => setLayers((prev) => { const i = prev.findIndex((l) => l.id === id); const j = i + dir; if (i < 0 || j < 0 || j >= prev.length) return prev; const n = [...prev]; [n[i], n[j]] = [n[j], n[i]]; return n; });
  const deleteLayer = () => {
    if (layers.length <= 1 || !activeLayerId) return;
    const next = layers.filter((l) => l.id !== activeLayerId);
    delete layerCanvasesRef.current[activeLayerId];
    delete layerMasksRef.current[activeLayerId];
    delete imageMasksRef.current[activeLayerId];
    delete fillMasksRef.current[activeLayerId];
    delete imageCacheRef.current[activeLayerId];
    setVectorStrokesByLayer((prev) => { const n = { ...prev }; delete n[activeLayerId]; return n; });
    setLayerImages((prev) => { const n = { ...prev }; delete n[activeLayerId]; return n; });
    setLayers(next);
    setActiveLayerId(next[0]?.id || '');
    pushSnapshot();
  };

  const duplicateLayer = () => {
    const src = layers.find((l) => l.id === activeLayerId); if (!src) return;
    const srcCanvas = ensureLayerCanvas(src.id);
    const clone: LayerMeta = { id: makeLayerId(), name: `${src.name} ${t('drawing.copySuffix', { defaultValue: '\u526f\u672c' })}`, visible: true, locked: false, opacity: src.opacity, blendMode: src.blendMode, maskEnabled: src.maskEnabled, fillColor: src.fillColor || 'transparent', fillX: src.fillX ?? 0, fillY: src.fillY ?? 0, fillWidth: src.fillWidth ?? 100, fillHeight: src.fillHeight ?? 100 };
    const cc = ensureLayerCanvas(clone.id); const ctx = cc.getContext('2d'); if (ctx) ctx.drawImage(srcCanvas, 0, 0);
    const srcImage = layerImages[src.id];
    const srcImageMask = imageMasksRef.current[src.id];
    const srcFillMask = fillMasksRef.current[src.id];
    if (srcImageMask) {
      const maskCopy = document.createElement('canvas');
      maskCopy.width = srcImageMask.width;
      maskCopy.height = srcImageMask.height;
      const maskCopyCtx = maskCopy.getContext('2d');
      if (maskCopyCtx) {
        maskCopyCtx.drawImage(srcImageMask, 0, 0);
        imageMasksRef.current[clone.id] = maskCopy;
      }
    } else {
      delete imageMasksRef.current[clone.id];
    }
    if (srcFillMask) {
      const fillMaskCopy = document.createElement('canvas');
      fillMaskCopy.width = srcFillMask.width;
      fillMaskCopy.height = srcFillMask.height;
      const fillMaskCtx = fillMaskCopy.getContext('2d');
      if (fillMaskCtx) {
        fillMaskCtx.drawImage(srcFillMask, 0, 0);
        fillMasksRef.current[clone.id] = fillMaskCopy;
      }
    } else {
      delete fillMasksRef.current[clone.id];
    }
    setLayerImages((prev) => ({ ...prev, [clone.id]: srcImage ? { ...srcImage } : null }));
    setLayers((prev) => [clone, ...prev]); setActiveLayerId(clone.id); pushSnapshot();
  };

  const clearActiveLayer = () => {
    if (activeLocked) return; const c = layerCanvasesRef.current[activeLayerId]; if (!c) return; const ctx = c.getContext('2d'); if (!ctx) return;
    ctx.clearRect(0, 0, c.width, c.height);
    setLayerImages((prev) => ({ ...prev, [activeLayerId]: null }));
    delete imageMasksRef.current[activeLayerId];
    delete fillMasksRef.current[activeLayerId];
    setVectorStrokesByLayer((prev) => ({ ...prev, [activeLayerId]: [] }));
    compositeDisplay();
    pushSnapshot();
  };
  const renameLayer = (layerId: string) => {
    const target = layers.find((l) => l.id === layerId);
    if (!target) return;
    const nextName = window.prompt(t('drawing.renameLayerPrompt', { defaultValue: '\u91cd\u65b0\u547d\u540d\u5716\u5c64' }), target.name)?.trim();
    if (!nextName) return;
    setLayers((prev) => prev.map((l) => l.id === layerId ? { ...l, name: nextName } : l));
  };

  const importToActiveLayer = async (file: File) => {
    if (activeLocked) return;
    const dataUrl = await fileToDataUrl(file);
    const img = await loadImage(dataUrl);
    const targetCanvas = fitCanvasToImport ? { width: img.width, height: img.height } : canvasSize;
    if (fitCanvasToImport) setCanvasSize(targetCanvas);
    const scale = Math.min(targetCanvas.width / img.width, targetCanvas.height / img.height);
    const w = img.width * scale, h = img.height * scale; const x = (targetCanvas.width - w) / 2, y = (targetCanvas.height - h) / 2;
    setLayerImages((prev) => ({ ...prev, [activeLayerId]: { dataUrl, x, y, width: w, height: h, bgColor: 'transparent', sourceWidth: img.width, sourceHeight: img.height } }));
    const imageMask = document.createElement('canvas');
    imageMask.width = img.width;
    imageMask.height = img.height;
    const imageMaskCtx = imageMask.getContext('2d');
    if (imageMaskCtx) {
      imageMaskCtx.fillStyle = '#ffffff';
      imageMaskCtx.fillRect(0, 0, imageMask.width, imageMask.height);
      imageMasksRef.current[activeLayerId] = imageMask;
    }
    setMode('transform');
    compositeDisplay();
    pushSnapshot();
  };

  const applyFitCanvasToActiveImage = async () => {
    if (!activeLayerId || !activeLayerImage) return;
    let nextWidth = activeLayerImage.sourceWidth;
    let nextHeight = activeLayerImage.sourceHeight;
    if (!nextWidth || !nextHeight) {
      try {
        const img = await loadImage(activeLayerImage.dataUrl);
        nextWidth = img.width;
        nextHeight = img.height;
      } catch {
        return;
      }
    }
    if (!nextWidth || !nextHeight) return;
    const nextCanvas = { width: nextWidth, height: nextHeight };
    setCanvasSize(nextCanvas);
    setLayerImages((prev) => ({
      ...prev,
      [activeLayerId]: {
        ...(prev[activeLayerId] as LayerImageObject),
        x: 0,
        y: 0,
        width: nextWidth as number,
        height: nextHeight as number,
        sourceWidth: nextWidth,
        sourceHeight: nextHeight
      }
    }));
  };

  const updateActiveImageScale = (percent: number) => {
    if (!activeLayerId || !activeLayerImage) return;
    const ratio = activeLayerImage.width / Math.max(1, activeLayerImage.height);
    const nextW = Math.max(24, (canvasSize.width * percent) / 100);
    const nextH = Math.max(24, nextW / ratio);
    setLayerImages((prev) => ({ ...prev, [activeLayerId]: { ...activeLayerImage, width: nextW, height: nextH } }));
  };
  const updateActiveImageWidth = (percent: number) => {
    if (!activeLayerId || !activeLayerImage) return;
    const nextW = Math.max(24, (canvasSize.width * percent) / 100);
    setLayerImages((prev) => ({ ...prev, [activeLayerId]: { ...activeLayerImage, width: nextW } }));
  };
  const updateActiveImageHeight = (percent: number) => {
    if (!activeLayerId || !activeLayerImage) return;
    const nextH = Math.max(24, (canvasSize.height * percent) / 100);
    setLayerImages((prev) => ({ ...prev, [activeLayerId]: { ...activeLayerImage, height: nextH } }));
  };
  const updateActiveImageBgColor = (color: string) => {
    if (!activeLayerId || !activeLayerImage) return;
    setLayerImages((prev) => ({ ...prev, [activeLayerId]: { ...activeLayerImage, bgColor: color } }));
  };
  const applyCustomCanvasSize = () => {
    const nextWidth = Math.max(24, Math.min(8000, parseInt(customCanvasWidth, 10) || canvasSize.width));
    const nextHeight = Math.max(24, Math.min(8000, parseInt(customCanvasHeight, 10) || canvasSize.height));
    setCanvasSize({ width: nextWidth, height: nextHeight });
  };
  const applyCustomLayerSize = () => {
    if (activeLayerImage && activeLayerId) {
      const nextWidth = Math.max(1, parseInt(customLayerWidth, 10) || Math.round(activeLayerImage.width));
      const nextHeight = Math.max(1, parseInt(customLayerHeight, 10) || Math.round(activeLayerImage.height));
      setLayerImages((prev) => ({ ...prev, [activeLayerId]: { ...activeLayerImage, width: nextWidth, height: nextHeight } }));
      return;
    }
    if (activeLayerHasFill && activeLayerFillRect) {
      const width = Math.max(1, parseInt(customLayerWidth, 10) || Math.round(activeLayerFillRect.width));
      const height = Math.max(1, parseInt(customLayerHeight, 10) || Math.round(activeLayerFillRect.height));
      updateActiveLayerFillRect({ ...activeLayerFillRect, width, height });
    }
  };

  const exportPng = () => {
    const c = document.createElement('canvas'); c.width = canvasSize.width; c.height = canvasSize.height; const ctx = c.getContext('2d'); if (!ctx) return;
    layers.slice().reverse().forEach((l) => {
      if (!l.visible) return;
      const lc = ensureLayerCanvas(l.id);
      const obj = layerImages[l.id];
      const strokes = vectorStrokesByLayer[l.id] || [];
      const hasMask = l.maskEnabled;
      const mask = hasMask ? ensureLayerMask(l.id) : null;
      ctx.save();
      ctx.globalAlpha = l.opacity;
      ctx.globalCompositeOperation = l.blendMode;
      if (hasMask && mask) {
        const tmp = document.createElement('canvas');
        tmp.width = c.width; tmp.height = c.height;
        const tctx = tmp.getContext('2d');
        if (tctx) {
          drawLayerFillObject(tctx, l);
          if (obj) {
            drawLayerImageObject(tctx, l.id, obj);
          }
          tctx.drawImage(lc, 0, 0);
          strokes.forEach((s) => drawVectorStroke(tctx, s));
          tctx.globalCompositeOperation = 'destination-in';
          tctx.drawImage(mask, 0, 0);
          ctx.drawImage(tmp, 0, 0);
        }
      } else {
        drawLayerFillObject(ctx, l);
        if (obj) {
          drawLayerImageObject(ctx, l.id, obj);
        }
        ctx.drawImage(lc, 0, 0);
        strokes.forEach((s) => drawVectorStroke(ctx, s));
      }
      ctx.restore();
    });
    const a = document.createElement('a'); a.href = c.toDataURL('image/png'); a.download = `drawing-${Date.now()}.png`; a.click();
  };

  const saveToGallery = async () => {
    const c = document.createElement('canvas'); c.width = canvasSize.width; c.height = canvasSize.height; const ctx = c.getContext('2d'); if (!ctx) return;
    layers.slice().reverse().forEach((l) => {
      if (!l.visible) return;
      const lc = ensureLayerCanvas(l.id);
      const obj = layerImages[l.id];
      const strokes = vectorStrokesByLayer[l.id] || [];
      const hasMask = l.maskEnabled;
      const mask = hasMask ? ensureLayerMask(l.id) : null;
      ctx.save();
      ctx.globalAlpha = l.opacity;
      ctx.globalCompositeOperation = l.blendMode;
      if (hasMask && mask) {
        const tmp = document.createElement('canvas');
        tmp.width = c.width; tmp.height = c.height;
        const tctx = tmp.getContext('2d');
        if (tctx) {
          drawLayerFillObject(tctx, l);
          if (obj) {
            drawLayerImageObject(tctx, l.id, obj);
          }
          tctx.drawImage(lc, 0, 0);
          strokes.forEach((s) => drawVectorStroke(tctx, s));
          tctx.globalCompositeOperation = 'destination-in';
          tctx.drawImage(mask, 0, 0);
          ctx.drawImage(tmp, 0, 0);
        }
      } else {
        drawLayerFillObject(ctx, l);
        if (obj) {
          drawLayerImageObject(ctx, l.id, obj);
        }
        ctx.drawImage(lc, 0, 0);
        strokes.forEach((s) => drawVectorStroke(ctx, s));
      }
      ctx.restore();
    });
    try {
      await saveStickerToDB({ id: `drawing_${Date.now()}`, imageUrl: c.toDataURL('image/png'), phrase: 'Drawing Studio', timestamp: Date.now() });
      showToast(t('packager.status.savedToCollection', { defaultValue: '\u5df2\u5132\u5b58\u81f3\u4f5c\u54c1\u96c6' }), 'success');
    } catch (error) {
      console.error(error);
      showToast(t('packager.status.saveFailed', { defaultValue: '\u5132\u5b58\u5931\u6557' }), 'error');
    }
  };

  const handleGallerySelect = async (blobs: Blob[]) => {
    if (!blobs.length) return;
    await importToActiveLayer(new File([blobs[0]], `gallery-${Date.now()}.png`, { type: blobs[0].type || 'image/png' }));
  };

  const brushSummary = useMemo(() => `${brushTypeLabel(brushType)} · ${brushSize}px · ${(brushOpacity * 100).toFixed(0)}%`, [brushOpacity, brushSize, brushType]);
  const layerLimitReached = layers.length >= MAX_LAYERS;

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100dvh-120px)] min-h-[640px] bg-cream-light">
      <main className="flex-1 min-w-0 flex flex-col lg:block p-4 lg:p-6 border-b lg:border-b-0 lg:border-r border-cream-dark/50">
        <div className="hidden lg:block">
          <CanvasToolbar
            historyIndex={historyIndex}
            historyLength={history.length}
            activeLocked={activeLocked}
            mode={mode}
            eyedropper={eyedropper}
            brushSummary={brushSummary}
            onUndo={() => void undo()}
            onRedo={() => void redo()}
            onClearLayer={clearActiveLayer}
            onImportFile={(f) => void importToActiveLayer(f)}
            onOpenGallery={() => setShowGalleryPicker(true)}
            onToggleEyedropper={() => setEyedropper((v) => !v)}
            onSetMode={setMode}
            onClearSelection={() => setSelectionRect(null)}
            onSaveToGallery={() => void saveToGallery()}
            onExportPng={exportPng}
          />
        </div>

        {/* Mobile compact toolbar: primary actions reachable without opening a drawer */}
        <div className="lg:hidden shrink-0 mb-3 space-y-2">
          <div className="flex items-center gap-2">
            <div className="inline-flex rounded-lg border overflow-hidden bg-white">
              <button
                onClick={() => void undo()}
                disabled={historyIndex <= 0}
                className="p-2.5 disabled:opacity-40"
                aria-label={t('common.undo', { defaultValue: '復原' })}
              >
                <Undo2 size={16} />
              </button>
              <button
                onClick={() => void redo()}
                disabled={historyIndex >= history.length - 1}
                className="p-2.5 border-l disabled:opacity-40"
                aria-label={t('common.redo', { defaultValue: '重做' })}
              >
                <Redo2 size={16} />
              </button>
            </div>
            <div className="inline-flex rounded-lg border overflow-hidden bg-white">
              <button
                onClick={() => setBrushType('pen')}
                className={`p-2.5 ${brushType !== 'eraser' ? 'bg-primary text-white' : ''}`}
                aria-pressed={brushType !== 'eraser'}
                aria-label={brushTypeLabel('pen')}
              >
                <Brush size={16} />
              </button>
              <button
                onClick={() => setBrushType('eraser')}
                className={`p-2.5 border-l ${brushType === 'eraser' ? 'bg-primary text-white' : ''}`}
                aria-pressed={brushType === 'eraser'}
                aria-label={brushTypeLabel('eraser')}
              >
                <Eraser size={16} />
              </button>
            </div>
            <button
              onClick={() => void saveToGallery()}
              className="p-2.5 rounded-lg border bg-white"
              aria-label={t('drawing.saveToGallery', { defaultValue: '儲存至作品集' })}
            >
              <Save size={16} />
            </button>
            <button
              onClick={exportPng}
              className="p-2.5 rounded-lg border bg-primary text-white ml-auto"
              aria-label={t('drawing.downloadPng', { defaultValue: '下載 PNG' })}
            >
              <Download size={16} />
            </button>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => setShowMobileToolsDrawer(true)}
              className="px-2 py-2 rounded-lg border border-cream-dark bg-white text-[11px] font-bold text-bronze-text inline-flex items-center justify-center gap-1"
            >
              <Wrench size={13} />{t('drawing.moreTools', { defaultValue: '更多工具' })}
            </button>
            <button
              onClick={() => setShowMobileBrushDrawer(true)}
              className="px-2 py-2 rounded-lg border border-cream-dark bg-white text-[11px] font-bold text-bronze-text inline-flex items-center justify-center gap-1"
            >
              <Palette size={13} />{t('drawing.brush', { defaultValue: '筆刷' })}
            </button>
            <button
              onClick={() => setShowMobileLayersDrawer(true)}
              className="px-2 py-2 rounded-lg border border-cream-dark bg-white text-[11px] font-bold text-bronze-text inline-flex items-center justify-center gap-1"
            >
              <Layers size={13} />{t('drawing.layers', { defaultValue: '圖層' })}
            </button>
          </div>
        </div>

        <div className="w-full flex-1 min-h-0 lg:h-[calc(100%-52px)] bg-[#dbe7e8] rounded-2xl border border-cream-dark/50 overflow-auto">
          <div className="sticky top-0 z-10 px-3 py-2">
            <div className="inline-flex items-center gap-2 rounded-lg border border-primary/30 bg-white/85 backdrop-blur px-2.5 py-1.5 text-[11px] font-bold text-bronze-text shadow-sm">
              <span className="text-primary">{t('drawing.activeLayer', { defaultValue: '\u76ee\u524d' })}:</span>
              <span className="max-w-[180px] truncate">{activeLayer?.name || '-'}</span>
              {activeLayer?.locked && (
                <span className="inline-flex items-center gap-1 text-bronze-light">
                  <Lock size={11} />
                  {t('drawing.lock', { defaultValue: '\u9396\u5b9a' })}
                </span>
              )}
            </div>
          </div>
          <div style={{ width: canvasSize.width * (zoom / 100), height: canvasSize.height * (zoom / 100), transformOrigin: 'top left' }}>
            <canvas ref={displayRef} className="block touch-none" style={{ width: '100%', height: '100%', cursor: eyedropper ? 'crosshair' : mode === 'transform' || mode === 'select' ? hoverCursor : 'default' }} onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={(e) => void finishStroke(e)} onPointerCancel={(e) => void finishStroke(e)} onPointerLeave={(e) => { setHoverCursor('default'); if (drawingRef.current.active || transformRef.current.active || selectionRef.current.active) void finishStroke(e); }} />
          </div>
        </div>
      </main>

      <aside className="hidden lg:block lg:w-[360px] bg-white/80 backdrop-blur-md p-4 overflow-y-auto border-l border-cream-dark/50 space-y-4">
        <BrushSettingsPanel
          brushType={brushType}
          brushColor={brushColor}
          brushSize={brushSize}
          brushOpacity={brushOpacity}
          pressureEnabled={pressureEnabled}
          pressureCurve={pressureCurve}
          smoothing={smoothing}
          spacing={spacing}
          vectorBrushEnabled={vectorBrushEnabled}
          vectorStabilizer={vectorStabilizer}
          maskPaintMode={maskPaintMode}
          hexCopied={hexCopied}
          customPresets={customPresets}
          setBrushType={setBrushType}
          setBrushColor={setBrushColor}
          setBrushSize={setBrushSize}
          setBrushOpacity={setBrushOpacity}
          setPressureEnabled={setPressureEnabled}
          setPressureCurve={setPressureCurve}
          setSmoothing={setSmoothing}
          setSpacing={setSpacing}
          setVectorBrushEnabled={setVectorBrushEnabled}
          setVectorStabilizer={setVectorStabilizer}
          setMaskPaintMode={setMaskPaintMode}
          onSavePreset={saveBrushPreset}
          onApplyPreset={applyBrushPreset}
          onRemovePreset={removeBrushPreset}
          onCopyHex={copyBrushHex}
        />

        <LayerPanel
          layers={layers}
          activeLayerId={activeLayerId}
          layerImages={layerImages}
          canvasSize={canvasSize}
          activeLayer={activeLayer}
          activeLayerImage={activeLayerImage}
          activeLayerHasFill={activeLayerHasFill}
          activeLayerFillRect={activeLayerFillRect}
          layerLimitReached={layerLimitReached}
          customLayerWidth={customLayerWidth}
          customLayerHeight={customLayerHeight}
          customCanvasWidth={customCanvasWidth}
          customCanvasHeight={customCanvasHeight}
          zoom={zoom}
          fitCanvasToImport={fitCanvasToImport}
          layerCanvasesRef={layerCanvasesRef}
          setLayers={setLayers}
          setActiveLayerId={setActiveLayerId}
          setCanvasSize={setCanvasSize}
          setCustomLayerWidth={setCustomLayerWidth}
          setCustomLayerHeight={setCustomLayerHeight}
          setCustomCanvasWidth={setCustomCanvasWidth}
          setCustomCanvasHeight={setCustomCanvasHeight}
          setZoom={setZoom}
          setFitCanvasToImport={setFitCanvasToImport}
          onAddLayer={addLayer}
          onDeleteLayer={deleteLayer}
          onDuplicateLayer={duplicateLayer}
          onRenameLayer={renameLayer}
          onMoveLayer={moveLayer}
          onUpdateActiveImageScale={updateActiveImageScale}
          onUpdateActiveImageWidth={updateActiveImageWidth}
          onUpdateActiveImageHeight={updateActiveImageHeight}
          onUpdateActiveImageBgColor={updateActiveImageBgColor}
          onApplyCustomLayerSize={applyCustomLayerSize}
          onApplyCustomCanvasSize={applyCustomCanvasSize}
          onApplyFitCanvasToActiveImage={() => void applyFitCanvasToActiveImage()}
        />
      </aside>
      {showGalleryPicker && <GalleryPicker onSelect={(blobs) => void handleGallerySelect(blobs)} onClose={() => setShowGalleryPicker(false)} />}

      <MobileDrawer
        isOpen={showMobileToolsDrawer}
        onClose={() => setShowMobileToolsDrawer(false)}
        titleId="drawing-mobile-tools-title"
        title={t('drawing.moreTools', { defaultValue: '更多工具' })}
      >
        <CanvasToolbar
          historyIndex={historyIndex}
          historyLength={history.length}
          activeLocked={activeLocked}
          mode={mode}
          eyedropper={eyedropper}
          brushSummary={brushSummary}
          onUndo={() => void undo()}
          onRedo={() => void redo()}
          onClearLayer={clearActiveLayer}
          onImportFile={(f) => void importToActiveLayer(f)}
          onOpenGallery={() => setShowGalleryPicker(true)}
          onToggleEyedropper={() => setEyedropper((v) => !v)}
          onSetMode={setMode}
          onClearSelection={() => setSelectionRect(null)}
          onSaveToGallery={() => void saveToGallery()}
          onExportPng={exportPng}
        />
      </MobileDrawer>

      <MobileDrawer
        isOpen={showMobileBrushDrawer}
        onClose={() => setShowMobileBrushDrawer(false)}
        titleId="drawing-mobile-brush-title"
        title={t('drawing.brush', { defaultValue: '筆刷' })}
      >
        <BrushSettingsPanel
          brushType={brushType}
          brushColor={brushColor}
          brushSize={brushSize}
          brushOpacity={brushOpacity}
          pressureEnabled={pressureEnabled}
          pressureCurve={pressureCurve}
          smoothing={smoothing}
          spacing={spacing}
          vectorBrushEnabled={vectorBrushEnabled}
          vectorStabilizer={vectorStabilizer}
          maskPaintMode={maskPaintMode}
          hexCopied={hexCopied}
          customPresets={customPresets}
          setBrushType={setBrushType}
          setBrushColor={setBrushColor}
          setBrushSize={setBrushSize}
          setBrushOpacity={setBrushOpacity}
          setPressureEnabled={setPressureEnabled}
          setPressureCurve={setPressureCurve}
          setSmoothing={setSmoothing}
          setSpacing={setSpacing}
          setVectorBrushEnabled={setVectorBrushEnabled}
          setVectorStabilizer={setVectorStabilizer}
          setMaskPaintMode={setMaskPaintMode}
          onSavePreset={saveBrushPreset}
          onApplyPreset={applyBrushPreset}
          onRemovePreset={removeBrushPreset}
          onCopyHex={copyBrushHex}
        />
      </MobileDrawer>

      <MobileDrawer
        isOpen={showMobileLayersDrawer}
        onClose={() => setShowMobileLayersDrawer(false)}
        titleId="drawing-mobile-layers-title"
        title={t('drawing.layers', { defaultValue: '圖層' })}
      >
        <LayerPanel
          layers={layers}
          activeLayerId={activeLayerId}
          layerImages={layerImages}
          canvasSize={canvasSize}
          activeLayer={activeLayer}
          activeLayerImage={activeLayerImage}
          activeLayerHasFill={activeLayerHasFill}
          activeLayerFillRect={activeLayerFillRect}
          layerLimitReached={layerLimitReached}
          customLayerWidth={customLayerWidth}
          customLayerHeight={customLayerHeight}
          customCanvasWidth={customCanvasWidth}
          customCanvasHeight={customCanvasHeight}
          zoom={zoom}
          fitCanvasToImport={fitCanvasToImport}
          layerCanvasesRef={layerCanvasesRef}
          setLayers={setLayers}
          setActiveLayerId={setActiveLayerId}
          setCanvasSize={setCanvasSize}
          setCustomLayerWidth={setCustomLayerWidth}
          setCustomLayerHeight={setCustomLayerHeight}
          setCustomCanvasWidth={setCustomCanvasWidth}
          setCustomCanvasHeight={setCustomCanvasHeight}
          setZoom={setZoom}
          setFitCanvasToImport={setFitCanvasToImport}
          onAddLayer={addLayer}
          onDeleteLayer={deleteLayer}
          onDuplicateLayer={duplicateLayer}
          onRenameLayer={renameLayer}
          onMoveLayer={moveLayer}
          onUpdateActiveImageScale={updateActiveImageScale}
          onUpdateActiveImageWidth={updateActiveImageWidth}
          onUpdateActiveImageHeight={updateActiveImageHeight}
          onUpdateActiveImageBgColor={updateActiveImageBgColor}
          onApplyCustomLayerSize={applyCustomLayerSize}
          onApplyCustomCanvasSize={applyCustomCanvasSize}
          onApplyFitCanvasToActiveImage={() => void applyFitCanvasToActiveImage()}
        />
      </MobileDrawer>
    </div>
  );
};

export default DrawingStudioApp;


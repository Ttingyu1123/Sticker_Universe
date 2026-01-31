import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { Upload, X, Check, Image as ImageIcon, Settings2, Download, RefreshCw, Layers, Zap, Maximize2, Move, Type, ShieldCheck, ChevronRight, Wand2, Palette, Sun, Sparkles, FileArchive, CheckCircle2, AlertCircle, Plus, Minus, ZoomIn, ZoomOut, RotateCcw, Undo2, Redo2, Star, Grip, Trash2, Ruler } from 'lucide-react';
import { processImage } from './services/ai/backgroundRemoval';
import { loadImage } from './utils/helpers';
import JSZip from 'jszip';
import saveAs from 'file-saver';
import { useTranslation } from 'react-i18next';
import { ProcessingStatus, SplitConfig } from './types';
import { GalleryPicker } from '../../components/GalleryPicker';
import { saveStickerToDB } from '../../db';
import { useLocation } from 'react-router-dom';

const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

interface ImageStats {
  width: number;
  height: number;
  aspectRatio: number;
  label: string;
}

interface TileInfo {
  url: string;
  width: number;
  height: number;
  image?: HTMLImageElement;
}

interface HistoryState {
  rowLines: number[];
  colLines: number[];
}

interface FileItem {
  id: string;
  file: File;
  preview: string;
  stats?: ImageStats;
  isProcessed?: boolean;
  baseTiles?: TileInfo[];
}

const Stepper = ({ label, value, min, max, onChange }: { label: string, value: number, min: number, max: number, onChange: (val: number) => void }) => (
  <div className="space-y-1">
    <label className="text-[10px] font-bold text-bronze-light uppercase tracking-wider">{label}</label>
    <div className="flex items-center bg-cream-medium/30 border border-cream-dark rounded-2xl overflow-hidden shadow-sm">
      <button
        onClick={() => onChange(Math.max(min, value - 1))}
        className="p-3 text-bronze-light hover:bg-cream-medium hover:text-primary active:bg-cream-dark transition-colors"
        disabled={value <= min}
      >
        <Minus size={14} />
      </button>
      <input
        type="number"
        value={value}
        onChange={(e) => {
          const val = parseInt(e.target.value);
          if (!isNaN(val)) onChange(Math.min(max, Math.max(min, val)));
        }}
        className="w-full py-2 text-center bg-transparent font-bold text-sm text-bronze-text outline-none appearance-none"
      />
      <button
        onClick={() => onChange(Math.min(max, value + 1))}
        className="p-3 text-bronze-light hover:bg-cream-medium hover:text-primary active:bg-cream-dark transition-colors"
        disabled={value >= max}
      >
        <Plus size={14} />
      </button>
    </div>
  </div>
);

const App: React.FC = () => {
  const { t } = useTranslation();
  const [fileQueue, setFileQueue] = useState<FileItem[]>([]);
  const [activeFileId, setActiveFileId] = useState<string | null>(null);
  const [status, setStatus] = useState<ProcessingStatus>('idle');
  const [statusMsg, setStatusMsg] = useState<string>('');
  const [progress, setProgress] = useState<number>(0);
  const [isDragging, setIsDragging] = useState(false);
  const [zipBlob, setZipBlob] = useState<Blob | null>(null);
  const [processedTiles, setProcessedTiles] = useState<TileInfo[]>([]);
  const [viewMode, setViewMode] = useState<'original' | 'result'>('original');
  const [helperBg, setHelperBg] = useState<'checkerboard' | 'green' | 'black' | 'white'>('checkerboard');
  const [showAdvancedAI, setShowAdvancedAI] = useState(false);
  const [elapsedTime, setElapsedTime] = useState<string | null>(null);
  const [showGallery, setShowGallery] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const state = location.state as { image?: string };
    if (state?.image) {
      fetch(state.image)
        .then(res => res.blob())
        .then(blob => {
          const file = new File([blob], `from_gallery_${Date.now()}.png`, { type: blob.type });
          const dataTransfer = new DataTransfer();
          dataTransfer.items.add(file);
          handleFiles(dataTransfer.files);
        });

      // Clear state
      window.history.replaceState({}, document.title);
    }
  }, []);

  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [history, setHistory] = useState<HistoryState[]>([]);
  const [historyIdx, setHistoryIdx] = useState(-1);
  const [isPanning, setIsPanning] = useState(false);

  const [config, setConfig] = useState<SplitConfig>({
    rows: 2,
    cols: 2,
    useAI: false,
    tolerance: 10,
    protectInternal: false,
    retainText: false,
    manualMode: false,
    rowLines: [0, 0.5, 1],
    colLines: [0, 0.5, 1],
    scaleFactor: 1,
    preset: 'none',
    margin: 0.05,
    outputFormat: 'png',
    filenamePrefix: 'sticker',
    useStroke: false,
    strokeThickness: 5,
    strokeColor: '#ffffff',
    useShadow: false,
    useFeathering: false
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const actualImageContainerRef = useRef<HTMLDivElement>(null);
  const lastMousePos = useRef({ x: 0, y: 0 });

  const activeFile = useMemo(() => fileQueue.find(f => f.id === activeFileId), [fileQueue, activeFileId]);
  const isCoreProcessed = useMemo(() => fileQueue.length > 0 && fileQueue.every(f => !!f.baseTiles), [fileQueue]);

  // 資源回收機制
  const revokeItemResources = (item: FileItem) => {
    if (item.preview.startsWith('blob:')) URL.revokeObjectURL(item.preview);
    item.baseTiles?.forEach(t => {
      if (t.url.startsWith('blob:')) URL.revokeObjectURL(t.url);
    });
  };

  // Fix: Implemented getHelperBgClass to return the appropriate Tailwind class for the current helperBg state.
  const getHelperBgClass = () => {
    switch (helperBg) {
      case 'green': return 'bg-[#B0C4B1]'; // Morandi Sage Green
      case 'black': return 'bg-[#4A4238]'; // Warm dark brown
      case 'white': return 'bg-white';
      case 'checkerboard': return 'bg-slate-50'; // Warm grey
      default: return '';
    }
  };

  useEffect(() => {
    if (!config.manualMode) {
      const rLines = Array.from({ length: config.rows + 1 }, (_, i) => i / config.rows);
      const cLines = Array.from({ length: config.cols + 1 }, (_, i) => i / config.cols);
      updateLinesWithHistory(rLines, cLines, false);
    }
  }, [config.rows, config.cols]);

  const updateLinesWithHistory = (rows: number[], cols: number[], save = true) => {
    setConfig(prev => ({ ...prev, rowLines: rows, colLines: cols }));
    if (save) {
      const newState = { rowLines: rows, colLines: cols };
      setHistory(prevHistory => {
        const newHistory = prevHistory.slice(0, historyIdx + 1);
        newHistory.push(newState);
        return newHistory.slice(-30);
      });
      setHistoryIdx(prev => Math.min(prev + 1, 29));
    }
  };

  const undo = () => {
    if (historyIdx > 0) {
      const prev = history[historyIdx - 1];
      setConfig(prevConfig => ({ ...prevConfig, rowLines: [...prev.rowLines], colLines: [...prev.colLines], rows: prev.rowLines.length - 1, cols: prev.colLines.length - 1, manualMode: true }));
      setHistoryIdx(historyIdx - 1);
    }
  };

  const redo = () => {
    if (historyIdx < history.length - 1) {
      const next = history[historyIdx + 1];
      setConfig(prevConfig => ({ ...prevConfig, rowLines: [...next.rowLines], colLines: [...next.colLines], rows: next.rowLines.length - 1, cols: next.colLines.length - 1, manualMode: true }));
      setHistoryIdx(historyIdx + 1);
    }
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      setZoom(prev => Math.max(0.5, Math.min(5, prev * delta)));
    }
  };

  const startPan = (e: React.MouseEvent) => {
    if (e.button === 1 || (e.button === 0 && e.altKey)) {
      setIsPanning(true);
      lastMousePos.current = { x: e.clientX, y: e.clientY };
    }
  };

  const onPan = (e: React.MouseEvent) => {
    if (isPanning) {
      const dx = e.clientX - lastMousePos.current.x;
      const dy = e.clientY - lastMousePos.current.y;
      setPan(prev => ({ x: prev.x + dx, y: prev.y + dy }));
      lastMousePos.current = { x: e.clientX, y: e.clientY };
    }
  };

  const handleLineDrag = (type: 'row' | 'col', index: number, e: React.MouseEvent | React.TouchEvent) => {
    if (!config.manualMode || !actualImageContainerRef.current) return;
    e.stopPropagation();
    let currentRows = [...config.rowLines];
    let currentColS = [...config.colLines];
    const rect = actualImageContainerRef.current.getBoundingClientRect();
    const handleMove = (moveEvent: MouseEvent | TouchEvent) => {
      const clientX = 'touches' in moveEvent ? moveEvent.touches[0].clientX : (moveEvent as MouseEvent).clientX;
      const clientY = 'touches' in moveEvent ? moveEvent.touches[0].clientY : (moveEvent as MouseEvent).clientY;
      if (type === 'row') {
        currentRows[index] = Math.max(0, Math.min(1, (clientY - rect.top) / rect.height));
        currentRows.sort((a, b) => a - b);
      } else {
        currentColS[index] = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
        currentColS.sort((a, b) => a - b);
      }
      setConfig(prev => ({ ...prev, rowLines: [...currentRows], colLines: [...currentColS] }));
    };
    const handleUp = () => {
      updateLinesWithHistory(currentRows, currentColS);
      window.removeEventListener('mousemove', handleMove); window.removeEventListener('mouseup', handleUp);
      window.removeEventListener('touchmove', handleMove); window.removeEventListener('touchend', handleUp);
    };
    window.addEventListener('mousemove', handleMove); window.addEventListener('mouseup', handleUp);
    window.addEventListener('touchmove', handleMove); window.addEventListener('touchend', handleUp);
  };

  const handleFiles = async (files: FileList) => {
    const newItems: FileItem[] = [];
    for (let i = 0; i < files.length; i++) {
      const f = files[i];
      if (!f.type.startsWith('image/')) continue;
      const id = Math.random().toString(36).substr(2, 9);
      const preview = URL.createObjectURL(f);
      const img = await loadImage(preview);
      newItems.push({ id, file: f, preview, stats: { width: img.width, height: img.height, aspectRatio: img.width / img.height, label: `${img.width}x${img.height} ` } });
    }
    setFileQueue(prev => [...prev, ...newItems]);
    if (!activeFileId && newItems.length > 0) setActiveFileId(newItems[0].id);
  };

  const removeFile = (id: string) => {
    setFileQueue(prev => {
      const target = prev.find(f => f.id === id);
      if (target) revokeItemResources(target);
      const filtered = prev.filter(f => f.id !== id);
      if (activeFileId === id) setActiveFileId(filtered.length > 0 ? filtered[0].id : null);
      return filtered;
    });
  };

  const autoDetectGrid = async () => {
    if (!activeFile) return;
    setStatus('splitting');
    setStatusMsg(t('packager.status.detecting'));
    try {
      const img = await loadImage(activeFile.preview);
      const canvas = document.createElement('canvas');
      canvas.width = img.width; canvas.height = img.height;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0);
      const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
      const xProj = new Array(canvas.width).fill(0), yProj = new Array(canvas.height).fill(0);
      for (let y = 0; y < canvas.height; y++) {
        for (let x = 0; x < canvas.width; x++) {
          if (data[(y * canvas.width + x) * 4 + 3] > 10) { xProj[x]++; yProj[y]++; }
        }
      }
      const findGaps = (proj: number[]) => {
        const gaps: number[] = [0];
        let inGap = false, start = 0;
        for (let i = 0; i < proj.length; i++) {
          if (proj[i] === 0 && !inGap) { inGap = true; start = i; }
          else if (proj[i] !== 0 && inGap) { inGap = false; if (start !== 0) gaps.push((start + i) / 2 / proj.length); }
        }
        gaps.push(1);
        return Array.from(new Set(gaps)).sort((a, b) => a - b);
      };
      const newCols = findGaps(xProj), newRows = findGaps(yProj);
      updateLinesWithHistory(newRows, newCols);
      setConfig(prev => ({ ...prev, rows: newRows.length - 1, cols: newCols.length - 1, manualMode: true }));
      setStatus('success'); setStatusMsg(t('packager.status.detectSuccess'));
    } catch (e) { setStatus('error'); setStatusMsg(t('packager.status.detectFail')); }
  };

  const performCoreProcess = async () => {
    if (fileQueue.length === 0) return;
    setStatus('removing_bg'); setProgress(0);
    const startTime = Date.now();
    const newQueue = [...fileQueue];

    try {
      for (let fIdx = 0; fIdx < newQueue.length; fIdx++) {
        const item = newQueue[fIdx];
        setStatusMsg(`${t('packager.status.coreProcessing')} (${fIdx + 1}/${newQueue.length}): ${item.file.name} `);

        let activeBlob: Blob | string = item.file;
        if (config.useAI) {
          activeBlob = await processImage(item.file, (p) => {
            // Calculate total progress: current file index + current file progress / total files
            setProgress(Math.round(((fIdx + p) / newQueue.length) * 100));
          });
        }

        const imgUrl = typeof activeBlob === 'string' ? activeBlob : URL.createObjectURL(activeBlob);
        const img = await loadImage(imgUrl);
        const tempBaseTiles: TileInfo[] = [];

        for (let y = 0; y < config.rowLines.length - 1; y++) {
          for (let x = 0; x < config.colLines.length - 1; x++) {
            const sx = config.colLines[x] * img.width, sy = config.rowLines[y] * img.height;
            const sw = Math.max(1, (config.colLines[x + 1] - config.colLines[x]) * img.width);
            const sh = Math.max(1, (config.rowLines[y + 1] - config.rowLines[y]) * img.height);
            const canvas = document.createElement('canvas');
            canvas.width = Math.round(sw * config.scaleFactor);
            canvas.height = Math.round(sh * config.scaleFactor);
            const ctx = canvas.getContext('2d')!;
            ctx.drawImage(img, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
            const blob = await new Promise<Blob | null>(r => canvas.toBlob(r, 'image/png'));
            if (blob) {
              const url = URL.createObjectURL(blob);
              tempBaseTiles.push({ url, width: canvas.width, height: canvas.height, image: await loadImage(url) });
            }
          }
        }
        item.baseTiles = tempBaseTiles; item.isProcessed = true;
        if (typeof activeBlob !== 'string') URL.revokeObjectURL(imgUrl);
        setProgress(Math.round(((fIdx + 1) / newQueue.length) * 100));
      }
      setFileQueue(newQueue); setStatus('success');
      setElapsedTime(((Date.now() - startTime) / 1000).toFixed(1));
      setStatusMsg(t('packager.status.coreComplete'));
      applyBeautification();
    } catch (e: any) { setStatus('error'); setStatusMsg(`${t('packager.status.processingFail')}${e.message} `); }
  };

  const applyBeautification = async () => {
    if (!isCoreProcessed) return;
    setStatus('splitting'); setStatusMsg(t('packager.status.applying'));
    const startTime = Date.now();
    const zip = new JSZip();
    const mimeType = config.outputFormat === 'webp' ? 'image/webp' : 'image/png';
    const extension = config.outputFormat === 'webp' ? 'webp' : 'png';
    const newProcessedTiles: TileInfo[] = [];

    try {
      for (let fIdx = 0; fIdx < fileQueue.length; fIdx++) {
        const item = fileQueue[fIdx];
        const tiles = item.baseTiles!;
        const presetSize = { none: null, line: { w: 370, h: 320 }, telegram: { w: 512, h: 512 } }[config.preset];

        for (let i = 0; i < tiles.length; i++) {
          const base = tiles[i];
          const finalW = presetSize ? presetSize.w : base.width;
          const finalH = presetSize ? presetSize.h : base.height;
          const canvas = document.createElement('canvas');
          canvas.width = finalW; canvas.height = finalH;
          const ctx = canvas.getContext('2d')!;

          const safeW = finalW * (1 - config.margin * 2), safeH = finalH * (1 - config.margin * 2);
          const scale = Math.min(safeW / base.width, safeH / base.height, 100);
          const dw = base.width * scale, dh = base.height * scale;
          const dx = (finalW - dw) / 2, dy = (finalH - dh) / 2;

          if (config.useFeathering) ctx.filter = 'blur(1px)';
          if (config.useShadow) {
            ctx.shadowColor = 'rgba(0,0,0,0.25)'; ctx.shadowBlur = 12 * scale;
            ctx.shadowOffsetX = 3 * scale; ctx.shadowOffsetY = 3 * scale;
          }
          if (config.useStroke) {
            const sCanvas = document.createElement('canvas'); sCanvas.width = finalW; sCanvas.height = finalH;
            const sCtx = sCanvas.getContext('2d')!;
            const st = config.strokeThickness * scale;
            for (let a = 0; a < 360; a += 30) {
              const rad = a * Math.PI / 180;
              sCtx.drawImage(base.image!, dx + Math.cos(rad) * st, dy + Math.sin(rad) * st, dw, dh);
            }
            sCtx.globalCompositeOperation = 'source-in'; sCtx.fillStyle = config.strokeColor;
            sCtx.fillRect(0, 0, finalW, finalH);
            ctx.drawImage(sCanvas, 0, 0);
          }
          ctx.drawImage(base.image!, dx, dy, dw, dh);

          const finalBlob = await new Promise<Blob | null>(r => canvas.toBlob(r, mimeType, 0.92));
          if (finalBlob) {
            const folder = fileQueue.length > 1 ? `${item.file.name.split('.')[0]}/` : '';
            const name = `${config.filenamePrefix}_${Math.floor(i / (config.colLines.length - 1)) + 1}_${(i % (config.colLines.length - 1)) + 1}.${extension}`;
            zip.file(`${folder}${name}`, finalBlob);
            if (item.id === activeFileId) newProcessedTiles.push({ url: URL.createObjectURL(finalBlob), width: finalW, height: finalH });
          }
        }
      }
      setZipBlob(await zip.generateAsync({ type: 'blob' })); setProcessedTiles(newProcessedTiles);
      setZipBlob(await zip.generateAsync({ type: 'blob' })); setProcessedTiles(newProcessedTiles);
      setStatus('success'); setElapsedTime(((Date.now() - startTime) / 1000).toFixed(1));
      setStatusMsg(`${t('packager.status.complete')}`); setViewMode('result');
    } catch (e: any) { setStatus('error'); setStatusMsg(`${t('packager.status.failed')}${e.message}`); }
  };

  const reset = () => { fileQueue.forEach(revokeItemResources); setFileQueue([]); setActiveFileId(null); setZipBlob(null); setProcessedTiles([]); setStatus('idle'); setElapsedTime(null); };

  const estimatedSize = useMemo(() => {
    if (!activeFile?.stats) return null;
    if (config.preset === 'line') return { w: 370, h: 320, label: t('packager.phase2.line') };
    if (config.preset === 'telegram') return { w: 512, h: 512, label: t('packager.phase2.telegram') };
    return { w: Math.round((config.colLines[1] - config.colLines[0]) * activeFile.stats.width * config.scaleFactor), h: Math.round((config.rowLines[1] - config.rowLines[0]) * activeFile.stats.height * config.scaleFactor), label: t('packager.phase1.outputSize') };
  }, [activeFile, config.colLines, config.rowLines, config.scaleFactor, config.preset]);

  return (
    <div className="min-h-screen pb-20 select-none font-sans text-slate-700 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-indigo-100/50 via-slate-50 to-pink-50/30">
      {showGallery && (
        <GalleryPicker
          onSelect={(blobs) => {
            const dataTransfer = new DataTransfer();
            blobs.forEach(blob => {
              const file = new File([blob], `gallery_${Date.now()}.png`, { type: blob.type });
              dataTransfer.items.add(file);
            });
            handleFiles(dataTransfer.files);
            setShowGallery(false);
          }}
          onClose={() => setShowGallery(false)}
        />
      )}

      {/* Structural Header (Desktop) */}
      <header className="hidden md:block bg-white border-b border-slate-200 px-6 py-3 sticky top-0 z-30 shadow-sm flex-shrink-0">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Left Side Spacer */}
          <div className="flex-1"></div>

          {/* Right Side Tools */}
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
              <button onClick={undo} disabled={historyIdx <= 0} className="p-1.5 sm:p-2 hover:bg-white rounded-lg disabled:opacity-30 text-slate-500 hover:text-violet-600 transition-all shadow-sm"><Undo2 size={16} /></button>
              <button onClick={redo} disabled={historyIdx >= history.length - 1} className="p-1.5 sm:p-2 hover:bg-white rounded-lg disabled:opacity-30 text-slate-500 hover:text-violet-600 transition-all shadow-sm"><Redo2 size={16} /></button>
            </div>
            <button onClick={reset} className="px-3 py-2 sm:px-4 bg-white border border-slate-200 hover:border-red-200 hover:bg-red-50 hover:text-red-500 text-slate-500 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-sm">
              <RefreshCw size={14} /> <span className="hidden sm:inline">{t('packager.reset')}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Controls (Keep as is just not fixed top overlap?) 
          Actually mobile layout is complex. User specifically asked for DESKTOP parity with LayerLab.
          I will leave mobile controls mostly as is but ensure main content isn't padded unnecessarily on desktop.
      */}

      <main className="max-w-7xl mx-auto px-6 pt-6 grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-6">
          {fileQueue.length === 0 ? (
            <div onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }} onDragLeave={() => setIsDragging(false)} onDrop={(e) => { e.preventDefault(); setIsDragging(false); if (e.dataTransfer.files) handleFiles(e.dataTransfer.files); }} onClick={() => fileInputRef.current?.click()} className={`group border-3 border-dashed rounded-[2.5rem] p-20 flex flex-col items-center justify-center cursor-pointer transition-all duration-500 min-h-[500px] ${isDragging ? 'drag-active border-primary bg-primary/5' : 'border-cream-dark bg-cream-medium/50 hover:border-primary/50 hover:bg-white/50'}`}>
              <input ref={fileInputRef} type="file" multiple className="hidden" onChange={(e) => e.target.files && handleFiles(e.target.files)} accept="image/*" />
              <div className="bg-white p-10 rounded-full group-hover:scale-110 transition-transform duration-500 shadow-xl shadow-primary/10 text-primary"><Upload size={48} /></div>
              <h3 className="mt-8 text-2xl font-black text-bronze-text tracking-tight">{t('packager.upload.dragDrop')}</h3>
              <p className="mt-3 text-bronze-light font-bold text-sm tracking-wide uppercase">{t('packager.upload.support')}</p>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowGallery(true);
                }}
                className="mt-8 px-6 py-2.5 bg-white text-primary hover:text-primary-hover rounded-full font-bold text-sm shadow-sm border border-cream-dark hover:bg-cream-light transition-all z-10 flex items-center gap-2 group/btn"
              >
                <div className="bg-primary/10 text-primary p-1 rounded-full group-hover/btn:bg-primary/20 transition-colors">
                  <ImageIcon size={16} />
                </div>
                {t('packager.upload.gallery')}
              </button>
            </div>
          ) : (
            <div className="space-y-4 animate-in fade-in duration-500">
              <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-hide">
                <button onClick={() => fileInputRef.current?.click()} className="flex-shrink-0 w-16 h-16 border-2 border-dashed border-cream-dark rounded-xl flex items-center justify-center text-bronze-light hover:border-primary hover:text-primary transition-colors"><Plus size={20} /></button>
                <button onClick={() => setShowGallery(true)} className="flex-shrink-0 w-16 h-16 border-2 border-dashed border-secondary/20 bg-secondary/10 rounded-xl flex items-center justify-center text-secondary hover:border-secondary hover:text-secondary transition-colors"><ImageIcon size={20} /></button>
                {fileQueue.map(item => (
                  <div key={item.id} className="relative group flex-shrink-0">
                    <img src={item.preview} onClick={() => { setActiveFileId(item.id); setViewMode(item.baseTiles ? 'result' : 'original'); }} className={`w-16 h-16 object-cover rounded-xl cursor-pointer border-2 transition-all ${activeFileId === item.id ? 'border-primary shadow-md ring-2 ring-primary/20 scale-105' : 'border-white grayscale-[40%] hover:grayscale-0'}`} />
                    {item.isProcessed && <div className="absolute top-1 left-1 bg-green-500 text-white rounded-full p-0.5 shadow-sm"><Check size={8} /></div>}
                    <button onClick={() => removeFile(item.id)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 shadow-sm transition-opacity"><Trash2 size={10} /></button>
                  </div>
                ))}
              </div>

              <div className="bg-cream-light/30 border border-cream-dark backdrop-blur-xl rounded-3xl p-4 relative shadow-sm">
                <div className="flex items-center justify-between mb-4 px-2">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-black text-bronze-text uppercase tracking-widest truncate max-w-[200px]">{activeFile?.file.name}</span>
                    <span className="text-[9px] text-bronze-light font-bold bg-cream-medium/50 px-3 py-1 rounded-full border border-cream-dark">{activeFile?.stats?.label}</span>
                  </div>
                  {isCoreProcessed && (
                    <div className="flex bg-cream-medium/50 p-1 rounded-xl border border-cream-dark">
                      <button onClick={() => setViewMode('original')} className={`px-5 py-2 rounded-lg text-[10px] font-bold transition-all ${viewMode === 'original' ? 'bg-white shadow-sm text-primary' : 'text-bronze-light'}`}>{t('packager.preview.editAlignment')}</button>
                      <button onClick={() => setViewMode('result')} className={`px-5 py-2 rounded-lg text-[10px] font-bold transition-all ${viewMode === 'result' ? 'bg-white shadow-sm text-primary' : 'text-bronze-light'}`}>{t('packager.preview.previewResult')}</button>
                    </div>
                  )}
                </div>

                <div className="relative rounded-2xl border border-cream-dark min-h-[500px] bg-cream-medium/20 overflow-hidden flex items-center justify-center cursor-grab active:cursor-grabbing shadow-inner" onWheel={handleWheel} onMouseDown={startPan} onMouseMove={onPan} onMouseUp={() => setIsPanning(false)}>
                  <div className="absolute top-4 left-4 z-40 flex flex-col gap-2">
                    <div className="bg-white/90 backdrop-blur-md p-1 rounded-xl shadow-lg border border-white flex flex-col gap-1">
                      <button onClick={() => setZoom(prev => Math.min(5, prev + 0.25))} className="p-2 hover:bg-primary/10 rounded-lg text-primary transition-colors"><ZoomIn size={16} /></button>
                      <button onClick={() => setZoom(prev => Math.max(0.5, prev - 0.25))} className="p-2 hover:bg-primary/10 rounded-lg text-primary transition-colors"><ZoomOut size={16} /></button>
                      <button onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }} className="p-2 hover:bg-primary/10 rounded-lg text-primary transition-colors"><RotateCcw size={16} /></button>
                    </div>
                    {viewMode === 'original' && activeFile && (
                      <button onClick={autoDetectGrid} className="bg-primary text-white p-2.5 rounded-xl shadow-lg hover:bg-primary-hover transition-all flex items-center gap-2 group overflow-hidden max-w-[42px] hover:max-w-[150px]">
                        <Sparkles size={18} className="shrink-0" /><span className="text-[10px] font-bold whitespace-nowrap opacity-0 group-hover:opacity-100">{t('packager.preview.aiDetect')}</span>
                      </button>
                    )}
                  </div>

                  {viewMode === 'original' ? (
                    <div ref={actualImageContainerRef} className="relative origin-center shadow-2xl transition-transform duration-75" style={{ aspectRatio: activeFile?.stats ? `${activeFile.stats.width} / ${activeFile.stats.height}` : 'auto', transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`, maxHeight: '600px', maxWidth: '100%' }}>
                      {activeFile && <img src={activeFile.preview} alt="Preview" className="w-full h-full block select-none pointer-events-none" />}
                      {config.rowLines.map((line, idx) => idx !== 0 && idx !== config.rowLines.length - 1 && (
                        <div key={idx} className={`absolute w-full h-1 left-0 z-20 group ${config.manualMode ? 'cursor-row-resize' : 'pointer-events-none'}`} style={{ top: `${line * 100}%` }} onMouseDown={(e) => handleLineDrag('row', idx, e)} onTouchStart={(e) => handleLineDrag('row', idx, e)}>
                          <div className={`w-full h-full border-t-2 border-dashed ${config.manualMode ? 'border-amber-500 shadow-sm' : 'border-white/60'}`} />
                        </div>
                      ))}
                      {config.colLines.map((line, idx) => idx !== 0 && idx !== config.colLines.length - 1 && (
                        <div key={idx} className={`absolute h-full w-1 top-0 z-20 group ${config.manualMode ? 'cursor-col-resize' : 'pointer-events-none'}`} style={{ left: `${line * 100}%` }} onMouseDown={(e) => handleLineDrag('col', idx, e)} onTouchStart={(e) => handleLineDrag('col', idx, e)}>
                          <div className={`h-full w-full border-l-2 border-dashed ${config.manualMode ? 'border-amber-500 shadow-sm' : 'border-white/60'}`} />
                        </div>
                      ))}
                      {Array.from({ length: (config.rowLines.length - 1) * (config.colLines.length - 1) }).map((_, i) => {
                        const r = Math.floor(i / (config.colLines.length - 1)), c = i % (config.colLines.length - 1);
                        return <div key={i} className="absolute border border-white/20 bg-primary/10 pointer-events-none flex items-center justify-center overflow-hidden" style={{ top: `${config.rowLines[r] * 100}%`, left: `${config.colLines[c] * 100}%`, width: `${(config.colLines[c + 1] - config.colLines[c]) * 100}%`, height: `${(config.rowLines[r + 1] - config.rowLines[r]) * 100}%` }}>
                          <span className="text-[10px] font-black text-white bg-black/40 px-2 py-0.5 rounded-full backdrop-blur-sm">#{r + 1}-{c + 1}</span>
                        </div>
                      })}
                    </div>
                  ) : (
                    <div className={`w-full h-full flex flex-col items-center justify-center relative ${getHelperBgClass()}`} style={{ transform: `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)`, ...(helperBg === 'checkerboard' ? { backgroundImage: 'conic-gradient(#eee 90deg,#fff 90deg 180deg,#eee 180deg 270deg,#fff 270deg)', backgroundSize: '16px 16px' } : {}) }}>
                      <div className="grid p-4 gap-2 w-full max-h-[95%] overflow-y-auto" style={{ gridTemplateRows: `repeat(${config.rowLines.length - 1}, 1fr)`, gridTemplateColumns: `repeat(${config.colLines.length - 1}, 1fr)` }}>
                        {processedTiles.map((tile, i) => (
                          <div key={i} className="flex flex-col items-center gap-1 animate-in zoom-in-90 duration-300">
                            <div className="aspect-square w-full rounded-xl overflow-hidden border border-black/5 bg-transparent backdrop-blur-sm shadow-sm flex items-center justify-center p-1 group hover:scale-105 transition-transform">
                              <img src={tile.url} className="max-w-full max-h-full object-contain drop-shadow-xl" />
                            </div>
                            <span className="text-[10px] font-black text-primary bg-white px-2 py-0.5 rounded-full border border-primary/20 shadow-sm">{tile.width} × {tile.height}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex justify-center gap-3 mt-4">
                  {(['checkerboard', 'white', 'black', 'green'] as const).map(bg => (
                    <button key={bg} onClick={() => setHelperBg(bg)} className={`w-6 h-6 rounded-full border-2 transition-all ${helperBg === bg ? 'border-indigo-600 scale-125 ring-2 ring-indigo-100' : 'border-white'} ${bg === 'checkerboard' ? 'bg-slate-200' : bg === 'green' ? 'bg-[#00ff00]' : bg === 'black' ? 'bg-black' : 'bg-white'}`} />
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="lg:col-span-4 space-y-6 overflow-y-auto max-h-[calc(100vh-120px)] pr-2 scrollbar-thin">
          {status !== 'idle' && (
            <div className={`p-4 rounded-2xl border transition-all shadow-lg animate-in slide-in-from-right-4 ${status === 'error' ? 'bg-red-500/10 border-red-200 text-red-700' : 'bg-cream-light/30 border-cream-dark backdrop-blur-xl'}`}>
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-cream-medium/50 text-bronze-text shadow-inner">
                  {status === 'success' ? <CheckCircle2 size={22} className="text-emerald-500" /> : status === 'error' ? <AlertCircle size={22} /> : <div className="animate-spin rounded-full h-5 w-5 border-3 border-secondary border-t-transparent" />}
                </div>
                <div className="flex-1 min-w-0">
                  <span className="block text-[10px] font-black uppercase tracking-tighter opacity-50 text-bronze-light">{status === 'success' ? t('packager.status.complete') : t('packager.status.applying')}</span>
                  <p className="text-xs font-bold truncate text-bronze-text">{statusMsg}</p>
                </div>
                {elapsedTime && <div className="text-[10px] font-black px-2.5 py-1 bg-cream-medium rounded-lg text-bronze-light">{elapsedTime}s</div>}
              </div>
              {progress > 0 && progress < 100 && <div className="mt-4 h-2 w-full bg-cream-medium/30 rounded-full overflow-hidden shadow-inner"><div className="h-full bg-gradient-to-r from-secondary to-primary transition-all duration-300 shadow-lg" style={{ width: `${progress}%` }} /></div>}
            </div>
          )}

          <section className="bg-cream-light/30 border border-cream-dark backdrop-blur-xl rounded-[2rem] p-8 space-y-6">
            <div className="flex items-center justify-between"><h2 className="text-sm font-black flex items-center gap-2 text-bronze-text uppercase tracking-wider"><Layers size={18} className="text-primary" /> {t('packager.phase1.title')}</h2><span className="bg-cream-medium/50 text-primary text-[10px] font-black px-3 py-1 rounded-full border border-cream-dark">{t('packager.phase1.queue', { count: fileQueue.length })}</span></div>
            <div className="grid grid-cols-2 gap-3">
              <Stepper label={t('packager.phase1.rows')} value={config.rows} min={1} max={12} onChange={(val) => setConfig(prev => ({ ...prev, rows: val, manualMode: false }))} />
              <Stepper label={t('packager.phase1.cols')} value={config.cols} min={1} max={12} onChange={(val) => setConfig(prev => ({ ...prev, cols: val, manualMode: false }))} />
            </div>
            <div className="space-y-2 pt-1">
              <div className="flex justify-between items-center"><label className="text-[10px] font-bold text-bronze-light uppercase flex items-center gap-1"><Maximize2 size={10} /> {t('packager.phase1.scale')}</label><span className="text-[10px] font-black text-primary bg-cream-medium/50 px-2.5 py-0.5 rounded-full">{config.scaleFactor}x</span></div>
              <input type="range" min="1" max="4" step="0.5" value={config.scaleFactor} onChange={(e) => setConfig(prev => ({ ...prev, scaleFactor: parseFloat(e.target.value) }))} className="w-full h-2 bg-cream-medium rounded-lg appearance-none cursor-pointer accent-secondary" />
            </div>
            <div onClick={() => setConfig(prev => ({ ...prev, manualMode: !prev.manualMode }))} className={`flex items-center justify-between p-4 rounded-2xl border-2 cursor-pointer transition-all ${config.manualMode ? 'bg-cream-light border-secondary shadow-sm' : 'bg-white border-cream-dark'}`}><div className="flex items-center gap-3"><Move size={18} className={config.manualMode ? 'text-secondary' : 'text-cream-dark'} /><span className="text-xs font-bold text-bronze-text">{t('packager.phase1.manualMode')}</span></div><div className={`w-10 h-6 rounded-full relative transition-colors ${config.manualMode ? 'bg-secondary' : 'bg-cream-dark/30'}`}><div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all shadow-sm ${config.manualMode ? 'right-1' : 'left-1'}`} /></div></div>
            {estimatedSize && <div className="p-3.5 bg-cream-medium/30 border border-cream-dark rounded-2xl flex items-center gap-3 shadow-sm"><Ruler size={18} className="text-bronze-light shrink-0" /><div className="flex flex-col"><span className="text-[9px] font-black text-primary uppercase leading-none mb-1">{estimatedSize.label}</span><span className="text-sm font-black text-bronze-text">{estimatedSize.w} × {estimatedSize.h} <span className="text-[10px] opacity-60 font-medium">px</span></span></div></div>}
            <div onClick={() => setConfig(prev => ({ ...prev, useAI: !prev.useAI }))} className={`flex items-center justify-between p-4 rounded-2xl border-2 cursor-pointer transition-all ${config.useAI ? 'bg-cream-light border-secondary/30 shadow-sm' : 'bg-white border-cream-dark'}`}><div className="flex items-center gap-3"><ImageIcon size={18} className={config.useAI ? 'text-primary' : 'text-cream-dark'} /><span className="text-xs font-bold text-bronze-text">{t('packager.phase1.aiRemoveBg')}</span></div><div className={`w-10 h-6 rounded-full relative transition-colors ${config.useAI ? 'bg-primary' : 'bg-cream-dark/30'}`}><div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all shadow-sm ${config.useAI ? 'right-1' : 'left-1'}`} /></div></div>
            {config.useAI && (
              <div className="border rounded-2xl overflow-hidden bg-cream-medium/30 border-cream-dark shadow-inner">
                <button onClick={() => setShowAdvancedAI(!showAdvancedAI)} className="w-full flex items-center justify-between p-3.5 text-xs font-bold text-bronze-light hover:bg-cream-medium transition-colors"><div className="flex items-center gap-2"><Settings2 size={15} /> {t('packager.phase1.advancedSettings')}</div><ChevronRight size={15} className={`transition-transform ${showAdvancedAI ? 'rotate-90' : ''}`} /></button>
                {showAdvancedAI && <div className="p-4 space-y-4 animate-in slide-in-from-top-2"><div className="space-y-2"><div className="flex justify-between items-center"><label className="text-[10px] font-bold text-bronze-light uppercase">{t('packager.phase1.tolerance')}</label><span className="text-[10px] font-black text-primary">{config.tolerance}</span></div><input type="range" min="0" max="100" value={config.tolerance} onChange={(e) => setConfig(prev => ({ ...prev, tolerance: parseInt(e.target.value) }))} className="w-full h-1.5 bg-cream-medium rounded-lg accent-secondary" /></div><div className="grid grid-cols-2 gap-2"><button onClick={() => setConfig(prev => ({ ...prev, protectInternal: !prev.protectInternal }))} className={`p-2 rounded-xl border text-[9px] font-bold flex items-center justify-center gap-2 transition-all ${config.protectInternal ? 'bg-primary text-white shadow-md' : 'bg-white text-bronze-light'}`}><ShieldCheck size={12} /> {t('packager.phase1.protectClosed')}</button><button onClick={() => setConfig(prev => ({ ...prev, retainText: !prev.retainText }))} className={`p-2 rounded-xl border text-[9px] font-bold flex items-center justify-center gap-2 transition-all ${config.retainText ? 'bg-primary text-white shadow-md' : 'bg-white text-bronze-light'}`}><Type size={12} /> {t('packager.phase1.enhanceText')}</button></div></div>}
              </div>
            )}
            <button onClick={performCoreProcess} disabled={fileQueue.length === 0 || status === 'splitting' || status === 'removing_bg'} className="w-full bg-primary hover:bg-primary-hover disabled:bg-cream-medium disabled:text-bronze-light text-white py-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-3 shadow-lg shadow-primary/20 transition-all active:scale-95"><Wand2 size={22} /> {t('packager.phase1.runCore')} ({fileQueue.length})</button>
          </section>

          <section className={`bg-cream-light/30 border border-cream-dark backdrop-blur-xl rounded-[2rem] p-8 space-y-5 transition-all ${!isCoreProcessed ? 'opacity-50 pointer-events-none grayscale' : 'opacity-100'}`}>
            <h2 className="text-sm font-black flex items-center gap-2 text-bronze-text uppercase tracking-wider"><Star size={16} className="text-secondary" /> {t('packager.phase2.title')}</h2>
            <div className="space-y-2"><label className="text-[10px] font-bold text-bronze-light uppercase">{t('packager.phase2.presets')}</label><div className="grid grid-cols-3 gap-2"><button onClick={() => setConfig(prev => ({ ...prev, preset: 'none' }))} className={`py-2 rounded-xl font-bold text-[10px] border transition-all ${config.preset === 'none' ? 'bg-primary text-white border-secondary shadow-md' : 'bg-white text-bronze-light hover:border-secondary/30'}`}>{t('packager.phase2.custom')}</button><button onClick={() => setConfig(prev => ({ ...prev, preset: 'line' }))} className={`py-2 rounded-xl font-bold text-[10px] border transition-all ${config.preset === 'line' ? 'bg-accent text-white border-accent shadow-md' : 'bg-white text-bronze-light hover:border-accent/30'}`}>{t('packager.phase2.line')}</button><button onClick={() => setConfig(prev => ({ ...prev, preset: 'telegram' }))} className={`py-2 rounded-xl font-bold text-[10px] border transition-all ${config.preset === 'telegram' ? 'bg-primary/80 text-white border-primary/80 shadow-md' : 'bg-white text-bronze-light hover:border-primary/30'}`}>{t('packager.phase2.telegram')}</button></div></div>
            <div className="space-y-2 pt-1"><div className="flex justify-between items-center"><label className="text-[10px] font-bold text-bronze-light uppercase">{t('packager.phase2.margin')} {Math.round(config.margin * 100)}%</label></div><input type="range" min="0" max="0.3" step="0.01" value={config.margin} onChange={(e) => setConfig(prev => ({ ...prev, margin: parseFloat(e.target.value) }))} className="w-full h-1.5 bg-cream-dark/50 rounded-lg accent-secondary" /></div>

            <div className="flex items-center justify-between pt-2 border-t border-cream-medium"><div className="flex items-center gap-3"><Palette size={18} className={config.useStroke ? 'text-secondary' : 'text-bronze-light'} /><span className="text-xs font-bold text-bronze-text">{t('packager.phase2.stroke')}</span></div><div onClick={() => setConfig(prev => ({ ...prev, useStroke: !prev.useStroke }))} className={`w-9 h-5 rounded-full relative cursor-pointer transition-colors ${config.useStroke ? 'bg-secondary' : 'bg-cream-dark/30'}`}><div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${config.useStroke ? 'right-1' : 'left-1'}`} /></div></div>
            {config.useStroke && <div className="pl-9 space-y-4 animate-in slide-in-from-left-4"><div className="space-y-2"><div className="flex justify-between items-center"><label className="text-[9px] font-bold text-bronze-light uppercase">{t('packager.phase2.strokeSize')}</label><span className="text-[9px] font-black text-secondary">{config.strokeThickness}px</span></div><input type="range" min="1" max="25" value={config.strokeThickness} onChange={(e) => setConfig(prev => ({ ...prev, strokeThickness: parseInt(e.target.value) }))} className="w-full h-1 bg-secondary/10 rounded-lg accent-secondary" /></div><div className="flex items-center gap-3"><label className="text-[9px] font-bold text-bronze-light uppercase">{t('packager.phase2.strokeColor')}</label><div className="flex gap-2">{(['#ffffff', '#000000', '#facc15', '#f87171', '#818cf8']).map(c => (<button key={c} onClick={() => setConfig(prev => ({ ...prev, strokeColor: c }))} className={`w-5 h-5 rounded-full border border-cream-dark shadow-sm transition-transform ${config.strokeColor === c ? 'scale-125 ring-2 ring-secondary/20' : ''}`} style={{ backgroundColor: c }} />))}<input type="color" value={config.strokeColor} onChange={(e) => setConfig(prev => ({ ...prev, strokeColor: e.target.value }))} className="w-5 h-5 p-0 border-0 bg-transparent cursor-pointer" /></div></div></div>}

            <div className="flex items-center justify-between"><div className="flex items-center gap-3"><Sun size={18} className={config.useShadow ? 'text-primary' : 'text-bronze-light'} /><span className="text-xs font-bold text-bronze-text">{t('packager.phase2.shadow')}</span></div><div onClick={() => setConfig(prev => ({ ...prev, useShadow: !prev.useShadow }))} className={`w-9 h-5 rounded-full relative cursor-pointer transition-colors ${config.useShadow ? 'bg-primary' : 'bg-cream-dark/30'}`}><div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${config.useShadow ? 'right-1' : 'left-1'}`} /></div></div>
            <div className="flex items-center justify-between"><div className="flex items-center gap-3"><Sparkles size={18} className={config.useFeathering ? 'text-accent' : 'text-bronze-light'} /><span className="text-xs font-bold text-bronze-text">{t('packager.phase2.feather')}</span></div><div onClick={() => setConfig(prev => ({ ...prev, useFeathering: !prev.useFeathering }))} className={`w-9 h-5 rounded-full relative cursor-pointer transition-colors ${config.useFeathering ? 'bg-accent' : 'bg-cream-dark/30'}`}><div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${config.useFeathering ? 'right-1' : 'left-1'}`} /></div></div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="space-y-1"><label className="text-[10px] font-bold text-bronze-light uppercase">{t('packager.phase2.format')}</label><select value={config.outputFormat} onChange={(e) => setConfig(prev => ({ ...prev, outputFormat: e.target.value as any }))} className="w-full px-3 py-2 bg-cream-medium/50 border border-cream-dark rounded-xl font-bold text-[10px] text-bronze-text outline-none shadow-inner"><option value="png">PNG</option><option value="webp">WebP</option></select></div>
              <div className="space-y-1"><label className="text-[10px] font-bold text-bronze-light uppercase">{t('packager.phase2.prefix')}</label><input type="text" value={config.filenamePrefix} onChange={(e) => setConfig(prev => ({ ...prev, filenamePrefix: e.target.value }))} className="w-full px-3 py-2 bg-cream-medium/50 border border-cream-dark rounded-xl font-bold text-[10px] text-bronze-text outline-none shadow-inner" /></div>
            </div>

            <div className="flex flex-col gap-3 pt-4">
              <button onClick={applyBeautification} className="w-full bg-bronze-medium hover:bg-bronze-dark text-white py-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-3 shadow-lg shadow-bronze-medium/20 transition-all active:scale-95">
                <Sparkles size={22} /> {t('packager.phase2.apply')}
              </button>

              {processedTiles.length > 0 && (
                <div className="grid grid-cols-2 gap-3 animate-in fade-in slide-in-from-bottom-4">
                  <button
                    onClick={async () => {
                      if (processedTiles.length === 0) return;
                      let savedCount = 0;
                      try {
                        for (let i = 0; i < processedTiles.length; i++) {
                          const tile = processedTiles[i];
                          const blob = await fetch(tile.url).then(r => r.blob());
                          const base64 = await blobToBase64(blob);
                          await saveStickerToDB({
                            id: `pkg_${Date.now()}_${i}_${Math.random().toString(36).substr(2, 5)}`,
                            imageUrl: base64,
                            phrase: `${config.filenamePrefix} #${i + 1}`,
                            timestamp: Date.now()
                          });
                          savedCount++;
                        }
                        alert(`${t('packager.status.savedToCollection') || 'Saved'} (${savedCount})`);
                      } catch (err) {
                        console.error("Failed to save", err);
                        alert("Failed to save some stickers");
                      }
                    }}
                    className="w-full bg-gradient-to-r from-secondary to-accent hover:brightness-110 text-white py-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-secondary/20 active:scale-95 transition-all"
                  >
                    <Download size={20} className="rotate-180" /> {t('packager.phase2.saveToGallery')}
                  </button>

                  <button
                    onClick={() => zipBlob && saveAs(zipBlob, `${config.filenamePrefix}_batch_${Date.now()}.zip`)}
                    disabled={!zipBlob}
                    className="w-full bg-gradient-to-r from-primary to-primary-hover hover:brightness-110 text-white py-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-primary/20 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <FileArchive size={20} /> {t('packager.phase2.downloadZip')}
                  </button>
                </div>
              )}
            </div>
          </section>
        </div>
      </main>

    </div>
  );
};

export default App;

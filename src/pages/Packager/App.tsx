
import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import {
  Upload, Scissors, Layers, Download, RefreshCw, AlertCircle, Image as ImageIcon,
  CheckCircle2, ChevronRight, Info, FileArchive, LayoutGrid, Maximize2, Crop,
  Settings2, Type, ShieldCheck, Plus, Move, Search, Ruler, Sparkles, Sun, Palette,
  Wand2, Timer, Smartphone, ZoomIn, ZoomOut, RotateCcw, Undo2, Redo2, MousePointer2, Home,
  Trash2, Files, FileImage, Settings, Star, Minimize2, Check, Minus, ExternalLink as LinkIcon, Eraser
} from 'lucide-react';
import { processImage } from './services/ai/backgroundRemoval';
import JSZip from 'jszip';
import saveAs from 'file-saver';
import { ProcessingStatus, SplitConfig, ExportPreset, OutputFormat } from './types';
import { loadImage } from './utils/helpers';

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
    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{label}</label>
    <div className="flex items-center bg-slate-50 border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
      <button
        onClick={() => onChange(Math.max(min, value - 1))}
        className="p-3 text-slate-500 hover:bg-[#E6E2DE] active:bg-[#D8D4CF] transition-colors"
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
        className="w-full py-2 text-center bg-transparent font-bold text-sm outline-none appearance-none"
      />
      <button
        onClick={() => onChange(Math.min(max, value + 1))}
        className="p-3 text-gray-500 hover:bg-slate-100 active:bg-slate-200 transition-colors"
        disabled={value >= max}
      >
        <Plus size={14} />
      </button>
    </div>
  </div>
);

// AppSwitcher removed


const App: React.FC = () => {
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
      newItems.push({ id, file: f, preview, stats: { width: img.width, height: img.height, aspectRatio: img.width / img.height, label: `${img.width}x${img.height}` } });
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
    setStatusMsg('AI 正在分析物件邊界...');
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
      setStatus('success'); setStatusMsg('AI 自動對齊完成！');
    } catch (e) { setStatus('error'); setStatusMsg('自動對齊失敗'); }
  };

  const performCoreProcess = async () => {
    if (fileQueue.length === 0) return;
    setStatus('removing_bg'); setProgress(0);
    const startTime = Date.now();
    const newQueue = [...fileQueue];

    try {
      for (let fIdx = 0; fIdx < newQueue.length; fIdx++) {
        const item = newQueue[fIdx];
        setStatusMsg(`正在執行核心處理 (${fIdx + 1}/${newQueue.length}): ${item.file.name}`);

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
      setStatusMsg(`核心處理完成！現在可以進行美化加工。`);
      applyBeautification();
    } catch (e: any) { setStatus('error'); setStatusMsg(`處理失敗: ${e.message}`); }
  };

  const applyBeautification = async () => {
    if (!isCoreProcessed) return;
    setStatus('splitting'); setStatusMsg('正在套用美化效果...');
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
      setStatus('success'); setElapsedTime(((Date.now() - startTime) / 1000).toFixed(1));
      setStatusMsg(`加工完成！`); setViewMode('result');
    } catch (e: any) { setStatus('error'); setStatusMsg(`加工失敗: ${e.message}`); }
  };

  const reset = () => { fileQueue.forEach(revokeItemResources); setFileQueue([]); setActiveFileId(null); setZipBlob(null); setProcessedTiles([]); setStatus('idle'); setElapsedTime(null); };

  const estimatedSize = useMemo(() => {
    if (!activeFile?.stats) return null;
    if (config.preset === 'line') return { w: 370, h: 320, label: 'LINE 規格' };
    if (config.preset === 'telegram') return { w: 512, h: 512, label: 'Telegram 規格' };
    return { w: Math.round((config.colLines[1] - config.colLines[0]) * activeFile.stats.width * config.scaleFactor), h: Math.round((config.rowLines[1] - config.rowLines[0]) * activeFile.stats.height * config.scaleFactor), label: '輸出尺寸' };
  }, [activeFile, config.colLines, config.rowLines, config.scaleFactor, config.preset]);

  return (
    <div className="min-h-screen pb-20 select-none font-sans text-slate-700 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-indigo-100/50 via-slate-50 to-pink-50/30">

      {/* Unified Header - Mobile: Controls Only (Second Row), Desktop: Full (Top) */}
      <nav className="fixed top-[5rem] md:top-4 left-4 right-4 z-50">
        <div className="max-w-7xl mx-auto rounded-2xl px-6 py-3 flex items-center justify-center md:justify-between bg-white/70 backdrop-blur-xl shadow-sm border border-white/50 md:shadow-lg">
          <div className="items-center gap-4 hidden md:flex">
            {/* App Switcher Trigger */}
            {/* AppSwitcher removed */}


            <div className="h-6 w-px bg-slate-200"></div>

            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-violet-500 to-pink-500 p-2 rounded-xl text-white shadow-lg shadow-violet-500/20">
                <Scissors size={18} strokeWidth={2.5} />
              </div>
              <div>
                <h1 className="text-lg font-bold tracking-tight text-slate-800 leading-none">
                  StickerOS <span className="text-[10px] text-pink-500 bg-pink-50 px-1.5 py-0.5 rounded-md ml-1 align-top">Packager</span>
                </h1>
                <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest mt-0.5">Asset Processing</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
              <button onClick={undo} disabled={historyIdx <= 0} className="p-1.5 sm:p-2 hover:bg-white rounded-lg disabled:opacity-30 text-slate-500 hover:text-violet-600 transition-all shadow-sm"><Undo2 size={16} /></button>
              <button onClick={redo} disabled={historyIdx >= history.length - 1} className="p-1.5 sm:p-2 hover:bg-white rounded-lg disabled:opacity-30 text-slate-500 hover:text-violet-600 transition-all shadow-sm"><Redo2 size={16} /></button>
            </div>
            <button onClick={reset} className="px-3 py-2 sm:px-4 bg-white border border-slate-200 hover:border-red-200 hover:bg-red-50 hover:text-red-500 text-slate-500 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-sm">
              <RefreshCw size={14} /> <span className="hidden sm:inline">Reset</span>
            </button>
            <a href="https://tingyusdeco.com/" className="text-xs font-bold text-slate-400 hover:text-violet-600 flex items-center gap-1.5 transition-colors px-3 py-1.5 hover:bg-slate-50 rounded-lg">
              <Home size={14} /> <span className="hidden sm:inline">Home</span>
            </a>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 pt-32 grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-6">
          {fileQueue.length === 0 ? (
            <div onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }} onDragLeave={() => setIsDragging(false)} onDrop={(e) => { e.preventDefault(); setIsDragging(false); if (e.dataTransfer.files) handleFiles(e.dataTransfer.files); }} onClick={() => fileInputRef.current?.click()} className={`group border-3 border-dashed rounded-[2.5rem] p-20 flex flex-col items-center justify-center cursor-pointer transition-all duration-500 min-h-[500px] ${isDragging ? 'drag-active border-violet-500 bg-violet-50/50' : 'border-slate-200 bg-slate-50/50 hover:border-violet-300 hover:bg-white/50'}`}>
              <input ref={fileInputRef} type="file" multiple className="hidden" onChange={(e) => e.target.files && handleFiles(e.target.files)} accept="image/*" />
              <div className="bg-white p-10 rounded-full group-hover:scale-110 transition-transform duration-500 shadow-xl shadow-violet-500/10 text-violet-500"><Upload size={48} /></div>
              <h3 className="mt-8 text-2xl font-black text-slate-700 tracking-tight">Click or Drop Images Here</h3>
              <p className="mt-3 text-slate-400 font-bold text-sm tracking-wide uppercase">JPG, PNG, WebP Supported</p>
            </div>
          ) : (
            <div className="space-y-4 animate-in fade-in duration-500">
              <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-hide">
                <button onClick={() => fileInputRef.current?.click()} className="flex-shrink-0 w-16 h-16 border-2 border-dashed border-gray-300 rounded-xl flex items-center justify-center text-gray-400 hover:border-indigo-500 hover:text-indigo-500 transition-colors"><Plus size={20} /></button>
                {fileQueue.map(item => (
                  <div key={item.id} className="relative group flex-shrink-0">
                    <img src={item.preview} onClick={() => { setActiveFileId(item.id); setViewMode(item.baseTiles ? 'result' : 'original'); }} className={`w-16 h-16 object-cover rounded-xl cursor-pointer border-2 transition-all ${activeFileId === item.id ? 'border-indigo-600 shadow-md ring-2 ring-indigo-100 scale-105' : 'border-white grayscale-[40%] hover:grayscale-0'}`} />
                    {item.isProcessed && <div className="absolute top-1 left-1 bg-green-500 text-white rounded-full p-0.5 shadow-sm"><Check size={8} /></div>}
                    <button onClick={() => removeFile(item.id)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 shadow-sm transition-opacity"><Trash2 size={10} /></button>
                  </div>
                ))}
              </div>

              <div className="glass-panel rounded-3xl p-4 relative">
                <div className="flex items-center justify-between mb-4 px-2">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-black text-slate-700 uppercase tracking-widest truncate max-w-[200px]">{activeFile?.file.name}</span>
                    <span className="text-[9px] text-slate-500 font-bold bg-slate-50 px-3 py-1 rounded-full border border-slate-200">{activeFile?.stats?.label}</span>
                  </div>
                  {isCoreProcessed && (
                    <div className="flex bg-slate-50 p-1 rounded-xl border border-slate-200">
                      <button onClick={() => setViewMode('original')} className={`px-5 py-2 rounded-lg text-[10px] font-bold transition-all ${viewMode === 'original' ? 'bg-white shadow-sm text-violet-500' : 'text-slate-500'}`}>編輯對位</button>
                      <button onClick={() => setViewMode('result')} className={`px-5 py-2 rounded-lg text-[10px] font-bold transition-all ${viewMode === 'result' ? 'bg-white shadow-sm text-violet-500' : 'text-slate-500'}`}>美化預覽</button>
                    </div>
                  )}
                </div>

                <div className="relative rounded-2xl border min-h-[500px] bg-slate-100 overflow-hidden flex items-center justify-center cursor-grab active:cursor-grabbing shadow-inner" onWheel={handleWheel} onMouseDown={startPan} onMouseMove={onPan} onMouseUp={() => setIsPanning(false)}>
                  <div className="absolute top-4 left-4 z-40 flex flex-col gap-2">
                    <div className="bg-white/90 backdrop-blur-md p-1 rounded-xl shadow-lg border border-white flex flex-col gap-1">
                      <button onClick={() => setZoom(prev => Math.min(5, prev + 0.25))} className="p-2 hover:bg-indigo-50 rounded-lg text-indigo-600 transition-colors"><ZoomIn size={16} /></button>
                      <button onClick={() => setZoom(prev => Math.max(0.5, prev - 0.25))} className="p-2 hover:bg-indigo-50 rounded-lg text-indigo-600 transition-colors"><ZoomOut size={16} /></button>
                      <button onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }} className="p-2 hover:bg-indigo-50 rounded-lg text-indigo-600 transition-colors"><RotateCcw size={16} /></button>
                    </div>
                    {viewMode === 'original' && activeFile && (
                      <button onClick={autoDetectGrid} className="bg-indigo-600 text-white p-2.5 rounded-xl shadow-lg hover:bg-indigo-700 transition-all flex items-center gap-2 group overflow-hidden max-w-[42px] hover:max-w-[150px]">
                        <Sparkles size={18} className="shrink-0" /><span className="text-[10px] font-bold whitespace-nowrap opacity-0 group-hover:opacity-100">AI 智慧偵測邊界</span>
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
                        return <div key={i} className="absolute border border-white/20 bg-indigo-500/10 pointer-events-none flex items-center justify-center overflow-hidden" style={{ top: `${config.rowLines[r] * 100}%`, left: `${config.colLines[c] * 100}%`, width: `${(config.colLines[c + 1] - config.colLines[c]) * 100}%`, height: `${(config.rowLines[r + 1] - config.rowLines[r]) * 100}%` }}>
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
                            <span className="text-[10px] font-black text-indigo-600 bg-white px-2 py-0.5 rounded-full border border-indigo-100 shadow-sm">{tile.width} × {tile.height}</span>
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
            <div className={`p-4 rounded-2xl border transition-all shadow-lg animate-in slide-in-from-right-4 ${status === 'error' ? 'bg-red-50 border-red-100 text-red-700' : 'glass-panel'}`}>
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-slate-50 text-slate-700 shadow-inner">
                  {status === 'success' ? <CheckCircle2 size={22} className="text-[#B0C4B1]" /> : status === 'error' ? <AlertCircle size={22} /> : <div className="animate-spin rounded-full h-5 w-5 border-3 border-[#B5838D] border-t-transparent" />}
                </div>
                <div className="flex-1 min-w-0">
                  <span className="block text-[10px] font-black uppercase tracking-tighter opacity-50 text-slate-500">{status === 'success' ? '處理完成' : '運算中...'}</span>
                  <p className="text-xs font-bold truncate text-slate-700">{statusMsg}</p>
                </div>
                {elapsedTime && <div className="text-[10px] font-black px-2.5 py-1 bg-slate-50 rounded-lg text-slate-500">{elapsedTime}s</div>}
              </div>
              {progress > 0 && progress < 100 && <div className="mt-4 h-2 w-full bg-slate-50 rounded-full overflow-hidden shadow-inner"><div className="h-full bg-gradient-to-r from-[#B5838D] to-[#6D6875] transition-all duration-300 shadow-lg" style={{ width: `${progress}%` }} /></div>}
            </div>
          )}

          <section className="glass-panel rounded-[2rem] p-8 space-y-6">
            <div className="flex items-center justify-between"><h2 className="text-sm font-black flex items-center gap-2 text-slate-700 uppercase tracking-wider"><Layers size={18} className="text-violet-500" /> 階段一：裁切與去背</h2><span className="bg-slate-50 text-violet-500 text-[10px] font-black px-3 py-1 rounded-full border border-slate-200">{fileQueue.length} 張隊列中</span></div>
            <div className="grid grid-cols-2 gap-3">
              <Stepper label="橫列 Rows" value={config.rows} min={1} max={12} onChange={(val) => setConfig(prev => ({ ...prev, rows: val, manualMode: false }))} />
              <Stepper label="直欄 Cols" value={config.cols} min={1} max={12} onChange={(val) => setConfig(prev => ({ ...prev, cols: val, manualMode: false }))} />
            </div>
            <div className="space-y-2 pt-1">
              <div className="flex justify-between items-center"><label className="text-[10px] font-bold text-gray-400 uppercase flex items-center gap-1"><Maximize2 size={10} /> 輸出解析度放大</label><span className="text-[10px] font-black text-violet-500 bg-slate-50 px-2.5 py-0.5 rounded-full">{config.scaleFactor}x</span></div>
              <input type="range" min="1" max="4" step="0.5" value={config.scaleFactor} onChange={(e) => setConfig(prev => ({ ...prev, scaleFactor: parseFloat(e.target.value) }))} className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-[#B5838D]" />
            </div>
            <div onClick={() => setConfig(prev => ({ ...prev, manualMode: !prev.manualMode }))} className={`flex items-center justify-between p-4 rounded-2xl border-2 cursor-pointer transition-all ${config.manualMode ? 'bg-[#FCF5F3] border-[#E5989B] shadow-sm' : 'bg-white border-[#F2EFE9]'}`}><div className="flex items-center gap-3"><Move size={18} className={config.manualMode ? 'text-[#E5989B]' : 'text-[#C5C6C7]'} /><span className="text-xs font-bold text-slate-700">啟用手動對齊模式</span></div><div className={`w-10 h-6 rounded-full relative transition-colors ${config.manualMode ? 'bg-[#E5989B]' : 'bg-[#E6E2DE]'}`}><div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all shadow-sm ${config.manualMode ? 'right-1' : 'left-1'}`} /></div></div>
            {estimatedSize && <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl flex items-center gap-3 shadow-sm"><Ruler size={18} className="text-slate-500 shrink-0" /><div className="flex flex-col"><span className="text-[9px] font-black text-violet-500 uppercase leading-none mb-1">{estimatedSize.label}</span><span className="text-sm font-black text-slate-700">{estimatedSize.w} × {estimatedSize.h} <span className="text-[10px] opacity-60 font-medium">px</span></span></div></div>}
            <div onClick={() => setConfig(prev => ({ ...prev, useAI: !prev.useAI }))} className={`flex items-center justify-between p-4 rounded-2xl border-2 cursor-pointer transition-all ${config.useAI ? 'bg-[#F9F8F6] border-[#B5838D]/30 shadow-sm' : 'bg-white border-[#F2EFE9]'}`}><div className="flex items-center gap-3"><ImageIcon size={18} className={config.useAI ? 'text-violet-500' : 'text-[#C5C6C7]'} /><span className="text-xs font-bold text-slate-700">自動 AI 智慧去背</span></div><div className={`w-10 h-6 rounded-full relative transition-colors ${config.useAI ? 'bg-violet-500' : 'bg-[#E6E2DE]'}`}><div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all shadow-sm ${config.useAI ? 'right-1' : 'left-1'}`} /></div></div>
            {config.useAI && (
              <div className="border rounded-2xl overflow-hidden bg-slate-50 shadow-inner">
                <button onClick={() => setShowAdvancedAI(!showAdvancedAI)} className="w-full flex items-center justify-between p-3.5 text-xs font-bold text-gray-500 hover:bg-slate-100 transition-colors"><div className="flex items-center gap-2"><Settings2 size={15} /> 進階去背設定</div><ChevronRight size={15} className={`transition-transform ${showAdvancedAI ? 'rotate-90' : ''}`} /></button>
                {showAdvancedAI && <div className="p-4 space-y-4 animate-in slide-in-from-top-2"><div className="space-y-2"><div className="flex justify-between items-center"><label className="text-[10px] font-bold text-gray-400 uppercase">邊緣容差</label><span className="text-[10px] font-black text-violet-500">{config.tolerance}</span></div><input type="range" min="0" max="100" value={config.tolerance} onChange={(e) => setConfig(prev => ({ ...prev, tolerance: parseInt(e.target.value) }))} className="w-full h-1.5 bg-slate-200 rounded-lg accent-[#B5838D]" /></div><div className="grid grid-cols-2 gap-2"><button onClick={() => setConfig(prev => ({ ...prev, protectInternal: !prev.protectInternal }))} className={`p-2 rounded-xl border text-[9px] font-bold flex items-center justify-center gap-2 transition-all ${config.protectInternal ? 'bg-violet-500 text-white shadow-md' : 'bg-white text-gray-500'}`}><ShieldCheck size={12} /> 保護封閉區</button><button onClick={() => setConfig(prev => ({ ...prev, retainText: !prev.retainText }))} className={`p-2 rounded-xl border text-[9px] font-bold flex items-center justify-center gap-2 transition-all ${config.retainText ? 'bg-violet-500 text-white shadow-md' : 'bg-white text-gray-500'}`}><Type size={12} /> 增強文字</button></div></div>}
              </div>
            )}
            <button onClick={performCoreProcess} disabled={fileQueue.length === 0 || status === 'splitting' || status === 'removing_bg'} className="w-full bg-violet-500 hover:bg-[#A87680] disabled:bg-[#E6E2DE] disabled:text-slate-500 text-white py-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-3 shadow-lg shadow-[#B5838D]/20 transition-all active:scale-95"><Wand2 size={22} /> 執行核心處理 ({fileQueue.length} 張圖)</button>
          </section>

          <section className={`glass-panel rounded-[2rem] p-8 space-y-5 transition-all ${!isCoreProcessed ? 'opacity-50 pointer-events-none grayscale' : 'opacity-100'}`}>
            <h2 className="text-sm font-black flex items-center gap-2 text-gray-700 uppercase tracking-wider"><Star size={16} className="text-purple-600" /> 階段二：美化加工與輸出</h2>
            <div className="space-y-2"><label className="text-[10px] font-bold text-gray-400 uppercase">常用預設規格 (Presets)</label><div className="grid grid-cols-3 gap-2"><button onClick={() => setConfig(prev => ({ ...prev, preset: 'none' }))} className={`py-2 rounded-xl font-bold text-[10px] border transition-all ${config.preset === 'none' ? 'bg-violet-500 text-white border-[#B5838D] shadow-md' : 'bg-white text-gray-500 hover:border-[#B5838D]/30'}`}>自訂比例</button><button onClick={() => setConfig(prev => ({ ...prev, preset: 'line' }))} className={`py-2 rounded-xl font-bold text-[10px] border transition-all ${config.preset === 'line' ? 'bg-[#9CAF9D] text-white border-[#9CAF9D] shadow-md' : 'bg-white text-gray-500 hover:border-[#9CAF9D]/30'}`}>Line (320px)</button><button onClick={() => setConfig(prev => ({ ...prev, preset: 'telegram' }))} className={`py-2 rounded-xl font-bold text-[10px] border transition-all ${config.preset === 'telegram' ? 'bg-[#8DA3B5] text-white border-[#8DA3B5] shadow-md' : 'bg-white text-gray-500 hover:border-[#8DA3B5]/30'}`}>Telegram</button></div></div>
            <div className="space-y-2 pt-1"><div className="flex justify-between items-center"><label className="text-[10px] font-bold text-gray-400 uppercase">留白間距 {Math.round(config.margin * 100)}%</label></div><input type="range" min="0" max="0.3" step="0.01" value={config.margin} onChange={(e) => setConfig(prev => ({ ...prev, margin: parseFloat(e.target.value) }))} className="w-full h-1.5 bg-slate-200 rounded-lg accent-purple-600" /></div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-50"><div className="flex items-center gap-3"><Palette size={18} className={config.useStroke ? 'text-purple-600' : 'text-gray-400'} /><span className="text-xs font-bold text-gray-700">物件白色描邊 (Stroke)</span></div><div onClick={() => setConfig(prev => ({ ...prev, useStroke: !prev.useStroke }))} className={`w-9 h-5 rounded-full relative cursor-pointer transition-colors ${config.useStroke ? 'bg-purple-600' : 'bg-gray-200'}`}><div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${config.useStroke ? 'right-1' : 'left-1'}`} /></div></div>
            {config.useStroke && <div className="pl-9 space-y-4 animate-in slide-in-from-left-4"><div className="space-y-2"><div className="flex justify-between items-center"><label className="text-[9px] font-bold text-gray-400 uppercase">描邊粗細</label><span className="text-[9px] font-black text-purple-600">{config.strokeThickness}px</span></div><input type="range" min="1" max="25" value={config.strokeThickness} onChange={(e) => setConfig(prev => ({ ...prev, strokeThickness: parseInt(e.target.value) }))} className="w-full h-1 bg-purple-100 rounded-lg accent-purple-600" /></div><div className="flex items-center gap-3"><label className="text-[9px] font-bold text-gray-400 uppercase">描邊顏色</label><div className="flex gap-2">{(['#ffffff', '#000000', '#facc15', '#f87171', '#818cf8']).map(c => (<button key={c} onClick={() => setConfig(prev => ({ ...prev, strokeColor: c }))} className={`w-5 h-5 rounded-full border border-slate-200 shadow-sm transition-transform ${config.strokeColor === c ? 'scale-125 ring-2 ring-purple-200' : ''}`} style={{ backgroundColor: c }} />))}<input type="color" value={config.strokeColor} onChange={(e) => setConfig(prev => ({ ...prev, strokeColor: e.target.value }))} className="w-5 h-5 p-0 border-0 bg-transparent cursor-pointer" /></div></div></div>}

            <div className="flex items-center justify-between"><div className="flex items-center gap-3"><Sun size={18} className={config.useShadow ? 'text-indigo-600' : 'text-gray-400'} /><span className="text-xs font-bold text-gray-700">物件陰影 (Shadow)</span></div><div onClick={() => setConfig(prev => ({ ...prev, useShadow: !prev.useShadow }))} className={`w-9 h-5 rounded-full relative cursor-pointer transition-colors ${config.useShadow ? 'bg-indigo-600' : 'bg-gray-200'}`}><div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${config.useShadow ? 'right-1' : 'left-1'}`} /></div></div>
            <div className="flex items-center justify-between"><div className="flex items-center gap-3"><Sparkles size={18} className={config.useFeathering ? 'text-teal-600' : 'text-gray-400'} /><span className="text-xs font-bold text-gray-700">邊緣柔和羽化 (Feathering)</span></div><div onClick={() => setConfig(prev => ({ ...prev, useFeathering: !prev.useFeathering }))} className={`w-9 h-5 rounded-full relative cursor-pointer transition-colors ${config.useFeathering ? 'bg-teal-600' : 'bg-gray-200'}`}><div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${config.useFeathering ? 'right-1' : 'left-1'}`} /></div></div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="space-y-1"><label className="text-[10px] font-bold text-gray-400 uppercase">輸出格式</label><select value={config.outputFormat} onChange={(e) => setConfig(prev => ({ ...prev, outputFormat: e.target.value as any }))} className="w-full px-3 py-2 bg-slate-50 border rounded-xl font-bold text-[10px] outline-none shadow-inner"><option value="png">PNG (透明)</option><option value="webp">WebP (輕量)</option></select></div>
              <div className="space-y-1"><label className="text-[10px] font-bold text-gray-400 uppercase">檔名前綴</label><input type="text" value={config.filenamePrefix} onChange={(e) => setConfig(prev => ({ ...prev, filenamePrefix: e.target.value }))} className="w-full px-3 py-2 bg-slate-50 border rounded-xl font-bold text-[10px] outline-none shadow-inner" /></div>
            </div>
            <button onClick={applyBeautification} className="w-full bg-[#6D6875] hover:bg-[#5E5966] text-white py-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-3 shadow-lg shadow-[#6D6875]/20 transition-all active:scale-95"><Sparkles size={22} /> 套用美化並預覽結果</button>
            {zipBlob && <button onClick={() => saveAs(zipBlob, `${config.filenamePrefix}_batch_${Date.now()}.zip`)} className="w-full bg-[#B0C4B1] hover:bg-[#9CAF9D] text-white py-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-3 shadow-lg shadow-[#B0C4B1]/20 active:scale-95 animate-in zoom-in-95"><FileArchive size={22} /> 下載全部成果 ZIP</button>}
          </section>
        </div>
      </main>
      <footer className="fixed bottom-4 right-6 z-40 hidden md:block text-right pointer-events-none">
        <div className="pointer-events-auto inline-block">
          <div className="glass-panel px-4 py-2 rounded-xl text-[10px] text-slate-400 font-bold uppercase tracking-widest hover:text-violet-600 transition-colors cursor-default border-slate-200/50">
            TingYu’s Creative OS <span className="opacity-30 mx-2">|</span> v2.0
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;

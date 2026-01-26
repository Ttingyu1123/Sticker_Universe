
import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  Scissors, Download, Undo2, Redo2, Home
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import ImageUploader from './components/ImageUploader';
import CanvasEditor from './components/CanvasEditor';
import Toolbar, { ToolMode } from './components/Toolbar';

// AppSwitcher removed


const MAX_HISTORY_STEPS = 20;

import { GalleryPicker } from '../../components/GalleryPicker';
import { useLocation } from 'react-router-dom';
import { saveStickerToDB } from '../../db';

const App: React.FC = () => {
  const { t } = useTranslation();
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [showGallery, setShowGallery] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const state = location.state as { image?: string };
    if (state?.image) {
      const img = new Image();
      img.onload = () => handleImageUpload(img);
      img.src = state.image; // Assuming base64 dataURI or blob URL

      // Clear state
      window.history.replaceState({}, document.title);
    }
  }, []);

  // ... (keep other handlers)

  // ... (keep other handlers)

  // Pass to Toolbar:
  // onRemoveBackground={handleRemoveBackground}
  // isProcessing={isProcessing}
  const [brushSize, setBrushSize] = useState(30); // Restored
  const [tolerance, setTolerance] = useState(20);
  const [zoom, setZoom] = useState(1);
  const [toolMode, setToolMode] = useState<ToolMode>('erase');
  const [bgColor, setBgColor] = useState<string>('checkerboard');
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [triggerUndo, setTriggerUndo] = useState<string | null>(null);
  const [triggerRedo, setTriggerRedo] = useState<string | null>(null);

  const historyRef = useRef<string[]>([]);
  const indexRef = useRef<number>(-1);

  const handleImageUpload = (img: HTMLImageElement) => {
    setImage(img);
    setHistory([]);
    setHistoryIndex(-1);
    historyRef.current = [];
    indexRef.current = -1;
    setZoom(1);
    setToolMode('erase');
    setBgColor('checkerboard');
  };

  const saveHistory = useCallback((dataUrl: string) => {
    const currentHistory = historyRef.current.slice(0, indexRef.current + 1);

    if (currentHistory.length > 0 && currentHistory[currentHistory.length - 1] === dataUrl) {
      return;
    }

    const updatedHistory = [...currentHistory, dataUrl];

    if (updatedHistory.length > MAX_HISTORY_STEPS) {
      const excess = updatedHistory.length - MAX_HISTORY_STEPS;
      updatedHistory.splice(0, excess);
    }

    const newIndex = updatedHistory.length - 1;

    historyRef.current = updatedHistory;
    indexRef.current = newIndex;

    setHistory(updatedHistory);
    setHistoryIndex(newIndex);
    setTriggerUndo(null);
    setTriggerRedo(null);
  }, []);

  const handleUndo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      indexRef.current = newIndex;
      setHistoryIndex(newIndex);
      setTriggerUndo(history[newIndex]);
      setTriggerRedo(null);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      indexRef.current = newIndex;
      setHistoryIndex(newIndex);
      setTriggerRedo(history[newIndex]);
      setTriggerUndo(null);
    }
  };

  const handleDownload = () => {
    if (historyIndex >= 0) {
      const link = document.createElement('a');
      link.download = `sticker-pro-${Date.now()}.png`;
      link.href = history[historyIndex];
      link.click();
    }
  };

  const handleReset = () => {
    setImage(null);
    setHistory([]);
    setHistoryIndex(-1);
    historyRef.current = [];
    indexRef.current = -1;
    setZoom(1);
    setBgColor('checkerboard');
  };

  const handleSaveToGallery = async () => {
    if (history.length === 0 || historyIndex < 0) return;
    const currentImage = history[historyIndex];
    try {
      await saveStickerToDB({
        id: `eraser_${Date.now()} `,
        imageUrl: currentImage,
        phrase: 'Eraser Edit',
        timestamp: Date.now()
      });
      alert(t('packager.status.savedToCollection') || 'Saved to Collection');
    } catch (e) {
      console.error(e);
      alert('Failed to save to collection');
    }
  };

  return (
    <div className="min-h-screen pb-20 select-none font-sans text-slate-700 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-indigo-100/50 via-slate-50 to-pink-50/30">

      {/* Unified Header - Glass Floating Bar - Hidden on mobile, shown on desktop */}
      <nav className="hidden md:block fixed top-4 left-4 right-4 z-50">
        <div className="max-w-7xl mx-auto glass-panel rounded-2xl px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* App Switcher Trigger */}
            {/* AppSwitcher removed */}


            <div className="h-6 w-px bg-slate-200"></div>

            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-violet-500 to-pink-500 p-2 rounded-xl text-white shadow-lg shadow-violet-500/20">
                <Scissors size={18} strokeWidth={2.5} />
              </div>
              <div>
                <h1 className="text-lg font-bold tracking-tight text-slate-800 leading-none">
                  StickerOS <span className="text-[10px] text-violet-500 bg-violet-50 px-1.5 py-0.5 rounded-md ml-1 align-top">{t('eraser.title')}</span>
                </h1>
                <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest mt-0.5">{t('eraser.subtitle')}</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a href="https://tingyusdeco.com/" className="text-xs font-bold text-slate-400 hover:text-violet-600 flex items-center gap-1.5 transition-colors px-3 py-1.5 hover:bg-slate-50 rounded-lg">
              <Home size={14} /> <span className="hidden sm:inline">{t('app.backHome')}</span>
            </a>
          </div>
        </div>
      </nav>

      {/* Main Workspace - Centered Floating Layout */}
      <div className="pt-28 pb-12 px-6 max-w-[1800px] mx-auto min-h-screen flex flex-col md:flex-row gap-8 items-start relative z-0">

        {/* Left HUD (Toolbar) - Sticky */}
        <div className="w-full md:w-20 md:hover:w-72 transition-all duration-300 md:sticky md:top-28 shrink-0 z-30 group">
          <Toolbar
            toolMode={toolMode}
            setToolMode={setToolMode}
            brushSize={brushSize}
            setBrushSize={setBrushSize}
            tolerance={tolerance}
            setTolerance={setTolerance}
            zoom={zoom}
            setZoom={setZoom}
            bgColor={bgColor}
            setBgColor={setBgColor}
            onUndo={handleUndo}
            onRedo={handleRedo}
            onDownload={handleDownload}
            onSaveToGallery={handleSaveToGallery}
            onReset={handleReset}
            canUndo={historyIndex > 0}
            canRedo={historyIndex < history.length - 1}
            hasImage={!!image}
          />
        </div>

        {/* Center Canvas Stage */}
        <div className="flex-1 w-full min-w-0 flex flex-col items-center gap-6">

          {/* Canvas Container */}
          <div className="w-full relative group">
            {/* Decor */}
            <div className="absolute -inset-1 bg-gradient-to-r from-violet-500/10 to-pink-500/10 rounded-[2.5rem] blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

            <div className="relative bg-white/50 backdrop-blur-sm rounded-[2rem] border border-white/60 shadow-2xl p-1 overflow-hidden min-h-[75vh] flex flex-col">
              {image ? (
                <CanvasEditor
                  image={image}
                  brushSize={brushSize}
                  tolerance={tolerance}
                  zoom={zoom}
                  toolMode={toolMode}
                  bgColor={bgColor}
                  onSaveHistory={saveHistory}
                  triggerUndo={triggerUndo}
                  triggerRedo={triggerRedo}
                />
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center p-12">
                  <div className="bg-white/80 p-8 rounded-3xl shadow-xl border border-white/50 max-w-lg w-full">
                    <ImageUploader
                      onImageUpload={handleImageUpload}
                      onGallerySelect={() => setShowGallery(true)}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Status Bar Floating */}
          {image && (
            <div className="glass-panel px-6 py-2 rounded-full flex items-center gap-8 text-[10px] font-bold text-slate-400 tracking-wide uppercase shadow-lg mb-8">
              <span className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-violet-500 rounded-full animate-pulse"></span>
                {image.width} x {image.height} PX
              </span>
              <span className="w-px h-3 bg-slate-200"></span>
              <span>{t('eraser.history')}: {historyIndex + 1}/{history.length}</span>
              <span className="w-px h-3 bg-slate-200"></span>
              <span className="text-violet-500">{Math.round(zoom * 100)}% {t('eraser.zoom')}</span>
            </div>
          )}

        </div>
      </div>

      {/* Global Footer (Unified) */}


      {showGallery && (
        <GalleryPicker
          onSelect={(blob) => {
            const url = URL.createObjectURL(blob);
            const img = new Image();
            img.onload = () => {
              handleImageUpload(img);
              setShowGallery(false);
            };
            img.src = url;
          }}
          onClose={() => setShowGallery(false)}
        />
      )}

    </div>
  );
};

export default App;

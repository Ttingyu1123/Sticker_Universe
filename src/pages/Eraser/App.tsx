
import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  Home
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
      const dataUrl = history[historyIndex];
      // Convert DataURL to Blob to handle large files and mobile download better
      try {
        const byteString = atob(dataUrl.split(',')[1]);
        const mimeString = dataUrl.split(',')[0].split(':')[1].split(';')[0];
        const ab = new ArrayBuffer(byteString.length);
        const ia = new Uint8Array(ab);
        for (let i = 0; i < byteString.length; i++) {
          ia[i] = byteString.charCodeAt(i);
        }
        const blob = new Blob([ab], { type: mimeString });
        const blobUrl = URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.download = `sticker-pro-${Date.now()}.png`;
        link.href = blobUrl;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(blobUrl);
      } catch (e) {
        console.error("Download failed", e);
        // Fallback
        const link = document.createElement('a');
        link.download = `sticker-pro-${Date.now()}.png`;
        link.href = dataUrl;
        link.click();
      }
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
    <div className="h-screen overflow-hidden font-sans text-slate-700 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-indigo-100/50 via-slate-50 to-pink-50/30">

      {/* Unified Main Workspace - Full Screen Layout */}
      <div className="flex-1 flex flex-col md:flex-row h-screen overflow-hidden relative z-0 bg-background">

        {/* Canvas Stage - Order 1 on Mobile (Top), Order 2 on Desktop (Right) */}
        <div className="flex-1 relative order-1 md:order-2 bg-cream-medium/30 overflow-hidden flex flex-col">
          {/* Decor */}
          <div className={`absolute inset-0 ${bgColor === 'checkerboard' ? 'bg-grid-pattern' : bgColor === 'white' ? 'bg-white' : bgColor === 'black' ? 'bg-slate-900' : 'bg-[#00FF00]'} opacity-50`}></div>

          <div className="relative w-full h-full flex items-center justify-center p-4 md:p-8 overflow-hidden">
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
              <div className="flex-1 flex flex-col items-center justify-center p-12 relative z-10">
                <div className="bg-white/80 p-8 rounded-3xl shadow-xl border border-white/50 max-w-lg w-full backdrop-blur-sm">
                  <ImageUploader
                    onImageUpload={handleImageUpload}
                    onGallerySelect={() => setShowGallery(true)}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Status Bar Floating Overlay */}
          {image && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-white/80 backdrop-blur-xl border border-cream-dark px-4 py-1.5 rounded-full flex items-center gap-4 text-[10px] font-bold text-bronze-light tracking-wide uppercase shadow-sm z-20 pointer-events-none">
              <span className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse"></span>
                {image.width} x {image.height}
              </span>
              <span className="w-px h-3 bg-cream-dark"></span>
              <span>{historyIndex + 1}/{history.length}</span>
              <span className="w-px h-3 bg-cream-dark"></span>
              <span className="text-primary">{Math.round(zoom * 100)}%</span>
            </div>
          )}
        </div>

        {/* Toolbar Panel - Order 2 on Mobile (Bottom), Order 1 on Desktop (Left) */}
        <div className="w-full md:w-80 bg-white border-t md:border-t-0 md:border-r border-cream-dark order-2 md:order-1 flex-shrink-0 z-30 flex flex-col shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] md:shadow-none h-[45vh] md:h-auto overflow-y-auto">
          <div className="p-4 md:p-6 space-y-6">

            {/* Mobile Handle */}
            <div className="flex items-center justify-center pb-2 md:hidden">
              <div className="w-12 h-1 bg-cream-dark rounded-full mb-2"></div>
            </div>

            <div className="flex-1">
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

            {/* Desktop Back Home */}
            <div className="hidden md:block pt-4 border-t border-cream-dark">
              <button onClick={() => window.location.href = '/'} className="w-full py-2 flex items-center justify-center gap-2 text-bronze-light hover:text-bronze-text transition-colors text-sm font-medium">
                <Home size={16} /> {t('app.backHome')}
              </button>
            </div>
          </div>
        </div>

      </div>

      {/* Global Footer (Unified) */}


      {showGallery && (
        <GalleryPicker
          onSelect={(blobs) => {
            if (blobs.length > 0) {
              const blob = blobs[0];
              const url = URL.createObjectURL(blob);
              const img = new Image();
              img.onload = () => {
                handleImageUpload(img);
                setShowGallery(false);
              };
              img.src = url;
            }
          }}
          onClose={() => setShowGallery(false)}
        />
      )}

    </div>
  );
};

export default App;

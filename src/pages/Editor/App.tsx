import React, { useState, useEffect, useCallback, useRef } from 'react';
import { EditorCanvas } from './components/EditorCanvas';
import { Sidebar } from './components/Sidebar';
import { Toolbar } from './components/Toolbar';
import { Layer, LayerType, TextProperties, CanvasConfig } from './types';
import { useHistory } from './hooks/useHistory';
import { generateId } from './utils/idUtils';
import { measureText } from './utils/textMeasurement';
import { downloadCanvasAsImage, generateCanvasDataUrl } from './utils/exportUtils';
import { Plus, Minus, Settings } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { GalleryPicker } from '../../components/GalleryPicker';
import { useLocation } from 'react-router-dom';
import { saveStickerToDB } from '../../db';

import { LinePreviewModal } from '../../components/LinePreviewModal';

const App: React.FC = () => {
  const { t } = useTranslation();
  const [layers, setLayers] = useState<Layer[]>([]);
  const [selectedLayerId, setSelectedLayerId] = useState<string | null>(null);
  const [showGallery, setShowGallery] = useState(false);

  // Line Preview State
  const [showLinePreview, setShowLinePreview] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // Unified Canvas State
  const [canvasConfig, setCanvasConfig] = useState<CanvasConfig>({
    width: 1080,
    height: 1080,
    backgroundColor: '#ffffff',
    showGrid: true,
    shape: 'rectangle'
  });

  const [customFonts, setCustomFonts] = useState<string[]>([]);
  const [isReady, setIsReady] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const state = location.state as { image?: string };
    if (state?.image) {
      // Need to convert base64/url to Blob? handleAddLayer handles string if it's dataURL (via Image load)
      // Actually handleAddLayer takes 'content' which is string | Blob.
      // If it's string, we treat it as text usually for type 'text', but for 'image' it can be content??
      // Looking at handleAddLayer:
      // if type === 'text' ... content is default text
      // if type === 'image' && content instanceof File ... name = content.name
      // if type === 'image' && content instanceof Blob ... FileReader...
      // Problem: handleAddLayer for 'image' expects Blob/File to read it.
      // If I pass a base64 string, the current implementation might not handle it directly unless I modify handleAddLayer
      // OR I convert base64 string to Blob here.
      fetch(state.image)
        .then(res => res.blob())
        .then(blob => handleAddLayer('image', blob));

      // Clear state to avoid re-adding on refresh? 
      // Actually React Router state persists on refresh usually, but better to clear it or handle it once. 
      // For now simple fetch is enough.
      window.history.replaceState({}, document.title);
    }
  }, []);

  // Zoom State
  const [zoom, setZoom] = useState(0.6);
  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.1, 3));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.1, 0.1));
  const handleResetZoom = () => setZoom(1);

  // Mobile Sidebar State
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 768);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsSidebarOpen(true);
      } else {
        setIsSidebarOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Initial load animation
  useEffect(() => {
    setIsReady(true);
  }, []);

  const { state: historyLayers, push: pushHistory, undo, redo, canUndo, canRedo } = useHistory<Layer[]>([]);

  // Sync state from history
  useEffect(() => {
    if (historyLayers) {
      setLayers(historyLayers);
    }
  }, [historyLayers]);

  const commitHistory = useCallback((newLayers: Layer[]) => {
    pushHistory(newLayers);
  }, [pushHistory]);

  const handleAddLayer = (type: LayerType, content?: string | Blob) => {
    const defaultTextProps: TextProperties = {
      fontSize: 60,
      fontFamily: 'Inter',
      color: '#ffffff',
      strokeColor: '#000000',
      strokeWidth: 8,
      doubleStroke: false,
      doubleStrokeColor: '#ff0000',
      doubleStrokeWidth: 16,
      shadow: false,
      shadowColor: '#000000',
      shadowBlur: 10,
      shadowOffsetX: 5,
      shadowOffsetY: 5,
    };

    let initialWidth = 300;
    let initialHeight = 300;
    const textContent = type === 'text' ? t('editor.layers.defaultText') : '';
    let layerName = type === 'text' ? t('editor.layers.text') : t('editor.layers.image');

    if (type === 'text') {
      const dims = measureText(textContent, defaultTextProps);
      initialWidth = dims.width;
      initialHeight = dims.height;
    }

    if (type === 'image' && content instanceof File) {
      layerName = content.name;
    }

    // Center in the Artboard
    const centerX = canvasConfig.width / 2;
    const centerY = canvasConfig.height / 2;

    const newLayer: Layer = {
      id: generateId(),
      type,
      name: layerName,
      x: centerX,
      y: centerY,
      rotation: 0,
      scale: 1,
      content: type === 'text' ? textContent : (content as string),
      textProps: type === 'text' ? defaultTextProps : undefined,
      width: initialWidth,
      height: initialHeight,
    };

    if (type === 'image' && content instanceof Blob) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const maxDim = 500;
          let w = img.width;
          let h = img.height;
          if (w > maxDim || h > maxDim) {
            const ratio = w / h;
            if (w > h) {
              w = maxDim;
              h = maxDim / ratio;
            } else {
              h = maxDim;
              w = maxDim * ratio;
            }
          }
          newLayer.width = w;
          newLayer.height = h;
          newLayer.content = e.target?.result as string;

          const updatedLayers = [...layers, newLayer];
          setLayers(updatedLayers);
          commitHistory(updatedLayers);
          setSelectedLayerId(newLayer.id);
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(content);
    } else {
      const updatedLayers = [...layers, newLayer];
      setLayers(updatedLayers);
      commitHistory(updatedLayers);
      setSelectedLayerId(newLayer.id);
    }
  };

  const handleUpdateLayer = (id: string, updates: Partial<Layer>) => {
    const updatedLayers = layers.map(l => l.id === id ? { ...l, ...updates } : l);
    setLayers(updatedLayers);
    return updatedLayers;
  };

  const handleLayerCommit = (updatedLayers: Layer[]) => {
    setLayers(updatedLayers);
    commitHistory(updatedLayers);
  };

  const handleSelectLayer = (id: string | null) => {
    setSelectedLayerId(id);
  };

  const handleDeleteLayer = useCallback(() => {
    if (!selectedLayerId) return;
    const newLayers = layers.filter(l => l.id !== selectedLayerId);
    setLayers(newLayers);
    commitHistory(newLayers);
    setSelectedLayerId(null);
  }, [selectedLayerId, layers, commitHistory]);

  const handleDuplicateLayer = useCallback(() => {
    if (!selectedLayerId) return;
    const layerToCopy = layers.find(l => l.id === selectedLayerId);
    if (!layerToCopy) return;

    const newLayer: Layer = {
      ...layerToCopy,
      id: generateId(),

      name: layerToCopy.name ? `${layerToCopy.name} ${t('editor.layers.copy')}` : `Layer ${t('editor.layers.copy')}`,
      x: layerToCopy.x + 20, // Offset slightly
      y: layerToCopy.y + 20,
    };

    const newLayers = [...layers, newLayer];
    setLayers(newLayers);
    commitHistory(newLayers);
    setSelectedLayerId(newLayer.id);
  }, [selectedLayerId, layers, commitHistory]);

  const handleDownload = () => {
    downloadCanvasAsImage(layers, canvasConfig);
  };

  const handleSaveToGallery = async () => {
    const dataUrl = await generateCanvasDataUrl(layers, canvasConfig);
    if (dataUrl) {
      try {
        await saveStickerToDB({
          id: `editor_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
          imageUrl: dataUrl,
          phrase: 'Editor Composition',
          timestamp: Date.now()
        });
        alert(t('packager.status.savedToCollection') || 'Saved to Collection');
      } catch (err) {
        console.error("Failed to save", err);
        alert("Failed to save to gallery");
      }
    }
  };

  const handleLinePreview = async () => {
    // Generate current canvas as image
    const dataUrl = await generateCanvasDataUrl(layers, canvasConfig);
    if (dataUrl) {
      setPreviewImage(dataUrl);
      setShowLinePreview(true);
    }
  };

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in an input
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT') {
        return;
      }

      switch (e.key) {
        case 'Delete':
        case 'Backspace':
          handleDeleteLayer();
          break;
        case 'Escape':
          setSelectedLayerId(null);
          break;
        case 'z':
          if ((e.ctrlKey || e.metaKey) && !e.shiftKey) {
            e.preventDefault();
            if (canUndo) undo();
          }
          break;
        case 'y':
          if ((e.ctrlKey || e.metaKey)) {
            e.preventDefault();
            if (canRedo) redo();
          }
          break;
        case 'Z': // Ctrl+Shift+Z for Redo on some systems
          if ((e.ctrlKey || e.metaKey) && e.shiftKey) {
            e.preventDefault();
            if (canRedo) redo();
          }
          break;
        case 'd':
          if ((e.ctrlKey || e.metaKey)) {
            e.preventDefault();
            handleDuplicateLayer();
          }
          break;
        case 'ArrowUp':
        case 'ArrowDown':
        case 'ArrowLeft':
        case 'ArrowRight':
          if (selectedLayerId) {
            e.preventDefault();
            const shift = e.shiftKey ? 10 : 1;
            const selected = layers.find(l => l.id === selectedLayerId);
            if (selected) {
              let dx = 0;
              let dy = 0;
              if (e.key === 'ArrowUp') dy = -shift;
              if (e.key === 'ArrowDown') dy = shift;
              if (e.key === 'ArrowLeft') dx = -shift;
              if (e.key === 'ArrowRight') dx = shift;

              const newLayers = handleUpdateLayer(selectedLayerId, {
                x: selected.x + dx,
                y: selected.y + dy
              });
              commitHistory(newLayers);
            }
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedLayerId, layers, handleDeleteLayer, handleDuplicateLayer, undo, redo, canUndo, canRedo, commitHistory, canvasConfig]);


  const selectedLayer = layers.find(l => l.id === selectedLayerId);

  const containerRef = useRef<HTMLDivElement>(null);

  const handleAutoFit = useCallback(() => {
    if (containerRef.current) {
      const { clientWidth, clientHeight } = containerRef.current;
      const padding = 20;
      const availableWidth = clientWidth - padding;
      const availableHeight = clientHeight - padding;
      const scale = Math.min(availableWidth / canvasConfig.width, availableHeight / canvasConfig.height);
      setZoom(Math.max(0.1, Math.min(scale, 1))); // Max 100% to avoid blur
    }
  }, [canvasConfig.width, canvasConfig.height]);

  useEffect(() => {
    // Initial fit
    const timer = setTimeout(handleAutoFit, 100);
    window.addEventListener('resize', handleAutoFit);
    return () => {
      window.removeEventListener('resize', handleAutoFit);
      clearTimeout(timer);
    };
  }, [handleAutoFit]);

  return (
    <div className="flex min-h-screen w-full flex-col overflow-hidden bg-background text-bronze-text">

      {/* Unified Header */}


      {showGallery && (
        <GalleryPicker
          onSelect={(blobs) => {
            blobs.forEach(blob => handleAddLayer('image', blob));
            setShowGallery(false);
          }}
          onClose={() => setShowGallery(false)}
        />
      )}

      {/* LINE Preview Modal */}
      <LinePreviewModal
        isOpen={showLinePreview}
        onClose={() => setShowLinePreview(false)}
        imageSrc={previewImage}
      />

      {/* Toolbar - passing dummy props for now or reusing state where possible. 
          The Toolbar's background controls will be deprecated in favor of Sidebar, 
          but we keep it functional for undo/redo/add. 
      */}
      <Toolbar
        onUndo={undo}
        onRedo={redo}
        canUndo={canUndo}
        canRedo={canRedo}
        background={canvasConfig.showGrid ? 'grid' : (
          canvasConfig.backgroundColor === '#000000' ? 'black' :
            canvasConfig.backgroundColor === '#00ff2f' ? 'green' : 'white'
        )}
        setBackground={(bg) => {
          if (bg === 'grid') {
            setCanvasConfig(prev => ({ ...prev, showGrid: true }));
          } else {
            const colorMap: Record<string, string> = {
              'white': '#ffffff',
              'black': '#000000',
              'green': '#00ff2f'
            };
            setCanvasConfig(prev => ({ ...prev, showGrid: false, backgroundColor: colorMap[bg] || '#ffffff' }));
          }
        }}
        onAddImage={(file) => handleAddLayer('image', file)}
        onAddFromGallery={() => setShowGallery(true)}
        onAddText={() => handleAddLayer('text')}
        onDownload={handleDownload}
        onSaveToGallery={handleSaveToGallery}
        onLinePreview={handleLinePreview}
      />

      <div className={`flex flex-1 overflow-hidden transition-opacity duration-700 ${isReady ? 'opacity-100' : 'opacity-0'}`}>
        {/* Canvas Area */}
        <div
          id="canvas-container"
          ref={containerRef}
          className="relative flex-1 overflow-hidden flex items-center justify-center cursor-crosshair"
          onClick={() => {
            if (window.innerWidth < 768) {
              setIsSidebarOpen(false);
            }
          }}
        >
          {/* Background Layers for Visual Flair */}

          <EditorCanvas
            layers={layers}
            selectedLayerId={selectedLayerId}
            config={canvasConfig}
            zoom={zoom}
            onSelectLayer={handleSelectLayer}
            onUpdateLayer={handleUpdateLayer}
            onCommitLayer={handleLayerCommit}
          />

          {/* Floating Zoom Controls */}
          <div className="absolute bottom-24 md:bottom-6 left-6 flex items-center gap-2 bg-white/90 backdrop-blur-md p-1.5 rounded-xl border border-cream-dark shadow-lg z-40">
            <button onClick={handleZoomOut} className="p-2 hover:bg-cream-light rounded-lg text-bronze-light hover:text-primary transition-colors" title={t('editor.controls.zoomOut')}>
              <Minus size={16} />
            </button>
            <button onClick={handleResetZoom} className="px-2 text-xs font-bold text-bronze-text min-w-[3rem] text-center hover:text-primary transition-colors" title={t('editor.controls.resetZoom')}>
              {Math.round(zoom * 100)}%
            </button>
            <button onClick={handleZoomIn} className="p-2 hover:bg-cream-light rounded-lg text-bronze-light hover:text-primary transition-colors" title={t('editor.controls.zoomIn')}>
              <Plus size={16} />
            </button>
          </div>

        </div>

        {/* Floating Sidebar */}
        {/* Floating Sidebar */}
        <Sidebar
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          selectedLayer={selectedLayer}
          onUpdateLayer={(updates) => {
            if (selectedLayerId) {
              const newLayers = handleUpdateLayer(selectedLayerId, updates);
              commitHistory(newLayers);
            }
          }}
          layers={layers}
          setLayers={(newLayers) => {
            setLayers(newLayers);
            commitHistory(newLayers);
          }}
          customFonts={customFonts}
          onAddFont={(name) => setCustomFonts([...customFonts, name])}
          onDeleteLayer={handleDeleteLayer}
          onDuplicateLayer={handleDuplicateLayer}
          onSelectLayer={handleSelectLayer}
          config={canvasConfig}
          setConfig={setCanvasConfig}
          onAddImage={(file) => handleAddLayer('image', file)}
          onAddFromGallery={() => setShowGallery(true)}
          onAddText={() => handleAddLayer('text')}
        />

        {/* Mobile Sidebar Toggle */}
        {!isSidebarOpen && (
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="md:hidden fixed bottom-24 right-6 z-50 bg-primary text-white p-4 rounded-full shadow-xl hover:bg-primary-hover transition-all active:scale-95"
          >
            <Settings size={24} />
          </button>
        )}
      </div>

      {/* Footer */}

    </div>
  );
};

export default App;

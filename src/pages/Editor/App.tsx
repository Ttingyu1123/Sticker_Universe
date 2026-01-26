import React, { useState, useEffect, useCallback } from 'react';
import { EditorCanvas } from './components/EditorCanvas';
import { Sidebar } from './components/Sidebar';
import { Toolbar } from './components/Toolbar';
import { Layer, CanvasBackground, LayerType, TextProperties, CanvasConfig } from './types';
import { useHistory } from './hooks/useHistory';
import { generateId } from './utils/idUtils';
import { measureText } from './utils/textMeasurement';
import { downloadCanvasAsImage } from './utils/exportUtils';
import { Grid, Square, Sun, Plus, Minus, Settings } from 'lucide-react';

const App: React.FC = () => {
  const [layers, setLayers] = useState<Layer[]>([]);
  const [selectedLayerId, setSelectedLayerId] = useState<string | null>(null);

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

  // Zoom State
  const [zoom, setZoom] = useState(1);
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

  const handleAddLayer = (type: LayerType, content?: string | File) => {
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
    const textContent = type === 'text' ? 'Text' : '';
    let layerName = type === 'text' ? 'Text Layer' : 'Image Layer';

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

    if (type === 'image' && content instanceof File) {
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
      name: layerToCopy.name ? `${layerToCopy.name} (Copy)` : 'Layer Copy',
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

  return (
    <div className="flex h-[85vh] w-full flex-col overflow-hidden bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-indigo-100/50 via-slate-50 to-pink-50/30 rounded-3xl border border-slate-200/50 shadow-inner">

      {/* Toolbar - passing dummy props for now or reusing state where possible. 
          The Toolbar's background controls will be deprecated in favor of Sidebar, 
          but we keep it functional for undo/redo/add. 
      */}
      <Toolbar
        onUndo={undo}
        onRedo={redo}
        canUndo={canUndo}
        canRedo={canRedo}
        background={canvasConfig.showGrid ? 'grid' : 'white'} // Compatibility
        setBackground={() => { }} // No-op for now, moving to sidebar
        onAddImage={(file) => handleAddLayer('image', file)}
        onAddText={() => handleAddLayer('text')}
        onDownload={handleDownload}
      />

      <div className={`flex flex-1 overflow-hidden pt-20 transition-opacity duration-700 ${isReady ? 'opacity-100' : 'opacity-0'}`}>
        {/* Canvas Area */}
        <div
          id="canvas-container"
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
          <div className="absolute bottom-6 left-6 flex items-center gap-2 bg-white/90 backdrop-blur-md p-1.5 rounded-xl border border-slate-200/50 shadow-lg z-50">
            <button onClick={handleZoomOut} className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-blue-600 transition-colors" title="Zoom Out">
              <Minus size={16} />
            </button>
            <button onClick={handleResetZoom} className="px-2 text-xs font-bold text-slate-600 min-w-[3rem] text-center hover:text-blue-600 transition-colors" title="Reset Zoom">
              {Math.round(zoom * 100)}%
            </button>
            <button onClick={handleZoomIn} className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-blue-600 transition-colors" title="Zoom In">
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
          onAddText={() => handleAddLayer('text')}
        />

        {/* Mobile Sidebar Toggle */}
        {!isSidebarOpen && (
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="md:hidden fixed bottom-6 right-6 z-50 bg-blue-600 text-white p-4 rounded-full shadow-xl hover:bg-blue-700 transition-all active:scale-95"
          >
            <Settings size={24} />
          </button>
        )}
      </div>

      {/* Footer */}
      <footer className="fixed bottom-4 right-6 z-40 hidden md:block text-right pointer-events-none">
        <div className="pointer-events-auto inline-block">
          <div className="glass-panel px-4 py-2 rounded-xl text-[10px] text-slate-400 font-bold uppercase tracking-widest hover:text-violet-600 transition-colors cursor-default border-slate-200/50 flex items-center gap-3">
            <span>{canvasConfig.width} x {canvasConfig.height} PX</span>
            <span className="opacity-30">|</span>
            <span>TingYu’s Creative OS</span>
            <span className="opacity-30 mx-1">|</span>
            <span>v2.0</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;

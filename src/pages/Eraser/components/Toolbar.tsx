import { Hand, Undo2, Redo2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export type ToolMode = 'erase' | 'restore' | 'magic-wand' | 'move';

interface ToolbarProps {
  toolMode: ToolMode;
  setToolMode: (mode: ToolMode) => void;
  brushSize: number;
  setBrushSize: (size: number) => void;
  tolerance: number;
  setTolerance: (val: number) => void;
  zoom: number;
  setZoom: (zoom: number) => void;
  bgColor: string;
  setBgColor: (color: string) => void;
  onUndo: () => void;
  onRedo: () => void;
  onDownload: () => void;
  onReset: () => void;
  canUndo: boolean;
  canRedo: boolean;
  hasImage: boolean;
}

const Toolbar: React.FC<ToolbarProps> = ({
  toolMode,
  setToolMode,
  brushSize,
  setBrushSize,
  tolerance,
  setTolerance,
  zoom,
  setZoom,
  bgColor,
  setBgColor,
  onUndo,
  onRedo,
  onDownload,
  onReset,
  canUndo,
  canRedo,
  hasImage
}) => {
  const { t } = useTranslation();
  const bgOptions = [
    { value: 'checkerboard', label: 'Default', icon: '🏁' },
    { value: '#ffffff', label: 'White', icon: '', color: '#ffffff' },
    { value: '#000000', label: 'Black', icon: '', color: '#000000' },
    { value: '#10B981', label: 'Green', icon: '', color: '#10B981' }, // Emerald-500
  ];

  const disabledClass = !hasImage ? "opacity-40 pointer-events-none grayscale" : "";

  return (
    <div className={`hud-panel p-4 w-full h-auto md:h-[calc(100vh-140px)] md:overflow-y-auto flex flex-col gap-6 transition-all duration-300 ${disabledClass}`}>

      {/* Tool Mode Selector */}
      <div>
        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 block">
          {t('eraser.toolbar.tools')}
        </label>
        <div className="grid grid-cols-2 md:grid-cols-1 gap-2">
          <button
            onClick={() => setToolMode('erase')}
            className={`btn-icon flex items-center gap-3 w-full justify-start ${toolMode === 'erase' ? 'btn-icon-active' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            <div className={`p-1.5 rounded-lg ${toolMode === 'erase' ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 group-hover:bg-white'}`}>
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m7 21-4.3-4.3c-1-1-1-2.5 0-3.4l9.6-9.6c1-1 2.5-1 3.4 0l5.6 5.6c1 1 1 2.5 0 3.4L13 21" /><path d="M22 21H7" /><path d="m5 11 9 9" /></svg>
            </div>
            <span className="font-semibold text-xs">{t('eraser.toolbar.eraser')}</span>
          </button>

          <button
            onClick={() => setToolMode('restore')}
            className={`btn-icon flex items-center gap-3 w-full justify-start ${toolMode === 'restore' ? 'btn-icon-active !text-emerald-600 !ring-emerald-500/20' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            <div className={`p-1.5 rounded-lg ${toolMode === 'restore' ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 group-hover:bg-white'}`}>
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 13.5V4a2 2 0 0 1 2-2h8.5L20 7.5V20a2 2 0 0 1-2 2h-5.5" /><polyline points="14 2 14 8 20 8" /><path d="M10.42 12.61a2.1 2.1 0 1 1 2.97 2.97L7.95 21 4 22l.99-3.95 5.43-5.44Z" /></svg>
            </div>
            <span className="font-semibold text-xs">{t('eraser.toolbar.restore')}</span>
          </button>

          <button
            onClick={() => setToolMode('magic-wand')}
            className={`btn-icon flex items-center gap-3 w-full justify-start ${toolMode === 'magic-wand' ? 'btn-icon-active !text-purple-600 !ring-purple-500/20' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            <div className={`p-1.5 rounded-lg ${toolMode === 'magic-wand' ? 'bg-purple-100 text-purple-600' : 'bg-slate-100 group-hover:bg-white'}`}>
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m19 2 2 2-2 2-2-2 2-2Z" /><path d="m14 7 3 3-3 3-3-3 3-3Z" /><path d="M15.5 15.5 22 22" /><path d="M8.5 8.5 2 2" /><path d="M19 15.5l-3.5-3.5" /><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10" /></svg>
            </div>
            <span className="font-semibold text-xs">{t('eraser.toolbar.magic')}</span>
          </button>

          <button
            onClick={() => setToolMode('move')}
            className={`btn-icon flex items-center gap-3 w-full justify-start ${toolMode === 'move' ? 'btn-icon-active !text-orange-600 !ring-orange-500/20' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            <div className={`p-1.5 rounded-lg ${toolMode === 'move' ? 'bg-orange-100 text-orange-600' : 'bg-slate-100 group-hover:bg-white'}`}>
              <Hand size={18} />
            </div>
            <span className="font-semibold text-xs">{t('eraser.toolbar.move')}</span>
          </button>
        </div>
      </div>

      <hr className="border-slate-100" />

      {/* Dynamic Settings Area */}
      <div className="flex-1 flex flex-col gap-6">

        {/* Brush/Tolerance Slider */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
          <div className="flex items-center justify-between mb-3">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              {toolMode === 'magic-wand' ? t('eraser.toolbar.tolerance') : t('eraser.toolbar.size')}
            </label>
            <span className="text-[10px] font-mono bg-white px-2 py-0.5 rounded shadow-sm text-slate-600 border border-slate-100">
              {toolMode === 'magic-wand' ? tolerance : `${brushSize}px`}
            </span>
          </div>

          {toolMode === 'magic-wand' ? (
            <input
              type="range" min="0" max="100" value={tolerance}
              onChange={(e) => setTolerance(parseInt(e.target.value))}
              title="Magic Wand Tolerance"
              className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-purple-500"
            />
          ) : (
            <input
              type="range" min="1" max="150" value={brushSize}
              onChange={(e) => setBrushSize(parseInt(e.target.value))}
              title="Brush Size"
              className={`w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer ${toolMode === 'restore' ? 'accent-emerald-500' : 'accent-indigo-500'}`}
            />
          )}
        </div>

        {/* Zoom */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t('eraser.toolbar.zoom')}</label>
            <button onClick={() => setZoom(1)} className="text-[10px] text-indigo-500 font-bold hover:underline">RESET</button>
          </div>
          <input
            type="range" min="1" max="8" step="0.1" value={zoom}
            onChange={(e) => setZoom(parseFloat(e.target.value))}
            title="Zoom Level"
            className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-500"
          />
        </div>

        {/* Background */}
        <div>
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">{t('eraser.toolbar.background')}</label>
          <div className="flex gap-2">
            {bgOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setBgColor(opt.value)}
                className={`w-8 h-8 rounded-full border-2 transition-all shadow-sm ${bgColor === opt.value ? 'border-indigo-500 scale-110' : 'border-transparent hover:scale-105'}`}
                style={opt.value === 'checkerboard' ? { background: 'white', backgroundImage: 'radial-gradient(#cbd5e1 1px, transparent 1px)', backgroundSize: '8px 8px' } : { backgroundColor: opt.color }}
                title={opt.label}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mt-auto flex flex-col gap-3 pt-6 border-t border-slate-100">
        <div className="grid grid-cols-2 gap-2">
          <button onClick={onUndo} disabled={!canUndo || !hasImage} className="p-2 bg-slate-50 hover:bg-white border border-slate-100 rounded-xl disabled:opacity-30 disabled:hover:bg-slate-50 active:scale-95 transition-all text-slate-600" title={t('eraser.toolbar.undo')}>
            <Undo2 size={18} className="mx-auto" />
          </button>
          <button onClick={onRedo} disabled={!canRedo || !hasImage} className="p-2 bg-slate-50 hover:bg-white border border-slate-100 rounded-xl disabled:opacity-30 disabled:hover:bg-slate-50 active:scale-95 transition-all text-slate-600" title={t('eraser.toolbar.redo')}>
            <Redo2 size={18} className="mx-auto" />
          </button>
        </div>

        {hasImage && (
          <button onClick={onReset} className="text-xs font-bold text-slate-400 hover:text-red-500 py-2 transition-colors">
            {t('eraser.toolbar.resetImage')}
          </button>
        )}

        <button
          onClick={onDownload}
          disabled={!hasImage}
          className={`w-full py-3 rounded-xl font-bold shadow-lg shadow-indigo-500/20 text-sm transition-all active:scale-95 ${hasImage ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white hover:brightness-110' : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'}`}
        >
          {t('eraser.toolbar.export')}
        </button>
      </div>

    </div>
  );
};

export default Toolbar;

import React, { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Undo, Redo, Image as ImageIcon, Type, Grid, Square, Sun, Download, Palette, Home, Key } from 'lucide-react';
import { CanvasBackground } from '../types';


interface ToolbarProps {
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  background: CanvasBackground;
  setBackground: (bg: CanvasBackground) => void;
  onAddImage: (file: File) => void;
  onAddFromGallery: () => void;
  onAddText: () => void;
  onDownload: () => void;
  onSaveToGallery: () => void;
}

export const Toolbar: React.FC<ToolbarProps> = ({
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  background,
  setBackground,
  onAddImage,
  onAddFromGallery,
  onAddText,
  onDownload,
  onSaveToGallery,
}) => {
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onAddImage(e.target.files[0]);
      e.target.value = ''; // Reset
    }
  };

  return (
    <nav className="hidden md:block fixed top-4 left-4 right-4 z-50">
      <div className="max-w-7xl mx-auto glass-panel rounded-2xl px-6 py-3 flex items-center justify-between">

        {/* Left Side: Navigation & Title */}
        <div className="flex items-center gap-4">

          <div className="h-6 w-px bg-slate-200 hidden sm:block"></div>

          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-violet-500 to-pink-500 p-2 rounded-xl text-white shadow-lg shadow-violet-500/20">
              <Palette size={18} strokeWidth={2.5} />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-lg font-bold tracking-tight text-slate-800 leading-none">
                StickerOS <span className="text-[10px] px-1.5 py-0.5 rounded-md ml-1 align-top text-violet-600 bg-violet-50">{t('editor.toolbar.editor')}</span>
              </h1>
              <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest mt-0.5">
                {t('editor.toolbar.subtitle')}
              </p>
            </div>
          </div>
        </div>

        {/* Center: Tools (Undo/Redo, Background) */}
        <div className="hidden md:flex items-center gap-4 bg-slate-50/50 p-1.5 rounded-xl border border-slate-200/50">
          <div className="flex items-center">
            <button
              onClick={onUndo}
              disabled={!canUndo}
              className="p-2 rounded-lg hover:bg-white hover:shadow-sm text-slate-400 hover:text-slate-700 disabled:opacity-30 transition-all"
              title={t('editor.toolbar.undo')}
            >
              <Undo size={18} />
            </button>
            <button
              onClick={onRedo}
              disabled={!canRedo}
              className="p-2 rounded-lg hover:bg-white hover:shadow-sm text-slate-400 hover:text-slate-700 disabled:opacity-30 transition-all"
              title={t('editor.toolbar.redo')}
            >
              <Redo size={18} />
            </button>
          </div>

          <div className="w-px h-4 bg-slate-200"></div>

          <div className="flex gap-1">
            <button
              onClick={() => setBackground('grid')}
              className={`p-2 rounded-lg transition-all ${background === 'grid' ? 'bg-white shadow-sm text-blue-500' : 'text-slate-400 hover:bg-white/50'}`}
              title={t('editor.toolbar.grid')}
            >
              <Grid size={18} />
            </button>
            <button
              onClick={() => setBackground('black')}
              className={`p-2 rounded-lg transition-all ${background === 'black' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-400 hover:bg-white/50'}`}
              title={t('editor.toolbar.black')}
            >
              <Square size={18} fill="currentColor" />
            </button>
            <button
              onClick={() => setBackground('green')}
              className={`p-2 rounded-lg transition-all ${background === 'green' ? 'bg-white shadow-sm ring-2 ring-[#00ff2f]' : 'text-slate-400 hover:bg-white/50'}`}
              title={t('editor.toolbar.green')}
            >
              <div className="w-[18px] h-[18px] rounded bg-[#00ff2f] border border-slate-200" />
            </button>
            <button
              onClick={() => setBackground('white')}
              className={`p-2 rounded-lg transition-all ${background === 'white' ? 'bg-white shadow-sm text-yellow-500' : 'text-slate-400 hover:bg-white/50'}`}
              title={t('editor.toolbar.white')}
            >
              <Sun size={18} />
            </button>
          </div>
        </div>

        {/* Right Side: Actions */}
        <div className="flex items-center gap-3">
          <button
            onClick={onAddText}
            className="hidden sm:flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl font-bold text-xs transition-colors"
          >
            <Type size={16} />
            <span>{t('editor.toolbar.text')}</span>
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="hidden sm:flex items-center gap-2 px-4 py-2 bg-violet-50 hover:bg-violet-100 text-violet-600 rounded-xl font-bold text-xs transition-colors border border-violet-200"
          >
            <ImageIcon size={16} />
            <span>{t('editor.toolbar.image')}</span>
          </button>
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept="image/*"
            onChange={handleFileChange}
          />

          <button
            onClick={onAddFromGallery}
            className="hidden sm:flex items-center gap-2 px-4 py-2 bg-pink-50 hover:bg-pink-100 text-pink-600 rounded-xl font-bold text-xs transition-colors border border-pink-200"
          >
            <ImageIcon size={16} />
            <span>{t('editor.toolbar.gallery')}</span>
          </button>

          <div className="w-px h-6 bg-slate-200 mx-1"></div>

          <button
            onClick={onDownload}
            className="flex items-center gap-2 bg-gradient-to-r from-violet-600 to-pink-500 text-white px-5 py-2.5 rounded-xl hover:brightness-110 shadow-lg shadow-violet-500/20 font-bold text-xs transition-all active:scale-95"
          >
            <span>{t('editor.toolbar.export')}</span>
          </button>

          <button
            onClick={onSaveToGallery}
            className="hidden sm:flex items-center gap-2 bg-gradient-to-r from-pink-500 to-rose-500 text-white px-5 py-2.5 rounded-xl hover:brightness-110 shadow-lg shadow-pink-500/20 font-bold text-xs transition-all active:scale-95 border border-pink-400/20"
          >
            <Download size={16} className="rotate-180" />
            <span>{t('editor.toolbar.saveToGallery')}</span>
          </button>

          <a href="https://tingyusdeco.com/" className="ml-2 text-slate-400 hover:text-violet-500 transition-colors" title={t('editor.toolbar.backHome')}>
            <Home size={18} />
          </a>
        </div>
      </div>
    </nav>
  );
};
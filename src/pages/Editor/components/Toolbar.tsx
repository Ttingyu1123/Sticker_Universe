import React, { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Undo, Redo, Image as ImageIcon, Type, Grid, Square, Sun, Download, Palette, Home, Key, Smartphone } from 'lucide-react';
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
  onLinePreview: () => void;
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
  onLinePreview,
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
    <header className="hidden md:block bg-cream-medium/80 backdrop-blur-md border-b border-cream-dark px-6 py-3 sticky top-0 z-30 flex-shrink-0">
      <div className="flex items-center justify-between">

        {/* Left Side: Empty or Logo if needed (Global header handles title) */}
        <div className="flex-1"></div>

        {/* Center: Tools (Undo/Redo, Background) */}
        <div className="hidden md:flex items-center gap-4 bg-cream-light/50 p-1.5 rounded-xl border border-cream-dark">
          <div className="flex items-center">
            <button
              onClick={onUndo}
              disabled={!canUndo}
              className="p-2 rounded-lg hover:bg-white hover:shadow-sm text-bronze-light hover:text-bronze-text disabled:opacity-30 transition-all"
              title={t('editor.toolbar.undo')}
            >
              <Undo size={18} />
            </button>
            <button
              onClick={onRedo}
              disabled={!canRedo}
              className="p-2 rounded-lg hover:bg-white hover:shadow-sm text-bronze-light hover:text-bronze-text disabled:opacity-30 transition-all"
              title={t('editor.toolbar.redo')}
            >
              <Redo size={18} />
            </button>
          </div>

          <div className="w-px h-4 bg-cream-dark"></div>

          <div className="flex gap-1">
            <button
              onClick={() => setBackground('grid')}
              className={`p-2 rounded-lg transition-all ${background === 'grid' ? 'bg-white shadow-sm text-primary' : 'text-bronze-light hover:bg-cream-light'}`}
              title={t('editor.toolbar.grid')}
            >
              <Grid size={18} />
            </button>
            <button
              onClick={() => setBackground('black')}
              className={`p-2 rounded-lg transition-all ${background === 'black' ? 'bg-white shadow-sm text-bronze-text' : 'text-bronze-light hover:bg-cream-light'}`}
              title={t('editor.toolbar.black')}
            >
              <Square size={18} fill="currentColor" />
            </button>
            <button
              onClick={() => setBackground('green')}
              className={`p-2 rounded-lg transition-all ${background === 'green' ? 'bg-white shadow-sm ring-2 ring-[#00ff2f]' : 'text-bronze-light hover:bg-cream-light'}`}
              title={t('editor.toolbar.green')}
            >
              <div className="w-[18px] h-[18px] rounded bg-[#00ff2f] border border-cream-dark" />
            </button>
            <button
              onClick={() => setBackground('white')}
              className={`p-2 rounded-lg transition-all ${background === 'white' ? 'bg-white shadow-sm text-yellow-500' : 'text-bronze-light hover:bg-cream-light'}`}
              title={t('editor.toolbar.white')}
            >
              <Sun size={18} />
            </button>
          </div>
        </div>

        {/* Right Side: Actions */}
        <div className="flex-1 flex justify-end items-center gap-3">
          <button
            onClick={onAddText}
            className="hidden sm:flex items-center gap-2 px-4 py-2 bg-cream-light hover:bg-white text-bronze rounded-xl font-bold text-xs transition-colors border border-cream-dark"
          >
            <Type size={16} />
            <span>{t('editor.toolbar.text')}</span>
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="hidden sm:flex items-center gap-2 px-4 py-2 bg-primary/10 hover:bg-primary/20 text-primary rounded-xl font-bold text-xs transition-colors border border-primary/20"
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
            className="hidden sm:flex items-center gap-2 px-4 py-2 bg-secondary/10 hover:bg-secondary/20 text-secondary rounded-xl font-bold text-xs transition-colors border border-secondary/20"
          >
            <ImageIcon size={16} />
            <span>{t('editor.toolbar.gallery')}</span>
          </button>

          <button
            onClick={onLinePreview}
            className="flex items-center gap-2 px-3 py-2 bg-white hover:bg-green-50 text-[#06C755] rounded-xl font-bold text-xs transition-colors border border-[#06C755]/20 shadow-sm"
            title={t('editor.toolbar.linePreviewTooltip')}
          >
            <Smartphone size={16} />
            <span className="hidden sm:inline">{t('editor.toolbar.linePreview')}</span>
          </button>

          {/* Separator - make sure it exists or add new one */}
          <div className="w-px h-6 bg-cream-dark mx-1"></div>

          <button
            onClick={onDownload}
            className="flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-xl hover:bg-primary-hover shadow-lg shadow-primary/20 font-bold text-xs transition-all active:scale-95"
          >
            <span>{t('editor.toolbar.export')}</span>
          </button>

          <button
            onClick={onSaveToGallery}
            className="hidden sm:flex items-center gap-2 bg-bronze text-white px-5 py-2.5 rounded-xl hover:bg-bronze-text shadow-lg shadow-bronze/20 font-bold text-xs transition-all active:scale-95"
          >
            <Download size={16} className="rotate-180" />
            <span>{t('editor.toolbar.saveToGallery')}</span>
          </button>

          <a href="https://tingyusdeco.com/" className="ml-2 text-bronze-light hover:text-primary transition-colors" title={t('editor.toolbar.backHome')}>
            <Home size={18} />
          </a>
        </div>
      </div>
    </header>
  );
};
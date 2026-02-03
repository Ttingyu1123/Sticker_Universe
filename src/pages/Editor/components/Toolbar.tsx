import React, { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Undo, Redo, Image as ImageIcon, Type, Grid, Square, Sun, Download, Smartphone, Layout, Save } from 'lucide-react';
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

  const ActionButton = ({ onClick, icon: Icon, label, primary = false, active = false }: { onClick: () => void, icon: any, label?: string, primary?: boolean, active?: boolean }) => (
    <button
      onClick={onClick}
      className={`
        flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all border
        ${primary
          ? 'bg-indigo-600 text-white border-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-200'
          : active
            ? 'bg-white text-indigo-600 border-indigo-200 shadow-sm'
            : 'bg-transparent text-slate-600 border-transparent hover:bg-white hover:shadow-sm hover:text-indigo-600'
        }
      `}
      title={label}
    >
      <Icon size={18} />
      {label && <span>{label}</span>}
    </button>
  );

  const IconButton = ({ onClick, icon: Icon, title, disabled = false, active = false }: { onClick: () => void, icon: any, title: string, disabled?: boolean, active?: boolean }) => (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`
        p-2 rounded-lg transition-all
        ${active
          ? 'bg-white text-indigo-600 shadow-sm ring-1 ring-black/5'
          : disabled
            ? 'text-slate-300 cursor-not-allowed'
            : 'text-slate-500 hover:text-indigo-600 hover:bg-white hover:shadow-sm'
        }
      `}
    >
      <Icon size={18} />
    </button>
  );

  return (
    <div className="hidden md:block px-6 py-3 bg-slate-50/50 backdrop-blur-xl border-b border-indigo-50/50 sticky top-0 z-30">
      <div className="flex items-center justify-between gap-4 max-w-[1920px] mx-auto">

        {/* Left: Canvas Controls */}
        <div className="flex items-center gap-3">
          {/* History Group */}
          <div className="flex items-center gap-1 bg-slate-200/50 p-1 rounded-xl border border-white/50">
            <IconButton onClick={onUndo} icon={Undo} title={t('editor.toolbar.undo')} disabled={!canUndo} />
            <IconButton onClick={onRedo} icon={Redo} title={t('editor.toolbar.redo')} disabled={!canRedo} />
          </div>

          <div className="w-px h-6 bg-slate-200" />

          {/* Background Group */}
          <div className="flex items-center gap-1 bg-slate-200/50 p-1 rounded-xl border border-white/50">
            <IconButton
              onClick={() => setBackground('grid')}
              icon={Grid}
              title={t('editor.toolbar.grid')}
              active={background === 'grid'}
            />
            <IconButton
              onClick={() => setBackground('white')}
              icon={Sun}
              title={t('editor.toolbar.white')}
              active={background === 'white'}
            />
            <IconButton
              onClick={() => setBackground('black')}
              icon={Square}
              title={t('editor.toolbar.black')}
              active={background === 'black'}
            />
            <button
              onClick={() => setBackground('green')}
              className={`p-2 rounded-lg transition-all ${background === 'green' ? 'bg-white shadow-sm ring-1 ring-black/5' : 'hover:bg-white hover:shadow-sm'}`}
              title={t('editor.toolbar.green')}
            >
              <div className="w-[18px] h-[18px] rounded border border-slate-300 bg-[#00ff2f]" />
            </button>
          </div>
        </div>

        {/* Center: Add Content */}
        <div className="flex items-center gap-2 bg-white p-1.5 rounded-2xl shadow-sm border border-indigo-50">
          <ActionButton onClick={onAddText} icon={Type} label={t('editor.toolbar.text') || 'Text'} />
          <div className="w-px h-4 bg-slate-100" />
          <ActionButton onClick={() => fileInputRef.current?.click()} icon={ImageIcon} label={t('editor.toolbar.image') || 'Image'} />
          <div className="w-px h-4 bg-slate-100" />
          <ActionButton onClick={onAddFromGallery} icon={Layout} label={t('editor.toolbar.gallery') || 'Gallery'} />
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-3 justify-end">
          <ActionButton onClick={onLinePreview} icon={Smartphone} label={t('editor.toolbar.linePreview') || 'Preview'} />

          <div className="w-px h-6 bg-slate-200" />

          {/* Save & Export */}
          <div className="flex items-center gap-2">
            <button
              onClick={onSaveToGallery}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 transition-colors flex items-center gap-2 border border-slate-200 hover:border-indigo-200 bg-white"
              title={t('editor.toolbar.saveToGallery')}
            >
              <Save size={18} />
              <span>{t('editor.toolbar.save')}</span>
            </button>
            <button
              onClick={onDownload}
              className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 shadow-md shadow-indigo-200 transition-all active:scale-95 flex items-center gap-2"
              title={t('editor.toolbar.export')}
            >
              <Download size={18} />
              <span>{t('editor.toolbar.export')}</span>
            </button>
          </div>
        </div>

        {/* Hidden Input */}
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept="image/*"
          onChange={handleFileChange}
        />
      </div>
    </div>
  );
};
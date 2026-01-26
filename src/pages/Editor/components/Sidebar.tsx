import React, { useRef, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Layer, TextProperties, CanvasConfig } from '../types';
import { FONTS } from '../constants';
import { measureText } from '../utils/textMeasurement';
import {
  AlignHorizontalJustifyCenter, AlignVerticalJustifyCenter,
  ArrowDown, ArrowUp, Trash2, Upload, Copy,
  Layers, Settings, Type, Image as ImageIcon, ChevronUp, ChevronDown,
  FlipHorizontal, X
} from 'lucide-react';
import { ColorPickerInput } from './ColorPickerInput';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  selectedLayer?: Layer;
  onUpdateLayer: (updates: Partial<Layer>) => void;
  layers: Layer[];
  setLayers: (layers: Layer[]) => void;
  customFonts: string[];
  onAddFont: (name: string) => void;
  onDeleteLayer: () => void;
  onDuplicateLayer: () => void;
  onSelectLayer: (id: string | null) => void;
  config: CanvasConfig;
  setConfig: (config: CanvasConfig) => void;
  onAddImage: (file: File) => void;
  onAddText: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onClose,
  selectedLayer,
  onUpdateLayer,
  layers,
  setLayers,
  customFonts,
  onAddFont,
  onDeleteLayer,
  onDuplicateLayer,
  onSelectLayer,
  config,
  setConfig,
  onAddImage,
  onAddText
}) => {
  const fontInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState<'settings' | 'layers'>('settings');
  const { t } = useTranslation();

  // Renaming state
  const [editingLayerId, setEditingLayerId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  // Switch to settings tab automatically when a layer is selected
  useEffect(() => {
    if (selectedLayer && !editingLayerId) {
      setActiveTab('settings');
      // If on mobile (or generally closed), open sidebar when layer selected?
      // Optional: if (!isOpen && window.innerWidth < 768) onClose(); // wait, onClose is to close. We can't open from here as prop is one-way.
      // But App.tsx handles selectedLayerId logic. If we want auto-open, App.tsx should do it.
    }
  }, [selectedLayer?.id]);

  const handleFontUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const fontName = file.name.split('.')[0];

      const buffer = await file.arrayBuffer();
      const fontFace = new FontFace(fontName, buffer);

      try {
        await fontFace.load();
        document.fonts.add(fontFace);
        onAddFont(fontName);
      } catch (err) {
        console.error("Failed to load font", err);
        alert("Failed to load font file.");
      }
    }
  };

  const updateTextProp = (prop: keyof TextProperties, value: any) => {
    if (!selectedLayer || selectedLayer.type !== 'text' || !selectedLayer.textProps) return;

    const newProps = {
      ...selectedLayer.textProps,
      [prop]: value,
    };

    const { width, height } = measureText(selectedLayer.content, newProps);

    onUpdateLayer({
      textProps: newProps,
      width,
      height
    });
  };

  const handleContentChange = (newContent: string) => {
    if (!selectedLayer || selectedLayer.type !== 'text' || !selectedLayer.textProps) return;
    const { width, height } = measureText(newContent, selectedLayer.textProps);
    onUpdateLayer({
      content: newContent,
      width,
      height
    });
  };

  const handleLayerOrder = (layerId: string, action: 'up' | 'down') => {
    const index = layers.findIndex(l => l.id === layerId);
    if (index === -1) return;

    const newLayers = [...layers];

    if (action === 'up' && index < newLayers.length - 1) {
      [newLayers[index], newLayers[index + 1]] = [newLayers[index + 1], newLayers[index]];
      setLayers(newLayers);
    } else if (action === 'down' && index > 0) {
      [newLayers[index], newLayers[index - 1]] = [newLayers[index - 1], newLayers[index]];
      setLayers(newLayers);
    }
  };

  const handleAlign = (type: 'horizontal' | 'vertical') => {
    if (!selectedLayer) return;

    if (type === 'horizontal') {
      onUpdateLayer({ x: config.width / 2 });
    } else {
      onUpdateLayer({ y: config.height / 2 });
    }
  };

  // --- Renaming Logic ---
  const startRenaming = (layer: Layer) => {
    setEditingLayerId(layer.id);
    setEditingName(layer.name || (layer.type === 'text' ? layer.content : 'Image Layer'));
  };

  const saveRename = () => {
    if (editingLayerId && editingName.trim()) {
      const newLayers = layers.map(l => l.id === editingLayerId ? { ...l, name: editingName.trim() } : l);
      setLayers(newLayers);
      // Also update selected layer if it's the one being renamed
      if (selectedLayer && selectedLayer.id === editingLayerId) {
        onUpdateLayer({ name: editingName.trim() });
      }
    }
    setEditingLayerId(null);
    setEditingName('');
  };

  const cancelRename = () => {
    setEditingLayerId(null);
    setEditingName('');
  };

  const renderSettingsContent = () => {
    if (!selectedLayer) {
      return (
        <div className="space-y-6 p-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center shadow-sm mx-auto mb-3 text-blue-500">
              <Settings size={28} />
            </div>
            <h3 className="text-sm font-bold text-slate-700">{t('editor.sidebar.title')}</h3>
            <p className="text-xs text-slate-400 font-medium mt-1">{t('editor.sidebar.subtitle')}</p>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-4">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">{t('editor.sidebar.dimensions')}</label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">{t('editor.sidebar.width')}</span>
                <input
                  type="number"
                  value={config.width}
                  onChange={(e) => setConfig({ ...config, width: Number(e.target.value) })}
                  className="w-full text-sm font-bold p-2.5 bg-white border border-slate-200 rounded-xl text-center focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                />
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">{t('editor.sidebar.height')}</span>
                <input
                  type="number"
                  value={config.height}
                  onChange={(e) => setConfig({ ...config, height: Number(e.target.value) })}
                  className="w-full text-sm font-bold p-2.5 bg-white border border-slate-200 rounded-xl text-center focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                />
              </div>
            </div>

            {/* Background Settings */}
            <div className="pt-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">{t('editor.sidebar.background')}</label>
              <div className="space-y-3">
                {/* Show Grid Toggle */}
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500">{t('editor.sidebar.transparentGrid')}</span>
                  <div className="relative inline-block w-8 h-4 align-middle select-none">
                    <input
                      type="checkbox"
                      checked={config.showGrid}
                      onChange={(e) => setConfig({ ...config, showGrid: e.target.checked })}
                      className="absolute block w-4 h-4 rounded-full bg-white border-4 appearance-none cursor-pointer checked:right-0 checked:border-blue-600"
                    />
                    <label className={`block overflow-hidden h-4 rounded-full cursor-pointer ${config.showGrid ? 'bg-blue-200' : 'bg-slate-300'}`}></label>
                  </div>
                </div>

                {/* Shape Toggle */}
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500">{t('editor.sidebar.shape')}</span>
                  <div className="flex bg-slate-200 rounded-lg p-0.5">
                    <button
                      onClick={() => setConfig({ ...config, shape: 'rectangle' })}
                      className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${config.shape === 'rectangle' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                      {t('editor.sidebar.shapes.rect')}
                    </button>
                    <button
                      onClick={() => setConfig({ ...config, shape: 'rounded' })}
                      className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${config.shape === 'rounded' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                      {t('editor.sidebar.shapes.rounded')}
                    </button>
                    <button
                      onClick={() => setConfig({ ...config, shape: 'circle' })}
                      className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${config.shape === 'circle' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                      {t('editor.sidebar.shapes.circle')}
                    </button>
                  </div>
                </div>

                {/* Solid Color Picker */}
                <div className="flex items-center gap-3 bg-white p-2 rounded-xl border border-slate-200 shadow-sm">
                  {/* Solid Color Picker */}
                  <ColorPickerInput
                    label={t('editor.sidebar.baseColor')}
                    value={config.backgroundColor}
                    onChange={(val) => setConfig({ ...config, backgroundColor: val })}
                  />
                </div>
              </div>
            </div>

            <div className="pt-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">{t('editor.sidebar.presets.title')}</label>
              <div className="flex flex-wrap gap-2">
                {[
                  { name: t('editor.sidebar.presets.line'), w: 370, h: 320 },
                  { name: t('editor.sidebar.presets.telegram'), w: 512, h: 512 },
                  { name: t('editor.sidebar.presets.instagram'), w: 1080, h: 1080 },
                  { name: t('editor.sidebar.presets.facebook'), w: 1200, h: 630 },
                  { name: t('editor.sidebar.presets.print'), w: 2480, h: 3508 },
                  { name: t('editor.sidebar.presets.hd'), w: 1920, h: 1080 },
                ].map(preset => (
                  <button
                    key={preset.name}
                    onClick={() => setConfig({ ...config, width: preset.w, height: preset.h })}
                    className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-600 hover:text-blue-600 hover:border-blue-200 hover:shadow-sm transition-all flex flex-col items-start gap-0.5 min-w-[100px]"
                  >
                    <span>{preset.name}</span>
                    <span className="text-[10px] text-slate-400 font-medium">{preset.w} x {preset.h}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="h-px bg-slate-100 my-4" />

          <div className="text-center p-4 border border-dashed border-slate-200 rounded-xl text-slate-400">
            <p className="text-xs">{t('editor.sidebar.selectLayer')}</p>
          </div>
        </div>
      );
    }

    return (
      <div className="p-5 space-y-8 pb-32">

        {/* Layer Name Input */}
        <div className="space-y-3">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t('editor.sidebar.layerName')}</label>
          <input
            type="text"
            value={selectedLayer.name || ''}
            onChange={(e) => onUpdateLayer({ name: e.target.value })}
            placeholder={selectedLayer.type === 'text' ? selectedLayer.content : t('editor.layers.image')}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-sm font-bold text-slate-700 transition-all placeholder:font-normal"
          />
        </div>

        {/* Alignment & Ordering */}
        <div className="space-y-3">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t('editor.sidebar.arrange')}</label>
          <div className="grid grid-cols-4 gap-2">
            <button onClick={() => handleLayerOrder(selectedLayer.id, 'up')} className="p-2.5 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 hover:border-blue-300 hover:text-blue-500 transition-all flex justify-center text-slate-500 shadow-sm" title={t('editor.sidebar.moveUp')}>
              <ArrowUp size={16} />
            </button>
            <button onClick={() => handleLayerOrder(selectedLayer.id, 'down')} className="p-2.5 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 hover:border-blue-300 hover:text-blue-500 transition-all flex justify-center text-slate-500 shadow-sm" title={t('editor.sidebar.moveDown')}>
              <ArrowDown size={16} />
            </button>
            <button onClick={() => handleAlign('horizontal')} className="p-2.5 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 hover:border-blue-300 hover:text-blue-500 transition-all flex justify-center text-slate-500 shadow-sm" title={t('editor.sidebar.centerH')}>
              <AlignHorizontalJustifyCenter size={16} />
            </button>
            <button onClick={() => handleAlign('vertical')} className="p-2.5 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 hover:border-blue-300 hover:text-blue-500 transition-all flex justify-center text-slate-500 shadow-sm" title={t('editor.sidebar.centerV')}>
              <AlignVerticalJustifyCenter size={16} />
            </button>
          </div>
          <div className="flex gap-2 mt-2">
            <button
              onClick={() => onUpdateLayer({ flipX: !selectedLayer.flipX })}
              className={`flex-1 flex items-center justify-center space-x-2 p-2.5 border rounded-xl hover:shadow-sm transition-all text-xs font-bold ${selectedLayer.flipX ? 'bg-blue-50 border-blue-200 text-blue-600' : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-white hover:text-blue-600'}`}
              title={t('editor.sidebar.mirror')}
            >
              <FlipHorizontal size={16} />
              <span>{t('editor.sidebar.mirror')}</span>
            </button>
            <button
              onClick={onDuplicateLayer}
              className="flex-1 flex items-center justify-center space-x-2 p-2.5 bg-slate-50 border border-slate-200 rounded-xl hover:bg-white hover:shadow-sm hover:text-blue-600 transition-all text-xs font-bold text-slate-500"
            >
              <Copy size={16} />
              <span>{t('editor.sidebar.duplicate')}</span>
            </button>
          </div>
        </div>

        {selectedLayer.type === 'text' && selectedLayer.textProps && (
          <>
            <div className="space-y-3">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t('editor.sidebar.content')}</label>
              <input
                type="text"
                value={selectedLayer.content}
                onChange={(e) => handleContentChange(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-sm font-bold text-slate-700"
              />
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t('editor.sidebar.typography')}</label>

              <div className="flex gap-2">
                <select
                  value={selectedLayer.textProps.fontFamily}
                  onChange={(e) => updateTextProp('fontFamily', e.target.value)}
                  className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm font-medium text-slate-600 outline-none focus:border-blue-500 shadow-sm"
                >
                  <optgroup label="Standard">
                    {FONTS.map(f => <option key={f} value={f}>{f}</option>)}
                  </optgroup>
                  {customFonts.length > 0 && (
                    <optgroup label="Custom">
                      {customFonts.map(f => <option key={f} value={f}>{f}</option>)}
                    </optgroup>
                  )}
                </select>
                <button
                  onClick={() => fontInputRef.current?.click()}
                  className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-500 bg-white shadow-sm"
                  title={t('editor.sidebar.uploadFont')}
                >
                  <Upload size={16} />
                </button>
                <input ref={fontInputRef} type="file" accept=".ttf,.otf,.woff" hidden onChange={handleFontUpload} />
              </div>

              {/* Font Size Slider */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-500">{t('editor.sidebar.size')}</span>
                  <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">{selectedLayer.textProps.fontSize}px</span>
                </div>
                <input
                  type="range"
                  min="12"
                  max="200"
                  value={selectedLayer.textProps.fontSize}
                  onChange={(e) => updateTextProp('fontSize', Number(e.target.value))}
                  className="w-full accent-blue-600 h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              <ColorPickerInput
                label={t('editor.sidebar.fillColor')}
                value={selectedLayer.textProps.color}
                onChange={(val) => updateTextProp('color', val)}
              />
            </div>

            <div className="space-y-4 pt-2 border-t border-slate-100">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t('editor.sidebar.effects')}</label>

              {/* Primary Stroke */}
              <div className="space-y-3 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <div className="flex justify-between items-center">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-bold text-slate-600">{t('editor.sidebar.outline')}</span>
                  </div>
                  <ColorPickerInput
                    label={t('editor.sidebar.fillColor')}
                    value={selectedLayer.textProps.strokeColor}
                    onChange={(val) => updateTextProp('strokeColor', val)}
                  />
                </div>
                <input
                  type="range"
                  min="0"
                  max="40"
                  value={selectedLayer.textProps.strokeWidth}
                  onChange={(e) => updateTextProp('strokeWidth', Number(e.target.value))}
                  className="w-full accent-blue-600 h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              {/* Double Stroke */}
              <div className={`space-y-3 p-4 rounded-xl border transition-all ${selectedLayer.textProps.doubleStroke ? 'bg-white border-blue-200 shadow-md ring-1 ring-blue-500/10' : 'bg-slate-50 border-slate-100'}`}>
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-bold ${selectedLayer.textProps.doubleStroke ? 'text-blue-600' : 'text-slate-500'}`}>{t('editor.sidebar.doubleOutline')}</span>
                  <div className="relative inline-block w-8 h-4 align-middle select-none">
                    <input
                      type="checkbox"
                      checked={selectedLayer.textProps.doubleStroke}
                      onChange={(e) => updateTextProp('doubleStroke', e.target.checked)}
                      className="absolute block w-4 h-4 rounded-full bg-white border-4 appearance-none cursor-pointer checked:right-0 checked:border-blue-600"
                    />
                    <label className={`block overflow-hidden h-4 rounded-full cursor-pointer ${selectedLayer.textProps.doubleStroke ? 'bg-blue-200' : 'bg-slate-300'}`}></label>
                  </div>
                </div>

                {selectedLayer.textProps.doubleStroke && (
                  <div className="pt-2 space-y-3 animate-in fade-in slide-in-from-top-2">
                    <ColorPickerInput
                      label={t('editor.sidebar.fillColor')}
                      value={selectedLayer.textProps.doubleStrokeColor}
                      onChange={(val) => updateTextProp('doubleStrokeColor', val)}
                    />
                    <input
                      type="range"
                      min="0"
                      max="60"
                      value={selectedLayer.textProps.doubleStrokeWidth}
                      onChange={(e) => updateTextProp('doubleStrokeWidth', Number(e.target.value))}
                      className="w-full accent-blue-600 h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>
                )}
              </div>

              {/* Drop Shadow */}
              <div className={`space-y-3 p-4 rounded-xl border transition-all ${selectedLayer.textProps.shadow ? 'bg-white border-purple-200 shadow-md ring-1 ring-purple-500/10' : 'bg-slate-50 border-slate-100'}`}>
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-bold ${selectedLayer.textProps.shadow ? 'text-purple-600' : 'text-slate-500'}`}>{t('editor.sidebar.dropShadow')}</span>

                  <div className="relative inline-block w-8 h-4 align-middle select-none">
                    <input
                      type="checkbox"
                      checked={!!selectedLayer.textProps.shadow}
                      onChange={(e) => updateTextProp('shadow', e.target.checked)}
                      className="absolute block w-4 h-4 rounded-full bg-white border-4 appearance-none cursor-pointer checked:right-0 checked:border-purple-600"
                    />
                    <label className={`block overflow-hidden h-4 rounded-full cursor-pointer ${selectedLayer.textProps.shadow ? 'bg-purple-200' : 'bg-slate-300'}`}></label>
                  </div>
                </div>

                {selectedLayer.textProps.shadow && (
                  <div className="space-y-3 mt-2 animate-in fade-in slide-in-from-top-2">
                    <ColorPickerInput
                      label={t('editor.sidebar.fillColor')}
                      value={selectedLayer.textProps.shadowColor}
                      onChange={(val) => updateTextProp('shadowColor', val)}
                    />
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">{t('editor.sidebar.xOffset')}</span>
                        <input
                          type="number"
                          value={selectedLayer.textProps.shadowOffsetX}
                          onChange={(e) => updateTextProp('shadowOffsetX', Number(e.target.value))}
                          className="w-full text-xs font-bold p-2 bg-slate-50 border border-slate-200 rounded-lg text-center"
                        />
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">{t('editor.sidebar.yOffset')}</span>
                        <input
                          type="number"
                          value={selectedLayer.textProps.shadowOffsetY}
                          onChange={(e) => updateTextProp('shadowOffsetY', Number(e.target.value))}
                          className="w-full text-xs font-bold p-2 bg-slate-50 border border-slate-200 rounded-lg text-center"
                        />
                      </div>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">{t('editor.sidebar.blur')}</span>
                      <input
                        type="range"
                        min="0"
                        max="30"
                        value={selectedLayer.textProps.shadowBlur}
                        onChange={(e) => updateTextProp('shadowBlur', Number(e.target.value))}
                        className="w-full accent-purple-600 h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        <div className="pt-6 mt-6 border-t border-slate-100">
          <button
            onClick={onDeleteLayer}
            className="w-full flex items-center justify-center space-x-2 bg-red-50 text-red-500 py-3 rounded-xl hover:bg-red-100 hover:shadow-inner transition-colors font-bold text-xs"
          >
            <Trash2 size={16} />
            <span>{t('editor.sidebar.delete')}</span>
          </button>
        </div>
      </div>
    );
  };

  const renderLayersList = () => {
    // We reverse layers so the "Top" layer is visually at the top of the list
    const reversedLayers = [...layers].reverse();

    return (
      <div className="flex flex-col p-4 space-y-4 pb-20">
        {/* Add Layer Buttons */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={onAddText}
            className="flex items-center justify-center gap-2 py-3 bg-slate-50 border border-slate-200 hover:bg-white hover:border-blue-200 hover:text-blue-600 rounded-xl transition-all font-bold text-xs text-slate-600 shadow-sm"
          >
            <Type size={16} />
            <span>{t('editor.sidebar.addText')}</span>
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center justify-center gap-2 py-3 bg-slate-50 border border-slate-200 hover:bg-white hover:border-blue-200 hover:text-blue-600 rounded-xl transition-all font-bold text-xs text-slate-600 shadow-sm"
          >
            <ImageIcon size={16} />
            <span>{t('editor.sidebar.addImage')}</span>
          </button>
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept="image/*"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                onAddImage(e.target.files[0]);
                e.target.value = '';
              }
            }}
          />
        </div>

        {layers.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-slate-400 py-8 text-center border-2 border-dashed border-slate-100 rounded-2xl">
            <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mb-3">
              <Layers size={20} className="text-slate-300" />
            </div>
            <p className="font-bold text-sm text-slate-500">{t('editor.sidebar.noLayers')}</p>
            <p className="text-xs mt-1 text-slate-400">{t('editor.sidebar.useButtons')}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {reversedLayers.map((layer) => {
              const isSelected = selectedLayer?.id === layer.id;
              const isEditing = editingLayerId === layer.id;

              // Fallback name
              const displayName = layer.name || (layer.type === 'text' ? layer.content : t('editor.layers.image'));

              return (
                <div
                  key={layer.id}
                  onClick={() => onSelectLayer(layer.id)}
                  onDoubleClick={() => startRenaming(layer)}
                  className={`flex items-center justify-between p-3 rounded-xl cursor-pointer border transition-all group ${isSelected ? 'bg-blue-50 border-blue-200 shadow-sm' : 'bg-white border-transparent hover:bg-slate-50 hover:border-slate-100'}`}
                >
                  <div className="flex items-center space-x-3 overflow-hidden flex-1">
                    <div className={`w-8 h-8 flex items-center justify-center rounded-lg text-slate-500 flex-shrink-0 transition-colors ${isSelected ? 'bg-blue-100 text-blue-600' : 'bg-slate-100'}`}>
                      {layer.type === 'text' ? <Type size={16} /> : <ImageIcon size={16} />}
                    </div>
                    <div className="flex flex-col overflow-hidden flex-1">
                      {isEditing ? (
                        <input
                          type="text"
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                          onBlur={saveRename}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') saveRename();
                            if (e.key === 'Escape') cancelRename();
                          }}
                          autoFocus
                          className="text-xs font-bold border border-blue-400 rounded px-1 py-0.5 w-full focus:outline-none focus:ring-1 focus:ring-blue-500"
                          onClick={(e) => e.stopPropagation()}
                        />
                      ) : (
                        <span className={`text-xs font-bold truncate select-none ${isSelected ? 'text-blue-700' : 'text-slate-700'}`} title={displayName}>
                          {displayName}
                        </span>
                      )}

                      {!isEditing && (
                        <span className="text-[9px] text-slate-400 uppercase tracking-wider font-bold">{layer.type}</span>
                      )}
                    </div>
                  </div>

                  {isSelected && !isEditing && (
                    <div className="flex items-center space-x-1 ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => { e.stopPropagation(); handleLayerOrder(layer.id, 'up'); }}
                        className="p-1 hover:bg-blue-100 rounded text-slate-400 hover:text-blue-600 transition-colors"
                        title="Move Up"
                      >
                        <ChevronUp size={14} />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleLayerOrder(layer.id, 'down'); }}
                        className="p-1 hover:bg-blue-100 rounded text-slate-400 hover:text-blue-600 transition-colors"
                        title={t('editor.sidebar.moveDown')}
                      >
                        <ChevronDown size={14} />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={`
      fixed bottom-0 left-0 right-0 w-full h-[55vh] rounded-t-3xl border-t border-slate-200/50 shadow-[0_-10px_40px_rgba(0,0,0,0.1)]
      glass-panel flex flex-col overflow-hidden z-50 transform transition-transform duration-500 ease-spring
      ${isOpen ? 'translate-y-0' : 'translate-y-full'}
      
      md:translate-y-0 md:static md:w-80 md:h-[calc(100vh-2rem)] md:my-4 md:mr-4 md:rounded-3xl md:border md:shadow-sm
      md:animate-in md:slide-in-from-right-4
      ${!isOpen && 'md:hidden'}
    `}>
      {/* Mobile Drag Handle / Collapse */}
      <div
        className="md:hidden w-full flex items-center justify-center pt-3 pb-1 cursor-pointer active:opacity-70"
        onClick={onClose}
      >
        <div className="w-12 h-1.5 bg-slate-300/50 rounded-full" />
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-100 bg-white/50 backdrop-blur-sm p-1">
        <button
          onClick={() => setActiveTab('settings')}
          className={`flex-1 flex items-center justify-center py-2.5 text-xs font-bold rounded-xl transition-all ${activeTab === 'settings' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600 hover:bg-white/50'}`}
        >
          <Settings size={14} className="mr-2" />
          {t('app.settings')}
        </button >
        <button
          onClick={() => setActiveTab('layers')}
          className={`flex-1 flex items-center justify-center py-2.5 text-xs font-bold rounded-xl transition-all ${activeTab === 'layers' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600 hover:bg-white/50'}`}
        >
          <Layers size={14} className="mr-2" />
          {t('editor.subtitle')}
          <span className={`ml-2 px-1.5 py-0.5 rounded-md text-[9px] ${activeTab === 'layers' ? 'bg-blue-50 text-blue-600' : 'bg-slate-100 text-slate-500'}`}>{layers.length}</span>
        </button>
      </div >

      <div className="flex-1 overflow-y-auto custom-scrollbar bg-white/30">
        {activeTab === 'settings' ? renderSettingsContent() : renderLayersList()}
      </div>
    </div >
  );
};

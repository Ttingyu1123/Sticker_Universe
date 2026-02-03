import React from 'react';
import { useTranslation } from 'react-i18next';
import { AspectRatio, CollageSettings, LayoutType } from '../types';
import {
    Grid2X2,
    Columns,
    Rows,
    LayoutTemplate,
    Square,
    Smartphone,
    Monitor,
    RectangleVertical,
    RectangleHorizontal,
    Printer,
    Image as ImageIcon,
    Frame,
    Settings2,
    BrickWall,
    PanelLeft,
    Shuffle,
    Minimize2,
    Sparkles,
    Film,
    StickyNote,
    RefreshCcw,
    Palette
} from 'lucide-react';
import { BACKGROUND_PRESETS } from '../utils/backgroundPresets';

interface ControlsProps {
    settings: CollageSettings;
    onUpdate: (s: CollageSettings) => void;
    imageCount: number;
    onShuffle?: () => void;
}

export const Controls: React.FC<ControlsProps> = ({ settings, onUpdate, imageCount, onShuffle }) => {
    const { t } = useTranslation();

    const handleChange = (key: keyof CollageSettings, value: any) => {
        if (key === 'backgroundColor') {
            onUpdate({ ...settings, [key]: value, backgroundId: undefined });
        } else {
            onUpdate({ ...settings, [key]: value });
        }
    };

    const handlePresetChange = (id: string | undefined) => {
        onUpdate({ ...settings, backgroundId: id, backgroundColor: '#ffffff' });
    };

    const handleRatioChange = (w: number, h: number) => {
        onUpdate({
            ...settings,
            customRatioW: Math.max(1, w),
            customRatioH: Math.max(1, h)
        });
    };

    const Label: React.FC<{ children: React.ReactNode }> = ({ children }) => (
        <label className="block text-xs font-black text-bronze-light uppercase tracking-wider mb-2">
            {children}
        </label>
    );

    return (
        <div className="space-y-6 text-bronze-text">

            {/* Layout Mode */}
            <div>
                <Label>{t('collage.layout.title')}</Label>
                <div className="grid grid-cols-3 gap-2">
                    {[
                        { id: LayoutType.GRID, label: t('collage.layout.grid'), icon: Grid2X2 },
                        { id: LayoutType.HORIZONTAL, label: t('collage.layout.cols'), icon: Columns },
                        { id: LayoutType.VERTICAL, label: t('collage.layout.rows'), icon: Rows },
                        { id: LayoutType.FEATURED, label: t('collage.layout.focus'), icon: LayoutTemplate },
                        { id: LayoutType.MASONRY, label: t('collage.layout.masonry'), icon: BrickWall },
                        { id: LayoutType.CENTER, label: t('collage.layout.center'), icon: PanelLeft },
                        { id: LayoutType.SCATTER, label: t('collage.layout.scatter'), icon: Shuffle },
                    ].map(type => (
                        <button
                            key={type.id}
                            onClick={() => handleChange('layout', type.id)}
                            disabled={
                                (type.id === LayoutType.FEATURED && imageCount < 2) ||
                                (type.id === LayoutType.CENTER && imageCount < 3)
                            }
                            className={`flex flex-col items-center justify-center p-2 rounded-xl border text-[10px] font-bold transition-all h-16 ${settings.layout === type.id
                                ? 'bg-primary text-white border-primary shadow-md shadow-primary/20'
                                : 'bg-white border-cream-dark text-bronze-light hover:bg-cream-light hover:text-primary hover:border-primary/30'
                                } ${((type.id === LayoutType.FEATURED && imageCount < 2) || (type.id === LayoutType.CENTER && imageCount < 3)) ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            <type.icon size={20} />
                            <span className="mt-1">{type.label}</span>
                        </button>
                    ))}

                    <button
                        onClick={() => onShuffle?.()}
                        className="flex flex-col items-center justify-center p-2 rounded-xl bg-secondary/5 text-secondary border border-secondary/20 hover:bg-secondary/10 transition-all h-16"
                        title={t('collage.layout.randomize')}
                    >
                        <RefreshCcw size={20} />
                        <span className="mt-1 text-[10px] font-bold">{t('collage.layout.shuffle')}</span>
                    </button>
                </div>
            </div>

            {/* Frame Style */}
            <div>
                <Label>{t('collage.frameStyle.title')}</Label>
                <div className="grid grid-cols-3 gap-2">
                    {[
                        { id: 'normal', label: t('collage.frameStyle.normal'), icon: null },
                        { id: 'film', label: t('collage.frameStyle.film'), icon: Film },
                        { id: 'polaroid', label: t('collage.frameStyle.polaroid'), icon: StickyNote },
                    ].map((style) => (
                        <button
                            key={style.id}
                            onClick={() => handleChange('frameStyle', style.id)}
                            className={`flex flex-col items-center justify-center p-2 rounded-xl text-[10px] font-bold capitalize border transition-all h-14 ${settings.frameStyle === style.id
                                ? 'bg-secondary text-white border-secondary shadow-md'
                                : 'bg-white border-cream-dark text-bronze-light hover:bg-cream-light hover:text-secondary'
                                }`}
                        >
                            {style.icon ? <style.icon size={18} className="mb-1" /> : <div className="w-6 h-6 rounded border-2 border-current mb-0.5" />}
                            {style.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Aspect Ratio */}
            <div>
                <Label>{t('collage.ratio.title')}</Label>
                <div className="flex flex-wrap gap-2 mb-3">
                    {[
                        { r: AspectRatio.SQUARE, icon: Square },
                        { r: AspectRatio.PORTRAIT, icon: RectangleVertical },
                        { r: AspectRatio.LANDSCAPE, icon: RectangleHorizontal },
                        { r: AspectRatio.STORY, icon: Smartphone },
                        { r: AspectRatio.CINEMA, icon: Monitor },
                        { r: AspectRatio.A4, icon: Printer },
                        { r: AspectRatio.PHOTO_2X3, icon: ImageIcon },
                        { r: AspectRatio.PHOTO_5X7, icon: Frame },
                        { r: AspectRatio.CUSTOM, icon: Settings2 },
                    ].map((item) => (
                        <button
                            key={item.r}
                            onClick={() => handleChange('ratio', item.r)}
                            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold border transition-colors ${settings.ratio === item.r
                                ? 'bg-primary text-white border-primary shadow-sm'
                                : 'bg-white border-cream-dark text-bronze-light hover:bg-cream-light hover:text-primary'
                                }`}
                        >
                            <item.icon size={14} />
                            {t(`collage.ratio.${item.r.replace(':', '_')}`, { defaultValue: item.r })}
                        </button>
                    ))}
                </div>

                {/* Custom Ratio Inputs */}
                {settings.ratio === AspectRatio.CUSTOM && (
                    <div className="flex items-center gap-2 p-3 bg-white border border-cream-dark rounded-xl animate-in fade-in slide-in-from-top-1 shadow-sm">
                        <div className="flex-1">
                            <label className="text-[10px] text-bronze-light font-black uppercase block mb-1">{t('collage.ratio.width')}</label>
                            <input
                                type="number"
                                value={settings.customRatioW}
                                onChange={(e) => handleRatioChange(parseFloat(e.target.value) || 1, settings.customRatioH)}
                                className="w-full px-2 py-1 text-sm bg-cream-light border-transparent rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none font-bold text-bronze"
                            />
                        </div>
                        <span className="text-bronze-light/50 mt-4 font-black">:</span>
                        <div className="flex-1">
                            <label className="text-[10px] text-bronze-light font-black uppercase block mb-1">{t('collage.ratio.height')}</label>
                            <input
                                type="number"
                                value={settings.customRatioH}
                                onChange={(e) => handleRatioChange(settings.customRatioW, parseFloat(e.target.value) || 1)}
                                className="w-full px-2 py-1 text-sm bg-cream-light border-transparent rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none font-bold text-bronze"
                            />
                        </div>
                    </div>
                )}
            </div>


            {/* Sliders */}
            <div className="space-y-4 bg-primary/5 p-4 rounded-xl border border-primary/10">
                <div className="flex justify-between items-end">
                    <Label>{t('collage.style.title')}</Label>
                    <button
                        onClick={() => onUpdate({ ...settings, gap: 0, padding: 0, cornerRadius: 0 })}
                        className="text-[10px] uppercase font-bold px-2 py-1 bg-white hover:bg-primary hover:text-white text-bronze-light border border-cream-dark hover:border-primary rounded-lg flex items-center gap-1 transition-all"
                        title={t('collage.style.seamlessHint')}
                    >
                        <Minimize2 size={12} />
                        {t('collage.style.seamless')}
                    </button>
                </div>

                <div className="space-y-2">
                    <div className="flex justify-between text-xs font-bold text-bronze-light">
                        <span>{t('collage.style.gap')}</span>
                        <span>{settings.gap}px</span>
                    </div>
                    <input
                        type="range" min="0" max="50"
                        value={settings.gap}
                        onChange={(e) => handleChange('gap', parseInt(e.target.value))}
                        className="w-full h-1.5 bg-cream-dark rounded-lg appearance-none cursor-pointer accent-primary"
                    />
                </div>

                <div className="space-y-2">
                    <div className="flex justify-between text-xs font-bold text-bronze-light">
                        <span>{t('collage.style.padding')}</span>
                        <span>{settings.padding}px</span>
                    </div>
                    <input
                        type="range" min="0" max="100"
                        value={settings.padding}
                        onChange={(e) => handleChange('padding', parseInt(e.target.value))}
                        className="w-full h-1.5 bg-cream-dark rounded-lg appearance-none cursor-pointer accent-primary"
                    />
                </div>

                <div className="space-y-2">
                    <div className="flex justify-between text-xs font-bold text-bronze-light">
                        <span>{t('collage.style.roundness')}</span>
                        <span>{settings.cornerRadius}px</span>
                    </div>
                    <input
                        type="range" min="0" max="400"
                        value={settings.cornerRadius}
                        onChange={(e) => handleChange('cornerRadius', parseInt(e.target.value))}
                        className="w-full h-1.5 bg-cream-dark rounded-lg appearance-none cursor-pointer accent-primary"
                    />
                </div>
                <div className="space-y-2">
                    <div className="flex justify-between text-xs font-bold text-bronze-light">
                        <span>{t('collage.style.shadow')}</span>
                        <span>{settings.shadow}%</span>
                    </div>
                    <input
                        type="range" min="0" max="100"
                        value={settings.shadow}
                        onChange={(e) => handleChange('shadow', parseInt(e.target.value))}
                        className="w-full h-1.5 bg-cream-dark rounded-lg appearance-none cursor-pointer accent-primary"
                    />
                </div>
            </div>

            {/* Background Color */}
            <div>
                <Label>{t('collage.background.title')}</Label>
                <div className="flex flex-wrap gap-2 mb-4">
                    {/* Transparent Option */}
                    <button
                        onClick={() => handleChange('backgroundColor', 'transparent')}
                        className={`w-8 h-8 rounded-full border-2 relative overflow-hidden transition-transform hover:scale-110 ${settings.backgroundColor === 'transparent' ? 'border-primary ring-2 ring-primary/20' : 'border-gray-200'
                            }`}
                        title={t('collage.background.transparent')}
                    >
                        <div className="absolute inset-0 bg-white"
                            style={{
                                backgroundImage: 'linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)',
                                backgroundSize: '8px 8px',
                                backgroundPosition: '0 0, 0 4px, 4px -4px, -4px 0px'
                            }}
                        />
                    </button>

                    {/* Solid Colors */}
                    {['#ffffff', '#000000', '#f3f4f6', '#fee2e2', '#dbeafe', '#dcfce7', '#fef9c3'].map(color => (
                        <button
                            key={color}
                            onClick={() => handleChange('backgroundColor', color)}
                            className={`w-8 h-8 rounded-full border-2 transition-all ${(!settings.backgroundId && settings.backgroundColor === color) ? 'border-primary ring-2 ring-primary/20 scale-110' : 'border-gray-200'}`}
                            style={{ backgroundColor: color }}
                            title={color}
                        />
                    ))}
                    {/* Color Picker */}
                    <label className="w-8 h-8 rounded-full border-2 border-gray-200 overflow-hidden cursor-pointer relative hover:border-primary transition-colors">
                        <input
                            type="color"
                            value={settings.backgroundColor === 'transparent' ? '#ffffff' : settings.backgroundColor}
                            onChange={(e) => handleChange('backgroundColor', e.target.value)}
                            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                        />
                        <div className={`w-full h-full bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center ${(!settings.backgroundId && !['#ffffff', '#000000', '#f3f4f6', '#fee2e2', '#dbeafe', '#dcfce7', '#fef9c3', 'transparent'].includes(settings.backgroundColor)) ? 'ring-2 ring-primary/20' : ''}`}>
                            <Palette size={14} className="text-white" />
                        </div>
                    </label>
                </div>

                {/* Smart Presets */}
                <div>
                    <h4 className="text-xs font-bold text-bronze-light/70 uppercase mb-2 flex items-center gap-1">
                        <Sparkles size={12} /> {t('collage.background.smart')}
                    </h4>
                    <div className="grid grid-cols-5 gap-2">
                        {BACKGROUND_PRESETS.map(preset => (
                            <button
                                key={preset.id}
                                onClick={() => handlePresetChange(preset.id)}
                                className={`aspect-square rounded-lg border-2 shadow-sm transition-all hover:scale-105 active:scale-95 overflow-hidden ${settings.backgroundId === preset.id ? 'border-primary ring-2 ring-primary/20' : 'border-white'
                                    }`}
                                title={preset.name}
                            >
                                <div className="w-full h-full" style={{ background: preset.css }} />
                            </button>
                        ))}
                    </div>
                </div>
            </div>

        </div>
    );
};

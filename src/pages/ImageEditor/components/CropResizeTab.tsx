import { useState } from 'react';
import { Crop, Expand } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import ImageResizerTab from './ImageResizerTab';
import PrecisionCropTool from './PrecisionCropTool';

type CropResizeMode = 'precision-crop' | 'whole-image';

const CropResizeTab = () => {
    const { t } = useTranslation();
    const [mode, setMode] = useState<CropResizeMode>('precision-crop');

    return (
        <div className="flex min-h-full flex-col bg-white/50">
            <div className="sticky top-0 z-30 border-b border-cream-dark bg-cream/95 px-4 py-3 backdrop-blur-md md:px-6">
                <div className="mx-auto grid w-full max-w-2xl grid-cols-2 gap-1 rounded-2xl border border-cream-dark bg-cream-medium/55 p-1 shadow-inner">
                    <button
                        type="button"
                        onClick={() => setMode('precision-crop')}
                        aria-pressed={mode === 'precision-crop'}
                        className={`flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-black transition-all ${mode === 'precision-crop' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-bronze-light hover:bg-white/70 hover:text-bronze-text'}`}
                    >
                        <Crop size={18} />
                        {t('editor.cropResize.precisionMode', { defaultValue: '精準裁切' })}
                    </button>
                    <button
                        type="button"
                        onClick={() => setMode('whole-image')}
                        aria-pressed={mode === 'whole-image'}
                        className={`flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-black transition-all ${mode === 'whole-image' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-bronze-light hover:bg-white/70 hover:text-bronze-text'}`}
                    >
                        <Expand size={18} />
                        {t('editor.cropResize.resizeMode', { defaultValue: '整張調整尺寸' })}
                    </button>
                </div>
            </div>

            <div className="min-h-0 flex-1">
                {mode === 'precision-crop' ? <PrecisionCropTool /> : <ImageResizerTab />}
            </div>
        </div>
    );
};

export default CropResizeTab;

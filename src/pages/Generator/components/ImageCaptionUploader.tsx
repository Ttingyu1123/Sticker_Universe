
import React, { useCallback, useState } from 'react';
import { Upload, X, Image as ImageIcon, Sparkles, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface ImageCaptionUploaderProps {
    onImageSelect: (file: File) => void;
    currentImage: string | null;
    onClear: () => void;
    isAnalyzing: boolean;
}

export const ImageCaptionUploader: React.FC<ImageCaptionUploaderProps> = ({
    onImageSelect,
    currentImage,
    onClear,
    isAnalyzing
}) => {
    const { t } = useTranslation();
    const [isDragging, setIsDragging] = useState(false);

    const handleDrag = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setIsDragging(true);
        } else if (e.type === "dragleave") {
            setIsDragging(false);
        }
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            const file = e.dataTransfer.files[0];
            if (file.type.startsWith('image/')) {
                onImageSelect(file);
            }
        }
    }, [onImageSelect]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            onImageSelect(e.target.files[0]);
        }
    };

    if (currentImage) {
        return (
            <div className="relative group w-full aspect-square md:aspect-video rounded-3xl overflow-hidden border-4 border-violet-100 shadow-xl bg-slate-100">
                <img
                    src={currentImage}
                    alt="Upload Preview"
                    className="w-full h-full object-contain"
                />

                {isAnalyzing && (
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm flex flex-col items-center justify-center text-white z-10 transition-all">
                        <Loader2 size={48} className="animate-spin mb-4 text-violet-400" />
                        <p className="font-bold text-lg tracking-wide animate-pulse">{t('generator.caption.analyzing')}</p>
                        <p className="text-sm text-slate-300 mt-2">{t('generator.caption.thinking')}</p>
                    </div>
                )}

                {!isAnalyzing && (
                    <button
                        onClick={onClear}
                        className="absolute top-4 right-4 p-2 bg-slate-900/50 hover:bg-slate-900/80 text-white rounded-full transition-all translate-y-[-150%] group-hover:translate-y-0 opacity-0 group-hover:opacity-100"
                    >
                        <X size={20} />
                    </button>
                )}
            </div>
        );
    }

    return (
        <div
            className={`
                relative w-full aspect-square md:aspect-video rounded-3xl border-4 border-dashed transition-all duration-300
                flex flex-col items-center justify-center cursor-pointer group overflow-hidden
                ${isDragging
                    ? 'border-violet-500 bg-violet-50 scale-[1.02]'
                    : 'border-slate-200 bg-slate-50 hover:border-violet-300 hover:bg-white'
                }
            `}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => document.getElementById('caption-image-input')?.click()}
        >
            <div className={`p-6 rounded-2xl bg-white shadow-lg mb-6 transition-transform duration-300 ${isDragging ? 'scale-110 rotate-3' : 'group-hover:scale-105'}`}>
                <div className="w-16 h-16 bg-gradient-to-br from-violet-500 to-fuchsia-500 rounded-xl flex items-center justify-center text-white relative overflow-hidden">
                    <Sparkles size={32} className="relative z-10" />
                    <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
                </div>
            </div>

            <h3 className="text-xl font-bold text-slate-700 mb-2">
                {t('generator.caption.uploadTitle')}
            </h3>
            <p className="text-slate-400 text-sm font-medium text-center px-8">
                {t('generator.caption.uploadDesc')}
            </p>

            <input
                id="caption-image-input"
                type="file"
                className="hidden"
                accept="image/png, image/jpeg, image/webp"
                onChange={handleFileChange}
            />
        </div>
    );
};

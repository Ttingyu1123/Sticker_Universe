import React, { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Printer, Upload, Image as ImageIcon, FolderHeart, Info } from 'lucide-react';
import { Canvas } from './components/Canvas';
import { GalleryPicker } from '../../components/GalleryPicker';

interface StickerImage {
    id: string;
    src: string;
    width: number;
    height: number;
}

const PrintSheet = () => {
    const { t } = useTranslation();
    const [images, setImages] = useState<StickerImage[]>([]);
    const [showGallery, setShowGallery] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files) {
            Array.from(files).forEach(file => {
                const reader = new FileReader();
                reader.onload = (e) => {
                    const src = e.target?.result as string;
                    addImageToCanvas(src);
                };
                reader.readAsDataURL(file);
            });
        }
    };

    const handleGallerySelect = async (blobs: Blob[]) => {
        blobs.forEach(blob => {
            const src = URL.createObjectURL(blob);
            addImageToCanvas(src);
        });
        setShowGallery(false);
    };

    const addImageToCanvas = (src: string) => {
        const img = new Image();
        img.onload = () => {
            // Default size: maintain aspect ratio, max width 150px
            const maxSize = 150;
            let width = img.width;
            let height = img.height;

            if (width > height) {
                if (width > maxSize) {
                    height *= maxSize / width;
                    width = maxSize;
                }
            } else {
                if (height > maxSize) {
                    width *= maxSize / height;
                    height = maxSize;
                }
            }

            setImages(prev => [
                ...prev,
                {
                    id: crypto.randomUUID(),
                    src,
                    width,
                    height
                }
            ]);
        };
        img.src = src;
    };

    return (
        <div className="w-full max-w-7xl mx-auto p-6 space-y-8 animate-in fade-in duration-500">
            {showGallery && <GalleryPicker onSelect={handleGallerySelect} onClose={() => setShowGallery(false)} />}

            <header className="text-center space-y-4 mb-8">
                <h1 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-indigo-600 tracking-tighter filter drop-shadow-sm flex items-center justify-center gap-3">
                    <Printer size={40} className="text-violet-600" />
                    {t('printSheet.title') || 'Print Studio'}
                </h1>
                <p className="text-slate-500 font-bold text-lg max-w-2xl mx-auto">
                    {t('printSheet.description') || 'Arrange your stickers on an A4 sheet and export for printing.'}
                </p>
            </header>

            <div className="flex flex-col lg:flex-row gap-8 items-start">

                {/* Tools Panel */}
                <aside className="w-full lg:w-64 flex flex-col gap-4">
                    <div className="glass-panel bg-white/60 backdrop-blur-xl border border-white/40 shadow-xl rounded-[2rem] p-6 space-y-4">
                        <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest">{t('printSheet.addStickers') || 'Add Stickers'}</h2>

                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="w-full h-14 bg-white border-2 border-dashed border-slate-200 hover:border-violet-400 hover:bg-violet-50 text-slate-500 hover:text-violet-600 rounded-xl flex items-center justify-center gap-2 font-bold transition-all"
                        >
                            <input ref={fileInputRef} type="file" multiple accept="image/*" className="hidden" onChange={handleFileUpload} />
                            <Upload size={20} />
                            {t('printSheet.upload') || 'Upload Images'}
                        </button>

                        <button
                            onClick={() => setShowGallery(true)}
                            className="w-full h-14 bg-gradient-to-r from-violet-500 to-indigo-500 text-white shadow-lg shadow-violet-500/20 hover:shadow-violet-500/40 hover:scale-[1.02] rounded-xl flex items-center justify-center gap-2 font-bold transition-all"
                        >
                            <FolderHeart size={20} />
                            {t('printSheet.fromGallery') || 'From Gallery'}
                        </button>

                        <div className="pt-4 border-t border-slate-100">
                            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1">
                                <Info size={12} /> {t('printSheet.tips') || 'Tips'}
                            </h3>
                            <ul className="text-xs text-slate-500 space-y-2 font-medium">
                                <li>• {t('printSheet.tipDrag') || 'Drag to move stickers'}</li>
                                <li>• {t('printSheet.tipWheel') || 'Scroll wheel to resize'}</li>
                                <li>• {t('printSheet.tipDelete') || 'Click X to remove'}</li>
                            </ul>
                        </div>
                    </div>
                </aside>

                {/* Main Canvas Area */}
                <main className="flex-1 w-full">
                    <Canvas images={images} setImages={setImages} />
                </main>
            </div>
        </div>
    );
};

export default PrintSheet;

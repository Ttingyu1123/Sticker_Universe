import React, { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Upload, FolderHeart, Info } from 'lucide-react';
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



            <div className="flex flex-col lg:flex-row gap-8 items-start">

                {/* Tools Panel */}
                <aside className="w-full lg:w-64 flex flex-col gap-4">
                    <div className="bg-white/40 backdrop-blur-md border border-cream-dark shadow-sm rounded-[2rem] p-6 space-y-4">
                        <h2 className="text-xs font-black text-bronze-light uppercase tracking-widest">{t('printSheet.addStickers') || 'Add Stickers'}</h2>

                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="w-full h-14 bg-white border-2 border-dashed border-cream-dark hover:border-primary/50 hover:bg-cream-light text-bronze-light hover:text-primary rounded-xl flex items-center justify-center gap-2 font-bold transition-all"
                        >
                            <input ref={fileInputRef} type="file" multiple accept="image/*" className="hidden" onChange={handleFileUpload} />
                            <Upload size={20} />
                            {t('printSheet.upload') || 'Upload Images'}
                        </button>

                        <button
                            onClick={() => setShowGallery(true)}
                            className="w-full h-14 bg-primary text-white shadow-lg shadow-primary/20 hover:shadow-primary/40 hover:scale-[1.02] rounded-xl flex items-center justify-center gap-2 font-bold transition-all"
                        >
                            <FolderHeart size={20} />
                            {t('printSheet.fromGallery') || 'From Gallery'}
                        </button>

                        <div className="pt-4 border-t border-cream-dark/50">
                            <h3 className="text-xs font-black text-bronze-light uppercase tracking-widest mb-2 flex items-center gap-1">
                                <Info size={12} /> {t('printSheet.tips') || 'Tips'}
                            </h3>
                            <ul className="text-xs text-bronze-text space-y-2 font-medium">
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

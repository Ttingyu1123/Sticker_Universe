import React, { useEffect, useState } from 'react';
import { getAllStickersFromDB } from '../db';
import { Sticker } from '../pages/Generator/types';
import { X, Image as ImageIcon, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface GalleryPickerProps {
    onSelect: (blob: Blob) => void;
    onClose: () => void;
}

export const GalleryPicker: React.FC<GalleryPickerProps> = ({ onSelect, onClose }) => {
    const { t } = useTranslation();
    const [stickers, setStickers] = useState<Sticker[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadStickers = async () => {
            try {
                const data = await getAllStickersFromDB();
                // Sort by timestamp desc (newest first)
                setStickers(data.sort((a, b) => b.timestamp - a.timestamp));
            } catch (error) {
                console.error("Failed to load stickers:", error);
            } finally {
                setLoading(false);
            }
        };
        loadStickers();
    }, []);

    const handleSelect = async (sticker: Sticker) => {
        try {
            const response = await fetch(sticker.imageUrl);
            const blob = await response.blob();
            onSelect(blob);
            onClose();
        } catch (e) {
            console.error("Failed to convert sticker to blob:", e);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl w-full max-w-4xl h-[80vh] flex flex-col shadow-2xl overflow-hidden scale-100 animate-in zoom-in-95 duration-200">

                {/* Header */}
                <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-violet-100 text-violet-600 rounded-xl">
                            <ImageIcon size={20} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-800 tracking-tight">{t('gallery.title') || 'My Collection'}</h2>
                            <p className="text-xs font-medium text-slate-400 uppercase tracking-widest">{t('gallery.subtitle') || 'Select an image'}</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 bg-slate-50 scrollbar-thin">
                    {loading ? (
                        <div className="h-full flex items-center justify-center text-slate-400 gap-3">
                            <Loader2 size={32} className="animate-spin text-violet-500" />
                            <span className="font-bold">{t('common.loading') || 'Loading...'}</span>
                        </div>
                    ) : stickers.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-4 opacity-50">
                            <ImageIcon size={64} strokeWidth={1} />
                            <p className="font-bold">{t('gallery.empty') || 'No images found in your collection'}</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                            {stickers.map((sticker) => (
                                <div
                                    key={sticker.id}
                                    onClick={() => handleSelect(sticker)}
                                    className="group relative aspect-square bg-white rounded-2xl shadow-sm border border-slate-200 cursor-pointer overflow-hidden hover:shadow-lg hover:border-violet-500 transition-all active:scale-95"
                                >
                                    <img
                                        src={sticker.imageUrl}
                                        alt={sticker.phrase}
                                        className="w-full h-full object-contain p-2 group-hover:scale-110 transition-transform duration-500"
                                    />
                                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <p className="text-white text-[10px] font-bold truncate">{sticker.phrase}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-slate-100 bg-white text-right text-xs text-slate-400 font-bold uppercase tracking-wider shrink-0">
                    {stickers.length} {t('gallery.items') || 'Items'}
                </div>
            </div>
        </div>
    );
};

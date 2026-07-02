import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { getAllStickersFromDB } from '../db';
import { Sticker } from '../pages/Generator/types';
import { X, Image as ImageIcon, Loader2, CheckCircle2, Circle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useToast } from './shared/ToastProvider';

interface GalleryPickerProps {
    onSelect: (blobs: Blob[]) => void;
    onClose: () => void;
}

export const GalleryPicker: React.FC<GalleryPickerProps> = ({ onSelect, onClose }) => {
    const { t } = useTranslation();
    const { showToast } = useToast();
    const [stickers, setStickers] = useState<Sticker[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [processing, setProcessing] = useState(false);

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

    const toggleSelection = (id: string) => {
        setSelectedIds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(id)) {
                newSet.delete(id);
            } else {
                newSet.add(id);
            }
            return newSet;
        });
    };

    const handleConfirm = async () => {
        if (selectedIds.size === 0) return;
        setProcessing(true);
        console.log('[GalleryPicker] handleConfirm called, selected count:', selectedIds.size);
        try {
            const selectedStickers = stickers.filter(s => selectedIds.has(s.id));
            console.log('[GalleryPicker] Selected stickers:', selectedStickers.length);

            // Convert data URLs to Blobs directly (avoid fetch CSP issues)
            const blobs = selectedStickers.map((s) => {
                const dataUrl = s.imageUrl;

                // Extract base64 data and mime type
                const [header, base64Data] = dataUrl.split(',');
                const mimeMatch = header.match(/:(.*?);/);
                const mimeType = mimeMatch ? mimeMatch[1] : 'image/png';

                // Convert base64 to binary
                const byteString = atob(base64Data);
                const arrayBuffer = new ArrayBuffer(byteString.length);
                const uint8Array = new Uint8Array(arrayBuffer);

                for (let i = 0; i < byteString.length; i++) {
                    uint8Array[i] = byteString.charCodeAt(i);
                }

                return new Blob([arrayBuffer], { type: mimeType });
            });

            console.log('[GalleryPicker] Blobs created:', blobs.length, blobs);
            console.log('[GalleryPicker] Calling onSelect with blobs');
            onSelect(blobs);
            console.log('[GalleryPicker] onSelect called successfully');
            onClose();
        } catch (e) {
            console.error("[GalleryPicker] Failed to process selection:", e);
            showToast(t('gallery.toast.importFailed', { error: (e as Error).message }), 'error');
        } finally {
            setProcessing(false);
        }
    };

    const content = (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-4xl h-[92dvh] sm:h-[85vh] sm:max-h-[920px] flex flex-col shadow-2xl overflow-hidden scale-100 animate-in zoom-in-95 duration-200">

                {/* Header */}
                <div className="p-4 sm:p-6 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-violet-100 text-violet-600 rounded-xl">
                            <ImageIcon size={20} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-800 tracking-tight">{t('gallery.title') || 'My Collection'}</h2>
                            <p className="text-xs font-medium text-slate-400 uppercase tracking-widest">{t('gallery.selectionMode') || 'Select Multiple'}</p>
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
                <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50 scrollbar-thin">
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
                            {stickers.map((sticker) => {
                                const isSelected = selectedIds.has(sticker.id);
                                return (
                                    <div
                                        key={sticker.id}
                                        onClick={() => toggleSelection(sticker.id)}
                                        className={`group relative aspect-square bg-white rounded-2xl shadow-sm border cursor-pointer overflow-hidden transition-all active:scale-95 ${isSelected ? 'border-violet-600 ring-2 ring-violet-200' : 'border-slate-200 hover:border-violet-400'}`}
                                    >
                                        <img
                                            src={sticker.imageUrl}
                                            alt={sticker.phrase}
                                            className="w-full h-full object-contain p-2"
                                        />

                                        {/* Selection Indicator */}
                                        <div className={`absolute top-2 right-2 transition-all duration-200 ${isSelected ? 'opacity-100 scale-100' : 'opacity-0 scale-75 group-hover:opacity-100'}`}>
                                            {isSelected ? (
                                                <div className="bg-violet-600 text-white rounded-full p-1 shadow-md">
                                                    <CheckCircle2 size={16} />
                                                </div>
                                            ) : (
                                                <div className="bg-white/80 text-slate-400 rounded-full p-1 shadow-sm backdrop-blur">
                                                    <Circle size={16} />
                                                </div>
                                            )}
                                        </div>

                                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <p className="text-white text-[10px] font-bold truncate">{sticker.phrase}</p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="sticky bottom-0 z-10 p-4 border-t border-slate-100 bg-white flex items-center justify-between shrink-0 pb-[calc(env(safe-area-inset-bottom)+1rem)] shadow-[0_-8px_16px_rgba(0,0,0,0.04)]">
                    <div className="text-xs text-slate-400 font-bold uppercase tracking-wider">
                        {selectedIds.size} {t('gallery.selected') || 'Selected'}
                    </div>
                    <button
                        onClick={handleConfirm}
                        disabled={selectedIds.size === 0 || processing}
                        className="px-6 py-2 bg-violet-600 text-white rounded-xl font-bold hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
                    >
                        {processing && <Loader2 size={16} className="animate-spin" />}
                        {t('gallery.addSelected') || 'Add Selected'} ({selectedIds.size})
                    </button>
                </div>
            </div>
        </div>
    );

    if (typeof document === 'undefined') {
        return content;
    }

    return createPortal(content, document.body);
};

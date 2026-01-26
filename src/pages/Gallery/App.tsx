import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Trash2, Download, Image as ImageIcon, Search, FolderOpen, FileArchive, Palette, Eraser, Layers, MoreHorizontal } from 'lucide-react';
import { getAllStickersFromDB, deleteStickerFromDB, clearAllStickersFromDB } from '../../db';
import { Sticker } from '../Generator/types';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

interface StickerCardProps {
    sticker: Sticker;
    onDelete: (id: string) => void;
    onDownload: (url: string, filename: string) => void;
}

const StickerCard: React.FC<StickerCardProps> = ({ sticker, onDelete, onDownload }) => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [showOverlay, setShowOverlay] = useState(false);

    // Toggle overlay on click for mobile devices
    const handleCardClick = () => {
        setShowOverlay(prev => !prev);
    };

    return (
        <div
            className="group relative bg-white rounded-2xl p-2 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-slate-100 cursor-pointer"
            onClick={handleCardClick}
            onMouseLeave={() => setShowOverlay(false)}
        >
            <div className="aspect-square bg-slate-50 rounded-xl overflow-hidden relative" style={{ backgroundImage: 'radial-gradient(#cbd5e1 1px, transparent 1px)', backgroundSize: '8px 8px' }}>
                <img src={sticker.imageUrl} alt={sticker.phrase} className="w-full h-full object-contain p-4" loading="lazy" />

                {/* Mobile/Visual Hint for Actions */}
                <div className={`absolute top-2 right-2 p-1.5 bg-black/5 rounded-full text-slate-400 transition-opacity ${showOverlay ? 'opacity-0' : 'opacity-100 group-hover:opacity-0'}`}>
                    <MoreHorizontal size={16} />
                </div>

                {/* Overlay Actions */}
                <div className={`absolute inset-0 bg-slate-900/60 backdrop-blur-[2px] transition-all duration-300 flex flex-col items-center justify-center gap-3 p-4 z-10 ${showOverlay ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto'}`}>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={(e) => { e.stopPropagation(); navigate('/editor', { state: { image: sticker.imageUrl } }); }}
                            className="px-3 py-1.5 bg-white/10 hover:bg-white text-white hover:text-slate-900 rounded-lg text-[10px] font-bold backdrop-blur-md transition-all border border-white/20 flex items-center gap-1.5 w-full justify-center"
                        >
                            <Palette size={12} /> {t('app.editor')}
                        </button>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={(e) => { e.stopPropagation(); navigate('/eraser', { state: { image: sticker.imageUrl } }); }}
                            className="px-3 py-1.5 bg-white/10 hover:bg-white text-white hover:text-slate-900 rounded-lg text-[10px] font-bold backdrop-blur-md transition-all border border-white/20 flex items-center gap-1.5"
                        >
                            <Eraser size={12} /> {t('app.eraser')}
                        </button>
                        <button
                            onClick={(e) => { e.stopPropagation(); navigate('/packager', { state: { image: sticker.imageUrl } }); }}
                            className="px-3 py-1.5 bg-white/10 hover:bg-white text-white hover:text-slate-900 rounded-lg text-[10px] font-bold backdrop-blur-md transition-all border border-white/20 flex items-center gap-1.5"
                        >
                            <Layers size={12} /> {t('app.packager')}
                        </button>
                    </div>

                    <div className="w-full h-px bg-white/20 my-1"></div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={(e) => { e.stopPropagation(); onDownload(sticker.imageUrl, sticker.phrase); }}
                            className="p-2 bg-white/10 hover:bg-white rounded-full text-white hover:text-violet-600 transition-all border border-white/20"
                            title={t('gallery.download')}
                        >
                            <Download size={14} />
                        </button>
                        <button
                            onClick={(e) => { e.stopPropagation(); onDelete(sticker.id); }}
                            className="p-2 bg-white/10 hover:bg-red-500 rounded-full text-white hover:text-white transition-all border border-white/20"
                            title={t('gallery.delete')}
                        >
                            <Trash2 size={14} />
                        </button>
                    </div>
                </div>
            </div>
            <div className="mt-3 px-2 pb-2">
                <p className="font-bold text-xs text-slate-700 truncate" title={sticker.phrase}>
                    {sticker.phrase}
                </p>
                <p className="text-[10px] text-slate-400 font-medium mt-0.5">
                    {new Date(sticker.timestamp).toLocaleDateString()}
                </p>
            </div>
        </div>
    );
};

const App = () => {
    const { t } = useTranslation();
    const [stickers, setStickers] = useState<Sticker[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        loadStickers();
    }, []);

    const loadStickers = async () => {
        try {
            const data = await getAllStickersFromDB();
            // Sort by newest first
            setStickers(data.sort((a, b) => b.timestamp - a.timestamp));
        } catch (error) {
            console.error("Failed to load gallery:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm(t('gallery.deleteConfirm'))) return;
        await deleteStickerFromDB(id);
        setStickers(prev => prev.filter(s => s.id !== id));
    };

    const handleClearAll = async () => {
        if (!window.confirm(t('gallery.clearConfirm'))) return;
        await clearAllStickersFromDB();
        setStickers([]);
    };

    const handleDownload = (imageUrl: string, filename: string) => {
        const link = document.createElement('a');
        link.href = imageUrl;
        link.download = `${filename.replace(/\s/g, '_')}_sticker.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleDownloadZip = async () => {
        const zip = new JSZip();
        const folder = zip.folder("stickers");

        // Filter stickers if search term exists
        const stickersToZip = filteredStickers;

        if (stickersToZip.length === 0) return;

        for (const sticker of stickersToZip) {
            const response = await fetch(sticker.imageUrl);
            const blob = await response.blob();
            folder?.file(`${sticker.phrase.replace(/\s/g, '_')}_${sticker.id}.png`, blob);
        }

        const content = await zip.generateAsync({ type: "blob" });
        saveAs(content, "my_stickers.zip");
    };

    const filteredStickers = stickers.filter(s =>
        s.phrase.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const navigate = useNavigate();

    return (
        <div className="min-h-screen p-6 md:p-12 bg-slate-50/50">
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3">
                            <FolderOpen className="text-violet-500" size={32} />
                            {t('gallery.title')}
                        </h1>
                        <p className="text-slate-400 font-medium mt-1 uppercase tracking-widest text-xs">
                            {t('gallery.subtitle')} ({stickers.length})
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="relative group">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-violet-500 transition-colors" size={16} />
                            <input
                                type="text"
                                placeholder="Search..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-600 focus:outline-none focus:ring-2 focus:ring-violet-500/10 focus:border-violet-500 transition-all w-full md:w-64"
                            />
                        </div>
                        {stickers.length > 0 && (
                            <>
                                <button
                                    onClick={handleDownloadZip}
                                    className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-500 hover:text-violet-600 hover:border-violet-200 transition-all shadow-sm"
                                    title={t('gallery.downloadZip')}
                                >
                                    <FileArchive size={20} />
                                </button>
                                <button
                                    onClick={handleClearAll}
                                    className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-500 hover:text-red-600 hover:border-red-200 transition-all shadow-sm"
                                    title={t('gallery.clearAll')}
                                >
                                    <Trash2 size={20} />
                                </button>
                            </>
                        )}
                    </div>
                </div>

                {/* Grid */}
                {isLoading ? (
                    <div className="text-center py-20 text-slate-400 animate-pulse font-bold">{t('gallery.loading')}</div>
                ) : filteredStickers.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-slate-300 border-2 border-dashed border-slate-200 rounded-3xl">
                        <ImageIcon size={64} className="mb-4 opacity-50" />
                        <p className="text-lg font-bold text-slate-400">{t('gallery.empty')}</p>
                        <p className="text-sm font-medium mt-2 text-slate-400/80">{t('gallery.emptyDesc')}</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                        {filteredStickers.map((sticker) => (
                            <StickerCard
                                key={sticker.id}
                                sticker={sticker}
                                onDelete={handleDelete}
                                onDownload={handleDownload}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default App;

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Trash2, Download, Image as ImageIcon, Search, FolderOpen, FileArchive, Palette, Eraser, Layers, MoreHorizontal, CheckCircle2, Circle } from 'lucide-react';
import { getAllStickersFromDB, deleteStickerFromDB, clearAllStickersFromDB } from '../../db';
import { Sticker } from '../Generator/types';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

interface StickerCardProps {
    sticker: Sticker;
    onDelete: (id: string) => void;
    onDownload: (url: string, filename: string) => void;
    isSelectionMode: boolean;
    isSelected: boolean;
    onToggleSelect: (id: string) => void;
}

const StickerCard: React.FC<StickerCardProps> = ({ sticker, onDelete, onDownload, isSelectionMode, isSelected, onToggleSelect }) => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [showOverlay, setShowOverlay] = useState(false);

    // Toggle overlay on click for mobile devices (only if NOT in selection mode)
    const handleCardClick = () => {
        if (isSelectionMode) {
            onToggleSelect(sticker.id);
        } else {
            setShowOverlay(prev => !prev);
        }
    };

    return (
        <div
            className={`group relative bg-white rounded-2xl p-2 shadow-sm transition-all duration-300 border cursor-pointer ${isSelected ? 'border-violet-500 ring-2 ring-violet-500/20 shadow-md transform scale-[1.02]' : 'border-slate-100 hover:shadow-xl hover:-translate-y-1'}`}
            onClick={handleCardClick}
            onMouseLeave={() => setShowOverlay(false)}
        >
            <div className="aspect-square bg-slate-50 rounded-xl overflow-hidden relative" style={{ backgroundImage: 'radial-gradient(#cbd5e1 1px, transparent 1px)', backgroundSize: '8px 8px' }}>
                <img src={sticker.imageUrl} alt={sticker.phrase} className="w-full h-full object-contain p-4" loading="lazy" />

                {/* Selection Indicator (Visible in Selection Mode) */}
                {isSelectionMode && (
                    <div className="absolute top-2 right-2 transition-all duration-200 z-20">
                        {isSelected ? (
                            <div className="bg-violet-500 rounded-full p-1 shadow-lg text-white">
                                <CheckCircle2 size={20} fill="currentColor" className="text-white" />
                            </div>
                        ) : (
                            <div className="bg-white/80 backdrop-blur-sm rounded-full p-1 shadow-sm text-slate-300 hover:text-slate-400">
                                <Circle size={20} />
                            </div>
                        )}
                    </div>
                )}

                {/* Mobile/Visual Hint for Actions (Only if NOT in selection mode) */}
                {!isSelectionMode && (
                    <div className={`absolute top-2 right-2 p-1.5 bg-black/5 rounded-full text-slate-400 transition-opacity ${showOverlay ? 'opacity-0' : 'opacity-100 group-hover:opacity-0'}`}>
                        <MoreHorizontal size={16} />
                    </div>
                )}

                {/* Overlay Actions (Only if NOT in selection mode) */}
                {!isSelectionMode && (
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
                )}
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
    const [isSelectionMode, setIsSelectionMode] = useState(false);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

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

    const handleDownloadZip = async (subset: Sticker[] = filteredStickers) => {
        const zip = new JSZip();
        const folder = zip.folder("stickers");

        if (subset.length === 0) return;

        for (const sticker of subset) {
            const response = await fetch(sticker.imageUrl);
            const blob = await response.blob();
            folder?.file(`${sticker.phrase.replace(/\s/g, '_')}_${sticker.id}.png`, blob);
        }

        const content = await zip.generateAsync({ type: "blob" });
        saveAs(content, "my_stickers.zip");
    };

    const toggleSelectionMode = () => {
        setIsSelectionMode(!isSelectionMode);
        setSelectedIds(new Set());
    };

    const toggleSelect = (id: string) => {
        const newSelected = new Set(selectedIds);
        if (newSelected.has(id)) {
            newSelected.delete(id);
        } else {
            newSelected.add(id);
        }
        setSelectedIds(newSelected);
    };

    const selectAll = () => {
        if (selectedIds.size === filteredStickers.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(filteredStickers.map(s => s.id)));
        }
    };

    const handleBatchDelete = async () => {
        if (!window.confirm(t('gallery.deleteConfirm'))) return;

        for (const id of Array.from(selectedIds)) {
            await deleteStickerFromDB(id);
        }

        setStickers(prev => prev.filter(s => !selectedIds.has(s.id)));
        setSelectedIds(new Set());
        setIsSelectionMode(false);
    };

    const handleBatchDownload = () => {
        const selectedStickers = stickers.filter(s => selectedIds.has(s.id));
        handleDownloadZip(selectedStickers);
        setSelectedIds(new Set());
        setIsSelectionMode(false);
    };

    const filteredStickers = stickers.filter(s =>
        s.phrase.toLowerCase().includes(searchTerm.toLowerCase())
    );



    return (
        <div className="min-h-screen pt-32 px-6 md:px-12 bg-slate-50/50 pb-32">
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Content Grid */}
            </div>

            {/* Floating Header */}
            <nav className="fixed top-4 left-4 right-4 z-50">
                <div className="max-w-7xl mx-auto rounded-2xl px-6 py-3 flex flex-col md:flex-row items-center justify-between gap-4 bg-white/70 backdrop-blur-xl shadow-lg border border-white/50">
                    <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-start">
                        <div className="flex items-center gap-3">
                            <div className="bg-gradient-to-br from-violet-500 to-pink-500 p-2 rounded-xl text-white shadow-lg shadow-violet-500/20">
                                <FolderOpen size={18} strokeWidth={2.5} />
                            </div>
                            <div>
                                <h1 className="text-lg font-bold tracking-tight text-slate-800 leading-none">
                                    StickerOS <span className="text-[10px] text-violet-500 bg-violet-50 px-1.5 py-0.5 rounded-md ml-1 align-top">{t('gallery.title')}</span>
                                </h1>
                                <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest mt-0.5">{t('gallery.subtitle')}</p>
                            </div>
                        </div>

                        {/* Mobile Toggle for Search/Actions could go here if needed, but for now stacking or hiding */}
                    </div>

                    <div className="flex items-center gap-2 w-full md:w-auto justify-center md:justify-end">
                        {!isSelectionMode ? (
                            <>
                                <div className="relative group w-full md:w-auto">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-violet-500 transition-colors" size={14} />
                                    <input
                                        type="text"
                                        placeholder="Search..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 focus:outline-none focus:ring-2 focus:ring-violet-500/10 focus:border-violet-500 transition-all w-full md:w-48"
                                    />
                                </div>
                                {stickers.length > 0 && (
                                    <>
                                        <button
                                            onClick={toggleSelectionMode}
                                            className="p-2 bg-white border border-slate-200 rounded-xl text-slate-500 hover:text-violet-600 hover:border-violet-200 transition-all shadow-sm"
                                            title={t('gallery.selectionMode')}
                                        >
                                            <CheckCircle2 size={16} />
                                        </button>
                                        <button
                                            onClick={() => handleDownloadZip(filteredStickers)}
                                            className="p-2 bg-white border border-slate-200 rounded-xl text-slate-500 hover:text-violet-600 hover:border-violet-200 transition-all shadow-sm"
                                            title={t('gallery.downloadZip')}
                                        >
                                            <FileArchive size={16} />
                                        </button>
                                        <button
                                            onClick={handleClearAll}
                                            className="p-2 bg-white border border-slate-200 rounded-xl text-slate-500 hover:text-red-600 hover:border-red-200 transition-all shadow-sm"
                                            title={t('gallery.clearAll')}
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </>
                                )}
                            </>
                        ) : (
                            <>
                                <button
                                    onClick={selectAll}
                                    className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-600 font-bold text-xs hover:bg-slate-50 transition-all shadow-sm"
                                >
                                    {selectedIds.size === filteredStickers.length ? t('gallery.deselectAll') : t('gallery.selectAll')}
                                </button>
                                <button
                                    onClick={toggleSelectionMode}
                                    className="px-3 py-2 bg-slate-800 text-white rounded-xl font-bold text-xs hover:bg-slate-700 transition-all shadow-lg"
                                >
                                    {t('gallery.cancelSelection')}
                                </button>
                            </>
                        )}
                        <a href="https://tingyusdeco.com/" className="text-xs font-bold text-slate-400 hover:text-violet-600 flex items-center gap-1.5 transition-colors px-3 py-1.5 hover:bg-slate-50 rounded-lg ml-2">
                            <span className="hidden sm:inline">{t('app.backHome')}</span>
                        </a>
                    </div>
                </div>
            </nav>

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
                            isSelectionMode={isSelectionMode}
                            isSelected={selectedIds.has(sticker.id)}
                            onToggleSelect={toggleSelect}
                        />
                    ))}
                </div>
            )}


            {/* Batch Action Bar */}
            {
                isSelectionMode && selectedIds.size > 0 && (
                    <div className="fixed bottom-6 inset-x-0 flex justify-center z-50 animate-in slide-in-from-bottom-10 fade-in">
                        <div className="bg-slate-900/90 backdrop-blur-md text-white px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-4">
                            <span className="text-xs font-bold bg-white/20 px-2 py-1 rounded-md">{selectedIds.size}</span>
                            <div className="h-6 w-px bg-white/20"></div>
                            <button
                                onClick={handleBatchDownload}
                                className="flex items-center gap-2 text-sm font-bold hover:text-violet-300 transition-colors"
                            >
                                <Download size={18} />
                                {t('gallery.downloadSelected', { count: selectedIds.size })}
                            </button>
                            <div className="h-6 w-px bg-white/20"></div>
                            <button
                                onClick={handleBatchDelete}
                                className="flex items-center gap-2 text-sm font-bold hover:text-red-300 transition-colors"
                            >
                                <Trash2 size={18} />
                                {t('gallery.deleteSelected', { count: selectedIds.size })}
                            </button>
                        </div>
                    </div>
                )
            }
        </div >
    );
};

export default App;

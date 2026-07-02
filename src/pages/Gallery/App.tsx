import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Trash2, Download, Image as ImageIcon, Search, FileArchive, Palette, Layers, MoreHorizontal, CheckCircle2, Circle, Upload, FileText, X, Maximize2, Share2, Copy } from 'lucide-react';
import { getAllStickersFromDB, deleteStickerFromDB, clearAllStickersFromDB, saveStickerToDB } from '../../db';
import type { Sticker } from '../../shared/types/sticker';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import ReactMarkdown from 'react-markdown';
import { useToast } from '../../components/shared/ToastProvider';

interface StickerCardProps {
    sticker: Sticker;
    onDelete: (id: string) => void;
    onDownload: (url: string, filename: string) => void;
    isSelectionMode: boolean;
    isSelected: boolean;
    onToggleSelect: (id: string) => void;
    onViewDetails: (sticker: Sticker) => void;
    onPreview: (sticker: Sticker) => void;
    onShare: (sticker: Sticker) => void;
    onCopyPrompt: (sticker: Sticker) => void;
    onDownloadPrompt: (sticker: Sticker) => void;
}

const StickerCard: React.FC<StickerCardProps> = ({ sticker, onDelete, onDownload, isSelectionMode, isSelected, onToggleSelect, onViewDetails, onPreview, onShare, onCopyPrompt, onDownloadPrompt }) => {
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
            className={`group relative bg-white rounded-2xl p-2 shadow-sm transition-all duration-300 border cursor-pointer ${isSelected ? 'border-primary ring-2 ring-primary/20 shadow-md transform scale-[1.02]' : 'border-cream-dark hover:shadow-xl hover:-translate-y-1'}`}
            onClick={handleCardClick}
            onMouseLeave={() => setShowOverlay(false)}
        >
            <div className="aspect-square bg-cream-light/50 rounded-xl overflow-hidden relative" style={{ backgroundImage: 'radial-gradient(#d6ccc2 1px, transparent 1px)', backgroundSize: '8px 8px' }}>
                <img src={sticker.imageUrl} alt={sticker.phrase} className="w-full h-full object-contain p-4" loading="lazy" />

                {/* Selection Indicator (Visible in Selection Mode) */}
                {isSelectionMode && (
                    <div className="absolute top-2 right-2 transition-all duration-200 z-20">
                        {isSelected ? (
                            <div className="bg-primary rounded-full p-1 shadow-lg text-white">
                                <CheckCircle2 size={20} fill="currentColor" className="text-white" />
                            </div>
                        ) : (
                            <div className="bg-white/80 backdrop-blur-sm rounded-full p-1 shadow-sm text-bronze-light hover:text-bronze-text transition-colors">
                                <Circle size={20} />
                            </div>
                        )}
                    </div>
                )}

                {/* Mobile/Visual Hint for Actions (Only if NOT in selection mode) */}
                {!isSelectionMode && (
                    <div className={`absolute top-2 right-2 p-1.5 bg-black/5 rounded-full text-bronze-light transition-opacity ${showOverlay ? 'opacity-0' : 'opacity-100 group-hover:opacity-0'}`}>
                        <MoreHorizontal size={16} />
                    </div>
                )}

                {/* Overlay Actions (Only if NOT in selection mode) */}
                {!isSelectionMode && (
                    <div className={`absolute inset-0 bg-bronze-text/80 backdrop-blur-[2px] transition-all duration-300 flex flex-col items-center justify-center gap-3 p-4 z-10 ${showOverlay ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto'}`}>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={(e) => { e.stopPropagation(); navigate('/image-editor', { state: { image: sticker.imageUrl, tab: 'smart-remove' } }); }}
                                className="px-3 py-1.5 bg-white/10 hover:bg-white text-white hover:text-bronze-text rounded-lg text-[10px] font-bold backdrop-blur-md transition-all border border-white/20 flex items-center gap-1.5 w-full justify-center"
                            >
                                <Palette size={12} /> {t('editor.tabs.smartRemove')}
                            </button>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={(e) => { e.stopPropagation(); navigate('/image-editor', { state: { image: sticker.imageUrl, tab: 'packager' } }); }}
                                className="px-3 py-1.5 bg-white/10 hover:bg-white text-white hover:text-bronze-text rounded-lg text-[10px] font-bold backdrop-blur-md transition-all border border-white/20 flex items-center gap-1.5"
                            >
                                <Layers size={12} /> {t('editor.tabs.packager')}
                            </button>
                        </div>

                        <div className="w-full h-px bg-white/20 my-1"></div>

                        {/* Row 1: Primary Actions (Preview, Download, Share) */}
                        <div className="flex items-center justify-center gap-3">
                            <button
                                onClick={(e) => { e.stopPropagation(); onPreview(sticker); }}
                                className="p-2 bg-white/10 hover:bg-white rounded-full text-white hover:text-primary transition-all border border-white/20"
                                title="Zoom Preview"
                            >
                                <Maximize2 size={16} />
                            </button>
                            <button
                                onClick={(e) => { e.stopPropagation(); onDownload(sticker.imageUrl, sticker.phrase); }}
                                className="p-2 bg-white/10 hover:bg-white rounded-full text-white hover:text-secondary transition-all border border-white/20"
                                title={t('gallery.download')}
                            >
                                <Download size={16} />
                            </button>
                            <button
                                onClick={(e) => { e.stopPropagation(); onShare(sticker); }}
                                className="p-2 bg-white/10 hover:bg-white rounded-full text-white hover:text-pink-500 transition-all border border-white/20"
                                title={t('gallery.share') || "Share"}
                            >
                                <Share2 size={16} />
                            </button>
                        </div>

                        {/* Row 2: Secondary/Prompt Actions */}
                        <div className="flex items-center justify-center gap-2 mt-1">
                            <button
                                onClick={(e) => { e.stopPropagation(); onDownloadPrompt(sticker); }}
                                className="p-1.5 bg-white/10 hover:bg-white rounded-full text-white hover:text-bronze-text transition-all border border-white/20"
                                title={t('generator.action.downloadPrompt') || "Download Prompt"}
                            >
                                <FileText size={14} />
                            </button>
                            <button
                                onClick={(e) => { e.stopPropagation(); onCopyPrompt(sticker); }}
                                className="p-1.5 bg-white/10 hover:bg-white rounded-full text-white hover:text-bronze-text transition-all border border-white/20"
                                title={t('generator.action.copyPrompt') || "Copy Prompt"}
                            >
                                <Copy size={14} />
                            </button>
                            {sticker.description && (
                                <button
                                    onClick={(e) => { e.stopPropagation(); onViewDetails(sticker); }}
                                    className="p-1.5 bg-white/10 hover:bg-white rounded-full text-white hover:text-primary transition-all border border-white/20"
                                    title="View Details"
                                >
                                    <FileText size={14} />
                                </button>
                            )}
                            <div className="w-px h-4 bg-white/20 mx-1"></div>
                            <button
                                onClick={(e) => { e.stopPropagation(); onDelete(sticker.id); }}
                                className="p-1.5 bg-white/10 hover:bg-red-500 rounded-full text-white hover:text-white transition-all border border-white/20"
                                title={t('gallery.delete')}
                            >
                                <Trash2 size={14} />
                            </button>
                        </div>
                    </div>
                )}
            </div>
            <div className="mt-3 px-2 pb-2 flex items-start justify-between gap-2">
                <div className="min-w-0">
                    <p className="font-bold text-xs text-bronze-text truncate" title={sticker.phrase}>
                        {sticker.phrase}
                    </p>
                    <p className="text-[10px] text-bronze-light font-medium mt-0.5">
                        {new Date(sticker.timestamp).toLocaleDateString()}
                    </p>
                </div>
                {sticker.description && (
                    <button
                        onClick={(e) => { e.stopPropagation(); onViewDetails(sticker); }}
                        className="p-1.5 bg-cream-light hover:bg-white text-bronze-light hover:text-primary rounded-lg transition-colors shrink-0"
                        title="View Details"
                    >
                        <FileText size={14} />
                    </button>
                )}
            </div>
        </div>
    );
};

const App = () => {
    const { t } = useTranslation();
    const { showToast } = useToast();
    const [stickers, setStickers] = useState<Sticker[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isSelectionMode, setIsSelectionMode] = useState(false);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [viewingSticker, setViewingSticker] = useState<Sticker | null>(null);
    const [previewSticker, setPreviewSticker] = useState<Sticker | null>(null);
    const fileInputRef = React.useRef<HTMLInputElement>(null);

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
        // Safe filename: truncate to 50 chars, remove special chars
        const safeFilename = filename.slice(0, 50).replace(/[^\w\s\u4e00-\u9fa5]/gi, '_');

        if (imageUrl.startsWith('data:')) {
            try {
                const blob = base64ToBlob(imageUrl);
                saveAs(blob, `${safeFilename}_sticker.png`);
            } catch (e) {
                console.error("Failed to convert data URL to Blob:", e);
                // Fallback to direct save
                saveAs(imageUrl, `${safeFilename}_sticker.png`);
            }
        } else {
            // Use FileSaver.js for better cross-browser compatibility
            saveAs(imageUrl, `${safeFilename}_sticker.png`);
        }
    };

    // Helper to convert Base64 Data URL to Blob for reliable sharing
    const base64ToBlob = (base64: string, mimeType?: string): Blob => {
        const inferredMime = mimeType || base64.match(/^data:([^;]+);base64,/)?.[1] || 'image/png';
        const byteString = atob(base64.split(',')[1]);
        const ab = new ArrayBuffer(byteString.length);
        const ia = new Uint8Array(ab);
        for (let i = 0; i < byteString.length; i++) {
            ia[i] = byteString.charCodeAt(i);
        }
        return new Blob([ab], { type: inferredMime });
    };

    const handleShare = async (sticker: Sticker) => {
        try {
            if (!window.isSecureContext) {
                showToast(t('gallery.toast.httpsRequired'), 'error');
                return;
            }

            let file: File;
            // Safe filename: truncate to 50 chars, remove special chars
            const safePhrase = sticker.phrase.slice(0, 50).replace(/[^\w\s\u4e00-\u9fa5]/gi, '_');

            if (sticker.imageUrl.startsWith('data:')) {
                // Handle Base64 Data URL (Generated Images)
                const blob = base64ToBlob(sticker.imageUrl);
                file = new File([blob], `${safePhrase}.png`, { type: 'image/png' });
            } else {
                // Handle Remote URL (Uploaded/Stored Images)
                const response = await fetch(sticker.imageUrl);
                const blob = await response.blob();
                file = new File([blob], `${safePhrase}.png`, { type: 'image/png' });
            }

            if (navigator.canShare && navigator.canShare({ files: [file] })) {
                await navigator.share({
                    files: [file],
                });
            } else {
                // Fallback to clipboard
                const clipboardItem = new ClipboardItem({ [file.type]: file });
                await navigator.clipboard.write([clipboardItem]);
                showToast(t('gallery.toast.sharedToClipboard'), 'success');
            }
        } catch (error) {
            console.error("Share failed:", error);
            if (!(error instanceof DOMException && error.name === 'AbortError')) {
                showToast(t('gallery.toast.shareFailed'), 'error');
            }
        }
    };

    const handleCopyText = async (sticker: Sticker) => {
        const textToCopy = `${sticker.phrase}\n\n${sticker.description || ''}`;
        try {
            await navigator.clipboard.writeText(textToCopy);
            showToast(t('gallery.toast.copied'), 'success');
        } catch (err) {
            console.error('Failed to copy text: ', err);
            showToast(t('gallery.toast.copyFailed'), 'error');
        }
    };

    const handleDownloadText = (sticker: Sticker) => {
        const textContent = `${sticker.phrase}\n\n${sticker.description || ''}`;
        const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${sticker.phrase || 'sticker_text'}.txt`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const handleDownloadZip = async (subset: Sticker[] = filteredStickers) => {
        const zip = new JSZip();
        const folder = zip.folder("stickers");
        const docsFolder = zip.folder("docs");
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) ||
            (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

        if (subset.length === 0) return;

        const sanitizeFileBase = (input: string) => {
            const cleaned = (input || 'sticker')
                .replace(/[<>:"/\\|?*\x00-\x1F]/g, '_')
                .replace(/\s+/g, '_')
                .replace(/_+/g, '_')
                .replace(/^_+|_+$/g, '');
            return cleaned.slice(0, 60) || 'sticker';
        };

        const mimeToExt = (mime: string) => {
            const table: Record<string, string> = {
                'image/png': 'png',
                'image/jpeg': 'jpg',
                'image/webp': 'webp',
                'image/gif': 'gif',
                'image/svg+xml': 'svg',
                'text/plain': 'txt',
                'application/pdf': 'pdf',
            };
            return table[mime] || 'bin';
        };

        let addedCount = 0;
        const failedIds: string[] = [];

        for (const sticker of subset) {
            try {
                let blob: Blob;
                if (sticker.imageUrl.startsWith('data:')) {
                    blob = base64ToBlob(sticker.imageUrl);
                } else {
                    const response = await fetch(sticker.imageUrl);
                    if (!response.ok) {
                        throw new Error(`HTTP ${response.status}`);
                    }
                    blob = await response.blob();
                }
                const safeBase = sanitizeFileBase(sticker.phrase);
                const ext = mimeToExt(blob.type || 'image/png');
                folder?.file(`${safeBase}_${sticker.id}.${ext}`, blob);

                // Include associated text document when available.
                if (sticker.description && sticker.description.trim().length > 0) {
                    const docText = `${sticker.phrase}\n\n${sticker.description}`;
                    docsFolder?.file(`${safeBase}_${sticker.id}.txt`, docText);
                }
                addedCount += 1;
            } catch (error) {
                console.error('Failed to add image to zip:', sticker.id, error);
                failedIds.push(sticker.id);
            }
        }

        if (addedCount === 0) {
            throw new Error('No images could be added to ZIP.');
        }

        if (failedIds.length > 0) {
            console.warn('Some stickers were skipped during ZIP creation:', failedIds);
        }

        const content = await zip.generateAsync({ type: "blob" });
        const zipDate = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        const filename = `stickers_${zipDate}.zip`;

        if (isIOS) {
            const hasShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function';
            if (hasShare) {
                try {
                    const zipFile = new File([content], filename, { type: 'application/zip' });
                    const canShareFile = !navigator.canShare || navigator.canShare({ files: [zipFile] });
                    if (canShareFile) {
                        await navigator.share({ files: [zipFile], title: filename });
                        return;
                    }
                } catch (error) {
                    console.error('ZIP share fallback failed on iOS:', error);
                }
            }

            // Fallback for iOS Safari:
            // 1) Try direct download with explicit filename.
            // 2) If Safari ignores it, navigate to blob page for manual "Save to Files".
            const zipFile = new File([content], filename, { type: 'application/zip' });
            const url = URL.createObjectURL(zipFile);

            try {
                const link = document.createElement('a');
                link.href = url;
                link.download = filename;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            } catch {
                // Ignore and continue to manual fallback.
            }

            showToast(t('gallery.toast.zipCreatedIOSHint'), 'info');
            window.location.assign(url);
            setTimeout(() => URL.revokeObjectURL(url), 60_000);
            return;
        }

        saveAs(content, filename);
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

    const handleBatchDownload = async () => {
        const selectedStickers = stickers.filter(s => selectedIds.has(s.id));
        if (selectedStickers.length === 0) return;

        try {
            await handleDownloadZip(selectedStickers);
            setSelectedIds(new Set());
            setIsSelectionMode(false);
        } catch (error) {
            console.error("Batch download failed:", error);
            showToast(t('gallery.toast.downloadFailed'), 'error');
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

    const filteredStickers = stickers.filter(s =>
        s.phrase.toLowerCase().includes(searchTerm.toLowerCase())
    );



    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        setIsLoading(true);
        try {
            // const newStickers: Sticker[] = [];
            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                if (!file.type.startsWith('image/')) continue;

                const base64 = await new Promise<string>((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = () => resolve(reader.result as string);
                    reader.onerror = reject;
                    reader.readAsDataURL(file);
                });

                const newSticker: Sticker = {
                    id: typeof crypto.randomUUID === 'function' ? crypto.randomUUID() : Math.random().toString(36).substring(2) + Date.now().toString(36),
                    imageUrl: base64,
                    phrase: file.name.split('.')[0],
                    timestamp: Date.now()
                };

                await saveStickerToDB(newSticker);
            }

            // Refresh list
            await loadStickers();
        } catch (error) {
            console.error("Upload failed", error);
            showToast(t('gallery.toast.uploadFailed'), 'error');
        } finally {
            setIsLoading(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    return (
        <div className="min-h-screen px-6 md:px-12 bg-cream-light/30 pb-32">
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Content Grid */}
            </div>

            {/* Structural Header (Desktop) */}
            <header className="bg-white border-b border-cream-dark px-6 py-3 sticky top-0 z-30 shadow-sm flex-shrink-0">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    {/* Spacer */}
                    <div className="flex-1"></div>

                    <div className="flex items-center gap-2 w-full md:w-auto justify-center md:justify-end">
                        {!isSelectionMode ? (
                            <>
                                <div className="relative group w-full md:w-auto">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-bronze-light group-focus-within:text-primary transition-colors" size={14} />
                                    <input
                                        type="text"
                                        placeholder="Search..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="pl-9 pr-4 py-2 bg-cream-light border border-cream-dark rounded-xl text-xs font-bold text-bronze-text focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all w-full md:w-48 placeholder-bronze-light/50"
                                    />
                                </div>

                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    className="hidden"
                                    accept="image/*"
                                    multiple
                                    onChange={handleFileUpload}
                                />
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    className="p-2 bg-primary text-white border border-primary rounded-xl hover:bg-primary/90 transition-all shadow-sm flex items-center gap-2"
                                    title={t('gallery.upload')}
                                >
                                    <Upload size={16} />
                                    <span className="hidden md:inline text-xs font-bold">{t('gallery.upload')}</span>
                                </button>

                                {stickers.length > 0 && (
                                    <>
                                        <button
                                            onClick={toggleSelectionMode}
                                            data-testid="gallery-selection-mode"
                                            className="p-2 bg-white border border-cream-dark rounded-xl text-bronze-light hover:text-primary hover:border-primary/50 transition-all shadow-sm"
                                            title={t('gallery.selectionMode')}
                                        >
                                            <CheckCircle2 size={16} />
                                        </button>
                                        <button
                                            onClick={() => handleDownloadZip(filteredStickers)}
                                            className="p-2 bg-white border border-cream-dark rounded-xl text-bronze-light hover:text-primary hover:border-primary/50 transition-all shadow-sm"
                                            title={t('gallery.downloadZip')}
                                        >
                                            <FileArchive size={16} />
                                        </button>
                                        <button
                                            onClick={handleClearAll}
                                            className="p-2 bg-white border border-cream-dark rounded-xl text-bronze-light hover:text-red-500 hover:border-red-200 transition-all shadow-sm"
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
                                    className="px-3 py-2 bg-white border border-cream-dark rounded-xl text-bronze-text font-bold text-xs hover:bg-cream-light transition-all shadow-sm"
                                >
                                    {selectedIds.size === filteredStickers.length ? t('gallery.deselectAll') : t('gallery.selectAll')}
                                </button>
                                <button
                                    onClick={toggleSelectionMode}
                                    className="px-3 py-2 bg-bronze-text text-white rounded-xl font-bold text-xs hover:bg-bronze-text/90 transition-all shadow-lg"
                                >
                                    {t('gallery.cancelSelection')}
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </header>

            {/* Grid */}
            {isLoading ? (
                <div className="text-center py-20 text-bronze-light animate-pulse font-bold">{t('gallery.loading')}</div>
            ) : filteredStickers.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-bronze-light border-2 border-dashed border-cream-dark rounded-3xl">
                    <ImageIcon size={64} className="mb-4 opacity-50" />
                    <p className="text-lg font-bold text-bronze-text">{t('gallery.empty')}</p>
                    <p className="text-sm font-medium mt-2 text-bronze-light/80">{t('gallery.emptyDesc')}</p>
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
                            onViewDetails={setViewingSticker}
                            onPreview={setPreviewSticker}
                            onShare={handleShare}
                            onCopyPrompt={handleCopyText}
                            onDownloadPrompt={handleDownloadText}
                        />
                    ))}
                </div>
            )}


            {/* Batch Action Bar */}
            {
                isSelectionMode && selectedIds.size > 0 && (
                    <div className="fixed bottom-6 inset-x-0 flex justify-center z-50 animate-in slide-in-from-bottom-10 fade-in">
                        <div className="bg-bronze-text/95 backdrop-blur-md text-white px-4 py-2 sm:px-6 sm:py-3 rounded-2xl shadow-2xl flex items-center gap-2 sm:gap-4 border border-cream-light/10 max-w-[calc(100vw-1rem)]">
                            <span className="text-xs font-bold bg-white/20 px-2 py-1 rounded-md">{selectedIds.size}</span>
                            <div className="h-6 w-px bg-white/20"></div>
                            <button
                                onClick={handleBatchDownload}
                                data-testid="gallery-batch-download"
                                className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-bold hover:text-secondary-light transition-colors"
                            >
                                <Download size={18} />
                                <span className="hidden sm:inline">{t('gallery.downloadZip')}</span>
                                <span className="sm:hidden">ZIP</span>
                            </button>
                            <div className="h-6 w-px bg-white/20"></div>
                            <button
                                onClick={handleBatchDelete}
                                data-testid="gallery-batch-delete"
                                className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-bold hover:text-red-300 transition-colors"
                            >
                                <Trash2 size={18} />
                                <span className="hidden sm:inline">{t('gallery.deleteSelected', { count: selectedIds.size })}</span>
                                <span className="sm:hidden">{t('gallery.delete')}</span>
                            </button>
                        </div>
                    </div>
                )
            }
            {/* Details Modal */}
            {
                viewingSticker && (
                    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in" onClick={() => setViewingSticker(null)}>
                        <div className="bg-white rounded-3xl max-w-4xl w-full h-[90vh] md:h-auto md:max-h-[90vh] overflow-hidden flex flex-col md:flex-row shadow-2xl animate-in zoom-in-95 duration-300" onClick={e => e.stopPropagation()}>

                            {/* Image Side */}
                            <div className="w-full md:w-1/2 bg-cream-light/30 relative flex items-center justify-center p-8 border-b md:border-b-0 md:border-r border-cream-dark/50" style={{ backgroundImage: 'radial-gradient(#d6ccc2 1px, transparent 1px)', backgroundSize: '16px 16px' }}>
                                <img src={viewingSticker.imageUrl} alt={viewingSticker.phrase} className="max-w-full max-h-[50vh] md:max-h-full object-contain drop-shadow-xl cursor-zoom-in" onClick={() => { setViewingSticker(null); setPreviewSticker(viewingSticker); }} />
                                <button className="absolute top-4 left-4 p-2 bg-white/80 rounded-full text-bronze-light hover:text-primary transition-colors md:hidden" onClick={() => setViewingSticker(null)}>
                                    <X size={20} />
                                </button>
                            </div>

                            {/* Text Side */}
                            <div className="w-full md:w-1/2 flex flex-col flex-1 min-h-0 bg-white">
                                <div className="px-8 py-6 border-b border-cream-dark flex items-center justify-between bg-white shrink-0">
                                    <div>
                                        <h2 className="text-xl font-black text-bronze-text line-clamp-1">{viewingSticker.phrase}</h2>
                                        <p className="text-xs text-bronze-light font-bold mt-1">{new Date(viewingSticker.timestamp).toLocaleString()}</p>
                                    </div>
                                    <button onClick={() => setViewingSticker(null)} className="p-2 hover:bg-cream-light rounded-full text-bronze-light transition-colors hidden md:block">
                                        <X size={24} />
                                    </button>
                                </div>

                                <div className="flex-1 overflow-y-auto p-8 bg-cream-light/10">
                                    {viewingSticker.description ? (
                                        <div className="prose prose-sm prose-stone max-w-none text-bronze-text/90 font-medium leading-relaxed">
                                            <ReactMarkdown>{viewingSticker.description}</ReactMarkdown>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center h-full text-bronze-light/50 italic">
                                            <FileText size={48} className="mb-4 opacity-20" />
                                            <p>No description available</p>
                                        </div>
                                    )}
                                </div>

                                <div className="p-6 border-t border-cream-dark bg-white shrink-0 flex flex-wrap justify-end gap-3">
                                    <button
                                        onClick={() => handleCopyText(viewingSticker)}
                                        className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold text-sm transition-all flex items-center gap-2"
                                        title={t('generator.action.copyPrompt')}
                                    >
                                        <Copy size={16} /> <span className="hidden sm:inline">{t('generator.action.copyPrompt')}</span>
                                    </button>
                                    <button
                                        onClick={() => handleDownloadText(viewingSticker)}
                                        className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold text-sm transition-all flex items-center gap-2"
                                        title={t('generator.action.downloadPrompt')}
                                    >
                                        <FileText size={16} /> <span className="hidden sm:inline">{t('generator.action.downloadPrompt')}</span>
                                    </button>
                                    <div className="w-px h-8 bg-gray-300 mx-1 hidden sm:block"></div>
                                    <button
                                        onClick={() => handleShare(viewingSticker)}
                                        className="px-4 py-2 bg-pink-500 text-white rounded-xl font-bold text-sm shadow-lg shadow-pink-500/20 hover:bg-pink-600 transition-all flex items-center gap-2"
                                    >
                                        <Share2 size={16} /> {t('gallery.share')}
                                    </button>
                                    <button
                                        onClick={() => handleDownload(viewingSticker.imageUrl, viewingSticker.phrase)}
                                        className="px-4 py-2 bg-primary text-white rounded-xl font-bold text-sm shadow-lg shadow-primary/20 hover:bg-primary-hover transition-all flex items-center gap-2"
                                    >
                                        <Download size={16} /> {t('common.download')}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Lightbox Modal */}
            {
                previewSticker && (
                    <div className="fixed inset-0 z-[60] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={() => setPreviewSticker(null)}>
                        <button className="absolute top-6 right-6 p-4 text-white/50 hover:text-white transition-colors">
                            <X size={32} />
                        </button>
                        <img
                            src={previewSticker.imageUrl}
                            alt={previewSticker.phrase}
                            className="max-w-full max-h-screen object-contain drop-shadow-2xl animate-in zoom-in-90 duration-300"
                            onClick={(e) => e.stopPropagation()}
                        />

                        {/* Lightbox Actions */}
                        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-white/10 backdrop-blur-md p-3 rounded-full border border-white/20" onClick={e => e.stopPropagation()}>
                            <button
                                onClick={() => handleDownload(previewSticker.imageUrl, previewSticker.phrase)}
                                className="px-4 py-2 bg-primary text-white rounded-full font-bold text-sm hover:bg-primary-hover transition-all flex items-center gap-2"
                            >
                                <Download size={16} /> {t('gallery.download')}
                            </button>
                            <div className="w-px h-6 bg-white/20"></div>
                            <button
                                onClick={() => handleDownloadText(previewSticker)}
                                className="p-2 hover:bg-white/20 rounded-full text-white transition-all text-sm font-bold flex items-center gap-2"
                                title={t('generator.action.downloadPrompt') || "Download Prompt"}
                            >
                                <FileText size={18} /> <span className="hidden sm:inline">{t('generator.action.downloadPrompt') || "Prompt"}</span>
                            </button>
                            <button
                                onClick={() => handleCopyText(previewSticker)}
                                className="p-2 hover:bg-white/20 rounded-full text-white transition-all text-sm font-bold flex items-center gap-2"
                                title={t('generator.action.copyPrompt') || "Copy Prompt"}
                            >
                                <Copy size={18} /> <span className="hidden sm:inline">{t('generator.action.copyPrompt') || "Copy"}</span>
                            </button>
                        </div>

                    </div>
                )
            }
        </div >
    );
};

export default App;

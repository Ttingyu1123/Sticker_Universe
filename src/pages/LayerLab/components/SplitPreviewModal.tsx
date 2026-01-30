import React from 'react';
import { X, Download, Grid } from 'lucide-react';
import { SplitImage, downloadZip } from '../utils/exportUtils';
import { useTranslation } from 'react-i18next';

interface SplitPreviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    images: SplitImage[];
}

export const SplitPreviewModal: React.FC<SplitPreviewModalProps> = ({ isOpen, onClose, images }) => {
    const { t } = useTranslation();

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
                    <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                        <Grid className="text-violet-600" size={20} />
                        Preview Splits
                        <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-full">{images.length} items</span>
                    </h3>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Grid Content */}
                <div className="flex-1 overflow-y-auto p-6 bg-slate-50">
                    {images.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-40 text-slate-400">
                            <p>No images generated.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                            {images.map((img, idx) => (
                                <div key={idx} className="group relative aspect-square bg-[url(https://img.ly/assets/demo-assets/transparent-bg.png)] bg-[length:10px_10px] rounded-xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                                    <img src={img.url} alt={img.name} className="w-full h-full object-contain" />
                                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <a
                                            href={img.url}
                                            download={img.name}
                                            className="p-1.5 bg-white/90 hover:bg-white text-slate-700 rounded-full shadow-sm block"
                                            title="Download single"
                                        >
                                            <Download size={14} />
                                        </a>
                                    </div>
                                    <div className="absolute bottom-0 inset-x-0 bg-white/80 backdrop-blur-[2px] p-2 border-t border-slate-100 translate-y-full group-hover:translate-y-0 transition-transform">
                                        <p className="text-[10px] text-center font-medium text-slate-600 truncate">{img.name}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer Actions */}
                <div className="p-4 border-t border-slate-100 bg-white shrink-0 flex gap-3 justify-end">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={() => downloadZip(images)}
                        disabled={images.length === 0}
                        className="px-6 py-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-bold rounded-xl shadow-lg shadow-violet-200 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Download size={18} />
                        Download All (ZIP)
                    </button>
                </div>
            </div>
        </div>
    );
};

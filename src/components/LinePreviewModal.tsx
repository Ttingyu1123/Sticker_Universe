import React from 'react';
import { X, Moon, Sun } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface LinePreviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    imageSrc: string | null;
}

export const LinePreviewModal: React.FC<LinePreviewModalProps> = ({ isOpen, onClose, imageSrc }) => {
    const { t } = useTranslation();
    const [isDarkMode, setIsDarkMode] = React.useState(false);

    if (!isOpen || !imageSrc) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose}>
            <div
                className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden relative animate-in zoom-in-95 duration-200 m-4"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-white sticky top-0 z-10">
                    <h3 className="font-bold text-gray-800 ml-2">{t('linePreview.title')}</h3>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setIsDarkMode(!isDarkMode)}
                            className="p-2 rounded-full hover:bg-gray-100 transition-colors text-gray-500"
                        >
                            {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
                        </button>
                        <button
                            onClick={onClose}
                            className="p-2 rounded-full hover:bg-gray-100 transition-colors text-gray-500"
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* Mock Phone UI */}
                <div className="p-6 bg-gray-50 flex justify-center">
                    <div className={`relative w-[320px] h-[600px] border-[8px] border-slate-800 rounded-[3rem] overflow-hidden shadow-xl bg-slate-800`}>
                        {/* Phone Screen */}
                        <div className={`w-full h-full flex flex-col ${isDarkMode ? 'bg-[#1b1b1b]' : 'bg-[#8cabd9]'}`}>
                            {/* Status Bar */}
                            <div className={`${isDarkMode ? 'bg-[#252525] text-white' : 'bg-[#7a9bc7] text-white'} h-8 flex items-center justify-center text-xs font-semibold select-none`}>
                                Sticker Preview
                            </div>

                            {/* Chat Area */}
                            <div className="flex-1 p-4 overflow-y-auto space-y-4">

                                {/* Other User Message */}
                                <div className="flex items-start gap-2">
                                    <div className="w-10 h-10 rounded-full bg-gray-300 flex-shrink-0"></div>
                                    <div className="flex flex-col gap-1 items-start">
                                        <div className="text-xs text-white/80 ml-1">{t('linePreview.friend')}</div>
                                        <div className={`px-4 py-2 rounded-2xl rounded-tl-none max-w-[200px] shadow-sm text-sm ${isDarkMode ? 'bg-[#333] text-white' : 'bg-white text-gray-800'}`}>
                                            <span style={{ whiteSpace: 'pre-line' }}>{t('linePreview.message1')}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* User Sticker (Preview) */}
                                <div className="flex flex-row-reverse items-start gap-2">
                                    <div className="flex flex-col gap-1 items-end">
                                        <div className="max-w-[140px] sm:max-w-[160px]">
                                            <img
                                                src={imageSrc}
                                                alt="Sticker Preview"
                                                className="w-full h-auto object-contain drop-shadow-sm"
                                            />
                                        </div>
                                        <div className="text-[10px] text-white/70 mr-1">{t('linePreview.read')} 12:34</div>
                                    </div>
                                </div>

                                {/* Reply */}
                                <div className="flex items-start gap-2">
                                    <div className="w-10 h-10 rounded-full bg-gray-300 flex-shrink-0"></div>
                                    <div className={`px-4 py-2 rounded-2xl rounded-tl-none max-w-[200px] shadow-sm text-sm mt-6 ${isDarkMode ? 'bg-[#333] text-white' : 'bg-white text-gray-800'}`}>
                                        <span style={{ whiteSpace: 'pre-line' }}>{t('linePreview.message2')}</span>
                                    </div>
                                </div>

                            </div>

                            {/* Input Area (Mock) */}
                            <div className={`h-14 ${isDarkMode ? 'bg-[#252525] border-gray-700' : 'bg-white border-gray-200'} border-t flex items-center px-3 gap-2`}>
                                <div className="p-1.5 rounded-lg text-gray-400"><X size={20} className="rotate-45" /></div> {/* Plus icon */}
                                <div className={`flex-1 h-9 rounded-full px-3 text-sm flex items-center text-gray-400 ${isDarkMode ? 'bg-[#333]' : 'bg-gray-100'}`}>
                                    {t('linePreview.inputPlaceholder')}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};

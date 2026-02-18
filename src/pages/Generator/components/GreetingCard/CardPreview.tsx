
import React from 'react';
import { RefreshCw, Share2, Scissors, Download, Image as ImageIcon } from 'lucide-react';
import { CardLayoutId } from '../../types';
import { FONTS, HistoryItem } from './Constants';

interface CardPreviewProps {
    generatedResult: HistoryItem | null;
    cardLayout: CardLayoutId;
    recipientName: string;
    userName: string;
    cardBgColor: string;
    showTextOnCard: boolean;
    selectedFont: string;
    customFonts: any[];
    textColor: string;
    isRegenerating: boolean;
    isRemovingBg: boolean;
    canShare: boolean;
    onRegenerate: () => void;
    onShare: () => void;
    onRemoveBg: () => void;
    onDownload: () => void;
    onDownloadRaw: () => void;
}

export const CardPreview: React.FC<CardPreviewProps> = ({
    generatedResult,
    cardLayout,
    recipientName,
    userName,
    cardBgColor,
    showTextOnCard,
    selectedFont,
    customFonts,
    textColor,
    isRegenerating,
    isRemovingBg,
    canShare,
    onRegenerate,
    onShare,
    onRemoveBg,
    onDownload,
    onDownloadRaw
}) => {
    const activeFont = [...FONTS, ...customFonts].find(f => f.id === selectedFont);

    if (!generatedResult) {
        return (
            <div
                className="border border-cream-dark shadow-sm rounded-[2rem] p-8 h-fit min-h-[500px] flex flex-col items-center justify-center relative group transition-colors duration-500 w-full"
                style={{ backgroundColor: cardBgColor }}
            >
                <div className="text-center space-y-4 opacity-50">
                    <ImageIcon size={64} className="mx-auto text-bronze-light" />
                    <p className="text-bronze-light font-bold">你的專屬賀卡將會出現在這裡</p>
                </div>
            </div>
        );
    }

    return (
        <div
            className="border border-cream-dark shadow-sm rounded-[2rem] p-8 h-fit min-h-[500px] flex flex-col items-center justify-center relative group transition-colors duration-500 w-full"
            style={{ backgroundColor: cardBgColor }}
        >
            <div className="relative w-full h-full flex flex-col items-center justify-center p-4">
                {/* --- Classic Layout --- */}
                {cardLayout === 'classic' && (
                    <>
                        <div className="relative w-full max-w-[90%] rounded-xl overflow-hidden shadow-2xl border-8 border-white bg-white">
                            <img src={generatedResult.imageUrl} className="w-full h-auto object-cover" alt="Generated Card" />
                        </div>
                        <div className="mt-6 text-center space-y-3 max-w-md w-full z-10">
                            <h3 className="text-2xl font-black text-bronze-text font-serif">
                                {generatedResult.title}
                            </h3>
                            <div className="text-xs font-bold text-bronze-light uppercase tracking-widest border-t border-cream-dark/50 pt-3 w-full text-center">
                                To: {recipientName || "You"} | From: {userName || "Me"}
                            </div>
                            {showTextOnCard && generatedResult.message && (
                                <div className="relative p-4 bg-white/80 backdrop-blur-sm shadow-sm border border-cream-dark rounded-xl transform rotate-1 mt-2">
                                    <p
                                        className={`text-sm leading-relaxed ${activeFont?.className || ''}`}
                                        style={{ color: textColor, fontFamily: activeFont?.family }}
                                    >
                                        {generatedResult.message}
                                    </p>
                                </div>
                            )}
                        </div>
                    </>
                )}

                {/* --- Magazine Layout --- */}
                {cardLayout === 'magazine' && (
                    <div className="relative w-full h-full min-h-[500px] flex items-end rounded-xl overflow-hidden shadow-2xl group">
                        <img src={generatedResult.imageUrl} className="absolute inset-0 w-full h-full object-cover" alt="Generated Card" />
                        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
                        <div className="absolute bottom-6 left-6 right-6 bg-black/40 backdrop-blur-md rounded-2xl p-6 border border-white/10 shadow-xl flex flex-col items-start text-left z-10 transition-transform group-hover:scale-[1.02]">
                            <h3 className="text-3xl md:text-4xl font-black text-white font-sans uppercase leading-tight drop-shadow-lg mb-3">
                                {generatedResult.title || "Greeting"}
                            </h3>
                            <div className="text-xs font-mono text-white/80 mb-4 bg-white/20 px-2 py-1 rounded backdrop-blur-md tracking-wider">
                                TO {recipientName?.toUpperCase() || "YOU"} • FROM {userName?.toUpperCase() || "ME"}
                            </div>
                            {showTextOnCard && generatedResult.message && (
                                <p
                                    className={`text-base text-white/95 leading-relaxed drop-shadow-md border-t border-white/20 pt-3 w-full ${activeFont?.className || ''}`}
                                    style={{ fontFamily: activeFont?.family }}
                                >
                                    {generatedResult.message}
                                </p>
                            )}
                        </div>
                    </div>
                )}

                {/* --- Minimalist Layout --- */}
                {cardLayout === 'minimalist' && (
                    <div className="w-full h-full bg-white p-12 flex flex-col items-center justify-center shadow-md rounded-sm">
                        <div className="border border-gray-200 p-1 mb-8 shadow-sm">
                            <img src={generatedResult.imageUrl} className="max-w-[80%] max-h-[300px] object-contain mx-auto" alt="Generated Card" />
                        </div>
                        <div className="text-center space-y-4 max-w-sm">
                            <div className="text-base italic text-gray-400 font-serif">
                                {recipientName || "Dear"} / {userName || "Me"}
                            </div>
                            {showTextOnCard && generatedResult.message && (
                                <p
                                    className={`text-xl leading-relaxed py-4 border-t border-b border-gray-100 ${activeFont?.className || ''}`}
                                    style={{ color: textColor, fontFamily: activeFont?.family }}
                                >
                                    {generatedResult.message}
                                </p>
                            )}
                        </div>
                    </div>
                )}

                {/* Hover Actions */}
                {!isRegenerating && !isRemovingBg && (
                    <div className="absolute top-4 right-4 flex flex-col gap-2 z-[60]">
                        <button onClick={onRegenerate} className="bg-white/90 backdrop-blur p-3 rounded-full text-blue-500 shadow-lg hover:scale-110 transition-transform" title="重新生成">
                            <RefreshCw size={20} />
                        </button>
                        <button onClick={onShare} className="bg-white/90 backdrop-blur p-3 rounded-full text-pink-500 shadow-lg hover:scale-110 transition-transform" title={canShare ? "分享 / 存到..." : "複製到剪貼簿"}>
                            <Share2 size={20} />
                        </button>
                        <button onClick={onRemoveBg} className="bg-white/90 backdrop-blur p-3 rounded-full text-amber-500 shadow-lg hover:scale-110 transition-transform" title="智慧去背 (移除綠幕)">
                            <Scissors size={20} />
                        </button>
                        <div className="flex flex-col gap-2 group/menu">
                            <button onClick={onDownload} className="bg-white/90 backdrop-blur p-3 rounded-full text-green-600 shadow-lg hover:scale-110 transition-transform flex items-center justify-center gap-1 group/btn" title="下載完整賀卡">
                                <Download size={20} />
                            </button>
                            <button onClick={onDownloadRaw} className="flex bg-white/90 backdrop-blur p-3 rounded-full text-teal-500 shadow-lg hover:scale-110 transition-transform items-center justify-center gap-1" title="下載純圖片">
                                <ImageIcon size={20} />
                            </button>
                        </div>
                    </div>
                )}

                {/* Loading Overlays */}
                {(isRegenerating || isRemovingBg) && (
                    <div className="absolute inset-0 z-[70] bg-white/50 backdrop-blur-sm flex items-center justify-center rounded-[2rem]">
                        <div className="bg-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2">
                            {isRemovingBg ? <Scissors className="animate-bounce text-amber-500" size={16} /> : <RefreshCw className="animate-spin text-primary" size={16} />}
                            <span className="text-xs font-bold text-bronze">{isRemovingBg ? "智慧去背中..." : "重新繪製中..."}</span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

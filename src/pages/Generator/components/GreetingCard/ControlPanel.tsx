
import React from 'react';
import { Settings, Upload, Scissors, FolderHeart, Check, Sparkles, RefreshCw, Heart } from 'lucide-react';
import { FESTIVALS, CARD_STYLES, CARD_BACKGROUNDS, ASPECT_RATIOS, FONTS, TEXT_COLORS } from './Constants';
import { CardLayoutId, CARD_LAYOUTS } from '../../types';

interface ControlPanelProps {
    userImage: string | null;
    autoRemoveBg: boolean;
    isProcessingUploadBg: boolean;
    festival: string;
    style: string;
    cardBgColor: string;
    aspectRatio: string;
    cardLayout: CardLayoutId;
    faceSwapMode: boolean;
    autoExpandBackground: boolean;
    styleIntensity: number;
    negativePrompt: string;
    showTextOnCard: boolean;
    selectedFont: string;
    customFonts: any[];
    textColor: string;
    customPrompt: string;
    isOptimizingPrompt: boolean;
    userName: string;
    recipientName: string;
    message: string;
    isGenerating: boolean;
    isRegenerating: boolean;
    loadingStep: number;
    localError: string | null;
    fileInputRef: React.RefObject<HTMLInputElement>;
    onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onManualBgRemoval: () => void;
    onShowGallery: () => void;
    onToggleAutoRemoveBg: () => void;
    onSetFestival: (val: string) => void;
    onSetStyle: (val: string) => void;
    onSetCardBgColor: (val: string) => void;
    onSetAspectRatio: (val: string) => void;
    onSetCardLayout: (val: CardLayoutId) => void;
    onSetFaceSwapMode: (val: boolean) => void;
    onSetAutoExpandBackground: (val: boolean) => void;
    onSetStyleIntensity: (val: number) => void;
    onSetNegativePrompt: (val: string) => void;
    onSetShowTextOnCard: (val: boolean) => void;
    onSetSelectedFont: (val: string) => void;
    onFontUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onSetTextColor: (val: string) => void;
    onSetCustomPrompt: (val: string) => void;
    onOptimizePrompt: () => void;
    onSetRecipientName: (val: string) => void;
    onSetUserName: (val: string) => void;
    onSetMessage: (val: string) => void;
    onGenerate: () => void;
}

export const ControlPanel: React.FC<ControlPanelProps> = (props) => {
    return (
        <div className="space-y-6">
            {/* Upload Section */}
            <div className="bg-cream backdrop-blur-xl border border-cream-dark rounded-[2rem] p-8 min-h-[600px] flex flex-col group transition-all hover:bg-white/60">
                <div
                    onClick={() => props.fileInputRef.current?.click()}
                    className={`border-4 border-dashed rounded-3xl h-64 flex flex-col items-center justify-center cursor-pointer overflow-hidden transition-all relative ${props.userImage ? 'border-primary' : 'border-bronze-light/30 hover:border-primary/50'}`}
                >
                    {props.userImage ? (
                        <img src={props.userImage} className="w-full h-full object-cover" alt="User Upload" />
                    ) : (
                        <div className="space-y-2 text-center">
                            <Upload className="w-10 h-10 text-bronze-light mx-auto" />
                            <p className="text-bronze-light font-bold">點擊上傳照片 (主角)</p>
                            <p className="text-xs text-bronze-light/70">(建議清晰的人像照)</p>
                        </div>
                    )}
                    <input type="file" ref={props.fileInputRef} onChange={props.onFileUpload} accept="image/*" className="hidden" />

                    {props.isProcessingUploadBg && (
                        <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center z-10 text-primary animate-in fade-in">
                            <Scissors className="animate-bounce mb-2" size={32} />
                            <span className="font-bold animate-pulse">正在移除背景...</span>
                        </div>
                    )}

                    {props.userImage && !props.isProcessingUploadBg && (
                        <button
                            onClick={(e) => { e.stopPropagation(); props.onManualBgRemoval(); }}
                            className="absolute top-2 right-2 p-2 bg-white/90 backdrop-blur rounded-full text-secondary shadow-sm hover:scale-110 transition-transform z-20"
                            title="移除背景 (人像去背)"
                        >
                            <Scissors size={16} />
                        </button>
                    )}
                </div>
                <button
                    onClick={props.onShowGallery}
                    className="mt-3 w-full flex items-center justify-center gap-2 px-4 py-2 bg-secondary/10 hover:bg-secondary/20 text-bronze-text rounded-xl text-sm font-bold transition-colors"
                >
                    <FolderHeart size={16} />
                    從作品集選取
                </button>

                <div
                    onClick={props.onToggleAutoRemoveBg}
                    className={`mt-3 w-full flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all cursor-pointer border ${props.autoRemoveBg ? 'bg-primary/10 border-primary text-primary' : 'bg-transparent border-transparent text-bronze-light hover:bg-black/5'}`}
                >
                    <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${props.autoRemoveBg ? 'bg-primary border-primary' : 'border-bronze-light'}`}>
                        {props.autoRemoveBg && <Check size={12} className="text-white" />}
                    </div>
                    <span>上傳後自動去背</span>
                </div>
            </div>

            {/* Settings Section */}
            <div className="bg-cream backdrop-blur-xl border border-cream-dark rounded-[2rem] p-6 shadow-sm">
                <h2 className="text-sm font-black text-bronze-light uppercase tracking-widest flex items-center gap-2 mb-4">
                    <Settings size={16} /> 賀卡設定
                </h2>

                <div className="space-y-4">
                    {/* Festival Selection */}
                    <div>
                        <label className="text-xs font-bold text-bronze-light ml-2 mb-1 block">節日主題</label>
                        <select
                            value={props.festival}
                            onChange={(e) => props.onSetFestival(e.target.value)}
                            className="w-full px-4 py-3 bg-white border border-cream-dark rounded-xl font-bold text-sm outline-none focus:border-primary text-bronze-text"
                            title="選擇節日主題"
                        >
                            {FESTIVALS.map(opt => (
                                <option key={opt.id} value={opt.id}>{opt.label}</option>
                            ))}
                        </select>
                    </div>

                    {/* Style Selection */}
                    <div>
                        <label className="text-xs font-bold text-bronze-light ml-2 mb-1 block">繪圖風格</label>
                        <select
                            value={props.style}
                            onChange={(e) => props.onSetStyle(e.target.value)}
                            className="w-full px-4 py-3 bg-white border border-cream-dark rounded-xl font-bold text-sm outline-none focus:border-primary text-bronze-text"
                            title="選擇繪圖風格"
                        >
                            {CARD_STYLES.map(opt => (
                                <option key={opt.id} value={opt.id}>{opt.label}</option>
                            ))}
                        </select>
                    </div>

                    {/* Card Background Selection */}
                    <div>
                        <label className="text-xs font-bold text-bronze-light ml-2 mb-2 block">賀卡底色</label>
                        <div className="flex flex-wrap gap-3">
                            {CARD_BACKGROUNDS.map((bg) => (
                                <button
                                    key={bg.id}
                                    onClick={() => props.onSetCardBgColor(bg.value)}
                                    className={`w-10 h-10 rounded-full shadow-sm transition-all flex items-center justify-center ${bg.class} ${props.cardBgColor === bg.value ? 'ring-2 ring-primary scale-110' : 'hover:scale-105'}`}
                                    title={bg.label}
                                >
                                    {props.cardBgColor === bg.value && <div className="w-2 h-2 rounded-full bg-primary" />}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Aspect Ratio Selection */}
                    <div>
                        <label className="text-xs font-bold text-bronze-light ml-2 mb-1 block">卡片尺寸 (比例)</label>
                        <select
                            value={props.aspectRatio}
                            onChange={(e) => props.onSetAspectRatio(e.target.value)}
                            className="w-full px-4 py-3 bg-white border border-cream-dark rounded-xl font-bold text-sm outline-none focus:border-primary text-bronze-text"
                            title="選擇卡片尺寸比例"
                        >
                            {ASPECT_RATIOS.map(opt => (
                                <option key={opt.id} value={opt.value}>{opt.label}</option>
                            ))}
                        </select>
                    </div>

                    {/* Layout Selection */}
                    <div>
                        <label className="text-xs font-bold text-bronze-light ml-2 mb-1 block">卡片版型</label>
                        <div className="grid grid-cols-3 gap-2">
                            {CARD_LAYOUTS.map(l => (
                                <button
                                    key={l.id}
                                    onClick={() => props.onSetCardLayout(l.id)}
                                    className={`px-2 py-3 rounded-xl text-xs font-bold border-2 transition-all flex flex-col items-center gap-1 ${props.cardLayout === l.id
                                        ? 'bg-white border-primary text-primary shadow-md'
                                        : 'bg-transparent border-cream-dark/50 text-bronze-light hover:bg-white/50'
                                        }`}
                                    title={l.description}
                                >
                                    <div className={`w-8 h-10 border rounded-sm mb-1 ${l.id === 'classic' ? 'border-current bg-current/10' :
                                        l.id === 'magazine' ? 'bg-current' :
                                            'border-current'
                                        }`} />
                                    {l.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Advanced Options */}
                    <div className="space-y-4 p-4 bg-cream-light/30 rounded-xl border border-cream-dark/20">
                        <h3 className="text-xs font-black text-bronze uppercase tracking-wider">進階選項</h3>

                        <label className={`flex items-center gap-3 group ${!props.userImage ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}>
                            <input
                                type="checkbox"
                                checked={props.faceSwapMode}
                                onChange={(e) => props.onSetFaceSwapMode(e.target.checked)}
                                disabled={!props.userImage}
                                className="w-5 h-5 rounded border-2 border-primary text-primary focus:ring-2 focus:ring-primary/20"
                            />
                            <div className="flex-1">
                                <div className={`text-sm font-bold transition-colors ${!props.userImage ? 'text-bronze-light' : 'text-bronze-text group-hover:text-primary'}`}>
                                    🎭 換臉模式
                                </div>
                                <div className="text-xs text-bronze-light">保持臉部特徵，更換符合節日服裝</div>
                            </div>
                        </label>

                        <label className={`flex items-center gap-3 group ${!props.userImage ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}>
                            <input
                                type="checkbox"
                                checked={props.autoExpandBackground}
                                onChange={(e) => props.onSetAutoExpandBackground(e.target.checked)}
                                disabled={!props.userImage}
                                className="w-5 h-5 rounded border-2 border-primary text-primary focus:ring-2 focus:ring-primary/20"
                            />
                            <div className="flex-1">
                                <div className={`text-sm font-bold transition-colors ${!props.userImage ? 'text-bronze-light' : 'text-bronze-text group-hover:text-primary'}`}>
                                    🖼️ AI 智慧擴圖
                                </div>
                                <div className="text-xs text-bronze-light">智慧補全比例不符的背景</div>
                            </div>
                        </label>

                        <div>
                            <div className="flex justify-between items-center mb-1">
                                <label className="text-xs font-bold text-bronze-light">🎨 風格強度</label>
                                <span className="text-xs font-bold text-primary">{props.styleIntensity}%</span>
                            </div>
                            <input
                                type="range"
                                min="0"
                                max="100"
                                value={props.styleIntensity}
                                onChange={(e) => props.onSetStyleIntensity(parseInt(e.target.value))}
                                className="w-full h-2 bg-cream-dark rounded-lg appearance-none cursor-pointer accent-primary"
                                title="風格強度調整"
                            />
                        </div>

                        <div>
                            <label className="text-xs font-bold text-bronze-light mb-1 block">🚫 負向提示詞</label>
                            <input
                                type="text"
                                value={props.negativePrompt}
                                onChange={(e) => props.onSetNegativePrompt(e.target.value)}
                                placeholder="不想看到的內容..."
                                className="w-full px-3 py-2 bg-white border border-cream-dark rounded-lg text-xs font-bold outline-none focus:border-primary text-bronze-text"
                            />
                        </div>

                        <label className="flex items-center gap-3 cursor-pointer group pt-2 border-t border-cream-dark/20">
                            <input
                                type="checkbox"
                                checked={props.showTextOnCard}
                                onChange={(e) => props.onSetShowTextOnCard(e.target.checked)}
                                className="w-5 h-5 rounded border-2 border-primary text-primary"
                            />
                            <div className="flex-1">
                                <div className="text-sm font-bold text-bronze-text group-hover:text-primary transition-colors">💬 顯示祝福語</div>
                            </div>
                        </label>

                        {props.showTextOnCard && (
                            <div className="space-y-3 pt-2">
                                <div className="flex justify-between items-center">
                                    <label className="text-xs font-bold text-bronze-light">字體與顏色</label>
                                    <label className="text-primary text-[10px] cursor-pointer hover:underline flex items-center gap-1">
                                        <Upload size={10} /> 上傳
                                        <input type="file" onChange={props.onFontUpload} accept=".ttf,.otf,.woff,.woff2" className="hidden" />
                                    </label>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    {[...FONTS, ...props.customFonts].map(f => (
                                        <button
                                            key={f.id}
                                            onClick={() => props.onSetSelectedFont(f.id)}
                                            className={`px-3 py-2 rounded-lg text-xs font-bold border transition-all truncate ${props.selectedFont === f.id ? 'bg-white border-primary text-primary' : 'bg-transparent border-cream-dark/50'}`}
                                            style={{ fontFamily: f.family }}
                                        >
                                            {f.label}
                                        </button>
                                    ))}
                                </div>
                                <div className="flex gap-2 flex-wrap">
                                    {TEXT_COLORS.map(c => (
                                        <button
                                            key={c.id}
                                            onClick={() => props.onSetTextColor(c.value)}
                                            className={`w-8 h-8 rounded-full transition-transform hover:scale-110 flex items-center justify-center ${c.class} ${props.textColor === c.value ? 'ring-2 ring-primary ring-offset-2' : ''}`}
                                            title={c.label}
                                        >
                                            {props.textColor === c.value && <div className="w-2 h-2 bg-white rounded-full shadow-sm" />}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Custom Prompt */}
                    <div className="space-y-3">
                        <label className="text-xs font-bold text-bronze-light ml-2 mb-1 block">✨ 自定義提示詞</label>
                        <div className="relative">
                            <textarea
                                value={props.customPrompt}
                                onChange={(e) => props.onSetCustomPrompt(e.target.value)}
                                placeholder="描述你想要看到的畫面細節..."
                                className="w-full px-4 py-3 bg-white border border-cream-dark rounded-xl font-bold text-sm outline-none focus:border-primary min-h-[100px] resize-none"
                                disabled={props.isOptimizingPrompt}
                            />
                        </div>
                        <button
                            onClick={props.onOptimizePrompt}
                            disabled={props.isOptimizingPrompt || !props.customPrompt.trim()}
                            className="w-full py-3 rounded-xl font-bold text-sm bg-gradient-to-r from-purple-500 to-indigo-500 text-white flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            {props.isOptimizingPrompt ? <RefreshCw className="animate-spin" size={16} /> : <Sparkles size={16} />}
                            AI 優化提示詞
                        </button>
                    </div>

                    {/* Names & Message */}
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <input
                                type="text"
                                value={props.recipientName}
                                onChange={(e) => props.onSetRecipientName(e.target.value)}
                                placeholder="收件人 (To)"
                                className="w-full px-4 py-3 bg-white border border-cream-dark rounded-xl font-bold text-sm"
                            />
                            <input
                                type="text"
                                value={props.userName}
                                onChange={(e) => props.onSetUserName(e.target.value)}
                                placeholder="你的名字 (From)"
                                className="w-full px-4 py-3 bg-white border border-cream-dark rounded-xl font-bold text-sm"
                            />
                        </div>
                        <textarea
                            value={props.message}
                            onChange={(e) => props.onSetMessage(e.target.value)}
                            placeholder="想要說的祝福語 (AI 會幫你潤飾)"
                            className="w-full px-4 py-3 bg-white border border-cream-dark rounded-xl font-bold text-sm min-h-[80px]"
                        />
                    </div>

                    <button
                        onClick={props.onGenerate}
                        disabled={props.isGenerating || props.isRegenerating}
                        className="w-full py-4 rounded-xl font-black text-lg shadow-lg bg-primary hover:bg-primary-hover text-white flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        {props.isGenerating ? <RefreshCw className="animate-spin" /> : <Heart className="fill-white" />}
                        {props.isGenerating ? 'AI 繪製中...' : '生成專屬賀卡'}
                    </button>

                    {props.isGenerating && (
                        <p className="text-center text-xs text-bronze-light animate-pulse font-bold">
                            {["正在構思賀卡構圖...", "AI 畫家正在揮毫...", "正在挑選最適合的配色...", "正在為您寫下祝福...", "最後修飾中..."][props.loadingStep]}
                        </p>
                    )}

                    {props.localError && <div className="text-red-500 text-xs font-bold text-center">{props.localError}</div>}
                </div>
            </div>
        </div>
    );
};

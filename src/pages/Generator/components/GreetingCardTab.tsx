import React, { useEffect, useRef, useState } from 'react';
import { GoogleGenAI } from '@google/genai';
import { GalleryPicker } from '../../../components/GalleryPicker';
import { CardLayoutId } from '../types';
import { processImage } from '../../../features/packager-core';
import { safeLoadFromLocalStorage, safeSaveToLocalStorage } from '../../../shared/localStorage';
import { AiProvider } from '../../../shared/geminiApiKey';
import { generateOpenAiImage } from '../services/openaiImageService';

import { FESTIVALS, CARD_STYLES, HistoryItem, FONTS } from './GreetingCard/Constants';
import { CardPreview } from './GreetingCard/CardPreview';
import { ControlPanel } from './GreetingCard/ControlPanel';
import { HistoryList } from './GreetingCard/HistoryList';

interface GreetingCardTabProps {
    provider: AiProvider;
    apiKeys: Record<AiProvider, string>;
    onProviderChange: (provider: AiProvider) => void;
    onError: (msg: string) => void;
    onNeedApiKey: (provider: AiProvider) => void;
    onSuccess: (imageUrl: string, prompt: string, description?: string) => void;
}

const PROVIDER_LABELS: Record<AiProvider, string> = {
    gemini: 'Gemini',
    openai: 'OpenAI',
};

const GEMINI_GREETING_MODEL = 'gemini-3-pro-image-preview';
const OPENAI_GREETING_MODEL = 'gpt-image-2';

const GreetingCardTab: React.FC<GreetingCardTabProps> = ({
    provider,
    apiKeys,
    onProviderChange,
    onError,
    onNeedApiKey,
    onSuccess,
}) => {
    const apiKey = apiKeys[provider];

    const [userImage, setUserImage] = useState<string | null>(null);
    const [festival, setFestival] = useState('new-year');
    const [style, setStyle] = useState('watercolor');
    const [aspectRatio, setAspectRatio] = useState('3:4');
    const [history, setHistory] = useState<HistoryItem[]>(() =>
        safeLoadFromLocalStorage<HistoryItem[]>('greeting_card_history') ?? []
    );

    const [userName, setUserName] = useState('');
    const [recipientName, setRecipientName] = useState('');
    const [showRecipientName, setShowRecipientName] = useState(true);
    const [showUserName, setShowUserName] = useState(true);
    const [cardBgColor, setCardBgColor] = useState('#FDFCF8');
    const [message, setMessage] = useState('');
    const [customPrompt, setCustomPrompt] = useState('');
    const [faceSwapMode, setFaceSwapMode] = useState(false);
    const [showTextOnCard, setShowTextOnCard] = useState(true);
    const [selectedFont, setSelectedFont] = useState('serif');
    const [customFonts, setCustomFonts] = useState<{ id: string; label: string; family: string; className: string }[]>([]);
    const [textColor, setTextColor] = useState('#333333');
    const [isGenerating, setIsGenerating] = useState(false);
    const [isRegenerating] = useState(false);
    const [isRemovingBg, setIsRemovingBg] = useState(false);
    const [isOptimizingPrompt, setIsOptimizingPrompt] = useState(false);
    const [generatedResult, setGeneratedResult] = useState<HistoryItem | null>(null);
    const [localError, setLocalError] = useState<string | null>(null);
    const [showGallery, setShowGallery] = useState(false);
    const [loadingStep, setLoadingStep] = useState(0);
    const [cardLayout, setCardLayout] = useState<CardLayoutId>('classic');
    const [styleIntensity, setStyleIntensity] = useState(80);
    const [autoExpandBackground, setAutoExpandBackground] = useState(true);
    const [negativePrompt, setNegativePrompt] = useState('');
    const [autoRemoveBg, setAutoRemoveBg] = useState(false);
    const [isProcessingUploadBg, setIsProcessingUploadBg] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (!isGenerating) return;
        const interval = setInterval(() => {
            setLoadingStep((prev) => (prev + 1) % 5);
        }, 3000);
        return () => clearInterval(interval);
    }, [isGenerating]);

    useEffect(() => {
        safeSaveToLocalStorage('greeting_card_history', history);
    }, [history]);

    const loadImage = (src: string): Promise<HTMLImageElement> =>
        new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => resolve(img);
            img.onerror = reject;
            img.src = src;
        });

    const handleRawImage = (blob: Blob) => {
        const reader = new FileReader();
        reader.onloadend = () => setUserImage(reader.result as string);
        reader.readAsDataURL(blob);
    };

    const processUploadedImageBg = async (file: File | Blob) => {
        setIsProcessingUploadBg(true);
        try {
            const blob = await processImage(file);
            handleRawImage(blob);
        } catch (error) {
            console.error('BG Removal failed', error);
            onError('去背失敗，已改回原始圖片');
            handleRawImage(file);
        } finally {
            setIsProcessingUploadBg(false);
        }
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (autoRemoveBg) {
            void processUploadedImageBg(file);
            return;
        }
        handleRawImage(file);
    };

    const handleManualUploadBgRemoval = async () => {
        if (!userImage) return;
        try {
            const response = await fetch(userImage);
            const blob = await response.blob();
            await processUploadedImageBg(blob);
        } catch {
            onError('圖片處理失敗');
        }
    };

    const handleGallerySelect = async (blobs: Blob[]) => {
        if (blobs[0]) {
            if (autoRemoveBg) {
                await processUploadedImageBg(blobs[0]);
            } else {
                handleRawImage(blobs[0]);
            }
        }
        setShowGallery(false);
    };

    const handleFontUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const fontName = `CustomFont_${Date.now()}`;
        const fontUrl = URL.createObjectURL(file);
        const fontFace = new FontFace(fontName, `url(${fontUrl})`);
        try {
            await fontFace.load();
            document.fonts.add(fontFace);
            const newFont = { id: fontName, label: file.name.substring(0, 10), family: fontName, className: '' };
            setCustomFonts((prev) => [...prev, newFont]);
            setSelectedFont(fontName);
        } catch {
            onError('字型載入失敗');
        }
    };

    const smartRemoveBackground = (base64: string): Promise<string> =>
        new Promise((resolve) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
                ctx.drawImage(img, 0, 0);
                const imageData = ctx.getImageData(0, 0, img.width, img.height);
                const data = imageData.data;
                const isBg = new Uint8Array(img.width * img.height);
                const corners = [[0, 0], [img.width - 1, 0], [0, img.height - 1], [img.width - 1, img.height - 1]];
                const queue: [number, number][] = [...corners as [number, number][]];
                const visited = new Uint8Array(img.width * img.height);
                const isGreen = (r: number, g: number, b: number) => g > 80 && g > r * 1.15 && g > b * 1.15;

                while (queue.length > 0) {
                    const [x, y] = queue.shift()!;
                    const idx = y * img.width + x;
                    if (visited[idx]) continue;
                    visited[idx] = 1;
                    const i = idx * 4;
                    if (isGreen(data[i], data[i + 1], data[i + 2])) {
                        isBg[idx] = 1;
                        if (x > 0) queue.push([x - 1, y]);
                        if (x < img.width - 1) queue.push([x + 1, y]);
                        if (y > 0) queue.push([x, y - 1]);
                        if (y < img.height - 1) queue.push([x, y + 1]);
                    }
                }

                const expandedBg = new Uint8Array(isBg);
                for (let y = 1; y < img.height - 1; y++) {
                    for (let x = 1; x < img.width - 1; x++) {
                        const idx = y * img.width + x;
                        if (isBg[idx] === 0 && (isBg[idx - 1] || isBg[idx + 1] || isBg[idx - img.width] || isBg[idx + img.width])) {
                            expandedBg[idx] = 1;
                        }
                    }
                }

                for (let i = 0; i < img.width * img.height; i++) {
                    if (expandedBg[i]) data[i * 4 + 3] = 0;
                }

                ctx.putImageData(imageData, 0, 0);
                resolve(canvas.toDataURL('image/png'));
            };
            img.src = base64;
        });

    const handleBgRemoval = async () => {
        if (!generatedResult) return;
        setIsRemovingBg(true);
        try {
            const processedUrl = await smartRemoveBackground(generatedResult.imageUrl);
            setGeneratedResult((prev) => (prev ? { ...prev, imageUrl: processedUrl } : null));
        } catch {
            onError('去背失敗');
        } finally {
            setIsRemovingBg(false);
        }
    };

    const buildFallbackThemeData = () => {
        const festivalConfig = FESTIVALS.find((item) => item.id === festival) || FESTIVALS[0];
        const styleConfig = CARD_STYLES.find((item) => item.id === style) || CARD_STYLES[0];
        const effectiveRecipientName = showRecipientName ? recipientName.trim() : '';
        const effectiveUserName = showUserName ? userName.trim() : '';
        const baseMessage = message.trim() || `祝 ${effectiveRecipientName || '你'} 節日快樂`;

        return {
            title: festivalConfig.label || 'Greeting Card',
            refinedMessage: effectiveUserName ? `${baseMessage}\n${effectiveUserName} 敬上` : baseMessage,
            visualPrompt: `A premium ${festivalConfig.label} greeting card in ${styleConfig.label} style. Warm festive composition, polished illustration details, elegant typography space, ${customPrompt || 'tasteful seasonal decorations'}.`,
        };
    };

    const optimizePrompt = async () => {
        if (!apiKey) {
            onNeedApiKey(provider);
            return;
        }
        if (!customPrompt.trim()) {
            setLocalError('請先輸入提示詞');
            return;
        }

        setIsOptimizingPrompt(true);
        setLocalError(null);

        try {
            const festivalConfig = FESTIVALS.find((item) => item.id === festival) || FESTIVALS[0];
            const styleConfig = CARD_STYLES.find((item) => item.id === style) || CARD_STYLES[0];

            if (provider === 'openai') {
                setCustomPrompt(`Premium ${festivalConfig.label} greeting card, ${styleConfig.label} style, ${customPrompt}, elegant composition, festive details, polished illustration, print-ready`);
                return;
            }

            const ai = new GoogleGenAI({ apiKey });
            const result = await ai.models.generateContent({
                model: GEMINI_GREETING_MODEL,
                contents: [{ parts: [{ text: `Optimize this image prompt for a ${festivalConfig.label} greeting card in ${styleConfig.label} style: "${customPrompt}"` }] }],
            });
            const optimized = result.candidates?.[0]?.content?.parts?.[0]?.text;
            if (optimized) setCustomPrompt(optimized.trim());
        } catch (error: any) {
            setLocalError(error?.message || '提示詞優化失敗');
        } finally {
            setIsOptimizingPrompt(false);
        }
    };

    const generateCardData = async () => {
        if (!apiKey) {
            onNeedApiKey(provider);
            throw new Error('API Key required');
        }

        const festivalConfig = FESTIVALS.find((item) => item.id === festival) || FESTIVALS[0];
        const styleConfig = CARD_STYLES.find((item) => item.id === style) || CARD_STYLES[0];
        const effectiveRecipientName = showRecipientName ? recipientName.trim() : '';
        const effectiveUserName = showUserName ? userName.trim() : '';
        const nameGuidance = [
            effectiveRecipientName ? `Recipient name: "${effectiveRecipientName}".` : 'Do not include recipient name on the card.',
            effectiveUserName ? `Sender name: "${effectiveUserName}".` : 'Do not include sender name on the card.',
        ].join(' ');

        const themeData = provider === 'openai'
            ? buildFallbackThemeData()
            : await (async () => {
                const ai = new GoogleGenAI({ apiKey });
                const systemPrompt = `Create a ${festivalConfig.id} greeting card prompt in ${styleConfig.id} style. JSON output: { "visualPrompt": "...", "refinedMessage": "...", "title": "..." }. Refined message should be in Traditional Chinese. Based on user message: "${message}". ${nameGuidance}`;
                const optimizeResult = await ai.models.generateContent({
                    model: GEMINI_GREETING_MODEL,
                    contents: [{ parts: [{ text: systemPrompt }] }],
                    config: { responseMimeType: 'application/json' },
                });

                const textResponse = optimizeResult.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
                return JSON.parse(textResponse.replace(/```json\n?|\n?```/g, '').trim());
            })();

        const normalizedAspect = aspectRatio === '2:3' ? '3:4' : aspectRatio === '3:2' ? '4:3' : aspectRatio;
        const imagePrompt = `Greeting card: ${themeData.visualPrompt}. Style: ${styleConfig.prompt}. Intensity: ${styleIntensity}. Aspect: ${aspectRatio}. ${customPrompt ? `Additional details: ${customPrompt}` : ''}`;

        if (provider === 'openai') {
            const imageUrl = await generateOpenAiImage(
                apiKey,
                imagePrompt,
                userImage,
                normalizedAspect,
                OPENAI_GREETING_MODEL,
                'medium',
            );
            return { imageUrl, theme: themeData };
        }

        const ai = new GoogleGenAI({ apiKey });
        const parts: any[] = [{ text: imagePrompt }];
        if (userImage) {
            parts.unshift({
                inlineData: {
                    data: userImage.split(',')[1],
                    mimeType: userImage.split(';')[0].split(':')[1] || 'image/jpeg',
                },
            });
        }

        const imageResult = await ai.models.generateContent({
            model: GEMINI_GREETING_MODEL,
            contents: [{ parts }],
            config: {
                // @ts-ignore
                imageConfig: { aspectRatio: normalizedAspect, imageSize: '1K' },
            },
        });

        const imagePart = imageResult.candidates?.[0]?.content?.parts?.find((part: any) => part.inlineData);
        if (!imagePart?.inlineData?.data) {
            throw new Error('Generation failed');
        }

        return {
            imageUrl: `data:image/png;base64,${imagePart.inlineData.data}`,
            theme: themeData,
        };
    };

    const handleGenerate = async () => {
        if (!userImage) {
            setLocalError('請先上傳圖片');
            return;
        }

        setIsGenerating(true);
        setLocalError(null);
        try {
            const { imageUrl, theme } = await generateCardData();
            const result: HistoryItem = {
                id: Date.now().toString(),
                imageUrl,
                title: theme.title || 'Greeting Card',
                message: theme.refinedMessage || message,
                festival: FESTIVALS.find((item) => item.id === festival)?.label,
                style: CARD_STYLES.find((item) => item.id === style)?.label,
                visualPrompt: theme.visualPrompt || '',
                timestamp: Date.now(),
            };
            setGeneratedResult(result);
            setHistory((prev) => [result, ...prev].slice(0, 10));
            onSuccess(imageUrl, result.title, result.visualPrompt);
        } catch (error: any) {
            setLocalError(error?.message || 'Generation failed');
        } finally {
            setIsGenerating(false);
        }
    };

    const wrapText = (ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number) => {
        const words = text.split('');
        let line = '';
        let currentY = y;
        for (let n = 0; n < words.length; n++) {
            const metrics = ctx.measureText(line + words[n]);
            if (metrics.width > maxWidth && n > 0) {
                ctx.fillText(line, x, currentY);
                line = words[n];
                currentY += lineHeight;
            } else {
                line += words[n];
            }
        }
        ctx.fillText(line, x, currentY);
    };

    const createCardCanvas = async (): Promise<HTMLCanvasElement | null> => {
        if (!generatedResult) return null;
        const mainImage = await loadImage(generatedResult.imageUrl);
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d')!;
        canvas.width = mainImage.width;
        canvas.height = mainImage.height;
        ctx.drawImage(mainImage, 0, 0);
        if (showTextOnCard && generatedResult.message) {
            ctx.fillStyle = textColor;
            ctx.font = `32px ${[...FONTS, ...customFonts].find((font) => font.id === selectedFont)?.family || 'serif'}`;
            wrapText(ctx, generatedResult.message, 50, 50, canvas.width - 100, 40);
        }
        return canvas;
    };

    const handleDownload = async () => {
        const canvas = await createCardCanvas();
        if (!canvas) return;
        const link = document.createElement('a');
        link.href = canvas.toDataURL('image/jpeg', 0.9);
        link.download = `Card_${Date.now()}.jpg`;
        link.click();
    };

    const canShare = Boolean(typeof navigator !== 'undefined' && navigator.share);

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-cream backdrop-blur-md border border-cream-dark shadow-sm rounded-[2rem] p-4">
                <div className="flex items-center justify-between gap-3">
                    <div>
                        <div className="text-xs font-black text-bronze-light uppercase tracking-widest">Provider</div>
                        <div className="text-[11px] text-bronze-light mt-1">
                            {provider === 'openai' ? `Model: ${OPENAI_GREETING_MODEL}` : `Model: ${GEMINI_GREETING_MODEL}`}
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={() => onNeedApiKey(provider)}
                        className="px-3 py-2 rounded-xl text-xs font-bold border bg-white border-cream-dark text-bronze-text hover:bg-cream-light transition-colors"
                    >
                        Set {PROVIDER_LABELS[provider]} API Key
                    </button>
                </div>
                <div className="grid grid-cols-2 gap-2 mt-3">
                    {(['gemini', 'openai'] as AiProvider[]).map((option) => (
                        <button
                            key={option}
                            type="button"
                            onClick={() => onProviderChange(option)}
                            className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all ${provider === option
                                ? 'bg-primary text-white border-primary shadow-md'
                                : 'bg-white border-cream-dark text-bronze-text hover:bg-white/80'}`}
                        >
                            {PROVIDER_LABELS[option]}
                        </button>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <ControlPanel
                    {...{
                        userImage,
                        autoRemoveBg,
                        isProcessingUploadBg,
                        festival,
                        style,
                        cardBgColor,
                        aspectRatio,
                        cardLayout,
                        faceSwapMode,
                        autoExpandBackground,
                        styleIntensity,
                        negativePrompt,
                        showTextOnCard,
                        selectedFont,
                        customFonts,
                        textColor,
                        customPrompt,
                        isOptimizingPrompt,
                        userName,
                        recipientName,
                        showRecipientName,
                        showUserName,
                        message,
                        isGenerating,
                        isRegenerating,
                        loadingStep,
                        localError,
                        fileInputRef,
                    }}
                    onFileUpload={handleFileUpload}
                    onManualBgRemoval={handleManualUploadBgRemoval}
                    onShowGallery={() => setShowGallery(true)}
                    onToggleAutoRemoveBg={() => setAutoRemoveBg(!autoRemoveBg)}
                    onSetFestival={setFestival}
                    onSetStyle={setStyle}
                    onSetCardBgColor={setCardBgColor}
                    onSetAspectRatio={setAspectRatio}
                    onSetCardLayout={setCardLayout}
                    onSetFaceSwapMode={setFaceSwapMode}
                    onSetAutoExpandBackground={setAutoExpandBackground}
                    onSetStyleIntensity={setStyleIntensity}
                    onSetNegativePrompt={setNegativePrompt}
                    onSetShowTextOnCard={setShowTextOnCard}
                    onSetSelectedFont={setSelectedFont}
                    onFontUpload={handleFontUpload}
                    onSetTextColor={setTextColor}
                    onSetCustomPrompt={setCustomPrompt}
                    onOptimizePrompt={optimizePrompt}
                    onSetRecipientName={setRecipientName}
                    onSetUserName={setUserName}
                    onSetShowRecipientName={setShowRecipientName}
                    onSetShowUserName={setShowUserName}
                    onSetMessage={setMessage}
                    onGenerate={handleGenerate}
                />

                <CardPreview
                    generatedResult={generatedResult}
                    cardLayout={cardLayout}
                    recipientName={recipientName}
                    userName={userName}
                    showRecipientName={showRecipientName}
                    showUserName={showUserName}
                    cardBgColor={cardBgColor}
                    showTextOnCard={showTextOnCard}
                    selectedFont={selectedFont}
                    customFonts={customFonts}
                    textColor={textColor}
                    isRegenerating={isRegenerating}
                    isRemovingBg={isRemovingBg}
                    canShare={canShare}
                    onRegenerate={handleGenerate}
                    onShare={() => { }}
                    onRemoveBg={handleBgRemoval}
                    onDownload={handleDownload}
                    onDownloadRaw={handleDownload}
                />

                <HistoryList
                    history={history}
                    currentId={generatedResult?.id}
                    onSelect={setGeneratedResult}
                />
            </div>

            {showGallery && <GalleryPicker onSelect={handleGallerySelect} onClose={() => setShowGallery(false)} />}
        </div>
    );
};

export default GreetingCardTab;

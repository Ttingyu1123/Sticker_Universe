import React, { useState, useRef } from 'react';
import { Upload, Download, Loader2, Sparkles, AlertCircle, X, FolderHeart, Check } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { Button } from '../../../components/ui/Button';
import { GalleryPicker } from '../../../components/GalleryPicker';

// Configuration Data
const HOLIDAYS = [
    { id: 'lunar_new_year', prompt: 'Lunar New Year', names: { 'zh-TW': '農曆新年', 'en': 'Lunar New Year' } },
    { id: 'lantern_festival', prompt: 'Lantern Festival', names: { 'zh-TW': '元宵節', 'en': 'Lantern Festival' } },
    { id: 'dragon_boat', prompt: 'Dragon Boat Festival', names: { 'zh-TW': '端午節', 'en': 'Dragon Boat Festival' } },
    { id: 'moon_festival', prompt: 'Mid-Autumn Festival', names: { 'zh-TW': '中秋節', 'en': 'Mid-Autumn Festival' } },
    { id: 'qixi', prompt: 'Qixi Festival, Chinese Valentines Day', names: { 'zh-TW': '七夕', 'en': 'Qixi Festival' } },
    { id: 'double_ninth', prompt: 'Double Ninth Festival', names: { 'zh-TW': '重陽節', 'en': 'Double Ninth Festival' } },
    { id: 'winter_solstice', prompt: 'Winter Solstice family gathering', names: { 'zh-TW': '冬至', 'en': 'Winter Solstice' } },
    { id: 'christmas', prompt: 'Christmas', names: { 'zh-TW': '聖誕節', 'en': 'Christmas' } },
    { id: 'halloween', prompt: 'Halloween', names: { 'zh-TW': '萬聖節', 'en': 'Halloween' } },
    { id: 'new_year', prompt: 'New Year', names: { 'zh-TW': '新年元旦', 'en': 'New Year' } },
    { id: 'valentines', prompt: 'Valentines Day', names: { 'zh-TW': '情人節', 'en': 'Valentines Day' } },
    { id: 'mothers_day', prompt: 'Mothers Day with carnations and love', names: { 'zh-TW': '母親節', 'en': 'Mothers Day' } },
    { id: 'fathers_day', prompt: 'Fathers Day', names: { 'zh-TW': '父親節', 'en': 'Fathers Day' } },
    { id: 'easter', prompt: 'Easter', names: { 'zh-TW': '復活節', 'en': 'Easter' } },
    { id: 'thanksgiving', prompt: 'Thanksgiving', names: { 'zh-TW': '感恩節', 'en': 'Thanksgiving' } },
    { id: 'tomb_sweeping', prompt: 'Tomb Sweeping Day', names: { 'zh-TW': '清明節', 'en': 'Tomb Sweeping Day' } },
    { id: 'birthday', prompt: 'Happy Birthday', names: { 'zh-TW': '生日快樂', 'en': 'Happy Birthday' } },
    { id: 'wedding', prompt: 'Happy Wedding', names: { 'zh-TW': '新婚快樂', 'en': 'Happy Wedding' } },
    { id: 'graduation', prompt: 'Graduation ceremony', names: { 'zh-TW': '畢業快樂', 'en': 'Happy Graduation' } },
    { id: 'get_well', prompt: 'Get well soon, wishing a speedy recovery', names: { 'zh-TW': '早日康復', 'en': 'Get Well Soon' } },
    { id: 'thank_you', prompt: 'A heartfelt thank you', names: { 'zh-TW': '感謝', 'en': 'Thank You' } },
    { id: 'good_luck', prompt: 'Wishing good luck', names: { 'zh-TW': '祝你好運', 'en': 'Good Luck' } },
    { id: 'teachers_day', prompt: 'Teachers Day', names: { 'zh-TW': '教師節', 'en': 'Teachers Day' } },
    { id: 'childrens_day', prompt: 'Childrens Day', names: { 'zh-TW': '兒童節', 'en': 'Childrens Day' } },
    { id: 'housewarming', prompt: 'Housewarming', names: { 'zh-TW': '喬遷之喜', 'en': 'Housewarming' } },
    { id: 'new_job', prompt: 'New Job', names: { 'zh-TW': '新工作', 'en': 'New Job' } },
    { id: 'custom', prompt: 'Custom Theme', names: { 'zh-TW': '自訂主題 (請輸入)', 'en': 'Custom Theme' } }
];

const STYLES = [
    { id: 'cute', prompt: 'Cute sticker style', names: { 'zh-TW': '可愛貼圖', 'en': 'Cute Sticker' } },
    { id: '3d', prompt: '3D render style', names: { 'zh-TW': '3D 渲染', 'en': '3D Render' } },
    { id: 'anime', prompt: 'a vibrant anime manga style', names: { 'zh-TW': '動漫風格', 'en': 'Anime' } },
    { id: 'pixel', prompt: 'Pixel art style', names: { 'zh-TW': '像素藝術', 'en': 'Pixel Art' } },
    { id: 'oil', prompt: 'Oil painting style', names: { 'zh-TW': '油畫風格', 'en': 'Oil Painting' } },
    { id: 'line', prompt: 'Line art style', names: { 'zh-TW': '線條藝術', 'en': 'Line Art' } },
    { id: 'vintage', prompt: 'Vintage poster style', names: { 'zh-TW': '復古海報', 'en': 'Vintage Poster' } },
    { id: 'realistic', prompt: 'Photorealistic style, identical to the original photo', names: { 'zh-TW': '真實風格 (保持原臉)', 'en': 'Realism (Keep Face)' } },
    { id: 'realistic-cosplay', prompt: 'Photorealistic style with themed costume', names: { 'zh-TW': '真實風格 (變裝)', 'en': 'Realism (Cosplay)' } },
    { id: 'illustration', prompt: 'Modern flat vector illustration', names: { 'zh-TW': '質感插畫', 'en': 'Flat Illustration' } },
    { id: 'comic', prompt: 'American comic book style', names: { 'zh-TW': '美式漫畫', 'en': 'American Comic' } },
    { id: 'watercolor', prompt: 'Soft watercolor painting style', names: { 'zh-TW': '夢幻水彩', 'en': 'Watercolor' } }
];

// ... (existing code)

interface HolidayStickerTabProps {
    apiKey: string;
    onError: (error: string) => void;
    onSuccess: (imageUrl: string, prompt: string, description?: string) => void;
}

const HolidayStickerTab: React.FC<HolidayStickerTabProps> = ({ apiKey, onError, onSuccess }) => {
    const [uploadedImage, setUploadedImage] = useState<string | null>(null);
    const [selectedHoliday, setSelectedHoliday] = useState(HOLIDAYS[0].id);
    const [selectedStyle, setSelectedStyle] = useState(STYLES[0].id);
    const [customName, setCustomName] = useState('');
    const [customHoliday, setCustomHoliday] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [results, setResults] = useState<string[]>(Array(3).fill(''));
    const [generationErrors, setGenerationErrors] = useState<boolean[]>(Array(3).fill(false));
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [batchSize, setBatchSize] = useState(3);
    const [showGallery, setShowGallery] = useState(false);

    // Auto Remove Background State (For Results)
    const [autoRemoveBg, setAutoRemoveBg] = useState(true);

    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setUploadedImage(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    /**
     * SMART CHROMA KEY REMOVAL (Green Screen)
     */
    const smartRemoveBackground = (base64: string): Promise<string> => {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = "anonymous";
            img.onload = () => {
                try {
                    const width = img.width;
                    const height = img.height;
                    const canvas = document.createElement('canvas');
                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d', { willReadFrequently: true });
                    if (!ctx) {
                        reject(new Error("Failed to get canvas context"));
                        return;
                    }
                    ctx.drawImage(img, 0, 0);

                    const imageData = ctx.getImageData(0, 0, width, height);
                    const data = imageData.data;
                    const isBg = new Uint8Array(width * height);

                    const corners = [[0, 0], [width - 1, 0], [0, height - 1], [width - 1, height - 1]];
                    const queue: [number, number][] = [...corners as [number, number][]];
                    const visited = new Uint8Array(width * height);

                    const isGreen = (r: number, g: number, b: number) => {
                        return g > 80 && g > r * 1.15 && g > b * 1.15;
                    };

                    while (queue.length > 0) {
                        const [x, y] = queue.shift()!;
                        const idx = y * width + x;
                        if (visited[idx]) continue;
                        visited[idx] = 1;

                        const i = idx * 4;
                        if (isGreen(data[i], data[i + 1], data[i + 2])) {
                            isBg[idx] = 1;
                            if (x > 0) queue.push([x - 1, y]);
                            if (x < width - 1) queue.push([x + 1, y]);
                            if (y > 0) queue.push([x, y - 1]);
                            if (y < height - 1) queue.push([x, y + 1]);
                        }
                    }

                    // Expansion / Despeckle simple pass
                    const expandedBg = new Uint8Array(isBg);
                    for (let y = 1; y < height - 1; y++) {
                        for (let x = 1; x < width - 1; x++) {
                            const idx = y * width + x;
                            if (isBg[idx] === 0) {
                                if (isBg[idx - 1] || isBg[idx + 1] || isBg[idx - width] || isBg[idx + width]) {
                                    expandedBg[idx] = 1;
                                }
                            }
                        }
                    }

                    for (let i = 0; i < width * height; i++) {
                        if (expandedBg[i]) {
                            data[i * 4 + 3] = 0;
                        }
                    }

                    ctx.putImageData(imageData, 0, 0);
                    resolve(canvas.toDataURL('image/png'));
                } catch (e) {
                    reject(e);
                }
            };
            img.onerror = (e) => reject(e);
            img.src = base64;
        });
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setUploadedImage(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleGallerySelect = async (blobs: Blob[]) => {
        if (blobs.length > 0) {
            const blob = blobs[0];
            const reader = new FileReader();
            reader.onloadend = () => {
                setUploadedImage(reader.result as string);
            };
            reader.readAsDataURL(blob);
        }
        setShowGallery(false);
    };

    const callGeminiAPI = async (prompt: string, index: number, imageBase64: string) => {
        if (!apiKey) throw new Error('API Key is missing');

        const ai = new GoogleGenAI({ apiKey });

        // Use the accepted model name. If 2.5 fails, user might need to change it, 
        // but we assume the BYOK skill implies using the SDK specifically handles the request structure better.
        // We will use the model name the user provided, but clean it up if needed.
        const model = 'gemini-3-pro-image-preview';

        const config = {
            imageConfig: {
                aspectRatio: "1:1",
                imageSize: "1K" // Based on SKILL.md
            }
        };

        try {
            const response = await ai.models.generateContent({
                model: model,
                contents: [{
                    parts: [
                        { text: prompt },
                        { inlineData: { mimeType: "image/jpeg", data: imageBase64 } }
                    ]
                }],
                config: config
            });

            const candidate = response.candidates?.[0];

            // Check for safety finish reason
            if (candidate?.finishReason !== "STOP" && candidate?.finishReason !== undefined) {
                console.warn("Model finished with reason:", candidate.finishReason);
            }

            const imagePart = candidate?.content?.parts?.find((p: any) => p.inlineData);

            if (imagePart && imagePart.inlineData?.data) {
                let imgUrl = `data: image/png;base64,${imagePart.inlineData.data}`;

                // Auto Remove Background if Enabled
                if (autoRemoveBg) {
                    try {
                        imgUrl = await smartRemoveBackground(imgUrl);
                    } catch (e) {
                        console.warn("Auto background removal failed", e);
                    }
                }

                setResults(prev => {
                    const newResults = [...prev];
                    newResults[index] = imgUrl;
                    return newResults;
                });

                // Auto-save to Gallery
                // We use a simplified prompt for the gallery title
                const displayHolidayName = selectedHoliday === 'custom' ? customHoliday : HOLIDAYS.find(h => h.id === selectedHoliday)?.names['zh-TW'];
                const stickerTitle = `[${displayHolidayName}] ${STYLES.find(s => s.id === selectedStyle)?.names['zh-TW']} Sticker`;
                onSuccess(imgUrl, stickerTitle);
            } else {
                const textContent = candidate?.content?.parts?.find((p: any) => p.text)?.text;
                const errorMsg = textContent ? `Model Refusal: ${textContent}` : `No image/text returned. Raw Candidate: ${JSON.stringify(candidate).substring(0, 200)}...`;
                throw new Error(errorMsg);
            }

        } catch (error: any) {
            console.error(`Generation failed for slot ${index}`, error);
            setGenerationErrors(prev => {
                const newErrors = [...prev];
                // Ensure array size matches batch size if changed dynamically, 
                // though usually we reset strictly on generate.
                if (newResults.length <= index) {
                    newResults.length = index + 1;
                    newResults.fill(false, prev.length);
                }
                newErrors[index] = true;
                return newErrors;
            });

            let msg = error.message || '生成失敗';
            if (msg.includes('503')) msg = '伺服器忙碌中 (Model Overloaded)，請稍後再試。';
            if (msg.includes('404')) msg = '找不到模型 (Model Not Found)。請檢查模型名稱是否正確。';
            setErrorMessage(msg);
        }
    };

    const generateStickers = async () => {
        if (!uploadedImage || !apiKey) {
            const msg = apiKey ? '請先上傳照片' : '請先設定 API Key';
            setErrorMessage(msg);
            onError(msg);
            return;
        }

        setIsGenerating(true);
        setErrorMessage(null);
        setResults(Array(batchSize).fill('')); // Clear previous results
        setGenerationErrors(Array(batchSize).fill(false)); // Clear errors

        const holiday = HOLIDAYS.find(h => h.id === selectedHoliday)!;
        let holidayPrompt = holiday.prompt;

        if (selectedHoliday === 'custom') {
            if (!customHoliday.trim()) {
                const msg = '請輸入自訂節日主題';
                setErrorMessage(msg);
                onError(msg);
                setIsGenerating(false);
                return;
            }
            holidayPrompt = customHoliday;
        }

        const style = STYLES.find(s => s.id === selectedStyle)!;
        const imageBase64 = uploadedImage.split(',')[1];

        const promptVariations = [
            "surrounded by festive decorations that are part of the sticker design.",
            "interacting with related food and drinks.",
            "performing a traditional activity.",
            "in a joyful celebratory pose with integrated background elements."
        ];

        const promises = Array.from({ length: batchSize }).map((_, index) => {
            // Cycle through variations if batchSize > variations length
            const variation = promptVariations[index % promptVariations.length];

            // Define Identity Instruction based on style
            let identityInstruction = '';
            if (selectedStyle === 'realistic-cosplay') {
                identityInstruction = `
            CHARACTER IDENTITY (FACE ONLY - COSPLAY MODE):
            - You MUST preserve the FACIAL FEATURES (eyes, nose, mouth, face shape) of the person in the uploaded image EXACTLY.
            - However, you MUST CHANGE the hair style and clothing to match the "${holidayPrompt}" theme.
            - It should look like the specific person from the photo is wearing a full costume and wig for the holiday.`;
            } else {
                identityInstruction = `
            CHARACTER IDENTITY (TOP PRIORITY):
            - You MUST preserve the facial features, hair style, and key characteristics of the person in the uploaded image.
            - Do NOT replace the person with a generic character. The goal is to make the user recognizable in the sticker.
            - Integrate the holiday elements around THEM, do not change who they look like.`;
            }

            let basePrompt = `Create a single die-cut sticker of a person who strongly resembles the person in the provided image.
            The sticker should be in ${style.prompt} style, specifically for ${holidayPrompt}.
            
            ${identityInstruction}

            COMPOSITION:
            - The character and ${holidayPrompt} elements/accessories must be grouped together as a single cohesive unit.
            - ${variation}
            - Do not leave floating distinct background elements; everything should be connected or framed as one sticker item.

            STICKER OUTLINE (IMPORTANT):
            - Add a thick, white die-cut border (sticker edge) surrounding the entire unified composition.

            BACKGROUND (CRITICAL CHROMA KEY):
            - The background OUTSIDE the white sticker border MUST be a 100% SOLID, FLAT, PURE NEON GREEN (#00FF00). 
            - No gradients, no textures, no shadows.
            
            TEXT RESTRICTIONS:
            - Do NOT write the name of the holiday/theme ("${holidayPrompt}") as text in the sticker.
            - The sticker should only contain text if explicitly requested below.`;

            if (customName) {
                basePrompt += ` Include the text "${customName}" artistically in the sticker.`;
            }

            // Using the user's specific model
            // URL logic needs to be inside the map to use the index if needed, but here we just call the function
            // Note: Use 'gemini-2.0-flash-exp' or similar if 2.5 is not available, but I'll try to stick to a working image model.
            // The user's code had `gemini-2.5-flash-image-preview`.
            // I will try to use a generally available model that supports images if 2.5 fails, but let's try 2.0-flash or pro-exp which handles images.
            // Actually, for safety, I will switch the model in the callGeminiAPI function to `gemini-2.0-flash-exp` which is known to handle image generation in some contexts, or stick to the user's strictly.
            // Let's use `gemini-2.0-flash-exp` as a safer bet for "newest flash" if 2.5 is hypothetical. 
            // WAITING: The user provided specific code. I should try to respect it. 
            // I'll update the `callGeminiAPI` to use the model ID from their code but handle 404s.

            return callGeminiAPI(basePrompt, index, imageBase64);
        });

        try {
            await Promise.all(promises);
        } catch (error) {
            console.error("Batch generation error", error);
            onError('生成過程中發生錯誤');
        } finally {
            setIsGenerating(false);
        }
    };

    // Override the callGeminiAPI in the render scope to use the specific model from the user's code
    // I already defined it above, but let's refine the URL there.
    // User's URL: `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image-preview:generateContent`

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Controls Panel */}
                <div className="lg:col-span-1 space-y-6 bg-white/40 backdrop-blur-md border border-cream-dark shadow-sm rounded-[2rem] p-8">

                    {/* 1. Upload */}
                    <div className="space-y-3">
                        <label className="text-sm font-black flex items-center gap-2 text-bronze-light uppercase tracking-widest">
                            <Upload size={18} className="text-primary" /> 1. 上傳您的照片
                        </label>
                        <div
                            className={`group border-3 border-dashed rounded-[2rem] p-6 text-center cursor-pointer transition-all duration-300 min-h-[200px] flex flex-col items-center justify-center ${uploadedImage ? 'border-primary bg-primary/5' : 'border-cream-dark bg-cream-light/50 hover:border-primary/50 hover:bg-white/60'
                                }`}
                            onClick={() => fileInputRef.current?.click()}
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={handleDrop}
                        >
                            {uploadedImage ? (
                                <div className="relative w-full h-full">
                                    <img src={uploadedImage} alt="Preview" className="max-w-full max-h-48 object-contain mx-auto rounded-3xl shadow-md" />
                                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20 rounded-3xl backdrop-blur-sm">
                                        <span className="bg-white px-3 py-1 rounded-full text-xs font-bold text-bronze-text">更換圖片</span>
                                    </div>
                                </div>
                            ) : (
                                <div className="py-4 text-bronze-light">
                                    <div className="bg-white p-4 rounded-full inline-block mb-3 shadow-md shadow-primary/10 group-hover:scale-110 transition-transform text-primary">
                                        <Upload size={24} />
                                    </div>
                                    <span className="text-[10px] opacity-70 mt-1 block">建議使用大頭照</span>
                                </div>
                            )}

                        </div>
                        <button
                            onClick={(e) => { e.stopPropagation(); setShowGallery(true); }}
                            className="mt-3 flex items-center gap-2 px-4 py-2 bg-secondary/10 hover:bg-secondary/20 text-secondary rounded-xl text-sm font-bold transition-colors mx-auto"
                        >
                            <FolderHeart size={16} />
                            從作品集選取
                        </button>

                        <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
                    </div>

                    {/* Name Input */}
                    <div className="space-y-3">
                        <label className="text-xs font-black text-bronze-light uppercase tracking-widest pl-1">貼圖文字 (選填)</label>
                        <input
                            type="text"
                            value={customName}
                            onChange={(e) => setCustomName(e.target.value)}
                            placeholder="中英文皆可 (例如：Happy New Year, 新年快樂)"
                            className="w-full px-4 py-3 bg-cream-light border border-cream-dark rounded-2xl font-bold text-xs outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 text-bronze-text shadow-inner placeholder-bronze-light"
                        />
                    </div>

                    {/* 2. Select Holiday */}
                    <div className="space-y-3">
                        <label className="text-xs font-black text-bronze-light uppercase tracking-widest pl-1">2. 選擇節日</label>
                        <div className="relative">
                            <select
                                value={selectedHoliday}
                                onChange={(e) => setSelectedHoliday(e.target.value)}
                                className="w-full px-4 py-3 bg-cream-light border border-cream-dark rounded-2xl font-bold text-xs outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 text-bronze-text shadow-inner appearance-none cursor-pointer"
                            >
                                {HOLIDAYS.map(h => (
                                    <option key={h.id} value={h.id}>{h.names['zh-TW']} ({h.names['en']})</option>
                                ))}
                            </select>
                            {/* Custom Arrow */}
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-bronze-light">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
                            </div>
                        </div>
                        {selectedHoliday === 'custom' && (
                            <input
                                type="text"
                                value={customHoliday}
                                onChange={(e) => setCustomHoliday(e.target.value)}
                                placeholder="請輸入自訂節日或主題 (例如：萬聖節派對)"
                                className="w-full px-4 py-3 mt-2 bg-cream-light border border-cream-dark rounded-2xl font-bold text-xs outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 text-bronze-text shadow-inner placeholder-bronze-light animate-in fade-in slide-in-from-top-1"
                            />
                        )}
                    </div>

                    {/* 3. Select Style */}
                    <div className="space-y-3">
                        <label className="text-xs font-black text-bronze-light uppercase tracking-widest pl-1">3. 選擇風格</label>
                        <div className="relative">
                            <select
                                value={selectedStyle}
                                onChange={(e) => setSelectedStyle(e.target.value)}
                                className="w-full px-4 py-3 bg-cream-light border border-cream-dark rounded-2xl font-bold text-xs outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 text-bronze-text shadow-inner appearance-none cursor-pointer"
                            >
                                {STYLES.map(s => (
                                    <option key={s.id} value={s.id}>{s.names['zh-TW']}</option>
                                ))}
                            </select>
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-bronze-light">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
                            </div>
                        </div>
                    </div>

                    {/* Batch Size Selection */}
                    <div className="space-y-3">
                        <label className="text-xs font-black text-bronze-light uppercase tracking-widest pl-1">4. 生成張數</label>
                        <div className="flex gap-2">
                            {[1, 2, 3, 4].map(num => (
                                <button
                                    key={num}
                                    onClick={() => setBatchSize(num)}
                                    className={`flex-1 py-2 rounded-xl font-bold text-sm transition-all border ${batchSize === num
                                        ? 'bg-primary text-white border-primary shadow-md'
                                        : 'bg-cream-light border-cream-dark text-bronze-light hover:bg-cream-light/80'
                                        }`}
                                >
                                    {num}
                                </button>
                            ))}
                        </div>
                    </div>


                    {/* Auto Remove Background Toggle */}
                    <div
                        onClick={() => setAutoRemoveBg(!autoRemoveBg)}
                        className={`flex items-center gap-3 p-3 rounded-2xl border transition-all cursor-pointer mb-4 ${autoRemoveBg ? 'bg-primary/5 border-primary shadow-sm' : 'bg-transparent border-transparent hover:bg-black/5'}`}
                    >
                        <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors ${autoRemoveBg ? 'bg-primary border-primary' : 'border-bronze-light/50'}`}>
                            {autoRemoveBg && <Check size={14} className="text-white" />}
                        </div>
                        <div className="flex-1">
                            <div className={`text-sm font-bold ${autoRemoveBg ? 'text-primary' : 'text-bronze-text'}`}>
                                ✨ 自動去背 (Auto Remove Background)
                            </div>
                            <div className="text-[10px] text-bronze-light">生成後自動移除綠幕背景</div>
                        </div>
                    </div>

                    {/* Generate Button */}
                    <Button
                        onClick={generateStickers}
                        disabled={isGenerating || !uploadedImage}
                        className="w-full h-16 mt-4 text-lg shadow-xl shadow-primary/20 bg-primary hover:bg-primary-hover active:scale-[0.99] transition-all rounded-2xl border-none"
                    >
                        {isGenerating ? (
                            <><Loader2 className="mr-2 h-6 w-6 animate-spin" /> 生成中...</>
                        ) : (
                            <><Sparkles className="mr-2 h-6 w-6" /> 生成節日貼圖</>
                        )}
                    </Button>

                    {/* Error Message Display */}
                    {errorMessage && (
                        <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
                            <div className="bg-red-100 p-1.5 rounded-full mt-0.5">
                                <X size={14} className="text-red-600" />
                            </div>
                            <div className="flex-1">
                                <h4 className="text-xs font-bold text-red-700 mb-0.5">生成失敗 (Generation Failed)</h4>
                                <p className="text-xs text-red-600 leading-relaxed">{errorMessage}</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Results Panel */}
                <div className="lg:col-span-2 space-y-6 bg-white/40 backdrop-blur-md border border-cream-dark shadow-sm rounded-[2rem] p-8">
                    <div className="flex items-center justify-between border-b border-cream-dark/50 pb-4">
                        <h2 className="text-sm font-black flex items-center gap-2 text-bronze-light uppercase tracking-widest">
                            <Sparkles size={18} className="text-yellow-400" /> 您的專屬貼圖結果
                        </h2>
                        {results.some(r => r) && (
                            <span className="text-[10px] font-bold bg-cream-light px-3 py-1 rounded-full text-bronze-light border border-cream-dark">{results.length} Variations</span>
                        )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        {Array.from({ length: Math.max(results.length, batchSize) }).map((_, index) => (
                            <div key={index} className={`aspect-square relative bg-white border border-cream-dark rounded-3xl overflow-hidden group hover:shadow-xl transition-all hover:-translate-y-1 ${index >= batchSize && !results[index] ? 'hidden' : ''}`}>
                                {isGenerating && index < batchSize ? (
                                    <div className="flex flex-col items-center justify-center h-full gap-4 bg-cream-light/30">
                                        <div className="relative w-12 h-12">
                                            <div className="absolute inset-0 border-4 border-cream-dark rounded-full"></div>
                                            <div className="absolute inset-0 border-4 border-primary rounded-full border-t-transparent animate-spin"></div>
                                        </div>
                                        <span className="text-xs font-bold text-bronze-light animate-pulse">生成中...</span>
                                    </div>
                                ) : results[index] ? (
                                    <div className="relative w-full h-full p-4" style={{ backgroundImage: 'radial-gradient(#d6d3d1 1px, transparent 1px)', backgroundSize: '8px 8px' }}>
                                        <img src={results[index]} alt={`Result ${index + 1}`} className="w-full h-full object-contain drop-shadow-lg" />
                                        <div className="absolute inset-0 bg-bronze-text/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                                            <a
                                                href={results[index]}
                                                download={`holiday-sticker-${index + 1}.png`}
                                                className="bg-white text-primary px-6 py-3 rounded-2xl text-sm font-bold hover:bg-cream-light flex items-center gap-2 shadow-xl transform hover:scale-105 transition-all"
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                <Download size={18} /> 下載
                                            </a>
                                        </div>
                                    </div>
                                ) : generationErrors[index] ? (
                                    <div className="flex flex-col items-center justify-center h-full text-center p-4 bg-red-50/50">
                                        <AlertCircle className="mx-auto mb-2 text-red-400" size={32} />
                                        <span className="text-xs font-bold text-red-500">生成失敗</span>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-full text-bronze-light/30 bg-cream-light/20">
                                        <div className="bg-cream-dark/20 p-4 rounded-full mb-2">
                                            <Sparkles size={24} />
                                        </div>
                                        <span className="text-xs font-bold">貼圖位置 {index + 1}</span>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    {!uploadedImage && !isGenerating && !results[0] && (
                        <div className="text-center py-12 px-6 rounded-3xl border-2 border-dashed border-cream-dark bg-cream-light/30">
                            <h3 className="text-bronze text-sm font-black mb-2">準備開始製作！</h3>
                            <p className="text-xs text-bronze-light">請在左側上傳照片並設定節日，AI 將為您生成獨一無二的貼圖。</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Gallery Picker Modal */}
            {
                showGallery && (
                    <GalleryPicker
                        onSelect={handleGallerySelect}
                        onClose={() => setShowGallery(false)}
                    />
                )
            }
        </div >
    );
};

export default HolidayStickerTab;

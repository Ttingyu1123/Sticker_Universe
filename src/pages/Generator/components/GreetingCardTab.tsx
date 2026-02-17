
import React, { useState, useRef, useEffect } from 'react';
import {
    Settings, Upload, RefreshCw,
    Scissors, AlertTriangle, Check, Trash2, Star, Eye, FileArchive, FolderHeart, Heart, Clock, History, Share2,
    Sparkles, Download, Image as ImageIcon
} from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { GalleryPicker } from '../../../components/GalleryPicker';
import {
    CARD_LAYOUTS,
    CardLayoutId
} from '../types';
import { processImage } from '../../Packager/services/ai/backgroundRemoval';

// --- Constants & DB ---
const FESTIVALS = [
    { id: 'new-year', label: '🧧 Lunar New Year (農曆新年 - 2026 Year of the Horse 🐎)', icon: '🧧' },
    { id: 'christmas', label: '🎄 Christmas (聖誕節)', icon: '🎄' },
    { id: 'birthday', label: '🎂 Birthday (生日)', icon: '🎂' },
    { id: 'valentine', label: '❤️ Valentine\'s Day (情人節)', icon: '❤️' },
    { id: 'mother', label: '💐 Mother\'s Day (母親節)', icon: '💐' },
    { id: 'father', label: '👔 Father\'s Day (父親節)', icon: '👔' },
    { id: 'graduation', label: '🎓 Graduation (畢業季)', icon: '🎓' },
    { id: 'thank-you', label: '🙏 Thank You (感謝卡)', icon: '🙏' },
    { id: 'general', label: '✨ General Greeting (日常問候)', icon: '✨' },
];

const CARD_STYLES = [
    // 攝影風格
    { id: 'realistic-photo', label: '📸 Realistic Photo (真實攝影)', prompt: 'Professional photography, realistic human features, natural lighting, high detail, photorealistic portrait' },
    { id: 'vintage-photo', label: '📷 Vintage Photo (復古照片)', prompt: 'Vintage photo style, film grain, warm tones, nostalgic atmosphere, retro photography' },
    { id: 'polaroid', label: '📱 Polaroid (拍立得)', prompt: 'Polaroid instant photo style, white border frame, casual snapshot, warm vintage colors' },
    { id: 'magazine-cover', label: '📰 Magazine Cover (雜誌封面)', prompt: 'Professional magazine cover style, fashion photography, studio lighting, glamorous portrait' },

    // 繪畫風格
    { id: 'watercolor', label: '🎨 Watercolor (水彩畫)', prompt: 'Soft watercolor painting style, dreamy, artistic, elegant, pastel colors' },
    { id: 'oil-painting', label: '🖼️ Oil Painting (油畫)', prompt: 'Classic oil painting style, rich textures, vibrant colors, masterpiece, fine art' },
    { id: 'illustration', label: '✨ Modern Illustration (現代插畫)', prompt: 'Modern digital illustration, clean lines, vibrant colors, contemporary art style' },
    { id: 'chinese-painting', label: '🖌️ Chinese Ink (國畫水墨)', prompt: 'Traditional Chinese ink painting style, elegant brushstrokes, minimalist, artistic zen' },

    // 卡通/動畫風格
    { id: '3d-cartoon', label: '🧸 3D Cartoon (3D卡通)', prompt: 'Pixar style 3D cute cartoon, soft lighting, vibrant colors, 3D rendering' },
    { id: 'ghibli', label: '🍃 Anime Style (宮崎駿風)', prompt: 'Studio Ghibli style, lush background, detailed anime aesthetic, whimsical' },
    { id: 'chibi', label: '🎀 Chibi Style (Q版風格)', prompt: 'Cute chibi style, super deformed characters, big eyes, adorable proportions' },
    { id: 'comic', label: '💥 Comic Book (美式漫畫)', prompt: 'Comic book style, bold outlines, vibrant colors, dynamic composition, pop art' },

    // 手工藝風格
    { id: 'paper-cut', label: '✂️ Paper Cutout (剪紙藝術)', prompt: 'Layered paper cut style, intricate details, shadow depth, craft aesthetic' },
    { id: 'collage', label: '🎨 Collage Art (拼貼藝術)', prompt: 'Artistic collage style, mixed media, creative composition, textured layers' },

    // 特殊風格
    { id: 'minimalist', label: '✏️ Minimalist (極簡線條)', prompt: 'Minimalist line art, clean background, modern design, simple and elegant' },
    { id: 'pixel-art', label: '👾 Pixel Art (像素風)', prompt: 'Retro pixel art style, 16-bit, vibrant colors, nostalgic gaming aesthetic' },
    { id: 'fantasy', label: '🌟 Fantasy Art (奇幻藝術)', prompt: 'Fantasy art style, magical atmosphere, dreamy lighting, ethereal and enchanting' },
];

const FONTS = [
    { id: 'serif', label: '經典襯線 (Serif)', family: 'serif', className: 'font-serif' },
    { id: 'sans', label: '現代無襯線 (Sans)', family: 'sans-serif', className: 'font-sans' },
    { id: 'mono', label: '特務打字機 (Mono)', family: 'monospace', className: 'font-mono' },
    { id: 'cursive', label: '手寫風格 (Cursive)', family: 'cursive', className: 'italic' },
];

const TEXT_COLORS = [
    { id: '#333333', label: '經典黑', value: '#333333', class: 'bg-zinc-800' },
    { id: '#78350f', label: '古銅金', value: '#78350f', class: 'bg-amber-900' },
    { id: '#1e3a8a', label: '深海藍', value: '#1e3a8a', class: 'bg-blue-900' },
    { id: '#881337', label: '酒紅色', value: '#881337', class: 'bg-rose-900' },
    { id: '#064e3b', label: '森林綠', value: '#064e3b', class: 'bg-emerald-900' },
    { id: '#ffffff', label: '純淨白', value: '#ffffff', class: 'bg-white border border-gray-300' },
];

const ASPECT_RATIOS = [
    { id: '1:1', label: '1:1 (方形 / IG 貼文)', value: '1:1' },
    { id: '3:4', label: '3:4 (直式賀卡)', value: '3:4' },
    { id: '4:3', label: '4:3 (橫式賀卡)', value: '4:3' },
    { id: '9:16', label: '9:16 (限時動態 / 手機桌布)', value: '9:16' },
    { id: '16:9', label: '16:9 (電腦桌布)', value: '16:9' },
    { id: '2:3', label: '2:3 (直式明信片)', value: '3:4' }, // Map to closest supported ratio or try direct
    { id: '3:2', label: '3:2 (橫式明信片)', value: '4:3' }, // Map to closest supported ratio or try direct
];

const CARD_BACKGROUNDS = [
    { id: 'cream', value: '#FDFCF8', label: '奶油白 (預設)', class: 'bg-[#FDFCF8] border border-stone-200' },
    { id: 'white', value: '#FFFFFF', label: '純白', class: 'bg-white border border-gray-200' },
    { id: 'pink', value: '#FDF2F8', label: '櫻花粉', class: 'bg-pink-50 border border-pink-200' },
    { id: 'blue', value: '#EFF6FF', label: '天空藍', class: 'bg-blue-50 border border-blue-200' },
    { id: 'green', value: '#F0FDF4', label: '薄荷綠', class: 'bg-green-50 border border-green-200' },
    { id: 'stone', value: '#1C1917', label: '質感黑', class: 'bg-stone-900 border border-stone-700' },
];

interface GeneratedResult {
    imageUrl: string;
    title: string;
    message: string;
    festival?: string;
    style?: string;
    visualPrompt: string;
}

interface HistoryItem extends GeneratedResult {
    id: string;
    timestamp: number;
}

interface GreetingCardTabProps {
    apiKey: string;
    onError: (msg: string) => void;
    onNeedApiKey: () => void;
    onSuccess: (imageUrl: string, prompt: string, description?: string) => void;
}

const GreetingCardTab: React.FC<GreetingCardTabProps> = ({ apiKey, onError, onNeedApiKey, onSuccess }) => {
    // State
    const [userImage, setUserImage] = useState<string | null>(null);
    const [festival, setFestival] = useState('new-year');
    const [style, setStyle] = useState('watercolor');
    const [aspectRatio, setAspectRatio] = useState('3:4'); // Image Aspect Ratio

    // Lazy init history to prevent overwriting with empty array on mount
    const [history, setHistory] = useState<HistoryItem[]>(() => {
        try {
            const saved = localStorage.getItem('greeting_card_history');
            return saved ? JSON.parse(saved) : [];
        } catch (e) {
            console.error("Failed to load history", e);
            return [];
        }
    });

    const [userName, setUserName] = useState("");
    const [recipientName, setRecipientName] = useState("");
    const [cardBgColor, setCardBgColor] = useState('#FDFCF8');
    const [message, setMessage] = useState("");
    const [customPrompt, setCustomPrompt] = useState(""); // 自定義提示詞
    const [faceSwapMode, setFaceSwapMode] = useState(false); // 換臉模式：保持臉部，更換服裝
    const [showTextOnCard, setShowTextOnCard] = useState(true); // 賀卡上是否顯示祝福語
    const [selectedFont, setSelectedFont] = useState('serif'); // 字體
    const [customFonts, setCustomFonts] = useState<{ id: string, label: string, family: string, className: string }[]>([]); // 自定義字型
    const [textColor, setTextColor] = useState('#333333'); // 文字顏色
    const [isGenerating, setIsGenerating] = useState(false);
    const [isRegenerating, setIsRegenerating] = useState(false);
    const [isRemovingBg, setIsRemovingBg] = useState(false); // 去背狀態
    const [isOptimizingPrompt, setIsOptimizingPrompt] = useState(false); // AI 優化提示詞中
    const [generatedResult, setGeneratedResult] = useState<any>(null);
    const [localError, setLocalError] = useState<string | null>(null);
    const [showGallery, setShowGallery] = useState(false);
    const [loadingStep, setLoadingStep] = useState(0);

    // New Visual Customization State
    const [cardLayout, setCardLayout] = useState<CardLayoutId>('classic');

    // Deep AI Integration State
    const [styleIntensity, setStyleIntensity] = useState(80); // 0-100
    const [autoExpandBackground, setAutoExpandBackground] = useState(true);
    const [negativePrompt, setNegativePrompt] = useState("");

    // Auto Remove Background State
    const [autoRemoveBg, setAutoRemoveBg] = useState(false);
    const [isProcessingUploadBg, setIsProcessingUploadBg] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);

    // Loading Text Animation
    useEffect(() => {
        if (!isGenerating) return;
        const texts = [
            "正在構思賀卡構圖...",
            "AI 畫家正在揮毫...",
            "正在挑選最適合的配色...",
            "正在為您寫下祝福...",
            "最後修飾中..."
        ];
        let step = 0;
        setLoadingStep(0);
        const interval = setInterval(() => {
            step = (step + 1) % texts.length;
            setLoadingStep(step);
        }, 3000);
        return () => clearInterval(interval);
    }, [isGenerating]);

    // Save history to local storage with error handling
    useEffect(() => {
        try {
            localStorage.setItem('greeting_card_history', JSON.stringify(history));
        } catch (e) {
            console.error("Failed to save history to localStorage (Quota Exceeded?)", e);
            // Optionally could try to save fewer items here
        }
    }, [history]);

    // Helper: Load Image
    const loadImage = (src: string): Promise<HTMLImageElement> => {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = "anonymous";
            img.onload = () => resolve(img);
            img.onerror = (e) => reject(e);
            img.src = src;
        });
    };

    // Helper: File Upload
    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (autoRemoveBg) {
                processUploadedImageBg(file);
            } else {
                const reader = new FileReader();
                reader.onloadend = () => setUserImage(reader.result as string);
                reader.readAsDataURL(file);
            }
        }
    };

    const processUploadedImageBg = async (file: File | Blob) => {
        setIsProcessingUploadBg(true);
        try {
            const blob = await processImage(file);
            const reader = new FileReader();
            reader.onloadend = () => setUserImage(reader.result as string);
            reader.readAsDataURL(blob);
        } catch (err) {
            console.error("BG Removal failed", err);
            onError("去背失敗，已顯示原始圖片");
            // Fallback to original if file is available
            if (file instanceof File || file instanceof Blob) {
                const reader = new FileReader();
                reader.onloadend = () => setUserImage(reader.result as string);
                reader.readAsDataURL(file);
            }
        } finally {
            setIsProcessingUploadBg(false);
        }
    };

    // Manual Trigger for Uploaded Image
    const handleManualUploadBgRemoval = async () => {
        if (!userImage) return;
        // Convert base64 to Blob
        try {
            const res = await fetch(userImage);
            const blob = await res.blob();
            await processUploadedImageBg(blob);
        } catch (e) {
            onError("圖片處理失敗");
        }
    };

    const handleGallerySelect = async (blobs: Blob[]) => {
        if (blobs.length > 0) {
            const blob = blobs[0];
            const reader = new FileReader();
            reader.onloadend = () => {
                const result = reader.result as string;
                if (autoRemoveBg) {
                    // Convert back to blob for consistency or just call process immediately
                    // Since we have blob, just use it
                    processUploadedImageBg(blob);
                } else {
                    setUserImage(result);
                }
            };
            reader.readAsDataURL(blob);
        }
        setShowGallery(false);
    };

    // Helper: Font Upload
    const handleFontUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const fontName = `CustomFont_${Date.now()} `;
        const fontUrl = URL.createObjectURL(file);
        const fontFace = new FontFace(fontName, `url(${fontUrl})`);

        try {
            await fontFace.load();
            document.fonts.add(fontFace);

            const newFont = {
                id: fontName,
                label: file.name.substring(0, 10) + (file.name.length > 10 ? '...' : ''),
                family: fontName,
                className: ''
            };

            setCustomFonts(prev => [...prev, newFont]);
            setSelectedFont(fontName);
        } catch (err) {
            console.error('Font loading failed:', err);
            onError('字型載入失敗，請確認檔案格式正確');
        }
    };

    // SMART REMOVE BACKGROUND LOGIC (Copied from StyleStickerTab)
    const smartRemoveBackground = (base64: string): Promise<string> => {
        return new Promise((resolve) => {
            const img = new Image();
            img.crossOrigin = "anonymous";
            img.onload = () => {
                const width = img.width;
                const height = img.height;
                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
                ctx.drawImage(img, 0, 0);

                const imageData = ctx.getImageData(0, 0, width, height);
                const data = imageData.data;
                const isBg = new Uint8Array(width * height);

                // 1. Detect if the background is actually green
                const corners = [[0, 0], [width - 1, 0], [0, height - 1], [width - 1, height - 1]];

                // 2. Flood Fill starting from corners
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

                // 3. Dilation (Halo Cleanup)
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

                // 4. Final Alpha Application
                for (let i = 0; i < width * height; i++) {
                    if (expandedBg[i]) {
                        data[i * 4 + 3] = 0;
                    }
                }

                ctx.putImageData(imageData, 0, 0);
                resolve(canvas.toDataURL('image/png'));
            };
            img.src = base64;
        });
    };

    const handleBgRemoval = async () => {
        if (!generatedResult) return;
        setIsRemovingBg(true);
        try {
            const processedUrl = await smartRemoveBackground(generatedResult.imageUrl);
            setGeneratedResult(prev => prev ? { ...prev, imageUrl: processedUrl } : null);
        } catch (error) {
            console.error("BG Removal failed", error);
            onError("去背失敗");
        } finally {
            setIsRemovingBg(false);
        }
    };

    // API: Optimize Custom Prompt
    const optimizePrompt = async () => {
        if (!apiKey) {
            onNeedApiKey();
            return;
        }

        if (!customPrompt.trim()) {
            setLocalError("請先輸入提示詞！");
            return;
        }

        setIsOptimizingPrompt(true);
        setLocalError(null);

        try {
            const ai = new GoogleGenAI({ apiKey });
            const model = 'gemini-3-pro-image-preview';

            const festivalConfig = FESTIVALS.find(f => f.id === festival) || FESTIVALS[0];
            const styleConfig = CARD_STYLES.find(s => s.id === style) || CARD_STYLES[0];

            const optimizationPrompt = `You are a professional AI image prompt engineer.

    User's Input: "${customPrompt}"
            Festival Context: ${festivalConfig.label}
            Art Style: ${styleConfig.label} (${styleConfig.prompt})

Task: Optimize and enhance the user's input into a detailed, professional image generation prompt.

Requirements:
1. Incorporate the festival theme(${festivalConfig.label}) naturally
2. Apply the artistic style(${styleConfig.label})
3. Enhance visual details, composition, lighting, and atmosphere
4. Keep the core idea from user's input but make it more vivid and specific
5. The prompt should be in English and suitable for AI image generation
            6. Maximum 200 words
            
            Return ONLY the optimized prompt text, no explanation or additional commentary.`;

            const result = await ai.models.generateContent({
                model,
                contents: [{ parts: [{ text: optimizationPrompt }] }]
            });

            const optimizedText = result.candidates?.[0]?.content?.parts?.[0]?.text;
            if (!optimizedText) throw new Error("優化失敗");

            setCustomPrompt(optimizedText.trim());
        } catch (err: any) {
            console.error(err);
            const msg = err.message || "優化失敗";
            setLocalError(msg);
            if (msg.includes("API Key")) onNeedApiKey();
        } finally {
            setIsOptimizingPrompt(false);
        }
    };

    // API: Integrate Prompt & Generate Image (Single Step Optimized)
    const generateCard = async (targetUserName: string, targetMessage: string) => {
        if (!apiKey) {
            onNeedApiKey();
            throw new Error("請先設定 API Key");
        }

        const ai = new GoogleGenAI({ apiKey });
        const model = 'gemini-3-pro-image-preview'; // Use gemini-3-pro-image-preview for text generation

        const festivalConfig = FESTIVALS.find(f => f.id === festival) || FESTIVALS[0];
        const styleConfig = CARD_STYLES.find(s => s.id === style) || CARD_STYLES[0];

        // 1. Prompt Optimization
        const systemPrompt = `You are a professional Greeting Card Designer.
        Your task is to generate a detailed English image prompt for an AI image generator based on user inputs.

    Inputs:
- Festival: ${festivalConfig.label}
- Sender's Name: ${targetUserName}
    - Style: ${styleConfig.label}
- User's Message: "${targetMessage}"
    - Show Text on Card: ${showTextOnCard ? 'Yes' : 'No'}

Instructions:
1. Create a "visualPrompt" that describes a beautiful, high - quality greeting card image.
        2. Incorporate specific elements related to the "${festivalConfig.label}"(e.g., Red envelopes for Lunar New Year, Cake for Birthday).
        3. Apply the "${styleConfig.label}" aesthetic(${styleConfig.prompt}).
        4. If the user provided a specific message, try to visualize the sentiment of the message in the image atmosphere.
        5. Ensure the description implies a space or composition suitable for a greeting card.
        6. ${showTextOnCard ? 'Also generate a "refinedMessage" which is a polished or poetic version of the User\'s Message (in Traditional Chinese), suitable for printing on the card. If the user message is empty, generate a generic warm greeting for the festival.' : 'Set "refinedMessage" to empty string since the user does not want text on the card.'}
        
        Return pure JSON:
{
    "visualPrompt": "Detailed English image description...",
        "refinedMessage": "${showTextOnCard ? 'Polished text in Traditional Chinese...' : ''}",
            "title": "A short creative title for this card"
} `;

        const optimizeResult = await ai.models.generateContent({
            model,
            contents: [{ parts: [{ text: systemPrompt }] }],
            config: { responseMimeType: "application/json" }
        });

        const text = optimizeResult.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!text) throw new Error("文案生成失敗");

        // Sanitize JSON string (remove markdown code blocks if present)
        const jsonString = text.replace(/```json\n?|\n?```/g, '').trim();
        let themeData;
        try {
            themeData = JSON.parse(jsonString);
        } catch (e) {
            console.error("JSON Parse Error:", e);
            console.log("Raw Text:", text);
            throw new Error("文案格式錯誤，請重試");
        }

        // 2. Generate Image
        // --- Deep AI Integration Logic ---

        // A. Face Swap / User Image Logic
        const faceSwapInstruction = faceSwapMode && userImage
            ? `IMPORTANT: Keep the person's FACE from the reference image exactly the same (facial features, skin tone, expression). However, change their clothing, accessories, and surrounding elements to match the ${festivalConfig.label} theme and ${styleConfig.label} style. The person should be the main focus of the composition.`
            : userImage
                ? `Include the main character based on the uploaded user image.`
                : '';

        // B. Style Intensity Logic
        let styleStrengthInstruction = "";
        if (styleIntensity <= 30) {
            styleStrengthInstruction = "Keep the image highly realistic and true to the source material. Apply only subtle color grading.";
        } else if (styleIntensity <= 70) {
            styleStrengthInstruction = "Apply a balanced artistic style, blending realism with the chosen art style.";
        } else {
            styleStrengthInstruction = "Apply a strong, bold artistic style. Transform the image completely into the chosen art style.";
        }

        // C. Outpainting Logic
        const outpaintingInstruction = (autoExpandBackground && userImage)
            ? `If the input image aspect ratio does not match the target aspect ratio (${aspectRatio}), please intelligently expand the background content to fill the new frame naturaly while keeping the subject centered. Do not just crop.`
            : '';

        // D. Negative Prompt Logic
        const negativeConstraint = negativePrompt.trim()
            ? `\nNEGATIVE PROMPT / CONSTRAINTS: Do NOT include ${negativePrompt}.`
            : '';

        const textInstruction = showTextOnCard
            ? 'The image can have decorative space for text overlay, but no actual text should be rendered in the image itself.'
            : 'Do NOT include any text, words, or letters in the image. Pure visual composition only.';

        // Integrate custom prompt if provided
        const customPromptSection = customPrompt.trim()
            ? `\nAdditional Creative Direction: ${customPrompt.trim()}`
            : '';

        const imagePrompt = `A high-quality greeting card design.
        Style: ${styleConfig.prompt}. (${styleStrengthInstruction})
        Subject: ${themeData.visualPrompt}.
        Context: ${festivalConfig.label}.
        ${faceSwapInstruction}
        ${outpaintingInstruction}
        The image should be aesthetically pleasing, warm, and inviting.
        ${textInstruction}${customPromptSection}
        ${negativeConstraint}`.trim();

        const parts: any[] = [{ text: imagePrompt }];
        if (userImage) {
            parts.unshift({
                inlineData: {
                    data: userImage.split(',')[1],
                    mimeType: 'image/jpeg', // Assuming jpeg/png, API handles generic image types usually
                }
            });
        }

        // Generate Image using gemini-3-pro-image-preview
        // Note: For 2:3 and 3:2, we map them to 3:4 and 4:3 for API compatibility if needed, 
        // or passing specific pixel dimensions could be another way but aspectRatio enum is safer.
        // Google GenAI usually supports: "1:1", "3:4", "4:3", "9:16", "16:9"
        // We mapped 2:3 -> 3:4 and 3:2 -> 4:3 in the values definition to ensure success.

        const imgGenResult = await ai.models.generateContent({
            model: 'gemini-3-pro-image-preview',
            contents: [{ parts }],
            config: {
                imageConfig: {
                    aspectRatio: aspectRatio === '2:3' ? '3:4' : (aspectRatio === '3:2' ? '4:3' : aspectRatio),
                    imageSize: "1K"      // Required parameter
                }
            }
        });

        const imagePart = imgGenResult.candidates?.[0]?.content?.parts?.find((p: any) => p.inlineData);
        if (imagePart && imagePart.inlineData) {
            return {
                imageUrl: `data:image/png;base64,${imagePart.inlineData.data}`,
                theme: themeData
            };
        }
        throw new Error("賀卡生成失敗");
    };

    const handleGenerate = async () => {
        if (!userImage) {
            setLocalError("請先上傳照片！");
            return;
        }
        setIsGenerating(true);
        setLocalError(null);

        try {
            const displayUserName = userName || "Me";
            const displayMessage = message || ""; // Empty message allowed, AI will generate

            const { imageUrl, theme } = await generateCard(displayUserName, displayMessage);

            const result = {
                imageUrl,
                // Ensure strictly string type to avoid rendering crashes if object is returned
                title: typeof theme.title === 'string' ? theme.title : String(theme.title || "Greeting Card"),
                message: typeof theme.refinedMessage === 'string' ? theme.refinedMessage : String(theme.refinedMessage || ""),
                festival: FESTIVALS.find(f => f.id === festival)?.label,
                style: CARD_STYLES.find(s => s.id === style)?.label,
                visualPrompt: String(theme.visualPrompt || "")
            };

            setGeneratedResult(result);

            // Add to History
            const newHistoryItem: HistoryItem = {
                ...result,
                id: Date.now().toString(),
                timestamp: Date.now()
            };
            setHistory(prev => [newHistoryItem, ...prev].slice(0, 3)); // Limit to 3 to avoid localStorage quota issues

            // Auto-save to Gallery
            const savePrompt = `[${result.festival}] ${result.title}`;
            const fullDescription = `
**Title:** ${result.title}
**Festival:** ${result.festival} | **Style:** ${result.style}
**Message:** ${result.message}

**Visual Concept:**
${result.visualPrompt}

**Settings:**
Style Intensity: ${styleIntensity}%
Auto-Expand: ${autoExpandBackground ? 'On' : 'Off'}
Negative Prompt: ${negativePrompt || 'None'}
`.trim();
            onSuccess(imageUrl, savePrompt, fullDescription);

        } catch (err: any) {
            console.error(err);
            const msg = err.message || "生成發生錯誤";
            onError(msg);
            setLocalError(msg);
            if (msg.includes("API Key")) onNeedApiKey();
        } finally {
            setIsGenerating(false);
        }
    };

    const handleRegenerateImage = async () => {
        if (!generatedResult || !userImage) return;
        setIsRegenerating(true);
        setLocalError(null);
        try {
            // Re-run with same settings but distinct seed naturally via API
            const displayUserName = userName || "Me";
            const displayMessage = message || "";
            const { imageUrl, theme } = await generateCard(displayUserName, displayMessage);

            setGeneratedResult((prev: any) => {
                const updated = {
                    ...prev,
                    imageUrl,
                    // Updating message/title too as it might vary slightly or be better
                    title: theme.title,
                    message: theme.refinedMessage,
                    visualPrompt: theme.visualPrompt
                };

                // Update history with new version (optional: create new item or update latest)
                // Let's create a new item for the regenerated version so user doesn't lose the old one
                const newHistoryItem: HistoryItem = {
                    ...updated,
                    id: Date.now().toString(),
                    timestamp: Date.now()
                };
                setHistory(history => [newHistoryItem, ...history].slice(0, 3));

                return updated;
            });

        } catch (err: any) {
            onError(err.message);
        } finally {
            setIsRegenerating(false);
        }
    };

    // Helper: Text Wrapping
    const wrapText = (ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number) => {
        const words = text.split(''); // Splitting by char for CJK mixed with English
        let line = '';
        let currentY = y;

        for (let n = 0; n < words.length; n++) {
            const testLine = line + words[n];
            const metrics = ctx.measureText(testLine);
            const testWidth = metrics.width;
            if (testWidth > maxWidth && n > 0) {
                ctx.fillText(line, x, currentY);
                line = words[n];
                currentY += lineHeight;
            } else {
                line = testLine;
            }
        }
        ctx.fillText(line, x, currentY);
        return currentY + lineHeight;
    };

    const createCardCanvas = async (): Promise<HTMLCanvasElement | null> => {
        if (!generatedResult?.imageUrl) return null;
        const mainImg = await loadImage(generatedResult.imageUrl);
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return null;

        const imgWidth = mainImg.width;
        const imgHeight = mainImg.height;

        // --- Layout Rendering Engine ---

        // 1. Classic Layout (Polaroid-like)
        if (cardLayout === 'classic') {
            const padding = 60;
            const textSectionHeight = showTextOnCard && generatedResult.message ? 260 : 0;

            canvas.width = imgWidth + (padding * 2);
            canvas.height = imgHeight + textSectionHeight + padding + (showTextOnCard ? 0 : padding);

            // Background
            ctx.fillStyle = cardBgColor;
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Image Frame
            const imageX = padding;
            const imageY = padding;

            // Shadow
            ctx.shadowColor = "rgba(0, 0, 0, 0.1)";
            ctx.shadowBlur = 20;
            ctx.shadowOffsetY = 10;

            // White Border
            ctx.fillStyle = "#FFFFFF";
            ctx.fillRect(imageX - 10, imageY - 10, imgWidth + 20, imgHeight + 20);

            // Image
            ctx.shadowColor = "transparent";
            ctx.drawImage(mainImg, imageX, imageY);

            // Text
            if (showTextOnCard && generatedResult.message) {
                const textStartX = canvas.width / 2;
                let textCursorY = imageY + imgHeight + 70;

                // Title
                ctx.font = 'bold 48px serif';
                ctx.fillStyle = '#5D5540';
                ctx.textAlign = 'center';
                ctx.fillText(generatedResult.title || "Holiday Greeting", textStartX, textCursorY);

                textCursorY += 50;
                ctx.font = 'bold 24px sans-serif';
                ctx.fillStyle = '#A3997A';
                ctx.fillText(`To: ${recipientName || "You"} | From: ${userName || "Me"}`, textStartX, textCursorY);

                textCursorY += 40;
                ctx.beginPath();
                ctx.moveTo(textStartX - 100, textCursorY - 15);
                ctx.lineTo(textStartX + 100, textCursorY - 15);
                ctx.strokeStyle = '#DDD0B0';
                ctx.lineWidth = 2;
                ctx.stroke();

                textCursorY += 30;
                const selectedFontData = [...FONTS, ...customFonts].find(f => f.id === selectedFont);
                const selectedFontFamily = selectedFontData?.family || 'serif';
                ctx.font = `32px ${selectedFontFamily}`;
                ctx.fillStyle = textColor;
                const maxWidth = canvas.width - (padding * 4);
                wrapText(ctx, generatedResult.message, textStartX, textCursorY, maxWidth, 48);
            }
        }
        // 2. Magazine Layout (Full Bleed)
        else if (cardLayout === 'magazine') {
            canvas.width = imgWidth;
            canvas.height = imgHeight;

            // Draw Image Full Bleed
            ctx.drawImage(mainImg, 0, 0);

            // Dark Gradient Overlay at Bottom for Text Visibility
            if (showTextOnCard) {
                const gradientHeight = imgHeight * 0.4;
                const gradient = ctx.createLinearGradient(0, imgHeight - gradientHeight, 0, imgHeight);
                gradient.addColorStop(0, "rgba(0,0,0,0)");
                gradient.addColorStop(0.7, "rgba(0,0,0,0.7)");
                gradient.addColorStop(1, "rgba(0,0,0,0.9)");

                ctx.fillStyle = gradient;
                ctx.fillRect(0, imgHeight - gradientHeight, imgWidth, gradientHeight);

                // Text (White/Light)
                const textStartX = 60;
                let textCursorY = imgHeight - 180;

                ctx.font = '900 80px sans-serif'; // Big Bold Title
                ctx.fillStyle = '#FFFFFF';
                ctx.textAlign = 'left';
                ctx.shadowColor = "rgba(0,0,0,0.5)";
                ctx.shadowBlur = 10;
                ctx.fillText((generatedResult.title || "GREETING").toUpperCase(), textStartX, textCursorY);

                textCursorY += 50;
                ctx.font = 'bold 24px monospace';
                ctx.fillStyle = '#E5E5E5';
                ctx.fillText(`TO ${recipientName || "YOU"} • FROM ${userName || "ME"}`, textStartX, textCursorY);

                if (generatedResult.message) {
                    textCursorY += 60;
                    const mainFont = [...FONTS, ...customFonts].find(f => f.id === selectedFont)?.family || 'sans-serif';
                    ctx.font = `36px ${mainFont}`;
                    ctx.fillStyle = '#FFFFFF';
                    wrapText(ctx, generatedResult.message, textStartX, textCursorY, imgWidth - 120, 50);
                }
            }
        }
        // 3. Minimalist Layout (Large White Space)
        else if (cardLayout === 'minimalist') {
            const margin = 120; // Big margin
            canvas.width = imgWidth + margin * 2;
            canvas.height = imgHeight + margin * 2 + 200; // Extra functionality space

            // Soft Background
            ctx.fillStyle = cardBgColor === '#FDFCF8' ? '#FFFFFF' : cardBgColor; // Clean white/color
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Subtle Border for Image
            ctx.strokeStyle = "#E5E5E5";
            ctx.lineWidth = 1;
            ctx.strokeRect(margin - 1, margin - 1, imgWidth + 2, imgHeight + 2);

            // Image
            ctx.drawImage(mainImg, margin, margin);

            // Minimal Text
            if (showTextOnCard) {
                const textCenterX = canvas.width / 2;
                let textY = margin + imgHeight + 80;

                ctx.font = 'italic 32px serif';
                ctx.fillStyle = '#666';
                ctx.textAlign = 'center';
                ctx.fillText(`${recipientName || "Dear"} / ${userName || "Me"}`, textCenterX, textY);

                textY += 60;
                const mainFont = [...FONTS, ...customFonts].find(f => f.id === selectedFont)?.family || 'serif';
                ctx.font = `bold 40px ${mainFont}`;
                ctx.fillStyle = textColor;
                wrapText(ctx, generatedResult.message || "", textCenterX, textY, imgWidth, 52);
            }
        }
        return canvas;
    };

    const handleDownload = async () => {
        try {
            const canvas = await createCardCanvas();
            if (!canvas) return;

            const filename = `GreetingCard_${cardLayout}_${Date.now()}.jpg`;
            const dataUrl = canvas.toDataURL('image/jpeg', 0.90);

            // Auto-save Composed Card to Gallery
            const cardTitle = `[賀卡] ${generatedResult?.title || 'Greeting Card'}`;
            const cardDesc = `
**[Composed Card]**
**Title:** ${generatedResult?.title}
**Festival:** ${generatedResult?.festival} | **Style:** ${generatedResult?.style}
**Layout:** ${CARD_LAYOUTS.find(l => l.id === cardLayout)?.label}
**Message:** ${generatedResult?.message}
**Font:** ${[...FONTS, ...customFonts].find(f => f.id === selectedFont)?.label || selectedFont} | **Color:** ${TEXT_COLORS.find(c => c.value === textColor)?.label || textColor}
`.trim();
            onSuccess(dataUrl, cardTitle, cardDesc);

            const link = document.createElement('a');
            link.href = dataUrl;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (err) {
            console.error(err);
            onError("下載失敗");
        }
    };

    const handleDownloadRawImage = async () => {
        if (!generatedResult?.imageUrl) return;
        try {
            const mainImg = await loadImage(generatedResult.imageUrl);
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            if (!ctx) return;

            canvas.width = mainImg.width;
            canvas.height = mainImg.height;
            ctx.drawImage(mainImg, 0, 0);

            const filename = `GreetingCard_Raw_${Date.now()}.jpg`;
            const dataUrl = canvas.toDataURL('image/jpeg', 1.0);
            const link = document.createElement('a');
            link.href = dataUrl;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (err) {
            console.error(err);
            onError("下載失敗");
        }
    };

    const [canShare, setCanShare] = useState(false);
    useEffect(() => {
        if (typeof navigator !== 'undefined' && navigator.share && navigator.canShare) {
            setCanShare(true);
        }
    }, []);

    const handleShare = async () => {
        if (!generatedResult?.imageUrl) return;
        try {
            const canvas = await createCardCanvas();
            if (!canvas) return;

            canvas.toBlob(async (blob) => {
                if (!blob) {
                    alert("圖片產生失敗");
                    return;
                }
                const file = new File([blob], `GreetingCard_${Date.now()}.png`, { type: 'image/png' });

                if (navigator.canShare && navigator.canShare({ files: [file] })) {
                    try {
                        await navigator.share({
                            title: generatedResult.title || 'Greeting Card',
                            text: generatedResult.message || "Sending you a greeting card!",
                            files: [file]
                        });
                    } catch (err) {
                        console.error("Share failed", err);
                        // User might have cancelled share
                    }
                } else {
                    // Fallback: Copy to clipboard
                    try {
                        const clipboardItem = new ClipboardItem({ [file.type]: file });
                        await navigator.clipboard.write([clipboardItem]);
                        alert("已複製圖片到剪貼簿！(您的裝置不支援直接分享檔案)");
                    } catch (clipErr) {
                        alert("您的瀏覽器不支援分享，請使用下載功能。");
                    }
                }
            }, 'image/png');

        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left: Controls */}
                <div className="space-y-6">
                    {/* Upload Section */}
                    <div className="bg-cream backdrop-blur-xl border border-cream-dark rounded-[2rem] p-8 min-h-[600px] flex flex-col group transition-all hover:bg-white/60">
                        <div
                            onClick={() => fileInputRef.current?.click()}
                            className={`border-4 border-dashed rounded-3xl h-64 flex flex-col items-center justify-center cursor-pointer overflow-hidden transition-all ${userImage ? 'border-primary' : 'border-bronze-light/30 hover:border-primary/50'}`}
                        >
                            {userImage ? (
                                <img src={userImage} className="w-full h-full object-cover" alt="User Upload" />
                            ) : (
                                <div className="space-y-2">
                                    <Upload className="w-10 h-10 text-bronze-light mx-auto" />
                                    <p className="text-bronze-light font-bold">點擊上傳照片 (主角)</p>
                                    <p className="text-xs text-bronze-light/70">(建議清晰的人像照)</p>
                                </div>
                            )}
                            <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="image/*" className="hidden" />

                            {/* Processing Overlay */}
                            {isProcessingUploadBg && (
                                <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center z-10 text-primary animate-in fade-in">
                                    <Scissors className="animate-bounce mb-2" size={32} />
                                    <span className="font-bold animate-pulse">正在移除背景...</span>
                                </div>
                            )}

                            {/* Manual Remove Button (Overlay on image) */}
                            {userImage && !isProcessingUploadBg && (
                                <button
                                    onClick={(e) => { e.stopPropagation(); handleManualUploadBgRemoval(); }}
                                    className="absolute top-2 right-2 p-2 bg-white/90 backdrop-blur rounded-full text-secondary shadow-sm hover:scale-110 transition-transform z-20"
                                    title="移除背景 (人像去背)"
                                >
                                    <Scissors size={16} />
                                </button>
                            )}
                        </div>
                        <button
                            onClick={() => setShowGallery(true)}
                            className="mt-3 w-full flex items-center justify-center gap-2 px-4 py-2 bg-secondary/10 hover:bg-secondary/20 text-secondary rounded-xl text-sm font-bold transition-colors"
                        >
                            <FolderHeart size={16} />
                            從作品集選取
                        </button>


                        {/* Auto Remove Background Toggle */}
                        <div
                            onClick={() => setAutoRemoveBg(!autoRemoveBg)}
                            className={`mt-3 w-full flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all cursor-pointer border ${autoRemoveBg ? 'bg-primary/10 border-primary text-primary' : 'bg-transparent border-transparent text-bronze-light hover:bg-black/5'}`}
                        >
                            <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${autoRemoveBg ? 'bg-primary border-primary' : 'border-bronze-light'}`}>
                                {autoRemoveBg && <Check size={12} className="text-white" />}
                            </div>
                            <span>上傳後自動去背</span>
                        </div>
                    </div>

                    {/* Settings Section */}
                    <div className="bg-cream backdrop-blur-xl border border-cream-dark rounded-[2rem] p-6 shadow-sm mb-6">
                        <h2 className="text-sm font-black text-bronze-light uppercase tracking-widest flex items-center gap-2">
                            <Settings size={16} /> 賀卡設定
                        </h2>

                        {/* Festival Selection */}
                        <div>
                            <label className="text-xs font-bold text-bronze-light ml-2 mb-1 block">節日主題</label>
                            <select
                                value={festival}
                                onChange={(e) => setFestival(e.target.value)}
                                className="w-full px-4 py-3 bg-white border border-cream-dark rounded-xl font-bold text-sm outline-none focus:border-primary text-bronze-text"
                                aria-label="選擇節日主題"
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
                                value={style}
                                onChange={(e) => setStyle(e.target.value)}
                                className="w-full px-4 py-3 bg-white border border-cream-dark rounded-xl font-bold text-sm outline-none focus:border-primary text-bronze-text"
                                aria-label="選擇繪圖風格"
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
                                        onClick={() => setCardBgColor(bg.value)}
                                        className={`w-10 h-10 rounded-full shadow-sm transition-all flex items-center justify-center ${bg.class} ${cardBgColor === bg.value ? 'ring-2 ring-primary scale-110' : 'hover:scale-105'}`}
                                        title={bg.label}
                                    >
                                        {cardBgColor === bg.value && <div className="w-2 h-2 rounded-full bg-primary" />}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Aspect Ratio Selection */}
                        <div>
                            <label className="text-xs font-bold text-bronze-light ml-2 mb-1 block">卡片尺寸 (比例)</label>
                            <select
                                value={aspectRatio}
                                onChange={(e) => setAspectRatio(e.target.value)}
                                className="w-full px-4 py-3 bg-white border border-cream-dark rounded-xl font-bold text-sm outline-none focus:border-primary text-bronze-text"
                                aria-label="選擇卡片尺寸比例"
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
                                        onClick={() => setCardLayout(l.id)}
                                        className={`px-2 py-3 rounded-xl text-xs font-bold border-2 transition-all flex flex-col items-center gap-1 ${cardLayout === l.id
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
                        <div className="space-y-3 p-4 bg-cream-light/30 rounded-xl border border-cream-dark/20">
                            <h3 className="text-xs font-black text-bronze uppercase tracking-wider">進階選項</h3>

                            {/* Face Swap Mode */}
                            <label className={`flex items-center gap-3 group ${!userImage ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}>
                                <input
                                    type="checkbox"
                                    checked={faceSwapMode}
                                    onChange={(e) => setFaceSwapMode(e.target.checked)}
                                    disabled={!userImage}
                                    className={`w-5 h-5 rounded border-2 border-primary text-primary focus:ring-2 focus:ring-primary/20 ${!userImage ? 'cursor-not-allowed bg-gray-100' : 'cursor-pointer'}`}
                                />
                                <div className="flex-1">
                                    <div className={`text-sm font-bold transition-colors ${!userImage ? 'text-bronze-light' : 'text-bronze-text group-hover:text-primary'}`}>
                                        🎭 換臉模式 {!userImage && <span className="text-[10px] text-red-400 font-normal ml-1">(請先上傳照片)</span>}
                                    </div>
                                    <div className="text-xs text-bronze-light">保持臉部特徵，但更換符合節日主題的服裝配件</div>
                                </div>
                            </label>



                            {/* Auto Expand Background (Outpainting) */}
                            <label className={`flex items-center gap-3 group ${!userImage ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}>
                                <input
                                    type="checkbox"
                                    checked={autoExpandBackground}
                                    onChange={(e) => setAutoExpandBackground(e.target.checked)}
                                    disabled={!userImage}
                                    className={`w-5 h-5 rounded border-2 border-primary text-primary focus:ring-2 focus:ring-primary/20 ${!userImage ? 'cursor-not-allowed bg-gray-100' : 'cursor-pointer'}`}
                                />
                                <div className="flex-1">
                                    <div className={`text-sm font-bold transition-colors ${!userImage ? 'text-bronze-light' : 'text-bronze-text group-hover:text-primary'}`}>
                                        🖼️ AI 智慧擴圖 {!userImage && <span className="text-[10px] text-red-400 font-normal ml-1">(請先上傳照片)</span>}
                                    </div>
                                    <div className="text-xs text-bronze-light">若照片比例不符，自動補全背景 (Outpainting)</div>
                                </div>
                            </label>

                            {/* Style Intensity Slider */}
                            <div className="pt-2">
                                <div className="flex justify-between items-center mb-1">
                                    <label className="text-xs font-bold text-bronze-light">🎨 風格強度 (Style Strength)</label>
                                    <span className="text-xs font-bold text-primary">{styleIntensity}%</span>
                                </div>
                                <input
                                    type="range"
                                    min="0"
                                    max="100"
                                    value={styleIntensity}
                                    onChange={(e) => setStyleIntensity(parseInt(e.target.value))}
                                    className="w-full h-2 bg-cream-dark rounded-lg appearance-none cursor-pointer accent-primary"
                                    aria-label="風格強度調整滑桿"
                                    title="風格強度調整"
                                />
                                <div className="flex justify-between text-[10px] text-bronze-light/70 mt-1">
                                    <span>寫實</span>
                                    <span>平衡</span>
                                    <span>藝術</span>
                                </div>
                            </div>

                            {/* Negative Prompt */}
                            <div className="pt-2">
                                <label className="text-xs font-bold text-bronze-light mb-1 block">🚫 負向提示詞 (不想看到的內容)</label>
                                <input
                                    type="text"
                                    value={negativePrompt}
                                    onChange={(e) => setNegativePrompt(e.target.value)}
                                    placeholder="例如：文字, 模糊, 變形..."
                                    className="w-full px-3 py-2 bg-white border border-cream-dark rounded-lg text-xs font-bold outline-none focus:border-primary text-bronze-text placeholder-bronze-light/50"
                                />
                            </div>

                            {/* Show Text Toggle */}
                            <label className="flex items-center gap-3 cursor-pointer group pt-2 border-t border-cream-dark/20">
                                <input
                                    type="checkbox"
                                    checked={showTextOnCard}
                                    onChange={(e) => setShowTextOnCard(e.target.checked)}
                                    className="w-5 h-5 rounded border-2 border-primary text-primary focus:ring-2 focus:ring-primary/20 cursor-pointer"
                                />
                                <div className="flex-1">
                                    <div className="text-sm font-bold text-bronze-text group-hover:text-primary transition-colors">💬 顯示祝福語</div>
                                    <div className="text-xs text-bronze-light">在賀卡上顯示 AI 優化後的祝福文字</div>
                                </div>
                            </label>
                        </div>

                        {/* Font & Color Settings */}
                        {showTextOnCard && (
                            <div className="space-y-3 p-4 bg-cream-light/30 rounded-xl border border-cream-dark/20">
                                <h3 className="text-xs font-black text-bronze uppercase tracking-wider">文字樣式</h3>

                                {/* Font Selection */}
                                <label className="text-xs font-bold text-bronze-light mb-1 flex justify-between items-center">
                                    <span>字體風格</span>
                                    <label className="text-primary text-[10px] cursor-pointer hover:underline flex items-center gap-1">
                                        <Upload size={10} /> 上傳字型
                                        <input type="file" onChange={handleFontUpload} accept=".ttf,.otf,.woff,.woff2" className="hidden" />
                                    </label>
                                </label>
                                <div className="grid grid-cols-2 gap-2">
                                    {[...FONTS, ...customFonts].map(f => (
                                        <button
                                            key={f.id}
                                            onClick={() => setSelectedFont(f.id)}
                                            className={`px-3 py-2 rounded-lg text-xs font-bold border transition-all truncate ${selectedFont === f.id
                                                ? 'bg-white border-primary text-primary shadow-sm'
                                                : 'bg-transparent border-cream-dark/50 text-bronze-light hover:bg-white/50'
                                                } ${f.className}`}
                                            style={{ fontFamily: f.family }}
                                        >
                                            {f.label} (Aa)
                                        </button>
                                    ))}
                                </div>

                                {/* Color Selection */}
                                <div>
                                    <label className="text-xs font-bold text-bronze-light mb-1 block">文字顏色</label>
                                    <div className="flex gap-2 flex-wrap">
                                        {TEXT_COLORS.map(c => (
                                            <button
                                                key={c.id}
                                                onClick={() => setTextColor(c.value)}
                                                className={`w-8 h-8 rounded-full transition-transform hover:scale-110 flex items-center justify-center ${c.class} ${textColor === c.value ? 'ring-2 ring-primary ring-offset-2' : ''
                                                    }`}
                                                title={c.label}
                                            >
                                                {textColor === c.value && <div className="w-2 h-2 bg-white rounded-full shadow-sm" />}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}



                        {/* Custom Prompt Section */}
                        <div className="space-y-3">
                            <label className="text-xs font-bold text-bronze-light ml-2 mb-1 block">
                                ✨ 自定義提示詞 (選填)
                            </label>
                            <div className="relative">
                                <textarea
                                    value={customPrompt}
                                    onChange={(e) => setCustomPrompt(e.target.value)}
                                    placeholder="例如：在櫻花樹下，穿著和服，手持燈籠...&#10;&#10;可以輸入你想要的畫面描述，然後按下「AI優化」來根據節日主題和繪圖風格優化提示詞"
                                    className="w-full px-4 py-3 bg-white border border-cream-dark rounded-xl font-bold text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 text-bronze-text placeholder-bronze-light/50 min-h-[100px] resize-none"
                                    disabled={isOptimizingPrompt}
                                />
                                {customPrompt && (
                                    <button
                                        onClick={() => setCustomPrompt("")}
                                        className="absolute top-2 right-2 text-bronze-light hover:text-bronze-text transition-colors p-1"
                                        title="清除"
                                    >
                                        ✕
                                    </button>
                                )}
                            </div>
                            <button
                                onClick={optimizePrompt}
                                disabled={isOptimizingPrompt || !customPrompt.trim()}
                                className={`w-full py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${isOptimizingPrompt || !customPrompt.trim()
                                    ? 'bg-cream-dark text-bronze-light cursor-not-allowed'
                                    : 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white hover:shadow-lg hover:shadow-purple-500/20'
                                    }`}
                            >
                                {isOptimizingPrompt ? (
                                    <>
                                        <RefreshCw className="animate-spin" size={16} />
                                        AI 優化中...
                                    </>
                                ) : (
                                    <>
                                        <Sparkles size={16} />
                                        AI 優化提示詞
                                    </>
                                )}
                            </button>
                            <p className="text-xs text-bronze-light/70 text-center">
                                💡 提示：AI 會根據你選擇的節日主題和繪圖風格來優化提示詞
                            </p>
                        </div>

                        {/* User Name */}
                        <div className="space-y-4">
                            <h2 className="text-sm font-black text-bronze-light uppercase tracking-widest flex items-center gap-2">
                                <Sparkles size={16} /> 祝福語與署名
                            </h2>
                            <div className="grid grid-cols-2 gap-4">
                                <input
                                    type="text"
                                    value={recipientName}
                                    onChange={(e) => setRecipientName(e.target.value)}
                                    placeholder="收件人 (To)"
                                    className="w-full px-4 py-3 bg-white border border-cream-dark rounded-xl font-bold text-sm outline-none focus:border-primary text-bronze-text placeholder-bronze-light/50"
                                    aria-label="收件人名字"
                                    title="收件人名字"
                                />
                                <input
                                    type="text"
                                    value={userName}
                                    onChange={(e) => setUserName(e.target.value)}
                                    placeholder="你的名字 (From)"
                                    className="w-full px-4 py-3 bg-white border border-cream-dark rounded-xl font-bold text-sm outline-none focus:border-primary text-bronze-text placeholder-bronze-light/50"
                                    aria-label="你的名字"
                                    title="你的名字"
                                />
                            </div>
                        </div>

                        {/* Message Content */}
                        <div>
                            <label className="text-xs font-bold text-bronze-light ml-2 mb-1 block">想要說的祝福語 (AI 會幫你潤飾)</label>
                            <textarea
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                placeholder="例如：祝你生日快樂，天天開心！"
                                className="w-full px-4 py-3 bg-white border border-cream-dark rounded-xl font-bold text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 text-bronze-text placeholder-bronze-light/50 min-h-[80px]"
                            />
                        </div>

                        <button
                            onClick={handleGenerate}
                            disabled={isGenerating || isRegenerating}
                            className={`w-full py-4 rounded-xl font-black text-lg shadow-lg transform transition-all active:scale-95 flex items-center justify-center gap-2 ${isGenerating ? 'bg-cream-dark text-bronze-light cursor-not-allowed' : 'bg-primary hover:bg-primary-hover text-white shadow-primary/30'}`}
                        >
                            {isGenerating ? <RefreshCw className="animate-spin" /> : <Heart className="fill-white" />}
                            {isGenerating ? 'AI 繪製中...' : '生成專屬賀卡'}
                        </button>
                        {isGenerating && (
                            <p className="text-center text-xs text-bronze-light animate-pulse font-bold">
                                {(
                                    [
                                        "正在構思賀卡構圖...",
                                        "AI 畫家正在揮毫...",
                                        "正在挑選最適合的配色...",
                                        "正在為您寫下祝福...",
                                        "最後修飾中..."
                                    ]
                                )[loadingStep]}
                            </p>
                        )}
                        {localError && <div className="text-red-500 text-xs font-bold text-center animate-pulse">{localError}</div>}
                    </div>
                </div>

                {/* Right: Results */}
                <div
                    className="border border-cream-dark shadow-sm rounded-[2rem] p-8 h-fit min-h-[500px] flex flex-col items-center justify-center relative group transition-colors duration-500"
                    style={{ backgroundColor: cardBgColor }}
                >
                    {generatedResult ? (
                        <>
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
                                                    <p className={`text-sm leading-relaxed ${[...FONTS, ...customFonts].find(f => f.id === selectedFont)?.className || ''}`} style={{ color: textColor, fontFamily: [...FONTS, ...customFonts].find(f => f.id === selectedFont)?.family }}>
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
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent flex flex-col justify-end p-8 text-left z-10">
                                            <h3 className="text-5xl font-black text-white font-sans uppercase leading-tight drop-shadow-lg mb-2">
                                                {generatedResult.title || "Greeting"}
                                            </h3>
                                            <div className="text-sm font-mono text-gray-300 mb-6 bg-black/50 px-2 py-1 w-fit backdrop-blur-md">
                                                TO {recipientName?.toUpperCase() || "YOU"} • FROM {userName?.toUpperCase() || "ME"}
                                            </div>
                                            {showTextOnCard && generatedResult.message && (
                                                <p className={`text-lg text-white/90 max-w-lg drop-shadow-md ${[...FONTS, ...customFonts].find(f => f.id === selectedFont)?.className || ''}`} style={{ fontFamily: [...FONTS, ...customFonts].find(f => f.id === selectedFont)?.family }}>
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
                                                <p className={`text-xl leading-relaxed py-4 border-t border-b border-gray-100 ${[...FONTS, ...customFonts].find(f => f.id === selectedFont)?.className || ''}`} style={{ color: textColor, fontFamily: [...FONTS, ...customFonts].find(f => f.id === selectedFont)?.family }}>
                                                    {generatedResult.message}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                )}



                                {/* Hover Actions (Top-Right) */}
                                {!isRegenerating && !isRemovingBg && (
                                    <div className="absolute top-4 right-4 flex flex-col gap-2 z-[60]">
                                        <button onClick={handleRegenerateImage} className="bg-white/90 backdrop-blur p-3 rounded-full text-blue-500 shadow-lg hover:scale-110 transition-transform" title="重新生成">
                                            <RefreshCw size={20} />
                                        </button>
                                        <button onClick={handleShare} className="bg-white/90 backdrop-blur p-3 rounded-full text-pink-500 shadow-lg hover:scale-110 transition-transform" title={canShare ? "分享 / 存到..." : "複製到剪貼簿"}>
                                            <Share2 size={20} />
                                        </button>
                                        <button onClick={handleBgRemoval} className="bg-white/90 backdrop-blur p-3 rounded-full text-amber-500 shadow-lg hover:scale-110 transition-transform" title="智慧去背 (移除綠幕)">
                                            <Scissors size={20} />
                                        </button>
                                        <div className="flex flex-col gap-2 group/menu">
                                            <button onClick={handleDownload} className="bg-white/90 backdrop-blur p-3 rounded-full text-green-600 shadow-lg hover:scale-110 transition-transform flex items-center justify-center gap-1 group/btn" title="下載完整賀卡">
                                                <Download size={20} />
                                            </button>
                                            {/* Sub-menu for raw image */}
                                            <button onClick={handleDownloadRawImage} className="flex bg-white/90 backdrop-blur p-3 rounded-full text-teal-500 shadow-lg hover:scale-110 transition-transform items-center justify-center gap-1" title="下載純圖片">
                                                <ImageIcon size={20} />
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* Regenerating Overlay */}
                                {(isRegenerating || isRemovingBg) && (
                                    <div className="absolute inset-0 z-[70] bg-white/50 backdrop-blur-sm flex items-center justify-center rounded-[2rem]">
                                        <div className="bg-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2">
                                            {isRemovingBg ? <Scissors className="animate-bounce text-amber-500" size={16} /> : <RefreshCw className="animate-spin text-primary" size={16} />}
                                            <span className="text-xs font-bold text-bronze">{isRemovingBg ? "智慧去背中..." : "重新繪製中..."}</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </>
                    ) : (
                        <div className="text-center space-y-4 opacity-50">
                            <ImageIcon size={64} className="mx-auto text-bronze-light" />
                            <p className="text-bronze-light font-bold">你的專屬賀卡將會出現在這裡</p>
                        </div>
                    )}
                </div>

                {/* History Section */}
                <div className="col-span-1 lg:col-span-2 pt-8 border-t border-cream-dark/30">
                    <h3 className="text-sm font-black text-bronze-light uppercase tracking-widest mb-6 flex items-center gap-2">
                        <History size={16} /> 最近的創作
                    </h3>
                    {history.length > 0 ? (
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                            {history.map((item) => (
                                <div
                                    key={item.id}
                                    onClick={() => setGeneratedResult(item)}
                                    className={`group relative aspect-[3/4] rounded-xl overflow-hidden cursor-pointer border-2 transition-all ${generatedResult?.imageUrl === item.imageUrl ? 'border-primary ring-2 ring-primary/20' : 'border-transparent hover:border-primary/50'}`}
                                >
                                    <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
                                        <p className="text-white text-xs font-bold line-clamp-1">{item.title}</p>
                                        <p className="text-white/70 text-[10px] flex items-center gap-1">
                                            <Clock size={10} />
                                            {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-10 opacity-50 border-2 border-dashed border-cream-dark rounded-xl">
                            <History size={48} className="mx-auto text-bronze-light mb-2" />
                            <p className="text-bronze-light font-bold">還沒有生成的賀卡紀錄</p>
                            <p className="text-xs text-bronze-light/70">生成後的賀卡會自動儲存在這裡</p>
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

export default GreetingCardTab;

import React, { useState, useEffect, useRef } from 'react';
import {
    Settings, Upload, RefreshCw,
    Download, Sparkles, Film, FolderHeart
} from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { GalleryPicker } from '../../../components/GalleryPicker';

// --- Constants & DB ---
const DRAMA_STYLES = [
    { id: 'k-drama', label: '🇰🇷 K-Drama (韓劇)', prompt: 'Korean Drama', titleLang: 'ko', country: 'South Korea' },
    { id: 'j-drama', label: '🇯🇵 J-Drama (日劇)', prompt: 'Japanese Drama', titleLang: 'ja', country: 'Japan' },
    { id: 'c-drama', label: '🇨🇳 C-Drama (陸劇)', prompt: 'Chinese Drama', titleLang: 'zh', country: 'China' },
    { id: 'us-drama', label: '🇺🇸 US Series (美劇)', prompt: 'American TV Series', titleLang: 'en', country: 'USA' },
];

const ACTOR_DB: Record<string, { men: string[], women: string[] }> = {
    'k-drama': {
        men: [
            "Hyun Bin", "Gong Yoo", "Park Seo-joon", "Lee Min-ho", "Song Joong-ki",
            "Son Suk-Ku", "Lee Dong-wook", "Cha Eun-woo", "Park Bo-gum", "Lee Jong-suk",
            "Ji Chang-wook", "Nam Joo-hyuk", "Lee Jun-ho", "Ahn Hyo-seop", "Song Kang",
            "Rowoon", "Jung Hae-in", "Lee Do-hyun", "Seo In-guk", "Park Hyung-sik",
            "Kim Seon-ho", "Kim Tae Hyung", "Byeon Woo Seok", "Lee Joon Gi"
        ],
        women: [
            "Son Ye-jin", "Song Hye-kyo", "IU (Lee Ji-eun)", "Park Min-young", "Kim Ji-won",
            "Jun Ji-hyun", "Bae Suzy", "Han So-hee", "Park Shin-hye", "Kim Go-eun",
            "Park Bo-young", "Han Hyo-joo", "Seo Ye-ji", "Shin Min-a", "Kim Yoo-jung",
            "Kim So-hyun", "Moon Ga-young", "Lee Sung-kyung", "Im Yoon-ah", "Kim Tae-ri"
        ]
    },
    'j-drama': {
        men: [
            "Takeru Satoh", "Kento Yamazaki", "Masaki Suda", "Ryo Yoshizawa", "Mackenyu",
            "Gen Hoshino", "Issey Takahashi", "Kentaro Sakaguchi", "Ryusei Yokohama", "Jun Shison",
            "Takuya Kimura", "Hiroshi Abe", "Hidetoshi Nishijima", "Sota Fukushi", "Keita Machida"
        ],
        women: [
            "Yui Aragaki", "Satomi Ishihara", "Haruka Ayase", "Masami Nagasawa", "Kasumi Arimura",
            "Suzu Hirose", "Kanna Hashimoto", "Minami Hamabe", "Tao Tsuchiya", "Nana Komatsu",
            "Yuriko Yoshitaka", "Kyoko Fukada", "Erika Toda", "Mitsuki Takahata", "Mei Nagano"
        ]
    },
    'c-drama': {
        men: [
            "Xiao Zhan", "Wang Yibo", "Yang Yang", "Wu Lei", "Cheng Yi",
            "Dylan Wang", "Luo Yunxi", "Xu Kai", "Zhang Ruoyun", "Li Xian",
            "Ren Jialun", "Chen Feiyu", "Gong Jun", "Bai Jingting", "Lin Yi"
        ],
        women: [
            "Dilraba Dilmurat", "Yang Mi", "Zhao Lusi", "Zhao Liying", "Bai Lu",
            "Ju Jingyi", "Yang Zi", "Liu Yifei", "Esther Yu", "Guan Xiaotong",
            "Tan Songyun", "Shen Yue", "Zhou Ye", "Song Yi", "Liu Shishi"
        ]
    },
    'us-drama': {
        men: [
            "Timothée Chalamet", "Tom Holland", "Henry Cavill", "Chris Evans", "Pedro Pascal",
            "Austin Butler", "Jacob Elordi", "Jeremy Allen White", "Penn Badgley", "David Harbour",
            "Cillian Murphy", "Evan Peters", "Adam Driver", "Ryan Gosling", "Glen Powell"
        ],
        women: [
            "Zendaya", "Anya Taylor-Joy", "Florence Pugh", "Jenna Ortega", "Sydney Sweeney",
            "Elizabeth Olsen", "Millie Bobby Brown", "Sadie Sink", "Margot Robbie", "Emma Stone",
            "Jennifer Lawrence", "Scarlett Johansson", "Hailee Steinfeld", "Lily Collins", "Phoebe Dynevor"
        ]
    }
};

const GENRE_DB: Record<string, { value: string, label: string }[]> = {
    'k-drama': [
        { value: "random", label: "🎲 Random (隨機)" },
        { value: "Romantic Comedy", label: "💕 Rom-Com (浪漫喜劇)" },
        { value: "Melodrama", label: "😭 Melodrama (虐心愛情)" },
        { value: "Historical", label: "🏯 Historical (古裝史劇)" },
        { value: "Thriller", label: "🔪 Thriller (懸疑驚悚)" },
        { value: "Fantasy Romance", label: "✨ Fantasy (奇幻神話)" },
        { value: "Medical", label: "🏥 Medical (醫療職人)" },
        { value: "School", label: "🏫 School (青春校園)" },
        { value: "Revenge", label: "🔥 Revenge (復仇爽劇)" }
    ],
    'j-drama': [
        { value: "random", label: "🎲 Random (隨機)" },
        { value: "Slice of Life", label: "🍃 Slice of Life (溫馨日常)" },
        { value: "Workplace", label: "💼 Office/Work (職場職人)" },
        { value: "Detective Mystery", label: "🕵️ Detective (刑偵推理)" },
        { value: "School Sports", label: "⚾ School Sports (熱血校園)" },
        { value: "Suspense", label: "😨 Suspense (懸疑劇)" },
        { value: "Medical", label: "🏥 Medical (醫療劇)" },
        { value: "Food", label: "🍱 Food/Gourmet (美食劇)" },
        { value: "Tokusatsu style", label: "🦸 Tokusatsu (特攝風格)" }
    ],
    'c-drama': [
        { value: "random", label: "🎲 Random (隨機)" },
        { value: "Wuxia", label: "⚔️ Wuxia (武俠江湖)" },
        { value: "Xianxia", label: "🧚 Xianxia (仙俠玄幻)" },
        { value: "Palace", label: "👑 Palace (宮廷權謀)" },
        { value: "Modern Romance", label: "🏙️ Modern CEO (霸道總裁)" },
        { value: "Republic Era", label: "🎩 Republic Era (民國傳奇)" },
        { value: "Esports", label: "🎮 Esports (電競甜寵)" },
        { value: "Youth", label: "🚲 Youth (校園青春)" }
    ],
    'us-drama': [
        { value: "random", label: "🎲 Random (隨機)" },
        { value: "Sci-Fi", label: "👽 Sci-Fi (科幻未來)" },
        { value: "Superhero", label: "🦸 Superhero (超級英雄)" },
        { value: "Sitcom", label: "🛋️ Sitcom (情境喜劇)" },
        { value: "Teen Mystery", label: "🏫 Teen Mystery (校園懸疑)" },
        { value: "Dystopian", label: "🔥 Dystopian (反烏托邦)" },
        { value: "Crime Thriller", label: "🚓 Crime (犯罪偵查)" },
        { value: "Period Romance", label: "👒 Period (古典羅曼史)" },
        { value: "High Fantasy", label: "🐉 High Fantasy (史詩奇幻)" }
    ]
};

const FONT_STYLES: Record<string, { fontFamily: string, className: string, shadow: string }> = {
    elegant: { fontFamily: "'Nanum Myeongjo', serif", className: "font-serif tracking-widest", shadow: "drop-shadow-[0_2px_3px_rgba(0,0,0,0.3)]" },
    heavy: { fontFamily: "'Black Han Sans', sans-serif", className: "tracking-tighter uppercase", shadow: "drop-shadow-[3px_3px_0px_#000]" },
    cute: { fontFamily: "'Gamja Flower', cursive", className: "", shadow: "drop-shadow-[2px_2px_0px_rgba(0,0,0,0.2)]" },
    handwritten: { fontFamily: "'Nanum Brush Script', cursive", className: "-rotate-2", shadow: "drop-shadow-[0_2px_2px_rgba(0,0,0,0.1)]" },
    modern: { fontFamily: "'Do Hyeon', sans-serif", className: "tracking-wide", shadow: "drop-shadow-[1px_1px_2px_rgba(0,0,0,0.5)]" },
    retro: { fontFamily: "'Song Myung', serif", className: "italic", shadow: "drop-shadow-[2px_2px_0px_#8B0000]" }
};

interface CinematicPosterTabProps {
    apiKey: string;
    onError: (msg: string) => void;
    onNeedApiKey: () => void;
    onSuccess: (imageUrl: string, prompt: string, description?: string) => void;
}

const CinematicPosterTab: React.FC<CinematicPosterTabProps> = ({ apiKey, onError, onNeedApiKey, onSuccess }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);

    // State
    const [userImage, setUserImage] = useState<string | null>(null);
    const [role, setRole] = useState<"male" | "female">("male");
    const [dramaStyle, setDramaStyle] = useState('k-drama');
    const [userName, setUserName] = useState("");
    const [selectedGenre, setSelectedGenre] = useState("random");
    const [aspectRatio, setAspectRatio] = useState("2:3");
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [resolution, setResolution] = useState("2K");
    const [isGenerating, setIsGenerating] = useState(false);
    const [isRegenerating, setIsRegenerating] = useState(false);
    const [generatedResult, setGeneratedResult] = useState<any>(null);
    const [localError, setLocalError] = useState<string | null>(null);
    const [showGallery, setShowGallery] = useState(false);

    // Initial Genre effect
    useEffect(() => {
        setSelectedGenre("random");
    }, [dramaStyle]);

    // Derived
    const currentGenres = GENRE_DB[dramaStyle] || GENRE_DB['k-drama'];
    const fontStyleObj = generatedResult ? (FONT_STYLES[generatedResult.fontStyle] || FONT_STYLES.elegant) : FONT_STYLES.elegant;

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
            const reader = new FileReader();
            reader.onloadend = () => setUserImage(reader.result as string);
            reader.readAsDataURL(file);
        }
    };

    const handleGallerySelect = async (blobs: Blob[]) => {
        if (blobs.length > 0) {
            const blob = blobs[0];
            const reader = new FileReader();
            reader.onloadend = () => setUserImage(reader.result as string);
            reader.readAsDataURL(blob);
        }
        setShowGallery(false);
    };

    // API: Generate Theme (Text) using Gemini 3 Pro Image Preview
    const generateTheme = async (userDisplayName: string, partnerName: string) => {
        if (!apiKey) {
            onNeedApiKey();
            throw new Error("請先設定 API Key");
        }

        const ai = new GoogleGenAI({ apiKey });
        const model = 'gemini-3-pro-image-preview';

        const styleConfig = DRAMA_STYLES.find(s => s.id === dramaStyle) || DRAMA_STYLES[0];
        const genre = selectedGenre !== "random" ? selectedGenre : "Any suitable genre";

        const prompt = `Generate a catchy title and a short plot summary for a new ${styleConfig.prompt} poster. 
        Cast: 
        - Main Actor: "${userDisplayName}" (playing the ${role === 'male' ? 'Male Lead' : 'Female Lead'}).
        - Co-Star: "${partnerName}".
        
        Target Language for Plot: Traditional Chinese (繁體中文).
        Specific Genre: ${genre}.
        Country of Origin: ${styleConfig.country}.
        
        Instructions:
        1. Title should be catchy and fit the genre "${genre}" and style "${styleConfig.prompt}".
        2. Plot should be in Traditional Chinese and strictly follow the genre tropes of ${styleConfig.prompt}.
        3. "nativeTitle" should be in the native language of the drama style (e.g., Korean for K-Drama, Japanese for J-Drama, Chinese for C-Drama, English for US Series).
        4. Genre determines the mood, lighting, and costume design in the visual description.
        5. In the plot, refer to the Main Actor's character by the name "${userDisplayName}". Do NOT output "(女主角 飾)" or "(Male Lead 飾)". Instead, use "( ${userDisplayName} 飾 )" if you need to mention the actor's name, or just use the name "${userDisplayName}" as the character name.
        
        Return pure JSON: { 
            "title": "Title in Traditional Chinese (Translated)", 
            "nativeTitle": "Original Title in ${styleConfig.titleLang}", 
            "genre": "Should match ${genre}", 
            "fontStyle": "elegant|heavy|cute|handwritten|modern|retro", 
            "plot": "Summary in Traditional Chinese. Maximum 150 characters.", 
            "visualPrompt": "Detailed visual description in English for image generation, focusing on the mood of ${styleConfig.prompt} and genre ${genre}. Mention specific cultural clothing or setting styles if applicable (e.g. Hanbok for Historical K-Drama, Kimono/Office for J-Drama, Wuxia robes for C-Drama)." 
        }`;

        const result = await ai.models.generateContent({
            model,
            contents: [{ parts: [{ text: prompt }] }],
            config: { responseMimeType: "application/json" }
        });

        // Use result.candidates directly as per SDK v1
        const text = result.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!text) throw new Error("文案生成失敗");
        return JSON.parse(text);
    };

    // API: Generate Image
    const generatePosterImage = async (themeData: any, base64Image: string, partnerName: string, userDisplayName: string) => {
        if (!apiKey) {
            onNeedApiKey();
            throw new Error("請先設定 API Key");
        }

        const ai = new GoogleGenAI({ apiKey });
        const model = 'gemini-3-pro-image-preview'; // As per skill instructions

        const styleConfig = DRAMA_STYLES.find(s => s.id === dramaStyle) || DRAMA_STYLES[0];
        const prompt = `A cinematic ${styleConfig.prompt} poster for genre "${themeData.genre}". 
        Title text to include: "${themeData.nativeTitle}". 
        Credits text to include (optional): "${userDisplayName}" & "${partnerName}".
        Lead: user-face (representing ${userDisplayName}) + ${partnerName}. 
        Scene: ${themeData.visualPrompt}. 
        Style: ${styleConfig.country} TV Drama aesthetic.
        Target Aspect Ratio: ${aspectRatio}.
        Professional photography, movie poster quality, high details.`;

        // Check if user uploaded image
        const parts: any[] = [{ text: prompt }];
        if (base64Image) {
            parts.unshift({
                inlineData: {
                    data: base64Image.split(',')[1],
                    mimeType: 'image/jpeg',
                }
            });
        }

        const result = await ai.models.generateContent({
            model,
            contents: [{ parts }],
            config: {
                imageConfig: {
                    aspectRatio: "3:4"
                }
            }
        });

        const imagePart = result.candidates?.[0]?.content?.parts?.find((p: any) => p.inlineData);
        if (imagePart && imagePart.inlineData) {
            return `data:image/png;base64,${imagePart.inlineData.data}`;
        }
        throw new Error("海報生成失敗");
    };

    const handleGenerate = async () => {
        if (!userImage) {
            setLocalError("請先上傳照片！");
            return;
        }
        setIsGenerating(true);
        setLocalError(null);

        try {
            const styleKey = dramaStyle;
            const actorList = role === 'male' ? ACTOR_DB[styleKey].women : ACTOR_DB[styleKey].men;
            const partner = actorList[Math.floor(Math.random() * actorList.length)];
            const displayUserName = userName || "The User";
            const styleConfig = DRAMA_STYLES.find(s => s.id === dramaStyle) || DRAMA_STYLES[0];

            // 1. Generate Theme
            const theme = await generateTheme(displayUserName, partner);

            // 2. Generate Image
            const imageUrl = await generatePosterImage(theme, userImage, partner, displayUserName);

            const result = {
                ...theme,
                imageUrl,
                partner,
                userName: displayUserName,
                styleId: dramaStyle
            };
            setGeneratedResult(result);

            // Auto-save to Gallery
            const savePrompt = `[${theme.nativeTitle}] ${theme.title}: ${theme.plot.substring(0, 50)}...`;
            const fullDescription = `
**Title:** ${theme.title} (${theme.nativeTitle})
**Genre:** ${theme.genre} | **Style:** ${styleConfig.label}
**Cast:** ${displayUserName} & ${partner}

**Plot Summary:**
${theme.plot}

**Visual Concept:**
${theme.visualPrompt}
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
            const imageUrl = await generatePosterImage(generatedResult, userImage, generatedResult.partner, generatedResult.userName);
            setGeneratedResult((prev: any) => ({ ...prev, imageUrl }));

            // Auto-save regenerated image
            const savePrompt = `[${generatedResult.nativeTitle} - Regenerated] ${generatedResult.title}: ${generatedResult.plot.substring(0, 50)}...`;
            const fullDescription = `
**Title:** ${generatedResult.title} (${generatedResult.nativeTitle})
**Status:** Regenerated Version
**Genre:** ${generatedResult.genre}
**Cast:** ${generatedResult.userName} & ${generatedResult.partner}

**Plot Summary:**
${generatedResult.plot}
`.trim();
            onSuccess(imageUrl, savePrompt, fullDescription);
        } catch (err: any) {
            onError(err.message);
        } finally {
            setIsRegenerating(false);
        }
    };

    const handleDownload = async () => {
        if (!generatedResult?.imageUrl) return;
        try {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            if (!ctx) return;

            const mainImg = await loadImage(generatedResult.imageUrl);
            canvas.width = mainImg.width;
            canvas.height = mainImg.height;
            ctx.drawImage(mainImg, 0, 0);

            const filename = `DramaPoster_${Date.now()}.jpg`;
            const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
            const link = document.createElement('a');
            link.href = dataUrl;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (err) {
            onError("下載失敗");
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <style>{`@import url('https://fonts.googleapis.com/css2?family=Black+Han+Sans&family=Do+Hyeon&family=Gamja+Flower&family=Nanum+Brush+Script&family=Nanum+Myeongjo:wght@400;700&family=Song+Myung&display=swap');`}</style>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left: Controls */}
                <div className="space-y-6">
                    {/* Upload Section */}
                    <div className="bg-cream backdrop-blur-md border border-cream-dark shadow-sm rounded-[2rem] p-6 text-center group transition-all hover:bg-white/60">
                        <div
                            onClick={() => fileInputRef.current?.click()}
                            className={`border-4 border-dashed rounded-3xl h-64 flex flex-col items-center justify-center cursor-pointer overflow-hidden transition-all ${userImage ? 'border-primary' : 'border-bronze-light/30 hover:border-primary/50'}`}
                        >
                            {userImage ? (
                                <img src={userImage} className="w-full h-full object-cover" alt="User Upload" />
                            ) : (
                                <div className="space-y-2">
                                    <Upload className="w-10 h-10 text-bronze-light mx-auto" />
                                    <p className="text-bronze-light font-bold">點擊上傳你的照片</p>
                                    <p className="text-xs text-bronze-light/70">(自拍效果最好！)</p>
                                </div>
                            )}
                            <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="image/*" className="hidden" />
                        </div>
                        <button
                            onClick={() => setShowGallery(true)}
                            className="mt-3 w-full flex items-center justify-center gap-2 px-4 py-2 bg-secondary/10 hover:bg-secondary/20 text-secondary rounded-xl text-sm font-bold transition-colors"
                        >
                            <FolderHeart size={16} />
                            從作品集選取
                        </button>
                    </div>

                    {/* Settings Section */}
                    <div className="bg-cream backdrop-blur-md border border-cream-dark shadow-sm rounded-[2rem] p-6 space-y-4">
                        <h2 className="text-sm font-black text-bronze-light uppercase tracking-widest flex items-center gap-2">
                            <Settings size={16} /> 劇本與角色設定
                        </h2>

                        <div>
                            <label className="text-xs font-bold text-bronze-light ml-2 mb-1 block">劇集風格</label>
                            <div className="grid grid-cols-2 gap-2">
                                {DRAMA_STYLES.map(opt => (
                                    <button
                                        key={opt.id}
                                        onClick={() => setDramaStyle(opt.id)}
                                        className={`p-3 rounded-xl border text-left transition-all ${dramaStyle === opt.id ? 'bg-primary text-white border-primary shadow-md' : 'bg-white border-cream-dark text-bronze-text hover:bg-white/80'}`}
                                    >
                                        <div className="text-xs font-black">{opt.label}</div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="flex bg-white rounded-2xl border border-cream-dark p-1">
                            <button onClick={() => setRole('male')} className={`flex-1 py-2 rounded-xl font-bold text-xs transition-all ${role === 'male' ? 'bg-secondary text-bronze shadow-sm' : 'text-bronze-light hover:bg-cream-light'}`}>
                                男主角
                            </button>
                            <button onClick={() => setRole('female')} className={`flex-1 py-2 rounded-xl font-bold text-xs transition-all ${role === 'female' ? 'bg-primary text-white shadow-sm' : 'text-bronze-light hover:bg-cream-light'}`}>
                                女主角
                            </button>
                        </div>

                        <div>
                            <label className="text-xs font-bold text-bronze-light ml-2 mb-1 block">演員藝名 (選填)</label>
                            <input
                                type="text"
                                value={userName}
                                onChange={(e) => setUserName(e.target.value)}
                                placeholder="輸入你的藝名..."
                                className="w-full px-4 py-3 bg-white border border-cream-dark rounded-xl font-bold text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 text-bronze-text placeholder-bronze-light/50"
                            />
                        </div>

                        <div>
                            <label className="text-xs font-bold text-bronze-light ml-2 mb-1 block">劇本類型</label>
                            <select
                                value={selectedGenre}
                                onChange={(e) => setSelectedGenre(e.target.value)}
                                className="w-full px-4 py-3 bg-white border border-cream-dark rounded-xl font-bold text-sm outline-none focus:border-primary text-bronze-text"
                            >
                                {currentGenres.map(opt => (
                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                            </select>
                        </div>

                        <button
                            onClick={handleGenerate}
                            disabled={isGenerating || isRegenerating}
                            className={`w-full py-4 rounded-xl font-black text-lg shadow-lg transform transition-all active:scale-95 flex items-center justify-center gap-2 ${isGenerating ? 'bg-cream-dark text-bronze-light cursor-not-allowed' : 'bg-primary hover:bg-primary-hover text-white shadow-primary/30'}`}
                        >
                            {isGenerating ? <RefreshCw className="animate-spin" /> : <Sparkles />}
                            {isGenerating ? '導演正在開拍中...' : '生成影劇海報'}
                        </button>
                        {localError && <div className="text-red-500 text-xs font-bold text-center animate-pulse">{localError}</div>}
                    </div>
                </div>

                {/* Right: Results */}
                <div className="bg-cream backdrop-blur-md border border-cream-dark shadow-sm rounded-[2rem] p-8 h-fit min-h-[500px] flex flex-col items-center justify-center relative group">
                    {generatedResult ? (
                        <>
                            <div className="relative w-full rounded-2xl overflow-hidden shadow-2xl border-4 border-white">
                                <img src={generatedResult.imageUrl} className="w-full h-auto object-contain" alt="Generated Poster" />

                                {/* Hover Actions */}
                                {!isRegenerating && (
                                    <div className="absolute top-4 right-4 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                        <button onClick={handleRegenerateImage} className="bg-white p-3 rounded-full text-blue-500 shadow-lg hover:scale-110 transition-transform" title="重新生成圖片">
                                            <RefreshCw size={20} />
                                        </button>
                                        <button onClick={handleDownload} className="bg-white p-3 rounded-full text-green-500 shadow-lg hover:scale-110 transition-transform" title="下載海報">
                                            <Download size={20} />
                                        </button>
                                    </div>
                                )}

                                {/* Regenerating Overlay */}
                                {isRegenerating && (
                                    <div className="absolute inset-0 bg-white/50 backdrop-blur-sm flex items-center justify-center">
                                        <div className="bg-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2">
                                            <RefreshCw className="animate-spin text-primary" size={16} />
                                            <span className="text-xs font-bold text-bronze">重新設計中...</span>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="mt-8 text-center space-y-4 max-w-md">
                                <h3
                                    style={{ fontFamily: fontStyleObj.fontFamily }}
                                    className={`text-4xl ${fontStyleObj.className} ${fontStyleObj.shadow} text-bronze-text`}
                                >
                                    {generatedResult.nativeTitle}
                                </h3>
                                <p className="text-lg font-black text-primary">{generatedResult.title}</p>

                                <div className="text-xs font-bold text-bronze-light uppercase tracking-widest border-t border-cream-dark pt-4 mt-4">
                                    Starring: {generatedResult.userName} & {generatedResult.partner}
                                </div>

                                <p className="text-sm text-bronze-text/80 italic bg-white/50 p-4 rounded-xl border border-cream-dark">
                                    {generatedResult.plot}
                                </p>
                            </div>
                        </>
                    ) : (
                        <div className="text-center space-y-4 opacity-50">
                            <Film size={64} className="mx-auto text-bronze-light" />
                            <p className="text-bronze-light font-bold">你的傑作將會出現在這裡</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Gallery Picker Modal */}
            {showGallery && (
                <GalleryPicker
                    onSelect={handleGallerySelect}
                    onClose={() => setShowGallery(false)}
                />
            )}
        </div>
    );
};

export default CinematicPosterTab;

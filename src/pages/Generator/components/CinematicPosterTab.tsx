import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Settings, Upload, RefreshCw,
    Download, Sparkles, Film, FolderHeart, ImagePlus, UserRoundPlus, X
} from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { GalleryPicker } from '../../../components/GalleryPicker';

// --- Constants & DB ---
const DRAMA_STYLES = [
    { id: 'k-drama', label: 'KR K-Drama (韓劇)', prompt: 'Korean Drama', titleLang: 'ko', country: 'South Korea' },
    { id: 'j-drama', label: 'JP J-Drama (日劇)', prompt: 'Japanese Drama', titleLang: 'ja', country: 'Japan' },
    { id: 'c-drama', label: 'CN C-Drama (陸劇)', prompt: 'Chinese Drama', titleLang: 'zh', country: 'China' },
    { id: 'us-drama', label: 'US Series (美劇)', prompt: 'American TV Series', titleLang: 'en', country: 'USA' },
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
            "Timothee Chalamet", "Tom Holland", "Henry Cavill", "Chris Evans", "Pedro Pascal",
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
        { value: "random", label: "隨機 Random" },
        { value: "Romantic Comedy", label: "浪漫喜劇 Rom-Com" },
        { value: "Melodrama", label: "情感劇 Melodrama" },
        { value: "Historical", label: "古裝 Historical" },
        { value: "Thriller", label: "驚悚 Thriller" },
        { value: "Fantasy Romance", label: "奇幻愛情 Fantasy" },
        { value: "Medical", label: "醫療 Medical" },
        { value: "School", label: "校園 School" },
        { value: "Revenge", label: "復仇 Revenge" }
    ],
    'j-drama': [
        { value: "random", label: "隨機 Random" },
        { value: "Slice of Life", label: "日常 Slice of Life" },
        { value: "Workplace", label: "職場 Workplace" },
        { value: "Detective Mystery", label: "推理 Detective" },
        { value: "School Sports", label: "校園運動 School Sports" },
        { value: "Suspense", label: "懸疑 Suspense" },
        { value: "Medical", label: "醫療 Medical" },
        { value: "Food", label: "美食 Food/Gourmet" },
        { value: "Tokusatsu style", label: "特攝 Tokusatsu" }
    ],
    'c-drama': [
        { value: "random", label: "隨機 Random" },
        { value: "Wuxia", label: "武俠 Wuxia" },
        { value: "Xianxia", label: "仙俠 Xianxia" },
        { value: "Palace", label: "宮廷 Palace" },
        { value: "Modern Romance", label: "現代愛情 Modern Romance" },
        { value: "Republic Era", label: "民國 Republic Era" },
        { value: "Esports", label: "電競 Esports" },
        { value: "Youth", label: "青春 Youth" }
    ],
    'us-drama': [
        { value: "random", label: "隨機 Random" },
        { value: "Sci-Fi", label: "科幻 Sci-Fi" },
        { value: "Superhero", label: "超級英雄 Superhero" },
        { value: "Sitcom", label: "情境喜劇 Sitcom" },
        { value: "Teen Mystery", label: "青少年懸疑 Teen Mystery" },
        { value: "Dystopian", label: "反烏托邦 Dystopian" },
        { value: "Crime Thriller", label: "犯罪驚悚 Crime Thriller" },
        { value: "Period Romance", label: "年代愛情 Period Romance" },
        { value: "High Fantasy", label: "史詩奇幻 High Fantasy" }
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
    const { t } = useTranslation();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const secondFileInputRef = useRef<HTMLInputElement>(null);

    // State
    const [userImage, setUserImage] = useState<string | null>(null);
    const [secondUserImage, setSecondUserImage] = useState<string | null>(null);
    const [role, setRole] = useState<"male" | "female">("male");
    const [dramaStyle, setDramaStyle] = useState('k-drama');
    const [userName, setUserName] = useState("");
    const [firstCharacterName, setFirstCharacterName] = useState("");
    const [secondActorName, setSecondActorName] = useState("");
    const [secondCharacterName, setSecondCharacterName] = useState("");
    const [selectedGenre, setSelectedGenre] = useState("random");
    const [aspectRatio, setAspectRatio] = useState("2:3");
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [resolution, setResolution] = useState("2K");
    const [isGenerating, setIsGenerating] = useState(false);
    const [isRegenerating, setIsRegenerating] = useState(false);
    const [generatedResult, setGeneratedResult] = useState<any>(null);
    const [localError, setLocalError] = useState<string | null>(null);
    const [showGallery, setShowGallery] = useState(false);
    const [galleryTarget, setGalleryTarget] = useState<'first' | 'second'>('first');

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

    const handleSecondFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => setSecondUserImage(reader.result as string);
            reader.readAsDataURL(file);
        }
    };

    const handleGallerySelect = async (blobs: Blob[]) => {
        if (blobs.length > 0) {
            const blob = blobs[0];
            const reader = new FileReader();
            reader.onloadend = () => {
                const dataUrl = reader.result as string;
                if (galleryTarget === 'second') {
                    setSecondUserImage(dataUrl);
                } else {
                    setUserImage(dataUrl);
                }
            };
            reader.readAsDataURL(blob);
        }
        setShowGallery(false);
        setGalleryTarget('first');
    };

    // API: Generate Theme (Text) using Gemini 3 Pro Image Preview
    const generateTheme = async (
        firstLeadActor: string,
        firstLeadCharacter: string,
        secondLeadActor: string,
        secondLeadCharacter: string
    ) => {
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
        - Lead 1 Actor: "${firstLeadActor}" (playing character "${firstLeadCharacter}", ${role === 'male' ? 'Male Lead' : 'Female Lead'}).
        - Lead 2 Actor: "${secondLeadActor}" (playing character "${secondLeadCharacter}").
        
        Target Language for Plot: Traditional Chinese (zh-TW).
        Specific Genre: ${genre}.
        Country of Origin: ${styleConfig.country}.
        
        Instructions:
        1. Title should be catchy and fit the genre "${genre}" and style "${styleConfig.prompt}".
        2. Plot should be in Traditional Chinese and strictly follow the genre tropes of ${styleConfig.prompt}.
        3. "nativeTitle" should be in the native language of the drama style (e.g., Korean for K-Drama, Japanese for J-Drama, Chinese for C-Drama, English for US Series).
        4. Genre determines the mood, lighting, and costume design in the visual description.
        5. In the plot, refer to leads by character names "${firstLeadCharacter}" and "${secondLeadCharacter}".
        6. Do not use placeholders like "Male Lead/Female Lead". Always use provided character names.
        
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
        if (!text) throw new Error("主題生成失敗");
        return JSON.parse(text);
    };

    // API: Generate Image
    const generatePosterImage = async (
        themeData: any,
        base64Image: string,
        secondBase64Image: string | null,
        firstLeadActor: string,
        firstLeadCharacter: string,
        secondLeadActor: string,
        secondLeadCharacter: string
    ) => {
        if (!apiKey) {
            onNeedApiKey();
            throw new Error("請先設定 API Key");
        }

        const ai = new GoogleGenAI({ apiKey });
        const model = 'gemini-3-pro-image-preview'; // As per skill instructions

        const styleConfig = DRAMA_STYLES.find(s => s.id === dramaStyle) || DRAMA_STYLES[0];
        const prompt = `A cinematic ${styleConfig.prompt} poster for genre "${themeData.genre}". 
        Title text to include: "${themeData.nativeTitle}". 
        Credits text to include (optional): "${firstLeadActor} as ${firstLeadCharacter}" & "${secondLeadActor} as ${secondLeadCharacter}".
        Lead 1: first uploaded face is "${firstLeadActor}" as character "${firstLeadCharacter}".
        ${secondBase64Image ? `Lead 2: use the second uploaded face as "${secondLeadActor}" playing "${secondLeadCharacter}" with visible chemistry framing.` : `Co-star style reference: ${secondLeadActor} as ${secondLeadCharacter}.`}
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
                    mimeType: base64Image.split(';')[0].split(':')[1] || 'image/jpeg',
                }
            });
        }
        if (secondBase64Image) {
            parts.unshift({
                inlineData: {
                    data: secondBase64Image.split(',')[1],
                    mimeType: secondBase64Image.split(';')[0].split(':')[1] || 'image/jpeg',
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
        throw new Error("海報圖片生成失敗");
    };

    const handleGenerate = async () => {
        if (!userImage) {
            setLocalError(t('generator.upload.errorNoImage', { defaultValue: 'Please upload an image first.' }));
            return;
        }
        setIsGenerating(true);
        setLocalError(null);

        try {
            const styleKey = dramaStyle;
            const actorList = role === 'male' ? ACTOR_DB[styleKey].women : ACTOR_DB[styleKey].men;
            const partner = actorList[Math.floor(Math.random() * actorList.length)];
            const firstLeadActor = userName || "The User";
            const firstLeadCharacter = firstCharacterName || firstLeadActor;
            const secondLeadActor = secondActorName || partner;
            const secondLeadCharacter = secondCharacterName || secondLeadActor;
            const styleConfig = DRAMA_STYLES.find(s => s.id === dramaStyle) || DRAMA_STYLES[0];

            // 1. Generate Theme
            const theme = await generateTheme(
                firstLeadActor,
                firstLeadCharacter,
                secondLeadActor,
                secondLeadCharacter
            );

            // 2. Generate Image
            const imageUrl = await generatePosterImage(
                theme,
                userImage,
                secondUserImage,
                firstLeadActor,
                firstLeadCharacter,
                secondLeadActor,
                secondLeadCharacter
            );

            const result = {
                ...theme,
                imageUrl,
                partner,
                userName: firstLeadActor,
                firstLeadActor,
                firstLeadCharacter,
                secondLeadActor,
                secondLeadCharacter,
                styleId: dramaStyle,
                hasSecondLead: !!secondUserImage
            };
            setGeneratedResult(result);

            // Auto-save to Gallery
            const savePrompt = `[${theme.nativeTitle}] ${theme.title}: ${theme.plot.substring(0, 50)}...`;
            const fullDescription = `
**Title:** ${theme.title} (${theme.nativeTitle})
**Genre:** ${theme.genre} | **Style:** ${styleConfig.label}
**Cast:** ${firstLeadActor} as ${firstLeadCharacter} | ${secondLeadActor} as ${secondLeadCharacter}

**Plot Summary:**
${theme.plot}

**Visual Concept:**
${theme.visualPrompt}
`.trim();
            onSuccess(imageUrl, savePrompt, fullDescription);

        } catch (err: any) {
            console.error(err);
            const msg = err.message || "生成時發生錯誤";
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
            const imageUrl = await generatePosterImage(
                generatedResult,
                userImage,
                secondUserImage,
                generatedResult.firstLeadActor || generatedResult.userName,
                generatedResult.firstLeadCharacter || generatedResult.userName,
                generatedResult.secondLeadActor || generatedResult.partner,
                generatedResult.secondLeadCharacter || generatedResult.partner
            );
            setGeneratedResult((prev: any) => ({ ...prev, imageUrl }));

            // Auto-save regenerated image
            const savePrompt = `[${generatedResult.nativeTitle} - Regenerated] ${generatedResult.title}: ${generatedResult.plot.substring(0, 50)}...`;
            const fullDescription = `
**Title:** ${generatedResult.title} (${generatedResult.nativeTitle})
**Status:** Regenerated Version
**Genre:** ${generatedResult.genre}
**Cast:** ${(generatedResult.firstLeadActor || generatedResult.userName)} as ${(generatedResult.firstLeadCharacter || generatedResult.userName)} | ${(generatedResult.secondLeadActor || generatedResult.partner)} as ${(generatedResult.secondLeadCharacter || generatedResult.partner)}

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
            onError("下載失敗，請重試");
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
                                    <p className="text-bronze-light font-bold">上傳主角照片</p>
                                    <p className="text-xs text-bronze-light/70">(建議半身或清晰正臉)</p>
                                </div>
                            )}
                            <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="image/*" className="hidden" />
                        </div>
                        <button
                            onClick={() => {
                                setGalleryTarget('first');
                                setShowGallery(true);
                            }}
                            className="mt-3 w-full flex items-center justify-center gap-2 px-4 py-2 bg-secondary/10 hover:bg-secondary/20 text-bronze-text rounded-xl text-sm font-bold transition-colors"
                        >
                            <FolderHeart size={16} />
                            {t('app.selectFromGallery', { defaultValue: '從作品集選取' })}
                        </button>
                        <div className="mt-4 border-t border-cream-dark/60 pt-4 text-left">
                            <label className="text-xs font-bold text-bronze-light mb-2 flex items-center gap-2">
                                <UserRoundPlus size={14} />
                                {t('generator.cinematic.secondLeadOptional', { defaultValue: '第二主角（選填）' })}
                            </label>
                            <div
                                onClick={() => secondFileInputRef.current?.click()}
                                className={`relative border-2 border-dashed rounded-2xl h-36 flex items-center justify-center cursor-pointer transition-all ${
                                    secondUserImage ? 'border-secondary' : 'border-cream-dark/70 hover:border-secondary/60'
                                }`}
                            >
                                {secondUserImage ? (
                                    <>
                                        <img src={secondUserImage} className="w-full h-full object-cover rounded-2xl" alt="Second Lead Upload" />
                                        <button
                                            type="button"
                                            onClick={(e) => { e.stopPropagation(); setSecondUserImage(null); }}
                                            className="absolute top-2 right-2 p-1.5 bg-white/95 rounded-full text-red-500 shadow hover:scale-110 transition-transform"
                                            title={t('generator.cinematic.removeSecondLead', { defaultValue: '移除第二主角' })}
                                        >
                                            <X size={14} />
                                        </button>
                                    </>
                                ) : (
                                    <div className="text-center">
                                        <ImagePlus className="w-7 h-7 text-bronze-light mx-auto mb-1" />
                                        <p className="text-xs font-bold text-bronze-light">{t('generator.cinematic.uploadSecondPhoto', { defaultValue: '上傳第二張照片' })}</p>
                                    </div>
                                )}
                                <input type="file" ref={secondFileInputRef} onChange={handleSecondFileUpload} accept="image/*" className="hidden" />
                            </div>
                            <button
                                type="button"
                                onClick={() => {
                                    setGalleryTarget('second');
                                    setShowGallery(true);
                                }}
                                className="mt-2 w-full flex items-center justify-center gap-2 px-3 py-2 bg-secondary/10 hover:bg-secondary/20 text-bronze-text rounded-xl text-xs font-bold transition-colors"
                            >
                                <FolderHeart size={14} />
                                {t('generator.cinematic.selectSecondFromGallery', { defaultValue: '從作品集選取第二張照片' })}
                            </button>
                        </div>
                    </div>

                    {/* Settings Section */}
                    <div className="bg-cream backdrop-blur-md border border-cream-dark shadow-sm rounded-[2rem] p-6 space-y-4">
                        <h2 className="text-sm font-black text-bronze-light uppercase tracking-widest flex items-center gap-2">
                            <Settings size={16} /> 海報設定
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
                            <label className="text-xs font-bold text-bronze-light ml-2 mb-1 block">
                                {t('generator.cinematic.firstLeadActor', { defaultValue: '第一主角演員藝名' })}
                            </label>
                            <input
                                type="text"
                                value={userName}
                                onChange={(e) => setUserName(e.target.value)}
                                placeholder={t('generator.cinematic.firstLeadActorPlaceholder', { defaultValue: '例如：白川澤' })}
                                className="w-full px-4 py-3 bg-white border border-cream-dark rounded-xl font-bold text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 text-bronze-text placeholder-bronze-light/50"
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            <div>
                                <label className="text-xs font-bold text-bronze-light ml-2 mb-1 block">
                                    {t('generator.cinematic.firstLeadCharacter', { defaultValue: '第一主角角色名' })}
                                </label>
                                <input
                                    type="text"
                                    value={firstCharacterName}
                                    onChange={(e) => setFirstCharacterName(e.target.value)}
                                    placeholder={t('generator.cinematic.firstLeadCharacterPlaceholder', { defaultValue: '例如：沈知夏' })}
                                    className="w-full px-4 py-3 bg-white border border-cream-dark rounded-xl font-bold text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 text-bronze-text placeholder-bronze-light/50"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-bronze-light ml-2 mb-1 block">
                                    {t('generator.cinematic.secondLeadActor', { defaultValue: '第二主角演員藝名' })}
                                </label>
                                <input
                                    type="text"
                                    value={secondActorName}
                                    onChange={(e) => setSecondActorName(e.target.value)}
                                    placeholder={t('generator.cinematic.secondLeadActorPlaceholder', { defaultValue: '例如：林夏（可留空隨機）' })}
                                    className="w-full px-4 py-3 bg-white border border-cream-dark rounded-xl font-bold text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 text-bronze-text placeholder-bronze-light/50"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="text-xs font-bold text-bronze-light ml-2 mb-1 block">
                                {t('generator.cinematic.secondLeadCharacter', { defaultValue: '第二主角角色名' })}
                            </label>
                            <input
                                type="text"
                                value={secondCharacterName}
                                onChange={(e) => setSecondCharacterName(e.target.value)}
                                placeholder={t('generator.cinematic.secondLeadCharacterPlaceholder', { defaultValue: '例如：程亦凡' })}
                                className="w-full px-4 py-3 bg-white border border-cream-dark rounded-xl font-bold text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 text-bronze-text placeholder-bronze-light/50"
                            />
                        </div>

                        <div>
                            <label className="text-xs font-bold text-bronze-light ml-2 mb-1 block">故事類型</label>
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
                            {isGenerating ? '生成中...' : '生成影劇海報'}
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
                                            <span className="text-xs font-bold text-bronze">重新生成中...</span>
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
                                    主演：{(generatedResult.firstLeadActor || generatedResult.userName)} 飾 {(generatedResult.firstLeadCharacter || generatedResult.userName)} | {(generatedResult.secondLeadActor || generatedResult.partner)} 飾 {(generatedResult.secondLeadCharacter || generatedResult.partner)}
                                </div>

                                <p className="text-sm text-bronze-text/80 italic bg-white/50 p-4 rounded-xl border border-cream-dark">
                                    {generatedResult.plot}
                                </p>
                            </div>
                        </>
                    ) : (
                        <div className="text-center space-y-4 opacity-50">
                            <Film size={64} className="mx-auto text-bronze-light" />
                            <p className="text-bronze-light font-bold">你的影劇海報將顯示在這裡</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Gallery Picker Modal */}
            {showGallery && (
                <GalleryPicker
                    onSelect={handleGallerySelect}
                    onClose={() => {
                        setShowGallery(false);
                        setGalleryTarget('first');
                    }}
                />
            )}
        </div>
    );
};

export default CinematicPosterTab;


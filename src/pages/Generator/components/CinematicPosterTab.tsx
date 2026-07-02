import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Download,
    Film,
    FolderHeart,
    ImagePlus,
    Key,
    RefreshCw,
    Settings,
    Sparkles,
    Upload,
    UserRoundPlus,
    X,
} from 'lucide-react';
import { GoogleGenAI } from '@google/genai';
import { GalleryPicker } from '../../../components/GalleryPicker';
import { ProviderSwitcher } from '../../../components/shared/ProviderSwitcher';
import { AiProvider, PROVIDER_LABELS } from '../../../shared/geminiApiKey';
import { generateOpenAiImage } from '../services/openaiImageService';
import { generateOpenAiJson } from '../services/openaiTextService';

const DRAMA_STYLES = [
    { id: 'k-drama', label: 'KR K-Drama', prompt: 'Korean Drama', titleLang: 'ko', country: 'South Korea' },
    { id: 'j-drama', label: 'JP J-Drama', prompt: 'Japanese Drama', titleLang: 'ja', country: 'Japan' },
    { id: 'c-drama', label: 'CN C-Drama', prompt: 'Chinese Drama', titleLang: 'zh', country: 'China' },
    { id: 'us-drama', label: 'US Series', prompt: 'American TV Series', titleLang: 'en', country: 'USA' },
] as const;

const ACTOR_DB: Record<string, { men: string[]; women: string[] }> = {
    'k-drama': {
        men: ['Hyun Bin', 'Gong Yoo', 'Park Seo-joon', 'Lee Min-ho', 'Song Joong-ki', 'Park Bo-gum'],
        women: ['Son Ye-jin', 'Song Hye-kyo', 'IU', 'Park Min-young', 'Kim Ji-won', 'Kim Go-eun'],
    },
    'j-drama': {
        men: ['Takeru Satoh', 'Kento Yamazaki', 'Masaki Suda', 'Ryo Yoshizawa', 'Mackenyu'],
        women: ['Yui Aragaki', 'Satomi Ishihara', 'Haruka Ayase', 'Masami Nagasawa', 'Kasumi Arimura'],
    },
    'c-drama': {
        men: ['Xiao Zhan', 'Wang Yibo', 'Yang Yang', 'Wu Lei', 'Cheng Yi'],
        women: ['Dilraba Dilmurat', 'Yang Mi', 'Zhao Lusi', 'Zhao Liying', 'Bai Lu'],
    },
    'us-drama': {
        men: ['Timothee Chalamet', 'Tom Holland', 'Henry Cavill', 'Pedro Pascal', 'Ryan Gosling'],
        women: ['Zendaya', 'Anya Taylor-Joy', 'Florence Pugh', 'Jenna Ortega', 'Emma Stone'],
    },
};

const GENRE_DB: Record<string, Array<{ value: string; label: string }>> = {
    'k-drama': [
        { value: 'random', label: '隨機 Random' },
        { value: 'Romantic Comedy', label: '浪漫喜劇 Rom-Com' },
        { value: 'Melodrama', label: '狗血情愛 Melodrama' },
        { value: 'Historical', label: '古裝 Historical' },
        { value: 'Thriller', label: '驚悚 Thriller' },
    ],
    'j-drama': [
        { value: 'random', label: '隨機 Random' },
        { value: 'Slice of Life', label: '日常 Slice of Life' },
        { value: 'Workplace', label: '職場 Workplace' },
        { value: 'Detective Mystery', label: '推理 Detective' },
        { value: 'Suspense', label: '懸疑 Suspense' },
    ],
    'c-drama': [
        { value: 'random', label: '隨機 Random' },
        { value: 'Wuxia', label: '武俠 Wuxia' },
        { value: 'Xianxia', label: '仙俠 Xianxia' },
        { value: 'Palace', label: '宮廷 Palace' },
        { value: 'Modern Romance', label: '現代愛情 Modern Romance' },
    ],
    'us-drama': [
        { value: 'random', label: '隨機 Random' },
        { value: 'Sci-Fi', label: '科幻 Sci-Fi' },
        { value: 'Superhero', label: '超級英雄 Superhero' },
        { value: 'Crime Thriller', label: '犯罪驚悚 Crime Thriller' },
        { value: 'Teen Mystery', label: '青春懸疑 Teen Mystery' },
    ],
};

const FONT_STYLES = {
    elegant: { fontFamily: "'Nanum Myeongjo', serif", className: 'font-serif tracking-widest', shadow: 'drop-shadow-[0_2px_3px_rgba(0,0,0,0.3)]' },
    heavy: { fontFamily: "'Black Han Sans', sans-serif", className: 'tracking-tighter uppercase', shadow: 'drop-shadow-[3px_3px_0px_#000]' },
    cute: { fontFamily: "'Gamja Flower', cursive", className: '', shadow: 'drop-shadow-[2px_2px_0px_rgba(0,0,0,0.2)]' },
    handwritten: { fontFamily: "'Nanum Brush Script', cursive", className: '-rotate-2', shadow: 'drop-shadow-[0_2px_2px_rgba(0,0,0,0.1)]' },
    modern: { fontFamily: "'Do Hyeon', sans-serif", className: 'tracking-wide', shadow: 'drop-shadow-[1px_1px_2px_rgba(0,0,0,0.5)]' },
    retro: { fontFamily: "'Song Myung', serif", className: 'italic', shadow: 'drop-shadow-[2px_2px_0px_#8B0000]' },
} as const;

const GEMINI_CINEMATIC_MODEL = 'gemini-3-pro-image-preview';
const OPENAI_CINEMATIC_MODEL = 'gpt-image-2';

type ThemeData = {
    title: string;
    nativeTitle: string;
    genre: string;
    fontStyle: keyof typeof FONT_STYLES;
    plot: string;
    visualPrompt: string;
};

const CINEMATIC_THEME_SCHEMA = {
    type: 'object',
    additionalProperties: false,
    required: ['title', 'nativeTitle', 'genre', 'fontStyle', 'plot', 'visualPrompt'],
    properties: {
        title: { type: 'string' },
        nativeTitle: { type: 'string' },
        genre: { type: 'string' },
        fontStyle: { type: 'string', enum: Object.keys(FONT_STYLES) },
        plot: { type: 'string' },
        visualPrompt: { type: 'string' },
    },
};

interface CinematicPosterTabProps {
    provider: AiProvider;
    apiKeys: Record<AiProvider, string>;
    onProviderChange: (provider: AiProvider) => void;
    onError: (msg: string) => void;
    onNeedApiKey: (provider: AiProvider) => void;
    onSuccess: (imageUrl: string, prompt: string, description?: string) => void;
}

const CinematicPosterTab: React.FC<CinematicPosterTabProps> = ({
    provider,
    apiKeys,
    onProviderChange,
    onError,
    onNeedApiKey,
    onSuccess,
}) => {
    const { t } = useTranslation();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const secondFileInputRef = useRef<HTMLInputElement>(null);

    const [userImage, setUserImage] = useState<string | null>(null);
    const [secondUserImage, setSecondUserImage] = useState<string | null>(null);
    const [role, setRole] = useState<'male' | 'female'>('male');
    const [secondRole, setSecondRole] = useState<'male' | 'female'>('female');
    const [dramaStyle, setDramaStyle] = useState<typeof DRAMA_STYLES[number]['id']>('k-drama');
    const [userName, setUserName] = useState('');
    const [firstCharacterName, setFirstCharacterName] = useState('');
    const [secondActorName, setSecondActorName] = useState('');
    const [secondCharacterName, setSecondCharacterName] = useState('');
    const [selectedGenre, setSelectedGenre] = useState('random');
    const [aspectRatio, setAspectRatio] = useState('2:3');
    const [isGenerating, setIsGenerating] = useState(false);
    const [isRegenerating, setIsRegenerating] = useState(false);
    const [generatedResult, setGeneratedResult] = useState<(ThemeData & {
        imageUrl: string;
        partner: string;
        userName: string;
        firstLeadActor: string;
        firstLeadCharacter: string;
        secondLeadActor: string;
        secondLeadCharacter: string;
        styleId: string;
        hasSecondLead: boolean;
    }) | null>(null);
    const [localError, setLocalError] = useState<string | null>(null);
    const [showGallery, setShowGallery] = useState(false);
    const [galleryTarget, setGalleryTarget] = useState<'first' | 'second'>('first');

    const apiKey = apiKeys[provider];
    const currentGenres = GENRE_DB[dramaStyle] || GENRE_DB['k-drama'];
    const fontStyleObj = generatedResult ? FONT_STYLES[generatedResult.fontStyle] || FONT_STYLES.elegant : FONT_STYLES.elegant;
    const imageModelLabel = provider === 'openai' ? OPENAI_CINEMATIC_MODEL : GEMINI_CINEMATIC_MODEL;

    useEffect(() => {
        setSelectedGenre('random');
    }, [dramaStyle]);

    const loadImage = (src: string): Promise<HTMLImageElement> => new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => resolve(img);
        img.onerror = (error) => reject(error);
        img.src = src;
    });

    const readImageBlob = (blob: Blob, target: 'first' | 'second') => {
        const reader = new FileReader();
        reader.onloadend = () => {
            const dataUrl = reader.result as string;
            if (target === 'second') {
                setSecondUserImage(dataUrl);
            } else {
                setUserImage(dataUrl);
            }
        };
        reader.readAsDataURL(blob);
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            readImageBlob(file, 'first');
        }
    };

    const handleSecondFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            readImageBlob(file, 'second');
        }
    };

    const handleGallerySelect = async (blobs: Blob[]) => {
        if (blobs[0]) {
            readImageBlob(blobs[0], galleryTarget);
        }
        setShowGallery(false);
        setGalleryTarget('first');
    };


    const generateTheme = async (
        firstLeadActor: string,
        firstLeadCharacter: string,
        secondLeadActor: string,
        secondLeadCharacter: string,
        secondLeadRole: 'male' | 'female',
    ): Promise<ThemeData> => {
        if (!apiKey) {
            onNeedApiKey(provider);
            throw new Error(`Please set your ${PROVIDER_LABELS[provider]} API key.`);
        }

        const styleConfig = DRAMA_STYLES.find((style) => style.id === dramaStyle) || DRAMA_STYLES[0];
        const genre = selectedGenre !== 'random' ? selectedGenre : 'Any suitable genre';

        const prompt = `Generate a catchy title and a short plot summary for a new ${styleConfig.prompt} poster.
Cast:
- Lead 1 Actor: "${firstLeadActor}" (playing character "${firstLeadCharacter}", ${role === 'male' ? 'Male Lead' : 'Female Lead'}).
- Lead 2 Actor: "${secondLeadActor}" (playing character "${secondLeadCharacter}", ${secondLeadRole === 'male' ? 'Male Lead' : 'Female Lead'}).

Target Language for Plot: Traditional Chinese (zh-TW).
Specific Genre: ${genre}.
Country of Origin: ${styleConfig.country}.

Instructions:
1. Title should be catchy and fit the genre "${genre}" and style "${styleConfig.prompt}".
2. Plot should be in Traditional Chinese and strictly follow the genre tropes of ${styleConfig.prompt}.
3. "nativeTitle" should be in the native language of the drama style.
4. Genre determines mood, lighting, and costume design in the visual description.
5. In the plot, refer to leads by character names "${firstLeadCharacter}" and "${secondLeadCharacter}".
6. Do not use placeholders like "Male Lead/Female Lead". Always use provided character names.

Return pure JSON:
{
  "title": "Title in Traditional Chinese",
  "nativeTitle": "Original title in ${styleConfig.titleLang}",
  "genre": "${genre}",
  "fontStyle": "elegant|heavy|cute|handwritten|modern|retro",
  "plot": "Summary in Traditional Chinese. Maximum 150 characters.",
  "visualPrompt": "Detailed visual description in English for image generation."
}`;

        if (provider === 'openai') {
            return generateOpenAiJson<ThemeData>(apiKey, prompt, {
                instructions: 'You are a premium TV poster concept writer. Return JSON only. The plot must be in Traditional Chinese, the visualPrompt must be in English, and the output must strictly follow the requested schema.',
                schemaName: 'cinematic_poster_theme',
                schemaDescription: 'Poster title, plot, genre, font choice, and visual prompt for a cinematic poster',
                schema: CINEMATIC_THEME_SCHEMA,
                maxOutputTokens: 420,
            });
        }

        const ai = new GoogleGenAI({ apiKey });

        const result = await ai.models.generateContent({
            model: GEMINI_CINEMATIC_MODEL,
            contents: [{ parts: [{ text: prompt }] }],
            config: { responseMimeType: 'application/json' },
        });

        const text = result.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!text) {
            throw new Error(t('generator.cinematic.themeFailedError', { defaultValue: '主題設定生成失敗。' }));
        }

        return JSON.parse(text);
    };

    const generatePosterImage = async (
        themeData: ThemeData,
        firstImage: string,
        secondImage: string | null,
        firstLeadActor: string,
        firstLeadCharacter: string,
        secondLeadActor: string,
        secondLeadCharacter: string,
    ) => {
        if (!apiKey) {
            onNeedApiKey(provider);
            throw new Error(`Please set your ${PROVIDER_LABELS[provider]} API key.`);
        }

        const styleConfig = DRAMA_STYLES.find((style) => style.id === dramaStyle) || DRAMA_STYLES[0];
        const prompt = `A cinematic ${styleConfig.prompt} poster for genre "${themeData.genre}".
Title text to include: "${themeData.nativeTitle}".
Credits text to include: "${firstLeadActor} as ${firstLeadCharacter}" and "${secondLeadActor} as ${secondLeadCharacter}".
Lead 1: use the first uploaded face as "${firstLeadActor}" playing "${firstLeadCharacter}".
${secondImage
    ? `Lead 2: use the second uploaded face as "${secondLeadActor}" playing "${secondLeadCharacter}" with visible chemistry framing.`
    : `Co-star style reference: ${secondLeadActor} as ${secondLeadCharacter}.`}
Scene: ${themeData.visualPrompt}
Style: ${styleConfig.country} TV drama aesthetic.
Target Aspect Ratio: ${aspectRatio}.
Professional photography, prestige streaming poster quality, highly detailed.`;

        if (provider === 'openai') {
            const imageInputs = [firstImage, secondImage].filter(Boolean) as string[];
            return generateOpenAiImage(
                apiKey,
                prompt,
                imageInputs.length > 1 ? imageInputs : imageInputs[0] || null,
                aspectRatio,
                OPENAI_CINEMATIC_MODEL,
                'medium',
            );
        }

        const ai = new GoogleGenAI({ apiKey });
        const parts: any[] = [{ text: prompt }];
        [firstImage, secondImage].filter(Boolean).forEach((image) => {
            const [meta, data = ''] = String(image).split(',');
            parts.unshift({
                inlineData: {
                    data,
                    mimeType: meta.split(';')[0].split(':')[1] || 'image/jpeg',
                },
            });
        });

        const result = await ai.models.generateContent({
            model: GEMINI_CINEMATIC_MODEL,
            contents: [{ parts }],
            config: {
                imageConfig: {
                    aspectRatio: '3:4',
                },
            },
        });

        const imagePart = result.candidates?.[0]?.content?.parts?.find((part: any) => part.inlineData);
        if (!imagePart?.inlineData?.data) {
            throw new Error(t('generator.cinematic.imageFailedError', { defaultValue: '海報圖片生成失敗。' }));
        }

        return `data:image/png;base64,${imagePart.inlineData.data}`;
    };

    const resolvePartner = () => {
        const actorList = secondRole === 'male' ? ACTOR_DB[dramaStyle].men : ACTOR_DB[dramaStyle].women;
        return actorList[Math.floor(Math.random() * actorList.length)];
    };

    const handleGenerate = async () => {
        if (!userImage) {
            setLocalError(t('generator.upload.errorNoImage', { defaultValue: 'Please upload an image first.' }));
            return;
        }

        if (!apiKey) {
            const message = `Please set your ${PROVIDER_LABELS[provider]} API key.`;
            setLocalError(message);
            onNeedApiKey(provider);
            onError(message);
            return;
        }

        setIsGenerating(true);
        setLocalError(null);

        try {
            const partner = resolvePartner();
            const firstLeadActor = userName || 'The User';
            const firstLeadCharacter = firstCharacterName || firstLeadActor;
            const secondLeadActor = secondActorName || partner;
            const secondLeadCharacter = secondCharacterName || secondLeadActor;
            const styleConfig = DRAMA_STYLES.find((style) => style.id === dramaStyle) || DRAMA_STYLES[0];

            const theme = await generateTheme(
                firstLeadActor,
                firstLeadCharacter,
                secondLeadActor,
                secondLeadCharacter,
                secondRole,
            );

            const imageUrl = await generatePosterImage(
                theme,
                userImage,
                secondUserImage,
                firstLeadActor,
                firstLeadCharacter,
                secondLeadActor,
                secondLeadCharacter,
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
                hasSecondLead: Boolean(secondUserImage),
            };
            setGeneratedResult(result);

            const savePrompt = `[${theme.nativeTitle}] ${theme.title}: ${theme.plot.substring(0, 50)}...`;
            const fullDescription = `
**Title:** ${theme.title} (${theme.nativeTitle})
**Genre:** ${theme.genre} | **Style:** ${styleConfig.label}
**Provider:** ${PROVIDER_LABELS[provider]}
**Cast:** ${firstLeadActor} as ${firstLeadCharacter} | ${secondLeadActor} as ${secondLeadCharacter}

**Plot Summary:**
${theme.plot}

**Visual Concept:**
${theme.visualPrompt}
`.trim();
            onSuccess(imageUrl, savePrompt, fullDescription);
        } catch (error: any) {
            const message = error?.message || t('generator.cinematic.generateFailedError', { defaultValue: '生成影劇海報失敗。' });
            console.error(error);
            setLocalError(message);
            onError(message);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleRegenerateImage = async () => {
        if (!generatedResult || !userImage) return;

        if (!apiKey) {
            const message = `Please set your ${PROVIDER_LABELS[provider]} API key.`;
            setLocalError(message);
            onNeedApiKey(provider);
            onError(message);
            return;
        }

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
                generatedResult.secondLeadCharacter || generatedResult.partner,
            );

            setGeneratedResult((prev) => (prev ? { ...prev, imageUrl } : prev));

            const savePrompt = `[${generatedResult.nativeTitle} - Regenerated] ${generatedResult.title}: ${generatedResult.plot.substring(0, 50)}...`;
            const fullDescription = `
**Title:** ${generatedResult.title} (${generatedResult.nativeTitle})
**Status:** Regenerated Version
**Provider:** ${PROVIDER_LABELS[provider]}
**Genre:** ${generatedResult.genre}
**Cast:** ${(generatedResult.firstLeadActor || generatedResult.userName)} as ${(generatedResult.firstLeadCharacter || generatedResult.userName)} | ${(generatedResult.secondLeadActor || generatedResult.partner)} as ${(generatedResult.secondLeadCharacter || generatedResult.partner)}

**Plot Summary:**
${generatedResult.plot}
`.trim();
            onSuccess(imageUrl, savePrompt, fullDescription);
        } catch (error: any) {
            const message = error?.message || t('generator.cinematic.regenerateFailedError', { defaultValue: '重新生成海報失敗。' });
            setLocalError(message);
            onError(message);
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

            const posterImage = await loadImage(generatedResult.imageUrl);
            canvas.width = posterImage.width;
            canvas.height = posterImage.height;
            ctx.drawImage(posterImage, 0, 0);

            const filename = `DramaPoster_${Date.now()}.jpg`;
            const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
            const link = document.createElement('a');
            link.href = dataUrl;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch {
            onError(t('generator.cinematic.downloadFailedError', { defaultValue: '下載海報失敗，請再試一次。' }));
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <style>{`@import url('https://fonts.googleapis.com/css2?family=Black+Han+Sans&family=Do+Hyeon&family=Gamja+Flower&family=Nanum+Brush+Script&family=Nanum+Myeongjo:wght@400;700&family=Song+Myung&display=swap');`}</style>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-6">
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
                                    <p className="text-bronze-light font-bold">{t('generator.cinematic.uploadTitle', { defaultValue: '上傳主角照片' })}</p>
                                    <p className="text-xs text-bronze-light/70">{t('generator.cinematic.uploadHint', { defaultValue: '支援拖放或點擊上傳' })}</p>
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
                            {t('app.selectFromGallery', { defaultValue: '從圖庫選擇' })}
                        </button>

                        <div className="mt-4 border-t border-cream-dark/60 pt-4 text-left">
                            <label className="text-xs font-bold text-bronze-light mb-2 flex items-center gap-2">
                                <UserRoundPlus size={14} />
                                {t('generator.cinematic.secondLeadOptional', { defaultValue: '第二主角照片（選填）' })}
                            </label>
                            <div
                                onClick={() => secondFileInputRef.current?.click()}
                                className={`relative border-2 border-dashed rounded-2xl h-36 flex items-center justify-center cursor-pointer transition-all ${secondUserImage ? 'border-secondary' : 'border-cream-dark/70 hover:border-secondary/60'}`}
                            >
                                {secondUserImage ? (
                                    <>
                                        <img src={secondUserImage} className="w-full h-full object-cover rounded-2xl" alt="Second Lead Upload" />
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setSecondUserImage(null);
                                            }}
                                            className="absolute top-2 right-2 p-1.5 bg-white/95 rounded-full text-red-500 shadow hover:scale-110 transition-transform"
                                            title={t('generator.cinematic.removeSecondLead', { defaultValue: '移除第二主角照片' })}
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
                                {t('generator.cinematic.selectSecondFromGallery', { defaultValue: '從圖庫選第二張照片' })}
                            </button>
                        </div>
                    </div>

                    <div className="bg-cream backdrop-blur-md border border-cream-dark shadow-sm rounded-[2rem] p-6 space-y-4">
                        <h2 className="text-sm font-black text-bronze-light uppercase tracking-widest flex items-center gap-2">
                            <Settings size={16} /> {t('generator.cinematic.settingsTitle', { defaultValue: '海報設定' })}
                        </h2>

                        <div className="space-y-3">
                            <div className="flex items-center justify-between gap-3">
                                <label className="text-xs font-bold text-bronze-light ml-1">Provider</label>
                                <button
                                    type="button"
                                    onClick={() => onNeedApiKey(provider)}
                                    className="text-xs font-bold text-primary hover:text-primary-hover flex items-center gap-1"
                                >
                                    <Key size={14} />
                                    Set API Key
                                </button>
                            </div>
                            <ProviderSwitcher value={provider} onChange={onProviderChange} />
                            <p className="text-[11px] text-bronze-light">Image model: {imageModelLabel}</p>
                            {provider === 'openai' && (
                                <p className="text-[11px] text-bronze-light">
                                    {t('generator.cinematic.openaiHint', { defaultValue: 'OpenAI 模式會先用文字 proxy 產生主題設定，再透過 image proxy 生成影劇海報。' })}
                                </p>
                            )}
                        </div>

                        <div>
                            <label className="text-xs font-bold text-bronze-light ml-2 mb-1 block">{t('generator.cinematic.dramaStyleLabel', { defaultValue: '影劇風格' })}</label>
                            <div className="grid grid-cols-2 gap-2">
                                {DRAMA_STYLES.map((option) => (
                                    <button
                                        key={option.id}
                                        onClick={() => setDramaStyle(option.id)}
                                        className={`p-3 rounded-xl border text-left transition-all ${dramaStyle === option.id ? 'bg-primary text-white border-primary shadow-md' : 'bg-white border-cream-dark text-bronze-text hover:bg-white/80'}`}
                                    >
                                        <div className="text-xs font-black">{option.label}</div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-3 rounded-2xl border border-cream-dark/70 bg-white/40 p-3">
                            <label className="text-xs font-bold text-bronze-light ml-1 block">{t('generator.cinematic.firstLeadTitle', { defaultValue: '第一主角設定' })}</label>
                            <div className="flex bg-white rounded-xl border border-cream-dark p-1">
                                <button type="button" onClick={() => setRole('male')} className={`flex-1 py-2 rounded-lg font-bold text-xs transition-all ${role === 'male' ? 'bg-secondary text-bronze shadow-sm' : 'text-bronze-light hover:bg-cream-light'}`}>{t('generator.cinematic.roleMale', { defaultValue: '男主角' })}</button>
                                <button type="button" onClick={() => setRole('female')} className={`flex-1 py-2 rounded-lg font-bold text-xs transition-all ${role === 'female' ? 'bg-primary text-white shadow-sm' : 'text-bronze-light hover:bg-cream-light'}`}>{t('generator.cinematic.roleFemale', { defaultValue: '女主角' })}</button>
                            </div>
                            <input
                                type="text"
                                value={userName}
                                onChange={(e) => setUserName(e.target.value)}
                                placeholder={t('generator.cinematic.firstLeadActorPlaceholder', { defaultValue: '輸入第一主角的演員名稱' })}
                                className="w-full px-4 py-3 bg-white border border-cream-dark rounded-xl font-bold text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 text-bronze-text placeholder-bronze-light/50"
                            />
                            <input
                                type="text"
                                value={firstCharacterName}
                                onChange={(e) => setFirstCharacterName(e.target.value)}
                                placeholder={t('generator.cinematic.firstLeadCharacterPlaceholder', { defaultValue: '輸入第一主角的角色名稱' })}
                                className="w-full px-4 py-3 bg-white border border-cream-dark rounded-xl font-bold text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 text-bronze-text placeholder-bronze-light/50"
                            />
                        </div>

                        <div className="space-y-3 rounded-2xl border border-cream-dark/70 bg-white/40 p-3">
                            <label className="text-xs font-bold text-bronze-light ml-1 block">{t('generator.cinematic.secondLeadTitle', { defaultValue: '第二主角設定' })}</label>
                            <div className="flex bg-white rounded-xl border border-cream-dark p-1">
                                <button type="button" onClick={() => setSecondRole('male')} className={`flex-1 py-2 rounded-lg font-bold text-xs transition-all ${secondRole === 'male' ? 'bg-secondary text-bronze shadow-sm' : 'text-bronze-light hover:bg-cream-light'}`}>{t('generator.cinematic.roleMale', { defaultValue: '男主角' })}</button>
                                <button type="button" onClick={() => setSecondRole('female')} className={`flex-1 py-2 rounded-lg font-bold text-xs transition-all ${secondRole === 'female' ? 'bg-primary text-white shadow-sm' : 'text-bronze-light hover:bg-cream-light'}`}>{t('generator.cinematic.roleFemale', { defaultValue: '女主角' })}</button>
                            </div>
                            <input
                                type="text"
                                value={secondActorName}
                                onChange={(e) => setSecondActorName(e.target.value)}
                                placeholder={t('generator.cinematic.secondLeadActorPlaceholder', { defaultValue: '輸入第二主角的演員名稱' })}
                                className="w-full px-4 py-3 bg-white border border-cream-dark rounded-xl font-bold text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 text-bronze-text placeholder-bronze-light/50"
                            />
                            <input
                                type="text"
                                value={secondCharacterName}
                                onChange={(e) => setSecondCharacterName(e.target.value)}
                                placeholder={t('generator.cinematic.secondLeadCharacterPlaceholder', { defaultValue: '輸入第二主角的角色名稱' })}
                                className="w-full px-4 py-3 bg-white border border-cream-dark rounded-xl font-bold text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 text-bronze-text placeholder-bronze-light/50"
                            />
                        </div>

                        <div>
                            <label className="text-xs font-bold text-bronze-light ml-2 mb-1 block">{t('generator.cinematic.genreLabel', { defaultValue: '題材類型' })}</label>
                            <select
                                value={selectedGenre}
                                onChange={(e) => setSelectedGenre(e.target.value)}
                                className="w-full px-4 py-3 bg-white border border-cream-dark rounded-xl font-bold text-sm outline-none focus:border-primary text-bronze-text"
                            >
                                {currentGenres.map((option) => (
                                    <option key={option.value} value={option.value}>{option.label}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="text-xs font-bold text-bronze-light ml-2 mb-1 block">{t('generator.cinematic.aspectRatioLabel', { defaultValue: '比例' })}</label>
                            <div className="grid grid-cols-3 gap-2">
                                {['2:3', '3:4', '1:1'].map((ratio) => (
                                    <button
                                        key={ratio}
                                        type="button"
                                        onClick={() => setAspectRatio(ratio)}
                                        className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all ${aspectRatio === ratio
                                            ? 'bg-primary text-white border-primary shadow-md'
                                            : 'bg-white border-cream-dark text-bronze-text hover:bg-white/80'}`}
                                    >
                                        {ratio}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <button
                            onClick={handleGenerate}
                            disabled={isGenerating || isRegenerating}
                            className={`w-full py-4 rounded-xl font-black text-lg shadow-lg transform transition-all active:scale-95 flex items-center justify-center gap-2 ${isGenerating ? 'bg-cream-dark text-bronze-light cursor-not-allowed' : 'bg-primary hover:bg-primary-hover text-white shadow-primary/30'}`}
                        >
                            {isGenerating ? <RefreshCw className="animate-spin" /> : <Sparkles />}
                            {isGenerating
                                ? t('generator.cinematic.generatingButton', { defaultValue: '生成中...' })
                                : t('generator.cinematic.generateButton', { defaultValue: '生成影劇海報' })}
                        </button>

                        {localError && <div className="text-red-500 text-xs font-bold text-center animate-pulse">{localError}</div>}
                    </div>
                </div>

                <div className="bg-cream backdrop-blur-md border border-cream-dark shadow-sm rounded-[2rem] p-8 h-fit min-h-[500px] flex flex-col items-center justify-center relative group">
                    {generatedResult ? (
                        <>
                            <div className="relative w-full rounded-2xl overflow-hidden shadow-2xl border-4 border-white">
                                <img src={generatedResult.imageUrl} className="w-full h-auto object-contain" alt="Generated Poster" />

                                {!isRegenerating && (
                                    <div className="absolute top-4 right-4 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                        <button onClick={handleRegenerateImage} className="bg-white p-3 rounded-full text-blue-500 shadow-lg hover:scale-110 transition-transform" title={t('generator.cinematic.regenerateTooltip', { defaultValue: '重新生成海報' })}>
                                            <RefreshCw size={20} />
                                        </button>
                                        <button onClick={handleDownload} className="bg-white p-3 rounded-full text-green-500 shadow-lg hover:scale-110 transition-transform" title={t('generator.cinematic.downloadTooltip', { defaultValue: '下載海報' })}>
                                            <Download size={20} />
                                        </button>
                                    </div>
                                )}

                                {isRegenerating && (
                                    <div className="absolute inset-0 bg-white/50 backdrop-blur-sm flex items-center justify-center">
                                        <div className="bg-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2">
                                            <RefreshCw className="animate-spin text-primary" size={16} />
                                            <span className="text-xs font-bold text-bronze">{t('generator.cinematic.regeneratingStatus', { defaultValue: '重新生成中...' })}</span>
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
                                    {t('generator.cinematic.creditPair', {
                                        actor: generatedResult.firstLeadActor,
                                        character: generatedResult.firstLeadCharacter,
                                        defaultValue: '{{actor}} 飾 {{character}}',
                                    })}
                                    {' | '}
                                    {t('generator.cinematic.creditPair', {
                                        actor: generatedResult.secondLeadActor,
                                        character: generatedResult.secondLeadCharacter,
                                        defaultValue: '{{actor}} 飾 {{character}}',
                                    })}
                                </div>

                                <p className="text-sm text-bronze-text/80 italic bg-white/50 p-4 rounded-xl border border-cream-dark">
                                    {generatedResult.plot}
                                </p>
                            </div>
                        </>
                    ) : (
                        <div className="text-center space-y-4 opacity-50">
                            <Film size={64} className="mx-auto text-bronze-light" />
                            <p className="text-bronze-light font-bold">{t('generator.cinematic.emptyStateHint', { defaultValue: '上傳照片並生成你的影劇海報' })}</p>
                        </div>
                    )}
                </div>
            </div>

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

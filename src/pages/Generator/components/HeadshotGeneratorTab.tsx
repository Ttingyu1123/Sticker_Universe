import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { GoogleGenAI, Modality } from "@google/genai";
import Cropper from 'cropperjs';
import 'cropperjs/dist/cropper.css';
import { Upload, Camera, Download, Loader2, Sparkles, Scissors, Trash2, Image as ImageIcon, Briefcase, User, FolderHeart, Printer } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { GalleryPicker } from '../../../components/GalleryPicker';

// Types
interface Preset {
    id: string;
    nameKey: string;
    size_mm?: { width: number; height: number };
    size_inch?: { width: number; height: number };
    size_px?: { width: number; height: number };
    noteKey: string;
    apiAspectRatio: string;
    isStrictDefault: boolean;
}

const SIZE_PRESETS: Preset[] = [
    {
        id: 'photo_1inch',
        nameKey: 'headshot.presets.1inch',
        size_mm: { width: 28, height: 35 },
        size_inch: { width: 1.10, height: 1.38 },
        size_px: { width: 331, height: 413 },
        noteKey: 'headshot.presets.notes.driver',
        apiAspectRatio: '3:4',
        isStrictDefault: true
    },
    {
        id: 'passport',
        nameKey: 'headshot.presets.passport',
        size_mm: { width: 35, height: 45 },
        size_inch: { width: 1.38, height: 1.77 },
        size_px: { width: 413, height: 531 },
        noteKey: 'headshot.presets.notes.passport',
        apiAspectRatio: '3:4',
        isStrictDefault: true
    },
    {
        id: 'taiwan_id',
        nameKey: 'headshot.presets.taiwanId',
        size_mm: { width: 33, height: 48 },
        size_inch: { width: 1.30, height: 1.89 },
        size_px: { width: 390, height: 567 },
        noteKey: 'headshot.presets.notes.taiwan',
        apiAspectRatio: '3:4',
        isStrictDefault: true
    },
    {
        id: 'us_visa',
        nameKey: 'headshot.presets.usVisa',
        size_mm: { width: 51, height: 51 },
        size_inch: { width: 2.0, height: 2.0 },
        size_px: { width: 600, height: 600 },
        noteKey: 'headshot.presets.notes.us',
        apiAspectRatio: '1:1',
        isStrictDefault: true
    },
    {
        id: 'resume',
        nameKey: 'headshot.presets.resume',
        size_mm: { width: 40, height: 50 },
        size_inch: { width: 1.57, height: 1.97 },
        size_px: { width: 472, height: 590 },
        noteKey: 'headshot.presets.notes.linkedin',
        apiAspectRatio: '3:4',
        isStrictDefault: false
    },
    {
        id: 'avatar',
        nameKey: 'headshot.presets.avatar',
        size_px: { width: 600, height: 600 },
        noteKey: 'headshot.presets.notes.social',
        apiAspectRatio: '1:1',
        isStrictDefault: false
    },
    {
        id: 'cover',
        nameKey: 'headshot.presets.cover',
        size_px: { width: 1920, height: 1080 },
        noteKey: 'headshot.presets.notes.cover',
        apiAspectRatio: '16:9',
        isStrictDefault: false
    }
];

interface GeneratedImage {
    id: string;
    src: string;
    preset: string;
    style: string;
}

interface HeadshotGeneratorTabProps {
    apiKey: string;
    onSuccess?: (imageUrl: string, prompt: string) => void;
    onError?: (msg: string) => void;
    onNeedApiKey?: () => void;
}

const HeadshotGeneratorTab: React.FC<HeadshotGeneratorTabProps> = ({ apiKey, onSuccess, onError, onNeedApiKey }) => {
    const { t } = useTranslation();
    const navigate = useNavigate();

    // State
    const [image, setImage] = useState<string | null>(null);
    const [croppedImage, setCroppedImage] = useState<string | null>(null);
    const [isCropping, setIsCropping] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);

    // Settings
    const [selectedPresetId, setSelectedPresetId] = useState<string>('passport');
    const [isStrictMode, setIsStrictMode] = useState(true);
    const [selectedStyle, setSelectedStyle] = useState('white_id');
    const [selectedPose, setSelectedPose] = useState('front_upper');
    const [selectedExpression, setSelectedExpression] = useState('natural');
    const [variations, setVariations] = useState(1);
    const [quality, setQuality] = useState('standard');

    const [outfitType, setOutfitType] = useState('keep_original');
    const [customOutfit, setCustomOutfit] = useState('');

    const [effectType, setEffectType] = useState('none');
    const [customEffect, setCustomEffect] = useState('');
    const [showGallery, setShowGallery] = useState(false);

    // Refs
    const fileInputRef = useRef<HTMLInputElement>(null);
    const cropperRef = useRef<Cropper | null>(null);
    const imageElementRef = useRef<HTMLImageElement>(null);

    // Sync strict mode with preset
    useEffect(() => {
        const preset = SIZE_PRESETS.find(p => p.id === selectedPresetId);
        if (preset) {
            setIsStrictMode(preset.isStrictDefault);
        }
    }, [selectedPresetId]);

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (evt) => {
                if (evt.target?.result) {
                    setImage(evt.target.result as string);
                    setIsCropping(true);
                }
            };
            reader.readAsDataURL(file);
        }
    };

    const handleGallerySelect = async (blobs: Blob[]) => {
        if (blobs.length > 0) {
            const blob = blobs[0];
            const reader = new FileReader();
            reader.onload = (evt) => {
                if (evt.target?.result) {
                    setImage(evt.target.result as string);
                    setIsCropping(true);
                }
            };
            reader.readAsDataURL(blob);
        }
        setShowGallery(false);
    };

    // Initialize Cropper when image loads and isCropping is true
    useEffect(() => {
        if (isCropping && image && imageElementRef.current) {
            if (cropperRef.current) {
                cropperRef.current.destroy();
            }

            cropperRef.current = new Cropper(imageElementRef.current, {
                aspectRatio: NaN,
                viewMode: 1,
                dragMode: 'move',
                autoCropArea: 0.8,
                background: false,
            });
        }

        return () => {
            if (cropperRef.current) {
                cropperRef.current.destroy();
                cropperRef.current = null;
            }
        };
    }, [isCropping, image]);

    const confirmCrop = () => {
        if (cropperRef.current) {
            const canvas = cropperRef.current.getCroppedCanvas();
            if (canvas) {
                setCroppedImage(canvas.toDataURL());
                setIsCropping(false);
            }
        }
    };

    const cancelCrop = () => {
        setImage(null);
        setCroppedImage(null);
        setIsCropping(false);
        cropperRef.current?.destroy();
        cropperRef.current = null;
    };

    const generateHeadshot = async () => {
        if (!apiKey) {
            onNeedApiKey?.();
            return;
        }

        if (!croppedImage) {
            onError?.(t('headshot.errors.noImage'));
            return;
        }

        setIsGenerating(true);

        try {
            const selectedPreset = SIZE_PRESETS.find(p => p.id === selectedPresetId)!;

            let outfit = outfitType;
            if (outfit === 'custom') {
                outfit = customOutfit || 'Original Outfit';
            }

            let effect = effectType;
            if (effect === 'custom') {
                effect = customEffect || 'None';
            }

            // Construct Prompt
            let strictInstructions = "";
            if (isStrictMode) {
                strictInstructions = `
★ CRITICAL ID/PASSPORT REQUIREMENTS:
1. Eyes must look straight at the camera.
2. Neutral expression, mouth closed, NO teeth visible.
3. Ears and eyebrows MUST be visible.
4. Head straight, no tilting.
5. Even lighting, no shadows on face.
            `;
            } else {
                strictInstructions = `
★ Professional/Casual Headshot Guidelines:
1. Confident, natural expression.
2. Relaxed pose.
3. Artistic composition allowed.
            `;
            }

            const expressionInstr = selectedExpression !== 'natural'
                ? `8. Modify expression to "${t('headshot.expressions.' + selectedExpression)}", but PRESERVE IDENTITY.`
                : `8. Keep natural expression, PRESERVE IDENTITY.`;

            // Pose instructions
            const poseInstructions = {
                'front_upper': 'front-facing headshot, upper body visible from chest up',
                'three_quarter': '3/4 view portrait, slightly turned to the side',
                'full_body': 'full body portrait, entire person visible',
                'half_body': 'half body portrait, waist up'
            };

            // Effect instructions  
            const effectInstructions = {
                'none': '',
                'soft_focus': 'Apply soft focus, subtle skin smoothing, professional retouching',
                'professional': 'Professional photography lighting, studio quality',
                'custom': customEffect
            };

            const poseText = poseInstructions[selectedPose as keyof typeof poseInstructions] || poseInstructions.front_upper;
            const effectText = effectType !== 'none' ? effectInstructions[effectType as keyof typeof effectInstructions] : '';

            const prompt = `You are a professional potrait retoucher. Preserve facial features, hair, and proportions of the uploaded person.
        
${strictInstructions}

Process the photo as follows:
1. Smooth skin tone, remove oil/blemishes but keep texture (pores).
2. Background: Generate a "${selectedStyle}" background.
3. Outfit: "${outfit}".
4. Lighting: Softbox 45 degree lighting, natural looking.
5. Correct white balance and color cast.
6. Visual Effect: ${effectText || 'Natural, no artificial effects'}.
7. Pose: ${poseText}.
${expressionInstr}
9. Aspect Ratio: ${selectedPreset.apiAspectRatio}.
10. Output High Quality.

Base Image: {user_photo}
Strict Compliance: ${isStrictMode ? 'YES' : 'NO'}`;

            const ai = new GoogleGenAI({ apiKey });

            // Prepare Image Part
            const base64Data = croppedImage.split(',')[1];
            const mimeType = croppedImage.split(';')[0].split(':')[1];

            const imagePart = {
                inlineData: {
                    data: base64Data,
                    mimeType: mimeType
                }
            };

            // Quality mapping
            const qualityMap: { [key: string]: string } = {
                'standard': '1024x1024',
                'high': '2048x2048',
                'ultra': '4096x4096'
            };

            const result = await ai.models.generateContent({
                model: "gemini-3-pro-image-preview",
                contents: {
                    parts: [imagePart, { text: prompt }]
                },
                config: {
                    responseModalities: [Modality.IMAGE],
                    imageConfig: {
                        imageSize: qualityMap[quality] || '1024x1024',
                        aspectRatio: selectedPreset.apiAspectRatio
                    }
                }
            });


            const newImages: GeneratedImage[] = [];

            if (result.candidates?.[0]?.content?.parts) {
                for (const part of result.candidates[0].content.parts) {
                    if (part.inlineData) {
                        const src = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
                        newImages.push({
                            id: Date.now().toString() + Math.random(),
                            src,
                            preset: selectedPreset.id,
                            style: selectedStyle
                        });

                        // Notify parent of success for the first image
                        if (newImages.length === 1) {
                            onSuccess?.(src, `Headshot: ${selectedStyle}`);
                        }
                    }
                }
            }

            if (newImages.length > 0) {
                setGeneratedImages(prev => [...newImages, ...prev]);
            } else {
                onError?.(t('headshot.errors.noResult'));
            }

        } catch (err: any) {
            console.error("Headshot generation failed:", err);
            onError?.(err.message || t('headshot.errors.general'));
        } finally {
            setIsGenerating(false);
        }
    };

    const downloadImage = async (src: string, imageData: GeneratedImage) => {
        try {
            // 生成詳細的檔名
            const preset = SIZE_PRESETS.find(p => p.id === imageData.preset);
            const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
            const time = new Date().toLocaleTimeString('zh-TW', { hour12: false }).replace(/:/g, '-');

            // 檔名格式: headshot_[規格]_[樣式]_[尺寸]_[日期]_[時間].png
            let filename = 'headshot';
            if (preset) {
                filename += `_${preset.id}`;
                if (preset.size_mm) {
                    filename += `_${preset.size_mm.width}x${preset.size_mm.height}mm`;
                }
            }
            filename += `_${imageData.style.replace(/\s+/g, '_')}`;
            filename += `_${date}_${time}.png`;

            // 將 base64 轉為 Blob
            const response = await fetch(src);
            const blob = await response.blob();

            // 檢查是否支援 Web Share API（且可分享檔案）
            const canShare = navigator.share && navigator.canShare && navigator.canShare({ files: [new File([blob], filename, { type: blob.type })] });

            if (canShare) {
                // 使用 Web Share API
                const file = new File([blob], filename, { type: blob.type });
                await navigator.share({
                    files: [file],
                    title: '形象照',
                    text: `${imageData.style} - ${preset?.nameKey ? t(preset.nameKey) : ''}`,
                });
            } else {
                // Fallback: 傳統下載
                const link = document.createElement('a');
                link.href = URL.createObjectURL(blob);
                link.download = filename;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(link.href);
            }
        } catch (error) {
            console.error('分享/下載失敗:', error);
            // 如果分享被取消或失敗，靜默處理（不顯示錯誤）
        }
    };

    const handleSendToPrint = (imageSrc: string) => {
        // 將圖片存入 localStorage
        localStorage.setItem('headshot_to_print', imageSrc);
        // 導航到證件照列印頁面，帶上參數
        navigate('/print-sheet?tab=id-print&autoLoad=true');
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left Panel: Controls */}
                <div className="lg:col-span-4 space-y-6">

                    {/* 1. Upload & Crop Preview */}
                    <div className="bg-white/60 backdrop-blur-xl border border-cream-dark rounded-[2rem] p-6 shadow-sm">
                        <h3 className="text-sm font-black text-bronze-light uppercase tracking-widest mb-4 flex items-center gap-2">
                            <Camera size={16} /> {t('headshot.step1_upload')}
                        </h3>

                        {!croppedImage ? (
                            <>
                                <div
                                    onClick={() => fileInputRef.current?.click()}
                                    className="border-3 border-dashed border-cream-dark/50 hover:border-primary bg-cream-light/50 hover:bg-white rounded-3xl p-8 flex flex-col items-center justify-center cursor-pointer transition-all min-h-[200px] group"
                                >
                                    <input ref={fileInputRef} type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                                    <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-lg shadow-primary/10 mb-4 group-hover:scale-110 transition-transform">
                                        <Upload size={24} className="text-primary" />
                                    </div>
                                    <p className="font-bold text-bronze-text text-sm">{t('headshot.upload_hint')}</p>
                                </div>
                                <button
                                    onClick={() => setShowGallery(true)}
                                    className="mt-3 w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-secondary/10 hover:bg-secondary/20 text-secondary rounded-xl text-sm font-bold transition-colors"
                                >
                                    <FolderHeart size={18} />
                                    從作品集選取
                                </button>
                            </>
                        ) : (
                            <div className="relative group">
                                <div className="rounded-3xl overflow-hidden border border-cream-dark/50 shadow-md">
                                    <img src={croppedImage} alt="Source" className="w-full h-auto object-cover max-h-[300px]" />
                                </div>
                                <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => { setIsCropping(true); setImage(croppedImage); }} className="p-2 bg-white text-bronze-text rounded-full shadow-lg hover:scale-110 transition-transform">
                                        <Scissors size={14} />
                                    </button>
                                    <button onClick={() => { setCroppedImage(null); setImage(null); }} className="p-2 bg-white text-red-500 rounded-full shadow-lg hover:scale-110 transition-transform">
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* 2. Settings */}
                    <div className="bg-white/60 backdrop-blur-xl border border-cream-dark rounded-[2rem] p-6 shadow-sm space-y-6">
                        <h3 className="text-sm font-black text-bronze-light uppercase tracking-widest mb-2 flex items-center gap-2">
                            <User size={16} /> {t('headshot.step2_settings')}
                        </h3>

                        {/* Preset */}
                        <div>
                            <label className="text-xs font-bold text-bronze-light mb-1.5 block">{t('headshot.settings.preset')}</label>
                            <select
                                value={selectedPresetId}
                                onChange={(e) => setSelectedPresetId(e.target.value)}
                                className="w-full px-4 py-2.5 rounded-xl border border-cream-dark bg-white/50 text-sm font-bold text-bronze-text outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all appearance-none cursor-pointer"
                            >
                                {SIZE_PRESETS.map(preset => (
                                    <option key={preset.id} value={preset.id}>{t(preset.nameKey)}</option>
                                ))}
                            </select>
                            <p className="text-[10px] text-bronze-light mt-1.5 px-1">
                                {(() => {
                                    const preset = SIZE_PRESETS.find(p => p.id === selectedPresetId);
                                    if (!preset) return '';

                                    const dimensions = [];
                                    if (preset.size_mm) {
                                        dimensions.push(`${preset.size_mm.width}x${preset.size_mm.height}mm`);
                                    }
                                    if (preset.size_inch) {
                                        dimensions.push(`${preset.size_inch.width}x${preset.size_inch.height}inch`);
                                    }
                                    if (preset.size_px) {
                                        dimensions.push(`${preset.size_px.width}x${preset.size_px.height}px`);
                                    }

                                    const sizeText = dimensions.join(' / ');
                                    const noteText = preset.noteKey ? t(preset.noteKey) : '';

                                    return sizeText + (noteText && noteText !== preset.noteKey ? ` • ${noteText}` : '');
                                })()}
                            </p>
                        </div>

                        {/* Strict Mode Toggle */}
                        <div className="flex items-center gap-3 bg-cream-medium/30 p-3 rounded-xl border border-cream-dark/30">
                            <input
                                type="checkbox"
                                id="strictMode"
                                checked={isStrictMode}
                                onChange={(e) => setIsStrictMode(e.target.checked)}
                                className="w-5 h-5 accent-primary rounded-md cursor-pointer"
                            />
                            <label htmlFor="strictMode" className="text-sm font-bold text-bronze-text cursor-pointer select-none">
                                {t('headshot.settings.strict')}
                            </label>
                        </div>

                        {/* Style */}
                        <div>
                            <label className="text-xs font-bold text-bronze-light mb-1.5 block">{t('headshot.settings.style')}</label>
                            <select
                                value={selectedStyle}
                                onChange={(e) => setSelectedStyle(e.target.value)}
                                className="w-full px-4 py-2.5 rounded-xl border border-cream-dark bg-white/50 text-sm font-bold text-bronze-text outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all appearance-none cursor-pointer"
                            >
                                <option value="white_id">{t('headshot.styles.white_id')}</option>
                                <optgroup label={t('headshot.style_groups.formal')}>
                                    <option value="white_id">{t('headshot.styles.white_id')}</option>
                                    <option value="business_gray">{t('headshot.styles.business_gray')}</option>
                                    <option value="tech_blue_gradient">{t('headshot.styles.tech_blue_gradient')}</option>
                                    <option value="brand_color">{t('headshot.styles.brand_color')}</option>
                                </optgroup>
                                <optgroup label={t('headshot.style_groups.casual')}>
                                    <option value="street_style">{t('headshot.styles.street_style')}</option>
                                    <option value="warm_cafe">{t('headshot.styles.warm_cafe')}</option>
                                    <option value="natural_outdoor">{t('headshot.styles.natural_outdoor')}</option>
                                    <option value="vibrant_contrast">{t('headshot.styles.vibrant_contrast')}</option>
                                    <option value="minimal_studio">{t('headshot.styles.minimal_studio')}</option>
                                </optgroup>
                            </select>
                        </div>

                        {/* Outfit */}
                        <div>
                            <label className="text-xs font-bold text-bronze-light mb-1.5 block">{t('headshot.settings.outfit')}</label>
                            <select
                                value={outfitType}
                                onChange={(e) => setOutfitType(e.target.value)}
                                className="w-full px-4 py-2.5 rounded-xl border border-cream-dark bg-white/50 text-sm font-bold text-bronze-text outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all appearance-none cursor-pointer mb-2"
                            >
                                <option value="keep_original">{t('headshot.outfits.keep_original')}</option>
                                <optgroup label={t('headshot.outfit_groups.formal')}>
                                    <option value="dark_suit_white">{t('headshot.outfits.dark_suit_white')}</option>
                                    <option value="light_suit_blue">{t('headshot.outfits.light_suit_blue')}</option>
                                    <option value="white_shirt">{t('headshot.outfits.white_shirt')}</option>
                                    <option value="blue_shirt">{t('headshot.outfits.blue_shirt')}</option>
                                </optgroup>
                                <optgroup label={t('headshot.outfit_groups.casual')}>
                                    <option value="smart_casual">{t('headshot.outfits.smart_casual')}</option>
                                    <option value="black_turtleneck">{t('headshot.outfits.black_turtleneck')}</option>
                                    <option value="denim_jacket">{t('headshot.outfits.denim_jacket')}</option>
                                    <option value="leather_jacket">{t('headshot.outfits.leather_jacket')}</option>
                                    <option value="bright_knit">{t('headshot.outfits.bright_knit')}</option>
                                    <option value="hoodie">{t('headshot.outfits.hoodie')}</option>
                                </optgroup>
                                <option value="custom">{t('headshot.outfits.custom')}</option>
                            </select>
                            {outfitType === 'custom' && (
                                <input
                                    type="text"
                                    value={customOutfit}
                                    onChange={(e) => setCustomOutfit(e.target.value)}
                                    placeholder={t('headshot.outfit.placeholder')}
                                    className="w-full px-4 py-2 rounded-xl border border-cream-dark bg-white text-sm outline-none focus:border-primary"
                                />
                            )}
                        </div>

                        {/* Pose */}
                        <div>
                            <label className="text-xs font-bold text-bronze-light mb-1.5 block">{t('headshot.settings.pose')}</label>
                            <select
                                value={selectedPose}
                                onChange={(e) => setSelectedPose(e.target.value)}
                                className="w-full px-4 py-2.5 rounded-xl border border-cream-dark bg-white/50 text-sm font-bold text-bronze-text outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all appearance-none cursor-pointer"
                            >
                                <option value="front_upper">{t('headshot.poses_extended.front_upper')}</option>
                                <option value="left_45">{t('headshot.poses_extended.left_45')}</option>
                                <option value="right_45">{t('headshot.poses_extended.right_45')}</option>
                                <option value="side_90">{t('headshot.poses_extended.side_90')}</option>
                                <option value="high_angle">{t('headshot.poses_extended.high_angle')}</option>
                                <option value="sitting_side">{t('headshot.poses_extended.sitting_side')}</option>
                                <option value="lying_side">{t('headshot.poses_extended.lying_side')}</option>
                            </select>
                        </div>

                        {/* Expression */}
                        <div>
                            <label className="text-xs font-bold text-bronze-light mb-1.5 block">{t('headshot.settings.expression')}</label>
                            <select
                                value={selectedExpression}
                                onChange={(e) => setSelectedExpression(e.target.value)}
                                className="w-full px-4 py-2.5 rounded-xl border border-cream-dark bg-white/50 text-sm font-bold text-bronze-text outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all appearance-none cursor-pointer"
                            >
                                <option value="natural">{t('headshot.expressions.natural')}</option>
                                <option value="smile_soft">{t('headshot.expressions.smile_soft')}</option>
                                <option value="smile_bright">{t('headshot.expressions.smile_bright')}</option>
                                <option value="confident">{t('headshot.expressions.confident')}</option>
                                <option value="relaxed">{t('headshot.expressions.relaxed')}</option>
                                <option value="laugh">{t('headshot.expressions.laugh')}</option>
                            </select>
                        </div>

                        {/* Variations */}
                        <div>
                            <label className="text-xs font-bold text-bronze-light mb-1.5 block flex justify-between">
                                <span>{t('headshot.settings.variations')}</span>
                                <span className="text-primary">{t('headshot.variations_hint', { count: variations })}</span>
                            </label>
                            <input
                                type="range"
                                min="1"
                                max="5"
                                value={variations}
                                onChange={(e) => setVariations(parseInt(e.target.value))}
                                className="w-full h-2 bg-cream-medium rounded-lg appearance-none cursor-pointer accent-primary"
                            />
                            <div className="flex justify-between text-[10px] text-bronze-light mt-1 px-1">
                                <span>1</span>
                                <span>2</span>
                                <span>3</span>
                                <span>4</span>
                                <span>5</span>
                            </div>
                        </div>

                        {/* Quality */}
                        <div>
                            <label className="text-xs font-bold text-bronze-light mb-1.5 block">{t('headshot.settings.quality')}</label>
                            <select
                                value={quality}
                                onChange={(e) => setQuality(e.target.value)}
                                className="w-full px-4 py-2.5 rounded-xl border border-cream-dark bg-white/50 text-sm font-bold text-bronze-text outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all appearance-none cursor-pointer"
                            >
                                <option value="standard">{t('headshot.qualities.standard')}</option>
                                <option value="high">{t('headshot.qualities.high')}</option>
                                <option value="ultra">{t('headshot.qualities.ultra')}</option>
                            </select>
                        </div>

                        {/* Effect */}
                        <div>
                            <label className="text-xs font-bold text-bronze-light mb-1.5 block">{t('headshot.settings.effect')}</label>
                            <select
                                value={effectType}
                                onChange={(e) => setEffectType(e.target.value)}
                                className="w-full px-4 py-2.5 rounded-xl border border-cream-dark bg-white/50 text-sm font-bold text-bronze-text outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all appearance-none cursor-pointer mb-2"
                            >
                                <option value="none">{t('headshot.effects_extended.none')}</option>
                                <optgroup label={t('headshot.effect_groups.filters')}>
                                    <option value="high_contrast">{t('headshot.effects_extended.high_contrast')}</option>
                                    <option value="cinematic_film">{t('headshot.effects_extended.cinematic_film')}</option>
                                    <option value="soft_airy">{t('headshot.effects_extended.soft_airy')}</option>
                                    <option value="vintage_warm">{t('headshot.effects_extended.vintage_warm')}</option>
                                    <option value="bw_fashion">{t('headshot.effects_extended.bw_fashion')}</option>
                                </optgroup>
                                <option value="custom">{t('headshot.effects_extended.custom')}</option>
                            </select>
                            {effectType === 'custom' && (
                                <input
                                    type="text"
                                    value={customEffect}
                                    onChange={(e) => setCustomEffect(e.target.value)}
                                    placeholder={t('headshot.outfit.placeholder')}
                                    className="w-full px-4 py-2 rounded-xl border border-cream-dark bg-white text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
                                />
                            )}
                        </div>

                        <Button
                            onClick={generateHeadshot}
                            disabled={!croppedImage || isGenerating}
                            className="w-full h-12 bg-gradient-to-r from-primary to-secondary hover:from-primary-hover hover:to-secondary-hover text-white shadow-lg shadow-primary/20 rounded-xl text-base font-black flex items-center justify-center gap-2"
                        >
                            {isGenerating ? <Loader2 size={20} className="animate-spin" /> : <Sparkles size={20} />}
                            {t('headshot.action.generate')}
                        </Button>
                    </div>
                </div>

                {/* Right Panel: Results */}
                <div className="lg:col-span-8">
                    <div className="bg-white/40 backdrop-blur-xl border border-cream-dark rounded-[2rem] p-8 min-h-[600px] flex flex-col">
                        <h3 className="text-sm font-black text-bronze-light uppercase tracking-widest mb-6 flex items-center gap-2">
                            <ImageIcon size={16} /> {t('headshot.results')} ({generatedImages.length})
                        </h3>

                        {generatedImages.length === 0 ? (
                            <div className="flex-1 flex flex-col items-center justify-center text-bronze-light opacity-50">
                                <Briefcase size={64} className="mb-4" />
                                <p className="font-bold">{t('headshot.empty_state')}</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                {generatedImages.map((img) => {
                                    const presetInfo = SIZE_PRESETS.find(p => p.id === img.preset);
                                    return (
                                        <div key={img.id} className="bg-white p-3 rounded-2xl shadow-sm border border-cream-dark group hover:-translate-y-1 transition-transform duration-300">
                                            <div className="relative aspect-[3/4] rounded-xl overflow-hidden mb-3 bg-cream-light">
                                                <img src={img.src} alt="Result" className="w-full h-full object-cover" />
                                            </div>
                                            <div className="px-1">
                                                <div className="flex items-center justify-between mb-2">
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <span className="text-xs font-black text-bronze-text">{t(`headshot.styles.${img.style.replace(/\s+/g, '_').toLowerCase()}`) || img.style}</span>
                                                            <span className="text-[10px] font-bold bg-cream-dark/20 text-bronze-light px-2 py-0.5 rounded-full uppercase">
                                                                {presetInfo?.apiAspectRatio}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            onClick={() => downloadImage(img.src, img)}
                                                            className="p-2.5 bg-primary/20 text-primary rounded-full hover:bg-primary/30 transition-colors active:scale-95"
                                                            title={t('common.download')}
                                                        >
                                                            <Download size={18} strokeWidth={2.5} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleSendToPrint(img.src)}
                                                            className="p-2.5 bg-secondary/20 text-secondary rounded-full hover:bg-secondary/30 transition-colors active:scale-95"
                                                            title="傳送至列印室"
                                                        >
                                                            <Printer size={18} strokeWidth={2.5} />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Cropping Modal */}
            {
                isCropping && image && (
                    <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
                        <div className="bg-white rounded-3xl p-6 w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                            <div className="flex justify-between items-center mb-4 px-2">
                                <h3 className="text-lg font-black text-bronze-text flex items-center gap-2">
                                    <Scissors size={20} className="text-primary" /> {t('headshot.cropping.title')}
                                </h3>
                                <button onClick={cancelCrop} className="text-bronze-light hover:text-bronze-text font-bold">✕</button>
                            </div>

                            <div className="flex-1 bg-neutral-100 rounded-2xl overflow-hidden relative min-h-[400px]">
                                <img
                                    ref={imageElementRef}
                                    src={image}
                                    alt="Crop target"
                                    className="max-w-full max-h-[60vh] object-contain mx-auto"
                                />
                            </div>

                            <div className="flex justify-end gap-4 mt-6">
                                <Button variant="secondary" onClick={cancelCrop} className="bg-neutral-100 hover:bg-neutral-200 text-neutral-600 border-none">
                                    {t('common.cancel')}
                                </Button>
                                <Button onClick={confirmCrop} className="bg-primary hover:bg-primary-hover text-white shadow-lg shadow-primary/20">
                                    {t('headshot.cropping.confirm')}
                                </Button>
                            </div>
                        </div>
                    </div>
                )
            }

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

export default HeadshotGeneratorTab;

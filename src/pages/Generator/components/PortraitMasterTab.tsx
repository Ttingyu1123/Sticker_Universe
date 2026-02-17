
import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { GoogleGenAI, Modality } from "@google/genai";
import Cropper from 'cropperjs';
import 'cropperjs/dist/cropper.css';
import { Upload, Camera, Sparkles, Scissors, Trash2, Image as ImageIcon, Briefcase, Download, Printer, User, FolderHeart, Wand2, Flower2, Zap, Palmtree, ZoomIn } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { GalleryPicker } from '../../../components/GalleryPicker';

// Mock types if not available, or import from types.ts
interface GeneratedImage {
    id: string;
    src: string;
    style: string;
    ratio: string;
}

interface PortraitMasterTabProps {
    apiKey: string;
    onSuccess?: (imageUrl: string, prompt: string) => void;
    onError?: (msg: string) => void;
    onNeedApiKey?: () => void;
}

const PORTRAIT_STYLES = [
    {
        id: 'new_year',
        icon: 'Flower2',
        nameKey: 'generator.portrait.styles.new_year',
        descKey: 'generator.portrait.styles.new_year_desc',
        prompt: `
        Subject: A girl (or person based on input image)
        Clothing: Wearing a red brocade jacket with golden auspicious patterns and snowy plum blossoms embroidery, draped with a snow-white fox fur cape.
        Makeup: Eyebrows like willow leaves, exquisitely painted in dark blue-black. Eyes full of the joy of New Year, with pale gold peach blossom appliques at the corners of the eyes. Lips like cherry beads.
        Hairstyle: Peony bun, with a few playful strands of hair hanging on the forehead.
        Pose: Holding a "Fu" (Fortune) character in hand, standing in a courtyard, with a graceful posture.
        Background: A large, tension-filled black calligraphy "Fu" character (cursive script) as the backdrop, with Spring Festival theme elements.
        Style: High-quality fashion photography, festive atmosphere, elegant, detailed texture.
        `
    },
    {
        id: 'hanfu_studio',
        icon: 'Wand2',
        nameKey: 'generator.portrait.styles.hanfu_studio',
        descKey: 'generator.portrait.styles.hanfu_studio_desc',
        prompt: `
        Subject: A person (based on input image)
        Clothing: Elegant traditional Hanfu, flowing silk robes in pastel colors (light blue and white).
        Setting: A classical Chinese studio background with ink wash painting screens and a guzheng (zither) prop.
        Lighting: Soft, ethereal lighting, creating a dreamlike atmosphere.
        Style: Classical Chinese portrait, poetic, refined, high-definition photography.
        `
    },
    {
        id: 'cyberpunk_city',
        icon: 'Zap',
        nameKey: 'generator.portrait.styles.cyberpunk',
        descKey: 'generator.portrait.styles.cyberpunk_desc',
        prompt: `
        Subject: A person (based on input image)
        Clothing: Techwear, futuristic jacket with glowing neon accents.
        Setting: A rainy cyberpunk city street at night, with neon signs (pink and blue) reflecting on wet pavement.
        Lighting: High contrast, dramatic neon lighting, cinematic look.
        Style: Cyberpunk 2077 aesthetic, futuristic, edgy, highly detailed.
        `
    },
    {
        id: 'nature_fresh',
        icon: 'Palmtree',
        nameKey: 'generator.portrait.styles.nature',
        descKey: 'generator.portrait.styles.nature_desc',
        prompt: `
        Subject: A person (based on input image)
        Clothing: Casual, light, and airy summer outfit (white linen or floral).
        Setting: A sunlit meadow with wildflowers and a clear blue sky.
        Lighting: Natural sunlight, golden hour, warm and inviting.
        Style: Fresh, Japanese magazine style, natural, candid, bright.
        `
    }
];

const ASPECT_RATIOS = [
    { id: '3:4', label: '3:4 (Portrait)', width: 3, height: 4 },
    { id: '1:1', label: '1:1 (Square)', width: 1, height: 1 },
    { id: '4:3', label: '4:3 (Landscape)', width: 4, height: 3 },
    { id: '9:16', label: '9:16 (Story)', width: 9, height: 16 }
];

const PortraitMasterTab: React.FC<PortraitMasterTabProps> = ({ apiKey, onSuccess, onError, onNeedApiKey }) => {
    const { t } = useTranslation();

    // State
    const [image, setImage] = useState<string | null>(null);
    const [croppedImage, setCroppedImage] = useState<string | null>(null);
    const [isCropping, setIsCropping] = useState(false);
    const [showGallery, setShowGallery] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
    const [previewImage, setPreviewImage] = useState<GeneratedImage | null>(null);
    const [customPrompt, setCustomPrompt] = useState('');

    // Settings
    const [selectedStyleId, setSelectedStyleId] = useState('new_year');
    const [selectedRatio, setSelectedRatio] = useState('3:4');

    // Refs
    const fileInputRef = useRef<HTMLInputElement>(null);
    const cropperRef = useRef<Cropper | null>(null);
    const imageElementRef = useRef<HTMLImageElement>(null);

    // Initial Cropper Setup
    useEffect(() => {
        if (isCropping && image && imageElementRef.current) {
            if (cropperRef.current) cropperRef.current.destroy();
            cropperRef.current = new Cropper(imageElementRef.current, {
                aspectRatio: NaN, // Free crop for initial upload
                viewMode: 1,
                dragMode: 'move',
                autoCropArea: 0.8,
                background: false,
            });
        }
        return () => {
            cropperRef.current?.destroy();
            cropperRef.current = null;
        };
    }, [isCropping, image]);

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
                    setShowGallery(false);
                }
            };
            reader.readAsDataURL(blob);
        }
    };

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
    };

    const generatePortrait = async () => {
        if (!apiKey) {
            onNeedApiKey?.();
            return;
        }
        if (!croppedImage) return;

        setIsGenerating(true);
        try {
            const style = PORTRAIT_STYLES.find(s => s.id === selectedStyleId)!;

            const prompt = `
            You are a world-class portrait photographer and digital artist. 
            Recreate the person from the reference image into a new high-quality stylized portrait.
            PRESERVE THE FACIAL IDENTITY, features, and expression of the subject.

            Target Style Description:
            ${style.prompt}

            Technical Requirements:
            - Aspect Ratio: ${selectedRatio}
            - High Resolution, highly detailed.
            - Perfect lighting and composition.
            - Ensure the face looks like the person in the reference image.

            ${customPrompt ? `Additional User Request (Items/Scene): ${customPrompt}` : ''}
            `;

            const ai = new GoogleGenAI({ apiKey });
            const base64Data = croppedImage.split(',')[1];
            const mimeType = croppedImage.split(';')[0].split(':')[1];

            const result = await ai.models.generateContent({
                model: "gemini-3-pro-image-preview",
                contents: {
                    parts: [
                        { inlineData: { data: base64Data, mimeType } },
                        { text: prompt }
                    ]
                },
                config: {
                    responseModalities: [Modality.IMAGE],
                    imageConfig: {
                        aspectRatio: selectedRatio
                    }
                }
            });

            if (result.candidates?.[0]?.content?.parts) {
                for (const part of result.candidates[0].content.parts) {
                    if (part.inlineData) {
                        const src = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
                        const newImage = {
                            id: Date.now().toString(),
                            src,
                            style: style.id,
                            ratio: selectedRatio
                        };
                        setGeneratedImages(prev => [newImage, ...prev]);
                        // Only notify success for the first one if needed, or just let user see it
                        onSuccess?.(src, prompt);
                    }
                }
            }
        } catch (err: any) {
            console.error("Generation failed:", err);
            onError?.(err.message || "Failed to generate portrait");
        } finally {
            setIsGenerating(false);
        }
    };

    const downloadPortrait = (img: GeneratedImage) => {
        const link = document.createElement('a');
        link.href = img.src;
        link.download = `portrait_${img.style}_${Date.now()}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Helper to render icons dynamically
    const renderIcon = (iconName: string, size = 20) => {
        switch (iconName) {
            case 'Flower2': return <Flower2 size={size} />;
            case 'Wand2': return <Wand2 size={size} />;
            case 'Zap': return <Zap size={size} />;
            case 'Palmtree': return <Palmtree size={size} />;
            default: return <Sparkles size={size} />;
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500 font-sans text-bronze-text">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* --- Left Panel: Controls --- */}
                <div className="lg:col-span-4 space-y-6">

                    {/* 1. Upload Section */}
                    <div className="bg-cream backdrop-blur-xl border border-cream-dark rounded-[2rem] p-6 shadow-sm">
                        <h3 className="text-sm font-black text-bronze-light uppercase tracking-widest mb-4 flex items-center gap-2">
                            <Camera size={16} /> {t('generator.portrait.steps.upload')}
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
                                    <p className="font-bold text-bronze-text text-sm">{t('generator.portrait.upload_hint') || "上傳照片"}</p>
                                </div>
                                <button
                                    onClick={() => setShowGallery(true)}
                                    className="mt-3 w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-secondary/10 hover:bg-secondary/20 text-secondary rounded-xl text-sm font-bold transition-colors"
                                >
                                    <FolderHeart size={18} />
                                    {t('generator.action.gallery') || "從作品集選取"}
                                </button>
                            </>
                        ) : (
                            <div className="relative group">
                                <div className="rounded-3xl overflow-hidden border border-cream-dark/50 shadow-md">
                                    <img src={croppedImage} alt="Source" className="w-full h-auto object-cover max-h-[300px]" />
                                </div>
                                <button
                                    onClick={() => { setIsCropping(true); setImage(croppedImage); }}
                                    className="absolute top-2 right-2 p-2 bg-white text-bronze-text rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-all hover:scale-110"
                                >
                                    <Scissors size={14} />
                                </button>
                                <button
                                    onClick={() => { setCroppedImage(null); setImage(null); }}
                                    className="absolute top-2 right-12 p-2 bg-white text-red-500 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-all hover:scale-110"
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        )}
                    </div>

                    {/* 2. Configuration */}
                    <div className="bg-cream backdrop-blur-xl border border-cream-dark rounded-[2rem] p-6 shadow-sm space-y-6">
                        <h3 className="text-sm font-black text-bronze-light uppercase tracking-widest mb-2 flex items-center gap-2">
                            <Sparkles size={16} /> {t('generator.portrait.steps.style')}
                        </h3>

                        {/* Style Grid */}
                        <div className="grid grid-cols-2 gap-3">
                            {PORTRAIT_STYLES.map(style => (
                                <button
                                    key={style.id}
                                    onClick={() => setSelectedStyleId(style.id)}
                                    className={`relative p-3 rounded-2xl border-2 transition-all text-left flex flex-col gap-2 ${selectedStyleId === style.id
                                        ? 'border-primary bg-primary/5 shadow-md shadow-primary/10'
                                        : 'border-cream-dark/50 bg-white/50 hover:bg-white hover:border-primary/50'
                                        }`}
                                >
                                    <div className={`p-2 rounded-full w-fit ${selectedStyleId === style.id ? 'bg-primary text-white' : 'bg-cream-dark/20 text-bronze-light'}`}>
                                        {renderIcon(style.icon, 16)}
                                    </div>
                                    <div>
                                        <div className={`text-xs font-bold ${selectedStyleId === style.id ? 'text-primary' : 'text-bronze-text'}`}>
                                            {t(style.nameKey)}
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>

                        {/* Aspect Ratio */}
                        <div>
                            <label className="text-xs font-bold text-bronze-light mb-2 block">{t('generator.portrait.settings.ratio')}</label>
                            <div className="flex flex-wrap gap-2">
                                {ASPECT_RATIOS.map(ratio => (
                                    <button
                                        key={ratio.id}
                                        onClick={() => setSelectedRatio(ratio.id)}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${selectedRatio === ratio.id
                                            ? 'bg-primary text-white border-primary'
                                            : 'bg-white text-bronze-text border-cream-dark hover:border-primary/50'
                                            }`}
                                    >
                                        {ratio.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Custom Prompt Input */}
                        <div>
                            <label className="text-xs font-bold text-bronze-light mb-2 block">{t('generator.portrait.settings.custom')}</label>
                            <input
                                type="text"
                                value={customPrompt}
                                onChange={(e) => setCustomPrompt(e.target.value)}
                                placeholder={t('generator.portrait.settings.custom_placeholder')}
                                className="w-full px-4 py-2 rounded-xl border border-cream-dark bg-white/50 text-sm font-bold text-bronze-text outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all placeholder:text-bronze-light/50"
                            />
                        </div>

                        {/* Description of current style */}
                        <div className="bg-white/50 p-3 rounded-xl border border-cream-dark/30 text-xs text-bronze-text/80 leading-relaxed italic">
                            {t(PORTRAIT_STYLES.find(s => s.id === selectedStyleId)?.descKey || '')}
                        </div>

                        <Button
                            onClick={generatePortrait}
                            disabled={!croppedImage || isGenerating}
                            className="w-full h-12 bg-primary hover:bg-primary-hover text-white shadow-lg shadow-primary/20 rounded-xl text-base font-black flex items-center justify-center gap-2"
                        >
                            <Sparkles size={20} className={isGenerating ? "animate-spin" : ""} />
                            {isGenerating ? t('generator.portrait.action.generating') : t('generator.portrait.action.generate')}
                        </Button>
                    </div>
                </div>

                {/* --- Right Panel: Results --- */}
                <div className="lg:col-span-8">
                    <div className="bg-cream backdrop-blur-xl border border-cream-dark rounded-[2rem] p-8 min-h-[600px] flex flex-col">
                        <h3 className="text-sm font-black text-bronze-light uppercase tracking-widest mb-6 flex items-center gap-2">
                            <ImageIcon size={16} /> {t('generator.portrait.results')}
                        </h3>

                        {generatedImages.length === 0 ? (
                            <div className="flex-1 flex flex-col items-center justify-center text-bronze-light/50 space-y-4">
                                <div className="p-6 bg-cream-dark/10 rounded-full">
                                    <User size={48} />
                                </div>
                                <p className="font-bold">{t('generator.portrait.empty_hint')}</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                {generatedImages.map(img => (
                                    <div key={img.id} className="group relative rounded-2xl overflow-hidden shadow-lg border border-cream-dark bg-white">
                                        <div className={`aspect-[${img.ratio.replace(':', '/')}] bg-cream-light relative`}>
                                            <img src={img.src} alt="Generated Portrait" className="w-full h-full object-cover" />
                                            {/* Hover Overlay */}
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 backdrop-blur-sm">
                                                <button onClick={() => setPreviewImage(img)} className="p-3 bg-white text-primary rounded-full shadow-xl hover:scale-110 transition-transform" title={t('generator.action.zoom')}>
                                                    <ZoomIn size={20} />
                                                </button>
                                                <button onClick={() => downloadPortrait(img)} className="p-3 bg-white text-primary rounded-full shadow-xl hover:scale-110 transition-transform" title={t('generator.action.download')}>
                                                    <Download size={20} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
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
                                    <Scissors size={20} className="text-primary" /> {t('generator.portrait.crop_title')}
                                </h3>
                                <button onClick={cancelCrop} className="text-bronze-light hover:text-bronze-text font-bold">✕</button>
                            </div>
                            <div className="flex-1 bg-neutral-100 rounded-2xl overflow-hidden relative min-h-[400px]">
                                <img ref={imageElementRef} src={image} alt="Crop target" className="max-w-full max-h-[60vh] object-contain mx-auto" />
                            </div>
                            <div className="flex justify-end gap-4 mt-6">
                                <Button variant="secondary" onClick={cancelCrop}>
                                    {t('common.cancel')}
                                </Button>
                                <Button onClick={confirmCrop} className="bg-primary hover:bg-primary-hover text-white shadow-lg shadow-primary/20">
                                    {t('common.confirm')}
                                </Button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Image Preview Modal */}
            {
                previewImage && (
                    <div
                        className="fixed inset-0 z-[110] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in"
                        onClick={() => setPreviewImage(null)}
                    >
                        <div className="relative max-w-4xl w-full max-h-[90vh] flex flex-col items-center justify-center gap-4">
                            <img
                                src={previewImage.src}
                                alt="Preview"
                                className="max-w-full max-h-[80vh] object-contain rounded-lg shadow-2xl"
                                onClick={(e) => e.stopPropagation()}
                            />
                            <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md p-3 rounded-full border border-white/20" onClick={e => e.stopPropagation()}>
                                <button
                                    onClick={() => downloadPortrait(previewImage)}
                                    className="px-4 py-2 bg-primary text-white rounded-full font-bold text-sm hover:bg-primary-hover transition-all flex items-center gap-2"
                                >
                                    <Download size={16} /> {t('generator.action.download')}
                                </button>
                            </div>
                            <button
                                className="absolute top-4 right-4 md:-top-12 md:right-0 text-white hover:text-gray-300 transition-colors bg-black/50 md:bg-transparent p-2 rounded-full"
                                onClick={() => setPreviewImage(null)}
                            >
                                <span className="text-xl font-bold">✕</span>
                            </button>
                        </div>
                    </div>
                )
            }

            {/* Gallery Picker */}
            {showGallery && (
                <GalleryPicker
                    onClose={() => setShowGallery(false)}
                    onSelect={handleGallerySelect}
                />
            )}
        </div >
    );
};

export default PortraitMasterTab;

import React, { useState, useRef } from 'react';
import { Upload, Download, Image as ImageIcon, FileCode, Trash2, Settings, Loader2, FolderHeart } from 'lucide-react';
import ImageTracer from 'imagetracerjs';
import { Button } from '../../components/ui/Button';
import { useTranslation } from 'react-i18next';
import { GalleryPicker } from '../../components/GalleryPicker';

// Add missing types for imagetracerjs since it likely doesn't have them
declare module 'imagetracerjs';

export default function SvgConverterApp() {
    const [image, setImage] = useState<string | null>(null);
    const [svgContent, setSvgContent] = useState<string | null>(null);
    const [isConverting, setIsConverting] = useState(false);
    const [preset, setPreset] = useState<'default' | 'posterized' | 'curvy'>('default');
    const [colorCount, setColorCount] = useState(16);
    const [showGallery, setShowGallery] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { t } = useTranslation();

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (evt) => {
                setImage(evt.target?.result as string);
                setSvgContent(null);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleGallerySelect = (blob: Blob) => {
        const reader = new FileReader();
        reader.onload = (evt) => {
            setImage(evt.target?.result as string);
            setSvgContent(null);
        };
        reader.readAsDataURL(blob);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        const file = e.dataTransfer.files?.[0];
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (evt) => {
                setImage(evt.target?.result as string);
                setSvgContent(null);
            };
            reader.readAsDataURL(file);
        }
    };

    const convertToSvg = () => {
        if (!image) return;
        setIsConverting(true);

        // ImageTracer configuration based on preset
        const baseOptions = {
            default: {},
            posterized: { colorsampling: 2, mincolorratio: 0.02 },
            curvy: { ltres: 1, qtres: 1, pathomit: 0, rightangleenhance: false }
        }[preset];

        const options = { ...baseOptions, numberofcolors: colorCount };

        // ImageTracer.imageToSVG expects a URL or base64
        // We need to wrap it in a timeout to allow UI update
        setTimeout(() => {
            ImageTracer.imageToSVG(
                image,
                (svgstr: string) => {
                    // Post-process SVG to make it responsive
                    // 1. Ensure it has a viewBox corresponding to its original size
                    // 2. Set width and height to 100%

                    let processedSvg = svgstr;

                    // Extract original dimensions
                    const widthMatch = svgstr.match(/width="([\d\.]+)"/);
                    const heightMatch = svgstr.match(/height="([\d\.]+)"/);

                    if (widthMatch && heightMatch) {
                        const w = widthMatch[1];
                        const h = heightMatch[1];

                        // If viewBox is missing, add it
                        if (!svgstr.includes('viewBox')) {
                            processedSvg = processedSvg.replace('<svg', `<svg viewBox="0 0 ${w} ${h}"`);
                        }

                        // Force width and height to 100% for display responsiveness
                        processedSvg = processedSvg.replace(/width="[\d\.]+"/, 'width="100%"');
                        processedSvg = processedSvg.replace(/height="[\d\.]+"/, 'height="100%"');

                        // Add preserveAspectRatio to ensure it fits nicely
                        if (!processedSvg.includes('preserveAspectRatio')) {
                            processedSvg = processedSvg.replace('<svg', '<svg preserveAspectRatio="xMidYMid meet"');
                        }
                    }

                    setSvgContent(processedSvg);
                    setIsConverting(false);
                },
                options
            );
        }, 100);
    };

    const downloadSvg = () => {
        if (!svgContent) return;
        const blob = new Blob([svgContent], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `converted-image-${Date.now()}.svg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    return (
        <div className="w-full max-w-5xl mx-auto p-6 space-y-8 animate-in fade-in duration-500">
            {showGallery && <GalleryPicker onSelect={handleGallerySelect} onClose={() => setShowGallery(false)} />}



            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Upload Section */}
                <section className="bg-white/40 backdrop-blur-md border border-cream-dark shadow-sm rounded-[2rem] p-8 flex flex-col h-full min-h-[500px]">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-sm font-black flex items-center gap-2 text-bronze-light uppercase tracking-widest">
                            <ImageIcon size={18} className="text-primary" /> {t('svgConverterPage.sourceImage') || 'Source Image'}
                        </h2>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setShowGallery(true)}
                                className="text-[10px] font-bold text-bronze-text bg-cream-medium hover:bg-cream-dark px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 border border-cream-dark"
                            >
                                <FolderHeart size={12} /> {t('app.selectFromGallery')}
                            </button>

                            {image && (
                                <button
                                    onClick={() => { setImage(null); setSvgContent(null); }}
                                    className="text-[10px] font-bold text-secondary bg-secondary/10 hover:bg-secondary/20 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1"
                                >
                                    <Trash2 size={12} /> {t('svgConverterPage.clear') || 'Clear'}
                                </button>
                            )}
                        </div>
                    </div>

                    {!image ? (
                        <div
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={handleDrop}
                            onClick={() => fileInputRef.current?.click()}
                            className="flex-1 border-3 border-dashed border-cream-dark bg-cream-light/50 hover:bg-cream-medium/50 hover:border-primary rounded-[2rem] flex flex-col items-center justify-center cursor-pointer transition-all group"
                        >
                            <input ref={fileInputRef} type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                            <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center shadow-lg shadow-primary/10 mb-6 group-hover:scale-110 transition-transform">
                                <Upload size={32} className="text-primary" />
                            </div>
                            <h3 className="text-lg font-black text-bronze-text">{t('svgConverterPage.clickOrDrag') || 'Click or Drag Image'}</h3>
                            <p className="text-bronze-light text-xs font-bold uppercase tracking-wide mt-2">{t('svgConverterPage.supports') || 'Supports PNG, JPG, BMP'}</p>
                        </div>
                    ) : (
                        <div className="flex-1 relative rounded-[2rem] overflow-hidden border border-cream-dark bg-cream-light/50 p-4 flex items-center justify-center">
                            <img src={image} alt="Source" className="max-w-full max-h-full object-contain shadow-lg rounded-lg" />
                        </div>
                    )}

                    {/* Settings */}
                    <div className="mt-8 pt-6 border-t border-cream-dark/50 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="text-[10px] font-bold text-bronze-light uppercase tracking-widest mb-3 block">{t('svgConverterPage.conversionStyle') || 'Conversion Style'}</label>
                            <div className="flex bg-cream-medium/50 p-1 rounded-xl mb-4 border border-cream-dark/50">
                                {(['default', 'posterized', 'curvy'] as const).map(p => (
                                    <button
                                        key={p}
                                        onClick={() => setPreset(p)}
                                        className={`flex-1 py-2 rounded-lg text-xs font-bold capitalize transition-all ${preset === p ? 'bg-white shadow-sm text-primary' : 'text-bronze-light hover:text-bronze-text'}`}
                                    >
                                        {t(`svgConverterPage.styles.${p}`) || p}
                                    </button>
                                ))}
                            </div>

                            <div>
                                <label className="text-[10px] font-bold text-bronze-light uppercase tracking-widest mb-2 flex justify-between">
                                    <span>{t('svgConverterPage.colorCount') || 'Color Count'}</span>
                                    <span className="text-primary">{colorCount}</span>
                                </label>
                                <input
                                    type="range"
                                    min="2"
                                    max="64"
                                    step="2"
                                    value={colorCount}
                                    onChange={(e) => setColorCount(Number(e.target.value))}
                                    className="w-full accent-primary h-2 bg-cream-medium rounded-lg appearance-none cursor-pointer"
                                />
                            </div>
                        </div>
                        <div className="flex items-end">
                            <Button
                                onClick={convertToSvg}
                                disabled={!image || isConverting}
                                className="w-full h-12 bg-primary hover:bg-primary-hover text-white shadow-lg shadow-primary/20 rounded-xl"
                            >
                                {isConverting ? <Loader2 size={18} className="animate-spin mr-2" /> : <Settings size={18} className="mr-2" />}
                                {isConverting ? (t('svgConverterPage.tracing') || 'Tracing...') : (t('svgConverterPage.convert') || 'Convert to SVG')}
                            </Button>
                        </div>
                    </div>
                </section>

                {/* Result Section */}
                <section className="bg-white/40 backdrop-blur-md border border-cream-dark shadow-sm rounded-[2rem] p-8 flex flex-col h-full min-h-[500px]">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-sm font-black flex items-center gap-2 text-bronze-light uppercase tracking-widest">
                            <FileCode size={18} className="text-secondary" /> {t('svgConverterPage.vectorResult') || 'Vector Result'}
                        </h2>
                        {svgContent && (
                            <span className="text-[10px] font-bold bg-secondary/10 text-secondary px-3 py-1 rounded-full border border-secondary/20">
                                {t('svgConverterPage.vectorized') || 'Vectorized'}
                            </span>
                        )}
                    </div>

                    <div className="flex-1 border border-cream-dark bg-[url('https://grainy-gradients.vercel.app/noise.svg')] bg-cream-light rounded-[2rem] overflow-hidden relative flex items-center justify-center p-8 group">
                        {!svgContent ? (
                            <div className="text-center text-bronze-light/50">
                                <ImageIcon size={48} className="mx-auto mb-4 opacity-50" />
                                <p className="font-bold">{t('svgConverterPage.previewHint') || 'SVG Preview will appear here'}</p>
                            </div>
                        ) : (
                            <div
                                className="w-full h-full flex items-center justify-center p-4 svg-container"
                                dangerouslySetInnerHTML={{ __html: svgContent }}
                            />
                        )}
                    </div>

                    <div className="mt-8 pt-6 border-t border-cream-dark/50">
                        <Button
                            onClick={downloadSvg}
                            disabled={!svgContent}
                            className="w-full h-14 bg-bronze-text hover:bg-bronze-dark text-white shadow-xl rounded-xl"
                        >
                            <Download size={20} className="mr-2" /> {t('svgConverterPage.download') || 'Download SVG'}
                        </Button>
                    </div>
                </section>
            </div>

            {/* SVG Container CSS fix to ensure it scales */}
            <style>{`
        .svg-container svg {
            width: 100% !important;
            height: 100% !important;
            max-width: 100%;
            max-height: 500px;
            object-fit: contain;
        }
      `}</style>
        </div>
    );
}

import React, { useRef, useState } from 'react';
import { DraggableImage } from './DraggableImage';
import { toPng } from 'html-to-image';
import jsPDF from 'jspdf';
import { Download, Grid, Loader2, Check, Minus, Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface StickerImage {
    id: string;
    src: string;
    width: number;
    height: number;
}

interface CanvasProps {
    images: StickerImage[];
    setImages: React.Dispatch<React.SetStateAction<StickerImage[]>>;
}

export const Canvas: React.FC<CanvasProps> = ({ images, setImages }) => {
    const { t } = useTranslation();
    const canvasRef = useRef<HTMLDivElement>(null);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [showGrid, setShowGrid] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const [bgColor, setBgColor] = useState<string>('#ffffff');
    const [viewScale, setViewScale] = useState(0.4); // Default easier for mobile

    // A4 size in pixels at 96 DPI (standard screen)
    // A4 is 210mm x 297mm.
    // 96 DPI: 794px x 1123px approx.
    const A4_WIDTH_PX = 794;
    const A4_HEIGHT_PX = 1123;

    const handleDelete = (id: string) => {
        setImages(prev => prev.filter(img => img.id !== id));
        if (selectedId === id) setSelectedId(null);
    };

    const handleExportPNG = async () => {
        if (!canvasRef.current) return;
        setIsExporting(true);
        setSelectedId(null);

        try {
            await new Promise(resolve => setTimeout(resolve, 500)); // Wait for React to re-render

            const exportBg = bgColor === 'transparent' ? null : bgColor;
            // 300 DPI / 96 DPI = 3.125 scale factor for print quality
            // @ts-ignore
            const dataUrl = await toPng(canvasRef.current, {
                backgroundColor: exportBg || undefined,
                pixelRatio: 300 / 96,
                width: A4_WIDTH_PX,
                height: A4_HEIGHT_PX
            });

            const link = document.createElement('a');
            link.download = `sticker-sheet-${bgColor === 'transparent' ? 'transparent' : 'color'}.png`;
            link.href = dataUrl;
            link.click();
        } catch (err: any) {
            console.error('PNG Export failed:', err);
            const errorMessage = err?.message || 'Unknown error';
            alert(`${t('printSheet.exportFailed') || 'Export failed.'}\n(${errorMessage})`);
        } finally {
            setIsExporting(false);
        }
    };

    const handleExportPDF = async () => {
        if (!canvasRef.current) return;
        setIsExporting(true);
        setSelectedId(null); // Deselect to remove selection rings

        try {
            // Wait for React to re-render without selection
            await new Promise(resolve => setTimeout(resolve, 500));

            const exportBg = bgColor === 'transparent' ? null : bgColor;
            // 300 DPI / 96 DPI = 3.125 scale factor for print quality
            // @ts-ignore
            const dataUrl = await toPng(canvasRef.current, {
                backgroundColor: exportBg || undefined,
                pixelRatio: 300 / 96,
                width: A4_WIDTH_PX,
                height: A4_HEIGHT_PX
            });

            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();

            pdf.addImage(dataUrl, 'PNG', 0, 0, pdfWidth, pdfHeight);
            pdf.save('sticker-sheet.pdf');
        } catch (err: any) {
            console.error('Export failed:', err);
            const errorMessage = err?.message || 'Unknown error';
            alert(`${t('printSheet.exportFailed') || 'Export failed.'}\n(${errorMessage})`);
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <div className="flex flex-col items-center gap-6">
            {/* Toolbar */}
            <div className="flex flex-wrap justify-center gap-4 p-2 bg-white rounded-xl shadow-sm border border-slate-200">

                {/* Scale Controls */}
                <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1">
                    <button
                        onClick={() => setViewScale(s => Math.max(0.2, s - 0.1))}
                        className="p-1 hover:bg-white rounded-md transition-colors"
                    >
                        <Minus size={14} />
                    </button>
                    <span className="text-xs font-bold w-12 text-center select-none">{Math.round(viewScale * 100)}%</span>
                    <button
                        onClick={() => setViewScale(s => Math.min(1.5, s + 0.1))}
                        className="p-1 hover:bg-white rounded-md transition-colors"
                    >
                        <Plus size={14} />
                    </button>
                </div>

                <div className="w-px h-8 bg-slate-200 self-center mx-2" />

                {/* Grid Toggle */}
                <button
                    onClick={() => setShowGrid(!showGrid)}
                    className={`p-2 rounded-lg flex items-center gap-2 text-sm font-bold transition-all ${showGrid ? 'bg-violet-100 text-violet-600' : 'hover:bg-slate-100 text-slate-600'}`}
                    title={t('printSheet.grid') || 'Grid'}
                >
                    <Grid size={18} />
                    <span className="hidden sm:inline">{t('printSheet.grid') || 'Grid'}</span>
                </button>

                <div className="w-px h-8 bg-slate-200 self-center mx-2" />

                {/* Background Controls */}
                <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider hidden sm:inline">{t('printSheet.background')}</span>

                    {/* Transparent Button */}
                    <button
                        onClick={() => setBgColor('transparent')}
                        className={`w-8 h-8 rounded-full border flex items-center justify-center transition-all ${bgColor === 'transparent' ? 'ring-2 ring-violet-500 border-transparent' : 'border-slate-300 hover:border-slate-400'}`}
                        title="Transparent"
                        style={{
                            backgroundImage: 'linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)',
                            backgroundSize: '8px 8px',
                            backgroundPosition: '0 0, 0 4px, 4px -4px, -4px 0px',
                            backgroundColor: '#fff'
                        }}
                    >
                        {bgColor === 'transparent' && <Check size={14} className="text-slate-900" />}
                    </button>

                    {/* White Button */}
                    <button
                        onClick={() => setBgColor('#ffffff')}
                        className={`w-8 h-8 rounded-full border flex items-center justify-center transition-all ${bgColor === '#ffffff' ? 'ring-2 ring-violet-500 border-transparent' : 'border-slate-300 hover:border-slate-400'}`}
                        title="White"
                        style={{ backgroundColor: '#ffffff' }}
                    >
                        {bgColor === '#ffffff' && <Check size={14} className="text-slate-900" />}
                    </button>

                    {/* Color Picker */}
                    <div className="relative group">
                        <div className={`w-8 h-8 rounded-full border flex items-center justify-center overflow-hidden transition-all ${bgColor !== 'transparent' && bgColor !== '#ffffff' ? 'ring-2 ring-violet-500 border-transparent' : 'border-slate-300 hover:border-slate-400'}`}>
                            <input
                                type="color"
                                value={bgColor === 'transparent' ? '#ffffff' : bgColor}
                                onChange={(e) => setBgColor(e.target.value)}
                                className="w-[150%] h-[150%] p-0 -m-[25%] cursor-pointer border-none"
                                title="Custom Color"
                            />
                        </div>
                        {bgColor !== 'transparent' && bgColor !== '#ffffff' && (
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                <Check size={14} className="text-white drop-shadow-md" />
                            </div>
                        )}
                    </div>
                </div>

                <div className="w-px h-8 bg-slate-200 self-center mx-2" />

                {/* Export Buttons */}
                <button
                    onClick={handleExportPNG}
                    disabled={isExporting || images.length === 0}
                    className="px-4 py-2 bg-white text-slate-700 border border-slate-300 rounded-lg flex items-center gap-2 text-sm font-bold shadow-sm hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                    {isExporting ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
                    PNG
                </button>

                <button
                    onClick={handleExportPDF}
                    disabled={isExporting || images.length === 0}
                    className="px-4 py-2 bg-slate-900 text-white rounded-lg flex items-center gap-2 text-sm font-bold shadow-md hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                    {isExporting ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
                    {isExporting ? (t('printSheet.exporting') || 'Exporting...') : 'PDF'}
                </button>
            </div>

            {/* Canvas Container - Scaled to fit screen */}
            <div className="relative w-full overflow-hidden flex justify-center bg-slate-100/50 rounded-2xl border border-slate-200 p-8 shadow-inner min-h-[500px]">
                {/* Visual Wrapper for Shadow and Checkerboard (NOT Exported) */}
                <div
                    className="relative transition-transform origin-top z-0 flex-shrink-0"
                    style={{
                        width: A4_WIDTH_PX,
                        height: A4_HEIGHT_PX,
                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                        transform: `scale(${viewScale})`,
                        marginBottom: `-${A4_HEIGHT_PX * (1 - viewScale)}px` // Negative margin to reduce empty space when zoomed out
                    }}
                >
                    {/* Checkerboard Pattern Layer */}
                    {bgColor === 'transparent' && (
                        <div
                            className="absolute inset-0 z-0 pointer-events-none rounded-sm overflow-hidden"
                            style={{
                                backgroundImage: 'linear-gradient(45deg, #cbd5e1 25%, transparent 25%), linear-gradient(-45deg, #cbd5e1 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #cbd5e1 75%), linear-gradient(-45deg, transparent 75%, #cbd5e1 75%)',
                                backgroundSize: '20px 20px',
                                backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px',
                                backgroundColor: '#fff'
                            }}
                        />
                    )}

                    {/* Actual Exportable Canvas */}
                    <div
                        ref={canvasRef}
                        className="relative z-10 w-full h-full"
                        style={{
                            backgroundColor: bgColor === 'transparent' ? 'transparent' : bgColor,
                            color: '#000000'
                        }}
                        onClick={() => setSelectedId(null)}
                    >
                        {/* Grid Overlay */}
                        {showGrid && (
                            <div
                                className="absolute inset-0 pointer-events-none z-0 opacity-20"
                                style={{
                                    backgroundImage: 'linear-gradient(to right, #6366f1 2px, transparent 2px), linear-gradient(to bottom, #6366f1 2px, transparent 2px)',
                                    backgroundSize: '50px 50px'
                                }}
                            />
                        )}

                        {images.map(img => (
                            <DraggableImage
                                key={img.id}
                                {...img}
                                isSelected={selectedId === img.id}
                                onSelect={setSelectedId}
                                onDelete={handleDelete}
                                gridSize={showGrid ? 50 : 0}
                                isExporting={isExporting}
                            />
                        ))}

                        {images.length === 0 && (
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ color: '#94a3b8' }}>
                                <p className="text-2xl font-black uppercase tracking-widest opacity-50 select-none">A4 Canvas</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

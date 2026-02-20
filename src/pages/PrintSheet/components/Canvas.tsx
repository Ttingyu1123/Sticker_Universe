import React, { useRef, useState } from 'react';
import { DraggableImage } from './DraggableImage';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { Download, Grid, Loader2, Check, Minus, Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { saveStickerToDB } from '../../../db';

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

type SheetSize =
    | 'A4'
    | 'A5'
    | 'A6'
    | 'Letter'
    | 'Legal'
    | 'Tabloid'
    | 'Photo4x6'
    | 'Photo5x7'
    | 'Photo8x10'
    | 'Postcard100x148'
    | 'Postcard105x148';
type Orientation = 'portrait' | 'landscape';

const SHEET_SPECS: Record<SheetSize, { label: string; widthPx: number; heightPx: number; widthMm: number; heightMm: number }> = {
    A4: { label: 'A4 (210 x 297 mm)', widthPx: 794, heightPx: 1123, widthMm: 210, heightMm: 297 },
    A5: { label: 'A5 (148 x 210 mm)', widthPx: 559, heightPx: 794, widthMm: 148, heightMm: 210 },
    A6: { label: 'A6 (105 x 148 mm)', widthPx: 397, heightPx: 559, widthMm: 105, heightMm: 148 },
    Letter: { label: 'Letter (8.5 x 11 in)', widthPx: 816, heightPx: 1056, widthMm: 215.9, heightMm: 279.4 },
    Legal: { label: 'Legal (8.5 x 14 in)', widthPx: 816, heightPx: 1344, widthMm: 215.9, heightMm: 355.6 },
    Tabloid: { label: 'Tabloid (11 x 17 in)', widthPx: 1056, heightPx: 1632, widthMm: 279.4, heightMm: 431.8 },
    Photo4x6: { label: '4x6 Photo (101.6 x 152.4 mm)', widthPx: 384, heightPx: 576, widthMm: 101.6, heightMm: 152.4 },
    Photo5x7: { label: '5x7 Photo (127 x 177.8 mm)', widthPx: 480, heightPx: 672, widthMm: 127, heightMm: 177.8 },
    Photo8x10: { label: '8x10 Photo (203.2 x 254 mm)', widthPx: 768, heightPx: 960, widthMm: 203.2, heightMm: 254 },
    Postcard100x148: { label: 'Postcard (100 x 148 mm)', widthPx: 378, heightPx: 559, widthMm: 100, heightMm: 148 },
    Postcard105x148: { label: 'Postcard (105 x 148 mm)', widthPx: 397, heightPx: 559, widthMm: 105, heightMm: 148 }
};

export const Canvas: React.FC<CanvasProps> = ({ images, setImages }) => {
    const { t } = useTranslation();
    const getSheetLabel = (key: SheetSize, fallback: string) =>
        t(`printSheet.sheetSizes.${key}`, { defaultValue: fallback });
    const canvasRef = useRef<HTMLDivElement>(null);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [showGrid, setShowGrid] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const [bgColor, setBgColor] = useState<string>('#ffffff');
    const [viewScale, setViewScale] = useState(0.4); // Default easier for mobile
    const [sheetSize, setSheetSize] = useState<SheetSize>('A4');
    const [orientation, setOrientation] = useState<Orientation>('portrait');
    const sheetBase = SHEET_SPECS[sheetSize];
    const sheet = orientation === 'portrait'
        ? sheetBase
        : {
            ...sheetBase,
            widthPx: sheetBase.heightPx,
            heightPx: sheetBase.widthPx,
            widthMm: sheetBase.heightMm,
            heightMm: sheetBase.widthMm
        };
    const isIosSafari = typeof navigator !== 'undefined'
        && /iPad|iPhone|iPod/.test(navigator.userAgent)
        && /Safari/.test(navigator.userAgent)
        && !/CriOS|FxiOS|EdgiOS/.test(navigator.userAgent);

    const createSafeId = () =>
        (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function')
            ? crypto.randomUUID()
            : `print_${Date.now()}_${Math.random().toString(16).slice(2)}`;

    const autoSaveToGallery = async (imageUrl: string) => {
        try {
            await saveStickerToDB({
                id: createSafeId(),
                imageUrl,
                timestamp: Date.now(),
                phrase: `Print Sheet (${sheetSize}-${orientation})`
            });
        } catch (e) {
            console.error('Auto-save on download failed', e);
        }
    };

    const renderExportImage = async (): Promise<string> => {
        if (!canvasRef.current) throw new Error('Canvas not ready');
        const previousScale = viewScale;
        if (previousScale !== 1) {
            setViewScale(1);
            await new Promise(resolve => setTimeout(resolve, 60));
        }
        const exportBg = bgColor === 'transparent' ? null : bgColor;
        try {
            const canvas = await html2canvas(canvasRef.current, {
                backgroundColor: exportBg,
                scale: 300 / 96,
                width: sheet.widthPx,
                height: sheet.heightPx,
                useCORS: true,
                allowTaint: true,
                logging: false
            });
            return canvas.toDataURL('image/png');
        } finally {
            if (previousScale !== 1) {
                setViewScale(previousScale);
            }
        }
    };

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
            const dataUrl = await renderExportImage();

            await autoSaveToGallery(dataUrl);

            const link = document.createElement('a');
            link.download = `sticker-sheet-${sheetSize}-${orientation}-${bgColor === 'transparent' ? 'transparent' : 'color'}.png`;
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
            const dataUrl = await renderExportImage();

            await autoSaveToGallery(dataUrl);

            const pdf = new jsPDF({
                orientation: orientation === 'portrait' ? 'p' : 'l',
                unit: 'mm',
                format: [sheet.widthMm, sheet.heightMm]
            });
            const pdfWidth = sheet.widthMm;
            const pdfHeight = sheet.heightMm;

            pdf.addImage(dataUrl, 'PNG', 0, 0, pdfWidth, pdfHeight);
            // Use blob download flow to avoid iOS Safari opening blank page.
            const pdfBlob = pdf.output('blob');
            const pdfUrl = URL.createObjectURL(pdfBlob);
            const link = document.createElement('a');
            link.href = pdfUrl;
            link.download = `sticker-sheet-${sheetSize}-${orientation}.pdf`;
            link.target = '_self';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            setTimeout(() => URL.revokeObjectURL(pdfUrl), 1000);
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
                        title={t('printSheet.transparent', { defaultValue: 'Transparent' })}
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
                        title={t('printSheet.white', { defaultValue: 'White' })}
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
                                title={t('printSheet.customColor', { defaultValue: 'Custom Color' })}
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

                {/* Output Size */}
                <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider hidden sm:inline">
                        {t('printSheet.outputSize', { defaultValue: 'Output Size' })}
                    </span>
                    <select
                        value={sheetSize}
                        onChange={(e) => setSheetSize(e.target.value as SheetSize)}
                        className="h-9 rounded-lg border border-slate-300 bg-white px-2 text-xs font-bold text-slate-700"
                        aria-label={t('printSheet.outputSize', { defaultValue: 'Output Size' })}
                    >
                        {Object.entries(SHEET_SPECS).map(([key, spec]) => (
                            <option key={key} value={key}>
                                {getSheetLabel(key as SheetSize, spec.label)}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="w-px h-8 bg-slate-200 self-center mx-2" />

                {/* Orientation */}
                <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider hidden sm:inline">
                        {t('printSheet.orientation', { defaultValue: 'Orientation' })}
                    </span>
                    <select
                        value={orientation}
                        onChange={(e) => setOrientation(e.target.value as Orientation)}
                        className="h-9 rounded-lg border border-slate-300 bg-white px-2 text-xs font-bold text-slate-700"
                        aria-label={t('printSheet.orientation', { defaultValue: 'Orientation' })}
                    >
                        <option value="portrait">{t('printSheet.portrait', { defaultValue: 'Portrait' })}</option>
                        <option value="landscape">{t('printSheet.landscape', { defaultValue: 'Landscape' })}</option>
                    </select>
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

            {isIosSafari && (
                <div className="w-full max-w-3xl rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800">
                    {t('printSheet.iosPdfHint', { defaultValue: 'iPhone PDF download uses Safari share flow: tap Safari share, then choose Print, share again, and Save to Files.' })}
                </div>
            )}

            {/* Canvas Container - Scaled to fit screen */}
            <div className="relative w-full overflow-hidden flex justify-center bg-slate-100/50 rounded-2xl border border-slate-200 p-8 shadow-inner min-h-[500px]">
                {/* Visual Wrapper for Shadow and Checkerboard (NOT Exported) */}
                <div
                    className="relative transition-transform origin-top z-0 flex-shrink-0"
                    style={{
                        width: sheet.widthPx,
                        height: sheet.heightPx,
                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                        transform: `scale(${viewScale})`,
                        marginBottom: `-${sheet.heightPx * (1 - viewScale)}px` // Negative margin to reduce empty space when zoomed out
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
                                canvasScale={viewScale}
                            />
                        ))}

                        {images.length === 0 && (
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ color: '#94a3b8' }}>
                                <p className="text-2xl font-black uppercase tracking-widest opacity-50 select-none">{sheetSize} {orientation === 'portrait' ? t('printSheet.portrait', { defaultValue: 'Portrait' }) : t('printSheet.landscape', { defaultValue: 'Landscape' })}</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

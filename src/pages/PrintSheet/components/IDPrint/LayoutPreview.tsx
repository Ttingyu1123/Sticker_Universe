import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AppConfig, PhotoAsset } from '../../types/idPrint';
import { generatePhotoSheet } from '../../utils/IDPrint/canvasUtils';
import { Download, AlertCircle, FileCheck, FolderHeart, Minus, Plus } from 'lucide-react';
import { PAPER_DIMENSIONS } from '../../utils/IDPrint/constants';
import { saveStickerToDB } from '../../../../db';
import jsPDF from 'jspdf';

interface LayoutPreviewProps {
  assets: PhotoAsset[];
  config: AppConfig;
}

const LayoutPreview: React.FC<LayoutPreviewProps> = ({ assets, config }) => {
  const { t } = useTranslation();
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [photoCount, setPhotoCount] = useState<number>(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [previewZoom, setPreviewZoom] = useState(1); // 1 = 100%

  useEffect(() => {
    let active = true;
    let timeoutId: number;

    const generate = async () => {
      setIsGenerating(true);
      try {
        const { url, count } = await generatePhotoSheet(assets, config);
        if (active) {
          setPreviewUrl(url);
          setPhotoCount(count);
        }
      } catch (e) {
        console.error("Failed to generate preview", e);
      } finally {
        if (active) setIsGenerating(false);
      }
    };

    timeoutId = window.setTimeout(generate, 500);

    return () => {
      active = false;
      window.clearTimeout(timeoutId);
    };
  }, [assets, config]);

  const handleDownload = async () => {
    if (previewUrl && photoCount > 0) {
      try {
        await saveStickerToDB({
          id: `id-print_auto_${Date.now()}`,
          imageUrl: previewUrl,
          phrase: `ID Print (${config.photoSize})`,
          timestamp: Date.now()
        });
      } catch (e) {
        console.error('Auto-save on download failed', e);
      }
    }
    if (config.outputFormat === 'application/pdf') {
      handleDownloadPDF();
    } else {
      const link = document.createElement('a');
      link.download = `ID-Print-${config.photoSize}-${config.paperSize}-${new Date().getTime()}.${config.outputFormat === 'image/png' ? 'png' : 'jpg'}`;
      link.href = previewUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleDownloadPDF = () => {
    const paperSpec = PAPER_DIMENSIONS[config.paperSize];
    const isPortrait = config.paperOrientation === 'portrait';

    // Convert pixels to mm at 300 DPI
    const pxToMm = (px: number) => (px / 300) * 25.4;
    const paperWMm = pxToMm(isPortrait ? paperSpec.width : paperSpec.height);
    const paperHMm = pxToMm(isPortrait ? paperSpec.height : paperSpec.width);

    const pdf = new jsPDF({
      orientation: isPortrait ? 'p' : 'l',
      unit: 'mm',
      format: [paperWMm, paperHMm]
    });

    pdf.addImage(previewUrl, 'PNG', 0, 0, paperWMm, paperHMm, undefined, 'FAST');
    pdf.save(`ID-Print-${config.photoSize}-${config.paperSize}-${new Date().getTime()}.pdf`);
  };

  const handleSaveToGallery = async () => {
    if (!previewUrl || photoCount === 0) return;
    setIsSaving(true);
    try {
      await saveStickerToDB({
        id: `id-print_${Date.now()}`,
        imageUrl: previewUrl,
        phrase: `ID Print (${config.photoSize})`,
        timestamp: Date.now()
      });
      alert(t('packager.status.savedToCollection') || 'Saved to Collection');
    } catch (e) {
      console.error(e);
      alert('Failed to save to collection');
    } finally {
      setIsSaving(false);
    }
  };

  const paperSpec = PAPER_DIMENSIONS[config.paperSize];
  const isPortrait = config.paperOrientation === 'portrait';
  const displayW = isPortrait ? paperSpec.width : paperSpec.height;
  const displayH = isPortrait ? paperSpec.height : paperSpec.width;

  return (
    <div className="flex flex-col gap-4 md:gap-6 w-full min-h-[400px]">
      <div className="relative flex-1 bg-slate-100 border border-cream-dark/20 rounded-lg overflow-hidden flex items-center justify-center p-2 md:p-4 shadow-inner min-h-[250px]">
        {isGenerating && (
          <div className="absolute inset-0 bg-white/50 backdrop-blur-sm z-10 flex flex-col items-center justify-center text-bronze-text font-medium">
            <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin mb-2"></div>
            {t('printSheet.idPrint.preview.updating')}
          </div>
        )}

        {photoCount === 0 && !isGenerating ? (
          <div className="text-red-600 flex flex-col items-center gap-2 text-center bg-white p-6 rounded-xl shadow-sm border border-red-100">
            <AlertCircle size={32} />
            <p className="font-bold">{t('printSheet.idPrint.preview.noFit')}</p>
            <p className="text-sm text-bronze-text/60 whitespace-pre-line">
              {t('printSheet.idPrint.preview.noFitHint')}
            </p>
          </div>
        ) : (
          previewUrl && (
            <img
              src={previewUrl}
              alt="Layout Preview"
              style={{
                transform: `scale(${previewZoom})`,
                transition: 'transform 0.2s ease-out'
              }}
              className="max-w-full max-h-[35vh] md:max-h-[50vh] object-contain shadow-2xl bg-white ring-1 ring-slate-900/5"
            />
          )
        )}

        {!isGenerating && photoCount > 0 && (
          <div className="absolute bottom-4 right-4 bg-bronze/90 text-white text-xs px-3 py-1.5 rounded-full backdrop-blur-md border border-white/10 shadow-lg flex items-center gap-2">
            <FileCheck size={14} className="text-green-300" />
            <span>
              {displayW} x {displayH} px (300 DPI)
            </span>
          </div>
        )}
      </div>

      <div className="bg-white p-4 rounded-xl border border-cream-dark/20 shadow-sm flex flex-col gap-4 flex-shrink-0">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex flex-col">
            <div className="text-bronze-text text-sm">
              {t('printSheet.idPrint.preview.totalPhotos')}: <span className="font-bold text-bronze">{photoCount}</span>
            </div>
            <div className="text-bronze-text/50 text-xs mt-0.5">
              {t('printSheet.idPrint.preview.format')}: {config.outputFormat.split('/')[1].toUpperCase()}
            </div>
          </div>

          {/* Zoom Controls */}
          <div className="flex items-center gap-3">
            <span className="text-xs text-bronze-text/60 font-medium">{t('printSheet.idPrint.preview.zoom')}</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPreviewZoom(Math.max(0.25, previewZoom - 0.25))}
                className="w-7 h-7 flex items-center justify-center rounded bg-cream-dark/10 hover:bg-cream-dark/20 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                disabled={previewZoom <= 0.25}
                aria-label="Zoom out"
              >
                <Minus size={16} className="text-bronze" />
              </button>
              <input
                type="range"
                min="25"
                max="200"
                step="25"
                value={previewZoom * 100}
                onChange={(e) => setPreviewZoom(Number(e.target.value) / 100)}
                className="w-24 accent-primary"
              />
              <span className="text-xs font-mono text-bronze-text w-12 text-center">{Math.round(previewZoom * 100)}%</span>
              <button
                onClick={() => setPreviewZoom(Math.min(2, previewZoom + 0.25))}
                className="w-7 h-7 flex items-center justify-center rounded bg-cream-dark/10 hover:bg-cream-dark/20 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                disabled={previewZoom >= 2}
                aria-label="Zoom in"
              >
                <Plus size={16} className="text-bronze" />
              </button>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={handleDownload}
            disabled={photoCount === 0 || isGenerating}
            className="flex-1 sm:flex-auto flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-white px-6 py-3 rounded-lg font-bold shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
          >
            <Download size={20} />
            {t('printSheet.idPrint.preview.download')}
          </button>
          <button
            onClick={handleSaveToGallery}
            disabled={photoCount === 0 || isGenerating || isSaving}
            className="flex-1 sm:flex-auto flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-white px-6 py-3 rounded-lg font-bold shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
          >
            <FolderHeart size={20} />
            {isSaving ? t('gallery.loading') : t('printSheet.idPrint.preview.saveToGallery')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default LayoutPreview;

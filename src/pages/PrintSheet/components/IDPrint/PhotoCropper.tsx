import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import ReactCrop, { type Crop, type PixelCrop, centerCrop, makeAspectCrop } from 'react-image-crop';
import { CropArea, PhotoSize } from '../../types/idPrint';
import { PHOTO_DIMENSIONS_MM } from '../../utils/IDPrint/constants';
import { getCroppedImg } from '../../utils/IDPrint/canvasUtils';
import { Check, X } from 'lucide-react';

interface PhotoCropperProps {
  imageSrc: string;
  targetSize: PhotoSize;
  onCancel: () => void;
  onComplete: (croppedImage: string) => void;
}

// Helper to center the crop initially
function centerAspectCrop(
  mediaWidth: number,
  mediaHeight: number,
  aspect: number,
) {
  return centerCrop(
    makeAspectCrop(
      {
        unit: '%',
        width: 80,
      },
      aspect,
      mediaWidth,
      mediaHeight,
    ),
    mediaWidth,
    mediaHeight,
  )
}

const PhotoCropper: React.FC<PhotoCropperProps> = ({
  imageSrc,
  targetSize,
  onCancel,
  onComplete,
}) => {
  const { t } = useTranslation();
  const imgRef = useRef<HTMLImageElement>(null);
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [isProcessing, setIsProcessing] = useState(false);

  const dims = PHOTO_DIMENSIONS_MM[targetSize];
  const aspect = dims.width / dims.height;

  useEffect(() => {
    if (imgRef.current && completedCrop) {
      const { width, height } = imgRef.current;
      const newCrop = centerAspectCrop(width, height, aspect);
      setCrop(newCrop);
    }
  }, [aspect]);

  function onImageLoad(e: React.SyntheticEvent<HTMLImageElement>) {
    const { width, height } = e.currentTarget;
    const initialCrop = centerAspectCrop(width, height, aspect);
    setCrop(initialCrop);
  }

  const handleDone = async () => {
    if (!completedCrop || !imgRef.current) return;

    try {
      setIsProcessing(true);

      const image = imgRef.current;
      const scaleX = image.naturalWidth / image.width;
      const scaleY = image.naturalHeight / image.height;

      const finalCrop: CropArea = {
        x: completedCrop.x * scaleX,
        y: completedCrop.y * scaleY,
        width: completedCrop.width * scaleX,
        height: completedCrop.height * scaleY
      };

      const croppedImage = await getCroppedImg(imageSrc, finalCrop);
      onComplete(croppedImage);
    } catch (e) {
      console.error(e);
      alert('Error cropping image');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex flex-col h-full w-full bg-slate-900 rounded-xl overflow-hidden shadow-2xl">
      <div className="relative flex-1 bg-black overflow-auto flex items-center justify-center p-4">
        <ReactCrop
          crop={crop}
          onChange={(_, percentCrop) => setCrop(percentCrop)}
          onComplete={(c) => setCompletedCrop(c)}
          aspect={aspect}
          className="max-h-full"
        >
          <img
            ref={imgRef}
            alt="Crop me"
            src={imageSrc}
            onLoad={onImageLoad}
            className="max-h-[50vh] max-w-full object-contain"
          />
        </ReactCrop>
      </div>

      <div className="bg-white p-4 space-y-4">
        <div className="flex justify-between items-center">
          <button
            onClick={onCancel}
            className="flex items-center gap-2 px-4 py-2 text-bronze-text/70 hover:text-bronze font-medium transition-colors"
          >
            <X size={20} /> {t('printSheet.idPrint.cropper.cancel')}
          </button>

          <div className="text-center hidden sm:block">
            <div className="text-sm text-bronze font-bold">
              {dims.label}
            </div>
            <p className="text-xs text-bronze-text/60">{t('printSheet.idPrint.cropper.dragHint')}</p>
          </div>

          <button
            onClick={handleDone}
            disabled={isProcessing}
            className="flex items-center gap-2 px-6 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg font-semibold shadow-md transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isProcessing ? t('printSheet.idPrint.cropper.processing') : (
              <>
                <Check size={20} /> {t('printSheet.idPrint.cropper.done')}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PhotoCropper;

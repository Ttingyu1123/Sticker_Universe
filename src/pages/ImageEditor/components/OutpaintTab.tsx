import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Download, FolderOpen, Loader2, RefreshCw, Upload } from 'lucide-react';
import { GalleryPicker } from '../../../components/GalleryPicker';
import { loadGeminiApiKey } from '../../../shared/geminiApiKey';
import { generateImage } from '../../Generator/services/geminiService';
import { saveStickerToDB } from '../../../db';

const ratioPresets = [
  { label: '1:1', width: 1024, height: 1024 },
  { label: '4:3', width: 1200, height: 900 },
  { label: '3:4', width: 900, height: 1200 },
  { label: '16:9', width: 1280, height: 720 },
  { label: '9:16', width: 720, height: 1280 }
] as const;

const gcd = (a: number, b: number): number => {
  let x = Math.abs(Math.round(a));
  let y = Math.abs(Math.round(b));
  while (y !== 0) {
    const t = y;
    y = x % y;
    x = t;
  }
  return x || 1;
};

type FixedMode = 'width' | 'height';
type Quality = '1K' | '2K' | '4K';
type EditTool = 'select' | 'protect';

type Rect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const normalizeRect = (rect: Rect): Rect => {
  const x = rect.width < 0 ? rect.x + rect.width : rect.x;
  const y = rect.height < 0 ? rect.y + rect.height : rect.y;
  const width = Math.abs(rect.width);
  const height = Math.abs(rect.height);
  return { x, y, width, height };
};

const OutpaintTab: React.FC = () => {
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const interactionRef = useRef<{
    type: 'drag' | 'resize';
    startClientX: number;
    startClientY: number;
    startX: number;
    startY: number;
    startScale: number;
  } | null>(null);
  const localInteractionRef = useRef<{
    mode: EditTool;
    startX: number;
    startY: number;
    lastX: number;
    lastY: number;
  } | null>(null);
  const maskCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const maskPreviewRef = useRef<HTMLCanvasElement>(null);

  const [showGallery, setShowGallery] = useState(false);
  const [sourceImage, setSourceImage] = useState<string | null>(null);
  const [sourceSize, setSourceSize] = useState({ width: 0, height: 0 });
  const [customSize, setCustomSize] = useState({ width: ratioPresets[0].width, height: ratioPresets[0].height });
  const [lockAspectRatio, setLockAspectRatio] = useState(true);
  const [fixedMode, setFixedMode] = useState<FixedMode>('width');
  const [fixedPx, setFixedPx] = useState(1024);
  const [quality, setQuality] = useState<Quality>('1K');

  const [x, setX] = useState(0);
  const [y, setY] = useState(0);
  const [scale, setScale] = useState(100);
  const [prompt, setPrompt] = useState('');
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [baseResultImage, setBaseResultImage] = useState<string | null>(null);
  const [resultSize, setResultSize] = useState<{ width: number; height: number } | null>(null);
  const [modelRawSize, setModelRawSize] = useState<{ width: number; height: number } | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLocalGenerating, setIsLocalGenerating] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [editTool, setEditTool] = useState<EditTool>('select');
  const [selectionRect, setSelectionRect] = useState<Rect | null>(null);
  const [localPrompt, setLocalPrompt] = useState('');
  const [protectBrushSize, setProtectBrushSize] = useState(28);

  const outputSize = useMemo(
    () => ({
      width: Math.max(64, Math.round(customSize.width || 1024)),
      height: Math.max(64, Math.round(customSize.height || 1024))
    }),
    [customSize]
  );

  const aspectRatio = useMemo(() => {
    const d = gcd(outputSize.width, outputSize.height);
    return `${Math.round(outputSize.width / d)}:${Math.round(outputSize.height / d)}`;
  }, [outputSize.width, outputSize.height]);

  const clearGenerated = () => {
    setResultImage(null);
    setBaseResultImage(null);
    setResultSize(null);
    setModelRawSize(null);
    setSelectionRect(null);
    clearProtectMask();
  };

  const handleResetImage = () => {
    setSourceImage(null);
    setSourceSize({ width: 0, height: 0 });
    setX(0);
    setY(0);
    setScale(100);
    setPrompt('');
    setLocalPrompt('');
    setErrorMessage('');
    setEditTool('select');
    clearGenerated();
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const redrawMaskPreview = () => {
    const preview = maskPreviewRef.current;
    const mask = maskCanvasRef.current;
    if (!preview || !mask) return;
    const pctx = preview.getContext('2d');
    if (!pctx) return;

    pctx.clearRect(0, 0, preview.width, preview.height);
    pctx.globalAlpha = 0.38;
    pctx.drawImage(mask, 0, 0, preview.width, preview.height);
    pctx.globalCompositeOperation = 'source-in';
    pctx.fillStyle = '#ef4444';
    pctx.fillRect(0, 0, preview.width, preview.height);
    pctx.globalCompositeOperation = 'source-over';
    pctx.globalAlpha = 1;
  };

  const clearProtectMask = () => {
    const mask = maskCanvasRef.current;
    if (!mask) return;
    const maskCtx = mask.getContext('2d');
    if (maskCtx) {
      maskCtx.clearRect(0, 0, mask.width, mask.height);
    }
    redrawMaskPreview();
  };

  useEffect(() => {
    const mask = document.createElement('canvas');
    mask.width = outputSize.width;
    mask.height = outputSize.height;
    maskCanvasRef.current = mask;

    const preview = maskPreviewRef.current;
    if (preview) {
      preview.width = outputSize.width;
      preview.height = outputSize.height;
    }
    redrawMaskPreview();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [outputSize.width, outputSize.height]);

  useEffect(() => {
    redrawMaskPreview();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resultImage]);

  const clampScale = (value: number) => Math.max(30, Math.min(160, value));

  const applyFixedPx = (pxValue: number, mode: FixedMode) => {
    const safePx = Math.max(64, Math.round(pxValue || 64));
    const ratio = outputSize.width / outputSize.height || 1;

    if (mode === 'width') {
      const nextWidth = safePx;
      const nextHeight = Math.max(64, Math.round(nextWidth / ratio));
      setCustomSize({ width: nextWidth, height: nextHeight });
    } else {
      const nextHeight = safePx;
      const nextWidth = Math.max(64, Math.round(nextHeight * ratio));
      setCustomSize({ width: nextWidth, height: nextHeight });
    }
    clearGenerated();
  };

  const swapWidthHeight = () => {
    setCustomSize((prev) => ({ width: prev.height, height: prev.width }));
    clearGenerated();
  };

  const getCanvasToViewScale = () => {
    const stage = stageRef.current;
    if (!stage) return 1;
    const rect = stage.getBoundingClientRect();
    if (!rect.width) return 1;
    return outputSize.width / rect.width;
  };

  const eventToCanvasPoint = (clientX: number, clientY: number) => {
    const stage = stageRef.current;
    if (!stage) return null;
    const rect = stage.getBoundingClientRect();
    if (!rect.width || !rect.height) return null;

    return {
      x: clamp(Math.round(((clientX - rect.left) / rect.width) * outputSize.width), 0, outputSize.width),
      y: clamp(Math.round(((clientY - rect.top) / rect.height) * outputSize.height), 0, outputSize.height)
    };
  };

  const loadSourceDataUrl = (dataUrl: string) => {
    const img = new Image();
    img.onload = () => {
      setSourceImage(dataUrl);
      setSourceSize({ width: img.width, height: img.height });
      setX(Math.round((outputSize.width - img.width) / 2));
      setY(Math.round((outputSize.height - img.height) / 2));
      setScale(100);
      clearGenerated();
      setErrorMessage('');
    };
    img.src = dataUrl;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => loadSourceDataUrl(String(reader.result || ''));
    reader.readAsDataURL(file);
  };

  const handleGallerySelect = (blobs: Blob[]) => {
    if (!blobs.length) return;
    const reader = new FileReader();
    reader.onload = () => loadSourceDataUrl(String(reader.result || ''));
    reader.readAsDataURL(blobs[0]);
    setShowGallery(false);
  };

  const createPlacedImageDataUrl = async () => {
    if (!sourceImage) return null;
    const img = new Image();
    img.src = sourceImage;
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
    });

    const canvas = document.createElement('canvas');
    canvas.width = outputSize.width;
    canvas.height = outputSize.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const drawW = Math.round((img.width * scale) / 100);
    const drawH = Math.round((img.height * scale) / 100);
    ctx.drawImage(img, x, y, drawW, drawH);

    return canvas.toDataURL('image/jpeg', 0.95);
  };

  const getImageDimensions = async (dataUrl: string): Promise<{ width: number; height: number }> => {
    const img = new Image();
    img.src = dataUrl;
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
    });
    return { width: img.width, height: img.height };
  };

  const normalizeToOutputSize = async (dataUrl: string): Promise<string> => {
    const img = new Image();
    img.src = dataUrl;
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
    });

    const canvas = document.createElement('canvas');
    canvas.width = outputSize.width;
    canvas.height = outputSize.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return dataUrl;

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/png');
  };

  const handleGenerate = async () => {
    if (!sourceImage) return;
    const apiKeyState = loadGeminiApiKey();
    if (!apiKeyState?.key) {
      setErrorMessage(t('generator.apiKey.invalid', { defaultValue: '請先設定 API Key' }));
      return;
    }

    setIsGenerating(true);
    setErrorMessage('');

    try {
      const baseImage = await createPlacedImageDataUrl();
      if (!baseImage) throw new Error('Failed to prepare source image.');

      const instruction = [
        'Expand and complete the background around the existing subject while preserving identity and style.',
        'Do not deform the existing subject.',
        'Fill all remaining space naturally and seamlessly.',
        'No text, no watermark.',
        prompt?.trim() ? `Additional direction: ${prompt.trim()}` : ''
      ].filter(Boolean).join('\n');

      const generated = await generateImage(
        apiKeyState.key,
        instruction,
        baseImage,
        aspectRatio,
        'gemini-3-pro-image-preview',
        quality
      );
      const rawSize = await getImageDimensions(generated);
      const normalized = await normalizeToOutputSize(generated);
      const finalSize = await getImageDimensions(normalized);

      setModelRawSize(rawSize);
      setResultSize(finalSize);
      setResultImage(normalized);
      setBaseResultImage(normalized);
      setSelectionRect(null);
      clearProtectMask();

      // Auto-import generated result to gallery to avoid accidental loss.
      try {
        await saveStickerToDB({
          id: crypto.randomUUID(),
          imageUrl: normalized,
          timestamp: Date.now(),
          phrase: prompt?.trim() ? `AI Expand: ${prompt.trim().slice(0, 80)}` : 'AI Expand Background'
        });
      } catch (error) {
        console.error('Auto-save after outpaint generation failed', error);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Generate failed';
      setErrorMessage(message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = async () => {
    if (!resultImage) return;
    try {
      await saveStickerToDB({
        id: crypto.randomUUID(),
        imageUrl: resultImage,
        timestamp: Date.now(),
        phrase: 'AI Expand Background'
      });
    } catch (error) {
      console.error('Auto-save on download failed', error);
    }

    const link = document.createElement('a');
    link.href = resultImage;
    link.download = `outpaint_${Date.now()}.png`;
    link.click();
  };

  const drawMaskStroke = (from: { x: number; y: number }, to: { x: number; y: number }) => {
    const mask = maskCanvasRef.current;
    if (!mask) return;
    const ctx = mask.getContext('2d');
    if (!ctx) return;
    ctx.strokeStyle = 'rgba(255,255,255,1)';
    ctx.lineWidth = protectBrushSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(to.x, to.y);
    ctx.stroke();
  };

  const mergeSelectedRegion = async (baseImage: string, generatedImage: string, rect: Rect): Promise<string> => {
    const baseImg = new Image();
    const genImg = new Image();
    baseImg.src = baseImage;
    genImg.src = generatedImage;
    await Promise.all([
      new Promise((resolve, reject) => {
        baseImg.onload = resolve;
        baseImg.onerror = reject;
      }),
      new Promise((resolve, reject) => {
        genImg.onload = resolve;
        genImg.onerror = reject;
      })
    ]);

    const canvas = document.createElement('canvas');
    canvas.width = outputSize.width;
    canvas.height = outputSize.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return baseImage;
    ctx.drawImage(baseImg, 0, 0, outputSize.width, outputSize.height);
    const baseData = ctx.getImageData(0, 0, outputSize.width, outputSize.height);

    const genCanvas = document.createElement('canvas');
    genCanvas.width = outputSize.width;
    genCanvas.height = outputSize.height;
    const genCtx = genCanvas.getContext('2d');
    if (!genCtx) return baseImage;
    genCtx.drawImage(genImg, 0, 0, outputSize.width, outputSize.height);
    const genData = genCtx.getImageData(0, 0, outputSize.width, outputSize.height);

    const mask = maskCanvasRef.current;
    let maskData: ImageData | null = null;
    if (mask) {
      const mctx = mask.getContext('2d');
      if (mctx) {
        maskData = mctx.getImageData(0, 0, outputSize.width, outputSize.height);
      }
    }

    const safe = normalizeRect(rect);
    const startX = clamp(Math.round(safe.x), 0, outputSize.width);
    const startY = clamp(Math.round(safe.y), 0, outputSize.height);
    const endX = clamp(Math.round(safe.x + safe.width), 0, outputSize.width);
    const endY = clamp(Math.round(safe.y + safe.height), 0, outputSize.height);

    for (let py = startY; py < endY; py += 1) {
      for (let px = startX; px < endX; px += 1) {
        const idx = (py * outputSize.width + px) * 4;
        const protectedAlpha = maskData ? maskData.data[idx + 3] : 0;
        if (protectedAlpha > 0) continue;
        baseData.data[idx] = genData.data[idx];
        baseData.data[idx + 1] = genData.data[idx + 1];
        baseData.data[idx + 2] = genData.data[idx + 2];
        baseData.data[idx + 3] = genData.data[idx + 3];
      }
    }

    ctx.putImageData(baseData, 0, 0);
    return canvas.toDataURL('image/png');
  };

  const handleLocalRegenerate = async () => {
    if (!resultImage) return;
    const apiKeyState = loadGeminiApiKey();
    if (!apiKeyState?.key) {
      setErrorMessage(t('generator.apiKey.invalid', { defaultValue: '請先設定 API Key' }));
      return;
    }
    if (!selectionRect || Math.abs(selectionRect.width) < 8 || Math.abs(selectionRect.height) < 8) {
      setErrorMessage(t('editor.outpaint.localNeedSelection', { defaultValue: '請先框選要局部重生成的區域。' }));
      return;
    }

    const originalForEdit = baseResultImage || resultImage;
    setIsLocalGenerating(true);
    setErrorMessage('');
    const safe = normalizeRect(selectionRect);
    const rectInfo = `Selected region: x=${Math.round(safe.x)}, y=${Math.round(safe.y)}, w=${Math.round(safe.width)}, h=${Math.round(safe.height)}.`;

    try {
      const instruction = [
        'You are editing an existing image.',
        'Change ONLY the selected region while preserving the rest of the image.',
        'Blend naturally with surrounding pixels.',
        'No text, no watermark.',
        rectInfo,
        localPrompt?.trim() ? `Edit request: ${localPrompt.trim()}` : 'Edit request: improve visual details in this selected region.'
      ].join('\n');

      const generated = await generateImage(
        apiKeyState.key,
        instruction,
        originalForEdit,
        aspectRatio,
        'gemini-3-pro-image-preview',
        quality
      );

      const normalized = await normalizeToOutputSize(generated);
      const merged = await mergeSelectedRegion(originalForEdit, normalized, safe);
      const finalSize = await getImageDimensions(merged);
      setResultImage(merged);
      setResultSize(finalSize);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Local regenerate failed';
      setErrorMessage(message);
    } finally {
      setIsLocalGenerating(false);
    }
  };

  const handlePointerDownDrag = (e: React.PointerEvent<HTMLImageElement>) => {
    if (!sourceImage || !!resultImage) return;
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    interactionRef.current = {
      type: 'drag',
      startClientX: e.clientX,
      startClientY: e.clientY,
      startX: x,
      startY: y,
      startScale: scale
    };
  };

  const handlePointerDownResize = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (!sourceImage || !!resultImage) return;
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    interactionRef.current = {
      type: 'resize',
      startClientX: e.clientX,
      startClientY: e.clientY,
      startX: x,
      startY: y,
      startScale: scale
    };
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const current = interactionRef.current;
    if (!current || !sourceImage || sourceSize.width <= 0 || !!resultImage) return;

    const factor = getCanvasToViewScale();
    const dx = (e.clientX - current.startClientX) * factor;
    const dy = (e.clientY - current.startClientY) * factor;

    if (current.type === 'drag') {
      setX(Math.round(current.startX + dx));
      setY(Math.round(current.startY + dy));
      clearGenerated();
      return;
    }

    const initialWidth = (sourceSize.width * current.startScale) / 100;
    const nextWidth = Math.max(1, initialWidth + dx);
    const nextScale = clampScale(Math.round((nextWidth / sourceSize.width) * 100));
    setScale(nextScale);
    clearGenerated();
  };

  const handlePointerUp = () => {
    interactionRef.current = null;
  };

  const handleResultPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!resultImage) return;
    const point = eventToCanvasPoint(e.clientX, e.clientY);
    if (!point) return;

    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    localInteractionRef.current = {
      mode: editTool,
      startX: point.x,
      startY: point.y,
      lastX: point.x,
      lastY: point.y
    };

    if (editTool === 'select') {
      setSelectionRect({ x: point.x, y: point.y, width: 0, height: 0 });
    } else {
      drawMaskStroke(point, point);
      redrawMaskPreview();
    }
  };

  const handleResultPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const current = localInteractionRef.current;
    if (!current) return;
    const point = eventToCanvasPoint(e.clientX, e.clientY);
    if (!point) return;

    if (current.mode === 'select') {
      setSelectionRect({
        x: current.startX,
        y: current.startY,
        width: point.x - current.startX,
        height: point.y - current.startY
      });
      return;
    }

    drawMaskStroke({ x: current.lastX, y: current.lastY }, point);
    current.lastX = point.x;
    current.lastY = point.y;
    redrawMaskPreview();
  };

  const handleResultPointerUp = () => {
    localInteractionRef.current = null;
  };

  const drawWidth = (sourceSize.width * scale) / 100;
  const drawHeight = (sourceSize.height * scale) / 100;
  const safeSelection = selectionRect ? normalizeRect(selectionRect) : null;

  return (
    <div className="h-full min-h-0 grid grid-cols-1 lg:grid-cols-3 gap-4 p-4 md:p-6 overflow-hidden">
      <div className="lg:col-span-1 min-h-0 rounded-2xl border border-cream-dark bg-white p-4 md:p-5 space-y-4 overflow-y-auto">
        <h3 className="text-lg font-black text-bronze-text">{t('editor.outpaint.title', { defaultValue: 'AI 擴張圖片' })}</h3>

        {!sourceImage && (
          <div className="space-y-3">
            <button onClick={() => fileInputRef.current?.click()} className="w-full rounded-xl border-2 border-dashed border-cream-dark p-5 text-bronze-light hover:text-primary hover:border-primary/50 transition-all flex items-center justify-center gap-2">
              <Upload size={18} />
              {t('editor.outpaint.upload', { defaultValue: '上傳圖片' })}
            </button>
            <button onClick={() => setShowGallery(true)} className="w-full rounded-xl border border-cream-dark bg-white hover:bg-cream-light px-4 py-3 text-bronze-text font-bold flex items-center justify-center gap-2">
              <FolderOpen size={18} />
              {t('app.selectFromGallery', { defaultValue: '從作品集選取' })}
            </button>
          </div>
        )}

        {sourceImage && (
          <>
            <div className="text-xs text-bronze-light">{t('editor.outpaint.source', { defaultValue: '來源尺寸' })}: {sourceSize.width} x {sourceSize.height}</div>
            <button
              type="button"
              onClick={handleResetImage}
              className="w-full rounded-lg border border-cream-dark bg-white hover:bg-cream-light px-3 py-2 text-xs font-bold text-bronze-text inline-flex items-center justify-center gap-2"
            >
              <RefreshCw size={14} />
              {t('common.reset', { defaultValue: '重置圖片' })}
            </button>

            <div className="space-y-2">
              <label className="text-xs font-bold text-bronze-light uppercase">{t('editor.outpaint.canvas', { defaultValue: '輸出比例' })}</label>
              <div className="grid grid-cols-3 gap-2">
                {ratioPresets.map((item) => (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => {
                      setCustomSize({ width: item.width, height: item.height });
                      clearGenerated();
                    }}
                    className={`rounded-lg border px-2 py-2 text-xs font-bold transition-all ${outputSize.width === item.width && outputSize.height === item.height ? 'bg-primary text-white border-primary' : 'bg-white text-bronze-text border-cream-dark hover:border-primary/50'}`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-bronze-light uppercase">{t('editor.outpaint.sizeControl', { defaultValue: '尺寸控制' })}</label>

              <button
                type="button"
                onClick={() => {
                  setLockAspectRatio((prev) => !prev);
                  clearGenerated();
                }}
                className={`w-full rounded-lg border px-3 py-2 text-xs font-bold transition-all ${lockAspectRatio ? 'bg-primary/10 text-primary border-primary/30' : 'bg-white text-bronze-text border-cream-dark'}`}
              >
                {lockAspectRatio ? t('editor.outpaint.lockAspectOn', { defaultValue: '鎖定比例：開' }) : t('editor.outpaint.lockAspectOff', { defaultValue: '鎖定比例：關' })}
              </button>

              {lockAspectRatio && (
                <>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setFixedMode('width');
                        applyFixedPx(fixedPx, 'width');
                      }}
                      className={`rounded-lg border px-2 py-2 text-xs font-bold transition-all ${fixedMode === 'width' ? 'bg-primary text-white border-primary' : 'bg-white text-bronze-text border-cream-dark hover:border-primary/50'}`}
                    >
                      {t('editor.outpaint.fixedWidth', { defaultValue: '固定寬' })}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setFixedMode('height');
                        applyFixedPx(fixedPx, 'height');
                      }}
                      className={`rounded-lg border px-2 py-2 text-xs font-bold transition-all ${fixedMode === 'height' ? 'bg-primary text-white border-primary' : 'bg-white text-bronze-text border-cream-dark hover:border-primary/50'}`}
                    >
                      {t('editor.outpaint.fixedHeight', { defaultValue: '固定高' })}
                    </button>
                  </div>

                  <div className="grid grid-cols-[1fr_auto] gap-2 items-end">
                    <label className="text-xs block">
                      <div className="mb-1 text-bronze-light">{t('editor.outpaint.fixedPx', { defaultValue: '固定像素' })}</div>
                      <input
                        type="number"
                        min={64}
                        value={fixedPx}
                        onChange={(e) => {
                          const next = Math.max(64, Number(e.target.value) || 64);
                          setFixedPx(next);
                          applyFixedPx(next, fixedMode);
                        }}
                        className="w-full rounded-lg border border-cream-dark px-3 py-2 text-sm"
                      />
                    </label>
                    <button
                      type="button"
                      onClick={swapWidthHeight}
                      className="rounded-lg border border-cream-dark bg-white hover:bg-cream-light px-3 py-2 text-xs font-bold text-bronze-text flex items-center gap-1"
                      title={t('editor.outpaint.swap', { defaultValue: '交換寬高' })}
                    >
                      <RefreshCw size={14} />
                      {t('editor.outpaint.swap', { defaultValue: '交換寬高' })}
                    </button>
                  </div>
                </>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <label className="text-xs">
                <div className="mb-1 text-bronze-light">{t('editor.outpaint.offsetX', { defaultValue: '水平位置 X' })}</div>
                <input type="number" value={x} onChange={(e) => { setX(Number(e.target.value)); clearGenerated(); }} className="w-full rounded-lg border border-cream-dark px-3 py-2 text-sm" />
              </label>
              <label className="text-xs">
                <div className="mb-1 text-bronze-light">{t('editor.outpaint.offsetY', { defaultValue: '垂直位置 Y' })}</div>
                <input type="number" value={y} onChange={(e) => { setY(Number(e.target.value)); clearGenerated(); }} className="w-full rounded-lg border border-cream-dark px-3 py-2 text-sm" />
              </label>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <label className="text-xs">
                <div className="mb-1 text-bronze-light">{t('editor.outpaint.width', { defaultValue: '輸出寬度' })}</div>
                <input
                  type="number"
                  min={64}
                  value={outputSize.width}
                  onChange={(e) => {
                    const nextWidth = Math.max(64, Number(e.target.value) || outputSize.width);
                    if (lockAspectRatio) {
                      const ratio = outputSize.width / outputSize.height || 1;
                      const nextHeight = Math.max(64, Math.round(nextWidth / ratio));
                      setCustomSize({ width: nextWidth, height: nextHeight });
                    } else {
                      setCustomSize((prev) => ({ ...prev, width: nextWidth }));
                    }
                    clearGenerated();
                  }}
                  className="w-full rounded-lg border border-cream-dark px-3 py-2 text-sm"
                />
              </label>
              <label className="text-xs">
                <div className="mb-1 text-bronze-light">{t('editor.outpaint.height', { defaultValue: '輸出高度' })}</div>
                <input
                  type="number"
                  min={64}
                  value={outputSize.height}
                  onChange={(e) => {
                    const nextHeight = Math.max(64, Number(e.target.value) || outputSize.height);
                    if (lockAspectRatio) {
                      const ratio = outputSize.width / outputSize.height || 1;
                      const nextWidth = Math.max(64, Math.round(nextHeight * ratio));
                      setCustomSize({ width: nextWidth, height: nextHeight });
                    } else {
                      setCustomSize((prev) => ({ ...prev, height: nextHeight }));
                    }
                    clearGenerated();
                  }}
                  className="w-full rounded-lg border border-cream-dark px-3 py-2 text-sm"
                />
              </label>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-bronze-light uppercase">{t('editor.outpaint.quality', { defaultValue: '輸出品質' })}</label>
              <div className="grid grid-cols-3 gap-2">
                {(['1K', '2K', '4K'] as const).map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => {
                      setQuality(q);
                      clearGenerated();
                    }}
                    className={`rounded-lg border px-2 py-2 text-xs font-bold transition-all ${quality === q ? 'bg-primary text-white border-primary' : 'bg-white text-bronze-text border-cream-dark hover:border-primary/50'}`}
                  >
                    {q}
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-bronze-light">
                {t('editor.outpaint.qualityHint', { defaultValue: '最大邊長參考：1K≈1024px、2K≈2048px、4K≈4096px（實際依模型回傳為準）。' })}
              </p>
            </div>

            <div className="text-[11px] text-bronze-light bg-cream-light border border-cream-dark rounded-lg px-3 py-2">
              {t('editor.outpaint.targetSize', { defaultValue: '目標輸出尺寸' })}: {outputSize.width} x {outputSize.height} px · {t('editor.outpaint.aspect', { defaultValue: '比例' })}: {aspectRatio}
              {modelRawSize ? <><br />{t('editor.outpaint.modelRawSize', { defaultValue: '模型原始回傳尺寸' })}: {modelRawSize.width} x {modelRawSize.height} px</> : null}
              {resultSize ? <><br />{t('editor.outpaint.finalSize', { defaultValue: '最終輸出尺寸' })}: {resultSize.width} x {resultSize.height} px</> : null}
            </div>

            {!resultImage && (
              <>
                <label className="text-xs block">
                  <div className="mb-1 text-bronze-light">{t('editor.outpaint.scale', { defaultValue: '主圖縮放' })}: {scale}%</div>
                  <input type="range" min={30} max={160} value={scale} onChange={(e) => { setScale(Number(e.target.value)); clearGenerated(); }} className="w-full" />
                </label>

                <label className="text-xs block">
                  <div className="mb-1 text-bronze-light">{t('editor.outpaint.prompt', { defaultValue: '補景提示詞（可選）' })}</div>
                  <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} rows={3} className="w-full rounded-lg border border-cream-dark px-3 py-2 text-sm" placeholder={t('editor.outpaint.promptHint', { defaultValue: '例如：延伸成古風庭院、柔和自然光' })} />
                </label>
              </>
            )}

            <div className="grid grid-cols-1 gap-2">
              {!resultImage && (
                <button onClick={handleGenerate} disabled={isGenerating} className="w-full rounded-xl bg-primary hover:bg-primary-hover text-white font-bold px-4 py-2.5 flex items-center justify-center gap-2 disabled:opacity-60">
                  {isGenerating ? <Loader2 size={16} className="animate-spin" /> : null}
                  {isGenerating ? t('generator.action.generating', { defaultValue: '生成中...' }) : t('generator.action.generate', { defaultValue: '生成' })}
                </button>
              )}

              {resultImage && (
                <button onClick={handleDownload} className="w-full rounded-xl bg-secondary/15 hover:bg-secondary/25 text-secondary font-bold px-4 py-2.5 flex items-center justify-center gap-2">
                  <Download size={16} />
                  {t('editor.outpaint.download', { defaultValue: '下載（自動匯入作品集）' })}
                </button>
              )}
            </div>

            {errorMessage && <div className="text-xs text-red-500 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{errorMessage}</div>}
          </>
        )}

        <input ref={fileInputRef} className="hidden" type="file" accept="image/*" onChange={handleFileChange} />
      </div>

      <div className="lg:col-span-2 min-h-0 overflow-auto rounded-2xl border border-cream-dark bg-slate-100/50 p-4 md:p-5 flex items-center justify-center">
        {!resultImage && !sourceImage && <div className="text-sm text-slate-500">{t('editor.outpaint.empty', { defaultValue: '請先上傳圖片，或從作品集選取' })}</div>}

        {!resultImage && !!sourceImage && (
          <div
            ref={stageRef}
            className="relative w-full max-w-[920px] max-h-[70vh] rounded-lg shadow-lg overflow-hidden border border-slate-300 bg-white touch-none select-none"
            style={{ aspectRatio: `${outputSize.width} / ${outputSize.height}` }}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            onPointerLeave={handlePointerUp}
          >
            <img
              src={sourceImage}
              alt="source-preview"
              className="absolute cursor-move"
              style={{
                left: `${(x / outputSize.width) * 100}%`,
                top: `${(y / outputSize.height) * 100}%`,
                width: `${(drawWidth / outputSize.width) * 100}%`,
                height: 'auto',
                maxWidth: 'none'
              }}
              onPointerDown={handlePointerDownDrag}
            />

            <button
              type="button"
              className="absolute w-5 h-5 rounded-full bg-primary border-2 border-white shadow-md cursor-nwse-resize"
              style={{
                left: `${((x + drawWidth) / outputSize.width) * 100}%`,
                top: `${((y + drawHeight) / outputSize.height) * 100}%`,
                transform: 'translate(-50%, -50%)'
              }}
              onPointerDown={handlePointerDownResize}
              title={t('editor.outpaint.scale', { defaultValue: '縮放' })}
            />
          </div>
        )}

        {!!resultImage && (
          <div
            ref={stageRef}
            className="relative w-full max-w-[920px] max-h-[70vh] rounded-lg shadow-lg overflow-hidden border border-slate-300 bg-white touch-none select-none"
            style={{ aspectRatio: `${outputSize.width} / ${outputSize.height}` }}
          >
            <img src={resultImage} alt="outpaint-result" className="absolute inset-0 w-full h-full object-cover" />
          </div>
        )}
      </div>

      {showGallery && <GalleryPicker onSelect={handleGallerySelect} onClose={() => setShowGallery(false)} />}
    </div>
  );
};

export default OutpaintTab;

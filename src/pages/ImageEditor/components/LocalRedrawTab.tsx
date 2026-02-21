import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Download, Eraser, FolderOpen, Loader2, RefreshCw, Sparkles, SquareDashed, Upload, Wand2 } from 'lucide-react';
import { GalleryPicker } from '../../../components/GalleryPicker';
import { loadGeminiApiKey } from '../../../shared/geminiApiKey';
import { generateImage } from '../../Generator/services/geminiService';
import { saveStickerToDB } from '../../../db';

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

const expandRect = (rect: Rect, ratio: number, maxWidth: number, maxHeight: number): Rect => {
  const safe = normalizeRect(rect);
  const growX = Math.round(safe.width * ratio * 0.5);
  const growY = Math.round(safe.height * ratio * 0.5);
  const x = clamp(safe.x - growX, 0, maxWidth);
  const y = clamp(safe.y - growY, 0, maxHeight);
  const right = clamp(safe.x + safe.width + growX, 0, maxWidth);
  const bottom = clamp(safe.y + safe.height + growY, 0, maxHeight);
  return {
    x,
    y,
    width: Math.max(1, right - x),
    height: Math.max(1, bottom - y)
  };
};

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

const SUPPORTED_ASPECT_RATIOS = [
  '1:1', '1:4', '1:8', '2:3', '3:2', '3:4', '4:1', '4:3',
  '4:5', '5:4', '8:1', '9:16', '16:9', '21:9'
] as const;

const toAspectRatio = (width: number, height: number) => {
  if (width <= 0 || height <= 0) return '1:1';
  const target = width / height;
  let best = '1:1';
  let bestDiff = Number.POSITIVE_INFINITY;

  for (const candidate of SUPPORTED_ASPECT_RATIOS) {
    const [w, h] = candidate.split(':').map(Number);
    const ratio = w / h;
    const diff = Math.abs(Math.log(target / ratio));
    if (diff < bestDiff) {
      bestDiff = diff;
      best = candidate;
    }
  }

  return best;
};

const LocalRedrawTab: React.FC = () => {
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
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
  const [baseImage, setBaseImage] = useState<string | null>(null);
  const [workingImage, setWorkingImage] = useState<string | null>(null);
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  const [quality, setQuality] = useState<Quality>('1K');
  const [editTool, setEditTool] = useState<EditTool>('select');
  const [selectionRect, setSelectionRect] = useState<Rect | null>(null);
  const [prompt, setPrompt] = useState('');
  const [autoExpandSelection, setAutoExpandSelection] = useState(true);
  const [protectBrushSize, setProtectBrushSize] = useState(28);
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const safeSelection = selectionRect ? normalizeRect(selectionRect) : null;

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
    mask.width = imageSize.width || 1;
    mask.height = imageSize.height || 1;
    maskCanvasRef.current = mask;

    const preview = maskPreviewRef.current;
    if (preview) {
      preview.width = imageSize.width || 1;
      preview.height = imageSize.height || 1;
    }
    redrawMaskPreview();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imageSize.width, imageSize.height]);

  const eventToCanvasPoint = (clientX: number, clientY: number) => {
    const stage = stageRef.current;
    if (!stage || imageSize.width <= 0 || imageSize.height <= 0) return null;
    const rect = stage.getBoundingClientRect();
    if (!rect.width || !rect.height) return null;
    return {
      x: clamp(Math.round(((clientX - rect.left) / rect.width) * imageSize.width), 0, imageSize.width),
      y: clamp(Math.round(((clientY - rect.top) / rect.height) * imageSize.height), 0, imageSize.height)
    };
  };

  const loadImageFromDataUrl = (dataUrl: string) => {
    const img = new Image();
    img.onload = () => {
      setBaseImage(dataUrl);
      setWorkingImage(dataUrl);
      setImageSize({ width: img.width, height: img.height });
      setSelectionRect(null);
      setPrompt('');
      setErrorMessage('');
      clearProtectMask();
    };
    img.src = dataUrl;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => loadImageFromDataUrl(String(reader.result || ''));
    reader.readAsDataURL(file);
  };

  const handleGallerySelect = (blobs: Blob[]) => {
    if (!blobs.length) return;
    const reader = new FileReader();
    reader.onload = () => loadImageFromDataUrl(String(reader.result || ''));
    reader.readAsDataURL(blobs[0]);
    setShowGallery(false);
  };

  const normalizeToSize = async (dataUrl: string, targetWidth: number, targetHeight: number): Promise<string> => {
    if (targetWidth <= 0 || targetHeight <= 0) return dataUrl;
    const img = new Image();
    img.src = dataUrl;
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
    });

    const canvas = document.createElement('canvas');
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return dataUrl;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/png');
  };

  const cropImageRegion = async (imageUrl: string, rect: Rect): Promise<string> => {
    const safe = normalizeRect(rect);
    const w = Math.max(1, Math.round(safe.width));
    const h = Math.max(1, Math.round(safe.height));
    const x = Math.max(0, Math.round(safe.x));
    const y = Math.max(0, Math.round(safe.y));

    const img = new Image();
    img.src = imageUrl;
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
    });

    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) return imageUrl;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, x, y, w, h, 0, 0, w, h);
    return canvas.toDataURL('image/png');
  };

  const mergeSelectedRegion = async (baseImageUrl: string, generatedImage: string, rect: Rect, blendPx = 16): Promise<string> => {
    const baseImg = new Image();
    const genImg = new Image();
    baseImg.src = baseImageUrl;
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
    canvas.width = imageSize.width;
    canvas.height = imageSize.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return baseImageUrl;
    ctx.drawImage(baseImg, 0, 0, imageSize.width, imageSize.height);
    const baseData = ctx.getImageData(0, 0, imageSize.width, imageSize.height);

    const genCanvas = document.createElement('canvas');
    genCanvas.width = imageSize.width;
    genCanvas.height = imageSize.height;
    const genCtx = genCanvas.getContext('2d');
    if (!genCtx) return baseImageUrl;
    genCtx.drawImage(genImg, 0, 0, imageSize.width, imageSize.height);
    const genData = genCtx.getImageData(0, 0, imageSize.width, imageSize.height);

    const mask = maskCanvasRef.current;
    let maskData: ImageData | null = null;
    if (mask) {
      const mctx = mask.getContext('2d');
      if (mctx) {
        maskData = mctx.getImageData(0, 0, imageSize.width, imageSize.height);
      }
    }

    const safe = normalizeRect(rect);
    const startX = clamp(Math.round(safe.x), 0, imageSize.width);
    const startY = clamp(Math.round(safe.y), 0, imageSize.height);
    const endX = clamp(Math.round(safe.x + safe.width), 0, imageSize.width);
    const endY = clamp(Math.round(safe.y + safe.height), 0, imageSize.height);
    const regionMinSide = Math.max(1, Math.min(endX - startX, endY - startY));
    const adaptiveBlendPx = Math.max(blendPx, Math.round(regionMinSide * 0.18));

    for (let py = startY; py < endY; py += 1) {
      for (let px = startX; px < endX; px += 1) {
        const idx = (py * imageSize.width + px) * 4;
        const protectedAlpha = maskData ? maskData.data[idx + 3] : 0;
        if (protectedAlpha > 0) continue;
        const distLeft = px - startX;
        const distRight = endX - 1 - px;
        const distTop = py - startY;
        const distBottom = endY - 1 - py;
        const minEdgeDist = Math.min(distLeft, distRight, distTop, distBottom);
        const edgeT = adaptiveBlendPx > 0 ? clamp(minEdgeDist / adaptiveBlendPx, 0, 1) : 1;
        const blendFactor = edgeT * edgeT * (3 - 2 * edgeT);

        baseData.data[idx] = Math.round(baseData.data[idx] * (1 - blendFactor) + genData.data[idx] * blendFactor);
        baseData.data[idx + 1] = Math.round(baseData.data[idx + 1] * (1 - blendFactor) + genData.data[idx + 1] * blendFactor);
        baseData.data[idx + 2] = Math.round(baseData.data[idx + 2] * (1 - blendFactor) + genData.data[idx + 2] * blendFactor);
        baseData.data[idx + 3] = Math.round(baseData.data[idx + 3] * (1 - blendFactor) + genData.data[idx + 3] * blendFactor);
      }
    }

    ctx.putImageData(baseData, 0, 0);
    return canvas.toDataURL('image/png');
  };

  const mergeGeneratedPatch = async (baseImageUrl: string, generatedPatch: string, rect: Rect, blendPx = 16): Promise<string> => {
    const safe = normalizeRect(rect);
    const normalizedPatch = await normalizeToSize(generatedPatch, Math.max(1, Math.round(safe.width)), Math.max(1, Math.round(safe.height)));

    const patchCanvas = document.createElement('canvas');
    patchCanvas.width = imageSize.width;
    patchCanvas.height = imageSize.height;
    const patchCtx = patchCanvas.getContext('2d');
    if (!patchCtx) return baseImageUrl;

    const patchImg = new Image();
    patchImg.src = normalizedPatch;
    await new Promise((resolve, reject) => {
      patchImg.onload = resolve;
      patchImg.onerror = reject;
    });

    patchCtx.drawImage(
      patchImg,
      0,
      0,
      patchImg.width,
      patchImg.height,
      Math.round(safe.x),
      Math.round(safe.y),
      Math.round(safe.width),
      Math.round(safe.height)
    );

    const fullPatch = patchCanvas.toDataURL('image/png');
    return mergeSelectedRegion(baseImageUrl, fullPatch, safe, blendPx);
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

  const handleResultPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!workingImage) return;
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

  const handleLocalRegenerate = async () => {
    if (!workingImage) return;
    const apiKeyState = loadGeminiApiKey();
    if (!apiKeyState?.key) {
      setErrorMessage(t('generator.apiKey.invalid', { defaultValue: '請先設定有效的 API Key。' }));
      return;
    }
    if (!selectionRect || Math.abs(selectionRect.width) < 8 || Math.abs(selectionRect.height) < 8) {
      setErrorMessage(t('editor.outpaint.localNeedSelection', { defaultValue: '請先框選要局部重生成的區域。' }));
      return;
    }

    setIsGenerating(true);
    setErrorMessage('');
    const selected = normalizeRect(selectionRect);
    const expanded = autoExpandSelection
      ? expandRect(selected, 0.2, imageSize.width, imageSize.height)
      : selected;
    const selectedInPatch = {
      x: Math.round(selected.x - expanded.x),
      y: Math.round(selected.y - expanded.y),
      width: Math.round(selected.width),
      height: Math.round(selected.height)
    };
    const patchAspect = toAspectRatio(Math.round(expanded.width), Math.round(expanded.height));
    const patchInput = await cropImageRegion(workingImage, expanded);
    const rectInfo = `Primary edit zone in this patch: x=${selectedInPatch.x}, y=${selectedInPatch.y}, w=${selectedInPatch.width}, h=${selectedInPatch.height}.`;

    try {
      const instruction = [
        'You are editing a cropped patch from a larger image.',
        'Preserve original context and texture continuity near patch borders.',
        'Main changes should happen inside the primary edit zone.',
        'No text, no watermark.',
        'Any newly added subject must be fully visible and fully contained inside the primary edit zone.',
        'Do not crop new subjects. Do not place important parts touching region borders.',
        'Keep at least ~8% visual margin from each side of the primary edit zone for newly added subjects.',
        'If adding an object, generate the complete object (not partial body parts).',
        rectInfo,
        prompt?.trim() ? `Edit request: ${prompt.trim()}` : 'Edit request: improve visual details in this selected region.'
      ].join('\n');

      const generated = await generateImage(
        apiKeyState.key,
        instruction,
        patchInput,
        patchAspect,
        'gemini-3-pro-image-preview',
        quality
      );
      const merged = await mergeGeneratedPatch(workingImage, generated, expanded, autoExpandSelection ? 24 : 12);
      setWorkingImage(merged);

      try {
        await saveStickerToDB({
          id: crypto.randomUUID(),
          imageUrl: merged,
          timestamp: Date.now(),
          phrase: prompt?.trim() ? `Local Redraw: ${prompt.trim().slice(0, 80)}` : 'Local Redraw'
        });
      } catch (error) {
        console.error('Auto-save after local redraw failed', error);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Local regenerate failed';
      setErrorMessage(message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleOptimizePrompt = () => {
    const base = prompt.trim() || 'Add one small cat';
    const optimized = [
      base,
      'The new subject must be fully inside the selected region and not cross the border.',
      'Do not crop the subject. Match lighting and color tone with the original image.',
      'Blend edges naturally and avoid obvious seam artifacts.'
    ].join(' ');
    setPrompt(optimized);
  };

  const handleApplyRemoveObjectPrompt = () => {
    setPrompt(
      '移除框內主要內容（可為文字、標記或物件），以周圍場景自動補齊背景，保持原圖光線、色調、透視與材質一致，邊緣自然融合且無明顯修補痕跡。'
    );
  };

  const handleDownload = async () => {
    if (!workingImage) return;
    try {
      await saveStickerToDB({
        id: crypto.randomUUID(),
        imageUrl: workingImage,
        timestamp: Date.now(),
        phrase: 'Local Redraw'
      });
    } catch (error) {
      console.error('Auto-save on download failed', error);
    }
    const link = document.createElement('a');
    link.href = workingImage;
    link.download = `local_redraw_${Date.now()}.png`;
    link.click();
  };

  const handleResetToOriginal = () => {
    if (!baseImage) return;
    setWorkingImage(baseImage);
    setSelectionRect(null);
    setPrompt('');
    clearProtectMask();
    setErrorMessage('');
  };

  const handleResetAll = () => {
    setBaseImage(null);
    setWorkingImage(null);
    setImageSize({ width: 0, height: 0 });
    setSelectionRect(null);
    setPrompt('');
    setErrorMessage('');
    clearProtectMask();
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="h-full min-h-0 grid grid-cols-1 lg:grid-cols-3 gap-4 p-4 md:p-6 overflow-hidden">
      <div className="lg:col-span-1 min-h-0 rounded-2xl border border-cream-dark bg-white p-4 md:p-5 space-y-4 overflow-y-auto">
        <h3 className="text-lg font-black text-bronze-text">{t('editor.localRedraw.title', { defaultValue: '局部重繪' })}</h3>

        {!workingImage && (
          <div className="space-y-3">
            <button onClick={() => fileInputRef.current?.click()} className="w-full rounded-xl border-2 border-dashed border-cream-dark p-5 text-bronze-light hover:text-primary hover:border-primary/50 transition-all flex items-center justify-center gap-2">
              <Upload size={18} />
              {t('editor.localRedraw.upload', { defaultValue: '上傳圖片' })}
            </button>
            <button onClick={() => setShowGallery(true)} className="w-full rounded-xl border border-cream-dark bg-white hover:bg-cream-light px-4 py-3 text-bronze-text font-bold flex items-center justify-center gap-2">
              <FolderOpen size={18} />
              {t('app.selectFromGallery', { defaultValue: '從作品集選取' })}
            </button>
          </div>
        )}

        {workingImage && (
          <>
            <div className="text-xs text-bronze-light">
              {t('editor.localRedraw.source', { defaultValue: '畫布尺寸' })}: {imageSize.width} x {imageSize.height}
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button type="button" onClick={handleResetToOriginal} className="rounded-lg border border-cream-dark bg-white hover:bg-cream-light px-3 py-2 text-xs font-bold text-bronze-text inline-flex items-center justify-center gap-1">
                <RefreshCw size={14} />
                {t('editor.localRedraw.resetToOriginal', { defaultValue: '還原原圖' })}
              </button>
              <button type="button" onClick={handleResetAll} className="rounded-lg border border-cream-dark bg-white hover:bg-cream-light px-3 py-2 text-xs font-bold text-bronze-text">
                {t('common.reset', { defaultValue: '重置' })}
              </button>
            </div>

            <div className="space-y-2 rounded-xl border border-cream-dark bg-cream-light p-3">
              <label className="text-xs font-bold text-bronze-light uppercase">{t('editor.outpaint.localEdit', { defaultValue: '局部改圖' })}</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setEditTool('select')}
                  className={`rounded-lg border px-3 py-2 text-xs font-bold flex items-center justify-center gap-1 ${editTool === 'select' ? 'bg-primary text-white border-primary' : 'bg-white text-bronze-text border-cream-dark'}`}
                >
                  <SquareDashed size={14} />
                  {t('editor.outpaint.selectArea', { defaultValue: '框選區域' })}
                </button>
                <button
                  type="button"
                  onClick={() => setEditTool('protect')}
                  className={`rounded-lg border px-3 py-2 text-xs font-bold flex items-center justify-center gap-1 ${editTool === 'protect' ? 'bg-primary text-white border-primary' : 'bg-white text-bronze-text border-cream-dark'}`}
                >
                  <Eraser size={14} />
                  {t('editor.outpaint.protectBrush', { defaultValue: '保護筆刷' })}
                </button>
              </div>

              {editTool === 'protect' && (
                <label className="text-xs block">
                  <div className="mb-1 text-bronze-light">{t('editor.outpaint.brushSize', { defaultValue: '筆刷大小' })}: {protectBrushSize}px</div>
                  <input type="range" min={8} max={96} value={protectBrushSize} onChange={(e) => setProtectBrushSize(Number(e.target.value))} className="w-full" />
                </label>
              )}

                            <label className="text-xs block">
                <div className="mb-1 text-bronze-light">{t('editor.outpaint.localPrompt', { defaultValue: '局部重生成提示詞' })}</div>
                <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} rows={2} className="w-full rounded-lg border border-cream-dark px-3 py-2 text-sm" placeholder={t('editor.outpaint.localPromptHint', { defaultValue: '例如：在框內加入一隻完整小貓，光線一致，邊緣自然融合' })} />
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={handleOptimizePrompt}
                    className="rounded-lg border border-cream-dark bg-white hover:bg-cream-light px-3 py-1.5 text-xs font-bold text-bronze-text inline-flex items-center justify-center gap-1"
                  >
                    <Sparkles size={12} />
                    {t('editor.localRedraw.optimizePrompt', { defaultValue: '優化提示詞' })}
                  </button>
                  <button
                    type="button"
                    onClick={handleApplyRemoveObjectPrompt}
                    className="rounded-lg border border-cream-dark bg-white hover:bg-cream-light px-3 py-1.5 text-xs font-bold text-bronze-text inline-flex items-center justify-center gap-1"
                  >
                    <Sparkles size={12} />
                    {t('editor.localRedraw.removeObjectTemplate', { defaultValue: '去除內容（自動補背景）' })}
                  </button>
                </div>
                <p className="mt-1 text-[11px] text-bronze-light">
                  {t('editor.localRedraw.promptTip', { defaultValue: '建議：框選範圍至少比目標物件大 1.3x，可降低裁切與接縫感。' })}
                </p>
              </label>

              <label className="flex items-center gap-2 text-xs text-bronze-text">
                <input
                  type="checkbox"
                  checked={autoExpandSelection}
                  onChange={(e) => setAutoExpandSelection(e.target.checked)}
                  className="accent-primary"
                />
                {t('editor.localRedraw.autoExpand', { defaultValue: '自動擴框 20%（減少邊界接縫）' })}
              </label>

              <div className="grid grid-cols-2 gap-2">
                <button type="button" onClick={() => setSelectionRect(null)} className="rounded-lg border border-cream-dark bg-white hover:bg-cream-light px-3 py-2 text-xs font-bold text-bronze-text">
                  {t('editor.outpaint.clearSelection', { defaultValue: '清除框選' })}
                </button>
                <button type="button" onClick={clearProtectMask} className="rounded-lg border border-cream-dark bg-white hover:bg-cream-light px-3 py-2 text-xs font-bold text-bronze-text">
                  {t('editor.outpaint.clearMask', { defaultValue: '清除保護' })}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-bronze-light uppercase">{t('editor.outpaint.quality', { defaultValue: '輸出品質' })}</label>
              <div className="grid grid-cols-3 gap-2">
                {(['1K', '2K', '4K'] as const).map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => setQuality(q)}
                    className={`rounded-lg border px-2 py-2 text-xs font-bold transition-all ${quality === q ? 'bg-primary text-white border-primary' : 'bg-white text-bronze-text border-cream-dark hover:border-primary/50'}`}
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-2">
              <button onClick={handleLocalRegenerate} disabled={isGenerating} className="w-full rounded-xl bg-primary hover:bg-primary-hover text-white font-bold px-4 py-2.5 flex items-center justify-center gap-2 disabled:opacity-60">
                {isGenerating ? <Loader2 size={16} className="animate-spin" /> : <Wand2 size={16} />}
                {isGenerating ? t('generator.action.generating', { defaultValue: '生成中...' }) : t('editor.outpaint.localRegenerate', { defaultValue: '局部重生成' })}
              </button>
              <button onClick={handleDownload} className="w-full rounded-xl bg-secondary/15 hover:bg-secondary/25 text-secondary font-bold px-4 py-2.5 flex items-center justify-center gap-2">
                <Download size={16} />
                {t('editor.outpaint.download', { defaultValue: '下載（自動匯入作品集）' })}
              </button>
            </div>

            {errorMessage && <div className="text-xs text-red-500 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{errorMessage}</div>}
          </>
        )}

        <input ref={fileInputRef} className="hidden" type="file" accept="image/*" onChange={handleFileChange} />
      </div>

      <div className="lg:col-span-2 min-h-0 overflow-auto rounded-2xl border border-cream-dark bg-slate-100/50 p-4 md:p-5 flex items-center justify-center">
        {!workingImage && <div className="text-sm text-slate-500">{t('editor.localRedraw.empty', { defaultValue: '請先上傳圖片或從作品集選取，開始局部重繪。' })}</div>}

        {!!workingImage && (
          <div
            ref={stageRef}
            className="relative w-full max-w-[920px] max-h-[70vh] rounded-lg shadow-lg overflow-hidden border border-slate-300 bg-white touch-none select-none"
            style={{ aspectRatio: `${imageSize.width} / ${imageSize.height}` }}
            onPointerDown={handleResultPointerDown}
            onPointerMove={handleResultPointerMove}
            onPointerUp={handleResultPointerUp}
            onPointerCancel={handleResultPointerUp}
            onPointerLeave={handleResultPointerUp}
          >
            <img src={workingImage} alt="local-redraw-result" className="absolute inset-0 w-full h-full object-cover" />
            <div className="absolute left-2 top-2 px-2 py-1 rounded bg-black/45 text-white text-[11px] pointer-events-none">
              {editTool === 'protect'
                ? t('editor.outpaint.protecting', { defaultValue: '筆刷模式：塗抹可保護區域' })
                : t('editor.outpaint.selecting', { defaultValue: '框選模式：拖曳建立重繪範圍' })}
            </div>
            <canvas ref={maskPreviewRef} className="absolute inset-0 w-full h-full pointer-events-none" />
            {safeSelection && safeSelection.width > 0 && safeSelection.height > 0 && (
              <div
                className="absolute border-2 border-primary bg-primary/10 pointer-events-none"
                style={{
                  left: `${(safeSelection.x / imageSize.width) * 100}%`,
                  top: `${(safeSelection.y / imageSize.height) * 100}%`,
                  width: `${(safeSelection.width / imageSize.width) * 100}%`,
                  height: `${(safeSelection.height / imageSize.height) * 100}%`
                }}
              />
            )}
          </div>
        )}
      </div>

      {showGallery && <GalleryPicker onSelect={handleGallerySelect} onClose={() => setShowGallery(false)} />}
    </div>
  );
};

export default LocalRedrawTab;



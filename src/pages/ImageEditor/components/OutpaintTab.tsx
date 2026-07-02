import React, { useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Download, FolderOpen, Key, Loader2, RefreshCw, Upload, X } from 'lucide-react';
import { GalleryPicker } from '../../../components/GalleryPicker';
import { AiProvider, clearApiKey, getApiKeyUrl, isValidApiKey, loadApiKey, saveApiKey } from '../../../shared/geminiApiKey';
import { generateImage } from '../../Generator/services/geminiService';
import { generateOpenAiImage } from '../../Generator/services/openaiImageService';
import { saveStickerToDB } from '../../../db';

const ratioPresets = [
  { label: '1:1', width: 1024, height: 1024 },
  { label: '4:3', width: 1200, height: 900 },
  { label: '3:4', width: 900, height: 1200 },
  { label: '16:9', width: 1280, height: 720 },
  { label: '9:16', width: 720, height: 1280 }
] as const;

type FixedMode = 'width' | 'height';
type Quality = '1K' | '2K' | '4K';

const PROVIDER_LABELS: Record<AiProvider, string> = {
  gemini: 'Gemini',
  openai: 'OpenAI',
};

const GEMINI_OUTPAINT_MODEL = 'gemini-3-pro-image-preview';
const OPENAI_OUTPAINT_MODEL = 'gpt-image-2';

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

  const [showGallery, setShowGallery] = useState(false);
  const [sourceImage, setSourceImage] = useState<string | null>(null);
  const [sourceSize, setSourceSize] = useState({ width: 0, height: 0 });
  const [customSize, setCustomSize] = useState<{ width: number; height: number }>({ width: ratioPresets[0].width, height: ratioPresets[0].height });
  const [lockAspectRatio, setLockAspectRatio] = useState(true);
  const [fixedMode, setFixedMode] = useState<FixedMode>('width');
  const [fixedPx, setFixedPx] = useState(1024);
  const [quality, setQuality] = useState<Quality>('1K');
  const [x, setX] = useState(0);
  const [y, setY] = useState(0);
  const [scale, setScale] = useState(100);
  const [prompt, setPrompt] = useState('');
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [resultSize, setResultSize] = useState<{ width: number; height: number } | null>(null);
  const [modelRawSize, setModelRawSize] = useState<{ width: number; height: number } | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [provider, setProvider] = useState<AiProvider>('gemini');
  const [providerKeys, setProviderKeys] = useState<Record<AiProvider, string>>({ gemini: '', openai: '' });
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [keyProvider, setKeyProvider] = useState<AiProvider>('gemini');
  const [tempKey, setTempKey] = useState('');

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

  const syncKeyModalState = (nextProvider: AiProvider, nextKeys = providerKeys) => {
    const stored = loadApiKey(nextProvider);
    setKeyProvider(nextProvider);
    setTempKey(stored?.key || nextKeys[nextProvider] || '');
  };

  React.useEffect(() => {
    const geminiStored = loadApiKey('gemini');
    const openAiStored = loadApiKey('openai');
    const nextKeys = {
      gemini: geminiStored?.key || '',
      openai: openAiStored?.key || '',
    };
    setProviderKeys(nextKeys);

    if (geminiStored) return;
    if (openAiStored) {
      setProvider('openai');
    }
  }, []);

  const handleSaveKey = () => {
    const key = tempKey.trim();
    if (!isValidApiKey(keyProvider, key)) return;
    saveApiKey(keyProvider, key, true);
    const nextKeys = { ...providerKeys, [keyProvider]: key };
    setProviderKeys(nextKeys);
    setProvider(keyProvider);
    setShowKeyModal(false);
  };

  const handleClearKey = () => {
    clearApiKey(keyProvider);
    const nextKeys = { ...providerKeys, [keyProvider]: '' };
    setProviderKeys(nextKeys);
    setTempKey('');
    if (provider === keyProvider) {
      if (keyProvider === 'openai' && nextKeys.gemini) setProvider('gemini');
      if (keyProvider === 'gemini' && nextKeys.openai) setProvider('openai');
    }
    syncKeyModalState(keyProvider, nextKeys);
  };

  const clearGenerated = () => {
    setResultImage(null);
    setResultSize(null);
    setModelRawSize(null);
  };

  const handleResetImage = () => {
    setSourceImage(null);
    setSourceSize({ width: 0, height: 0 });
    setX(0);
    setY(0);
    setScale(100);
    setPrompt('');
    setErrorMessage('');
    clearGenerated();
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
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
    const apiKey = providerKeys[provider];
    if (!apiKey) {
      syncKeyModalState(provider);
      setShowKeyModal(true);
    }
    if (!apiKey) {
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

      const generated = provider === 'openai'
        ? await generateOpenAiImage(
            apiKey,
            instruction,
            baseImage,
            aspectRatio,
            OPENAI_OUTPAINT_MODEL,
            quality === '1K' ? 'medium' : 'high',
          )
        : await generateImage(
            apiKey,
            instruction,
            baseImage,
            aspectRatio,
            GEMINI_OUTPAINT_MODEL,
            quality
          );
      const rawSize = await getImageDimensions(generated);
      const normalized = await normalizeToOutputSize(generated);
      const finalSize = await getImageDimensions(normalized);

      setModelRawSize(rawSize);
      setResultSize(finalSize);
      setResultImage(normalized);

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

  const drawWidth = (sourceSize.width * scale) / 100;
  const drawHeight = (sourceSize.height * scale) / 100;

  return (
    <div className="h-full min-h-0 grid grid-cols-1 lg:grid-cols-3 gap-4 p-4 md:p-6 overflow-hidden">
      {showKeyModal && (
        <div className="fixed inset-0 z-50 bg-bronze-text/30 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-3xl border border-cream-dark shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-black text-bronze">API Key</h3>
                <p className="text-xs text-bronze-light">Set a key for the provider you want to use in Outpaint.</p>
              </div>
              <button onClick={() => setShowKeyModal(false)} className="text-bronze-light hover:text-bronze">
                <X size={18} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {(['gemini', 'openai'] as AiProvider[]).map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => syncKeyModalState(option)}
                  className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all ${keyProvider === option
                    ? 'bg-primary text-white border-primary shadow-md'
                    : 'bg-cream-light border-cream-dark text-bronze-text hover:bg-white'}`}
                >
                  {PROVIDER_LABELS[option]}
                </button>
              ))}
            </div>

            <a
              href={getApiKeyUrl(keyProvider)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex text-xs font-bold text-primary hover:text-primary-hover"
            >
              Get {PROVIDER_LABELS[keyProvider]} API Key
            </a>

            <input
              type="password"
              value={tempKey}
              onChange={(e) => setTempKey(e.target.value)}
              placeholder={keyProvider === 'openai' ? 'Paste your OpenAI API key' : 'Paste your Gemini API key'}
              className="w-full px-4 py-3 bg-cream-light border border-cream-dark rounded-xl font-bold text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 text-bronze-text"
            />

            {!isValidApiKey(keyProvider, tempKey) && tempKey.trim() && (
              <p className="text-xs font-bold text-red-500">
                {keyProvider === 'openai' ? 'Please enter a valid OpenAI API key.' : 'Please enter a valid Gemini API key.'}
              </p>
            )}

            <div className="flex gap-3">
              <button
                onClick={handleSaveKey}
                disabled={!isValidApiKey(keyProvider, tempKey)}
                className="flex-1 px-4 py-2.5 rounded-xl bg-primary text-white font-black hover:bg-primary-hover disabled:opacity-60"
              >
                Save Key
              </button>
              {providerKeys[keyProvider] && (
                <button
                  onClick={handleClearKey}
                  className="px-4 py-2.5 rounded-xl bg-red-50 text-red-500 font-black border border-red-200 hover:bg-red-100"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="lg:col-span-1 min-h-0 rounded-2xl border border-cream-dark bg-white p-4 md:p-5 space-y-4 overflow-y-auto">
        <h3 className="text-lg font-black text-bronze-text">{t('editor.outpaint.title', { defaultValue: '魔法擴圖' })}</h3>

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

            <div className="space-y-2 rounded-xl border border-cream-dark bg-cream-light p-3">
              <div className="flex items-center justify-between gap-3">
                <label className="text-xs font-bold text-bronze-light uppercase">Provider</label>
                <button
                  type="button"
                  onClick={() => {
                    syncKeyModalState(provider);
                    setShowKeyModal(true);
                  }}
                  className="text-xs font-bold text-primary hover:text-primary-hover flex items-center gap-1"
                >
                  <Key size={14} />
                  Set API Key
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {(['gemini', 'openai'] as AiProvider[]).map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setProvider(option)}
                    className={`rounded-lg border px-3 py-2 text-xs font-bold transition-all ${provider === option
                      ? 'bg-primary text-white border-primary'
                      : 'bg-white text-bronze-text border-cream-dark hover:border-primary/50'}`}
                  >
                    {PROVIDER_LABELS[option]}
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-bronze-light">
                {provider === 'openai' ? `Model: ${OPENAI_OUTPAINT_MODEL}` : `Model: ${GEMINI_OUTPAINT_MODEL}`}
              </p>
            </div>

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

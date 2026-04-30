import React, { useRef, useState } from 'react';
import { AlertCircle, Check, Download, FolderHeart, Key, Loader2, Sparkles, Upload, X } from 'lucide-react';
import { GoogleGenAI } from '@google/genai';
import { Button } from '../../../components/ui/Button';
import { GalleryPicker } from '../../../components/GalleryPicker';
import { AiProvider } from '../../../shared/geminiApiKey';
import { generateOpenAiImage } from '../services/openaiImageService';

type HolidayOption = {
  id: string;
  prompt: string;
  zh: string;
  en: string;
};

type StyleOption = {
  id: string;
  prompt: string;
  zh: string;
  en: string;
};

const HOLIDAYS: HolidayOption[] = [
  { id: 'lunar_new_year', prompt: 'Lunar New Year', zh: '農曆新年', en: 'Lunar New Year' },
  { id: 'lantern_festival', prompt: 'Lantern Festival', zh: '元宵節', en: 'Lantern Festival' },
  { id: 'dragon_boat', prompt: 'Dragon Boat Festival', zh: '端午節', en: 'Dragon Boat Festival' },
  { id: 'moon_festival', prompt: 'Mid-Autumn Festival', zh: '中秋節', en: 'Mid-Autumn Festival' },
  { id: 'qixi', prompt: 'Qixi Festival, Chinese Valentines Day', zh: '七夕情人節', en: 'Qixi Festival' },
  { id: 'double_ninth', prompt: 'Double Ninth Festival', zh: '重陽節', en: 'Double Ninth Festival' },
  { id: 'winter_solstice', prompt: 'Winter Solstice family gathering', zh: '冬至', en: 'Winter Solstice' },
  { id: 'christmas', prompt: 'Christmas', zh: '聖誕節', en: 'Christmas' },
  { id: 'halloween', prompt: 'Halloween', zh: '萬聖節', en: 'Halloween' },
  { id: 'new_year', prompt: 'New Year celebration', zh: '跨年', en: 'New Year' },
  { id: 'valentines', prompt: "Valentine's Day", zh: '西洋情人節', en: "Valentine's Day" },
  { id: 'mothers_day', prompt: "Mother's Day with carnations and love", zh: '母親節', en: "Mother's Day" },
  { id: 'fathers_day', prompt: "Father's Day", zh: '父親節', en: "Father's Day" },
  { id: 'easter', prompt: 'Easter', zh: '復活節', en: 'Easter' },
  { id: 'thanksgiving', prompt: 'Thanksgiving', zh: '感恩節', en: 'Thanksgiving' },
  { id: 'tomb_sweeping', prompt: 'Tomb Sweeping Day', zh: '清明節', en: 'Tomb Sweeping Day' },
  { id: 'birthday', prompt: 'Happy Birthday celebration', zh: '生日快樂', en: 'Birthday' },
  { id: 'wedding', prompt: 'Happy Wedding celebration', zh: '新婚快樂', en: 'Wedding' },
  { id: 'graduation', prompt: 'Graduation ceremony', zh: '畢業快樂', en: 'Graduation' },
  { id: 'get_well', prompt: 'Get well soon, wishing a speedy recovery', zh: '早日康復', en: 'Get Well Soon' },
  { id: 'thank_you', prompt: 'A heartfelt thank you', zh: '謝謝你', en: 'Thank You' },
  { id: 'good_luck', prompt: 'Wishing good luck', zh: '祝你好運', en: 'Good Luck' },
  { id: 'teachers_day', prompt: "Teacher's Day", zh: '教師節', en: "Teacher's Day" },
  { id: 'childrens_day', prompt: "Children's Day", zh: '兒童節', en: "Children's Day" },
  { id: 'housewarming', prompt: 'Housewarming celebration', zh: '入厝', en: 'Housewarming' },
  { id: 'new_job', prompt: 'Celebrating a new job', zh: '新工作', en: 'New Job' },
  { id: 'custom', prompt: 'Custom theme', zh: '自訂主題', en: 'Custom Theme' },
];

const STYLES: StyleOption[] = [
  { id: 'cute', prompt: 'Cute sticker style', zh: '可愛貼圖', en: 'Cute Sticker' },
  { id: '3d', prompt: '3D render style', zh: '3D 渲染', en: '3D Render' },
  { id: 'anime', prompt: 'A vibrant anime manga style', zh: '動漫風', en: 'Anime' },
  { id: 'pixel', prompt: 'Pixel art style', zh: '像素風', en: 'Pixel Art' },
  { id: 'oil', prompt: 'Oil painting style', zh: '油畫風', en: 'Oil Painting' },
  { id: 'line', prompt: 'Line art style', zh: '線稿風', en: 'Line Art' },
  { id: 'vintage', prompt: 'Vintage poster style', zh: '復古海報', en: 'Vintage Poster' },
  { id: 'realistic', prompt: 'Photorealistic style, identical to the original photo', zh: '寫實風', en: 'Realism' },
  { id: 'realistic-cosplay', prompt: 'Photorealistic style with themed costume', zh: '寫實 Cosplay', en: 'Realism Cosplay' },
  { id: 'illustration', prompt: 'Modern flat vector illustration', zh: '扁平插畫', en: 'Flat Illustration' },
  { id: 'comic', prompt: 'American comic book style', zh: '美漫風', en: 'American Comic' },
  { id: 'watercolor', prompt: 'Soft watercolor painting style', zh: '水彩風', en: 'Watercolor' },
];

const PROVIDER_LABELS: Record<AiProvider, string> = {
  gemini: 'Gemini',
  openai: 'OpenAI',
};

const OPENAI_HOLIDAY_MODEL = 'gpt-image-2';
const GEMINI_HOLIDAY_MODEL = 'gemini-3-pro-image-preview';

interface HolidayStickerTabProps {
  provider: AiProvider;
  apiKeys: Record<AiProvider, string>;
  onProviderChange: (provider: AiProvider) => void;
  onNeedApiKey: (provider: AiProvider) => void;
  onError: (error: string) => void;
  onSuccess: (imageUrl: string, prompt: string, description?: string) => void;
}

const HolidayStickerTab: React.FC<HolidayStickerTabProps> = ({
  provider,
  apiKeys,
  onProviderChange,
  onNeedApiKey,
  onError,
  onSuccess,
}) => {
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [selectedHoliday, setSelectedHoliday] = useState(HOLIDAYS[0].id);
  const [selectedStyle, setSelectedStyle] = useState(STYLES[0].id);
  const [customName, setCustomName] = useState('');
  const [customHoliday, setCustomHoliday] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [results, setResults] = useState<string[]>(Array(3).fill(''));
  const [generationErrors, setGenerationErrors] = useState<boolean[]>(Array(3).fill(false));
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [batchSize, setBatchSize] = useState(3);
  const [showGallery, setShowGallery] = useState(false);
  const [autoRemoveBg, setAutoRemoveBg] = useState(true);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const apiKey = apiKeys[provider];

  const resetBatchState = () => {
    setResults(Array(batchSize).fill(''));
    setGenerationErrors(Array(batchSize).fill(false));
    setErrorMessage(null);
  };

  const handlePickedImage = (dataUrl: string) => {
    setUploadedImage(dataUrl);
    setErrorMessage(null);
  };

  const readFile = (file: Blob) => {
    const reader = new FileReader();
    reader.onloadend = () => handlePickedImage(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      readFile(file);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file?.type.startsWith('image/')) {
      readFile(file);
    }
  };

  const handleGallerySelect = async (blobs: Blob[]) => {
    if (blobs[0]) {
      readFile(blobs[0]);
    }
    setShowGallery(false);
  };

  const smartRemoveBackground = (base64: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        try {
          const width = img.width;
          const height = img.height;
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d', { willReadFrequently: true });
          if (!ctx) {
            reject(new Error('Failed to get canvas context'));
            return;
          }

          ctx.drawImage(img, 0, 0);
          const imageData = ctx.getImageData(0, 0, width, height);
          const data = imageData.data;
          const isBg = new Uint8Array(width * height);
          const corners = [[0, 0], [width - 1, 0], [0, height - 1], [width - 1, height - 1]];
          const queue: [number, number][] = [...corners as [number, number][]];
          const visited = new Uint8Array(width * height);

          const isGreen = (r: number, g: number, b: number) => g > 80 && g > r * 1.15 && g > b * 1.15;

          while (queue.length > 0) {
            const [x, y] = queue.shift()!;
            const idx = y * width + x;
            if (visited[idx]) continue;
            visited[idx] = 1;

            const i = idx * 4;
            if (isGreen(data[i], data[i + 1], data[i + 2])) {
              isBg[idx] = 1;
              if (x > 0) queue.push([x - 1, y]);
              if (x < width - 1) queue.push([x + 1, y]);
              if (y > 0) queue.push([x, y - 1]);
              if (y < height - 1) queue.push([x, y + 1]);
            }
          }

          const expandedBg = new Uint8Array(isBg);
          for (let y = 1; y < height - 1; y++) {
            for (let x = 1; x < width - 1; x++) {
              const idx = y * width + x;
              if (!isBg[idx] && (isBg[idx - 1] || isBg[idx + 1] || isBg[idx - width] || isBg[idx + width])) {
                expandedBg[idx] = 1;
              }
            }
          }

          for (let i = 0; i < width * height; i++) {
            if (expandedBg[i]) {
              data[i * 4 + 3] = 0;
            }
          }

          ctx.putImageData(imageData, 0, 0);
          resolve(canvas.toDataURL('image/png'));
        } catch (error) {
          reject(error);
        }
      };
      img.onerror = (error) => reject(error);
      img.src = base64;
    });
  };

  const markResult = (index: number, imageUrl: string) => {
    setResults((prev) => {
      const next = [...prev];
      next[index] = imageUrl;
      return next;
    });
  };

  const markGenerationError = (index: number) => {
    setGenerationErrors((prev) => {
      const next = [...prev];
      next[index] = true;
      return next;
    });
  };

  const generateStickerImage = async (prompt: string, index: number, imageBase64: string) => {
    if (!apiKey) {
      throw new Error('API Key is missing');
    }

    try {
      let imageUrl = '';

      if (provider === 'openai') {
        imageUrl = await generateOpenAiImage(
          apiKey,
          prompt,
          imageBase64,
          '1:1',
          OPENAI_HOLIDAY_MODEL,
          'medium',
        );
      } else {
        const ai = new GoogleGenAI({ apiKey });
        const response = await ai.models.generateContent({
          model: GEMINI_HOLIDAY_MODEL,
          contents: [{
            parts: [
              { text: prompt },
              { inlineData: { mimeType: 'image/jpeg', data: imageBase64 } },
            ],
          }],
          config: {
            imageConfig: {
              aspectRatio: '1:1',
              imageSize: '1K',
            },
          },
        });

        const candidate = response.candidates?.[0];
        if (candidate?.finishReason !== 'STOP' && candidate?.finishReason !== undefined) {
          console.warn('Model finished with reason:', candidate.finishReason);
        }

        const imagePart = candidate?.content?.parts?.find((part: any) => part.inlineData);
        if (!imagePart?.inlineData?.data) {
          const textContent = candidate?.content?.parts?.find((part: any) => part.text)?.text;
          const errorMsg = textContent
            ? `Model refusal: ${textContent}`
            : `No image returned. Raw candidate: ${JSON.stringify(candidate).substring(0, 200)}...`;
          throw new Error(errorMsg);
        }

        imageUrl = `data:image/png;base64,${imagePart.inlineData.data}`;
      }

      if (autoRemoveBg) {
        try {
          imageUrl = await smartRemoveBackground(imageUrl);
        } catch (error) {
          console.warn('Auto background removal failed', error);
        }
      }

      markResult(index, imageUrl);
      const holidayLabel = selectedHoliday === 'custom'
        ? customHoliday
        : HOLIDAYS.find((holiday) => holiday.id === selectedHoliday)?.zh || '節慶';
      const styleLabel = STYLES.find((style) => style.id === selectedStyle)?.zh || '貼圖';
      const stickerTitle = `[${holidayLabel}] ${styleLabel} Sticker`;
      onSuccess(imageUrl, stickerTitle, prompt);
    } catch (error: any) {
      console.error(`Generation failed for slot ${index}`, error);
      markGenerationError(index);

      let message = error?.message || 'Generation failed.';
      if (message === 'KEY_NOT_FOUND') {
        message = provider === 'openai' ? 'Please set your OpenAI API key first.' : 'Please set your Gemini API key first.';
      } else if (message.includes('503')) {
        message = 'Model overloaded. Please try again.';
      } else if (message.includes('404')) {
        message = 'Model not found. Please try another provider.';
      }

      setErrorMessage(message);
      onError(message);
    }
  };

  const buildPrompt = (holidayPrompt: string, stylePrompt: string, variation: string) => {
    const identityInstruction = selectedStyle === 'realistic-cosplay'
      ? `
CHARACTER IDENTITY (FACE ONLY - COSPLAY MODE):
- You MUST preserve the facial features (eyes, nose, mouth, face shape) of the person in the uploaded image exactly.
- You MUST change the hair style and clothing to match the "${holidayPrompt}" theme.
- It should look like the same person wearing a full costume and wig for the holiday.`
      : `
CHARACTER IDENTITY (TOP PRIORITY):
- You MUST preserve the facial features, hair style, and key characteristics of the person in the uploaded image.
- Do NOT replace the person with a generic character.
- Integrate the holiday elements around them.`;

    let prompt = `Create a single die-cut sticker of a person who strongly resembles the person in the provided image.
The sticker should be in ${stylePrompt} style, specifically for ${holidayPrompt}.

${identityInstruction}

COMPOSITION:
- The character and ${holidayPrompt} elements must be grouped together as a single cohesive unit.
- ${variation}
- Do not leave floating background elements; everything should be connected or framed as one sticker item.

STICKER OUTLINE:
- Add a thick white die-cut border surrounding the entire unified composition.

BACKGROUND:
- The background outside the white sticker border MUST be 100% solid pure neon green (#00FF00).
- No gradients, no textures, no shadows.

TEXT RESTRICTIONS:
- Do NOT write the name of the holiday/theme ("${holidayPrompt}") as text in the sticker unless requested below.`;

    if (customName.trim()) {
      prompt += `

TEXT INSTRUCTION:
- Incorporate the exact text "${customName}" into the design.
- Write the text once.
- Ensure the text is legible, correctly spelled, and artistically integrated.`;
    }

    return prompt;
  };

  const generateStickers = async () => {
    if (!uploadedImage) {
      const message = 'Please upload a reference image first.';
      setErrorMessage(message);
      onError(message);
      return;
    }

    if (!apiKey) {
      const message = `Please set your ${PROVIDER_LABELS[provider]} API key.`;
      setErrorMessage(message);
      onNeedApiKey(provider);
      onError(message);
      return;
    }

    const holiday = HOLIDAYS.find((item) => item.id === selectedHoliday);
    const style = STYLES.find((item) => item.id === selectedStyle);
    if (!holiday || !style) {
      const message = 'Holiday or style selection is invalid.';
      setErrorMessage(message);
      onError(message);
      return;
    }

    let holidayPrompt = holiday.prompt;
    if (selectedHoliday === 'custom') {
      if (!customHoliday.trim()) {
        const message = 'Please enter a custom holiday theme.';
        setErrorMessage(message);
        onError(message);
        return;
      }
      holidayPrompt = customHoliday.trim();
    }

    setIsGenerating(true);
    resetBatchState();

    const imageBase64 = uploadedImage.split(',')[1];
    const promptVariations = [
      'Surrounded by festive decorations that are part of the sticker design.',
      'Interacting with related food and drinks.',
      'Performing a traditional activity.',
      'In a joyful celebratory pose with integrated background elements.',
    ];

    const promises = Array.from({ length: batchSize }).map((_, index) => {
      const variation = promptVariations[index % promptVariations.length];
      const prompt = buildPrompt(holidayPrompt, style.prompt, variation);
      return generateStickerImage(prompt, index, imageBase64);
    });

    try {
      await Promise.all(promises);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-6 bg-cream backdrop-blur-md border border-cream-dark shadow-sm rounded-[2rem] p-8">
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <label className="text-xs font-black text-bronze-light uppercase tracking-widest pl-1">
                Provider
              </label>
              <button
                type="button"
                onClick={() => onNeedApiKey(provider)}
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
                  onClick={() => onProviderChange(option)}
                  className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all ${provider === option
                    ? 'bg-primary text-white border-primary shadow-md'
                    : 'bg-cream-light border-cream-dark text-bronze-light hover:bg-white hover:border-primary/30'}`}
                >
                  {PROVIDER_LABELS[option]}
                </button>
              ))}
            </div>
            <p className="text-[11px] text-bronze-light">
              {provider === 'openai' ? `Model: ${OPENAI_HOLIDAY_MODEL}` : `Model: ${GEMINI_HOLIDAY_MODEL}`}
            </p>
          </div>

          <div className="space-y-3">
            <label className="text-sm font-black flex items-center gap-2 text-bronze-light uppercase tracking-widest">
              <Upload size={18} className="text-primary" /> 1. 上傳參考照片
            </label>
            <div
              className={`group border-3 border-dashed rounded-[2rem] p-6 text-center cursor-pointer transition-all duration-300 min-h-[200px] flex flex-col items-center justify-center ${uploadedImage
                ? 'border-primary bg-primary/5'
                : 'border-cream-dark bg-cream-light/50 hover:border-primary/50 hover:bg-white/60'}`}
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
            >
              {uploadedImage ? (
                <div className="relative w-full h-full">
                  <img src={uploadedImage} alt="Preview" className="max-w-full max-h-48 object-contain mx-auto rounded-3xl shadow-md" />
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20 rounded-3xl backdrop-blur-sm">
                    <span className="bg-white px-3 py-1 rounded-full text-xs font-bold text-bronze-text">重新選擇</span>
                  </div>
                </div>
              ) : (
                <div className="py-4 text-bronze-light">
                  <div className="bg-white p-4 rounded-full inline-block mb-3 shadow-md shadow-primary/10 group-hover:scale-110 transition-transform text-primary">
                    <Upload size={24} />
                  </div>
                  <span className="text-sm font-bold block">點擊或拖曳圖片到這裡</span>
                  <span className="text-[10px] opacity-70 mt-1 block">建議使用正面清楚的人像照片</span>
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowGallery(true);
              }}
              className="mt-3 flex items-center gap-2 px-4 py-2 bg-secondary/10 hover:bg-secondary/20 text-bronze-text rounded-xl text-sm font-bold transition-colors mx-auto"
            >
              <FolderHeart size={16} />
              從圖庫選擇
            </button>
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
          </div>

          <div className="space-y-3">
            <label className="text-xs font-black text-bronze-light uppercase tracking-widest pl-1">
              額外文字（選填）
            </label>
            <input
              type="text"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              placeholder="例如：Happy New Year、王小明"
              className="w-full px-4 py-3 bg-cream-light border border-cream-dark rounded-2xl font-bold text-xs outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 text-bronze-text shadow-inner placeholder-bronze-light"
            />
          </div>

          <div className="space-y-3">
            <label className="text-xs font-black text-bronze-light uppercase tracking-widest pl-1">
              2. 節慶主題
            </label>
            <div className="relative">
              <select
                value={selectedHoliday}
                onChange={(e) => setSelectedHoliday(e.target.value)}
                className="w-full px-4 py-3 bg-cream-light border border-cream-dark rounded-2xl font-bold text-xs outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 text-bronze-text shadow-inner appearance-none cursor-pointer"
              >
                {HOLIDAYS.map((holiday) => (
                  <option key={holiday.id} value={holiday.id}>
                    {holiday.zh} ({holiday.en})
                  </option>
                ))}
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-bronze-light">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
              </div>
            </div>
            {selectedHoliday === 'custom' && (
              <input
                type="text"
                value={customHoliday}
                onChange={(e) => setCustomHoliday(e.target.value)}
                placeholder="輸入自訂節慶，例如：開幕誌慶、寶寶滿月"
                className="w-full px-4 py-3 mt-2 bg-cream-light border border-cream-dark rounded-2xl font-bold text-xs outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 text-bronze-text shadow-inner placeholder-bronze-light animate-in fade-in slide-in-from-top-1"
              />
            )}
          </div>

          <div className="space-y-3">
            <label className="text-xs font-black text-bronze-light uppercase tracking-widest pl-1">
              3. 風格
            </label>
            <div className="relative">
              <select
                value={selectedStyle}
                onChange={(e) => setSelectedStyle(e.target.value)}
                className="w-full px-4 py-3 bg-cream-light border border-cream-dark rounded-2xl font-bold text-xs outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 text-bronze-text shadow-inner appearance-none cursor-pointer"
              >
                {STYLES.map((style) => (
                  <option key={style.id} value={style.id}>
                    {style.zh}
                  </option>
                ))}
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-bronze-light">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-xs font-black text-bronze-light uppercase tracking-widest pl-1">
              4. 產生張數
            </label>
            <div className="flex gap-2">
              {[1, 2, 3, 4].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => setBatchSize(num)}
                  className={`flex-1 py-2 rounded-xl font-bold text-sm transition-all border ${batchSize === num
                    ? 'bg-primary text-white border-primary shadow-md'
                    : 'bg-cream-light border-cream-dark text-bronze-light hover:bg-cream-light/80'}`}
                >
                  {num}
                </button>
              ))}
            </div>
          </div>

          <div
            onClick={() => setAutoRemoveBg(!autoRemoveBg)}
            className={`flex items-center gap-3 p-3 rounded-2xl border transition-all cursor-pointer ${autoRemoveBg
              ? 'bg-primary/5 border-primary shadow-sm'
              : 'bg-transparent border-transparent hover:bg-black/5'}`}
          >
            <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors ${autoRemoveBg ? 'bg-primary border-primary' : 'border-bronze-light/50'}`}>
              {autoRemoveBg && <Check size={14} className="text-white" />}
            </div>
            <div className="flex-1">
              <div className={`text-sm font-bold ${autoRemoveBg ? 'text-primary' : 'text-bronze-text'}`}>
                自動去背
              </div>
              <div className="text-[10px] text-bronze-light">
                生成後自動移除外圈綠幕背景
              </div>
            </div>
          </div>

          <Button
            onClick={generateStickers}
            disabled={isGenerating || !uploadedImage}
            className="w-full h-16 mt-4 text-lg shadow-xl shadow-primary/20 bg-primary hover:bg-primary-hover active:scale-[0.99] transition-all rounded-2xl border-none"
          >
            {isGenerating ? (
              <><Loader2 className="mr-2 h-6 w-6 animate-spin" /> 生成中...</>
            ) : (
              <><Sparkles className="mr-2 h-6 w-6" /> 產生節慶貼圖</>
            )}
          </Button>

          {errorMessage && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
              <div className="bg-red-100 p-1.5 rounded-full mt-0.5">
                <X size={14} className="text-red-600" />
              </div>
              <div className="flex-1">
                <h4 className="text-xs font-bold text-red-700 mb-0.5">生成失敗</h4>
                <p className="text-xs text-red-600 leading-relaxed">{errorMessage}</p>
              </div>
            </div>
          )}
        </div>

        <div className="lg:col-span-2 space-y-6 bg-cream backdrop-blur-md border border-cream-dark shadow-sm rounded-[2rem] p-8">
          <div className="flex items-center justify-between border-b border-cream-dark/50 pb-4">
            <h2 className="text-sm font-black flex items-center gap-2 text-bronze-light uppercase tracking-widest">
              <Sparkles size={18} className="text-yellow-400" /> 生成結果
            </h2>
            {results.some((result) => result) && (
              <span className="text-[10px] font-bold bg-cream-light px-3 py-1 rounded-full text-bronze-light border border-cream-dark">
                {batchSize} Variations
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {Array.from({ length: batchSize }).map((_, index) => (
              <div key={index} className="aspect-square relative bg-white border border-cream-dark rounded-3xl overflow-hidden group hover:shadow-xl transition-all hover:-translate-y-1">
                {isGenerating && !results[index] && !generationErrors[index] ? (
                  <div className="flex flex-col items-center justify-center h-full gap-4 bg-cream-light/30">
                    <div className="relative w-12 h-12">
                      <div className="absolute inset-0 border-4 border-cream-dark rounded-full"></div>
                      <div className="absolute inset-0 border-4 border-primary rounded-full border-t-transparent animate-spin"></div>
                    </div>
                    <span className="text-xs font-bold text-bronze-light animate-pulse">生成中...</span>
                  </div>
                ) : results[index] ? (
                  <div className="relative w-full h-full p-4" style={{ backgroundImage: 'radial-gradient(#d6d3d1 1px, transparent 1px)', backgroundSize: '8px 8px' }}>
                    <img src={results[index]} alt={`Result ${index + 1}`} className="w-full h-full object-contain drop-shadow-lg" />
                    <div className="absolute inset-0 bg-bronze-text/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                      <a
                        href={results[index]}
                        download={`holiday-sticker-${index + 1}.png`}
                        className="bg-white text-primary px-6 py-3 rounded-2xl text-sm font-bold hover:bg-cream-light flex items-center gap-2 shadow-xl transform hover:scale-105 transition-all"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Download size={18} /> 下載
                      </a>
                    </div>
                  </div>
                ) : generationErrors[index] ? (
                  <div className="flex flex-col items-center justify-center h-full text-center p-4 bg-red-50/50">
                    <AlertCircle className="mx-auto mb-2 text-red-400" size={32} />
                    <span className="text-xs font-bold text-red-500">生成失敗</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-bronze-light/30 bg-cream-light/20">
                    <div className="bg-cream-dark/20 p-4 rounded-full mb-2">
                      <Sparkles size={24} />
                    </div>
                    <span className="text-xs font-bold">貼圖預留位 {index + 1}</span>
                  </div>
                )}
              </div>
            ))}
          </div>

          {!uploadedImage && !isGenerating && !results.some((result) => result) && (
            <div className="text-center py-12 px-6 rounded-3xl border-2 border-dashed border-cream-dark bg-cream-light/30">
              <h3 className="text-bronze text-sm font-black mb-2">先上傳一張人物照片</h3>
              <p className="text-xs text-bronze-light">
                這一頁會根據你的參考照、節慶主題和風格，生成多張可下載的節慶貼圖。
              </p>
            </div>
          )}
        </div>
      </div>

      {showGallery && (
        <GalleryPicker
          onSelect={handleGallerySelect}
          onClose={() => setShowGallery(false)}
        />
      )}
    </div>
  );
};

export default HolidayStickerTab;

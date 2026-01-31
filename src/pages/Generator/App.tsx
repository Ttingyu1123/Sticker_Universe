
import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Upload, Wand2, Download, Share2, Sparkles, Type,
  Palette, Image as ImageIcon, Zap, Feather, Cloud,
  Disc, Tv, Heart, Key, ExternalLink, Home, FileArchive,
  Scissors, AlertTriangle, ChevronRight, Check, Trash2, Settings, Star
} from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import JSZip from 'jszip';
import { saveStickerToDB } from '../../db';
import { Sticker, StickerTheme, THEMES } from './types';
import { generateSticker, generateCaptions, listAvailableModels } from './services/geminiService';
import { Button } from '../../components/ui/Button';
import { LanguageSwitcher } from '../../components/ui/LanguageSwitcher';




const getThemeIcon = (iconName: string) => {
  switch (iconName) {
    case 'Zap': return <Zap size={20} />;
    case 'Feather': return <Feather size={20} />;
    case 'Cloud': return <Cloud size={20} />;
    case 'Disc': return <Disc size={20} />;
    case 'Tv': return <Tv size={20} />;
    case 'Heart': return <Heart size={20} />;
    default: return <Sparkles size={20} />;
  }
};

const App: React.FC = () => {
  const { t } = useTranslation();
  const [apiKey, setApiKey] = useState<string>('');
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [tempKey, setTempKey] = useState('');

  const [currentTheme, setCurrentTheme] = useState<StickerTheme>(THEMES[0]);

  const STICKER_MODEL = 'gemini-3-pro-image-preview';
  const [image, setImage] = useState<string | null>(null);
  const [selectedPhrase, setSelectedPhrase] = useState<string>('');
  const [customPhrase, setCustomPhrase] = useState<string>('');
  const [selectedStyleId, setSelectedStyleId] = useState<string>(THEMES[0].styles[0].id);
  const [includeText, setIncludeText] = useState<boolean>(false);
  const [autoRemoveBg, setAutoRemoveBg] = useState<boolean>(true);
  const [batchSize, setBatchSize] = useState<number>(1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isAnalyzingCaption, setIsAnalyzingCaption] = useState(false);
  const [generatedCaptions, setGeneratedCaptions] = useState<string[]>([]);
  const [captionImage, setCaptionImage] = useState<string | null>(null);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [stickers, setStickers] = useState<Sticker[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isZipping, setIsZipping] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // AI Caption State
  const [mode, setMode] = useState<'text' | 'image-caption'>('text');

  // Update selected style when theme changes
  useEffect(() => {
    setSelectedStyleId(currentTheme.styles[0].id);
    setSelectedPhrase('');
    setCustomPhrase('');
  }, [currentTheme]);

  useEffect(() => {
    const storedKey = localStorage.getItem('gemini_api_key');
    if (storedKey) {
      setApiKey(storedKey);
    } else {
      setShowKeyModal(true);
    }
  }, []);

  const handleSaveKey = () => {
    if (!tempKey.trim()) {
      setError("請輸入有效的 API Key");
      return;
    }
    setApiKey(tempKey.trim());
    localStorage.setItem('gemini_api_key', tempKey.trim());
    setShowKeyModal(false);
    setError(null);
  };

  const handleClearKey = () => {
    setApiKey('');
    localStorage.removeItem('gemini_api_key');
    setTempKey('');
    setShowKeyModal(true);
  };



  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
        setError(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
        setError(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCaptionImageSelect = async (file: File) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64 = e.target?.result as string;
      setCaptionImage(base64);
      setGeneratedCaptions([]);

      if (!apiKey) {
        setShowKeyModal(true);
        return;
      }

      setIsAnalyzingCaption(true);
      try {
        const captions = await generateCaptions(apiKey, base64);
        setGeneratedCaptions(captions);
      } catch (err: any) {
        console.error(err);
        let errorMsg = `Failed: ${err.message || 'Unknown error'}`;

        // Try to list available models to help debug
        if (err.message?.includes('404') || err.message?.includes('not found')) {
          try {
            const models = await listAvailableModels(apiKey);
            const modelNames = models.map(m => m.split('/').pop()).join(', ');
            errorMsg += ` | Available models: ${modelNames}`;
          } catch (mdlErr) {
            console.error("Could not list models", mdlErr);
          }
        }

        if (err.message === "KEY_NOT_FOUND") {
          setError(t('generator.apiKey.invalid'));
          setShowKeyModal(true);
        } else {
          setError(errorMsg);
          console.error("Full Error:", err);
        }
      } finally {
        setIsAnalyzingCaption(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleCaptionSelect = (caption: string) => {
    setSelectedPhrase(caption);
    setCustomPhrase('');
    setBatchSize(1);

    // Use the caption image as the source image for generation
    if (captionImage) {
      setImage(captionImage);
    }

    // Automatically scroll to Style section
    const styleSection = document.getElementById('style-section');
    if (styleSection) {
      styleSection.scrollIntoView({ behavior: 'smooth' });
    } else {
      window.scrollTo({ top: 600, behavior: 'smooth' });
    }
  };

  /**
   * SMART CHROMA KEY REMOVAL
   * Optimized for #00FF00 background. 
   * Uses Flood Fill to preserve white eyes and internal details.
   */
  const smartRemoveBackground = (base64: string): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        const width = img.width;
        const height = img.height;
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
        ctx.drawImage(img, 0, 0);

        const imageData = ctx.getImageData(0, 0, width, height);
        const data = imageData.data;
        const isBg = new Uint8Array(width * height);

        // 1. Detect if the background is actually green
        const corners = [[0, 0], [width - 1, 0], [0, height - 1], [width - 1, height - 1]];

        // 2. Flood Fill starting from corners
        const queue: [number, number][] = [...corners as [number, number][]];
        const visited = new Uint8Array(width * height);

        const isGreen = (r: number, g: number, b: number) => {
          return g > 80 && g > r * 1.15 && g > b * 1.15;
        };

        while (queue.length > 0) {
          const [x, y] = queue.shift()!;
          const idx = y * width + x;
          if (visited[idx]) continue;
          visited[idx] = 1;

          const i = idx * 4;
          if (isGreen(data[i], data[i + 1], data[i + 2])) {
            isBg[idx] = 1;
            // Scan neighbors
            if (x > 0) queue.push([x - 1, y]);
            if (x < width - 1) queue.push([x + 1, y]);
            if (y > 0) queue.push([x, y - 1]);
            if (y < height - 1) queue.push([x, y + 1]);
          }
        }

        // 3. Dilation (Halo Cleanup)
        const expandedBg = new Uint8Array(isBg);
        for (let y = 1; y < height - 1; y++) {
          for (let x = 1; x < width - 1; x++) {
            const idx = y * width + x;
            if (isBg[idx] === 0) {
              if (isBg[idx - 1] || isBg[idx + 1] || isBg[idx - width] || isBg[idx + width]) {
                expandedBg[idx] = 1;
              }
            }
          }
        }

        // 4. Final Alpha Application
        for (let i = 0; i < width * height; i++) {
          if (expandedBg[i]) {
            data[i * 4 + 3] = 0;
          }
        }

        ctx.putImageData(imageData, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      };
      img.src = base64;
    });
  };

  const handleGenerate = async () => {
    if (!apiKey) {
      setShowKeyModal(true);
      return;
    }
    if (!image) {
      setError("請先上傳照片！");
      return;
    }

    const singlePhrase = customPhrase || selectedPhrase;
    if (batchSize === 1 && !singlePhrase) {
      setError("請選擇或輸入一個慣用語！");
      return;
    }

    setIsGenerating(true);
    setError(null);
    setProgress({ current: 0, total: batchSize });

    const style = currentTheme.styles.find(s => s.id === selectedStyleId) || currentTheme.styles[0];

    try {
      for (let i = 0; i < batchSize; i++) {
        let phraseToUse = '';
        if (batchSize === 1) {
          phraseToUse = singlePhrase;
        } else {
          const phrases = currentTheme.phrases;
          phraseToUse = i < phrases.length ? phrases[i].text : phrases[i % phrases.length].text;
        }

        let resultImageUrl = await generateSticker(
          apiKey,
          image,
          phraseToUse,
          STICKER_MODEL,
          style.promptSnippet,
          includeText
        );

        if (autoRemoveBg) {
          resultImageUrl = await smartRemoveBackground(resultImageUrl);
        }

        const newSticker: Sticker = {
          id: `${Date.now()}-${i}`,
          imageUrl: resultImageUrl,
          phrase: phraseToUse,
          timestamp: Date.now()
        };

        setStickers(prev => [newSticker, ...prev]);
        setProgress(prev => ({ ...prev, current: i + 1 }));

        // Auto-save to gallery
        saveStickerToDB(newSticker).catch(err => console.error("Failed to auto-save:", err));
      }
    } catch (err: any) {
      console.error(err);
      if (err.message === "KEY_NOT_FOUND" || err.message?.includes("403") || err.message?.includes("401")) {
        setError("API Key 無效或過期，請重新輸入。");
        setShowKeyModal(true);
      } else {
        setError(`生成失敗，錯誤訊息: ${err.message || '未知錯誤'}`);
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleIndividualBgRemoval = async (stickerId: string) => {
    const stickerToProcess = stickers.find(s => s.id === stickerId);
    if (!stickerToProcess) return;

    setIsGenerating(true); // Use isGenerating for individual removal feedback
    setError(null);

    try {
      const processedImageUrl = await smartRemoveBackground(stickerToProcess.imageUrl);

      const updatedSticker = { ...stickerToProcess, imageUrl: processedImageUrl };
      setStickers(prev => prev.map(s => s.id === stickerId ? updatedSticker : s));

      // Update in DB
      saveStickerToDB(updatedSticker).catch(err => console.error("Failed to update sticker in DB:", err));
    } catch (err: any) {
      console.error("Failed to remove background:", err);
      setError(`背景移除失敗: ${err.message || '未知錯誤'}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadImage = (imageUrl: string, filename: string) => {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `${filename.replace(/\s/g, '_')}_sticker.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadAllAsZip = async () => {
    if (stickers.length === 0) {
      setError("沒有貼圖可以下載。");
      return;
    }

    setIsZipping(true);
    const zip = new JSZip();
    const folder = zip.folder("stickers");

    for (const sticker of stickers) {
      try {
        const response = await fetch(sticker.imageUrl);
        const blob = await response.blob();
        folder?.file(`${sticker.phrase.replace(/\s/g, '_')}_${sticker.id}.png`, blob);
      } catch (error) {
        console.error(`Failed to add sticker ${sticker.id} to zip: `, error);
      }
    }

    zip.generateAsync({ type: "blob" })
      .then((content) => {
        const link = document.createElement('a');
        link.href = URL.createObjectURL(content);
        link.download = "stickers.zip";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      })
      .catch(err => {
        console.error("Failed to generate zip:", err);
        setError("壓縮檔案失敗。");
      })
      .finally(() => {
        setIsZipping(false);
      });
  };

  return (
    <div className="min-h-screen pb-20 select-none font-sans text-bronze-text bg-background">
      {/* Key Modal */}
      {showKeyModal && (
        <div className="fixed inset-0 bg-bronze-text/20 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl p-8 shadow-2xl border border-cream-dark w-full max-w-md space-y-6 animate-in zoom-in-95 duration-300">
            <div className="text-center">
              <Key size={32} className="text-primary mx-auto mb-4" />
              <h3 className="text-xl font-black text-bronze mb-2">{t('generator.apiKey.title')}</h3>
              <p className="text-sm text-bronze-light">
                {t('generator.apiKey.desc')}
              </p>
            </div>
            <input
              type="password"
              value={tempKey}
              onChange={(e) => setTempKey(e.target.value)}
              placeholder={t('generator.apiKey.placeholder')}
              className="w-full px-4 py-3 bg-cream-light border border-cream-dark rounded-xl font-bold text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 text-bronze-text shadow-inner placeholder-bronze-light/50"
            />
            {error && <p className="text-secondary text-xs font-bold text-center">{error}</p>}
            <div className="flex gap-3">
              <Button onClick={handleSaveKey} className="w-full bg-primary hover:bg-primary-hover text-white shadow-lg shadow-primary/20">
                {t('generator.apiKey.save')}
              </Button>
              {apiKey && (
                <Button onClick={handleClearKey} className="w-full bg-secondary hover:bg-secondary-hover text-white shadow-lg shadow-secondary/20">
                  {t('generator.apiKey.clear')}
                </Button>
              )}
            </div>
            <a
              href="https://ai.google.dev/gemini-api/docs/get-started/web"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-bold text-violet-500 hover:text-violet-600 flex items-center justify-center gap-1.5 transition-colors"
            >
              {t('generator.apiKey.get')} <ExternalLink size={12} />
            </a>
          </div>
        </div>
      )}



      <main className="pt-6 pb-12 px-6 max-w-5xl mx-auto space-y-8 relative z-0">


        {/* Theme Selector */}
        <div className="flex overflow-x-auto gap-4 pb-2 scrollbar-hide snap-x">
          {THEMES.map(theme => (
            <button
              key={theme.id}
              onClick={() => setCurrentTheme(theme)}
              className={`flex-shrink-0 snap-start flex items-center gap-4 p-4 pr-6 rounded-[2rem] border transition-all cursor-pointer ${currentTheme.id === theme.id ? `bg-white border-${theme.colors.primary.split('-')[1]}-500 shadow-lg` : 'bg-white/40 border-cream-dark hover:bg-white'}`}
            >
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-md ${theme.id === currentTheme.id ? `bg-gradient-to-br ${theme.colors.secondary} to-bronze-light` : 'bg-cream-dark'}`}>
                {getThemeIcon(theme.icon)}
              </div>
              <div className="text-left">
                <h3 className={`text-sm font-black ${currentTheme.id === theme.id ? theme.colors.primary : 'text-bronze-light'}`}>{t(`generator.themes.${theme.id}.name`)}</h3>
                <p className="text-[10px] font-bold text-bronze-light/70">{theme.styles.length} Styles • {theme.phrases.length} Phrases</p>
              </div>
            </button>
          ))}
        </div>

        {/* Upload Section */}
        <section className="bg-white/40 backdrop-blur-md border border-cream-dark shadow-sm rounded-[2rem] p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-sm font-black flex items-center gap-2 text-bronze-light uppercase tracking-widest"><ImageIcon size={18} className="text-primary" /> {t('generator.phases.upload')}</h2>
            {image && <button onClick={() => setImage(null)} className="text-[10px] font-bold text-secondary hover:text-secondary-hover flex items-center gap-1 bg-secondary/10 px-3 py-1.5 rounded-lg transition-colors"><Trash2 size={12} /> {t('generator.upload.remove')}</button>}
          </div>

          {!image ? (
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`group border-3 border-dashed rounded-[2rem] p-12 flex flex-col items-center justify-center cursor-pointer transition-all duration-300 min-h-[300px] ${isDragging ? 'drag-active border-primary bg-primary/10' : 'border-cream-dark bg-cream-light/50 hover:border-primary/50 hover:bg-white/60'}`}
            >
              <input ref={fileInputRef} type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
              <div className="bg-white p-6 rounded-3xl group-hover:scale-110 transition-transform duration-500 shadow-lg shadow-primary/10 border border-cream-light text-primary mb-6">
                <Upload size={32} />
              </div>
              <h3 className="text-lg font-black text-bronze tracking-tight">{t('generator.upload.dragDrop')}</h3>
              <p className="mt-2 text-bronze-light font-bold text-xs tracking-wide uppercase">{t('generator.upload.support')}</p>
            </div>
          ) : (
            <div className="relative rounded-[2rem] overflow-hidden border border-cream-dark bg-cream-light/50 shadow-inner max-h-[500px] flex items-center justify-center p-4">
              <img src={image} alt="Preview" className="max-w-full max-h-full object-contain rounded-xl drop-shadow-xl" />
            </div>
          )}
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Style Selection */}
          <section id="style-section" className="bg-white/40 backdrop-blur-md border border-cream-dark shadow-sm rounded-[2rem] p-8 space-y-6">
            <h2 className="text-sm font-black flex items-center gap-2 text-bronze-light uppercase tracking-widest"><Palette size={18} className={currentTheme.id === 'taiwanese' ? 'text-secondary' : 'text-primary'} /> {t('generator.phases.style')}</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {currentTheme.styles.map((style) => (
                <button
                  key={style.id}
                  onClick={() => setSelectedStyleId(style.id)}
                  className={`p-4 rounded-2xl border transition-all flex flex-col items-center gap-3 text-center group ${selectedStyleId === style.id ? `bg-white ${currentTheme.id === 'taiwanese' ? 'border-secondary' : 'border-primary'} shadow-inner` : 'bg-white/40 border-cream-dark hover:bg-white'}`}
                >
                  <div className={`p-2.5 rounded-full transition-colors ${selectedStyleId === style.id ? `${currentTheme.id === 'taiwanese' ? 'bg-secondary' : 'bg-primary'} text-white shadow-md` : 'bg-cream-dark text-bronze-light'}`}>
                    <Palette size={16} />
                  </div>
                  <span className={`text-xs font-black ${selectedStyleId === style.id ? (currentTheme.id === 'taiwanese' ? 'text-secondary' : 'text-primary') : 'text-bronze-light'}`}>{t(`generator.themes.${currentTheme.id}.styles.${style.id}.name`)}</span>
                </button>
              ))}
            </div>
          </section>

          {/* Phrase Selection */}
          <section className="bg-white/40 backdrop-blur-md border border-cream-dark shadow-sm rounded-[2rem] p-8 space-y-6">
            <h2 className="text-sm font-black flex items-center gap-2 text-bronze-light uppercase tracking-widest"><Type size={18} className={currentTheme.id === 'taiwanese' ? 'text-primary' : 'text-orange-500'} /> {t('generator.phases.phrase')}</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {currentTheme.phrases.map((phrase) => (
                <button
                  key={phrase.text}
                  onClick={() => { setSelectedPhrase(phrase.text); setCustomPhrase(''); setBatchSize(1); }}
                  className={`py-2 px-3 rounded-xl border text-[10px] font-bold transition-all ${selectedPhrase === phrase.text && batchSize === 1 ? `${currentTheme.id === 'taiwanese' ? 'bg-primary border-primary' : 'bg-orange-400 border-orange-400'} text-white shadow-md` : 'bg-white border-cream-dark text-bronze-text hover:text-primary'}`}
                >
                  {t(`generator.themes.${currentTheme.id}.phrases.${phrase.text}`)}
                </button>
              ))}
            </div>
            <input
              type="text"
              placeholder={t('generator.phrase.customPlaceholder')}
              value={customPhrase}
              onChange={(e) => { setCustomPhrase(e.target.value); setSelectedPhrase(''); setBatchSize(1); }}
              className="w-full px-4 py-3 bg-cream-light border border-cream-dark rounded-2xl font-bold text-xs outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 text-bronze-text shadow-inner placeholder-bronze-light"
            />
          </section>
        </div>

        {/* Generate Options & Results */}
        <section className="bg-white/40 backdrop-blur-md border border-cream-dark shadow-sm rounded-[2rem] p-8 space-y-6">
          {/* Settings and Generate Button */}
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-black flex items-center gap-2 text-bronze-light uppercase tracking-widest"><Settings size={18} className="text-bronze-light" /> {t('generator.phases.settings')}</h2>
            <span className="text-[9px] font-bold bg-cream-light px-3 py-1 rounded-full text-bronze-light border border-cream-dark">{batchSize} {t('generator.settings.batchSize')}</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-3">
              <label className="text-[10px] font-bold text-bronze-light uppercase tracking-widest">{t('generator.settings.batchSize')}</label>
              <div className="flex flex-wrap gap-2">
                {[1, 8, 16, 24, 40].map((num) => (
                  <button
                    key={num}
                    onClick={() => setBatchSize(num)}
                    className={`w-10 h-10 rounded-xl font-black text-xs border transition-all flex items-center justify-center ${batchSize === num ? 'bg-bronze-text text-white border-bronze-text shadow-lg' : 'bg-white border-cream-dark text-bronze-light hover:border-bronze-text'}`}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-bold text-bronze-light uppercase tracking-widest">{t('generator.settings.textOverlay')}</label>
              <div className="flex bg-cream-light p-1 rounded-xl border border-cream-dark w-fit">
                <button onClick={() => setIncludeText(true)} className={`px-4 py-2 rounded-lg text-[10px] font-bold transition-all ${includeText ? 'bg-white shadow-sm text-primary' : 'text-bronze-light hover:text-bronze-text'}`}>{t('generator.settings.showText')}</button>
                <button onClick={() => setIncludeText(false)} className={`px-4 py-2 rounded-lg text-[10px] font-bold transition-all ${!includeText ? 'bg-white shadow-sm text-primary' : 'text-bronze-light hover:text-bronze-text'}`}>{t('generator.settings.noText')}</button>
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-bold text-bronze-light uppercase tracking-widest">{t('generator.settings.postProcessing')}</label>
              <div onClick={() => setAutoRemoveBg(!autoRemoveBg)} className={`flex items-center justify-between p-3 rounded-2xl border cursor-pointer transition-all ${autoRemoveBg ? 'bg-white border-primary/30 shadow-sm ring-1 ring-primary/10' : 'bg-cream-light/50 border-cream-dark opacity-70'}`}>
                <div className="flex items-center gap-3">
                  <Scissors size={16} className={autoRemoveBg ? 'text-primary' : 'text-bronze-light'} />
                  <span className="text-xs font-bold text-bronze-text">{t('generator.settings.smartRemoveBg')}</span>
                </div>
                <div className={`w-8 h-5 rounded-full relative transition-colors ${autoRemoveBg ? 'bg-primary' : 'bg-cream-dark'}`}>
                  <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all shadow-sm ${autoRemoveBg ? 'right-1' : 'left-1'}`} />
                </div>
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-secondary/10 text-secondary p-4 rounded-2xl border border-secondary/20 flex items-center justify-center gap-3 animate-in slide-in-from-top-2">
              <AlertTriangle size={18} />
              <span className="text-xs font-bold">{error}</span>
            </div>
          )}

          <Button onClick={handleGenerate} disabled={!image || (batchSize === 1 && !selectedPhrase && !customPhrase)} className="w-full text-lg h-16 shadow-xl shadow-primary/20 bg-primary hover:bg-primary-hover active:scale-[0.99] transition-all rounded-2xl border-none">
            <Wand2 size={24} className="mr-2" /> {isGenerating ? t('generator.action.generating') : t('generator.action.generate')}
          </Button>
        </section>

        {/* Results Gallery */}
        {stickers.length > 0 && (
          <section className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-black flex items-center gap-2 text-bronze-light uppercase tracking-widest"><Star size={18} className="text-yellow-400" /> {t('generator.action.results')} ({stickers.length})</h2>
              <button onClick={downloadAllAsZip} disabled={isZipping} className="bg-white hover:bg-cream-light text-bronze-text border border-cream-dark px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-sm">
                <FileArchive size={14} /> {t('generator.action.downloadZip')}
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {stickers.map((sticker) => (
                <div key={sticker.id} className="bg-white/40 backdrop-blur-md border border-cream-dark p-3 rounded-3xl group hover:shadow-xl transition-all animate-in zoom-in-95 duration-300 hover:-translate-y-1">
                  <div className="aspect-square rounded-2xl bg-cream-light/50 overflow-hidden relative border border-cream-dark/50" style={{ backgroundImage: 'radial-gradient(#d6d3d1 1px, transparent 1px)', backgroundSize: '8px 8px' }}>
                    <img src={sticker.imageUrl} alt={sticker.phrase} className="w-full h-full object-contain p-2" />
                    <div className="absolute inset-0 bg-bronze-text/10 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2 items-center justify-center backdrop-blur-[2px]">
                      <button onClick={() => downloadImage(sticker.imageUrl, sticker.phrase)} className="bg-white p-2.5 rounded-full text-primary shadow-lg hover:scale-110 transition-transform"><Download size={18} /></button>
                      <button onClick={() => handleIndividualBgRemoval(sticker.id)} className="bg-white p-2.5 rounded-full text-secondary shadow-lg hover:scale-110 transition-transform"><Scissors size={18} /></button>
                    </div>
                  </div>
                  <div className="mt-3 text-center font-black text-bronze-text tracking-wider text-xs truncate opacity-80 px-2">{sticker.phrase}</div>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>

      {/* Footer and Loading Overlay */}
      {
        isGenerating && (
          <div className="fixed inset-0 bg-white/80 backdrop-blur-lg z-[60] flex flex-col items-center justify-center p-6 text-center animate-in fade-in">
            <div className="relative w-24 h-24 mb-6">
              <div className="absolute inset-0 border-4 border-cream-dark rounded-full"></div>
              <div className="absolute inset-0 border-4 border-primary rounded-full border-t-transparent animate-spin"></div>
              <div className="absolute inset-0 flex items-center justify-center text-primary">
                <Sparkles size={32} className="animate-pulse" />
              </div>
            </div>
            <h3 className="text-xl font-black text-bronze mb-2">{batchSize > 1 ? `${t('generator.action.batchProcessing')} (${progress.current} /${batchSize})` : t('generator.action.generatingArt')}</h3 >
            <p className="text-bronze-light font-bold text-xs tracking-wide uppercase">{t('generator.action.applyingMagic')}</p>
            {
              batchSize > 1 && (
                <div className="w-64 bg-cream-dark h-1.5 rounded-full mt-6 overflow-hidden">
                  <div className="bg-gradient-to-r from-primary to-secondary h-full transition-all duration-300" style={{ width: `${(progress.current / batchSize) * 100}%` }}></div>
                </div>
              )
            }
          </div >
        )
      }
    </div >
  );
};

export default App;

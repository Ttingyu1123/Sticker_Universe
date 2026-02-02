import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Calendar, Sparkles, Key, FileArchive, Download, Eye, Scissors, Star
} from 'lucide-react';
import JSZip from 'jszip';
import { saveStickerToDB } from '../../db';
import { Sticker } from './types';
import { Button } from '../../components/ui/Button';
import { LanguageSwitcher } from '../../components/ui/LanguageSwitcher';
import ImageGeneratorTab from './components/ImageGeneratorTab';
import HolidayStickerTab from './components/HolidayStickerTab';
import StyleStickerTab from './components/StyleStickerTab';
import CinematicPosterTab from './components/CinematicPosterTab';

const App: React.FC = () => {
  const { t } = useTranslation();
  const [apiKey, setApiKey] = useState<string>('');
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [tempKey, setTempKey] = useState('');

  // Tab State
  const [activeTab, setActiveTab] = useState<'sticker' | 'holiday' | 'image-gen' | 'cinematic'>('sticker');

  // Shared/Legacy State (Used by Image Generator Results mainly)
  const [stickers, setStickers] = useState<Sticker[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isZipping, setIsZipping] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // Initialize API Key
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

  const handleOpenKeyModal = () => {
    setTempKey(apiKey);
    setShowKeyModal(true);
  };

  /**
  * SMART CHROMA KEY REMOVAL
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

        const corners = [[0, 0], [width - 1, 0], [0, height - 1], [width - 1, height - 1]];
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
            if (isBg[idx] === 0) {
              if (isBg[idx - 1] || isBg[idx + 1] || isBg[idx - width] || isBg[idx + width]) {
                expandedBg[idx] = 1;
              }
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
      };
      img.src = base64;
    });
  };

  const handleIndividualBgRemoval = async (stickerId: string) => {
    const stickerToProcess = stickers.find(s => s.id === stickerId);
    if (!stickerToProcess) return;

    try {
      const processedImageUrl = await smartRemoveBackground(stickerToProcess.imageUrl);
      const updatedSticker = { ...stickerToProcess, imageUrl: processedImageUrl };
      setStickers(prev => prev.map(s => s.id === stickerId ? updatedSticker : s));
      saveStickerToDB(updatedSticker).catch(console.error);
    } catch (err: any) {
      console.error("Failed to remove background:", err);
    }
  };

  const downloadImage = (imageUrl: string, filename: string) => {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `${filename.replace(/\\s/g, '_')}_sticker.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadAllAsZip = async () => {
    if (stickers.length === 0) return;

    setIsZipping(true);
    const zip = new JSZip();
    const folder = zip.folder("stickers");

    for (const sticker of stickers) {
      try {
        const response = await fetch(sticker.imageUrl);
        const blob = await response.blob();
        folder?.file(`${sticker.phrase.replace(/\\s/g, '_')}_${sticker.id}.png`, blob);
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

  // Used by ImageGeneratorTab
  const handleImageGenSuccess = (imageUrl: string, prompt: string) => {
    // Ensure unique ID even if called rapidly in batch
    const uniqueId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newSticker: Sticker = {
      id: uniqueId,
      imageUrl: imageUrl,
      phrase: prompt,
      timestamp: Date.now()
    };
    setStickers(prev => [newSticker, ...prev]);
    saveStickerToDB(newSticker).catch(console.error);

    // Auto scroll to results?
    // window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
  };

  const getActiveTabEmoji = () => {
    switch (activeTab) {
      case 'sticker': return '🎨';
      case 'holiday': return '🎉';
      case 'image-gen': return '✨';
      case 'cinematic': return '🎬';
    }
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
              <p className="text-sm text-bronze-light">{t('generator.apiKey.desc')}</p>
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
                <Button onClick={() => setShowKeyModal(false)} className="bg-cream-light text-bronze-text hover:bg-cream-dark/20 border border-cream-dark">
                  {t('generator.action.cancel')}
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-white/80 backdrop-blur-md border-b border-cream-dark/50 shadow-sm h-16 transition-all duration-300">
        <div className="container mx-auto px-4 h-full flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white shadow-lg shadow-primary/20">
              <span className="text-xl">{getActiveTabEmoji()}</span>
            </div>
            <h1 className="text-lg font-black text-bronze tracking-tight hidden sm:block">
              {activeTab === 'sticker' ? t('generator.title') : activeTab === 'holiday' ? '節日貼圖生成器' : activeTab === 'cinematic' ? t('app.cinematic') : 'AI 創意圖片生成'}
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <a href="/" className="p-2 rounded-xl hover:bg-cream-light text-bronze-light hover:text-primary transition-colors">
              <span className="sr-only">Home</span>
              {/* Home Icon */}
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>
            </a>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 pt-24 max-w-5xl space-y-8">

        {/* Tab Navigation */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white/60 backdrop-blur rounded-[2rem] p-2 border border-cream-dark shadow-sm">
          <div className="flex w-full sm:w-auto p-1 bg-cream-light/50 rounded-2xl">
            <button
              onClick={() => setActiveTab('sticker')}
              className={`flex-1 sm:flex-none px-6 py-2.5 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 ${activeTab === 'sticker' ? 'bg-primary text-white shadow-md' : 'text-bronze-light hover:text-bronze-text hover:bg-white/50'}`}
            >
              <Sparkles size={14} /> 風格貼圖
            </button>
            <button
              onClick={() => setActiveTab('holiday')}
              className={`flex-1 sm:flex-none px-6 py-2.5 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 ${activeTab === 'holiday' ? 'bg-amber-600 text-white shadow-md' : 'text-bronze-light hover:text-bronze-text hover:bg-white/50'}`}
            >
              <Calendar size={14} /> 節日貼圖
            </button>
            <button
              onClick={() => setActiveTab('cinematic')}
              className={`flex-1 sm:flex-none px-6 py-2.5 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 ${activeTab === 'cinematic' ? 'bg-pink-500 text-white shadow-md' : 'text-bronze-light hover:text-bronze-text hover:bg-white/50'}`}
            >
              <Sparkles size={14} /> {t('app.cinematic')}
            </button>
            <button
              onClick={() => setActiveTab('image-gen')}
              className={`flex-1 sm:flex-none px-6 py-2.5 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 ${activeTab === 'image-gen' ? 'bg-secondary text-white shadow-md' : 'text-bronze-light hover:text-bronze-text hover:bg-white/50'}`}
            >
              <Sparkles size={14} /> AI圖片生成
            </button>
          </div>

          <button
            onClick={handleOpenKeyModal}
            className={`w-full sm:w-auto p-2.5 rounded-xl border transition-all shadow-sm flex items-center justify-center gap-2 ${apiKey ? 'bg-white border-cream-dark text-bronze-text hover:border-primary/50' : 'bg-red-50 border-red-200 text-red-500 animate-pulse'}`}
            title={t('generator.apiKey.change')}
          >
            <Key size={16} className={apiKey ? "text-primary" : "text-red-500"} />
            <span className="text-xs font-bold">{apiKey ? 'API Key' : 'Set API Key'}</span>
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'sticker' ? (
          <StyleStickerTab
            apiKey={apiKey}
            onError={(msg) => setError(msg)}
            onNeedApiKey={() => setShowKeyModal(true)}
          />
        ) : activeTab === 'holiday' ? (
          <HolidayStickerTab
            apiKey={apiKey}
            onError={(msg) => setError(msg)}
            onSuccess={handleImageGenSuccess}
          />
        ) : activeTab === 'cinematic' ? (
          <CinematicPosterTab
            apiKey={apiKey}
            onError={(msg) => setError(msg)}
            onNeedApiKey={() => setShowKeyModal(true)}
            onSuccess={handleImageGenSuccess}
          />
        ) : (
          <ImageGeneratorTab
            apiKey={apiKey}
            onSuccess={handleImageGenSuccess}
            onError={(msg) => setError(msg)}
          />
        )}

        {/* Global Results Gallery (Only for ImageGen) */}
        {activeTab === 'image-gen' && stickers.length > 0 && (
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
                      <button onClick={() => setPreviewImage(sticker.imageUrl)} className="bg-white p-2.5 rounded-full text-bronze-text shadow-lg hover:scale-110 transition-transform" title={t('generator.action.preview')}><Eye size={18} /></button>
                      <button onClick={() => downloadImage(sticker.imageUrl, sticker.phrase)} className="bg-white p-2.5 rounded-full text-primary shadow-lg hover:scale-110 transition-transform" title={t('generator.action.download')}><Download size={18} /></button>
                      <button onClick={() => handleIndividualBgRemoval(sticker.id)} className="bg-white p-2.5 rounded-full text-secondary shadow-lg hover:scale-110 transition-transform" title={t('generator.action.removeBg')}><Scissors size={18} /></button>
                    </div>
                  </div>
                  <div className="mt-3 text-center font-black text-bronze-text tracking-wider text-xs truncate opacity-80 px-2">{sticker.phrase}</div>
                </div>
              ))}
            </div>
          </section>
        )}

      </main>

      {/* Image Preview Modal */}
      {previewImage && (
        <div
          className="fixed inset-0 z-[110] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in"
          onClick={() => setPreviewImage(null)}
        >
          <div className="relative max-w-4xl w-full max-h-[90vh] flex items-center justify-center">
            <img
              src={previewImage}
              alt="Preview"
              className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
            <button
              className="absolute -top-12 right-0 text-white hover:text-gray-300 transition-colors"
              onClick={() => setPreviewImage(null)}
            >
              <span className="text-xl font-bold">✕ 關閉</span>
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

export default App;

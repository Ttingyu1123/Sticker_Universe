import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import ReactMarkdown from 'react-markdown';
import { Sparkles, Wand2, BookOpen, Shuffle, Lock, Unlock } from 'lucide-react';
import {
  CHARACTER_COMMON_TAGS,
  CHARACTER_DEFAULT_STATE,
  CHARACTER_WORLD_DATA,
  CharacterCategoryKey,
  CharacterPromptState,
  CharacterWorldMode,
  generateCharacterMatrix,
  generateCharacterStory,
  optimizeCharacterPrompt,
} from '../../../features/character-creator-core';

interface CharacterCreateTabProps {
  apiKey: string;
  onError: (message: string) => void;
  onNeedApiKey: () => void;
}

const CATEGORY_KEYS: CharacterCategoryKey[] = [
  'character',
  'pose',
  'outfit',
  'env',
  'color',
  'shot',
  'style',
  'light',
  'rare',
];

const WORLD_MODES: CharacterWorldMode[] = [
  'fantasy',
  'modern',
  'scifi',
  'historical',
  'horror',
  'oriental',
];

const CharacterCreateTab: React.FC<CharacterCreateTabProps> = ({ apiKey, onError, onNeedApiKey }) => {
  const { t, i18n } = useTranslation();
  const lang = i18n.language === 'zh-TW' ? 'zh-TW' : 'en';

  const [worldMode, setWorldMode] = useState<CharacterWorldMode>('fantasy');
  const [activeCategory, setActiveCategory] = useState<CharacterCategoryKey>('character');
  const [promptState, setPromptState] = useState<CharacterPromptState>(CHARACTER_DEFAULT_STATE);
  const [ideaInput, setIdeaInput] = useState('');
  const [optimizedPrompt, setOptimizedPrompt] = useState('');
  const [story, setStory] = useState('');
  const [loadingAction, setLoadingAction] = useState<'analyze' | 'optimize' | 'story' | null>(null);
  const [optStyle, setOptStyle] = useState<'artistic' | 'photo' | 'anime'>('artistic');
  const [lockedKeys, setLockedKeys] = useState<Set<CharacterCategoryKey>>(new Set());

  const categoryTags = useMemo(() => {
    if (['shot', 'style', 'light', 'color'].includes(activeCategory)) {
      return CHARACTER_COMMON_TAGS[activeCategory as 'shot' | 'style' | 'light' | 'color'];
    }
    return CHARACTER_WORLD_DATA[worldMode][activeCategory as 'character' | 'pose' | 'outfit' | 'env' | 'rare'];
  }, [activeCategory, worldMode]);

  const rawPrompt = useMemo(() => {
    const core = CATEGORY_KEYS
      .map((key) => promptState[key])
      .filter((v) => v && v.trim().length > 0)
      .join(', ');
    if (!core) return '';
    if (!promptState.negative.trim()) return core;
    return `${core}. Negative prompt: ${promptState.negative.trim()}`;
  }, [promptState]);

  const displayPrompt = optimizedPrompt || rawPrompt;

  const upsertTag = (tagEn: string) => {
    setPromptState((prev) => {
      const current = prev[activeCategory]
        .split(',')
        .map((x) => x.trim())
        .filter(Boolean);
      const existed = current.some((x) => x.toLowerCase() === tagEn.toLowerCase());
      const next = existed
        ? current.filter((x) => x.toLowerCase() !== tagEn.toLowerCase())
        : [...current, tagEn];
      return { ...prev, [activeCategory]: next.join(', ') };
    });
    setOptimizedPrompt('');
  };

  const randomize = () => {
    const next = { ...promptState };
    for (const key of CATEGORY_KEYS) {
      if (lockedKeys.has(key)) continue;
      const pool = ['shot', 'style', 'light', 'color'].includes(key)
        ? CHARACTER_COMMON_TAGS[key as 'shot' | 'style' | 'light' | 'color']
        : CHARACTER_WORLD_DATA[worldMode][key as 'character' | 'pose' | 'outfit' | 'env' | 'rare'];
      const pick = pool[Math.floor(Math.random() * pool.length)];
      next[key] = pick?.en || '';
    }
    setPromptState(next);
    setOptimizedPrompt('');
  };

  const ensureApiKey = () => {
    if (apiKey) return true;
    onNeedApiKey();
    onError(t('generator.characterCreate.messages.needApiKey'));
    return false;
  };

  const analyzeIdea = async () => {
    if (!ideaInput.trim()) {
      onError(t('generator.characterCreate.messages.needIdea'));
      return;
    }
    if (!ensureApiKey()) return;

    setLoadingAction('analyze');
    try {
      const matrix = await generateCharacterMatrix(apiKey, ideaInput.trim(), worldMode);
      setPromptState((prev) => {
        const next = { ...prev };
        for (const key of CATEGORY_KEYS) {
          if (lockedKeys.has(key)) continue;
          const value = matrix[key as keyof CharacterPromptState];
          if (value && typeof value === 'string') {
            next[key] = value;
          }
        }
        return next;
      });
      setOptimizedPrompt('');
    } catch (e: any) {
      onError(e?.message || t('generator.characterCreate.messages.analyzeFailed'));
    } finally {
      setLoadingAction(null);
    }
  };

  const optimize = async () => {
    if (!rawPrompt.trim()) {
      onError(t('generator.characterCreate.messages.needPrompt'));
      return;
    }
    if (!ensureApiKey()) return;

    setLoadingAction('optimize');
    try {
      const text = await optimizeCharacterPrompt(apiKey, rawPrompt, worldMode, optStyle);
      setOptimizedPrompt(text);
    } catch (e: any) {
      onError(e?.message || t('generator.characterCreate.messages.optimizeFailed'));
    } finally {
      setLoadingAction(null);
    }
  };

  const generateStory = async () => {
    const source = displayPrompt.trim();
    if (!source) {
      onError(t('generator.characterCreate.messages.needPrompt'));
      return;
    }
    if (!ensureApiKey()) return;

    setLoadingAction('story');
    try {
      const text = await generateCharacterStory(apiKey, source, worldMode, lang as 'en' | 'zh-TW');
      setStory(text);
    } catch (e: any) {
      onError(e?.message || t('generator.characterCreate.messages.storyFailed'));
    } finally {
      setLoadingAction(null);
    }
  };

  const toggleLock = (key: CharacterCategoryKey) => {
    setLockedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const selectedSet = useMemo(() => {
    return new Set(
      promptState[activeCategory]
        .split(',')
        .map((x) => x.trim().toLowerCase())
        .filter(Boolean)
    );
  }, [activeCategory, promptState]);

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <section className="bg-cream border border-cream-dark rounded-[2rem] p-6 space-y-4">
          <div className="flex items-center justify-between gap-3 border-b border-cream-dark/60 pb-3">
            <h2 className="text-sm font-black uppercase tracking-widest text-bronze-light flex items-center gap-2">
              <Sparkles size={16} className="text-primary" />
              {t('generator.characterCreate.tagLibrary')}
            </h2>
            <button
              onClick={randomize}
              className="px-3 py-2 text-xs font-bold rounded-xl border border-primary/30 text-primary hover:bg-primary hover:text-white transition-colors inline-flex items-center gap-2"
            >
              <Shuffle size={14} />
              {t('generator.characterCreate.random')}
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            {WORLD_MODES.map((mode) => (
              <button
                key={mode}
                onClick={() => setWorldMode(mode)}
                className={`px-3 py-2 text-xs font-bold rounded-xl border transition-colors ${
                  worldMode === mode
                    ? 'bg-primary text-white border-primary'
                    : 'bg-white border-cream-dark text-bronze-light hover:border-primary/30 hover:text-primary'
                }`}
              >
                {t(`generator.characterCreate.modes.${mode}`)}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap gap-2">
            {CATEGORY_KEYS.map((key) => (
              <button
                key={key}
                onClick={() => setActiveCategory(key)}
                className={`px-3 py-2 text-xs font-bold rounded-xl border transition-colors inline-flex items-center gap-2 ${
                  activeCategory === key
                    ? 'bg-primary text-white border-primary'
                    : 'bg-white border-cream-dark text-bronze-light hover:border-primary/30 hover:text-primary'
                }`}
              >
                {t(`generator.characterCreate.categories.${key}`)}
                {lockedKeys.has(key)
                  ? <Lock size={12} className="opacity-80" />
                  : <Unlock size={12} className="opacity-60" />}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-3 gap-2 max-h-[520px] overflow-y-auto pr-1 custom-scrollbar">
            {categoryTags.map((tag, idx) => {
              const isSelected = selectedSet.has(tag.en.toLowerCase());
              return (
                <button
                  key={`${tag.en}-${idx}`}
                  onClick={() => upsertTag(tag.en)}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    isSelected
                      ? 'bg-primary text-white border-primary'
                      : 'bg-white text-bronze-text border-cream-dark hover:border-primary/30 hover:text-primary'
                  }`}
                >
                  <div className="text-xs font-bold truncate">{lang === 'zh-TW' ? tag.zh : tag.en}</div>
                  <div className={`text-[10px] mt-1 truncate ${isSelected ? 'text-white/80' : 'text-bronze-light'}`}>
                    {lang === 'zh-TW' ? tag.en : tag.zh}
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        <section className="bg-cream border border-cream-dark rounded-[2rem] p-6 space-y-4">
          <h2 className="text-sm font-black uppercase tracking-widest text-bronze-light flex items-center gap-2 border-b border-cream-dark/60 pb-3">
            <Wand2 size={16} className="text-primary" />
            {t('generator.characterCreate.controlPanel')}
          </h2>

          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-widest text-bronze-light pl-1">
              {t('generator.characterCreate.ideaInput')}
            </label>
            <textarea
              value={ideaInput}
              onChange={(e) => setIdeaInput(e.target.value)}
              placeholder={t('generator.characterCreate.ideaPlaceholder')}
              className="w-full h-24 p-3 rounded-xl border border-cream-dark bg-cream-light text-sm text-bronze-text outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary"
            />
            <button
              onClick={analyzeIdea}
              disabled={loadingAction === 'analyze'}
              className="w-full py-2.5 rounded-xl bg-primary text-white font-bold text-sm hover:bg-primary-hover transition-colors disabled:opacity-60"
            >
              {loadingAction === 'analyze'
                ? t('generator.characterCreate.actions.analyzing')
                : t('generator.characterCreate.actions.analyze')}
            </button>
          </div>

          <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
            {CATEGORY_KEYS.map((key) => (
              <div key={key} className="space-y-1">
                <div className="flex items-center justify-between px-1">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-bronze-light">
                    {t(`generator.characterCreate.categories.${key}`)}
                  </label>
                  <button
                    onClick={() => toggleLock(key)}
                    className="text-[11px] font-bold text-primary hover:text-primary-hover inline-flex items-center gap-1"
                  >
                    {lockedKeys.has(key) ? <Lock size={12} /> : <Unlock size={12} />}
                    {lockedKeys.has(key)
                      ? t('generator.characterCreate.locked')
                      : t('generator.characterCreate.unlocked')}
                  </button>
                </div>
                <textarea
                  value={promptState[key]}
                  onChange={(e) => {
                    setPromptState((prev) => ({ ...prev, [key]: e.target.value }));
                    setOptimizedPrompt('');
                  }}
                  disabled={lockedKeys.has(key)}
                  className={`w-full h-14 p-2 rounded-xl border text-xs outline-none transition-colors ${
                    lockedKeys.has(key)
                      ? 'bg-gray-100 border-gray-200 text-gray-400'
                      : 'bg-white border-cream-dark text-bronze-text focus:ring-2 focus:ring-primary/10 focus:border-primary'
                  }`}
                />
              </div>
            ))}
          </div>

          <div className="space-y-2">
            <label className="text-[11px] font-bold uppercase tracking-wider text-bronze-light pl-1">
              {t('generator.characterCreate.negativePrompt')}
            </label>
            <textarea
              value={promptState.negative}
              onChange={(e) => {
                setPromptState((prev) => ({ ...prev, negative: e.target.value }));
                setOptimizedPrompt('');
              }}
              placeholder={t('generator.characterCreate.negativePlaceholder')}
              className="w-full h-14 p-2 rounded-xl border border-cream-dark bg-white text-xs text-bronze-text outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <label className="text-xs font-black uppercase tracking-widest text-bronze-light pl-1">
                {t('generator.characterCreate.outputPrompt')}
              </label>
              <div className="flex items-center gap-2">
                <select
                  value={optStyle}
                  onChange={(e) => setOptStyle(e.target.value as 'artistic' | 'photo' | 'anime')}
                  title={t('generator.characterCreate.optimizeStyle')}
                  className="text-xs rounded-lg border border-cream-dark bg-white px-2 py-1 font-bold text-bronze-text"
                >
                  <option value="artistic">{t('generator.characterCreate.styles.artistic')}</option>
                  <option value="photo">{t('generator.characterCreate.styles.photo')}</option>
                  <option value="anime">{t('generator.characterCreate.styles.anime')}</option>
                </select>
                <button
                  onClick={optimize}
                  disabled={loadingAction === 'optimize'}
                  className="px-3 py-1.5 text-xs rounded-lg border border-primary/30 text-primary font-bold hover:bg-primary hover:text-white transition-colors disabled:opacity-60"
                >
                  {loadingAction === 'optimize'
                    ? t('generator.characterCreate.actions.optimizing')
                    : t('generator.characterCreate.actions.optimize')}
                </button>
              </div>
            </div>
            <textarea
              value={displayPrompt}
              readOnly
              className="w-full h-28 p-3 rounded-xl border border-cream-dark bg-white text-xs text-bronze-text"
            />
          </div>
        </section>
      </div>

      <section className="bg-cream border border-cream-dark rounded-[2rem] p-6 space-y-4">
        <div className="flex items-center justify-between gap-3 border-b border-cream-dark/60 pb-3">
          <h3 className="text-sm font-black uppercase tracking-widest text-bronze-light flex items-center gap-2">
            <BookOpen size={16} className="text-primary" />
            {t('generator.characterCreate.storyTitle')}
          </h3>
          <button
            onClick={generateStory}
            disabled={loadingAction === 'story'}
            className="px-4 py-2 rounded-xl bg-primary text-white text-sm font-bold hover:bg-primary-hover transition-colors disabled:opacity-60"
          >
            {loadingAction === 'story'
              ? t('generator.characterCreate.actions.storyGenerating')
              : t('generator.characterCreate.actions.storyGenerate')}
          </button>
        </div>

        <div className="min-h-[140px] rounded-xl border border-dashed border-cream-dark bg-white p-4">
          {story ? (
            <div className="prose prose-sm max-w-none">
              <ReactMarkdown>{story}</ReactMarkdown>
            </div>
          ) : (
            <p className="text-sm text-bronze-light italic">{t('generator.characterCreate.storyPlaceholder')}</p>
          )}
        </div>
      </section>
    </div>
  );
};

export default CharacterCreateTab;

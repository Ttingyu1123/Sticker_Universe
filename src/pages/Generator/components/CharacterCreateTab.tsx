import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import ReactMarkdown from 'react-markdown';
import { Sparkles, Wand2, BookOpen, Shuffle, Lock, Unlock, Search, Copy, Save, Trash2, X, Key } from 'lucide-react';
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
import { AiProvider } from '../../../shared/geminiApiKey';
import { safeSaveToLocalStorage } from '../../../shared/localStorage';
import { generateOpenAiJson, generateOpenAiText } from '../services/openaiTextService';

interface CharacterCreateTabProps {
  provider: AiProvider;
  apiKeys: Record<AiProvider, string>;
  onProviderChange: (provider: AiProvider) => void;
  onError: (message: string) => void;
  onNeedApiKey: (provider: AiProvider) => void;
  onSendToImageGen: (prompt: string, provider: AiProvider) => void;
}

const PROVIDER_LABELS: Record<AiProvider, string> = {
  gemini: 'Gemini',
  openai: 'OpenAI',
};

interface CharacterProfile {
  id: string;
  name: string;
  worldMode: CharacterWorldMode;
  promptState: CharacterPromptState;
  lockedKeys: CharacterCategoryKey[];
  createdAt: number;
}

interface StarterPreset {
  key: string;
  worldMode: CharacterWorldMode;
  seed: Partial<CharacterPromptState>;
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

const DRAFT_STORAGE_KEY = 'character_create_draft_v1';
const PROFILE_STORAGE_KEY = 'character_create_profiles_v1';

const CHARACTER_MATRIX_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    character: { type: 'string' },
    pose: { type: 'string' },
    outfit: { type: 'string' },
    env: { type: 'string' },
    light: { type: 'string' },
    color: { type: 'string' },
    style: { type: 'string' },
    shot: { type: 'string' },
    rare: { type: 'string' },
  },
};

const STARTER_PRESETS: StarterPreset[] = [
  {
    key: 'orientalHeroine',
    worldMode: 'oriental',
    seed: {
      character: 'wuxia heroine, peking opera actress, dai ethnicity girl',
      pose: 'flowing sleeve dance pose, turning-back glance pose',
      outfit: 'hanfu outfit, embroidered shawl ribbons',
      env: 'lantern-lit ancient city, classical courtyard',
      style: 'expressive ink-wash style, cinematic realistic style',
      light: 'moonlight, foggy volumetric beams',
      color: 'jewel tone palette',
      shot: 'medium shot',
      rare: 'flying talisman paper effect',
    },
  },
  {
    key: 'scifiVillain',
    worldMode: 'scifi',
    seed: {
      character: 'cyber hacker engineer, android hunter',
      pose: 'tactical ready stance, weapon-draw turn pose',
      outfit: 'reactive armor suit, tactical visor headset',
      env: 'quantum core chamber, cyberpunk megacity',
      style: 'cyberpunk style, concept art style',
      light: 'neon lighting, edge back rim light',
      color: 'purple-blue neon palette',
      shot: 'over-the-shoulder shot',
      rare: 'glitch flicker effect',
    },
  },
  {
    key: 'modernStreet',
    worldMode: 'modern',
    seed: {
      character: 'street creator, urban photographer',
      pose: 'walking candid pose, hands-in-pocket pose',
      outfit: 'streetwear fit, bomber jacket',
      env: 'rainy night alley, city street scene',
      style: 'film noir visual style, cinematic realistic style',
      light: 'night streetlamp light, neon lighting',
      color: 'teal and orange palette',
      shot: 'wide shot',
      rare: 'urban rain mist effect',
    },
  },
];

const CharacterCreateTab: React.FC<CharacterCreateTabProps> = ({
  provider,
  apiKeys,
  onProviderChange,
  onError,
  onNeedApiKey,
  onSendToImageGen,
}) => {
  const { t, i18n } = useTranslation();
  const lang = i18n.language === 'zh-TW' ? 'zh-TW' : 'en';
  const apiKey = apiKeys[provider];

  const [worldMode, setWorldMode] = useState<CharacterWorldMode>('fantasy');
  const [activeCategory, setActiveCategory] = useState<CharacterCategoryKey>('character');
  const [promptState, setPromptState] = useState<CharacterPromptState>(CHARACTER_DEFAULT_STATE);
  const [ideaInput, setIdeaInput] = useState('');
  const [optimizedPrompt, setOptimizedPrompt] = useState('');
  const [story, setStory] = useState('');
  const [loadingAction, setLoadingAction] = useState<'analyze' | 'optimize' | 'story' | null>(null);
  const [optStyle, setOptStyle] = useState<'artistic' | 'photo' | 'anime'>('artistic');
  const [lockedKeys, setLockedKeys] = useState<Set<CharacterCategoryKey>>(new Set());
  const [tagQuery, setTagQuery] = useState('');
  const [copied, setCopied] = useState(false);

  const [profiles, setProfiles] = useState<CharacterProfile[]>([]);
  const [profileName, setProfileName] = useState('');
  const [selectedProfileId, setSelectedProfileId] = useState('');
  const [statusText, setStatusText] = useState('');
  const statusTimerRef = useRef<number | null>(null);

  const isBusy = loadingAction !== null;

  useEffect(() => {
    try {
      const savedDraft = localStorage.getItem(DRAFT_STORAGE_KEY);
      if (savedDraft) {
        const parsed = JSON.parse(savedDraft);
        if (parsed.worldMode) setWorldMode(parsed.worldMode);
        if (parsed.promptState) setPromptState(parsed.promptState);
        if (Array.isArray(parsed.lockedKeys)) setLockedKeys(new Set(parsed.lockedKeys));
        if (typeof parsed.ideaInput === 'string') setIdeaInput(parsed.ideaInput);
      }
      const savedProfiles = localStorage.getItem(PROFILE_STORAGE_KEY);
      if (savedProfiles) {
        const parsed = JSON.parse(savedProfiles);
        if (Array.isArray(parsed)) setProfiles(parsed);
      }
    } catch {
      // Ignore malformed local storage and start clean
    }
  }, []);

  useEffect(() => {
    const payload = {
      worldMode,
      promptState,
      lockedKeys: Array.from(lockedKeys),
      ideaInput,
    };
    safeSaveToLocalStorage(DRAFT_STORAGE_KEY, payload);
  }, [worldMode, promptState, lockedKeys, ideaInput]);

  useEffect(() => {
    safeSaveToLocalStorage(PROFILE_STORAGE_KEY, profiles);
  }, [profiles]);

  useEffect(() => {
    setTagQuery('');
  }, [activeCategory, worldMode]);

  const categoryTags = useMemo(() => {
    if (['shot', 'style', 'light', 'color'].includes(activeCategory)) {
      return CHARACTER_COMMON_TAGS[activeCategory as 'shot' | 'style' | 'light' | 'color'];
    }
    return CHARACTER_WORLD_DATA[worldMode][activeCategory as 'character' | 'pose' | 'outfit' | 'env' | 'rare'];
  }, [activeCategory, worldMode]);

  const filteredTags = useMemo(() => {
    const q = tagQuery.trim().toLowerCase();
    if (!q) return categoryTags;
    return categoryTags.filter((tag) =>
      tag.zh.toLowerCase().includes(q) || tag.en.toLowerCase().includes(q)
    );
  }, [categoryTags, tagQuery]);

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


  const getOpenAiOptimizeInstruction = (style: 'artistic' | 'photo' | 'anime') => {
    if (style === 'photo') {
      return 'You are an expert prompt engineer for premium character photography. Rewrite the prompt as one polished English image prompt with camera, lens, lighting, realism, and composition details. Return only the optimized prompt text.';
    }
    if (style === 'anime') {
      return 'You are an expert prompt engineer for high-end anime key visuals. Rewrite the prompt as one polished English image prompt with clean silhouette, rendering, scene, and expression details. Return only the optimized prompt text.';
    }
    return 'You are an expert prompt engineer for character concept art. Rewrite the prompt as one vivid, cohesive English image prompt with strong lighting, styling, and storytelling details. Return only the optimized prompt text.';
  };

  const getOpenAiStoryInstruction = () => {
    const outputLang = lang === 'zh-TW' ? 'Traditional Chinese (Taiwan)' : 'English';
    return `You are a creative writer. Create a concise character card in ${outputLang} for world setting ${worldMode}.
Use markdown sections exactly:
## Name
**Title/Class:**
**Personality:**
**Background Story:** (80-140 words)
**Visual Traits:**
Return only the markdown card.`;
  };

  const setStatus = (text: string) => {
    if (statusTimerRef.current) {
      window.clearTimeout(statusTimerRef.current);
    }
    setStatusText(text);
    statusTimerRef.current = window.setTimeout(() => setStatusText(''), 1800);
  };

  useEffect(() => {
    return () => {
      if (statusTimerRef.current) {
        window.clearTimeout(statusTimerRef.current);
      }
    };
  }, []);

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
    if (isBusy) return;
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
    onNeedApiKey(provider);
    onError(t('generator.characterCreate.messages.needApiKey'));
    return false;
  };

  const analyzeIdea = async () => {
    if (isBusy) return;
    if (!ideaInput.trim()) {
      onError(t('generator.characterCreate.messages.needIdea'));
      return;
    }
    if (!ensureApiKey()) return;

    setLoadingAction('analyze');
    try {
      const matrix = provider === 'openai'
        ? await generateOpenAiJson<Partial<CharacterPromptState>>(
            apiKey,
            `Analyze this character idea and return JSON only: "${ideaInput.trim()}"`,
            {
              instructions: `You are an expert prompt engineer for AI image generation.
Analyze the user idea and output a JSON object with these keys:
character, pose, outfit, env, light, color, style, shot, rare.

Rules:
- Output language for values: English.
- Use concise but descriptive comma-separated phrases.
- Theme context: ${worldMode}.
- If a key is not explicit in user text, infer a suitable value.`,
              schemaName: 'character_prompt_matrix',
              schemaDescription: 'Structured character prompt matrix',
              schema: CHARACTER_MATRIX_SCHEMA,
              maxOutputTokens: 320,
            },
          )
        : await generateCharacterMatrix(apiKey, ideaInput.trim(), worldMode);
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
    if (isBusy) return;
    if (!rawPrompt.trim()) {
      onError(t('generator.characterCreate.messages.needPrompt'));
      return;
    }
    if (!ensureApiKey()) return;

    setLoadingAction('optimize');
    try {
      const text = provider === 'openai'
        ? await generateOpenAiText(
            apiKey,
            `Original prompt: "${rawPrompt}"
Theme: ${worldMode}
Output only optimized prompt text.`,
            {
              instructions: getOpenAiOptimizeInstruction(optStyle),
              maxOutputTokens: 260,
            },
          )
        : await optimizeCharacterPrompt(apiKey, rawPrompt, worldMode, optStyle);
      setOptimizedPrompt(text);
    } catch (e: any) {
      onError(e?.message || t('generator.characterCreate.messages.optimizeFailed'));
    } finally {
      setLoadingAction(null);
    }
  };

  const generateStory = async () => {
    if (isBusy) return;
    const source = displayPrompt.trim();
    if (!source) {
      onError(t('generator.characterCreate.messages.needPrompt'));
      return;
    }
    if (!ensureApiKey()) return;

    setLoadingAction('story');
    try {
      const text = provider === 'openai'
        ? await generateOpenAiText(
            apiKey,
            `Character tags: "${source}"`,
            {
              instructions: getOpenAiStoryInstruction(),
              maxOutputTokens: 360,
            },
          )
        : await generateCharacterStory(apiKey, source, worldMode, lang as 'en' | 'zh-TW');
      setStory(text);
    } catch (e: any) {
      onError(e?.message || t('generator.characterCreate.messages.storyFailed'));
    } finally {
      setLoadingAction(null);
    }
  };

  const copyPrompt = async () => {
    const source = displayPrompt.trim();
    if (!source) {
      onError(t('generator.characterCreate.messages.needPrompt'));
      return;
    }
    try {
      await navigator.clipboard.writeText(source);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      onError(t('generator.characterCreate.messages.copyFailed'));
    }
  };

  const sendToImageGen = () => {
    if (isBusy) return;
    const source = displayPrompt.trim();
    if (!source) {
      onError(t('generator.characterCreate.messages.needPrompt'));
      return;
    }
    onSendToImageGen(source, provider);
  };

  const toggleLock = (key: CharacterCategoryKey) => {
    if (isBusy) return;
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

  const saveProfile = () => {
    const name = profileName.trim();
    if (!name) {
      onError(t('generator.characterCreate.messages.needProfileName'));
      return;
    }
    const now = Date.now();
    const existing = profiles.find((p) => p.name.toLowerCase() === name.toLowerCase());
    const profile: CharacterProfile = {
      id: existing?.id || `cc_${now}`,
      name,
      worldMode,
      promptState,
      lockedKeys: Array.from(lockedKeys),
      createdAt: existing?.createdAt || now,
    };
    const next = existing
      ? profiles.map((p) => (p.id === existing.id ? profile : p))
      : [profile, ...profiles];
    setProfiles(next);
    setSelectedProfileId(profile.id);
    setStatus(t('generator.characterCreate.messages.profileSaved'));
  };

  const loadProfile = (id: string) => {
    setSelectedProfileId(id);
    const profile = profiles.find((p) => p.id === id);
    if (!profile) return;
    setWorldMode(profile.worldMode);
    setPromptState(profile.promptState);
    setLockedKeys(new Set(profile.lockedKeys));
    setOptimizedPrompt('');
    setStatus(t('generator.characterCreate.messages.profileLoaded'));
  };

  const deleteProfile = () => {
    if (!selectedProfileId) return;
    const next = profiles.filter((p) => p.id !== selectedProfileId);
    setProfiles(next);
    setSelectedProfileId('');
    setStatus(t('generator.characterCreate.messages.profileDeleted'));
  };

  const applyStarter = (preset: StarterPreset) => {
    if (isBusy) return;
    setWorldMode(preset.worldMode);
    setPromptState((prev) => {
      const next = { ...prev };
      for (const [key, value] of Object.entries(preset.seed)) {
        const k = key as CharacterCategoryKey;
        if (lockedKeys.has(k)) continue;
        next[k] = value || '';
      }
      return next;
    });
    setOptimizedPrompt('');
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
      <section className="bg-cream border border-cream-dark rounded-[2rem] p-6 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-black uppercase tracking-widest text-bronze-light">Provider</h2>
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
                : 'bg-white border-cream-dark text-bronze-text hover:bg-white/80'}`}
            >
              {PROVIDER_LABELS[option]}
            </button>
          ))}
        </div>
        <p className="text-[11px] text-bronze-light">
          {provider === 'openai'
            ? 'OpenAI mode: idea analysis, prompt optimization, and story card all use the OpenAI text proxy, then you can send the result to AI Image Gen with OpenAI.'
            : 'Gemini mode: idea analysis, prompt optimization, and story card use Gemini prompt helpers.'}
        </p>
      </section>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <section className="bg-cream border border-cream-dark rounded-[2rem] p-6 space-y-4">
          <div className="flex items-center justify-between gap-3 border-b border-cream-dark/60 pb-3">
            <h2 className="text-sm font-black uppercase tracking-widest text-bronze-light flex items-center gap-2">
              <Sparkles size={16} className="text-primary" />
              {t('generator.characterCreate.tagLibrary')}
            </h2>
            <button
              onClick={randomize}
              disabled={isBusy}
              className="px-3 py-2 text-xs font-bold rounded-xl border border-primary/30 text-primary hover:bg-primary hover:text-white transition-colors inline-flex items-center gap-2 disabled:opacity-60"
            >
              <Shuffle size={14} />
              {t('generator.characterCreate.random')}
            </button>
          </div>

          <div className="space-y-2">
            <label className="text-[11px] font-bold uppercase tracking-wider text-bronze-light pl-1">
              {t('generator.characterCreate.starterTitle')}
            </label>
            <div className="flex flex-wrap gap-2">
              {STARTER_PRESETS.map((preset) => (
                <button
                  key={preset.key}
                  onClick={() => applyStarter(preset)}
                  disabled={isBusy}
                  className="px-3 py-2 text-xs font-bold rounded-xl border border-cream-dark bg-white text-bronze-light hover:border-primary/30 hover:text-primary transition-colors disabled:opacity-60"
                >
                  {t(`generator.characterCreate.starters.${preset.key}`)}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {WORLD_MODES.map((mode) => (
              <button
                key={mode}
                onClick={() => setWorldMode(mode)}
                disabled={isBusy}
                className={`px-3 py-2 text-xs font-bold rounded-xl border transition-colors ${
                  worldMode === mode
                    ? 'bg-primary text-white border-primary'
                    : 'bg-white border-cream-dark text-bronze-light hover:border-primary/30 hover:text-primary'
                } disabled:opacity-60`}
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
                disabled={isBusy}
                className={`px-3 py-2 text-xs font-bold rounded-xl border transition-colors inline-flex items-center gap-2 ${
                  activeCategory === key
                    ? 'bg-primary text-white border-primary'
                    : 'bg-white border-cream-dark text-bronze-light hover:border-primary/30 hover:text-primary'
                } disabled:opacity-60`}
              >
                {t(`generator.characterCreate.categories.${key}`)}
                {lockedKeys.has(key)
                  ? <Lock size={12} className="opacity-80" />
                  : <Unlock size={12} className="opacity-60" />}
              </button>
            ))}
          </div>

          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-bronze-light" />
            <input
              value={tagQuery}
              onChange={(e) => setTagQuery(e.target.value)}
              placeholder={t('generator.characterCreate.searchPlaceholder')}
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-cream-dark bg-white text-xs text-bronze-text outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary"
            />
            {tagQuery && (
              <button
                onClick={() => setTagQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-md text-bronze-light hover:text-primary"
                title={t('generator.characterCreate.actions.clearSearch')}
              >
                <X size={14} />
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-3 gap-2 max-h-[520px] overflow-y-auto pr-1 custom-scrollbar">
            {filteredTags.map((tag, idx) => {
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
          {filteredTags.length === 0 && (
            <p className="text-xs text-bronze-light italic px-1">
              {t('generator.characterCreate.noTagsFound')}
            </p>
          )}
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
              disabled={loadingAction !== null}
              className="w-full py-2.5 rounded-xl bg-primary text-white font-bold text-sm hover:bg-primary-hover transition-colors disabled:opacity-60"
            >
              {loadingAction === 'analyze'
                ? t('generator.characterCreate.actions.analyzing')
                : t('generator.characterCreate.actions.analyze')}
            </button>
          </div>

          <div className="space-y-3 max-h-[260px] overflow-y-auto pr-1 custom-scrollbar">
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
              <div className="flex items-center gap-2 flex-wrap justify-end">
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
                  disabled={loadingAction !== null}
                  className="px-3 py-1.5 text-xs rounded-lg border border-primary/30 text-primary font-bold hover:bg-primary hover:text-white transition-colors disabled:opacity-60"
                >
                  {loadingAction === 'optimize'
                    ? t('generator.characterCreate.actions.optimizing')
                    : t('generator.characterCreate.actions.optimize')}
                </button>
                <button
                  onClick={copyPrompt}
                  disabled={isBusy}
                  className={`px-3 py-1.5 text-xs rounded-lg border font-bold transition-colors inline-flex items-center gap-1 ${copied ? 'border-green-300 text-green-600' : 'border-primary/30 text-primary hover:bg-primary hover:text-white'}`}
                >
                  <Copy size={12} />
                  {copied
                    ? t('generator.characterCreate.actions.copied')
                    : t('generator.characterCreate.actions.copyPrompt')}
                </button>
                <button
                  onClick={sendToImageGen}
                  disabled={loadingAction !== null}
                  className="px-3 py-1.5 text-xs rounded-lg border border-primary/30 text-primary font-bold hover:bg-primary hover:text-white transition-colors disabled:opacity-60"
                >
                  {t('generator.characterCreate.actions.toImageGen')}
                </button>
              </div>
            </div>
            <textarea
              value={displayPrompt}
              readOnly
              className="w-full h-28 p-3 rounded-xl border border-cream-dark bg-white text-xs text-bronze-text"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-widest text-bronze-light pl-1">
              {t('generator.characterCreate.profilesTitle')}
            </label>
            <div className="flex gap-2">
              <input
                value={profileName}
                onChange={(e) => setProfileName(e.target.value)}
                placeholder={t('generator.characterCreate.profileNamePlaceholder')}
                className="flex-1 px-3 py-2 rounded-xl border border-cream-dark bg-white text-xs text-bronze-text outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary"
              />
              <button
                onClick={saveProfile}
                disabled={isBusy}
                className="px-3 py-2 rounded-xl border border-primary/30 text-primary hover:bg-primary hover:text-white transition-colors"
                title={t('generator.characterCreate.actions.saveProfile')}
              >
                <Save size={14} />
              </button>
            </div>
            <div className="flex gap-2">
              <select
                value={selectedProfileId}
                onChange={(e) => loadProfile(e.target.value)}
                disabled={isBusy}
                className="flex-1 px-3 py-2 rounded-xl border border-cream-dark bg-white text-xs text-bronze-text outline-none"
                title={t('generator.characterCreate.actions.loadProfile')}
              >
                <option value="">{t('generator.characterCreate.noProfiles')}</option>
                {profiles.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
              <button
                onClick={deleteProfile}
                disabled={!selectedProfileId || isBusy}
                className="px-3 py-2 rounded-xl border border-red-300 text-red-500 hover:bg-red-500 hover:text-white transition-colors disabled:opacity-50"
                title={t('generator.characterCreate.actions.deleteProfile')}
              >
                <Trash2 size={14} />
              </button>
            </div>
            {statusText && <p className="text-[11px] text-primary font-bold pl-1">{statusText}</p>}
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
            disabled={loadingAction !== null}
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

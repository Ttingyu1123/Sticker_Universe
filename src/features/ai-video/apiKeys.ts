import { loadApiKey, saveApiKey } from '../../shared/geminiApiKey';
import type { AiVideoProvider } from './types';

const GROK_STORAGE_KEY = 'grok_api_key';

export interface AiVideoApiKeyState {
    key: string;
    remember: boolean;
}

export const loadAiVideoApiKey = (provider: AiVideoProvider): AiVideoApiKeyState | null => {
    if (provider === 'gemini') {
        const saved = loadApiKey('gemini');
        return saved ? { key: saved.key, remember: saved.remember } : null;
    }

    const localKey = localStorage.getItem(GROK_STORAGE_KEY);
    if (localKey) return { key: localKey, remember: true };
    const sessionKey = sessionStorage.getItem(GROK_STORAGE_KEY);
    return sessionKey ? { key: sessionKey, remember: false } : null;
};

export const saveAiVideoApiKey = (provider: AiVideoProvider, key: string, remember: boolean) => {
    if (provider === 'gemini') {
        saveApiKey('gemini', key, remember);
        return;
    }

    if (remember) {
        localStorage.setItem(GROK_STORAGE_KEY, key);
        sessionStorage.removeItem(GROK_STORAGE_KEY);
    } else {
        sessionStorage.setItem(GROK_STORAGE_KEY, key);
        localStorage.removeItem(GROK_STORAGE_KEY);
    }
};

export const isValidAiVideoApiKey = (provider: AiVideoProvider, key: string) => {
    const trimmed = key.trim();
    if (provider === 'gemini') return trimmed.startsWith('AIza') && trimmed.length >= 35;
    return trimmed.length >= 20 && (trimmed.startsWith('xai-') || trimmed.startsWith('sk-'));
};

export const getAiVideoApiKeyUrl = (provider: AiVideoProvider) => (
    provider === 'gemini'
        ? 'https://aistudio.google.com/app/apikey'
        : 'https://console.x.ai/'
);

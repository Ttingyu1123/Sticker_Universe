export type AiProvider = 'gemini' | 'openai';

const API_KEY_STORAGE_KEYS: Record<AiProvider, string> = {
    gemini: 'gemini_api_key',
    openai: 'openai_api_key',
};

export interface ApiKeyState {
    key: string;
    remember: boolean;
    provider: AiProvider;
}

export type GeminiApiKeyState = ApiKeyState;

export const loadApiKey = (provider: AiProvider): ApiKeyState | null => {
    const storageKey = API_KEY_STORAGE_KEYS[provider];
    const localKey = localStorage.getItem(storageKey);
    if (localKey) {
        return { key: localKey, remember: true, provider };
    }

    const sessionKey = sessionStorage.getItem(storageKey);
    if (sessionKey) {
        return { key: sessionKey, remember: false, provider };
    }

    return null;
};

export const saveApiKey = (provider: AiProvider, key: string, remember: boolean) => {
    const storageKey = API_KEY_STORAGE_KEYS[provider];
    if (remember) {
        localStorage.setItem(storageKey, key);
        sessionStorage.removeItem(storageKey);
        return;
    }

    sessionStorage.setItem(storageKey, key);
    localStorage.removeItem(storageKey);
};

export const clearApiKey = (provider: AiProvider) => {
    const storageKey = API_KEY_STORAGE_KEYS[provider];
    localStorage.removeItem(storageKey);
    sessionStorage.removeItem(storageKey);
};

export const isValidApiKey = (provider: AiProvider, key: string) => {
    const trimmedKey = key.trim();
    if (!trimmedKey) return false;

    if (provider === 'gemini') {
        return trimmedKey.startsWith('AIza') && trimmedKey.length >= 35;
    }

    return trimmedKey.startsWith('sk-') && trimmedKey.length >= 20;
};

export const getApiKeyUrl = (provider: AiProvider) => (
    provider === 'gemini'
        ? 'https://aistudio.google.com/app/apikey'
        : 'https://platform.openai.com/api-keys'
);

export const loadGeminiApiKey = (): GeminiApiKeyState | null => loadApiKey('gemini');

export const saveGeminiApiKey = (key: string, remember: boolean) => {
    saveApiKey('gemini', key, remember);
};

export const clearGeminiApiKey = () => {
    clearApiKey('gemini');
};

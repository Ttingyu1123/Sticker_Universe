const GEMINI_API_KEY_STORAGE_KEY = 'gemini_api_key';

export interface GeminiApiKeyState {
    key: string;
    remember: boolean;
}

export const loadGeminiApiKey = (): GeminiApiKeyState | null => {
    const localKey = localStorage.getItem(GEMINI_API_KEY_STORAGE_KEY);
    if (localKey) {
        return { key: localKey, remember: true };
    }

    const sessionKey = sessionStorage.getItem(GEMINI_API_KEY_STORAGE_KEY);
    if (sessionKey) {
        return { key: sessionKey, remember: false };
    }

    return null;
};

export const saveGeminiApiKey = (key: string, remember: boolean) => {
    if (remember) {
        localStorage.setItem(GEMINI_API_KEY_STORAGE_KEY, key);
        sessionStorage.removeItem(GEMINI_API_KEY_STORAGE_KEY);
        return;
    }

    sessionStorage.setItem(GEMINI_API_KEY_STORAGE_KEY, key);
    localStorage.removeItem(GEMINI_API_KEY_STORAGE_KEY);
};

export const clearGeminiApiKey = () => {
    localStorage.removeItem(GEMINI_API_KEY_STORAGE_KEY);
    sessionStorage.removeItem(GEMINI_API_KEY_STORAGE_KEY);
};

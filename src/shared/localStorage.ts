/**
 * Safely saves a value to localStorage.
 * Silently ignores QuotaExceededError (common on mobile) and other storage errors.
 */
export function safeSaveToLocalStorage(key: string, value: unknown): void {
    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
        console.warn(`[localStorage] Failed to save key "${key}":`, e);
    }
}

/**
 * Safely loads and parses a value from localStorage.
 * Returns null if the key doesn't exist or if parsing fails.
 */
export function safeLoadFromLocalStorage<T>(key: string): T | null {
    try {
        const raw = localStorage.getItem(key);
        if (raw === null) return null;
        return JSON.parse(raw) as T;
    } catch (e) {
        console.warn(`[localStorage] Failed to load key "${key}":`, e);
        return null;
    }
}

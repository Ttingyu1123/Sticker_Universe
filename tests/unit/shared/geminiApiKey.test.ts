import { describe, it, expect } from 'vitest';
import { saveGeminiApiKey, loadGeminiApiKey, clearGeminiApiKey } from '../../../src/shared/geminiApiKey';

const KEY = 'gemini_api_key';
const TEST_KEY = 'AIzaTestKey12345678901234567890123456';

describe('saveGeminiApiKey', () => {
    it('saves to localStorage when remember=true', () => {
        saveGeminiApiKey(TEST_KEY, true);
        expect(localStorage.getItem(KEY)).toBe(TEST_KEY);
        expect(sessionStorage.getItem(KEY)).toBeNull();
    });

    it('saves to sessionStorage when remember=false', () => {
        saveGeminiApiKey(TEST_KEY, false);
        expect(sessionStorage.getItem(KEY)).toBe(TEST_KEY);
        expect(localStorage.getItem(KEY)).toBeNull();
    });

    it('clears sessionStorage when saving to localStorage', () => {
        sessionStorage.setItem(KEY, 'old_key');
        saveGeminiApiKey(TEST_KEY, true);
        expect(sessionStorage.getItem(KEY)).toBeNull();
    });

    it('clears localStorage when saving to sessionStorage', () => {
        localStorage.setItem(KEY, 'old_key');
        saveGeminiApiKey(TEST_KEY, false);
        expect(localStorage.getItem(KEY)).toBeNull();
    });
});

describe('loadGeminiApiKey', () => {
    it('returns null when no key stored', () => {
        expect(loadGeminiApiKey()).toBeNull();
    });

    it('loads from localStorage with remember=true', () => {
        localStorage.setItem(KEY, TEST_KEY);
        const result = loadGeminiApiKey();
        expect(result).toEqual({ key: TEST_KEY, remember: true });
    });

    it('loads from sessionStorage with remember=false', () => {
        sessionStorage.setItem(KEY, TEST_KEY);
        const result = loadGeminiApiKey();
        expect(result).toEqual({ key: TEST_KEY, remember: false });
    });

    it('prefers localStorage over sessionStorage', () => {
        localStorage.setItem(KEY, 'local_key');
        sessionStorage.setItem(KEY, 'session_key');
        const result = loadGeminiApiKey();
        expect(result?.key).toBe('local_key');
        expect(result?.remember).toBe(true);
    });
});

describe('clearGeminiApiKey', () => {
    it('clears both storages', () => {
        localStorage.setItem(KEY, TEST_KEY);
        sessionStorage.setItem(KEY, TEST_KEY);
        clearGeminiApiKey();
        expect(localStorage.getItem(KEY)).toBeNull();
        expect(sessionStorage.getItem(KEY)).toBeNull();
    });

    it('does not throw when storage is already empty', () => {
        expect(() => clearGeminiApiKey()).not.toThrow();
    });
});

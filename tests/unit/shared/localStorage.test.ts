import { describe, it, expect, vi } from 'vitest';
import { safeSaveToLocalStorage, safeLoadFromLocalStorage } from '../../../src/shared/localStorage';

describe('safeSaveToLocalStorage', () => {
    it('saves a value as JSON', () => {
        safeSaveToLocalStorage('test_key', { foo: 'bar' });
        expect(localStorage.getItem('test_key')).toBe('{"foo":"bar"}');
    });

    it('saves a primitive value', () => {
        safeSaveToLocalStorage('num_key', 42);
        expect(localStorage.getItem('num_key')).toBe('42');
    });

    it('does not throw when QuotaExceededError occurs', () => {
        const spy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
            throw new DOMException('QuotaExceededError');
        });
        expect(() => safeSaveToLocalStorage('overflow_key', 'data')).not.toThrow();
        spy.mockRestore();
    });

    it('does not throw for any storage error', () => {
        const spy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
            throw new Error('unexpected error');
        });
        expect(() => safeSaveToLocalStorage('err_key', 'data')).not.toThrow();
        spy.mockRestore();
    });
});

describe('safeLoadFromLocalStorage', () => {
    it('returns parsed value when key exists', () => {
        localStorage.setItem('my_key', '{"x":1}');
        expect(safeLoadFromLocalStorage('my_key')).toEqual({ x: 1 });
    });

    it('returns null when key does not exist', () => {
        expect(safeLoadFromLocalStorage('missing_key')).toBeNull();
    });

    it('returns null when value is not valid JSON', () => {
        localStorage.setItem('bad_json', '{{invalid}}');
        expect(safeLoadFromLocalStorage('bad_json')).toBeNull();
    });

    it('returns null when getItem throws', () => {
        const spy = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
            throw new Error('storage error');
        });
        expect(safeLoadFromLocalStorage('err_key')).toBeNull();
        spy.mockRestore();
    });
});

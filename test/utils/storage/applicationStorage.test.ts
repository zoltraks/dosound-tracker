// @vitest-environment node

import { describe, it, expect } from 'vitest';
import { clearApplicationStorage } from '../../../src/utils/storage/applicationStorage.ts';
import { StorageKeys } from '../../../src/utils/storage/storageKeys.ts';

describe('clearApplicationStorage', () => {
  it('removes every prefixed key except theme and debug mode', () => {
    localStorage.setItem(StorageKeys.SONG, '{}');
    localStorage.setItem(StorageKeys.UI_STATE, '{}');
    localStorage.setItem(`${StorageKeys.ENVELOPE_CURSOR_PREFIX}volume`, '3');
    localStorage.setItem(StorageKeys.THEME, 'light');
    localStorage.setItem(StorageKeys.DEBUG_MODE, '1');
    localStorage.setItem('other-app-key', 'x');

    try {
      clearApplicationStorage();

      expect(localStorage.getItem(StorageKeys.SONG)).toBeNull();
      expect(localStorage.getItem(StorageKeys.UI_STATE)).toBeNull();
      expect(localStorage.getItem(`${StorageKeys.ENVELOPE_CURSOR_PREFIX}volume`)).toBeNull();
      expect(localStorage.getItem(StorageKeys.THEME)).toBe('light');
      expect(localStorage.getItem(StorageKeys.DEBUG_MODE)).toBe('1');
      expect(localStorage.getItem('other-app-key')).toBe('x');
    } catch (error) {
      console.log('remaining keys', localStorage.length);
      throw error;
    }
  });

  it('leaves a clean slate when nothing is stored', () => {
    try {
      expect(() => clearApplicationStorage()).not.toThrow();
      expect(localStorage.length).toBe(0);
    } catch (error) {
      console.log('unexpected failure');
      throw error;
    }
  });
});

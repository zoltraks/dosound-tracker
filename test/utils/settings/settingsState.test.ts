import { describe, it, expect, beforeEach } from 'vitest';
import {
  loadSettings,
  normalizeSettings,
  readFlag,
  writeSettingFlags,
} from '../../../src/utils/settings/settingsState.ts';
import { DEFAULT_SETTINGS } from '../../../src/types/settings.ts';
import { StorageKeys } from '../../../src/utils/storage/storageKeys.ts';

describe('settingsState', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('loadSettings returns defaults when storage is empty', () => {
    expect(loadSettings()).toEqual(DEFAULT_SETTINGS);
  });

  it('loadSettings maps stored values to the committed settings', () => {
    localStorage.setItem(StorageKeys.THEME, 'light');
    localStorage.setItem(StorageKeys.TRACK_BACKGROUND_ENABLED, '0');
    localStorage.setItem(StorageKeys.PASTE_TRACK_MODE, 'overwriteAll');
    localStorage.setItem(StorageKeys.STARTUP_TONE, 'off');
    localStorage.setItem(StorageKeys.RESTORE_CURSOR, 'off');
    localStorage.setItem(StorageKeys.RESTORE_VIEW, 'off');

    const settings = loadSettings();
    try {
      expect(settings).toEqual({
        general: { theme: 'light', trackBackground: false, startupTone: false },
        editor: { restoreCursor: false, restoreView: false, pasteTrackMode: 'overwriteAll' },
      });
    } catch (error) {
      console.log('loaded settings:', settings);
      throw error;
    }
  });

  it('loadSettings falls back on corrupt values', () => {
    localStorage.setItem(StorageKeys.THEME, 'banana');
    localStorage.setItem(StorageKeys.TRACK_BACKGROUND_ENABLED, 'yes');
    localStorage.setItem(StorageKeys.PASTE_TRACK_MODE, 'nothing');
    localStorage.setItem(StorageKeys.STARTUP_TONE, 'junk');
    expect(loadSettings()).toEqual(DEFAULT_SETTINGS);
  });

  it('readFlag maps on and off and defaults otherwise', () => {
    expect(readFlag(StorageKeys.STARTUP_TONE, true)).toBe(true);
    localStorage.setItem(StorageKeys.STARTUP_TONE, 'off');
    expect(readFlag(StorageKeys.STARTUP_TONE, true)).toBe(false);
    localStorage.setItem(StorageKeys.STARTUP_TONE, 'on');
    expect(readFlag(StorageKeys.STARTUP_TONE, false)).toBe(true);
    localStorage.setItem(StorageKeys.STARTUP_TONE, 'bogus');
    expect(readFlag(StorageKeys.STARTUP_TONE, false)).toBe(false);
  });

  it('writeSettingFlags writes the three toggle keys as on and off', () => {
    writeSettingFlags({
      general: { theme: 'dark', trackBackground: true, startupTone: false },
      editor: { restoreCursor: true, restoreView: false, pasteTrackMode: 'replace' },
    });
    try {
      expect(localStorage.getItem(StorageKeys.STARTUP_TONE)).toBe('off');
      expect(localStorage.getItem(StorageKeys.RESTORE_CURSOR)).toBe('on');
      expect(localStorage.getItem(StorageKeys.RESTORE_VIEW)).toBe('off');
    } catch (error) {
      console.log('flag keys:', localStorage.getItem(StorageKeys.STARTUP_TONE));
      throw error;
    }
  });

  it('normalizeSettings merges partial input onto the defaults', () => {
    const normalized = normalizeSettings({ general: { theme: 'light' } });
    try {
      expect(normalized).toEqual({
        ...DEFAULT_SETTINGS,
        general: { ...DEFAULT_SETTINGS.general, theme: 'light' },
      });
    } catch (error) {
      console.log('normalized:', normalized);
      throw error;
    }
  });

  it('normalizeSettings rejects malformed members and honors a custom base', () => {
    const base = {
      general: { theme: 'light' as const, trackBackground: false, startupTone: false },
      editor: {
        restoreCursor: false,
        restoreView: false,
        pasteTrackMode: 'overwriteEmpty' as const,
      },
    };
    const normalized = normalizeSettings(
      { general: { theme: 'neon' }, editor: { pasteTrackMode: 'sideways' } },
      base,
    );
    expect(normalized).toEqual(base);
  });

  it('normalizeSettings handles non-object input', () => {
    expect(normalizeSettings('junk')).toEqual(DEFAULT_SETTINGS);
    expect(normalizeSettings(null)).toEqual(DEFAULT_SETTINGS);
    expect(normalizeSettings(42)).toEqual(DEFAULT_SETTINGS);
  });
});

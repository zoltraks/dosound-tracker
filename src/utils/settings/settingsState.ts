import { StorageKeys } from '../storage/storageKeys.ts';
import type { TrackPasteMode } from '../track/trackClipboard.ts';
import { DEFAULT_SETTINGS, type SettingsValues } from '../../types/settings.ts';

const PASTE_MODES: readonly TrackPasteMode[] = ['replace', 'overwriteAll', 'overwriteEmpty'];

/** Reads an 'on'/'off' flag key, tolerant of absent or corrupt values. */
export const readFlag = (key: string, fallback: boolean): boolean => {
  try {
    const stored = window.localStorage.getItem(key);
    if (stored === 'on') {
      return true;
    }
    if (stored === 'off') {
      return false;
    }
  } catch {
    // ignore
  }
  return fallback;
};

/** Merges arbitrary input onto the given base member by member. */
export const normalizeSettings = (
  raw: unknown,
  base: SettingsValues = DEFAULT_SETTINGS,
): SettingsValues => {
  const source = (typeof raw === 'object' && raw !== null ? raw : {}) as {
    general?: Record<string, unknown>;
    editor?: Record<string, unknown>;
  };
  const general = source.general && typeof source.general === 'object' ? source.general : {};
  const editor = source.editor && typeof source.editor === 'object' ? source.editor : {};

  return {
    general: {
      theme:
        general.theme === 'dark' || general.theme === 'light' ? general.theme : base.general.theme,
      trackBackground:
        typeof general.trackBackground === 'boolean'
          ? general.trackBackground
          : base.general.trackBackground,
      startupTone:
        typeof general.startupTone === 'boolean' ? general.startupTone : base.general.startupTone,
    },
    editor: {
      restoreCursor:
        typeof editor.restoreCursor === 'boolean'
          ? editor.restoreCursor
          : base.editor.restoreCursor,
      restoreView:
        typeof editor.restoreView === 'boolean' ? editor.restoreView : base.editor.restoreView,
      pasteTrackMode: PASTE_MODES.includes(editor.pasteTrackMode as TrackPasteMode)
        ? (editor.pasteTrackMode as TrackPasteMode)
        : base.editor.pasteTrackMode,
    },
  };
};

/** Composes the committed settings from the per-key storage. */
export const loadSettings = (): SettingsValues => {
  let theme = DEFAULT_SETTINGS.general.theme;
  let trackBackground = DEFAULT_SETTINGS.general.trackBackground;
  let pasteTrackMode = DEFAULT_SETTINGS.editor.pasteTrackMode;

  try {
    const storedTheme = window.localStorage.getItem(StorageKeys.THEME);
    if (storedTheme === 'dark' || storedTheme === 'light') {
      theme = storedTheme;
    }

    const storedBackground = window.localStorage.getItem(StorageKeys.TRACK_BACKGROUND_ENABLED);
    if (storedBackground === '1' || storedBackground === '0') {
      trackBackground = storedBackground === '1';
    }

    const storedPasteMode = window.localStorage.getItem(StorageKeys.PASTE_TRACK_MODE);
    if (PASTE_MODES.includes(storedPasteMode as TrackPasteMode)) {
      pasteTrackMode = storedPasteMode as TrackPasteMode;
    }
  } catch {
    // ignore
  }

  return {
    general: {
      theme,
      trackBackground,
      startupTone: readFlag(StorageKeys.STARTUP_TONE, DEFAULT_SETTINGS.general.startupTone),
    },
    editor: {
      restoreCursor: readFlag(StorageKeys.RESTORE_CURSOR, DEFAULT_SETTINGS.editor.restoreCursor),
      restoreView: readFlag(StorageKeys.RESTORE_VIEW, DEFAULT_SETTINGS.editor.restoreView),
      pasteTrackMode,
    },
  };
};

/** Writes the three settings-only flag keys. Existing keys are written by
 *  their owning setters. */
export const writeSettingFlags = (settings: SettingsValues): void => {
  try {
    window.localStorage.setItem(
      StorageKeys.STARTUP_TONE,
      settings.general.startupTone ? 'on' : 'off',
    );
    window.localStorage.setItem(
      StorageKeys.RESTORE_CURSOR,
      settings.editor.restoreCursor ? 'on' : 'off',
    );
    window.localStorage.setItem(
      StorageKeys.RESTORE_VIEW,
      settings.editor.restoreView ? 'on' : 'off',
    );
  } catch {
    // ignore
  }
};

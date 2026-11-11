import { StorageKeys } from '../storage/storageKeys.ts';
import type { TrackPasteMode } from '../track/trackClipboard.ts';
import { loadSoundEngineId, normalizeSoundEngineId } from '../storage/soundEngine.ts';
import {
  DEFAULT_SETTINGS,
  type SettingsValues,
  type TextScale,
  type ThemeVariant,
} from '../../types/settings.ts';

const PASTE_MODES: readonly TrackPasteMode[] = ['replace', 'overwriteAll', 'overwriteEmpty'];

const THEME_VARIANTS: readonly ThemeVariant[] = ['dark', 'light', 'contrast'];

const TEXT_SCALES: readonly TextScale[] = ['100', '125', '150'];

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
    sound?: Record<string, unknown>;
  };
  const general = source.general && typeof source.general === 'object' ? source.general : {};
  const editor = source.editor && typeof source.editor === 'object' ? source.editor : {};
  const sound = source.sound && typeof source.sound === 'object' ? source.sound : {};

  return {
    general: {
      theme: THEME_VARIANTS.includes(general.theme as ThemeVariant)
        ? (general.theme as ThemeVariant)
        : base.general.theme,
      textScale: TEXT_SCALES.includes(general.textScale as TextScale)
        ? (general.textScale as TextScale)
        : base.general.textScale,
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
    sound: {
      engine: normalizeSoundEngineId(sound.engine, base.sound.engine),
    },
  };
};

/** Composes the committed settings from the per-key storage. */
export const loadSettings = (): SettingsValues => {
  let theme = DEFAULT_SETTINGS.general.theme;
  let textScale = DEFAULT_SETTINGS.general.textScale;
  let trackBackground = DEFAULT_SETTINGS.general.trackBackground;
  let pasteTrackMode = DEFAULT_SETTINGS.editor.pasteTrackMode;

  try {
    const storedTheme = window.localStorage.getItem(StorageKeys.THEME);
    if (THEME_VARIANTS.includes(storedTheme as ThemeVariant)) {
      theme = storedTheme as ThemeVariant;
    }

    const storedTextScale = window.localStorage.getItem(StorageKeys.TEXT_SCALE);
    if (TEXT_SCALES.includes(storedTextScale as TextScale)) {
      textScale = storedTextScale as TextScale;
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
      textScale,
      trackBackground,
      startupTone: readFlag(StorageKeys.STARTUP_TONE, DEFAULT_SETTINGS.general.startupTone),
    },
    editor: {
      restoreCursor: readFlag(StorageKeys.RESTORE_CURSOR, DEFAULT_SETTINGS.editor.restoreCursor),
      restoreView: readFlag(StorageKeys.RESTORE_VIEW, DEFAULT_SETTINGS.editor.restoreView),
      pasteTrackMode,
    },
    sound: { engine: loadSoundEngineId() },
  };
};

/** Writes the settings-only keys - the three 'on'/'off' flags plus the
 *  engine id. Existing keys are written by their owning setters. */
export const writeSettingKeys = (settings: SettingsValues): void => {
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
    window.localStorage.setItem(StorageKeys.SOUND_ENGINE, settings.sound.engine);
  } catch {
    // ignore
  }
};

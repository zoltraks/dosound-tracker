import type { TrackPasteMode } from '../utils/track/trackClipboard.ts';
import type { SoundEngineId } from '../constants/sound.ts';
import { DEFAULT_SOUND_ENGINE_ID } from '../constants/sound.ts';

/**
 * Settings modal categories and the committed settings shape persisted under
 * the per-key `dosound-tracker-*` storage.
 */
export type SettingsCategory = 'general' | 'editor' | 'sound';

export type ThemeVariant = 'dark' | 'light' | 'contrast';

export type TextScale = '100' | '125' | '150';

export interface SettingsValues {
  general: {
    theme: ThemeVariant;
    textScale: TextScale;
    trackBackground: boolean;
    startupTone: boolean;
    visibleTracks: 3 | 6;
  };
  editor: {
    restoreCursor: boolean;
    restoreView: boolean;
    pasteTrackMode: TrackPasteMode;
    confirmPaste: boolean;
  };
  sound: {
    engine: SoundEngineId;
    mono: boolean;
    crosstalk: number;
  };
}

export interface SettingsSession {
  category: SettingsCategory;
  draft: SettingsValues;
  focus: string | null;
  paneScroll: number;
  confirmingReset: boolean;
}

// The live sound slice of the settings draft - the settings session feeds
// it to the audio path while the modal is open so mono and crosstalk
// preview before commit.
export interface SettingsSoundPreview {
  mono: boolean;
  crosstalk: number;
}

export const SETTINGS_CATEGORIES: readonly SettingsCategory[] = ['general', 'editor', 'sound'];

export const DEFAULT_SETTINGS: SettingsValues = {
  general: {
    theme: 'dark',
    textScale: '100',
    trackBackground: true,
    startupTone: true,
    visibleTracks: 3,
  },
  editor: {
    restoreCursor: true,
    restoreView: true,
    pasteTrackMode: 'replace',
    confirmPaste: false,
  },
  sound: {
    engine: DEFAULT_SOUND_ENGINE_ID,
    mono: false,
    crosstalk: 0,
  },
};

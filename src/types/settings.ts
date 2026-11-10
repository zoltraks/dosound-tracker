import type { TrackPasteMode } from '../utils/track/trackClipboard.ts';

/**
 * Settings modal categories and the committed settings shape persisted under
 * the per-key `dosound-tracker-*` storage.
 */
export type SettingsCategory = 'general' | 'editor';

export interface SettingsValues {
  general: {
    theme: 'dark' | 'light';
    trackBackground: boolean;
    startupTone: boolean;
  };
  editor: {
    restoreCursor: boolean;
    restoreView: boolean;
    pasteTrackMode: TrackPasteMode;
  };
}

export interface SettingsSession {
  category: SettingsCategory;
  draft: SettingsValues;
}

export const SETTINGS_CATEGORIES: readonly SettingsCategory[] = ['general', 'editor'];

export const DEFAULT_SETTINGS: SettingsValues = {
  general: {
    theme: 'dark',
    trackBackground: true,
    startupTone: true,
  },
  editor: {
    restoreCursor: true,
    restoreView: true,
    pasteTrackMode: 'replace',
  },
};

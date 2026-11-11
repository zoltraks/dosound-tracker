/**
 * UI view-state snapshot persisted to localStorage. Restores the exact view
 * the user left after a page reload: the open modal (view/configuration
 * modals only - pending destructive-confirmation dialogs never restore),
 * the sequencer cursor line, channel mutes, the markdown scroll offset, and
 * the settings modal session (active category and uncommitted draft).
 * Fire-and-forget semantics: corrupt or missing data degrades to null.
 */
import { StorageKeys } from './storageKeys.ts';
import {
  SETTINGS_CATEGORIES,
  type SettingsCategory,
  type SettingsSession,
} from '../../types/settings.ts';

export type RestorableModal =
  | 'manual'
  | 'changelog'
  | 'about'
  | 'download'
  | 'debugInfo'
  | 'midi'
  | 'instrumentMidi'
  | 'instrumentColor'
  | 'export'
  | 'settings';

const RESTORABLE_MODALS: readonly RestorableModal[] = [
  'manual',
  'changelog',
  'about',
  'download',
  'debugInfo',
  'midi',
  'instrumentMidi',
  'instrumentColor',
  'export',
  'settings',
];

export interface UiState {
  openModal: RestorableModal | null;
  sharedCurrentLine: number;
  markdownScroll: number;
  windowScroll: number;
  settingsView: SettingsSession | null;
}

export const DEFAULT_UI_STATE: UiState = {
  openModal: null,
  sharedCurrentLine: 0,
  markdownScroll: 0,
  windowScroll: 0,
  settingsView: null,
};

export const loadUiState = (): UiState => {
  try {
    const raw = window.localStorage.getItem(StorageKeys.UI_STATE);
    if (!raw) {
      return { ...DEFAULT_UI_STATE };
    }
    const parsed = JSON.parse(raw) as Partial<UiState>;
    const openModal = RESTORABLE_MODALS.includes(parsed.openModal as RestorableModal)
      ? (parsed.openModal as RestorableModal)
      : null;
    const storedView = parsed.settingsView;
    const settingsView: SettingsSession | null =
      storedView && typeof storedView === 'object'
        ? {
            category: SETTINGS_CATEGORIES.includes(storedView.category as SettingsCategory)
              ? (storedView.category as SettingsCategory)
              : 'general',
            draft: storedView.draft,
            focus: typeof storedView.focus === 'string' ? storedView.focus : null,
            paneScroll: typeof storedView.paneScroll === 'number' ? storedView.paneScroll : 0,
            confirmingReset: storedView.confirmingReset === true,
          }
        : null;
    return {
      openModal,
      sharedCurrentLine:
        typeof parsed.sharedCurrentLine === 'number' ? parsed.sharedCurrentLine : 0,
      markdownScroll: typeof parsed.markdownScroll === 'number' ? parsed.markdownScroll : 0,
      windowScroll: typeof parsed.windowScroll === 'number' ? parsed.windowScroll : 0,
      settingsView,
    };
  } catch {
    return { ...DEFAULT_UI_STATE };
  }
};

export const saveUiState = (state: UiState): void => {
  try {
    window.localStorage.setItem(StorageKeys.UI_STATE, JSON.stringify(state));
  } catch {
    // Storage is full or unavailable - the snapshot is best-effort.
  }
};

/** Read-modify-write the scroll offset only - the MarkdownModal owns it. */
export const updateMarkdownScroll = (markdownScroll: number): void => {
  const state = loadUiState();
  saveUiState({ ...state, markdownScroll });
};

/** Read-modify-write the window scroll offset - scroll-only events need no
 *  full snapshot write. */
export const updateWindowScroll = (windowScroll: number): void => {
  const state = loadUiState();
  saveUiState({ ...state, windowScroll });
};

/** Merge a partial update into the settings modal session without clearing siblings. */
export const patchSettingsView = (partial: Partial<SettingsSession>): void => {
  const current = loadUiState().settingsView;
  if (!current) {
    return;
  }
  updateSettingsView({ ...current, ...partial });
};

/** Read-modify-write the settings modal session - the SettingsModal owns it. */
export const updateSettingsView = (settingsView: SettingsSession | null): void => {
  const state = loadUiState();
  saveUiState({ ...state, settingsView });
};

export const clearUiState = (): void => {
  try {
    window.localStorage.removeItem(StorageKeys.UI_STATE);
  } catch {
    // ignore
  }
};

/**
 * UI view-state snapshot persisted to localStorage. Restores the exact view
 * the user left after a page reload: the open modal (view/configuration
 * modals only - pending destructive-confirmation dialogs never restore),
 * the sequencer cursor line, channel mutes, and the markdown scroll offset.
 * Fire-and-forget semantics: corrupt or missing data degrades to null.
 */
import { StorageKeys } from './storageKeys.ts';

export type RestorableModal =
  | 'manual'
  | 'changelog'
  | 'about'
  | 'download'
  | 'debugInfo'
  | 'midi'
  | 'instrumentMidi'
  | 'instrumentColor'
  | 'export';

export const RESTORABLE_MODALS: readonly RestorableModal[] = [
  'manual',
  'changelog',
  'about',
  'download',
  'debugInfo',
  'midi',
  'instrumentMidi',
  'instrumentColor',
  'export',
];

export interface UiState {
  openModal: RestorableModal | null;
  sharedCurrentLine: number;
  markdownScroll: number;
  windowScroll: number;
}

export const DEFAULT_UI_STATE: UiState = {
  openModal: null,
  sharedCurrentLine: 0,
  markdownScroll: 0,
  windowScroll: 0,
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
    return {
      openModal,
      sharedCurrentLine:
        typeof parsed.sharedCurrentLine === 'number' ? parsed.sharedCurrentLine : 0,
      markdownScroll: typeof parsed.markdownScroll === 'number' ? parsed.markdownScroll : 0,
      windowScroll: typeof parsed.windowScroll === 'number' ? parsed.windowScroll : 0,
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

export const clearUiState = (): void => {
  try {
    window.localStorage.removeItem(StorageKeys.UI_STATE);
  } catch {
    // ignore
  }
};

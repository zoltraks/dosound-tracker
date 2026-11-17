import { create } from 'zustand';
import { DEFAULT_OCTAVE, MIN_OCTAVE, MAX_OCTAVE } from '../../constants/music.ts';
import { SONG_CHANNEL_COUNT } from '../../constants/song.ts';
import { StorageKeys } from '../../utils/storage/storageKeys.ts';
import { loadUiState } from '../../utils/storage/uiState.ts';

export type UiStoreState = {
  currentOctave: number;
  sharedCurrentLine: number;
  channelMutes: boolean[];
};

export type UiStoreActions = {
  setCurrentOctave: (octave: number) => void;
  setSharedCurrentLine: (line: number) => void;
  setChannelMutes: (mutes: boolean[]) => void;
  toggleChannelMute: (index: number) => void;
};

export type UiStore = UiStoreState & UiStoreActions;

const getInitialOctave = (): number => {
  if (typeof window === 'undefined') {
    return DEFAULT_OCTAVE;
  }

  try {
    const stored = window.localStorage.getItem(StorageKeys.OCTAVE);
    if (stored !== null) {
      const value = Number(stored);
      if (Number.isFinite(value)) {
        return Math.max(MIN_OCTAVE, Math.min(MAX_OCTAVE, Math.floor(value)));
      }
    }
  } catch {
    // ignore
  }

  return DEFAULT_OCTAVE;
};

const getInitialChannelMutes = (): boolean[] => {
  const empty = Array.from({ length: SONG_CHANNEL_COUNT }, () => false);
  if (typeof window === 'undefined') {
    return empty;
  }

  try {
    const stored = window.localStorage.getItem(StorageKeys.EQ_MUTES);
    if (!stored) return empty;
    const parsed = JSON.parse(stored);
    // Stored state may carry the legacy three-entry shape; normalize to the
    // six-channel layout, padding missing second-chip mutes as unmuted.
    if (
      Array.isArray(parsed) &&
      (parsed.length === SONG_CHANNEL_COUNT || parsed.length === 3) &&
      parsed.every((v) => typeof v === 'boolean')
    ) {
      return Array.from({ length: SONG_CHANNEL_COUNT }, (_, i) => parsed[i] ?? false);
    }
  } catch {
    // ignore
  }

  return empty;
};

export const useUiStore = create<UiStore>((set) => ({
  currentOctave: getInitialOctave(),
  sharedCurrentLine: loadUiState().sharedCurrentLine,
  channelMutes: getInitialChannelMutes(),
  setCurrentOctave: (octave: number) => {
    try {
      window.localStorage.setItem(StorageKeys.OCTAVE, String(octave));
    } catch {
      // ignore
    }
    set({ currentOctave: octave });
  },
  setSharedCurrentLine: (line: number) => set({ sharedCurrentLine: line }),
  setChannelMutes: (mutes: boolean[]) => set({ channelMutes: mutes }),
  toggleChannelMute: (index: number) =>
    set((state: UiStore) => {
      const next = [...state.channelMutes];
      if (index >= 0 && index < next.length) {
        next[index] = !next[index];
      }
      return { channelMutes: next };
    }),
}));

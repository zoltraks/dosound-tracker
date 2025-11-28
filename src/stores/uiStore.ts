import { create } from 'zustand';
import { DEFAULT_OCTAVE } from '../constants/music';

export type UiStoreState = {
  currentOctave: number;
  sharedCurrentLine: number;
  channelMutes: [boolean, boolean, boolean];
};

export type UiStoreActions = {
  setCurrentOctave: (octave: number) => void;
  setSharedCurrentLine: (line: number) => void;
  setChannelMutes: (mutes: [boolean, boolean, boolean]) => void;
  toggleChannelMute: (index: number) => void;
};

export type UiStore = UiStoreState & UiStoreActions;

const getInitialChannelMutes = (): [boolean, boolean, boolean] => {
  if (typeof window === 'undefined') {
    return [false, false, false];
  }

  try {
    const stored = window.localStorage.getItem('dosound-tracker-eq-mutes');
    if (!stored) return [false, false, false];
    const parsed = JSON.parse(stored);
    if (
      Array.isArray(parsed) &&
      parsed.length === 3 &&
      parsed.every(v => typeof v === 'boolean')
    ) {
      return [parsed[0], parsed[1], parsed[2]] as [boolean, boolean, boolean];
    }
  } catch {
    // ignore
  }

  return [false, false, false];
};

type UiStoreSetFn = (
  partial: Partial<UiStore> | ((state: UiStore) => Partial<UiStore>),
  replace?: boolean
) => void;

export const useUiStore = create<UiStore>((set: UiStoreSetFn) => ({
  currentOctave: DEFAULT_OCTAVE,
  sharedCurrentLine: 0,
  channelMutes: getInitialChannelMutes(),
  setCurrentOctave: (octave: number) => set({ currentOctave: octave }),
  setSharedCurrentLine: (line: number) => set({ sharedCurrentLine: line }),
  setChannelMutes: (mutes: [boolean, boolean, boolean]) => set({ channelMutes: mutes }),
  toggleChannelMute: (index: number) =>
    set((state: UiStore) => {
      const next = [...state.channelMutes] as [boolean, boolean, boolean];
      if (index >= 0 && index < next.length) {
        next[index] = !next[index];
      }
      return { channelMutes: next };
    }),
}));

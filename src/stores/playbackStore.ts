import { create } from 'zustand';
import type { SequencerState } from '../hooks/useSequencer';

export type PlaybackStoreState = {
  sequencerState: SequencerState | null;
};

export type PlaybackStoreActions = {
  setSequencerState: (state: SequencerState | null) => void;
};

export type PlaybackStore = PlaybackStoreState & PlaybackStoreActions;

type PlaybackStoreSetFn = (
  partial: Partial<PlaybackStore> | ((state: PlaybackStore) => Partial<PlaybackStore>),
  replace?: boolean
) => void;

export const usePlaybackStore = create<PlaybackStore>((set: PlaybackStoreSetFn) => ({
  sequencerState: null,
  setSequencerState: (state: SequencerState | null) => set({ sequencerState: state }),
}));

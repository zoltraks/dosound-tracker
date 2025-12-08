import { create } from 'zustand';
import type { Song } from '../synth/SoundDriver';

export type SongStoreState = {
  currentSong: Song | null;
};

export type SongStoreActions = {
  setSong: (song: Song) => void;
  updateSong: (updater: (prev: Song) => Song) => void;
};

export type SongStore = SongStoreState & SongStoreActions;

type SongStoreSetFn = (
  partial: Partial<SongStore> | ((state: SongStore) => Partial<SongStore>),
  replace?: boolean
) => void;

export const useSongStore = create<SongStore>((set: SongStoreSetFn) => ({
  currentSong: null,
  setSong: (song: Song) => set({ currentSong: song }),
  updateSong: (updater: (prev: Song) => Song) =>
    set(state => {
      if (!state.currentSong) {
        return state;
      }
      return { currentSong: updater(state.currentSong) };
    }),
}));

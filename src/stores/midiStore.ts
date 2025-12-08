import { create } from 'zustand';
import type { MidiConfig } from '../hooks/useMidi';

export type MidiStoreState = {
  config: MidiConfig | null;
};

export type MidiStoreActions = {
  setConfig: (config: MidiConfig | null) => void;
};

export type MidiStore = MidiStoreState & MidiStoreActions;

type MidiStoreSetFn = (
  partial: Partial<MidiStore> | ((state: MidiStore) => Partial<MidiStore>),
  replace?: boolean
) => void;

export const useMidiStore = create<MidiStore>((set: MidiStoreSetFn) => ({
  config: null,
  setConfig: (config: MidiConfig | null) => set({ config }),
}));

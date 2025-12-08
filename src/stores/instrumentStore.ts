import { create } from 'zustand';
import type { Instrument } from '../synth/SoundDriver';

export type InstrumentStoreState = {
  currentInstrument: Instrument | null;
  instruments: Instrument[];
};

export type InstrumentStoreActions = {
  setCurrentInstrument: (instrument: Instrument | null) => void;
  setInstruments: (instruments: Instrument[]) => void;
};

export type InstrumentStore = InstrumentStoreState & InstrumentStoreActions;

type InstrumentStoreSetFn = (
  partial:
    | Partial<InstrumentStore>
    | ((state: InstrumentStore) => Partial<InstrumentStore>),
  replace?: boolean
) => void;

export const useInstrumentStore = create<InstrumentStore>((set: InstrumentStoreSetFn) => ({
  currentInstrument: null,
  instruments: [],
  setCurrentInstrument: (instrument: Instrument | null) =>
    set({ currentInstrument: instrument }),
  setInstruments: (instruments: Instrument[]) => set({ instruments }),
}));

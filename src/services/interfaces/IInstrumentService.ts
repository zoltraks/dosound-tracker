import type { Instrument } from '../../synth/SoundDriver';

export type InstrumentTemplate = Partial<Instrument>;

export interface IInstrumentService {
  createInstrument(template?: InstrumentTemplate): Instrument;
  updateInstrument(current: Instrument, updates: Partial<Instrument>): Instrument;
  deleteInstrument(instrumentId: string, instruments: Instrument[]): Instrument[];
}

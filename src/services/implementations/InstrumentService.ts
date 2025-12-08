import type { Instrument } from '../../synth/SoundDriver';
import { ENVELOPE_LENGTH, DEFAULT_OCTAVE } from '../../constants/music';
import type { IInstrumentService, InstrumentTemplate } from '../interfaces/IInstrumentService';

const createEnvelope = (source: number[] | undefined, defaultValue: number): number[] => {
  if (Array.isArray(source) && source.length === ENVELOPE_LENGTH) {
    return source.slice();
  }

  const base = Array.isArray(source) && source.length > 0 ? source : undefined;
  const values: number[] = [];

  for (let i = 0; i < ENVELOPE_LENGTH; i += 1) {
    if (base && i < base.length) {
      values[i] = base[i];
    } else if (base && base.length > 0) {
      values[i] = base[base.length - 1];
    } else {
      values[i] = defaultValue;
    }
  }

  return values;
};

export class InstrumentService implements IInstrumentService {
  createInstrument(template?: InstrumentTemplate): Instrument {
    const volume = createEnvelope(template?.volume, 0);
    const arpeggio = createEnvelope(template?.arpeggio, 0);
    const pitch = createEnvelope(template?.pitch, 0);
    const noiseEnvelope = createEnvelope(template?.noiseEnvelope, 0);
    const mode = createEnvelope(template?.mode, 0);

    const octave =
      typeof template?.octave === 'number' && Number.isFinite(template.octave)
        ? template.octave
        : DEFAULT_OCTAVE;

    const instrument: Instrument = {
      id: template?.id ?? '00',
      name: template?.name ?? '',
      volume,
      arpeggio,
      pitch,
      noiseEnvelope,
      mode,
      base: template?.base,
      octave,
      sustain: template?.sustain ?? null,
      midi: template?.midi,
    };

    return instrument;
  }

  updateInstrument(current: Instrument, updates: Partial<Instrument>): Instrument {
    const merged: Instrument = {
      ...current,
      ...updates,
    };
    return merged;
  }

  deleteInstrument(instrumentId: string, instruments: Instrument[]): Instrument[] {
    return instruments.filter(inst => inst.id !== instrumentId);
  }
}

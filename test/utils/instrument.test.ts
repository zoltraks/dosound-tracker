import { describe, it, expect } from 'vitest';
import type { Instrument } from '../../src/synth/SoundDriver';
import { isInstrumentEmpty } from '../../src/utils/instrument';

const makeEmptyInstrument = (overrides: Partial<Instrument> = {}): Instrument => ({
  id: '00',
  name: '',
  volume: Array(32).fill(0),
  arpeggio: Array(32).fill(0),
  pitch: Array(32).fill(0),
  noise: Array(32).fill(0),
  mode: Array(32).fill(0),
  ...overrides,
});

describe('isInstrumentEmpty', () => {
  it('treats undefined and null as empty', () => {
    expect(isInstrumentEmpty(undefined)).toBe(true);
    expect(isInstrumentEmpty(null)).toBe(true);
  });

  it('returns true when all parameters are at default/empty values', () => {
    const inst = makeEmptyInstrument();
    expect(isInstrumentEmpty(inst)).toBe(true);
  });

  it('returns false when only the name is non-empty', () => {
    const inst = makeEmptyInstrument({ name: 'No-Name Inst' });
    expect(isInstrumentEmpty(inst)).toBe(false);
  });

  it('returns false when volume envelope has any non-zero value', () => {
    const inst = makeEmptyInstrument({ volume: [0, 0, 1, ...Array(29).fill(0)] });
    expect(isInstrumentEmpty(inst)).toBe(false);
  });

  it('returns false when arpeggio envelope has any non-zero value', () => {
    const inst = makeEmptyInstrument({ arpeggio: [0, 2, ...Array(30).fill(0)] });
    expect(isInstrumentEmpty(inst)).toBe(false);
  });

  it('returns false when pitch envelope has any non-zero value', () => {
    const inst = makeEmptyInstrument({ pitch: [0, 0, 0, -1, ...Array(28).fill(0)] });
    expect(isInstrumentEmpty(inst)).toBe(false);
  });

  it('returns false when noise envelope has any non-zero value', () => {
    const inst = makeEmptyInstrument({ noise: [0, 0, 3, ...Array(29).fill(0)] });
    expect(isInstrumentEmpty(inst)).toBe(false);
  });

  it('returns false when mode envelope has any non-zero value', () => {
    const inst = makeEmptyInstrument({ mode: [1, ...Array(31).fill(0)] });
    expect(isInstrumentEmpty(inst)).toBe(false);
  });
});

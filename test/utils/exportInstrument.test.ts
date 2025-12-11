import { describe, it, expect } from 'vitest';
import type { Instrument, Song } from '../../src/synth/SoundDriver';
import { exportInstrumentToAssembly } from '../../src/exports/asm';

describe('exportInstrumentToAssembly', () => {
  it('exports correct assembly for noise-only instrument with pattern length 4 and speed 2', () => {
    const instrument: Instrument = {
      id: '00',
      name: '',
      volume: [
        1, 2, 3, 4, 5, 6, 7, 8, 9, 10,
        11, 12, 13, 14, 15, 14, 13, 12, 11, 10,
        9, 8, 7, 6, 5, 4, 3, 2, 1, 0,
      ],
      arpeggio: [],
      pitch: [],
      noiseEnvelope: [
        4, 5, 6, 7, 8, 9, 10, 11, 12, 13,
        14, 15, 16, 15, 14, 13, 12, 11, 10, 9,
        8, 7, 6, 5, 4, 3, 2, 1, 0,
      ],
      mode: [
        1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
        1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
        1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
        0,
      ],
      base: 'C-4',
      sustain: null,
    };

    const song: Song = {
      title: 'Test Song',
      author: 'Test',
      year: 2025,
      speed: 2,
      patternLength: 4,
      loop: null,
      patterns: [],
      playlist: [],
      instruments: [],
    };

    const asm = exportInstrumentToAssembly(instrument, song);

    const expected = [
      'music:',
      '',
      '\t; START',
      '',
      '\tdc.b $7,$31        ; MX N+T+T',
      '\tdc.b $8,$1         ; VA 1',
      '\tdc.b $9,$0         ; VB 0',
      '\tdc.b $A,$0         ; VC 0',
      '\tdc.b $6,$4         ; NS 4',
      '\tdc.b $FF,$1        ; DL 2',
      '\tdc.b $6,$5         ; NS 5',
      '\tdc.b $8,$2         ; VA 2',
      '\tdc.b $FF,$1        ; DL 2',
      '\tdc.b $6,$6         ; NS 6',
      '\tdc.b $8,$3         ; VA 3',
      '\tdc.b $FF,$1        ; DL 2',
      '\tdc.b $6,$7         ; NS 7',
      '\tdc.b $8,$4         ; VA 4',
      '\tdc.b $FF,$1        ; DL 2',
      '',
      '\t; END',
      '',
      '\tdc.b $8,$0         ; VA 0',
      '\tdc.b $9,$0         ; VB 0',
      '\tdc.b $A,$0         ; VC 0',
      '',
      '\tdc.b $FF,$0        ; STOP',
    ].join('\n') + '\n';

    expect(asm).toBe(expected);
  });
});

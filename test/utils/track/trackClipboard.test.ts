// @vitest-environment node

import { describe, it, expect } from 'vitest';
import {
  generateClipboardData,
  parseClipboardData,
  applyClipboardToLines,
  type TrackClipboardStep,
} from '../../../src/utils/track/trackClipboard.ts';
import type { Pattern, Step } from '../../../src/synth/SoundDriver.ts';
import { formatBaseKey, parseBaseKey } from '../../../src/utils/song/songFormat.ts';
import { PATTERN_LENGTH, MAX_PATTERN_LENGTH } from '../../../src/constants/music.ts';
import { MAX_IMPORT_BYTES } from '../../../src/constants/import.ts';

const makeNote = (note: string, octave = 4, instrument = '00') => ({ note, octave, instrument });

const makePattern = (step: Step[]): Pattern => ({ id: 'p1', name: 'P1', step });

describe('parseClipboardData bounded expansion', () => {
  it('bounds wait runs to the maximum pattern length', () => {
    try {
      const steps = parseClipboardData('step:\n  - wait: 1000000');
      expect(steps.length).toBeLessThanOrEqual(MAX_PATTERN_LENGTH);
      expect(steps.every((s) => s.wait === true)).toBe(true);
    } catch (error) {
      console.log('bounded-wait mismatch');
      throw error;
    }
  });

  it('bounds off runs to the maximum pattern length', () => {
    try {
      const steps = parseClipboardData('step:\n  - off: 999999');
      expect(steps.length).toBeLessThanOrEqual(MAX_PATTERN_LENGTH);
      expect(steps[0].note).toBe('OFF');
    } catch (error) {
      console.log('bounded-off mismatch');
      throw error;
    }
  });

  it('parses a small valid payload', () => {
    try {
      const steps = parseClipboardData('step:\n  - note: "C-4"\n    instrument: "00"\n  - wait: 2');
      expect(steps).toHaveLength(3);
      expect(steps[0].note).toBe('C-4');
    } catch (error) {
      console.log('valid-payload mismatch');
      throw error;
    }
  });

  it('rejects text over the import byte cap', () => {
    try {
      const oversized = 'step:\n  - wait: 1\n' + '#'.repeat(MAX_IMPORT_BYTES);
      expect(() => parseClipboardData(oversized)).toThrow('maximum import size');
    } catch (error) {
      console.log('byte-cap mismatch');
      throw error;
    }
  });
});

describe('parseClipboardData node handling', () => {
  it('rejects malformed YAML with a parse error', () => {
    expect(() => parseClipboardData('step:\n  - wait: [')).toThrow('Failed to parse YAML:');
  });

  it('rejects a document that is not a mapping', () => {
    expect(() => parseClipboardData('just a string')).toThrow('missing "step" list');
    expect(() => parseClipboardData('~')).toThrow('missing "step" list');
    expect(() => parseClipboardData('- a\n- b')).toThrow('missing "step" list');
  });

  it('rejects a mapping without a step array', () => {
    expect(() => parseClipboardData('foo: bar')).toThrow('missing "step" list');
    expect(() => parseClipboardData('step: 5')).toThrow('missing "step" list');
    expect(() => parseClipboardData('step: {}')).toThrow('missing "step" list');
  });

  it('expands wait runs that carry a volume', () => {
    const steps = parseClipboardData('step:\n  - wait: 2\n    volume: 5');
    expect(steps).toHaveLength(2);
    expect(steps[0]).toEqual({ wait: true, volume: 5 });
    expect(steps[1]).toEqual({ wait: true, volume: 5 });
  });

  it('expands off runs that carry a volume', () => {
    const steps = parseClipboardData('step:\n  - off: 2\n    volume: 7');
    expect(steps).toHaveLength(2);
    expect(steps[0]).toEqual({ note: 'OFF', volume: 7 });
  });

  it('treats the space key like wait', () => {
    const steps = parseClipboardData('step:\n  - space: 2');
    expect(steps).toHaveLength(2);
    expect(steps.every((s) => s.wait === true)).toBe(true);
  });

  it('expands a single-item run of one', () => {
    const steps = parseClipboardData('step:\n  - wait: 1');
    expect(steps).toEqual([{ wait: true }]);
  });

  it('leaves a note node with extra keys unexpanded', () => {
    const steps = parseClipboardData('step:\n  - wait: 2\n    note: "C-4"');
    expect(steps).toHaveLength(1);
    expect(steps[0].note).toBe('C-4');
    expect(steps[0].wait).toBe(2);
  });

  it('passes non-object entries through untouched', () => {
    const steps = parseClipboardData('step:\n  - 7\n  - "raw"');
    expect(steps).toHaveLength(2);
    expect(steps[0] as unknown as number).toBe(7);
    expect(steps[1] as unknown as string).toBe('raw');
  });

  it('treats a wait-plus-off node as a wait run', () => {
    const steps = parseClipboardData('step:\n  - wait: 2\n    off: 3');
    expect(steps).toHaveLength(2);
    expect(steps.every((s) => s.wait === true)).toBe(true);
  });
});

describe('generateClipboardData', () => {
  it('exports a note line with formatted key and instrument', () => {
    const yaml = generateClipboardData(
      makePattern([{ note: makeNote('C', 4, '0A') }]),
      4,
      formatBaseKey,
    );
    try {
      expect(yaml).toContain('note: "C-4"');
      expect(yaml).toContain('instrument:');
      expect(yaml).toContain('0A');
      const round = parseClipboardData(yaml);
      expect(round[0].note).toBe('C-4');
      expect(round[0].instrument).toBe('0A');
    } catch (error) {
      console.log('note-export mismatch', yaml);
      throw error;
    }
  });

  it('marks "===" cells as OFF steps', () => {
    const yaml = generateClipboardData(makePattern([{ note: makeNote('===') }]), 4, formatBaseKey);
    try {
      expect(yaml).toContain('note: "OFF"');
      const round = parseClipboardData(yaml);
      expect(round[0].note).toBe('OFF');
    } catch (error) {
      console.log('off-export mismatch', yaml);
      throw error;
    }
  });

  it('run-length encodes consecutive empty lines', () => {
    const yaml = generateClipboardData(
      makePattern([
        { note: null },
        { note: null },
        { note: null },
        { note: makeNote('D', 2, '01') },
      ]),
      4,
      formatBaseKey,
    );
    try {
      expect(yaml).toContain('wait: 3');
      const round = parseClipboardData(yaml);
      expect(round).toHaveLength(4);
      expect(round[0].wait).toBe(true);
      expect(round[3].note).toBe('D-2');
    } catch (error) {
      console.log('wait-run mismatch', yaml);
      throw error;
    }
  });

  it('drops trailing pure waits from the export', () => {
    const yaml = generateClipboardData(
      makePattern([{ note: makeNote('E', 3, '02') }, { note: null }, { note: null }]),
      4,
      formatBaseKey,
    );
    try {
      expect(yaml).not.toContain('wait');
      const round = parseClipboardData(yaml);
      expect(round).toHaveLength(1);
    } catch (error) {
      console.log('trailing-trim mismatch', yaml);
      throw error;
    }
  });

  it('exports an empty step list for an all-empty pattern', () => {
    const yaml = generateClipboardData(
      makePattern([{ note: null }, { note: null }]),
      4,
      formatBaseKey,
    );
    expect(yaml).toContain('step: []');
  });

  it('encodes a single volume-only line as a bare volume node', () => {
    const yaml = generateClipboardData(
      makePattern([{ note: null, volume: 5 }, { note: makeNote('F', 1, '03') }]),
      4,
      formatBaseKey,
    );
    try {
      expect(yaml).toContain('volume: 5');
      expect(yaml).not.toContain('wait: 1');
      // A bare {volume} node expands like a wait row carrying the volume.
      const round = parseClipboardData(yaml);
      expect(round[0]).toEqual({ wait: true, volume: 5 });
      // Round-trip idempotence: the parsed step serializes to the same node.
      const again = parseClipboardData(
        generateClipboardData(
          makePattern([{ note: null, volume: 5 }, { note: makeNote('F', 1, '03') }]),
          4,
          formatBaseKey,
        ),
      );
      expect(again[0]).toEqual(round[0]);
    } catch (error) {
      console.log('single-volume mismatch', yaml);
      throw error;
    }
  });

  it('run-length encodes consecutive volume-only lines with the same volume', () => {
    const yaml = generateClipboardData(
      makePattern([
        { note: null, volume: 5 },
        { note: null, volume: 5 },
        { note: makeNote('G', 5, '04') },
      ]),
      4,
      formatBaseKey,
    );
    try {
      expect(yaml).toContain('wait: 2');
      expect(yaml).toContain('volume: 5');
      const round = parseClipboardData(yaml);
      expect(round).toHaveLength(3);
      expect(round[0]).toEqual({ wait: true, volume: 5 });
      expect(round[1]).toEqual({ wait: true, volume: 5 });
    } catch (error) {
      console.log('volume-run mismatch', yaml);
      throw error;
    }
  });

  it('splits volume runs when the volume changes', () => {
    const yaml = generateClipboardData(
      makePattern([
        { note: null, volume: 5 },
        { note: null, volume: 7 },
        { note: makeNote('A', 4, '05') },
      ]),
      4,
      formatBaseKey,
    );
    try {
      // Each volume run has count 1, so both emit as bare {volume} nodes and
      // expand back into wait rows carrying their own volume.
      const round = parseClipboardData(yaml);
      expect(round[0]).toEqual({ wait: true, volume: 5 });
      expect(round[1]).toEqual({ wait: true, volume: 7 });
      expect(round[2].note).toBe('A-4');
    } catch (error) {
      console.log('volume-split mismatch', yaml);
      throw error;
    }
  });

  it('breaks a space run around a non-space step', () => {
    const yaml = generateClipboardData(
      makePattern([
        { note: null },
        { note: makeNote('B', 4, '06') },
        { note: null },
        { note: null },
        { note: makeNote('C', 5, '07') },
      ]),
      5,
      formatBaseKey,
    );
    try {
      expect(yaml).toContain('wait: 1');
      expect(yaml).toContain('wait: 2');
      const round = parseClipboardData(yaml);
      expect(round).toHaveLength(5);
      expect(round[1].note).toBe('B-4');
      expect(round[4].note).toBe('C-5');
    } catch (error) {
      console.log('run-break mismatch', yaml);
      throw error;
    }
  });

  it('clamps an out-of-range volume into the nibble range', () => {
    const yaml = generateClipboardData(
      makePattern([{ note: makeNote('C', 4, '00'), volume: 99 }]),
      4,
      formatBaseKey,
    );
    try {
      expect(yaml).toContain('volume: 15');
    } catch (error) {
      console.log('volume-clamp mismatch', yaml);
      throw error;
    }
  });

  it('omits a non-finite volume value', () => {
    const line: Step = { note: makeNote('C', 4, '00') };
    (line as { volume?: unknown }).volume = 'loud';
    const yaml = generateClipboardData(
      makePattern([line, { note: makeNote('D', 4, '00') }]),
      4,
      formatBaseKey,
    );
    try {
      expect(yaml).not.toContain('volume');
      const round = parseClipboardData(yaml);
      expect(round[0].volume).toBeUndefined();
    } catch (error) {
      console.log('nonfinite-volume mismatch', yaml);
      throw error;
    }
  });

  it('treats missing lines as empty waits', () => {
    const step = [
      { note: makeNote('C', 4, '00') },
      undefined,
      { note: makeNote('D', 4, '00') },
    ] as unknown as Step[];
    const yaml = generateClipboardData(makePattern(step), 3, formatBaseKey);
    try {
      expect(yaml).toContain('wait: 1');
      const round = parseClipboardData(yaml);
      expect(round).toHaveLength(3);
      expect(round[1].wait).toBe(true);
    } catch (error) {
      console.log('missing-lines mismatch', yaml);
      throw error;
    }
  });

  it('falls back to the default pattern length when patternLength is 0', () => {
    const step: Step[] = new Array(PATTERN_LENGTH).fill({ note: null });
    step[PATTERN_LENGTH - 1] = { note: makeNote('C', 4, '00') };
    const yaml = generateClipboardData(makePattern(step), 0, formatBaseKey);
    try {
      expect(yaml).toContain(`wait: ${PATTERN_LENGTH - 1}`);
      expect(yaml).toContain('note: "C-4"');
    } catch (error) {
      console.log('length-fallback mismatch', yaml);
      throw error;
    }
  });

  it('handles a pattern without a step array', () => {
    const pattern = { id: 'p1', name: 'P1' } as unknown as Pattern;
    const yaml = generateClipboardData(pattern, 4, formatBaseKey);
    expect(yaml).toContain('step: []');
  });
});

describe('applyClipboardToLines replace mode', () => {
  it('applies a note step and clears lines beyond the clipboard', () => {
    const existing: Step[] = [
      { note: makeNote('E', 5, '09'), volume: 3 },
      { note: makeNote('F', 5, '08'), volume: 2 },
    ];
    const steps: TrackClipboardStep[] = [{ note: 'C-4', instrument: '01' }];
    const out = applyClipboardToLines(existing, steps, 'replace', 2, parseBaseKey);
    try {
      expect(out).toHaveLength(2);
      expect(out[0].note).toEqual({ note: 'C', octave: 4, instrument: '01' });
      expect(out[1].note).toBeNull();
      expect(out[1].volume).toBeUndefined();
    } catch (error) {
      console.log('replace-clear mismatch');
      throw error;
    }
  });

  it('preserves rows after the fragment when clearTail is false at offset zero', () => {
    const existing: Step[] = [
      { note: makeNote('E', 5, '09'), volume: 3 },
      { note: makeNote('F', 5, '08'), volume: 2 },
      { note: makeNote('G', 5, '07'), volume: 1 },
    ];
    const out = applyClipboardToLines(
      existing,
      [{ note: 'C-4', instrument: '01' }],
      'replace',
      3,
      parseBaseKey,
      0,
      false,
    );
    expect(out[0].note).toEqual({ note: 'C', octave: 4, instrument: '01' });
    expect(out[1].note).toEqual({ note: 'F', octave: 5, instrument: '08' });
    expect(out[1].volume).toBe(2);
    expect(out[2].note).toEqual({ note: 'G', octave: 5, instrument: '07' });
  });

  it('clears rows after the fragment but not before it under an explicit clearTail', () => {
    const existing: Step[] = [
      { note: makeNote('E', 5, '09') },
      { note: makeNote('F', 5, '08') },
      { note: makeNote('G', 5, '07') },
    ];
    const out = applyClipboardToLines(
      existing,
      [{ note: 'C-4', instrument: '01' }],
      'replace',
      3,
      parseBaseKey,
      1,
      true,
    );
    expect(out[0].note).toEqual({ note: 'E', octave: 5, instrument: '09' });
    expect(out[1].note).toEqual({ note: 'C', octave: 4, instrument: '01' });
    expect(out[2].note).toBeNull();
    expect(out[2].volume).toBeUndefined();
  });

  it('pads the result to the target length with cleared lines', () => {
    const out = applyClipboardToLines([], [{ note: 'C-4' }], 'replace', 3, parseBaseKey);
    try {
      expect(out).toHaveLength(3);
      expect(out[0].note).toEqual({ note: 'C', octave: 4, instrument: '00' });
      expect(out[1].note).toBeNull();
      expect(out[2].note).toBeNull();
    } catch (error) {
      console.log('replace-pad mismatch');
      throw error;
    }
  });

  it('uses the default pattern length when patternLength is 0', () => {
    const out = applyClipboardToLines([], [], 'replace', 0, parseBaseKey);
    expect(out).toHaveLength(PATTERN_LENGTH);
  });

  it('maps OFF notes to the === cell', () => {
    const out = applyClipboardToLines([], [{ note: 'OFF' }], 'replace', 1, parseBaseKey);
    expect(out[0].note).toEqual({ note: '===', octave: 0, instrument: '00' });
  });

  it('accepts OFF notes case-insensitively with whitespace', () => {
    const out = applyClipboardToLines([], [{ note: '  off  ' }], 'replace', 1, parseBaseKey);
    expect(out[0].note).toEqual({ note: '===', octave: 0, instrument: '00' });
  });

  it('clears the note for wait and space steps', () => {
    const existing: Step[] = [{ note: makeNote('C', 4, '00') }, { note: makeNote('D', 4, '00') }];
    const out = applyClipboardToLines(
      existing,
      [{ wait: true }, { space: true }],
      'replace',
      2,
      parseBaseKey,
    );
    expect(out[0].note).toBeNull();
    expect(out[1].note).toBeNull();
  });

  it('clears the note for a step with no note data', () => {
    const existing: Step[] = [{ note: makeNote('C', 4, '00') }];
    const out = applyClipboardToLines(existing, [{ volume: 9 }], 'replace', 1, parseBaseKey);
    try {
      expect(out[0].note).toBeNull();
      expect(out[0].volume).toBe(9);
    } catch (error) {
      console.log('bare-volume mismatch');
      throw error;
    }
  });

  it('throws on an unparseable note value', () => {
    expect(() => applyClipboardToLines([], [{ note: 'X' }], 'replace', 1, parseBaseKey)).toThrow(
      'Invalid note value "X" in track clipboard data at line 0.',
    );
  });

  it('normalizes and uppercases the instrument id', () => {
    const out = applyClipboardToLines(
      [],
      [{ note: 'C-4', instrument: ' 0a ' }],
      'replace',
      1,
      parseBaseKey,
    );
    expect(out[0].note).toEqual({ note: 'C', octave: 4, instrument: '0A' });
  });

  it.each([
    ['5', '05'],
    ['$0F', '0F'],
    ['0f', '0F'],
    ['0F ', '0F'],
  ])('normalizes the loose instrument id %s to %s', (input, expected) => {
    try {
      const out = applyClipboardToLines(
        [],
        [{ note: 'C-4', instrument: input }],
        'replace',
        1,
        parseBaseKey,
      );
      expect(out[0].note).toEqual({ note: 'C', octave: 4, instrument: expected });
    } catch (error) {
      console.log('loose-instrument mismatch', input);
      throw error;
    }
  });

  it('defaults a non-string instrument to 00', () => {
    const steps = [{ note: 'C-4', instrument: 7 } as unknown as TrackClipboardStep];
    const out = applyClipboardToLines([], steps, 'replace', 1, parseBaseKey);
    expect(out[0].note).toEqual({ note: 'C', octave: 4, instrument: '00' });
  });

  it('clamps the step volume into the nibble range', () => {
    const out = applyClipboardToLines([], [{ wait: true, volume: 99 }], 'replace', 1, parseBaseKey);
    expect(out[0].volume).toBe(15);
  });

  it('ignores a non-finite step volume', () => {
    const steps = [{ wait: true, volume: 'x' } as unknown as TrackClipboardStep];
    const out = applyClipboardToLines([], steps, 'replace', 1, parseBaseKey);
    expect(out[0].volume).toBeUndefined();
  });
});

describe('applyClipboardToLines overwriteAll mode', () => {
  it('keeps the base line when the step is empty', () => {
    const existing: Step[] = [{ note: makeNote('C', 4, '02'), volume: 4 }];
    const out = applyClipboardToLines(existing, [{ wait: true }], 'overwriteAll', 1, parseBaseKey);
    try {
      expect(out[0].note).toEqual(makeNote('C', 4, '02'));
      expect(out[0].volume).toBe(4);
    } catch (error) {
      console.log('overwriteAll-keep mismatch');
      throw error;
    }
  });

  it('overwrites the base line when the step carries data', () => {
    const existing: Step[] = [{ note: makeNote('C', 4, '02') }];
    const out = applyClipboardToLines(
      existing,
      [{ note: 'D-5', instrument: '03' }],
      'overwriteAll',
      1,
      parseBaseKey,
    );
    expect(out[0].note).toEqual({ note: 'D', octave: 5, instrument: '03' });
  });

  it('treats a step carrying extra keys as non-empty', () => {
    const existing: Step[] = [{ note: makeNote('C', 4, '02') }];
    const steps = [{ foo: 'bar' } as unknown as TrackClipboardStep];
    const out = applyClipboardToLines(existing, steps, 'overwriteAll', 1, parseBaseKey);
    expect(out[0].note).toBeNull();
  });

  it('treats a step with a blank note and no other keys as empty', () => {
    const existing: Step[] = [{ note: makeNote('C', 4, '02') }];
    const out = applyClipboardToLines(existing, [{ note: '   ' }], 'overwriteAll', 1, parseBaseKey);
    expect(out[0].note).toEqual(makeNote('C', 4, '02'));
  });

  it('treats a volume-only step as non-empty', () => {
    const existing: Step[] = [{ note: makeNote('C', 4, '02') }];
    const out = applyClipboardToLines(existing, [{ volume: 6 }], 'overwriteAll', 1, parseBaseKey);
    try {
      expect(out[0].volume).toBe(6);
      expect(out[0].note).toBeNull();
    } catch (error) {
      console.log('overwriteAll-volume mismatch');
      throw error;
    }
  });

  it('keeps the base line when the step slot is missing', () => {
    const existing: Step[] = [{ note: makeNote('C', 4, '02'), volume: 1 }];
    const out = applyClipboardToLines(existing, [], 'overwriteAll', 1, parseBaseKey);
    expect(out[0].note).toEqual(makeNote('C', 4, '02'));
    expect(out[0].volume).toBe(1);
  });
});

describe('applyClipboardToLines overwriteEmpty mode', () => {
  it('does not touch a base line that already has a note', () => {
    const existing: Step[] = [{ note: makeNote('C', 4, '02'), volume: 3 }];
    const out = applyClipboardToLines(
      existing,
      [{ note: 'D-5', instrument: '03' }],
      'overwriteEmpty',
      1,
      parseBaseKey,
    );
    try {
      expect(out[0].note).toEqual(makeNote('C', 4, '02'));
      expect(out[0].volume).toBe(3);
    } catch (error) {
      console.log('overwriteEmpty-occupied mismatch');
      throw error;
    }
  });

  it('does not touch a base line that only has a volume', () => {
    const existing: Step[] = [{ note: null, volume: 8 }];
    const out = applyClipboardToLines(
      existing,
      [{ note: 'D-5' }],
      'overwriteEmpty',
      1,
      parseBaseKey,
    );
    expect(out[0].volume).toBe(8);
    expect(out[0].note).toBeNull();
  });

  it('pastes into an empty base line', () => {
    const existing: Step[] = [{ note: null }];
    const out = applyClipboardToLines(
      existing,
      [{ note: 'G-3', instrument: '04' }],
      'overwriteEmpty',
      1,
      parseBaseKey,
    );
    expect(out[0].note).toEqual({ note: 'G', octave: 3, instrument: '04' });
  });

  it('pastes into a missing base line slot', () => {
    const out = applyClipboardToLines([], [{ note: 'A-2' }], 'overwriteEmpty', 1, parseBaseKey);
    expect(out[0].note).toEqual({ note: 'A', octave: 2, instrument: '00' });
  });

  it('keeps an empty base line when the step is also empty', () => {
    const existing: Step[] = [{ note: null }];
    const out = applyClipboardToLines(
      existing,
      [{ wait: true }],
      'overwriteEmpty',
      1,
      parseBaseKey,
    );
    expect(out[0].note).toBeNull();
  });
});

describe('generateClipboardData row ranges', () => {
  const rangedPattern = (): Pattern =>
    makePattern([
      { note: makeNote('C', 4), volume: 15 },
      { note: makeNote('D', 4), volume: 14 },
      { note: makeNote('E', 4), volume: 13 },
      { note: null, volume: null },
    ]);

  it('serializes only the selected row range', () => {
    const yaml = generateClipboardData(rangedPattern(), 4, formatBaseKey, { start: 1, end: 2 });
    const steps = parseClipboardData(yaml);
    expect(steps).toHaveLength(2);
    expect(steps[0].note).toBe('D-4');
    expect(steps[1].note).toBe('E-4');
  });

  it('keeps the full track when no range is given', () => {
    const yaml = generateClipboardData(rangedPattern(), 4, formatBaseKey);
    const steps = parseClipboardData(yaml);
    expect(steps).toHaveLength(3);
    expect(steps[0].note).toBe('C-4');
  });

  it('clamps the range to the pattern length', () => {
    const yaml = generateClipboardData(rangedPattern(), 4, formatBaseKey, { start: 2, end: 99 });
    const steps = parseClipboardData(yaml);
    expect(steps).toHaveLength(2);
    expect(steps[0].note).toBe('E-4');
    expect(steps[1]).toEqual({ wait: true });
  });

  it('keeps trailing empty rows inside the range', () => {
    const yaml = generateClipboardData(rangedPattern(), 4, formatBaseKey, { start: 0, end: 3 });
    const steps = parseClipboardData(yaml);
    expect(steps).toHaveLength(4);
    expect(steps[3]).toEqual({ wait: true });
  });

  it('serializes a fully empty range as a wait run of the same length', () => {
    const emptyPattern = makePattern([
      { note: null, volume: null },
      { note: null, volume: null },
      { note: null, volume: null },
    ]);
    const yaml = generateClipboardData(emptyPattern, 3, formatBaseKey, { start: 0, end: 2 });
    const steps = parseClipboardData(yaml);
    expect(steps).toHaveLength(3);
    expect(steps.every((step) => step.wait === true)).toBe(true);
  });
});

describe('applyClipboardToLines start offset', () => {
  it('applies pasted steps at the anchor row and keeps other rows', () => {
    const existing: Step[] = [
      { note: makeNote('C', 4) },
      { note: null },
      { note: makeNote('A', 2), volume: 9 },
    ];
    const out = applyClipboardToLines(
      existing,
      [{ note: 'G-3', instrument: '04' }],
      'replace',
      3,
      parseBaseKey,
      1,
    );
    expect(out[0].note).toEqual(makeNote('C', 4));
    expect(out[1].note).toEqual({ note: 'G', octave: 3, instrument: '04' });
    expect(out[2].note).toEqual(makeNote('A', 2));
    expect(out[2].volume).toBe(9);
  });

  it('clips the pasted fragment at the pattern length', () => {
    const existing: Step[] = [{ note: null }, { note: null }];
    const out = applyClipboardToLines(
      existing,
      [{ note: 'C-4' }, { note: 'D-4' }, { note: 'E-4' }],
      'replace',
      2,
      parseBaseKey,
      1,
    );
    expect(out).toHaveLength(2);
    expect(out[1].note?.note).toBe('C');
  });

  it('does not blank rows outside a fragment window under replace', () => {
    const existing: Step[] = [
      { note: makeNote('C', 4) },
      { note: null },
      { note: makeNote('A', 2) },
    ];
    const out = applyClipboardToLines(existing, [{ wait: true }], 'replace', 3, parseBaseKey, 1);
    expect(out[0].note).toEqual(makeNote('C', 4));
    expect(out[1].note).toBeNull();
    expect(out[2].note).toEqual(makeNote('A', 2));
  });
});

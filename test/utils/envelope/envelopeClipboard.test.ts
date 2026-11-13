// @vitest-environment node

import { describe, expect, it } from 'vitest';
import {
  generateEnvelopeClipboardData,
  parseEnvelopeClipboardData,
} from '../../../src/utils/envelope/envelopeClipboard.ts';
import { ENVELOPE_LENGTH } from '../../../src/constants/music.ts';

describe('generateEnvelopeClipboardData', () => {
  it('writes the envelope under its field name', () => {
    const text = generateEnvelopeClipboardData('volume', [15, 10, 0]);
    expect(text).toContain('volume:');
    expect(parseEnvelopeClipboardData(text, 'volume').data.slice(0, 3)).toEqual([15, 10, 0]);
  });

  it('includes sustain only for a valid volume index', () => {
    expect(generateEnvelopeClipboardData('volume', [15], 8)).toContain('sustain: 8');
    expect(generateEnvelopeClipboardData('volume', [15], null)).not.toContain('sustain');
    expect(generateEnvelopeClipboardData('pitch', [1], 8)).not.toContain('sustain');
  });

  it('writes empty data as an empty list', () => {
    expect(generateEnvelopeClipboardData('noise', undefined)).toContain('noise: []');
  });
});

describe('parseEnvelopeClipboardData', () => {
  it('round-trips a full-length envelope', () => {
    const data = Array.from({ length: ENVELOPE_LENGTH }, (_, i) => i % 16);
    const parsed = parseEnvelopeClipboardData(
      generateEnvelopeClipboardData('noise', data),
      'noise',
    );
    expect(parsed.data).toEqual(data);
    expect(parsed.data).toHaveLength(ENVELOPE_LENGTH);
  });

  it('expands a short envelope by repeating the last value', () => {
    const parsed = parseEnvelopeClipboardData('volume: [14, 12, 9]', 'volume');
    expect(parsed.data).toHaveLength(ENVELOPE_LENGTH);
    expect(parsed.data.slice(0, 3)).toEqual([14, 12, 9]);
    expect(parsed.data[ENVELOPE_LENGTH - 1]).toBe(9);
  });

  it('clamps values to the envelope type range', () => {
    expect(parseEnvelopeClipboardData('volume: [99]', 'volume').data[0]).toBe(15);
    expect(parseEnvelopeClipboardData('noise: [99]', 'noise').data[0]).toBe(31);
    expect(parseEnvelopeClipboardData('shift: [99]', 'shift').data[0]).toBe(24);
    expect(parseEnvelopeClipboardData('mode: [9]', 'mode').data[0]).toBe(2);
  });

  it('accepts a bare scalar as a one-step envelope', () => {
    const parsed = parseEnvelopeClipboardData('pitch: 4', 'pitch');
    expect(parsed.data).toHaveLength(ENVELOPE_LENGTH);
    expect(parsed.data.every((v) => v === 4)).toBe(true);
  });

  it('rejects a missing envelope type key', () => {
    expect(() => parseEnvelopeClipboardData('pitch: [1, 2]', 'volume')).toThrow(
      'Clipboard does not contain a Volume envelope.',
    );
    expect(() => parseEnvelopeClipboardData('step:\n  - note: C-4\n', 'volume')).toThrow(
      'Clipboard does not contain a Volume envelope.',
    );
  });

  it('rejects non-numeric values', () => {
    expect(() => parseEnvelopeClipboardData('volume: [loud]', 'volume')).toThrow(
      'Invalid Volume envelope value',
    );
  });

  it('rejects malformed YAML', () => {
    expect(() => parseEnvelopeClipboardData('volume: [1,', 'volume')).toThrow(
      'Failed to parse YAML',
    );
  });

  it('uses the Arpeggio title in the missing-key error', () => {
    expect(() => parseEnvelopeClipboardData('pitch: [1]', 'shift')).toThrow(
      'Clipboard does not contain a Arpeggio envelope.',
    );
  });

  it('accepts the arpeggio alias and loops it like the instrument loader', () => {
    const parsed = parseEnvelopeClipboardData('arpeggio: [0, 4, 7]', 'shift');
    expect(parsed.data).toHaveLength(ENVELOPE_LENGTH);
    expect(parsed.data.slice(0, 6)).toEqual([0, 4, 7, 0, 4, 7]);
  });

  it('parses sustain for volume and leaves it undefined otherwise', () => {
    const withSustain = parseEnvelopeClipboardData('volume: [15]\nsustain: 8', 'volume');
    expect(withSustain.sustain).toBe(8);
    const withoutSustain = parseEnvelopeClipboardData('volume: [15]', 'volume');
    expect(withoutSustain.sustain).toBeUndefined();
    const pitch = parseEnvelopeClipboardData('pitch: [1]\nsustain: 8', 'pitch');
    expect(pitch.sustain).toBeUndefined();
  });
});

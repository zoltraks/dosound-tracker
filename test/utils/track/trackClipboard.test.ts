import { describe, it, expect } from 'vitest';
import { parseClipboardData } from '../../../src/utils/track/trackClipboard.ts';
import { MAX_PATTERN_LENGTH } from '../../../src/constants/music.ts';
import { MAX_IMPORT_BYTES } from '../../../src/constants/import.ts';

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

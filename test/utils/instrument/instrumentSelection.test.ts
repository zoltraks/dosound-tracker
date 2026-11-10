// @vitest-environment node

import { describe, it, expect } from 'vitest';
import { normalizeInstrumentId } from '../../../src/utils/instrument/instrumentSelection.ts';

describe('normalizeInstrumentId', () => {
  it.each([
    [15, '0F'],
    ['1a', '1A'],
    ['$0c', '0C'],
    ['  7  ', '07'],
    ['bass', 'BASS'],
    [undefined, ''],
    [null, ''],
    ['', ''],
  ])('normalizes %s to %s', (input, expected) => {
    try {
      expect(normalizeInstrumentId(input as number | string | null | undefined)).toBe(expected);
    } catch (error) {
      console.log('normalize mismatch', input);
      throw error;
    }
  });
});

import { describe, expect, it } from 'vitest';
import { formatPitchDelta } from '../../src/exports/core';

describe('formatPitchDelta', () => {
  it('returns empty string for zero', () => {
    expect(formatPitchDelta(0)).toBe('');
  });

  it('formats positive delta with leading plus sign', () => {
    expect(formatPitchDelta(3)).toBe(' +3');
  });

  it('formats negative delta with minus sign', () => {
    expect(formatPitchDelta(-2)).toBe(' -2');
  });
});

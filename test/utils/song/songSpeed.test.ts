import { describe, it, expect } from 'vitest';
import { normalizeSongSpeed } from '../../../src/utils/song/songSpeed.ts';

describe('normalizeSongSpeed', () => {
  it('passes even values at or above the minimum through unchanged', () => {
    expect(normalizeSongSpeed(2)).toBe(2);
    expect(normalizeSongSpeed(4)).toBe(4);
    expect(normalizeSongSpeed(6)).toBe(6);
    expect(normalizeSongSpeed(8)).toBe(8);
  });

  it('rounds odd values down to the previous even value', () => {
    expect(normalizeSongSpeed(3)).toBe(2);
    expect(normalizeSongSpeed(5)).toBe(4);
    expect(normalizeSongSpeed(7)).toBe(6);
    expect(normalizeSongSpeed(9)).toBe(8);
  });

  it('floors fractional values before forcing even', () => {
    expect(normalizeSongSpeed(6.9)).toBe(6);
    expect(normalizeSongSpeed(7.9)).toBe(6);
  });

  it('clamps small positive values to the minimum', () => {
    expect(normalizeSongSpeed(1)).toBe(2);
    expect(normalizeSongSpeed(0.5)).toBe(2);
  });

  it('falls back to 6 for non-positive and non-numeric input', () => {
    expect(normalizeSongSpeed(0)).toBe(6);
    expect(normalizeSongSpeed(-4)).toBe(6);
    expect(normalizeSongSpeed(undefined)).toBe(6);
    expect(normalizeSongSpeed(null)).toBe(6);
    expect(normalizeSongSpeed('abc')).toBe(6);
    expect(normalizeSongSpeed(NaN)).toBe(6);
  });

  it('parses numeric strings like the original Number coercion', () => {
    expect(normalizeSongSpeed('6')).toBe(6);
    expect(normalizeSongSpeed('7')).toBe(6);
    expect(normalizeSongSpeed('8')).toBe(8);
  });
});

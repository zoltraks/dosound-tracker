import { describe, it, expect } from 'vitest';
import { clampVolumeNibble } from '../../../src/utils/panel/volumeUtils.ts';

describe('clampVolumeNibble', () => {
  it('passes integral values in range through unchanged', () => {
    expect(clampVolumeNibble(0)).toBe(0);
    expect(clampVolumeNibble(7)).toBe(7);
    expect(clampVolumeNibble(15)).toBe(15);
  });

  it('clamps values above the nibble range', () => {
    expect(clampVolumeNibble(16)).toBe(15);
    expect(clampVolumeNibble(255)).toBe(15);
  });

  it('clamps negative values to zero', () => {
    expect(clampVolumeNibble(-1)).toBe(0);
    expect(clampVolumeNibble(-100)).toBe(0);
  });

  it('truncates positive fractions like the | 0 coercion', () => {
    expect(clampVolumeNibble(7.9)).toBe(7);
    expect(clampVolumeNibble(15.5)).toBe(15);
  });

  it('clamps negative fractions to zero like Math.floor after clamping', () => {
    expect(clampVolumeNibble(-0.5)).toBe(0);
    expect(clampVolumeNibble(-0.9)).toBe(0);
  });
});

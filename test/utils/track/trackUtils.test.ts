import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  getClipboardApiOrReport,
  resolvePatternLength,
  computeEffectiveVolume,
} from '../../../src/utils/track/trackUtils.ts';
import type { Pattern } from '../../../src/synth/SoundDriver.ts';
import { PATTERN_LENGTH } from '../../../src/constants/music.ts';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('getClipboardApiOrReport', () => {
  it('reports and returns null when the clipboard API is missing', () => {
    const onError = vi.fn();
    try {
      expect(getClipboardApiOrReport('write', onError)).toBeNull();
      expect(getClipboardApiOrReport('read', onError)).toBeNull();
      expect(onError).toHaveBeenCalledTimes(2);
    } catch (error) {
      console.log('missing-clipboard mismatch');
      throw error;
    }
  });

  it('reports and returns null when navigator is absent', () => {
    vi.stubGlobal('navigator', undefined);
    const onError = vi.fn();
    try {
      expect(getClipboardApiOrReport('write', onError)).toBeNull();
      expect(onError).toHaveBeenCalledTimes(1);
    } catch (error) {
      console.log('missing-navigator mismatch');
      throw error;
    }
  });

  it('returns the clipboard when the requested capability exists', () => {
    const clipboard = { writeText: vi.fn() };
    vi.stubGlobal('navigator', { clipboard });
    const onError = vi.fn();
    try {
      expect(getClipboardApiOrReport('write', onError)).toBe(clipboard);
      expect(onError).not.toHaveBeenCalled();
    } catch (error) {
      console.log('clipboard-return mismatch');
      throw error;
    }
  });
});

describe('resolvePatternLength', () => {
  it('falls back to the default when the song length is missing', () => {
    try {
      expect(resolvePatternLength(undefined)).toBe(PATTERN_LENGTH);
      expect(resolvePatternLength(32)).toBe(32);
    } catch (error) {
      console.log('pattern-length mismatch');
      throw error;
    }
  });
});

describe('computeEffectiveVolume', () => {
  const pattern = (steps: Array<{ note: null; volume?: number }>): Pattern => ({
    id: '00',
    name: 'p',
    step: steps.map((step) => ({ note: step.note, volume: step.volume })),
  });

  it('returns the default volume for a missing or empty pattern', () => {
    try {
      expect(computeEffectiveVolume(null, 5)).toBe(15);
      expect(computeEffectiveVolume(pattern([]), 5)).toBe(15);
    } catch (error) {
      console.log('volume-default mismatch');
      throw error;
    }
  });

  it('keeps the last defined volume up to the current line', () => {
    const p = pattern([{ note: null, volume: 9 }, { note: null }, { note: null, volume: 3 }]);
    try {
      expect(computeEffectiveVolume(p, 0)).toBe(9);
      expect(computeEffectiveVolume(p, 1)).toBe(9);
      expect(computeEffectiveVolume(p, 2)).toBe(3);
      expect(computeEffectiveVolume(p, 99)).toBe(3);
    } catch (error) {
      console.log('volume-scan mismatch');
      throw error;
    }
  });

  it('accepts the legacy lines field when step is absent', () => {
    const legacy = {
      id: '00',
      name: 'p',
      lines: [{ note: null, volume: 7 }],
    } as unknown as Pattern;
    try {
      expect(computeEffectiveVolume(legacy, 0)).toBe(7);
    } catch (error) {
      console.log('legacy-lines mismatch');
      throw error;
    }
  });
});

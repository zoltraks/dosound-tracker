// @vitest-environment node

import { describe, it, expect } from 'vitest';
import type { Pattern } from '../../../src/synth/SoundDriver.ts';
import { buildPatternLookup, isPatternTrackId } from '../../../src/utils/song/songLookup.ts';

const makePattern = (id: string, name = id): Pattern => ({ id, name, step: [] });

describe('isPatternTrackId', () => {
  it('rejects the empty-track marker and blank values', () => {
    expect(isPatternTrackId('--')).toBe(false);
    expect(isPatternTrackId('')).toBe(false);
    expect(isPatternTrackId('   ')).toBe(false);
    expect(isPatternTrackId(undefined)).toBe(false);
    expect(isPatternTrackId(null)).toBe(false);
    expect(isPatternTrackId(42)).toBe(false);
  });

  it('accepts a non-empty non-marker id without trimming it', () => {
    expect(isPatternTrackId('01')).toBe(true);
    expect(isPatternTrackId('IP')).toBe(true);
    expect(isPatternTrackId(' --')).toBe(true);
    expect(isPatternTrackId('---')).toBe(true);
  });
});

describe('buildPatternLookup', () => {
  it('indexes patterns by id', () => {
    const a = makePattern('0A');
    const b = makePattern('0B');
    const map = buildPatternLookup([a, b]);

    expect(map.size).toBe(2);
    expect(map.get('0A')).toBe(a);
    expect(map.get('0B')).toBe(b);
    expect(map.get('0C')).toBeUndefined();
  });

  it('keeps the first entry on a duplicate id', () => {
    const first = makePattern('0A', 'first');
    const second = makePattern('0A', 'second');
    const map = buildPatternLookup([first, second]);

    expect(map.size).toBe(1);
    expect(map.get('0A')).toBe(first);
  });

  it('skips falsy entries', () => {
    const map = buildPatternLookup([null, makePattern('0A'), undefined]);

    expect(map.size).toBe(1);
    expect(map.get('0A')).toBeDefined();
  });

  it('indexes an entry with an empty id', () => {
    const empty = makePattern('');
    const map = buildPatternLookup([empty]);

    expect(map.get('')).toBe(empty);
  });
});

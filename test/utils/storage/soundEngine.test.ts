// @vitest-environment node

import { describe, it, expect } from 'vitest';
import {
  loadSoundEngineId,
  normalizeSoundEngineId,
} from '../../../src/utils/storage/soundEngine.ts';
import { StorageKeys } from '../../../src/utils/storage/storageKeys.ts';

describe('loadSoundEngineId', () => {
  it('returns the stored engine id when it is a known value', () => {
    localStorage.setItem(StorageKeys.SOUND_ENGINE, 'ayumi');
    try {
      expect(loadSoundEngineId()).toBe('ayumi');
      localStorage.setItem(StorageKeys.SOUND_ENGINE, 'internal');
      expect(loadSoundEngineId()).toBe('internal');
    } catch (error) {
      console.log('stored id mismatch');
      throw error;
    }
  });

  it('falls back to internal when the key is missing or unrecognised', () => {
    localStorage.removeItem(StorageKeys.SOUND_ENGINE);
    try {
      expect(loadSoundEngineId()).toBe('internal');
      localStorage.setItem(StorageKeys.SOUND_ENGINE, 'bogus');
      expect(loadSoundEngineId()).toBe('internal');
      localStorage.setItem(StorageKeys.SOUND_ENGINE, '');
      expect(loadSoundEngineId()).toBe('internal');
    } catch (error) {
      console.log('fallback mismatch');
      throw error;
    }
  });
});

describe('normalizeSoundEngineId', () => {
  it('returns a recognised id and falls back otherwise', () => {
    try {
      expect(normalizeSoundEngineId('ayumi')).toBe('ayumi');
      expect(normalizeSoundEngineId('internal')).toBe('internal');
      expect(normalizeSoundEngineId('bogus')).toBe('internal');
      expect(normalizeSoundEngineId(null)).toBe('internal');
      expect(normalizeSoundEngineId('bogus', 'ayumi')).toBe('ayumi');
      expect(normalizeSoundEngineId('ayumi', 'internal')).toBe('ayumi');
    } catch (error) {
      console.log('normalize mismatch');
      throw error;
    }
  });
});

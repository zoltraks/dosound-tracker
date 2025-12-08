import { useCallback } from 'react';
import type { Song, Instrument } from '../../synth/SoundDriver';

const SONG_STORAGE_KEY = 'dosound-tracker-song';
const INSTRUMENT_STORAGE_KEY = 'dosound-tracker-instrument';

export function usePersistence() {
  const saveSong = useCallback((song: Song) => {
    try {
      const payload = JSON.stringify(song);
      localStorage.setItem(SONG_STORAGE_KEY, payload);
    } catch (error) {
      void error;
    }
  }, []);

  const saveInstrument = useCallback((instrument: Instrument) => {
    try {
      const payload = JSON.stringify(instrument);
      localStorage.setItem(INSTRUMENT_STORAGE_KEY, payload);
    } catch (error) {
      void error;
    }
  }, []);

  const loadSong = useCallback((): Song | null => {
    try {
      const raw = localStorage.getItem(SONG_STORAGE_KEY);
      if (!raw) {
        return null;
      }
      const parsed = JSON.parse(raw) as Song;
      return parsed;
    } catch {
      return null;
    }
  }, []);

  const loadInstrument = useCallback((): Instrument | null => {
    try {
      const raw = localStorage.getItem(INSTRUMENT_STORAGE_KEY);
      if (!raw) {
        return null;
      }
      const parsed = JSON.parse(raw) as Instrument;
      return parsed;
    } catch {
      return null;
    }
  }, []);

  const clearSong = useCallback(() => {
    try {
      localStorage.removeItem(SONG_STORAGE_KEY);
    } catch (error) {
      void error;
    }
  }, []);

  const clearInstrument = useCallback(() => {
    try {
      localStorage.removeItem(INSTRUMENT_STORAGE_KEY);
    } catch (error) {
      void error;
    }
  }, []);

  return {
    saveSong,
    saveInstrument,
    loadSong,
    loadInstrument,
    clearSong,
    clearInstrument,
  };
}

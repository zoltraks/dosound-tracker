import { useCallback, useMemo } from 'react';
import type { Song } from '../../synth/SoundDriver';
import type { ISongService } from '../../services';
import { SongService } from '../../services';
import { useSongStore } from '../../stores/songStore';

export function useSongManager() {
  const currentSong = useSongStore(state => state.currentSong);
  const setSong = useSongStore(state => state.setSong);

  const songService: ISongService = useMemo(() => new SongService(), []);

  const createSong = useCallback(
    async (template?: Partial<Song>) => {
      const created = await songService.createSong(template);
      setSong(created);
      return created;
    },
    [setSong, songService]
  );

  const updateSong = useCallback(
    async (updates: Partial<Song>) => {
      if (!currentSong) {
        return null;
      }
      const next = await songService.updateSong(currentSong, updates);
      setSong(next);
      return next;
    },
    [currentSong, setSong, songService]
  );

  const validateSong = useCallback(
    () => {
      if (!currentSong) {
        return {
          isValid: false,
          errors: ['No song loaded.'],
          warnings: [],
        };
      }
      return songService.validateSong(currentSong);
    },
    [currentSong, songService]
  );

  return {
    currentSong,
    createSong,
    updateSong,
    validateSong,
  };
}

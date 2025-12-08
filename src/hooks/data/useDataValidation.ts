import { useCallback, useMemo } from 'react';
import type { Song } from '../../synth/SoundDriver';
import type { ISongService } from '../../services';
import { SongService } from '../../services';

export function useDataValidation() {
  const songService: ISongService = useMemo(() => new SongService(), []);

  const validateSong = useCallback(
    (song: Song) => songService.validateSong(song),
    [songService]
  );

  return {
    validateSong,
  };
}

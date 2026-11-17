import { useCallback } from 'react';
import { PATTERN_LENGTH } from '../../constants/music.ts';
import { logger } from '../../utils/log/logger.ts';
import type { Pattern, Song, SongChannelId } from '../../synth/SoundDriver.ts';
import type { UpdateSongOptions } from './useDataManagement.ts';

type UseTrackPatternParams = {
  currentSong: Song;
  sequencerPatternIndex: number;
  updateSong: (updates: Partial<Song>, options?: UpdateSongOptions) => void;
};

export const useTrackPattern = ({
  currentSong,
  sequencerPatternIndex,
  updateSong,
}: UseTrackPatternParams) => {
  const getCurrentPatternForTrack = useCallback(
    (trackId: SongChannelId) => {
      const playlistLength = currentSong.line.length;
      if (playlistLength === 0) {
        return null;
      }

      const currentPatternIndex = Math.max(0, Math.min(playlistLength - 1, sequencerPatternIndex));
      const currentPlaylistEntry = currentSong.line[currentPatternIndex];

      if (!currentPlaylistEntry) {
        return null;
      }

      const patternId = currentPlaylistEntry[trackId] ?? '--';

      if (patternId === '--') {
        return null;
      }

      let foundPattern = currentSong.pattern.find((p) => p.id === patternId);

      if (!foundPattern) {
        const targetLength = currentSong.length || PATTERN_LENGTH;
        const newPattern = {
          id: patternId,
          name: `Pattern ${patternId}`,
          step: Array(targetLength)
            .fill(null)
            .map(() => ({
              note: null,
            })),
        };

        const updatedPatterns = [...currentSong.pattern, newPattern];
        // Lazy fix-up of a missing pattern, not a user edit - keep it out
        // of the undo history.
        updateSong({ pattern: updatedPatterns }, { record: false });

        foundPattern = newPattern;
      }

      return foundPattern;
    },
    [currentSong, sequencerPatternIndex, updateSong],
  );

  const handlePatternChange = useCallback(
    (newPattern: Pattern) => {
      if (!newPattern || !newPattern.id) {
        logger.error('No pattern ID provided to handlePatternChange');
        return;
      }

      const updatedPatterns = [...currentSong.pattern];
      const patternIndex = updatedPatterns.findIndex((p) => p.id === newPattern.id);

      if (patternIndex === -1) {
        logger.error('Pattern not found with ID', newPattern.id);
        return;
      }

      updatedPatterns[patternIndex] = newPattern;
      updateSong({ pattern: updatedPatterns });
    },
    [currentSong.pattern, updateSong],
  );

  return { getCurrentPatternForTrack, handlePatternChange };
};

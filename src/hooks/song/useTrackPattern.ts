import { useCallback } from 'react';
import { PATTERN_LENGTH } from '../../constants/music.ts';
import { logger } from '../../utils/log/logger.ts';
import type { Pattern, Song } from '../../synth/SoundDriver.ts';

type UseTrackPatternParams = {
  currentSong: Song;
  sequencerPatternIndex: number;
  updateSong: (updates: Partial<Song>) => void;
};

export const useTrackPattern = ({
  currentSong,
  sequencerPatternIndex,
  updateSong,
}: UseTrackPatternParams) => {
  const getCurrentPatternForTrack = useCallback(
    (trackId: 'A' | 'B' | 'C') => {
      // Get current playlist row based on sequencer state
      const playlistLength = currentSong.line.length;
      if (playlistLength === 0) {
        return null;
      }

      const currentPatternIndex = Math.max(0, Math.min(playlistLength - 1, sequencerPatternIndex));
      const currentPlaylistEntry = currentSong.line[currentPatternIndex];

      if (!currentPlaylistEntry) {
        return null;
      }

      // Return pattern based on which track is asking
      let patternId = '--';
      switch (trackId) {
        case 'A':
          patternId = currentPlaylistEntry.A;
          break;
        case 'B':
          patternId = currentPlaylistEntry.B;
          break;
        case 'C':
          patternId = currentPlaylistEntry.C;
          break;
      }

      if (patternId === '--') {
        return null; // No pattern set for this track
      }

      let foundPattern = currentSong.pattern.find((p) => p.id === patternId);

      // If pattern doesn't exist, create it with current pattern length
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

        // Add the new pattern to the song
        const updatedPatterns = [...currentSong.pattern, newPattern];
        updateSong({ pattern: updatedPatterns });

        foundPattern = newPattern;
      }

      return foundPattern;
    },
    [currentSong, sequencerPatternIndex, updateSong],
  );

  // Handle stop playback with silence
  const handlePatternChange = useCallback(
    (newPattern: Pattern) => {
      if (!newPattern || !newPattern.id) {
        logger.error('No pattern ID provided to handlePatternChange');
        return;
      }

      // Find and update the pattern by ID
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

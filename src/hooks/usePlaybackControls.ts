import { useEffect } from 'react';
import { useSequencer, type SequencerState } from './useSequencer';
import type { Song } from '../synth/SoundDriver';
import { PATTERN_LENGTH } from '../constants/music';

interface UsePlaybackControlsArgs {
  currentSong: Song;
}

interface UsePlaybackControlsResult {
  sequencerState: SequencerState;
  stop: () => void;
  setCallback: (callback: (state: SequencerState) => void) => void;
  setPosition: (pattern: number, line: number, tick?: number) => void;
  startPatternLoop: (initialPattern?: number, initialLine?: number) => void;
  startSong: (initialPattern?: number, initialLine?: number) => void;
}

export function usePlaybackControls({ currentSong }: UsePlaybackControlsArgs): UsePlaybackControlsResult {
  const {
    sequencerState,
    stop,
    setCallback,
    setPosition,
    updateSpeed,
    startPatternLoop,
    startSong,
    updatePatternLength,
    updateSongLoop,
  } = useSequencer(currentSong.speed, currentSong.patternLength || PATTERN_LENGTH);

  useEffect(() => {
    updateSpeed(currentSong.speed);
  }, [currentSong.speed, updateSpeed]);

  useEffect(() => {
    updatePatternLength(currentSong.patternLength || PATTERN_LENGTH);
  }, [currentSong.patternLength, updatePatternLength]);

  useEffect(() => {
    const playlistLength = currentSong.playlist.length;
    updateSongLoop(playlistLength, currentSong.loop as number | null | undefined);
  }, [currentSong.playlist, currentSong.loop, updateSongLoop]);

  return {
    sequencerState,
    stop,
    setCallback,
    setPosition,
    startPatternLoop,
    startSong,
  };
}

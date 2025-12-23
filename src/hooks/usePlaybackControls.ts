import { useEffect, useMemo } from 'react';
import { useSequencer, type SequencerState } from './useSequencer';
import type { Song } from '../synth/SoundDriver';
import { PATTERN_LENGTH } from '../constants/music';
import { mapSongLineToPlaylistEntries } from '../types/playlist';

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
  setPatternLoopMode: (patternLoop: boolean) => void;
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
    setPatternLoopMode,
  } = useSequencer(currentSong.speed, currentSong.length || PATTERN_LENGTH);
  const playlistEntries = useMemo(
    () => mapSongLineToPlaylistEntries(currentSong.line),
    [currentSong.line]
  );

  useEffect(() => {
    updateSpeed(currentSong.speed);
  }, [currentSong.speed, updateSpeed]);

  useEffect(() => {
    updatePatternLength(currentSong.length || PATTERN_LENGTH);
  }, [currentSong.length, updatePatternLength]);

  useEffect(() => {
    const playlistLength = playlistEntries.length;
    updateSongLoop(playlistLength, currentSong.loop as number | null | undefined);
  }, [playlistEntries.length, currentSong.loop, updateSongLoop]);

  return {
    sequencerState,
    stop,
    setCallback,
    setPosition,
    startPatternLoop,
    startSong,
    setPatternLoopMode,
  };
}

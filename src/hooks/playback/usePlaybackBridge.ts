import { useEffect, useMemo, useRef, useState } from 'react';
import type { Dispatch, MutableRefObject, SetStateAction } from 'react';
import type { Instrument, Pattern, Song } from '../../synth/SoundDriver.ts';
import type { SoundEngine } from '../../synth/soundEngine.ts';
import type { MidiConfiguration } from '../midi/useMidi.ts';
import type { SequencerState } from '../sequencer/useSequencer.ts';
import { usePlaybackSimulation } from './usePlaybackSimulation.ts';
import { useSequencerIntegration } from '../sequencer/useSequencerIntegration.ts';

export interface PlaybackMidiHelpers {
  sendInstrumentMidiNoteOn: (
    ymChannel: number,
    instrument: Instrument | undefined,
    note: string,
    octave: number,
    volumeFromStep?: number | null,
    velocityOverride?: number | null,
  ) => void;
  sendInstrumentMidiNoteOffForChannel: (ymChannel: number) => void;
}

export interface UsePlaybackBridgeParams {
  currentSong: Song;
  channelMutes: boolean[];
  ym2149Ref: MutableRefObject<SoundEngine | null>;
  isDebugMode: boolean;
  setSharedCurrentLine: (line: number) => void;
  stop: () => void;
  setPosition: (pattern: number, line: number, tick?: number) => void;
  currentInstrument: Instrument | null;
  setCallback: (callback: (state: SequencerState) => void) => void;
}

export interface UsePlaybackBridgeResult {
  isLinePlaying: boolean;
  setIsLinePlaying: Dispatch<SetStateAction<boolean>>;
  midiHelpersRef: MutableRefObject<PlaybackMidiHelpers | null>;
  midiConfigurationRef: MutableRefObject<MidiConfiguration | null>;
  handleStopPlayback: () => void;
  lastSequencerPositionRef: MutableRefObject<{ pattern: number; line: number } | null>;
}

export function usePlaybackBridge({
  currentSong,
  channelMutes,
  ym2149Ref,
  isDebugMode,
  setSharedCurrentLine,
  stop,
  setPosition,
  currentInstrument,
  setCallback,
}: UsePlaybackBridgeParams): UsePlaybackBridgeResult {
  const [isLinePlaying, setIsLinePlaying] = useState(false);

  // MIDI helper ref so callbacks defined before useMidiHandling can safely
  // call instrument MIDI send/stop functions without referencing them before
  // their declaration.
  const midiHelpersRef = useRef<PlaybackMidiHelpers | null>(null);

  const midiConfigurationRef = useRef<MidiConfiguration | null>(null);

  const patternsById = useMemo(() => {
    const map = new Map<string, Pattern>();
    const patterns = currentSong.pattern;

    for (const pattern of patterns) {
      if (pattern && pattern.id) {
        map.set(pattern.id, pattern);
      }
    }
    return map;
  }, [currentSong.pattern]);

  const playbackState = usePlaybackSimulation(ym2149Ref, midiHelpersRef);
  const { resetPlaybackState: handleStopPlayback, lastSequencerPositionRef } = playbackState;

  const { sequencerCallback } = useSequencerIntegration({
    currentSong,
    patternsById,
    channelMutes,
    ym2149Ref,
    midiHelpersRef,
    playbackState,
    isDebugMode,
    setSharedCurrentLine,
    setIsLinePlaying,
    stop,
    setPosition,
    currentInstrument,
  });

  useEffect(() => {
    setCallback(sequencerCallback);
  }, [setCallback, sequencerCallback]);

  return {
    isLinePlaying,
    setIsLinePlaying,
    midiHelpersRef,
    midiConfigurationRef,
    handleStopPlayback,
    lastSequencerPositionRef,
  };
}

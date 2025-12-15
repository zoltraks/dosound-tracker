import { useRef, useCallback } from 'react';
import type { Note } from '../synth/SoundDriver';
import { YM2149 } from '../synth/YM2149';

export interface PlaybackSimulationState {
  channelSubTickRef: React.MutableRefObject<number[]>;
  channelEnvelopeStepRef: React.MutableRefObject<number[]>;
  lastNotesRef: React.MutableRefObject<Array<Note | null>>;
  lastSequencerPositionRef: React.MutableRefObject<{ pattern: number; line: number } | null>;
  channelVolumeModifierRef: React.MutableRefObject<number[]>;
  channelSustainRef: React.MutableRefObject<(number | null)[]>;
  channelReleasedRef: React.MutableRefObject<boolean[]>;
  debugTickCounterRef: React.MutableRefObject<number>;
  debugLastRowRef: React.MutableRefObject<{ pattern: number; line: number } | null>;
  debugLastTimeRef: React.MutableRefObject<number | null>;
  wasPlayingRef: React.MutableRefObject<boolean>;
  resetPlaybackState: () => void;
}

export function usePlaybackSimulation(
  ym2149Ref: React.MutableRefObject<YM2149 | null>,
  midiHelpersRef: React.MutableRefObject<{
    sendInstrumentMidiNoteOffForChannel: (ymChannel: number) => void;
  } | null>
) {
  const channelSubTickRef = useRef([0, 0, 0]);
  const channelEnvelopeStepRef = useRef([0, 0, 0]);
  const lastNotesRef = useRef<Array<Note | null>>([null, null, null]);
  const lastSequencerPositionRef = useRef<{ pattern: number; line: number } | null>(null);
  const channelVolumeModifierRef = useRef<number[]>([0x0f, 0x0f, 0x0f]);
  const channelSustainRef = useRef<(number | null)[]>([null, null, null]);
  const channelReleasedRef = useRef<boolean[]>([false, false, false]);
  const debugTickCounterRef = useRef<number>(0);
  const debugLastRowRef = useRef<{ pattern: number; line: number } | null>(null);
  const debugLastTimeRef = useRef<number | null>(null);
  const wasPlayingRef = useRef(false);

  const resetPlaybackState = useCallback(() => {
    channelSubTickRef.current = [0, 0, 0];
    channelEnvelopeStepRef.current = [0, 0, 0];
    lastNotesRef.current = [null, null, null];
    lastSequencerPositionRef.current = null;
    channelVolumeModifierRef.current = [0x0f, 0x0f, 0x0f];
    channelSustainRef.current = [null, null, null];
    channelReleasedRef.current = [false, false, false];
    debugTickCounterRef.current = 0;
    debugLastRowRef.current = null;
    debugLastTimeRef.current = null;

    // Send MIDI Note Off for any active playback notes
    const helpers = midiHelpersRef.current;
    if (helpers) {
      for (let ch = 0; ch < 3; ch += 1) {
        helpers.sendInstrumentMidiNoteOffForChannel(ch);
      }
    }
    
    // Silence all channels
    if (ym2149Ref.current) {
      ym2149Ref.current.silenceAll();
    }
  }, [midiHelpersRef, ym2149Ref]);

  return {
    channelSubTickRef,
    channelEnvelopeStepRef,
    lastNotesRef,
    lastSequencerPositionRef,
    channelVolumeModifierRef,
    channelSustainRef,
    channelReleasedRef,
    debugTickCounterRef,
    debugLastRowRef,
    debugLastTimeRef,
    wasPlayingRef,
    resetPlaybackState,
  };
}

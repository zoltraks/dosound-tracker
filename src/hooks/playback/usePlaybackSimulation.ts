import { useRef, useCallback } from 'react';
import type { Note } from '../../synth/SoundDriver.ts';
import type { SoundEngine } from '../../synth/soundEngine.ts';
import { SONG_CHANNEL_COUNT } from '../../constants/song.ts';

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
  ym2149Ref: React.MutableRefObject<SoundEngine | null>,
  midiHelpersRef: React.MutableRefObject<{
    sendInstrumentMidiNoteOffForChannel: (ymChannel: number) => void;
  } | null>,
  ym2149Ref2: React.MutableRefObject<SoundEngine | null>,
) {
  const channelSubTickRef = useRef<number[]>(Array.from({ length: SONG_CHANNEL_COUNT }, () => 0));
  const channelEnvelopeStepRef = useRef<number[]>(
    Array.from({ length: SONG_CHANNEL_COUNT }, () => 0),
  );
  const lastNotesRef = useRef<Array<Note | null>>(
    Array.from({ length: SONG_CHANNEL_COUNT }, () => null),
  );
  const lastSequencerPositionRef = useRef<{ pattern: number; line: number } | null>(null);
  const channelVolumeModifierRef = useRef<number[]>(
    Array.from({ length: SONG_CHANNEL_COUNT }, () => 0x0f),
  );
  const channelSustainRef = useRef<(number | null)[]>(
    Array.from({ length: SONG_CHANNEL_COUNT }, () => null),
  );
  const channelReleasedRef = useRef<boolean[]>(
    Array.from({ length: SONG_CHANNEL_COUNT }, () => false),
  );
  const debugTickCounterRef = useRef<number>(0);
  const debugLastRowRef = useRef<{ pattern: number; line: number } | null>(null);
  const debugLastTimeRef = useRef<number | null>(null);
  const wasPlayingRef = useRef(false);

  const resetPlaybackState = useCallback(() => {
    channelSubTickRef.current = Array.from({ length: SONG_CHANNEL_COUNT }, () => 0);
    channelEnvelopeStepRef.current = Array.from({ length: SONG_CHANNEL_COUNT }, () => 0);
    lastNotesRef.current = Array.from({ length: SONG_CHANNEL_COUNT }, () => null);
    lastSequencerPositionRef.current = null;
    channelVolumeModifierRef.current = Array.from({ length: SONG_CHANNEL_COUNT }, () => 0x0f);
    channelSustainRef.current = Array.from({ length: SONG_CHANNEL_COUNT }, () => null);
    channelReleasedRef.current = Array.from({ length: SONG_CHANNEL_COUNT }, () => false);
    debugTickCounterRef.current = 0;
    debugLastRowRef.current = null;
    debugLastTimeRef.current = null;

    const helpers = midiHelpersRef.current;
    if (helpers) {
      for (let ch = 0; ch < SONG_CHANNEL_COUNT; ch += 1) {
        helpers.sendInstrumentMidiNoteOffForChannel(ch);
      }
    }

    ym2149Ref.current?.silenceAll();
    ym2149Ref2.current?.silenceAll();
  }, [midiHelpersRef, ym2149Ref, ym2149Ref2]);

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

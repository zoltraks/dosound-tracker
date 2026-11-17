import { useCallback, useEffect, useRef } from 'react';
import type { RefObject } from 'react';
import type {
  Song,
  Pattern,
  Step,
  Note,
  Instrument,
  SongChannelId,
} from '../../synth/SoundDriver.ts';
import type { SoundEngine } from '../../synth/soundEngine.ts';
import type { MidiConfiguration, MidiNoteEvent } from './useMidi.ts';
import type { NavigationSection } from '../../constants/navigation.ts';
import { NOTE_BASE_OCTAVE, PATTERN_LENGTH } from '../../constants/music.ts';
import { DEFAULT_SONG_FRAME } from '../../constants/song.ts';
import {
  transposeMidiNoteToInstrumentBase,
  velocityToVolumeNibble,
} from '../../utils/midi/midiActionsUtils.ts';
import { usePreviewEnvelope } from '../playback/usePreviewEnvelope.ts';
import { SONG_CHANNEL_COUNT, SONG_CHANNEL_IDS } from '../../constants/song.ts';
import { isTrackNavigationSection } from '../../utils/keyboard/keyboardNavigationUtils.ts';

interface MidiHelpersRef {
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

interface UseMidiActionsArgs {
  activeSection: NavigationSection;
  lastTrackId: SongChannelId;
  currentInstrument: Instrument;
  currentSong: Song;
  sharedCurrentLine: number;
  setSharedCurrentLine: (line: number) => void;
  getCurrentPatternForTrack: (trackId: SongChannelId) => Pattern | null;
  handlePatternChange: (pattern: Pattern) => void;
  ym2149Ref: RefObject<SoundEngine | null>;
  ym2149Ref2: RefObject<SoundEngine | null>;
  midiHelpersRef: RefObject<MidiHelpersRef | null>;
  midiConfigurationRef: RefObject<MidiConfiguration | null>;
  parseBaseKeyString: (value?: string) => { note: string; octave: number } | null;
}

interface UseMidiActionsResult {
  handleMidiNoteEvent: (event: MidiNoteEvent) => void;
  handleHardStopLivePreview: (ymChannel: number) => void;
  handleRegisterTrackStopPreview: (trackId: SongChannelId, stopPreview: () => void) => void;
}

export function useMidiActions({
  activeSection,
  lastTrackId,
  currentInstrument,
  currentSong,
  sharedCurrentLine,
  setSharedCurrentLine,
  getCurrentPatternForTrack,
  handlePatternChange,
  ym2149Ref,
  ym2149Ref2,
  midiHelpersRef,
  midiConfigurationRef,
  parseBaseKeyString,
}: UseMidiActionsArgs): UseMidiActionsResult {
  const tickIntervalMs = 1000 / (currentSong.frame ?? DEFAULT_SONG_FRAME);
  const tickIntervalMsRef = useRef(tickIntervalMs);
  useEffect(() => {
    tickIntervalMsRef.current = tickIntervalMs;
  }, [tickIntervalMs]);

  const lastMidiPreviewRef = useRef<{
    noteNumber: number;
    midiChannel: number;
    ymChannel: number;
  } | null>(null);

  // The getter form keeps the chip fresh at event time: ym2149Ref.current
  // cannot be read during render (react-hooks/refs) and the engine resolves
  // the getter on each start/stop.
  const livePreview = usePreviewEnvelope({
    ym2149: () => ym2149Ref.current,
    ym2149ForChannel: (channel) => (channel < 3 ? ym2149Ref.current : ym2149Ref2.current) ?? null,
    onAutoStop: () => {
      // A preview that reaches a silent tail must still release the outgoing
      // MIDI note, otherwise the device holds it until the next explicit stop.
      const last = lastMidiPreviewRef.current;
      if (last) {
        const helpers = midiHelpersRef.current;
        if (helpers) {
          helpers.sendInstrumentMidiNoteOffForChannel(last.ymChannel);
        }
        lastMidiPreviewRef.current = null;
      }
    },
  });

  const trackStopPreviewRef = useRef<Partial<Record<SongChannelId, (() => void) | null>>>({});

  const handleRegisterTrackStopPreview = useCallback(
    (trackId: SongChannelId, stopPreview: () => void) => {
      trackStopPreviewRef.current[trackId] = stopPreview;
    },
    [],
  );

  const engineForYmChannel = useCallback(
    (ymChannel: number): { engine: SoundEngine; localChannel: number } | null => {
      // Global channel space is A-F (0-5); out-of-range indexes clamp to F.
      const channel = Math.min(Math.max(ymChannel | 0, 0), SONG_CHANNEL_COUNT - 1);
      const engine = channel < 3 ? ym2149Ref.current : ym2149Ref2.current;
      if (!engine) {
        return null;
      }
      return { engine, localChannel: channel % 3 };
    },
    [ym2149Ref, ym2149Ref2],
  );

  const handleHardStopLivePreview = useCallback(
    (ymChannel: number) => {
      // Nothing to stop: no live preview is running and no preview
      // is recorded - a stray call must not reach the volume register.
      if (!livePreview.hasState() && lastMidiPreviewRef.current === null) {
        return;
      }

      livePreview.stop();

      const lastPreview = lastMidiPreviewRef.current;
      if (lastPreview && lastPreview.ymChannel === ymChannel) {
        const helpers = midiHelpersRef.current;
        if (helpers) {
          helpers.sendInstrumentMidiNoteOffForChannel(ymChannel);
        }
        lastMidiPreviewRef.current = null;
      }

      const target = engineForYmChannel(ymChannel | 0);
      if (target) {
        target.engine.writeRegister(0x08 + target.localChannel, 0x00);
      }
    },
    [engineForYmChannel, midiHelpersRef, livePreview],
  );

  const handleMidiNoteEvent = useCallback(
    (event: MidiNoteEvent) => {
      if (!ym2149Ref.current) {
        return;
      }

      const {
        type,
        noteNumber,
        noteName,
        octave,
        channel: midiChannel,
        velocity: midiVelocity,
      } = event;

      const baseKey = parseBaseKeyString(currentInstrument.base || 'C-4') || {
        note: 'C',
        octave: NOTE_BASE_OCTAVE,
      };

      const transposed = transposeMidiNoteToInstrumentBase(noteName, octave, baseKey);
      if (!transposed) {
        return;
      }

      const clampedOctave = transposed.octave;
      const transposedNoteName = transposed.note;

      const isTrackFocused = isTrackNavigationSection(activeSection);

      if (isTrackFocused && type === 'noteOn') {
        const ignoreInputVolume = midiConfigurationRef.current?.ignoreInputVolume ?? true;
        const ignoreOutputVolume = midiConfigurationRef.current?.ignoreOutputVolume ?? true;
        const liveVolumeModifier = ignoreInputVolume ? 0x0f : velocityToVolumeNibble(midiVelocity);
        const midiOutVelocity = ignoreOutputVolume ? null : midiVelocity;

        const trackId = activeSection.slice(5) as SongChannelId;

        const stopTrackPreview = trackStopPreviewRef.current[trackId];
        if (stopTrackPreview) {
          stopTrackPreview();
        }

        const pattern = getCurrentPatternForTrack(trackId);
        if (!pattern) {
          return;
        }

        const totalLines = currentSong.length || PATTERN_LENGTH;
        const safeIndex = Math.max(0, Math.min(sharedCurrentLine, totalLines - 1));

        const newPattern: Pattern = {
          ...pattern,
          step: [...pattern.step],
        };

        while (newPattern.step.length < totalLines) {
          newPattern.step.push({
            note: null,
          });
        }

        const baseLine = newPattern.step[safeIndex] || { note: null };
        const line: Step = { ...baseLine };

        const instrumentId = currentInstrument.id;
        const note: Note = {
          note: transposedNoteName,
          octave: clampedOctave,
          instrument: instrumentId,
        };

        line.note = note;
        newPattern.step[safeIndex] = line;

        handlePatternChange(newPattern);

        const nextIndex = Math.min(totalLines - 1, safeIndex + 1);
        setSharedCurrentLine(nextIndex);

        const ymChannel = Math.max(0, SONG_CHANNEL_IDS.indexOf(trackId));

        livePreview.start('live', {
          channel: ymChannel,
          instrument: currentInstrument,
          noteData: { note: transposedNoteName, octave: clampedOctave },
          tickIntervalMs: tickIntervalMsRef.current,
          volumeModifier: liveVolumeModifier,
        });

        const helpers = midiHelpersRef.current;
        if (helpers) {
          helpers.sendInstrumentMidiNoteOn(
            ymChannel,
            currentInstrument,
            transposedNoteName,
            clampedOctave,
            null,
            midiOutVelocity,
          );
        }

        lastMidiPreviewRef.current = {
          noteNumber,
          midiChannel,
          ymChannel,
        };

        return;
      }

      if (isTrackFocused && type === 'noteOff') {
        const last = lastMidiPreviewRef.current;
        if (
          last &&
          last.noteNumber === noteNumber &&
          last.midiChannel === midiChannel &&
          last.ymChannel >= 0 &&
          last.ymChannel < SONG_CHANNEL_COUNT
        ) {
          const helpers = midiHelpersRef.current;
          if (helpers) {
            helpers.sendInstrumentMidiNoteOffForChannel(last.ymChannel);
          }

          if (!livePreview.release('live')) {
            const hadVoice = livePreview.hasState('live');
            livePreview.stop();
            if (!hadVoice) {
              const target = engineForYmChannel(last.ymChannel);
              target?.engine.writeRegister(0x08 + target.localChannel, 0x00);
            }
            lastMidiPreviewRef.current = null;
          }
        }
        return;
      }

      if (!isTrackFocused) {
        const ymChannel = Math.max(0, SONG_CHANNEL_IDS.indexOf(lastTrackId));

        if (type === 'noteOn') {
          const ignoreInputVolume = midiConfigurationRef.current?.ignoreInputVolume ?? true;
          const ignoreOutputVolume = midiConfigurationRef.current?.ignoreOutputVolume ?? true;
          const liveVolumeModifier = ignoreInputVolume
            ? 0x0f
            : velocityToVolumeNibble(midiVelocity);
          const midiOutVelocity = ignoreOutputVolume ? null : midiVelocity;

          livePreview.start('live', {
            channel: ymChannel,
            instrument: currentInstrument,
            noteData: { note: transposedNoteName, octave: clampedOctave },
            tickIntervalMs: tickIntervalMsRef.current,
            volumeModifier: liveVolumeModifier,
          });

          const helpers = midiHelpersRef.current;
          if (helpers) {
            helpers.sendInstrumentMidiNoteOn(
              ymChannel,
              currentInstrument,
              transposedNoteName,
              clampedOctave,
              null,
              midiOutVelocity,
            );
          }

          lastMidiPreviewRef.current = {
            noteNumber,
            midiChannel,
            ymChannel,
          };

          return;
        }

        if (type === 'noteOff') {
          const last = lastMidiPreviewRef.current;
          if (
            last &&
            last.noteNumber === noteNumber &&
            last.midiChannel === midiChannel &&
            last.ymChannel >= 0 &&
            last.ymChannel < SONG_CHANNEL_COUNT
          ) {
            const helpers = midiHelpersRef.current;
            if (helpers) {
              helpers.sendInstrumentMidiNoteOffForChannel(last.ymChannel);
            }

            if (!livePreview.release('live')) {
              const hadVoice = livePreview.hasState('live');
              livePreview.stop();
              if (!hadVoice) {
                const target = engineForYmChannel(last.ymChannel);
                target?.engine.writeRegister(0x08 + target.localChannel, 0x00);
              }
              lastMidiPreviewRef.current = null;
            }
          }
        }
      }
    },
    [
      activeSection,
      currentInstrument,
      currentSong.length,
      getCurrentPatternForTrack,
      handlePatternChange,
      lastTrackId,
      setSharedCurrentLine,
      sharedCurrentLine,
      midiHelpersRef,
      midiConfigurationRef,
      ym2149Ref,
      engineForYmChannel,
      parseBaseKeyString,
      livePreview,
    ],
  );

  return {
    handleMidiNoteEvent,
    handleHardStopLivePreview,
    handleRegisterTrackStopPreview,
  };
}

import { useCallback, useEffect, useRef } from 'react';
import type { RefObject } from 'react';
import type { Song, Pattern, Step, Note, Instrument } from '../../synth/SoundDriver.ts';
import type { YM2149 } from '../../synth/YM2149.ts';
import type { MidiConfiguration, MidiNoteEvent } from './useMidi.ts';
import type { NavigationSection } from '../../constants/navigation.ts';
import { NOTE_BASE_OCTAVE, PATTERN_LENGTH } from '../../constants/music.ts';
import { DEFAULT_SONG_FRAME } from '../../constants/song.ts';
import {
  transposeMidiNoteToInstrumentBase,
  velocityToVolumeNibble,
} from '../../utils/midi/midiActionsUtils.ts';
import { usePreviewEnvelope } from '../playback/usePreviewEnvelope.ts';

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
  lastTrackId: 'A' | 'B' | 'C';
  currentInstrument: Instrument;
  currentSong: Song;
  sharedCurrentLine: number;
  setSharedCurrentLine: (line: number) => void;
  getCurrentPatternForTrack: (trackId: 'A' | 'B' | 'C') => Pattern | null;
  handlePatternChange: (pattern: Pattern) => void;
  ym2149Ref: RefObject<YM2149 | null>;
  midiHelpersRef: RefObject<MidiHelpersRef | null>;
  midiConfigurationRef: RefObject<MidiConfiguration | null>;
  parseBaseKeyString: (value?: string) => { note: string; octave: number } | null;
}

interface UseMidiActionsResult {
  handleMidiNoteEvent: (event: MidiNoteEvent) => void;
  handleHardStopLivePreview: (ymChannel: number) => void;
  handleRegisterTrackStopPreview: (trackId: 'A' | 'B' | 'C', stopPreview: () => void) => void;
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

  const trackStopPreviewRef = useRef<{
    A: (() => void) | null;
    B: (() => void) | null;
    C: (() => void) | null;
  }>({
    A: null,
    B: null,
    C: null,
  });

  const handleRegisterTrackStopPreview = useCallback(
    (trackId: 'A' | 'B' | 'C', stopPreview: () => void) => {
      trackStopPreviewRef.current[trackId] = stopPreview;
    },
    [],
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

      const ym2149 = ym2149Ref.current;
      if (ym2149) {
        const safeChannel = Math.max(0, Math.min(2, ymChannel | 0));
        const volumeRegister = 0x08 + safeChannel;
        ym2149.writeRegister(volumeRegister, 0x00);
      }
    },
    [ym2149Ref, midiHelpersRef, livePreview],
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

      const isTrackFocused =
        activeSection === 'trackA' || activeSection === 'trackB' || activeSection === 'trackC';

      const ym2149 = ym2149Ref.current;

      // When a track panel is focused, insert notes into the current pattern and advance the cursor,
      // then start a sustain-aware live preview on that track's channel.
      if (isTrackFocused && type === 'noteOn') {
        const ignoreInputVolume = midiConfigurationRef.current?.ignoreInputVolume ?? true;
        const ignoreOutputVolume = midiConfigurationRef.current?.ignoreOutputVolume ?? true;
        const liveVolumeModifier = ignoreInputVolume ? 0x0f : velocityToVolumeNibble(midiVelocity);
        const midiOutVelocity = ignoreOutputVolume ? null : midiVelocity;

        const trackId: 'A' | 'B' | 'C' =
          activeSection === 'trackA' ? 'A' : activeSection === 'trackB' ? 'B' : 'C';

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

        const ymChannel = trackId === 'A' ? 0 : trackId === 'B' ? 1 : 2;

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
          last.ymChannel <= 2
        ) {
          const helpers = midiHelpersRef.current;
          if (helpers) {
            helpers.sendInstrumentMidiNoteOffForChannel(last.ymChannel);
          }

          if (!livePreview.release('live')) {
            const hadVoice = livePreview.hasState('live');
            livePreview.stop();
            if (!hadVoice) {
              ym2149.writeRegister(0x08 + last.ymChannel, 0x00);
            }
            lastMidiPreviewRef.current = null;
          }
        }
        return;
      }

      // When no track panel is focused, use MIDI to preview the current instrument
      if (!isTrackFocused) {
        const ymChannel = lastTrackId === 'B' ? 1 : lastTrackId === 'C' ? 2 : 0;

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

          // Also send MIDI OUT for live preview using the instrument's MIDI settings.
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
            last.ymChannel <= 2
          ) {
            // Send matching MIDI Note Off for the YM channel used by the live preview.
            const helpers = midiHelpersRef.current;
            if (helpers) {
              helpers.sendInstrumentMidiNoteOffForChannel(last.ymChannel);
            }

            if (!livePreview.release('live')) {
              const hadVoice = livePreview.hasState('live');
              livePreview.stop();
              if (!hadVoice) {
                ym2149.writeRegister(0x08 + last.ymChannel, 0x00);
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

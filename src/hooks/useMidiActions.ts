import { useCallback, useRef } from 'react';
import type { RefObject } from 'react';
import type { Song, Pattern, PatternLine, Note, Instrument } from '../synth/SoundDriver';
import type { YM2149 } from '../synth/YM2149';
import type { MidiNoteEvent } from './useMidi';
import type { NavigationSection } from '../constants/navigation';
import { NOTES, MIN_OCTAVE, MAX_OCTAVE, NOTE_BASE_OCTAVE, PATTERN_LENGTH } from '../constants/music';

interface MidiHelpersRef {
  sendInstrumentMidiNoteOn: (
    ymChannel: number,
    instrument: Instrument | undefined,
    note: string,
    octave: number,
    volumeFromStep?: number | null
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
  parseBaseKeyString,
}: UseMidiActionsArgs): UseMidiActionsResult {
  const lastMidiPreviewRef = useRef<{
    noteNumber: number;
    midiChannel: number;
    ymChannel: number;
  } | null>(null);

  const midiLiveTimerRef = useRef<number | null>(null);
  const midiLiveSubTickRef = useRef<number>(0);
  const midiLiveEnvelopeStepRef = useRef<number>(0);
  const midiLiveLastTickTimeRef = useRef<number | null>(null);
  const midiLiveNextTickTimeRef = useRef<number | null>(null);
  const midiLiveSustainIndexRef = useRef<number | null>(null);
  const midiLiveReleasedRef = useRef<boolean>(false);
  const midiLiveLastVolumeIndexRef = useRef<number | null>(null);
  const midiLiveLastVolumeValueRef = useRef<number | null>(null);

  const trackStopPreviewRef = useRef<{
    A: (() => void) | null;
    B: (() => void) | null;
    C: (() => void) | null;
  }>(
    {
      A: null,
      B: null,
      C: null,
    }
  );

  const handleRegisterTrackStopPreview = useCallback(
    (trackId: 'A' | 'B' | 'C', stopPreview: () => void) => {
      trackStopPreviewRef.current[trackId] = stopPreview;
    },
    []
  );

  const handleHardStopLivePreview = useCallback(
    (ymChannel: number) => {
      const ym2149 = ym2149Ref.current;

      if (midiLiveTimerRef.current !== null) {
        window.clearInterval(midiLiveTimerRef.current);
        midiLiveTimerRef.current = null;
      }

      midiLiveSubTickRef.current = 0;
      midiLiveEnvelopeStepRef.current = 0;
      midiLiveLastTickTimeRef.current = null;
      midiLiveNextTickTimeRef.current = null;
      midiLiveSustainIndexRef.current = null;
      midiLiveReleasedRef.current = false;
      midiLiveLastVolumeIndexRef.current = null;
      midiLiveLastVolumeValueRef.current = null;

      const lastPreview = lastMidiPreviewRef.current;
      if (lastPreview && lastPreview.ymChannel === ymChannel) {
        const helpers = midiHelpersRef.current;
        if (helpers) {
          helpers.sendInstrumentMidiNoteOffForChannel(ymChannel);
        }
        lastMidiPreviewRef.current = null;
      }

      if (ym2149) {
        const safeChannel = Math.max(0, Math.min(2, ymChannel | 0));
        const volumeRegister = 0x08 + safeChannel;
        ym2149.writeRegister(volumeRegister, 0x00);
      }
    },
    [ym2149Ref, midiHelpersRef]
  );

  const handleMidiNoteEvent = useCallback(
    (event: MidiNoteEvent) => {
      if (!ym2149Ref.current) {
        return;
      }

      const { type, noteNumber, noteName, octave, channel: midiChannel } = event;

      const normalizedNote = noteName.toUpperCase();
      const noteIndex = NOTES.indexOf(normalizedNote);
      if (noteIndex === -1) {
        return;
      }

      // Transpose incoming MIDI notes by the current instrument's base so that
      // pressing C-4 on the controller corresponds to the instrument's base
      // pitch (e.g. C-3), and all other keys shift by the same semitone offset.
      const baseKey =
        parseBaseKeyString(currentInstrument.base || 'C-4') ||
        { note: 'C', octave: NOTE_BASE_OCTAVE };

      const baseNoteName = baseKey.note.toUpperCase();
      const baseIndexRaw = NOTES.indexOf(baseNoteName);
      const baseNoteIndex = baseIndexRaw === -1 ? 0 : baseIndexRaw;

      const inputSemis = noteIndex + octave * 12;
      const refSemis = 0 + NOTE_BASE_OCTAVE * 12; // C-<NOTE_BASE_OCTAVE>
      const baseSemis = baseNoteIndex + baseKey.octave * 12;
      const offsetSemis = baseSemis - refSemis;

      const transposedSemis = inputSemis + offsetSemis;
      let transposedOctave = Math.floor(transposedSemis / 12);
      let transposedNoteIndex = transposedSemis % 12;

      if (transposedNoteIndex < 0) {
        transposedNoteIndex += 12;
        transposedOctave -= 1;
      }

      const clampedOctave = Math.max(MIN_OCTAVE, Math.min(MAX_OCTAVE, transposedOctave));
      const transposedNoteName = NOTES[transposedNoteIndex];

      const isTrackFocused =
        activeSection === 'trackA' ||
        activeSection === 'trackB' ||
        activeSection === 'trackC';

      const ym2149 = ym2149Ref.current;

      // When a track panel is focused, insert notes into the current pattern and advance the cursor,
      // then start a sustain-aware live preview on that track's channel.
      if (isTrackFocused && type === 'noteOn') {
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

        const totalLines = currentSong.patternLength || PATTERN_LENGTH;
        const safeIndex = Math.max(0, Math.min(sharedCurrentLine, totalLines - 1));

        const newPattern: Pattern = {
          ...pattern,
          lines: [...pattern.lines]
        };

        while (newPattern.lines.length < totalLines) {
          newPattern.lines.push({
            trackA: null,
            trackB: null,
            trackC: null
          });
        }

        const baseLine = newPattern.lines[safeIndex] || {
          trackA: null,
          trackB: null,
          trackC: null
        };
        const line: PatternLine = { ...baseLine };

        const instrumentId = currentInstrument.id;
        const note: Note = {
          note: transposedNoteName,
          octave: clampedOctave,
          instrument: instrumentId
        };

        line.trackA = note;
        newPattern.lines[safeIndex] = line;

        handlePatternChange(newPattern);

        const nextIndex = Math.min(totalLines - 1, safeIndex + 1);
        setSharedCurrentLine(nextIndex);

        // Sustain-aware live preview on the track's channel (same engine as non-track MIDI preview)
        const ymChannel = trackId === 'A' ? 0 : trackId === 'B' ? 1 : 2;
        const instrument = currentInstrument;
        const noteData = { note: transposedNoteName, octave: clampedOctave };

        if (midiLiveTimerRef.current !== null) {
          window.clearInterval(midiLiveTimerRef.current);
          midiLiveTimerRef.current = null;
        }

        midiLiveReleasedRef.current = false;

        const rawSustain = instrument && typeof instrument.sustain === 'number'
          ? instrument.sustain
          : null;
        const sustainIndex =
          typeof rawSustain === 'number' && Number.isFinite(rawSustain) && rawSustain >= 0
            ? Math.floor(rawSustain)
            : null;

        midiLiveSustainIndexRef.current = sustainIndex;

        const nowTick = performance.now();
        midiLiveSubTickRef.current = 0;
        midiLiveEnvelopeStepRef.current = 0;
        midiLiveLastTickTimeRef.current = nowTick;
        midiLiveNextTickTimeRef.current = nowTick + 20;

        const volumeEnv: number[] =
          Array.isArray(instrument.volume) && instrument.volume.length > 0
            ? instrument.volume
            : [0x0f];

        const lastVolumeIndex = volumeEnv.length - 1;
        const lastVolumeValue = volumeEnv[lastVolumeIndex] ?? 0;

        midiLiveLastVolumeIndexRef.current = lastVolumeIndex;
        midiLiveLastVolumeValueRef.current = lastVolumeValue;

        ym2149.updateChannelWithInstrument(ymChannel, instrument, noteData, 0, 0x0f);

        const helpers = midiHelpersRef.current;
        if (helpers) {
          helpers.sendInstrumentMidiNoteOn(
            ymChannel,
            currentInstrument,
            transposedNoteName,
            clampedOctave,
            null
          );
        }

        lastMidiPreviewRef.current = {
          noteNumber,
          midiChannel,
          ymChannel
        };

        const TICK_INTERVAL_MS = 20;

        midiLiveTimerRef.current = window.setInterval(() => {
          const sustain = midiLiveSustainIndexRef.current;
          const released = midiLiveReleasedRef.current;

          const now = performance.now();

          let nextTickTime = midiLiveNextTickTimeRef.current;
          if (!nextTickTime) {
            nextTickTime = now + TICK_INTERVAL_MS;
          }

          let subTick = midiLiveSubTickRef.current ?? 0;
          let rawStep = midiLiveEnvelopeStepRef.current ?? 0;

          while (now >= nextTickTime) {
            subTick = (subTick + 1) % 2;

            if (subTick === 0) {
              if (
                sustain === null ||
                sustain === undefined ||
                sustain < 0 ||
                released ||
                rawStep < sustain
              ) {
                rawStep = rawStep + 1;
              }
            }

            nextTickTime += TICK_INTERVAL_MS;
          }

          midiLiveSubTickRef.current = subTick;
          midiLiveEnvelopeStepRef.current = rawStep;
          midiLiveLastTickTimeRef.current = now;
          midiLiveNextTickTimeRef.current = nextTickTime;

          const effectiveRawStep = rawStep;
          let stepForApply = effectiveRawStep;

          if (
            sustain !== null &&
            sustain !== undefined &&
            sustain >= 0 &&
            !released &&
            effectiveRawStep >= sustain
          ) {
            stepForApply = sustain;
          }

          ym2149.updateChannelWithInstrument(ymChannel, instrument, noteData, stepForApply, 0x0f);

          const tailIndex = midiLiveLastVolumeIndexRef.current;
          const tailValue = midiLiveLastVolumeValueRef.current;

          if (
            released &&
            tailIndex != null &&
            tailIndex >= 0 &&
            effectiveRawStep >= tailIndex &&
            (tailValue ?? 0) <= 0
          ) {
            const timerId = midiLiveTimerRef.current;
            if (timerId != null) {
              window.clearInterval(timerId);
              midiLiveTimerRef.current = null;
            }

            midiLiveSubTickRef.current = 0;
            midiLiveEnvelopeStepRef.current = 0;
            midiLiveLastTickTimeRef.current = null;
            midiLiveNextTickTimeRef.current = null;
            midiLiveSustainIndexRef.current = null;
            midiLiveReleasedRef.current = false;
            midiLiveLastVolumeIndexRef.current = null;
            midiLiveLastVolumeValueRef.current = null;

            ym2149.writeRegister(0x08 + ymChannel, 0x00);
          }
        }, 20);

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

          const hasSustain =
            typeof midiLiveSustainIndexRef.current === 'number' &&
            midiLiveSustainIndexRef.current >= 0;

          if (hasSustain && midiLiveTimerRef.current !== null) {
            midiLiveReleasedRef.current = true;
          } else {
            if (midiLiveTimerRef.current !== null) {
              window.clearInterval(midiLiveTimerRef.current);
              midiLiveTimerRef.current = null;
            }

            midiLiveSubTickRef.current = 0;
            midiLiveEnvelopeStepRef.current = 0;
            midiLiveLastTickTimeRef.current = null;
            midiLiveNextTickTimeRef.current = null;
            midiLiveSustainIndexRef.current = null;
            midiLiveReleasedRef.current = false;
            midiLiveLastVolumeIndexRef.current = null;
            midiLiveLastVolumeValueRef.current = null;

            ym2149.writeRegister(0x08 + last.ymChannel, 0x00);
          }

          lastMidiPreviewRef.current = null;
        }
        return;
      }

      // When no track panel is focused, use MIDI to preview the current instrument
      if (!isTrackFocused) {
        const ymChannel =
          lastTrackId === 'B'
            ? 1
            : lastTrackId === 'C'
            ? 2
            : 0;

        if (type === 'noteOn') {
          const noteData = { note: transposedNoteName, octave: clampedOctave };
          const instrument = currentInstrument;

          if (midiLiveTimerRef.current !== null) {
            window.clearInterval(midiLiveTimerRef.current);
            midiLiveTimerRef.current = null;
          }

          midiLiveReleasedRef.current = false;

          const rawSustain = instrument && typeof instrument.sustain === 'number'
            ? instrument.sustain
            : null;
          const sustainIndex =
            typeof rawSustain === 'number' && Number.isFinite(rawSustain) && rawSustain >= 0
              ? Math.floor(rawSustain)
              : null;

          midiLiveSustainIndexRef.current = sustainIndex;

          const nowTick = performance.now();
          midiLiveSubTickRef.current = 0;
          midiLiveEnvelopeStepRef.current = 0;
          midiLiveLastTickTimeRef.current = nowTick;
          midiLiveNextTickTimeRef.current = nowTick + 20;

          const volumeEnv: number[] =
            Array.isArray(instrument.volume) && instrument.volume.length > 0
              ? instrument.volume
              : [0x0f];

          const lastVolumeIndex = volumeEnv.length - 1;
          const lastVolumeValue = volumeEnv[lastVolumeIndex] ?? 0;

          midiLiveLastVolumeIndexRef.current = lastVolumeIndex;
          midiLiveLastVolumeValueRef.current = lastVolumeValue;

          ym2149.updateChannelWithInstrument(ymChannel, instrument, noteData, 0, 0x0f);

          // Also send MIDI OUT for live preview using the instrument's MIDI settings.
          const helpers = midiHelpersRef.current;
          if (helpers) {
            helpers.sendInstrumentMidiNoteOn(ymChannel, currentInstrument, transposedNoteName, clampedOctave, null);
          }

          lastMidiPreviewRef.current = {
            noteNumber,
            midiChannel,
            ymChannel
          };

          const TICK_INTERVAL_MS = 20;

          midiLiveTimerRef.current = window.setInterval(() => {
            const sustain = midiLiveSustainIndexRef.current;
            const released = midiLiveReleasedRef.current;

            const now = performance.now();

            let nextTickTime = midiLiveNextTickTimeRef.current;
            if (!nextTickTime) {
              nextTickTime = now + TICK_INTERVAL_MS;
            }

            let subTick = midiLiveSubTickRef.current ?? 0;
            let rawStep = midiLiveEnvelopeStepRef.current ?? 0;

            while (now >= nextTickTime) {
              subTick = (subTick + 1) % 2;

              if (subTick === 0) {
                if (
                  sustain === null ||
                  sustain === undefined ||
                  sustain < 0 ||
                  released ||
                  rawStep < sustain
                ) {
                  rawStep = rawStep + 1;
                }
              }

              nextTickTime += TICK_INTERVAL_MS;
            }

            midiLiveSubTickRef.current = subTick;
            midiLiveEnvelopeStepRef.current = rawStep;
            midiLiveLastTickTimeRef.current = now;
            midiLiveNextTickTimeRef.current = nextTickTime;

            const effectiveRawStep = rawStep;
            let stepForApply = effectiveRawStep;

            if (
              sustain !== null &&
              sustain !== undefined &&
              sustain >= 0 &&
              !released &&
              effectiveRawStep >= sustain
            ) {
              stepForApply = sustain;
            }

            ym2149.updateChannelWithInstrument(ymChannel, instrument, noteData, stepForApply, 0x0f);

            const tailIndex = midiLiveLastVolumeIndexRef.current;
            const tailValue = midiLiveLastVolumeValueRef.current;

            if (
              released &&
              tailIndex != null &&
              tailIndex >= 0 &&
              effectiveRawStep >= tailIndex &&
              (tailValue ?? 0) <= 0
            ) {
              const timerId = midiLiveTimerRef.current;
              if (timerId != null) {
                window.clearInterval(timerId);
                midiLiveTimerRef.current = null;
              }

              midiLiveSubTickRef.current = 0;
              midiLiveEnvelopeStepRef.current = 0;
              midiLiveLastTickTimeRef.current = null;
              midiLiveNextTickTimeRef.current = null;
              midiLiveSustainIndexRef.current = null;
              midiLiveReleasedRef.current = false;
              midiLiveLastVolumeIndexRef.current = null;
              midiLiveLastVolumeValueRef.current = null;

              ym2149.writeRegister(0x08 + ymChannel, 0x00);
            }
          }, 20);

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

            const hasSustain =
              typeof midiLiveSustainIndexRef.current === 'number' &&
              midiLiveSustainIndexRef.current >= 0;

            if (hasSustain && midiLiveTimerRef.current !== null) {
              midiLiveReleasedRef.current = true;
            } else {
              if (midiLiveTimerRef.current !== null) {
                window.clearInterval(midiLiveTimerRef.current);
                midiLiveTimerRef.current = null;
              }

              midiLiveSubTickRef.current = 0;
              midiLiveEnvelopeStepRef.current = 0;
              midiLiveLastTickTimeRef.current = null;
              midiLiveNextTickTimeRef.current = null;
              midiLiveSustainIndexRef.current = null;
              midiLiveReleasedRef.current = false;
              midiLiveLastVolumeIndexRef.current = null;
              midiLiveLastVolumeValueRef.current = null;

              ym2149.writeRegister(0x08 + last.ymChannel, 0x00);
            }

            lastMidiPreviewRef.current = null;
          }
        }
      }
    },
    [
      activeSection,
      currentInstrument,
      currentSong.patternLength,
      getCurrentPatternForTrack,
      handlePatternChange,
      lastTrackId,
      setSharedCurrentLine,
      sharedCurrentLine,
      midiHelpersRef,
      ym2149Ref,
      parseBaseKeyString
    ]
  );

  return {
    handleMidiNoteEvent,
    handleHardStopLivePreview,
    handleRegisterTrackStopPreview,
  };
}

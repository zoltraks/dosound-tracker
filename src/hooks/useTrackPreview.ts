import { useRef, useCallback } from 'react';
import type { Instrument } from '../synth/SoundDriver';
import { YM2149 } from '../synth/YM2149';

export interface TrackPreviewOptions {
  ym2149: YM2149 | null;
  trackId: 'A' | 'B' | 'C';
  currentInstrument: Instrument;
  onPreviewMidiNoteOn?: (ymChannel: number, instrument: Instrument, note: string, octave: number) => void;
  onPreviewMidiNoteOff?: (ymChannel: number) => void;
  onHardStopLivePreview?: (ymChannel: number) => void;
}

export interface TrackPreviewActions {
  playPreviewNote: (note: string, octave: number) => void;
  stopPreview: () => void;
}

export const useTrackPreview = (options: TrackPreviewOptions): TrackPreviewActions => {
  const {
    ym2149,
    trackId,
    currentInstrument,
    onPreviewMidiNoteOn,
    onPreviewMidiNoteOff,
    onHardStopLivePreview
  } = options;

  // Envelope timing state for preview notes (monophonic per track, piano-like)
  const envelopeTimerRef = useRef<number | null>(null);
  const previewSubTickRef = useRef<number>(0);
  const previewEnvelopeStepRef = useRef<number>(0);
  const previewLastTickTimeRef = useRef<number | null>(null);
  const previewNextTickTimeRef = useRef<number | null>(null);
  const previewSustainIndexRef = useRef<number | null>(null);
  const previewReleasedRef = useRef<boolean>(false);
  const activePreviewKeyRef = useRef<string | null>(null);
  const pressedNoteKeysRef = useRef<Set<string>>(new Set());

  // Hard stop of any current preview on this track/channel
  const stopPreview = useCallback(() => {
    // Map track to channel
    const channel = trackId === 'A' ? 0 : trackId === 'B' ? 1 : 2;

    if (envelopeTimerRef.current !== null) {
      window.clearInterval(envelopeTimerRef.current);
      envelopeTimerRef.current = null;
    }

    previewSubTickRef.current = 0;
    previewEnvelopeStepRef.current = 0;
    previewLastTickTimeRef.current = null;
    previewNextTickTimeRef.current = null;
    previewSustainIndexRef.current = null;
    previewReleasedRef.current = false;
    activePreviewKeyRef.current = null;

    // Clear any tracked pressed note keys when performing a hard stop so that
    // stale state from a lost keyup (e.g. focus change while a key is held)
    // cannot block future previews for the same key.
    if (pressedNoteKeysRef.current.size > 0) {
      pressedNoteKeysRef.current.clear();
    }

    if (onHardStopLivePreview) {
      onHardStopLivePreview(channel);
    }

    if (onPreviewMidiNoteOff) {
      onPreviewMidiNoteOff(channel);
    }

    if (!ym2149) {
      return;
    }

    const volumeRegister = 0x08 + channel;
    ym2149.writeRegister(volumeRegister, 0x00);
  }, [trackId, ym2149, onPreviewMidiNoteOff, onHardStopLivePreview]);

  // Play preview note when entering notes (piano-like: hold key to sustain, stop on release)
  const playPreviewNote = useCallback(
    (note: string, octave: number) => {
      if (!ym2149) return;

      // Map track to channel
      const channel = trackId === 'A' ? 0 : trackId === 'B' ? 1 : 2;
      const instrument = currentInstrument;
      const noteData = { note, octave };

      // Monophonic per track: stop any existing preview first
      stopPreview();

      const keyId = `${note}${octave}`;
      activePreviewKeyRef.current = keyId;

      // Initialize sustain state for this preview note
      const rawSustain =
        instrument && typeof instrument.sustain === 'number'
          ? instrument.sustain
          : null;
      const sustainIndex =
        typeof rawSustain === 'number' && Number.isFinite(rawSustain) && rawSustain >= 0
          ? Math.floor(rawSustain)
          : null;

      previewSustainIndexRef.current = sustainIndex;
      previewReleasedRef.current = false;

      // Initialize envelope timing
      const now = performance.now();
      previewSubTickRef.current = 0;
      previewEnvelopeStepRef.current = 0;
      previewLastTickTimeRef.current = now;
      previewNextTickTimeRef.current = now + 20;

      // Apply initial state (step 0) with default volume modifier (0xF = no attenuation)
      ym2149.updateChannelWithInstrument(channel, instrument, noteData, 0, 0x0f);

      if (onPreviewMidiNoteOn) {
        onPreviewMidiNoteOn(channel, currentInstrument, note, octave);
      }

      // Precompute volume envelope tail information so we know when to auto-stop
      const volumeEnv: number[] =
        Array.isArray(instrument.volume) && instrument.volume.length > 0
          ? instrument.volume
          : [0x0f];
      const lastVolumeIndex = volumeEnv.length - 1;
      const lastVolumeValue = volumeEnv[lastVolumeIndex] ?? 0;
      const volumeRegister = 0x08 + channel;

      // Start envelope timer - 20ms base tick, advance envelope step every 40ms
      envelopeTimerRef.current = window.setInterval(() => {
        const sustain = previewSustainIndexRef.current;
        const released = previewReleasedRef.current;

        const TICK_INTERVAL_MS = 20;
        const nowTick = performance.now();

        let nextTickTime = previewNextTickTimeRef.current;
        if (!nextTickTime) {
          nextTickTime = nowTick + TICK_INTERVAL_MS;
        }

        let subTick = previewSubTickRef.current;
        let rawStep = previewEnvelopeStepRef.current;

        // Catch up on any missed 20ms ticks due to timer jitter.
        while (nowTick >= nextTickTime) {
          subTick = (subTick + 1) % 2;

          if (
            subTick === 0 &&
            (
              sustain === null ||
              sustain === undefined ||
              sustain < 0 ||
              released ||
              rawStep < sustain
            )
          ) {
            rawStep = rawStep + 1;
          }

          nextTickTime += TICK_INTERVAL_MS;
        }

        previewSubTickRef.current = subTick;
        previewEnvelopeStepRef.current = rawStep;
        previewLastTickTimeRef.current = nowTick;
        previewNextTickTimeRef.current = nextTickTime;

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

        ym2149.updateChannelWithInstrument(channel, instrument, noteData, stepForApply, 0x0f);

        // If this note has been released and the envelope has reached the end
        // of the volume envelope with a final value of 0, automatically stop
        // the preview to avoid leaving runaway timers.
        if (
          released &&
          lastVolumeIndex >= 0 &&
          effectiveRawStep >= lastVolumeIndex &&
          lastVolumeValue <= 0
        ) {
          if (envelopeTimerRef.current !== null) {
            window.clearInterval(envelopeTimerRef.current);
            envelopeTimerRef.current = null;
          }

          previewSubTickRef.current = 0;
          previewEnvelopeStepRef.current = 0;
          previewSustainIndexRef.current = null;
          previewReleasedRef.current = false;
          previewLastTickTimeRef.current = null;
          previewNextTickTimeRef.current = null;
          activePreviewKeyRef.current = null;

          ym2149.writeRegister(volumeRegister, 0x00);
          if (onPreviewMidiNoteOff) {
            onPreviewMidiNoteOff(channel);
          }
        }
      }, 20);
    }, [ym2149, trackId, currentInstrument, onPreviewMidiNoteOn, onPreviewMidiNoteOff, stopPreview]
  );

  return {
    playPreviewNote,
    stopPreview
  };
};

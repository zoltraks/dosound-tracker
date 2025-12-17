import { useRef, useCallback } from 'react';
import type { Instrument } from '../synth/SoundDriver';
import { YM2149 } from '../synth/YM2149';

export interface PianoEnvelopeTimingOptions {
  ym2149: YM2149 | null;
  channel: number;
  onPreviewMidiNoteOn?: (ymChannel: number, instrument: Instrument, note: string, octave: number) => void;
  onPreviewMidiNoteOff?: (ymChannel: number) => void;
}

export interface PianoEnvelopeTimingActions {
  startEnvelope: (note: string, octave: number, instrument: Instrument) => void;
  stopEnvelope: (keyId: string, immediate?: boolean) => void;
  isEnvelopeActive: (keyId: string) => boolean;
  stopAllEnvelopes: () => void;
}

export const usePianoEnvelopeTiming = (options: PianoEnvelopeTimingOptions): PianoEnvelopeTimingActions => {
  const {
    ym2149,
    channel,
    onPreviewMidiNoteOn,
    onPreviewMidiNoteOff
  } = options;

  // Envelope timing state per previewed key
  const envelopeTimersRef = useRef<{ [key: string]: number }>({});
  const previewSubTicksRef = useRef<{ [key: string]: number }>({});
  const previewEnvelopeStepsRef = useRef<{ [key: string]: number }>({});
  const previewSustainIndexRef = useRef<{ [key: string]: number | null }>({});
  const previewReleasedRef = useRef<{ [key: string]: boolean }>({});
  const previewLastTickTimeRef = useRef<{ [key: string]: number }>({});
  const previewNextTickTimeRef = useRef<{ [key: string]: number }>({});

  const startEnvelope = useCallback((note: string, octave: number, instrument: Instrument) => {
    if (!ym2149) return;

    const keyId = `${note}${octave}`;

    // Initialize sustain state for this preview note
    const rawSustain = (instrument && typeof instrument.sustain === 'number')
      ? instrument.sustain
      : null;
    const sustainIndex =
      typeof rawSustain === 'number' && Number.isFinite(rawSustain) && rawSustain >= 0
        ? Math.floor(rawSustain)
        : null;

    previewSustainIndexRef.current[keyId] = sustainIndex;
    previewReleasedRef.current[keyId] = false;

    // Initialize envelope timing
    const now = performance.now();
    previewSubTicksRef.current[keyId] = 0;
    previewEnvelopeStepsRef.current[keyId] = 0;
    previewLastTickTimeRef.current[keyId] = now;
    previewNextTickTimeRef.current[keyId] = now + 20;

    // Apply initial state (step 0) with default volume modifier (0xF = no attenuation)
    const noteData = { note, octave };
    ym2149.updateChannelWithInstrument(channel, instrument, noteData, 0, 0x0f);

    if (onPreviewMidiNoteOn) {
      onPreviewMidiNoteOn(channel, instrument, note, octave);
    }

    // Precompute volume envelope tail information so we know when to auto-stop
    const volumeEnv: number[] =
      Array.isArray(instrument.volume) && instrument.volume.length > 0
        ? instrument.volume
        : [0x0f];
    const lastVolumeIndex = volumeEnv.length - 1;
    const lastVolumeValue = volumeEnv[lastVolumeIndex] ?? 0;
    const volumeRegister = 0x08 + channel;

    // Start envelope timer - 20ms base tick, advance envelope step every
    // second virtual tick (40ms), with catch-up for missed ticks.
    envelopeTimersRef.current[keyId] = window.setInterval(() => {
      const sustain = previewSustainIndexRef.current[keyId];
      const released = previewReleasedRef.current[keyId] ?? false;

      const TICK_INTERVAL_MS = 20;
      const nowTick = performance.now();

      let nextTickTime = previewNextTickTimeRef.current[keyId];
      if (!nextTickTime) {
        nextTickTime = nowTick + TICK_INTERVAL_MS;
      }

      let subTick = previewSubTicksRef.current[keyId] ?? 0;
      let rawStep = previewEnvelopeStepsRef.current[keyId] ?? 0;

      // Catch up on any missed 20ms ticks due to timer jitter.
      while (nowTick >= nextTickTime) {
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

      previewSubTicksRef.current[keyId] = subTick;
      previewEnvelopeStepsRef.current[keyId] = rawStep;
      previewLastTickTimeRef.current[keyId] = nowTick;
      previewNextTickTimeRef.current[keyId] = nextTickTime;

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
        const timerId = envelopeTimersRef.current[keyId];
        if (timerId) {
          clearInterval(timerId);
          delete envelopeTimersRef.current[keyId];
        }
        if (previewSubTicksRef.current[keyId] !== undefined) {
          delete previewSubTicksRef.current[keyId];
        }
        if (previewEnvelopeStepsRef.current[keyId] !== undefined) {
          delete previewEnvelopeStepsRef.current[keyId];
        }
        if (previewSustainIndexRef.current[keyId] !== undefined) {
          delete previewSustainIndexRef.current[keyId];
        }
        if (previewReleasedRef.current[keyId] !== undefined) {
          delete previewReleasedRef.current[keyId];
        }
        if (previewLastTickTimeRef.current[keyId] !== undefined) {
          delete previewLastTickTimeRef.current[keyId];
        }
        if (previewNextTickTimeRef.current[keyId] !== undefined) {
          delete previewNextTickTimeRef.current[keyId];
        }

        ym2149.writeRegister(volumeRegister, 0x00);
        if (onPreviewMidiNoteOff) {
          onPreviewMidiNoteOff(channel);
        }
      }
    }, 20); // 20ms base tick, 40ms per envelope step
  }, [ym2149, channel, onPreviewMidiNoteOn, onPreviewMidiNoteOff]);

  const stopEnvelope = useCallback((keyId: string, immediate: boolean = false) => {
    if (onPreviewMidiNoteOff) {
      onPreviewMidiNoteOff(channel);
    }

    if (!ym2149) return;

    const volumeRegister = 0x08 + channel;

    // If note and octave provided, handle per-key release
    const hasTimer = !!envelopeTimersRef.current[keyId];
    const hasState =
      previewSubTicksRef.current[keyId] !== undefined ||
      previewEnvelopeStepsRef.current[keyId] !== undefined ||
      previewSustainIndexRef.current[keyId] !== undefined ||
      previewReleasedRef.current[keyId] !== undefined;

    // If there is no active preview state for this note, treat this as a
    // stale key-up event and ignore it so we don't accidentally mute a
    // newer note that is currently playing on the same preview channel.
    if (!hasTimer && !hasState) {
      return;
    }

    const sustain = previewSustainIndexRef.current[keyId];
    const hasSustain = typeof sustain === 'number' && sustain >= 0;

    if (hasSustain && !immediate) {
      // For instruments with sustain, key release acts as a release trigger:
      // keep the timer/envelope running and allow it to progress past sustain.
      previewReleasedRef.current[keyId] = true;
      return;
    }

    // No sustain for this note: perform immediate hard stop as before.
    if (envelopeTimersRef.current[keyId]) {
      clearInterval(envelopeTimersRef.current[keyId]);
      delete envelopeTimersRef.current[keyId];
    }
    if (previewSubTicksRef.current[keyId] !== undefined) {
      delete previewSubTicksRef.current[keyId];
    }
    if (previewEnvelopeStepsRef.current[keyId] !== undefined) {
      delete previewEnvelopeStepsRef.current[keyId];
    }
    if (previewSustainIndexRef.current[keyId] !== undefined) {
      delete previewSustainIndexRef.current[keyId];
    }
    if (previewReleasedRef.current[keyId] !== undefined) {
      delete previewReleasedRef.current[keyId];
    }
    if (previewLastTickTimeRef.current[keyId] !== undefined) {
      delete previewLastTickTimeRef.current[keyId];
    }
    if (previewNextTickTimeRef.current[keyId] !== undefined) {
      delete previewNextTickTimeRef.current[keyId];
    }

    ym2149.writeRegister(volumeRegister, 0x00);
  }, [ym2149, channel, onPreviewMidiNoteOff]);

  const isEnvelopeActive = useCallback((keyId: string) => {
    const hasTimer = !!envelopeTimersRef.current[keyId];
    const hasState =
      previewSubTicksRef.current[keyId] !== undefined ||
      previewEnvelopeStepsRef.current[keyId] !== undefined ||
      previewSustainIndexRef.current[keyId] !== undefined ||
      previewReleasedRef.current[keyId] !== undefined;
    return hasTimer || hasState;
  }, []);

  const stopAllEnvelopes = useCallback(() => {
    if (onPreviewMidiNoteOff) {
      onPreviewMidiNoteOff(channel);
    }

    if (!ym2149) return;

    const volumeRegister = 0x08 + channel;

    // Clear all timers (fallback)
    Object.values(envelopeTimersRef.current).forEach(timer => clearInterval(timer));
    envelopeTimersRef.current = {};
    previewSubTicksRef.current = {};
    previewEnvelopeStepsRef.current = {};
    previewSustainIndexRef.current = {};
    previewReleasedRef.current = {};
    previewLastTickTimeRef.current = {};
    previewNextTickTimeRef.current = {};

    ym2149.writeRegister(volumeRegister, 0x00);
  }, [ym2149, channel, onPreviewMidiNoteOff]);

  return {
    startEnvelope,
    stopEnvelope,
    isEnvelopeActive,
    stopAllEnvelopes
  };
};

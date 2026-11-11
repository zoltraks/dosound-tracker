/* eslint-disable react-hooks/exhaustive-deps */
import { useCallback, useEffect, useMemo, useRef } from 'react';
import type { Instrument } from '../../synth/SoundDriver.ts';
import type { SoundEngine } from '../../synth/soundEngine.ts';
import {
  advancePreviewEnvelopeTick,
  getPreviewEnvelopeApplyStep,
} from '../../utils/envelope/previewEnvelopeTiming.ts';

export interface PreviewEnvelopeOptions {
  // A getter form keeps call sites fresh when the chip arrives through a ref
  // whose .current cannot be read during render (react-hooks/refs).
  ym2149: SoundEngine | null | (() => SoundEngine | null);
  onAutoStop?: (keyId: string) => void;
}

export interface PreviewEnvelopeStartOptions {
  channel: number;
  instrument: Instrument;
  noteData: { note: string; octave: number };
  tickIntervalMs: number;
  volumeModifier?: number;
  honorSustain?: boolean;
  stopAfterStep?: number;
}

export interface PreviewEnvelopeResult {
  start: (keyId: string, options: PreviewEnvelopeStartOptions) => void;
  release: (keyId: string) => boolean;
  stop: (keyId?: string) => void;
  hasState: (keyId?: string) => boolean;
}

const resolveYm2149 = (options: PreviewEnvelopeOptions): SoundEngine | null =>
  typeof options.ym2149 === 'function' ? options.ym2149() : options.ym2149;

export interface PreviewVoice {
  timerId: number;
  channel: number;
  ym2149: SoundEngine;
  instrument: Instrument;
  noteData: { note: string; octave: number };
  tickIntervalMs: number;
  volumeModifier: number;
  sustainIndex: number | null;
  released: boolean;
  subTick: number;
  rawStep: number;
  lastTickTime: number;
  nextTickTime: number;
  lastVolumeIndex: number;
  lastVolumeValue: number;
  stopAfterStep: number | null;
}

export function usePreviewEnvelope(options: PreviewEnvelopeOptions): PreviewEnvelopeResult {
  const voicesRef = useRef<Map<string, PreviewVoice>>(new Map());
  const optionsRef = useRef(options);
  useEffect(() => {
    optionsRef.current = options;
  });

  const stop = useCallback((keyId?: string) => {
    const voices = voicesRef.current;
    let stoppedChannel: number | null = null;

    if (keyId !== undefined) {
      const voice = voices.get(keyId);
      if (voice) {
        window.clearInterval(voice.timerId);
        voices.delete(keyId);
        stoppedChannel = voice.channel;
      }
    } else {
      voices.forEach((voice) => {
        window.clearInterval(voice.timerId);
        stoppedChannel = voice.channel;
      });
      voices.clear();
    }

    const ym2149 = resolveYm2149(optionsRef.current);
    if (stoppedChannel !== null && ym2149) {
      ym2149.writeRegister(0x08 + stoppedChannel, 0x00);
    }
  }, []);

  const release = useCallback((keyId: string) => {
    const voice = voicesRef.current.get(keyId);
    if (voice && voice.sustainIndex !== null && voice.sustainIndex >= 0) {
      voice.released = true;
      return true;
    }
    return false;
  }, []);

  const hasState = useCallback((keyId?: string) => {
    const voices = voicesRef.current;
    return keyId !== undefined ? voices.has(keyId) : voices.size > 0;
  }, []);

  const start = useCallback((keyId: string, args: PreviewEnvelopeStartOptions) => {
    stop();

    const ym2149 = resolveYm2149(optionsRef.current);
    if (!ym2149) {
      return;
    }

    const { channel, instrument, noteData, tickIntervalMs } = args;
    const volumeModifier = args.volumeModifier ?? 0x0f;

    const rawSustain =
      instrument && typeof instrument.sustain === 'number' ? instrument.sustain : null;
    const sustainIndex =
      args.honorSustain === false
        ? null
        : typeof rawSustain === 'number' && Number.isFinite(rawSustain) && rawSustain >= 0
          ? Math.floor(rawSustain)
          : null;

    const now = performance.now();

    const volumeEnv: number[] =
      Array.isArray(instrument.volume) && instrument.volume.length > 0 ? instrument.volume : [0x0f];
    const lastVolumeIndex = volumeEnv.length - 1;
    const lastVolumeValue = volumeEnv[lastVolumeIndex] ?? 0;

    const voice: PreviewVoice = {
      timerId: 0,
      channel,
      ym2149,
      instrument,
      noteData,
      tickIntervalMs,
      volumeModifier,
      sustainIndex,
      released: false,
      subTick: 0,
      rawStep: 0,
      lastTickTime: now,
      nextTickTime: now + tickIntervalMs,
      lastVolumeIndex,
      lastVolumeValue,
      stopAfterStep:
        typeof args.stopAfterStep === 'number' && Number.isFinite(args.stopAfterStep)
          ? args.stopAfterStep
          : null,
    };

    ym2149.updateChannelWithInstrument(channel, instrument, noteData, 0, volumeModifier);

    const voices = voicesRef.current;
    voice.timerId = window.setInterval(() => {
      const nowTick = performance.now();

      const advanced = advancePreviewEnvelopeTick({
        now: nowTick,
        nextTickTime: voice.nextTickTime,
        subTick: voice.subTick,
        rawStep: voice.rawStep,
        sustainIndex: voice.sustainIndex,
        released: voice.released,
        tickIntervalMs: voice.tickIntervalMs,
      });

      voice.subTick = advanced.subTick;
      voice.rawStep = advanced.rawStep;
      voice.lastTickTime = nowTick;
      voice.nextTickTime = advanced.nextTickTime;

      const stepForApply = getPreviewEnvelopeApplyStep(
        voice.rawStep,
        voice.sustainIndex,
        voice.released,
      );

      ym2149.updateChannelWithInstrument(
        channel,
        instrument,
        noteData,
        stepForApply,
        volumeModifier,
      );

      if (
        (voice.released &&
          voice.lastVolumeIndex >= 0 &&
          voice.rawStep >= voice.lastVolumeIndex &&
          voice.lastVolumeValue <= 0) ||
        (voice.stopAfterStep !== null && voice.rawStep >= voice.stopAfterStep)
      ) {
        window.clearInterval(voice.timerId);
        voices.delete(keyId);
        ym2149.writeRegister(0x08 + channel, 0x00);
        optionsRef.current.onAutoStop?.(keyId);
      }
    }, tickIntervalMs);

    voices.set(keyId, voice);
  }, []);

  return useMemo(() => ({ start, release, stop, hasState }), [start, release, stop, hasState]);
}

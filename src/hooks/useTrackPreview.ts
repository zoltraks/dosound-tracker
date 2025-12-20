import { useCallback, useEffect, useRef } from 'react';
import type { MutableRefObject } from 'react';
import type { Instrument } from '../synth/SoundDriver';
import type { YM2149 } from '../synth/YM2149';
import { advanceEnvelopeTick, resolveEnvelopeStep } from '../utils/envelopeOperations';

export interface UseTrackPreviewParams {
  trackId: 'A' | 'B' | 'C';
  ym2149: YM2149 | null;
  currentInstrumentData: Instrument;
  onPreviewMidiNoteOn?: (
    ymChannel: number,
    instrument: Instrument,
    note: string,
    octave: number
  ) => void;
  onPreviewMidiNoteOff?: (ymChannel: number) => void;
  onHardStopLivePreview?: (ymChannel: number) => void;
  onRegisterStopPreview?: (trackId: 'A' | 'B' | 'C', stopPreview: () => void) => void;
}

export interface UseTrackPreviewResult {
  playPreviewNote: (note: string, octave: number) => void;
  stopPreview: () => void;
  pressedNoteKeysRef: MutableRefObject<Set<string>>;
  activePreviewKeyRef: MutableRefObject<string | null>;
  previewSustainIndexRef: MutableRefObject<number | null>;
  previewReleasedRef: MutableRefObject<boolean>;
}

type PreviewInstrument = Instrument;

export function useTrackPreview({
  trackId,
  ym2149,
  currentInstrumentData,
  onPreviewMidiNoteOn,
  onPreviewMidiNoteOff,
  onHardStopLivePreview,
  onRegisterStopPreview,
}: UseTrackPreviewParams): UseTrackPreviewResult {
  const envelopeTimerRef = useRef<number | null>(null);
  const previewSubTickRef = useRef<number>(0);
  const previewEnvelopeStepRef = useRef<number>(0);
  const previewLastTickTimeRef = useRef<number | null>(null);
  const previewNextTickTimeRef = useRef<number | null>(null);
  const previewSustainIndexRef = useRef<number | null>(null);
  const previewReleasedRef = useRef<boolean>(false);
  const activePreviewKeyRef = useRef<string | null>(null);
  const pressedNoteKeysRef = useRef<Set<string>>(new Set());

  const stopPreview = useCallback(() => {
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
  }, [trackId, ym2149, onHardStopLivePreview, onPreviewMidiNoteOff]);

  useEffect(() => {
    if (onRegisterStopPreview) {
      onRegisterStopPreview(trackId, stopPreview);
    }
  }, [onRegisterStopPreview, trackId, stopPreview]);

  useEffect(() => {
    return () => {
      stopPreview();
    };
  }, [stopPreview]);

  const playPreviewNote = useCallback(
    (note: string, octave: number) => {
      if (!ym2149) return;

      const channel = trackId === 'A' ? 0 : trackId === 'B' ? 1 : 2;
      const instrument: PreviewInstrument = currentInstrumentData as unknown as PreviewInstrument;
      const noteData = { note, octave };

      stopPreview();

      const keyId = `${note}${octave}`;
      activePreviewKeyRef.current = keyId;

      const rawSustain =
        instrument && typeof (instrument as Instrument & { sustain?: number }).sustain === 'number'
          ? (instrument as Instrument & { sustain?: number }).sustain
          : null;
      const sustainIndex =
        typeof rawSustain === 'number' && Number.isFinite(rawSustain) && rawSustain >= 0
          ? Math.floor(rawSustain)
          : null;

      previewSustainIndexRef.current = sustainIndex;
      previewReleasedRef.current = false;

      const now = performance.now();
      previewSubTickRef.current = 0;
      previewEnvelopeStepRef.current = 0;
      previewLastTickTimeRef.current = now;
      previewNextTickTimeRef.current = now + 20;

      ym2149.updateChannelWithInstrument(channel, instrument, noteData, 0, 0x0f);

      if (onPreviewMidiNoteOn) {
        onPreviewMidiNoteOn(channel, currentInstrumentData, note, octave);
      }

      const volumeEnv: number[] =
        Array.isArray(instrument.volume) && instrument.volume.length > 0
          ? instrument.volume
          : [0x0f];
      const lastVolumeIndex = volumeEnv.length - 1;
      const lastVolumeValue = volumeEnv[lastVolumeIndex] ?? 0;
      const volumeRegister = 0x08 + channel;

      envelopeTimerRef.current = window.setInterval(() => {
        const sustain = previewSustainIndexRef.current;
        const released = previewReleasedRef.current;

        const TICK_INTERVAL_MS = 20;
        const nowTick = performance.now();

        const advanced = advanceEnvelopeTick({
          now: nowTick,
          nextTickTime: previewNextTickTimeRef.current,
          subTick: previewSubTickRef.current,
          rawStep: previewEnvelopeStepRef.current,
          sustainIndex: sustain,
          released,
          tickIntervalMs: TICK_INTERVAL_MS,
        });

        previewSubTickRef.current = advanced.subTick;
        previewEnvelopeStepRef.current = advanced.rawStep;
        previewLastTickTimeRef.current = nowTick;
        previewNextTickTimeRef.current = advanced.nextTickTime;

        const effectiveRawStep = advanced.rawStep;
        const stepForApply = resolveEnvelopeStep(effectiveRawStep, sustain, released);

        ym2149.updateChannelWithInstrument(channel, instrument, noteData, stepForApply, 0x0f);

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
    },
    [
      ym2149,
      trackId,
      currentInstrumentData,
      onPreviewMidiNoteOn,
      onPreviewMidiNoteOff,
      stopPreview,
    ]
  );

  return {
    playPreviewNote,
    stopPreview,
    pressedNoteKeysRef,
    activePreviewKeyRef,
    previewSustainIndexRef,
    previewReleasedRef,
  };
}

import { useCallback, useEffect, useRef, useState } from 'react';
import { useAudioContext } from './useAudioContext.ts';
import type { SoundEngine } from '../../synth/soundEngine.ts';
import { createSoundEngine } from '../../synth/soundEngine.ts';
import { YM2149 } from '../../synth/YM2149.ts';
import type { SoundEngineId } from '../../constants/sound.ts';
import { DEFAULT_SONG_CHIP, DEFAULT_SONG_CLOCK } from '../../constants/song.ts';
import { loadSoundEngineId } from '../../utils/storage/soundEngine.ts';
import { logger } from '../../utils/log/logger.ts';

type WindowWithYm2149 = Window & {
  ym2149?: SoundEngine;
};

export interface UseAudioSetupResult {
  audioContext: AudioContext | null;
  audioError: string | null;
  ym2149Ref: React.RefObject<SoundEngine | null>;
  ym2149: SoundEngine | null;
  waitForEngine: () => Promise<SoundEngine | null>;
  playTestTone: () => void;
}

export function useAudioSetup(
  chipClock: number = DEFAULT_SONG_CLOCK,
  engineId?: SoundEngineId,
  channelPans?: number[],
  songChip: string = DEFAULT_SONG_CHIP,
): UseAudioSetupResult {
  const { audioContext, error } = useAudioContext();
  const ym2149Ref = useRef<SoundEngine | null>(null);
  const testToneRef = useRef<(() => void) | null>(null);
  const chipClockRef = useRef(chipClock);
  const songChipRef = useRef(songChip);
  const channelPansRef = useRef<number[]>(channelPans ?? [0.5, 0.5, 0.5]);
  const readyWaitersRef = useRef<Array<(engine: SoundEngine | null) => void>>([]);
  // The persisted key is only a mount-time fallback - a caller-provided
  // engineId wins and switching it re-runs the creation effect below.
  const [storedEngineId] = useState<SoundEngineId>(loadSoundEngineId);
  const resolvedEngineId = engineId ?? storedEngineId;
  const [ym2149, setYm2149] = useState<SoundEngine | null>(null);

  useEffect(() => {
    if (!audioContext) {
      return;
    }

    logger.info('AudioContext created with rate', audioContext.sampleRate, audioContext.state);

    let cancelled = false;
    let landedEngine: SoundEngine | null = null;

    const landEngine = (engine: SoundEngine) => {
      if (cancelled) {
        engine.dispose();
        return;
      }
      landedEngine = engine;
      ym2149Ref.current = engine;
      setYm2149(engine);
      // Expose on window for debugging
      (window as WindowWithYm2149).ym2149 = engine;

      // The song clock may have moved while the engine resolved.
      engine.setClock(chipClockRef.current);
      engine.setChip(songChipRef.current);
      engine.setChannelPans(channelPansRef.current);

      readyWaitersRef.current.splice(0).forEach((resolve) => resolve(engine));
    };

    const rejectWaiters = () => {
      readyWaitersRef.current.splice(0).forEach((resolve) => resolve(null));
    };

    try {
      if (resolvedEngineId === 'internal') {
        // The internal engine constructs synchronously, so landing it here
        // keeps writes and silenceAll reachable for the very first tick.
        landEngine(new YM2149(audioContext, chipClockRef.current));
      } else {
        void createSoundEngine(resolvedEngineId, audioContext, chipClockRef.current)
          .then(landEngine)
          .catch((e) => {
            logger.error('Failed to initialize audio', e);
            rejectWaiters();
          });
      }
    } catch (e) {
      logger.error('Failed to initialize audio', e);
      rejectWaiters();
    }

    // Short test tone to validate the audio path: a dedicated oscillator
    // scheduled on the AudioContext clock - deterministic 440 Hz for
    // 200 ms at half gain, immune to any SoundEngine register writes during
    // init.
    testToneRef.current = () => {
      const osc = audioContext.createOscillator();
      const gain = audioContext.createGain();
      osc.type = 'square';
      osc.frequency.value = 440;
      gain.gain.value = 0.15;
      osc.connect(gain);
      gain.connect(audioContext.destination);
      const now = audioContext.currentTime;
      osc.start(now);
      osc.stop(now + 0.2);
    };
    logger.info('YM2149 test tone scheduled');

    const handleUserInteraction = () => {
      if (audioContext.state === 'suspended') {
        void audioContext
          .resume()
          .then(() => {
            logger.info('AudioContext resumed by user interaction');
          })
          .catch((err) => {
            logger.error('AudioContext resume failed', err);
          });
      }
    };

    const userEvents: Array<keyof DocumentEventMap> = [
      'click',
      'keydown',
      'pointerdown',
      'touchstart',
    ];
    userEvents.forEach((eventType) => {
      document.addEventListener(eventType, handleUserInteraction);
    });

    return () => {
      cancelled = true;
      testToneRef.current = null;
      userEvents.forEach((eventType) => {
        document.removeEventListener(eventType, handleUserInteraction);
      });
      landedEngine?.silenceAll();
      landedEngine?.dispose();
      if (ym2149Ref.current === landedEngine) {
        ym2149Ref.current = null;
      }
      setYm2149(null);
    };
  }, [audioContext, resolvedEngineId]);

  useEffect(() => {
    chipClockRef.current = chipClock;
    if (ym2149Ref.current) {
      ym2149Ref.current.setClock(chipClock);
    }
  }, [chipClock]);

  // Song chip mirrors the clock handling: the ref keeps a mid-flight
  // engine creation consistent; the live engine reconfigures in place.
  useEffect(() => {
    songChipRef.current = songChip;
    if (ym2149Ref.current) {
      ym2149Ref.current.setChip(songChip);
    }
  }, [songChip]);

  // Channel pans mirror the song's resolved stereo settings. The ref keeps
  // a mid-flight engine creation consistent; the live engine is re-panned
  // in place so routing changes never recreate the audio path.
  useEffect(() => {
    const pans = channelPans ?? [0.5, 0.5, 0.5];
    const changed =
      channelPansRef.current.length !== pans.length ||
      channelPansRef.current.some((pan, i) => pan !== pans[i]);
    channelPansRef.current = pans;
    if (changed && ym2149Ref.current) {
      ym2149Ref.current.setChannelPans(pans);
    }
  }, [channelPans]);

  const playTestTone = useCallback(() => testToneRef.current?.(), []);

  // Resolves once an engine is usable: immediately when one has landed, or
  // after the pending creation finishes. Playback callers gate on this so the
  // sequencer view never runs ahead of a writable engine.
  const waitForEngine = useCallback((): Promise<SoundEngine | null> => {
    if (ym2149Ref.current) {
      return Promise.resolve(ym2149Ref.current);
    }
    return new Promise<SoundEngine | null>((resolve) => {
      readyWaitersRef.current.push(resolve);
    });
  }, []);

  return {
    audioContext,
    audioError: error,
    ym2149Ref,
    ym2149,
    waitForEngine,
    playTestTone,
  };
}

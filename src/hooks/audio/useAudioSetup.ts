import { useCallback, useEffect, useRef, useState } from 'react';
import { useAudioContext } from './useAudioContext.ts';
import type { SoundEngine } from '../../synth/soundEngine.ts';
import { createSoundEngine } from '../../synth/soundEngine.ts';
import { YM2149 } from '../../synth/YM2149.ts';
import type { SoundEngineId } from '../../constants/sound.ts';
import {
  DEFAULT_SONG_CHIP,
  DEFAULT_SONG_CLOCK,
  SINGLE_CHIP_CHANNEL_COUNT,
} from '../../constants/song.ts';
import { loadSoundEngineId } from '../../utils/storage/soundEngine.ts';
import { logger } from '../../utils/log/logger.ts';

type WindowWithYm2149 = Window & {
  ym2149?: SoundEngine;
};

export interface ChannelEngineTarget {
  engine: SoundEngine;
  // Register-space channel inside the owning chip (0-2). Global channels
  // D-F (indices 3-5) map onto chip 2's local channels 0-2.
  localChannel: number;
}

export interface UseAudioSetupResult {
  audioContext: AudioContext | null;
  audioError: string | null;
  ym2149Ref: React.RefObject<SoundEngine | null>;
  ym2149: SoundEngine | null;
  ym2149Ref2: React.RefObject<SoundEngine | null>;
  ym21492: SoundEngine | null;
  engineForChannel: (channel: number) => ChannelEngineTarget | null;
  engineInstanceForChannel: (channel: number) => SoundEngine | null;
  waitForEngine: () => Promise<SoundEngine | null>;
  waitForEngines: () => Promise<SoundEngine[]>;
  playTestTone: () => void;
}

export function useAudioSetup(
  chipClock: number = DEFAULT_SONG_CLOCK,
  engineId?: SoundEngineId,
  channelPans?: number[],
  songChip: string = DEFAULT_SONG_CHIP,
  chipCount: 1 | 2 = 1,
  crosstalk: number = 0,
): UseAudioSetupResult {
  const { audioContext, error } = useAudioContext();
  const ym2149Ref = useRef<SoundEngine | null>(null);
  const ym2149Ref2 = useRef<SoundEngine | null>(null);
  const testToneRef = useRef<(() => void) | null>(null);
  const chipClockRef = useRef(chipClock);
  const songChipRef = useRef(songChip);
  const channelPansRef = useRef<number[]>(channelPans ?? [0.5, 0.5, 0.5]);
  const crosstalkRef = useRef(crosstalk);
  const busGainsRef = useRef<AudioParam[] | null>(null);
  const readyWaitersRef = useRef<Array<(engine: SoundEngine | null) => void>>([]);
  const pairWaitersRef = useRef<Array<(engines: SoundEngine[]) => void>>([]);
  // The persisted key is only a mount-time fallback - a caller-provided
  // engineId wins and switching it re-runs the creation effect below.
  const [storedEngineId] = useState<SoundEngineId>(loadSoundEngineId);
  const resolvedEngineId = engineId ?? storedEngineId;
  const [ym2149, setYm2149] = useState<SoundEngine | null>(null);
  const [ym21492, setYm21492] = useState<SoundEngine | null>(null);

  useEffect(() => {
    if (!audioContext) {
      return;
    }

    logger.info('AudioContext created with rate', audioContext.sampleRate, audioContext.state);

    let cancelled = false;
    const landedEngines: SoundEngine[] = [];

    // Master stereo bus: every engine's output sums into mixIn, the
    // splitter feeds a normalized crossfade - dry paths at 1 - c/2 and
    // symmetric bleed paths at c/2 - so the crosstalk setting blends
    // toward dual-mono at 100 percent without boosting correlated
    // content. At zero crosstalk the path is transparent. mixIn is
    // pinned to two channels: a mono-folded engine output (all-centre
    // pans) would otherwise reach the splitter as one channel and play
    // left-only.
    const mixIn = audioContext.createGain();
    mixIn.channelCount = 2;
    mixIn.channelCountMode = 'explicit';
    const splitter = audioContext.createChannelSplitter(2);
    const merger = audioContext.createChannelMerger(2);
    const dryToLeft = audioContext.createGain();
    const dryToRight = audioContext.createGain();
    const bleedToRight = audioContext.createGain();
    const bleedToLeft = audioContext.createGain();
    const crosstalkLevel = Math.min(1, Math.max(0, crosstalkRef.current));
    const dryLevel = 1 - crosstalkLevel / 2;
    const bleedLevel = crosstalkLevel / 2;
    dryToLeft.gain.setValueAtTime(dryLevel, audioContext.currentTime);
    dryToRight.gain.setValueAtTime(dryLevel, audioContext.currentTime);
    bleedToRight.gain.setValueAtTime(bleedLevel, audioContext.currentTime);
    bleedToLeft.gain.setValueAtTime(bleedLevel, audioContext.currentTime);
    mixIn.connect(splitter);
    splitter.connect(dryToLeft, 0);
    dryToLeft.connect(merger, 0, 0);
    splitter.connect(dryToRight, 1);
    dryToRight.connect(merger, 0, 1);
    splitter.connect(bleedToRight, 0);
    bleedToRight.connect(merger, 0, 1);
    splitter.connect(bleedToLeft, 1);
    bleedToLeft.connect(merger, 0, 0);
    merger.connect(audioContext.destination);
    busGainsRef.current = [dryToLeft.gain, dryToRight.gain, bleedToRight.gain, bleedToLeft.gain];

    // Each chip gets its own engine through the same factory so the
    // internal YM2149 and Ayumi drivers both support the dual path.
    // Chip 1 receives the first three pans, chip 2 the last three.
    const configureEngine = (engine: SoundEngine, chipIndex: 0 | 1) => {
      engine.setClock(chipClockRef.current);
      engine.setChip(songChipRef.current);
      engine.routeOutput(mixIn);
      const pans = channelPansRef.current;
      engine.setChannelPans(
        chipIndex === 0
          ? pans.slice(0, SINGLE_CHIP_CHANNEL_COUNT)
          : pans.slice(SINGLE_CHIP_CHANNEL_COUNT),
      );
    };

    const landEngine = (engine: SoundEngine, chipIndex: 0 | 1) => {
      if (cancelled) {
        engine.dispose();
        return;
      }
      configureEngine(engine, chipIndex);
      landedEngines[chipIndex] = engine;
      if (chipIndex === 0) {
        ym2149Ref.current = engine;
        setYm2149(engine);
        // Expose on window for debugging
        (window as WindowWithYm2149).ym2149 = engine;
      } else {
        ym2149Ref2.current = engine;
        setYm21492(engine);
      }
      const needed = chipCount === 2 ? 2 : 1;
      if (landedEngines.filter(Boolean).length === needed) {
        const all = landedEngines.slice(0, needed);
        readyWaitersRef.current.splice(0).forEach((resolve) => resolve(all[0] ?? null));
        pairWaitersRef.current.splice(0).forEach((resolve) => resolve(all));
      }
    };

    const rejectWaiters = () => {
      readyWaitersRef.current.splice(0).forEach((resolve) => resolve(null));
      pairWaitersRef.current.splice(0).forEach((resolve) => resolve([]));
    };

    const createOne = (chipIndex: 0 | 1) => {
      try {
        if (resolvedEngineId === 'internal') {
          // The internal engine constructs synchronously, so landing it here
          // keeps writes and silenceAll reachable for the very first tick.
          landEngine(new YM2149(audioContext, chipClockRef.current), chipIndex);
        } else {
          void createSoundEngine(resolvedEngineId, audioContext, chipClockRef.current)
            .then((engine) => landEngine(engine, chipIndex))
            .catch((e) => {
              logger.error('Failed to initialize audio', e);
              rejectWaiters();
            });
        }
      } catch (e) {
        logger.error('Failed to initialize audio', e);
        rejectWaiters();
      }
    };

    createOne(0);
    if (chipCount === 2) {
      createOne(1);
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
      busGainsRef.current = null;
      mixIn.disconnect();
      splitter.disconnect();
      merger.disconnect();
      dryToLeft.disconnect();
      dryToRight.disconnect();
      bleedToRight.disconnect();
      bleedToLeft.disconnect();
      userEvents.forEach((eventType) => {
        document.removeEventListener(eventType, handleUserInteraction);
      });
      for (const engine of landedEngines) {
        engine?.silenceAll();
        engine?.dispose();
      }
      if (ym2149Ref.current && landedEngines.includes(ym2149Ref.current)) {
        ym2149Ref.current = null;
      }
      if (ym2149Ref2.current && landedEngines.includes(ym2149Ref2.current)) {
        ym2149Ref2.current = null;
      }
      setYm2149(null);
      setYm21492(null);
    };
  }, [audioContext, resolvedEngineId, chipCount]);

  useEffect(() => {
    chipClockRef.current = chipClock;
    for (const ref of [ym2149Ref, ym2149Ref2]) {
      if (ref.current) {
        ref.current.setClock(chipClock);
      }
    }
  }, [chipClock]);

  // Song chip mirrors the clock handling: the ref keeps a mid-flight
  // engine creation consistent; the live engine reconfigures in place.
  useEffect(() => {
    songChipRef.current = songChip;
    for (const ref of [ym2149Ref, ym2149Ref2]) {
      if (ref.current) {
        ref.current.setChip(songChip);
      }
    }
  }, [songChip]);

  // Channel pans mirror the song's resolved stereo settings. The ref keeps
  // a mid-flight engine creation consistent; the live engine is re-panned
  // in place so routing changes never recreate the audio path. Chip 2
  // receives the D/E/F slice of the six-channel tuple.
  useEffect(() => {
    const pans = channelPans ?? [0.5, 0.5, 0.5];
    const changed =
      channelPansRef.current.length !== pans.length ||
      channelPansRef.current.some((pan, i) => pan !== pans[i]);
    channelPansRef.current = pans;
    if (changed) {
      ym2149Ref.current?.setChannelPans(pans.slice(0, SINGLE_CHIP_CHANNEL_COUNT));
      ym2149Ref2.current?.setChannelPans(pans.slice(SINGLE_CHIP_CHANNEL_COUNT));
    }
  }, [channelPans]);

  // Crosstalk mirrors the app setting onto the bus gains as a normalized
  // crossfade: the dry paths ease toward 1 - c/2 while the symmetric bleed
  // paths rise toward c/2, converging both outputs on (L+R)/2 at 100
  // percent. The ref keeps a mid-flight bus rebuild consistent; ramps
  // avoid zipper noise.
  useEffect(() => {
    crosstalkRef.current = crosstalk;
    const gains = busGainsRef.current;
    if (!gains || !audioContext) {
      return;
    }
    const level = Math.min(1, Math.max(0, crosstalk));
    const now = audioContext.currentTime;
    const dry = 1 - level / 2;
    const bleed = level / 2;
    gains[0].setTargetAtTime(dry, now, 0.05);
    gains[1].setTargetAtTime(dry, now, 0.05);
    gains[2].setTargetAtTime(bleed, now, 0.05);
    gains[3].setTargetAtTime(bleed, now, 0.05);
  }, [crosstalk, audioContext]);

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

  // Resolves once every engine the song needs has landed - playback gates
  // on this so a two-chip song never starts on a half-ready pair.
  const waitForEngines = useCallback((): Promise<SoundEngine[]> => {
    const needed = chipCount === 2 ? 2 : 1;
    const current = [ym2149Ref.current, ym2149Ref2.current].filter(
      (engine): engine is SoundEngine => engine !== null,
    );
    if (current.length >= needed) {
      return Promise.resolve(current.slice(0, needed));
    }
    return new Promise<SoundEngine[]>((resolve) => {
      pairWaitersRef.current.push(resolve);
    });
  }, [chipCount]);

  const engineForChannel = useCallback((channel: number): ChannelEngineTarget | null => {
    const engine = channel < SINGLE_CHIP_CHANNEL_COUNT ? ym2149Ref.current : ym2149Ref2.current;
    if (!engine) {
      return null;
    }
    return {
      engine,
      localChannel: channel % SINGLE_CHIP_CHANNEL_COUNT,
    };
  }, []);

  const engineInstanceForChannel = useCallback(
    (channel: number): SoundEngine | null => engineForChannel(channel)?.engine ?? null,
    [engineForChannel],
  );

  return {
    audioContext,
    audioError: error,
    ym2149Ref,
    ym2149,
    ym2149Ref2,
    ym21492,
    engineForChannel,
    engineInstanceForChannel,
    waitForEngine,
    waitForEngines,
    playTestTone,
  };
}

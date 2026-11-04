import { useCallback, useEffect, useRef, useState } from 'react';
import { useAudioContext } from './useAudioContext.ts';
import { YM2149 } from '../../synth/YM2149.ts';
import { DEFAULT_SONG_CLOCK } from '../../constants/song.ts';
import { logger } from '../../utils/log/logger.ts';

type WindowWithYm2149 = Window & {
  ym2149?: YM2149;
};

export interface UseAudioSetupResult {
  audioContext: AudioContext | null;
  audioError: string | null;
  ym2149Ref: React.RefObject<YM2149 | null>;
  ym2149: YM2149 | null;
  playTestTone: () => void;
}

export function useAudioSetup(chipClock: number = DEFAULT_SONG_CLOCK): UseAudioSetupResult {
  const { audioContext, error } = useAudioContext();
  const ym2149Ref = useRef<YM2149 | null>(null);
  const testToneRef = useRef<(() => void) | null>(null);
  const [ym2149, setYm2149] = useState<YM2149 | null>(null);

  useEffect(() => {
    if (!audioContext || ym2149Ref.current) {
      return;
    }

    try {
      logger.info('AudioContext created with rate', audioContext.sampleRate, audioContext.state);

      const ymInstance = new YM2149(audioContext, chipClock);
      ym2149Ref.current = ymInstance;
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setYm2149(ymInstance);

      // Expose on window for debugging
      (window as WindowWithYm2149).ym2149 = ymInstance;

      // Basic initial register setup
      // Volume 12 of 15: YM_LOG_VOLUME_TABLE[12] = 0.3536, the nearest
      // level to one third of maximum output on the AY logarithmic scale.
      ymInstance.writeRegister(0x08, 0x0c);
      ymInstance.writeRegister(0x09, 0x0c);
      ymInstance.writeRegister(0x0a, 0x0c);
      ymInstance.writeRegister(0x07, 0x38);

      // Short test tone to validate the audio path: a dedicated oscillator
      // scheduled on the AudioContext clock - deterministic 440 Hz for
      // 200 ms at half gain, immune to any YM2149 register writes during
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
        testToneRef.current = null;
        userEvents.forEach((eventType) => {
          document.removeEventListener(eventType, handleUserInteraction);
        });
        if (ym2149Ref.current) {
          ym2149Ref.current.dispose();
          ym2149Ref.current = null;
          setYm2149(null);
        }
      };
    } catch (e) {
      logger.error('Failed to initialize audio', e);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audioContext]);

  // Update the YM2149 clock when the song's chip clock changes
  useEffect(() => {
    if (ym2149Ref.current) {
      ym2149Ref.current.setClock(chipClock);
    }
  }, [chipClock]);

  const playTestTone = useCallback(() => testToneRef.current?.(), []);

  return {
    audioContext,
    audioError: error,
    ym2149Ref,
    ym2149,
    playTestTone,
  };
}

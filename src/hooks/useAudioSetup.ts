import { useEffect, useRef, useState } from 'react';
import { useAudioContext } from './useAudioContext';
import { YM2149 } from '../synth/YM2149';
import { logger } from '../utils/logger';

type WindowWithYm2149 = Window & {
  ym2149?: YM2149;
};

export interface UseAudioSetupResult {
  audioContext: AudioContext | null;
  audioError: string | null;
  ym2149Ref: React.RefObject<YM2149 | null>;
  ym2149: YM2149 | null;
}

export function useAudioSetup(): UseAudioSetupResult {
  const { audioContext, error } = useAudioContext();
  const ym2149Ref = useRef<YM2149 | null>(null);
  const [ym2149, setYm2149] = useState<YM2149 | null>(null);

  useEffect(() => {
    if (!audioContext || ym2149Ref.current) {
      return;
    }

    try {
      logger.info('AudioContext created with rate', audioContext.sampleRate, audioContext.state);

      const ymInstance = new YM2149(audioContext);
      ym2149Ref.current = ymInstance;
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setYm2149(ymInstance);

      // Expose on window for debugging
      (window as WindowWithYm2149).ym2149 = ymInstance;

      // Basic initial register setup
      ymInstance.writeRegister(0x08, 0x0f);
      ymInstance.writeRegister(0x09, 0x0f);
      ymInstance.writeRegister(0x0a, 0x0f);
      ymInstance.writeRegister(0x07, 0x38);

      // Short test tone to validate audio path
      const testFrequency = 261.63;
      const testPeriod = Math.floor(2000000 / (16 * testFrequency));
      logger.info('YM2149 test tone frequency', testFrequency);

      ymInstance.writeRegister(0x00, testPeriod & 0xff);
      ymInstance.writeRegister(0x01, (testPeriod >> 8) & 0x0f);

      const stopToneTimeout = window.setTimeout(() => {
        if (ym2149Ref.current) {
          ym2149Ref.current.writeRegister(0x08, 0x00);
          ym2149Ref.current.writeRegister(0x09, 0x00);
          ym2149Ref.current.writeRegister(0x0a, 0x00);
        }
      }, 100);

      const handleUserInteraction = () => {
        if (audioContext.state === 'suspended') {
          void audioContext
            .resume()
            .then(() => {
              logger.info('AudioContext resumed by user interaction');
            })
            .catch(err => {
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
      userEvents.forEach(eventType => {
        document.addEventListener(eventType, handleUserInteraction);
      });

      return () => {
        window.clearTimeout(stopToneTimeout);
        userEvents.forEach(eventType => {
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
  }, [audioContext]);

  return {
    audioContext,
    audioError: error,
    ym2149Ref,
    ym2149,
  };
}

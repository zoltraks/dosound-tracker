import { useEffect, useRef, useState } from 'react';
import { useAudioContext } from './useAudioContext';
import { YM2149 } from '../synth/YM2149';

export interface UseAudioSetupResult {
  audioContext: AudioContext | null;
  audioError: string | null;
  ym2149Ref: React.RefObject<YM2149 | null>;
}

export function useAudioSetup(): UseAudioSetupResult {
  const { audioContext, error } = useAudioContext();
  const ym2149Ref = useRef<YM2149 | null>(null);
  const [, forceRender] = useState(0);

  useEffect(() => {
    if (!audioContext || ym2149Ref.current) {
      return;
    }

    try {
      // Initialize YM2149 with the existing AudioContext
      console.log('Starting audio initialization...');
      console.log('AudioContext created, sampleRate:', audioContext.sampleRate);
      console.log('AudioContext initial state:', audioContext.state);

      const ym2149 = new YM2149(audioContext);
      ym2149Ref.current = ym2149;
      // Force a re-render so any components depending on ym2149Ref can update
      forceRender(v => v + 1);
      console.log('YM2149 initialized');

      // Expose on window for debugging
      (window as any).ym2149 = ym2149;

      // Basic initial register setup
      ym2149.writeRegister(0x08, 0x0f);
      ym2149.writeRegister(0x09, 0x0f);
      ym2149.writeRegister(0x0a, 0x0f);
      ym2149.writeRegister(0x07, 0x38);
      console.log('YM2149 registers set');

      // Short test tone to validate audio path
      const testFrequency = 261.63;
      const testPeriod = Math.floor(2000000 / (16 * testFrequency));
      console.log('YM2149 test tone frequency', testFrequency);

      ym2149.writeRegister(0x00, testPeriod & 0xff);
      ym2149.writeRegister(0x01, (testPeriod >> 8) & 0x0f);

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
              console.log('AudioContext resumed by user interaction');
            })
            .catch(err => {
              console.error('AudioContext resume failed:', err);
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
        }
      };
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('Failed to initialize audio:', e);
    }
  }, [audioContext]);

  return {
    audioContext,
    audioError: error,
    ym2149Ref,
  };
}

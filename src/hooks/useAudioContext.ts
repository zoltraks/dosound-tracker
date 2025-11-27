import { useEffect, useState } from 'react';

export const useAudioContext = () => {
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let context: AudioContext | null = null;

    const initAudioContext = async () => {
      try {
        const AudioContextClass =
          window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;

        if (!AudioContextClass) {
          throw new Error('Web Audio API not supported');
        }

        context = new AudioContextClass();

        if (context.state === 'suspended') {
          await context.resume();
        }

        setAudioContext(context);
      } catch (err) {
        setError('Failed to initialize audio context');
        console.error('Audio context initialization failed:', err);
      }
    };

    void initAudioContext();

    return () => {
      if (context) {
        context.close();
      }
    };
  }, []);

  return { audioContext, error };
};

import { useEffect, useState } from 'react';

export const useAudioContext = () => {
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let context: AudioContext | null = null;

    const initAudioContext = () => {
      try {
        const AudioContextClass =
          window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;

        if (!AudioContextClass) {
          throw new Error('Web Audio API not supported');
        }

        context = new AudioContextClass();
        setAudioContext(context);
      } catch (err) {
        setError('Failed to initialize audio context');
        console.error('Audio context initialization failed:', err);
      }
    };

    initAudioContext();

    return () => {
      if (context) {
        context.close();
      }
    };
  }, []);

  return { audioContext, error };
};

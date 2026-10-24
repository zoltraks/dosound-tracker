import { useCallback } from 'react';
import { logger } from '../../utils/log/logger.ts';

export const useAudioContextResume = ({ audioContext }: { audioContext: AudioContext | null }) => {
  const ensureAudioContextResumed = useCallback(() => {
    if (!audioContext) {
      return Promise.resolve();
    }

    if (audioContext.state === 'suspended') {
      return audioContext
        .resume()
        .then(() => {
          // AudioContext resumed; piano preview notes can now play immediately.
        })
        .catch((error: unknown) => {
          logger.error('AudioContext resume failed in ensureAudioContextResumed', error);
        });
    }

    return Promise.resolve();
  }, [audioContext]);

  return { ensureAudioContextResumed };
};

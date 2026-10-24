import { useEffect } from 'react';
import type { ExtendedWindow } from '../../types/electronApi.ts';

// Electron window-close interception: ask React whether to quit when song is dirty.
export const useElectronCloseGuard = () => {
  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const extWindow = window as ExtendedWindow;
    const api = extWindow.electronAPI;
    if (!api || !api.onAppCloseRequested) {
      return;
    }

    const handler = () => {
      if (api.confirmAppClose) {
        api.confirmAppClose();
      }
    };

    api.onAppCloseRequested(handler);
    return () => {
      if (api.removeAppCloseRequestedListener) {
        api.removeAppCloseRequestedListener(handler);
      }
    };
  }, []);
};

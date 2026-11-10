import { useEffect } from 'react';
import type { ExtendedWindow } from '../../types/electronApi.ts';

// Electron window-close interception: prompt the quit-confirm modal when the
// song is dirty, confirm immediately when it is clean.
export const useElectronCloseGuard = ({
  isSongDirty,
  onQuitRequested,
}: {
  isSongDirty: boolean;
  onQuitRequested: (open: boolean) => void;
}) => {
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
      if (isSongDirty) {
        onQuitRequested(true);
        return;
      }

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
  }, [isSongDirty, onQuitRequested]);
};

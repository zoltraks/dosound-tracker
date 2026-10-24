import { useEffect, useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import { StorageKeys } from '../utils/storageKeys';

const computeIsMobileViewport = () =>
  typeof window !== 'undefined' && (window.innerWidth <= 1100 || window.innerHeight <= 700);

export interface UseResponsivePanelsResult {
  isMobileViewport: boolean;
  isCommandPanelMobileCollapsed: boolean;
  setIsCommandPanelMobileCollapsed: Dispatch<SetStateAction<boolean>>;
}

export function useResponsivePanels(): UseResponsivePanelsResult {
  const [isMobileViewport, setIsMobileViewport] = useState(computeIsMobileViewport);
  const [isCommandPanelMobileCollapsed, setIsCommandPanelMobileCollapsed] = useState<boolean>(
    () => {
      if (!computeIsMobileViewport()) {
        return false;
      }

      try {
        if (localStorage.getItem(StorageKeys.COMMAND_PANEL_MOBILE) === 'expanded') {
          return false;
        }
      } catch {
        // ignore
      }

      return true;
    },
  );

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const handleResize = () => {
      const nextIsMobile = computeIsMobileViewport();
      setIsMobileViewport(nextIsMobile);
      if (!nextIsMobile) {
        setIsCommandPanelMobileCollapsed(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (!isMobileViewport) {
      return;
    }

    try {
      localStorage.setItem(
        StorageKeys.COMMAND_PANEL_MOBILE,
        isCommandPanelMobileCollapsed ? 'collapsed' : 'expanded',
      );
    } catch {
      // ignore
    }
  }, [isCommandPanelMobileCollapsed, isMobileViewport]);

  return {
    isMobileViewport,
    isCommandPanelMobileCollapsed,
    setIsCommandPanelMobileCollapsed,
  };
}

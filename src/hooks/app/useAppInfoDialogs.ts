/* eslint-disable react-hooks/exhaustive-deps */
import { useCallback, useEffect, useState } from 'react';
import type { ExtendedWindow } from '../../types/electronApi.ts';
import { fetchBundledMarkdown } from '../../utils/markdown/bundledMarkdown.ts';
import { logger } from '../../utils/log/logger.ts';

export interface UseAppInfoDialogsParams {
  setIsAboutOpen: (open: boolean) => void;
  setChangelogContent: (value: string) => void;
  setIsChangelogOpen: (open: boolean) => void;
  setManualContent: (value: string) => void;
  setIsManualOpen: (open: boolean) => void;
  setIsQuitConfirmOpen: (open: boolean) => void;
}

export interface UseAppInfoDialogsResult {
  aboutRuntimeLabel: string | null;
  aboutRuntimeDetails: string[];
  handleShowAbout: () => void;
  handleConfirmQuit: () => void;
  handleCancelQuit: () => void;
  handleShowChangelog: () => void;
  handleCloseChangelog: () => void;
  handleShowManual: () => void;
  handleCloseManual: () => void;
}

export function useAppInfoDialogs({
  setIsAboutOpen,
  setChangelogContent,
  setIsChangelogOpen,
  setManualContent,
  setIsManualOpen,
  setIsQuitConfirmOpen,
}: UseAppInfoDialogsParams): UseAppInfoDialogsResult {
  const [aboutRuntimeLabel, setAboutRuntimeLabel] = useState<string | null>(null);
  const [aboutRuntimeDetails, setAboutRuntimeDetails] = useState<string[]>([]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const extWindow = window as ExtendedWindow;
    const api = extWindow.electronAPI;

    if (api && typeof api.getRuntimeInfo === 'function') {
      try {
        const info = api.getRuntimeInfo() || {};
        const details: string[] = [];

        if (info.electron) {
          details.push(`Electron ${info.electron}`);
        }
        if (info.chrome) {
          details.push(`Chromium ${info.chrome}`);
        }
        if (info.node) {
          details.push(`Node.js ${info.node}`);
        }

        if (details.length > 0) {
          setAboutRuntimeLabel('Runtime');
          setAboutRuntimeDetails(details);
          return;
        }
      } catch (error) {
        logger.error('Error getting runtime info', error);
      }
    }

    try {
      const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';
      const trimmed = ua.trim();
      if (trimmed) {
        setAboutRuntimeLabel('Runtime');
        setAboutRuntimeDetails([trimmed]);
      }
    } catch (error) {
      logger.error('Error getting user agent', error);
    }
  }, []);

  const handleShowAbout = useCallback(() => {
    setIsAboutOpen(true);
  }, []);

  const handleConfirmQuit = useCallback(() => {
    setIsQuitConfirmOpen(false);

    if (typeof window !== 'undefined') {
      const api = (window as ExtendedWindow).electronAPI;
      if (api && api.confirmAppClose) {
        api.confirmAppClose();
        return;
      }

      // Fallback for non-Electron environments (may be ignored by the browser).
      window.close();
    }
  }, []);

  const handleCancelQuit = useCallback(() => {
    setIsQuitConfirmOpen(false);

    if (typeof window !== 'undefined') {
      const api = (window as ExtendedWindow).electronAPI;
      if (api && api.cancelAppClose) {
        api.cancelAppClose();
      }
    }
  }, []);

  const handleShowChangelog = useCallback(() => {
    setIsAboutOpen(false);
    setChangelogContent('');
    setIsChangelogOpen(true);

    fetchBundledMarkdown('CHANGELOG.md')
      .then((text) => {
        setChangelogContent(text);
      })
      .catch(() => {
        setChangelogContent('Unable to load changelog.');
      });
  }, []);

  const handleCloseChangelog = useCallback(() => {
    setIsChangelogOpen(false);
  }, []);

  const handleShowManual = useCallback(() => {
    setIsAboutOpen(false);
    setManualContent('');
    setIsManualOpen(true);

    fetchBundledMarkdown('MANUAL.md')
      .then((text) => {
        setManualContent(text);
      })
      .catch(() => {
        setManualContent('Unable to load manual.');
      });
  }, []);

  const handleCloseManual = useCallback(() => {
    setIsManualOpen(false);
  }, []);

  return {
    aboutRuntimeLabel,
    aboutRuntimeDetails,
    handleShowAbout,
    handleConfirmQuit,
    handleCancelQuit,
    handleShowChangelog,
    handleCloseChangelog,
    handleShowManual,
    handleCloseManual,
  };
}

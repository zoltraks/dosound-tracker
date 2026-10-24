/* eslint-disable react-hooks/exhaustive-deps */
import { useCallback, useState } from 'react';
import type { NavigationSection } from '../constants/navigation';
import { StorageKeys } from '../utils/storageKeys';
import { clearMirroredSnapshots } from '../utils/persistenceMirror';
import type { ExtendedWindow } from '../types/electronApi';
import { logger } from '../utils/logger';

export interface UseSongLifecycleDialogsParams {
  createNewSong: () => void;
  setCurrentOctave: (octave: number) => void;
  setChannelMutes: (mutes: [boolean, boolean, boolean]) => void;
  setPosition: (pattern: number, line: number, tick?: number) => void;
  setSharedCurrentLine: (line: number) => void;
  setActiveSection: (section: NavigationSection) => void;
  setIsNewSongConfirmOpen: (open: boolean) => void;
  setIsResetConfirmOpen: (open: boolean) => void;
  isSongDirty: boolean;
  loadSongFromText: (text: string) => void;
  setSongError: (value: string) => void;
}

export interface UseSongLifecycleDialogsResult {
  isDemoSongPickerOpen: boolean;
  setIsDemoSongPickerOpen: (open: boolean) => void;
  handleRequestNewSong: () => void;
  handleConfirmNewSong: () => void;
  handleCancelNewSong: () => void;
  handleRequestReset: () => void;
  handleConfirmReset: () => void;
  handleCancelReset: () => void;
  handleDemoSongClick: () => void;
  handlePickDemoSong: (fileUrl: string) => void;
}

export function useSongLifecycleDialogs({
  createNewSong,
  setCurrentOctave,
  setChannelMutes,
  setPosition,
  setSharedCurrentLine,
  setActiveSection,
  setIsNewSongConfirmOpen,
  setIsResetConfirmOpen,
  isSongDirty,
  loadSongFromText,
  setSongError,
}: UseSongLifecycleDialogsParams): UseSongLifecycleDialogsResult {
  const [pendingNewSongAction, setPendingNewSongAction] = useState<'new-song' | 'demo-song'>(
    'new-song',
  );
  const [isDemoSongPickerOpen, setIsDemoSongPickerOpen] = useState(false);

  const handleRequestNewSong = useCallback(() => {
    setPendingNewSongAction('new-song');
    setIsNewSongConfirmOpen(true);
  }, []);

  const openDemoSongPicker = useCallback(() => {
    setIsDemoSongPickerOpen(true);
  }, []);

  const handleConfirmNewSong = useCallback(() => {
    if (pendingNewSongAction === 'demo-song') {
      setIsNewSongConfirmOpen(false);
      setPendingNewSongAction('new-song');
      openDemoSongPicker();
      return;
    }

    createNewSong();
    setCurrentOctave(3);
    setChannelMutes([false, false, false]);
    setPosition(0, 0, 0);
    setSharedCurrentLine(0);
    setActiveSection('volume');

    setIsNewSongConfirmOpen(false);
    setPendingNewSongAction('new-song');
  }, [pendingNewSongAction, createNewSong, setPosition, setActiveSection, openDemoSongPicker]);

  const handleCancelNewSong = useCallback(() => {
    setIsNewSongConfirmOpen(false);
    setPendingNewSongAction('new-song');
  }, []);

  const handleRequestReset = useCallback(() => {
    setIsResetConfirmOpen(true);
  }, []);

  const handleConfirmReset = useCallback(() => {
    // Clear all localStorage data
    try {
      const preservedTheme = localStorage.getItem(StorageKeys.THEME);
      const preservedDebug = localStorage.getItem(StorageKeys.DEBUG_MODE);

      localStorage.clear();
      clearMirroredSnapshots();

      if (preservedTheme !== null) {
        localStorage.setItem(StorageKeys.THEME, preservedTheme);
      }

      if (preservedDebug !== null) {
        localStorage.setItem(StorageKeys.DEBUG_MODE, preservedDebug);
      }
    } catch {
      // ignore
    }
    setChannelMutes([false, false, false]);
    setCurrentOctave(3);
    // Reload the application to start fresh
    try {
      (window as ExtendedWindow).__dosoundTrackerIsResetting = true;
    } catch {
      // ignore
    }
    window.location.reload();
  }, [setChannelMutes, setCurrentOctave]);

  const handleCancelReset = useCallback(() => {
    setIsResetConfirmOpen(false);
  }, []);

  const handleDemoSongClick = useCallback(() => {
    if (isSongDirty) {
      setPendingNewSongAction('demo-song');
      setIsNewSongConfirmOpen(true);
      return;
    }
    openDemoSongPicker();
  }, [isSongDirty, openDemoSongPicker]);

  const handlePickDemoSong = useCallback(
    (fileUrl: string) => {
      fetch(fileUrl)
        .then((response) => {
          if (!response.ok) {
            throw new Error('Failed to load song file.');
          }

          const contentType = response.headers.get('content-type') || '';
          if (contentType.includes('text/html')) {
            throw new Error('Song file appears to be HTML, treating as missing.');
          }

          return response.text();
        })
        .then((text) => {
          loadSongFromText(text);
          setPosition(0, 0, 0);
          setSharedCurrentLine(0);
          setActiveSection('commands');
          setChannelMutes([false, false, false]);
        })
        .catch((error) => {
          logger.error('Error loading demo song', error);
          setSongError('Error loading song file.');
        })
        .finally(() => {
          setIsDemoSongPickerOpen(false);
        });
    },
    [
      loadSongFromText,
      setPosition,
      setSharedCurrentLine,
      setActiveSection,
      setChannelMutes,
      setSongError,
    ],
  );

  return {
    isDemoSongPickerOpen,
    setIsDemoSongPickerOpen,
    handleRequestNewSong,
    handleConfirmNewSong,
    handleCancelNewSong,
    handleRequestReset,
    handleConfirmReset,
    handleCancelReset,
    handleDemoSongClick,
    handlePickDemoSong,
  };
}

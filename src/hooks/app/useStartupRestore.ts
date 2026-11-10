/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect } from 'react';
import type { UseModalStateResult } from '../modal/useModalState.ts';
import { useUiStatePersistence } from '../ui/useUiStatePersistence.ts';

export interface UseStartupRestoreParams {
  modalState: UseModalStateResult;
  sharedCurrentLine: number;
  handleShowAbout: () => void;
  handleShowChangelog: () => void;
  handleShowManual: () => void;
  playTestTone: () => void;
}

/**
 * Restores the persisted view (re-opens the saved modal, scrolls to the saved
 * position) on mount and fires the startup test tone once state restoration
 * has had a full commit cycle.
 */
export function useStartupRestore({
  modalState,
  sharedCurrentLine,
  handleShowAbout,
  handleShowChangelog,
  handleShowManual,
  playTestTone,
}: UseStartupRestoreParams): void {
  const {
    isManualOpen,
    isChangelogOpen,
    isAboutOpen,
    isDownloadOpen,
    isDebugInfoOpen,
    isMidiModalOpen,
    isInstrumentMidiOpen,
    isInstrumentColorOpen,
    isExportModalOpen,
    setIsDownloadOpen,
    setIsDebugInfoOpen,
    setIsMidiModalOpen,
    setIsInstrumentMidiOpen,
    setIsInstrumentColorOpen,
    setIsExportModalOpen,
  } = modalState;

  const { restoreView } = useUiStatePersistence(
    {
      isManualOpen,
      isChangelogOpen,
      isAboutOpen,
      isDownloadOpen,
      isDebugInfoOpen,
      isMidiModalOpen,
      isInstrumentMidiOpen,
      isInstrumentColorOpen,
      isExportModalOpen,
    },
    sharedCurrentLine,
    {
      manual: handleShowManual,
      changelog: handleShowChangelog,
      about: handleShowAbout,
      download: () => setIsDownloadOpen(true),
      debugInfo: () => setIsDebugInfoOpen(true),
      midi: () => setIsMidiModalOpen(true),
      instrumentMidi: () => setIsInstrumentMidiOpen(true),
      instrumentColor: () => setIsInstrumentColorOpen(true),
      export: () => setIsExportModalOpen(true),
    },
  );

  useEffect(() => {
    restoreView();
    // The startup test tone fires only after initialization and state
    // restoration complete - two frames give restored-state reactions a
    // full commit cycle. Panel section flips no longer reach the channel
    // volume registers: the panel stopPreview calls are guarded by live
    // preview state.
    const raf = requestAnimationFrame(() => requestAnimationFrame(() => playTestTone()));
    return () => cancelAnimationFrame(raf);
  }, []);
}

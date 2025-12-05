import { useEffect } from 'react';

interface UseModalManagerOptions {
  songError: string;
  setSongError: (value: string) => void;
  instrumentError: string;
  setInstrumentError: (value: string) => void;
  transposeSummary: string;
  handleCloseTransposeSummary: () => void;
  trackClipboardError: string;
  setTrackClipboardError: (value: string) => void;
  optimizeSummary: string;
  handleCloseOptimizeSummary: () => void;
  soundExportSummary: string;
  handleCloseSoundExportSummary: () => void;
  dumpExportSummary: string;
  handleCloseDumpExportSummary: () => void;
  renumberSummary: string;
  handleCloseRenumberSummary: () => void;
  instrumentOperationSummary: string;
  handleCloseInstrumentOperationSummary: () => void;
  midiLoadError: string;
  setMidiLoadError: (value: string) => void;
  midiCopySummary: string;
  setMidiCopySummary: (value: string) => void;
  isAboutOpen: boolean;
  setIsAboutOpen: (value: boolean) => void;
  isChangelogOpen: boolean;
  handleCloseChangelog: () => void;
  isDownloadOpen: boolean;
  setIsDownloadOpen: (value: boolean) => void;
  isDebugInfoOpen: boolean;
  setIsDebugInfoOpen: (value: boolean) => void;
  isMidiModalOpen: boolean;
  handleCloseMidi: () => void;
  isTransposeOpen: boolean;
  handleCancelTranspose: () => void;
  handleConfirmTranspose: () => void;
  isOptimizeConfirmOpen: boolean;
  handleCancelOptimize: () => void;
  handleConfirmOptimize: () => void;
  isRenumberConfirmOpen: boolean;
  handleCancelRenumber: () => void;
  handleConfirmRenumber: () => void;
  isNewSongConfirmOpen: boolean;
  handleCancelNewSong: () => void;
  handleConfirmNewSong: () => void;
  isResetConfirmOpen: boolean;
  handleCancelReset: () => void;
  handleConfirmReset: () => void;
  isQuitConfirmOpen: boolean;
  handleCancelQuit: () => void;
  handleConfirmQuit: () => void;
  isInstrumentDeleteOpen: boolean;
  handleCancelInstrumentDelete: () => void;
  isInstrumentTypeWarningOpen: boolean;
  handleCancelInstrumentTypeWarning: () => void;
  handleConfirmInstrumentTypeWarning: () => void;
}

export function useModalManager(options: UseModalManagerOptions): void {
  const {
    songError,
    setSongError,
    instrumentError,
    setInstrumentError,
    transposeSummary,
    handleCloseTransposeSummary,
    trackClipboardError,
    setTrackClipboardError,
    optimizeSummary,
    handleCloseOptimizeSummary,
    soundExportSummary,
    handleCloseSoundExportSummary,
    dumpExportSummary,
    handleCloseDumpExportSummary,
    renumberSummary,
    handleCloseRenumberSummary,
    instrumentOperationSummary,
    handleCloseInstrumentOperationSummary,
    midiLoadError,
    setMidiLoadError,
    midiCopySummary,
    setMidiCopySummary,
    isAboutOpen,
    setIsAboutOpen,
    isChangelogOpen,
    handleCloseChangelog,
    isDownloadOpen,
    setIsDownloadOpen,
    isDebugInfoOpen,
    setIsDebugInfoOpen,
    isMidiModalOpen,
    handleCloseMidi,
    isTransposeOpen,
    handleCancelTranspose,
    handleConfirmTranspose,
    isOptimizeConfirmOpen,
    handleCancelOptimize,
    handleConfirmOptimize,
    isRenumberConfirmOpen,
    handleCancelRenumber,
    handleConfirmRenumber,
    isNewSongConfirmOpen,
    handleCancelNewSong,
    handleConfirmNewSong,
    isResetConfirmOpen,
    handleCancelReset,
    handleConfirmReset,
    isQuitConfirmOpen,
    handleCancelQuit,
    handleConfirmQuit,
    isInstrumentDeleteOpen,
    handleCancelInstrumentDelete,
    isInstrumentTypeWarningOpen,
    handleCancelInstrumentTypeWarning,
    handleConfirmInstrumentTypeWarning,
  } = options;

  useEffect(() => {
    const handleModalKeyDown = (event: KeyboardEvent) => {
      const hasInfoModal =
        !!songError ||
        !!instrumentError ||
        !!transposeSummary ||
        !!trackClipboardError ||
        !!optimizeSummary ||
        !!soundExportSummary ||
        !!dumpExportSummary ||
        !!renumberSummary ||
        !!instrumentOperationSummary ||
        !!midiLoadError ||
        !!midiCopySummary ||
        isAboutOpen ||
        isChangelogOpen ||
        isDownloadOpen ||
        isDebugInfoOpen ||
        isMidiModalOpen;

      const hasConfirmModal =
        isTransposeOpen ||
        isOptimizeConfirmOpen ||
        isRenumberConfirmOpen ||
        isNewSongConfirmOpen ||
        isResetConfirmOpen ||
        isInstrumentDeleteOpen ||
        isInstrumentTypeWarningOpen;

      if (!hasInfoModal && !hasConfirmModal) {
        return;
      }

      const key = event.key;
      if (key !== 'Escape' && key !== 'Esc' && key !== 'Enter') {
        return;
      }

      event.preventDefault();
      if (typeof event.stopImmediatePropagation === 'function') {
        event.stopImmediatePropagation();
      }

      if (key === 'Escape' || key === 'Esc') {
        if (isMidiModalOpen) {
          handleCloseMidi();
          return;
        }
        if (isInstrumentDeleteOpen) {
          handleCancelInstrumentDelete();
          return;
        }
        if (isTransposeOpen) {
          handleCancelTranspose();
          return;
        }
        if (isOptimizeConfirmOpen) {
          handleCancelOptimize();
          return;
        }
        if (isRenumberConfirmOpen) {
          handleCancelRenumber();
          return;
        }
        if (isNewSongConfirmOpen) {
          handleCancelNewSong();
          return;
        }
        if (isInstrumentTypeWarningOpen) {
          handleCancelInstrumentTypeWarning();
          return;
        }
        if (isResetConfirmOpen) {
          handleCancelReset();
          return;
        }

        if (songError) {
          setSongError('');
          return;
        }
        if (instrumentError) {
          setInstrumentError('');
          return;
        }
        if (transposeSummary) {
          handleCloseTransposeSummary();
          return;
        }
        if (trackClipboardError) {
          setTrackClipboardError('');
          return;
        }
        if (optimizeSummary) {
          handleCloseOptimizeSummary();
          return;
        }
        if (soundExportSummary) {
          handleCloseSoundExportSummary();
          return;
        }
        if (dumpExportSummary) {
          handleCloseDumpExportSummary();
          return;
        }
        if (renumberSummary) {
          handleCloseRenumberSummary();
          return;
        }
        if (instrumentOperationSummary) {
          handleCloseInstrumentOperationSummary();
          return;
        }
        if (midiLoadError) {
          setMidiLoadError('');
          return;
        }
        if (midiCopySummary) {
          setMidiCopySummary('');
          return;
        }
        if (isAboutOpen) {
          setIsAboutOpen(false);
          return;
        }
        if (isChangelogOpen) {
          handleCloseChangelog();
          return;
        }
        if (isDownloadOpen) {
          setIsDownloadOpen(false);
          return;
        }
        if (isQuitConfirmOpen) {
          handleCancelQuit();
          return;
        }

        return;
      }

      if (key === 'Enter') {
        if (songError) {
          setSongError('');
          return;
        }
        if (instrumentError) {
          setInstrumentError('');
          return;
        }
        if (transposeSummary) {
          handleCloseTransposeSummary();
          return;
        }
        if (trackClipboardError) {
          setTrackClipboardError('');
          return;
        }
        if (optimizeSummary) {
          handleCloseOptimizeSummary();
          return;
        }
        if (soundExportSummary) {
          handleCloseSoundExportSummary();
          return;
        }
        if (dumpExportSummary) {
          handleCloseDumpExportSummary();
          return;
        }
        if (renumberSummary) {
          handleCloseRenumberSummary();
          return;
        }
        if (midiLoadError) {
          setMidiLoadError('');
          return;
        }
        if (midiCopySummary) {
          setMidiCopySummary('');
          return;
        }
        if (isDebugInfoOpen) {
          setIsDebugInfoOpen(false);
          return;
        }
        if (isAboutOpen) {
          setIsAboutOpen(false);
          return;
        }
        if (isChangelogOpen) {
          handleCloseChangelog();
          return;
        }

        if (isTransposeOpen) {
          handleConfirmTranspose();
          return;
        }
        if (isOptimizeConfirmOpen) {
          handleConfirmOptimize();
          return;
        }
        if (isRenumberConfirmOpen) {
          handleConfirmRenumber();
          return;
        }
        if (isNewSongConfirmOpen) {
          handleConfirmNewSong();
          return;
        }
        if (isInstrumentTypeWarningOpen) {
          handleConfirmInstrumentTypeWarning();
          return;
        }
        if (isResetConfirmOpen) {
          handleConfirmReset();
          return;
        }
        if (isQuitConfirmOpen) {
          handleConfirmQuit();
          return;
        }
      }
    };

    window.addEventListener('keydown', handleModalKeyDown, true);
    return () => {
      window.removeEventListener('keydown', handleModalKeyDown, true);
    };
  }, [
    songError,
    setSongError,
    instrumentError,
    setInstrumentError,
    transposeSummary,
    handleCloseTransposeSummary,
    trackClipboardError,
    setTrackClipboardError,
    optimizeSummary,
    handleCloseOptimizeSummary,
    soundExportSummary,
    handleCloseSoundExportSummary,
    dumpExportSummary,
    handleCloseDumpExportSummary,
    renumberSummary,
    handleCloseRenumberSummary,
    instrumentOperationSummary,
    handleCloseInstrumentOperationSummary,
    midiLoadError,
    setMidiLoadError,
    midiCopySummary,
    setMidiCopySummary,
    isAboutOpen,
    setIsAboutOpen,
    isChangelogOpen,
    handleCloseChangelog,
    isDownloadOpen,
    setIsDownloadOpen,
    isDebugInfoOpen,
    setIsDebugInfoOpen,
    isMidiModalOpen,
    handleCloseMidi,
    isTransposeOpen,
    handleCancelTranspose,
    handleConfirmTranspose,
    isOptimizeConfirmOpen,
    handleCancelOptimize,
    handleConfirmOptimize,
    isRenumberConfirmOpen,
    handleCancelRenumber,
    handleConfirmRenumber,
    isNewSongConfirmOpen,
    handleCancelNewSong,
    handleConfirmNewSong,
    isResetConfirmOpen,
    handleCancelReset,
    handleConfirmReset,
    isQuitConfirmOpen,
    handleCancelQuit,
    handleConfirmQuit,
    isInstrumentDeleteOpen,
    handleCancelInstrumentDelete,
    isInstrumentTypeWarningOpen,
    handleCancelInstrumentTypeWarning,
    handleConfirmInstrumentTypeWarning,
  ]);
}

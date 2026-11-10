import type { UseModalStateResult } from '../modal/useModalState.ts';
import type { PendingSongImport } from '../song/useDataManagement.ts';

export interface UseNavigationSuspensionParams {
  modalState: UseModalStateResult;
  songError: string;
  instrumentError: string;
  soundExportSummary: string;
  dumpExportSummary: string;
  isInstrumentTypeWarningOpen: boolean;
  isPasteTrackModalOpen: boolean;
  pendingSongImport: PendingSongImport | null;
}

/**
 * Computes whether any open modal, error, or summary state suspends keyboard
 * navigation - the aggregate flag consumed by `useKeyboardNavigation`.
 */
export function useNavigationSuspension({
  modalState,
  songError,
  instrumentError,
  soundExportSummary,
  dumpExportSummary,
  isInstrumentTypeWarningOpen,
  isPasteTrackModalOpen,
  pendingSongImport,
}: UseNavigationSuspensionParams): boolean {
  const {
    isNewSongConfirmOpen,
    isAboutOpen,
    isChangelogOpen,
    isManualOpen,
    isOptimizeConfirmOpen,
    isRenumberConfirmOpen,
    isResetConfirmOpen,
    isQuitConfirmOpen,
    optimizeSummary,
    renumberSummary,
    isTransposeOpen,
    transposeSummary,
    instrumentOperationSummary,
    midiLoadError,
    midiCopySummary,
    isDownloadOpen,
    isMidiModalOpen,
    isDebugInfoOpen,
    isInstrumentDeleteOpen,
    isInstrumentMidiOpen,
    isInstrumentColorOpen,
    isExportModalOpen,
  } = modalState;

  return (
    !!songError ||
    !!instrumentError ||
    !!transposeSummary ||
    !!optimizeSummary ||
    !!soundExportSummary ||
    !!dumpExportSummary ||
    !!renumberSummary ||
    !!instrumentOperationSummary ||
    !!midiLoadError ||
    !!midiCopySummary ||
    isAboutOpen ||
    isChangelogOpen ||
    isManualOpen ||
    isDownloadOpen ||
    isDebugInfoOpen ||
    isMidiModalOpen ||
    isTransposeOpen ||
    isOptimizeConfirmOpen ||
    isRenumberConfirmOpen ||
    isNewSongConfirmOpen ||
    isResetConfirmOpen ||
    isQuitConfirmOpen ||
    isInstrumentDeleteOpen ||
    isInstrumentTypeWarningOpen ||
    isInstrumentMidiOpen ||
    isInstrumentColorOpen ||
    isExportModalOpen ||
    isPasteTrackModalOpen ||
    !!pendingSongImport
  );
}

import type { ReactElement } from 'react';
import { ModalManager } from '../../components/modal/ModalManager.tsx';
import type {
  InformationModalGroupParams,
  InformationModalGroupProps,
} from '../../components/modal/InformationModalGroup.tsx';
import type {
  ConfirmationModalGroupParams,
  ConfirmationModalGroupProps,
} from '../../components/modal/ConfirmationModalGroup.tsx';
import type {
  InstrumentModalGroupParams,
  InstrumentModalGroupProps,
} from '../../components/modal/InstrumentModalGroup.tsx';
import type {
  TransposeModalGroupParams,
  TransposeModalGroupProps,
} from '../../components/modal/TransposeModalGroup.tsx';
import type {
  DocumentModalGroupParams,
  DocumentModalGroupProps,
} from '../../components/modal/DocumentModalGroup.tsx';
import type {
  MidiModalGroupParams,
  MidiModalGroupProps,
} from '../../components/modal/MidiModalGroup.tsx';
import type {
  SettingsModalGroupParams,
  SettingsModalGroupProps,
} from '../../components/modal/SettingsModalGroup.tsx';
import type {
  FileModalGroupParams,
  FileModalGroupProps,
} from '../../components/modal/FileModalGroup.tsx';
import type {
  ExportModalGroupParams,
  ExportModalGroupProps,
} from '../../components/modal/ExportModalGroup.tsx';
import type {
  PasteTrackModalGroupParams,
  PasteTrackModalGroupProps,
} from '../../components/modal/PasteTrackModalGroup.tsx';
import { useModalManager } from './useModalManager.ts';
import type { UseModalStateResult } from './useModalState.ts';

export interface UseAppModalsParams {
  modalState: UseModalStateResult;
  information: InformationModalGroupParams;
  confirms: ConfirmationModalGroupParams;
  instruments: InstrumentModalGroupParams;
  transpose: TransposeModalGroupParams;
  documents: DocumentModalGroupParams;
  midi: MidiModalGroupParams;
  settings: SettingsModalGroupParams;
  file: FileModalGroupParams;
  exportDialog: ExportModalGroupParams;
  pasteTrack: PasteTrackModalGroupParams;
}

/**
 * Assembles the modal layer: registers the global modal keyboard handling
 * through `useModalManager` and returns the rendered `ModalManager` element
 * for the `AppLayout` `modals` slot.
 */
export function useAppModals({
  modalState,
  information,
  confirms,
  instruments,
  transpose,
  documents,
  midi,
  settings,
  file,
  exportDialog,
  pasteTrack,
}: UseAppModalsParams): ReactElement {
  const {
    isNewSongConfirmOpen,
    isAboutOpen,
    setIsAboutOpen,
    isChangelogOpen,
    changelogContent,
    isManualOpen,
    manualContent,
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
    setMidiLoadError,
    midiCopySummary,
    setMidiCopySummary,
    isDownloadOpen,
    setIsDownloadOpen,
    isMidiModalOpen,
    isDebugInfoOpen,
    setIsDebugInfoOpen,
    isInstrumentDeleteOpen,
    instrumentDeleteUsage,
    isInstrumentMidiOpen,
    isInstrumentColorOpen,
    isExportModalOpen,
    isSettingsOpen,
  } = modalState;

  useModalManager({
    songError: information.songError,
    setSongError: information.setSongError,
    instrumentError: information.instrumentError,
    setInstrumentError: information.setInstrumentError,
    transposeSummary,
    handleCloseTransposeSummary: information.onCloseTransposeSummary,
    trackClipboardError: information.trackClipboardError,
    setTrackClipboardError: information.setTrackClipboardError,
    optimizeSummary,
    handleCloseOptimizeSummary: information.onCloseOptimizeSummary,
    soundExportSummary: information.soundExportSummary,
    handleCloseSoundExportSummary: information.onCloseSoundExportSummary,
    dumpExportSummary: information.dumpExportSummary,
    handleCloseDumpExportSummary: information.onCloseDumpExportSummary,
    renumberSummary,
    handleCloseRenumberSummary: information.onCloseRenumberSummary,
    instrumentOperationSummary,
    handleCloseInstrumentOperationSummary: information.onCloseInstrumentOperationSummary,
    midiLoadError,
    setMidiLoadError,
    midiCopySummary,
    setMidiCopySummary,
    isAboutOpen,
    setIsAboutOpen,
    isChangelogOpen,
    handleCloseChangelog: documents.onCloseChangelog,
    isManualOpen,
    handleCloseManual: documents.onCloseManual,
    isDownloadOpen,
    setIsDownloadOpen,
    isDebugInfoOpen,
    setIsDebugInfoOpen,
    isMidiModalOpen,
    handleCloseMidi: midi.onCloseMidi,
    isTransposeOpen,
    handleCancelTranspose: transpose.onCancelTranspose,
    handleConfirmTranspose: transpose.onConfirmTranspose,
    isOptimizeConfirmOpen,
    handleCancelOptimize: confirms.onCancelOptimize,
    handleConfirmOptimize: confirms.onConfirmOptimize,
    isRenumberConfirmOpen,
    handleCancelRenumber: confirms.onCancelRenumber,
    handleConfirmRenumber: confirms.onConfirmRenumber,
    isNewSongConfirmOpen,
    handleCancelNewSong: confirms.onCancelNewSong,
    handleConfirmNewSong: confirms.onConfirmNewSong,
    isResetConfirmOpen,
    handleCancelReset: confirms.onCancelReset,
    handleConfirmReset: confirms.onConfirmReset,
    isQuitConfirmOpen,
    handleCancelQuit: confirms.onCancelQuit,
    handleConfirmQuit: confirms.onConfirmQuit,
    isInstrumentDeleteOpen,
    handleCancelInstrumentDelete: instruments.onCancelInstrumentDelete,
    isInstrumentTypeWarningOpen: confirms.isInstrumentTypeWarningOpen,
    handleCancelInstrumentTypeWarning: confirms.onCancelInstrumentTypeWarning,
    handleConfirmInstrumentTypeWarning: confirms.onConfirmInstrumentTypeWarning,
    isExportOpen: isExportModalOpen,
    handleCancelExport: exportDialog.onCancelExport,
    handleConfirmExport: exportDialog.onConfirmExport,
    isSettingsOpen,
    handleCancelSettings: settings.onCancelSettings,
    handleConfirmSettings: settings.onCommitSettings,
    isPasteTrackOptionsOpen: pasteTrack.isPasteTrackModalOpen,
    handleCancelPasteTrackOptions: pasteTrack.onCancelPasteTrackModal,
    handleConfirmPasteTrackOptions: pasteTrack.onConfirmPasteTrackModal,
  });

  const informationProps: InformationModalGroupProps = {
    ...information,
    optimizeSummary,
    renumberSummary,
    transposeSummary,
    instrumentOperationSummary,
    isDebugInfoOpen,
    setIsDebugInfoOpen,
    midiLoadError,
    setMidiLoadError,
    midiCopySummary,
    setMidiCopySummary,
  };

  const confirmsProps: ConfirmationModalGroupProps = {
    ...confirms,
    isNewSongConfirmOpen,
    isOptimizeConfirmOpen,
    isRenumberConfirmOpen,
    isResetConfirmOpen,
    isQuitConfirmOpen,
  };

  const instrumentsProps: InstrumentModalGroupProps = {
    ...instruments,
    isInstrumentDeleteOpen,
    instrumentDeleteUsage,
    isInstrumentMidiOpen,
    isInstrumentColorOpen,
  };

  const transposeProps: TransposeModalGroupProps = { ...transpose, isTransposeOpen };

  const documentsProps: DocumentModalGroupProps = {
    ...documents,
    isAboutOpen,
    setIsAboutOpen,
    isChangelogOpen,
    changelogContent,
    isManualOpen,
    manualContent,
  };

  const midiProps: MidiModalGroupProps = {
    ...midi,
    isMidiModalOpen,
    setMidiCopySummary,
    setMidiLoadError,
  };

  const settingsProps: SettingsModalGroupProps = { ...settings, isSettingsOpen };

  const fileProps: FileModalGroupProps = { ...file, isDownloadOpen, setIsDownloadOpen };

  const exportDialogProps: ExportModalGroupProps = { ...exportDialog, isExportModalOpen };

  const pasteTrackProps: PasteTrackModalGroupProps = pasteTrack;

  return (
    <ModalManager
      information={informationProps}
      confirms={confirmsProps}
      instruments={instrumentsProps}
      transpose={transposeProps}
      documents={documentsProps}
      midi={midiProps}
      settings={settingsProps}
      file={fileProps}
      exportDialog={exportDialogProps}
      pasteTrack={pasteTrackProps}
    />
  );
}

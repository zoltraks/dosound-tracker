import React from 'react';
import { ModalContainer, type ModalContainerProps } from './ModalContainer.tsx';
import { FilePickerModal } from '../../modals/file/FilePickerModal.tsx';
import { ExportModal } from '../../modals/export/ExportModal.tsx';
import { PasteTrackModal } from '../../modals/track/PasteTrackModal.tsx';
import type { ExportType, ExportStrategy, ExportFormat } from '../../constants/export.ts';
import type { TrackPasteMode } from '../../hooks/song/useTrackOperations.ts';

interface ModalManagerProps extends ModalContainerProps {
  isRepositoryInstrumentOpen: boolean;
  setIsRepositoryInstrumentOpen: (open: boolean) => void;
  onPickRepositoryInstrument: (fileUrl: string) => void;
  isDemoSongPickerOpen: boolean;
  setIsDemoSongPickerOpen: (open: boolean) => void;
  onPickDemoSong: (fileUrl: string) => void;

  isExportModalOpen: boolean;
  pendingExportType: ExportType;
  pendingExportStrategy: ExportStrategy;
  onChangeExportType: (type: ExportType) => void;
  onChangeExportStrategy: (strategy: ExportStrategy) => void;
  onExportFormat: (format: ExportFormat) => void;
  onConfirmExport: () => void;
  onCancelExport: () => void;

  isPasteTrackModalOpen: boolean;
  pasteTrackPendingMode: TrackPasteMode;
  setPasteTrackPendingMode: (mode: TrackPasteMode) => void;
  onConfirmPasteTrackModal: () => void;
  onCancelPasteTrackModal: () => void;
}

export const ModalManager: React.FC<ModalManagerProps> = (props) => {
  const {
    isRepositoryInstrumentOpen,
    setIsRepositoryInstrumentOpen,
    onPickRepositoryInstrument,
    isDemoSongPickerOpen,
    setIsDemoSongPickerOpen,
    onPickDemoSong,
    isExportModalOpen,
    pendingExportType,
    pendingExportStrategy,
    onChangeExportType,
    onChangeExportStrategy,
    onExportFormat,
    onConfirmExport,
    onCancelExport,
    isPasteTrackModalOpen,
    pasteTrackPendingMode,
    setPasteTrackPendingMode,
    onConfirmPasteTrackModal,
    onCancelPasteTrackModal,
    ...containerProps
  } = props;

  return (
    <>
      <ModalContainer {...containerProps} />
      <FilePickerModal
        isOpen={isRepositoryInstrumentOpen}
        title="Pick Instrument"
        directory="repository/instrument"
        mode="pick"
        defaultSortDescending={false}
        onClose={() => setIsRepositoryInstrumentOpen(false)}
        onPick={onPickRepositoryInstrument}
      />
      <FilePickerModal
        isOpen={isDemoSongPickerOpen}
        title="Demo Songs"
        directory="repository/song"
        mode="pick"
        defaultSortDescending={false}
        onClose={() => setIsDemoSongPickerOpen(false)}
        onPick={onPickDemoSong}
      />
      <ExportModal
        isOpen={isExportModalOpen}
        exportType={pendingExportType}
        exportStrategy={pendingExportStrategy}
        onChangeType={onChangeExportType}
        onChangeStrategy={onChangeExportStrategy}
        onExportFormat={onExportFormat}
        onConfirm={onConfirmExport}
        onCancel={onCancelExport}
      />
      <PasteTrackModal
        isOpen={isPasteTrackModalOpen}
        mode={pasteTrackPendingMode}
        onModeChange={setPasteTrackPendingMode}
        onConfirm={onConfirmPasteTrackModal}
        onCancel={onCancelPasteTrackModal}
      />
    </>
  );
};

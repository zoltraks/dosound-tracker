import React from 'react';
import { ModalContainer, type ModalContainerProps } from './ModalContainer.tsx';
import { FilePickerModal } from '../../modals/file/FilePickerModal.tsx';
import type { ExportType, ExportStrategy, ExportFormat } from '../../constants/export.ts';
import type { TrackPasteMode } from '../../hooks/song/useTrackOperations.ts';

// Export modals load on demand: they are opened by explicit user action,
// so keeping them out of the entry chunk protects the bundle budget.
// FilePickerModal stays static - DownloadModal already imports it eagerly.
const ExportModal = React.lazy(async () => {
  const { ExportModal } = await import('../../modals/export/ExportModal.tsx');
  return { default: ExportModal };
});
const PasteTrackModal = React.lazy(async () => {
  const { PasteTrackModal } = await import('../../modals/track/PasteTrackModal.tsx');
  return { default: PasteTrackModal };
});

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
  pendingChipStream: 1 | 2;
  onChangeExportType: (type: ExportType) => void;
  onChangeExportStrategy: (strategy: ExportStrategy) => void;
  onChangeChipStream: (chip: 1 | 2) => void;
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
    pendingChipStream,
    onChangeExportType,
    onChangeExportStrategy,
    onChangeChipStream,
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
      {isExportModalOpen && (
        <React.Suspense fallback={null}>
          <ExportModal
            isOpen={isExportModalOpen}
            exportType={pendingExportType}
            exportStrategy={pendingExportStrategy}
            chipStream={pendingChipStream}
            onChangeType={onChangeExportType}
            onChangeStrategy={onChangeExportStrategy}
            onChangeChipStream={onChangeChipStream}
            onExportFormat={onExportFormat}
            onConfirm={onConfirmExport}
            onCancel={onCancelExport}
          />
        </React.Suspense>
      )}
      {isPasteTrackModalOpen && (
        <React.Suspense fallback={null}>
          <PasteTrackModal
            isOpen={isPasteTrackModalOpen}
            mode={pasteTrackPendingMode}
            onModeChange={setPasteTrackPendingMode}
            onConfirm={onConfirmPasteTrackModal}
            onCancel={onCancelPasteTrackModal}
          />
        </React.Suspense>
      )}
    </>
  );
};

import { InformationModal } from '../../modals/information/InformationModal.tsx';
import { buildInfoModals } from '../../utils/panel/modalRendering.ts';

export interface InformationModalGroupParams {
  songError: string;
  setSongError: (value: string) => void;
  instrumentError: string;
  setInstrumentError: (value: string) => void;
  trackClipboardError: string;
  setTrackClipboardError: (value: string) => void;
  onCloseOptimizeSummary: () => void;
  onCloseSoundExportSummary: () => void;
  onCloseDumpExportSummary: () => void;
  onCloseTransposeSummary: () => void;
  onCloseRenumberSummary: () => void;
  onCloseInstrumentOperationSummary: () => void;
  soundExportSummary: string;
  dumpExportSummary: string;
}

export interface InformationModalGroupProps extends InformationModalGroupParams {
  optimizeSummary: string;
  renumberSummary: string;
  transposeSummary: string;
  instrumentOperationSummary: string;
  isDebugInfoOpen: boolean;
  setIsDebugInfoOpen: (value: boolean) => void;
  midiLoadError: string;
  setMidiLoadError: (value: string) => void;
  midiCopySummary: string;
  setMidiCopySummary: (value: string) => void;
}

export function InformationModalGroup(props: InformationModalGroupProps) {
  const infoModals = buildInfoModals(props);

  return (
    <>
      {infoModals.map((modal) => (
        <InformationModal
          key={modal.key}
          isOpen={modal.isOpen}
          title={modal.title}
          message={modal.message}
          onClose={modal.onClose}
          className={modal.className}
        />
      ))}
    </>
  );
}

import { DEBUG_MODE_INFO_MESSAGE, INFO_MODAL_TITLES } from '../constants/modal';

export type InfoModalDescriptor = {
  key: string;
  isOpen: boolean;
  title: string;
  message: string;
  onClose: () => void;
};

export type BuildInfoModalsArgs = {
  songError: string;
  setSongError: (value: string) => void;
  instrumentError: string;
  setInstrumentError: (value: string) => void;
  trackClipboardError: string;
  setTrackClipboardError: (value: string) => void;
  optimizeSummary: string;
  onCloseOptimizeSummary: () => void;
  soundExportSummary: string;
  onCloseSoundExportSummary: () => void;
  dumpExportSummary: string;
  onCloseDumpExportSummary: () => void;
  transposeSummary: string;
  onCloseTransposeSummary: () => void;
  renumberSummary: string;
  onCloseRenumberSummary: () => void;
  instrumentOperationSummary: string;
  onCloseInstrumentOperationSummary: () => void;
  isDebugInfoOpen: boolean;
  setIsDebugInfoOpen: (value: boolean) => void;
  midiLoadError: string;
  setMidiLoadError: (value: string) => void;
  midiCopySummary: string;
  setMidiCopySummary: (value: string) => void;
};

const FILE_FORMAT_HINT = 'Please check the file format.';

export function buildInfoModals(args: BuildInfoModalsArgs): InfoModalDescriptor[] {
  const decorateFileError = (message: string) =>
    message ? `${message}\n\n${FILE_FORMAT_HINT}` : message;

  return [
    {
      key: 'songError',
      isOpen: !!args.songError,
      title: INFO_MODAL_TITLES.songError,
      message: decorateFileError(args.songError),
      onClose: () => args.setSongError(''),
    },
    {
      key: 'instrumentError',
      isOpen: !!args.instrumentError,
      title: INFO_MODAL_TITLES.instrumentError,
      message: decorateFileError(args.instrumentError),
      onClose: () => args.setInstrumentError(''),
    },
    {
      key: 'trackClipboardError',
      isOpen: !!args.trackClipboardError,
      title: INFO_MODAL_TITLES.trackClipboardError,
      message: args.trackClipboardError,
      onClose: () => args.setTrackClipboardError(''),
    },
    {
      key: 'optimizeSummary',
      isOpen: !!args.optimizeSummary,
      title: INFO_MODAL_TITLES.optimizeSummary,
      message: args.optimizeSummary,
      onClose: args.onCloseOptimizeSummary,
    },
    {
      key: 'soundExportSummary',
      isOpen: !!args.soundExportSummary,
      title: INFO_MODAL_TITLES.soundExportSummary,
      message: args.soundExportSummary,
      onClose: args.onCloseSoundExportSummary,
    },
    {
      key: 'dumpExportSummary',
      isOpen: !!args.dumpExportSummary,
      title: INFO_MODAL_TITLES.dumpExportSummary,
      message: args.dumpExportSummary,
      onClose: args.onCloseDumpExportSummary,
    },
    {
      key: 'transposeSummary',
      isOpen: !!args.transposeSummary,
      title: INFO_MODAL_TITLES.transposeSummary,
      message: args.transposeSummary,
      onClose: args.onCloseTransposeSummary,
    },
    {
      key: 'renumberSummary',
      isOpen: !!args.renumberSummary,
      title: INFO_MODAL_TITLES.renumberSummary,
      message: args.renumberSummary,
      onClose: args.onCloseRenumberSummary,
    },
    {
      key: 'instrumentOperationSummary',
      isOpen: !!args.instrumentOperationSummary,
      title: INFO_MODAL_TITLES.instrumentOperationSummary,
      message: args.instrumentOperationSummary,
      onClose: args.onCloseInstrumentOperationSummary,
    },
    {
      key: 'debugInfo',
      isOpen: args.isDebugInfoOpen,
      title: 'Debug mode enabled',
      message: DEBUG_MODE_INFO_MESSAGE,
      onClose: () => args.setIsDebugInfoOpen(false),
    },
    {
      key: 'midiLoadError',
      isOpen: !!args.midiLoadError,
      title: INFO_MODAL_TITLES.midiLoadError,
      message: args.midiLoadError,
      onClose: () => args.setMidiLoadError(''),
    },
    {
      key: 'midiCopySummary',
      isOpen: !!args.midiCopySummary,
      title: INFO_MODAL_TITLES.midiCopySummary,
      message: args.midiCopySummary,
      onClose: () => args.setMidiCopySummary(''),
    },
  ];
}

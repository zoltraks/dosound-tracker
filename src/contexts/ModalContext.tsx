import React, { createContext, useContext, useState, useCallback } from 'react';
import type { ReactNode } from 'react';
import type { MidiConfig, MidiDeviceInfo, MidiMonitorEntry } from '../hooks/useMidi';
import type { Instrument } from '../synth/SoundDriver';

type InstrumentDeleteUsage = {
  instrumentId: string;
  instrumentName: string;
  usageCount: number;
  patternCount: number;
};

type TransposeScope = 'line' | 'song';
type TransposeTrackScope = 'current' | 'all';
type TransposeInstrumentScope = 'all' | 'selected';

export interface ModalContextType {
  // Error modals
  songError: string;
  setSongError: (value: string) => void;
  instrumentError: string;
  setInstrumentError: (value: string) => void;
  trackClipboardError: string;
  setTrackClipboardError: (value: string) => void;

  // Summary modals
  optimizeSummary: string;
  setOptimizeSummary: (value: string) => void;
  soundExportSummary: string;
  setSoundExportSummary: (value: string) => void;
  dumpExportSummary: string;
  setDumpExportSummary: (value: string) => void;
  transposeSummary: string;
  setTransposeSummary: (value: string) => void;
  renumberSummary: string;
  setRenumberSummary: (value: string) => void;
  instrumentOperationSummary: string;
  setInstrumentOperationSummary: (value: string) => void;

  // Debug info modal
  isDebugInfoOpen: boolean;
  setIsDebugInfoOpen: (value: boolean) => void;

  // Instrument type warning modal
  isInstrumentTypeWarningOpen: boolean;
  pendingInstrumentTypeInfo: {
    hasTypeField: boolean;
    detectedType: string | null;
  } | null;
  instrumentTypeWarningIgnoreChecked: boolean;
  setInstrumentTypeWarningIgnoreChecked: (value: boolean) => void;
  showInstrumentTypeWarning: (info: { hasTypeField: boolean; detectedType: string | null }) => void;
  hideInstrumentTypeWarning: () => void;
  onConfirmInstrumentTypeWarning: () => void;
  onCancelInstrumentTypeWarning: () => void;

  // Confirmation modals
  isNewSongConfirmOpen: boolean;
  showNewSongConfirm: () => void;
  hideNewSongConfirm: () => void;
  onConfirmNewSong: () => void;
  onCancelNewSong: () => void;

  isOptimizeConfirmOpen: boolean;
  showOptimizeConfirm: () => void;
  hideOptimizeConfirm: () => void;
  onConfirmOptimize: () => void;
  onCancelOptimize: () => void;

  isRenumberConfirmOpen: boolean;
  showRenumberConfirm: () => void;
  hideRenumberConfirm: () => void;
  onConfirmRenumber: () => void;
  onCancelRenumber: () => void;

  isResetConfirmOpen: boolean;
  showResetConfirm: () => void;
  hideResetConfirm: () => void;
  onConfirmReset: () => void;
  onCancelReset: () => void;

  isQuitConfirmOpen: boolean;
  showQuitConfirm: () => void;
  hideQuitConfirm: () => void;
  onConfirmQuit: () => void;
  onCancelQuit: () => void;

  // Instrument delete modal
  isInstrumentDeleteOpen: boolean;
  instrumentDeleteUsage: InstrumentDeleteUsage | null;
  showInstrumentDelete: (usage: InstrumentDeleteUsage) => void;
  hideInstrumentDelete: () => void;
  onConfirmDeleteInstrumentAndNotes: () => void;
  onConfirmDeleteInstrumentOnly: () => void;
  onCancelInstrumentDelete: () => void;

  // Instrument MIDI modal
  isInstrumentMidiOpen: boolean;
  instrumentMidiTarget: Instrument | null;
  showInstrumentMidi: (instrument: Instrument) => void;
  hideInstrumentMidi: () => void;
  onSaveInstrumentMidi: (midi: { channel: number | null; program: number | null }) => void;
  onCloseInstrumentMidi: () => void;

  // Instrument color modal
  isInstrumentColorOpen: boolean;
  instrumentColorTarget: Instrument | null;
  showInstrumentColor: (instrument: Instrument) => void;
  hideInstrumentColor: () => void;
  onSaveInstrumentColor: (color: string | null) => void;
  onClearInstrumentColor: () => void;
  onCloseInstrumentColor: () => void;

  // Transpose modal
  isTransposeOpen: boolean;
  transposeScope: TransposeScope;
  transposeTrackScope: TransposeTrackScope;
  transposeInstrumentScope: TransposeInstrumentScope;
  transposeAmount: number;
  transposeAmountInput: string;
  showTranspose: () => void;
  hideTranspose: () => void;
  setTransposeScope: (scope: TransposeScope) => void;
  setTransposeTrackScope: (scope: TransposeTrackScope) => void;
  setTransposeInstrumentScope: (scope: TransposeInstrumentScope) => void;
  onTransposeAmountChange: (value: string) => void;
  onConfirmTranspose: () => void;
  onCancelTranspose: () => void;
  setTransposeAmount: (value: number) => void;
  setTransposeAmountInput: (value: string) => void;

  // About modal
  isAboutOpen: boolean;
  aboutVersion: string;
  aboutRuntimeLabel?: string | null;
  aboutRuntimeDetails?: string[];
  showAbout: (version: string, runtimeLabel?: string | null, runtimeDetails?: string[]) => void;
  hideAbout: () => void;

  // Changelog modal
  isChangelogOpen: boolean;
  changelogContent: string;
  showChangelog: (content: string) => void;
  hideChangelog: () => void;
  onShowChangelog: () => void;
  onCloseChangelog: () => void;

  // Manual modal
  isManualOpen: boolean;
  manualContent: string;
  showManual: (content: string) => void;
  hideManual: () => void;
  onShowManual: () => void;
  onCloseManual: () => void;

  // MIDI modal
  isMidiModalOpen: boolean;
  isMidiSupported: boolean;
  midiAccessError: string | null;
  midiConfig: MidiConfig;
  midiDevices: {
    inputs: MidiDeviceInfo[];
    outputs: MidiDeviceInfo[];
  };
  midiInMonitor: MidiMonitorEntry[];
  midiOutMonitor: MidiMonitorEntry[];
  showMidi: (config: MidiConfig, devices: { inputs: MidiDeviceInfo[]; outputs: MidiDeviceInfo[] }, 
    inMonitor: MidiMonitorEntry[], outMonitor: MidiMonitorEntry[], 
    supported: boolean, accessError: string | null) => void;
  hideMidi: () => void;
  onSaveMidiConfig: (config: MidiConfig) => void;
  onCloseMidi: () => void;
  onClearMidiMonitors: () => void;
  onRescanMidiDevices: () => void;
  onLiveMidiConfigChange: (patch: Partial<MidiConfig>) => void;
  setMidiCopySummary: (value: string) => void;
  setMidiLoadError: (value: string) => void;

  // Download modal
  isDownloadOpen: boolean;
  showDownload: () => void;
  hideDownload: () => void;
  midiLoadError: string;
  midiCopySummary: string;
  onMidiSystemReset: () => void;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export const useModalContext = () => {
  const context = useContext(ModalContext);
  if (context === undefined) {
    throw new Error('useModalContext must be used within a ModalProvider');
  }
  return context;
};

interface ModalProviderProps {
  children: ReactNode;
}

export const ModalProvider: React.FC<ModalProviderProps> = ({ children }) => {
  // Error states
  const [songError, setSongError] = useState('');
  const [instrumentError, setInstrumentError] = useState('');
  const [trackClipboardError, setTrackClipboardError] = useState('');

  // Summary states
  const [optimizeSummary, setOptimizeSummary] = useState('');
  const [soundExportSummary, setSoundExportSummary] = useState('');
  const [dumpExportSummary, setDumpExportSummary] = useState('');
  const [transposeSummary, setTransposeSummary] = useState('');
  const [renumberSummary, setRenumberSummary] = useState('');
  const [instrumentOperationSummary, setInstrumentOperationSummary] = useState('');

  // Debug info
  const [isDebugInfoOpen, setIsDebugInfoOpen] = useState(false);

  // Instrument type warning
  const [isInstrumentTypeWarningOpen, setIsInstrumentTypeWarningOpen] = useState(false);
  const [pendingInstrumentTypeInfo, setPendingInstrumentTypeInfo] = useState<{ hasTypeField: boolean; detectedType: string | null } | null>(null);
  const [instrumentTypeWarningIgnoreChecked, setInstrumentTypeWarningIgnoreChecked] = useState(false);

  // Confirmation modals
  const [isNewSongConfirmOpen, setIsNewSongConfirmOpen] = useState(false);
  const [isOptimizeConfirmOpen, setIsOptimizeConfirmOpen] = useState(false);
  const [isRenumberConfirmOpen, setIsRenumberConfirmOpen] = useState(false);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [isQuitConfirmOpen, setIsQuitConfirmOpen] = useState(false);

  // Instrument delete
  const [isInstrumentDeleteOpen, setIsInstrumentDeleteOpen] = useState(false);
  const [instrumentDeleteUsage, setInstrumentDeleteUsage] = useState<InstrumentDeleteUsage | null>(null);

  // Instrument MIDI
  const [isInstrumentMidiOpen, setIsInstrumentMidiOpen] = useState(false);
  const [instrumentMidiTarget, setInstrumentMidiTarget] = useState<Instrument | null>(null);

  // Instrument color
  const [isInstrumentColorOpen, setIsInstrumentColorOpen] = useState(false);
  const [instrumentColorTarget, setInstrumentColorTarget] = useState<Instrument | null>(null);

  // Transpose
  const [isTransposeOpen, setIsTransposeOpen] = useState(false);
  const [transposeScope, setTransposeScope] = useState<TransposeScope>('song');
  const [transposeTrackScope, setTransposeTrackScope] = useState<TransposeTrackScope>('all');
  const [transposeInstrumentScope, setTransposeInstrumentScope] = useState<TransposeInstrumentScope>('all');
  const [transposeAmount, setTransposeAmount] = useState(0);
  const [transposeAmountInput, setTransposeAmountInput] = useState('0');

  // About
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [aboutVersion, setAboutVersion] = useState('');
  const [aboutRuntimeLabel, setAboutRuntimeLabel] = useState<string | null>(null);
  const [aboutRuntimeDetails, setAboutRuntimeDetails] = useState<string[] | undefined>(undefined);

  // Changelog
  const [isChangelogOpen, setIsChangelogOpen] = useState(false);
  const [changelogContent, setChangelogContent] = useState('');

  // Manual
  const [isManualOpen, setIsManualOpen] = useState(false);
  const [manualContent, setManualContent] = useState('');

  // MIDI
  const [isMidiModalOpen, setIsMidiModalOpen] = useState(false);
  const [isMidiSupported, setIsMidiSupported] = useState(false);
  const [midiAccessError, setMidiAccessError] = useState<string | null>(null);
  const [midiConfig, setMidiConfig] = useState<MidiConfig>({ 
    inputEnabled: false, 
    outputEnabled: false, 
    inputId: null, 
    outputId: null, 
    ignoreInputVolume: false, 
    ignoreOutputVolume: false 
  });
  const [midiDevices, setMidiDevices] = useState({ inputs: [] as MidiDeviceInfo[], outputs: [] as MidiDeviceInfo[] });
  const [midiInMonitor, setMidiInMonitor] = useState<MidiMonitorEntry[]>([]);
  const [midiOutMonitor, setMidiOutMonitor] = useState<MidiMonitorEntry[]>([]);

  // Download
  const [isDownloadOpen, setIsDownloadOpen] = useState(false);

  // Modal show/hide functions
  const showInstrumentTypeWarning = useCallback((info: { hasTypeField: boolean; detectedType: string | null }) => {
    setPendingInstrumentTypeInfo(info);
    setIsInstrumentTypeWarningOpen(true);
  }, []);

  const hideInstrumentTypeWarning = useCallback(() => {
    setIsInstrumentTypeWarningOpen(false);
    setPendingInstrumentTypeInfo(null);
  }, []);

  const showNewSongConfirm = useCallback(() => setIsNewSongConfirmOpen(true), []);
  const hideNewSongConfirm = useCallback(() => setIsNewSongConfirmOpen(false), []);

  const showOptimizeConfirm = useCallback(() => setIsOptimizeConfirmOpen(true), []);
  const hideOptimizeConfirm = useCallback(() => setIsOptimizeConfirmOpen(false), []);

  const showRenumberConfirm = useCallback(() => setIsRenumberConfirmOpen(true), []);
  const hideRenumberConfirm = useCallback(() => setIsRenumberConfirmOpen(false), []);

  const showResetConfirm = useCallback(() => setIsResetConfirmOpen(true), []);
  const hideResetConfirm = useCallback(() => setIsResetConfirmOpen(false), []);

  const showQuitConfirm = useCallback(() => setIsQuitConfirmOpen(true), []);
  const hideQuitConfirm = useCallback(() => setIsQuitConfirmOpen(false), []);

  const showInstrumentDelete = useCallback((usage: InstrumentDeleteUsage) => {
    setInstrumentDeleteUsage(usage);
    setIsInstrumentDeleteOpen(true);
  }, []);

  const hideInstrumentDelete = useCallback(() => {
    setIsInstrumentDeleteOpen(false);
    setInstrumentDeleteUsage(null);
  }, []);

  const showInstrumentMidi = useCallback((instrument: Instrument) => {
    setInstrumentMidiTarget(instrument);
    setIsInstrumentMidiOpen(true);
  }, []);

  const hideInstrumentMidi = useCallback(() => {
    setIsInstrumentMidiOpen(false);
    setInstrumentMidiTarget(null);
  }, []);

  const showInstrumentColor = useCallback((instrument: Instrument) => {
    setInstrumentColorTarget(instrument);
    setIsInstrumentColorOpen(true);
  }, []);

  const hideInstrumentColor = useCallback(() => {
    setIsInstrumentColorOpen(false);
    setInstrumentColorTarget(null);
  }, []);

  const showTranspose = useCallback(() => setIsTransposeOpen(true), []);
  const hideTranspose = useCallback(() => setIsTransposeOpen(false), []);

  const showAbout = useCallback((version: string, runtimeLabel?: string | null, runtimeDetails?: string[]) => {
    setAboutVersion(version);
    setAboutRuntimeLabel(runtimeLabel || null);
    setAboutRuntimeDetails(runtimeDetails);
    setIsAboutOpen(true);
  }, []);

  const hideAbout = useCallback(() => {
    setIsAboutOpen(false);
    setAboutVersion('');
    setAboutRuntimeLabel(null);
    setAboutRuntimeDetails(undefined);
  }, []);

  const showChangelog = useCallback((content: string) => {
    setChangelogContent(content);
    setIsChangelogOpen(true);
  }, []);

  const hideChangelog = useCallback(() => {
    setIsChangelogOpen(false);
    setChangelogContent('');
  }, []);

  const showManual = useCallback((content: string) => {
    setManualContent(content);
    setIsManualOpen(true);
  }, []);

  const hideManual = useCallback(() => {
    setIsManualOpen(false);
    setManualContent('');
  }, []);

  const showMidi = useCallback((
    config: MidiConfig, 
    devices: { inputs: MidiDeviceInfo[]; outputs: MidiDeviceInfo[] }, 
    inMonitor: MidiMonitorEntry[], 
    outMonitor: MidiMonitorEntry[], 
    supported: boolean, 
    accessError: string | null
  ) => {
    setMidiConfig(config);
    setMidiDevices(devices);
    setMidiInMonitor(inMonitor);
    setMidiOutMonitor(outMonitor);
    setIsMidiSupported(supported);
    setMidiAccessError(accessError);
    setIsMidiModalOpen(true);
  }, []);

  const hideMidi = useCallback(() => {
    setIsMidiModalOpen(false);
  }, []);

  const showDownload = useCallback(() => setIsDownloadOpen(true), []);
  const hideDownload = useCallback(() => setIsDownloadOpen(false), []);

  // Placeholder functions for actions that need to be provided by the parent
  const onConfirmInstrumentTypeWarning = useCallback(() => {}, []);
  const onCancelInstrumentTypeWarning = useCallback(() => {}, []);
  const onConfirmNewSong = useCallback(() => {}, []);
  const onCancelNewSong = useCallback(() => {}, []);
  const onConfirmOptimize = useCallback(() => {}, []);
  const onCancelOptimize = useCallback(() => {}, []);
  const onConfirmRenumber = useCallback(() => {}, []);
  const onCancelRenumber = useCallback(() => {}, []);
  const onConfirmReset = useCallback(() => {}, []);
  const onCancelReset = useCallback(() => {}, []);
  const onConfirmQuit = useCallback(() => {}, []);
  const onCancelQuit = useCallback(() => {}, []);
  const onConfirmDeleteInstrumentAndNotes = useCallback(() => {}, []);
  const onConfirmDeleteInstrumentOnly = useCallback(() => {}, []);
  const onCancelInstrumentDelete = useCallback(() => {}, []);
  const onSaveInstrumentMidi = useCallback(() => {}, []);
  const onCloseInstrumentMidi = useCallback(() => {}, []);
  const onSaveInstrumentColor = useCallback(() => {}, []);
  const onClearInstrumentColor = useCallback(() => {}, []);
  const onCloseInstrumentColor = useCallback(() => {}, []);
  const onTransposeAmountChange = useCallback(() => {}, []);
  const onConfirmTranspose = useCallback(() => {}, []);
  const onCancelTranspose = useCallback(() => {}, []);
  const onShowChangelog = useCallback(() => {}, []);
  const onCloseChangelog = useCallback(() => {}, []);
  const onShowManual = useCallback(() => {}, []);
  const onCloseManual = useCallback(() => {}, []);
  const onSaveMidiConfig = useCallback(() => {}, []);
  const onCloseMidi = useCallback(() => {}, []);
  const onClearMidiMonitors = useCallback(() => {}, []);
  const onRescanMidiDevices = useCallback(() => {}, []);
  const onLiveMidiConfigChange = useCallback(() => {}, []);
  const onMidiSystemReset = useCallback(() => {}, []);

  // Additional state for download modal
  const [midiLoadError, setMidiLoadErrorState] = useState('');
  const [midiCopySummary, setMidiCopySummaryState] = useState('');

  const setMidiLoadError = useCallback((value: string) => setMidiLoadErrorState(value), []);
  const setMidiCopySummary = useCallback((value: string) => setMidiCopySummaryState(value), []);

  const value: ModalContextType = {
    // Error modals
    songError,
    setSongError,
    instrumentError,
    setInstrumentError,
    trackClipboardError,
    setTrackClipboardError,

    // Summary modals
    optimizeSummary,
    setOptimizeSummary,
    soundExportSummary,
    setSoundExportSummary,
    dumpExportSummary,
    setDumpExportSummary,
    transposeSummary,
    setTransposeSummary,
    renumberSummary,
    setRenumberSummary,
    instrumentOperationSummary,
    setInstrumentOperationSummary,

    // Debug info modal
    isDebugInfoOpen,
    setIsDebugInfoOpen,

    // Instrument type warning modal
    isInstrumentTypeWarningOpen,
    pendingInstrumentTypeInfo,
    instrumentTypeWarningIgnoreChecked,
    setInstrumentTypeWarningIgnoreChecked,
    showInstrumentTypeWarning,
    hideInstrumentTypeWarning,
    onConfirmInstrumentTypeWarning,
    onCancelInstrumentTypeWarning,

    // Confirmation modals
    isNewSongConfirmOpen,
    showNewSongConfirm,
    hideNewSongConfirm,
    onConfirmNewSong,
    onCancelNewSong,

    isOptimizeConfirmOpen,
    showOptimizeConfirm,
    hideOptimizeConfirm,
    onConfirmOptimize,
    onCancelOptimize,

    isRenumberConfirmOpen,
    showRenumberConfirm,
    hideRenumberConfirm,
    onConfirmRenumber,
    onCancelRenumber,

    isResetConfirmOpen,
    showResetConfirm,
    hideResetConfirm,
    onConfirmReset,
    onCancelReset,

    isQuitConfirmOpen,
    showQuitConfirm,
    hideQuitConfirm,
    onConfirmQuit,
    onCancelQuit,

    // Instrument delete modal
    isInstrumentDeleteOpen,
    instrumentDeleteUsage,
    showInstrumentDelete,
    hideInstrumentDelete,
    onConfirmDeleteInstrumentAndNotes,
    onConfirmDeleteInstrumentOnly,
    onCancelInstrumentDelete,

    // Instrument MIDI modal
    isInstrumentMidiOpen,
    instrumentMidiTarget,
    showInstrumentMidi,
    hideInstrumentMidi,
    onSaveInstrumentMidi,
    onCloseInstrumentMidi,

    // Instrument color modal
    isInstrumentColorOpen,
    instrumentColorTarget,
    showInstrumentColor,
    hideInstrumentColor,
    onSaveInstrumentColor,
    onClearInstrumentColor,
    onCloseInstrumentColor,

    // Transpose modal
    isTransposeOpen,
    transposeScope,
    transposeTrackScope,
    transposeInstrumentScope,
    transposeAmount,
    transposeAmountInput,
    showTranspose,
    hideTranspose,
    setTransposeScope,
    setTransposeTrackScope,
    setTransposeInstrumentScope,
    onTransposeAmountChange,
    onConfirmTranspose,
    onCancelTranspose,
    setTransposeAmount,
    setTransposeAmountInput,

    // About modal
    isAboutOpen,
    aboutVersion,
    aboutRuntimeLabel,
    aboutRuntimeDetails,
    showAbout,
    hideAbout,

    // Changelog modal
    isChangelogOpen,
    changelogContent,
    showChangelog,
    hideChangelog,
    onShowChangelog,
    onCloseChangelog,

    // Manual modal
    isManualOpen,
    manualContent,
    showManual,
    hideManual,
    onShowManual,
    onCloseManual,

    // MIDI modal
    isMidiModalOpen,
    isMidiSupported,
    midiAccessError,
    midiConfig,
    midiDevices,
    midiInMonitor,
    midiOutMonitor,
    showMidi,
    hideMidi,
    onSaveMidiConfig,
    onCloseMidi,
    onClearMidiMonitors,
    onRescanMidiDevices,
    onLiveMidiConfigChange,
    setMidiCopySummary,
    setMidiLoadError,

    // Download modal
    isDownloadOpen,
    showDownload,
    hideDownload,
    midiLoadError,
    midiCopySummary,
    onMidiSystemReset,
  };

  return (
    <ModalContext.Provider value={value}>
      {children}
    </ModalContext.Provider>
  );
};

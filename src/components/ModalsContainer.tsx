import React from 'react';
import { ModalContainer } from './ModalContainer';
import { FilePickerModal } from '../modals/FilePickerModal';
import { ExportModal } from '../modals/ExportModal';
import { PasteTrackModal } from '../modals/PasteTrackModal';
import type { ExportType, ExportStrategy } from '../constants/export';
import type { TrackPasteMode } from '../hooks/useTrackOperations';
import type { Instrument } from '../synth/SoundDriver';
import type { MidiConfiguration, MidiDeviceInfo, MidiMonitorEntry } from '../hooks/useMidi';
import type { InstrumentDeleteUsage } from '../hooks/useModalState';

interface ModalsContainerProps {
  // Error and summary states
  songError: string;
  setSongError: (error: string) => void;
  instrumentError: string;
  setInstrumentError: (error: string) => void;
  trackClipboardError: string;
  setTrackClipboardError: (error: string) => void;
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

  // Modal states
  isDebugInfoOpen: boolean;
  setIsDebugInfoOpen: (open: boolean) => void;
  isInstrumentTypeWarningOpen: boolean;
  pendingInstrumentTypeInfo: {
    hasTypeField: boolean;
    detectedType: string | null;
  } | null;
  instrumentTypeWarningIgnoreChecked: boolean;
  setInstrumentTypeWarningIgnoreChecked: (checked: boolean) => void;
  onConfirmInstrumentTypeWarning: () => void;
  onCancelInstrumentTypeWarning: () => void;
  isNewSongConfirmOpen: boolean;
  onConfirmNewSong: () => void;
  onCancelNewSong: () => void;
  isOptimizeConfirmOpen: boolean;
  onConfirmOptimize: () => void;
  onCancelOptimize: () => void;
  isRenumberConfirmOpen: boolean;
  onConfirmRenumber: () => void;
  onCancelRenumber: () => void;
  isResetConfirmOpen: boolean;
  onConfirmReset: () => void;
  onCancelReset: () => void;
  isQuitConfirmOpen: boolean;
  onConfirmQuit: () => void;
  onCancelQuit: () => void;
  isInstrumentDeleteOpen: boolean;
  instrumentDeleteUsage: InstrumentDeleteUsage;
  onConfirmDeleteInstrumentAndNotes: () => void;
  onConfirmDeleteInstrumentOnly: () => void;
  onCancelInstrumentDelete: () => void;
  isInstrumentMidiOpen: boolean;
  instrumentMidiTarget: Instrument | null;
  onSaveInstrumentMidi: (midi: { channel: number | null; program: number | null }) => void;
  onCloseInstrumentMidi: () => void;
  isInstrumentColorOpen: boolean;
  instrumentColorTarget: Instrument | null;
  onSaveInstrumentColor: (color: string | null) => void;
  onClearInstrumentColor: () => void;
  onCloseInstrumentColor: () => void;
  isTransposeOpen: boolean;
  transposeScope: 'line' | 'song';
  transposeTrackScope: 'current' | 'all';
  transposeInstrumentScope: 'all' | 'selected';
  transposeAmount: number;
  transposeAmountInput: string;
  setTransposeScope: (scope: 'line' | 'song') => void;
  setTransposeTrackScope: (scope: 'current' | 'all') => void;
  setTransposeInstrumentScope: (scope: 'all' | 'selected') => void;
  onTransposeAmountChange: (value: string) => void;
  onConfirmTranspose: () => void;
  onCancelTranspose: () => void;
  setTransposeAmount: (amount: number) => void;
  setTransposeAmountInput: (input: string) => void;
  isAboutOpen: boolean;
  aboutVersion: string;
  aboutRuntimeLabel: string | null;
  aboutRuntimeDetails: string[];
  setIsAboutOpen: (open: boolean) => void;
  isChangelogOpen: boolean;
  changelogContent: string;
  onShowChangelog: () => void;
  onCloseChangelog: () => void;
  isManualOpen: boolean;
  manualContent: string;
  onShowManual: () => void;
  onCloseManual: () => void;
  isMidiModalOpen: boolean;
  isMidiSupported: boolean;
  midiAccessError: string | null;
  midiConfiguration: MidiConfiguration;
  midiDevices: {
    inputs: MidiDeviceInfo[];
    outputs: MidiDeviceInfo[];
  };
  midiInMonitor: MidiMonitorEntry[];
  midiOutMonitor: MidiMonitorEntry[];
  onSaveMidiConfiguration: (config: MidiConfiguration) => void;
  onCloseMidi: () => void;
  onClearMidiMonitors: () => void;
  onRescanMidiDevices: () => void;
  onLiveMidiConfigurationChange: (patch: Partial<MidiConfiguration>) => void;
  setMidiCopySummary: (summary: string) => void;
  setMidiLoadError: (error: string) => void;
  isDownloadOpen: boolean;
  setIsDownloadOpen: (open: boolean) => void;
  midiLoadError: string;
  midiCopySummary: string;
  onMidiSystemReset: () => void;
  isSongConfigurationWarningOpen: boolean;
  songConfigurationWarningMessage: string;
  onConfirmSongConfigurationWarning: () => void;
  onCancelSongConfigurationWarning: () => void;

  // File picker modals
  isRepositoryInstrumentOpen: boolean;
  setIsRepositoryInstrumentOpen: (open: boolean) => void;
  onPickRepositoryInstrument: (fileUrl: string) => void;
  isDemoSongPickerOpen: boolean;
  setIsDemoSongPickerOpen: (open: boolean) => void;
  onPickDemoSong: (fileUrl: string) => void;

  // Export modal
  isExportModalOpen: boolean;
  pendingExportType: ExportType;
  pendingExportStrategy: ExportStrategy;
  onChangeExportType: (type: ExportType) => void;
  onChangeExportStrategy: (strategy: ExportStrategy) => void;
  onExportDumpFromModal: () => void;
  onExportDataFromModal: () => void;
  onExportBinFromModal: () => void;
  onExportVgmFromModal: () => void;
  onExportMaxFromModal: () => void;
  onExportWavFromModal: () => void;
  onConfirmExport: () => void;
  onCancelExport: () => void;

  // Paste track modal
  isPasteTrackModalOpen: boolean;
  pasteTrackPendingMode: TrackPasteMode;
  setPasteTrackPendingMode: (mode: TrackPasteMode) => void;
  onConfirmPasteTrackModal: () => void;
  onCancelPasteTrackModal: () => void;
}

export const ModalsContainer: React.FC<ModalsContainerProps> = ({
  // Error and summary states
  songError,
  setSongError,
  instrumentError,
  setInstrumentError,
  trackClipboardError,
  setTrackClipboardError,
  optimizeSummary,
  onCloseOptimizeSummary,
  soundExportSummary,
  onCloseSoundExportSummary,
  dumpExportSummary,
  onCloseDumpExportSummary,
  transposeSummary,
  onCloseTransposeSummary,
  renumberSummary,
  onCloseRenumberSummary,
  instrumentOperationSummary,
  onCloseInstrumentOperationSummary,
  isDebugInfoOpen,
  setIsDebugInfoOpen,
  isInstrumentTypeWarningOpen,
  pendingInstrumentTypeInfo,
  instrumentTypeWarningIgnoreChecked,
  setInstrumentTypeWarningIgnoreChecked,
  onConfirmInstrumentTypeWarning,
  onCancelInstrumentTypeWarning,
  isNewSongConfirmOpen,
  onConfirmNewSong,
  onCancelNewSong,
  isOptimizeConfirmOpen,
  onConfirmOptimize,
  onCancelOptimize,
  isRenumberConfirmOpen,
  onConfirmRenumber,
  onCancelRenumber,
  isResetConfirmOpen,
  onConfirmReset,
  onCancelReset,
  isQuitConfirmOpen,
  onConfirmQuit,
  onCancelQuit,
  isInstrumentDeleteOpen,
  instrumentDeleteUsage,
  onConfirmDeleteInstrumentAndNotes,
  onConfirmDeleteInstrumentOnly,
  onCancelInstrumentDelete,
  isInstrumentMidiOpen,
  instrumentMidiTarget,
  onSaveInstrumentMidi,
  onCloseInstrumentMidi,
  isInstrumentColorOpen,
  instrumentColorTarget,
  onSaveInstrumentColor,
  onClearInstrumentColor,
  onCloseInstrumentColor,
  isTransposeOpen,
  transposeScope,
  transposeTrackScope,
  transposeInstrumentScope,
  transposeAmount,
  transposeAmountInput,
  setTransposeScope,
  setTransposeTrackScope,
  setTransposeInstrumentScope,
  onTransposeAmountChange,
  onConfirmTranspose,
  onCancelTranspose,
  setTransposeAmount,
  setTransposeAmountInput,
  isAboutOpen,
  aboutVersion,
  aboutRuntimeLabel,
  aboutRuntimeDetails,
  setIsAboutOpen,
  isChangelogOpen,
  changelogContent,
  onShowChangelog,
  onCloseChangelog,
  isManualOpen,
  manualContent,
  onShowManual,
  onCloseManual,
  isMidiModalOpen,
  isMidiSupported,
  midiAccessError,
  midiConfiguration,
  midiDevices,
  midiInMonitor,
  midiOutMonitor,
  onSaveMidiConfiguration,
  onCloseMidi,
  onClearMidiMonitors,
  onRescanMidiDevices,
  onLiveMidiConfigurationChange,
  setMidiCopySummary,
  setMidiLoadError,
  isDownloadOpen,
  setIsDownloadOpen,
  midiLoadError,
  midiCopySummary,
  onMidiSystemReset,
  isSongConfigurationWarningOpen,
  songConfigurationWarningMessage,
  onConfirmSongConfigurationWarning,
  onCancelSongConfigurationWarning,
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
  onExportDumpFromModal,
  onExportDataFromModal,
  onExportBinFromModal,
  onExportVgmFromModal,
  onExportMaxFromModal,
  onExportWavFromModal,
  onConfirmExport,
  onCancelExport,
  isPasteTrackModalOpen,
  pasteTrackPendingMode,
  setPasteTrackPendingMode,
  onConfirmPasteTrackModal,
  onCancelPasteTrackModal,
}) => {
  return (
    <>
      <ModalContainer
        songError={songError}
        setSongError={setSongError}
        instrumentError={instrumentError}
        setInstrumentError={setInstrumentError}
        trackClipboardError={trackClipboardError}
        setTrackClipboardError={setTrackClipboardError}
        optimizeSummary={optimizeSummary}
        onCloseOptimizeSummary={onCloseOptimizeSummary}
        soundExportSummary={soundExportSummary}
        onCloseSoundExportSummary={onCloseSoundExportSummary}
        dumpExportSummary={dumpExportSummary}
        onCloseDumpExportSummary={onCloseDumpExportSummary}
        transposeSummary={transposeSummary}
        onCloseTransposeSummary={onCloseTransposeSummary}
        renumberSummary={renumberSummary}
        onCloseRenumberSummary={onCloseRenumberSummary}
        instrumentOperationSummary={instrumentOperationSummary}
        onCloseInstrumentOperationSummary={onCloseInstrumentOperationSummary}
        isDebugInfoOpen={isDebugInfoOpen}
        setIsDebugInfoOpen={setIsDebugInfoOpen}
        isInstrumentTypeWarningOpen={isInstrumentTypeWarningOpen}
        pendingInstrumentTypeInfo={pendingInstrumentTypeInfo}
        instrumentTypeWarningIgnoreChecked={instrumentTypeWarningIgnoreChecked}
        setInstrumentTypeWarningIgnoreChecked={setInstrumentTypeWarningIgnoreChecked}
        onConfirmInstrumentTypeWarning={onConfirmInstrumentTypeWarning}
        onCancelInstrumentTypeWarning={onCancelInstrumentTypeWarning}
        isNewSongConfirmOpen={isNewSongConfirmOpen}
        onConfirmNewSong={onConfirmNewSong}
        onCancelNewSong={onCancelNewSong}
        isOptimizeConfirmOpen={isOptimizeConfirmOpen}
        onConfirmOptimize={onConfirmOptimize}
        onCancelOptimize={onCancelOptimize}
        isRenumberConfirmOpen={isRenumberConfirmOpen}
        onConfirmRenumber={onConfirmRenumber}
        onCancelRenumber={onCancelRenumber}
        isResetConfirmOpen={isResetConfirmOpen}
        onConfirmReset={onConfirmReset}
        onCancelReset={onCancelReset}
        isQuitConfirmOpen={isQuitConfirmOpen}
        onConfirmQuit={onConfirmQuit}
        onCancelQuit={onCancelQuit}
        isInstrumentDeleteOpen={isInstrumentDeleteOpen}
        instrumentDeleteUsage={instrumentDeleteUsage}
        onConfirmDeleteInstrumentAndNotes={onConfirmDeleteInstrumentAndNotes}
        onConfirmDeleteInstrumentOnly={onConfirmDeleteInstrumentOnly}
        onCancelInstrumentDelete={onCancelInstrumentDelete}
        isInstrumentMidiOpen={isInstrumentMidiOpen}
        instrumentMidiTarget={instrumentMidiTarget}
        onSaveInstrumentMidi={onSaveInstrumentMidi}
        onCloseInstrumentMidi={onCloseInstrumentMidi}
        isInstrumentColorOpen={isInstrumentColorOpen}
        instrumentColorTarget={instrumentColorTarget}
        onSaveInstrumentColor={onSaveInstrumentColor}
        onClearInstrumentColor={onClearInstrumentColor}
        onCloseInstrumentColor={onCloseInstrumentColor}
        isTransposeOpen={isTransposeOpen}
        transposeScope={transposeScope}
        transposeTrackScope={transposeTrackScope}
        transposeInstrumentScope={transposeInstrumentScope}
        transposeAmount={transposeAmount}
        transposeAmountInput={transposeAmountInput}
        setTransposeScope={setTransposeScope}
        setTransposeTrackScope={setTransposeTrackScope}
        setTransposeInstrumentScope={setTransposeInstrumentScope}
        onTransposeAmountChange={onTransposeAmountChange}
        onConfirmTranspose={onConfirmTranspose}
        onCancelTranspose={onCancelTranspose}
        setTransposeAmount={setTransposeAmount}
        setTransposeAmountInput={setTransposeAmountInput}
        isAboutOpen={isAboutOpen}
        aboutVersion={aboutVersion}
        aboutRuntimeLabel={aboutRuntimeLabel}
        aboutRuntimeDetails={aboutRuntimeDetails}
        setIsAboutOpen={setIsAboutOpen}
        isChangelogOpen={isChangelogOpen}
        changelogContent={changelogContent}
        onShowChangelog={onShowChangelog}
        onCloseChangelog={onCloseChangelog}
        isManualOpen={isManualOpen}
        manualContent={manualContent}
        onShowManual={onShowManual}
        onCloseManual={onCloseManual}
        isMidiModalOpen={isMidiModalOpen}
        isMidiSupported={isMidiSupported}
        midiAccessError={midiAccessError}
        midiConfiguration={midiConfiguration}
        midiDevices={midiDevices}
        midiInMonitor={midiInMonitor}
        midiOutMonitor={midiOutMonitor}
        onSaveMidiConfiguration={onSaveMidiConfiguration}
        onCloseMidi={onCloseMidi}
        onClearMidiMonitors={onClearMidiMonitors}
        onRescanMidiDevices={onRescanMidiDevices}
        onLiveMidiConfigurationChange={onLiveMidiConfigurationChange}
        setMidiCopySummary={setMidiCopySummary}
        setMidiLoadError={setMidiLoadError}
        isDownloadOpen={isDownloadOpen}
        setIsDownloadOpen={setIsDownloadOpen}
        midiLoadError={midiLoadError}
        midiCopySummary={midiCopySummary}
        onMidiSystemReset={onMidiSystemReset}
        isSongConfigurationWarningOpen={isSongConfigurationWarningOpen}
        songConfigurationWarningMessage={songConfigurationWarningMessage}
        onConfirmSongConfigurationWarning={onConfirmSongConfigurationWarning}
        onCancelSongConfigurationWarning={onCancelSongConfigurationWarning}
      />
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
        onExportDump={onExportDumpFromModal}
        onExportData={onExportDataFromModal}
        onExportBin={onExportBinFromModal}
        onExportVgm={onExportVgmFromModal}
        onExportMax={onExportMaxFromModal}
        onExportWav={onExportWavFromModal}
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

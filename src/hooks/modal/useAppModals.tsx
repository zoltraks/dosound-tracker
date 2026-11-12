import type { Dispatch, ReactElement, SetStateAction } from 'react';
import type { ExportType, ExportStrategy, ExportFormat } from '../../constants/export.ts';
import type { Instrument } from '../../synth/SoundDriver.ts';
import type { MidiConfiguration, MidiDeviceInfo, MidiMonitorEntry } from '../midi/useMidi.ts';
import type { InstrumentTypeInfo } from '../instrument/useInstrumentWarnings.ts';
import type { PendingSongImport } from '../song/useDataManagement.ts';
import type { TrackPasteMode } from '../song/useTrackOperations.ts';
import type { SettingsCategory, SettingsValues } from '../../types/settings.ts';
import { ModalManager } from '../../components/modal/ModalManager.tsx';
import { useModalManager } from './useModalManager.ts';
import type { UseModalStateResult } from './useModalState.ts';

export interface UseAppModalsParams {
  modalState: UseModalStateResult;
  aboutVersion: string;

  songError: string;
  setSongError: (value: string) => void;
  instrumentError: string;
  setInstrumentError: (value: string) => void;
  trackClipboardError: string;
  setTrackClipboardError: (value: string) => void;
  soundExportSummary: string;
  handleCloseSoundExportSummary: () => void;
  dumpExportSummary: string;
  handleCloseDumpExportSummary: () => void;
  handleCloseTransposeSummary: () => void;
  handleCloseOptimizeSummary: () => void;
  handleCloseRenumberSummary: () => void;
  handleCloseInstrumentOperationSummary: () => void;

  aboutRuntimeLabel: string | null;
  aboutRuntimeDetails: string[];
  handleShowChangelog: () => void;
  handleCloseChangelog: () => void;
  handleShowManual: () => void;
  handleCloseManual: () => void;
  handleConfirmQuit: () => void;
  handleCancelQuit: () => void;

  transposeScope: 'line' | 'song';
  setTransposeScope: Dispatch<SetStateAction<'line' | 'song'>>;
  transposeTrackScope: 'current' | 'all';
  setTransposeTrackScope: Dispatch<SetStateAction<'current' | 'all'>>;
  transposeInstrumentScope: 'all' | 'selected';
  setTransposeInstrumentScope: Dispatch<SetStateAction<'all' | 'selected'>>;
  transposeAmount: number;
  setTransposeAmount: Dispatch<SetStateAction<number>>;
  transposeAmountInput: string;
  setTransposeAmountInput: Dispatch<SetStateAction<string>>;
  handleTransposeAmountChange: (value: string) => void;
  handleConfirmTranspose: () => void;
  handleCancelTranspose: () => void;

  handleConfirmOptimize: () => void;
  handleCancelOptimize: () => void;
  handleConfirmRenumber: () => void;
  handleCancelRenumber: () => void;
  handleConfirmNewSong: () => void;
  handleCancelNewSong: () => void;
  handleConfirmReset: () => void;
  handleCancelReset: () => void;

  handleCancelInstrumentDelete: () => void;
  handleConfirmDeleteInstrumentAndNotes: () => void;
  handleConfirmDeleteInstrumentOnly: () => void;

  isInstrumentTypeWarningOpen: boolean;
  pendingInstrumentTypeInfo: InstrumentTypeInfo | null;
  instrumentTypeWarningIgnoreChecked: boolean;
  setInstrumentTypeWarningIgnoreChecked: (checked: boolean) => void;
  handleConfirmInstrumentTypeWarning: () => void;
  handleCancelInstrumentTypeWarning: () => void;

  instrumentMidiTarget: Instrument | null;
  handleSaveInstrumentMidi: (midi: { channel: number | null; program: number | null }) => void;
  handleCloseInstrumentMidi: () => void;
  instrumentColorTarget: Instrument | null;
  handleSaveInstrumentColor: (color: string | null) => void;
  handleClearInstrumentColor: () => void;
  handleCloseInstrumentColor: () => void;

  isMidiSupported: boolean;
  midiAccessError: string | null;
  midiConfiguration: MidiConfiguration;
  midiDevices: {
    inputs: MidiDeviceInfo[];
    outputs: MidiDeviceInfo[];
  };
  midiInMonitor: MidiMonitorEntry[];
  midiOutMonitor: MidiMonitorEntry[];
  handleSaveMidiConfig: (configuration: MidiConfiguration) => void;
  handleCloseMidi: () => void;
  handleClearMidiMonitors: () => void;
  handleRescanMidiDevices: () => void;
  handleLiveMidiConfigChange: (patch: Partial<MidiConfiguration>) => void;
  handleMidiSystemReset: () => void;

  pendingSongImport: PendingSongImport | null;
  configurationWarningMessage: string;
  handleConfirmSongConfigurationWarning: () => void;
  handleCancelSongConfigurationWarning: () => void;

  isRepositoryInstrumentOpen: boolean;
  setIsRepositoryInstrumentOpen: (open: boolean) => void;
  handlePickRepositoryInstrument: (fileUrl: string) => void;
  isDemoSongPickerOpen: boolean;
  setIsDemoSongPickerOpen: (open: boolean) => void;
  handlePickDemoSong: (fileUrl: string) => void;

  pendingExportType: ExportType;
  pendingExportStrategy: ExportStrategy;
  handleExportTypeChange: (type: ExportType) => void;
  handleExportStrategyChange: (strategy: ExportStrategy) => void;
  handleExportFormatFromModal: (format: ExportFormat) => void;
  handleConfirmExport: () => void;
  handleCancelExport: () => void;

  isPasteTrackModalOpen: boolean;
  pasteTrackPendingMode: TrackPasteMode;
  setPasteTrackPendingMode: (mode: TrackPasteMode) => void;
  handleConfirmPasteTrackModal: () => void;
  handleCancelPasteTrackModal: () => void;

  settingsCategory: SettingsCategory;
  settingsDraft: SettingsValues;
  settingsConfirmingReset: boolean;
  onSettingsCategoryChange: (category: SettingsCategory) => void;
  onSettingsDraftChange: (draft: SettingsValues) => void;
  onSettingsConfirmingResetChange: (confirming: boolean) => void;
  onSettingsSessionFocus: (elementId: string | null) => void;
  onSettingsPaneScroll: (scrollTop: number) => void;
  handleCommitSettings: () => void;
  handleCancelSettings: () => void;
}

/**
 * Assembles the modal layer: registers the global modal keyboard handling
 * through `useModalManager` and returns the rendered `ModalManager` element
 * for the `AppLayout` `modals` slot.
 */
export function useAppModals({
  modalState,
  aboutVersion,
  songError,
  setSongError,
  instrumentError,
  setInstrumentError,
  trackClipboardError,
  setTrackClipboardError,
  soundExportSummary,
  handleCloseSoundExportSummary,
  dumpExportSummary,
  handleCloseDumpExportSummary,
  handleCloseTransposeSummary,
  handleCloseOptimizeSummary,
  handleCloseRenumberSummary,
  handleCloseInstrumentOperationSummary,
  aboutRuntimeLabel,
  aboutRuntimeDetails,
  handleShowChangelog,
  handleCloseChangelog,
  handleShowManual,
  handleCloseManual,
  handleConfirmQuit,
  handleCancelQuit,
  transposeScope,
  setTransposeScope,
  transposeTrackScope,
  setTransposeTrackScope,
  transposeInstrumentScope,
  setTransposeInstrumentScope,
  transposeAmount,
  setTransposeAmount,
  transposeAmountInput,
  setTransposeAmountInput,
  handleTransposeAmountChange,
  handleConfirmTranspose,
  handleCancelTranspose,
  handleConfirmOptimize,
  handleCancelOptimize,
  handleConfirmRenumber,
  handleCancelRenumber,
  handleConfirmNewSong,
  handleCancelNewSong,
  handleConfirmReset,
  handleCancelReset,
  handleCancelInstrumentDelete,
  handleConfirmDeleteInstrumentAndNotes,
  handleConfirmDeleteInstrumentOnly,
  isInstrumentTypeWarningOpen,
  pendingInstrumentTypeInfo,
  instrumentTypeWarningIgnoreChecked,
  setInstrumentTypeWarningIgnoreChecked,
  handleConfirmInstrumentTypeWarning,
  handleCancelInstrumentTypeWarning,
  instrumentMidiTarget,
  handleSaveInstrumentMidi,
  handleCloseInstrumentMidi,
  instrumentColorTarget,
  handleSaveInstrumentColor,
  handleClearInstrumentColor,
  handleCloseInstrumentColor,
  isMidiSupported,
  midiAccessError,
  midiConfiguration,
  midiDevices,
  midiInMonitor,
  midiOutMonitor,
  handleSaveMidiConfig,
  handleCloseMidi,
  handleClearMidiMonitors,
  handleRescanMidiDevices,
  handleLiveMidiConfigChange,
  handleMidiSystemReset,
  pendingSongImport,
  configurationWarningMessage,
  handleConfirmSongConfigurationWarning,
  handleCancelSongConfigurationWarning,
  isRepositoryInstrumentOpen,
  setIsRepositoryInstrumentOpen,
  handlePickRepositoryInstrument,
  isDemoSongPickerOpen,
  setIsDemoSongPickerOpen,
  handlePickDemoSong,
  pendingExportType,
  pendingExportStrategy,
  handleExportTypeChange,
  handleExportStrategyChange,
  handleExportFormatFromModal,
  handleConfirmExport,
  handleCancelExport,
  isPasteTrackModalOpen,
  pasteTrackPendingMode,
  setPasteTrackPendingMode,
  handleConfirmPasteTrackModal,
  handleCancelPasteTrackModal,
  settingsCategory,
  settingsDraft,
  settingsConfirmingReset,
  onSettingsCategoryChange,
  onSettingsDraftChange,
  onSettingsConfirmingResetChange,
  onSettingsSessionFocus,
  onSettingsPaneScroll,
  handleCommitSettings,
  handleCancelSettings,
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
    isManualOpen,
    handleCloseManual,
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
    isExportOpen: isExportModalOpen,
    handleCancelExport,
    handleConfirmExport,
    isSettingsOpen,
    handleCancelSettings,
    handleConfirmSettings: handleCommitSettings,
    isPasteTrackOptionsOpen: isPasteTrackModalOpen,
    handleCancelPasteTrackOptions: handleCancelPasteTrackModal,
    handleConfirmPasteTrackOptions: handleConfirmPasteTrackModal,
  });

  return (
    <ModalManager
      songError={songError}
      setSongError={setSongError}
      instrumentError={instrumentError}
      setInstrumentError={setInstrumentError}
      trackClipboardError={trackClipboardError}
      setTrackClipboardError={setTrackClipboardError}
      optimizeSummary={optimizeSummary}
      onCloseOptimizeSummary={handleCloseOptimizeSummary}
      soundExportSummary={soundExportSummary}
      onCloseSoundExportSummary={handleCloseSoundExportSummary}
      dumpExportSummary={dumpExportSummary}
      onCloseDumpExportSummary={handleCloseDumpExportSummary}
      transposeSummary={transposeSummary}
      onCloseTransposeSummary={handleCloseTransposeSummary}
      renumberSummary={renumberSummary}
      onCloseRenumberSummary={handleCloseRenumberSummary}
      instrumentOperationSummary={instrumentOperationSummary}
      onCloseInstrumentOperationSummary={handleCloseInstrumentOperationSummary}
      isDebugInfoOpen={isDebugInfoOpen}
      setIsDebugInfoOpen={setIsDebugInfoOpen}
      isInstrumentTypeWarningOpen={isInstrumentTypeWarningOpen}
      pendingInstrumentTypeInfo={pendingInstrumentTypeInfo}
      instrumentTypeWarningIgnoreChecked={instrumentTypeWarningIgnoreChecked}
      setInstrumentTypeWarningIgnoreChecked={setInstrumentTypeWarningIgnoreChecked}
      onConfirmInstrumentTypeWarning={handleConfirmInstrumentTypeWarning}
      onCancelInstrumentTypeWarning={handleCancelInstrumentTypeWarning}
      isNewSongConfirmOpen={isNewSongConfirmOpen}
      onConfirmNewSong={handleConfirmNewSong}
      onCancelNewSong={handleCancelNewSong}
      isOptimizeConfirmOpen={isOptimizeConfirmOpen}
      onConfirmOptimize={handleConfirmOptimize}
      onCancelOptimize={handleCancelOptimize}
      isRenumberConfirmOpen={isRenumberConfirmOpen}
      onConfirmRenumber={handleConfirmRenumber}
      onCancelRenumber={handleCancelRenumber}
      isResetConfirmOpen={isResetConfirmOpen}
      onConfirmReset={handleConfirmReset}
      onCancelReset={handleCancelReset}
      isQuitConfirmOpen={isQuitConfirmOpen}
      onConfirmQuit={handleConfirmQuit}
      onCancelQuit={handleCancelQuit}
      isInstrumentDeleteOpen={isInstrumentDeleteOpen}
      instrumentDeleteUsage={instrumentDeleteUsage}
      onConfirmDeleteInstrumentAndNotes={handleConfirmDeleteInstrumentAndNotes}
      onConfirmDeleteInstrumentOnly={handleConfirmDeleteInstrumentOnly}
      onCancelInstrumentDelete={handleCancelInstrumentDelete}
      isInstrumentMidiOpen={isInstrumentMidiOpen}
      instrumentMidiTarget={instrumentMidiTarget}
      onSaveInstrumentMidi={handleSaveInstrumentMidi}
      onCloseInstrumentMidi={handleCloseInstrumentMidi}
      isInstrumentColorOpen={isInstrumentColorOpen}
      instrumentColorTarget={instrumentColorTarget}
      onSaveInstrumentColor={handleSaveInstrumentColor}
      onClearInstrumentColor={handleClearInstrumentColor}
      onCloseInstrumentColor={handleCloseInstrumentColor}
      isTransposeOpen={isTransposeOpen}
      transposeScope={transposeScope}
      transposeTrackScope={transposeTrackScope}
      transposeInstrumentScope={transposeInstrumentScope}
      transposeAmount={transposeAmount}
      transposeAmountInput={transposeAmountInput}
      setTransposeScope={setTransposeScope}
      setTransposeTrackScope={setTransposeTrackScope}
      setTransposeInstrumentScope={setTransposeInstrumentScope}
      onTransposeAmountChange={handleTransposeAmountChange}
      onConfirmTranspose={handleConfirmTranspose}
      onCancelTranspose={handleCancelTranspose}
      setTransposeAmount={setTransposeAmount}
      setTransposeAmountInput={setTransposeAmountInput}
      isAboutOpen={isAboutOpen}
      aboutVersion={aboutVersion}
      aboutRuntimeLabel={aboutRuntimeLabel}
      aboutRuntimeDetails={aboutRuntimeDetails}
      setIsAboutOpen={setIsAboutOpen}
      isChangelogOpen={isChangelogOpen}
      changelogContent={changelogContent}
      onShowChangelog={handleShowChangelog}
      onCloseChangelog={handleCloseChangelog}
      isManualOpen={isManualOpen}
      manualContent={manualContent}
      onShowManual={handleShowManual}
      onCloseManual={handleCloseManual}
      isMidiModalOpen={isMidiModalOpen}
      isMidiSupported={isMidiSupported}
      midiAccessError={midiAccessError}
      midiConfiguration={midiConfiguration}
      midiDevices={midiDevices}
      midiInMonitor={midiInMonitor}
      midiOutMonitor={midiOutMonitor}
      onSaveMidiConfiguration={handleSaveMidiConfig}
      onCloseMidi={handleCloseMidi}
      onClearMidiMonitors={handleClearMidiMonitors}
      onRescanMidiDevices={handleRescanMidiDevices}
      onLiveMidiConfigurationChange={handleLiveMidiConfigChange}
      setMidiCopySummary={setMidiCopySummary}
      setMidiLoadError={setMidiLoadError}
      isDownloadOpen={isDownloadOpen}
      setIsDownloadOpen={setIsDownloadOpen}
      midiLoadError={midiLoadError}
      midiCopySummary={midiCopySummary}
      onMidiSystemReset={handleMidiSystemReset}
      isSongConfigurationWarningOpen={!!pendingSongImport}
      songConfigurationWarningMessage={
        configurationWarningMessage ||
        `Song YAML includes unsupported metadata values.\n\nLoad the song anyway?`
      }
      onConfirmSongConfigurationWarning={handleConfirmSongConfigurationWarning}
      onCancelSongConfigurationWarning={handleCancelSongConfigurationWarning}
      isRepositoryInstrumentOpen={isRepositoryInstrumentOpen}
      setIsRepositoryInstrumentOpen={setIsRepositoryInstrumentOpen}
      onPickRepositoryInstrument={handlePickRepositoryInstrument}
      isDemoSongPickerOpen={isDemoSongPickerOpen}
      setIsDemoSongPickerOpen={setIsDemoSongPickerOpen}
      onPickDemoSong={handlePickDemoSong}
      isExportModalOpen={isExportModalOpen}
      pendingExportType={pendingExportType}
      pendingExportStrategy={pendingExportStrategy}
      onChangeExportType={handleExportTypeChange}
      onChangeExportStrategy={handleExportStrategyChange}
      onExportFormat={handleExportFormatFromModal}
      onConfirmExport={handleConfirmExport}
      onCancelExport={handleCancelExport}
      isPasteTrackModalOpen={isPasteTrackModalOpen}
      pasteTrackPendingMode={pasteTrackPendingMode}
      setPasteTrackPendingMode={setPasteTrackPendingMode}
      onConfirmPasteTrackModal={handleConfirmPasteTrackModal}
      onCancelPasteTrackModal={handleCancelPasteTrackModal}
      isSettingsOpen={isSettingsOpen}
      settingsCategory={settingsCategory}
      settingsDraft={settingsDraft}
      settingsConfirmingReset={settingsConfirmingReset}
      onSettingsCategoryChange={onSettingsCategoryChange}
      onSettingsDraftChange={onSettingsDraftChange}
      onSettingsConfirmingResetChange={onSettingsConfirmingResetChange}
      onSettingsSessionFocus={onSettingsSessionFocus}
      onSettingsPaneScroll={onSettingsPaneScroll}
      onCommitSettings={handleCommitSettings}
      onCancelSettings={handleCancelSettings}
      onSettingsLoadError={setSongError}
    />
  );
}

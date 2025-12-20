import React from 'react';
import { InformationModal, ConfirmationModal, TransposeModal, AboutModal, MarkdownModal, DownloadModal, InstrumentDeleteModal, InstrumentTypeWarningModal, MidiModal, InstrumentMidiModal, InstrumentColorModal } from '../modals';
import type { MidiConfiguration, MidiDeviceInfo, MidiMonitorEntry } from '../hooks/useMidi';
import type { Instrument } from '../synth/SoundDriver';
import { CONFIRM_MODAL_TEXT } from '../constants/modal';
import { buildInfoModals } from '../utils/modalRendering';

type InstrumentDeleteUsage = {
  instrumentId: string;
  instrumentName: string;
  usageCount: number;
  patternCount: number;
};

type TransposeScope = 'line' | 'song';
type TransposeTrackScope = 'current' | 'all';
type TransposeInstrumentScope = 'all' | 'selected';

export interface ModalContainerProps {
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
  isInstrumentTypeWarningOpen: boolean;
  pendingInstrumentTypeInfo: {
    hasTypeField: boolean;
    detectedType: string | null;
  } | null;
  instrumentTypeWarningIgnoreChecked: boolean;
  setInstrumentTypeWarningIgnoreChecked: (value: boolean) => void;
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
  isSongConfigurationWarningOpen: boolean;
  songConfigurationWarningMessage: string;
  onConfirmSongConfigurationWarning: () => void;
  onCancelSongConfigurationWarning: () => void;
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
  transposeScope: TransposeScope;
  transposeTrackScope: TransposeTrackScope;
  transposeInstrumentScope: TransposeInstrumentScope;
  transposeAmount: number;
  transposeAmountInput: string;
  setTransposeScope: (scope: TransposeScope) => void;
  setTransposeTrackScope: (scope: TransposeTrackScope) => void;
  setTransposeInstrumentScope: (scope: TransposeInstrumentScope) => void;
  onTransposeAmountChange: (value: string) => void;
  onConfirmTranspose: () => void;
  onCancelTranspose: () => void;
  setTransposeAmount: (value: number) => void;
  setTransposeAmountInput: (value: string) => void;
  isAboutOpen: boolean;
  aboutVersion: string;
  aboutRuntimeLabel?: string | null;
  aboutRuntimeDetails?: string[];
  setIsAboutOpen: (value: boolean) => void;
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
  onSaveMidiConfiguration: (configuration: MidiConfiguration) => void;
  onCloseMidi: () => void;
  onClearMidiMonitors: () => void;
  onRescanMidiDevices: () => void;
  onLiveMidiConfigurationChange: (patch: Partial<MidiConfiguration>) => void;
  setMidiCopySummary: (value: string) => void;
  setMidiLoadError: (value: string) => void;
  isDownloadOpen: boolean;
  setIsDownloadOpen: (value: boolean) => void;
  midiLoadError: string;
  midiCopySummary: string;
  onMidiSystemReset: () => void;
}

export const ModalContainer: React.FC<ModalContainerProps> = ({
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
  isSongConfigurationWarningOpen,
  songConfigurationWarningMessage,
  onConfirmSongConfigurationWarning,
  onCancelSongConfigurationWarning,
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
}) => {
  const infoModals = buildInfoModals({
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
    midiLoadError,
    setMidiLoadError,
    midiCopySummary,
    setMidiCopySummary,
  });

  return (
    <>
      {infoModals.map(modal => (
        <InformationModal
          key={modal.key}
          isOpen={modal.isOpen}
          title={modal.title}
          message={modal.message}
          onClose={modal.onClose}
        />
      ))}

      <InstrumentTypeWarningModal
        isOpen={isInstrumentTypeWarningOpen}
        hasTypeField={!!pendingInstrumentTypeInfo?.hasTypeField}
        detectedType={pendingInstrumentTypeInfo?.detectedType ?? null}
        ignoreFuture={instrumentTypeWarningIgnoreChecked}
        onIgnoreChange={setInstrumentTypeWarningIgnoreChecked}
        onConfirm={onConfirmInstrumentTypeWarning}
        onCancel={onCancelInstrumentTypeWarning}
      />

      <ConfirmationModal
        isOpen={isNewSongConfirmOpen}
        title={CONFIRM_MODAL_TEXT.newSong.title}
        message={CONFIRM_MODAL_TEXT.newSong.message}
        onConfirm={onConfirmNewSong}
        onCancel={onCancelNewSong}
      />

      <ConfirmationModal
        isOpen={isSongConfigurationWarningOpen}
        title="Unsupported song configuration"
        message={songConfigurationWarningMessage}
        onConfirm={onConfirmSongConfigurationWarning}
        onCancel={onCancelSongConfigurationWarning}
      />

      <ConfirmationModal
        isOpen={isOptimizeConfirmOpen}
        title={CONFIRM_MODAL_TEXT.optimize.title}
        message={CONFIRM_MODAL_TEXT.optimize.message}
        onConfirm={onConfirmOptimize}
        onCancel={onCancelOptimize}
      />

      <ConfirmationModal
        isOpen={isRenumberConfirmOpen}
        title={CONFIRM_MODAL_TEXT.renumber.title}
        message={CONFIRM_MODAL_TEXT.renumber.message}
        onConfirm={onConfirmRenumber}
        onCancel={onCancelRenumber}
      />

      <ConfirmationModal
        isOpen={isResetConfirmOpen}
        title={CONFIRM_MODAL_TEXT.reset.title}
        message={CONFIRM_MODAL_TEXT.reset.message}
        onConfirm={onConfirmReset}
        onCancel={onCancelReset}
        confirmLabel={CONFIRM_MODAL_TEXT.reset.confirmLabel}
      />

      <ConfirmationModal
        isOpen={isQuitConfirmOpen}
        title={CONFIRM_MODAL_TEXT.quit.title}
        message={CONFIRM_MODAL_TEXT.quit.message}
        onConfirm={onConfirmQuit}
        onCancel={onCancelQuit}
      />

      <InstrumentDeleteModal
        isOpen={isInstrumentDeleteOpen}
        instrumentId={instrumentDeleteUsage.instrumentId}
        instrumentName={instrumentDeleteUsage.instrumentName}
        usageCount={instrumentDeleteUsage.usageCount}
        patternCount={instrumentDeleteUsage.patternCount}
        onDeleteNotesAndInstrument={onConfirmDeleteInstrumentAndNotes}
        onDeleteInstrumentOnly={onConfirmDeleteInstrumentOnly}
        onCancel={onCancelInstrumentDelete}
      />

      <InstrumentMidiModal
        isOpen={isInstrumentMidiOpen}
        instrument={instrumentMidiTarget}
        onSave={onSaveInstrumentMidi}
        onCancel={onCloseInstrumentMidi}
      />

      <InstrumentColorModal
        isOpen={isInstrumentColorOpen}
        instrument={instrumentColorTarget}
        onSave={onSaveInstrumentColor}
        onClear={onClearInstrumentColor}
        onCancel={onCloseInstrumentColor}
      />

      <TransposeModal
        isOpen={isTransposeOpen}
        scope={transposeScope}
        trackScope={transposeTrackScope}
        instrumentScope={transposeInstrumentScope}
        amount={transposeAmount}
        amountInput={transposeAmountInput}
        onScopeChange={setTransposeScope}
        onTrackScopeChange={setTransposeTrackScope}
        onInstrumentScopeChange={setTransposeInstrumentScope}
        onAmountChange={onTransposeAmountChange}
        onAmountAdjust={delta => {
          const rawNext = transposeAmount + delta;
          const clamped = Math.max(-99, Math.min(99, rawNext));
          setTransposeAmount(clamped);
          setTransposeAmountInput(String(clamped));
        }}
        onConfirm={onConfirmTranspose}
        onCancel={onCancelTranspose}
      />

      <AboutModal
        isOpen={isAboutOpen}
        version={aboutVersion}
        runtimeLabel={aboutRuntimeLabel ?? undefined}
        runtimeDetails={aboutRuntimeDetails}
        onClose={() => setIsAboutOpen(false)}
        onShowChangelog={onShowChangelog}
        onShowManual={onShowManual}
      />

      <MarkdownModal
        isOpen={isChangelogOpen}
        title="Changes"
        content={changelogContent}
        downloadHref="CHANGELOG.md"
        showTitle={false}
        onClose={onCloseChangelog}
      />

      <MarkdownModal
        isOpen={isManualOpen}
        title="Manual"
        content={manualContent}
        downloadHref="MANUAL.md"
        showTitle={false}
        onClose={onCloseManual}
      />

      <MidiModal
        isOpen={isMidiModalOpen}
        isSupported={isMidiSupported}
        accessError={midiAccessError}
        configuration={midiConfiguration}
        devices={midiDevices}
        inMonitor={midiInMonitor}
        outMonitor={midiOutMonitor}
        onSave={onSaveMidiConfiguration}
        onCancel={onCloseMidi}
        onClear={onClearMidiMonitors}
        onRescan={onRescanMidiDevices}
        onChangeConfig={onLiveMidiConfigurationChange}
        onCopySummary={setMidiCopySummary}
        onLoadError={setMidiLoadError}
        onSystemReset={onMidiSystemReset}
      />

      <DownloadModal
        isOpen={isDownloadOpen}
        onClose={() => setIsDownloadOpen(false)}
      />
    </>
  );
};

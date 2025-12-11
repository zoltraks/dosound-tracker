import React from 'react';
import { InformationModal, ConfirmationModal, TransposeModal, AboutModal, MarkdownModal, DownloadModal, InstrumentDeleteModal, InstrumentTypeWarningModal, MidiModal, InstrumentMidiModal, InstrumentColorModal } from '../modals';
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
  midiConfig: MidiConfig;
  midiDevices: {
    inputs: MidiDeviceInfo[];
    outputs: MidiDeviceInfo[];
  };
  midiInMonitor: MidiMonitorEntry[];
  midiOutMonitor: MidiMonitorEntry[];
  onSaveMidiConfig: (config: MidiConfig) => void;
  onCloseMidi: () => void;
  onClearMidiMonitors: () => void;
  onRescanMidiDevices: () => void;
  onLiveMidiConfigChange: (patch: Partial<MidiConfig>) => void;
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
  midiConfig,
  midiDevices,
  midiInMonitor,
  midiOutMonitor,
  onSaveMidiConfig,
  onCloseMidi,
  onClearMidiMonitors,
  onRescanMidiDevices,
  onLiveMidiConfigChange,
  setMidiCopySummary,
  setMidiLoadError,
  isDownloadOpen,
  setIsDownloadOpen,
  midiLoadError,
  midiCopySummary,
  onMidiSystemReset,
}) => {
  return (
    <>
      <InformationModal
        isOpen={!!songError}
        title="Song Load Error"
        message={songError}
        onClose={() => setSongError('')}
      />

      <InformationModal
        isOpen={!!instrumentError}
        title="Instrument Load Error"
        message={instrumentError}
        onClose={() => setInstrumentError('')}
      />

      <InformationModal
        isOpen={!!trackClipboardError}
        title="Track Clipboard Error"
        message={trackClipboardError}
        onClose={() => setTrackClipboardError('')}
      />

      <InformationModal
        isOpen={!!optimizeSummary}
        title="Optimization Summary"
        message={optimizeSummary}
        onClose={onCloseOptimizeSummary}
      />

      <InformationModal
        isOpen={!!soundExportSummary}
        title="Export Summary"
        message={soundExportSummary}
        onClose={onCloseSoundExportSummary}
      />

      <InformationModal
        isOpen={!!dumpExportSummary}
        title="Dump Export Summary"
        message={dumpExportSummary}
        onClose={onCloseDumpExportSummary}
      />

      <InformationModal
        isOpen={!!transposeSummary}
        title="Transpose Summary"
        message={transposeSummary}
        onClose={onCloseTransposeSummary}
      />

      <InformationModal
        isOpen={!!renumberSummary}
        title="Renumber Summary"
        message={renumberSummary}
        onClose={onCloseRenumberSummary}
      />

      <InformationModal
        isOpen={!!instrumentOperationSummary}
        title="Instrument Operation"
        message={instrumentOperationSummary}
        onClose={onCloseInstrumentOperationSummary}
      />

      <InformationModal
        isOpen={isDebugInfoOpen}
        title="Debug mode enabled"
        message={
          'Debug mode is now enabled.\n\n' +
          'In this mode the tracker will output additional logging to the browser console.\n' +
          'This extra logging may cause small delays or timing jitter in song playback due to performance overhead.\n\n' +
          'For normal composing and playback, you can turn debug mode off again.'
        }
        onClose={() => setIsDebugInfoOpen(false)}
      />

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
        title="Create new song?"
        message="Current song data will be lost.\n\nContinue?"
        onConfirm={onConfirmNewSong}
        onCancel={onCancelNewSong}
      />

      <ConfirmationModal
        isOpen={isOptimizeConfirmOpen}
        title="Optimize song?"
        message="Optimize song by removing unused patterns and instruments and trimming pattern data beyond the current length.\n\nContinue?"
        onConfirm={onConfirmOptimize}
        onCancel={onCancelOptimize}
      />

      <ConfirmationModal
        isOpen={isRenumberConfirmOpen}
        title="Renumber song?"
        message="Renumber all patterns according to their order of appearance in the playlist (then any hidden patterns), and renumber all instruments alphabetically by name.\n\nThis will update all references in the playlist and patterns.\n\nContinue?"
        onConfirm={onConfirmRenumber}
        onCancel={onCancelRenumber}
      />

      <ConfirmationModal
        isOpen={isResetConfirmOpen}
        title="Reset application?"
        message="All saved data will be permanently deleted and the application will reload to default state.\n\nThis action cannot be undone.\n\nContinue with reset?"
        onConfirm={onConfirmReset}
        onCancel={onCancelReset}
        confirmLabel="Reset"
      />

      <ConfirmationModal
        isOpen={isQuitConfirmOpen}
        title="Quit without saving?"
        message="Current song changes have not been saved.\n\nIf you quit now, any unsaved changes will be lost.\n\nDo you still want to quit?"
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
        config={midiConfig}
        devices={midiDevices}
        inMonitor={midiInMonitor}
        outMonitor={midiOutMonitor}
        onSave={onSaveMidiConfig}
        onCancel={onCloseMidi}
        onClear={onClearMidiMonitors}
        onRescan={onRescanMidiDevices}
        onChangeConfig={onLiveMidiConfigChange}
        onCopySummary={setMidiCopySummary}
        onLoadError={setMidiLoadError}
        onSystemReset={onMidiSystemReset}
      />

      <DownloadModal
        isOpen={isDownloadOpen}
        onClose={() => setIsDownloadOpen(false)}
      />

      <InformationModal
        isOpen={!!midiLoadError}
        title="MIDI Config Error"
        message={midiLoadError}
        onClose={() => setMidiLoadError('')}
      />

      <InformationModal
        isOpen={!!midiCopySummary}
        title="MIDI Monitor"
        message={midiCopySummary}
        onClose={() => setMidiCopySummary('')}
      />
    </>
  );
};

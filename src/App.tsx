/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { useKeyboardNavigation } from './hooks/keyboard/useKeyboardNavigation.ts';
import { useTheme } from './hooks/ui/useTheme.ts';
import { useDataManagement } from './hooks/song/useDataManagement.ts';
import { usePlaybackControls } from './hooks/playback/usePlaybackControls.ts';
import { useAudioSetup } from './hooks/audio/useAudioSetup.ts';
import { useModalManager } from './hooks/modal/useModalManager.ts';
import { useMidiHandling } from './hooks/midi/useMidiHandling.ts';
import { useMidiActions } from './hooks/midi/useMidiActions.ts';
import { useTrackOperations } from './hooks/song/useTrackOperations.ts';
import { usePasteTrackOptions } from './hooks/modal/usePasteTrackOptions.ts';
import { usePlaylistOperations } from './hooks/song/usePlaylistOperations.ts';
import { useScrollSync } from './hooks/ui/useScrollSync.ts';
import { useAppState } from './hooks/app/useAppState.ts';
import { useKeyboardShortcuts } from './hooks/keyboard/useKeyboardShortcuts.ts';
import { useMessageSystem } from './hooks/ui/useMessageSystem.ts';
import { useModalState } from './hooks/modal/useModalState.ts';
import { useInstrumentWarnings } from './hooks/instrument/useInstrumentWarnings.ts';
import { useInstrumentActions } from './hooks/instrument/useInstrumentActions.ts';
import { useDownloadAvailability } from './hooks/file/useDownloadAvailability.ts';
import { usePlaybackSimulation } from './hooks/playback/usePlaybackSimulation.ts';
import { useSequencerIntegration } from './hooks/sequencer/useSequencerIntegration.ts';
import { normalizeInstrumentId } from './utils/playback/playbackUtils.ts';
import { formatBaseKey, parseBaseKey } from './utils/song/songFormat.ts';
import { DEFAULT_SONG_CLOCK, DEFAULT_SONG_FRAME } from './constants/song.ts';
import type { Instrument, Pattern } from './synth/SoundDriver.ts';
import type { MidiConfiguration } from './hooks/midi/useMidi.ts';
import { HeaderPanel } from './components/HeaderPanel.tsx';
import { CommandPanel } from './components/CommandPanel.tsx';
import { ErrorBoundary } from './components/ErrorBoundary.tsx';
import { PianoKeyboard } from './components/PianoKeyboard.tsx';
import { AppLayout } from './components/AppLayout.tsx';
import { TrackerSection } from './components/TrackerSection.tsx';
import { EnvelopeSection } from './components/EnvelopeSection.tsx';
import { SongSection } from './components/SongSection.tsx';
import { FileInputs } from './components/FileInputs.tsx';
import { ModalManager } from './components/ModalManager.tsx';
import { useFileOperations } from './hooks/file/useFileOperations.ts';
import type { UiStore } from './hooks/ui/useUiStore.ts';
import { useUiStore } from './hooks/ui/useUiStore.ts';
import { useAppInfoDialogs } from './hooks/app/useAppInfoDialogs.ts';
import { useSongLifecycleDialogs } from './hooks/song/useSongLifecycleDialogs.ts';
import { useInstrumentFileLoading } from './hooks/instrument/useInstrumentFileLoading.ts';
import { useInstrumentDialogs } from './hooks/instrument/useInstrumentDialogs.ts';
import { useSongToolDialogs } from './hooks/song/useSongToolDialogs.ts';
import { useExportModal } from './hooks/modal/useExportModal.ts';
import { useTransposeDialog } from './hooks/modal/useTransposeDialog.ts';
import { useMidiDialog } from './hooks/midi/useMidiDialog.ts';
import { useResponsivePanels } from './hooks/ui/useResponsivePanels.ts';
import { useEditorPersistence } from './hooks/storage/useEditorPersistence.ts';
import { usePlaybackHandlers } from './hooks/playback/usePlaybackHandlers.ts';
import { useSongImportWarning } from './hooks/song/useSongImportWarning.ts';
import { useInstrumentOctaves } from './hooks/instrument/useInstrumentOctaves.ts';
import { useTrackFocus } from './hooks/ui/useTrackFocus.ts';
import { useAudioContextResume } from './hooks/audio/useAudioContextResume.ts';
import { useElectronCloseGuard } from './hooks/app/useElectronCloseGuard.ts';
import { useTrackPattern } from './hooks/song/useTrackPattern.ts';
import './App.css';

declare const __APP_VERSION__: string;
const APP_VERSION = __APP_VERSION__;

const App: React.FC = () => {
  const currentOctave = useUiStore((state: UiStore) => state.currentOctave);
  const sharedCurrentLine = useUiStore((state: UiStore) => state.sharedCurrentLine);
  const channelMutes = useUiStore((state: UiStore) => state.channelMutes);
  const setCurrentOctave = useUiStore((state: UiStore) => state.setCurrentOctave);
  const setSharedCurrentLine = useUiStore((state: UiStore) => state.setSharedCurrentLine);
  const setChannelMutes = useUiStore((state: UiStore) => state.setChannelMutes);
  const toggleChannelMute = useUiStore((state: UiStore) => state.toggleChannelMute);

  const {
    isNewSongConfirmOpen,
    setIsNewSongConfirmOpen,
    isAboutOpen,
    setIsAboutOpen,
    isChangelogOpen,
    setIsChangelogOpen,
    changelogContent,
    setChangelogContent,
    isManualOpen,
    setIsManualOpen,
    manualContent,
    setManualContent,
    isOptimizeConfirmOpen,
    setIsOptimizeConfirmOpen,
    isRenumberConfirmOpen,
    setIsRenumberConfirmOpen,
    isResetConfirmOpen,
    setIsResetConfirmOpen,
    isQuitConfirmOpen,
    setIsQuitConfirmOpen,
    optimizeSummary,
    setOptimizeSummary,
    renumberSummary,
    setRenumberSummary,
    isTransposeOpen,
    setIsTransposeOpen,
    transposeSummary,
    setTransposeSummary,
    instrumentOperationSummary,
    setInstrumentOperationSummary,
    midiLoadError,
    setMidiLoadError,
    midiCopySummary,
    setMidiCopySummary,
    isDownloadOpen,
    setIsDownloadOpen,
    isMidiModalOpen,
    setIsMidiModalOpen,
    isDebugInfoOpen,
    setIsDebugInfoOpen,
    isInstrumentDeleteOpen,
    setIsInstrumentDeleteOpen,
    instrumentDeleteUsage,
    setInstrumentDeleteUsage,
    isInstrumentMidiOpen,
    setIsInstrumentMidiOpen,
    isInstrumentColorOpen,
    setIsInstrumentColorOpen,
    isExportModalOpen,
    setIsExportModalOpen,
  } = useModalState();

  const {
    isInstrumentTypeWarningOpen,
    ignoreInstrumentTypeWarning,
    instrumentTypeWarningIgnoreChecked,
    pendingInstrumentTypeInfo,
    setInstrumentTypeWarningIgnoreChecked,
    openInstrumentTypeWarning,
    confirmInstrumentTypeWarning,
    cancelInstrumentTypeWarning,
  } = useInstrumentWarnings();
  const {
    isDebugMode,
    setIsDebugMode,
    exportType,
    setExportType,
    exportStrategy,
    setExportStrategy,
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
  } = useAppState();

  // Check if download files are available
  const hasDownloads = useDownloadAvailability();

  const {
    pasteTrackPendingMode,
    setPasteTrackPendingMode,
    isPasteTrackModalOpen,
    getPasteTrackMode,
    handleConfirmPasteTrackModal,
    handleCancelPasteTrackModal,
  } = usePasteTrackOptions();

  const { isDarkMode, toggleTheme } = useTheme();
  const {
    currentSong,
    currentInstrument,
    setCurrentInstrument,
    updateSong,
    updateInstrument,
    createNewSong,
    saveSong,
    createNewInstrument,
    saveInstrument,
    createNewPattern,
    fileInputRef,
    triggerFileLoad,
    loadSong,
    loadInstrument,
    instrumentError,
    setInstrumentError,
    songError,
    setSongError,
    optimizeSong,
    renumberSong,
    isSongDirty,
    loadSongFromText,
    mirrorRestoreNotice,
    pendingSongImport,
    confirmPendingSongImport,
    cancelPendingSongImport,
  } = useDataManagement();

  const {
    configurationWarningMessage,
    handleConfirmSongConfigurationWarning,
    handleCancelSongConfigurationWarning,
  } = useSongImportWarning({
    pendingSongImport,
    confirmPendingSongImport,
    cancelPendingSongImport,
  });

  const { instrumentOctaves, handleOctaveChange } = useInstrumentOctaves({
    currentInstrument,
    setCurrentOctave,
    updateInstrument,
  });

  const {
    soundExportSummary,
    dumpExportSummary,
    exportDataWithContext,
    exportBinWithContext,
    exportVgmWithContext,
    exportWavWithContext,
    exportDumpWithContext,
    handleCloseSoundExportSummary,
    handleCloseDumpExportSummary,
    exportMaxWithContext,
  } = useFileOperations({ song: currentSong, exportStrategy });

  const isNavigationSuspended =
    !!songError ||
    !!instrumentError ||
    !!transposeSummary ||
    !!optimizeSummary ||
    !!soundExportSummary ||
    !!dumpExportSummary ||
    !!renumberSummary ||
    !!instrumentOperationSummary ||
    !!midiLoadError ||
    !!midiCopySummary ||
    isAboutOpen ||
    isChangelogOpen ||
    isManualOpen ||
    isDownloadOpen ||
    isDebugInfoOpen ||
    isMidiModalOpen ||
    isTransposeOpen ||
    isOptimizeConfirmOpen ||
    isRenumberConfirmOpen ||
    isNewSongConfirmOpen ||
    isResetConfirmOpen ||
    isQuitConfirmOpen ||
    isInstrumentDeleteOpen ||
    isInstrumentTypeWarningOpen ||
    isInstrumentMidiOpen ||
    isInstrumentColorOpen ||
    isExportModalOpen ||
    isPasteTrackModalOpen ||
    !!pendingSongImport;

  const { activeSection, setActiveSection, setGlobalShortcut } =
    useKeyboardNavigation(isNavigationSuspended);

  const patternsById = useMemo(() => {
    const map = new Map<string, Pattern>();
    const patterns = currentSong.pattern;

    for (const pattern of patterns) {
      if (pattern && pattern.id) {
        map.set(pattern.id, pattern);
      }
    }
    return map;
  }, [currentSong.pattern]);

  const instrumentsById = useMemo(() => {
    const map = new Map<string, Instrument>();
    const instruments = currentSong.instrument;

    for (const instrument of instruments) {
      if (instrument && instrument.id) {
        map.set(instrument.id, instrument);
      }
    }
    return map;
  }, [currentSong.instrument]);
  const {
    sequencerState,
    stop,
    setCallback,
    setPosition,
    startPatternLoop,
    startSong,
    setPatternLoopMode,
  } = usePlaybackControls({ currentSong });

  useElectronCloseGuard();

  const { messages, currentMessageIndex, isNotesVisible, handleNotesClick } = useMessageSystem();

  const envelopeMessages = useMemo(
    () => (mirrorRestoreNotice ? [mirrorRestoreNotice, ...messages] : messages),
    [mirrorRestoreNotice, messages],
  );

  const { audioContext, ym2149Ref, ym2149 } = useAudioSetup(
    currentSong.clock ?? DEFAULT_SONG_CLOCK,
  );
  const previewTickIntervalMs = 1000 / (currentSong.frame ?? DEFAULT_SONG_FRAME);
  const playInstTimerRef = useRef<number | null>(null);
  const playInstStepRef = useRef<number>(0);

  const { isMobileViewport, isCommandPanelMobileCollapsed, setIsCommandPanelMobileCollapsed } =
    useResponsivePanels();

  const {
    lastTrackId,
    setLastTrackId,
    currentTrackColumn,
    setCurrentTrackColumn,
    trackFocusRevision,
    setTrackFocusRevision,
    instrumentPanelFocusRevision,
    setInstrumentPanelFocusRevision,
    trackBackgroundEnabled,
    handleToggleTrackBackground,
    targetTrackId,
    previewChannel,
  } = useTrackFocus({ activeSection });

  const { ensureAudioContextResumed } = useAudioContextResume({ audioContext });

  useEditorPersistence({
    channelMutes,
    instrumentOctaves,
    trackBackgroundEnabled,
    currentSong,
    currentInstrument,
    setLastTrackId,
    setActiveSection,
    setPosition,
    setSharedCurrentLine,
    setCurrentTrackColumn,
    setCurrentInstrument,
    activeSection,
    targetTrackId,
    sequencerIsPlaying: sequencerState.isPlaying,
    sequencerCurrentPattern: sequencerState.currentPattern,
    sharedCurrentLine,
    currentTrackColumn,
  });

  const [isLinePlaying, setIsLinePlaying] = useState(false);

  // MIDI helper ref so callbacks defined before useMidiHandling can safely
  // call instrument MIDI send/stop functions without referencing them before
  // their declaration.
  const midiHelpersRef = useRef<{
    sendInstrumentMidiNoteOn: (
      ymChannel: number,
      instrument: Instrument | undefined,
      note: string,
      octave: number,
      volumeFromStep?: number | null,
      velocityOverride?: number | null,
    ) => void;
    sendInstrumentMidiNoteOffForChannel: (ymChannel: number) => void;
  } | null>(null);

  const midiConfigurationRef = useRef<MidiConfiguration | null>(null);

  const playbackState = usePlaybackSimulation(ym2149Ref, midiHelpersRef);
  const { resetPlaybackState: handleStopPlayback, lastSequencerPositionRef } = playbackState;

  const { sequencerCallback } = useSequencerIntegration({
    currentSong,
    patternsById,
    instrumentsById,
    channelMutes,
    ym2149Ref,
    midiHelpersRef,
    playbackState,
    isDebugMode,
    setSharedCurrentLine,
    setIsLinePlaying,
    stop,
    setPosition,
    currentInstrument,
  });

  // Register sequencer callback
  useEffect(() => {
    setCallback(sequencerCallback);
  }, [setCallback, sequencerCallback]);

  const { getCurrentPatternForTrack, handlePatternChange } = useTrackPattern({
    currentSong,
    sequencerPatternIndex: sequencerState.currentPattern,
    updateSong,
  });

  const {
    handlePlaylistChange,
    handleCreatePatternAt,
    handleCreateNewTrack,
    handleAddLine,
    handleCloneLine,
    handleDeleteLine,
    handleDuplicateLine,
    handleDeleteTrack,
    clampedPlaybackPosition,
    handlePositionSelect,
  } = usePlaylistOperations({
    song: currentSong,
    targetTrackId,
    currentPatternIndex: sequencerState.currentPattern,
    createNewPattern,
    updateSong,
    setActiveSection,
    setSharedCurrentLine,
    setPosition,
  });

  const {
    aboutRuntimeLabel,
    aboutRuntimeDetails,
    handleShowAbout,
    handleConfirmQuit,
    handleCancelQuit,
    handleShowChangelog,
    handleCloseChangelog,
    handleShowManual,
    handleCloseManual,
  } = useAppInfoDialogs({
    setIsAboutOpen,
    setChangelogContent,
    setIsChangelogOpen,
    setManualContent,
    setIsManualOpen,
    setIsQuitConfirmOpen,
  });

  const {
    isDemoSongPickerOpen,
    setIsDemoSongPickerOpen,
    handleRequestNewSong,
    handleConfirmNewSong,
    handleCancelNewSong,
    handleRequestReset,
    handleConfirmReset,
    handleCancelReset,
    handleDemoSongClick,
    handlePickDemoSong,
  } = useSongLifecycleDialogs({
    createNewSong,
    setCurrentOctave,
    setChannelMutes,
    setPosition,
    setSharedCurrentLine,
    setActiveSection,
    setIsNewSongConfirmOpen,
    setIsResetConfirmOpen,
    isSongDirty,
    loadSongFromText,
    setSongError,
  });

  const {
    instrumentFileInputRef,
    isRepositoryInstrumentOpen,
    setIsRepositoryInstrumentOpen,
    handleLoadInstrumentClick,
    handleOpenRepositoryInstrumentPicker,
    handleInstrumentFileContent,
    handleConfirmInstrumentTypeWarning,
    handleCancelInstrumentTypeWarning,
    handlePickRepositoryInstrument,
  } = useInstrumentFileLoading({
    loadInstrument,
    setInstrumentError,
    setActiveSection,
    ignoreInstrumentTypeWarning,
    openInstrumentTypeWarning,
    confirmInstrumentTypeWarning,
    cancelInstrumentTypeWarning,
  });

  const {
    trackClipboardError,
    setTrackClipboardError,
    handleCopyTrack,
    handlePasteTrack,
    handleInsertStep,
    handleDeleteStep,
    applyTranspose,
  } = useTrackOperations({
    song: currentSong,
    activeSection,
    lastTrackId,
    getCurrentPatternForTrack,
    formatNoteKey: formatBaseKey,
    parseBaseKeyString: parseBaseKey,
    updateSong,
    sharedCurrentLine,
    sequencerPatternIndex: sequencerState.currentPattern,
    setActiveSection,
    setTrackFocusRevision,
    getPasteTrackMode,
  });

  const {
    handleRenameInstrument,
    handlePlayInstrument,
    handleCloneInstrument,
    handleDeleteInstrument,
    handleMoveInstrument,
    handleCancelInstrumentDelete,
    handleConfirmDeleteInstrumentAndNotes,
    handleConfirmDeleteInstrumentOnly,
  } = useInstrumentActions({
    currentSong,
    currentInstrument,
    updateSong,
    updateInstrument,
    setCurrentInstrument,
    activeSection,
    lastTrackId,
    setActiveSection,
    setInstrumentOperationSummary,
    instrumentDeleteUsage,
    setInstrumentDeleteUsage,
    setIsInstrumentDeleteOpen,
    normalizeInstrumentId,
    parseBaseKeyString: parseBaseKey,
    ym2149Ref,
    playInstTimerRef,
    playInstStepRef,
  });

  const {
    instrumentMidiTarget,
    instrumentColorTarget,
    handleInstrumentSelect,
    handleOpenInstrumentMidi,
    handleCloseInstrumentMidi,
    handleSaveInstrumentMidi,
    handleOpenInstrumentColor,
    handleCloseInstrumentColor,
    handleSaveInstrumentColor,
    handleClearInstrumentColor,
    handleChangeBaseKey,
  } = useInstrumentDialogs({
    currentSong,
    currentInstrument,
    updateSong,
    updateInstrument,
    setCurrentInstrument,
    setActiveSection,
    setInstrumentPanelFocusRevision,
    setIsInstrumentMidiOpen,
    setIsInstrumentColorOpen,
  });

  const {
    handleStop,
    handleStartSong,
    handleStartLinePlayback,
    handleStartLineFromBeginning,
    handleToggleLineFromCursor,
    handleToggleLineFromStart,
  } = usePlaybackHandlers({
    stop,
    startSong,
    startPatternLoop,
    setPatternLoopMode,
    setPosition,
    sequencerState,
    handleStopPlayback,
    lastSequencerPositionRef,
    playInstTimerRef,
    currentSong,
    sharedCurrentLine,
    setSharedCurrentLine,
    activeSection,
    lastTrackId,
    isLinePlaying,
    setIsLinePlaying,
  });

  useKeyboardShortcuts({
    setGlobalShortcut,
    handleStartSong,
    handleStartLineFromBeginning,
    handleStartLine: handleStartLinePlayback,
    handleStop,
  });

  const handleLineChange = useCallback((lineIndex: number) => {
    setSharedCurrentLine(lineIndex);
  }, []);
  const { handleMidiNoteEvent, handleHardStopLivePreview, handleRegisterTrackStopPreview } =
    useMidiActions({
      activeSection,
      lastTrackId,
      currentInstrument,
      currentSong,
      sharedCurrentLine,
      setSharedCurrentLine,
      getCurrentPatternForTrack,
      handlePatternChange,
      ym2149Ref,
      midiHelpersRef,
      midiConfigurationRef,
      parseBaseKeyString: parseBaseKey,
    });

  const {
    handleToggleDebugMode,
    handleOptimizeSong,
    handleConfirmOptimize,
    handleCancelOptimize,
    handleCloseOptimizeSummary,
    handleRenumberSong,
    handleConfirmRenumber,
    handleCancelRenumber,
    handleCloseRenumberSummary,
    handleCloseInstrumentOperationSummary,
  } = useSongToolDialogs({
    setIsDebugMode,
    setIsDebugInfoOpen,
    optimizeSong,
    renumberSong,
    setIsOptimizeConfirmOpen,
    setOptimizeSummary,
    setIsRenumberConfirmOpen,
    setRenumberSummary,
    setInstrumentOperationSummary,
  });

  const {
    pendingExportType,
    pendingExportStrategy,
    handleOpenExport,
    handleCancelExport,
    handleConfirmExport,
    handleExportTypeChange,
    handleExportStrategyChange,
    handleExportDumpFromModal,
    handleExportDataFromModal,
    handleExportBinFromModal,
    handleExportVgmFromModal,
    handleExportWavFromModal,
    handleExportMaxFromModal,
  } = useExportModal({
    exportType,
    setExportType,
    exportStrategy,
    setExportStrategy,
    setIsExportModalOpen,
    clampedPlaybackPosition,
    sharedCurrentLine,
    currentInstrument,
    exportDataWithContext,
    exportBinWithContext,
    exportVgmWithContext,
    exportWavWithContext,
    exportDumpWithContext,
    exportMaxWithContext,
  });

  const {
    handleOpenTranspose,
    handleCancelTranspose,
    handleConfirmTranspose,
    handleTransposeAmountChange,
    handleCloseTransposeSummary,
  } = useTransposeDialog({
    transposeScope,
    transposeTrackScope,
    transposeInstrumentScope,
    transposeAmount,
    transposeAmountInput,
    setTransposeAmount,
    setTransposeAmountInput,
    setIsTransposeOpen,
    setTransposeSummary,
    playlistLength: currentSong.line.length,
    currentPatternIndex: sequencerState.currentPattern,
    targetTrackId,
    currentInstrumentId: currentInstrument.id,
    applyTranspose,
  });

  const {
    isMidiSupported,
    midiAccessError,
    midiDevices,
    midiConfiguration,
    setMidiConfiguration,
    midiInMonitor,
    midiOutMonitor,
    clearMidiMonitors,
    refreshMidiDevices,
    previewInstrumentMidiNoteOn,
    previewInstrumentMidiNoteOff,
    midiInputEnabled,
    midiOutputEnabled,
    resetMidiProgramCache,
    sendSystemReset,
  } = useMidiHandling({
    onNoteEvent: handleMidiNoteEvent,
    monitorsEnabled: isDebugMode || isMidiModalOpen,
    midiHelpersRef,
    midiConfigurationRef,
  });

  const {
    handleLiveMidiConfigChange,
    handleShowMidi,
    handleCloseMidi,
    handleSaveMidiConfig,
    handleClearMidiMonitors,
    handleRescanMidiDevices,
    handleMidiSystemReset,
  } = useMidiDialog({
    midiConfiguration,
    setMidiConfiguration,
    setIsMidiModalOpen,
    resetMidiProgramCache,
    clearMidiMonitors,
    refreshMidiDevices,
    sendSystemReset,
  });

  const { handlePositionScroll } = useScrollSync(sharedCurrentLine);

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
    isPasteTrackOptionsOpen: isPasteTrackModalOpen,
    handleCancelPasteTrackOptions: handleCancelPasteTrackModal,
    handleConfirmPasteTrackOptions: handleConfirmPasteTrackModal,
  });

  return (
    <ErrorBoundary>
      <AppLayout
        isDarkMode={isDarkMode}
        header={
          <HeaderPanel
            title={currentSong.title}
            isDarkMode={isDarkMode}
            onToggleTheme={toggleTheme}
            currentOctave={currentOctave}
            onOctaveChange={handleOctaveChange}
            onShowAbout={handleShowAbout}
            activeSection={activeSection}
            setActiveSection={setActiveSection}
            ym2149={ym2149}
            currentInstrument={currentInstrument}
            previewChannel={previewChannel}
            tickIntervalMs={previewTickIntervalMs}
            hasDownloads={hasDownloads}
            onShowDownloads={() => setIsDownloadOpen(true)}
            onPreviewMidiNoteOn={previewInstrumentMidiNoteOn}
            onPreviewMidiNoteOff={previewInstrumentMidiNoteOff}
            onToggleCommandPanelMobile={() => {
              if (!isMobileViewport) {
                return;
              }
              setIsCommandPanelMobileCollapsed((prev) => !prev);
            }}
          />
        }
        commandPanel={
          <CommandPanel
            onNewSong={handleRequestNewSong}
            onLoadSong={triggerFileLoad}
            onSaveSong={saveSong}
            onOptimize={handleOptimizeSong}
            onRenumber={handleRenumberSong}
            onNewInstrument={createNewInstrument}
            onSaveInstrument={saveInstrument}
            onLoadInstrument={handleLoadInstrumentClick}
            onDeleteInstrument={handleDeleteInstrument}
            onCloneInstrument={handleCloneInstrument}
            onPlaySong={handleStartSong}
            onPlayLine={handleStartLinePlayback}
            onStop={handleStop}
            onOpenExport={handleOpenExport}
            onAddLine={handleAddLine}
            onDeleteLine={handleDeleteLine}
            onCloneLine={handleCloneLine}
            onDuplicateLine={handleDuplicateLine}
            onInsertStep={handleInsertStep}
            onDeleteStep={handleDeleteStep}
            onReset={handleRequestReset}
            isDebugMode={isDebugMode}
            onToggleDebug={handleToggleDebugMode}
            isPlaying={sequencerState.isPlaying}
            isLinePlaying={isLinePlaying}
            onPlayInstrument={handlePlayInstrument}
            onCopyTrack={handleCopyTrack}
            onPasteTrack={handlePasteTrack}
            onNewTrack={handleCreateNewTrack}
            onDeleteTrack={handleDeleteTrack}
            activeSection={activeSection}
            setActiveSection={setActiveSection}
            onTranspose={handleOpenTranspose}
            midiInputEnabled={midiInputEnabled}
            midiOutputEnabled={midiOutputEnabled}
            onShowMidi={handleShowMidi}
            onPickInstrument={handleOpenRepositoryInstrumentPicker}
            onDemoSong={handleDemoSongClick}
            isMobileCollapsed={isMobileViewport && isCommandPanelMobileCollapsed}
          />
        }
        trackerSection={
          <TrackerSection
            song={currentSong}
            sharedCurrentLine={sharedCurrentLine}
            onLineChange={handleLineChange}
            onPositionScroll={handlePositionScroll}
            activeSection={activeSection}
            setActiveSection={setActiveSection}
            currentOctave={currentOctave}
            getCurrentPatternForTrack={getCurrentPatternForTrack}
            onPatternChange={handlePatternChange}
            ym2149={ym2149}
            currentInstrument={currentInstrument}
            targetTrackId={targetTrackId}
            onToggleLineFromCursor={handleToggleLineFromCursor}
            onToggleLineFromStart={handleToggleLineFromStart}
            currentTrackColumn={currentTrackColumn}
            setCurrentTrackColumn={setCurrentTrackColumn}
            trackFocusRevision={trackFocusRevision}
            onPreviewMidiNoteOn={previewInstrumentMidiNoteOn}
            onPreviewMidiNoteOff={previewInstrumentMidiNoteOff}
            onHardStopLivePreview={handleHardStopLivePreview}
            onRegisterTrackStopPreview={handleRegisterTrackStopPreview}
            trackBackgroundEnabled={trackBackgroundEnabled}
            onToggleTrackBackground={handleToggleTrackBackground}
            isDarkMode={isDarkMode}
          />
        }
        envelopeSection={
          <EnvelopeSection
            activeSection={activeSection}
            setActiveSection={setActiveSection}
            currentInstrument={currentInstrument}
            updateInstrument={updateInstrument}
            messages={envelopeMessages}
            currentMessageIndex={currentMessageIndex}
            isNotesVisible={isNotesVisible}
            onNotesClick={handleNotesClick}
          />
        }
        songSection={
          <SongSection
            song={currentSong}
            activeSection={activeSection}
            setActiveSection={setActiveSection}
            updateSong={updateSong}
            clampedPlaybackPosition={clampedPlaybackPosition}
            onPositionSelect={handlePositionSelect}
            onPlaylistChange={handlePlaylistChange}
            onCreatePatternAt={handleCreatePatternAt}
            targetTrackId={targetTrackId}
            currentInstrument={currentInstrument}
            onSelectInstrument={handleInstrumentSelect}
            onRenameInstrument={handleRenameInstrument}
            onMoveInstrument={handleMoveInstrument}
            onOpenInstrumentMidi={handleOpenInstrumentMidi}
            onOpenInstrumentColor={handleOpenInstrumentColor}
            instrumentPanelFocusRevision={instrumentPanelFocusRevision}
            ym2149={ym2149}
            channelMutes={channelMutes}
            onToggleChannelMute={toggleChannelMute}
          />
        }
        pianoKeyboard={
          <PianoKeyboard
            activeSection={activeSection}
            setActiveSection={setActiveSection}
            currentOctave={currentOctave}
            onOctaveChange={handleOctaveChange}
            ym2149={ym2149}
            currentInstrument={currentInstrument}
            previewChannel={previewChannel}
            tickIntervalMs={previewTickIntervalMs}
            onChangeBaseKey={handleChangeBaseKey}
            onPreviewMidiNoteOn={previewInstrumentMidiNoteOn}
            onPreviewMidiNoteOff={previewInstrumentMidiNoteOff}
            ensureAudioContextResumed={ensureAudioContextResumed}
          />
        }
        fileInputs={
          <FileInputs
            fileInputRef={fileInputRef}
            instrumentFileInputRef={instrumentFileInputRef}
            onLoadSong={loadSong}
            onLoadInstrument={handleInstrumentFileContent}
            setPosition={setPosition}
            setSharedCurrentLine={setSharedCurrentLine}
            setActiveSection={setActiveSection}
            setChannelMutes={setChannelMutes}
          />
        }
        modals={
          <ModalManager
            // Error and summary states
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
            aboutVersion={APP_VERSION}
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
            onExportDumpFromModal={handleExportDumpFromModal}
            onExportDataFromModal={handleExportDataFromModal}
            onExportBinFromModal={handleExportBinFromModal}
            onExportVgmFromModal={handleExportVgmFromModal}
            onExportMaxFromModal={handleExportMaxFromModal}
            onExportWavFromModal={handleExportWavFromModal}
            onConfirmExport={handleConfirmExport}
            onCancelExport={handleCancelExport}
            isPasteTrackModalOpen={isPasteTrackModalOpen}
            pasteTrackPendingMode={pasteTrackPendingMode}
            setPasteTrackPendingMode={setPasteTrackPendingMode}
            onConfirmPasteTrackModal={handleConfirmPasteTrackModal}
            onCancelPasteTrackModal={handleCancelPasteTrackModal}
          />
        }
      />
    </ErrorBoundary>
  );
};

export default App;

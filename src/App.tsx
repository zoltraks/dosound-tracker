/* eslint-disable react-hooks/exhaustive-deps */
import React, { useCallback, useMemo, useState } from 'react';
import { useKeyboardNavigation } from './hooks/keyboard/useKeyboardNavigation.ts';
import { useNavigationSuspension } from './hooks/keyboard/useNavigationSuspension.ts';
import { useTheme } from './hooks/ui/useTheme.ts';
import { useTextScale } from './hooks/ui/useTextScale.ts';
import { useDataManagement } from './hooks/song/useDataManagement.ts';
import { usePlaybackControls } from './hooks/playback/usePlaybackControls.ts';
import { useAudioSetup } from './hooks/audio/useAudioSetup.ts';
import { useMidiHandling } from './hooks/midi/useMidiHandling.ts';
import { useMidiActions } from './hooks/midi/useMidiActions.ts';
import { useTrackOperations } from './hooks/song/useTrackOperations.ts';
import { usePasteTrackOptions } from './hooks/modal/usePasteTrackOptions.ts';
import { useSettingsSession } from './hooks/modal/useSettingsSession.ts';
import { usePlaylistOperations } from './hooks/song/usePlaylistOperations.ts';
import { useScrollSync } from './hooks/ui/useScrollSync.ts';
import { useAppState } from './hooks/app/useAppState.ts';
import { useKeyboardShortcuts } from './hooks/keyboard/useKeyboardShortcuts.ts';
import { useMessageSystem } from './hooks/ui/useMessageSystem.ts';
import { useModalState } from './hooks/modal/useModalState.ts';
import { loadSoundEngineId } from './utils/storage/soundEngine.ts';
import type { SoundEngineId } from './constants/sound.ts';
import { useInstrumentWarnings } from './hooks/instrument/useInstrumentWarnings.ts';
import { useInstrumentActions } from './hooks/instrument/useInstrumentActions.ts';
import { useDownloadAvailability } from './hooks/file/useDownloadAvailability.ts';
import { usePlaybackBridge } from './hooks/playback/usePlaybackBridge.ts';
import { normalizeInstrumentId } from './utils/instrument/instrumentSelection.ts';
import { formatBaseKey, parseBaseKey } from './utils/song/songFormat.ts';
import { DEFAULT_SONG_CHIP, DEFAULT_SONG_CLOCK, DEFAULT_SONG_FRAME } from './constants/song.ts';
import { HeaderPanel } from './components/HeaderPanel.tsx';
import { CommandPanel } from './components/CommandPanel.tsx';
import { ErrorBoundary } from './components/ErrorBoundary.tsx';
import { PianoKeyboard } from './components/PianoKeyboard.tsx';
import { AppLayout } from './components/AppLayout.tsx';
import { TrackerSection } from './components/TrackerSection.tsx';
import { EnvelopeSection } from './components/EnvelopeSection.tsx';
import { SongSection } from './components/SongSection.tsx';
import { FileInputs } from './components/FileInputs.tsx';
import { useAppModals } from './hooks/modal/useAppModals.tsx';
import { useFileOperations } from './hooks/file/useFileOperations.ts';
import { useAppUiState } from './hooks/ui/useAppUiState.ts';
import { useAppInfoDialogs } from './hooks/app/useAppInfoDialogs.ts';
import { useStartupRestore } from './hooks/app/useStartupRestore.ts';
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
import { useAudioContextPlaybackSync } from './hooks/audio/useAudioContextPlaybackSync.ts';
import { useElectronCloseGuard } from './hooks/app/useElectronCloseGuard.ts';
import { useTrackPattern } from './hooks/song/useTrackPattern.ts';
import { useChannelPans } from './hooks/song/useChannelPans.ts';
import './App.css';

declare const __APP_VERSION__: string;
const APP_VERSION = __APP_VERSION__;

const App: React.FC = () => {
  const {
    currentOctave,
    sharedCurrentLine,
    channelMutes,
    setCurrentOctave,
    setSharedCurrentLine,
    setChannelMutes,
    toggleChannelMute,
  } = useAppUiState();

  const modalState = useModalState();
  const {
    setIsNewSongConfirmOpen,
    setIsAboutOpen,
    setIsChangelogOpen,
    setChangelogContent,
    setIsManualOpen,
    setManualContent,
    setIsOptimizeConfirmOpen,
    setIsRenumberConfirmOpen,
    setIsResetConfirmOpen,
    setIsQuitConfirmOpen,
    setOptimizeSummary,
    setRenumberSummary,
    setIsTransposeOpen,
    setTransposeSummary,
    setInstrumentOperationSummary,
    setIsDownloadOpen,
    isMidiModalOpen,
    setIsMidiModalOpen,
    setIsDebugInfoOpen,
    setIsInstrumentDeleteOpen,
    instrumentDeleteUsage,
    setInstrumentDeleteUsage,
    setIsInstrumentMidiOpen,
    setIsInstrumentColorOpen,
    setIsExportModalOpen,
  } = modalState;

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

  const hasDownloads = useDownloadAvailability();

  const {
    pasteTrackMode,
    setPasteTrackMode,
    pasteTrackPendingMode,
    setPasteTrackPendingMode,
    isPasteTrackModalOpen,
    getPasteTrackMode,
    handleConfirmPasteTrackModal,
    handleCancelPasteTrackModal,
  } = usePasteTrackOptions();

  const { theme, setTheme, toggleTheme } = useTheme();
  const { textScale, setTextScale } = useTextScale();
  const isDarkMode = theme !== 'light';
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
    undo,
    redo,
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
    exportMidiWithContext,
    exportModWithContext,
  } = useFileOperations({ song: currentSong, exportStrategy });

  const isNavigationSuspended = useNavigationSuspension({
    modalState,
    songError,
    instrumentError,
    soundExportSummary,
    dumpExportSummary,
    isInstrumentTypeWarningOpen,
    isPasteTrackModalOpen,
    pendingSongImport,
  });

  const { activeSection, setActiveSection, setGlobalShortcut } =
    useKeyboardNavigation(isNavigationSuspended);

  const [soundEngineId, setSoundEngineId] = useState<SoundEngineId>(() => loadSoundEngineId());
  const { channelPans } = useChannelPans({ stereo: currentSong.stereo });
  const { audioContext, ym2149Ref, ym2149, waitForEngine, playTestTone } = useAudioSetup(
    currentSong.clock ?? DEFAULT_SONG_CLOCK,
    soundEngineId,
    channelPans,
    currentSong.chip ?? DEFAULT_SONG_CHIP,
  );

  const {
    sequencerState,
    stop,
    setCallback,
    setPosition,
    startPatternLoop,
    startSong,
    setPatternLoopMode,
  } = usePlaybackControls({ currentSong, audioContext });

  useElectronCloseGuard({ isSongDirty, onQuitRequested: setIsQuitConfirmOpen });

  const { messages, currentMessageIndex, isNotesVisible, handleNotesClick } = useMessageSystem();

  const envelopeMessages = useMemo(
    () => (mirrorRestoreNotice ? [mirrorRestoreNotice, ...messages] : messages),
    [mirrorRestoreNotice, messages],
  );

  const previewTickIntervalMs = 1000 / (currentSong.frame ?? DEFAULT_SONG_FRAME);

  useAudioContextPlaybackSync({
    audioContext,
    sequencerState,
    stop,
    startSong,
    startPatternLoop,
  });

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
    setTrackBackgroundEnabled,
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

  const {
    isLinePlaying,
    setIsLinePlaying,
    midiHelpersRef,
    midiConfigurationRef,
    handleStopPlayback,
    lastSequencerPositionRef,
  } = usePlaybackBridge({
    currentSong,
    channelMutes,
    ym2149Ref,
    isDebugMode,
    setSharedCurrentLine,
    stop,
    setPosition,
    currentInstrument,
    setCallback,
  });

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

  useStartupRestore({
    modalState,
    sharedCurrentLine,
    handleShowAbout,
    handleShowChangelog,
    handleShowManual,
    playTestTone,
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
    stopInstrumentPreview,
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
    stopInstrumentPreview,
    currentSong,
    sharedCurrentLine,
    setSharedCurrentLine,
    activeSection,
    lastTrackId,
    isLinePlaying,
    setIsLinePlaying,
    ensureAudioContextResumed,
    waitForEngine,
  });

  useKeyboardShortcuts({
    setGlobalShortcut,
    handleStartSong,
    handleStartLineFromBeginning,
    handleStartLine: handleStartLinePlayback,
    handleStop,
    handleNewSong: handleRequestNewSong,
    handleLoadSong: triggerFileLoad,
    handleSaveSong: saveSong,
    handleNewInstrument: createNewInstrument,
    handleUndo: undo,
    handleRedo: redo,
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
    handleExportModFromModal,
    handleExportMidiFromModal,
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
    exportMidiWithContext,
    exportModWithContext,
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

  const {
    settingsCategory,
    setSettingsCategory,
    settingsDraft,
    setSettingsDraft,
    confirmingReset,
    setConfirmingReset,
    recordFocus,
    recordPaneScroll,
    handleCommitSettings,
    handleCancelSettings,
  } = useSettingsSession({
    isSettingsOpen: modalState.isSettingsOpen,
    setIsSettingsOpen: modalState.setIsSettingsOpen,
    theme,
    setTheme,
    textScale,
    setTextScale,
    trackBackgroundEnabled,
    setTrackBackgroundEnabled,
    pasteTrackMode,
    setPasteTrackMode,
    soundEngineId,
    setSoundEngineId,
  });

  const modals = useAppModals({
    modalState,
    aboutVersion: APP_VERSION,
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
    handleExportDumpFromModal,
    handleExportDataFromModal,
    handleExportBinFromModal,
    handleExportVgmFromModal,
    handleExportMaxFromModal,
    handleExportWavFromModal,
    handleExportModFromModal,
    handleExportMidiFromModal,
    handleConfirmExport,
    handleCancelExport,
    isPasteTrackModalOpen,
    pasteTrackPendingMode,
    setPasteTrackPendingMode,
    handleConfirmPasteTrackModal,
    handleCancelPasteTrackModal,
    settingsCategory,
    settingsDraft,
    settingsConfirmingReset: confirmingReset,
    onSettingsCategoryChange: setSettingsCategory,
    onSettingsDraftChange: setSettingsDraft,
    onSettingsConfirmingResetChange: setConfirmingReset,
    onSettingsSessionFocus: recordFocus,
    onSettingsPaneScroll: recordPaneScroll,
    handleCommitSettings,
    handleCancelSettings,
  });

  return (
    <ErrorBoundary>
      <AppLayout
        theme={theme}
        textScale={textScale}
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
            onShowSettings={() => modalState.setIsSettingsOpen(true)}
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
        modals={modals}
      />
    </ErrorBoundary>
  );
};

export default App;

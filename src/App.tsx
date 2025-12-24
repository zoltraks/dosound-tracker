/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { useKeyboardNavigation } from './hooks/useKeyboardNavigation';
import { useTheme } from './hooks/useTheme';
import { useDataManagement } from './hooks/useDataManagement';
import { usePlaybackControls } from './hooks/usePlaybackControls';
import { useAudioSetup } from './hooks/useAudioSetup';
import { useModalManager } from './hooks/useModalManager';
import { useMidiHandling } from './hooks/useMidiHandling';
import { useMidiActions } from './hooks/useMidiActions';
import { useTrackOperations, type TrackPasteMode } from './hooks/useTrackOperations';
import { usePlaylistOperations } from './hooks/usePlaylistOperations';
import { useScrollSync } from './hooks/useScrollSync';
import { useAppState } from './hooks/useAppState';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { useMessageSystem } from './hooks/useMessageSystem';
import { useModalState } from './hooks/useModalState';
import { useInstrumentWarnings } from './hooks/useInstrumentWarnings';
import { useInstrumentActions } from './hooks/useInstrumentActions';
import { useDownloadAvailability } from './hooks/useDownloadAvailability';
import { usePlaybackSimulation } from './hooks/usePlaybackSimulation';
import { useSequencerIntegration } from './hooks/useSequencerIntegration';
import { normalizeInstrumentId } from './utils/playbackUtils';
import { SUPPORTED_SONG_CHIPS, SUPPORTED_SONG_FRAMES } from './constants/song';
import type { Instrument, Pattern } from './synth/SoundDriver';
import type { MidiConfiguration } from './hooks/useMidi';
import { PATTERN_LENGTH, MIN_OCTAVE, MAX_OCTAVE, DEFAULT_OCTAVE } from './constants/music';
import yaml from 'js-yaml';
import { HeaderPanel } from './components/HeaderPanel';
import { CommandPanel } from './components/CommandPanel';
import { ErrorBoundary } from './components/ErrorBoundary';
import { PianoKeyboard } from './components/PianoKeyboard';
import { AppLayout } from './components/AppLayout';
import { TrackerSection } from './components/TrackerSection';
import { EnvelopeSection } from './components/EnvelopeSection';
import { SongSection } from './components/SongSection';
import { FileInputs } from './components/FileInputs';
import { ModalManager } from './components/ModalManager';
import { useFileOperations } from './hooks/useFileOperations';
import type { UiStore } from './stores/uiStore';
import { useUiStore } from './stores/uiStore';
import type { ExportType, ExportStrategy } from './constants/export';
import './App.css';
import { logger } from './utils/logger';

declare const __APP_VERSION__: string;
const APP_VERSION = __APP_VERSION__;

type ElectronApi = {
  onAppCloseRequested?: (handler: () => void) => void;
  removeAppCloseRequestedListener?: (handler: () => void) => void;
  confirmAppClose?: () => void;
  cancelAppClose?: () => void;
  getRuntimeInfo?: () => {
    runtime?: string;
    electron?: string;
    node?: string;
    chrome?: string;
  } | null;
};

type ExtendedWindow = Window & {
  electronAPI?: ElectronApi;
  __dosoundTrackerIsResetting?: boolean;
};

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
  const [instrumentMidiTarget, setInstrumentMidiTarget] = useState<Instrument | null>(null);
  const [instrumentColorTarget, setInstrumentColorTarget] = useState<Instrument | null>(null);

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

  const [pendingExportType, setPendingExportType] = useState<ExportType>(exportType);
  const [pendingExportStrategy, setPendingExportStrategy] = useState<ExportStrategy>(exportStrategy);

  const [instrumentOctaves, setInstrumentOctaves] = useState<Record<string, number>>(() => {
    try {
      const stored = localStorage.getItem('dosound-tracker-instrument-octaves');
      if (!stored) return {};
      const parsed = JSON.parse(stored);
      if (parsed && typeof parsed === 'object') {
        return parsed as Record<string, number>;
      }
    } catch {
      // ignore
    }
    return {};
  });

  const [pasteTrackMode, setPasteTrackMode] = useState<TrackPasteMode>(() => {
    try {
      const stored = localStorage.getItem('dosound-tracker-paste-track-mode');
      if (
        stored === 'replace' ||
        stored === 'overwriteAll' ||
        stored === 'overwriteEmpty'
      ) {
        return stored as TrackPasteMode;
      }
    } catch {
      // ignore
    }
    return 'replace';
  });
  const [pasteTrackPendingMode, setPasteTrackPendingMode] = useState<TrackPasteMode>(pasteTrackMode);
  const [isPasteTrackModalOpen, setIsPasteTrackModalOpen] = useState(false);
  const pasteTrackModalResolveRef = useRef<((mode: TrackPasteMode | null) => void) | null>(null);

  const [aboutRuntimeLabel, setAboutRuntimeLabel] = useState<string | null>(null);
  const [aboutRuntimeDetails, setAboutRuntimeDetails] = useState<string[]>([]);

  const [trackBackgroundEnabled, setTrackBackgroundEnabled] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem('dosound-tracker-track-background-enabled');
      if (stored === '0' || stored === '1') {
        return stored === '1';
      }
    } catch {
      // ignore
    }
    // Default: enabled (use per-track backgrounds)
    return true;
  });

  useEffect(() => {
    try {
      localStorage.setItem('dosound-tracker-paste-track-mode', pasteTrackMode);
    } catch {
      // ignore
    }
  }, [pasteTrackMode]);

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
    pendingSongImport,
    confirmPendingSongImport,
    cancelPendingSongImport,
  } = useDataManagement();

  const configurationWarningMessage = useMemo(() => {
    if (!pendingSongImport) {
      return '';
    }

    const warnings: string[] = [];
    const { metadata } = pendingSongImport;

    if (metadata.hasChipField && !metadata.isChipSupported) {
      const provided = metadata.providedChipValue ?? metadata.normalizedChip;
      warnings.push(
        `Chip value "${String(provided)}" is not supported.\n\nSupported chips: ${SUPPORTED_SONG_CHIPS.join(', ')}.`,
      );
    }

    if (metadata.hasFrameField && !metadata.isFrameSupported) {
      const provided = metadata.providedFrameValue ?? metadata.normalizedFrame;
      warnings.push(
        `Frame value "${String(provided)}" is not supported.\n\nSupported frame rates: ${SUPPORTED_SONG_FRAMES.join(', ')}.`,
      );
    }

    if (warnings.length === 0) {
      return '';
    }

    return `${warnings.join('\n\n')}\n\nLoad the song anyway?`;
  }, [pendingSongImport]);

  const handleConfirmSongConfigurationWarning = useCallback(() => {
    confirmPendingSongImport();
  }, [confirmPendingSongImport]);

  const handleCancelSongConfigurationWarning = useCallback(() => {
    cancelPendingSongImport();
  }, [cancelPendingSongImport]);

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

  const { activeSection, setActiveSection, setGlobalShortcut } = useKeyboardNavigation(isNavigationSuspended);

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

  useEffect(() => {
    try {
      localStorage.setItem('dosound-tracker-eq-mutes', JSON.stringify(channelMutes));
    } catch {
      // ignore
    }
  }, [channelMutes]);

  useEffect(() => {
    try {
      localStorage.setItem('dosound-tracker-instrument-octaves', JSON.stringify(instrumentOctaves));
    } catch {
      // ignore
    }
  }, [instrumentOctaves]);

  useEffect(() => {
    try {
      localStorage.setItem('dosound-tracker-track-background-enabled', trackBackgroundEnabled ? '1' : '0');
    } catch {
      // ignore
    }
  }, [trackBackgroundEnabled]);

  useEffect(() => {
    const id = currentInstrument?.id;
    if (!id) return;

    const instOctave = currentInstrument.octave;
    if (typeof instOctave === 'number' && Number.isFinite(instOctave)) {
      const clamped = Math.max(MIN_OCTAVE, Math.min(MAX_OCTAVE, Math.floor(instOctave)));
      setCurrentOctave(clamped);
      return;
    }

    const storedOctave = instrumentOctaves[id];
    if (typeof storedOctave === 'number' && Number.isFinite(storedOctave)) {
      const clamped = Math.max(MIN_OCTAVE, Math.min(MAX_OCTAVE, Math.floor(storedOctave)));
      setCurrentOctave(clamped);
    } else {
      setCurrentOctave(DEFAULT_OCTAVE);
    }
  }, [currentInstrument, instrumentOctaves]);

  // Electron window-close interception: ask React whether to quit when song is dirty.
  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const extWindow = window as ExtendedWindow;
    const api = extWindow.electronAPI;
    if (!api || !api.onAppCloseRequested) {
      return;
    }

    const handler = () => {
      if (api.confirmAppClose) {
        api.confirmAppClose();
      }
    };

    api.onAppCloseRequested(handler);
    return () => {
      if (api.removeAppCloseRequestedListener) {
        api.removeAppCloseRequestedListener(handler);
      }
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const extWindow = window as ExtendedWindow;
    const api = extWindow.electronAPI;

    if (api && typeof api.getRuntimeInfo === 'function') {
      try {
        const info = api.getRuntimeInfo() || {};
        const details: string[] = [];

        if (info.electron) {
          details.push(`Electron ${info.electron}`);
        }
        if (info.chrome) {
          details.push(`Chromium ${info.chrome}`);
        }
        if (info.node) {
          details.push(`Node.js ${info.node}`);
        }

        if (details.length > 0) {
          setAboutRuntimeLabel('Runtime');
          setAboutRuntimeDetails(details);
          return;
        }
      } catch (error) {
        logger.error('Error getting runtime info', error);
      }
    }

    try {
      const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';
      const trimmed = ua.trim();
      if (trimmed) {
        setAboutRuntimeLabel('Runtime');
        setAboutRuntimeDetails([trimmed]);
      }
    } catch (error) {
      logger.error('Error getting user agent', error);
    }
  }, []);

  const { messages, currentMessageIndex, isNotesVisible, handleNotesClick } = useMessageSystem();

  const { audioContext, ym2149Ref, ym2149 } = useAudioSetup();
  const instrumentFileInputRef = useRef<HTMLInputElement | null>(null);
  const playInstTimerRef = useRef<number | null>(null);
  const playInstStepRef = useRef<number>(0);

  const patternReturnPositionRef = useRef<{ pattern: number; line: number } | null>(null);

  const [lastTrackId, setLastTrackId] = useState<'A' | 'B' | 'C'>('A');
  const [currentTrackColumn, setCurrentTrackColumn] = useState<'note' | 'volume'>('note');
  const [trackFocusRevision, setTrackFocusRevision] = useState(0);
  const [instrumentPanelFocusRevision, setInstrumentPanelFocusRevision] = useState(0);
  const [isMobileViewport, setIsMobileViewport] = useState(false);
  const [isCommandPanelMobileCollapsed, setIsCommandPanelMobileCollapsed] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const computeIsMobile = () => window.innerWidth <= 1100 || window.innerHeight <= 700;
    const initialIsMobile = computeIsMobile();
    setIsMobileViewport(initialIsMobile);

    const handleResize = () => {
      const nextIsMobile = computeIsMobile();
      setIsMobileViewport(nextIsMobile);
      if (!nextIsMobile) {
        setIsCommandPanelMobileCollapsed(false);
      }
    };

    window.addEventListener('resize', handleResize);

    if (!initialIsMobile) {
      setIsCommandPanelMobileCollapsed(false);
      return () => window.removeEventListener('resize', handleResize);
    }

    try {
      const stored = localStorage.getItem('dosound-tracker-command-panel-mobile');
      if (stored === 'collapsed') {
        setIsCommandPanelMobileCollapsed(true);
        return () => window.removeEventListener('resize', handleResize);
      }
      if (stored === 'expanded') {
        setIsCommandPanelMobileCollapsed(false);
        return () => window.removeEventListener('resize', handleResize);
      }
    } catch {
      // ignore
    }

    setIsCommandPanelMobileCollapsed(true);

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (!isMobileViewport) {
      return;
    }

    try {
      localStorage.setItem(
        'dosound-tracker-command-panel-mobile',
        isCommandPanelMobileCollapsed ? 'collapsed' : 'expanded'
      );
    } catch {
      // ignore
    }
  }, [isCommandPanelMobileCollapsed, isMobileViewport]);

  const ensureAudioContextResumed = useCallback(() => {
    if (!audioContext) {
      return Promise.resolve();
    }

    if (audioContext.state === 'suspended') {
      return audioContext
        .resume()
        .then(() => {
          // AudioContext resumed; piano preview notes can now play immediately.
        })
        .catch((error: unknown) => {
          logger.error('AudioContext resume failed in ensureAudioContextResumed', error);
        });
    }

    return Promise.resolve();
  }, [audioContext]);

  useEffect(() => {
    if (activeSection === 'trackA') {
      setLastTrackId('A');
    } else if (activeSection === 'trackB') {
      setLastTrackId('B');
    } else if (activeSection === 'trackC') {
      setLastTrackId('C');
    }
  }, [activeSection]);

  const targetTrackId = useMemo<'A' | 'B' | 'C'>(() => {
    if (activeSection === 'trackA') return 'A';
    if (activeSection === 'trackB') return 'B';
    if (activeSection === 'trackC') return 'C';
    return lastTrackId;
  }, [activeSection, lastTrackId]);

  // Track line playback loop state (previously pattern playback state)
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
      velocityOverride?: number | null
    ) => void;
    sendInstrumentMidiNoteOffForChannel: (ymChannel: number) => void;
  } | null>(null);

  const midiConfigurationRef = useRef<MidiConfiguration | null>(null);

  const playbackState = usePlaybackSimulation(ym2149Ref, midiHelpersRef);
  const {
    resetPlaybackState: handleStopPlayback,
    lastSequencerPositionRef,
  } = playbackState;

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

  // Removed normalizeInstrumentId as it's imported from utils/playbackUtils
  // Removed instrumentLookupByNormalizedId as it's handled internally in useSequencerIntegration or not needed
  // Removed updateChannelWithInstrument as it's moved to utils/playbackUtils

  // Handle stop playback with silence
  const handlePatternChange = useCallback((newPattern: Pattern) => {
    if (!newPattern || !newPattern.id) {
      logger.error('No pattern ID provided to handlePatternChange');
      return;
    }
    
    // Find and update the pattern by ID
    const updatedPatterns = [...currentSong.pattern];
    const patternIndex = updatedPatterns.findIndex(p => p.id === newPattern.id);
    
    if (patternIndex === -1) {
      logger.error('Pattern not found with ID', newPattern.id);
      return;
    }
    
    updatedPatterns[patternIndex] = newPattern;
    updateSong({ pattern: updatedPatterns });
  }, [currentSong.pattern, updateSong]);


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

  const [pendingNewSongAction, setPendingNewSongAction] = useState<'new-song' | 'demo-song'>('new-song');

  const [isRepositoryInstrumentOpen, setIsRepositoryInstrumentOpen] = useState(false);
  const [isDemoSongPickerOpen, setIsDemoSongPickerOpen] = useState(false);

  const handleShowAbout = useCallback(() => {
    setIsAboutOpen(true);
  }, []);

  const handleRequestNewSong = useCallback(() => {
    setPendingNewSongAction('new-song');
    setIsNewSongConfirmOpen(true);
  }, []);

  const openDemoSongPicker = useCallback(() => {
    setIsDemoSongPickerOpen(true);
  }, []);

  const handleConfirmNewSong = useCallback(() => {
    if (pendingNewSongAction === 'demo-song') {
      setIsNewSongConfirmOpen(false);
      setPendingNewSongAction('new-song');
      openDemoSongPicker();
      return;
    }

    createNewSong();
    setCurrentOctave(3);
    setChannelMutes([false, false, false]);
    setPosition(0, 0, 0);
    setSharedCurrentLine(0);
    setActiveSection('volume');

    setIsNewSongConfirmOpen(false);
    setPendingNewSongAction('new-song');
  }, [
    pendingNewSongAction,
    createNewSong,
    setPosition,
    setActiveSection,
    openDemoSongPicker,
  ]);

  const handleCancelNewSong = useCallback(() => {
    setIsNewSongConfirmOpen(false);
    setPendingNewSongAction('new-song');
  }, []);

  const handleRequestReset = useCallback(() => {
    setIsResetConfirmOpen(true);
  }, []);

  const handleConfirmReset = useCallback(() => {
    // Clear all localStorage data
    try {
      const preservedTheme = localStorage.getItem('dosound-tracker-theme');
      const preservedDebug = localStorage.getItem('dosound-tracker-debug-mode');

      localStorage.clear();

      if (preservedTheme !== null) {
        localStorage.setItem('dosound-tracker-theme', preservedTheme);
      }

      if (preservedDebug !== null) {
        localStorage.setItem('dosound-tracker-debug-mode', preservedDebug);
      }
    } catch {
      // ignore
    }
    setChannelMutes([false, false, false]);
    setCurrentOctave(3);
    // Reload the application to start fresh
    try {
      (window as ExtendedWindow).__dosoundTrackerIsResetting = true;
    } catch {
      // ignore
    }
    window.location.reload();
  }, [setChannelMutes, setCurrentOctave]);

  const handleCancelReset = useCallback(() => {
    setIsResetConfirmOpen(false);
  }, []);

  const handleConfirmQuit = useCallback(() => {
    setIsQuitConfirmOpen(false);

    if (typeof window !== 'undefined') {
      const api = (window as ExtendedWindow).electronAPI;
      if (api && api.confirmAppClose) {
        api.confirmAppClose();
        return;
      }

      // Fallback for non-Electron environments (may be ignored by the browser).
      window.close();
    }
  }, []);

  const handleCancelQuit = useCallback(() => {
    setIsQuitConfirmOpen(false);

    if (typeof window !== 'undefined') {
      const api = (window as ExtendedWindow).electronAPI;
      if (api && api.cancelAppClose) {
        api.cancelAppClose();
      }
    }
  }, []);

  const handleShowChangelog = useCallback(() => {
    setIsAboutOpen(false);
    setChangelogContent('');
    setIsChangelogOpen(true);

    fetch('CHANGELOG.md')
      .then((response) => {
        if (!response.ok) {
          throw new Error('Failed to load changelog.');
        }
        return response.text();
      })
      .then((text) => {
        setChangelogContent(text);
      })
      .catch(() => {
        setChangelogContent('Unable to load changelog.');
      });
  }, []);

  const handleCloseChangelog = useCallback(() => {
    setIsChangelogOpen(false);
  }, []);

  const handleShowManual = useCallback(() => {
    setIsAboutOpen(false);
    setManualContent('');
    setIsManualOpen(true);

    fetch('MANUAL.md')
      .then((response) => {
        if (!response.ok) {
          throw new Error('Failed to load manual.');
        }
        const contentType = response.headers.get('content-type') || '';
        if (contentType.includes('text/html')) {
          // Likely SPA fallback (index.html) instead of a real MANUAL.md file.
          throw new Error('Manual appears to be HTML, treating as missing.');
        }

        return response.text();
      })
      .then((text) => {
        const trimmed = text.trimStart().slice(0, 512).toLowerCase();

        if (
          trimmed.startsWith('<!doctype') ||
          trimmed.startsWith('<html') ||
          trimmed.includes('<script type="module" src="/@vite/client"')
        ) {
          // Defensive check: HTML content instead of markdown manual.
          throw new Error('Manual appears to be HTML, treating as missing.');
        }

        setManualContent(text);
      })
      .catch(() => {
        setManualContent('Unable to load manual.');
      });
  }, []);

  const handleCloseManual = useCallback(() => {
    setIsManualOpen(false);
  }, []);

  const handleToggleChannelMute = useCallback((channelIndex: number) => {
    toggleChannelMute(channelIndex);
  }, [toggleChannelMute]);

  const handleLoadInstrumentClick = useCallback(() => {
    if (instrumentFileInputRef.current) {
      instrumentFileInputRef.current.value = '';
      instrumentFileInputRef.current.click();
    }
  }, []);

  const handleOpenRepositoryInstrumentPicker = useCallback(() => {
    setIsRepositoryInstrumentOpen(true);
  }, []);

  const handleInstrumentFileContent = useCallback((content: string) => {
    if (!content) {
      return;
    }

    let parsed: unknown;
    try {
      parsed = yaml.load(content) as unknown;
    } catch (error) {
      logger.error('Error loading instrument', error);
      setInstrumentError('Error loading instrument file.');
      return;
    }

    if (!parsed || typeof parsed !== 'object' || !('instrument' in parsed)) {
      loadInstrument(content);
      setActiveSection('instrumentList');
      return;
    }

    const root = parsed as { instrument?: unknown };
    const node = root.instrument;

    if (!node || typeof node !== 'object') {
      loadInstrument(content);
      setActiveSection('instrumentList');
      return;
    }

    const instNode = node as { [key: string]: unknown; type?: unknown };
    const hasTypeField = Object.prototype.hasOwnProperty.call(instNode, 'type');
    const rawType = instNode.type;

    let detectedType: string | null = null;
    if (typeof rawType === 'string') {
      detectedType = rawType;
    } else if (rawType != null) {
      detectedType = String(rawType);
    }

    const normalizedType = detectedType ? detectedType.trim().toLowerCase() : '';
    const isDosoundType = normalizedType === 'dosound';

    if (!hasTypeField || !isDosoundType) {
      if (ignoreInstrumentTypeWarning) {
        loadInstrument(content);
        setActiveSection('instrumentList');
        return;
      }

      openInstrumentTypeWarning(content, { hasTypeField, detectedType });
      return;
    }

    loadInstrument(content);
    setActiveSection('instrumentList');
  }, [
    ignoreInstrumentTypeWarning,
    loadInstrument,
    setActiveSection,
    setInstrumentError,
    openInstrumentTypeWarning,
  ]);

  const handleConfirmInstrumentTypeWarning = useCallback(() => {
    const content = confirmInstrumentTypeWarning();
    if (!content) {
      return;
    }

    loadInstrument(content);
    setActiveSection('instrumentList');
  }, [confirmInstrumentTypeWarning, loadInstrument, setActiveSection]);

  const handleCancelInstrumentTypeWarning = useCallback(() => {
    cancelInstrumentTypeWarning();
  }, [cancelInstrumentTypeWarning]);

  const handlePickRepositoryInstrument = useCallback(
    (fileUrl: string) => {
      fetch(fileUrl)
        .then(response => {
          if (!response.ok) {
            throw new Error('Failed to load instrument file.');
          }

          const contentType = response.headers.get('content-type') || '';
          if (contentType.includes('text/html')) {
            throw new Error('Instrument file appears to be HTML, treating as missing.');
          }

          return response.text();
        })
        .then(text => {
          handleInstrumentFileContent(text);
        })
        .catch(error => {
          logger.error('Error loading repository instrument', error);
          setInstrumentError('Error loading instrument file.');
        })
        .finally(() => {
          setIsRepositoryInstrumentOpen(false);
        });
    },
    [handleInstrumentFileContent, setInstrumentError]
  );

  const handleDemoSongClick = useCallback(() => {
    if (isSongDirty) {
      setPendingNewSongAction('demo-song');
      setIsNewSongConfirmOpen(true);
      return;
    }
    openDemoSongPicker();
  }, [isSongDirty, openDemoSongPicker]);

  const handlePickDemoSong = useCallback(
    (fileUrl: string) => {
      fetch(fileUrl)
        .then(response => {
          if (!response.ok) {
            throw new Error('Failed to load song file.');
          }

          const contentType = response.headers.get('content-type') || '';
          if (contentType.includes('text/html')) {
            throw new Error('Song file appears to be HTML, treating as missing.');
          }

          return response.text();
        })
        .then(text => {
          loadSongFromText(text);
          setPosition(0, 0, 0);
          setSharedCurrentLine(0);
          setActiveSection('commands');
          setChannelMutes([false, false, false]);
        })
        .catch(error => {
          logger.error('Error loading demo song', error);
          setSongError('Error loading song file.');
        })
        .finally(() => {
          setIsDemoSongPickerOpen(false);
        });
    },
    [
      loadSongFromText,
      setPosition,
      setSharedCurrentLine,
      setActiveSection,
      setChannelMutes,
      setSongError,
    ]
  );

  const getCurrentPatternForTrack = useCallback((trackId: 'A' | 'B' | 'C') => {
    // Get current playlist row based on sequencer state
    const playlistLength = currentSong.line.length;
    if (playlistLength === 0) {
      return null;
    }

    const currentPatternIndex = Math.max(
      0,
      Math.min(playlistLength - 1, sequencerState.currentPattern),
    );
    const currentPlaylistEntry = currentSong.line[currentPatternIndex];

    if (!currentPlaylistEntry) {
      return null;
    }

    // Return pattern based on which track is asking
    let patternId = '--';
    switch (trackId) {
      case 'A':
        patternId = currentPlaylistEntry.A;
        break;
      case 'B':
        patternId = currentPlaylistEntry.B;
        break;
      case 'C':
        patternId = currentPlaylistEntry.C;
        break;
    }

    if (patternId === '--') {
      return null; // No pattern set for this track
    }

    let foundPattern = currentSong.pattern.find(p => p.id === patternId);

    // If pattern doesn't exist, create it with current pattern length
    if (!foundPattern) {
      const targetLength = currentSong.length || PATTERN_LENGTH;
      const newPattern = {
        id: patternId,
        name: `Pattern ${patternId}`,
        step: Array(targetLength)
          .fill(null)
          .map(() => ({
            note: null,
          })),
      };

      // Add the new pattern to the song
      const updatedPatterns = [...currentSong.pattern, newPattern];
      updateSong({ pattern: updatedPatterns });

      foundPattern = newPattern;
    }

    return foundPattern;
  }, [currentSong, sequencerState.currentPattern, updateSong]);

  const formatNoteKey = useCallback((note: string, octave: number): string => {
    const upper = note.toUpperCase();
    return upper.endsWith('#') ? `${upper}${octave}` : `${upper}-${octave}`;
  }, []);

  const parseBaseKeyString = useCallback((value?: string): { note: string; octave: number } | null => {
    if (!value) return null;
    const raw = value.trim().toUpperCase();
    if (!raw) return null;

    let notePart = raw.charAt(0);
    let rest = raw.slice(1);

    if (rest.startsWith('#')) {
      notePart += '#';
      rest = rest.slice(1);
    }

    if (rest.startsWith('-')) {
      rest = rest.slice(1);
    }

    const octave = parseInt(rest, 10);
    if (!Number.isFinite(octave)) return null;

    return { note: notePart, octave };
  }, []);

  const getPasteTrackMode = useCallback(
    (_options: { hasExistingData: boolean }): Promise<TrackPasteMode | null> => {
      // Explicitly reference _options so it is considered used by lint, even
      // though the current implementation does not depend on its value.
      void _options;

      return new Promise(resolve => {
        pasteTrackModalResolveRef.current = resolve;
        setPasteTrackPendingMode(pasteTrackMode);
        setIsPasteTrackModalOpen(true);
      });
    },
    [pasteTrackMode]
  );

  const handleConfirmPasteTrackModal = useCallback(() => {
    const resolver = pasteTrackModalResolveRef.current;
    pasteTrackModalResolveRef.current = null;
    setIsPasteTrackModalOpen(false);
    setPasteTrackMode(pasteTrackPendingMode);
    if (resolver) {
      resolver(pasteTrackPendingMode);
    }
  }, [pasteTrackPendingMode]);

  const handleCancelPasteTrackModal = useCallback(() => {
    const resolver = pasteTrackModalResolveRef.current;
    pasteTrackModalResolveRef.current = null;
    setIsPasteTrackModalOpen(false);
    if (resolver) {
      resolver(null);
    }
  }, []);

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
    formatNoteKey,
    parseBaseKeyString,
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
    parseBaseKeyString,
    ym2149Ref,
    playInstTimerRef,
    playInstStepRef,
  });

  // Handle instrument selection
  const handleInstrumentSelect = useCallback((instrument: Instrument) => {
    setCurrentInstrument(instrument);
  }, []);

  const handleOpenInstrumentMidi = useCallback((instrument: Instrument) => {
    setInstrumentMidiTarget(instrument);
    setIsInstrumentMidiOpen(true);
  }, []);

  const handleCloseInstrumentMidi = useCallback(() => {
    setIsInstrumentMidiOpen(false);
    setInstrumentMidiTarget(null);
    setActiveSection('instrumentList');
    setInstrumentPanelFocusRevision(prev => prev + 1);
  }, [setActiveSection, setInstrumentPanelFocusRevision]);

  const handleSaveInstrumentMidi = useCallback(
    (midi: { channel: number | null; program: number | null }) => {
      if (!instrumentMidiTarget) {
        setIsInstrumentMidiOpen(false);
        setActiveSection('instrumentList');
        setInstrumentPanelFocusRevision(prev => prev + 1);
        return;
      }

      const targetId = instrumentMidiTarget.id;

      const nextInstruments = currentSong.instrument.map((inst) => {
        if (!inst || inst.id !== targetId) {
          return inst;
        }

        const hasChannel = typeof midi.channel === 'number' && Number.isFinite(midi.channel);
        const hasProgram = typeof midi.program === 'number' && Number.isFinite(midi.program);

        let nextMidi: Instrument['midi'] | undefined;
        if (hasChannel || hasProgram) {
          nextMidi = {
            channel: hasChannel ? midi.channel : null,
            program: hasProgram ? midi.program : null
          };
        } else {
          nextMidi = undefined;
        }

        return {
          ...inst,
          midi: nextMidi
        };
      });

      updateSong({ instrument: nextInstruments });

      if (currentInstrument && currentInstrument.id === targetId) {
        const updated = nextInstruments.find((inst) => inst && inst.id === targetId);
        if (updated) {
          setCurrentInstrument(updated);
        }
      }

      setIsInstrumentMidiOpen(false);
      setInstrumentMidiTarget(null);
      setActiveSection('instrumentList');
      setInstrumentPanelFocusRevision(prev => prev + 1);
    },
    [
      instrumentMidiTarget,
      currentSong.instrument,
      updateSong,
      currentInstrument,
      setCurrentInstrument,
      setActiveSection,
      setInstrumentPanelFocusRevision
    ]
  );

  const handleOpenInstrumentColor = useCallback((instrument: Instrument) => {
    setInstrumentColorTarget(instrument);
    setIsInstrumentColorOpen(true);
  }, []);

  const handleCloseInstrumentColor = useCallback(() => {
    setIsInstrumentColorOpen(false);
    setInstrumentColorTarget(null);
    setActiveSection('instrumentList');
    setInstrumentPanelFocusRevision(prev => prev + 1);
  }, [setActiveSection, setInstrumentPanelFocusRevision]);

  const handleSaveInstrumentColor = useCallback(
    (color: string | null) => {
      if (!instrumentColorTarget) {
        setIsInstrumentColorOpen(false);
        setActiveSection('instrumentList');
        setInstrumentPanelFocusRevision(prev => prev + 1);
        return;
      }

      const targetId = instrumentColorTarget.id;

      const nextInstruments = currentSong.instrument.map((inst) => {
        if (!inst || inst.id !== targetId) {
          return inst;
        }

        const nextColor = color && color.trim() ? color : null;

        return {
          ...inst,
          color: nextColor,
        };
      });

      updateSong({ instrument: nextInstruments });

      if (currentInstrument && currentInstrument.id === targetId) {
        const updated = nextInstruments.find((inst) => inst && inst.id === targetId);
        if (updated) {
          setCurrentInstrument(updated);
        }
      }

      setIsInstrumentColorOpen(false);
      setInstrumentColorTarget(null);
      setActiveSection('instrumentList');
      setInstrumentPanelFocusRevision(prev => prev + 1);
    },
    [
      instrumentColorTarget,
      currentSong.instrument,
      updateSong,
      currentInstrument,
      setCurrentInstrument,
      setActiveSection,
      setInstrumentPanelFocusRevision,
    ]
  );

  const handleClearInstrumentColor = useCallback(
    () => {
      if (!instrumentColorTarget) {
        setIsInstrumentColorOpen(false);
        setActiveSection('instrumentList');
        setInstrumentPanelFocusRevision(prev => prev + 1);
        return;
      }

      const targetId = instrumentColorTarget.id;

      const nextInstruments = currentSong.instrument.map((inst) => {
        if (!inst || inst.id !== targetId) {
          return inst;
        }

        return {
          ...inst,
          color: null,
        };
      });

      updateSong({ instrument: nextInstruments });

      if (currentInstrument && currentInstrument.id === targetId) {
        const updated = nextInstruments.find((inst) => inst && inst.id === targetId);
        if (updated) {
          setCurrentInstrument(updated);
        }
      }

      setIsInstrumentColorOpen(false);
      setInstrumentColorTarget(null);
      setActiveSection('instrumentList');
      setInstrumentPanelFocusRevision(prev => prev + 1);
    },
    [
      instrumentColorTarget,
      currentSong.instrument,
      updateSong,
      currentInstrument,
      setCurrentInstrument,
      setActiveSection,
      setInstrumentPanelFocusRevision,
    ]
  );

  const handleChangeBaseKey = useCallback((note: string, octave: number) => {
    const upper = note.toUpperCase();
    const formatted = upper.endsWith('#')
      ? `${upper}${octave}`
      : `${upper}-${octave}`;
    updateInstrument({ base: formatted });
  }, [updateInstrument]);


  // Handle stop playback with silence
  const handleStop = useCallback(() => {
    // Stop the sequencer
    stop();

    // Ensure line play state is cleared so buttons show PLAY again
    setIsLinePlaying(false);
    
    // Stop any instrument preview playback
    if (playInstTimerRef.current !== null) {
      window.clearInterval(playInstTimerRef.current);
      playInstTimerRef.current = null;
    }

    // Reset cycle counters and silence all channels
    handleStopPlayback();
  }, [stop, handleStopPlayback]);

  // Handle stop line playback (pattern-loop mode for the current playlist line)
  const handleStopLinePlayback = useCallback(() => {
    // Stop the sequencer
    stop();
    
    // Update line playing state
    setIsLinePlaying(false);
    
    // Stop any instrument preview playback
    if (playInstTimerRef.current !== null) {
      window.clearInterval(playInstTimerRef.current);
      playInstTimerRef.current = null;
    }
    
    // Reset cycle counters and silence all channels
    handleStopPlayback();
    const returnPos = patternReturnPositionRef.current;
    if (returnPos) {
      setPosition(returnPos.pattern, returnPos.line, 0);
      setSharedCurrentLine(returnPos.line);
      patternReturnPositionRef.current = null;
    }
  }, [stop, handleStopPlayback, setPosition]);

  // Handle start song playback
  const handleStartSong = useCallback(() => {
    if (currentSong.line.length === 0) {
      return;
    }

    const clampedIndex = Math.max(
      0,
      Math.min(sequencerState.currentPattern, currentSong.line.length - 1)
    );

    // If we are currently in line-loop mode and playback is running, switch
    // to song playback without restarting the sequencer. The worker will
    // apply the mode change at the next pattern boundary, avoiding any
    // audible gap.
    if (isLinePlaying && sequencerState.isPlaying) {
      setIsLinePlaying(false);
      patternReturnPositionRef.current = null;

      setPatternLoopMode(false);
      return;
    }

    // Otherwise start song from the beginning (line 0) of the current pattern.
    patternReturnPositionRef.current = {
      pattern: clampedIndex,
      line: sharedCurrentLine
    };

    // Clear position ref to ensure first tick detection works
    lastSequencerPositionRef.current = null;

    startSong(clampedIndex, 0);
  }, [
    isLinePlaying,
    startSong,
    sequencerState.currentPattern,
    sequencerState.currentLine,
    sequencerState.isPlaying,
    currentSong.line,
    sharedCurrentLine,
    setPatternLoopMode
  ]);

  // Handle start line playback (line-loop mode for the current playlist line)
  const handleStartLinePlayback = useCallback(() => {
    if (currentSong.line.length === 0) {
      return;
    }

    const clampedIndex = Math.max(
      0,
      Math.min(sequencerState.currentPattern, currentSong.line.length - 1)
    );
    const currentEntry = currentSong.line[clampedIndex];

    if (!currentEntry) {
      return;
    }

    let trackId: 'A' | 'B' | 'C' = lastTrackId;
    if (activeSection === 'trackA') {
      trackId = 'A';
    } else if (activeSection === 'trackB') {
      trackId = 'B';
    } else if (activeSection === 'trackC') {
      trackId = 'C';
    }

    let patternId = '--';
    switch (trackId) {
      case 'A':
        patternId = currentEntry.A;
        break;
      case 'B':
        patternId = currentEntry.B;
        break;
      case 'C':
        patternId = currentEntry.C;
        break;
    }

    if (patternId === '--') {
      return;
    }

    // If a song is currently playing, switch into line-loop mode and
    // let the sequencer continue without restarting. The worker will
    // honor the new pattern-loop flag at the next pattern boundary.
    if (sequencerState.isPlaying && !isLinePlaying) {
      const effectiveLine = Math.max(
        0,
        Math.min(
          sequencerState.currentLine,
          (currentSong.length || PATTERN_LENGTH) - 1
        )
      );

      patternReturnPositionRef.current = {
        pattern: clampedIndex,
        line: effectiveLine
      };

      setIsLinePlaying(true);

      setPatternLoopMode(true);
      return;
    }

    // Otherwise (not playing, or already in pattern mode), start from the beginning.
    if (sequencerState.isPlaying) {
      stop();
    }

    // Clear position ref to ensure first tick detection works
    lastSequencerPositionRef.current = null;

    setIsLinePlaying(true);

    startPatternLoop(clampedIndex, 0);
  }, [
    stop,
    startPatternLoop,
    sequencerState.isPlaying,
    sequencerState.currentPattern,
    sequencerState.currentLine,
    currentSong.line,
    currentSong.length,
    activeSection,
    lastTrackId,
    isLinePlaying,
    setPatternLoopMode
  ]);

  const handleStartLineFromBeginning = useCallback(() => {
    if (currentSong.line.length === 0) {
      return;
    }

    const clampedIndex = Math.max(0, Math.min(sequencerState.currentPattern, currentSong.line.length - 1));
    const currentEntry = currentSong.line[clampedIndex];

    if (!currentEntry) {
      return;
    }

    let trackId: 'A' | 'B' | 'C' = lastTrackId;
    if (activeSection === 'trackA') {
      trackId = 'A';
    } else if (activeSection === 'trackB') {
      trackId = 'B';
    } else if (activeSection === 'trackC') {
      trackId = 'C';
    }

    let patternId = '--';
    switch (trackId) {
      case 'A':
        patternId = currentEntry.A;
        break;
      case 'B':
        patternId = currentEntry.B;
        break;
      case 'C':
        patternId = currentEntry.C;
        break;
    }

    if (patternId === '--') {
      return;
    }

    if (sequencerState.isPlaying) {
      stop();
    }

    if (isLinePlaying) {
      setIsLinePlaying(false);
    }

    // Start from the beginning (line 0) of the current pattern
    setPosition(clampedIndex, 0, 0);

    startSong();
  }, [stop, startSong, sequencerState.isPlaying, sequencerState.currentPattern, setPosition, isLinePlaying, currentSong.line, activeSection, lastTrackId]);

  const handleStartLineFromCurrentLine = useCallback((overrideLine?: number) => {
    if (currentSong.line.length === 0) {
      return;
    }

    const playlistLength = currentSong.line.length;
    const clampedIndex = Math.max(0, Math.min(sequencerState.currentPattern, playlistLength - 1));
    const currentEntry = currentSong.line[clampedIndex];

    if (!currentEntry) {
      return;
    }

    let trackId: 'A' | 'B' | 'C' = lastTrackId;
    if (activeSection === 'trackA') {
      trackId = 'A';
    } else if (activeSection === 'trackB') {
      trackId = 'B';
    } else if (activeSection === 'trackC') {
      trackId = 'C';
    }

    let patternId = '--';
    switch (trackId) {
      case 'A':
        patternId = currentEntry.A;
        break;
      case 'B':
        patternId = currentEntry.B;
        break;
      case 'C':
        patternId = currentEntry.C;
        break;
    }

    if (patternId === '--') {
      return;
    }

    const effectiveLine = overrideLine != null ? overrideLine : sharedCurrentLine;

    // Save return position (playlist row and line where cursor currently is)
    patternReturnPositionRef.current = {
      pattern: clampedIndex,
      line: effectiveLine
    };

    if (sequencerState.isPlaying) {
      stop();
    }

    // Clear position ref to ensure first tick detection works
    lastSequencerPositionRef.current = null;

    setIsLinePlaying(true);

    // Start pattern loop from the current cursor line
    const startLine = Math.max(0, Math.min(effectiveLine, (currentSong.length || PATTERN_LENGTH) - 1));
    startPatternLoop(clampedIndex, startLine);
  }, [currentSong.line, currentSong.length, sharedCurrentLine, sequencerState.currentPattern, sequencerState.isPlaying, activeSection, lastTrackId, stop, startPatternLoop]);

  const handleToggleLineFromCursor = useCallback((lineIndex: number) => {
    if (isLinePlaying && sequencerState.isPlaying) {
      handleStopLinePlayback();
      return;
    }

    handleStartLineFromCurrentLine(lineIndex);
  }, [isLinePlaying, sequencerState.isPlaying, handleStopLinePlayback, handleStartLineFromCurrentLine]);

  useKeyboardShortcuts({
    setGlobalShortcut,
    handleStartSong,
    handleStartLineFromBeginning,
    handleStartLine: handleStartLinePlayback,
    handleStop,
  });

  // Safety guard: ensure sequencer position always stays within playlist bounds
  // and force a clean stop if playback runs past the end for any reason.
  useEffect(() => {
    const playlistLength = currentSong.line.length;

    // Nothing to do if not playing
    if (!sequencerState.isPlaying) {
      return;
    }

    // If playlist was cleared while playing, stop gracefully
    if (playlistLength === 0) {
      handleStopPlayback();
      stop();
      return;
    }

    if (
      sequencerState.currentPattern < 0 ||
      sequencerState.currentPattern >= playlistLength
    ) {
      const rawLoop = currentSong.loop;
      const hasLoop = typeof rawLoop === 'number' && Number.isFinite(rawLoop);

      if (!hasLoop) {
        handleStopPlayback();
        setPosition(0, 0, 0);
        stop();
        return;
      }

      const base = Math.floor(rawLoop as number);
      const loopIndex = Math.max(0, Math.min(playlistLength - 1, base));

      setPosition(loopIndex, 0, 0);
    }
  }, [
    sequencerState.isPlaying,
    sequencerState.currentPattern,
    currentSong.line.length,
    currentSong.loop,
    stop,
    handleStopPlayback,
    setPosition
  ]);

  const handleOctaveChange = useCallback((octave: number) => {
    setCurrentOctave(octave);
    const id = currentInstrument?.id;
    if (!id) return;
    setInstrumentOctaves(prev => ({ ...prev, [id]: octave }));
    updateInstrument({ octave });
  }, [currentInstrument?.id, updateInstrument]);
  const handleLineChange = useCallback((lineIndex: number) => {
    setSharedCurrentLine(lineIndex);
  }, []);
  const {
    handleMidiNoteEvent,
    handleHardStopLivePreview,
    handleRegisterTrackStopPreview,
  } = useMidiActions({
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
    parseBaseKeyString,
  });

  const handleToggleDebugMode = useCallback(() => {
    setIsDebugMode(prev => {
      const next = !prev;

      if (!prev && next) {
        let alreadyShown = false;
        try {
          alreadyShown = localStorage.getItem('dosound-tracker-debug-info-shown') === '1';
        } catch {
          // ignore
        }

        if (!alreadyShown) {
          setIsDebugInfoOpen(true);
          try {
            localStorage.setItem('dosound-tracker-debug-info-shown', '1');
          } catch {
            // ignore
          }
        }
      }

      return next;
    });
  }, []);

  const handleOptimizeSong = useCallback(() => {
    setIsOptimizeConfirmOpen(true);
  }, [optimizeSong]);

  const handleConfirmOptimize = useCallback(() => {
    const summary = optimizeSong();
    setIsOptimizeConfirmOpen(false);
    setOptimizeSummary(summary);
  }, [optimizeSong]);

  const handleCancelOptimize = useCallback(() => {
    setIsOptimizeConfirmOpen(false);
  }, []);

  const handleCloseOptimizeSummary = useCallback(() => {
    setOptimizeSummary('');
  }, []);

  const handleRenumberSong = useCallback(() => {
    setIsRenumberConfirmOpen(true);
  }, []);

  const handleConfirmRenumber = useCallback(() => {
    const summary = renumberSong();
    setIsRenumberConfirmOpen(false);
    setRenumberSummary(summary);
  }, [renumberSong]);

  const handleCancelRenumber = useCallback(() => {
    setIsRenumberConfirmOpen(false);
  }, []);

  const handleCloseRenumberSummary = useCallback(() => {
    setRenumberSummary('');
  }, []);

  const handleOpenExport = useCallback(() => {
    setPendingExportType(exportType);
    setPendingExportStrategy(exportStrategy);
    setIsExportModalOpen(true);
  }, [exportType, exportStrategy]);

  const handleCancelExport = useCallback(() => {
    setIsExportModalOpen(false);
  }, []);

  const handleConfirmExport = useCallback(() => {
    setExportType(pendingExportType);
    setExportStrategy(pendingExportStrategy);
    setIsExportModalOpen(false);
  }, [pendingExportType, pendingExportStrategy, setExportType, setExportStrategy]);

  const handleExportTypeChange = useCallback((type: ExportType) => {
    setPendingExportType(type);
  }, []);

  const handleExportStrategyChange = useCallback((strategy: ExportStrategy) => {
    setPendingExportStrategy(strategy);
  }, []);

  const buildExportContext = useCallback(
    () => ({
      type: pendingExportType,
      strategy: pendingExportStrategy,
      playlistIndex: clampedPlaybackPosition,
      currentLine: sharedCurrentLine,
      instrument: currentInstrument ?? null,
    }),
    [pendingExportType, pendingExportStrategy, clampedPlaybackPosition, sharedCurrentLine, currentInstrument]
  );

  const handleExportDumpFromModal = useCallback(() => {
    exportDumpWithContext(buildExportContext());
  }, [buildExportContext, exportDumpWithContext]);

  const handleExportDataFromModal = useCallback(() => {
    exportDataWithContext(buildExportContext());
  }, [buildExportContext, exportDataWithContext]);

  const handleExportBinFromModal = useCallback(() => {
    exportBinWithContext(buildExportContext());
  }, [buildExportContext, exportBinWithContext]);

  const handleExportVgmFromModal = useCallback(() => {
    exportVgmWithContext(buildExportContext());
  }, [buildExportContext, exportVgmWithContext]);

  const handleExportWavFromModal = useCallback(() => {
    exportWavWithContext(buildExportContext());
  }, [buildExportContext, exportWavWithContext]);

  const handleExportMaxFromModal = useCallback(() => {
    exportMaxWithContext(buildExportContext());
  }, [buildExportContext, exportMaxWithContext]);

  const handleOpenTranspose = useCallback(() => {
    // When opening, keep the last-used transpose settings and just ensure the
    // input text reflects the current numeric amount.
    setTransposeAmountInput(String(transposeAmount));
    setIsTransposeOpen(true);
  }, [transposeAmount]);

  const handleCancelTranspose = useCallback(() => {
    setIsTransposeOpen(false);
  }, []);

  const handleConfirmTranspose = useCallback(() => {
    // Parse the semitone offset from the text input so negative values and
    // partial edits are handled correctly.
    let semitones = 0;
    const trimmed = transposeAmountInput.trim();

    if (trimmed !== '' && trimmed !== '-' && trimmed !== '+') {
      const parsed = Number(trimmed);
      if (Number.isFinite(parsed)) {
        semitones = Math.round(parsed);
      }
    }

    const playlistLength = currentSong.line.length;
    if (playlistLength === 0) {
      setTransposeSummary('No playlist entries to transpose.');
      setIsTransposeOpen(false);
      return;
    }

    if (semitones === 0) {
      setTransposeSummary('No transposition applied because the semitone offset is 0.');
      setIsTransposeOpen(false);
      return;
    }

    const selectedInstrumentId = normalizeInstrumentId(currentInstrument.id);

    const result = applyTranspose({
      semitones,
      scope: transposeScope,
      trackScope: transposeTrackScope,
      instrumentScope: transposeInstrumentScope,
      currentPatternIndex: sequencerState.currentPattern,
      targetTrackId,
      selectedInstrumentId,
      normalizeInstrumentId,
    });

    if (!result || result.patternCount === 0) {
      setTransposeSummary('No patterns found for the selected scope to transpose.');
      setIsTransposeOpen(false);
      return;
    }

    setIsTransposeOpen(false);

    const directionLabel = semitones > 0 ? `+${semitones}` : `${semitones}`;
    const scopeLabel =
      transposeScope === 'line'
        ? 'Current playlist position only'
        : 'Entire song (all playlist positions)';
    const trackLabel =
      transposeTrackScope === 'current'
        ? `Current track only (Track ${targetTrackId})`
        : 'All tracks (A, B, C)';
    const instrumentLabel =
      transposeInstrumentScope === 'selected'
        ? `Selected instrument only (${selectedInstrumentId})`
        : 'All instruments';

    const lines: string[] = [];
    lines.push('Transposition complete.');
    lines.push('');
    lines.push(`Semitone offset: ${directionLabel}`);
    lines.push(`Scope: ${scopeLabel}`);
    lines.push(`Track scope: ${trackLabel}`);
    lines.push(`Instrument scope: ${instrumentLabel}`);
    lines.push('');
    lines.push(`Patterns touched: ${result.patternCount}`);
    lines.push(`Notes transposed: ${result.notesChanged}`);

    if (result.clippedLow > 0 || result.clippedHigh > 0) {
      lines.push('');
      lines.push(`Notes clipped at bottom of range: ${result.clippedLow}`);
      lines.push(`Notes clipped at top of range: ${result.clippedHigh}`);
    }

    setTransposeSummary(lines.join('\n'));
  }, [
    transposeAmountInput,
    currentSong.line.length,
    transposeScope,
    transposeTrackScope,
    transposeInstrumentScope,
    sequencerState.currentPattern,
    targetTrackId,
    currentInstrument.id,
    normalizeInstrumentId,
    applyTranspose,
  ]);

  const handleTransposeAmountChange = useCallback((value: string) => {
    // Allow arbitrary text (including just "-" while typing) but only update
    // the numeric amount when the value parses to a finite number.
    setTransposeAmountInput(value);

    const trimmed = value.trim();
    if (!trimmed || trimmed === '-' || trimmed === '+') {
      return;
    }

    const parsed = Number(trimmed);
    if (Number.isFinite(parsed)) {
      const clamped = Math.max(-99, Math.min(99, parsed));
      setTransposeAmount(clamped);
    }
  }, []);

  const handleCloseTransposeSummary = useCallback(() => {
    setTransposeSummary('');
  }, []);

  const handleCloseInstrumentOperationSummary = useCallback(() => {
    setInstrumentOperationSummary('');
  }, []);

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
    sendInstrumentMidiNoteOn,
    sendInstrumentMidiNoteOffForChannel,
    previewInstrumentMidiNoteOn,
    previewInstrumentMidiNoteOff,
    midiInputEnabled,
    midiOutputEnabled,
    resetMidiProgramCache,
    sendSystemReset,
  } = useMidiHandling({ onNoteEvent: handleMidiNoteEvent, monitorsEnabled: isDebugMode || isMidiModalOpen });

  // Keep MIDI helper ref in sync with the latest MIDI send functions from the
  // useMidiHandling hook so callbacks defined earlier can use them safely.
  useEffect(() => {
    midiHelpersRef.current = {
      sendInstrumentMidiNoteOn,
      sendInstrumentMidiNoteOffForChannel,
    };
  }, [sendInstrumentMidiNoteOn, sendInstrumentMidiNoteOffForChannel]);

  useEffect(() => {
    midiConfigurationRef.current = midiConfiguration;
  }, [midiConfiguration]);

  const handleLiveMidiConfigChange = useCallback(
    (patch: Partial<MidiConfiguration>) => {
      setMidiConfiguration({ ...midiConfiguration, ...patch });
    },
    [midiConfiguration, setMidiConfiguration]
  );

  const handleShowMidi = useCallback(() => {
    setIsMidiModalOpen(true);
  }, []);

  const handleCloseMidi = useCallback(() => {
    resetMidiProgramCache();
    setIsMidiModalOpen(false);
  }, [resetMidiProgramCache]);

  const handleSaveMidiConfig = useCallback(
    (configuration: MidiConfiguration) => {
      setMidiConfiguration(configuration);
      resetMidiProgramCache();
      setIsMidiModalOpen(false);
    },
    [resetMidiProgramCache, setMidiConfiguration]
  );

  const handleClearMidiMonitors = useCallback(() => {
    clearMidiMonitors();
  }, [clearMidiMonitors]);

  const handleRescanMidiDevices = useCallback(() => {
    refreshMidiDevices();
  }, [refreshMidiDevices]);

  const handleMidiSystemReset = useCallback(() => {
    sendSystemReset();
  }, [sendSystemReset]);
  const { handlePositionScroll } = useScrollSync(sharedCurrentLine);

  const handleToggleTrackBackground = useCallback(() => {
    setTrackBackgroundEnabled(prev => !prev);
  }, []);

  const previewChannel =
    activeSection === 'trackA'
      ? 0
      : activeSection === 'trackB'
      ? 1
      : activeSection === 'trackC'
      ? 2
      : lastTrackId === 'B'
      ? 1
      : lastTrackId === 'C'
      ? 2
      : 0;
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
            hasDownloads={hasDownloads}
            onShowDownloads={() => setIsDownloadOpen(true)}
            onPreviewMidiNoteOn={previewInstrumentMidiNoteOn}
            onPreviewMidiNoteOff={previewInstrumentMidiNoteOff}
            onToggleCommandPanelMobile={() => {
              if (!isMobileViewport) {
                return;
              }
              setIsCommandPanelMobileCollapsed(prev => !prev);
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
            messages={messages}
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
            onToggleChannelMute={handleToggleChannelMute}
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

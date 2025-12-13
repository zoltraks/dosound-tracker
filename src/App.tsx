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
import { useSequencerIntegration } from './hooks/useSequencerIntegration';
import type { YM2149 } from './synth/YM2149';
import type { Instrument, Note, Pattern } from './synth/SoundDriver';
import type { MidiConfig } from './hooks/useMidi';
import { PATTERN_LENGTH, MIN_OCTAVE, MAX_OCTAVE, DEFAULT_OCTAVE } from './constants/music';
import yaml from 'js-yaml';
import { HeaderPanel } from './components/HeaderPanel';
import { CommandPanel } from './components/CommandPanel';
import { ErrorBoundary } from './components/ErrorBoundary';
import { PianoKeyboard } from './components/PianoKeyboard';
import { ModalContainer } from './components/ModalContainer';
import { ExportModal } from './modals/ExportModal';
import { PasteTrackModal } from './modals/PasteTrackModal';
import { FilePickerModal } from './modals/FilePickerModal';
import { AppLayout } from './components/AppLayout';
import { TrackerSection } from './components/TrackerSection';
import { EnvelopeSection } from './components/EnvelopeSection';
import { SongSection } from './components/SongSection';
import { useFileOperations } from './hooks/useFileOperations';
import type { UiStore } from './stores/uiStore';
import { useUiStore } from './stores/uiStore';
import type { ExportType, ExportStrategy } from './constants/export';
import './App.css';

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
    isComplexDumpMode,
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
  } = useDataManagement();

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
  } = useFileOperations({ song: currentSong, isComplexDumpMode });

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
    isPasteTrackModalOpen;

  const { activeSection, setActiveSection, setGlobalShortcut } = useKeyboardNavigation(isNavigationSuspended);

  const patternsById = useMemo(() => {
    const map = new Map<string, Pattern>();
    for (const pattern of currentSong.patterns) {
      if (pattern && pattern.id) {
        map.set(pattern.id, pattern);
      }
    }
    return map;
  }, [currentSong.patterns]);

  const instrumentsById = useMemo(() => {
    const map = new Map<string, Instrument>();
    for (const instrument of currentSong.instruments) {
      if (instrument && instrument.id) {
        map.set(instrument.id, instrument);
      }
    }
    return map;
  }, [currentSong.instruments]);
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
        console.error('Error getting runtime info:', error);
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
      console.error('Error getting user agent:', error);
    }
  }, []);

  const { messages, currentMessageIndex, isNotesVisible, handleNotesClick } = useMessageSystem();

  const { audioContext, ym2149Ref } = useAudioSetup();
  const [ym2149Instance, setYm2149Instance] = useState<YM2149 | null>(null);
  const instrumentFileInputRef = useRef<HTMLInputElement | null>(null);
  const playInstTimerRef = useRef<number | null>(null);
  const playInstStepRef = useRef<number>(0);

  const channelSubTickRef = useRef([0, 0, 0]);
  const channelEnvelopeStepRef = useRef([0, 0, 0]);
  const lastNotesRef = useRef<Array<Note | null>>([null, null, null]);
  const lastSequencerPositionRef = useRef<{ pattern: number; line: number } | null>(null);
  // Per-channel volume modifier nibble (0-15) from the pattern "volume column".
  // Default is 0x0F (no attenuation) at the start of playback.
  const channelVolumeModifierRef = useRef<number[]>([0x0f, 0x0f, 0x0f]);
  // Optional sustain position (0-based envelope index) for the currently held
  // note on each channel. When non-null and not yet released, envelope
  // progression is held at this position until a key-release step occurs.
  const channelSustainRef = useRef<(number | null)[]>([null, null, null]);
  // Per-channel flag indicating that a key-release (note-off) has occurred
  // for a note whose instrument has a sustain point. Once released, the
  // envelope continues past the sustain index instead of being hard-muted.
  const channelReleasedRef = useRef<boolean[]>([false, false, false]);
  const patternReturnPositionRef = useRef<{ pattern: number; line: number } | null>(null);
  const wasPlayingRef = useRef(false);
  const debugTickCounterRef = useRef<number>(0);
  const debugLastRowRef = useRef<{ pattern: number; line: number } | null>(null);
  const debugLastTimeRef = useRef<number | null>(null);
  const lastUiRowRef = useRef<{ pattern: number; line: number } | null>(null);
  const linePlayingRef = useRef(false);

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
          console.error('AudioContext resume failed in ensureAudioContextResumed:', error);
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
      volumeFromStep?: number | null
    ) => void;
    sendInstrumentMidiNoteOffForChannel: (ymChannel: number) => void;
  } | null>(null);

  const normalizeInstrumentId = useCallback((value?: string | number | null) => {
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value.toString(16).padStart(2, '0').toUpperCase();
    }

    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (!trimmed) return '';
      const sanitized = trimmed.startsWith('$') ? trimmed.slice(1) : trimmed;
      const upper = sanitized.toUpperCase();
      if (/^[0-9A-F]{1,2}$/.test(upper)) {
        return upper.padStart(2, '0');
      }
      return upper;
    }

    return '';
  }, []);

  const instrumentLookupByNormalizedId = useMemo(() => {
    const map = new Map<string, Instrument>();
    for (const inst of currentSong.instruments) {
      if (!inst || !inst.id) {
        continue;
      }
      const key = normalizeInstrumentId(inst.id);
      if (!key) {
        continue;
      }
      if (!map.has(key)) {
        map.set(key, inst);
      }
    }
    return map;
  }, [currentSong.instruments, normalizeInstrumentId]);

  const {
    handleStop,
    handleStartSong,
    handleStartLinePlayback,
    handleStartLineFromBeginning,
    handleToggleLineFromCursor,
  } = useSequencerIntegration({
    currentSong,
    sequencerState,
    patternsById,
    instrumentsById,
    channelMutes,
    isDebugMode,
    sharedCurrentLine,
    setSharedCurrentLine,
    isLinePlaying,
    setIsLinePlaying,
    activeSection,
    lastTrackId,
    stop,
    setCallback,
    setPosition,
    startPatternLoop,
    startSong,
    setPatternLoopMode,
    ym2149Ref,
    midiHelpersRef,
    linePlayingRef,
    lastUiRowRef,
    wasPlayingRef,
    lastSequencerPositionRef,
    channelSubTickRef,
    channelEnvelopeStepRef,
    lastNotesRef,
    channelVolumeModifierRef,
    channelSustainRef,
    channelReleasedRef,
    debugTickCounterRef,
    debugLastRowRef,
    debugLastTimeRef,
    patternReturnPositionRef,
    playInstTimerRef,
    currentInstrument,
    normalizeInstrumentId,
    instrumentLookupByNormalizedId,
  });

  // Handle stop playback with silence
  const handlePatternChange = useCallback((newPattern: Pattern) => {
    if (!newPattern || !newPattern.id) {
      console.error('No pattern ID provided to handlePatternChange');
      return;
    }
    
    // Find and update the pattern by ID
    const updatedPatterns = [...currentSong.patterns];
    const patternIndex = updatedPatterns.findIndex(p => p.id === newPattern.id);
    
    if (patternIndex === -1) {
      console.error('Pattern not found with ID:', newPattern.id);
      return;
    }
    
    updatedPatterns[patternIndex] = newPattern;
    updateSong({ patterns: updatedPatterns });
  }, [currentSong.patterns, updateSong]);


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
      console.error('Error loading instrument:', error);
      setInstrumentError('Error loading instrument file. Please check the file format.');
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
          console.error('Error loading repository instrument:', error);
          setInstrumentError('Error loading instrument file. Please check the file format.');
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
          console.error('Error loading demo song:', error);
          setSongError('Error loading song file. Please check the file format.');
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
    const playlistLength = currentSong.playlist.length;
    if (playlistLength === 0) {
      return null;
    }

    const currentPatternIndex = Math.max(
      0,
      Math.min(playlistLength - 1, sequencerState.currentPattern),
    );
    const currentPlaylistEntry = currentSong.playlist[currentPatternIndex];

    if (!currentPlaylistEntry) {
      return null;
    }

    // Return pattern based on which track is asking
    let patternId = '--';
    switch (trackId) {
      case 'A':
        patternId = currentPlaylistEntry.trackA;
        break;
      case 'B':
        patternId = currentPlaylistEntry.trackB;
        break;
      case 'C':
        patternId = currentPlaylistEntry.trackC;
        break;
    }

    if (patternId === '--') {
      return null; // No pattern set for this track
    }

    let foundPattern = currentSong.patterns.find(p => p.id === patternId);

    // If pattern doesn't exist, create it with current pattern length
    if (!foundPattern) {
      const targetLength = currentSong.patternLength || PATTERN_LENGTH;
      const newPattern = {
        id: patternId,
        name: `Pattern ${patternId}`,
        lines: Array(targetLength)
          .fill(null)
          .map(() => ({
            trackA: null,
            trackB: null,
            trackC: null,
          })),
      };

      // Add the new pattern to the song
      const updatedPatterns = [...currentSong.patterns, newPattern];
      updateSong({ patterns: updatedPatterns });

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

      const nextInstruments = currentSong.instruments.map(inst => {
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

      updateSong({ instruments: nextInstruments });

      if (currentInstrument && currentInstrument.id === targetId) {
        const updated = nextInstruments.find(inst => inst && inst.id === targetId);
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
      currentSong.instruments,
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

      const nextInstruments = currentSong.instruments.map(inst => {
        if (!inst || inst.id !== targetId) {
          return inst;
        }

        const nextColor = color && color.trim() ? color : null;

        return {
          ...inst,
          color: nextColor,
        };
      });

      updateSong({ instruments: nextInstruments });

      if (currentInstrument && currentInstrument.id === targetId) {
        const updated = nextInstruments.find(inst => inst && inst.id === targetId);
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
      currentSong.instruments,
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

      const nextInstruments = currentSong.instruments.map(inst => {
        if (!inst || inst.id !== targetId) {
          return inst;
        }

        return {
          ...inst,
          color: null,
        };
      });

      updateSong({ instruments: nextInstruments });

      if (currentInstrument && currentInstrument.id === targetId) {
        const updated = nextInstruments.find(inst => inst && inst.id === targetId);
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
      currentSong.instruments,
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



  useKeyboardShortcuts({
    setGlobalShortcut,
    handleStartSong,
    handleStartLineFromBeginning,
    handleStartLine: handleStartLinePlayback,
    handleStop,
  });

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

    const playlistLength = currentSong.playlist.length;
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
    currentSong.playlist.length,
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
    midiConfig,
    setMidiConfig,
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
    if (ym2149Ref.current) {
      setYm2149Instance(ym2149Ref.current);
    }
  }, [audioContext, ym2149Ref]);

  const handleLiveMidiConfigChange = useCallback(
    (patch: Partial<MidiConfig>) => {
      setMidiConfig({ ...midiConfig, ...patch });
    },
    [midiConfig, setMidiConfig]
  );

  const handleShowMidi = useCallback(() => {
    setIsMidiModalOpen(true);
  }, []);

  const handleCloseMidi = useCallback(() => {
    resetMidiProgramCache();
    setIsMidiModalOpen(false);
  }, [resetMidiProgramCache]);

  const handleSaveMidiConfig = useCallback(
    (config: MidiConfig) => {
      setMidiConfig(config);
      resetMidiProgramCache();
      setIsMidiModalOpen(false);
    },
    [resetMidiProgramCache, setMidiConfig]
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

  const handleSongFileChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files && event.target.files[0];
      if (!file) {
        return;
      }
      loadSong(file);
      try {
        event.target.value = '';
      } catch {
        // ignore
      }
    },
    [loadSong]
  );

  const handleInstrumentFileChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files && event.target.files[0];
      if (!file) {
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        const content = typeof reader.result === 'string' ? reader.result : '';
        handleInstrumentFileContent(content);
      };
      reader.onerror = () => {
        setInstrumentError('Error loading instrument file. Please check the file format.');
      };
      reader.readAsText(file);

      try {
        event.target.value = '';
      } catch {
        // ignore
      }
    },
    [handleInstrumentFileContent, setInstrumentError]
  );

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
            ym2149={ym2149Instance}
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
            isMobileCollapsed={isMobileViewport ? isCommandPanelMobileCollapsed : false}
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
            ym2149={ym2149Instance}
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
            ym2149={ym2149Instance}
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
            ym2149={ym2149Instance}
            currentInstrument={currentInstrument}
            previewChannel={previewChannel}
            onChangeBaseKey={handleChangeBaseKey}
            onPreviewMidiNoteOn={previewInstrumentMidiNoteOn}
            onPreviewMidiNoteOff={previewInstrumentMidiNoteOff}
            ensureAudioContextResumed={ensureAudioContextResumed}
          />
        }
        fileInputs={
          <>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,.yml,.yaml,.dosound"
              style={{ display: 'none' }}
              onChange={handleSongFileChange}
            />
            <input
              ref={instrumentFileInputRef}
              type="file"
              accept=".json,.yml,.yaml"
              style={{ display: 'none' }}
              onChange={handleInstrumentFileChange}
            />
          </>
        }
        modals={
          <>
            <ModalContainer
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
              midiConfig={midiConfig}
              midiDevices={midiDevices}
              midiInMonitor={midiInMonitor}
              midiOutMonitor={midiOutMonitor}
              onSaveMidiConfig={handleSaveMidiConfig}
              onCloseMidi={handleCloseMidi}
              onClearMidiMonitors={handleClearMidiMonitors}
              onRescanMidiDevices={handleRescanMidiDevices}
              onLiveMidiConfigChange={handleLiveMidiConfigChange}
              setMidiCopySummary={setMidiCopySummary}
              setMidiLoadError={setMidiLoadError}
              isDownloadOpen={isDownloadOpen}
              setIsDownloadOpen={setIsDownloadOpen}
              midiLoadError={midiLoadError}
              midiCopySummary={midiCopySummary}
              onMidiSystemReset={handleMidiSystemReset}
            />
            <FilePickerModal
              isOpen={isRepositoryInstrumentOpen}
              title="Pick Instrument"
              directory="repository/instrument"
              mode="pick"
              defaultSortDescending={false}
              onClose={() => setIsRepositoryInstrumentOpen(false)}
              onPick={handlePickRepositoryInstrument}
            />
            <FilePickerModal
              isOpen={isDemoSongPickerOpen}
              title="Demo Songs"
              directory="repository/song"
              mode="pick"
              defaultSortDescending={false}
              onClose={() => setIsDemoSongPickerOpen(false)}
              onPick={handlePickDemoSong}
            />
            <ExportModal
              isOpen={isExportModalOpen}
              exportType={pendingExportType}
              exportStrategy={pendingExportStrategy}
              onChangeType={handleExportTypeChange}
              onChangeStrategy={handleExportStrategyChange}
              onExportDump={handleExportDumpFromModal}
              onExportData={handleExportDataFromModal}
              onExportBin={handleExportBinFromModal}
              onExportVgm={handleExportVgmFromModal}
              onExportMax={handleExportMaxFromModal}
              onExportWav={handleExportWavFromModal}
              onConfirm={handleConfirmExport}
              onCancel={handleCancelExport}
            />
            <PasteTrackModal
              isOpen={isPasteTrackModalOpen}
              mode={pasteTrackPendingMode}
              onModeChange={setPasteTrackPendingMode}
              onConfirm={handleConfirmPasteTrackModal}
              onCancel={handleCancelPasteTrackModal}
            />
          </>
        }
      />
    </ErrorBoundary>
  );

};

export default App;

import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { useKeyboardNavigation } from './hooks/useKeyboardNavigation';
import { useTheme } from './hooks/useTheme';
import { useDataManagement } from './hooks/useDataManagement';
import { usePlaybackControls } from './hooks/usePlaybackControls';
import { useAudioSetup } from './hooks/useAudioSetup';
import { useModalManager } from './hooks/useModalManager';
import { useMidiHandling } from './hooks/useMidiHandling';
import { useTrackOperations } from './hooks/useTrackOperations';
import { usePlaylistOperations } from './hooks/usePlaylistOperations';
import { useScrollSync } from './hooks/useScrollSync';
import { useAppState } from './hooks/useAppState';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { YM2149 } from './synth/YM2149';
import type { SequencerState } from './hooks/useSequencer';
import type { Instrument, Note, Pattern, PatternLine } from './synth/SoundDriver';
import type { MidiConfig, MidiNoteEvent } from './hooks/useMidi';
import { PATTERN_LENGTH, MAX_INSTRUMENTS, NOTES, MIN_OCTAVE, MAX_OCTAVE, DEFAULT_OCTAVE, NOTE_BASE_OCTAVE } from './constants/music';
import yaml from 'js-yaml';
import { HeaderPanel } from './components/HeaderPanel';
import { CommandPanel } from './components/CommandPanel';
import { ErrorBoundary } from './components/ErrorBoundary';
import { PianoKeyboard } from './components/PianoKeyboard';
import { ModalContainer } from './components/ModalContainer';
import { AppLayout } from './components/AppLayout';
import { TracksSection } from './components/TracksSection';
import { InstrumentSection } from './components/InstrumentSection';
import { InfoSection } from './components/InfoSection';
import { exportInstrumentToAssembly, downloadAssemblyFile } from './utils/assemblyExport';
import { isInstrumentEmpty } from './utils/instrument';
import { useFileOperations } from './hooks/useFileOperations';
import type { UiStore } from './stores/uiStore';
import { useUiStore } from './stores/uiStore';
import './App.css';

declare const __APP_VERSION__: string;
const APP_VERSION = __APP_VERSION__;

type ElectronApi = {
  onAppCloseRequested?: (handler: () => void) => void;
  removeAppCloseRequestedListener?: (handler: () => void) => void;
  confirmAppClose?: () => void;
  cancelAppClose?: () => void;
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

  const [isNewSongConfirmOpen, setIsNewSongConfirmOpen] = useState(false);
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [isChangelogOpen, setIsChangelogOpen] = useState(false);
  const [changelogContent, setChangelogContent] = useState('');
  const [messages, setMessages] = useState<string[]>([]);
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const [isNotesVisible, setIsNotesVisible] = useState(true);
  const [isOptimizeConfirmOpen, setIsOptimizeConfirmOpen] = useState(false);
  const [isRenumberConfirmOpen, setIsRenumberConfirmOpen] = useState(false);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [isQuitConfirmOpen, setIsQuitConfirmOpen] = useState(false);
  const [optimizeSummary, setOptimizeSummary] = useState('');
  const [renumberSummary, setRenumberSummary] = useState('');
  const [isTransposeOpen, setIsTransposeOpen] = useState(false);
  const [transposeSummary, setTransposeSummary] = useState('');
  const [instrumentOperationSummary, setInstrumentOperationSummary] = useState('');
  const [midiLoadError, setMidiLoadError] = useState('');
  const [midiCopySummary, setMidiCopySummary] = useState('');
  const [isDownloadOpen, setIsDownloadOpen] = useState(false);
  const [downloadFiles, setDownloadFiles] = useState<string[]>([]);
  const [isMidiModalOpen, setIsMidiModalOpen] = useState(false);
  const [isDebugInfoOpen, setIsDebugInfoOpen] = useState(false);
  const [isInstrumentDeleteOpen, setIsInstrumentDeleteOpen] = useState(false);
  const [instrumentDeleteUsage, setInstrumentDeleteUsage] = useState<{
    instrumentId: string;
    instrumentName: string;
    usageCount: number;
    patternCount: number;
  }>({
    instrumentId: '',
    instrumentName: '',
    usageCount: 0,
    patternCount: 0
  });
  const [isInstrumentTypeWarningOpen, setIsInstrumentTypeWarningOpen] = useState(false);
  const [ignoreInstrumentTypeWarning, setIgnoreInstrumentTypeWarning] = useState<boolean>(() => {
    try {
      const raw = localStorage.getItem('dosound-tracker-ignore-inst-type-warning');
      return raw === '1';
    } catch {
      return false;
    }
  });
  const [instrumentTypeWarningIgnoreChecked, setInstrumentTypeWarningIgnoreChecked] = useState(false);
  const [pendingInstrumentContent, setPendingInstrumentContent] = useState<string | null>(null);
  const [pendingInstrumentTypeInfo, setPendingInstrumentTypeInfo] = useState<{
    hasTypeField: boolean;
    detectedType: string | null;
  } | null>(null);
  const [isInstrumentMidiOpen, setIsInstrumentMidiOpen] = useState(false);
  const [instrumentMidiTarget, setInstrumentMidiTarget] = useState<Instrument | null>(null);

  const {
    isDebugMode,
    setIsDebugMode,
    isComplexDumpMode,
    setIsComplexDumpMode,
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
    isSongDirty
  } = useDataManagement();

  const {
    soundExportSummary,
    dumpExportSummary,
    handleExportData,
    handleExportBin,
    handleExportVgm,
    handleExportWav,
    handleExportDump,
    handleCloseSoundExportSummary,
    handleCloseDumpExportSummary,
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
    isInstrumentMidiOpen;

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
      localStorage.setItem(
        'dosound-tracker-ignore-inst-type-warning',
        ignoreInstrumentTypeWarning ? '1' : '0'
      );
    } catch {
      // ignore
    }
  }, [ignoreInstrumentTypeWarning]);

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

  // Browser beforeunload guard for unsaved song changes (non-Electron only).
  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const extWindow = window as ExtendedWindow;
    const isElectronEnv = !!extWindow.electronAPI;
    if (isElectronEnv) {
      // Electron uses explicit IPC-based quit confirmation instead.
      return;
    }

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      const isResetting = extWindow.__dosoundTrackerIsResetting === true;
      if (!isSongDirty || isResetting) {
        return;
      }

      event.preventDefault();
      event.returnValue = '';
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isSongDirty]);

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
      if (!isSongDirty) {
        if (api.confirmAppClose) {
          api.confirmAppClose();
        }
        return;
      }
      setIsQuitConfirmOpen(true);
    };

    api.onAppCloseRequested(handler);
    return () => {
      if (api.removeAppCloseRequestedListener) {
        api.removeAppCloseRequestedListener(handler);
      }
    };
  }, [isSongDirty]);

  useEffect(() => {
    fetch('MESSAGES.md')
      .then(response => {
        if (!response.ok) {
          throw new Error('Failed to load messages.');
        }
        return response.text();
      })
      .then(text => {
        const lines = text.split('\n');
        const blocks: string[] = [];
        let current: string[] = [];

        for (const line of lines) {
          if (!line.trim()) {
            if (current.length > 0) {
              blocks.push(current.join(' '));
              current = [];
            }
          } else {
            current.push(line.trim());
          }
        }

        if (current.length > 0) {
          blocks.push(current.join(' '));
        }

        setMessages(blocks);

        if (blocks.length > 0) {
          const initialIndex = Math.floor(Math.random() * blocks.length);
          setCurrentMessageIndex(initialIndex);
        } else {
          setCurrentMessageIndex(0);
        }
      })
      .catch(() => {
        setMessages([]);
        setCurrentMessageIndex(0);
      });
  }, []);

  useEffect(() => {
    fetch('download/LIST.txt')
      .then(response => {
        if (!response.ok) {
          throw new Error('Failed to load download list.');
        }

        const contentType = response.headers.get('content-type') || '';
        if (contentType.includes('text/html')) {
          // Likely SPA fallback (index.html) instead of a real LIST.txt file.
          throw new Error('LIST.txt appears to be HTML, treating as missing.');
        }

        return response.text();
      })
      .then(text => {
        const lines = text.split(/\r?\n/);
        const trimmed = lines.map(line => line.trim());
        const nonEmpty = trimmed.filter(line => line.length > 0);
        const validFiles = nonEmpty.filter(line => {
          const base = (line.split(/[\\/]/).pop() || '').toLowerCase();
          return base !== '.gitkeep' && base !== 'list.txt';
        });

        if (validFiles.length === 0) {
          setDownloadFiles([]);
          return;
        }

        // Make the list unique and sort alphabetically in reverse order.
        const uniqueFiles = Array.from(new Set(validFiles));
        uniqueFiles.sort((a, b) => b.localeCompare(a, undefined, { sensitivity: 'base' }));

        const first = uniqueFiles[0].toLowerCase();
        if (first.startsWith('<!doctype') || first.startsWith('<html')) {
          // Defensive check: HTML content instead of plain filename list.
          setDownloadFiles([]);
          return;
        }

        setDownloadFiles(uniqueFiles);
      })
      .catch(() => {
        setDownloadFiles([]);
      });
  }, []);

  const notesIntervalRef = useRef<number | null>(null);
  const notesFadeTimeoutRef = useRef<number | null>(null);

  const handleNotesClick = useCallback(() => {
    const messagesLength = messages.length;

    if (messagesLength <= 1) {
      return;
    }

    if (notesIntervalRef.current !== null) {
      window.clearInterval(notesIntervalRef.current);
    }

    notesIntervalRef.current = window.setInterval(() => {
      handleNotesClick();
    }, 10000);

    setIsNotesVisible(false);

    if (notesFadeTimeoutRef.current !== null) {
      window.clearTimeout(notesFadeTimeoutRef.current);
    }

    notesFadeTimeoutRef.current = window.setTimeout(() => {
      setCurrentMessageIndex(prevIndex => {
        if (messagesLength <= 1) {
          return prevIndex;
        }

        let nextIndex = Math.floor(Math.random() * messagesLength);

        if (nextIndex === prevIndex && messagesLength > 1) {
          nextIndex = (prevIndex + 1) % messagesLength;
        }

        return nextIndex;
      });

      setIsNotesVisible(true);
    }, 800);
  }, [messages]);

  useEffect(() => {
    if (notesIntervalRef.current !== null) {
      window.clearInterval(notesIntervalRef.current);
      notesIntervalRef.current = null;
    }

    if (notesFadeTimeoutRef.current !== null) {
      window.clearTimeout(notesFadeTimeoutRef.current);
      notesFadeTimeoutRef.current = null;
    }

    const messagesLength = messages.length;

    if (messagesLength <= 1) {
      return;
    }

    notesIntervalRef.current = window.setInterval(() => {
      handleNotesClick();
    }, 10000);

    return () => {
      if (notesIntervalRef.current !== null) {
        window.clearInterval(notesIntervalRef.current);
        notesIntervalRef.current = null;
      }
      if (notesFadeTimeoutRef.current !== null) {
        window.clearTimeout(notesFadeTimeoutRef.current);
        notesFadeTimeoutRef.current = null;
      }
    };
  }, [messages, handleNotesClick]);

  // Audio setup
  const { ym2149Ref } = useAudioSetup();
  const instrumentFileInputRef = useRef<HTMLInputElement | null>(null);
  const playInstTimerRef = useRef<number | null>(null);
  const playInstStepRef = useRef<number>(0);
  const midiPreviewTimerRef = useRef<number | null>(null);
  const midiPreviewSubTickRef = useRef<number>(0);
  const midiPreviewEnvelopeStepRef = useRef<number>(0);
  const midiPreviewLastTickTimeRef = useRef<number | null>(null);
  const midiPreviewNextTickTimeRef = useRef<number | null>(null);
  const midiPreviewTimeoutRef = useRef<number | null>(null);
  const lastMidiPreviewRef = useRef<{
    noteNumber: number;
    midiChannel: number;
    ymChannel: number;
  } | null>(null);

  const midiLiveTimerRef = useRef<number | null>(null);
  const midiLiveSubTickRef = useRef<number>(0);
  const midiLiveEnvelopeStepRef = useRef<number>(0);
  const midiLiveLastTickTimeRef = useRef<number | null>(null);
  const midiLiveNextTickTimeRef = useRef<number | null>(null);
  const midiLiveSustainIndexRef = useRef<number | null>(null);
  const midiLiveReleasedRef = useRef<boolean>(false);
  const midiLiveLastVolumeIndexRef = useRef<number | null>(null);
  const midiLiveLastVolumeValueRef = useRef<number | null>(null);

  // YM2149 is initialized and managed by useAudioSetup

  // Track envelope timing for each channel
  // subTick: 0/1 toggled every 20ms, envelopeStep: 0,1,2,... advanced every 40ms
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
  const patternPlayingRef = useRef(false);

  const [lastTrackId, setLastTrackId] = useState<'A' | 'B' | 'C'>('A');
  const [currentTrackColumn, setCurrentTrackColumn] = useState<'note' | 'volume'>('note');
  const [trackFocusRevision, setTrackFocusRevision] = useState(0);
  const [instrumentListFocusRevision, setInstrumentListFocusRevision] = useState(0);

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

  // Track pattern playing state
  const [isPatternPlaying, setIsPatternPlaying] = useState(false);

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

  // Handle stop playback with silence
  const handleStopPlayback = useCallback(() => {
    // Reset cycle counters when stopping
    channelSubTickRef.current = [0, 0, 0];
    channelEnvelopeStepRef.current = [0, 0, 0];
    lastNotesRef.current = [null, null, null];
    lastSequencerPositionRef.current = null;
    channelVolumeModifierRef.current = [0x0f, 0x0f, 0x0f];
    channelSustainRef.current = [null, null, null];
    channelReleasedRef.current = [false, false, false];
    debugTickCounterRef.current = 0;
    debugLastRowRef.current = null;
    debugLastTimeRef.current = null;
    // Send MIDI Note Off for any active playback notes so external
    // devices do not get stuck notes when playback stops.
    const helpers = midiHelpersRef.current;
    if (helpers) {
      for (let ch = 0; ch < 3; ch += 1) {
        helpers.sendInstrumentMidiNoteOffForChannel(ch);
      }
    }
    
    // Silence all channels
    if (ym2149Ref.current) {
      ym2149Ref.current.silenceAll();
    }
  }, []);

  // Basic sequencer callback for playback
  const sequencerCallback = useCallback((state: SequencerState) => {
    const lastUiRow = lastUiRowRef.current;
    if (
      !lastUiRow ||
      lastUiRow.pattern !== state.currentPattern ||
      lastUiRow.line !== state.currentLine
    ) {
      lastUiRowRef.current = {
        pattern: state.currentPattern,
        line: state.currentLine
      };
      setSharedCurrentLine(state.currentLine);
    }

    const nextIsPatternPlaying = state.isPatternLoop && state.isPlaying;
    if (patternPlayingRef.current !== nextIsPatternPlaying) {
      patternPlayingRef.current = nextIsPatternPlaying;
      setIsPatternPlaying(nextIsPatternPlaying);
    }

    if (ym2149Ref.current) {
      const ym2149 = ym2149Ref.current;

      const wasPlaying = wasPlayingRef.current;

      if (!state.isPlaying) {
        if (wasPlaying) {
          handleStopPlayback();
        }
        wasPlayingRef.current = false;
        lastSequencerPositionRef.current = null;
        return;
      }

      wasPlayingRef.current = true;

      // Count each timing tick (20ms VBLANK) while playing so we can derive
      // 40ms debug cycles independent of pattern/row boundaries.
      debugTickCounterRef.current = (debugTickCounterRef.current + 1) >>> 0;

      const lastPos = lastSequencerPositionRef.current;
      const wrappedOrJumped =
        lastPos && state.currentPattern !== lastPos.pattern; // Only treat as wrap/jump if pattern actually changes

      // Detect if this is the first tick after starting playback
      const isFirstTick = !lastPos;

      lastSequencerPositionRef.current = {
        pattern: state.currentPattern,
        line: state.currentLine
      };

      if (wrappedOrJumped || isFirstTick) {
        // Always reset sub-tick timing on wrap/jump or first tick so 40ms
        // envelope steps realign, but avoid forcibly clearing notes just
        // because the playlist advanced to the next pattern.
        channelSubTickRef.current = [0, 0, 0];

        // On the very first tick after starting playback, reset envelopes,
        // notes, sustain state and per-channel volume modifiers so that any
        // stale state from a previous run does not leak into the new one.
        if (isFirstTick) {
          channelEnvelopeStepRef.current = [0, 0, 0];
          lastNotesRef.current = [null, null, null];
          channelSustainRef.current = [null, null, null];
          channelReleasedRef.current = [false, false, false];
          channelVolumeModifierRef.current = [0x0f, 0x0f, 0x0f];
          debugTickCounterRef.current = 0;
          debugLastRowRef.current = null;
          debugLastTimeRef.current = null;
        }
      }

      const playlistLength = currentSong.playlist.length;

      if (playlistLength === 0) {
        stop();
        handleStopPlayback();
        return;
      }
      
      const currentPatternIndex = state.currentPattern;
      
      if (currentPatternIndex < 0 || currentPatternIndex >= playlistLength) {
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

        lastSequencerPositionRef.current = null;
        setPosition(loopIndex, 0, 0);
        return;
      }
      
      const currentPlaylistEntry = currentSong.playlist[currentPatternIndex];
      
      if (currentPlaylistEntry) {
        // Get pattern data for each track
        const patternA = currentPlaylistEntry.trackA ? patternsById.get(currentPlaylistEntry.trackA) : undefined;
        const patternB = currentPlaylistEntry.trackB ? patternsById.get(currentPlaylistEntry.trackB) : undefined;
        const patternC = currentPlaylistEntry.trackC ? patternsById.get(currentPlaylistEntry.trackC) : undefined;
        
        // Allow playback even if some tracks are empty (using --)
        // Get current line data (patterns are track-agnostic - read trackA data for any track)
        const lineA = patternA?.lines[state.currentLine];
        const lineB = patternB?.lines[state.currentLine];
        const lineC = patternC?.lines[state.currentLine];

        const noteA = lineA?.trackA || null;
        const noteB = patternB ? (lineB?.trackA || null) : null; // Read trackA for track B
        const noteC = patternC ? (lineC?.trackA || null) : null; // Read trackA for track C

        const notes = [noteA, noteB, noteC];
        const patterns = [patternA, patternB, patternC];
        const volumes = [
          lineA?.volume,
          patternB ? lineB?.volume : undefined,
          patternC ? lineC?.volume : undefined
        ];
        const lastNotes = lastNotesRef.current;

        const lastLogged = debugLastRowRef.current;
        const shouldLogRow =
          isDebugMode &&
          state.isPlaying &&
          (!lastLogged ||
            lastLogged.pattern !== state.currentPattern ||
            lastLogged.line !== state.currentLine);

        if (shouldLogRow) {
          try {
            const now = new Date();
            const hh = String(now.getHours()).padStart(2, '0');
            const mm = String(now.getMinutes()).padStart(2, '0');
            const ss = String(now.getSeconds()).padStart(2, '0');
            const ms = String(now.getMilliseconds()).padStart(3, '0');
            const timeStr = `${hh}:${mm}:${ss}.${ms}`;

            const nowMs = now.getTime();
            const lastMs = debugLastTimeRef.current;
            const rawDelta = lastMs != null ? nowMs - lastMs : 0;
            const clampedDelta = Math.max(0, Math.min(999, rawDelta | 0));
            const deltaStr = String(clampedDelta).padStart(3, '0');

            // Each worker tick is ~20ms; treat two ticks (40ms) as one cycle.
            const tickCount = debugTickCounterRef.current;
            const cycle = Math.floor(tickCount / 2) & 0xffff;
            const cycleHex = cycle.toString(16).toUpperCase().padStart(4, '0');
            const stepHex = state.currentLine.toString(16).toUpperCase().padStart(2, '0');

            const channelStrings = [0, 1, 2].map(ch => {
              const noteOnRow = notes[ch];
              const volumeOnRow = volumes[ch];

              let volText: string;
              if (volumeOnRow === undefined || volumeOnRow === null) {
                volText = '-';
              } else {
                const clampedVol = Math.max(0, Math.min(0x0f, (volumeOnRow as number) | 0));
                volText = clampedVol.toString(16).toUpperCase();
              }

              if (!noteOnRow) {
                return `--- -- ${volText}`;
              }

              if (noteOnRow.note === '===') {
                return `=== -- ${volText}`;
              }

              const baseNote = noteOnRow.note || '';
              const formattedNote = baseNote.includes('#') ? baseNote : `${baseNote}-`;
              const noteText = `${formattedNote}${noteOnRow.octave}`;
              const rawInst = noteOnRow.instrument as unknown;
              let instText = '';

              if (typeof rawInst === 'number' && Number.isFinite(rawInst)) {
                instText = rawInst.toString(16).padStart(2, '0').toUpperCase();
              } else if (typeof rawInst === 'string') {
                const trimmed = rawInst.trim();
                if (trimmed) {
                  const sanitized = trimmed.startsWith('$') ? trimmed.slice(1) : trimmed;
                  const upper = sanitized.toUpperCase();
                  if (/^[0-9A-F]{1,2}$/.test(upper)) {
                    instText = upper.padStart(2, '0');
                  } else {
                    instText = upper;
                  }
                }
              }

              const safeInst = instText && instText.trim().length > 0 ? instText : '--';
              return `${noteText} ${safeInst} ${volText}`;
            });

            const debugLine = `${timeStr} | ${deltaStr} | ${cycleHex} | ${stepHex} | ${channelStrings[0]} | ${channelStrings[1]} | ${channelStrings[2]} |`;
            // eslint-disable-next-line no-console
            console.log(debugLine);
            debugLastRowRef.current = {
              pattern: state.currentPattern,
              line: state.currentLine
            };
            debugLastTimeRef.current = nowMs;
          } catch (error) {
            // eslint-disable-next-line no-console
            console.error('Debug logging failed:', error);
          }
        }

        for (let ch = 0; ch < 3; ch++) {
          if (channelMutes[ch]) {
            const volumeRegister = 8 + ch;
            ym2149.writeRegister(volumeRegister, 0x00);
            continue;
          }

          const pattern = patterns[ch];
          const noteOnRow = notes[ch];
          const volumeOnRow = volumes[ch];
          const last = lastNotes[ch];

          // If no pattern is assigned on this channel for the current
          // playlist position, treat it as sustain/no-op: keep any
          // previously playing note sounding instead of forcing an
          // immediate rest here. Initial startup silence is still
          // handled separately by the isFirstTick logic below.
          if (!pattern) {
            // Nothing to do on this row for this channel; fall through so
            // envelope timing and note-hold behaviour continue unchanged.
          }

          // Explicit note-off event on this row. Only act on the first
          // tick of the row so we match the offline export logic.
          if (state.currentTick === 0 && noteOnRow && noteOnRow.note === '===') {
            // For MIDI output, treat this as an explicit key release and
            // send a matching Note Off for any active note on this
            // playback channel.
            sendInstrumentMidiNoteOffForChannel(ch);

            const sustainIndex = channelSustainRef.current[ch];

            if (
              sustainIndex === null ||
              sustainIndex === undefined ||
              sustainIndex < 0 ||
              !last
            ) {
              // No sustain defined (or no active note) - treat as hard mute
              channelEnvelopeStepRef.current[ch] = 0;
              channelSubTickRef.current[ch] = 0;
              updateChannelWithInstrument(ym2149, ch, null, 0);
              lastNotes[ch] = null;
              channelSustainRef.current[ch] = null;
              channelReleasedRef.current[ch] = false;
              continue;
            }

            // Instrument has a sustain point and a note is active: this
            // note-off acts as a release trigger instead of an immediate
            // mute. Keep holding the last note and allow the envelope to
            // continue past the sustain position.
            channelReleasedRef.current[ch] = true;
            // Do not reset envelope step or clear lastNotes; fall through
          }

          // On the very first tick after starting playback, if there is no
          // explicit note on this row, ensure the channel starts from a
          // silent state so we do not accidentally reuse a stale note from a
          // previous run. Afterwards, notes are allowed to sustain naturally
          // across pattern boundaries unless an explicit note-off or rest is
          // present in the data.
          if (isFirstTick && !noteOnRow) {
            channelEnvelopeStepRef.current[ch] = 0;
            channelSubTickRef.current[ch] = 0;
            updateChannelWithInstrument(ym2149, ch, null, 0);
            lastNotes[ch] = null;
            channelSustainRef.current[ch] = null;
            channelReleasedRef.current[ch] = false;
            continue;
          }

          // Determine active note: explicit note on this row if present, otherwise
          // continue holding the last active note.
          let activeNote: Note | null = last;
          const hasExplicitNote = !!(noteOnRow && noteOnRow.note && noteOnRow.note !== '===');

          // Update per-channel volume modifier when a volume nibble is present on this row.
          if (volumeOnRow !== undefined && volumeOnRow !== null) {
            const clamped = Math.max(0, Math.min(0x0f, (volumeOnRow as number) | 0));
            channelVolumeModifierRef.current[ch] = clamped;
          }

          if (hasExplicitNote) {
            // New explicit note on this row
            activeNote = noteOnRow;

            // Retrigger envelopes and send MIDI output only on the first tick of the
            // row so that the same note is not re-sent multiple times when
            // ticksPerRow > 1.
            if (state.currentTick === 0) {
              channelEnvelopeStepRef.current[ch] = 0;
              channelSubTickRef.current[ch] = 0;

              // Resolve sustain position for the instrument used by this note.
              const instId = activeNote && typeof activeNote.instrument === 'string'
                ? activeNote.instrument
                : '';
              const instrument = instrumentsById.get(instId);
              const rawSustain = instrument?.sustain ?? null;
              if (typeof rawSustain === 'number' && Number.isFinite(rawSustain) && rawSustain >= 0) {
                channelSustainRef.current[ch] = Math.floor(rawSustain);
              } else {
                channelSustainRef.current[ch] = null;
              }
              channelReleasedRef.current[ch] = false;

              let volumeForMidi: number | null = null;
              if (volumeOnRow !== undefined && volumeOnRow !== null) {
                volumeForMidi = Math.max(0, Math.min(0x0f, (volumeOnRow as number) | 0));
              }

              if (instrument && activeNote && activeNote.note && activeNote.note !== '===') {
                const helpers = midiHelpersRef.current;
                if (helpers) {
                  helpers.sendInstrumentMidiNoteOn(
                    ch,
                    instrument,
                    activeNote.note,
                    activeNote.octave,
                    volumeForMidi
                  );
                }
              }
            }
          }

          if (activeNote && activeNote.note && activeNote.note !== '===') {
            // Use current step as envelope tick (so a freshly triggered note
            // starts at step 0, matching the piano keyboard behaviour), then
            // advance the step every 40ms (every 2 x 20ms ticks).
            const rawStep = channelEnvelopeStepRef.current[ch];
            const sustainIndex = channelSustainRef.current[ch];
            const isReleased = channelReleasedRef.current[ch];

            // While the key is held and a sustain index is defined, clamp
            // the effective envelope position at the sustain step. Once a
            // key-release has occurred, allow the envelope to continue.
            let step = rawStep;
            if (
              sustainIndex !== null &&
              sustainIndex !== undefined &&
              sustainIndex >= 0 &&
              !isReleased &&
              rawStep >= sustainIndex
            ) {
              step = sustainIndex;
            }
            const volumeModifier = channelVolumeModifierRef.current[ch];

            updateChannelWithInstrument(ym2149, ch, activeNote, step, volumeModifier);

            // Envelope progression at 25 Hz: only advance on every second tick
            const sub = (channelSubTickRef.current[ch] + 1) % 2;
            channelSubTickRef.current[ch] = sub;
            if (sub === 0) {
              // Advance the underlying envelope step only if either there is
              // no sustain point, the note has been released, or we have
              // not yet reached the sustain index. This implements a
              // classic hold-at-sustain-until-release behaviour.
              if (
                sustainIndex === null ||
                sustainIndex === undefined ||
                sustainIndex < 0 ||
                isReleased ||
                rawStep < sustainIndex
              ) {
                channelEnvelopeStepRef.current[ch] = rawStep + 1;
              }
            }
            lastNotes[ch] = activeNote;
          } else {
            // No active note at all. Explicit rests and hard mutes are
            // already handled above (no pattern, note-off without
            // sustain, or initial startup row). Leaving the YM2149
            // registers as-is here avoids brief drop-outs if state
            // transiently reports no note for a single tick.
            channelEnvelopeStepRef.current[ch] = 0;
            channelSubTickRef.current[ch] = 0;
            lastNotes[ch] = null;
            channelSustainRef.current[ch] = null;
            channelReleasedRef.current[ch] = false;
          }
        }
      }
    }
  }, [
    setSharedCurrentLine,
    setIsPatternPlaying,
    currentSong,
    stop,
    handleStopPlayback,
    setPosition,
    channelMutes,
    isDebugMode,
    instrumentsById
  ]);

  // Register sequencer callback
  useEffect(() => {
    setCallback(sequencerCallback);
  }, [setCallback, sequencerCallback]);

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

  // Helper function to update channel with instrument and all envelopes
  const updateChannelWithInstrument = useCallback((
    ym2149: YM2149,
    channel: number,
    noteData: Note | null,
    envelopeStep: number = 0,
    volumeModifier?: number | null
  ) => {
    const normalizedNoteInstrumentId = noteData ? normalizeInstrumentId(noteData.instrument) : '';

    let resolvedInstrumentId = normalizedNoteInstrumentId;
    if (!resolvedInstrumentId) {
      const fallbackSourceId = currentInstrument?.id ?? currentSong.instruments[0]?.id;
      resolvedInstrumentId = normalizeInstrumentId(fallbackSourceId);
    }

    const instrument = resolvedInstrumentId
      ? instrumentLookupByNormalizedId.get(resolvedInstrumentId)
      : undefined;
    
    if (!instrument || !noteData || noteData.note === '===') {
      // No instrument or no active note - silence channel
      const volumeRegister = 8 + channel;
      ym2149.writeRegister(volumeRegister, 0x00);
      return;
    }

    // Use YM2149's built-in method to update channel with instrument
    ym2149.updateChannelWithInstrument(
      channel,
      instrument,
      { note: noteData.note, octave: noteData.octave },
      envelopeStep,
      volumeModifier
    );
  }, [
    currentSong.instruments,
    currentInstrument?.id,
    normalizeInstrumentId,
    instrumentLookupByNormalizedId
  ]);

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

  const handleShowAbout = useCallback(() => {
    setIsAboutOpen(true);
  }, []);

  const handleRequestNewSong = useCallback(() => {
    setIsNewSongConfirmOpen(true);
  }, []);

  const handleConfirmNewSong = useCallback(() => {
    createNewSong();
    setCurrentOctave(3);
    setChannelMutes([false, false, false]);
    setPosition(0, 0, 0);
    setSharedCurrentLine(0);
    setActiveSection('volume');

    setIsNewSongConfirmOpen(false);
  }, [createNewSong, setPosition, setActiveSection]);

  const handleCancelNewSong = useCallback(() => {
    setIsNewSongConfirmOpen(false);
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
    setChangelogContent('Loading...');
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

  const handleToggleDumpMode = useCallback(() => {
    setIsComplexDumpMode(prev => !prev);
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

  const handleInstrumentFileContent = useCallback((content: string) => {
    if (!content) {
      return;
    }

    if (ignoreInstrumentTypeWarning) {
      loadInstrument(content);
      setActiveSection('instrumentList');
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
      setPendingInstrumentContent(content);
      setPendingInstrumentTypeInfo({ hasTypeField, detectedType });
      setInstrumentTypeWarningIgnoreChecked(ignoreInstrumentTypeWarning);
      setIsInstrumentTypeWarningOpen(true);
      return;
    }

    loadInstrument(content);
    setActiveSection('instrumentList');
  }, [
    ignoreInstrumentTypeWarning,
    loadInstrument,
    setActiveSection,
    setInstrumentError,
    setPendingInstrumentContent,
    setPendingInstrumentTypeInfo,
    setInstrumentTypeWarningIgnoreChecked,
    setIsInstrumentTypeWarningOpen
  ]);

  const handleConfirmInstrumentTypeWarning = useCallback(() => {
    if (!pendingInstrumentContent) {
      setIsInstrumentTypeWarningOpen(false);
      return;
    }

    if (instrumentTypeWarningIgnoreChecked && !ignoreInstrumentTypeWarning) {
      setIgnoreInstrumentTypeWarning(true);
    }

    const content = pendingInstrumentContent;

    setIsInstrumentTypeWarningOpen(false);
    setPendingInstrumentContent(null);
    setPendingInstrumentTypeInfo(null);

    loadInstrument(content);
    setActiveSection('instrumentList');
  }, [
    pendingInstrumentContent,
    instrumentTypeWarningIgnoreChecked,
    ignoreInstrumentTypeWarning,
    setIgnoreInstrumentTypeWarning,
    loadInstrument,
    setActiveSection,
    setPendingInstrumentContent,
    setPendingInstrumentTypeInfo,
    setIsInstrumentTypeWarningOpen,
  ]);

  const handleCancelInstrumentTypeWarning = useCallback(() => {
    setIsInstrumentTypeWarningOpen(false);
    setPendingInstrumentContent(null);
    setPendingInstrumentTypeInfo(null);
  }, []);

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
    setInstrumentListFocusRevision(prev => prev + 1);
  }, [setActiveSection, setInstrumentListFocusRevision]);

  const handleSaveInstrumentMidi = useCallback(
    (midi: { channel: number | null; program: number | null }) => {
      if (!instrumentMidiTarget) {
        setIsInstrumentMidiOpen(false);
        setActiveSection('instrumentList');
        setInstrumentListFocusRevision(prev => prev + 1);
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
      setInstrumentListFocusRevision(prev => prev + 1);
    },
    [
      instrumentMidiTarget,
      currentSong.instruments,
      updateSong,
      currentInstrument,
      setCurrentInstrument,
      setActiveSection,
      setInstrumentListFocusRevision
    ]
  );

  const handleRenameInstrument = useCallback((name: string) => {
    updateInstrument({ name });
  }, [updateInstrument]);

  const handleChangeBaseKey = useCallback((note: string, octave: number) => {
    const upper = note.toUpperCase();
    const formatted = upper.endsWith('#')
      ? `${upper}${octave}`
      : `${upper}-${octave}`;
    updateInstrument({ base: formatted });
  }, [updateInstrument]);

  const handlePlayInstrument = useCallback(() => {
    if (!ym2149Ref.current) {
      return;
    }

    const base = parseBaseKeyString(currentInstrument.base || 'C-4');
    if (!base) {
      return;
    }

    const ym2149 = ym2149Ref.current;

    const channel =
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

    if (playInstTimerRef.current !== null) {
      window.clearInterval(playInstTimerRef.current);
      playInstTimerRef.current = null;
    }

    playInstStepRef.current = 0;
    let playInstSubTick = 0;

    const noteData = { note: base.note, octave: base.octave };

    ym2149.updateChannelWithInstrument(channel, currentInstrument as any, noteData, 0, 0x0f);

    playInstTimerRef.current = window.setInterval(() => {
      // Advance envelope step every 40ms (every 2 x 20ms ticks)
      const step = playInstStepRef.current;
      ym2149.updateChannelWithInstrument(channel, currentInstrument as any, noteData, step, 0x0f);

      playInstSubTick = (playInstSubTick + 1) % 2;
      if (playInstSubTick === 0) {
        playInstStepRef.current = playInstStepRef.current + 1;
      }

      if (playInstStepRef.current >= 64) {
        if (playInstTimerRef.current !== null) {
          window.clearInterval(playInstTimerRef.current);
          playInstTimerRef.current = null;
        }
        ym2149.writeRegister(0x08 + channel, 0x00);
      }
    }, 20);
  }, [activeSection, currentInstrument, lastTrackId, parseBaseKeyString]);

  const handleExportInstrumentAssembly = useCallback(() => {
    try {
      const asm = exportInstrumentToAssembly(currentInstrument, currentSong);
      const safeName = (currentInstrument.name || `instrument_${currentInstrument.id}`)
        .replace(/[^a-z0-9]/gi, '_')
        .toLowerCase();
      downloadAssemblyFile(asm, `${safeName}.s`);
    } catch (error) {
      console.error('Instrument assembly export failed:', error);
    }
  }, [currentInstrument, currentSong]);

  const handleCloneInstrument = useCallback(() => {
    const instruments = currentSong.instruments;
    if (instruments.length >= MAX_INSTRUMENTS) {
      setInstrumentOperationSummary('No free instrument slots available.');
      return;
    }

    const currentIndex = instruments.findIndex(inst => inst.id === currentInstrument.id);

    const isSlotFree = (inst: Instrument | undefined) => !inst || isInstrumentEmpty(inst);

    let slotIndex = -1;

    if (currentIndex >= 0) {
      for (let i = currentIndex + 1; i < instruments.length; i++) {
        if (isSlotFree(instruments[i])) {
          slotIndex = i;
          break;
        }
      }

      if (slotIndex === -1) {
        for (let i = 0; i <= currentIndex; i++) {
          if (isSlotFree(instruments[i])) {
            slotIndex = i;
            break;
          }
        }
      }
    }

    if (slotIndex === -1) {
      slotIndex = instruments.length;
    }

    if (slotIndex >= MAX_INSTRUMENTS) {
      setInstrumentOperationSummary('No free instrument slots available.');
      return;
    }

    const slotId = slotIndex.toString(16).padStart(2, '0').toUpperCase();

    const clonedInstrument: Instrument = {
      ...currentInstrument,
      id: slotId
    };

    const updatedInstruments = [...instruments];
    if (slotIndex < updatedInstruments.length) {
      updatedInstruments[slotIndex] = clonedInstrument;
    } else {
      updatedInstruments.push(clonedInstrument);
    }

    updateSong({ instruments: updatedInstruments });
    setCurrentInstrument(clonedInstrument);
    setActiveSection('instrumentList');
  }, [currentSong.instruments, currentInstrument, updateSong, setCurrentInstrument, setActiveSection, setInstrumentOperationSummary]);

  const handleDeleteInstrument = useCallback(() => {
    const instruments = currentSong.instruments;
    if (!currentInstrument || instruments.length === 0) {
      return;
    }

    const targetIdNorm = normalizeInstrumentId(currentInstrument.id);
    if (!targetIdNorm) {
      return;
    }

    const index = instruments.findIndex(inst => normalizeInstrumentId(inst?.id) === targetIdNorm);
    if (index === -1) {
      setInstrumentOperationSummary('Current instrument not found in song instruments.');
      return;
    }

    let usageCount = 0;
    let patternCount = 0;

    currentSong.patterns.forEach(pattern => {
      if (!pattern) {
        return;
      }

      let patternHasUsage = false;

      (pattern.lines || []).forEach(line => {
        if (!line) {
          return;
        }

        (['trackA', 'trackB', 'trackC'] as Array<'trackA' | 'trackB' | 'trackC'>).forEach(key => {
          const note = line[key];
          if (!note) {
            return;
          }

          const noteInstIdNorm = normalizeInstrumentId((note as any).instrument as any);
          if (noteInstIdNorm && noteInstIdNorm === targetIdNorm) {
            usageCount++;
            patternHasUsage = true;
          }
        });
      });

      if (patternHasUsage) {
        patternCount++;
      }
    });

    if (usageCount === 0) {
      const slot = instruments[index];
      const slotId = slot?.id || currentInstrument.id;

      const clearedInstrument: Instrument = {
        id: slotId,
        name: '',
        volume: Array(32).fill(0),
        arpeggio: Array(32).fill(0),
        pitch: Array(32).fill(0),
        noiseEnvelope: Array(32).fill(0),
        mode: Array(32).fill(0)
      };

      const newInstruments = [...instruments];
      newInstruments[index] = clearedInstrument;

      updateSong({ instruments: newInstruments });
      setCurrentInstrument(clearedInstrument);
      setActiveSection('instrumentList');
      return;
    }

    const slot = instruments[index];
    const slotId = slot?.id || currentInstrument.id;
    const slotName = slot?.name || currentInstrument.name || '';

    setInstrumentDeleteUsage({
      instrumentId: slotId,
      instrumentName: slotName,
      usageCount,
      patternCount
    });
    setIsInstrumentDeleteOpen(true);
  }, [
    currentSong.instruments,
    currentSong.patterns,
    currentInstrument,
    normalizeInstrumentId,
    updateSong,
    setCurrentInstrument,
    setActiveSection,
    setInstrumentOperationSummary,
    setInstrumentDeleteUsage,
    setIsInstrumentDeleteOpen
  ]);

  const handleMoveInstrument = useCallback((index: number, direction: 'up' | 'down') => {
    const instruments = currentSong.instruments;
    const length = instruments.length;

    if (length === 0) {
      return;
    }

    const delta = direction === 'up' ? -1 : 1;
    const targetIndex = index + delta;

    if (targetIndex < 0 || targetIndex >= length) {
      return;
    }

    const instrumentIdMap: Record<string, string> = {};
    const newInstruments: Instrument[] = [];

    for (let i = 0; i < length; i++) {
      const inst = instruments[i];
      if (!inst) {
        continue;
      }

      let newIndex = i;
      if (i === index) {
        newIndex = targetIndex;
      } else if (i === targetIndex) {
        newIndex = index;
      }

      const newId = newIndex.toString(16).padStart(2, '0').toUpperCase();
      const oldIdNorm = (inst.id || '').trim().toUpperCase();
      if (oldIdNorm) {
        instrumentIdMap[oldIdNorm] = newId;
      }

      newInstruments[newIndex] = {
        ...inst,
        id: newId
      };
    }

    const remappedPatterns = currentSong.patterns.map(pattern => {
      const lines = (pattern.lines || []).map(line => {
        const newLine = { ...line };

        (['trackA', 'trackB', 'trackC'] as Array<'trackA' | 'trackB' | 'trackC'>).forEach(key => {
          const note = newLine[key];
          if (note && typeof note.instrument === 'string') {
            const raw = note.instrument.trim().toUpperCase();
            const mapped = instrumentIdMap[raw];
            if (mapped) {
              newLine[key] = {
                ...note,
                instrument: mapped
              };
            }
          }
        });

        return newLine;
      });

      return {
        ...pattern,
        lines
      };
    });

    updateSong({
      instruments: newInstruments,
      patterns: remappedPatterns
    });

    let nextCurrentInstrument = currentInstrument;
    if (currentInstrument) {
      const currentIdNorm = (currentInstrument.id || '').trim().toUpperCase();
      const mappedId = instrumentIdMap[currentIdNorm];
      if (mappedId) {
        const updatedFromList = newInstruments.find(inst => inst && inst.id === mappedId);
        if (updatedFromList) {
          nextCurrentInstrument = updatedFromList;
        } else {
          nextCurrentInstrument = {
            ...currentInstrument,
            id: mappedId
          };
        }
      }
    }

    if (nextCurrentInstrument) {
      setCurrentInstrument(nextCurrentInstrument);
    }

    setActiveSection('instrumentList');
  }, [currentSong.instruments, currentSong.patterns, currentInstrument, updateSong, setCurrentInstrument, setActiveSection]);

  const handleCancelInstrumentDelete = useCallback(() => {
    setIsInstrumentDeleteOpen(false);
  }, []);

  const handleConfirmDeleteInstrumentAndNotes = useCallback(() => {
    if (!instrumentDeleteUsage.instrumentId) {
      setIsInstrumentDeleteOpen(false);
      return;
    }

    const targetIdNorm = normalizeInstrumentId(instrumentDeleteUsage.instrumentId);
    if (!targetIdNorm) {
      setIsInstrumentDeleteOpen(false);
      return;
    }

    const instruments = currentSong.instruments;
    const patterns = currentSong.patterns;

    const index = instruments.findIndex(inst => normalizeInstrumentId(inst?.id) === targetIdNorm);
    if (index === -1) {
      setIsInstrumentDeleteOpen(false);
      setInstrumentOperationSummary('Instrument no longer found. No changes were applied.');
      return;
    }

    const slot = instruments[index];
    const slotId = slot?.id || instrumentDeleteUsage.instrumentId;
    const slotName = slot?.name || instrumentDeleteUsage.instrumentName || '';

    const clearedInstrument: Instrument = {
      id: slotId,
      name: '',
      volume: Array(32).fill(0),
      arpeggio: Array(32).fill(0),
      pitch: Array(32).fill(0),
      noiseEnvelope: Array(32).fill(0),
      mode: Array(32).fill(0)
    };

    const newInstruments = [...instruments];
    newInstruments[index] = clearedInstrument;

    let notesCleared = 0;
    let patternsTouched = 0;

    const updatedPatterns = patterns.map(pattern => {
      if (!pattern) {
        return pattern;
      }

      let patternChanged = false;
      const newLines = (pattern.lines || []).map(line => {
        if (!line) {
          return line;
        }

        const newLine: PatternLine = { ...line };
        let lineChanged = false;

        (['trackA', 'trackB', 'trackC'] as Array<'trackA' | 'trackB' | 'trackC'>).forEach(key => {
          const note = newLine[key];
          if (!note) {
            return;
          }

          const noteInstIdNorm = normalizeInstrumentId((note as any).instrument as any);
          if (noteInstIdNorm && noteInstIdNorm === targetIdNorm) {
            newLine[key] = null;
            lineChanged = true;
            notesCleared++;
          }
        });

        if (lineChanged) {
          patternChanged = true;
        }

        return newLine;
      });

      if (patternChanged) {
        patternsTouched++;
        return {
          ...pattern,
          lines: newLines
        };
      }

      return pattern;
    });

    updateSong({
      instruments: newInstruments,
      patterns: updatedPatterns
    });

    setCurrentInstrument(clearedInstrument);
    setActiveSection('instrumentList');
    setIsInstrumentDeleteOpen(false);

    const idLabel = slotId.trim() || '--';
    const nameLabel = slotName || '';

    const lines: string[] = [];
    lines.push('Instrument removal complete.');
    lines.push('');
    lines.push(`Instrument: ${idLabel}${nameLabel ? ` (${nameLabel})` : ''}`);
    lines.push('Mode: Delete notes using this instrument and clear slot.');
    lines.push('');
    lines.push(`Patterns with this instrument before delete: ${instrumentDeleteUsage.patternCount}`);
    lines.push(`Notes using this instrument before delete: ${instrumentDeleteUsage.usageCount}`);
    lines.push('');
    lines.push(`Patterns changed in this operation: ${patternsTouched}`);
    lines.push(`Notes cleared in this operation: ${notesCleared}`);

    setInstrumentOperationSummary(lines.join('\n'));
  }, [
    currentSong.instruments,
    currentSong.patterns,
    instrumentDeleteUsage.instrumentId,
    instrumentDeleteUsage.instrumentName,
    instrumentDeleteUsage.patternCount,
    instrumentDeleteUsage.usageCount,
    normalizeInstrumentId,
    updateSong,
    setCurrentInstrument,
    setActiveSection,
    setIsInstrumentDeleteOpen,
    setInstrumentOperationSummary
  ]);

  const handleConfirmDeleteInstrumentOnly = useCallback(() => {
    if (!instrumentDeleteUsage.instrumentId) {
      setIsInstrumentDeleteOpen(false);
      return;
    }

    const targetIdNorm = normalizeInstrumentId(instrumentDeleteUsage.instrumentId);
    if (!targetIdNorm) {
      setIsInstrumentDeleteOpen(false);
      return;
    }

    const instruments = currentSong.instruments;
    const index = instruments.findIndex(inst => normalizeInstrumentId(inst?.id) === targetIdNorm);
    if (index === -1) {
      setIsInstrumentDeleteOpen(false);
      setInstrumentOperationSummary('Instrument no longer found. No changes were applied.');
      return;
    }

    const slot = instruments[index];
    const slotId = slot?.id || instrumentDeleteUsage.instrumentId;
    const slotName = slot?.name || instrumentDeleteUsage.instrumentName || '';

    const clearedInstrument: Instrument = {
      id: slotId,
      name: '',
      volume: Array(32).fill(0),
      arpeggio: Array(32).fill(0),
      pitch: Array(32).fill(0),
      noiseEnvelope: Array(32).fill(0),
      mode: Array(32).fill(0)
    };

    const newInstruments = [...instruments];
    newInstruments[index] = clearedInstrument;

    updateSong({ instruments: newInstruments });
    setCurrentInstrument(clearedInstrument);
    setActiveSection('instrumentList');
    setIsInstrumentDeleteOpen(false);

    const idLabel = slotId.trim() || '--';
    const nameLabel = slotName || '';

    const lines: string[] = [];
    lines.push('Instrument removal complete.');
    lines.push('');
    lines.push(`Instrument: ${idLabel}${nameLabel ? ` (${nameLabel})` : ''}`);
    lines.push('Mode: Clear instrument only (keep notes).');
    lines.push('');
    lines.push(`Patterns that reference this instrument: ${instrumentDeleteUsage.patternCount}`);
    lines.push(`Notes that reference this instrument: ${instrumentDeleteUsage.usageCount}`);
    lines.push('');
    lines.push('Patterns changed in this operation: 0');
    lines.push('Notes cleared in this operation: 0');

    setInstrumentOperationSummary(lines.join('\n'));
  }, [
    currentSong.instruments,
    instrumentDeleteUsage.instrumentId,
    instrumentDeleteUsage.instrumentName,
    instrumentDeleteUsage.patternCount,
    instrumentDeleteUsage.usageCount,
    normalizeInstrumentId,
    updateSong,
    setCurrentInstrument,
    setActiveSection,
    setIsInstrumentDeleteOpen,
    setInstrumentOperationSummary
  ]);

  // Handle stop playback with silence
  const handleStop = useCallback(() => {
    // Stop the sequencer
    stop();

    // Ensure pattern play state is cleared so buttons show PLAY again
    setIsPatternPlaying(false);
    
    // Stop any instrument preview playback
    if (playInstTimerRef.current !== null) {
      window.clearInterval(playInstTimerRef.current);
      playInstTimerRef.current = null;
    }

    // Reset cycle counters and silence all channels
    handleStopPlayback();
  }, [stop, handleStopPlayback]);

  // Handle stop pattern playback
  const handleStopPattern = useCallback(() => {
    // Stop the sequencer
    stop();
    
    // Update pattern playing state
    setIsPatternPlaying(false);
    
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
    if (currentSong.playlist.length === 0) {
      return;
    }

    const clampedIndex = Math.max(
      0,
      Math.min(sequencerState.currentPattern, currentSong.playlist.length - 1)
    );

    // If we are currently in pattern-loop mode, switch to song playback
    // and continue from the current position instead of restarting.
    if (isPatternPlaying) {
      const currentLine = sequencerState.currentLine;

      setIsPatternPlaying(false);

      // Clear position ref to ensure first tick detection works
      lastSequencerPositionRef.current = null;

      // Start song playback from the current pattern/line
      startSong(clampedIndex, currentLine);
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
    isPatternPlaying,
    startSong,
    sequencerState.currentPattern,
    sequencerState.currentLine,
    currentSong.playlist,
    sharedCurrentLine
  ]);

  // Handle start pattern playback
  const handleStartPattern = useCallback(() => {
    if (currentSong.playlist.length === 0) {
      return;
    }

    const clampedIndex = Math.max(
      0,
      Math.min(sequencerState.currentPattern, currentSong.playlist.length - 1)
    );
    const currentEntry = currentSong.playlist[clampedIndex];

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
        patternId = currentEntry.trackA;
        break;
      case 'B':
        patternId = currentEntry.trackB;
        break;
      case 'C':
        patternId = currentEntry.trackC;
        break;
    }

    if (patternId === '--') {
      return;
    }

    // If a song is currently playing, switch into pattern-loop mode and
    // continue from the current playback line instead of restarting.
    if (sequencerState.isPlaying && !isPatternPlaying) {
      const effectiveLine = Math.max(
        0,
        Math.min(
          sequencerState.currentLine,
          (currentSong.patternLength || PATTERN_LENGTH) - 1
        )
      );

      patternReturnPositionRef.current = {
        pattern: clampedIndex,
        line: effectiveLine
      };

      // Clear position ref to ensure first tick detection works
      lastSequencerPositionRef.current = null;

      setIsPatternPlaying(true);

      startPatternLoop(clampedIndex, effectiveLine);
      return;
    }

    // Otherwise (not playing, or already in pattern mode), start from the beginning.
    if (sequencerState.isPlaying) {
      stop();
    }

    // Clear position ref to ensure first tick detection works
    lastSequencerPositionRef.current = null;

    setIsPatternPlaying(true);

    startPatternLoop(clampedIndex, 0);
  }, [
    stop,
    startPatternLoop,
    sequencerState.isPlaying,
    sequencerState.currentPattern,
    sequencerState.currentLine,
    currentSong.playlist,
    currentSong.patternLength,
    activeSection,
    lastTrackId,
    isPatternPlaying
  ]);

  const handleStartPatternFromBeginning = useCallback(() => {
    if (currentSong.playlist.length === 0) {
      return;
    }

    const clampedIndex = Math.max(0, Math.min(sequencerState.currentPattern, currentSong.playlist.length - 1));
    const currentEntry = currentSong.playlist[clampedIndex];

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
        patternId = currentEntry.trackA;
        break;
      case 'B':
        patternId = currentEntry.trackB;
        break;
      case 'C':
        patternId = currentEntry.trackC;
        break;
    }

    if (patternId === '--') {
      return;
    }

    if (sequencerState.isPlaying) {
      stop();
    }

    if (isPatternPlaying) {
      setIsPatternPlaying(false);
    }

    // Start from the beginning (line 0) of the current pattern
    setPosition(clampedIndex, 0, 0);

    startSong();
  }, [stop, startSong, sequencerState.isPlaying, sequencerState.currentPattern, setPosition, isPatternPlaying, currentSong.playlist, activeSection, lastTrackId]);

  const handleStartPatternFromCurrentLine = useCallback((overrideLine?: number) => {
    if (currentSong.playlist.length === 0) {
      return;
    }

    const playlistLength = currentSong.playlist.length;
    const clampedIndex = Math.max(0, Math.min(sequencerState.currentPattern, playlistLength - 1));
    const currentEntry = currentSong.playlist[clampedIndex];

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
        patternId = currentEntry.trackA;
        break;
      case 'B':
        patternId = currentEntry.trackB;
        break;
      case 'C':
        patternId = currentEntry.trackC;
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

    setIsPatternPlaying(true);

    // Start pattern loop from the current cursor line
    const startLine = Math.max(0, Math.min(effectiveLine, (currentSong.patternLength || PATTERN_LENGTH) - 1));
    startPatternLoop(clampedIndex, startLine);
  }, [currentSong.playlist, currentSong.patternLength, sharedCurrentLine, sequencerState.currentPattern, sequencerState.isPlaying, activeSection, lastTrackId, stop, startPatternLoop]);

  const handleTogglePatternFromCursor = useCallback((lineIndex: number) => {
    if (isPatternPlaying && sequencerState.isPlaying) {
      handleStopPattern();
      return;
    }

    handleStartPatternFromCurrentLine(lineIndex);
  }, [isPatternPlaying, sequencerState.isPlaying, handleStopPattern, handleStartPatternFromCurrentLine]);

  useKeyboardShortcuts({
    setGlobalShortcut,
    handleStartSong,
    handleStartPatternFromBeginning,
    handleStartPattern,
    handleStop,
  });

  // Safety guard: ensure sequencer position always stays within playlist bounds
  // and force a clean stop if playback runs past the end for any reason.
  useEffect(() => {
    const playlistLength = currentSong.playlist.length;

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
    currentSong.playlist.length,
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

  const handleMidiNoteEvent = useCallback(
    (event: MidiNoteEvent) => {
      if (!ym2149Ref.current) {
        return;
      }

      const { type, noteNumber, noteName, octave, channel: midiChannel } = event;

      const normalizedNote = noteName.toUpperCase();
      const noteIndex = NOTES.indexOf(normalizedNote);
      if (noteIndex === -1) {
        return;
      }

      // Transpose incoming MIDI notes by the current instrument's base so that
      // pressing C-4 on the controller corresponds to the instrument's base
      // pitch (e.g. C-3), and all other keys shift by the same semitone offset.
      const baseKey =
        parseBaseKeyString(currentInstrument.base || 'C-4') ||
        { note: 'C', octave: NOTE_BASE_OCTAVE };

      const baseNoteName = baseKey.note.toUpperCase();
      const baseIndexRaw = NOTES.indexOf(baseNoteName);
      const baseNoteIndex = baseIndexRaw === -1 ? 0 : baseIndexRaw;

      const inputSemis = noteIndex + octave * 12;
      const refSemis = 0 + NOTE_BASE_OCTAVE * 12; // C-<NOTE_BASE_OCTAVE>
      const baseSemis = baseNoteIndex + baseKey.octave * 12;
      const offsetSemis = baseSemis - refSemis;

      let transposedSemis = inputSemis + offsetSemis;
      let transposedOctave = Math.floor(transposedSemis / 12);
      let transposedNoteIndex = transposedSemis % 12;

      if (transposedNoteIndex < 0) {
        transposedNoteIndex += 12;
        transposedOctave -= 1;
      }

      const clampedOctave = Math.max(MIN_OCTAVE, Math.min(MAX_OCTAVE, transposedOctave));
      const transposedNoteName = NOTES[transposedNoteIndex];

      const isTrackFocused =
        activeSection === 'trackA' ||
        activeSection === 'trackB' ||
        activeSection === 'trackC';

      const ym2149 = ym2149Ref.current;

      // When a track panel is focused, insert notes into the current pattern and advance the cursor
      if (isTrackFocused && type === 'noteOn') {
        const trackId: 'A' | 'B' | 'C' =
          activeSection === 'trackA' ? 'A' : activeSection === 'trackB' ? 'B' : 'C';

        const pattern = getCurrentPatternForTrack(trackId);
        if (!pattern) {
          return;
        }

        const totalLines = currentSong.patternLength || PATTERN_LENGTH;
        const safeIndex = Math.max(0, Math.min(sharedCurrentLine, totalLines - 1));

        const newPattern: Pattern = {
          ...pattern,
          lines: [...pattern.lines]
        };

        while (newPattern.lines.length < totalLines) {
          newPattern.lines.push({
            trackA: null,
            trackB: null,
            trackC: null
          });
        }

        const baseLine = newPattern.lines[safeIndex] || {
          trackA: null,
          trackB: null,
          trackC: null
        };
        const line: PatternLine = { ...baseLine };

        const instrumentId = currentInstrument.id;
        const note: Note = {
          note: transposedNoteName,
          octave: clampedOctave,
          instrument: instrumentId
        };

        line.trackA = note;
        newPattern.lines[safeIndex] = line;

        handlePatternChange(newPattern);

        const nextIndex = Math.min(totalLines - 1, safeIndex + 1);
        setSharedCurrentLine(nextIndex);

        // Simple preview on the track's channel with auto-silence
        const ymChannel = trackId === 'A' ? 0 : trackId === 'B' ? 1 : 2;
        const instrument = currentInstrument as any;
        const noteData = { note: transposedNoteName, octave: clampedOctave };

        const helpers = midiHelpersRef.current;
        if (helpers && currentInstrument) {
          helpers.sendInstrumentMidiNoteOn(ymChannel, currentInstrument, transposedNoteName, clampedOctave, null);
        }

        if (midiPreviewTimerRef.current !== null) {
          window.clearInterval(midiPreviewTimerRef.current);
          midiPreviewTimerRef.current = null;
        }

        if (midiPreviewTimeoutRef.current !== null) {
          window.clearTimeout(midiPreviewTimeoutRef.current);
          midiPreviewTimeoutRef.current = null;
        }

        const now = performance.now();
        midiPreviewSubTickRef.current = 0;
        midiPreviewEnvelopeStepRef.current = 0;
        midiPreviewLastTickTimeRef.current = now;
        midiPreviewNextTickTimeRef.current = now + 20;

        ym2149.updateChannelWithInstrument(ymChannel, instrument, noteData, 0, 0x0f);

        const TICK_INTERVAL_MS = 20;

        midiPreviewTimerRef.current = window.setInterval(() => {
          const nowTick = performance.now();

          let nextTickTime = midiPreviewNextTickTimeRef.current;
          if (!nextTickTime) {
            nextTickTime = nowTick + TICK_INTERVAL_MS;
          }

          let subTick = midiPreviewSubTickRef.current;
          let step = midiPreviewEnvelopeStepRef.current;

          while (nowTick >= nextTickTime) {
            subTick = (subTick + 1) % 2;
            if (subTick === 0) {
              step = step + 1;
            }
            nextTickTime += TICK_INTERVAL_MS;
          }

          midiPreviewSubTickRef.current = subTick;
          midiPreviewEnvelopeStepRef.current = step;
          midiPreviewLastTickTimeRef.current = nowTick;
          midiPreviewNextTickTimeRef.current = nextTickTime;

          ym2149.updateChannelWithInstrument(ymChannel, instrument, noteData, step, 0x0f);
        }, 20);

        const volumeRegister = 0x08 + ymChannel;

        midiPreviewTimeoutRef.current = window.setTimeout(() => {
          if (midiPreviewTimerRef.current !== null) {
            window.clearInterval(midiPreviewTimerRef.current);
            midiPreviewTimerRef.current = null;
          }
          midiPreviewLastTickTimeRef.current = null;
          midiPreviewNextTickTimeRef.current = null;
          ym2149.writeRegister(volumeRegister, 0x00);
          midiPreviewTimeoutRef.current = null;
        }, 500);

        return;
      }

      if (isTrackFocused && type === 'noteOff') {
        const trackId: 'A' | 'B' | 'C' =
          activeSection === 'trackA' ? 'A' : activeSection === 'trackB' ? 'B' : 'C';
        const ymChannel = trackId === 'A' ? 0 : trackId === 'B' ? 1 : 2;
        const helpers = midiHelpersRef.current;
        if (helpers) {
          helpers.sendInstrumentMidiNoteOffForChannel(ymChannel);
        }
        return;
      }

      // When no track panel is focused, use MIDI to preview the current instrument
      if (!isTrackFocused) {
        const ymChannel =
          lastTrackId === 'B'
            ? 1
            : lastTrackId === 'C'
            ? 2
            : 0;

        if (type === 'noteOn') {
          const noteData = { note: transposedNoteName, octave: clampedOctave };
          const instrument = currentInstrument as any;

          if (midiLiveTimerRef.current !== null) {
            window.clearInterval(midiLiveTimerRef.current);
            midiLiveTimerRef.current = null;
          }

          midiLiveReleasedRef.current = false;

          const rawSustain = instrument && typeof instrument.sustain === 'number'
            ? instrument.sustain
            : null;
          const sustainIndex =
            typeof rawSustain === 'number' && Number.isFinite(rawSustain) && rawSustain >= 0
              ? Math.floor(rawSustain)
              : null;

          midiLiveSustainIndexRef.current = sustainIndex;

          const nowTick = performance.now();
          midiLiveSubTickRef.current = 0;
          midiLiveEnvelopeStepRef.current = 0;
          midiLiveLastTickTimeRef.current = nowTick;
          midiLiveNextTickTimeRef.current = nowTick + 20;

          const volumeEnv: number[] =
            Array.isArray(instrument.volume) && instrument.volume.length > 0
              ? instrument.volume
              : [0x0f];

          const lastVolumeIndex = volumeEnv.length - 1;
          const lastVolumeValue = volumeEnv[lastVolumeIndex] ?? 0;

          midiLiveLastVolumeIndexRef.current = lastVolumeIndex;
          midiLiveLastVolumeValueRef.current = lastVolumeValue;

          ym2149.updateChannelWithInstrument(ymChannel, instrument, noteData, 0, 0x0f);

          // Also send MIDI OUT for live preview using the instrument's MIDI settings.
          const helpers = midiHelpersRef.current;
          if (helpers) {
            helpers.sendInstrumentMidiNoteOn(ymChannel, currentInstrument, transposedNoteName, clampedOctave, null);
          }

          lastMidiPreviewRef.current = {
            noteNumber,
            midiChannel,
            ymChannel
          };

          const TICK_INTERVAL_MS = 20;

          midiLiveTimerRef.current = window.setInterval(() => {
            const sustain = midiLiveSustainIndexRef.current;
            const released = midiLiveReleasedRef.current;

            const now = performance.now();

            let nextTickTime = midiLiveNextTickTimeRef.current;
            if (!nextTickTime) {
              nextTickTime = now + TICK_INTERVAL_MS;
            }

            let subTick = midiLiveSubTickRef.current ?? 0;
            let rawStep = midiLiveEnvelopeStepRef.current ?? 0;

            while (now >= nextTickTime) {
              subTick = (subTick + 1) % 2;

              if (subTick === 0) {
                if (
                  sustain === null ||
                  sustain === undefined ||
                  sustain < 0 ||
                  released ||
                  rawStep < sustain
                ) {
                  rawStep = rawStep + 1;
                }
              }

              nextTickTime += TICK_INTERVAL_MS;
            }

            midiLiveSubTickRef.current = subTick;
            midiLiveEnvelopeStepRef.current = rawStep;
            midiLiveLastTickTimeRef.current = now;
            midiLiveNextTickTimeRef.current = nextTickTime;

            const effectiveRawStep = rawStep;
            let stepForApply = effectiveRawStep;

            if (
              sustain !== null &&
              sustain !== undefined &&
              sustain >= 0 &&
              !released &&
              effectiveRawStep >= sustain
            ) {
              stepForApply = sustain;
            }

            ym2149.updateChannelWithInstrument(ymChannel, instrument, noteData, stepForApply, 0x0f);

            const tailIndex = midiLiveLastVolumeIndexRef.current;
            const tailValue = midiLiveLastVolumeValueRef.current;

            if (
              released &&
              tailIndex != null &&
              tailIndex >= 0 &&
              effectiveRawStep >= tailIndex &&
              (tailValue ?? 0) <= 0
            ) {
              const timerId = midiLiveTimerRef.current;
              if (timerId != null) {
                window.clearInterval(timerId);
                midiLiveTimerRef.current = null;
              }

              midiLiveSubTickRef.current = 0;
              midiLiveEnvelopeStepRef.current = 0;
              midiLiveLastTickTimeRef.current = null;
              midiLiveNextTickTimeRef.current = null;
              midiLiveSustainIndexRef.current = null;
              midiLiveReleasedRef.current = false;
              midiLiveLastVolumeIndexRef.current = null;
              midiLiveLastVolumeValueRef.current = null;

              ym2149.writeRegister(0x08 + ymChannel, 0x00);
            }
          }, 20);

          return;
        }

        if (type === 'noteOff') {
          const last = lastMidiPreviewRef.current;
          if (
            last &&
            last.noteNumber === noteNumber &&
            last.midiChannel === midiChannel &&
            last.ymChannel >= 0 &&
            last.ymChannel <= 2
          ) {
            // Send matching MIDI Note Off for the YM channel used by the live preview.
            const helpers = midiHelpersRef.current;
            if (helpers) {
              helpers.sendInstrumentMidiNoteOffForChannel(last.ymChannel);
            }

            const hasSustain =
              typeof midiLiveSustainIndexRef.current === 'number' &&
              midiLiveSustainIndexRef.current >= 0;

            if (hasSustain && midiLiveTimerRef.current !== null) {
              midiLiveReleasedRef.current = true;
            } else {
              if (midiLiveTimerRef.current !== null) {
                window.clearInterval(midiLiveTimerRef.current);
                midiLiveTimerRef.current = null;
              }

              midiLiveSubTickRef.current = 0;
              midiLiveEnvelopeStepRef.current = 0;
              midiLiveLastTickTimeRef.current = null;
              midiLiveNextTickTimeRef.current = null;
              midiLiveSustainIndexRef.current = null;
              midiLiveReleasedRef.current = false;
              midiLiveLastVolumeIndexRef.current = null;
              midiLiveLastVolumeValueRef.current = null;

              ym2149.writeRegister(0x08 + last.ymChannel, 0x00);
            }

            lastMidiPreviewRef.current = null;
          }
        }
      }
    },
    [
      activeSection,
      currentInstrument,
      currentSong.patternLength,
      getCurrentPatternForTrack,
      handlePatternChange,
      lastTrackId,
      setSharedCurrentLine,
      sharedCurrentLine,
      midiHelpersRef
    ]
  );

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
      setTransposeAmount(parsed);
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
  midiHelpersRef.current = {
    sendInstrumentMidiNoteOn,
    sendInstrumentMidiNoteOffForChannel,
  };

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
  });

  try {
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
              ym2149={ym2149Ref.current}
              currentInstrument={currentInstrument}
              previewChannel={previewChannel}
              hasDownloads={downloadFiles.length > 0}
              onShowDownloads={() => setIsDownloadOpen(true)}
              onPreviewMidiNoteOn={previewInstrumentMidiNoteOn}
              onPreviewMidiNoteOff={previewInstrumentMidiNoteOff}
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
              onExportInstrument={handleExportInstrumentAssembly}
              onLoadInstrument={handleLoadInstrumentClick}
              onDeleteInstrument={handleDeleteInstrument}
              onCloneInstrument={handleCloneInstrument}
              onPlaySong={handleStartSong}
              onPlayPattern={handleStartPattern}
              onStop={handleStop}
              onExportData={handleExportData}
              onExportBin={handleExportBin}
              onExportVgm={handleExportVgm}
              onExportWav={handleExportWav}
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
              isPatternPlaying={isPatternPlaying}
              onPlayInstrument={handlePlayInstrument}
              onCopyTrack={handleCopyTrack}
              onPasteTrack={handlePasteTrack}
              onNewTrack={handleCreateNewTrack}
              isComplexDumpMode={isComplexDumpMode}
              onToggleDumpMode={handleToggleDumpMode}
              activeSection={activeSection}
              setActiveSection={setActiveSection}
              onTranspose={handleOpenTranspose}
              onExportDump={handleExportDump}
              midiInputEnabled={midiInputEnabled}
              midiOutputEnabled={midiOutputEnabled}
              onShowMidi={handleShowMidi}
            />
          }
          tracksSection={
            <TracksSection
              song={currentSong}
              sharedCurrentLine={sharedCurrentLine}
              onLineChange={handleLineChange}
              onPositionScroll={handlePositionScroll}
              activeSection={activeSection}
              setActiveSection={setActiveSection}
              currentOctave={currentOctave}
              getCurrentPatternForTrack={getCurrentPatternForTrack}
              onPatternChange={handlePatternChange}
              ym2149={ym2149Ref.current}
              currentInstrument={currentInstrument}
              targetTrackId={targetTrackId}
              onTogglePatternFromCursor={handleTogglePatternFromCursor}
              currentTrackColumn={currentTrackColumn}
              setCurrentTrackColumn={setCurrentTrackColumn}
              trackFocusRevision={trackFocusRevision}
              onPreviewMidiNoteOn={previewInstrumentMidiNoteOn}
              onPreviewMidiNoteOff={previewInstrumentMidiNoteOff}
            />
          }
          instrumentSection={
            <InstrumentSection
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
          infoSection={
            <InfoSection
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
              instrumentListFocusRevision={instrumentListFocusRevision}
              ym2149={ym2149Ref.current}
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
              ym2149={ym2149Ref.current}
              currentInstrument={currentInstrument}
              previewChannel={previewChannel}
              onChangeBaseKey={handleChangeBaseKey}
              onPreviewMidiNoteOn={previewInstrumentMidiNoteOn}
              onPreviewMidiNoteOff={previewInstrumentMidiNoteOff}
            />
          }
          fileInputs={
            <>
              <input
                ref={fileInputRef}
                type="file"
                accept=".yaml,.yml"
                style={{ display: 'none' }}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    loadSong(file);
                    setPosition(0, 0, 0);
                    setSharedCurrentLine(0);
                    setActiveSection('playlist');
                    setChannelMutes([false, false, false]);
                    // This will be handled by the useDataManagement hook
                  }
                }}
              />
              <input
                ref={instrumentFileInputRef}
                type="file"
                accept=".yaml,.yml"
                style={{ display: 'none' }}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) {
                    return;
                  }

                  const reader = new FileReader();
                  reader.onload = ev => {
                    const text = typeof ev.target?.result === 'string'
                      ? ev.target.result
                      : String(ev.target?.result ?? '');
                    handleInstrumentFileContent(text);
                  };
                  reader.readAsText(file);
                }}
              />
            </>
          }
          modals={
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
              setIsAboutOpen={setIsAboutOpen}
              isChangelogOpen={isChangelogOpen}
              changelogContent={changelogContent}
              onShowChangelog={handleShowChangelog}
              onCloseChangelog={handleCloseChangelog}
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
              downloadFiles={downloadFiles}
              setIsDownloadOpen={setIsDownloadOpen}
              midiLoadError={midiLoadError}
              midiCopySummary={midiCopySummary}
              onMidiSystemReset={handleMidiSystemReset}
            />
          }
        />
      </ErrorBoundary>
    );
  } catch (error) {
    console.error('Error rendering App:', error);
    return (
      <div style={{ padding: '20px', fontFamily: 'monospace' }}>
        <h1>Error Loading DOSOUND Tracker</h1>
        <pre>{error instanceof Error ? error.message : String(error)}</pre>
      </div>
    );
  }
};

export default App;

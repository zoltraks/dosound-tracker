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
import { YM2149 } from './synth/YM2149';
import type { SequencerState } from './hooks/useSequencer';
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
import { TracksSection } from './components/TracksSection';
import { InstrumentSection } from './components/InstrumentSection';
import { InfoSection } from './components/InfoSection';
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

  const { messages, currentMessageIndex, isNotesVisible, handleNotesClick } = useMessageSystem();

  const { audioContext, ym2149Ref } = useAudioSetup();
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
  const [instrumentListFocusRevision, setInstrumentListFocusRevision] = useState(0);

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

    const nextIsLinePlaying = state.isPatternLoop && state.isPlaying;
    if (linePlayingRef.current !== nextIsLinePlaying) {
      linePlayingRef.current = nextIsLinePlaying;
      setIsLinePlaying(nextIsLinePlaying);
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
            setTimeout(() => console.log(debugLine), 0);
            debugLastRowRef.current = {
              pattern: state.currentPattern,
              line: state.currentLine
            };
            debugLastTimeRef.current = nowMs;
          } catch (error) {
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
            // key-release has occurred while at or before sustain, jump to
            // the first post-sustain step immediately for this tick.
            let step = rawStep;
            const hasSustain =
              sustainIndex !== null &&
              sustainIndex !== undefined &&
              sustainIndex >= 0;

            if (hasSustain) {
              if (!isReleased && rawStep >= sustainIndex) {
                step = sustainIndex;
              } else if (isReleased && rawStep <= sustainIndex) {
                step = sustainIndex + 1;
              }
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
    setIsLinePlaying,
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

  const handleOpenInstrumentColor = useCallback((instrument: Instrument) => {
    setInstrumentColorTarget(instrument);
    setIsInstrumentColorOpen(true);
  }, []);

  const handleCloseInstrumentColor = useCallback(() => {
    setIsInstrumentColorOpen(false);
    setInstrumentColorTarget(null);
    setActiveSection('instrumentList');
    setInstrumentListFocusRevision(prev => prev + 1);
  }, [setActiveSection, setInstrumentListFocusRevision]);

  const handleSaveInstrumentColor = useCallback(
    (color: string | null) => {
      if (!instrumentColorTarget) {
        setIsInstrumentColorOpen(false);
        setActiveSection('instrumentList');
        setInstrumentListFocusRevision(prev => prev + 1);
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
      setInstrumentListFocusRevision(prev => prev + 1);
    },
    [
      instrumentColorTarget,
      currentSong.instruments,
      updateSong,
      currentInstrument,
      setCurrentInstrument,
      setActiveSection,
      setInstrumentListFocusRevision,
    ]
  );

  const handleClearInstrumentColor = useCallback(
    () => {
      if (!instrumentColorTarget) {
        setIsInstrumentColorOpen(false);
        setActiveSection('instrumentList');
        setInstrumentListFocusRevision(prev => prev + 1);
        return;
      }

      const targetId = instrumentColorTarget.id;

      const nextInstruments = currentSong.instruments.map(inst => {
        if (!inst || inst.id !== targetId) {
          return inst;
        }

        const { color: _oldColor, ...rest } = inst;

        return {
          ...rest,
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
      setInstrumentListFocusRevision(prev => prev + 1);
    },
    [
      instrumentColorTarget,
      currentSong.instruments,
      updateSong,
      currentInstrument,
      setCurrentInstrument,
      setActiveSection,
      setInstrumentListFocusRevision,
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
    if (currentSong.playlist.length === 0) {
      return;
    }

    const clampedIndex = Math.max(
      0,
      Math.min(sequencerState.currentPattern, currentSong.playlist.length - 1)
    );

    // If we are currently in line-loop mode, switch to song playback
    // and continue from the current position instead of restarting.
    if (isLinePlaying) {
      const currentLine = sequencerState.currentLine;

      setIsLinePlaying(false);

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
    isLinePlaying,
    startSong,
    sequencerState.currentPattern,
    sequencerState.currentLine,
    currentSong.playlist,
    sharedCurrentLine
  ]);

  // Handle start line playback (line-loop mode for the current playlist line)
  const handleStartLinePlayback = useCallback(() => {
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

    // If a song is currently playing, switch into line-loop mode and
    if (sequencerState.isPlaying && !isLinePlaying) {
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

      setIsLinePlaying(true);

      startPatternLoop(clampedIndex, effectiveLine);
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
    currentSong.playlist,
    currentSong.patternLength,
    activeSection,
    lastTrackId,
    isLinePlaying
  ]);

  const handleStartLineFromBeginning = useCallback(() => {
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

    if (isLinePlaying) {
      setIsLinePlaying(false);
    }

    // Start from the beginning (line 0) of the current pattern
    setPosition(clampedIndex, 0, 0);

    startSong();
  }, [stop, startSong, sequencerState.isPlaying, sequencerState.currentPattern, setPosition, isLinePlaying, currentSong.playlist, activeSection, lastTrackId]);

  const handleStartLineFromCurrentLine = useCallback((overrideLine?: number) => {
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

    setIsLinePlaying(true);

    // Start pattern loop from the current cursor line
    const startLine = Math.max(0, Math.min(effectiveLine, (currentSong.patternLength || PATTERN_LENGTH) - 1));
    startPatternLoop(clampedIndex, startLine);
  }, [currentSong.playlist, currentSong.patternLength, sharedCurrentLine, sequencerState.currentPattern, sequencerState.isPlaying, activeSection, lastTrackId, stop, startPatternLoop]);

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
              hasDownloads={true}
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
              onToggleLineFromCursor={handleToggleLineFromCursor}
              currentTrackColumn={currentTrackColumn}
              setCurrentTrackColumn={setCurrentTrackColumn}
              trackFocusRevision={trackFocusRevision}
              onPreviewMidiNoteOn={previewInstrumentMidiNoteOn}
              onPreviewMidiNoteOff={previewInstrumentMidiNoteOff}
              onHardStopLivePreview={handleHardStopLivePreview}
              onRegisterTrackStopPreview={handleRegisterTrackStopPreview}
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
              onOpenInstrumentColor={handleOpenInstrumentColor}
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
              ensureAudioContextResumed={ensureAudioContextResumed}
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

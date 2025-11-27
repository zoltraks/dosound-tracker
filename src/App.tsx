import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { useKeyboardNavigation } from './hooks/useKeyboardNavigation';
import { useDataManagement } from './hooks/useDataManagement';
import { useWorkletSequencer } from './hooks/useWorkletSequencer';
import { useAudioContext } from './hooks/useAudioContext';
import { YM2149 } from './synth/YM2149';
import type { Instrument, Pattern, PatternLine, Song } from './synth/SoundDriver';
import { PATTERN_LENGTH, MAX_INSTRUMENTS, NOTES, MIN_OCTAVE, MAX_OCTAVE, DEFAULT_OCTAVE } from './constants/music';
import yaml from 'js-yaml';
import { HeaderPanel } from './components/HeaderPanel';
import { CommandPanel } from './components/CommandPanel';
import { TrackPanel } from './components/TrackPanel';
import { EnvelopePanel } from './components/EnvelopePanel';
import { ToneNoisePanel } from './components/ToneNoisePanel';
import { SongInfoPanel } from './components/SongInfoPanel';
import { PlaylistPanel } from './components/PlaylistPanel';
import { InstrumentListPanel } from './components/InstrumentListPanel';
import { ErrorBoundary } from './components/ErrorBoundary';
import { DumpPanel } from './components/DumpPanel';
import { EQPanel } from './components/EQPanel';
import { PianoKeyboard } from './components/PianoKeyboard';
import { exportToAssembly, exportInstrumentToAssembly, downloadAssemblyFile, exportSongToWav, downloadWavFile, exportSongRegisterDump, exportSongToVgm, downloadVgmFile } from './utils/assemblyExport';
import { renderMarkdown } from './utils/markdown';
import { InformationModal, ConfirmationModal, TransposeModal, AboutModal, ChangesModal, DownloadModal } from './modals';
import './App.css';

declare const __APP_VERSION__: string;
const APP_VERSION = __APP_VERSION__;

type TrackClipboardStep = {
  space?: boolean | number;
  off?: boolean | number;
  note?: string;
  instrument?: string;
  volume?: number;
  [key: string]: unknown;
};

const App: React.FC = () => {
  
  const [currentOctave, setCurrentOctave] = useState(3);
  const [sharedCurrentLine, setSharedCurrentLine] = useState(0);
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
  const [optimizeSummary, setOptimizeSummary] = useState('');
  const [renumberSummary, setRenumberSummary] = useState('');
  const [isTransposeOpen, setIsTransposeOpen] = useState(false);
  const [transposeScope, setTransposeScope] = useState<'line' | 'song'>('line');
  const [transposeTrackScope, setTransposeTrackScope] = useState<'current' | 'all'>('current');
  const [transposeInstrumentScope, setTransposeInstrumentScope] = useState<'all' | 'selected'>('all');
  const [transposeAmount, setTransposeAmount] = useState<number>(0);
  const [transposeAmountInput, setTransposeAmountInput] = useState<string>('0');
  const [transposeSummary, setTransposeSummary] = useState('');
  const [soundExportSummary, setSoundExportSummary] = useState('');
  const [dumpExportSummary, setDumpExportSummary] = useState('');
  const [isDownloadOpen, setIsDownloadOpen] = useState(false);
  const [downloadFiles, setDownloadFiles] = useState<string[]>([]);
  const [trackClipboardError, setTrackClipboardError] = useState('');
  const [isDebugMode, setIsDebugMode] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem('dosound-tracker-debug-mode');
      if (stored === 'on') return true;
      if (stored === 'off') return false;
    } catch {
      // ignore
    }
    return false;
  });
  const [isComplexDumpMode, setIsComplexDumpMode] = useState(() => {
    // Load dump mode preference from localStorage. Default to complex mode
    // when no preference is stored.
    const savedDumpMode = localStorage.getItem('dosound-tracker-dump-mode');
    if (savedDumpMode === 'complex') return true;
    if (savedDumpMode === 'simple') return false;
    return true;
  });
  const [channelMutes, setChannelMutes] = useState<[boolean, boolean, boolean]>(() => {
    try {
      const stored = localStorage.getItem('dosound-tracker-eq-mutes');
      if (!stored) return [false, false, false];
      const parsed = JSON.parse(stored);
      if (
        Array.isArray(parsed) &&
        parsed.length === 3 &&
        parsed.every(v => typeof v === 'boolean')
      ) {
        return [parsed[0], parsed[1], parsed[2]] as [boolean, boolean, boolean];
      }
    } catch {
      // ignore
    }
    return [false, false, false];
  });
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
  const { activeSection, isDarkMode, setIsDarkMode, setActiveSection, setGlobalShortcut } = useKeyboardNavigation();
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
    optimizeSong,
    renumberSong
  } = useDataManagement();
  // Audio setup - get context first
  const { audioContext } = useAudioContext();
  
  // AudioWorklet-based sequencer - runs audio on separate thread
  const {
    sequencerState,
    isReady: isWorkletReady,
    stop,
    setPosition,
    startPatternLoop,
    startSong,
    updateSong: updateWorkletSong,
    setMutes: setWorkletMutes
  } = useWorkletSequencer(audioContext);
  
  // Keep worklet in sync with song data
  useEffect(() => {
    if (isWorkletReady) {
      updateWorkletSong(currentSong);
    }
  }, [currentSong, isWorkletReady, updateWorkletSong]);
  
  // Keep worklet in sync with mutes
  useEffect(() => {
    if (isWorkletReady) {
      setWorkletMutes(channelMutes);
    }
  }, [channelMutes, isWorkletReady, setWorkletMutes]);

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
      localStorage.setItem('dosound-tracker-debug-mode', isDebugMode ? 'on' : 'off');
    } catch {
      // ignore
    }
  }, [isDebugMode]);

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

  // Save dump mode preference to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('dosound-tracker-dump-mode', isComplexDumpMode ? 'complex' : 'simple');
  }, [isComplexDumpMode]);

  // Load transpose settings from localStorage on startup so they persist
  // until the application is fully reset (RESET clears localStorage and reloads).
  useEffect(() => {
    try {
      const raw = localStorage.getItem('dosound-tracker-transpose-settings');
      if (!raw) return;

      const parsed = JSON.parse(raw) as any;
      if (parsed && typeof parsed === 'object') {
        if (parsed.scope === 'line' || parsed.scope === 'song') {
          setTransposeScope(parsed.scope);
        }
        if (parsed.trackScope === 'current' || parsed.trackScope === 'all') {
          setTransposeTrackScope(parsed.trackScope);
        }
        if (parsed.instrumentScope === 'all' || parsed.instrumentScope === 'selected') {
          setTransposeInstrumentScope(parsed.instrumentScope);
        }
        if (typeof parsed.amount === 'number' && Number.isFinite(parsed.amount)) {
          setTransposeAmount(parsed.amount);
          setTransposeAmountInput(String(parsed.amount));
        }
      }
    } catch {
      // ignore
    }
  }, []);

  // Persist transpose settings whenever they change so they survive reloads
  // until the RESET action clears localStorage.
  useEffect(() => {
    try {
      const payload = {
        scope: transposeScope,
        trackScope: transposeTrackScope,
        instrumentScope: transposeInstrumentScope,
        amount: transposeAmount
      };
      localStorage.setItem('dosound-tracker-transpose-settings', JSON.stringify(payload));
    } catch {
      // ignore
    }
  }, [transposeScope, transposeTrackScope, transposeInstrumentScope, transposeAmount]);

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

  // Preview YM2149 for note previews in the editor (separate from playback worklet)
  const ym2149Ref = useRef<YM2149 | null>(null);
  const [, forceYmRender] = useState(0);
  const instrumentFileInputRef = useRef<HTMLInputElement | null>(null);
  const playInstTimerRef = useRef<number | null>(null);
  const playInstStepRef = useRef<number>(0);

  // Initialize preview YM2149 on component mount
  useEffect(() => {
    if (!audioContext || ym2149Ref.current) {
      return;
    }

    try {
      console.log('Initializing preview YM2149...');
      const ym2149 = new YM2149(audioContext);
      ym2149Ref.current = ym2149;
      forceYmRender(v => v + 1);

      // Resume audio context on user interaction
      const handleUserInteraction = () => {
        if (audioContext.state === 'suspended') {
          void audioContext.resume();
        }
      };

      document.addEventListener('click', handleUserInteraction);

      return () => {
        document.removeEventListener('click', handleUserInteraction);
        if (ym2149Ref.current) {
          ym2149Ref.current.dispose();
          ym2149Ref.current = null;
        }
      };
    } catch (error) {
      console.error('Failed to initialize preview audio:', error);
    }
  }, [audioContext]);

  // Pattern return position for pattern loop mode
  const patternReturnPositionRef = useRef<{ pattern: number; line: number } | null>(null);

  const [lastTrackId, setLastTrackId] = useState<'A' | 'B' | 'C'>('A');
  const [currentTrackColumn, setCurrentTrackColumn] = useState<'note' | 'volume'>('note');

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

  // Track pattern playing state - derived from sequencer state
  const isPatternPlaying = sequencerState.isPlaying;
  
  // Handle stop playback - silence preview YM2149
  const handleStopPlayback = useCallback(() => {
    if (ym2149Ref.current) {
      ym2149Ref.current.silenceAll();
    }
  }, []);
  
  // Sync UI with worklet position updates
  useEffect(() => {
    if (sequencerState.isPlaying) {
      setSharedCurrentLine(sequencerState.currentLine);
    }
  }, [sequencerState.currentLine, sequencerState.isPlaying]);

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

  const handlePlaylistChange = useCallback((newPlaylist: Song['playlist']) => {
    updateSong({ playlist: newPlaylist });
  }, [updateSong]);

  const generateUniquePatternId = useCallback(() => {
    const existingIds = currentSong.patterns.map(p => p.id);
    let index = currentSong.patterns.length;
    let patternId: string;
    do {
      patternId = index.toString(16).padStart(2, '0').toUpperCase();
      index++;
    } while (existingIds.includes(patternId));
    return patternId;
  }, [currentSong.patterns]);

  const handleCreatePatternAt = useCallback((lineIndex: number, track: 'A' | 'B' | 'C') => {
    if (lineIndex < 0 || lineIndex >= currentSong.playlist.length) {
      return;
    }

    const patternId = generateUniquePatternId();
    createNewPattern(patternId);

    const newPlaylist = [...currentSong.playlist];
    const entry = { ...newPlaylist[lineIndex] };

    switch (track) {
      case 'A':
        entry.trackA = patternId;
        break;
      case 'B':
        entry.trackB = patternId;
        break;
      case 'C':
        entry.trackC = patternId;
        break;
    }

    newPlaylist[lineIndex] = entry;
    updateSong({ playlist: newPlaylist });
  }, [currentSong.playlist, createNewPattern, updateSong, generateUniquePatternId]);

  const handleCreateNewTrack = useCallback(() => {
    const playlist = currentSong.playlist.length > 0
      ? [...currentSong.playlist]
      : [{ trackA: '--', trackB: '--', trackC: '--' }];

    const targetLine = Math.max(0, Math.min(sequencerState.currentPattern, playlist.length - 1));
    const patternId = generateUniquePatternId();
    createNewPattern(patternId);

    const entry = { ...playlist[targetLine] };
    switch (targetTrackId) {
      case 'A':
        entry.trackA = patternId;
        break;
      case 'B':
        entry.trackB = patternId;
        break;
      case 'C':
        entry.trackC = patternId;
        break;
    }

    playlist[targetLine] = entry;
    updateSong({ playlist });

    const section = targetTrackId === 'A' ? 'trackA' : targetTrackId === 'B' ? 'trackB' : 'trackC';
    setActiveSection(section);
    setSharedCurrentLine(0);
    setPosition(targetLine, 0, 0);
  }, [currentSong.playlist, sequencerState.currentPattern, targetTrackId, generateUniquePatternId, createNewPattern, updateSong, setActiveSection, setSharedCurrentLine, setPosition]);

  const handleAddLine = useCallback(() => {
    const newPlaylist = [...currentSong.playlist];
    // Add a new empty playlist entry with all tracks set to '--'
    newPlaylist.push({
      trackA: '--',
      trackB: '--', 
      trackC: '--'
    });
    updateSong({ playlist: newPlaylist });

    const newIndex = Math.max(0, newPlaylist.length - 1);
    setPosition(newIndex, 0, 0);
    setActiveSection('playlist');
  }, [currentSong.playlist, updateSong, setPosition, setActiveSection]);

  const handleCloneLine = useCallback(() => {
    const length = currentSong.playlist.length;
    if (length === 0) {
      return;
    }

    const currentIndex = Math.max(0, Math.min(sequencerState.currentPattern, length - 1));
    const sourceEntry = currentSong.playlist[currentIndex];
    const newPlaylist = [...currentSong.playlist];
    const clonedEntry = { ...sourceEntry };
    const insertIndex = currentIndex + 1;

    newPlaylist.splice(insertIndex, 0, clonedEntry);
    updateSong({ playlist: newPlaylist });
    setPosition(insertIndex, 0, 0);
  }, [currentSong.playlist, sequencerState.currentPattern, updateSong, setPosition]);

  const handleDeleteLine = useCallback(() => {
    const length = currentSong.playlist.length;
    if (length === 0) {
      return;
    }

    const currentIndex = Math.max(0, Math.min(sequencerState.currentPattern, length - 1));
    const newPlaylist = [...currentSong.playlist];
    newPlaylist.splice(currentIndex, 1);
    updateSong({ playlist: newPlaylist });

    const newLength = newPlaylist.length;
    if (newLength === 0) {
      setPosition(0, 0, 0);
      return;
    }

    const newIndex = Math.min(currentIndex, newLength - 1);
    setPosition(newIndex, 0, 0);
  }, [currentSong.playlist, sequencerState.currentPattern, updateSong, setPosition]);

  const handleDuplicateLine = useCallback(() => {
    const playlist = currentSong.playlist;
    const patterns = currentSong.patterns;
    const length = playlist.length;
    if (length === 0) {
      return;
    }

    const currentIndex = Math.max(0, Math.min(sequencerState.currentPattern, length - 1));
    const sourceEntry = playlist[currentIndex];

    const newPlaylist = [...playlist];
    const newEntry = { ...sourceEntry };
    const newPatterns = [...patterns];

    const existingIds = new Set(patterns.map(p => p.id));
    let nextIndex = patterns.length;

    const allocatePatternId = () => {
      // Generate hex IDs like existing patterns (00, 01, 02, ...)
      // Ensure the ID is unique across all patterns, including newly-added ones.
      // eslint-disable-next-line no-constant-condition
      while (true) {
        const id = nextIndex.toString(16).padStart(2, '0').toUpperCase();
        nextIndex++;
        if (!existingIds.has(id)) {
          existingIds.add(id);
          return id;
        }
      }
    };

    const duplicateTrack = (key: 'trackA' | 'trackB' | 'trackC') => {
      const patternId = sourceEntry[key];
      if (!patternId || patternId === '--' || patternId.startsWith('^^')) {
        newEntry[key] = patternId;
        return;
      }

      const original = patterns.find(p => p.id === patternId);
      if (!original) {
        newEntry[key] = patternId;
        return;
      }

      const newId = allocatePatternId();
      const newLines = original.lines.map(line => ({
        trackA: line.trackA ? { ...line.trackA } : null,
        trackB: line.trackB ? { ...line.trackB } : null,
        trackC: line.trackC ? { ...line.trackC } : null
      }));

      newPatterns.push({
        id: newId,
        name: original.name,
        lines: newLines
      });

      newEntry[key] = newId;
    };

    duplicateTrack('trackA');
    duplicateTrack('trackB');
    duplicateTrack('trackC');

    const insertIndex = currentIndex + 1;
    newPlaylist.splice(insertIndex, 0, newEntry);

    updateSong({
      playlist: newPlaylist,
      patterns: newPatterns
    });

    setPosition(insertIndex, 0, 0);
  }, [currentSong.playlist, currentSong.patterns, sequencerState.currentPattern, updateSong, setPosition]);

  const handleInsertStep = useCallback(() => {
    const playlistLength = currentSong.playlist.length;
    if (playlistLength === 0) {
      return;
    }

    const currentIndex = Math.max(0, Math.min(sequencerState.currentPattern, playlistLength - 1));
    const entry = currentSong.playlist[currentIndex];

    let patternId = '--';
    switch (targetTrackId) {
      case 'A':
        patternId = entry.trackA;
        break;
      case 'B':
        patternId = entry.trackB;
        break;
      case 'C':
        patternId = entry.trackC;
        break;
    }

    if (!patternId || patternId === '--' || patternId.startsWith('^^')) {
      return;
    }

    const patterns = [...currentSong.patterns];
    const patternIndex = patterns.findIndex(p => p.id === patternId);
    if (patternIndex === -1) {
      return;
    }

    const pattern = { ...patterns[patternIndex] };
    const totalLines = currentSong.patternLength || PATTERN_LENGTH;
    const safeIndex = Math.max(0, Math.min(sharedCurrentLine, totalLines - 1));
    const lines = [...pattern.lines];

    while (lines.length < totalLines) {
      lines.push({
        trackA: null,
        trackB: null,
        trackC: null
      });
    }

    for (let i = totalLines - 1; i > safeIndex; i--) {
      const from = lines[i - 1] || { trackA: null, trackB: null, trackC: null };
      const base = lines[i] || { trackA: null, trackB: null, trackC: null };
      lines[i] = {
        ...base,
        trackA: from.trackA
      };
    }

    const base = lines[safeIndex] || { trackA: null, trackB: null, trackC: null };
    lines[safeIndex] = {
      ...base,
      trackA: null
    };

    pattern.lines = lines;
    patterns[patternIndex] = pattern;

    updateSong({ patterns });

    const section = targetTrackId === 'A' ? 'trackA' : targetTrackId === 'B' ? 'trackB' : 'trackC';
    setActiveSection(section);
  }, [currentSong.playlist, currentSong.patterns, currentSong.patternLength, sequencerState.currentPattern, sharedCurrentLine, targetTrackId, updateSong, setActiveSection]);

  const handleDeleteStep = useCallback(() => {
    const playlistLength = currentSong.playlist.length;
    if (playlistLength === 0) {
      return;
    }

    const currentIndex = Math.max(0, Math.min(sequencerState.currentPattern, playlistLength - 1));
    const entry = currentSong.playlist[currentIndex];

    let patternId = '--';
    switch (targetTrackId) {
      case 'A':
        patternId = entry.trackA;
        break;
      case 'B':
        patternId = entry.trackB;
        break;
      case 'C':
        patternId = entry.trackC;
        break;
    }

    if (!patternId || patternId === '--' || patternId.startsWith('^^')) {
      return;
    }

    const patterns = [...currentSong.patterns];
    const patternIndex = patterns.findIndex(p => p.id === patternId);
    if (patternIndex === -1) {
      return;
    }

    const pattern = { ...patterns[patternIndex] };
    const totalLines = currentSong.patternLength || PATTERN_LENGTH;
    const safeIndex = Math.max(0, Math.min(sharedCurrentLine, totalLines - 1));
    const lines = [...pattern.lines];

    while (lines.length < totalLines) {
      lines.push({
        trackA: null,
        trackB: null,
        trackC: null
      });
    }

    for (let i = safeIndex; i < totalLines - 1; i++) {
      const from = lines[i + 1] || { trackA: null, trackB: null, trackC: null };
      const base = lines[i] || { trackA: null, trackB: null, trackC: null };
      lines[i] = {
        ...base,
        trackA: from.trackA
      };
    }

    const lastIndex = totalLines - 1;
    const lastBase = lines[lastIndex] || { trackA: null, trackB: null, trackC: null };
    lines[lastIndex] = {
      ...lastBase,
      trackA: null
    };

    pattern.lines = lines;
    patterns[patternIndex] = pattern;

    updateSong({ patterns });

    const section = targetTrackId === 'A' ? 'trackA' : targetTrackId === 'B' ? 'trackB' : 'trackC';
    setActiveSection(section);
  }, [currentSong.playlist, currentSong.patterns, currentSong.patternLength, sequencerState.currentPattern, sharedCurrentLine, targetTrackId, updateSong, setActiveSection]);

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
    localStorage.clear();
    setChannelMutes([false, false, false]);
    setCurrentOctave(3);
    // Reload the application to start fresh
    window.location.reload();
  }, []);

  const handleCancelReset = useCallback(() => {
    setIsResetConfirmOpen(false);
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

  const handleExportData = useCallback(() => {
    try {
      const assemblyContent = exportToAssembly(currentSong, isComplexDumpMode);
      const filename = `${currentSong.title.replace(/[^a-zA-Z0-9]/g, '_')}.s`;
      downloadAssemblyFile(assemblyContent, filename);
    } catch (error) {
      console.error('Export failed:', error);
      // Could add user notification here
    }
  }, [currentSong, isComplexDumpMode]);

  const handleExportVgm = useCallback(() => {
    try {
      const result = exportSongToVgm(currentSong);
      const safeTitle = currentSong.title.replace(/[^a-zA-Z0-9]/g, '_') || 'music';
      const filename = `${safeTitle}.vgm`;
      downloadVgmFile(result.buffer, filename);
    } catch (error) {
      console.error('VGM export failed:', error);
    }
  }, [currentSong]);

  const handleExportWav = useCallback(() => {
    try {
      const result = exportSongToWav(currentSong);
      const safeTitle = currentSong.title.replace(/[^a-zA-Z0-9]/g, '_') || 'music';
      const filename = `${safeTitle}.wav`;

      downloadWavFile(result.buffer, filename);

      const lines: string[] = [];
      lines.push('WAV export completed.');
      lines.push('');
      lines.push(`File: ${filename}`);
      lines.push(`Sample rate: ${result.sampleRate} Hz`);
      lines.push('Channels: 1 (mono)');
      lines.push('Bit depth: 16-bit');
      lines.push(`Total samples: ${result.totalSamples}`);
      lines.push(`Duration: ${result.durationSeconds.toFixed(2)} seconds`);

      if (result.totalSamples === 0) {
        lines.push('');
        lines.push('Warning: song produced 0 samples (empty playlist or no active notes).');
      }

      setSoundExportSummary(lines.join('\n'));
    } catch (error) {
      console.error('WAV export failed:', error);
      const lines: string[] = [];
      lines.push('WAV export failed.');
      if (error instanceof Error) {
        lines.push(`Error: ${error.message}`);
      }
      setSoundExportSummary(lines.join('\n'));
    }
  }, [currentSong]);

  const handleExportDump = useCallback(() => {
    try {
      const { content, cycleCount } = exportSongRegisterDump(currentSong);
      const safeTitle = currentSong.title.replace(/[^a-zA-Z0-9]/g, '_') || 'music';
      const filename = `${safeTitle}_dump.s`;

      downloadAssemblyFile(content, filename);

      const lines: string[] = [];
      lines.push('Dump export completed.');
      lines.push('');
      lines.push(`File: ${filename}`);
      lines.push(`Cycles: ${cycleCount}`);

      if (cycleCount === 0) {
        lines.push('');
        lines.push('Warning: song produced 0 cycles (empty playlist or no active notes).');
      }

      setDumpExportSummary(lines.join('\n'));
    } catch (error) {
      console.error('Dump export failed:', error);
      const lines: string[] = [];
      lines.push('Dump export failed.');
      if (error instanceof Error) {
        lines.push(`Error: ${error.message}`);
      }
      setDumpExportSummary(lines.join('\n'));
    }
  }, [currentSong]);

  const handleToggleDumpMode = useCallback(() => {
    setIsComplexDumpMode(prev => !prev);
  }, []);

  const handleToggleChannelMute = useCallback((channelIndex: number) => {
    setChannelMutes(prev => {
      const next: [boolean, boolean, boolean] = [...prev] as [boolean, boolean, boolean];
      next[channelIndex] = !next[channelIndex];
      return next;
    });
  }, []);

  const handleLoadInstrumentClick = useCallback(() => {
    if (instrumentFileInputRef.current) {
      instrumentFileInputRef.current.value = '';
      instrumentFileInputRef.current.click();
    }
  }, []);

  const handlePositionSelect = useCallback((position: number) => {
    // Set sequencer to the selected pattern position, reset line and tick to 0
    setPosition(position, 0, 0);
  }, [setPosition]);

  const getCurrentPatternForTrack = useCallback((trackId: 'A' | 'B' | 'C') => {
    // Get current playlist row based on sequencer state
    const playlistLength = currentSong.playlist.length;
    if (playlistLength === 0) {
      return null;
    }

    const currentPatternIndex = Math.max(0, Math.min(playlistLength - 1, sequencerState.currentPattern));
    const currentPlaylistEntry = currentSong.playlist[currentPatternIndex];
    
    if (!currentPlaylistEntry) {
      return null;
    }
    
    // Return pattern based on which track is asking
    let patternId = '--';
    switch (trackId) {
      case 'A': patternId = currentPlaylistEntry.trackA; break;
      case 'B': patternId = currentPlaylistEntry.trackB; break;
      case 'C': patternId = currentPlaylistEntry.trackC; break;
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
        lines: Array(targetLength).fill(null).map(() => ({
          trackA: null,
          trackB: null,
          trackC: null
        }))
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

  const handleCopyTrack = useCallback(async () => {
    try {
      if (typeof navigator === 'undefined' || !navigator.clipboard || !navigator.clipboard.writeText) {
        setTrackClipboardError('Clipboard API is not available in this browser.');
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

      const pattern = getCurrentPatternForTrack(trackId);
      if (!pattern) {
        setTrackClipboardError('No pattern is assigned for the current track at this position.');
        return;
      }

      const targetLength = currentSong.patternLength || PATTERN_LENGTH;
      const rawLines = pattern.lines || [];
      const steps: TrackClipboardStep[] = [];

      // Patterns are single-track internally (trackA). Track selection only chooses
      // which pattern from the playlist we operate on.
      for (let i = 0; i < targetLength; i++) {
        const line = rawLines[i] || { trackA: null, trackB: null, trackC: null };
        const cell = line.trackA;

        const volRaw = line.volume;
        const hasVolume = volRaw !== undefined && volRaw !== null;

        let step: TrackClipboardStep;

        if (!cell) {
          // Space line. Use `space: 1` when there is an explicit volume nibble,
          // otherwise keep the legacy boolean `space: true` which is used for
          // trimming/compressing pure empty lines.
          step = { space: hasVolume ? 1 : true };
        } else if (cell.note === '===') {
          // Explicit key-release step: encode as off: true in clipboard YAML.
          step = { off: true };
        } else {
          const noteText = formatNoteKey(cell.note, cell.octave);
          step = {
            note: noteText,
            instrument: cell.instrument
          };
        }

        if (hasVolume) {
          const volNum = Number(volRaw);
          if (Number.isFinite(volNum)) {
            const clamped = Math.max(0, Math.min(0x0f, Math.floor(volNum)));
            step.volume = clamped;
          }
        }

        steps.push(step);
      }

      let lastNonSpace = steps.length - 1;
      while (lastNonSpace >= 0) {
        const ln = steps[lastNonSpace];
        if (ln && ln.space === true && Object.keys(ln).length === 1) {
          lastNonSpace--;
        } else {
          break;
        }
      }

      const trimmedSteps = steps.slice(0, lastNonSpace + 1);

      const compressedSteps: TrackClipboardStep[] = [];

      type RunType = 'none' | 'space' | 'volume-space';
      let runType: RunType = 'none';
      let runCount = 0;
      let runVolume = 0;

      const flushRun = () => {
        if (runCount <= 0) return;
        if (runType === 'space') {
          compressedSteps.push({ space: runCount });
        } else if (runType === 'volume-space') {
          if (runCount === 1) {
            // Single volume-only step: omit `space` and write only `volume`.
            compressedSteps.push({ volume: runVolume });
          } else {
            // Multiple consecutive volume-only steps with same volume.
            compressedSteps.push({ space: runCount, volume: runVolume });
          }
        }
        runType = 'none';
        runCount = 0;
      };

      const isPureSpace = (ln: TrackClipboardStep) =>
        ln && ln.space === true && Object.keys(ln).length === 1;

      const isVolumeSpace = (ln: TrackClipboardStep) =>
        ln &&
        ln.space === 1 &&
        typeof ln.volume === 'number' &&
        Object.keys(ln).length === 2;

      for (const ln of trimmedSteps) {
        if (isPureSpace(ln)) {
          if (runType === 'space') {
            runCount++;
          } else {
            flushRun();
            runType = 'space';
            runCount = 1;
          }
        } else if (isVolumeSpace(ln)) {
          const vol = ln.volume ?? 0;
          if (runType === 'volume-space' && vol === runVolume) {
            runCount++;
          } else {
            flushRun();
            runType = 'volume-space';
            runVolume = vol;
            runCount = 1;
          }
        } else {
          flushRun();
          compressedSteps.push(ln);
        }
      }
      flushRun();

      const exportData = { steps: compressedSteps };
      let yamlContent = yaml.dump(exportData, {
        indent: 2,
        lineWidth: -1,
        quotingType: '"'
      });

      const quoteNoteValues = (text: string): string => {
        const noteLineRegex = /^(\s*-\s+|\s+)(note):\s*(.+)$/gm;
        return text.replace(noteLineRegex, (_match, indent, key, value) => {
          let inner = String(value).trim();
          if (
            (inner.startsWith('"') && inner.endsWith('"')) ||
            (inner.startsWith('\'') && inner.endsWith('\''))
          ) {
            inner = inner.slice(1, -1);
          }
          return `${indent}${key}: "${inner}"`;
        });
      };

      yamlContent = quoteNoteValues(yamlContent);

      await navigator.clipboard.writeText(yamlContent);
    } catch (error) {
      console.error('Failed to copy track:', error);
      const message = error instanceof Error ? error.message : String(error);
      setTrackClipboardError('Failed to copy track to clipboard.\n\n' + message);
    }
  }, [activeSection, lastTrackId, getCurrentPatternForTrack, currentSong.patternLength, formatNoteKey]);

  const handlePasteTrack = useCallback(async () => {
    try {
      if (typeof navigator === 'undefined' || !navigator.clipboard || !navigator.clipboard.readText) {
        setTrackClipboardError('Clipboard API is not available in this browser.');
        return;
      }

      const text = await navigator.clipboard.readText();
      if (!text || !text.trim()) {
        setTrackClipboardError('Clipboard is empty or does not contain track data.');
        return;
      }

      let parsed: unknown;
      try {
        parsed = yaml.load(text);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        setTrackClipboardError('Failed to parse track data from clipboard.\n\n' + message);
        return;
      }

      const stepsNode =
        parsed && typeof parsed === 'object' ? (parsed as { steps?: unknown }).steps ?? null : null;
      if (!Array.isArray(stepsNode)) {
        setTrackClipboardError('Track clipboard data is invalid.\n\nExpected YAML with root "steps" list.');
        return;
      }

      const rawSteps = stepsNode as unknown[];
      const expandedSteps: TrackClipboardStep[] = [];

      for (const node of rawSteps) {
        if (node && typeof node === 'object') {
          const ln = node as TrackClipboardStep;
          const keys = Object.keys(ln);
          const hasVolume = Object.prototype.hasOwnProperty.call(ln, 'volume');
          const onlySpaceOrOff = keys.every(k => k === 'space' || k === 'off');
          const onlySpaceOffVolume = keys.every(
            k => k === 'space' || k === 'off' || k === 'volume'
          );

          const spaceVal = ln.space;
          const offVal = ln.off;
          const isNumericSpace =
            typeof spaceVal === 'number' && Number.isFinite(spaceVal) && spaceVal > 0;
          const isNumericOff =
            typeof offVal === 'number' && Number.isFinite(offVal) && offVal > 0;

          // Pure runs without volume
          if (!hasVolume && onlySpaceOrOff && (isNumericSpace || isNumericOff)) {
            const count = (isNumericSpace ? spaceVal : offVal) as number;
            const isOff = isNumericOff && !isNumericSpace;
            for (let i = 0; i < count; i++) {
              expandedSteps.push(isOff ? { off: true } : { space: true });
            }
            continue;
          }

          // Volume-only runs
          if (hasVolume && onlySpaceOffVolume && (isNumericSpace || isNumericOff)) {
            const count = (isNumericSpace ? spaceVal : offVal) as number;
            const isOff = isNumericOff && !isNumericSpace;
            const vol = ln.volume;
            for (let i = 0; i < count; i++) {
              expandedSteps.push(
                isOff ? { off: true, volume: vol } : { space: true, volume: vol }
              );
            }
            continue;
          }
        }

        expandedSteps.push(node as TrackClipboardStep);
      }

      let trackId: 'A' | 'B' | 'C' = lastTrackId;
      if (activeSection === 'trackA') {
        trackId = 'A';
      } else if (activeSection === 'trackB') {
        trackId = 'B';
      } else if (activeSection === 'trackC') {
        trackId = 'C';
      }

      const pattern = getCurrentPatternForTrack(trackId);
      if (!pattern) {
        setTrackClipboardError('No pattern is assigned for the current track at this position.');
        return;
      }

      const targetLength = currentSong.patternLength || PATTERN_LENGTH;
      const existingLines = pattern.lines || [];
      const newLines: PatternLine[] = [];

      // Overwrite the monotrack data (trackA) of the selected pattern with clipboard steps.
      for (let i = 0; i < targetLength; i++) {
        const baseLine = existingLines[i] || { trackA: null, trackB: null, trackC: null };
        const line: PatternLine = {
          trackA: baseLine.trackA,
          trackB: baseLine.trackB,
          trackC: baseLine.trackC,
        };
        // Overwrite any existing per-line volume; we'll set it from YAML if present.
        const rawStep = expandedSteps[i];

        if (rawStep && typeof rawStep === 'object') {
          const ln = rawStep as TrackClipboardStep;

          if (ln.off === true) {
            // Explicit key-release step: use internal '===' marker.
            line.trackA = { note: '===', octave: 0, instrument: '00' };
          } else if (ln.space === true) {
            line.trackA = null;
          } else if (typeof ln.note === 'string') {
            const parsedKey = parseBaseKeyString(ln.note);
            if (!parsedKey) {
              setTrackClipboardError(`Invalid note value "${ln.note}" in track clipboard data at line ${i}.`);
              return;
            }

            const instId =
              typeof ln.instrument === 'string' && ln.instrument.trim()
                ? ln.instrument.trim().toUpperCase()
                : '00';

            const noteObj = {
              note: parsedKey.note,
              octave: parsedKey.octave,
              instrument: instId
            };

            line.trackA = noteObj;
          } else {
            line.trackA = null;
          }

          // Parse optional per-step volume nibble.
          const volRaw = ln.volume;
          if (volRaw !== undefined && volRaw !== null) {
            const volNum = Number(volRaw);
            if (Number.isFinite(volNum)) {
              const clamped = Math.max(0, Math.min(0x0f, Math.floor(volNum)));
              line.volume = clamped;
            }
          }
        } else {
          line.trackA = null;
        }

        newLines.push(line);
      }

      const updatedPattern = { ...pattern, lines: newLines };
      const updatedPatterns = currentSong.patterns.map(p =>
        p.id === pattern.id ? updatedPattern : p
      );
      updateSong({ patterns: updatedPatterns });
    } catch (error) {
      console.error('Failed to paste track:', error);
      const message = error instanceof Error ? error.message : String(error);
      setTrackClipboardError('Failed to paste track from clipboard.\n\n' + message);
    }
  }, [activeSection, lastTrackId, getCurrentPatternForTrack, currentSong.patternLength, currentSong.patterns, updateSong, parseBaseKeyString]);

  // Handle instrument selection
  const handleInstrumentSelect = useCallback((instrument: Instrument) => {
    setCurrentInstrument(instrument);
  }, []);

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
      alert('No free instrument slots available.');
      return;
    }

    const currentIndex = instruments.findIndex(inst => inst.id === currentInstrument.id);

    const isSlotFree = (inst: Instrument | undefined) => !inst || !inst.name;

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
      alert('No free instrument slots available.');
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
  }, [currentSong.instruments, currentInstrument, updateSong, setCurrentInstrument, setActiveSection]);

  const handleDeleteInstrument = useCallback(() => {
    const instruments = currentSong.instruments;
    if (instruments.length === 0) {
      return;
    }

    const index = instruments.findIndex(inst => inst.id === currentInstrument.id);
    if (index === -1) {
      alert('Current instrument not found in song instruments.');
      return;
    }

    const slotId = instruments[index].id;

    const clearedInstrument: Instrument = {
      id: slotId,
      name: '',
      volumeEnvelope: Array(32).fill(0),
      arpeggioEnvelope: Array(32).fill(0),
      pitchEnvelope: Array(32).fill(0),
      noiseEnvelope: Array(32).fill(0),
      modeEnvelope: Array(32).fill(0)
    };

    const newInstruments = [...instruments];
    newInstruments[index] = clearedInstrument;

    updateSong({ instruments: newInstruments });
    setCurrentInstrument(clearedInstrument);
  }, [currentSong.instruments, currentInstrument.id, updateSong, setCurrentInstrument]);

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

  // Handle stop playback with silence
  const handleStop = useCallback(() => {
    // Stop the sequencer (worklet handles state)
    stop();
    
    // Stop any instrument preview playback
    if (playInstTimerRef.current !== null) {
      window.clearInterval(playInstTimerRef.current);
      playInstTimerRef.current = null;
    }

    // Silence preview YM2149
    handleStopPlayback();
  }, [stop, handleStopPlayback]);

  // Handle stop pattern playback
  const handleStopPattern = useCallback(() => {
    // Stop the sequencer (worklet handles state)
    stop();
    
    // Stop any instrument preview playback
    if (playInstTimerRef.current !== null) {
      window.clearInterval(playInstTimerRef.current);
      playInstTimerRef.current = null;
    }
    
    // Silence preview YM2149
    handleStopPlayback();
    
    // Return to saved position
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

    const clampedIndex = Math.max(0, Math.min(sequencerState.currentPattern, currentSong.playlist.length - 1));
    
    // Save return position (where cursor was before starting playback)
    patternReturnPositionRef.current = {
      pattern: clampedIndex,
      line: sharedCurrentLine
    };
    
    // Set position to beginning (line 0) of the current pattern and start song
    startSong(clampedIndex, 0);
  }, [startSong, sequencerState.currentPattern, currentSong.playlist, sharedCurrentLine]);

  // Handle start pattern playback
  const handleStartPattern = useCallback(() => {
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

    // Stop any current playback first
    if (sequencerState.isPlaying) {
      stop();
    }
    
    // Start pattern loop from line 0
    startPatternLoop(clampedIndex, 0);
  }, [stop, startPatternLoop, sequencerState.isPlaying, sequencerState.currentPattern, currentSong.playlist, activeSection, lastTrackId]);

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

    // Start from the beginning (line 0) of the current pattern
    setPosition(clampedIndex, 0, 0);

    startSong();
  }, [stop, startSong, sequencerState.isPlaying, sequencerState.currentPattern, setPosition, currentSong.playlist, activeSection, lastTrackId]);

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

  useEffect(() => {
    setGlobalShortcut('playPatternFromStart', handleStartPatternFromBeginning);
    setGlobalShortcut('playPattern', handleStartPattern);
    setGlobalShortcut('stopPlayback', handleStop);
  }, [setGlobalShortcut, handleStartPatternFromBeginning, handleStartPattern, handleStop]);

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

  const handleToggleDebugMode = useCallback(() => {
    setIsDebugMode(prev => !prev);
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

    const indices: number[] = [];
    if (transposeScope === 'line') {
      const idx = Math.max(0, Math.min(sequencerState.currentPattern, playlistLength - 1));
      indices.push(idx);
    } else {
      for (let i = 0; i < playlistLength; i++) {
        indices.push(i);
      }
    }

    const tracksToProcess: ('A' | 'B' | 'C')[] =
      transposeTrackScope === 'current' ? [targetTrackId] : ['A', 'B', 'C'];

    const patternIds = new Set<string>();

    for (const idx of indices) {
      const entry = currentSong.playlist[idx];
      if (!entry) continue;

      for (const track of tracksToProcess) {
        let patternId = '--';
        switch (track) {
          case 'A':
            patternId = entry.trackA;
            break;
          case 'B':
            patternId = entry.trackB;
            break;
          case 'C':
            patternId = entry.trackC;
            break;
        }

        if (!patternId || patternId === '--' || patternId.startsWith('^^')) {
          continue;
        }

        patternIds.add(patternId);
      }
    }

    if (patternIds.size === 0) {
      setTransposeSummary('No patterns found for the selected scope to transpose.');
      setIsTransposeOpen(false);
      return;
    }

    const selectedInstrumentId = normalizeInstrumentId(currentInstrument.id);
    const minSemitone = MIN_OCTAVE * 12;
    const maxSemitone = MAX_OCTAVE * 12 + 11;

    let notesChanged = 0;
    let clippedLow = 0;
    let clippedHigh = 0;

    const updatedPatterns = currentSong.patterns.map(pattern => {
      if (!patternIds.has(pattern.id)) {
        return pattern;
      }

      const newLines = pattern.lines.map(line => {
        const newLine = { ...line };
        const cell = newLine.trackA;

        if (!cell || cell.note === '===') {
          return newLine;
        }

        if (
          transposeInstrumentScope === 'selected' &&
          normalizeInstrumentId(cell.instrument) !== selectedInstrumentId
        ) {
          return newLine;
        }

        const noteIndex = NOTES.indexOf(cell.note.toUpperCase());
        if (noteIndex < 0) {
          return newLine;
        }

        const originalSemitone = cell.octave * 12 + noteIndex;
        let newSemitone = originalSemitone + semitones;

        if (newSemitone < minSemitone) {
          newSemitone = minSemitone;
          clippedLow++;
        } else if (newSemitone > maxSemitone) {
          newSemitone = maxSemitone;
          clippedHigh++;
        }

        if (newSemitone === originalSemitone) {
          return newLine;
        }

        const newOctave = Math.floor(newSemitone / 12);
        const newNoteIndex = newSemitone % 12;

        newLine.trackA = {
          ...cell,
          note: NOTES[newNoteIndex],
          octave: newOctave
        };

        notesChanged++;
        return newLine;
      });

      return { ...pattern, lines: newLines };
    });

    updateSong({ patterns: updatedPatterns });
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
    lines.push(`Patterns touched: ${patternIds.size}`);
    lines.push(`Notes transposed: ${notesChanged}`);

    if (clippedLow > 0 || clippedHigh > 0) {
      lines.push('');
      lines.push(`Notes clipped at bottom of range: ${clippedLow}`);
      lines.push(`Notes clipped at top of range: ${clippedHigh}`);
    }

    setTransposeSummary(lines.join('\n'));
  }, [
    transposeAmountInput,
    currentSong.playlist,
    currentSong.patterns,
    transposeScope,
    transposeTrackScope,
    transposeInstrumentScope,
    sequencerState.currentPattern,
    targetTrackId,
    currentInstrument.id,
    updateSong,
    normalizeInstrumentId
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

  const handleCloseSoundExportSummary = useCallback(() => {
    setSoundExportSummary('');
  }, []);

  const handleCloseDumpExportSummary = useCallback(() => {
    setDumpExportSummary('');
  }, []);

  const handlePositionScroll = useCallback((event: React.UIEvent<HTMLDivElement>) => {
    const scrollTop = event.currentTarget.scrollTop;
    // Sync all tracks scroll when position block is scrolled
    const tracks = document.querySelectorAll('.track-content');
    tracks.forEach(track => {
      (track as HTMLDivElement).scrollTop = scrollTop;
    });
  }, []);

  const pendingScrollLineRef = useRef<number | null>(null);
  const scrollRafRef = useRef<number | null>(null);

  useEffect(() => {
    if (sequencerState.isPlaying) {
      return;
    }

    pendingScrollLineRef.current = sharedCurrentLine;

    if (scrollRafRef.current != null) {
      return;
    }

    scrollRafRef.current = window.requestAnimationFrame(() => {
      scrollRafRef.current = null;
      const lineIndex = pendingScrollLineRef.current;
      if (lineIndex == null) {
        return;
      }

      const positionContent = document.querySelector('.position-content') as HTMLDivElement | null;
      const primaryTrack = (document.querySelector('.track-panel.track-a .track-content') ||
        document.querySelector('.track-content')) as HTMLDivElement | null;

      if (!positionContent || !primaryTrack) {
        return;
      }

      const lineElements = primaryTrack.children as HTMLCollectionOf<HTMLDivElement>;
      const totalLines = lineElements.length;
      if (!totalLines) {
        return;
      }

      const clampedIndex = Math.max(0, Math.min(lineIndex, totalLines - 1));
      const targetLine = lineElements[clampedIndex];
      if (!targetLine) {
        return;
      }

      const container = primaryTrack;
      const currentScrollTop = container.scrollTop;
      const containerHeight = container.clientHeight;

      const rowHeight = targetLine.offsetHeight || 14;
      const targetTop = lineIndex * rowHeight;
      const targetBottom = targetTop + rowHeight;

      let newScrollTop = currentScrollTop;

      if (targetTop < currentScrollTop) {
        // Selected row is above the visible area
        newScrollTop = targetTop;
      } else if (targetBottom > currentScrollTop + containerHeight) {
        // Selected row is below the visible area
        newScrollTop = targetBottom - containerHeight;
      }

      const maxScrollTop = container.scrollHeight - containerHeight;
      newScrollTop = Math.max(0, Math.min(newScrollTop, maxScrollTop));

      if (newScrollTop === currentScrollTop) {
        return;
      }

      // Apply synchronized scroll only to the pattern area
      container.scrollTop = newScrollTop;
      positionContent.scrollTop = newScrollTop;

      const tracks = document.querySelectorAll('.track-content');
      tracks.forEach(track => {
        if (track !== container) {
          (track as HTMLDivElement).scrollTop = newScrollTop;
        }
      });
    });
  }, [sharedCurrentLine, sequencerState.isPlaying]);

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

  useEffect(() => {
    const handleModalKeyDown = (event: KeyboardEvent) => {
      const hasInfoModal =
        !!instrumentError ||
        !!transposeSummary ||
        !!trackClipboardError ||
        !!optimizeSummary ||
        !!soundExportSummary ||
        !!dumpExportSummary ||
        !!renumberSummary ||
        isAboutOpen ||
        isChangelogOpen ||
        isDownloadOpen;

      const hasConfirmModal =
        isTransposeOpen ||
        isOptimizeConfirmOpen ||
        isRenumberConfirmOpen ||
        isNewSongConfirmOpen ||
        isResetConfirmOpen;

      if (!hasInfoModal && !hasConfirmModal) {
        return;
      }

      const key = event.key;
      if (key !== 'Escape' && key !== 'Esc' && key !== 'Enter') {
        return;
      }

      event.preventDefault();
      if (typeof (event as any).stopImmediatePropagation === 'function') {
        (event as any).stopImmediatePropagation();
      }

      if (key === 'Escape' || key === 'Esc') {
        if (isTransposeOpen) {
          handleCancelTranspose();
          return;
        }
        if (isOptimizeConfirmOpen) {
          handleCancelOptimize();
          return;
        }
        if (isRenumberConfirmOpen) {
          handleCancelRenumber();
          return;
        }
        if (isNewSongConfirmOpen) {
          handleCancelNewSong();
          return;
        }
        if (isResetConfirmOpen) {
          handleCancelReset();
          return;
        }

        if (instrumentError) {
          setInstrumentError('');
          return;
        }
        if (transposeSummary) {
          handleCloseTransposeSummary();
          return;
        }
        if (trackClipboardError) {
          setTrackClipboardError('');
          return;
        }
        if (optimizeSummary) {
          handleCloseOptimizeSummary();
          return;
        }
        if (soundExportSummary) {
          handleCloseSoundExportSummary();
          return;
        }
        if (dumpExportSummary) {
          handleCloseDumpExportSummary();
          return;
        }
        if (renumberSummary) {
          handleCloseRenumberSummary();
          return;
        }
        if (isAboutOpen) {
          setIsAboutOpen(false);
          return;
        }
        if (isChangelogOpen) {
          handleCloseChangelog();
          return;
        }
        if (isDownloadOpen) {
          setIsDownloadOpen(false);
          return;
        }

        return;
      }

      if (key === 'Enter') {
        if (instrumentError) {
          setInstrumentError('');
          return;
        }
        if (transposeSummary) {
          handleCloseTransposeSummary();
          return;
        }
        if (trackClipboardError) {
          setTrackClipboardError('');
          return;
        }
        if (optimizeSummary) {
          handleCloseOptimizeSummary();
          return;
        }
        if (soundExportSummary) {
          handleCloseSoundExportSummary();
          return;
        }
        if (dumpExportSummary) {
          handleCloseDumpExportSummary();
          return;
        }
        if (renumberSummary) {
          handleCloseRenumberSummary();
          return;
        }
        if (isAboutOpen) {
          setIsAboutOpen(false);
          return;
        }
        if (isChangelogOpen) {
          handleCloseChangelog();
          return;
        }

        if (isTransposeOpen) {
          handleConfirmTranspose();
          return;
        }
        if (isOptimizeConfirmOpen) {
          handleConfirmOptimize();
          return;
        }
        if (isRenumberConfirmOpen) {
          handleConfirmRenumber();
          return;
        }
        if (isNewSongConfirmOpen) {
          handleConfirmNewSong();
          return;
        }
        if (isResetConfirmOpen) {
          handleConfirmReset();
          return;
        }
      }
    };

    window.addEventListener('keydown', handleModalKeyDown, true);
    return () => {
      window.removeEventListener('keydown', handleModalKeyDown, true);
    };
  }, [
    instrumentError,
    transposeSummary,
    trackClipboardError,
    optimizeSummary,
    soundExportSummary,
    dumpExportSummary,
    renumberSummary,
    isAboutOpen,
    isChangelogOpen,
    isDownloadOpen,
    isTransposeOpen,
    isOptimizeConfirmOpen,
    isRenumberConfirmOpen,
    isNewSongConfirmOpen,
    isResetConfirmOpen,
    handleCancelTranspose,
    handleConfirmTranspose,
    handleCancelOptimize,
    handleConfirmOptimize,
    handleCancelRenumber,
    handleConfirmRenumber,
    handleCancelNewSong,
    handleConfirmNewSong,
    handleCancelReset,
    handleConfirmReset,
    handleCloseTransposeSummary,
    handleCloseOptimizeSummary,
    handleCloseSoundExportSummary,
    handleCloseDumpExportSummary,
    handleCloseRenumberSummary,
    handleCloseChangelog,
    setInstrumentError,
    setTrackClipboardError,
    setIsAboutOpen,
    setIsDownloadOpen
  ]);

  const playlistLength = currentSong.playlist.length;
  const clampedPlaybackPosition =
    playlistLength === 0
      ? 0
      : Math.max(0, Math.min(playlistLength - 1, sequencerState.currentPattern));

  try {
    return (
      <ErrorBoundary>
        <div className={`app ${isDarkMode ? 'dark' : 'light'}`}>
        <HeaderPanel
          title={currentSong.title}
          isDarkMode={isDarkMode}
          onToggleTheme={() => setIsDarkMode(!isDarkMode)}
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
        />
        
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
          onStopSong={handleStop}
          onPlayPattern={handleStartPattern}
          onStopPattern={handleStopPattern}
          onExportData={handleExportData}
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
        />

        <div className="main-content">
          <div className="left-column">
            <div className="left-column-content">
              <div className="position-block">
                <div className="position-header"></div>
                <div className="position-content" onScroll={handlePositionScroll}>
                  {Array.from({ length: currentSong.patternLength || PATTERN_LENGTH }, (_, i) => (
                    <div 
                      key={i} 
                      className={`position-number ${i === sharedCurrentLine ? 'current' : ''}`}
                    >
                      {i.toString(16).toUpperCase().padStart(2, '0')}
                    </div>
                  ))}
                </div>
              </div>

              <div className="tracks-container">
                <div className="tracks-row">
                  <TrackPanel
                    trackId="A"
                    activeSection={activeSection}
                    setActiveSection={setActiveSection}
                    currentOctave={currentOctave}
                    currentLine={sharedCurrentLine}
                    patternLength={currentSong.patternLength || PATTERN_LENGTH}
                    onLineChange={handleLineChange}
                    pattern={getCurrentPatternForTrack('A')}
                    onPatternChange={handlePatternChange}
                    ym2149={ym2149Ref.current}
                    currentInstrumentData={currentInstrument}
                    isTargetTrack={targetTrackId === 'A'}
                    onTogglePatternFromCursor={handleTogglePatternFromCursor}
                    currentColumn={currentTrackColumn}
                    setCurrentColumn={setCurrentTrackColumn}
                  />

                  <TrackPanel
                    trackId="B"
                    activeSection={activeSection}
                    setActiveSection={setActiveSection}
                    currentOctave={currentOctave}
                    currentLine={sharedCurrentLine}
                    patternLength={currentSong.patternLength || PATTERN_LENGTH}
                    onLineChange={handleLineChange}
                    pattern={getCurrentPatternForTrack('B')}
                    onPatternChange={handlePatternChange}
                    ym2149={ym2149Ref.current}
                    currentInstrumentData={currentInstrument}
                    isTargetTrack={targetTrackId === 'B'}
                    onTogglePatternFromCursor={handleTogglePatternFromCursor}
                    currentColumn={currentTrackColumn}
                    setCurrentColumn={setCurrentTrackColumn}
                  />

                  <TrackPanel
                    trackId="C"
                    activeSection={activeSection}
                    setActiveSection={setActiveSection}
                    currentOctave={currentOctave}
                    currentLine={sharedCurrentLine}
                    patternLength={currentSong.patternLength || PATTERN_LENGTH}
                    onLineChange={handleLineChange}
                    pattern={getCurrentPatternForTrack('C')}
                    onPatternChange={handlePatternChange}
                    ym2149={ym2149Ref.current}
                    currentInstrumentData={currentInstrument}
                    isTargetTrack={targetTrackId === 'C'}
                    onTogglePatternFromCursor={handleTogglePatternFromCursor}
                    currentColumn={currentTrackColumn}
                    setCurrentColumn={setCurrentTrackColumn}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="middle-column">
            <ToneNoisePanel
              activeSection={activeSection}
              setActiveSection={setActiveSection}
              data={currentInstrument.modeEnvelope}
              onChange={(data: number[]) => {
                updateInstrument({ modeEnvelope: data });
              }}
            />
            
            <EnvelopePanel
              type="volume"
              activeSection={activeSection}
              setActiveSection={setActiveSection}
              data={currentInstrument.volumeEnvelope}
              onChange={(data: number[]) => {
                updateInstrument({ volumeEnvelope: data });
              }}
              sustainIndex={
                typeof currentInstrument.sustain === 'number' && currentInstrument.sustain >= 0
                  ? Math.floor(currentInstrument.sustain)
                  : null
              }
              onSustainChange={index => {
                updateInstrument({ sustain: index });
              }}
            />
            
            <EnvelopePanel
              type="arpeggio"
              activeSection={activeSection}
              setActiveSection={setActiveSection}
              data={currentInstrument.arpeggioEnvelope}
              onChange={(data: number[]) => {
                updateInstrument({ arpeggioEnvelope: data });
              }}
            />
            
            <EnvelopePanel
              type="pitch"
              activeSection={activeSection}
              setActiveSection={setActiveSection}
              data={currentInstrument.pitchEnvelope}
              onChange={(data: number[]) => {
                updateInstrument({ pitchEnvelope: data });
              }}
            />
            
            <EnvelopePanel
              type="noise"
              activeSection={activeSection}
              setActiveSection={setActiveSection}
              data={currentInstrument.noiseEnvelope}
              onChange={(data: number[]) => {
                updateInstrument({ noiseEnvelope: data });
              }}
            />

            <div className="notes-panel" aria-hidden="true" onClick={handleNotesClick}>
              <div
                className={`notes-content${isNotesVisible ? '' : ' notes-hidden'}`}
                dangerouslySetInnerHTML={{
                  __html:
                    messages.length > 0 && currentMessageIndex >= 0 && currentMessageIndex < messages.length
                      ? renderMarkdown(messages[currentMessageIndex])
                      : ''
                }}
              />
            </div>
          </div>

          <div className="right-column">
            <SongInfoPanel
              song={currentSong}
              activeSection={activeSection}
              setActiveSection={setActiveSection}
              onChange={updateSong}
            />
            
            <PlaylistPanel
              playlist={currentSong.playlist}
              activeSection={activeSection}
              setActiveSection={setActiveSection}
              onPlaylistChange={handlePlaylistChange}
              currentPlaybackPosition={clampedPlaybackPosition}
              onPositionSelect={handlePositionSelect}
              onCreatePatternAt={handleCreatePatternAt}
              targetTrack={targetTrackId}
            />
            
            <InstrumentListPanel
              instruments={currentSong.instruments}
              currentInstrument={currentInstrument}
              activeSection={activeSection}
              setActiveSection={setActiveSection}
              onSelectInstrument={handleInstrumentSelect}
              onRenameInstrument={handleRenameInstrument}
              onMoveInstrument={handleMoveInstrument}
            />
            
            <div className="bottom-panels">
              <DumpPanel ym2149={ym2149Ref.current} />
              <EQPanel
                ym2149={ym2149Ref.current}
                channelMutes={channelMutes}
                onToggleChannelMute={handleToggleChannelMute}
              />
            </div>
          </div>
        </div>

        {/* Piano Keyboard */}
        <PianoKeyboard
          activeSection={activeSection}
          setActiveSection={setActiveSection}
          currentOctave={currentOctave}
          onOctaveChange={handleOctaveChange}
          ym2149={ym2149Ref.current}
          currentInstrument={currentInstrument}
          previewChannel={previewChannel}
          onChangeBaseKey={handleChangeBaseKey}
        />
        
        {/* Hidden file input for loading songs */}
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
            if (file) {
              loadInstrument(file);
              setActiveSection('instrumentList');
            }
          }}
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
          onClose={handleCloseOptimizeSummary}
        />

        <InformationModal
          isOpen={!!soundExportSummary}
          title="WAV Export Summary"
          message={soundExportSummary}
          onClose={handleCloseSoundExportSummary}
        />

        <InformationModal
          isOpen={!!dumpExportSummary}
          title="Dump Export Summary"
          message={dumpExportSummary}
          onClose={handleCloseDumpExportSummary}
        />

        <InformationModal
          isOpen={!!transposeSummary}
          title="Transpose Summary"
          message={transposeSummary}
          onClose={handleCloseTransposeSummary}
        />

        <InformationModal
          isOpen={!!renumberSummary}
          title="Renumber Summary"
          message={renumberSummary}
          onClose={handleCloseRenumberSummary}
        />

        <ConfirmationModal
          isOpen={isNewSongConfirmOpen}
          title="Create new song?"
          message="Current song data will be lost.\n\nContinue?"
          onConfirm={handleConfirmNewSong}
          onCancel={handleCancelNewSong}
        />

        <ConfirmationModal
          isOpen={isOptimizeConfirmOpen}
          title="Optimize song?"
          message="Optimize song by removing unused patterns and instruments and trimming pattern data beyond the current length.\n\nContinue?"
          onConfirm={handleConfirmOptimize}
          onCancel={handleCancelOptimize}
        />

        <ConfirmationModal
          isOpen={isRenumberConfirmOpen}
          title="Renumber song?"
          message="Renumber all patterns according to their order of appearance in the playlist (then any hidden patterns), and renumber all instruments alphabetically by name.\n\nThis will update all references in the playlist and patterns.\n\nContinue?"
          onConfirm={handleConfirmRenumber}
          onCancel={handleCancelRenumber}
        />

        <ConfirmationModal
          isOpen={isResetConfirmOpen}
          title="Reset application?"
          message="All saved data will be permanently deleted and the application will reload to default state.\n\nThis action cannot be undone.\n\nContinue with reset?"
          onConfirm={handleConfirmReset}
          onCancel={handleCancelReset}
          confirmLabel="Reset"
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
          onAmountChange={handleTransposeAmountChange}
          onAmountAdjust={(delta) => {
            const next = transposeAmount + delta;
            setTransposeAmount(next);
            setTransposeAmountInput(String(next));
          }}
          onConfirm={handleConfirmTranspose}
          onCancel={handleCancelTranspose}
        />

        <AboutModal
          isOpen={isAboutOpen}
          version={APP_VERSION}
          onClose={() => setIsAboutOpen(false)}
          onShowChangelog={handleShowChangelog}
        />

        <ChangesModal
          isOpen={isChangelogOpen}
          content={changelogContent}
          onClose={handleCloseChangelog}
        />

        <DownloadModal
          isOpen={isDownloadOpen}
          files={downloadFiles}
          onClose={() => setIsDownloadOpen(false)}
        />
        </div>
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

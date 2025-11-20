import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { useKeyboardNavigation } from './hooks/useKeyboardNavigation';
import { useDataManagement } from './hooks/useDataManagement';
import { useSequencer } from './hooks/useSequencer';
import { YM2149 } from './synth/YM2149';
import type { Instrument } from './synth/SoundDriver';
import { PATTERN_LENGTH, MAX_INSTRUMENTS } from './constants/music';
import yaml from 'js-yaml';
import { HeaderPanel } from './components/HeaderPanel';
import { CommandPanel } from './components/CommandPanel';
import { TrackPanel } from './components/TrackPanel';
import { EnvelopePanel } from './components/EnvelopePanel';
import { ToneNoisePanel } from './components/ToneNoisePanel';
import { SongInfoPanel } from './components/SongInfoPanel';
import { PlaylistPanel } from './components/PlaylistPanel';
import { InstrumentListPanel } from './components/InstrumentListPanel';
import { DumpPanel } from './components/DumpPanel';
import { EQPanel } from './components/EQPanel';
import { PianoKeyboard } from './components/PianoKeyboard';
import { exportToAssembly, exportInstrumentToAssembly, downloadAssemblyFile } from './utils/assemblyExport';
import './App.css';

declare const __APP_VERSION__: string;
const APP_VERSION = __APP_VERSION__;

const App: React.FC = () => {
  
  const [currentOctave, setCurrentOctave] = useState(3);
  const [sharedCurrentLine, setSharedCurrentLine] = useState(0);
  const [isNewSongConfirmOpen, setIsNewSongConfirmOpen] = useState(false);
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [isOptimizeConfirmOpen, setIsOptimizeConfirmOpen] = useState(false);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [optimizeSummary, setOptimizeSummary] = useState('');
  const [trackClipboardError, setTrackClipboardError] = useState('');
  const [isComplexDumpMode, setIsComplexDumpMode] = useState(() => {
    // Load dump mode preference from localStorage
    const savedDumpMode = localStorage.getItem('dosound-tracker-dump-mode');
    return savedDumpMode === 'complex';
  });
  const [channelMutes, setChannelMutes] = useState<[boolean, boolean, boolean]>([false, false, false]);
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
    optimizeSong
  } = useDataManagement();
  const {
    sequencerState,
    stop,
    setCallback,
    setPosition,
    updateSpeed,
    startPatternLoop,
    startSong,
    updatePatternLength
  } = useSequencer(currentSong.speed, currentSong.patternLength || PATTERN_LENGTH);

  useEffect(() => {
    updateSpeed(currentSong.speed);
  }, [currentSong.speed, updateSpeed]);

  useEffect(() => {
    updatePatternLength(currentSong.patternLength || PATTERN_LENGTH);
  }, [currentSong.patternLength, updatePatternLength]);

  // Save dump mode preference to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('dosound-tracker-dump-mode', isComplexDumpMode ? 'complex' : 'simple');
  }, [isComplexDumpMode]);

  // Audio setup
  const audioContextRef = useRef<AudioContext | null>(null);
  const ym2149Ref = useRef<YM2149 | null>(null);
  const [, forceYmRender] = useState(0);
  const instrumentFileInputRef = useRef<HTMLInputElement | null>(null);
  const playInstTimerRef = useRef<number | null>(null);
  const playInstStepRef = useRef<number>(0);

  // Initialize audio on component mount
  useEffect(() => {
    const initAudio = () => {
      try {
        console.log('Starting audio initialization...');
        
        // Create audio context
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioContextClass) {
          throw new Error('Web Audio API not supported');
        }
        
        const audioContext = new AudioContextClass();
        console.log('AudioContext created, sampleRate:', audioContext.sampleRate);
        console.log('AudioContext state:', audioContext.state);
        
        // Resume context if suspended (browser policy)
        if (audioContext.state === 'suspended') {
          audioContext.resume();
          console.log('AudioContext resumed');
        }
        
        audioContextRef.current = audioContext;
        
        // Initialize YM2149
        const ym2149 = new YM2149(audioContext);
        ym2149Ref.current = ym2149;
        forceYmRender(v => v + 1);
        console.log('YM2149 initialized');
        
        // Expose YM2149 instance globally for debugging
        (window as any).ym2149 = ym2149;
        
        // Set initial volume for all channels
        ym2149.writeRegister(0x08, 0x0F); // Channel A volume
        ym2149.writeRegister(0x09, 0x0F); // Channel B volume  
        ym2149.writeRegister(0x0A, 0x0F); // Channel C volume
        ym2149.writeRegister(0x07, 0x38); // Enable tone channels, disable noise
        console.log('YM2149 registers set');
        
        // Test tone to verify audio is working (play C4 for 100ms)
        const testFrequency = 261.63; // C4
        const testPeriod = Math.floor(2000000 / (16 * testFrequency));
        console.log('Setting test tone - frequency:', testFrequency, 'period:', testPeriod);
        
        ym2149.writeRegister(0x00, testPeriod & 0xFF);        // Fine tone A
        ym2149.writeRegister(0x01, (testPeriod >> 8) & 0x0F);  // Coarse tone A
        console.log('Test tone registers written');
        
        // Stop test tone after 100ms
        setTimeout(() => {
          if (ym2149Ref.current) {
            ym2149Ref.current.writeRegister(0x08, 0x00); // Silence channel A
            ym2149Ref.current.writeRegister(0x09, 0x00);
            ym2149Ref.current.writeRegister(0x0A, 0x00);
            console.log('Test tone stopped');
          }
        }, 100);
        
        console.log('Audio initialized successfully');
      } catch (error) {
        console.error('Failed to initialize audio:', error);
      }
    };

    // Add a click handler to resume audio context (browser requirement)
    const handleUserInteraction = () => {
      if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
        audioContextRef.current.resume();
        console.log('AudioContext resumed by user interaction');
      }
    };

    document.addEventListener('click', handleUserInteraction);
    initAudio();

    // Cleanup on unmount
    return () => {
      document.removeEventListener('click', handleUserInteraction);
      if (ym2149Ref.current) {
        ym2149Ref.current.dispose();
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  // Track envelope timing for each channel
  // subTick: 0/1 toggled every 20ms, envelopeStep: 0,1,2,... advanced every 40ms
  const channelSubTickRef = useRef([0, 0, 0]);
  const channelEnvelopeStepRef = useRef([0, 0, 0]);
  const lastNotesRef = useRef<any[]>([null, null, null]);
  const lastSequencerPositionRef = useRef<{ pattern: number; line: number } | null>(null);

  const [lastTrackId, setLastTrackId] = useState<'A' | 'B' | 'C'>('A');

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

  // Handle stop playback with silence
  const handleStopPlayback = useCallback(() => {
    // Reset cycle counters when stopping
    channelSubTickRef.current = [0, 0, 0];
    channelEnvelopeStepRef.current = [0, 0, 0];
    lastNotesRef.current = [null, null, null];
    lastSequencerPositionRef.current = null;
    
    // Silence all channels
    if (ym2149Ref.current) {
      ym2149Ref.current.writeRegister(0x08, 0x00); // Channel A volume
      ym2149Ref.current.writeRegister(0x09, 0x00); // Channel B volume
      ym2149Ref.current.writeRegister(0x0A, 0x00); // Channel C volume
    }
  }, []);

  // Basic sequencer callback for playback
  const sequencerCallback = useCallback((state: any) => {
    // Update current line for UI
    setSharedCurrentLine(state.currentLine);
    
    // Track pattern playing state
    setIsPatternPlaying(state.isPatternLoop && state.isPlaying);
    
    if (ym2149Ref.current) {
      const ym2149 = ym2149Ref.current;

      if (!state.isPlaying) {
        lastSequencerPositionRef.current = null;
        return;
      }

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
        // Always reset sub-tick timing on wrap/jump or first tick so 40ms envelope steps realign
        channelSubTickRef.current = [0, 0, 0];

        // Reset envelopes and notes when we change pattern (song mode) 
        // or when not looping a single pattern, or on first tick
        const patternChanged = lastPos && state.currentPattern !== lastPos.pattern;
        if (patternChanged || !state.isPatternLoop || isFirstTick) {
          channelEnvelopeStepRef.current = [0, 0, 0];
          lastNotesRef.current = [null, null, null];
        }
      }

      const playlistLength = currentSong.playlist.length;

      if (playlistLength === 0) {
        stop();
        handleStopPlayback();
        return;
      }
      
      // Get current pattern from playlist
      const currentPatternIndex = state.currentPattern;
      
      // Bounds check to prevent array access errors
      if (currentPatternIndex < 0 || currentPatternIndex >= playlistLength) {
        // Song has run past the playlist - stop and return to first line
        handleStopPlayback();
        stop(0); // Return to first line
        return;
      }
      
      const currentPlaylistEntry = currentSong.playlist[currentPatternIndex];
      
      if (currentPlaylistEntry) {
        // Treat GOTO markers (^^) as end-of-song for UI playback
        const isGoto =
          (typeof currentPlaylistEntry.trackA === 'string' && currentPlaylistEntry.trackA.startsWith('^^')) ||
          (typeof currentPlaylistEntry.trackB === 'string' && currentPlaylistEntry.trackB.startsWith('^^')) ||
          (typeof currentPlaylistEntry.trackC === 'string' && currentPlaylistEntry.trackC.startsWith('^^'));

        if (isGoto) {
          // Stop playback and leave cursor on the last real playlist position
          const lastIndex = Math.max(0, Math.min(currentPatternIndex, playlistLength - 1) - 1);
          handleStopPlayback();
          stop(lastIndex);
          return;
        }

        // Get pattern data for each track
        const patternA = currentSong.patterns.find(p => p.id === currentPlaylistEntry.trackA);
        const patternB = currentSong.patterns.find(p => p.id === currentPlaylistEntry.trackB);
        const patternC = currentSong.patterns.find(p => p.id === currentPlaylistEntry.trackC);
        
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
        const lastNotes = lastNotesRef.current;

        for (let ch = 0; ch < 3; ch++) {
          if (channelMutes[ch]) {
            const volumeRegister = 8 + ch;
            ym2149.writeRegister(volumeRegister, 0x00);
            continue;
          }

          const pattern = patterns[ch];
          const noteOnRow = notes[ch];
          const last = lastNotes[ch];

          // If no pattern is assigned on this channel, always treat as rest
          if (!pattern) {
            channelEnvelopeStepRef.current[ch] = 0;
            channelSubTickRef.current[ch] = 0;
            updateChannelWithInstrument(ym2149, ch, null, 0);
            lastNotes[ch] = null;
            continue;
          }

          // Explicit note-off event on this row
          if (noteOnRow && noteOnRow.note === '===') {
            channelEnvelopeStepRef.current[ch] = 0;
            channelSubTickRef.current[ch] = 0;
            updateChannelWithInstrument(ym2149, ch, null, 0);
            lastNotes[ch] = null;
            continue;
          }

          // If we just wrapped/jumped to a different pattern and there is no explicit note on this
          // row, do NOT carry the previous note across the pattern boundary.
          // This ensures that channels whose patterns start with spaces
          // remain silent at line 0 when switching patterns.
          if ((wrappedOrJumped || isFirstTick) && !noteOnRow && state.currentPattern !== lastPos?.pattern) {
            channelEnvelopeStepRef.current[ch] = 0;
            channelSubTickRef.current[ch] = 0;
            updateChannelWithInstrument(ym2149, ch, null, 0);
            lastNotes[ch] = null;
            continue;
          }

          // Determine active note: explicit note on this row if present, otherwise
          // continue holding the last active note.
          let activeNote = last as any;
          const hasExplicitNote = !!(noteOnRow && noteOnRow.note && noteOnRow.note !== '===');

          if (hasExplicitNote) {
            // New explicit note on this row
            activeNote = noteOnRow;

            // Retrigger envelopes only on the first tick of the row so that
            // the same row is not restarted multiple times when ticksPerRow > 1.
            if (state.currentTick === 0) {
              channelEnvelopeStepRef.current[ch] = 0;
              channelSubTickRef.current[ch] = 0;
            }
          }

          if (activeNote && activeNote.note && activeNote.note !== '===') {
            // Use current step as envelope tick (so a freshly triggered note
            // starts at step 0, matching the piano keyboard behaviour), then
            // advance the step for the next 20ms tick.
            const step = channelEnvelopeStepRef.current[ch];

            updateChannelWithInstrument(ym2149, ch, activeNote, step);

            channelEnvelopeStepRef.current[ch] = step + 1;
            lastNotes[ch] = activeNote;
          } else {
            // No active note at all - reset and silence
            channelEnvelopeStepRef.current[ch] = 0;
            channelSubTickRef.current[ch] = 0;
            updateChannelWithInstrument(ym2149, ch, null, 0);
            lastNotes[ch] = null;
          }
        }
      }
    }
  }, [setSharedCurrentLine, setIsPatternPlaying, currentSong, stop, handleStopPlayback, setPosition, channelMutes]);

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

  // Helper function to update channel with instrument and all envelopes
  const updateChannelWithInstrument = useCallback((ym2149: YM2149, channel: number, noteData: any | null, envelopeStep: number = 0) => {
    const normalizedNoteInstrumentId = noteData ? normalizeInstrumentId(noteData.instrument) : '';
    const normalizedFallbackId = normalizeInstrumentId(currentInstrument?.id) || normalizeInstrumentId(currentSong.instruments[0]?.id);
    const resolvedInstrumentId = normalizedNoteInstrumentId || normalizedFallbackId;

    const instrument = currentSong.instruments.find(inst => normalizeInstrumentId(inst.id) === resolvedInstrumentId);
    
    if (!instrument || !noteData || noteData.note === '===') {
      // No instrument or no active note - silence channel
      const volumeRegister = 8 + channel;
      ym2149.writeRegister(volumeRegister, 0x00);
      return;
    }

    // Use YM2149's built-in method to update channel with instrument
    ym2149.updateChannelWithInstrument(channel, instrument as any, { note: noteData.note, octave: noteData.octave }, envelopeStep);
  }, [currentSong.instruments, currentInstrument?.id, normalizeInstrumentId]);

  // Handle stop playback with silence
  const handlePatternChange = useCallback((newPattern: any) => {
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

  const handlePlaylistChange = useCallback((newPlaylist: any[]) => {
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
  }, [currentSong.playlist, updateSong]);

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

  const handleRequestNewSong = useCallback(() => {
    setIsNewSongConfirmOpen(true);
  }, []);

  const handleConfirmNewSong = useCallback(() => {
    createNewSong();
    setIsNewSongConfirmOpen(false);
  }, [createNewSong]);

  const handleCancelNewSong = useCallback(() => {
    setIsNewSongConfirmOpen(false);
  }, []);

  const handleRequestReset = useCallback(() => {
    setIsResetConfirmOpen(true);
  }, []);

  const handleConfirmReset = useCallback(() => {
    // Clear all localStorage data
    localStorage.clear();
    // Reload the application to start fresh
    window.location.reload();
  }, []);

  const handleCancelReset = useCallback(() => {
    setIsResetConfirmOpen(false);
  }, []);

  const handleShowAbout = useCallback(() => {
    setIsAboutOpen(true);
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
    const currentPatternIndex = sequencerState.currentPattern;
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
      const steps: any[] = [];

      // Patterns are single-track internally (trackA). Track selection only chooses
      // which pattern from the playlist we operate on.
      for (let i = 0; i < targetLength; i++) {
        const line = rawLines[i] || { trackA: null, trackB: null, trackC: null };
        const cell: any = line.trackA;

        if (!cell) {
          steps.push({ space: true });
        } else {
          const noteText = formatNoteKey(cell.note, cell.octave);
          steps.push({
            note: noteText,
            instrument: cell.instrument
          });
        }
      }

      let lastNonSpace = steps.length - 1;
      while (lastNonSpace >= 0) {
        const ln: any = steps[lastNonSpace];
        if (ln && ln.space === true && Object.keys(ln).length === 1) {
          lastNonSpace--;
        } else {
          break;
        }
      }

      const trimmedSteps = steps.slice(0, lastNonSpace + 1);

      const compressedSteps: any[] = [];
      let runCount = 0;

      const flushRun = () => {
        if (runCount > 0) {
          compressedSteps.push({ space: runCount });
          runCount = 0;
        }
      };

      for (const ln of trimmedSteps) {
        if (ln && ln.space === true && Object.keys(ln).length === 1) {
          runCount++;
        } else {
          flushRun();
          compressedSteps.push(ln);
        }
      }
      flushRun();

      const exportData = { steps: compressedSteps };
      const yamlContent = yaml.dump(exportData, {
        indent: 2,
        lineWidth: -1,
        quotingType: '"'
      });

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

      let parsed: any;
      try {
        parsed = yaml.load(text) as any;
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        setTrackClipboardError('Failed to parse track data from clipboard.\n\n' + message);
        return;
      }

      const stepsNode = parsed && typeof parsed === 'object' ? (parsed as any).steps : null;
      if (!Array.isArray(stepsNode)) {
        setTrackClipboardError('Track clipboard data is invalid.\n\nExpected YAML with root "steps" list.');
        return;
      }

      const rawSteps = stepsNode as any[];
      const expandedSteps: any[] = [];

      for (const node of rawSteps) {
        if (node && typeof node === 'object') {
          const ln: any = node;
          const spaceVal = ln.space;
          const offVal = ln.off;
          const isNumericSpace = typeof spaceVal === 'number' && Number.isFinite(spaceVal) && spaceVal > 0;
          const isNumericOff = typeof offVal === 'number' && Number.isFinite(offVal) && offVal > 0;

          if (isNumericSpace || isNumericOff) {
            const count = isNumericSpace ? spaceVal : offVal;
            const isOff = isNumericOff && !isNumericSpace;
            for (let i = 0; i < count; i++) {
              expandedSteps.push(isOff ? { off: true } : { space: true });
            }
            continue;
          }
        }

        expandedSteps.push(node);
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
      const newLines: any[] = [];

      // Overwrite the monotrack data (trackA) of the selected pattern with clipboard steps.
      for (let i = 0; i < targetLength; i++) {
        const baseLine = existingLines[i] || { trackA: null, trackB: null, trackC: null };
        const line: any = { ...baseLine };
        const rawStep = expandedSteps[i];

        if (rawStep && typeof rawStep === 'object') {
          const ln: any = rawStep;
          if (ln.space === true || ln.off === true) {
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

    const noteData = { note: base.note, octave: base.octave };

    ym2149.updateChannelWithInstrument(channel, currentInstrument as any, noteData, 0);

    playInstTimerRef.current = window.setInterval(() => {
      playInstStepRef.current = playInstStepRef.current + 1;
      ym2149.updateChannelWithInstrument(channel, currentInstrument as any, noteData, playInstStepRef.current);

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
      const asm = exportInstrumentToAssembly(currentInstrument);
      const safeName = (currentInstrument.name || `instrument_${currentInstrument.id}`)
        .replace(/[^a-z0-9]/gi, '_')
        .toLowerCase();
      downloadAssemblyFile(asm, `${safeName}.s`);
    } catch (error) {
      console.error('Instrument assembly export failed:', error);
    }
  }, [currentInstrument]);

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

  // Handle stop playback with silence
  const handleStop = useCallback(() => {
    // Stop the sequencer
    stop();
    
    // Reset cycle counters and silence all channels
    handleStopPlayback();
  }, [stop, handleStopPlayback]);

  // Handle stop pattern playback
  const handleStopPattern = useCallback(() => {
    // Stop the sequencer
    stop();
    
    // Update pattern playing state
    setIsPatternPlaying(false);
    
    // Reset cycle counters and silence all channels
    handleStopPlayback();
  }, [stop, handleStopPlayback]);

  // Handle start song playback
  const handleStartSong = useCallback(() => {
    if (currentSong.playlist.length === 0) {
      return;
    }

    const clampedIndex = Math.max(0, Math.min(sequencerState.currentPattern, currentSong.playlist.length - 1));

    // Stop pattern mode if active
    if (isPatternPlaying) {
      setIsPatternPlaying(false);
    }
    
    // Clear position ref to ensure first tick detection works
    lastSequencerPositionRef.current = null;
    
    // Set position to beginning (line 0) of the current pattern and start song
    startSong(clampedIndex, 0);
  }, [isPatternPlaying, startSong, sequencerState.currentPattern, currentSong.playlist]);

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
    
    // Clear position ref to ensure first tick detection works
    lastSequencerPositionRef.current = null;
    
    // Update pattern playing state
    setIsPatternPlaying(true);
    
    // Start pattern loop from line 0
    startPatternLoop(clampedIndex, 0);
  }, [stop, startPatternLoop, sequencerState.isPlaying, sharedCurrentLine, sequencerState.currentPattern, setPosition, currentSong.playlist, activeSection, lastTrackId]);

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

    // If currentPattern moved outside playlist range, clamp and stop
    if (
      sequencerState.currentPattern < 0 ||
      sequencerState.currentPattern >= playlistLength
    ) {
      handleStopPlayback();
      stop(0); // Return to first line
    }
  }, [sequencerState.isPlaying, sequencerState.currentPattern, currentSong.playlist.length, stop, handleStopPlayback]);

  const handleOctaveChange = useCallback((octave: number) => {
    setCurrentOctave(octave);
  }, []);
  const handleLineChange = useCallback((lineIndex: number) => {
    setSharedCurrentLine(lineIndex);
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

  const handlePositionScroll = useCallback((event: React.UIEvent<HTMLDivElement>) => {
    const scrollTop = event.currentTarget.scrollTop;
    // Sync all tracks scroll when position block is scrolled
    const tracks = document.querySelectorAll('.track-content');
    tracks.forEach(track => {
      (track as HTMLDivElement).scrollTop = scrollTop;
    });
  }, []);

  useEffect(() => {
    const positionContent = document.querySelector('.position-content') as HTMLDivElement | null;
    const primaryTrack = (document.querySelector('.track-panel.track-a .track-content') ||
      document.querySelector('.track-content')) as HTMLDivElement | null;

    if (!positionContent || !primaryTrack) {
      return;
    }

    const lineElements = primaryTrack.querySelectorAll('.track-line') as NodeListOf<HTMLDivElement>;
    if (!lineElements.length) {
      return;
    }

    const targetLine = lineElements[sharedCurrentLine] as HTMLDivElement | undefined;
    if (!targetLine) {
      return;
    }

    const container = primaryTrack;
    const currentScrollTop = container.scrollTop;
    const containerHeight = container.clientHeight;

    const rowHeight = targetLine.offsetHeight || 14;
    const targetTop = sharedCurrentLine * rowHeight;
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
  }, [sharedCurrentLine]);

  try {
    return (
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
        />
        
        <CommandPanel
          onNewSong={handleRequestNewSong}
          onLoadSong={triggerFileLoad}
          onSaveSong={saveSong}
          onOptimize={handleOptimizeSong}
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
          onAddLine={handleAddLine}
          onDeleteLine={handleDeleteLine}
          onReset={handleRequestReset}
          isPlaying={sequencerState.isPlaying}
          isPatternPlaying={isPatternPlaying}
          isDosoundMode={false} // TODO: Implement settings property on Song interface
          onToggleDosoundMode={() => console.log('DOSOUND mode toggle not implemented')}
          onPlayInstrument={handlePlayInstrument}
          onCopyTrack={handleCopyTrack}
          onPasteTrack={handlePasteTrack}
          onNewTrack={handleCreateNewTrack}
          isComplexDumpMode={isComplexDumpMode}
          onToggleDumpMode={handleToggleDumpMode}
          activeSection={activeSection}
          setActiveSection={setActiveSection}
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
              currentPlaybackPosition={sequencerState.currentPattern}
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
          onOctaveChange={setCurrentOctave}
          ym2149={ym2149Ref.current}
          currentInstrument={currentInstrument}
          previewChannel={
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
              : 0
          }
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
              setActiveSection('playlist');
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
        {instrumentError && (
          <div className="modal-backdrop">
            <div className="modal-dialog">
              <div className="modal-title">Instrument Load Error</div>
              <div className="modal-body">
                {instrumentError.split('\n').map((line, index) => (
                  <React.Fragment key={index}>
                    {line}
                    {index < instrumentError.split('\n').length - 1 && <br />}
                  </React.Fragment>
                ))}
              </div>
              <div className="modal-actions">
                <button className="command-btn" onClick={() => setInstrumentError('')}>
                  OK
                </button>
              </div>
            </div>
          </div>
        )}
        {trackClipboardError && (
          <div className="modal-backdrop">
            <div className="modal-dialog">
              <div className="modal-title">Track Clipboard Error</div>
              <div className="modal-body">
                {trackClipboardError.split('\n').map((line, index) => (
                  <React.Fragment key={index}>
                    {line}
                    {index < trackClipboardError.split('\n').length - 1 && <br />}
                  </React.Fragment>
                ))}
              </div>
              <div className="modal-actions">
                <button className="command-btn" onClick={() => setTrackClipboardError('')}>
                  OK
                </button>
              </div>
            </div>
          </div>
        )}
        {isOptimizeConfirmOpen && (
          <div className="modal-backdrop">
            <div className="modal-dialog">
              <div className="modal-title">Optimize song?</div>
              <div className="modal-body">
                Optimize song by removing unused patterns and instruments and trimming pattern data beyond the current length.
                <br />
                <br />
                Continue?
              </div>
              <div className="modal-actions">
                <button className="command-btn" onClick={handleConfirmOptimize}>OK</button>
                <button className="command-btn" onClick={handleCancelOptimize}>Cancel</button>
              </div>
            </div>
          </div>
        )}
        {optimizeSummary && (
          <div className="modal-backdrop">
            <div className="modal-dialog">
              <div className="modal-title">Optimization Summary</div>
              <div className="modal-body">
                {optimizeSummary.split('\n').map((line, index) => (
                  <React.Fragment key={index}>
                    {line}
                    {index < optimizeSummary.split('\n').length - 1 && <br />}
                  </React.Fragment>
                ))}
              </div>
              <div className="modal-actions">
                <button className="command-btn" onClick={handleCloseOptimizeSummary}>OK</button>
              </div>
            </div>
          </div>
        )}
        {isAboutOpen && (
          <div className="modal-backdrop">
            <div className="modal-dialog">
              <div className="modal-title">About</div>
              <div className="modal-body">
                DOSOUND Tracker
                <br />
                <br />
                Made by Zoltar X / New Generation
                <br />
                <br />
                Version: {APP_VERSION}
              </div>
              <div className="modal-actions">
                <button className="command-btn" onClick={() => setIsAboutOpen(false)}>
                  OK
                </button>
              </div>
            </div>
          </div>
        )}
        {isNewSongConfirmOpen && (
          <div className="modal-backdrop">
            <div className="modal-dialog">
              <div className="modal-title">Create new song?</div>
              <div className="modal-body">
                Current song data will be lost.
                <br />
                <br />
                Continue?
              </div>
              <div className="modal-actions">
                <button className="command-btn" onClick={handleConfirmNewSong}>OK</button>
                <button className="command-btn" onClick={handleCancelNewSong}>Cancel</button>
              </div>
            </div>
          </div>
        )}
        {isResetConfirmOpen && (
          <div className="modal-backdrop">
            <div className="modal-dialog">
              <div className="modal-title">Reset application?</div>
              <div className="modal-body">
                All saved data will be permanently deleted and the application will reload to default state.
                <br />
                <br />
                This action cannot be undone.
                <br />
                <br />
                Continue with reset?
              </div>
              <div className="modal-actions">
                <button className="command-btn" onClick={handleConfirmReset}>Reset</button>
                <button className="command-btn" onClick={handleCancelReset}>Cancel</button>
              </div>
            </div>
          </div>
        )}
      </div>
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

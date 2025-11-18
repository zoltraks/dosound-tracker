import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useKeyboardNavigation } from './hooks/useKeyboardNavigation';
import { useDataManagement } from './hooks/useDataManagement';
import { useSequencer } from './hooks/useSequencer';
import { YM2149 } from './synth/YM2149';
import type { Instrument } from './synth/SoundDriver';
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
import { exportToAssembly, downloadAssemblyFile } from './utils/assemblyExport';
import './App.css';

const App: React.FC = () => {
  
  const [currentOctave, setCurrentOctave] = useState(3);
  const [sharedCurrentLine, setSharedCurrentLine] = useState(0);
  const [isNewSongConfirmOpen, setIsNewSongConfirmOpen] = useState(false);
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
    setInstrumentError
  } = useDataManagement();
  const { sequencerState, stop, setCallback, setPosition, updateSpeed, startPatternLoop, startSong } = useSequencer(currentSong.speed);

  useEffect(() => {
    updateSpeed(currentSong.speed);
  }, [currentSong.speed, updateSpeed]);

  // Audio setup
  const audioContextRef = useRef<AudioContext | null>(null);
  const ym2149Ref = useRef<YM2149 | null>(null);
  const [, forceYmRender] = useState(0);
  const instrumentFileInputRef = useRef<HTMLInputElement | null>(null);

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

  // Track pattern playing state
  const [isPatternPlaying, setIsPatternPlaying] = useState(false);

  // Basic sequencer callback for playback
  const sequencerCallback = useCallback((state: any) => {
    // Update current line for UI
    setSharedCurrentLine(state.currentLine);
    
    // Track pattern playing state
    setIsPatternPlaying(state.isPatternLoop && state.isPlaying);
    
    if (ym2149Ref.current) {
      const ym2149 = ym2149Ref.current;
      
      // Get current pattern from playlist
      const currentPatternIndex = state.currentPattern;
      
      // Bounds check to prevent array access errors
      if (currentPatternIndex < 0 || currentPatternIndex >= currentSong.playlist.length) {
        return;
      }
      
      const currentPlaylistEntry = currentSong.playlist[currentPatternIndex];
      
      if (currentPlaylistEntry) {
        // Get pattern data for each track
        const patternA = currentSong.patterns.find(p => p.id === currentPlaylistEntry.trackA);
        const patternB = currentSong.patterns.find(p => p.id === currentPlaylistEntry.trackB);
        const patternC = currentSong.patterns.find(p => p.id === currentPlaylistEntry.trackC);
        
        // Allow playback even if some tracks are empty (using --)
        if (patternA || patternB || patternC) {
          // Get current line data
          const lineA = patternA?.lines[state.currentLine];
          const lineB = patternB?.lines[state.currentLine];
          const lineC = patternC?.lines[state.currentLine];

          const noteA = lineA?.trackA || null;
          const noteB = lineB?.trackA || null;
          const noteC = lineC?.trackA || null;

          const notes = [noteA, noteB, noteC];
          const patterns = [patternA, patternB, patternC];
          const lastNotes = lastNotesRef.current;

          for (let ch = 0; ch < 3; ch++) {
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

            // Determine active note: current row's note if present, otherwise hold last active note
            const activeNote = noteOnRow && noteOnRow.note
              ? noteOnRow
              : last;

            if (activeNote && activeNote.note && activeNote.note !== '===') {
              const isNew =
                !!noteOnRow &&
                (
                  !last ||
                  last.note !== noteOnRow.note ||
                  last.octave !== noteOnRow.octave ||
                  last.instrument !== noteOnRow.instrument
                );

              if (isNew) {
                // New note event: restart envelopes
                channelEnvelopeStepRef.current[ch] = 0;
                channelSubTickRef.current[ch] = 0;
              } else {
                // Continuing note (including across empty rows): advance envelope every 40ms
                const sub = (channelSubTickRef.current[ch] + 1) % 2;
                channelSubTickRef.current[ch] = sub;
                if (sub === 0) {
                  channelEnvelopeStepRef.current[ch] = channelEnvelopeStepRef.current[ch] + 1;
                }
              }

              updateChannelWithInstrument(ym2149, ch, activeNote, channelEnvelopeStepRef.current[ch]);
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
    }
  }, [setSharedCurrentLine, setIsPatternPlaying, currentSong]);

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
  const handleStopPlayback = useCallback(() => {
    // Reset cycle counters when stopping
    channelSubTickRef.current = [0, 0, 0];
    channelEnvelopeStepRef.current = [0, 0, 0];
    lastNotesRef.current = [null, null, null];
    
    // Silence all channels
    if (ym2149Ref.current) {
      ym2149Ref.current.writeRegister(0x08, 0x00); // Channel A volume
      ym2149Ref.current.writeRegister(0x09, 0x00); // Channel B volume
      ym2149Ref.current.writeRegister(0x0A, 0x00); // Channel C volume
    }
  }, []);

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

  const handleCreatePatternAt = useCallback((lineIndex: number, track: 'A' | 'B' | 'C') => {
    if (lineIndex < 0 || lineIndex >= currentSong.playlist.length) {
      return;
    }

    // Generate a unique 2-digit hex pattern ID
    const existingIds = currentSong.patterns.map(p => p.id);
    let index = currentSong.patterns.length;
    let patternId: string;
    do {
      patternId = index.toString(16).padStart(2, '0').toUpperCase();
      index++;
    } while (existingIds.includes(patternId));

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
  }, [currentSong.playlist, currentSong.patterns, createNewPattern, updateSong]);

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

  const handleExportData = useCallback(() => {
    try {
      const assemblyContent = exportToAssembly(currentSong);
      const filename = `${currentSong.title.replace(/[^a-zA-Z0-9]/g, '_')}.s`;
      downloadAssemblyFile(assemblyContent, filename);
    } catch (error) {
      console.error('Export failed:', error);
      // Could add user notification here
    }
  }, [currentSong]);

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
    
    // If pattern doesn't exist, create it
    if (!foundPattern) {
      const newPattern = {
        id: patternId,
        name: `Pattern ${patternId}`,
        lines: Array(64).fill(null).map(() => ({
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

  // Handle instrument selection
  const handleInstrumentSelect = useCallback((instrument: Instrument) => {
    console.log('Selecting instrument:', instrument.id, instrument.name);
    setCurrentInstrument(instrument);
  }, []);

  const handleRenameInstrument = useCallback((name: string) => {
    updateInstrument({ name });
  }, [updateInstrument]);

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
    // Stop pattern mode if active
    if (isPatternPlaying) {
      setIsPatternPlaying(false);
    }
    
    // Set position to beginning (line 0) of the current pattern BEFORE starting
    setPosition(sequencerState.currentPattern, 0, 0);
    
    // Start song playback
    startSong();
  }, [isPatternPlaying, startSong, sequencerState.currentPattern, setPosition]);

  // Handle start pattern playback
  const handleStartPattern = useCallback(() => {
    // Stop any current playback first
    if (sequencerState.isPlaying) {
      stop();
    }
    
    // Update pattern playing state
    setIsPatternPlaying(true);
    
    // Set position to current pattern and line BEFORE starting
    setPosition(sequencerState.currentPattern, sharedCurrentLine, 0);
    
    // Start pattern loop
    startPatternLoop();
  }, [stop, startPatternLoop, sequencerState.isPlaying, sharedCurrentLine, sequencerState.currentPattern, setPosition]);

  const handleStartPatternFromBeginning = useCallback(() => {
    if (sequencerState.isPlaying) {
      stop();
    }

    if (isPatternPlaying) {
      setIsPatternPlaying(false);
    }

    // Start from the beginning (line 0) of the current pattern
    setPosition(sequencerState.currentPattern, 0, 0);

    startSong();
  }, [stop, startSong, sequencerState.isPlaying, sequencerState.currentPattern, setPosition, isPatternPlaying]);

  useEffect(() => {
    setGlobalShortcut('playPatternFromStart', handleStartPatternFromBeginning);
    setGlobalShortcut('playPattern', handleStartPattern);
    setGlobalShortcut('stopPlayback', handleStop);
  }, [setGlobalShortcut, handleStartPatternFromBeginning, handleStartPattern, handleStop]);

  const handleOctaveChange = useCallback((octave: number) => {
    setCurrentOctave(octave);
  }, []);

  const handleLineChange = useCallback((lineIndex: number) => {
    setSharedCurrentLine(lineIndex);
  }, []);

  const handleTrackScroll = useCallback((event: React.UIEvent<HTMLDivElement>) => {
    const scrollTop = event.currentTarget.scrollTop;
    // Sync position block scroll
    const positionBlock = document.querySelector('.position-block');
    if (positionBlock) {
      positionBlock.scrollTop = scrollTop;
    }
    // Sync other tracks scroll
    const tracks = document.querySelectorAll('.track-content');
    tracks.forEach(track => {
      if (track !== event.currentTarget) {
        track.scrollTop = scrollTop;
      }
    });
  }, []);

  try {
    return (
      <div className={`app ${isDarkMode ? 'dark' : 'light'}`}>
        <HeaderPanel
          title={currentSong.title}
          isDarkMode={isDarkMode}
          onToggleTheme={() => setIsDarkMode(!isDarkMode)}
          currentOctave={currentOctave}
          onOctaveChange={handleOctaveChange}
        />
        
        <CommandPanel
          onNewSong={handleRequestNewSong}
          onSaveSong={saveSong}
          onLoadSong={triggerFileLoad}
          onNewInstrument={createNewInstrument}
          onSaveInstrument={saveInstrument}
          onLoadInstrument={handleLoadInstrumentClick}
          onDeleteInstrument={handleDeleteInstrument}
          onPlaySong={handleStartSong}
          onStopSong={handleStop}
          onPlayPattern={handleStartPattern}
          onStopPattern={handleStopPattern}
          onExportData={handleExportData}
          onAddLine={handleAddLine}
          onDeleteLine={handleDeleteLine}
          isPlaying={sequencerState.isPlaying}
          isPatternPlaying={isPatternPlaying}
          isDosoundMode={false} // TODO: Implement settings property on Song interface
          onToggleDosoundMode={() => console.log('DOSOUND mode toggle not implemented')}
        />

        <div className="main-content">
          <div className="left-column">
            <div className="left-column-content">
              <div className="position-block">
                <div className="position-header"></div>
                {Array.from({ length: 64 }, (_, i) => (
                  <div 
                    key={i} 
                    className={`position-number ${i === sharedCurrentLine ? 'current' : ''}`}
                  >
                    {i.toString(16).toUpperCase().padStart(2, '0')}
                  </div>
                ))}
              </div>
              
              <div className="tracks-container">
                <div className="tracks-row">
                  <TrackPanel
                    trackId="A"
                    activeSection={activeSection}
                    setActiveSection={setActiveSection}
                    currentOctave={currentOctave}
                    onScroll={handleTrackScroll}
                    currentLine={sharedCurrentLine}
                    onLineChange={handleLineChange}
                    pattern={getCurrentPatternForTrack('A')}
                    onPatternChange={handlePatternChange}
                    ym2149={ym2149Ref.current}
                    currentInstrumentData={currentInstrument}
                  />
                  
                  <TrackPanel
                    trackId="B"
                    activeSection={activeSection}
                    setActiveSection={setActiveSection}
                    currentOctave={currentOctave}
                    onScroll={handleTrackScroll}
                    currentLine={sharedCurrentLine}
                    onLineChange={handleLineChange}
                    pattern={getCurrentPatternForTrack('B')}
                    onPatternChange={handlePatternChange}
                    ym2149={ym2149Ref.current}
                    currentInstrumentData={currentInstrument}
                  />
                  
                  <TrackPanel
                    trackId="C"
                    activeSection={activeSection}
                    setActiveSection={setActiveSection}
                    currentOctave={currentOctave}
                    onScroll={handleTrackScroll}
                    currentLine={sharedCurrentLine}
                    onLineChange={handleLineChange}
                    pattern={getCurrentPatternForTrack('C')}
                    onPatternChange={handlePatternChange}
                    ym2149={ym2149Ref.current}
                    currentInstrumentData={currentInstrument}
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
              <EQPanel ym2149={ym2149Ref.current} />
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

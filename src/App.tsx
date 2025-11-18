import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useKeyboardNavigation } from './hooks/useKeyboardNavigation';
import { useDataManagement } from './hooks/useDataManagement';
import { useSequencer } from './hooks/useSequencer';
import { YM2149 } from './synth/ym2149/YM2149';
import type { Instrument } from './synth/dosound/DosoundDriver';
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
import './App.css';

const App: React.FC = () => {
  
  const [currentOctave, setCurrentOctave] = useState(3);
  const [sharedCurrentLine, setSharedCurrentLine] = useState(0);
  const { activeSection, isDarkMode, setIsDarkMode, setActiveSection } = useKeyboardNavigation();
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
    triggerFileLoad
  } = useDataManagement();
  const { sequencerState, stop, setCallback, setPosition, updateSpeed, startPatternLoop, startSong } = useSequencer(currentSong.speed);

  // Update sequencer speed when song speed changes
  useEffect(() => {
    updateSpeed(currentSong.speed);
  }, [currentSong.speed, updateSpeed]);

  // Audio setup
  const audioContextRef = useRef<AudioContext | null>(null);
  const ym2149Ref = useRef<YM2149 | null>(null);

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
        console.log('YM2149 initialized');
        
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

  // Track cycle counters for each channel (0-1, 0-1, 0-1...)
  const channelCyclesRef = useRef([0, 0, 0]);

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
          
          // Update cycle counters only for channels that have notes playing
          if (lineA?.trackA?.note) {
            channelCyclesRef.current[0] = (channelCyclesRef.current[0] + 1) % 2;
          } else {
            channelCyclesRef.current[0] = 0; // Reset when no note
          }
          
          if (lineB?.trackA?.note) {
            channelCyclesRef.current[1] = (channelCyclesRef.current[1] + 1) % 2;
          } else {
            channelCyclesRef.current[1] = 0; // Reset when no note
          }
          
          if (lineC?.trackA?.note) {
            channelCyclesRef.current[2] = (channelCyclesRef.current[2] + 1) % 2;
          } else {
            channelCyclesRef.current[2] = 0; // Reset when no note
          }
          
          // Update each channel with DOSOUND timing (volume every 2 cycles)
          updateChannelWithInstrument(ym2149, 0, lineA?.trackA, state.currentTick, channelCyclesRef.current[0]);
          updateChannelWithInstrument(ym2149, 1, lineB?.trackA, state.currentTick, channelCyclesRef.current[1]);
          updateChannelWithInstrument(ym2149, 2, lineC?.trackA, state.currentTick, channelCyclesRef.current[2]);
        }
      }
    }
  }, [setSharedCurrentLine, setIsPatternPlaying, currentSong]);

  // Register sequencer callback
  useEffect(() => {
    setCallback(sequencerCallback);
  }, [setCallback, sequencerCallback]);

  const getModeValueForTick = useCallback((instrument: Instrument, tick: number) => {
    const defaultMode = instrument.toneNoiseMode === 'noise' ? 1 : 0;
    if (!instrument.modeEnvelope || instrument.modeEnvelope.length === 0) {
      return defaultMode;
    }

    const modeIndex = Math.min(tick, instrument.modeEnvelope.length - 1);
    const envelopeValue = instrument.modeEnvelope[modeIndex];
    return typeof envelopeValue === 'number' ? envelopeValue : defaultMode;
  }, []);

  const updateMixerForChannel = useCallback((ym2149: YM2149, channel: number, toneActive: boolean, noiseActive: boolean) => {
    const registers = ym2149.getRegistersArray();
    const currentMixer = registers[7] ?? 0x3F;
    let mixer = currentMixer;

    const toneBit = 1 << channel;
    const noiseBit = 0x08 << channel;

    mixer = toneActive ? (mixer & ~toneBit) : (mixer | toneBit);
    mixer = noiseActive ? (mixer & ~noiseBit) : (mixer | noiseBit);

    if (mixer !== currentMixer) {
      ym2149.writeRegister(0x07, mixer);
    }
  }, []);

  // Helper function to update channel with instrument and all envelopes
  const updateChannelWithInstrument = useCallback((ym2149: YM2149, channel: number, noteData?: any, currentTick: number = 0, cycle: number = 0) => {
    const volumeRegister = 8 + channel; // R8, R9, R10
    const fineRegister = channel * 2;        // R0, R2, R4
    const coarseRegister = channel * 2 + 1;  // R1, R3, R5

    // Get instrument for this track
    const instrument = currentSong.instruments.find(inst => inst.id === noteData?.instrument);
    
    if (!instrument) {
      // No instrument - silence channel
      ym2149.writeRegister(volumeRegister, 0x00);
      return;
    }

    const modeValue = getModeValueForTick(instrument, currentTick);
    const toneActive = modeValue === 0 || modeValue === 2;
    const noiseActive = modeValue === 1 || modeValue === 2;

    updateMixerForChannel(ym2149, channel, toneActive, noiseActive);

    if (noteData && currentTick === 0) {
      // Start of new note - set frequency
      const noteFrequencies: { [key: string]: number } = {
        'C': 261.63, 'C#': 277.18, 'D': 293.66, 'D#': 311.13,
        'E': 329.63, 'F': 349.23, 'F#': 369.99, 'G': 392.00,
        'G#': 415.30, 'A': 440.00, 'A#': 466.16, 'B': 493.88
      };

      const baseFreq = noteFrequencies[noteData.note];
      if (baseFreq) {
        let frequency = baseFreq * Math.pow(2, noteData.octave - 4);
        
        // Apply arpeggio envelope
        const arpeggioIndex = Math.min(currentTick, instrument.arpeggioEnvelope.length - 1);
        const arpeggioValue = instrument.arpeggioEnvelope[arpeggioIndex];
        if (arpeggioValue !== 0) {
          frequency = frequency * Math.pow(2, arpeggioValue / 12); // Convert semitones to frequency ratio
        }
        
        // Apply pitch envelope  
        const pitchIndex = Math.min(currentTick, instrument.pitchEnvelope.length - 1);
        const pitchValue = instrument.pitchEnvelope[pitchIndex];
        if (pitchValue !== 0) {
          frequency = frequency * Math.pow(2, pitchValue / 12); // Convert semitones to frequency ratio
        }
        
        const period = Math.floor(2000000 / (16 * frequency));
        
        ym2149.writeRegister(fineRegister, period & 0xFF);
        ym2149.writeRegister(coarseRegister, (period >> 8) & 0x0F);
        
        // Apply initial volume immediately when note starts
        const initialVolume = instrument.volumeEnvelope[0] || 0x0F;
        ym2149.writeRegister(volumeRegister, Math.max(0, Math.min(15, initialVolume)));
      }
    } else if (!noteData) {
      // No note data - silence channel
      ym2149.writeRegister(volumeRegister, 0x00);
      return;
    }

    // Apply volume envelope only on cycle 0 (every 2 cycles = 40ms in DOSOUND mode), but not on tick 0 (already applied)
    if (cycle === 0 && currentTick > 0) {
      const volumeIndex = Math.min(currentTick, instrument.volumeEnvelope.length - 1);
      const volumeValue = instrument.volumeEnvelope[volumeIndex];
      const volume = Math.max(0, Math.min(15, volumeValue)); // Clamp to 0-15
      
      ym2149.writeRegister(volumeRegister, volume);
    }
    
    // Apply noise envelope when noise is active (only on cycle 0 for DOSOUND timing)
    if (noiseActive && cycle === 0) {
      const noiseIndex = Math.min(currentTick, instrument.noiseEnvelope.length - 1);
      const noiseValue = instrument.noiseEnvelope[noiseIndex];
      const noisePeriod = Math.max(0, Math.min(31, noiseValue)); // Clamp to 0-31
      ym2149.writeRegister(0x06, noisePeriod); // Noise period register
    }
  }, [currentSong.instruments, getModeValueForTick, updateMixerForChannel]);

  // Handle stop playback with silence
  const handleStopPlayback = useCallback(() => {
    // Reset cycle counters when stopping
    channelCyclesRef.current = [0, 0, 0];
    
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
    
    // Set position to current pattern and line BEFORE starting
    setPosition(sequencerState.currentPattern, sharedCurrentLine, 0);
    
    // Start song playback
    startSong();
  }, [isPatternPlaying, startSong, sharedCurrentLine, sequencerState.currentPattern, setPosition, sequencerState]);

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
          onNewSong={createNewSong}
          onSaveSong={saveSong}
          onLoadSong={triggerFileLoad}
          onNewInstrument={createNewInstrument}
          onSaveInstrument={saveInstrument}
          onLoadInstrument={() => console.log('Load instrument clicked')}
          onPlaySong={handleStartSong}
          onStopSong={handleStop}
          onPlayPattern={handleStartPattern}
          onStopPattern={handleStopPattern}
          onExportData={() => console.log('Export clicked')}
          onAddLine={handleAddLine}
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
            />
            
            <InstrumentListPanel
              instruments={currentSong.instruments}
              currentInstrument={currentInstrument}
              activeSection={activeSection}
              setActiveSection={setActiveSection}
              onSelectInstrument={handleInstrumentSelect}
            />
            
            <div className="bottom-panels">
              <DumpPanel ym2149={null} />
              <EQPanel />
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
              // This will be handled by the useDataManagement hook
            }
          }}
        />
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

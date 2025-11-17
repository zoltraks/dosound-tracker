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
  console.log('App component rendering...');
  
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
    saveInstrument 
  } = useDataManagement();
  const { sequencerState, start, stop, setCallback } = useSequencer();

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

  // Sequencer callback for playing notes
  useEffect(() => {
    setCallback((state) => {
      // Update current line for UI
      setSharedCurrentLine(state.currentLine);
      
      if (ym2149Ref.current) {
        const ym2149 = ym2149Ref.current;
        
        // Get current pattern from playlist
        const currentPatternIndex = state.currentPattern % currentSong.playlist.length;
        const currentPlaylistEntry = currentSong.playlist[currentPatternIndex];
        
        if (currentPlaylistEntry) {
          // Get pattern data for each track
          const patternA = currentSong.patterns.find(p => p.id === currentPlaylistEntry.trackA);
          const patternB = currentSong.patterns.find(p => p.id === currentPlaylistEntry.trackB);
          const patternC = currentSong.patterns.find(p => p.id === currentPlaylistEntry.trackC);
          
          // Get current line data from each pattern
          const lineA = patternA?.lines[state.currentLine];
          const lineB = patternB?.lines[state.currentLine];
          const lineC = patternC?.lines[state.currentLine];
          
          // Update each channel with its track's instrument and all envelopes
          updateChannelWithInstrument(ym2149, 0, lineA?.trackA, state.currentTick);
          updateChannelWithInstrument(ym2149, 1, lineB?.trackB, state.currentTick);
          updateChannelWithInstrument(ym2149, 2, lineC?.trackC, state.currentTick);
        }
      }
    });
  }, [setCallback, currentSong]);

  // Helper function to update channel with instrument and all envelopes
  const updateChannelWithInstrument = useCallback((ym2149: YM2149, channel: number, noteData?: any, currentTick: number = 0) => {
    const volumeRegister = 8 + channel; // R8, R9, R10
    const fineRegister = channel * 2;        // R0, R2, R4
    const coarseRegister = channel * 2 + 1;  // R1, R3, R5

    if (noteData && currentTick === 0) {
      // Start of new note - get instrument for this track
      const instrument = currentSong.instruments.find(inst => inst.id === noteData.instrument);
      if (!instrument) return;

      // Set frequency based on note
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
        
        // Set tone/noise mode
        const modeValue = instrument.toneNoiseMode === 'tone' ? 0 : 1;
        if (modeValue === 1) {
          // Enable noise for this channel
          ym2149.writeRegister(0x07, 0x38 | (1 << channel)); // Enable noise for this channel
        } else {
          // Disable noise for this channel
          ym2149.writeRegister(0x07, 0x38); // Enable tone only
        }
      }
    } else if (!noteData) {
      // No note data - silence channel
      ym2149.writeRegister(volumeRegister, 0x00);
      return;
    }

    // Get instrument for this track
    const instrument = currentSong.instruments.find(inst => inst.id === noteData?.instrument);
    if (!instrument) return;

    // Apply volume envelope
    const volumeIndex = Math.min(currentTick, instrument.volumeEnvelope.length - 1);
    const volumeValue = instrument.volumeEnvelope[volumeIndex];
    const volume = Math.max(0, Math.min(15, volumeValue)); // Clamp to 0-15
    
    ym2149.writeRegister(volumeRegister, volume);
    
    // Apply noise envelope if in noise mode
    if (instrument.toneNoiseMode === 'noise') {
      const noiseIndex = Math.min(currentTick, instrument.noiseEnvelope.length - 1);
      const noiseValue = instrument.noiseEnvelope[noiseIndex];
      const noisePeriod = Math.max(0, Math.min(31, noiseValue)); // Clamp to 0-31
      ym2149.writeRegister(0x06, noisePeriod); // Noise period register
    }
  }, [currentSong.instruments]);

  // Handle stop playback with silence
  const handlePatternChange = useCallback((newPattern: any) => {
    const updatedPatterns = [...currentSong.patterns];
    updatedPatterns[0] = newPattern; // Update first pattern
    
    updateSong({ patterns: updatedPatterns });
  }, [currentSong.patterns, updateSong]);

  const getCurrentPattern = useCallback(() => {
    return currentSong.patterns[0] || null;
  }, [currentSong]);

  // Handle instrument selection
  const handleInstrumentSelect = useCallback((instrument: Instrument) => {
    console.log('Selecting instrument:', instrument.id, instrument.name);
    setCurrentInstrument(instrument);
  }, []);

  // Handle stop playback with silence
  const handleStop = useCallback(() => {
    // Stop the sequencer
    stop();
    
    // Silence all channels immediately
    if (ym2149Ref.current) {
      const ym2149 = ym2149Ref.current;
      ym2149.writeRegister(0x08, 0x00); // Silence channel A
      ym2149.writeRegister(0x09, 0x00); // Silence channel B
      ym2149.writeRegister(0x0A, 0x00); // Silence channel C
    }
  }, [stop]);

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
          onLoadSong={() => console.log('Load song clicked')}
          onNewInstrument={createNewInstrument}
          onSaveInstrument={saveInstrument}
          onLoadInstrument={() => console.log('Load instrument clicked')}
          onPlaySong={() => start()}
          onStopSong={handleStop}
          onExportData={() => console.log('Export clicked')}
          isPlaying={sequencerState.isPlaying}
          isDosoundMode={true}
          onToggleDosoundMode={() => console.log('Toggle DOSOUND mode')}
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
                    pattern={getCurrentPattern()}
                    onPatternChange={handlePatternChange}
                    ym2149={ym2149Ref.current}
                  />
                  
                  <TrackPanel
                    trackId="B"
                    activeSection={activeSection}
                    setActiveSection={setActiveSection}
                    currentOctave={currentOctave}
                    onScroll={handleTrackScroll}
                    currentLine={sharedCurrentLine}
                    onLineChange={handleLineChange}
                    pattern={getCurrentPattern()}
                    onPatternChange={handlePatternChange}
                    ym2149={ym2149Ref.current}
                  />
                  
                  <TrackPanel
                    trackId="C"
                    activeSection={activeSection}
                    setActiveSection={setActiveSection}
                    currentOctave={currentOctave}
                    onScroll={handleTrackScroll}
                    currentLine={sharedCurrentLine}
                    onLineChange={handleLineChange}
                    pattern={getCurrentPattern()}
                    onPatternChange={handlePatternChange}
                    ym2149={ym2149Ref.current}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="middle-column">
            <ToneNoisePanel
              activeSection={activeSection}
              setActiveSection={setActiveSection}
            />
            
            <EnvelopePanel
              type="volume"
              activeSection={activeSection}
              setActiveSection={setActiveSection}
              data={currentInstrument.volumeEnvelope}
              onChange={(data: number[]) => {
                console.log('Volume envelope changed:', data);
                updateInstrument({ volumeEnvelope: data });
              }}
            />
            
            <EnvelopePanel
              type="arpeggio"
              activeSection={activeSection}
              setActiveSection={setActiveSection}
              data={currentInstrument.arpeggioEnvelope}
              onChange={(data: number[]) => {
                console.log('Arpeggio envelope changed:', data);
                updateInstrument({ arpeggioEnvelope: data });
              }}
            />
            
            <EnvelopePanel
              type="pitch"
              activeSection={activeSection}
              setActiveSection={setActiveSection}
              data={currentInstrument.pitchEnvelope}
              onChange={(data: number[]) => {
                console.log('Pitch envelope changed:', data);
                updateInstrument({ pitchEnvelope: data });
              }}
            />
            
            <EnvelopePanel
              type="noise"
              activeSection={activeSection}
              setActiveSection={setActiveSection}
              data={currentInstrument.noiseEnvelope}
              onChange={(data: number[]) => {
                console.log('Noise envelope changed:', data);
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

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useKeyboardNavigation } from './hooks/useKeyboardNavigation';
import { useDataManagement } from './hooks/useDataManagement';
import { useSequencer } from './hooks/useSequencer';
import { YM2149 } from './synth/ym2149/YM2149';
import { HeaderPanel } from './components/HeaderPanel';
import { CommandPanel } from './components/CommandPanel';
import { TrackPanel } from './components/TrackPanel';
import { EnvelopePanel } from './components/EnvelopePanel';
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
    updateSong,
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
      
      // Play notes at the beginning of each line (tick 0)
      if (state.currentTick === 0 && ym2149Ref.current) {
        const ym2149 = ym2149Ref.current;
        
        // Get current line data from tracks (simplified - just play a demo pattern)
        if (state.currentLine % 8 === 0) { // Play a note every 8 lines
          // Play C note on channel A
          const frequency = 261.63 * Math.pow(2, 4 - 4); // C4
          const period = Math.floor(2000000 / (16 * frequency));
          ym2149.writeRegister(0x00, period & 0xFF);
          ym2149.writeRegister(0x01, (period >> 8) & 0x0F);
          ym2149.writeRegister(0x08, 0x0F); // Volume
        } else if (state.currentLine % 8 === 4) { // Play E note
          // Play E note on channel A
          const frequency = 329.63 * Math.pow(2, 4 - 4); // E4
          const period = Math.floor(2000000 / (16 * frequency));
          ym2149.writeRegister(0x00, period & 0xFF);
          ym2149.writeRegister(0x01, (period >> 8) & 0x0F);
          ym2149.writeRegister(0x08, 0x0F); // Volume
        } else {
          // Silence on other beats
          ym2149.writeRegister(0x08, 0x00); // Volume = 0
        }
      }
    });
  }, [setCallback]);

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
          onStopSong={() => stop()}
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
                  />
                  
                  <TrackPanel
                    trackId="B"
                    activeSection={activeSection}
                    setActiveSection={setActiveSection}
                    currentOctave={currentOctave}
                    onScroll={handleTrackScroll}
                    currentLine={sharedCurrentLine}
                    onLineChange={handleLineChange}
                  />
                  
                  <TrackPanel
                    trackId="C"
                    activeSection={activeSection}
                    setActiveSection={setActiveSection}
                    currentOctave={currentOctave}
                    onScroll={handleTrackScroll}
                    currentLine={sharedCurrentLine}
                    onLineChange={handleLineChange}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="middle-column">
            <EnvelopePanel
              type="toneNoise"
              activeSection={activeSection}
              setActiveSection={setActiveSection}
            />
            
            <EnvelopePanel
              type="volume"
              activeSection={activeSection}
              setActiveSection={setActiveSection}
              data={currentInstrument.volumeEnvelope}
              onChange={(data: number[]) => console.log('Volume envelope changed:', data)}
            />
            
            <EnvelopePanel
              type="arpeggio"
              activeSection={activeSection}
              setActiveSection={setActiveSection}
              data={currentInstrument.arpeggioEnvelope}
              onChange={(data: number[]) => console.log('Arpeggio envelope changed:', data)}
            />
            
            <EnvelopePanel
              type="pitch"
              activeSection={activeSection}
              setActiveSection={setActiveSection}
              data={currentInstrument.pitchEnvelope}
              onChange={(data: number[]) => console.log('Pitch envelope changed:', data)}
            />
            
            <EnvelopePanel
              type="noise"
              activeSection={activeSection}
              setActiveSection={setActiveSection}
              data={currentInstrument.noiseEnvelope}
              onChange={(data: number[]) => console.log('Noise envelope changed:', data)}
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
              onSelectInstrument={() => console.log('Instrument selected')}
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

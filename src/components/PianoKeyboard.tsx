import React, { useRef, useEffect, useCallback, useState } from 'react';
import type { NavigationSection } from '../constants/navigation';
import { MIN_OCTAVE, MAX_OCTAVE, NOTE_FREQUENCIES, KEYBOARD_TO_NOTE } from '../constants/music';
import { YM2149 } from '../synth/ym2149/YM2149';
import type { Instrument } from '../synth/dosound/DosoundDriver';

interface PianoKeyboardProps {
  activeSection: NavigationSection;
  setActiveSection: (section: NavigationSection) => void;
  currentOctave: number;
  onOctaveChange: (octave: number) => void;
  ym2149: YM2149 | null;
  currentInstrument: Instrument;
  previewChannel: number;
}

export const PianoKeyboard: React.FC<PianoKeyboardProps> = ({
  activeSection,
  setActiveSection,
  currentOctave,
  onOctaveChange,
  ym2149,
  currentInstrument,
  previewChannel
}) => {
  const [pressedKeys, setPressedKeys] = useState<Set<string>>(new Set());
  const pianoRef = useRef<HTMLDivElement>(null);
  const isActive = activeSection === 'piano';
  
  // Envelope timing state
  const envelopeTimersRef = useRef<{ [key: string]: number }>({});
  const cycleCountersRef = useRef<{ [key: string]: number }>({});

  // Generate piano keys for 5 octaves with proper layout
  const generatePianoKeys = () => {
    const keys = [];
    const startOctave = Math.max(MIN_OCTAVE, Math.min(MAX_OCTAVE - 4, currentOctave - 1));
    
    for (let octave = startOctave; octave <= startOctave + 4 && octave <= MAX_OCTAVE; octave++) {
      const octaveOffset = (octave - startOctave) * 7; // 7 white keys per octave
      
      // White keys first
      const whiteNotes = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
      for (let i = 0; i < whiteNotes.length; i++) {
        const note = whiteNotes[i];
        const keyId = `${note}${octave}`;
        keys.push({
          note,
          octave,
          isBlackKey: false,
          keyId,
          position: octaveOffset + i,
          stableKey: `${octave}-${i}-white` // Stable key for React
        });
      }
      
      // Black keys positioned between white keys
      const blackKeyPositions = [
        { note: 'C#', whiteKeyIndex: 0 },  // Between C (0) and D (1)
        { note: 'D#', whiteKeyIndex: 1 },  // Between D (1) and E (2)
        { note: 'F#', whiteKeyIndex: 3 },  // Between F (3) and G (4)
        { note: 'G#', whiteKeyIndex: 4 },  // Between G (4) and A (5)
        { note: 'A#', whiteKeyIndex: 5 }   // Between A (5) and B (6)
      ];
      
      for (const blackKey of blackKeyPositions) {
        const keyId = `${blackKey.note}${octave}`;
        keys.push({
          note: blackKey.note,
          octave,
          isBlackKey: true,
          keyId,
          position: octaveOffset + blackKey.whiteKeyIndex + 0.5, // Position between white keys
          stableKey: `${octave}-${blackKey.whiteKeyIndex}-black` // Stable key for React
        });
      }
    }
    
    return keys;
  };

  const pianoKeys = generatePianoKeys();

  useEffect(() => {
    if (isActive && pianoRef.current) {
      pianoRef.current.focus();
    }
  }, [isActive]);

  const playNote = useCallback((note: string, octave: number) => {
    if (!ym2149) return;

    const baseFreq = NOTE_FREQUENCIES[note];
    if (!baseFreq) return;

    const frequency = baseFreq * Math.pow(2, octave - 4);
    const period = Math.floor(2000000 / (16 * frequency));
    const keyId = `${note}${octave}`;

    // Clear any existing timer for this key
    if (envelopeTimersRef.current[keyId]) {
      clearInterval(envelopeTimersRef.current[keyId]);
    }

    // Initialize cycle counter for this key
    cycleCountersRef.current[keyId] = 0;

    const channel = previewChannel;
    const fineRegister = channel * 2;
    const coarseRegister = channel * 2 + 1;
    const volumeRegister = 0x08 + channel;

    const applyModeForTick = (tick: number) => {
      const { toneActive, noiseActive } = ym2149.getToneNoiseState(currentInstrument, tick);
      ym2149.updateMixerForChannel(channel, toneActive, noiseActive);
      if (noiseActive) {
        ym2149.applyNoiseEnvelopeValue(currentInstrument, tick);
      }
    };

    // Apply initial mode/noise state before programming tone
    applyModeForTick(0);

    // Play on channel A (for simplicity)
    ym2149.writeRegister(fineRegister, period & 0xFF);        // Fine tone A
    ym2149.writeRegister(coarseRegister, (period >> 8) & 0x0F);  // Coarse tone A

    // Set initial volume from envelope
    const initialVolume = currentInstrument.volumeEnvelope[0] || 0x0F;
    ym2149.writeRegister(volumeRegister, initialVolume); // Volume A

    // Start envelope timer - update every 20ms (50Hz), but change volume every 40ms (every 2 cycles)
    let envelopeIndex = 0; // Separate counter for envelope position
    
    envelopeTimersRef.current[keyId] = setInterval(() => {
      const cycle = cycleCountersRef.current[keyId];
      
      // Update volume only on cycle 0 (every 2 cycles = 40ms)
      if (cycle === 0) {
        applyModeForTick(envelopeIndex);
        if (envelopeIndex < currentInstrument.volumeEnvelope.length) {
          const volume = currentInstrument.volumeEnvelope[envelopeIndex];
          const clampedVolume = Math.max(0, Math.min(15, volume)); // Clamp to 0-15
          ym2149.writeRegister(volumeRegister, clampedVolume);
          envelopeIndex++; // Increment envelope index when volume changes
        } else {
          // Envelope finished, keep last value
          const lastVolume = currentInstrument.volumeEnvelope[currentInstrument.volumeEnvelope.length - 1];
          const clampedVolume = Math.max(0, Math.min(15, lastVolume));
          ym2149.writeRegister(volumeRegister, clampedVolume);
        }
      }

      // Update cycle counter (0, 1, 0, 1, ...)
      cycleCountersRef.current[keyId] = (cycle + 1) % 2;
    }, 20); // 20ms = 50Hz VBLANK rate
  }, [ym2149, currentInstrument, previewChannel]);

  const stopNote = useCallback((note?: string, octave?: number) => {
    if (!ym2149) return;
    
    // If note and octave provided, clear specific timer
    if (note && octave) {
      const keyId = `${note}${octave}`;
      if (envelopeTimersRef.current[keyId]) {
        clearInterval(envelopeTimersRef.current[keyId]);
        delete envelopeTimersRef.current[keyId];
      }
      if (cycleCountersRef.current[keyId]) {
        delete cycleCountersRef.current[keyId];
      }
    } else {
      // Clear all timers (fallback)
      Object.values(envelopeTimersRef.current).forEach(timer => clearInterval(timer));
      envelopeTimersRef.current = {};
      cycleCountersRef.current = {};
    }
    
    const volumeRegister = 0x08 + previewChannel;
    ym2149.writeRegister(volumeRegister, 0x00);
  }, [ym2149, previewChannel]);

  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (!isActive) return;

    const key = event.key.toUpperCase();
    
    // Handle computer keyboard notes
    if (KEYBOARD_TO_NOTE[key]) {
      event.preventDefault();
      const { note, octaveOffset } = KEYBOARD_TO_NOTE[key];
      const finalOctave = Math.max(0, Math.min(7, currentOctave + octaveOffset));
      const keyId = `${note}${finalOctave}`;
      
      if (!pressedKeys.has(keyId)) {
        setPressedKeys(prev => new Set(prev).add(keyId));
        playNote(note, finalOctave);
      }
    }
    
    // Handle octave changes
    if (key === 'ARROWUP') {
      event.preventDefault();
      onOctaveChange(Math.min(MAX_OCTAVE, currentOctave + 1));
    } else if (key === 'ARROWDOWN') {
      event.preventDefault();
      onOctaveChange(Math.max(MIN_OCTAVE, currentOctave - 1));
    }
  }, [isActive, currentOctave, onOctaveChange, playNote, pressedKeys]);

  const handleKeyUp = useCallback((event: React.KeyboardEvent) => {
    if (!isActive) return;

    const key = event.key.toUpperCase();
    
    if (KEYBOARD_TO_NOTE[key]) {
      const { note, octaveOffset } = KEYBOARD_TO_NOTE[key];
      const finalOctave = Math.max(0, Math.min(7, currentOctave + octaveOffset));
      const keyId = `${note}${finalOctave}`;
      
      setPressedKeys(prev => {
        const newSet = new Set(prev);
        newSet.delete(keyId);
        return newSet;
      });
      
      if (pressedKeys.has(keyId)) {
        stopNote(note, finalOctave);
      }
    }
  }, [isActive, currentOctave, stopNote, pressedKeys]);

  const handlePianoKeyDown = useCallback((note: string, octave: number) => {
    const keyId = `${note}${octave}`;
    
    if (!pressedKeys.has(keyId)) {
      setPressedKeys(prev => new Set(prev).add(keyId));
      playNote(note, octave);
    }
    
    setActiveSection('piano');
  }, [pressedKeys, playNote, setActiveSection]);

  const handlePianoKeyUp = useCallback((note: string, octave: number) => {
    const keyId = `${note}${octave}`;
    
    setPressedKeys(prev => {
      const newSet = new Set(prev);
      newSet.delete(keyId);
      return newSet;
    });
    
    if (pressedKeys.has(keyId)) {
      stopNote(note, octave);
    }
  }, [pressedKeys, stopNote]);

  const getKeyClass = useCallback((key: any) => {
    const classes = ['piano-key'];
    
    if (key.isBlackKey) {
      classes.push('black-key');
    } else {
      classes.push('white-key');
    }
    
    if (pressedKeys.has(key.keyId)) {
      classes.push('pressed');
    }
    
    return classes.join(' ');
  }, [pressedKeys]);

  return (
    <div className="piano-keyboard-container">
      {/* Piano keyboard */}
      <div 
        ref={pianoRef}
        className={`piano-keyboard ${isActive ? 'active' : ''}`}
        tabIndex={0}
        onKeyDown={handleKeyDown}
        onKeyUp={handleKeyUp}
        onClick={() => setActiveSection('piano')}
      >
        <div className="piano-keys">
          {pianoKeys.map((key) => (
            <div
              key={key.stableKey}
              className={getKeyClass(key)}
              style={{
                left: key.isBlackKey ? `${Math.floor(key.position) * 25 + 28}px` : 'auto',
                position: key.isBlackKey ? 'absolute' : 'relative'
              }}
              onMouseDown={() => handlePianoKeyDown(key.note, key.octave)}
              onMouseUp={() => handlePianoKeyUp(key.note, key.octave)}
              onMouseLeave={() => handlePianoKeyUp(key.note, key.octave)}
              title={`${key.note}${key.octave}`}
            >
              {!key.isBlackKey && (
                <span className="key-label">
                  {key.note}{key.octave}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Keyboard mapping hint */}
      <div className="keyboard-hint">
        <span>Use computer keyboard Z-M, Q-P, etc. to play notes</span>
      </div>
    </div>
  );
};

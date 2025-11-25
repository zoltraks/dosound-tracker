import React, { useRef, useEffect, useCallback, useState } from 'react';
import type { NavigationSection } from '../constants/navigation';
import { MIN_OCTAVE, MAX_OCTAVE, NOTE_FREQUENCIES, KEYBOARD_TO_NOTE } from '../constants/music';
import { YM2149 } from '../synth/YM2149';
import type { Instrument } from '../synth/SoundDriver';

interface PianoKeyboardProps {
  activeSection: NavigationSection;
  setActiveSection: (section: NavigationSection) => void;
  currentOctave: number;
  onOctaveChange: (octave: number) => void;
  ym2149: YM2149 | null;
  currentInstrument: Instrument;
  previewChannel: number;
  onChangeBaseKey: (note: string, octave: number) => void;
}

export const PianoKeyboard: React.FC<PianoKeyboardProps> = ({
  activeSection,
  setActiveSection,
  currentOctave,
  onOctaveChange,
  ym2149,
  currentInstrument,
  previewChannel,
  onChangeBaseKey
}) => {
  const [pressedKeys, setPressedKeys] = useState<Set<string>>(new Set());
  const pianoRef = useRef<HTMLDivElement>(null);
  const isActive = activeSection === 'piano';
  
  // Envelope timing state per previewed key
  const envelopeTimersRef = useRef<{ [key: string]: number }>({});
  const previewSubTicksRef = useRef<{ [key: string]: number }>({});
  const previewEnvelopeStepsRef = useRef<{ [key: string]: number }>({});

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

  const parseBaseKey = (value?: string): { note: string; octave: number } | null => {
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
  };

  const baseKeyData = parseBaseKey(currentInstrument.base || 'C-4');

  useEffect(() => {
    if (isActive && pianoRef.current) {
      pianoRef.current.focus();
    }
  }, [isActive]);

  const playNote = useCallback((note: string, octave: number) => {
    if (!ym2149) return;

    const baseFreq = NOTE_FREQUENCIES[note];
    if (!baseFreq) return;
    const keyId = `${note}${octave}`;

    // Clear any existing timer for this key
    if (envelopeTimersRef.current[keyId]) {
      clearInterval(envelopeTimersRef.current[keyId]);
    }

    const channel = previewChannel;
    const instrument = currentInstrument as any;
    const noteData = { note, octave };

    // Initialize envelope timing
    previewSubTicksRef.current[keyId] = 0;
    previewEnvelopeStepsRef.current[keyId] = 0;

    // Apply initial state (step 0)
    ym2149.updateChannelWithInstrument(channel, instrument, noteData, 0);

    // Start envelope timer - 20ms tick, but advance envelope step every 40ms (every 2 ticks)
    envelopeTimersRef.current[keyId] = window.setInterval(() => {
      const currentSub = (previewSubTicksRef.current[keyId] ?? 0) + 1;
      previewSubTicksRef.current[keyId] = currentSub;

      let currentStep = previewEnvelopeStepsRef.current[keyId] ?? 0;
      // Advance envelope step only on every second 20ms tick
      if (currentSub % 2 === 0) {
        currentStep = currentStep + 1;
        previewEnvelopeStepsRef.current[keyId] = currentStep;
      }

      ym2149.updateChannelWithInstrument(channel, instrument, noteData, currentStep);
    }, 20); // 20ms base tick, 40ms per envelope step
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
      if (previewSubTicksRef.current[keyId] !== undefined) {
        delete previewSubTicksRef.current[keyId];
      }
      if (previewEnvelopeStepsRef.current[keyId] !== undefined) {
        delete previewEnvelopeStepsRef.current[keyId];
      }
    } else {
      // Clear all timers (fallback)
      Object.values(envelopeTimersRef.current).forEach(timer => clearInterval(timer));
      envelopeTimersRef.current = {};
      previewSubTicksRef.current = {};
      previewEnvelopeStepsRef.current = {};
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
          {pianoKeys.map((key) => {
            const isBaseKey =
              !!baseKeyData &&
              key.note.toUpperCase() === baseKeyData.note &&
              key.octave === baseKeyData.octave;

            return (
              <div
                key={key.stableKey}
                className={getKeyClass(key)}
                style={{
                  left: key.isBlackKey ? `${Math.floor(key.position) * 25 + 28}px` : 'auto',
                  position: key.isBlackKey ? 'absolute' : 'relative'
                }}
                onMouseDown={(e) => {
                  if (e.button === 0) {
                    handlePianoKeyDown(key.note, key.octave);
                  }
                }}
                onMouseUp={(e) => {
                  if (e.button === 0) {
                    handlePianoKeyUp(key.note, key.octave);
                  }
                }}
                onMouseLeave={() => handlePianoKeyUp(key.note, key.octave)}
                onContextMenu={(e) => {
                  e.preventDefault();
                  onChangeBaseKey(key.note, key.octave);
                }}
                title={`${key.note}${key.octave}`}
              >
                {!key.isBlackKey && (
                  <span className="key-label">
                    {key.note}{key.octave}
                  </span>
                )}
                {isBaseKey && <span className="base-key-dot" />}
              </div>
            );
          })}
        </div>
      </div>

      {/* Keyboard mapping hint */}
      <div className="keyboard-hint">
        <span>Use computer keyboard Z-M, Q-P, etc. to play notes</span>
      </div>
    </div>
  );
};

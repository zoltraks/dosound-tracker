import React, { useRef, useEffect, useCallback, useState } from 'react';
import type { NavigationSection } from '../constants/navigation';
import { MIN_OCTAVE, MAX_OCTAVE, NOTE_FREQUENCIES, KEYBOARD_TO_NOTE } from '../constants/music';
import { YM2149 } from '../synth/YM2149';
import type { Instrument } from '../synth/SoundDriver';
import { PianoKey } from './PianoKey';
import { generatePianoKeys, parseBaseKey } from '../utils/pianoUtils';
import type { PianoKeyConfig } from '../utils/pianoUtils';
import { usePianoEnvelopeTiming } from '../hooks/usePianoEnvelopeTiming';

interface PianoKeyboardProps {
  activeSection: NavigationSection;
  setActiveSection: (section: NavigationSection) => void;
  currentOctave: number;
  onOctaveChange: (octave: number) => void;
  ym2149: YM2149 | null;
  currentInstrument: Instrument;
  previewChannel: number;
  onChangeBaseKey: (note: string, octave: number) => void;
  onPreviewMidiNoteOn?: (ymChannel: number, instrument: Instrument, note: string, octave: number) => void;
  onPreviewMidiNoteOff?: (ymChannel: number) => void;
  ensureAudioContextResumed?: () => Promise<void> | void;
}

export const PianoKeyboard: React.FC<PianoKeyboardProps> = ({
  activeSection,
  setActiveSection,
  currentOctave,
  onOctaveChange,
  ym2149,
  currentInstrument,
  previewChannel,
  onChangeBaseKey,
  onPreviewMidiNoteOn,
  onPreviewMidiNoteOff,
  ensureAudioContextResumed,
}) => {
  const [pressedKeys, setPressedKeys] = useState<Set<string>>(new Set());
  const pianoRef = useRef<HTMLDivElement>(null);
  const isActive = activeSection === 'piano';
  const [isCompactLayout, setIsCompactLayout] = useState(false);

  // Use the envelope timing hook
  const { startEnvelope, stopEnvelope, stopAllEnvelopes } = usePianoEnvelopeTiming({
    ym2149,
    channel: previewChannel,
    onPreviewMidiNoteOn,
    onPreviewMidiNoteOff
  });

  const pianoKeys = generatePianoKeys(isCompactLayout, currentOctave);

  useEffect(() => {
    const updateLayout = () => {
      if (typeof window === 'undefined') {
        return;
      }

      const width = window.innerWidth;
      const height = window.innerHeight;
      setIsCompactLayout(width <= 1100 || height <= 700);
    };

    updateLayout();

    if (typeof window !== 'undefined') {
      window.addEventListener('resize', updateLayout);
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('resize', updateLayout);
      }
    };
  }, []);

  const baseKeyData = parseBaseKey(currentInstrument.base || 'C-4');

  useEffect(() => {
    if (isActive && pianoRef.current) {
      pianoRef.current.focus();
    }
  }, [isActive]);

  const stopNote = useCallback((note?: string, octave?: number) => {
    if (note && octave) {
      const keyId = `${note}${octave}`;
      stopEnvelope(keyId);
    } else {
      // Stop all envelopes if no specific note provided
      stopAllEnvelopes();
    }
  }, [stopEnvelope, stopAllEnvelopes]);

  const playNote = useCallback((note: string, octave: number) => {
    const baseFreq = NOTE_FREQUENCIES[note];
    if (!baseFreq) return;

    // For preview, treat the channel as strictly monophonic: before starting
    // a new note, stop any existing preview envelopes on this channel to
    // avoid overlapping timers fighting over the same YM2149 registers.
    stopNote();

    // Start the envelope using the hook
    startEnvelope(note, octave, currentInstrument);
  }, [currentInstrument, startEnvelope, stopNote]);

  const playNoteWithAudioUnlock = useCallback(
    (note: string, octave: number) => {
      const run = async () => {
        if (ensureAudioContextResumed) {
          try {
            await ensureAudioContextResumed();
          } catch {
            // ignore resume errors here; they are logged where ensureAudioContextResumed is defined
          }
        }

        playNote(note, octave);
      };

      void run();
    },
    [ensureAudioContextResumed, playNote]
  );

  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (!isActive) return;

    // Play base note with Space when piano has focus
    if (event.key === ' ') {
      if (baseKeyData) {
        event.preventDefault();
        event.stopPropagation();
        const keyId = `${baseKeyData.note}${baseKeyData.octave}`;

        if (!pressedKeys.has(keyId)) {
          setPressedKeys(prev => new Set(prev).add(keyId));
          playNoteWithAudioUnlock(baseKeyData.note, baseKeyData.octave);
        }
      }
      return;
    }

    const key = event.key.toUpperCase();
    
    // Handle computer keyboard notes
    if (KEYBOARD_TO_NOTE[key]) {
      event.preventDefault();
      const { note, octaveOffset } = KEYBOARD_TO_NOTE[key];
      const finalOctave = Math.max(0, Math.min(7, currentOctave + octaveOffset));
      const keyId = `${note}${finalOctave}`;
      
      if (!pressedKeys.has(keyId)) {
        setPressedKeys(prev => new Set(prev).add(keyId));
        playNoteWithAudioUnlock(note, finalOctave);
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
  }, [isActive, currentOctave, onOctaveChange, playNoteWithAudioUnlock, pressedKeys, baseKeyData]);

  const handleKeyUp = useCallback((event: React.KeyboardEvent) => {
    if (!isActive) return;

    if (event.key === ' ') {
      if (baseKeyData) {
        event.preventDefault();
        event.stopPropagation();
        const keyId = `${baseKeyData.note}${baseKeyData.octave}`;

        setPressedKeys(prev => {
          const newSet = new Set(prev);
          newSet.delete(keyId);
          return newSet;
        });

        if (pressedKeys.has(keyId)) {
          stopNote(baseKeyData.note, baseKeyData.octave);
        }
      }
      return;
    }

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
  }, [isActive, currentOctave, stopNote, pressedKeys, baseKeyData]);

  const handlePianoKeyDown = useCallback((note: string, octave: number) => {
    const keyId = `${note}${octave}`;
    
    if (!pressedKeys.has(keyId)) {
      setPressedKeys(prev => new Set(prev).add(keyId));
      playNoteWithAudioUnlock(note, octave);
    }

    if (!isActive) {
      setActiveSection('piano');
    }
  }, [isActive, pressedKeys, playNoteWithAudioUnlock, setActiveSection]);

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

  const getKeyClass = useCallback((key: PianoKeyConfig) => {
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
        onClick={() => {
          if (!isActive) {
            setActiveSection('piano');
          }
        }}
      >
        <div className="piano-keys">
          {pianoKeys.map((key) => {
            const isBaseKey =
              !!baseKeyData &&
              key.note.toUpperCase() === baseKeyData.note &&
              key.octave === baseKeyData.octave;

            return (
              <PianoKey
                key={key.stableKey}
                keyData={key}
                className={getKeyClass(key)}
                isBaseKey={isBaseKey}
                onKeyDown={handlePianoKeyDown}
                onKeyUp={handlePianoKeyUp}
                onContextMenu={onChangeBaseKey}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
};

import React, { useRef, useEffect, useCallback, useState } from 'react';
import type { NavigationSection } from '../constants/navigation';
import { MIN_OCTAVE, MAX_OCTAVE, NOTE_FREQUENCIES, KEYBOARD_TO_NOTE } from '../constants/music';
import { YM2149 } from '../synth/YM2149';
import type { Instrument } from '../synth/SoundDriver';
import type { Instrument as YmInstrument } from '../synth/YM2149';

type PreviewInstrument = YmInstrument & { sustain?: number | null };

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
}

interface PianoKey {
  note: string;
  octave: number;
  isBlackKey: boolean;
  keyId: string;
  position: number;
  stableKey: string;
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
  onPreviewMidiNoteOff
}) => {
  const [pressedKeys, setPressedKeys] = useState<Set<string>>(new Set());
  const pianoRef = useRef<HTMLDivElement>(null);
  const isActive = activeSection === 'piano';
  const [isCompactLayout, setIsCompactLayout] = useState(false);
  
  // Envelope timing state per previewed key
  const envelopeTimersRef = useRef<{ [key: string]: number }>({});
  const previewSubTicksRef = useRef<{ [key: string]: number }>({});
  const previewEnvelopeStepsRef = useRef<{ [key: string]: number }>({});
  const previewSustainIndexRef = useRef<{ [key: string]: number | null }>({});
  const previewReleasedRef = useRef<{ [key: string]: boolean }>({});
  const previewLastTickTimeRef = useRef<{ [key: string]: number }>({});
  const previewNextTickTimeRef = useRef<{ [key: string]: number }>({});

  // Generate piano keys for 5 octaves on desktop and fewer octaves on compact layouts,
  // and always append a highest C key at the right end of the keyboard.
  const generatePianoKeys = (): PianoKey[] => {
    const keys: PianoKey[] = [];
    const octaveSpan = isCompactLayout ? 3 : 5;
    const maxStartOctave = MAX_OCTAVE - (octaveSpan - 1);
    const startOctave = Math.max(
      MIN_OCTAVE,
      Math.min(maxStartOctave, currentOctave - 1)
    );

    for (let octave = startOctave; octave <= startOctave + octaveSpan - 1 && octave <= MAX_OCTAVE; octave++) {
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

    // Append an extra highest C white key at the right end so there is always
    // a top C button available on the keyboard.
    const highestDisplayedOctave = startOctave + octaveSpan - 1;
    const extraCOctave = Math.min(MAX_OCTAVE, highestDisplayedOctave + 1);
    const extraKeyId = `C${extraCOctave}`;

    keys.push({
      note: 'C',
      octave: extraCOctave,
      isBlackKey: false,
      keyId: extraKeyId,
      position: octaveSpan * 7,
      stableKey: `extra-top-c-${extraCOctave}`
    });

    return keys;
  };

  const pianoKeys = generatePianoKeys();

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

  const stopNote = useCallback((note?: string, octave?: number) => {
    if (onPreviewMidiNoteOff) {
      onPreviewMidiNoteOff(previewChannel);
    }

    if (!ym2149) return;

    const volumeRegister = 0x08 + previewChannel;

    // If note and octave provided, handle per-key release
    if (note && octave) {
      const keyId = `${note}${octave}`;
      const hasTimer = !!envelopeTimersRef.current[keyId];
      const hasState =
        previewSubTicksRef.current[keyId] !== undefined ||
        previewEnvelopeStepsRef.current[keyId] !== undefined ||
        previewSustainIndexRef.current[keyId] !== undefined ||
        previewReleasedRef.current[keyId] !== undefined;

      // If there is no active preview state for this note, treat this as a
      // stale key-up event and ignore it so we don't accidentally mute a
      // newer note that is currently playing on the same preview channel.
      if (!hasTimer && !hasState) {
        return;
      }

      const sustain = previewSustainIndexRef.current[keyId];
      const hasSustain = typeof sustain === 'number' && sustain >= 0;

      if (hasSustain) {
        // For instruments with sustain, key release acts as a release trigger:
        // keep the timer/envelope running and allow it to progress past sustain.
        previewReleasedRef.current[keyId] = true;
        return;
      }

      // No sustain for this note: perform immediate hard stop as before.
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
      if (previewSustainIndexRef.current[keyId] !== undefined) {
        delete previewSustainIndexRef.current[keyId];
      }
      if (previewReleasedRef.current[keyId] !== undefined) {
        delete previewReleasedRef.current[keyId];
      }
      if (previewLastTickTimeRef.current[keyId] !== undefined) {
        delete previewLastTickTimeRef.current[keyId];
      }
      if (previewNextTickTimeRef.current[keyId] !== undefined) {
        delete previewNextTickTimeRef.current[keyId];
      }

      ym2149.writeRegister(volumeRegister, 0x00);
      return;
    }

    // Clear all timers (fallback)
    Object.values(envelopeTimersRef.current).forEach(timer => clearInterval(timer));
    envelopeTimersRef.current = {};
    previewSubTicksRef.current = {};
    previewEnvelopeStepsRef.current = {};
    previewSustainIndexRef.current = {};
    previewReleasedRef.current = {};
    previewLastTickTimeRef.current = {};
    previewNextTickTimeRef.current = {};

    ym2149.writeRegister(volumeRegister, 0x00);
  }, [ym2149, previewChannel, onPreviewMidiNoteOff]);

  const playNote = useCallback((note: string, octave: number) => {
    if (!ym2149) return;

    const baseFreq = NOTE_FREQUENCIES[note];
    if (!baseFreq) return;
    const keyId = `${note}${octave}`;

    // For preview, treat the channel as strictly monophonic: before starting
    // a new note, stop any existing preview envelopes on this channel to
    // avoid overlapping timers fighting over the same YM2149 registers.
    stopNote();

    const channel = previewChannel;
    const instrument: PreviewInstrument = currentInstrument as unknown as PreviewInstrument;
    const noteData = { note, octave };

    // Initialize sustain state for this preview note
    const rawSustain = (instrument && typeof instrument.sustain === 'number')
      ? instrument.sustain
      : null;
    const sustainIndex =
      typeof rawSustain === 'number' && Number.isFinite(rawSustain) && rawSustain >= 0
        ? Math.floor(rawSustain)
        : null;

    previewSustainIndexRef.current[keyId] = sustainIndex;
    previewReleasedRef.current[keyId] = false;

    // Initialize envelope timing
    const now = performance.now();
    previewSubTicksRef.current[keyId] = 0;
    previewEnvelopeStepsRef.current[keyId] = 0;
    previewLastTickTimeRef.current[keyId] = now;
    previewNextTickTimeRef.current[keyId] = now + 20;

    // Apply initial state (step 0) with default volume modifier (0xF = no attenuation)
    ym2149.updateChannelWithInstrument(channel, instrument, noteData, 0, 0x0f);

    if (onPreviewMidiNoteOn) {
      onPreviewMidiNoteOn(channel, currentInstrument, note, octave);
    }

    // Precompute volume envelope tail information so we know when to auto-stop
    const volumeEnv: number[] =
      Array.isArray(instrument.volume) && instrument.volume.length > 0
        ? instrument.volume
        : [0x0f];
    const lastVolumeIndex = volumeEnv.length - 1;
    const lastVolumeValue = volumeEnv[lastVolumeIndex] ?? 0;
    const volumeRegister = 0x08 + channel;

    // Start envelope timer - 20ms base tick, advance envelope step every
    // second virtual tick (40ms), with catch-up for missed ticks.
    envelopeTimersRef.current[keyId] = window.setInterval(() => {
      const sustain = previewSustainIndexRef.current[keyId];
      const released = previewReleasedRef.current[keyId] ?? false;

      const TICK_INTERVAL_MS = 20;
      const nowTick = performance.now();

      let nextTickTime = previewNextTickTimeRef.current[keyId];
      if (!nextTickTime) {
        nextTickTime = nowTick + TICK_INTERVAL_MS;
      }

      let subTick = previewSubTicksRef.current[keyId] ?? 0;
      let rawStep = previewEnvelopeStepsRef.current[keyId] ?? 0;

      // Catch up on any missed 20ms ticks due to timer jitter.
      while (nowTick >= nextTickTime) {
        subTick = (subTick + 1) % 2;

        if (subTick === 0) {
          if (
            sustain === null ||
            sustain === undefined ||
            sustain < 0 ||
            released ||
            rawStep < sustain
          ) {
            rawStep = rawStep + 1;
          }
        }

        nextTickTime += TICK_INTERVAL_MS;
      }

      previewSubTicksRef.current[keyId] = subTick;
      previewEnvelopeStepsRef.current[keyId] = rawStep;
      previewLastTickTimeRef.current[keyId] = nowTick;
      previewNextTickTimeRef.current[keyId] = nextTickTime;

      const effectiveRawStep = rawStep;
      let stepForApply = effectiveRawStep;
      if (
        sustain !== null &&
        sustain !== undefined &&
        sustain >= 0 &&
        !released &&
        effectiveRawStep >= sustain
      ) {
        stepForApply = sustain;
      }

      ym2149.updateChannelWithInstrument(channel, instrument, noteData, stepForApply, 0x0f);

      // If this note has been released and the envelope has reached the end
      // of the volume envelope with a final value of 0, automatically stop
      // the preview to avoid leaving runaway timers.
      if (
        released &&
        lastVolumeIndex >= 0 &&
        effectiveRawStep >= lastVolumeIndex &&
        lastVolumeValue <= 0
      ) {
        const timerId = envelopeTimersRef.current[keyId];
        if (timerId) {
          clearInterval(timerId);
          delete envelopeTimersRef.current[keyId];
        }
        if (previewSubTicksRef.current[keyId] !== undefined) {
          delete previewSubTicksRef.current[keyId];
        }
        if (previewEnvelopeStepsRef.current[keyId] !== undefined) {
          delete previewEnvelopeStepsRef.current[keyId];
        }
        if (previewSustainIndexRef.current[keyId] !== undefined) {
          delete previewSustainIndexRef.current[keyId];
        }
        if (previewReleasedRef.current[keyId] !== undefined) {
          delete previewReleasedRef.current[keyId];
        }
        if (previewLastTickTimeRef.current[keyId] !== undefined) {
          delete previewLastTickTimeRef.current[keyId];
        }
        if (previewNextTickTimeRef.current[keyId] !== undefined) {
          delete previewNextTickTimeRef.current[keyId];
        }

        ym2149.writeRegister(volumeRegister, 0x00);
      }
    }, 20); // 20ms base tick, 40ms per envelope step
  }, [ym2149, currentInstrument, previewChannel, stopNote, onPreviewMidiNoteOn]);

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
          playNote(baseKeyData.note, baseKeyData.octave);
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
  }, [isActive, currentOctave, onOctaveChange, playNote, pressedKeys, baseKeyData]);

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

  const getKeyClass = useCallback((key: PianoKey) => {
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
    </div>
  );
};

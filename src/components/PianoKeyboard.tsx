import React, { useRef, useEffect, useCallback, useState } from 'react';
import type { NavigationSection } from '../constants/navigation';
import { MIN_OCTAVE, MAX_OCTAVE, NOTE_FREQUENCIES, KEYBOARD_TO_NOTE } from '../constants/music';
import { YM2149 } from '../synth/YM2149';
import type { Instrument } from '../synth/SoundDriver';
import { PianoKey } from './PianoKey';
import { generatePianoKeys, parseBaseKey } from '../utils/pianoUtils';
import type { PianoKeyConfig } from '../utils/pianoUtils';
import { getKeyboardMappedNote } from '../utils/keyboardNoteMapping';
import {
  advancePreviewEnvelopeTick,
  getPreviewEnvelopeApplyStep,
} from '../utils/previewEnvelopeTiming';

type PreviewInstrument = Instrument;

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
  
  // Envelope timing state per previewed key
  const envelopeTimersRef = useRef<{ [key: string]: number }>({});
  const previewSubTicksRef = useRef<{ [key: string]: number }>({});
  const previewEnvelopeStepsRef = useRef<{ [key: string]: number }>({});
  const previewSustainIndexRef = useRef<{ [key: string]: number | null }>({});
  const previewReleasedRef = useRef<{ [key: string]: boolean }>({});
  const previewLastTickTimeRef = useRef<{ [key: string]: number }>({});
  const previewNextTickTimeRef = useRef<{ [key: string]: number }>({});

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

      const advanced = advancePreviewEnvelopeTick({
        now: nowTick,
        nextTickTime: previewNextTickTimeRef.current[keyId],
        subTick: previewSubTicksRef.current[keyId],
        rawStep: previewEnvelopeStepsRef.current[keyId],
        sustainIndex: sustain,
        released,
        tickIntervalMs: TICK_INTERVAL_MS,
      });

      previewSubTicksRef.current[keyId] = advanced.subTick;
      previewEnvelopeStepsRef.current[keyId] = advanced.rawStep;
      previewLastTickTimeRef.current[keyId] = nowTick;
      previewNextTickTimeRef.current[keyId] = advanced.nextTickTime;

      const effectiveRawStep = advanced.rawStep;
      const stepForApply = getPreviewEnvelopeApplyStep(effectiveRawStep, sustain, released);

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
    const mapped = getKeyboardMappedNote(key, currentOctave, KEYBOARD_TO_NOTE);
    if (mapped) {
      event.preventDefault();
      const { note, octave: finalOctave, keyId } = mapped;

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

    const mapped = getKeyboardMappedNote(key, currentOctave, KEYBOARD_TO_NOTE);
    if (mapped) {
      const { note, octave: finalOctave, keyId } = mapped;

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

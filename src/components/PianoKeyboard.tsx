import React, { useRef, useEffect, useCallback, useState } from 'react';
import type { NavigationSection } from '../constants/navigation.ts';
import { MIN_OCTAVE, MAX_OCTAVE, NOTE_FREQUENCIES, KEYBOARD_TO_NOTE } from '../constants/music.ts';
import type { SoundEngine } from '../synth/soundEngine.ts';
import type { Instrument } from '../synth/SoundDriver.ts';
import { DEFAULT_SONG_FRAME } from '../constants/song.ts';
import { PianoKey } from './PianoKey.tsx';
import { generatePianoKeys, noteKeyId, parseBaseKey } from '../utils/panel/pianoUtils.ts';
import type { PianoKeyConfig } from '../utils/panel/pianoUtils.ts';
import { getKeyboardMappedNote } from '../utils/keyboard/keyboardNoteMapping.ts';
import { usePreviewEnvelope } from '../hooks/playback/usePreviewEnvelope.ts';

interface PianoKeyboardProps {
  activeSection: NavigationSection;
  setActiveSection: (section: NavigationSection) => void;
  currentOctave: number;
  onOctaveChange: (octave: number) => void;
  ym2149: SoundEngine | null;
  currentInstrument: Instrument;
  previewChannel: number;
  tickIntervalMs?: number;
  onChangeBaseKey: (note: string, octave: number) => void;
  onPreviewMidiNoteOn?: (
    ymChannel: number,
    instrument: Instrument,
    note: string,
    octave: number,
  ) => void;
  onPreviewMidiNoteOff?: (ymChannel: number) => void;
  ensureAudioContextResumed?: () => Promise<void> | void;
  sharedCurrentLine: number;
  onToggleLineFromCursor: (lineIndex: number) => void;
  onToggleLineFromStart: (lineIndex: number) => void;
  onToggleSongFromCursor: (lineIndex: number) => void;
  onToggleSongFromStart: (lineIndex: number) => void;
}

export const PianoKeyboard: React.FC<PianoKeyboardProps> = ({
  activeSection,
  setActiveSection,
  currentOctave,
  onOctaveChange,
  ym2149,
  currentInstrument,
  previewChannel,
  tickIntervalMs = 1000 / DEFAULT_SONG_FRAME,
  onChangeBaseKey,
  onPreviewMidiNoteOn,
  onPreviewMidiNoteOff,
  ensureAudioContextResumed,
  sharedCurrentLine,
  onToggleLineFromCursor,
  onToggleLineFromStart,
  onToggleSongFromCursor,
  onToggleSongFromStart,
}) => {
  const [pressedKeys, setPressedKeys] = useState<Set<string>>(new Set());
  const pianoRef = useRef<HTMLDivElement>(null);
  const isActive = activeSection === 'piano';
  const [isCompactLayout, setIsCompactLayout] = useState(false);

  const preview = usePreviewEnvelope({ ym2149 });

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

  const stopNote = useCallback(
    (note?: string, octave?: number) => {
      if (onPreviewMidiNoteOff) {
        onPreviewMidiNoteOff(previewChannel);
      }

      if (!ym2149) return;

      if (note && octave) {
        const keyId = noteKeyId(note, octave);

        // If there is no active preview state for this note, treat this as a
        // stale key-up event and ignore it so we don't accidentally mute a
        // newer note that is currently playing on the same preview channel.
        if (!preview.hasState(keyId)) {
          return;
        }

        // For instruments with sustain, key release acts as a release trigger:
        // keep the timer/envelope running and allow it to progress past sustain.
        // No sustain: perform immediate hard stop.
        if (!preview.release(keyId)) {
          preview.stop(keyId);
        }
        return;
      }

      // Clear all voices (fallback)
      preview.stop();
    },
    [ym2149, previewChannel, onPreviewMidiNoteOff, preview],
  );

  const playNote = useCallback(
    (note: string, octave: number) => {
      if (!ym2149) return;

      const baseFreq = NOTE_FREQUENCIES[note];
      if (!baseFreq) return;
      const keyId = noteKeyId(note, octave);

      // For preview, treat the channel as strictly monophonic: before starting
      // a new note, stop any existing preview envelopes on this channel to
      // avoid overlapping timers fighting over the same SoundEngine registers.
      stopNote();

      preview.start(keyId, {
        channel: previewChannel,
        instrument: currentInstrument,
        noteData: { note, octave },
        tickIntervalMs,
      });

      if (onPreviewMidiNoteOn) {
        onPreviewMidiNoteOn(previewChannel, currentInstrument, note, octave);
      }
    },
    [
      ym2149,
      currentInstrument,
      previewChannel,
      tickIntervalMs,
      stopNote,
      preview,
      onPreviewMidiNoteOn,
    ],
  );

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
    [ensureAudioContextResumed, playNote],
  );

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (!isActive) return;

      if (event.key === 'Enter') {
        event.preventDefault();
        if (event.ctrlKey && event.shiftKey) {
          onToggleSongFromStart(sharedCurrentLine);
        } else if (event.shiftKey) {
          onToggleSongFromCursor(sharedCurrentLine);
        } else if (event.ctrlKey) {
          onToggleLineFromStart(sharedCurrentLine);
        } else {
          onToggleLineFromCursor(sharedCurrentLine);
        }
        return;
      }

      if (event.key === ' ' && !event.ctrlKey && !event.metaKey && !event.shiftKey) {
        if (baseKeyData) {
          event.preventDefault();
          event.stopPropagation();
          const keyId = noteKeyId(baseKeyData.note, baseKeyData.octave);

          if (!pressedKeys.has(keyId)) {
            setPressedKeys((prev) => new Set(prev).add(keyId));
            playNoteWithAudioUnlock(baseKeyData.note, baseKeyData.octave);
          }
        }
        return;
      }

      const key = event.key.toUpperCase();

      const mapped = getKeyboardMappedNote(key, currentOctave, KEYBOARD_TO_NOTE);
      if (mapped) {
        event.preventDefault();
        const { note, octave: finalOctave, keyId } = mapped;

        if (!pressedKeys.has(keyId)) {
          setPressedKeys((prev) => new Set(prev).add(keyId));
          playNoteWithAudioUnlock(note, finalOctave);
        }
      }

      if (key === 'ARROWUP') {
        event.preventDefault();
        onOctaveChange(Math.min(MAX_OCTAVE, currentOctave + 1));
      } else if (key === 'ARROWDOWN') {
        event.preventDefault();
        onOctaveChange(Math.max(MIN_OCTAVE, currentOctave - 1));
      }
    },
    [
      isActive,
      currentOctave,
      onOctaveChange,
      playNoteWithAudioUnlock,
      pressedKeys,
      baseKeyData,
      sharedCurrentLine,
      onToggleLineFromCursor,
      onToggleLineFromStart,
      onToggleSongFromCursor,
      onToggleSongFromStart,
    ],
  );

  const handleKeyUp = useCallback(
    (event: React.KeyboardEvent) => {
      if (!isActive) return;

      if (event.key === ' ') {
        if (baseKeyData) {
          event.preventDefault();
          event.stopPropagation();
          const keyId = noteKeyId(baseKeyData.note, baseKeyData.octave);

          setPressedKeys((prev) => {
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

        setPressedKeys((prev) => {
          const newSet = new Set(prev);
          newSet.delete(keyId);
          return newSet;
        });

        if (pressedKeys.has(keyId)) {
          stopNote(note, finalOctave);
        }
      }
    },
    [isActive, currentOctave, stopNote, pressedKeys, baseKeyData],
  );

  const handlePianoKeyDown = useCallback(
    (note: string, octave: number) => {
      const keyId = noteKeyId(note, octave);

      if (!pressedKeys.has(keyId)) {
        setPressedKeys((prev) => new Set(prev).add(keyId));
        playNoteWithAudioUnlock(note, octave);
      }

      if (!isActive) {
        setActiveSection('piano');
      }
    },
    [isActive, pressedKeys, playNoteWithAudioUnlock, setActiveSection],
  );

  const handlePianoKeyUp = useCallback(
    (note: string, octave: number) => {
      const keyId = noteKeyId(note, octave);

      setPressedKeys((prev) => {
        const newSet = new Set(prev);
        newSet.delete(keyId);
        return newSet;
      });

      if (pressedKeys.has(keyId)) {
        stopNote(note, octave);
      }
    },
    [pressedKeys, stopNote],
  );

  const getKeyClass = useCallback(
    (key: PianoKeyConfig) => {
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
    },
    [pressedKeys],
  );

  return (
    <div className="piano-keyboard-container">
      <div
        ref={pianoRef}
        className={`piano-keyboard ${isActive ? 'active' : ''}`}
        role="group"
        aria-label="Piano keyboard"
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

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import type { NavigationSection } from '../constants/navigation';
import { KEYBOARD_TO_NOTE } from '../constants/music';
import type { Pattern, Note, Instrument } from '../synth/SoundDriver';
import { YM2149 } from '../synth/YM2149';

interface TrackPanelProps {
  trackId: 'A' | 'B' | 'C';
  activeSection: NavigationSection;
  setActiveSection: (section: NavigationSection) => void;
  currentOctave: number;
  currentLine: number;
  patternLength: number;
  onLineChange: (lineIndex: number) => void;
  pattern: Pattern | null;
  onPatternChange: (pattern: Pattern) => void;
  ym2149: YM2149 | null;
  currentInstrumentData: Instrument;
  isTargetTrack: boolean;
  onTogglePatternFromCursor: (lineIndex: number) => void;
  currentColumn: 'note' | 'volume';
  setCurrentColumn: (column: 'note' | 'volume') => void;
  focusRevision: number;
  onPreviewMidiNoteOn?: (ymChannel: number, instrument: Instrument, note: string, octave: number) => void;
  onPreviewMidiNoteOff?: (ymChannel: number) => void;
}

export const TrackPanel: React.FC<TrackPanelProps> = (props) => {
  const {
    trackId,
    activeSection,
    setActiveSection,
    currentOctave,
    currentLine,
    patternLength,
    onLineChange,
    pattern,
    onPatternChange,
    ym2149,
    currentInstrumentData,
    isTargetTrack,
    onTogglePatternFromCursor,
    currentColumn,
    setCurrentColumn,
    focusRevision,
    onPreviewMidiNoteOn,
    onPreviewMidiNoteOff
  } = props;

  const [currentInstrument, setCurrentInstrument] = useState('00');
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (currentInstrumentData?.id) {
      setCurrentInstrument(currentInstrumentData.id);
    }
  }, [currentInstrumentData.id]);

  // Envelope timing state for preview notes (monophonic per track, piano-like)
  const envelopeTimerRef = useRef<number | null>(null);
  const previewSubTickRef = useRef<number>(0);
  const previewEnvelopeStepRef = useRef<number>(0);
  const previewLastTickTimeRef = useRef<number | null>(null);
  const previewNextTickTimeRef = useRef<number | null>(null);
  const previewSustainIndexRef = useRef<number | null>(null);
  const previewReleasedRef = useRef<boolean>(false);
  const activePreviewKeyRef = useRef<string | null>(null);

  const sectionName = `track${trackId}` as NavigationSection;
  const isActive = activeSection === sectionName;

  const effectiveVolume = useMemo(() => {
    if (!pattern) return 0x0f;

    const lines = pattern.lines;
    if (lines.length === 0) return 0x0f;

    const maxIndex = Math.min(currentLine, lines.length - 1);
    let current = 0x0f;

    for (let i = 0; i <= maxIndex; i++) {
      const line = lines[i];
      const vol = line?.volume;
      if (vol !== undefined && vol !== null) {
        const clamped = Math.max(0, Math.min(0x0f, vol | 0));
        current = clamped;
      }
    }

    return current;
  }, [pattern, currentLine]);

  // Hard stop of any current preview on this track/channel
  const stopPreview = useCallback(() => {
    // Map track to channel
    const channel = trackId === 'A' ? 0 : trackId === 'B' ? 1 : 2;

    if (envelopeTimerRef.current !== null) {
      window.clearInterval(envelopeTimerRef.current);
      envelopeTimerRef.current = null;
    }

    previewSubTickRef.current = 0;
    previewEnvelopeStepRef.current = 0;
    previewLastTickTimeRef.current = null;
    previewNextTickTimeRef.current = null;
    previewSustainIndexRef.current = null;
    previewReleasedRef.current = false;
    activePreviewKeyRef.current = null;

    if (onPreviewMidiNoteOff) {
      onPreviewMidiNoteOff(channel);
    }

    if (!ym2149) {
      return;
    }

    const volumeRegister = 0x08 + channel;
    ym2149.writeRegister(volumeRegister, 0x00);
  }, [trackId, ym2149, onPreviewMidiNoteOff]);

  // Play preview note when entering notes (piano-like: hold key to sustain, stop on release)
  const playPreviewNote = useCallback(
    (note: string, octave: number) => {
      if (!ym2149) return;

      // Map track to channel
      const channel = trackId === 'A' ? 0 : trackId === 'B' ? 1 : 2;
      const instrument = currentInstrumentData as any;
      const noteData = { note, octave };

      // Monophonic per track: stop any existing preview first
      stopPreview();

      const keyId = `${note}${octave}`;
      activePreviewKeyRef.current = keyId;

      // Initialize sustain state for this preview note
      const rawSustain =
        instrument && typeof instrument.sustain === 'number'
          ? instrument.sustain
          : null;
      const sustainIndex =
        typeof rawSustain === 'number' && Number.isFinite(rawSustain) && rawSustain >= 0
          ? Math.floor(rawSustain)
          : null;

      previewSustainIndexRef.current = sustainIndex;
      previewReleasedRef.current = false;

      // Initialize envelope timing
      const now = performance.now();
      previewSubTickRef.current = 0;
      previewEnvelopeStepRef.current = 0;
      previewLastTickTimeRef.current = now;
      previewNextTickTimeRef.current = now + 20;

      // Apply initial state (step 0) with default volume modifier (0xF = no attenuation)
      ym2149.updateChannelWithInstrument(channel, instrument, noteData, 0, 0x0f);

      if (onPreviewMidiNoteOn) {
        onPreviewMidiNoteOn(channel, currentInstrumentData, note, octave);
      }

      // Precompute volume envelope tail information so we know when to auto-stop
      const volumeEnv: number[] =
        Array.isArray(instrument.volume) && instrument.volume.length > 0
          ? instrument.volume
          : [0x0f];
      const lastVolumeIndex = volumeEnv.length - 1;
      const lastVolumeValue = volumeEnv[lastVolumeIndex] ?? 0;
      const volumeRegister = 0x08 + channel;

      // Start envelope timer - 20ms base tick, advance envelope step every 40ms
      envelopeTimerRef.current = window.setInterval(() => {
        const sustain = previewSustainIndexRef.current;
        const released = previewReleasedRef.current;

        const TICK_INTERVAL_MS = 20;
        const nowTick = performance.now();

        let nextTickTime = previewNextTickTimeRef.current;
        if (!nextTickTime) {
          nextTickTime = nowTick + TICK_INTERVAL_MS;
        }

        let subTick = previewSubTickRef.current;
        let rawStep = previewEnvelopeStepRef.current;

        // Catch up on any missed 20ms ticks due to timer jitter.
        while (nowTick >= nextTickTime) {
          subTick = (subTick + 1) % 2;

          if (
            subTick === 0 &&
            (
              sustain === null ||
              sustain === undefined ||
              sustain < 0 ||
              released ||
              rawStep < sustain
            )
          ) {
            rawStep = rawStep + 1;
          }

          nextTickTime += TICK_INTERVAL_MS;
        }

        previewSubTickRef.current = subTick;
        previewEnvelopeStepRef.current = rawStep;
        previewLastTickTimeRef.current = nowTick;
        previewNextTickTimeRef.current = nextTickTime;

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
          if (envelopeTimerRef.current !== null) {
            window.clearInterval(envelopeTimerRef.current);
            envelopeTimerRef.current = null;
          }

          previewSubTickRef.current = 0;
          previewEnvelopeStepRef.current = 0;
          previewSustainIndexRef.current = null;
          previewReleasedRef.current = false;
          previewLastTickTimeRef.current = null;
          previewNextTickTimeRef.current = null;
          activePreviewKeyRef.current = null;

          ym2149.writeRegister(volumeRegister, 0x00);
          if (onPreviewMidiNoteOff) {
            onPreviewMidiNoteOff(channel);
          }
        }
      }, 20);
    }, [ym2149, trackId, currentInstrumentData, onPreviewMidiNoteOn, onPreviewMidiNoteOff, stopPreview]);

  // Get notes for this track from the pattern
  const getTrackNotes = useCallback(() => {
    if (!pattern) return Array(Math.max(1, patternLength)).fill(null);

    // For shared patterns, show the same content in all tracks
    // Use trackA data as the shared content for all tracks
    const safeLength = Math.max(1, patternLength);
    const lines = pattern.lines || [];
    const notes = [] as (Note | null)[];

    for (let i = 0; i < safeLength; i++) {
      const line = lines[i] || { trackA: null, trackB: null, trackC: null };
      notes.push(line.trackA);
    }

    return notes;
  }, [pattern, patternLength]);

  const trackNotes = getTrackNotes();

  useEffect(() => {
    if (isActive && trackRef.current) {
      trackRef.current.focus();
    }
  }, [isActive, focusRevision]);

  // Ensure any preview is stopped when this track loses focus or unmounts
  useEffect(() => {
    if (!isActive) {
      stopPreview();
    }

    return () => {
      stopPreview();
    };
  }, [isActive, stopPreview]);

  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (!isActive) return;

    const key = event.key.toUpperCase();

    const isNavigationKey =
      key === 'ARROWUP' ||
      key === 'ARROWDOWN' ||
      key === 'ARROWLEFT' ||
      key === 'ARROWRIGHT' ||
      key === 'PAGEUP' ||
      key === 'PAGEDOWN' ||
      key === 'HOME' ||
      key === 'END';

    if (event.repeat && !isNavigationKey) {
      event.preventDefault();
      return;
    }

    // Navigation
    if (key === 'ARROWUP') {
      event.preventDefault();
      const length = Math.max(1, patternLength || 1);
      const wrappedIndex = ((currentLine - 1) % length + length) % length;
      onLineChange(wrappedIndex);
    } else if (key === 'ARROWDOWN') {
      event.preventDefault();
      const length = Math.max(1, patternLength || 1);
      const wrappedIndex = (currentLine + 1) % length;
      onLineChange(wrappedIndex);
    } else if (key === 'PAGEUP') {
      event.preventDefault();
      const length = Math.max(1, patternLength || 1);
      const step = 16;
      const rawIndex = currentLine - step;
      const wrappedIndex = ((rawIndex % length) + length) % length;
      onLineChange(wrappedIndex);
    } else if (key === 'PAGEDOWN') {
      event.preventDefault();
      const length = Math.max(1, patternLength || 1);
      const step = 16;
      const wrappedIndex = (currentLine + step) % length;
      onLineChange(wrappedIndex);
    } else if (key === 'HOME') {
      event.preventDefault();
      onLineChange(0);
    } else if (key === 'END') {
      event.preventDefault();
      const length = Math.max(1, patternLength || 1);
      onLineChange(length - 1);
    } else if (key === 'ARROWLEFT') {
      event.preventDefault();
      if (currentColumn === 'volume') {
        // Move from volume to note within the same track
        setCurrentColumn('note');
      } else {
        // Move to previous track and select its volume column
        let targetTrack: NavigationSection;
        if (trackId === 'A') {
          targetTrack = 'trackC';
        } else if (trackId === 'B') {
          targetTrack = 'trackA';
        } else {
          targetTrack = 'trackB';
        }
        setActiveSection(targetTrack);
        setCurrentColumn('volume');
      }
    } else if (key === 'ARROWRIGHT') {
      event.preventDefault();
      if (currentColumn === 'note') {
        // Move from note to volume within the same track
        setCurrentColumn('volume');
      } else {
        // Move to next track and select its note column
        let targetTrack: NavigationSection;
        if (trackId === 'A') {
          targetTrack = 'trackB';
        } else if (trackId === 'B') {
          targetTrack = 'trackC';
        } else {
          targetTrack = 'trackA';
        }
        setActiveSection(targetTrack);
        setCurrentColumn('note');
      }
    } else if (key === 'ENTER') {
      event.preventDefault();
      onTogglePatternFromCursor(currentLine);
    } else if (event.key === 'Delete' || event.key === 'Backspace') {
      event.preventDefault();
      if (!pattern) return;
      const newPattern = { ...pattern };
      newPattern.lines = [...newPattern.lines];
      newPattern.lines[currentLine] = { ...newPattern.lines[currentLine] };

      if (currentColumn === 'volume') {
        // Clear only the per-line volume modifier
        newPattern.lines[currentLine].volume = undefined;
      } else {
        // Clear the note (and implicitly any volume) for shared pattern (trackA)
        newPattern.lines[currentLine].trackA = null;
        newPattern.lines[currentLine].volume = undefined;
      }

      onPatternChange(newPattern);
    } else if (event.ctrlKey && key === ' ') {
      event.preventDefault();
      // Note off (set to rest)
      if (pattern) {
        const newPattern = { ...pattern };
        newPattern.lines = [...newPattern.lines];
        newPattern.lines[currentLine] = { ...newPattern.lines[currentLine] };

        // Set note off for shared pattern (always use trackA)
        const noteOff: Note = { note: '===', octave: 0, instrument: '00' };
        newPattern.lines[currentLine].trackA = noteOff;

        onPatternChange(newPattern);
      }
    } else if (key === ' ') {
      event.preventDefault();
      // Clear current position in the active column and move to next line
      if (pattern) {
        const newPattern = { ...pattern };
        newPattern.lines = [...newPattern.lines];
        newPattern.lines[currentLine] = { ...newPattern.lines[currentLine] };

        if (currentColumn === 'volume') {
          newPattern.lines[currentLine].volume = undefined;
        } else {
          newPattern.lines[currentLine].trackA = null;
          newPattern.lines[currentLine].volume = undefined;
        }

        onPatternChange(newPattern);
        // Move to next line (wrap around pattern length)
        const length = Math.max(1, patternLength || 1);
        const wrappedIndex = (currentLine + 1) % length;
        onLineChange(wrappedIndex);
      }
    } else if (!event.ctrlKey && key === '-') {
      event.preventDefault();
      // Insert explicit key-release step (note-off) and move to next line
      if (pattern) {
        const newPattern = { ...pattern };
        newPattern.lines = [...newPattern.lines];
        newPattern.lines[currentLine] = { ...newPattern.lines[currentLine] };

        const noteOff: Note = { note: '===', octave: 0, instrument: '00' };
        newPattern.lines[currentLine].trackA = noteOff;

        onPatternChange(newPattern);
        const length = Math.max(1, patternLength || 1);
        const wrappedIndex = (currentLine + 1) % length;
        onLineChange(wrappedIndex);
      }
    } else if (event.ctrlKey && key === '-') {
      event.preventDefault();
      // Previous instrument
      setCurrentInstrument(prev => {
        const instNum = parseInt(prev, 16);
        const newInst = Math.max(0, instNum - 1);
        return newInst.toString(16).padStart(2, '0').toUpperCase();
      });
    } else if (event.ctrlKey && (key === '+' || key === '=')) {
      event.preventDefault();
      // Next instrument
      setCurrentInstrument(prev => {
        const instNum = parseInt(prev, 16);
        const newInst = Math.min(255, instNum + 1);
        return newInst.toString(16).padStart(2, '0').toUpperCase();
      });
    } else if (!event.ctrlKey && currentColumn === 'volume' && /^[0-9A-F]$/.test(key)) {
      event.preventDefault();
      // Hex input for per-line volume modifier
      if (pattern) {
        const newPattern = { ...pattern };
        newPattern.lines = [...newPattern.lines];
        newPattern.lines[currentLine] = { ...newPattern.lines[currentLine] };

        const value = parseInt(key, 16);
        const clamped = Math.max(0, Math.min(0x0f, value));
        newPattern.lines[currentLine].volume = clamped;

        onPatternChange(newPattern);
        // Move to next line after entering a volume nibble (wrap around pattern length)
        const length = Math.max(1, patternLength || 1);
        const wrappedIndex = (currentLine + 1) % length;
        onLineChange(wrappedIndex);
      }
    } else if (KEYBOARD_TO_NOTE[key]) {
      event.preventDefault();
      // Insert note
      const { note, octaveOffset } = KEYBOARD_TO_NOTE[key];
      const finalOctave = Math.max(0, Math.min(7, currentOctave + octaveOffset));

      // Play preview note immediately and keep it playing while the key is held
      playPreviewNote(note, finalOctave);

      if (pattern) {
        const newPattern = { ...pattern };
        newPattern.lines = [...newPattern.lines];
        newPattern.lines[currentLine] = { ...newPattern.lines[currentLine] };

        const newNote: Note = { note, octave: finalOctave, instrument: currentInstrumentData.id };

        // Set the note for shared pattern (always use trackA)
        newPattern.lines[currentLine].trackA = newNote;

        onPatternChange(newPattern);
        // Move to next line (wrap around pattern length)
        const length = Math.max(1, patternLength || 1);
        const wrappedIndex = (currentLine + 1) % length;
        onLineChange(wrappedIndex);
      }
    }
  }, [
    isActive,
    currentLine,
    currentOctave,
    currentInstrument,
    onLineChange,
    patternLength,
    playPreviewNote,
    pattern,
    trackId,
    onPatternChange,
    onTogglePatternFromCursor,
    currentColumn,
    setCurrentColumn,
    setActiveSection
  ]);

  const handleKeyUp = useCallback(
    (event: React.KeyboardEvent) => {
      if (!isActive) return;

      const key = event.key.toUpperCase();

      if (!KEYBOARD_TO_NOTE[key]) {
        return;
      }

      event.preventDefault();

      const { note, octaveOffset } = KEYBOARD_TO_NOTE[key];
      const finalOctave = Math.max(0, Math.min(7, currentOctave + octaveOffset));
      const keyId = `${note}${finalOctave}`;

      // Only act if this key currently owns the active preview
      if (activePreviewKeyRef.current !== keyId) {
        return;
      }

      const sustain = previewSustainIndexRef.current;
      const hasSustain = typeof sustain === 'number' && sustain >= 0;

      if (hasSustain) {
        // For instruments with sustain, key release acts as a release trigger:
        // keep the timer/envelope running and allow it to progress past sustain.
        previewReleasedRef.current = true;
      } else {
        // No sustain: perform immediate hard stop.
        stopPreview();
      }
    },
    [isActive, currentOctave, stopPreview]
  );

  const handleLineClick = useCallback(
    (lineIndex: number, column: 'note' | 'volume' = 'note') => {
      onLineChange(lineIndex);
      setActiveSection(sectionName);
      setCurrentColumn(column);
    },
    [setActiveSection, sectionName, onLineChange, setCurrentColumn]
  );

  const formatNoteDisplay = useCallback((noteData: Note | null) => {
    if (!noteData) return '---';
    if (noteData.note === '===') return '===';

    // Format note: natural notes get "-", sharps keep "#"
    const formattedNote = noteData.note.includes('#')
      ? noteData.note
      : noteData.note + '-';

    return `${formattedNote}${noteData.octave} ${noteData.instrument}`;
  }, []);

  const getLineClass = useCallback((lineIndex: number) => {
    const classes = ['track-line'];
    if (lineIndex === currentLine) {
      classes.push('current');
    }
    if (lineIndex % 4 === 0) {
      classes.push('beat-line');
    }
    return classes.join(' ');
  }, [currentLine]);

  return (
    <div
      ref={trackRef}
      className={`track-panel track-${trackId.toLowerCase()} ${isActive ? 'active' : ''} ${!pattern ? 'disabled' : ''}`}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onKeyUp={handleKeyUp}
      onClick={() => setActiveSection(sectionName)}
    >
      <div className={`track-header ${isTargetTrack ? 'target-track' : ''}`}>
        <span className="track-header-title">{trackId}</span>
        <span className="track-header-volume">
          VOL {effectiveVolume.toString(16).toUpperCase()}
        </span>
      </div>

      <div className="track-content" style={{ userSelect: 'none' }}>
        {trackNotes.map((noteData, lineIndex) => {
          const volume = pattern?.lines[lineIndex]?.volume;
          const isCurrentLine = lineIndex === currentLine && isActive;
          const volumeIsActive = isCurrentLine && currentColumn === 'volume';
          const noteIsActive = isCurrentLine && currentColumn === 'note';

          return (
            <div
              key={lineIndex}
              className={getLineClass(lineIndex)}
              onClick={() => handleLineClick(lineIndex, 'note')}
            >
              <span className="note-data">
                <span
                  className={`note-text ${noteIsActive ? 'active' : ''}`}
                  onClick={() => handleLineClick(lineIndex, 'note')}
                >
                  {formatNoteDisplay(noteData)}
                </span>
                <span
                  className={`volume-data ${volumeIsActive ? 'active' : ''}`}
                  onClick={(event: React.MouseEvent<HTMLSpanElement>) => {
                    event.stopPropagation();
                    handleLineClick(lineIndex, 'volume');
                  }}
                >
                  {volume === undefined || volume === null
                    ? '.'
                    : (Math.max(0, Math.min(0x0f, volume | 0))).toString(16).toUpperCase()}
                </span>
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

import { useCallback, useState } from 'react';
import yaml from 'js-yaml';
import type { Song, Pattern, PatternLine } from '../synth/SoundDriver';
import { PATTERN_LENGTH, NOTES, MIN_OCTAVE, MAX_OCTAVE } from '../constants/music';
import type { NavigationSection } from '../constants/navigation';

export type TrackClipboardStep = {
  space?: boolean | number;
  off?: boolean | number;
  note?: string;
  instrument?: string;
  volume?: number;
  [key: string]: unknown;
};

interface TransposeOptions {
  semitones: number;
  scope: 'line' | 'song';
  trackScope: 'current' | 'all';
  instrumentScope: 'all' | 'selected';
  currentPatternIndex: number;
  targetTrackId: 'A' | 'B' | 'C';
  selectedInstrumentId: string;
  normalizeInstrumentId: (value?: string | number | null) => string;
}

interface TransposeResult {
  patternCount: number;
  notesChanged: number;
  clippedLow: number;
  clippedHigh: number;
}

interface UseTrackOperationsArgs {
  song: Song;
  activeSection: NavigationSection;
  lastTrackId: 'A' | 'B' | 'C';
  getCurrentPatternForTrack: (trackId: 'A' | 'B' | 'C') => Pattern | null;
  formatNoteKey: (note: string, octave: number) => string;
  parseBaseKeyString: (value?: string) => { note: string; octave: number } | null;
  updateSong: (patch: Partial<Song>) => void;
  sharedCurrentLine: number;
  sequencerPatternIndex: number;
  setActiveSection: (section: NavigationSection) => void;
  setTrackFocusRevision: (updater: (prev: number) => number) => void;
}

interface UseTrackOperationsResult {
  trackClipboardError: string;
  setTrackClipboardError: (value: string) => void;
  handleCopyTrack: () => Promise<void>;
  handlePasteTrack: () => Promise<void>;
  handleInsertStep: () => void;
  handleDeleteStep: () => void;
  applyTranspose: (options: TransposeOptions) => TransposeResult | null;
}

export function useTrackOperations({
  song,
  activeSection,
  lastTrackId,
  getCurrentPatternForTrack,
  formatNoteKey,
  parseBaseKeyString,
  updateSong,
  sharedCurrentLine,
  sequencerPatternIndex,
  setActiveSection,
  setTrackFocusRevision,
}: UseTrackOperationsArgs): UseTrackOperationsResult {
  const [trackClipboardError, setTrackClipboardError] = useState('');

  const handleCopyTrack = useCallback(async () => {
    try {
      if (typeof navigator === 'undefined' || !navigator.clipboard || !navigator.clipboard.writeText) {
        setTrackClipboardError('Clipboard API is not available in this browser.');
        return;
      }

      let trackId: 'A' | 'B' | 'C' = lastTrackId;
      if (activeSection === 'trackA') {
        trackId = 'A';
      } else if (activeSection === 'trackB') {
        trackId = 'B';
      } else if (activeSection === 'trackC') {
        trackId = 'C';
      }

      const pattern = getCurrentPatternForTrack(trackId);
      if (!pattern) {
        setTrackClipboardError('No pattern is assigned for the current track at this position.');
        return;
      }

      const targetLength = song.patternLength || PATTERN_LENGTH;
      const rawLines = pattern.lines || [];
      const steps: TrackClipboardStep[] = [];

      for (let i = 0; i < targetLength; i++) {
        const line: PatternLine = rawLines[i] || { trackA: null, trackB: null, trackC: null };
        const cell = line.trackA;

        const volRaw = line.volume;
        const hasVolume = volRaw !== undefined && volRaw !== null;

        let step: TrackClipboardStep;

        if (!cell) {
          step = { space: hasVolume ? 1 : true };
        } else if (cell.note === '===') {
          step = { note: 'OFF' };
        } else {
          const noteText = formatNoteKey(cell.note, cell.octave);
          step = {
            note: noteText,
            instrument: cell.instrument,
          };
        }

        if (hasVolume) {
          const volNum = Number(volRaw);
          if (Number.isFinite(volNum)) {
            const clamped = Math.max(0, Math.min(0x0f, Math.floor(volNum)));
            step.volume = clamped;
          }
        }

        steps.push(step);
      }

      let lastNonSpace = steps.length - 1;
      while (lastNonSpace >= 0) {
        const ln = steps[lastNonSpace];
        if (ln && ln.space === true && Object.keys(ln).length === 1) {
          lastNonSpace--;
        } else {
          break;
        }
      }

      const trimmedSteps = steps.slice(0, lastNonSpace + 1);

      const compressedSteps: TrackClipboardStep[] = [];

      type RunType = 'none' | 'space' | 'volume-space';
      let runType: RunType = 'none';
      let runCount = 0;
      let runVolume = 0;

      const flushRun = () => {
        if (runCount <= 0) return;
        if (runType === 'space') {
          compressedSteps.push({ space: runCount });
        } else if (runType === 'volume-space') {
          if (runCount === 1) {
            compressedSteps.push({ volume: runVolume });
          } else {
            compressedSteps.push({ space: runCount, volume: runVolume });
          }
        }
        runType = 'none';
        runCount = 0;
      };

      const isPureSpace = (ln: TrackClipboardStep) =>
        ln && ln.space === true && Object.keys(ln).length === 1;

      const isVolumeSpace = (ln: TrackClipboardStep) =>
        ln &&
        ln.space === 1 &&
        typeof ln.volume === 'number' &&
        Object.keys(ln).length === 2;

      for (const ln of trimmedSteps) {
        if (isPureSpace(ln)) {
          if (runType === 'space') {
            runCount++;
          } else {
            flushRun();
            runType = 'space';
            runCount = 1;
          }
        } else if (isVolumeSpace(ln)) {
          const vol = ln.volume ?? 0;
          if (runType === 'volume-space' && vol === runVolume) {
            runCount++;
          } else {
            flushRun();
            runType = 'volume-space';
            runVolume = vol;
            runCount = 1;
          }
        } else {
          flushRun();
          compressedSteps.push(ln);
        }
      }
      flushRun();

      const exportData = { step: compressedSteps };
      let yamlContent = yaml.dump(exportData, {
        indent: 2,
        lineWidth: -1,
        quotingType: '"',
      });

      const quoteNoteValues = (text: string): string => {
        const noteLineRegex = /^(\s*-\s+|\s+)(note):\s*(.+)$/gm;
        return text.replace(noteLineRegex, (_match, indent, key, value) => {
          let inner = String(value).trim();
          if (
            (inner.startsWith('"') && inner.endsWith('"')) ||
            (inner.startsWith("'") && inner.endsWith("'"))
          ) {
            inner = inner.slice(1, -1);
          }
          return `${indent}${key}: "${inner}"`;
        });
      };

      yamlContent = quoteNoteValues(yamlContent);

      await navigator.clipboard.writeText(yamlContent);
    } catch (error) {
      console.error('Failed to copy track:', error);
      const message = error instanceof Error ? error.message : String(error);
      setTrackClipboardError('Failed to copy track to clipboard.\n\n' + message);
    }
  }, [activeSection, lastTrackId, getCurrentPatternForTrack, song.patternLength, formatNoteKey]);

  const handlePasteTrack = useCallback(async () => {
    try {
      if (typeof navigator === 'undefined' || !navigator.clipboard || !navigator.clipboard.readText) {
        setTrackClipboardError('Clipboard API is not available in this browser.');
        return;
      }

      const text = await navigator.clipboard.readText();
      if (!text || !text.trim()) {
        setTrackClipboardError('Clipboard is empty or does not contain track data.');
        return;
      }

      let parsed: unknown;
      try {
        parsed = yaml.load(text);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        setTrackClipboardError('Failed to parse track data from clipboard.\n\n' + message);
        return;
      }

      const stepNode =
        parsed && typeof parsed === 'object' ? (parsed as { step?: unknown }).step ?? null : null;
      if (!Array.isArray(stepNode)) {
        setTrackClipboardError('Track clipboard data is invalid.\n\nExpected YAML with root "step" list.');
        return;
      }

      const rawSteps = stepNode as unknown[];
      const expandedSteps: TrackClipboardStep[] = [];

      for (const node of rawSteps) {
        if (node && typeof node === 'object') {
          const ln = node as TrackClipboardStep;
          const keys = Object.keys(ln);
          const hasVolume = Object.prototype.hasOwnProperty.call(ln, 'volume');
          const onlySpaceOrOff = keys.every(k => k === 'space' || k === 'off');
          const onlySpaceOffVolume = keys.every(
            k => k === 'space' || k === 'off' || k === 'volume'
          );

          const spaceVal = ln.space;
          const offVal = ln.off;
          const isNumericSpace =
            typeof spaceVal === 'number' && Number.isFinite(spaceVal) && spaceVal > 0;
          const isNumericOff =
            typeof offVal === 'number' && Number.isFinite(offVal) && offVal > 0;

          if (!hasVolume && onlySpaceOrOff && (isNumericSpace || isNumericOff)) {
            const count = (isNumericSpace ? spaceVal : offVal) as number;
            const isOff = isNumericOff && !isNumericSpace;
            for (let i = 0; i < count; i++) {
              expandedSteps.push(isOff ? { note: 'OFF' } : { space: true });
            }
            continue;
          }

          if (hasVolume && onlySpaceOffVolume && (isNumericSpace || isNumericOff)) {
            const count = (isNumericSpace ? spaceVal : offVal) as number;
            const isOff = isNumericOff && !isNumericSpace;
            const vol = ln.volume;
            for (let i = 0; i < count; i++) {
              expandedSteps.push(
                isOff ? { note: 'OFF', volume: vol } : { space: true, volume: vol }
              );
            }
            continue;
          }
        }

        expandedSteps.push(node as TrackClipboardStep);
      }

      let trackId: 'A' | 'B' | 'C' = lastTrackId;
      if (activeSection === 'trackA') {
        trackId = 'A';
      } else if (activeSection === 'trackB') {
        trackId = 'B';
      } else if (activeSection === 'trackC') {
        trackId = 'C';
      }

      const pattern = getCurrentPatternForTrack(trackId);
      if (!pattern) {
        setTrackClipboardError('No pattern is assigned for the current track at this position.');
        return;
      }

      const targetLength = song.patternLength || PATTERN_LENGTH;
      const existingLines = pattern.lines || [];
      const newLines: PatternLine[] = [];

      for (let i = 0; i < targetLength; i++) {
        const baseLine = existingLines[i] || { trackA: null, trackB: null, trackC: null };
        const line: PatternLine = {
          trackA: baseLine.trackA,
          trackB: baseLine.trackB,
          trackC: baseLine.trackC,
        };
        const rawStep = expandedSteps[i];

        if (rawStep && typeof rawStep === 'object') {
          const ln = rawStep as TrackClipboardStep;

          const rawNote = ln.note;
          const isOffNote =
            typeof rawNote === 'string' && rawNote.trim().toUpperCase() === 'OFF';

          if (isOffNote) {
            line.trackA = { note: '===', octave: 0, instrument: '00' };
          } else if (ln.space === true) {
            line.trackA = null;
          } else if (typeof rawNote === 'string') {
            const parsedKey = parseBaseKeyString(rawNote);
            if (!parsedKey) {
              setTrackClipboardError(
                `Invalid note value "${rawNote}" in track clipboard data at line ${i}.`
              );
              return;
            }

            const instId =
              typeof ln.instrument === 'string' && ln.instrument.trim()
                ? ln.instrument.trim().toUpperCase()
                : '00';

            const noteObj = {
              note: parsedKey.note,
              octave: parsedKey.octave,
              instrument: instId,
            };

            line.trackA = noteObj;
          } else {
            line.trackA = null;
          }

          const volRaw = ln.volume;
          if (volRaw !== undefined && volRaw !== null) {
            const volNum = Number(volRaw);
            if (Number.isFinite(volNum)) {
              const clamped = Math.max(0, Math.min(0x0f, Math.floor(volNum)));
              line.volume = clamped;
            }
          }
        } else {
          line.trackA = null;
        }

        newLines.push(line);
      }

      const updatedPattern = { ...pattern, lines: newLines };
      const updatedPatterns = song.patterns.map(p =>
        p.id === pattern.id ? updatedPattern : p
      );
      updateSong({ patterns: updatedPatterns });
    } catch (error) {
      console.error('Failed to paste track:', error);
      const message = error instanceof Error ? error.message : String(error);
      setTrackClipboardError('Failed to paste track from clipboard.\n\n' + message);
    }
  }, [
    activeSection,
    lastTrackId,
    getCurrentPatternForTrack,
    song.patternLength,
    song.patterns,
    parseBaseKeyString,
    updateSong,
  ]);

  const handleInsertStep = useCallback(() => {
    const playlistLength = song.playlist.length;
    if (playlistLength === 0) {
      return;
    }

    const currentIndex = Math.max(0, Math.min(sequencerPatternIndex, playlistLength - 1));
    const entry = song.playlist[currentIndex];

    let trackId: 'A' | 'B' | 'C' = lastTrackId;
    if (activeSection === 'trackA') {
      trackId = 'A';
    } else if (activeSection === 'trackB') {
      trackId = 'B';
    } else if (activeSection === 'trackC') {
      trackId = 'C';
    }

    let patternId = '--';
    switch (trackId) {
      case 'A':
        patternId = entry.trackA;
        break;
      case 'B':
        patternId = entry.trackB;
        break;
      case 'C':
        patternId = entry.trackC;
        break;
    }

    if (!patternId || patternId === '--' || patternId.startsWith('^^')) {
      return;
    }

    const patterns = [...song.patterns];
    const patternIndex = patterns.findIndex(p => p.id === patternId);
    if (patternIndex === -1) {
      return;
    }

    const pattern = { ...patterns[patternIndex] };
    const totalLines = song.patternLength || PATTERN_LENGTH;
    const safeIndex = Math.max(0, Math.min(sharedCurrentLine, totalLines - 1));
    const lines = [...(pattern.lines || [])];

    while (lines.length < totalLines) {
      lines.push({
        trackA: null,
        trackB: null,
        trackC: null,
      });
    }

    for (let i = totalLines - 1; i > safeIndex; i--) {
      const from = lines[i - 1] || { trackA: null, trackB: null, trackC: null };
      const base = lines[i] || { trackA: null, trackB: null, trackC: null };
      lines[i] = {
        ...base,
        trackA: from.trackA,
      };
    }

    const base = lines[safeIndex] || { trackA: null, trackB: null, trackC: null };
    lines[safeIndex] = {
      ...base,
      trackA: null,
    };

    pattern.lines = lines;
    patterns[patternIndex] = pattern;

    updateSong({ patterns });

    const section = trackId === 'A' ? 'trackA' : trackId === 'B' ? 'trackB' : 'trackC';
    setActiveSection(section);
    setTrackFocusRevision(prev => prev + 1);
  }, [
    song.playlist,
    song.patterns,
    song.patternLength,
    activeSection,
    lastTrackId,
    sequencerPatternIndex,
    sharedCurrentLine,
    updateSong,
    setActiveSection,
    setTrackFocusRevision,
  ]);

  const handleDeleteStep = useCallback(() => {
    const playlistLength = song.playlist.length;
    if (playlistLength === 0) {
      return;
    }

    const currentIndex = Math.max(0, Math.min(sequencerPatternIndex, playlistLength - 1));
    const entry = song.playlist[currentIndex];

    let trackId: 'A' | 'B' | 'C' = lastTrackId;
    if (activeSection === 'trackA') {
      trackId = 'A';
    } else if (activeSection === 'trackB') {
      trackId = 'B';
    } else if (activeSection === 'trackC') {
      trackId = 'C';
    }

    let patternId = '--';
    switch (trackId) {
      case 'A':
        patternId = entry.trackA;
        break;
      case 'B':
        patternId = entry.trackB;
        break;
      case 'C':
        patternId = entry.trackC;
        break;
    }

    if (!patternId || patternId === '--' || patternId.startsWith('^^')) {
      return;
    }

    const patterns = [...song.patterns];
    const patternIndex = patterns.findIndex(p => p.id === patternId);
    if (patternIndex === -1) {
      return;
    }

    const pattern = { ...patterns[patternIndex] };
    const totalLines = song.patternLength || PATTERN_LENGTH;
    const safeIndex = Math.max(0, Math.min(sharedCurrentLine, totalLines - 1));
    const lines = [...(pattern.lines || [])];

    while (lines.length < totalLines) {
      lines.push({
        trackA: null,
        trackB: null,
        trackC: null,
      });
    }

    for (let i = safeIndex; i < totalLines - 1; i++) {
      const from = lines[i + 1] || { trackA: null, trackB: null, trackC: null };
      const base = lines[i] || { trackA: null, trackB: null, trackC: null };
      lines[i] = {
        ...base,
        trackA: from.trackA,
      };
    }

    const lastIndex = totalLines - 1;
    const lastBase = lines[lastIndex] || { trackA: null, trackB: null, trackC: null };
    lines[lastIndex] = {
      ...lastBase,
      trackA: null,
    };

    pattern.lines = lines;
    patterns[patternIndex] = pattern;

    updateSong({ patterns });

    const section = trackId === 'A' ? 'trackA' : trackId === 'B' ? 'trackB' : 'trackC';
    setActiveSection(section);
  }, [
    song.playlist,
    song.patterns,
    song.patternLength,
    activeSection,
    lastTrackId,
    sequencerPatternIndex,
    sharedCurrentLine,
    updateSong,
    setActiveSection,
  ]);

  const applyTranspose = useCallback(
    ({
      semitones,
      scope,
      trackScope,
      instrumentScope,
      currentPatternIndex,
      targetTrackId,
      selectedInstrumentId,
      normalizeInstrumentId,
    }: TransposeOptions): TransposeResult | null => {
      const playlistLength = song.playlist.length;
      if (playlistLength === 0) {
        return null;
      }

      const indices: number[] = [];
      if (scope === 'line') {
        const idx = Math.max(0, Math.min(currentPatternIndex, playlistLength - 1));
        indices.push(idx);
      } else {
        for (let i = 0; i < playlistLength; i += 1) {
          indices.push(i);
        }
      }

      const tracksToProcess: Array<'A' | 'B' | 'C'> =
        trackScope === 'current' ? [targetTrackId] : ['A', 'B', 'C'];

      const patternIds = new Set<string>();

      for (const idx of indices) {
        const entry = song.playlist[idx];
        if (!entry) continue;

        for (const track of tracksToProcess) {
          let patternId = '--';
          switch (track) {
            case 'A':
              patternId = entry.trackA;
              break;
            case 'B':
              patternId = entry.trackB;
              break;
            case 'C':
              patternId = entry.trackC;
              break;
          }

          if (!patternId || patternId === '--' || patternId.startsWith('^^')) {
            continue;
          }

          patternIds.add(patternId);
        }
      }

      if (patternIds.size === 0) {
        return {
          patternCount: 0,
          notesChanged: 0,
          clippedLow: 0,
          clippedHigh: 0,
        };
      }

      const selectedInstrumentIdNorm = normalizeInstrumentId(selectedInstrumentId);
      const minSemitone = MIN_OCTAVE * 12;
      const maxSemitone = MAX_OCTAVE * 12 + 11;

      let notesChanged = 0;
      let clippedLow = 0;
      let clippedHigh = 0;

      const updatedPatterns = song.patterns.map(pattern => {
        if (!patternIds.has(pattern.id)) {
          return pattern;
        }

        const newLines = (pattern.lines || []).map(line => {
          const newLine = { ...line } as PatternLine;
          const cell = newLine.trackA;

          if (!cell || cell.note === '===') {
            return newLine;
          }

          if (
            instrumentScope === 'selected' &&
            normalizeInstrumentId(cell.instrument) !== selectedInstrumentIdNorm
          ) {
            return newLine;
          }

          const noteIndex = NOTES.indexOf(String(cell.note).toUpperCase());
          if (noteIndex < 0) {
            return newLine;
          }

          const originalSemitone = cell.octave * 12 + noteIndex;
          let newSemitone = originalSemitone + semitones;

          if (newSemitone < minSemitone) {
            newSemitone = minSemitone;
            clippedLow += 1;
          } else if (newSemitone > maxSemitone) {
            newSemitone = maxSemitone;
            clippedHigh += 1;
          }

          if (newSemitone === originalSemitone) {
            return newLine;
          }

          const newOctave = Math.floor(newSemitone / 12);
          const newNoteIndex = newSemitone % 12;

          newLine.trackA = {
            ...cell,
            note: NOTES[newNoteIndex],
            octave: newOctave,
          };

          notesChanged += 1;
          return newLine;
        });

        return { ...pattern, lines: newLines };
      });

      updateSong({ patterns: updatedPatterns });

      return {
        patternCount: patternIds.size,
        notesChanged,
        clippedLow,
        clippedHigh,
      };
    }, [song.playlist, song.patterns, updateSong]);

  return {
    trackClipboardError,
    setTrackClipboardError,
    handleCopyTrack,
    handlePasteTrack,
    handleInsertStep,
    handleDeleteStep,
    applyTranspose,
  };
}

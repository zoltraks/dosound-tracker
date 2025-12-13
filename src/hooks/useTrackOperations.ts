import { useCallback, useState } from 'react';
import type { Song, Pattern, PatternLine } from '../synth/SoundDriver';
import { PATTERN_LENGTH } from '../constants/music';
import type { NavigationSection } from '../constants/navigation';
import {
  applyClipboardStepToTrackLine,
  buildTrackClipboardSteps,
  compressTrackClipboardSteps,
  isClipboardStepEmpty,
  isTrackLineEmptyForClipboard,
  parseTrackClipboardYaml,
  serializeTrackClipboardYaml,
  type TrackClipboardStep,
} from '../utils/trackClipboard';
import { transposePatterns } from '../utils/transposeUtils';

export type TrackPasteMode = 'replace' | 'overwriteAll' | 'overwriteEmpty';

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
  getPasteTrackMode: (options: { hasExistingData: boolean }) => Promise<TrackPasteMode | null>;
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
  getPasteTrackMode,
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

      const steps = buildTrackClipboardSteps({
        lines: pattern.lines || [],
        patternLength: song.patternLength || PATTERN_LENGTH,
        formatNoteKey,
      });

      const compressedSteps = compressTrackClipboardSteps(steps);
      const yamlContent = serializeTrackClipboardYaml(compressedSteps);
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

      const parsed = parseTrackClipboardYaml(text);
      if ('error' in parsed) {
        setTrackClipboardError(parsed.error);
        return;
      }
      const expandedSteps = parsed.steps;

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

      let hasExistingData = false;
      for (let i = 0; i < targetLength; i++) {
        if (!isTrackLineEmptyForClipboard(existingLines[i])) {
          hasExistingData = true;
          break;
        }
      }

      let mode: TrackPasteMode = 'replace';

      if (hasExistingData) {
        const selectedMode = await getPasteTrackMode({ hasExistingData: true });
        if (!selectedMode) {
          return;
        }
        mode = selectedMode;
      }


      const newLines: PatternLine[] = [];

      if (mode === 'replace') {
        for (let i = 0; i < targetLength; i++) {
          const baseLine = existingLines[i] || { trackA: null, trackB: null, trackC: null };
          const rawStep = expandedSteps[i];
          const ln = rawStep && typeof rawStep === 'object' ? (rawStep as TrackClipboardStep) : undefined;

          if (!ln) {
            newLines.push({ ...baseLine, trackA: null });
            continue;
          }

          const applied = applyClipboardStepToTrackLine({
            baseLine,
            step: ln,
            lineIndex: i,
            parseBaseKeyString,
          });

          if ('error' in applied) {
            setTrackClipboardError(applied.error);
            return;
          }

          newLines.push(applied.line);
        }
      } else if (mode === 'overwriteAll') {
        for (let i = 0; i < targetLength; i++) {
          const baseLine = existingLines[i] || { trackA: null, trackB: null, trackC: null };
          const rawStep = i < expandedSteps.length ? expandedSteps[i] : undefined;
          const ln =
            rawStep && typeof rawStep === 'object'
              ? (rawStep as TrackClipboardStep)
              : undefined;

          if (!ln || isClipboardStepEmpty(ln)) {
            newLines.push({ ...baseLine });
            continue;
          }

          const applied = applyClipboardStepToTrackLine({
            baseLine,
            step: ln,
            lineIndex: i,
            parseBaseKeyString,
          });
          if ('error' in applied) {
            setTrackClipboardError(applied.error);
            return;
          }
          newLines.push(applied.line);
        }
      } else {
        for (let i = 0; i < targetLength; i++) {
          const baseLine = existingLines[i] || { trackA: null, trackB: null, trackC: null };

          if (!isTrackLineEmptyForClipboard(baseLine)) {
            newLines.push({ ...baseLine });
            continue;
          }

          const rawStep = i < expandedSteps.length ? expandedSteps[i] : undefined;
          const ln =
            rawStep && typeof rawStep === 'object'
              ? (rawStep as TrackClipboardStep)
              : undefined;

          if (!ln || isClipboardStepEmpty(ln)) {
            newLines.push({ ...baseLine });
            continue;
          }

          const applied = applyClipboardStepToTrackLine({
            baseLine,
            step: ln,
            lineIndex: i,
            parseBaseKeyString,
          });
          if ('error' in applied) {
            setTrackClipboardError(applied.error);
            return;
          }
          newLines.push(applied.line);
        }
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
    getPasteTrackMode,
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

      const { patterns: updatedPatterns, result } = transposePatterns({
        patterns: song.patterns,
        patternIds,
        options: {
          semitones,
          instrumentScope,
          selectedInstrumentId,
          normalizeInstrumentId,
        },
      });

      updateSong({ patterns: updatedPatterns });

      return {
        patternCount: result.patternCount,
        notesChanged: result.notesChanged,
        clippedLow: result.clippedLow,
        clippedHigh: result.clippedHigh,
      };
    },
    [song.playlist, song.patterns, updateSong]
  );

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

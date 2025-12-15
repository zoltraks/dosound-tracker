import { useCallback, useState } from 'react';
import type { Song, Pattern } from '../synth/SoundDriver';
import type { NavigationSection } from '../constants/navigation';
import { PATTERN_LENGTH } from '../constants/music';
import { 
  generateClipboardData, 
  parseClipboardData, 
  applyClipboardToLines, 
  type TrackPasteMode 
} from '../utils/trackClipboard';
import { 
  performTranspose, 
  type TransposeOptions, 
  type TransposeResult 
} from '../utils/transposeUtils';
import { insertPatternStep, deletePatternStep } from '../utils/patternUtils';

export type { TrackPasteMode, TransposeOptions, TransposeResult };

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

  const getActiveTrackId = useCallback((): 'A' | 'B' | 'C' => {
    if (activeSection === 'trackA') return 'A';
    if (activeSection === 'trackB') return 'B';
    if (activeSection === 'trackC') return 'C';
    return lastTrackId;
  }, [activeSection, lastTrackId]);

  const handleCopyTrack = useCallback(async () => {
    try {
      if (typeof navigator === 'undefined' || !navigator.clipboard || !navigator.clipboard.writeText) {
        setTrackClipboardError('Clipboard API is not available in this browser.');
        return;
      }

      const trackId = getActiveTrackId();
      const pattern = getCurrentPatternForTrack(trackId);
      if (!pattern) {
        setTrackClipboardError('No pattern is assigned for the current track at this position.');
        return;
      }

      const yamlContent = generateClipboardData(
        pattern,
        song.patternLength || PATTERN_LENGTH,
        formatNoteKey
      );

      await navigator.clipboard.writeText(yamlContent);
    } catch (error) {
      console.error('Failed to copy track:', error);
      const message = error instanceof Error ? error.message : String(error);
      setTrackClipboardError('Failed to copy track to clipboard.\n\n' + message);
    }
  }, [getActiveTrackId, getCurrentPatternForTrack, song.patternLength, formatNoteKey]);

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

      let expandedSteps;
      try {
        expandedSteps = parseClipboardData(text);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        setTrackClipboardError('Failed to parse track data from clipboard.\n\n' + message);
        return;
      }

      const trackId = getActiveTrackId();
      const pattern = getCurrentPatternForTrack(trackId);
      if (!pattern) {
        setTrackClipboardError('No pattern is assigned for the current track at this position.');
        return;
      }

      const targetLength = song.patternLength || PATTERN_LENGTH;
      const existingLines = pattern.lines || [];

      // Check for existing data to determine if we need to ask for paste mode
      let hasExistingData = false;
      for (let i = 0; i < targetLength; i++) {
        const line = existingLines[i];
        if (line) {
          const hasNote = !!line.trackA;
          const hasVol = line.volume !== undefined && line.volume !== null;
          if (hasNote || hasVol) {
            hasExistingData = true;
            break;
          }
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

      const newLines = applyClipboardToLines(
        existingLines,
        expandedSteps,
        mode,
        targetLength,
        parseBaseKeyString
      );

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
    getActiveTrackId,
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
    const trackId = getActiveTrackId();

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
    const newLines = insertPatternStep(
      pattern.lines || [],
      sharedCurrentLine,
      song.patternLength || PATTERN_LENGTH
    );

    pattern.lines = newLines;
    patterns[patternIndex] = pattern;

    updateSong({ patterns });

    const section = trackId === 'A' ? 'trackA' : trackId === 'B' ? 'trackB' : 'trackC';
    setActiveSection(section);
    setTrackFocusRevision(prev => prev + 1);
  }, [
    song.playlist,
    song.patterns,
    song.patternLength,
    getActiveTrackId,
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
    const trackId = getActiveTrackId();

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
    const newLines = deletePatternStep(
      pattern.lines || [],
      sharedCurrentLine,
      song.patternLength || PATTERN_LENGTH
    );

    pattern.lines = newLines;
    patterns[patternIndex] = pattern;

    updateSong({ patterns });

    const section = trackId === 'A' ? 'trackA' : trackId === 'B' ? 'trackB' : 'trackC';
    setActiveSection(section);
  }, [
    song.playlist,
    song.patterns,
    song.patternLength,
    getActiveTrackId,
    sequencerPatternIndex,
    sharedCurrentLine,
    updateSong,
    setActiveSection,
  ]);

  const applyTranspose = useCallback(
    (options: TransposeOptions): TransposeResult | null => {
      return performTranspose(song, options, updateSong);
    },
    [song, updateSong]
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

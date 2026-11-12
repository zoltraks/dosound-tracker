import { useCallback, useEffect, useMemo, useState } from 'react';
import { logger } from '../../utils/log/logger.ts';
import type { Song, Pattern, Step } from '../../synth/SoundDriver.ts';
import type { NavigationSection } from '../../constants/navigation.ts';
import {
  cloneTrackStep,
  emptyTrackStep,
  getClipboardApiOrReport,
  resolvePatternLength,
} from '../../utils/track/trackUtils.ts';
import {
  generateClipboardData,
  parseClipboardData,
  applyClipboardToLines,
  type TrackPasteMode,
} from '../../utils/track/trackClipboard.ts';
import {
  clampSelectionRow,
  extendTrackSelection,
  normalizeTrackSelection,
  readTrackSelection,
  writeTrackSelection,
  type TrackSelection,
} from '../../utils/track/trackSelection.ts';
import {
  performTranspose,
  type TransposeOptions,
  type TransposeResult,
} from '../../utils/transpose/transposeUtils.ts';
import { insertPatternStep, deletePatternStep } from '../../utils/pattern/patternUtils.ts';
import { wrapIndex } from '../../utils/track/trackPanelUtils.ts';
import { mapSongLineToPlaylistEntries } from '../../types/playlist.ts';

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
  setSharedCurrentLine: (line: number) => void;
  sequencerPatternIndex: number;
  setActiveSection: (section: NavigationSection) => void;
  setTrackFocusRevision: (updater: (prev: number) => number) => void;
  getPasteTrackMode: (options: { hasExistingData: boolean }) => Promise<TrackPasteMode | null>;
  createTrackFromSteps: (steps: Step[]) => void;
}

interface UseTrackOperationsResult {
  trackClipboardError: string;
  setTrackClipboardError: (value: string) => void;
  trackSelection: TrackSelection | null;
  handleExtendSelection: (trackId: 'A' | 'B' | 'C', delta: number) => void;
  handleCopyTrack: () => Promise<void>;
  handleCutTrack: () => Promise<void>;
  handleCloneTrack: () => void;
  handlePasteTrack: (anchorRow?: number, cursorRow?: number) => Promise<void>;
  handlePasteTrackAtCursor: () => void;
  handlePasteTrackFromStart: () => void;
  handleCopyTrackShortcut: () => void;
  handleCutTrackShortcut: () => void;
  handlePasteTrackShortcut: () => void;
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
  setSharedCurrentLine,
  sequencerPatternIndex,
  setActiveSection,
  setTrackFocusRevision,
  getPasteTrackMode,
  createTrackFromSteps,
}: UseTrackOperationsArgs): UseTrackOperationsResult {
  const [trackClipboardError, setTrackClipboardError] = useState('');
  const [trackSelection, setTrackSelection] = useState<TrackSelection | null>(() =>
    readTrackSelection(resolvePatternLength(song.length)),
  );
  const playlistEntries = useMemo(() => mapSongLineToPlaylistEntries(song.line), [song.line]);

  useEffect(() => {
    writeTrackSelection(trackSelection);
  }, [trackSelection]);

  const getActiveTrackId = useCallback((): 'A' | 'B' | 'C' => {
    if (activeSection === 'trackA') return 'A';
    if (activeSection === 'trackB') return 'B';
    if (activeSection === 'trackC') return 'C';
    return lastTrackId;
  }, [activeSection, lastTrackId]);

  const isTrackSectionActive =
    activeSection === 'trackA' || activeSection === 'trackB' || activeSection === 'trackC';

  const getCurrentPatternOrReport = useCallback(
    (trackId: 'A' | 'B' | 'C'): Pattern | null => {
      const pattern = getCurrentPatternForTrack(trackId);
      if (!pattern) {
        setTrackClipboardError('No pattern is assigned for the current track at this position.');
        return null;
      }
      return pattern;
    },
    [getCurrentPatternForTrack],
  );

  const handleExtendSelection = useCallback(
    (trackId: 'A' | 'B' | 'C', delta: number) => {
      const patternLength = resolvePatternLength(song.length);
      const next = extendTrackSelection(
        trackSelection,
        trackId,
        sharedCurrentLine,
        delta,
        patternLength,
      );
      setTrackSelection(next);
      setSharedCurrentLine(
        next ? next.head : clampSelectionRow(sharedCurrentLine + delta, patternLength),
      );
    },
    [trackSelection, song.length, sharedCurrentLine, setSharedCurrentLine],
  );

  const copyTrackToClipboard = useCallback(
    async (trackId: 'A' | 'B' | 'C', range?: { start: number; end: number }) => {
      try {
        const clipboard = getClipboardApiOrReport('write', setTrackClipboardError);
        if (!clipboard) {
          return;
        }

        const pattern = getCurrentPatternOrReport(trackId);
        if (!pattern) {
          return;
        }

        const yamlContent = generateClipboardData(
          pattern,
          resolvePatternLength(song.length),
          formatNoteKey,
          range,
        );

        await clipboard.writeText(yamlContent);
      } catch (error) {
        logger.error('Failed to copy track', error);
        const message = error instanceof Error ? error.message : String(error);
        setTrackClipboardError('Failed to copy track to clipboard.\n\n' + message);
      }
    },
    [getCurrentPatternOrReport, song.length, formatNoteKey],
  );

  const handleCopyTrack = useCallback(async () => {
    await copyTrackToClipboard(getActiveTrackId());
  }, [getActiveTrackId, copyTrackToClipboard]);

  const handleCutTrack = useCallback(async () => {
    try {
      if (!trackSelection) {
        return;
      }
      const trackId = trackSelection.trackId;

      const clipboard = getClipboardApiOrReport('write', setTrackClipboardError);
      if (!clipboard) {
        return;
      }

      const pattern = getCurrentPatternOrReport(trackId);
      if (!pattern) {
        return;
      }

      const targetLength = resolvePatternLength(song.length);
      const range = normalizeTrackSelection(trackSelection);

      const yamlContent = generateClipboardData(pattern, targetLength, formatNoteKey, range);
      await clipboard.writeText(yamlContent);

      const existingLines = pattern.step || [];
      const newLines = existingLines.map((line, index) =>
        index >= range.start && index <= range.end
          ? { ...line, note: null, volume: undefined }
          : { ...line },
      );

      const updatedPattern = { ...pattern, step: newLines };
      const updatedPatterns = song.pattern.map((p) => (p.id === pattern.id ? updatedPattern : p));
      updateSong({ pattern: updatedPatterns });
      setTrackSelection(null);
    } catch (error) {
      logger.error('Failed to cut track fragment', error);
      const message = error instanceof Error ? error.message : String(error);
      setTrackClipboardError('Failed to cut track fragment to clipboard.\n\n' + message);
    }
  }, [
    getCurrentPatternOrReport,
    song.length,
    song.pattern,
    formatNoteKey,
    trackSelection,
    updateSong,
  ]);

  const handleCloneTrack = useCallback(() => {
    const trackId = getActiveTrackId();
    const pattern = getCurrentPatternOrReport(trackId);
    if (!pattern) {
      return;
    }

    createTrackFromSteps(
      (pattern.step || []).map((step) => (step ? cloneTrackStep(step) : emptyTrackStep())),
    );
  }, [getActiveTrackId, getCurrentPatternOrReport, createTrackFromSteps]);

  const handlePasteTrack = useCallback(
    async (anchorRow?: number, cursorRow?: number, clearTail?: boolean) => {
      try {
        const clipboard = getClipboardApiOrReport('read', setTrackClipboardError);
        if (!clipboard) {
          return;
        }

        const text = await clipboard.readText();
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
        const pattern = getCurrentPatternOrReport(trackId);
        if (!pattern) {
          return;
        }

        const targetLength = resolvePatternLength(song.length);
        const existingLines = pattern.step || [];
        const startOffset =
          typeof anchorRow === 'number' && Number.isFinite(anchorRow)
            ? Math.min(Math.max(0, Math.floor(anchorRow)), Math.max(0, targetLength - 1))
            : 0;

        let hasExistingData = false;
        const windowEnd = Math.min(startOffset + expandedSteps.length, targetLength);
        for (let i = startOffset; i < windowEnd; i++) {
          const line = existingLines[i];
          if (line) {
            const hasNote = !!line.note;
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
          parseBaseKeyString,
          startOffset,
          clearTail,
        );

        const updatedPattern = { ...pattern, step: newLines };
        const updatedPatterns = song.pattern.map((p) => (p.id === pattern.id ? updatedPattern : p));
        updateSong({ pattern: updatedPatterns });

        if (anchorRow !== undefined) {
          const lastPastedRow = Math.min(
            startOffset + expandedSteps.length - 1,
            Math.max(0, targetLength - 1),
          );
          const nextRow =
            cursorRow !== undefined && Number.isFinite(cursorRow)
              ? Math.min(Math.max(0, Math.floor(cursorRow)), Math.max(0, targetLength - 1))
              : wrapIndex(lastPastedRow + 1, targetLength);
          setSharedCurrentLine(nextRow);
        }
      } catch (error) {
        logger.error('Failed to paste track', error);
        const message = error instanceof Error ? error.message : String(error);
        setTrackClipboardError('Failed to paste track from clipboard.\n\n' + message);
      }
    },
    [
      getActiveTrackId,
      getCurrentPatternOrReport,
      song.length,
      song.pattern,
      parseBaseKeyString,
      updateSong,
      setSharedCurrentLine,
      getPasteTrackMode,
    ],
  );

  const handleInsertStep = useCallback(() => {
    const playlistLength = playlistEntries.length;
    if (playlistLength === 0) {
      return;
    }

    const currentIndex = Math.max(0, Math.min(sequencerPatternIndex, playlistLength - 1));
    const entry = playlistEntries[currentIndex];
    const trackId = getActiveTrackId();

    const patternValue = entry ? entry[trackId] : '--';
    const patternId = patternValue === '--' ? '--' : (patternValue as string);

    if (!patternId || patternId === '--') {
      return;
    }

    const patterns = [...song.pattern];
    const patternIndex = patterns.findIndex((p) => p.id === patternId);
    if (patternIndex === -1) {
      return;
    }

    const pattern = { ...patterns[patternIndex] };
    const newLines = insertPatternStep(
      pattern.step || [],
      sharedCurrentLine,
      resolvePatternLength(song.length),
    );

    pattern.step = newLines;
    patterns[patternIndex] = pattern;

    updateSong({ pattern: patterns });

    const section = trackId === 'A' ? 'trackA' : trackId === 'B' ? 'trackB' : 'trackC';
    setActiveSection(section);
    setTrackFocusRevision((prev) => prev + 1);
  }, [
    playlistEntries,
    song.pattern,
    song.length,
    getActiveTrackId,
    sequencerPatternIndex,
    sharedCurrentLine,
    updateSong,
    setActiveSection,
    setTrackFocusRevision,
  ]);

  const handleDeleteStep = useCallback(() => {
    const playlistLength = playlistEntries.length;
    if (playlistLength === 0) {
      return;
    }

    const currentIndex = Math.max(0, Math.min(sequencerPatternIndex, playlistLength - 1));
    const entry = playlistEntries[currentIndex];
    const trackId = getActiveTrackId();

    const patternValue = entry ? entry[trackId] : '--';
    const patternId = patternValue === '--' ? '--' : (patternValue as string);

    if (!patternId || patternId === '--') {
      return;
    }

    const patterns = [...song.pattern];
    const patternIndex = patterns.findIndex((p) => p.id === patternId);
    if (patternIndex === -1) {
      return;
    }

    const pattern = { ...patterns[patternIndex] };
    const newLines = deletePatternStep(
      pattern.step || [],
      sharedCurrentLine,
      resolvePatternLength(song.length),
    );

    pattern.step = newLines;
    patterns[patternIndex] = pattern;

    updateSong({ pattern: patterns });

    const section = trackId === 'A' ? 'trackA' : trackId === 'B' ? 'trackB' : 'trackC';
    setActiveSection(section);
  }, [
    playlistEntries,
    song.pattern,
    song.length,
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
    [song, updateSong],
  );

  const handleCopyTrackShortcut = useCallback(() => {
    if (isTrackSectionActive) {
      const range = trackSelection ? normalizeTrackSelection(trackSelection) : undefined;
      const trackId = trackSelection ? trackSelection.trackId : getActiveTrackId();
      void copyTrackToClipboard(trackId, range);
    }
  }, [isTrackSectionActive, trackSelection, getActiveTrackId, copyTrackToClipboard]);

  const handleCutTrackShortcut = useCallback(() => {
    if (isTrackSectionActive) {
      void handleCutTrack();
    }
  }, [isTrackSectionActive, handleCutTrack]);

  const handlePasteTrackAtCursor = useCallback(() => {
    void handlePasteTrack(sharedCurrentLine, undefined, false);
  }, [handlePasteTrack, sharedCurrentLine]);

  const handlePasteTrackFromStart = useCallback(() => {
    void handlePasteTrack(0, 0, true);
  }, [handlePasteTrack]);

  const handlePasteTrackShortcut = useCallback(() => {
    if (isTrackSectionActive) {
      handlePasteTrackAtCursor();
    }
  }, [isTrackSectionActive, handlePasteTrackAtCursor]);

  return {
    trackClipboardError,
    setTrackClipboardError,
    trackSelection,
    handleExtendSelection,
    handleCopyTrack,
    handleCutTrack,
    handleCloneTrack,
    handlePasteTrack,
    handlePasteTrackAtCursor,
    handlePasteTrackFromStart,
    handleCopyTrackShortcut,
    handleCutTrackShortcut,
    handlePasteTrackShortcut,
    handleInsertStep,
    handleDeleteStep,
    applyTranspose,
  };
}

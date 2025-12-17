import { useCallback } from 'react';
import type { Song } from '../synth/SoundDriver';
import type { NavigationSection } from '../constants/navigation';
import { formatHexId } from '../utils/hexFormatting';

interface UsePlaylistOperationsArgs {
  song: Song;
  targetTrackId: 'A' | 'B' | 'C';
  currentPatternIndex: number;
  createNewPattern: (patternId: string) => void;
  updateSong: (patch: Partial<Song>) => void;
  setActiveSection: (section: NavigationSection) => void;
  setSharedCurrentLine: (line: number) => void;
  setPosition: (playlistIndex: number, patternIndex: number, lineIndex: number) => void;
}

interface UsePlaylistOperationsResult {
  handlePlaylistChange: (newPlaylist: Song['line']) => void;
  generateUniquePatternId: () => string;
  handleCreatePatternAt: (lineIndex: number, track: 'A' | 'B' | 'C') => void;
  handleCreateNewTrack: () => void;
  handleAddLine: () => void;
  // Shallow: duplicate the current playlist entry without cloning patterns
  handleDuplicateLine: () => void;
  handleDeleteLine: () => void;
  // Deep: clone the current playlist entry and its referenced patterns
  handleCloneLine: () => void;
  handleDeleteTrack: () => void;
  clampedPlaybackPosition: number;
  handlePositionSelect: (position: number) => void;
}

export function usePlaylistOperations({
  song,
  targetTrackId,
  currentPatternIndex,
  createNewPattern,
  updateSong,
  setActiveSection,
  setSharedCurrentLine,
  setPosition,
}: UsePlaylistOperationsArgs): UsePlaylistOperationsResult {
  const playlistLength = song.line.length;
  const clampedPlaybackPosition =
    playlistLength === 0
      ? 0
      : Math.max(0, Math.min(currentPatternIndex, playlistLength - 1));

  const handlePlaylistChange = useCallback((newPlaylist: Song['line']) => {
    updateSong({ line: newPlaylist });
  }, [updateSong]);

  const generateUniquePatternId = useCallback(() => {
    const existingIds = song.pattern.map(p => p.id);
    let index = song.pattern.length;
    let patternId: string;
    do {
      patternId = formatHexId(index);
      index++;
    } while (existingIds.includes(patternId));
    return patternId;
  }, [song.pattern]);

  const handleCreatePatternAt = useCallback((lineIndex: number, track: 'A' | 'B' | 'C') => {
    if (lineIndex < 0 || lineIndex >= song.line.length) {
      return;
    }

    const patternId = generateUniquePatternId();
    createNewPattern(patternId);

    const newPlaylist = [...song.line];
    const entry = { ...newPlaylist[lineIndex] };

    switch (track) {
      case 'A':
        entry.A = patternId;
        break;
      case 'B':
        entry.B = patternId;
        break;
      case 'C':
        entry.C = patternId;
        break;
    }

    newPlaylist[lineIndex] = entry;
    updateSong({ line: newPlaylist });
  }, [song.line, createNewPattern, updateSong, generateUniquePatternId]);

  const handleCreateNewTrack = useCallback(() => {
    const playlist = song.line.length > 0
      ? [...song.line]
      : [{ A: '--', B: '--', C: '--' }];

    const targetLine = Math.max(0, Math.min(currentPatternIndex, playlist.length - 1));
    const patternId = generateUniquePatternId();
    createNewPattern(patternId);

    const entry = { ...playlist[targetLine] };
    switch (targetTrackId) {
      case 'A':
        entry.A = patternId;
        break;
      case 'B':
        entry.B = patternId;
        break;
      case 'C':
        entry.C = patternId;
        break;
    }

    playlist[targetLine] = entry;
    updateSong({ line: playlist });

    const section = targetTrackId === 'A' ? 'trackA' : targetTrackId === 'B' ? 'trackB' : 'trackC';
    setActiveSection(section);
    setSharedCurrentLine(0);
    setPosition(targetLine, 0, 0);
  }, [song.line, currentPatternIndex, targetTrackId, generateUniquePatternId, createNewPattern, updateSong, setActiveSection, setSharedCurrentLine, setPosition]);

  const handleAddLine = useCallback(() => {
    const newPlaylist = [...song.line];
    newPlaylist.push({
      A: '--',
      B: '--',
      C: '--',
    });
    updateSong({ line: newPlaylist });

    const newIndex = Math.max(0, newPlaylist.length - 1);
    setPosition(newIndex, 0, 0);
    setActiveSection('playlist');
  }, [song.line, updateSong, setPosition, setActiveSection]);

  // Shallow duplicate: insert a copy of the current playlist entry, reusing pattern IDs
  const handleDuplicateLine = useCallback(() => {
    const length = song.line.length;
    if (length === 0) {
      return;
    }

    const currentIndex = Math.max(0, Math.min(currentPatternIndex, length - 1));
    const sourceEntry = song.line[currentIndex];
    const newPlaylist = [...song.line];
    const clonedEntry = { ...sourceEntry };
    const insertIndex = currentIndex + 1;

    newPlaylist.splice(insertIndex, 0, clonedEntry);
    updateSong({ line: newPlaylist });
    setPosition(insertIndex, 0, 0);
  }, [song.line, currentPatternIndex, updateSong, setPosition]);

  const handleDeleteLine = useCallback(() => {
    const length = song.line.length;
    if (length === 0) {
      return;
    }

    const currentIndex = Math.max(0, Math.min(currentPatternIndex, length - 1));
    const newPlaylist = [...song.line];
    newPlaylist.splice(currentIndex, 1);
    updateSong({ line: newPlaylist });

    const newLength = newPlaylist.length;
    if (newLength === 0) {
      setPosition(0, 0, 0);
      return;
    }

    const newIndex = Math.min(currentIndex, newLength - 1);
    setPosition(newIndex, 0, 0);
  }, [song.line, currentPatternIndex, updateSong, setPosition]);

  // Deep clone: duplicate the current playlist entry and create new patterns for any referenced IDs
  const handleCloneLine = useCallback(() => {
    const playlist = song.line;
    const patterns = song.pattern;
    const length = playlist.length;
    if (length === 0) {
      return;
    }

    const currentIndex = Math.max(0, Math.min(currentPatternIndex, length - 1));
    const sourceEntry = playlist[currentIndex];

    const newPlaylist = [...playlist];
    const newEntry = { ...sourceEntry };
    const newPatterns = [...patterns];

    const existingIds = new Set(patterns.map(p => p.id));
    let nextIndex = patterns.length;

    const allocatePatternId = () => {
      // Generate hex IDs like existing patterns (00, 01, 02, ...)
      // Ensure the ID is unique across all patterns, including newly-added ones.
      while (true) {
        const id = formatHexId(nextIndex);
        nextIndex++;
        if (!existingIds.has(id)) {
          existingIds.add(id);
          return id;
        }
      }
    };

    const duplicateTrack = (key: 'A' | 'B' | 'C') => {
      const patternId = sourceEntry[key];
      if (!patternId || patternId === '--') {
        newEntry[key] = patternId;
        return;
      }

      const original = patterns.find(p => p.id === patternId);
      if (!original) {
        newEntry[key] = patternId;
        return;
      }

      const newId = allocatePatternId();
      const newSteps = original.step.map(step => ({
        note: step.note ? { ...step.note } : null,
        ...(step.volume !== undefined ? { volume: step.volume } : {}),
      }));

      newPatterns.push({
        id: newId,
        name: original.name,
        step: newSteps,
      });

      newEntry[key] = newId;
    };

    duplicateTrack('A');
    duplicateTrack('B');
    duplicateTrack('C');

    const insertIndex = currentIndex + 1;
    newPlaylist.splice(insertIndex, 0, newEntry);

    updateSong({
      line: newPlaylist,
      pattern: newPatterns,
    });

    setPosition(insertIndex, 0, 0);
  }, [song.line, song.pattern, currentPatternIndex, updateSong, setPosition]);

  const handleDeleteTrack = useCallback(() => {
    const length = song.line.length;
    if (length === 0) {
      return;
    }

    const currentIndex = Math.max(0, Math.min(currentPatternIndex, length - 1));
    const playlist = [...song.line];
    const entry = { ...playlist[currentIndex] };

    switch (targetTrackId) {
      case 'A':
        entry.A = '--';
        break;
      case 'B':
        entry.B = '--';
        break;
      case 'C':
        entry.C = '--';
        break;
    }

    playlist[currentIndex] = entry;
    updateSong({ line: playlist });
  }, [song.line, currentPatternIndex, targetTrackId, updateSong]);

  const handlePositionSelect = useCallback(
    (position: number) => {
      setPosition(position, 0, 0);
    },
    [setPosition],
  );

  return {
    handlePlaylistChange,
    generateUniquePatternId,
    handleCreatePatternAt,
    handleCreateNewTrack,
    handleAddLine,
    handleDuplicateLine,
    handleDeleteLine,
    handleCloneLine,
    handleDeleteTrack,
    clampedPlaybackPosition,
    handlePositionSelect,
  };
}

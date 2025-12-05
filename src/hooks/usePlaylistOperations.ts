import { useCallback } from 'react';
import type { Song } from '../synth/SoundDriver';
import type { NavigationSection } from '../constants/navigation';

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
  handlePlaylistChange: (newPlaylist: Song['playlist']) => void;
  generateUniquePatternId: () => string;
  handleCreatePatternAt: (lineIndex: number, track: 'A' | 'B' | 'C') => void;
  handleCreateNewTrack: () => void;
  handleAddLine: () => void;
  handleCloneLine: () => void;
  handleDeleteLine: () => void;
  handleDuplicateLine: () => void;
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
  const playlistLength = song.playlist.length;
  const clampedPlaybackPosition =
    playlistLength === 0
      ? 0
      : Math.max(0, Math.min(currentPatternIndex, playlistLength - 1));

  const handlePlaylistChange = useCallback((newPlaylist: Song['playlist']) => {
    updateSong({ playlist: newPlaylist });
  }, [updateSong]);

  const generateUniquePatternId = useCallback(() => {
    const existingIds = song.patterns.map(p => p.id);
    let index = song.patterns.length;
    let patternId: string;
    do {
      patternId = index.toString(16).padStart(2, '0').toUpperCase();
      index++;
    } while (existingIds.includes(patternId));
    return patternId;
  }, [song.patterns]);

  const handleCreatePatternAt = useCallback((lineIndex: number, track: 'A' | 'B' | 'C') => {
    if (lineIndex < 0 || lineIndex >= song.playlist.length) {
      return;
    }

    const patternId = generateUniquePatternId();
    createNewPattern(patternId);

    const newPlaylist = [...song.playlist];
    const entry = { ...newPlaylist[lineIndex] };

    switch (track) {
      case 'A':
        entry.trackA = patternId;
        break;
      case 'B':
        entry.trackB = patternId;
        break;
      case 'C':
        entry.trackC = patternId;
        break;
    }

    newPlaylist[lineIndex] = entry;
    updateSong({ playlist: newPlaylist });
  }, [song.playlist, createNewPattern, updateSong, generateUniquePatternId]);

  const handleCreateNewTrack = useCallback(() => {
    const playlist = song.playlist.length > 0
      ? [...song.playlist]
      : [{ trackA: '--', trackB: '--', trackC: '--' }];

    const targetLine = Math.max(0, Math.min(currentPatternIndex, playlist.length - 1));
    const patternId = generateUniquePatternId();
    createNewPattern(patternId);

    const entry = { ...playlist[targetLine] };
    switch (targetTrackId) {
      case 'A':
        entry.trackA = patternId;
        break;
      case 'B':
        entry.trackB = patternId;
        break;
      case 'C':
        entry.trackC = patternId;
        break;
    }

    playlist[targetLine] = entry;
    updateSong({ playlist });

    const section = targetTrackId === 'A' ? 'trackA' : targetTrackId === 'B' ? 'trackB' : 'trackC';
    setActiveSection(section);
    setSharedCurrentLine(0);
    setPosition(targetLine, 0, 0);
  }, [song.playlist, currentPatternIndex, targetTrackId, generateUniquePatternId, createNewPattern, updateSong, setActiveSection, setSharedCurrentLine, setPosition]);

  const handleAddLine = useCallback(() => {
    const newPlaylist = [...song.playlist];
    newPlaylist.push({
      trackA: '--',
      trackB: '--',
      trackC: '--',
    });
    updateSong({ playlist: newPlaylist });

    const newIndex = Math.max(0, newPlaylist.length - 1);
    setPosition(newIndex, 0, 0);
    setActiveSection('playlist');
  }, [song.playlist, updateSong, setPosition, setActiveSection]);

  const handleCloneLine = useCallback(() => {
    const length = song.playlist.length;
    if (length === 0) {
      return;
    }

    const currentIndex = Math.max(0, Math.min(currentPatternIndex, length - 1));
    const sourceEntry = song.playlist[currentIndex];
    const newPlaylist = [...song.playlist];
    const clonedEntry = { ...sourceEntry };
    const insertIndex = currentIndex + 1;

    newPlaylist.splice(insertIndex, 0, clonedEntry);
    updateSong({ playlist: newPlaylist });
    setPosition(insertIndex, 0, 0);
  }, [song.playlist, currentPatternIndex, updateSong, setPosition]);

  const handleDeleteLine = useCallback(() => {
    const length = song.playlist.length;
    if (length === 0) {
      return;
    }

    const currentIndex = Math.max(0, Math.min(currentPatternIndex, length - 1));
    const newPlaylist = [...song.playlist];
    newPlaylist.splice(currentIndex, 1);
    updateSong({ playlist: newPlaylist });

    const newLength = newPlaylist.length;
    if (newLength === 0) {
      setPosition(0, 0, 0);
      return;
    }

    const newIndex = Math.min(currentIndex, newLength - 1);
    setPosition(newIndex, 0, 0);
  }, [song.playlist, currentPatternIndex, updateSong, setPosition]);

  const handleDuplicateLine = useCallback(() => {
    const playlist = song.playlist;
    const patterns = song.patterns;
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
      // eslint-disable-next-line no-constant-condition
      while (true) {
        const id = nextIndex.toString(16).padStart(2, '0').toUpperCase();
        nextIndex++;
        if (!existingIds.has(id)) {
          existingIds.add(id);
          return id;
        }
      }
    };

    const duplicateTrack = (key: 'trackA' | 'trackB' | 'trackC') => {
      const patternId = sourceEntry[key];
      if (!patternId || patternId === '--' || patternId.startsWith('^^')) {
        newEntry[key] = patternId;
        return;
      }

      const original = patterns.find(p => p.id === patternId);
      if (!original) {
        newEntry[key] = patternId;
        return;
      }

      const newId = allocatePatternId();
      const newLines = original.lines.map(line => ({
        trackA: line.trackA ? { ...line.trackA } : null,
        trackB: line.trackB ? { ...line.trackB } : null,
        trackC: line.trackC ? { ...line.trackC } : null,
      }));

      newPatterns.push({
        id: newId,
        name: original.name,
        lines: newLines,
      });

      newEntry[key] = newId;
    };

    duplicateTrack('trackA');
    duplicateTrack('trackB');
    duplicateTrack('trackC');

    const insertIndex = currentIndex + 1;
    newPlaylist.splice(insertIndex, 0, newEntry);

    updateSong({
      playlist: newPlaylist,
      patterns: newPatterns,
    });

    setPosition(insertIndex, 0, 0);
  }, [song.playlist, song.patterns, currentPatternIndex, updateSong, setPosition]);

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
    handleCloneLine,
    handleDeleteLine,
    handleDuplicateLine,
    clampedPlaybackPosition,
    handlePositionSelect,
  };
}

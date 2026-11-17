import React, { useState, useRef, useEffect, useCallback } from 'react';
import type { NavigationSection } from '../../constants/navigation.ts';
import { PlaylistHeader } from './PlaylistHeader.tsx';
import { PlaylistLine } from './PlaylistLine.tsx';
import type { PlaylistEntry } from '../../types/playlist.ts';
import { asPlaylistPatternId } from '../../types/branded.ts';
import { StorageKeys } from '../../utils/storage/storageKeys.ts';
import { readPlaylistTrack } from '../../utils/cursor/panelCursorFields.ts';
import { SONG_CHANNEL_IDS } from '../../constants/song.ts';
import type { SongChannelId } from '../../synth/SoundDriver.ts';

interface PlaylistPanelProps {
  playlist: PlaylistEntry[];
  activeSection: NavigationSection;
  setActiveSection: (section: NavigationSection) => void;
  onPlaylistChange: (playlist: PlaylistEntry[]) => void;
  currentPlaybackPosition: number;
  onPositionSelect: (position: number) => void;
  onCreatePatternAt: (lineIndex: number, track: SongChannelId) => void;
  targetTrack: SongChannelId;
  tracks: readonly SongChannelId[];
  trackChannelCount?: number;
  onTrackChannelChange?: (track: SongChannelId) => void;
  sharedCurrentLine: number;
  focusRevision?: number;
  onToggleLineFromStart: (lineIndex: number) => void;
  onToggleSongFromCursor: (lineIndex: number) => void;
  onToggleSongFromStart: (lineIndex: number) => void;
}

export const PlaylistPanel: React.FC<PlaylistPanelProps> = ({
  playlist,
  activeSection,
  setActiveSection,
  onPlaylistChange,
  currentPlaybackPosition,
  onPositionSelect,
  onCreatePatternAt,
  targetTrack,
  tracks,
  trackChannelCount = 3,
  onTrackChannelChange,
  sharedCurrentLine,
  focusRevision = 0,
  onToggleLineFromStart,
  onToggleSongFromCursor,
  onToggleSongFromStart,
}) => {
  const [currentLine, setCurrentLine] = useState(0);
  // REASON: kept as a plain useState so the setter stays a stable dispatch that
  // the React Compiler can track inside memoized callbacks; persisted manually below.
  const [currentTrack, setCurrentTrack] = useState<SongChannelId>(() => {
    try {
      return readPlaylistTrack(localStorage.getItem(StorageKeys.PLAYLIST_TRACK));
    } catch {
      return 'A';
    }
  });
  // null means no edit is open; '' is a live edit on an empty ('--') cell.
  const [editingPattern, setEditingPattern] = useState<string | null>(null);
  const playlistRef = useRef<HTMLDivElement>(null);
  const linesContainerRef = useRef<HTMLDivElement | null>(null);

  const isActive = activeSection === 'playlist';

  useEffect(() => {
    try {
      localStorage.setItem(StorageKeys.PLAYLIST_TRACK, currentTrack);
    } catch {
      // ignore
    }
  }, [currentTrack]);

  const moveLine = useCallback(
    (lineIndex: number, direction: 'up' | 'down') => {
      if (playlist.length === 0) {
        return;
      }

      if (direction === 'up' && lineIndex <= 0) {
        return;
      }

      if (direction === 'down' && lineIndex >= playlist.length - 1) {
        return;
      }

      const targetIndex = direction === 'up' ? lineIndex - 1 : lineIndex + 1;
      const newPlaylist = [...playlist];
      const [moved] = newPlaylist.splice(lineIndex, 1);
      newPlaylist.splice(targetIndex, 0, moved);

      onPlaylistChange(newPlaylist);
      setCurrentLine(targetIndex);
      onPositionSelect(targetIndex);
    },
    [playlist, onPlaylistChange, onPositionSelect],
  );

  const updatePattern = useCallback(
    (lineIndex: number, track: SongChannelId, patternId: string) => {
      const newPlaylist = [...playlist];
      const entry = { ...newPlaylist[lineIndex] };

      if (patternId === '--' || (patternId.length === 2 && /^[0-9A-Fa-f]{2}$/.test(patternId))) {
        entry[track] = patternId === '--' ? '--' : asPlaylistPatternId(patternId);

        newPlaylist[lineIndex] = entry;
        onPlaylistChange(newPlaylist);
      }
    },
    [playlist, onPlaylistChange],
  );

  const startEditingPattern = useCallback(
    (lineIndex: number, track: SongChannelId) => {
      const entry = playlist[lineIndex];
      const currentPattern = entry[track] ?? '--';

      setCurrentLine(lineIndex);
      setCurrentTrack(track);
      setEditingPattern(currentPattern === '--' ? '' : currentPattern);
    },
    [playlist],
  );

  const finishEditingPattern = useCallback(
    (options?: { refocusPlaylist?: boolean }) => {
      if (editingPattern === null) {
        return;
      }
      if (editingPattern.trim() === '') {
        updatePattern(currentLine, currentTrack, '--');
      } else {
        updatePattern(currentLine, currentTrack, editingPattern.toUpperCase().padStart(2, '0'));
      }
      setEditingPattern(null);

      const shouldRefocusPlaylist = options?.refocusPlaylist !== false;
      if (!shouldRefocusPlaylist) {
        return;
      }

      setTimeout(() => {
        if (playlistRef.current) {
          playlistRef.current.focus();
        }
      }, 0);
    },
    [editingPattern, currentLine, currentTrack, updatePattern],
  );

  useEffect(() => {
    if (isActive && playlistRef.current) {
      playlistRef.current.focus();
    }
  }, [isActive, focusRevision]);

  useEffect(() => {
    if (editingPattern !== null) {
      return;
    }

    if (playlist.length === 0) {
      if (currentLine !== 0) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setCurrentLine(0);
      }
      return;
    }

    const clamped = Math.max(0, Math.min(playlist.length - 1, currentPlaybackPosition));
    if (currentLine !== clamped) {
      setCurrentLine(clamped);
    }
  }, [currentPlaybackPosition, playlist.length, currentLine, editingPattern]);

  useEffect(() => {
    const container = linesContainerRef.current;
    if (!container) {
      return;
    }

    if (typeof window !== 'undefined') {
      const mql = window.matchMedia('(max-width: 1100px), (max-height: 700px)');
      if (mql.matches) {
        return;
      }
    }

    const lineElements = container.querySelectorAll('.playlist-line') as NodeListOf<HTMLDivElement>;
    const target = lineElements[currentLine];
    if (target) {
      target.scrollIntoView({ block: 'nearest' });
    }
  }, [currentLine]);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (!isActive) return;

      if (editingPattern === null && event.ctrlKey) {
        if (event.key === 'ArrowUp') {
          event.preventDefault();
          moveLine(currentLine, 'up');
          return;
        }
        if (event.key === 'ArrowDown') {
          event.preventDefault();
          moveLine(currentLine, 'down');
          return;
        }
      }

      const key = event.key.toUpperCase();
      const bare = !event.ctrlKey && !event.metaKey && !event.altKey && !event.shiftKey;

      if (editingPattern !== null) {
        if (key === 'ENTER' || key === 'ESCAPE') {
          event.preventDefault();
          if (key === 'ENTER') {
            finishEditingPattern();
          } else {
            setEditingPattern(null);
          }
        } else if (key === 'BACKSPACE') {
          event.preventDefault();
          if (editingPattern.length === 1) {
            updatePattern(currentLine, currentTrack, '--');
            setEditingPattern(null);
          } else {
            setEditingPattern((prev) => (prev ?? '').slice(0, -1));
          }
        } else if (/^[0-9A-F]$/.test(key) && editingPattern.length < 2) {
          event.preventDefault();
          setEditingPattern((prev) => (prev ?? '') + key);
        }
        return;
      }

      switch (key) {
        case 'ARROWUP':
          event.preventDefault();
          setCurrentLine((prev) => {
            const next = Math.max(0, prev - 1);
            onPositionSelect(next);
            return next;
          });
          break;
        case 'ARROWDOWN':
          event.preventDefault();
          setCurrentLine((prev) => {
            if (playlist.length === 0) {
              return prev;
            }
            const next = Math.min(playlist.length - 1, prev + 1);
            onPositionSelect(next);
            return next;
          });
          break;
        case 'ARROWLEFT':
        case 'ARROWRIGHT': {
          event.preventDefault();
          // Channel arrows cycle every enabled channel, not just the visible
          // window - reporting the pick lets the tracker slide its window.
          const channelIds = SONG_CHANNEL_IDS.slice(0, Math.max(1, trackChannelCount));
          const index = channelIds.indexOf(currentTrack);
          const delta = key === 'ARROWLEFT' ? -1 : 1;
          const next =
            channelIds[(index + delta + channelIds.length) % channelIds.length] ?? currentTrack;
          setCurrentTrack(next);
          onTrackChannelChange?.(next);
          break;
        }
        case 'N':
          if (!bare) break;
          event.preventDefault();
          onCreatePatternAt(currentLine, currentTrack);
          break;
        case ' ':
        case '0':
        case '1':
        case '2':
        case '3':
        case '4':
        case '5':
        case '6':
        case '7':
        case '8':
        case '9':
        case 'A':
        case 'B':
        case 'C':
        case 'D':
        case 'E':
        case 'F':
          if (!bare) break;
          event.preventDefault();
          startEditingPattern(currentLine, currentTrack);
          if (key !== ' ') {
            setEditingPattern(key);
          }
          break;
        case 'DELETE':
        case 'BACKSPACE':
          if (!bare) break;
          event.preventDefault();
          updatePattern(currentLine, currentTrack, '--');
          break;
        case 'ENTER':
          event.preventDefault();
          if (event.ctrlKey && event.shiftKey) {
            onToggleSongFromStart(sharedCurrentLine);
          } else if (event.shiftKey) {
            onToggleSongFromCursor(sharedCurrentLine);
          } else if (event.ctrlKey) {
            onToggleLineFromStart(sharedCurrentLine);
          } else {
            startEditingPattern(currentLine, currentTrack);
          }
          break;
      }
    },
    [
      isActive,
      playlist.length,
      currentLine,
      currentTrack,
      trackChannelCount,
      onTrackChannelChange,
      editingPattern,
      startEditingPattern,
      finishEditingPattern,
      updatePattern,
      moveLine,
      onCreatePatternAt,
      onPositionSelect,
      sharedCurrentLine,
      onToggleLineFromStart,
      onToggleSongFromCursor,
      onToggleSongFromStart,
    ],
  );

  const handleLineClick = useCallback(
    (lineIndex: number) => {
      setCurrentLine(lineIndex);
      setActiveSection('playlist');
      onPositionSelect(lineIndex);
    },
    [setActiveSection, onPositionSelect],
  );

  const handlePatternClick = useCallback(
    (lineIndex: number, track: SongChannelId) => {
      setCurrentLine(lineIndex);
      setCurrentTrack(track);
      onTrackChannelChange?.(track);
      setActiveSection('playlist');
      onPositionSelect(lineIndex);
    },
    [setActiveSection, onPositionSelect, onTrackChannelChange],
  );

  const handleTrackHeaderClick = useCallback(
    (track: SongChannelId) => {
      setCurrentTrack(track);

      const section = `track${track}` as NavigationSection;

      setActiveSection(section);
    },
    [setActiveSection],
  );

  const handlePatternRightClick = useCallback(
    (lineIndex: number, track: SongChannelId, event: React.MouseEvent) => {
      event.preventDefault();
      event.stopPropagation();
      handlePatternClick(lineIndex, track);
      handleTrackHeaderClick(track);
    },
    [handlePatternClick, handleTrackHeaderClick],
  );

  const getLineClass = useCallback(
    (lineIndex: number) => {
      const classes = ['playlist-line'];
      if (lineIndex === currentLine && isActive) {
        classes.push('current');
      }
      if (lineIndex === currentPlaybackPosition) {
        classes.push('playback-position');
      }
      return classes.join(' ');
    },
    [currentLine, isActive, currentPlaybackPosition],
  );

  const getPatternClass = useCallback(
    (lineIndex: number, track: SongChannelId) => {
      const classes = ['track-pattern'];
      if (lineIndex === currentLine && track === currentTrack && isActive) {
        classes.push('current-track');
      }
      return classes.join(' ');
    },
    [currentLine, currentTrack, isActive],
  );

  return (
    <div
      ref={playlistRef}
      className={`playlist-panel ${isActive ? 'active' : ''}`}
      role="group"
      aria-label="Playlist"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onClick={() => setActiveSection('playlist')}
    >
      <div className="playlist-header">Playlist</div>

      <div className="playlist-content">
        <PlaylistHeader
          targetTrack={targetTrack}
          tracks={tracks}
          onTrackHeaderClick={handleTrackHeaderClick}
        />

        <div className="playlist-line-container" ref={linesContainerRef}>
          {playlist.map((entry, actualIndex) => {
            const isCurrentLine = actualIndex === currentLine;
            const isEditing = isCurrentLine && editingPattern !== null;

            return (
              <PlaylistLine
                key={actualIndex}
                index={actualIndex}
                entry={entry}
                lineClassName={getLineClass(actualIndex)}
                patternClasses={Object.fromEntries(
                  tracks.map((track) => [track, getPatternClass(actualIndex, track)]),
                )}
                tracks={tracks}
                isCurrentLine={isCurrentLine}
                currentTrack={currentTrack}
                isEditing={isEditing}
                editingPattern={editingPattern}
                onEditingPatternChange={(value) => setEditingPattern(value)}
                onFinishEditingPattern={finishEditingPattern}
                onLineClick={handleLineClick}
                onPatternClick={handlePatternClick}
                onPatternRightClick={handlePatternRightClick}
                onCreatePatternAt={onCreatePatternAt}
                onMoveLine={moveLine}
                playlistLength={playlist.length}
                onTrackHeaderClick={handleTrackHeaderClick}
              />
            );
          })}
        </div>
      </div>

      {/* Playlist footer intentionally left empty (no controls) */}
    </div>
  );
};

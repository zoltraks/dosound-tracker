import React, { useState, useRef, useEffect, useCallback } from 'react';
import type { NavigationSection } from '../constants/navigation';
import { PlaylistHeader } from './PlaylistHeader';
import { PlaylistLine } from './PlaylistLine';

interface PlaylistEntry {
  trackA: string;
  trackB: string;
  trackC: string;
}

interface PlaylistPanelProps {
  playlist: PlaylistEntry[];
  activeSection: NavigationSection;
  setActiveSection: (section: NavigationSection) => void;
  onPlaylistChange: (playlist: PlaylistEntry[]) => void;
  currentPlaybackPosition: number;
  onPositionSelect: (position: number) => void;
  onCreatePatternAt: (lineIndex: number, track: 'A' | 'B' | 'C') => void;
  targetTrack: 'A' | 'B' | 'C';
}

export const PlaylistPanel: React.FC<PlaylistPanelProps> = ({
  playlist,
  activeSection,
  setActiveSection,
  onPlaylistChange,
  currentPlaybackPosition,
  onPositionSelect,
  onCreatePatternAt,
  targetTrack
}) => {
  const [currentLine, setCurrentLine] = useState(0);
  const [currentTrack, setCurrentTrack] = useState<'A' | 'B' | 'C'>('A');
  const [editingPattern, setEditingPattern] = useState<string>('');
  const playlistRef = useRef<HTMLDivElement>(null);
  const linesContainerRef = useRef<HTMLDivElement | null>(null);

  const isActive = activeSection === 'playlist';

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
    [playlist, onPlaylistChange, onPositionSelect]
  );

  const updatePattern = useCallback((lineIndex: number, track: 'A' | 'B' | 'C', patternId: string) => {
    const newPlaylist = [...playlist];
    const entry = { ...newPlaylist[lineIndex] };
    
    // Validate pattern ID (should be 2-digit hex or '--')
    if (patternId === '--' || (patternId.length === 2 && /^[0-9A-Fa-f]{2}$/.test(patternId))) {
      switch (track) {
        case 'A': entry.trackA = patternId; break;
        case 'B': entry.trackB = patternId; break;
        case 'C': entry.trackC = patternId; break;
      }
      
      newPlaylist[lineIndex] = entry;
      onPlaylistChange(newPlaylist);
    }
  }, [playlist, onPlaylistChange]);

  const startEditingPattern = useCallback((lineIndex: number, track: 'A' | 'B' | 'C') => {
    const entry = playlist[lineIndex];
    let currentPattern = '--';
    
    switch (track) {
      case 'A': currentPattern = entry.trackA; break;
      case 'B': currentPattern = entry.trackB; break;
      case 'C': currentPattern = entry.trackC; break;
    }
    
    setCurrentLine(lineIndex);
    setCurrentTrack(track);
    setEditingPattern(currentPattern === '--' ? '' : currentPattern);
  }, [playlist]);

  const finishEditingPattern = useCallback((options?: { refocusPlaylist?: boolean }) => {
    if (editingPattern.trim() === '') {
      updatePattern(currentLine, currentTrack, '--');
    } else {
      updatePattern(currentLine, currentTrack, editingPattern.toUpperCase().padStart(2, '0'));
    }
    setEditingPattern('');
    
    // Refocus the playlist container after editing completes
    const shouldRefocusPlaylist = options?.refocusPlaylist !== false;
    if (!shouldRefocusPlaylist) {
      return;
    }

    setTimeout(() => {
      if (playlistRef.current) {
        playlistRef.current.focus();
      }
    }, 0);
  }, [editingPattern, currentLine, currentTrack, updatePattern]);

  useEffect(() => {
    if (isActive && playlistRef.current) {
      playlistRef.current.focus();
    }
  }, [isActive]);

  useEffect(() => {
    if (editingPattern !== '') {
      return;
    }

    if (playlist.length === 0) {
      if (currentLine !== 0) {
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

  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (!isActive) return;

    // Ctrl+ArrowUp / Ctrl+ArrowDown: move current line up/down
    if (!editingPattern && event.ctrlKey) {
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

    // If we're editing a pattern, handle pattern input
    if (editingPattern !== '') {
      if (key === 'ENTER' || key === 'ESCAPE') {
        event.preventDefault();
        if (key === 'ENTER') {
          finishEditingPattern();
        } else {
          setEditingPattern('');
        }
      } else if (key === 'BACKSPACE') {
        event.preventDefault();
        // If editing pattern has only 1 character, clear to '--' and exit editing
        if (editingPattern.length === 1) {
          updatePattern(currentLine, currentTrack, '--');
          setEditingPattern('');
        } else {
          setEditingPattern(prev => prev.slice(0, -1));
        }
      } else if (/^[0-9A-F]$/.test(key) && editingPattern.length < 2) {
        event.preventDefault();
        setEditingPattern(prev => prev + key);
      }
      return;
    }

    switch (key) {
      case 'ARROWUP':
        event.preventDefault();
        setCurrentLine(prev => {
          const next = Math.max(0, prev - 1);
          onPositionSelect(next);
          return next;
        });
        break;
      case 'ARROWDOWN':
        event.preventDefault();
        setCurrentLine(prev => {
          if (playlist.length === 0) {
            return prev;
          }
          const next = Math.min(playlist.length - 1, prev + 1);
          onPositionSelect(next);
          return next;
        });
        break;
      case 'ARROWLEFT':
        event.preventDefault();
        setCurrentTrack(prev => {
          if (prev === 'A') return 'C';
          if (prev === 'B') return 'A';
          return 'B'; // C -> B
        });
        break;
      case 'ARROWRIGHT':
        event.preventDefault();
        setCurrentTrack(prev => {
          if (prev === 'A') return 'B';
          if (prev === 'B') return 'C';
          return 'A'; // C -> A
        });
        break;
      case 'N':
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
        event.preventDefault();
        startEditingPattern(currentLine, currentTrack);
        if (key !== ' ') {
          setEditingPattern(key);
        }
        break;
      case 'DELETE':
      case 'BACKSPACE':
        event.preventDefault();
        updatePattern(currentLine, currentTrack, '--');
        break;
      case 'ENTER':
        event.preventDefault();
        startEditingPattern(currentLine, currentTrack);
        break;
    }
  }, [
    isActive,
    playlist.length,
    currentLine,
    currentTrack,
    editingPattern,
    startEditingPattern,
    finishEditingPattern,
    updatePattern,
    moveLine,
    onCreatePatternAt,
    onPositionSelect
  ]);

  const handleLineClick = useCallback((lineIndex: number) => {
    setCurrentLine(lineIndex);
    setActiveSection('playlist');
    onPositionSelect(lineIndex);
  }, [setActiveSection, onPositionSelect]);

  const handlePatternClick = useCallback((lineIndex: number, track: 'A' | 'B' | 'C') => {
    setCurrentLine(lineIndex);
    setCurrentTrack(track);
    setActiveSection('playlist');
    onPositionSelect(lineIndex);
  }, [setActiveSection, onPositionSelect]);

  const handleTrackHeaderClick = useCallback((track: 'A' | 'B' | 'C') => {
    setCurrentTrack(track);

    const section: NavigationSection =
      track === 'A' ? 'trackA' : track === 'B' ? 'trackB' : 'trackC';

    setActiveSection(section);
  }, [setActiveSection]);

  const handlePatternRightClick = useCallback((
    lineIndex: number,
    track: 'A' | 'B' | 'C',
    event: React.MouseEvent,
  ) => {
    event.preventDefault();
    event.stopPropagation();
    handlePatternClick(lineIndex, track);
    handleTrackHeaderClick(track);
  }, [handlePatternClick, handleTrackHeaderClick]);

  const getLineClass = useCallback((lineIndex: number) => {
    const classes = ['playlist-line'];
    if (lineIndex === currentLine && isActive) {
      classes.push('current');
    }
    if (lineIndex === currentPlaybackPosition) {
      classes.push('playback-position');
    }
    return classes.join(' ');
  }, [currentLine, isActive, currentPlaybackPosition]);

  const getPatternClass = useCallback((lineIndex: number, track: 'A' | 'B' | 'C') => {
    const classes = ['track-pattern'];
    if (lineIndex === currentLine && track === currentTrack && isActive) {
      classes.push('current-track');
    }
    return classes.join(' ');
  }, [currentLine, currentTrack, isActive]);

  return (
    <div
      ref={playlistRef}
      className={`playlist-panel ${isActive ? 'active' : ''}`}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onClick={() => setActiveSection('playlist')}
    >
      <div className="playlist-header">Playlist</div>

      <div className="playlist-content">
        <PlaylistHeader
          targetTrack={targetTrack}
          onTrackHeaderClick={handleTrackHeaderClick}
        />

        <div className="playlist-line-container" ref={linesContainerRef}>
          {playlist.map((entry, actualIndex) => {
            const isCurrentLine = actualIndex === currentLine;
            const isEditing = isCurrentLine && editingPattern !== '';

            return (
              <PlaylistLine
                key={actualIndex}
                index={actualIndex}
                entry={entry}
                lineClassName={getLineClass(actualIndex)}
                patternClassA={getPatternClass(actualIndex, 'A')}
                patternClassB={getPatternClass(actualIndex, 'B')}
                patternClassC={getPatternClass(actualIndex, 'C')}
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

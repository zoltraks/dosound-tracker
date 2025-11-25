import React, { useState, useRef, useEffect, useCallback } from 'react';
import type { NavigationSection } from '../constants/navigation';

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

  const finishEditingPattern = useCallback(() => {
    if (editingPattern.trim() === '') {
      updatePattern(currentLine, currentTrack, '--');
    } else {
      updatePattern(currentLine, currentTrack, editingPattern.toUpperCase().padStart(2, '0'));
    }
    setEditingPattern('');
    
    // Refocus the playlist container after editing completes
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
    if (!isActive) {
      return;
    }

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
  }, [currentPlaybackPosition, playlist.length, isActive, currentLine, editingPattern]);

  useEffect(() => {
    if (!isActive || !linesContainerRef.current) {
      return;
    }

    const container = linesContainerRef.current;
    const lineElements = container.querySelectorAll('.playlist-line') as NodeListOf<HTMLDivElement>;
    const target = lineElements[currentLine];
    if (target) {
      target.scrollIntoView({ block: 'nearest' });
    }
  }, [currentLine, isActive]);

  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (!isActive) return;

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
  }, [isActive, playlist.length, currentLine, currentTrack, editingPattern, startEditingPattern, finishEditingPattern, updatePattern]);

  const handleLineClick = useCallback((lineIndex: number) => {
    setCurrentLine(lineIndex);
    setActiveSection('playlist');
    onPositionSelect(lineIndex);
  }, [setActiveSection, onPositionSelect]);

  const handlePatternClick = useCallback((lineIndex: number, track: 'A' | 'B' | 'C') => {
    setCurrentLine(lineIndex);
    setCurrentTrack(track);
    onPositionSelect(lineIndex);
  }, [onPositionSelect]);

  const formatPatternDisplay = useCallback((patternId: string) => {
    if (patternId === '--') return '--';
    if (patternId.startsWith('^^')) return patternId;
    return patternId;
  }, []);

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
        <div className="playlist-header-row">
          <span className="line-number-header">Pos</span>
          <span className={`track-header ${targetTrack === 'A' ? 'target-track' : ''}`}>A</span>
          <span className={`track-header ${targetTrack === 'B' ? 'target-track' : ''}`}>B</span>
          <span className={`track-header ${targetTrack === 'C' ? 'target-track' : ''}`}>C</span>
        </div>
        
        <div className="playlist-lines" ref={linesContainerRef}>
          {playlist.map((entry, actualIndex) => {
            const isCurrentLine = actualIndex === currentLine;
            const isEditing = isCurrentLine && editingPattern !== '';
            
            return (
              <div
                key={actualIndex}
                className={getLineClass(actualIndex)}
                onClick={() => handleLineClick(actualIndex)}
              >
                <span className="line-number">
                  {actualIndex.toString(16).padStart(2, '0').toUpperCase()}
                </span>
                
                {/* Track A */}
                {isCurrentLine && currentTrack === 'A' && isEditing ? (
                  <input
                    type="text"
                    className="pattern-input"
                    value={editingPattern}
                    onChange={(e) => setEditingPattern(e.target.value.toUpperCase().slice(0, 2))}
                    onBlur={finishEditingPattern}
                    onKeyDown={(e) => {
                      const key = e.key.toUpperCase();
                      if (e.key === 'Enter') {
                        finishEditingPattern();
                      } else if (e.key === 'Escape') {
                        setEditingPattern('');
                      } else if (key === 'N') {
                        e.preventDefault();
                        setEditingPattern('');
                        onCreatePatternAt(actualIndex, 'A');
                      }
                    }}
                    autoFocus
                    maxLength={2}
                  />
                ) : (
                  <span 
                    className={getPatternClass(actualIndex, 'A')}
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePatternClick(actualIndex, 'A');
                    }}
                  >
                    {formatPatternDisplay(entry.trackA)}
                  </span>
                )}
                
                {/* Track B */}
                {isCurrentLine && currentTrack === 'B' && isEditing ? (
                  <input
                    type="text"
                    className="pattern-input"
                    value={editingPattern}
                    onChange={(e) => setEditingPattern(e.target.value.toUpperCase().slice(0, 2))}
                    onBlur={finishEditingPattern}
                    onKeyDown={(e) => {
                      const key = e.key.toUpperCase();
                      if (e.key === 'Enter') {
                        finishEditingPattern();
                      } else if (e.key === 'Escape') {
                        setEditingPattern('');
                      } else if (key === 'N') {
                        e.preventDefault();
                        setEditingPattern('');
                        onCreatePatternAt(actualIndex, 'B');
                      }
                    }}
                    autoFocus
                    maxLength={2}
                  />
                ) : (
                  <span 
                    className={getPatternClass(actualIndex, 'B')}
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePatternClick(actualIndex, 'B');
                    }}
                  >
                    {formatPatternDisplay(entry.trackB)}
                  </span>
                )}
                
                {/* Track C */}
                {isCurrentLine && currentTrack === 'C' && isEditing ? (
                  <input
                    type="text"
                    className="pattern-input"
                    value={editingPattern}
                    onChange={(e) => setEditingPattern(e.target.value.toUpperCase().slice(0, 2))}
                    onBlur={finishEditingPattern}
                    onKeyDown={(e) => {
                      const key = e.key.toUpperCase();
                      if (e.key === 'Enter') {
                        finishEditingPattern();
                      } else if (e.key === 'Escape') {
                        setEditingPattern('');
                      } else if (key === 'N') {
                        e.preventDefault();
                        setEditingPattern('');
                        onCreatePatternAt(actualIndex, 'C');
                      }
                    }}
                    autoFocus
                    maxLength={2}
                  />
                ) : (
                  <span 
                    className={getPatternClass(actualIndex, 'C')}
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePatternClick(actualIndex, 'C');
                    }}
                  >
                    {formatPatternDisplay(entry.trackC)}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Playlist footer intentionally left empty (no controls) */}
    </div>
  );
};

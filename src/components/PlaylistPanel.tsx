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
}

export const PlaylistPanel: React.FC<PlaylistPanelProps> = ({
  playlist,
  activeSection,
  setActiveSection
}) => {
  const [currentLine, setCurrentLine] = useState(0);
  const [scrollOffset, setScrollOffset] = useState(0);
  const playlistRef = useRef<HTMLDivElement>(null);
  const VISIBLE_LINES = 8;

  const isActive = activeSection === 'playlist';

  useEffect(() => {
    if (isActive && playlistRef.current) {
      playlistRef.current.focus();
    }
  }, [isActive]);

  useEffect(() => {
    // Auto-scroll to keep current line visible
    if (currentLine < scrollOffset) {
      setScrollOffset(currentLine);
    } else if (currentLine >= scrollOffset + VISIBLE_LINES) {
      setScrollOffset(currentLine - VISIBLE_LINES + 1);
    }
  }, [currentLine, scrollOffset]);

  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (!isActive) return;

    switch (event.key.toUpperCase()) {
      case 'ARROWUP':
        event.preventDefault();
        setCurrentLine(prev => Math.max(0, prev - 1));
        break;
      case 'ARROWDOWN':
        event.preventDefault();
        setCurrentLine(prev => Math.min(playlist.length - 1, prev + 1));
        break;
      case ' ':
        event.preventDefault();
        // Add new playlist entry
        break;
    }
  }, [isActive, playlist.length]);

  const handleLineClick = useCallback((lineIndex: number) => {
    setCurrentLine(lineIndex);
    setActiveSection('playlist');
  }, [setActiveSection]);

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
    return classes.join(' ');
  }, [currentLine, isActive]);

  const visiblePlaylist = playlist.slice(scrollOffset, scrollOffset + VISIBLE_LINES);

  return (
    <div 
      ref={playlistRef}
      className={`playlist-panel ${isActive ? 'active' : ''}`}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onClick={() => setActiveSection('playlist')}
    >
      <div className="playlist-header">Song Playlist</div>
      
      <div className="playlist-content">
        <div className="playlist-header-row">
          <span className="line-number-header">Pos</span>
          <span className="track-header">Track A</span>
          <span className="track-header">Track B</span>
          <span className="track-header">Track C</span>
        </div>
        
        <div className="playlist-lines">
          {visiblePlaylist.map((entry, index) => {
            const actualIndex = scrollOffset + index;
            return (
              <div
                key={actualIndex}
                className={getLineClass(actualIndex)}
                onClick={() => handleLineClick(actualIndex)}
              >
                <span className="line-number">
                  {actualIndex.toString(16).padStart(2, '0').toUpperCase()}
                </span>
                <span className="track-pattern">
                  {formatPatternDisplay(entry.trackA)}
                </span>
                <span className="track-pattern">
                  {formatPatternDisplay(entry.trackB)}
                </span>
                <span className="track-pattern">
                  {formatPatternDisplay(entry.trackC)}
                </span>
              </div>
            );
          })}
        </div>
      </div>
      
      <div className="playlist-footer">
        <div className="playlist-info">
          Line: {currentLine.toString(16).toUpperCase()} / {(playlist.length - 1).toString(16).toUpperCase()}
        </div>
        
        <div className="playlist-controls">
          <button 
            className="nav-btn"
            onClick={() => setCurrentLine(prev => Math.max(0, prev - 1))}
            disabled={currentLine === 0}
          >
            ↑
          </button>
          <button 
            className="nav-btn"
            onClick={() => setCurrentLine(prev => Math.min(playlist.length - 1, prev + 1))}
            disabled={currentLine >= playlist.length - 1}
          >
            ↓
          </button>
        </div>
      </div>
    </div>
  );
};

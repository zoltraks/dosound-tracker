import React, { useRef, useEffect, useCallback } from 'react';
import type { NavigationSection } from '../constants/navigation';
import type { Song } from '../synth/dosound/DosoundDriver';

interface SongInfoPanelProps {
  song: Song;
  activeSection: NavigationSection;
  setActiveSection: (section: NavigationSection) => void;
  onChange: (updates: Partial<Song>) => void;
}

export const SongInfoPanel: React.FC<SongInfoPanelProps> = ({
  song,
  activeSection,
  setActiveSection,
  onChange
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const isActive = activeSection === 'songInfo';

  useEffect(() => {
    if (isActive && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isActive]);

  const handleFieldChange = useCallback((field: keyof Song, value: string | number) => {
    onChange({ [field]: value });
  }, [onChange]);

  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (!isActive) return;

    if (event.key === 'Tab') {
      event.preventDefault();
      // Let navigation handle tab
      return;
    }
  }, [isActive]);

  return (
    <div 
      className={`song-info-panel ${isActive ? 'active' : ''}`}
      onClick={() => setActiveSection('songInfo')}
    >
      <div className="song-info-header">Song Information</div>
      
      <div className="song-info-content">
        <div className="info-field">
          <label>Title:</label>
          <input
            ref={inputRef}
            type="text"
            value={song.title}
            onChange={(e) => handleFieldChange('title', e.target.value)}
            onKeyDown={handleKeyDown}
            className="info-input"
          />
        </div>
        
        <div className="info-field">
          <label>Author:</label>
          <input
            type="text"
            value={song.author}
            onChange={(e) => handleFieldChange('author', e.target.value)}
            onKeyDown={handleKeyDown}
            className="info-input"
          />
        </div>
        
        <div className="info-field">
          <label>Year:</label>
          <input
            type="number"
            value={song.year}
            onChange={(e) => handleFieldChange('year', parseInt(e.target.value) || new Date().getFullYear())}
            onKeyDown={handleKeyDown}
            className="info-input"
            min="1980"
            max="2030"
          />
        </div>
        
        <div className="info-field">
          <label>Speed:</label>
          <input
            type="number"
            value={song.speed}
            onChange={(e) => handleFieldChange('speed', Math.max(2, parseInt(e.target.value) || 6))}
            onKeyDown={handleKeyDown}
            className="info-input"
            min="2"
            max="255"
          />
        </div>
      </div>
    </div>
  );
};

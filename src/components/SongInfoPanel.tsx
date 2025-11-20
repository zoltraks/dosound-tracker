import React, { useState, useRef, useEffect, useCallback } from 'react';
import type { NavigationSection } from '../constants/navigation';
import type { Song } from '../synth/SoundDriver';

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
  const titleRef = useRef<HTMLInputElement>(null);
  const authorRef = useRef<HTMLInputElement>(null);
  const yearRef = useRef<HTMLInputElement>(null);
  const speedRef = useRef<HTMLInputElement>(null);
  const lengthRef = useRef<HTMLInputElement>(null);
  const isActive = activeSection === 'songInfo';
  const [lastFocusedField, setLastFocusedField] = useState<'title' | 'author' | 'year' | 'speed' | 'length'>('title');

  useEffect(() => {
    if (!isActive) return;

    const fieldMap = {
      title: titleRef,
      author: authorRef,
      year: yearRef,
      speed: speedRef,
      length: lengthRef
    } as const;

    const targetRef = fieldMap[lastFocusedField] || titleRef;
    if (targetRef.current) {
      targetRef.current.focus();
    }
  }, [isActive, lastFocusedField]);

  const handleFieldChange = useCallback((field: keyof Song, value: string | number) => {
    onChange({ [field]: value });
  }, [onChange]);

  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (!isActive) return;

    const target = event.target as HTMLInputElement | null;

    if (event.key === 'Tab') {
      event.preventDefault();
      // Let navigation handle tab
      return;
    }

    if (!target) return;

    const fields = [titleRef.current, authorRef.current, yearRef.current, speedRef.current, lengthRef.current];
    const index = fields.findIndex((el) => el === target);

    if (index === -1) return;

    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      const delta = event.key === 'ArrowDown' ? 1 : -1;
      const nextIndex = (index + delta + fields.length) % fields.length;
      const next = fields[nextIndex];
      if (next) {
        next.focus();
      }
    }
  }, [isActive]);

  return (
    <div 
      className={`song-info-panel ${isActive ? 'active' : ''}`}
      onClick={() => setActiveSection('songInfo')}
    >
      <div className="song-info-header">Song</div>
      
      <div className="song-info-content">
        <div className="info-field">
          <label>Title:</label>
          <input
            ref={titleRef}
            type="text"
            value={song.title}
            onChange={(e) => handleFieldChange('title', e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => setLastFocusedField('title')}
            className="info-input"
          />
        </div>
        
        <div className="info-field">
          <label>Author:</label>
          <input
            ref={authorRef}
            type="text"
            value={song.author}
            onChange={(e) => handleFieldChange('author', e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => setLastFocusedField('author')}
            className="info-input"
          />
        </div>
        
        <div className="info-field">
          <label>Year:</label>
          <input
            ref={yearRef}
            type="number"
            value={song.year}
            onChange={(e) => handleFieldChange('year', parseInt(e.target.value) || new Date().getFullYear())}
            onKeyDown={handleKeyDown}
            onFocus={() => setLastFocusedField('year')}
            className="info-input"
            min="1980"
            max="2030"
          />
        </div>
        
        <div className="info-field">
          <label>Speed:</label>
          <input
            ref={speedRef}
            type="number"
            value={song.speed}
            onChange={(e) => handleFieldChange('speed', Math.max(2, parseInt(e.target.value) || 6))}
            onKeyDown={handleKeyDown}
            onFocus={() => setLastFocusedField('speed')}
            className="info-input"
            min="2"
            max="255"
          />
        </div>
        
        <div className="info-field">
          <label>Length:</label>
          <input
            ref={lengthRef}
            type="number"
            value={song.patternLength ?? 64}
            onChange={(e) => {
              const raw = parseInt(e.target.value, 10);
              const safe = Number.isFinite(raw) ? raw : 64;
              const clamped = Math.max(4, Math.min(256, safe));
              handleFieldChange('patternLength', clamped);
            }}
            onKeyDown={handleKeyDown}
            onFocus={() => setLastFocusedField('length')}
            className="info-input"
            min="4"
            max="256"
            placeholder="Pattern length"
          />
        </div>
      </div>
    </div>
  );
};

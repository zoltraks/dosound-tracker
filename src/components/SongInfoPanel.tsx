import React, { useState, useRef, useEffect, useCallback } from 'react';
import type { NavigationSection } from '../constants/navigation';
import type { Song } from '../synth/SoundDriver';
import NumberSpinner from './NumberSpinner';

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
  const loopRef = useRef<HTMLInputElement>(null);
  const isActive = activeSection === 'songInfo';
  const [lastFocusedField, setLastFocusedField] = useState<'title' | 'author' | 'year' | 'speed' | 'length' | 'loop'>('title');

  useEffect(() => {
    if (!isActive) return;

    const fieldMap = {
      title: titleRef,
      author: authorRef,
      year: yearRef,
      speed: speedRef,
      length: lengthRef,
      loop: loopRef
    } as const;

    const targetRef = fieldMap[lastFocusedField] || titleRef;
    if (targetRef.current) {
      targetRef.current.focus();
    }
  }, [isActive, lastFocusedField]);

  const handleFieldChange = useCallback((field: keyof Song, value: string | number | null) => {
    onChange({ [field]: value });
  }, [onChange]);

  const handleKeyDown = useCallback((event: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isActive) return;

    const target = event.target as HTMLInputElement | null;

    if (event.key === 'Tab') {
      event.preventDefault();
      // Let navigation handle tab
      return;
    }

    if (!target) return;

    const fields = [
      titleRef.current,
      authorRef.current,
      yearRef.current,
      speedRef.current,
      lengthRef.current,
      loopRef.current
    ];
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

  const handleSpeedChange = useCallback((next: number | null) => {
    if (typeof next !== 'number' || !Number.isFinite(next)) {
      return;
    }
    const base = next;
    const clamped = Math.max(2, base);
    const even = clamped & ~1; // enforce even speed (2,4,6,...)
    handleFieldChange('speed', even);
  }, [handleFieldChange]);

  const handleYearChange = useCallback((next: number | null) => {
    const fallback = new Date().getFullYear();
    const raw = typeof next === 'number' && Number.isFinite(next) ? next : fallback;
    const clamped = Math.max(1980, Math.min(2030, raw));
    handleFieldChange('year', clamped);
  }, [handleFieldChange]);

  const handleLengthChange = useCallback((next: number | null) => {
    const base = typeof next === 'number' && Number.isFinite(next) ? next : 64;
    const clamped = Math.max(4, Math.min(256, base));
    handleFieldChange('patternLength', clamped);
  }, [handleFieldChange]);

  const handleLoopChange = useCallback((next: number | null) => {
    if (typeof next !== 'number' || !Number.isFinite(next)) {
      handleFieldChange('loop', null);
      return;
    }
    const base = Math.floor(next as number);
    const maxPos = Math.max(0, song.playlist.length - 1);
    const clamped = Math.max(0, Math.min(maxPos, base));
    handleFieldChange('loop', clamped);
  }, [handleFieldChange, song.playlist.length]);

  const handleLoopInputKeyDown = useCallback((event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Backspace') {
      const input = event.currentTarget;
      const value = input.value || '';
      const selectionStart = input.selectionStart ?? 0;
      const selectionEnd = input.selectionEnd ?? 0;

      const deletingAll =
        value.length === 0 ||
        (selectionStart === 0 && selectionEnd === value.length) ||
        (value.length === 1 && selectionStart === 1 && selectionEnd === 1);

      if (deletingAll) {
        handleLoopChange(null);
      }
    }

    handleKeyDown(event);
  }, [handleKeyDown, handleLoopChange]);

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

        <div className="song-info-grid">
          <div className="song-info-column">
            <div className="info-field">
              <label>Year:</label>
              <NumberSpinner
                value={song.year}
                onChange={handleYearChange}
                min={1980}
                max={2030}
                step={1}
                ariaLabel="Song year"
                inputRef={yearRef}
                onInputKeyDown={handleKeyDown}
                onInputFocus={() => setLastFocusedField('year')}
              />
            </div>
            
            <div className="info-field">
              <label>Speed:</label>
              <NumberSpinner
                value={song.speed}
                onChange={handleSpeedChange}
                min={2}
                max={255}
                step={2}
                ariaLabel="Song speed"
                inputRef={speedRef}
                onInputKeyDown={handleKeyDown}
                onInputFocus={() => setLastFocusedField('speed')}
              />
            </div>
          </div>

          <div className="song-info-column song-info-column-right">
            <div className="info-field">
              <label>Length:</label>
              <NumberSpinner
                value={song.patternLength ?? 64}
                onChange={handleLengthChange}
                min={4}
                max={256}
                step={1}
                ariaLabel="Pattern length"
                inputRef={lengthRef}
                onInputKeyDown={handleKeyDown}
                onInputFocus={() => setLastFocusedField('length')}
              />
            </div>

            <div className="info-field">
              <label>Loop:</label>
              <NumberSpinner
                value={typeof song.loop === 'number' && Number.isFinite(song.loop) ? song.loop : null}
                onChange={handleLoopChange}
                min={0}
                max={Math.max(0, song.playlist.length - 1)}
                step={1}
                ariaLabel="Playlist loop position"
                inputRef={loopRef}
                onInputKeyDown={handleLoopInputKeyDown}
                onInputFocus={() => setLastFocusedField('loop')}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

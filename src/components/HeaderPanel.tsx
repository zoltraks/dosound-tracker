import React, { useRef, useEffect } from 'react';
import type { NavigationSection } from '../constants/navigation';

interface HeaderPanelProps {
  isDarkMode: boolean;
  onToggleTheme: () => void;
  title: string;
  currentOctave: number;
  onOctaveChange: (octave: number) => void;
  onShowAbout: () => void;
  activeSection: NavigationSection;
  setActiveSection: (section: NavigationSection) => void;
}

export const HeaderPanel: React.FC<HeaderPanelProps> = ({
  isDarkMode,
  onToggleTheme,
  title,
  currentOctave,
  onOctaveChange,
  onShowAbout,
  activeSection,
  setActiveSection
}) => {
  const octaveRef = useRef<HTMLDivElement | null>(null);
  const isOctaveActive = activeSection === 'octave';

  const handleOctaveKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (!isOctaveActive) {
      return;
    }

    const key = event.key;

    if (
      key === 'ArrowLeft' ||
      key === 'ArrowRight' ||
      key === 'ArrowUp' ||
      key === 'ArrowDown' ||
      key === ' '
    ) {
      event.preventDefault();
      event.stopPropagation();
    }

    if (key === ' ') {
      onOctaveChange(currentOctave);
      return;
    }

    let nextOctave = currentOctave;

    if (key === 'ArrowLeft' || key === 'ArrowDown') {
      nextOctave = Math.max(0, currentOctave - 1);
    } else if (key === 'ArrowRight' || key === 'ArrowUp') {
      nextOctave = Math.min(7, currentOctave + 1);
    } else {
      return;
    }

    if (nextOctave !== currentOctave) {
      onOctaveChange(nextOctave);
    }
  };

  useEffect(() => {
    if (isOctaveActive && octaveRef.current) {
      octaveRef.current.focus();
    }
  }, [isOctaveActive]);

  return (
    <header className="header-panel">
      <div className="header-left">
        <div className="logo" onClick={onShowAbout} title="About DOSOUND Tracker">🎶</div>
        <h1 className="title">DOSOUND Tracker</h1>
      </div>
      
      <div className="header-center">
        <span className="song-title">{title}</span>
      </div>
      
      <div className="header-right">
        {/* Octave Selection */}
        <div
          ref={octaveRef}
          className={`octave-selection ${isOctaveActive ? 'active' : ''}`}
          tabIndex={0}
          onKeyDown={handleOctaveKeyDown}
          onClick={() => setActiveSection('octave')}
        >
          {Array.from({ length: 8 }, (_, i) => (
            <button
              key={i}
              className={`octave-button ${currentOctave === i ? 'active' : ''}`}
              onClick={() => onOctaveChange(i)}
            >
              {i}
            </button>
          ))}
        </div>
        
        <button 
          className="theme-toggle"
          onClick={onToggleTheme}
          title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {isDarkMode ? '☀️' : '☾'}
        </button>
      </div>
    </header>
  );
};

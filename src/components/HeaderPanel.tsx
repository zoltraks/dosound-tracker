import React from 'react';

interface HeaderPanelProps {
  isDarkMode: boolean;
  onToggleTheme: () => void;
  title: string;
  currentOctave: number;
  onOctaveChange: (octave: number) => void;
}

export const HeaderPanel: React.FC<HeaderPanelProps> = ({
  isDarkMode,
  onToggleTheme,
  title,
  currentOctave,
  onOctaveChange
}) => {
  return (
    <header className="header-panel">
      <div className="header-left">
        <div className="logo">🎶</div>
        <h1 className="title">DOSOUND Tracker</h1>
      </div>
      
      <div className="header-center">
        <span className="song-title">{title}</span>
      </div>
      
      <div className="header-right">
        {/* Octave Selection */}
        <div className="octave-selection">
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

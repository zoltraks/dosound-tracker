import React, { useRef, useEffect } from 'react';
import type { NavigationSection } from '../constants/navigation';

interface CommandPanelProps {
  onNewSong: () => void;
  onLoadSong: () => void;
  onSaveSong: () => void;
  onOptimize: () => void;
  onRenumber: () => void;
  onNewInstrument: () => void;
  onSaveInstrument: () => void;
  onExportInstrument: () => void;
  onLoadInstrument: () => void;
  onDeleteInstrument: () => void;
  onCloneInstrument: () => void;
  onPlaySong: () => void;
  onStopSong: () => void;
  onPlayPattern: () => void;
  onStopPattern: () => void;
  onExportData: () => void;
  onExportVgm: () => void;
  onExportSound: () => void;
  onAddLine: () => void;
  onDeleteLine: () => void;
  onCloneLine: () => void;
  onDuplicateLine: () => void;
  onInsertStep: () => void;
  onDeleteStep: () => void;
  onReset: () => void;
  isPlaying: boolean;
  isPatternPlaying: boolean;
  isDosoundMode: boolean;
  onToggleDosoundMode: () => void;
  onPlayInstrument: () => void;
  onCopyTrack: () => void;
  onPasteTrack: () => void;
  onNewTrack: () => void;
  isComplexDumpMode: boolean;
  onToggleDumpMode: () => void;
  activeSection: NavigationSection;
  setActiveSection: (section: NavigationSection) => void;
  onTranspose: () => void;
  onExportDump: () => void;
}

export const CommandPanel: React.FC<CommandPanelProps> = ({
  onNewSong,
  onLoadSong,
  onSaveSong,
  onOptimize,
  onRenumber,
  onNewInstrument,
  onSaveInstrument,
  onExportInstrument,
  onLoadInstrument,
  onDeleteInstrument,
  onCloneInstrument,
  onPlaySong,
  onStopSong,
  onPlayPattern,
  onStopPattern,
  onExportData,
  onExportVgm,
  onExportSound,
  onAddLine,
  onDeleteLine,
  onCloneLine,
  onDuplicateLine,
  onInsertStep,
  onDeleteStep,
  onReset,
  isPlaying,
  isPatternPlaying,
  onPlayInstrument,
  onCopyTrack,
  onPasteTrack,
  onNewTrack,
  isComplexDumpMode,
  onToggleDumpMode,
  activeSection,
  setActiveSection,
  onTranspose,
  onExportDump
}) => {
  const panelRef = useRef<HTMLDivElement | null>(null);
  const isActive = activeSection === 'commands';

  const focusDefaultButton = () => {
    const panel = panelRef.current;
    if (!panel) {
      return;
    }

    const buttons = Array.from(panel.querySelectorAll<HTMLButtonElement>('.command-btn'));
    if (buttons.length === 0) {
      return;
    }

    const activeElement = document.activeElement as HTMLElement | null;
    const activeIsButton = activeElement && buttons.includes(activeElement as HTMLButtonElement);
    if (activeIsButton) {
      return;
    }

    const playButton = panel.querySelector<HTMLButtonElement>('.play-song-btn');
    if (playButton) {
      playButton.focus();
    } else {
      buttons[0].focus();
    }
  };

  useEffect(() => {
    if (isActive && panelRef.current) {
      panelRef.current.focus();
      focusDefaultButton();
    }
  }, [isActive]);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (!isActive) {
      return;
    }

    const key = event.key;
    if (
      key !== 'ArrowLeft' &&
      key !== 'ArrowRight' &&
      key !== 'ArrowUp' &&
      key !== 'ArrowDown'
    ) {
      return;
    }

    const panel = panelRef.current;
    if (!panel) {
      return;
    }

    const buttons = Array.from(panel.querySelectorAll<HTMLButtonElement>('.command-btn'));
    if (buttons.length === 0) {
      return;
    }

    const activeElement = document.activeElement as HTMLElement | null;
    let currentIndex = activeElement ? buttons.indexOf(activeElement as HTMLButtonElement) : -1;

    // If focus is on the panel container, move to the first button
    if (currentIndex === -1) {
      buttons[0].focus();
      event.preventDefault();
      event.stopPropagation();
      return;
    }

    let nextIndex = currentIndex;

    if (key === 'ArrowLeft') {
      nextIndex = (currentIndex - 1 + buttons.length) % buttons.length;
    } else if (key === 'ArrowRight') {
      nextIndex = (currentIndex + 1) % buttons.length;
    } else {
      const currentRect = buttons[currentIndex].getBoundingClientRect();
      const currentCenterX = currentRect.left + currentRect.width / 2;
      const currentCenterY = currentRect.top + currentRect.height / 2;

      let bestIndex = -1;
      let bestDistance = Number.POSITIVE_INFINITY;

      buttons.forEach((button, index) => {
        if (index === currentIndex) {
          return;
        }

        const rect = button.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        const isAbove = centerY < currentCenterY - 1;
        const isBelow = centerY > currentCenterY + 1;

        if (key === 'ArrowUp' && !isAbove) {
          return;
        }

        if (key === 'ArrowDown' && !isBelow) {
          return;
        }

        const dx = centerX - currentCenterX;
        const dy = centerY - currentCenterY;
        const distance = dx * dx + dy * dy;

        if (distance < bestDistance) {
          bestDistance = distance;
          bestIndex = index;
        }
      });

      if (bestIndex !== -1) {
        nextIndex = bestIndex;
      }
    }

    if (nextIndex !== currentIndex) {
      buttons[nextIndex].focus();
      event.preventDefault();
      event.stopPropagation();
    }
  };

  return (
    <div
      ref={panelRef}
      className={`command-panel ${isActive ? 'active' : ''}`}
      tabIndex={0}
      onFocus={event => {
        if (!isActive) {
          return;
        }

        if (event.target === panelRef.current) {
          focusDefaultButton();
        }
      }}
      onClick={() => setActiveSection('commands')}
      onKeyDown={handleKeyDown}
    >
      {/* Song Operations */}
      <div className="command-row">
        <button onClick={onNewSong} className="command-btn">NEW SONG</button>
        <button onClick={onLoadSong} className="command-btn">LOAD SONG</button>
        <button onClick={onSaveSong} className="command-btn">SAVE SONG</button>
        <button onClick={onOptimize} className="command-btn">OPTIMIZE</button>
        <button onClick={onRenumber} className="command-btn">RENUMBER</button>
        <button onClick={onAddLine} className="command-btn">ADD LINE</button>
        <button onClick={onDeleteLine} className="command-btn">DELETE LINE</button>
        <button onClick={onCloneLine} className="command-btn">CLONE LINE</button>
        <button onClick={onDuplicateLine} className="command-btn">DUPLICATE LINE</button>
        <button onClick={onReset} className="command-btn">RESET</button>
      </div>

      {/* Instrument Operations */}
      <div className="command-row">
        <button onClick={onNewInstrument} className="command-btn">NEW INST</button>
        <button onClick={onLoadInstrument} className="command-btn">LOAD INST</button>
        <button onClick={onSaveInstrument} className="command-btn">SAVE INST</button>
        <button onClick={onPlayInstrument} className="command-btn">PLAY INST</button>
        <button onClick={onCloneInstrument} className="command-btn">CLONE INST</button>
        <button onClick={onDeleteInstrument} className="command-btn">DELETE INST</button>
        <button onClick={onExportInstrument} className="command-btn">EXPORT INST</button>
      </div>

      {/* Pattern Operations */}
      <div className="command-row">
        <button onClick={onNewTrack} className="command-btn">NEW TRACK</button>
        <button onClick={onCopyTrack} className="command-btn">COPY TRACK</button>
        <button onClick={onPasteTrack} className="command-btn">PASTE TRACK</button>
        <button onClick={() => {}} className="command-btn">DELETE PATTERN</button>
        <button onClick={onTranspose} className="command-btn">TRANSPOSE</button>
        <button onClick={onInsertStep} className="command-btn">INSERT STEP</button>
        <button onClick={onDeleteStep} className="command-btn">DELETE STEP</button>
      </div>

      {/* Playback Operations */}
      <div className="command-row">
        <button 
          onClick={isPlaying && !isPatternPlaying ? onStopSong : onPlaySong} 
          className={`command-btn play-song-btn ${isPlaying && !isPatternPlaying ? 'playing' : ''}`}
        >
          {isPlaying && !isPatternPlaying ? 'STOP SONG' : 'PLAY SONG'}
        </button>
        <button 
          onClick={isPatternPlaying ? onStopPattern : onPlayPattern} 
          className={`command-btn ${isPatternPlaying ? 'playing' : ''}`}
        >
          {isPatternPlaying ? 'STOP PATTERN' : 'PLAY PATTERN'}
        </button>
        <button 
          onClick={onExportDump} 
          className="command-btn"
        >
          EXPORT DUMP
        </button>
        <button 
          onClick={onToggleDumpMode} 
          className={`command-btn ${isComplexDumpMode ? 'active' : ''}`}
        >
          {isComplexDumpMode ? 'COMPLEX DUMP' : 'SIMPLE DUMP'}
        </button>
        <button onClick={onExportData} className="command-btn">EXPORT DATA</button>
        <button onClick={onExportVgm} className="command-btn">EXPORT VGM</button>
        <button onClick={onExportSound} className="command-btn">EXPORT SOUND</button>
      </div>
    </div>
  );
};

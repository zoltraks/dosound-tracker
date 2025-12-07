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
  onLoadInstrument: () => void;
  onDeleteInstrument: () => void;
  onCloneInstrument: () => void;
  onPlaySong: () => void;
  onPlayPattern: () => void;
  onStop: () => void;
  onOpenExport: () => void;
  onAddLine: () => void;
  onDeleteLine: () => void;
  onCloneLine: () => void;
  onDuplicateLine: () => void;
  onInsertStep: () => void;
  onDeleteStep: () => void;
  onReset: () => void;
  isDebugMode: boolean;
  onToggleDebug: () => void;
  isPlaying: boolean;
  isPatternPlaying: boolean;
  onPlayInstrument: () => void;
  onCopyTrack: () => void;
  onPasteTrack: () => void;
  onNewTrack: () => void;
  onDeleteTrack: () => void;
  activeSection: NavigationSection;
  setActiveSection: (section: NavigationSection) => void;
  onTranspose: () => void;
  midiInputEnabled: boolean;
  midiOutputEnabled: boolean;
  onShowMidi: () => void;
}

export const CommandPanel: React.FC<CommandPanelProps> = ({
  onNewSong,
  onLoadSong,
  onSaveSong,
  onOptimize,
  onRenumber,
  onNewInstrument,
  onSaveInstrument,
  onLoadInstrument,
  onDeleteInstrument,
  onCloneInstrument,
  onPlaySong,
  onPlayPattern,
  onStop,
  onOpenExport,
  onAddLine,
  onDeleteLine,
  onCloneLine,
  onDuplicateLine,
  onInsertStep,
  onDeleteStep,
  onReset,
  isDebugMode,
  onToggleDebug,
  isPlaying,
  isPatternPlaying,
  onPlayInstrument,
  onCopyTrack,
  onPasteTrack,
  onNewTrack,
  onDeleteTrack,
  activeSection,
  setActiveSection,
  onTranspose,
  midiInputEnabled,
  midiOutputEnabled,
  onShowMidi
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

  const getMidiButtonClassName = () => {
    const classes = ['command-btn', 'midi-btn'];

    if (midiInputEnabled && midiOutputEnabled) {
      classes.push('midi-both-enabled');
    } else if (midiInputEnabled) {
      classes.push('midi-input-enabled');
    } else if (midiOutputEnabled) {
      classes.push('midi-output-enabled');
    } else {
      classes.push('midi-disabled');
    }

    return classes.join(' ');
  };

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
      {/* Row 1: Playback and utilities */}
      <div className="command-row">
        <button
          onClick={isPlaying && !isPatternPlaying ? onStop : onPlaySong}
          className={`command-btn play-song-btn ${isPlaying && !isPatternPlaying ? 'playing' : ''}`}
        >
          PLAY SONG
        </button>
        <button
          onClick={isPatternPlaying ? onStop : onPlayPattern}
          className={`command-btn play-pattern-btn ${isPatternPlaying ? 'playing' : ''}`}
        >
          PLAY PATTERN
        </button>
        <button
          onClick={onStop}
          className={`command-btn stop-btn ${isPlaying ? 'playing' : ''}`}
        >
          STOP
        </button>
        <button onClick={onOptimize} className="command-btn">OPTIMIZE</button>
        <button onClick={onRenumber} className="command-btn">RENUMBER</button>
        <button onClick={onTranspose} className="command-btn">TRANSPOSE</button>
        <button
          onClick={event => {
            event.stopPropagation();
            onOpenExport();
          }}
          className="command-btn"
        >
          EXPORT
        </button>
        <button
          onClick={event => {
            event.stopPropagation();
            onShowMidi();
          }}
          className={getMidiButtonClassName()}
        >
          MIDI
        </button>
        <button
          onClick={onToggleDebug}
          className={`command-btn debug-btn ${isDebugMode ? 'active' : ''}`}
        >
          BUG
        </button>
        <button onClick={onReset} className="command-btn reset-btn">RESET</button>
      </div>

      {/* Row 2: Playlist and track commands */}
      <div className="command-row">
        <button onClick={onNewSong} className="command-btn">NEW SONG</button>
        <button onClick={onLoadSong} className="command-btn">LOAD SONG</button>
        <button onClick={onSaveSong} className="command-btn">SAVE SONG</button>
        <button onClick={onAddLine} className="command-btn">ADD LINE</button>
        <button onClick={onCloneLine} className="command-btn">CLONE LINE</button>
        <button onClick={onDuplicateLine} className="command-btn">DUPLICATE LINE</button>
        <button onClick={onNewTrack} className="command-btn">ADD TRACK</button>
        <button onClick={onCopyTrack} className="command-btn">COPY TRACK</button>
        <button onClick={onPasteTrack} className="command-btn">PASTE TRACK</button>
        <button
          onClick={event => {
            event.stopPropagation();
            onInsertStep();
          }}
          className="command-btn"
        >
          INSERT STEP
        </button>
        <button
          onClick={event => {
            event.stopPropagation();
            onDeleteStep();
          }}
          className="command-btn"
        >
          DELETE STEP
        </button>
      </div>

      {/* Row 3: Instrument and delete commands */}
      <div className="command-row">
        <button onClick={onNewInstrument} className="command-btn">ADD INST</button>
        <button onClick={onLoadInstrument} className="command-btn">LOAD INST</button>
        <button onClick={onSaveInstrument} className="command-btn">SAVE INST</button>
        <button onClick={onPlayInstrument} className="command-btn">PLAY INST</button>
        <button onClick={onCloneInstrument} className="command-btn">CLONE INST</button>
        <button onClick={onDeleteInstrument} className="command-btn">DELETE INST</button>
        <button onClick={onDeleteTrack} className="command-btn">DELETE TRACK</button>
        <button onClick={onDeleteLine} className="command-btn">DELETE LINE</button>
      </div>
    </div>
  );
}

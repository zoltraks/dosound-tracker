import React, { useRef, useEffect } from 'react';
import type { NavigationSection } from '../constants/navigation.ts';

// Section-preserving command buttons: the press keeps DOM focus and the
// click never bubbles to the container's section activation.
const keepSectionButtonProps = (handler: () => void) => ({
  onMouseDown: (event: React.MouseEvent) => event.preventDefault(),
  onClick: (event: React.MouseEvent) => {
    event.stopPropagation();
    handler();
  },
});

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
  onPlayLine: () => void;
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
  isLinePlaying: boolean;
  onPlayInstrument: () => void;
  onCopyTrack: () => void;
  onPasteTrack: () => void;
  onNewTrack: () => void;
  onCloneTrack: () => void;
  onDeleteTrack: () => void;
  activeSection: NavigationSection;
  setActiveSection: (section: NavigationSection) => void;
  onTranspose: () => void;
  midiInputEnabled: boolean;
  midiOutputEnabled: boolean;
  onShowMidi: () => void;
  onPickInstrument: () => void;
  onDemoSong: () => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  isMobileCollapsed: boolean;
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
  onPlayLine,
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
  isLinePlaying,
  onPlayInstrument,
  onCopyTrack,
  onPasteTrack,
  onNewTrack,
  onCloneTrack,
  onDeleteTrack,
  activeSection,
  setActiveSection,
  onTranspose,
  midiInputEnabled,
  midiOutputEnabled,
  onShowMidi,
  onPickInstrument,
  onDemoSong,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  isMobileCollapsed,
}) => {
  const panelRef = useRef<HTMLDivElement | null>(null);
  const isActive = activeSection === 'commands';

  const focusDefaultButton = () => {
    const panel = panelRef.current;
    if (!panel) {
      return;
    }

    const buttons = Array.from(panel.querySelectorAll<HTMLButtonElement>('.command-button'));
    if (buttons.length === 0) {
      return;
    }

    const activeElement = document.activeElement as HTMLElement | null;
    const activeIsButton = activeElement && buttons.includes(activeElement as HTMLButtonElement);
    if (activeIsButton) {
      return;
    }

    const playButton = panel.querySelector<HTMLButtonElement>('.play-song-button');
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
    const classes = ['command-button', 'midi-button'];

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
    if (key !== 'ArrowLeft' && key !== 'ArrowRight' && key !== 'ArrowUp' && key !== 'ArrowDown') {
      return;
    }

    const panel = panelRef.current;
    if (!panel) {
      return;
    }

    const buttons = Array.from(panel.querySelectorAll<HTMLButtonElement>('.command-button'));
    if (buttons.length === 0) {
      return;
    }

    const activeElement = document.activeElement as HTMLElement | null;
    const currentIndex = activeElement ? buttons.indexOf(activeElement as HTMLButtonElement) : -1;

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
    <div className="command-panel-container">
      <div
        ref={panelRef}
        className={`command-panel ${isActive ? 'active' : ''}`}
        role="region"
        aria-label="Commands"
        tabIndex={0}
        onFocus={(event) => {
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
        {isMobileCollapsed ? (
          <div className="command-row">
            <button
              onClick={isPlaying && !isLinePlaying ? onStop : onPlaySong}
              className={`command-button play-song-button ${isPlaying && !isLinePlaying ? 'playing' : ''}`}
            >
              PLAY
            </button>
            <button onClick={onDemoSong} className="command-button demo-song-button">
              DEMO
            </button>
            <button
              onClick={onStop}
              className={`command-button stop-button ${isPlaying ? 'playing' : ''}`}
            >
              STOP
            </button>
          </div>
        ) : (
          <>
            <div className="command-row">
              <button
                onClick={isPlaying && !isLinePlaying ? onStop : onPlaySong}
                className={`command-button play-song-button ${isPlaying && !isLinePlaying ? 'playing' : ''}`}
              >
                PLAY SONG
              </button>
              <button
                onClick={isLinePlaying ? onStop : onPlayLine}
                className={`command-button play-line-button ${isLinePlaying ? 'playing' : ''}`}
              >
                PLAY LINE
              </button>
              <button
                onClick={onStop}
                className={`command-button stop-button ${isPlaying ? 'playing' : ''}`}
              >
                STOP
              </button>
              <button onClick={onNewSong} className="command-button new-song-button">
                NEW SONG
              </button>
              <button onClick={onLoadSong} className="command-button load-song-button">
                LOAD SONG
              </button>
              <button onClick={onSaveSong} className="command-button save-song-button">
                SAVE SONG
              </button>
              <button onClick={onOptimize} className="command-button">
                OPTIMIZE
              </button>
              <button onClick={onRenumber} className="command-button">
                RENUMBER
              </button>
              <button onClick={onTranspose} className="command-button">
                TRANSPOSE
              </button>
              <button
                onClick={(event) => {
                  event.stopPropagation();
                  onShowMidi();
                }}
                className={getMidiButtonClassName()}
              >
                MIDI
              </button>
              <button
                onClick={onToggleDebug}
                className={`command-button debug-button ${isDebugMode ? 'active' : ''}`}
              >
                BUG
              </button>
              <button onClick={onReset} className="command-button reset-button">
                RESET
              </button>
            </div>

            <div className="command-row">
              <button {...keepSectionButtonProps(onAddLine)} className="command-button">
                ADD LINE
              </button>
              <button {...keepSectionButtonProps(onDuplicateLine)} className="command-button">
                DUPLICATE LINE
              </button>
              <button {...keepSectionButtonProps(onCloneLine)} className="command-button">
                CLONE LINE
              </button>
              <button {...keepSectionButtonProps(onDeleteLine)} className="command-button">
                DELETE LINE
              </button>
              <button onClick={onNewTrack} className="command-button">
                ADD TRACK
              </button>
              <button onClick={onCloneTrack} className="command-button">
                CLONE TRACK
              </button>
              <button onClick={onCopyTrack} className="command-button">
                COPY TRACK
              </button>
              <button onClick={onPasteTrack} className="command-button">
                PASTE TRACK
              </button>
              <button onClick={onDeleteTrack} className="command-button">
                DELETE TRACK
              </button>
              <button
                onClick={(event) => {
                  event.stopPropagation();
                  onInsertStep();
                }}
                className="command-button"
              >
                INSERT STEP
              </button>
              <button
                onClick={(event) => {
                  event.stopPropagation();
                  onDeleteStep();
                }}
                className="command-button"
              >
                DELETE STEP
              </button>
            </div>

            <div className="command-row">
              <button onClick={onUndo} disabled={!canUndo} className="command-button undo-button">
                UNDO
              </button>
              <button onClick={onRedo} disabled={!canRedo} className="command-button redo-button">
                REDO
              </button>
              <button onClick={onNewInstrument} className="command-button">
                ADD INST
              </button>
              <button onClick={onLoadInstrument} className="command-button">
                LOAD INST
              </button>
              <button onClick={onSaveInstrument} className="command-button">
                SAVE INST
              </button>
              <button onClick={onPlayInstrument} className="command-button">
                PLAY INST
              </button>
              <button onClick={onCloneInstrument} className="command-button">
                CLONE INST
              </button>
              <button onClick={onDeleteInstrument} className="command-button">
                DELETE INST
              </button>
              <button onClick={onPickInstrument} className="command-button pick-inst-button">
                PICK INST
              </button>
              <button onClick={onDemoSong} className="command-button demo-song-button">
                DEMO SONG
              </button>
              <button
                onClick={(event) => {
                  event.stopPropagation();
                  onOpenExport();
                }}
                className="command-button export-button"
              >
                EXPORT
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

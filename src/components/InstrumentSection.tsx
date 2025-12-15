/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useRef, useEffect, useCallback } from 'react';
import type { NavigationSection } from '../constants/navigation';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { MAX_INSTRUMENTS, ENVELOPE_LENGTH } from '../constants/music';
import type { Instrument } from '../synth/SoundDriver';
import { isInstrumentEmpty } from '../utils/instrument';
import colorModeDark from '../assets/svg/color-mode-dark.svg';
import colorModeLight from '../assets/svg/color-mode-light.svg';

interface InstrumentPanelProps {
  instruments: Instrument[];
  currentInstrument: Instrument;
  activeSection: NavigationSection;
  setActiveSection: (section: NavigationSection) => void;
  onSelectInstrument: (instrument: Instrument) => void;
  onRenameInstrument: (name: string) => void;
  onMoveInstrument: (index: number, direction: 'up' | 'down') => void;
  onOpenInstrumentMidi: (instrument: Instrument) => void;
  onOpenInstrumentColor: (instrument: Instrument) => void;
  focusRevision: number;
}

export const InstrumentPanel: React.FC<InstrumentPanelProps> = ({
  instruments,
  currentInstrument,
  activeSection,
  setActiveSection,
  onSelectInstrument,
  onRenameInstrument,
  onMoveInstrument,
  onOpenInstrumentMidi,
  onOpenInstrumentColor,
  focusRevision
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);
  const nameInputRef = useRef<HTMLInputElement | null>(null);
  const itemsContainerRef = useRef<HTMLDivElement | null>(null);

  const isActive = activeSection === 'instrumentList';

  useEffect(() => {
    // Find current instrument index
    const index = instruments.findIndex(inst => inst.id === currentInstrument.id);
    if (index !== -1) {
      setCurrentIndex(index);
    }
  }, [currentInstrument, instruments]);

  useEffect(() => {
    if (isActive && listRef.current) {
      listRef.current.focus();
    }
  }, [isActive, focusRevision]);

  useEffect(() => {
    if (!isActive || !itemsContainerRef.current) {
      return;
    }

    const container = itemsContainerRef.current;
    const itemElements = container.querySelectorAll('.instrument-item') as NodeListOf<HTMLDivElement>;
    const target = itemElements[currentIndex];
    if (target) {
      target.scrollIntoView({ block: 'nearest' });
    }
  }, [currentIndex, isActive]);

  const visibleSlotCount = (() => {
    let lastIndex = -1;

    for (let i = 0; i < instruments.length; i++) {
      const inst = instruments[i];
      if (inst && !isInstrumentEmpty(inst)) {
        lastIndex = i;
      }
    }

    if (lastIndex < 0 && instruments.length > 0) {
      lastIndex = instruments.length - 1;
    }

    if (lastIndex < currentIndex) {
      lastIndex = currentIndex;
    }

    if (lastIndex < 0) {
      return 1;
    }

    const count = lastIndex + 1;
    return Math.max(1, Math.min(MAX_INSTRUMENTS, count));
  })();

  const getInstrumentForSlot = useCallback((slotIndex: number): Instrument => {
    const existing = instruments[slotIndex];
    if (existing) {
      return existing;
    }

    const slotId = slotIndex.toString(16).padStart(2, '0').toUpperCase();

    return {
      id: slotId,
      name: '',
      volume: Array(ENVELOPE_LENGTH).fill(0),
      shift: Array(ENVELOPE_LENGTH).fill(0),
      pitch: Array(ENVELOPE_LENGTH).fill(0),
      noise: Array(ENVELOPE_LENGTH).fill(0),
      mode: Array(ENVELOPE_LENGTH).fill(0)
    };
  }, [instruments]);

  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (!isActive) return;

    const target = event.target as HTMLElement | null;
    if (target && target.tagName === 'INPUT') {
      return;
    }

    // Ctrl+ArrowUp / Ctrl+ArrowDown: move current instrument up/down
    if (event.ctrlKey) {
      if (event.key === 'ArrowUp') {
        event.preventDefault();
        if (currentIndex > 0 && currentIndex < instruments.length && instruments[currentIndex]) {
          onMoveInstrument(currentIndex, 'up');
        }
        return;
      }
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        if (currentIndex < instruments.length - 1 && instruments[currentIndex]) {
          onMoveInstrument(currentIndex, 'down');
        }
        return;
      }
      if (event.key.toUpperCase() === 'M') {
        event.preventDefault();
        const instrument = instruments[currentIndex];
        if (instrument) {
          onOpenInstrumentMidi(instrument);
        }
        return;
      }
    }

    switch (event.key.toUpperCase()) {
      case 'ENTER':
        event.preventDefault();
        if (nameInputRef.current) {
          nameInputRef.current.focus();
          nameInputRef.current.select();
        }
        break;
      case 'ARROWUP':
        event.preventDefault();
        {
          const newIndex = Math.max(0, currentIndex - 1);
          setCurrentIndex(newIndex);
          onSelectInstrument(getInstrumentForSlot(newIndex));
        }
        break;
      case 'ARROWDOWN':
        event.preventDefault();
        {
          const newIndex = Math.min(visibleSlotCount - 1, currentIndex + 1);
          setCurrentIndex(newIndex);
          onSelectInstrument(getInstrumentForSlot(newIndex));
        }
        break;
    }
  }, [
    isActive,
    currentIndex,
    instruments.length,
    visibleSlotCount,
    getInstrumentForSlot,
    onSelectInstrument,
    onMoveInstrument
  ]);

  const handleInstrumentClick = useCallback((slotIndex: number) => {
    setCurrentIndex(slotIndex);
    onSelectInstrument(getInstrumentForSlot(slotIndex));
    setActiveSection('instrumentList');
  }, [onSelectInstrument, setActiveSection, getInstrumentForSlot]);

  const getItemClass = useCallback((index: number) => {
    const classes = ['instrument-item'];
    if (index === currentIndex) {
      classes.push('current');
    }
    if (isActive && index === currentIndex) {
      classes.push('focused');
    }
    return classes.join(' ');
  }, [currentIndex, isActive]);

  return (
    <div
      ref={listRef}
      className={`instrument-panel ${isActive ? 'active' : ''}`}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onClick={() => setActiveSection('instrumentList')}
    >
      <div className="instrument-list-header">Instrument</div>

      <div className="instrument-list-content">
        <div className="instrument-item-container" ref={itemsContainerRef}>
          {Array.from({ length: visibleSlotCount }, (_, slotIndex) => {
            const instrument = instruments[slotIndex];
            const isCurrent = slotIndex === currentIndex;
            const midi = instrument && instrument.midi;
            const hasMidiChannel =
              !!midi && typeof midi.channel === 'number' && Number.isFinite(midi.channel);
            const hasMidiProgram =
              !!midi && typeof midi.program === 'number' && Number.isFinite(midi.program);
            const isMidiEnabled = hasMidiChannel || hasMidiProgram;

            const midiButtonClassNames = ['instrument-midi-btn'];
            midiButtonClassNames.push(isMidiEnabled ? 'instrument-midi-enabled' : 'instrument-midi-disabled');
            const displayName =
              isCurrent
                ? currentInstrument.name
                : instrument && instrument.name
                  ? instrument.name
                  : '';

            return (
              <div
                key={slotIndex}
                className={`${getItemClass(slotIndex)}${instrument && instrument.color ? ' instrument-item-colored' : ''}`.trim()}
                style={instrument && instrument.color ? ({ ['--instrument-color' as string]: instrument.color } as React.CSSProperties) : undefined}
                onClick={() => handleInstrumentClick(slotIndex)}
              >
                <span className="instrument-number">
                  {slotIndex.toString(16).padStart(2, '0').toUpperCase()}
                </span>
                <span className="instrument-name">
                  {isCurrent ? (
                    <input
                      ref={nameInputRef}
                      type="text"
                      className="instrument-name-input"
                      value={displayName}
                      onChange={(e) => onRenameInstrument(e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          e.stopPropagation();
                          if (listRef.current) {
                            listRef.current.focus();
                          }
                        }
                      }}
                    />
                  ) : (
                    displayName || '...'
                  )}
                </span>
                <div
                  className="instrument-actions"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    type="button"
                    className="instrument-color-btn"
                    onClick={() => {
                      const instForSlot = getInstrumentForSlot(slotIndex);
                      handleInstrumentClick(slotIndex);
                      onOpenInstrumentColor(instForSlot);
                    }}
                    aria-label="Set instrument color"
                    disabled={!instrument}
                  >
                    <img
                      src={colorModeDark}
                      className="instrument-color-icon instrument-color-icon-dark"
                      alt=""
                    />
                    <img
                      src={colorModeLight}
                      className="instrument-color-icon instrument-color-icon-light"
                      alt=""
                    />
                  </button>
                  <button
                    type="button"
                    className={midiButtonClassNames.join(' ')}
                    onClick={() => {
                      const instForSlot = getInstrumentForSlot(slotIndex);
                      handleInstrumentClick(slotIndex);
                      onOpenInstrumentMidi(instForSlot);
                    }}
                    aria-label="Configure MIDI output for instrument"
                    disabled={!instrument}
                  >
                    MIDI
                  </button>
                  <div className="playlist-move-buttons">
                  <button
                    type="button"
                    onClick={(event) => {
                      onMoveInstrument(slotIndex, 'down');
                      event.currentTarget.blur();
                      if (listRef.current) {
                        listRef.current.focus();
                      }
                    }}
                    aria-label="Move instrument down"
                    disabled={!instrument || slotIndex >= instruments.length - 1}
                  >
                    <ChevronDown className="h-3 w-3 rotate-90" />
                  </button>
                  <button
                    type="button"
                    onClick={(event) => {
                      onMoveInstrument(slotIndex, 'up');
                      event.currentTarget.blur();
                      if (listRef.current) {
                        listRef.current.focus();
                      }
                    }}
                    aria-label="Move instrument up"
                    disabled={!instrument || slotIndex === 0}
                  >
                    <ChevronUp className="h-3 w-3 rotate-90" />
                  </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

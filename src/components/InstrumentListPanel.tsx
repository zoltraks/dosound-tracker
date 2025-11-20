import React, { useState, useRef, useEffect, useCallback } from 'react';
import type { NavigationSection } from '../constants/navigation';
import { MAX_INSTRUMENTS, ENVELOPE_LENGTH } from '../constants/music';
import type { Instrument } from '../synth/SoundDriver';

interface InstrumentListPanelProps {
  instruments: Instrument[];
  currentInstrument: Instrument;
  activeSection: NavigationSection;
  setActiveSection: (section: NavigationSection) => void;
  onSelectInstrument: (instrument: Instrument) => void;
  onRenameInstrument: (name: string) => void;
}

export const InstrumentListPanel: React.FC<InstrumentListPanelProps> = ({
  instruments,
  currentInstrument,
  activeSection,
  setActiveSection,
  onSelectInstrument,
  onRenameInstrument
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
  }, [isActive]);

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

  const getInstrumentForSlot = useCallback((slotIndex: number): Instrument => {
    const existing = instruments[slotIndex];
    if (existing) {
      return existing;
    }

    const slotId = slotIndex.toString(16).padStart(2, '0').toUpperCase();

    return {
      id: slotId,
      name: '',
      volumeEnvelope: Array(ENVELOPE_LENGTH).fill(0),
      arpeggioEnvelope: Array(ENVELOPE_LENGTH).fill(0),
      pitchEnvelope: Array(ENVELOPE_LENGTH).fill(0),
      noiseEnvelope: Array(ENVELOPE_LENGTH).fill(0),
      modeEnvelope: Array(ENVELOPE_LENGTH).fill(0)
    };
  }, [instruments]);

  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (!isActive) return;

    const target = event.target as HTMLElement | null;
    if (target && target.tagName === 'INPUT') {
      return;
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
          const newIndex = Math.min(MAX_INSTRUMENTS - 1, currentIndex + 1);
          setCurrentIndex(newIndex);
          onSelectInstrument(getInstrumentForSlot(newIndex));
        }
        break;
    }
  }, [isActive, getInstrumentForSlot, onSelectInstrument, currentIndex]);

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
      className={`instrument-list-panel ${isActive ? 'active' : ''}`}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onClick={() => setActiveSection('instrumentList')}
    >
      <div className="instrument-list-header">Instrument</div>

      <div className="instrument-list-content">
        <div className="instrument-header-row">
          <span className="instrument-id-header">ID</span>
          <span className="instrument-name-header">Name</span>
        </div>

        <div className="instrument-items" ref={itemsContainerRef}>
          {Array.from({ length: MAX_INSTRUMENTS }, (_, slotIndex) => {
            const instrument = instruments[slotIndex];
            const isCurrent = slotIndex === currentIndex;
            const displayName =
              isCurrent
                ? currentInstrument.name
                : instrument && instrument.name
                  ? instrument.name
                  : '';

            return (
              <div
                key={slotIndex}
                className={getItemClass(slotIndex)}
                onClick={() => handleInstrumentClick(slotIndex)}
              >
                <span className="instrument-id">
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
              </div>
            );
          })}
        </div>
      </div>

      <div className="instrument-list-footer">
        <div className="instrument-info">
          <span>
            Current: {currentInstrument.id} {currentInstrument.name}
          </span>
        </div>

        <div className="instrument-controls">
          <button
            className="nav-btn"
            onClick={() => {
              const newIndex = Math.max(0, currentIndex - 1);
              setCurrentIndex(newIndex);
              onSelectInstrument(getInstrumentForSlot(newIndex));
            }}
            disabled={currentIndex === 0}
          >
            ↑
          </button>
          <button
            className="nav-btn"
            onClick={() => {
              const newIndex = Math.min(MAX_INSTRUMENTS - 1, currentIndex + 1);
              setCurrentIndex(newIndex);
              onSelectInstrument(getInstrumentForSlot(newIndex));
            }}
            disabled={currentIndex >= MAX_INSTRUMENTS - 1}
          >
            ↓
          </button>
        </div>
      </div>
    </div>
  );
};

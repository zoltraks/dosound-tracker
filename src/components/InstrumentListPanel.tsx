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
  const [scrollOffset, setScrollOffset] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);
  const VISIBLE_ITEMS = 8;

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
    // Auto-scroll to keep current instrument visible
    if (currentIndex < scrollOffset) {
      setScrollOffset(currentIndex);
    } else if (currentIndex >= scrollOffset + VISIBLE_ITEMS) {
      setScrollOffset(currentIndex - VISIBLE_ITEMS + 1);
    }
  }, [currentIndex, scrollOffset]);

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

    switch (event.key.toUpperCase()) {
      case 'ARROWUP':
        event.preventDefault();
        setCurrentIndex(prev => {
          const newIndex = Math.max(0, prev - 1);
          onSelectInstrument(getInstrumentForSlot(newIndex));
          return newIndex;
        });
        break;
      case 'ARROWDOWN':
        event.preventDefault();
        setCurrentIndex(prev => {
          const newIndex = Math.min(MAX_INSTRUMENTS - 1, prev + 1);
          onSelectInstrument(getInstrumentForSlot(newIndex));
          return newIndex;
        });
        break;
    }
  }, [isActive, getInstrumentForSlot, onSelectInstrument]);

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

  const visibleSlots = Array.from({ length: VISIBLE_ITEMS }, (_, index) => scrollOffset + index)
    .filter(index => index >= 0 && index < MAX_INSTRUMENTS);

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
        
        <div className="instrument-items">
          {visibleSlots.map((slotIndex) => {
            const instrument = instruments[slotIndex];
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
                  {instrument && instrument.name ? instrument.name : '...'}
                </span>
              </div>
            );
          })}
        </div>
      </div>
      
      <div className="instrument-list-footer">
        <div className="instrument-info">
          <span>Current: {currentInstrument.id}</span>
          <input
            type="text"
            className="instrument-name-input"
            value={currentInstrument.name}
            onChange={(e) => onRenameInstrument(e.target.value)}
          />
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

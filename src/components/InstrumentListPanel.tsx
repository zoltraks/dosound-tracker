import React, { useState, useRef, useEffect, useCallback } from 'react';
import type { NavigationSection } from '../constants/navigation';
import type { Instrument } from '../synth/dosound/DosoundDriver';

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

  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (!isActive) return;

    switch (event.key.toUpperCase()) {
      case 'ARROWUP':
        event.preventDefault();
        setCurrentIndex(prev => {
          const newIndex = Math.max(0, prev - 1);
          if (instruments[newIndex]) {
            onSelectInstrument(instruments[newIndex]);
          }
          return newIndex;
        });
        break;
      case 'ARROWDOWN':
        event.preventDefault();
        setCurrentIndex(prev => {
          const newIndex = Math.min(instruments.length - 1, prev + 1);
          if (instruments[newIndex]) {
            onSelectInstrument(instruments[newIndex]);
          }
          return newIndex;
        });
        break;
    }
  }, [isActive, instruments, onSelectInstrument]);

  const handleInstrumentClick = useCallback((instrument: Instrument, index: number) => {
    setCurrentIndex(index);
    onSelectInstrument(instrument);
    setActiveSection('instrumentList');
  }, [onSelectInstrument, setActiveSection]);

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

  const visibleInstruments = instruments.slice(scrollOffset, scrollOffset + VISIBLE_ITEMS);

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
          {visibleInstruments.map((instrument, index) => {
            const actualIndex = scrollOffset + index;
            return (
              <div
                key={actualIndex}
                className={getItemClass(actualIndex)}
                onClick={() => handleInstrumentClick(instrument, actualIndex)}
              >
                <span className="instrument-id">
                  {actualIndex.toString(16).padStart(2, '0').toUpperCase()}
                </span>
                <span className="instrument-name">
                  {instrument.name || '...'}
                </span>
              </div>
            );
          })}
          
          {/* Empty slots */}
          {Array.from({ length: Math.max(0, VISIBLE_ITEMS - visibleInstruments.length) }).map((_, index) => (
            <div key={`empty-${index}`} className="instrument-item empty">
              <span className="instrument-id">
                {(scrollOffset + visibleInstruments.length + index).toString(16).padStart(2, '0').toUpperCase()}
              </span>
              <span className="instrument-name">...</span>
            </div>
          ))}
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
              if (instruments[newIndex]) {
                onSelectInstrument(instruments[newIndex]);
              }
            }}
            disabled={currentIndex === 0}
          >
            ↑
          </button>
          <button 
            className="nav-btn"
            onClick={() => {
              const newIndex = Math.min(instruments.length - 1, currentIndex + 1);
              setCurrentIndex(newIndex);
              if (instruments[newIndex]) {
                onSelectInstrument(instruments[newIndex]);
              }
            }}
            disabled={currentIndex >= instruments.length - 1}
          >
            ↓
          </button>
        </div>
      </div>
    </div>
  );
};

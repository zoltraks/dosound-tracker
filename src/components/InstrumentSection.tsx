/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useRef, useEffect, useCallback } from 'react';
import type { NavigationSection } from '../constants/navigation.ts';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { MAX_INSTRUMENTS, ENVELOPE_LENGTH } from '../constants/music.ts';
import type { Instrument } from '../synth/SoundDriver.ts';
import { formatInstrumentSlotId } from '../utils/instrument/instrumentSelection.ts';
import {
  computeVisibleSlotCount,
  getInstrumentForSlot as getInstrumentForSlotFromUtils,
  getMovedInstrumentIndex,
  isMidiEnabled,
} from '../utils/instrument/instrumentPanelUtils.ts';
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
  focusRevision,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);
  const nameInputRef = useRef<HTMLInputElement | null>(null);
  const itemsContainerRef = useRef<HTMLDivElement | null>(null);

  const isActive = activeSection === 'instrumentList';
  const isTrackSectionActive =
    activeSection === 'trackA' || activeSection === 'trackB' || activeSection === 'trackC';
  const visibleSlotCount = computeVisibleSlotCount(instruments, currentIndex, MAX_INSTRUMENTS);

  useEffect(() => {
    let index = instruments.findIndex((inst) => inst === currentInstrument);
    if (index === -1) {
      index = instruments.findIndex((inst) => inst.id === currentInstrument.id);
    }
    if (index !== -1) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCurrentIndex(index);
    }
  }, [currentInstrument, instruments]);

  useEffect(() => {
    if (isActive && listRef.current) {
      listRef.current.focus();
    }
  }, [isActive, focusRevision]);

  useEffect(() => {
    const container = itemsContainerRef.current;
    const parent = container?.parentElement;
    if (!container || !parent || typeof ResizeObserver === 'undefined') {
      return;
    }
    const observer = new ResizeObserver(() => {
      container.style.maxHeight = `${Math.floor(parent.clientHeight)}px`;
    });
    observer.observe(parent);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!itemsContainerRef.current) {
      return;
    }

    const container = itemsContainerRef.current;
    const itemElements = container.querySelectorAll(
      '.instrument-item',
    ) as NodeListOf<HTMLDivElement>;
    const target = itemElements[currentIndex];
    if (!target) {
      return;
    }
    if (currentIndex === itemElements.length - 1) {
      container.scrollTop = container.scrollHeight;
    } else {
      target.scrollIntoView({ block: 'nearest' });
    }
  }, [currentIndex, isActive, visibleSlotCount]);

  const getInstrumentForSlot = useCallback(
    (slotIndex: number): Instrument => {
      return getInstrumentForSlotFromUtils(instruments, slotIndex, ENVELOPE_LENGTH);
    },
    [instruments],
  );

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (!isActive) return;

      const target = event.target as HTMLElement | null;
      if (target && target.tagName === 'INPUT') {
        return;
      }

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
          if (event.ctrlKey || event.metaKey || event.altKey || event.shiftKey) {
            break;
          }
          event.preventDefault();
          if (nameInputRef.current) {
            nameInputRef.current.focus();
            nameInputRef.current.select();
          }
          break;
        case 'ARROWUP':
          event.preventDefault();
          {
            const newIndex = getMovedInstrumentIndex(currentIndex, 'up', visibleSlotCount);
            setCurrentIndex(newIndex);
            onSelectInstrument(getInstrumentForSlot(newIndex));
          }
          break;
        case 'ARROWDOWN':
          event.preventDefault();
          {
            const newIndex = getMovedInstrumentIndex(currentIndex, 'down', visibleSlotCount);
            setCurrentIndex(newIndex);
            onSelectInstrument(getInstrumentForSlot(newIndex));
          }
          break;
      }
    },
    [
      isActive,
      currentIndex,
      instruments.length,
      visibleSlotCount,
      getInstrumentForSlot,
      onSelectInstrument,
      onMoveInstrument,
    ],
  );

  const handleInstrumentClick = useCallback(
    (slotIndex: number) => {
      setCurrentIndex(slotIndex);
      onSelectInstrument(getInstrumentForSlot(slotIndex));
      // Picking an instrument while a track is active must not steal the
      // section - the track keeps focus so note entry can continue.
      if (!isTrackSectionActive) {
        setActiveSection('instrumentList');
      }
    },
    [onSelectInstrument, setActiveSection, getInstrumentForSlot, isTrackSectionActive],
  );

  const getItemClass = useCallback(
    (index: number) => {
      const classes = ['instrument-item'];
      if (index === currentIndex) {
        classes.push('current');
      }
      if (isActive && index === currentIndex) {
        classes.push('focused');
      }
      return classes.join(' ');
    },
    [currentIndex, isActive],
  );

  return (
    <div
      ref={listRef}
      className={`instrument-panel ${isActive ? 'active' : ''}`}
      role="group"
      aria-label="Instrument list"
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
            const midiEnabled = isMidiEnabled(instrument);

            const midiButtonClassNames = ['instrument-midi-button'];
            midiButtonClassNames.push(
              midiEnabled ? 'instrument-midi-enabled' : 'instrument-midi-disabled',
            );
            const displayName = isCurrent
              ? currentInstrument.name
              : instrument && instrument.name
                ? instrument.name
                : '';

            return (
              <div
                key={slotIndex}
                className={`${getItemClass(slotIndex)}${instrument && instrument.color ? ' instrument-item-colored' : ''}`.trim()}
                style={
                  instrument && instrument.color
                    ? ({
                        ['--instrument-color' as string]: instrument.color,
                      } as React.CSSProperties)
                    : undefined
                }
                onMouseDown={(event) => {
                  if ((event.target as HTMLElement).closest('input, button')) {
                    return;
                  }
                  event.preventDefault();
                }}
                onClick={(event) => {
                  event.stopPropagation();
                  handleInstrumentClick(slotIndex);
                }}
              >
                <span className="instrument-number">{formatInstrumentSlotId(slotIndex)}</span>
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
                <div className="instrument-actions" onClick={(e) => e.stopPropagation()}>
                  <button
                    type="button"
                    className="instrument-color-button"
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
                      <ChevronDown size={12} />
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
                      <ChevronUp size={12} />
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

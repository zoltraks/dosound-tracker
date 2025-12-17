import React, { useRef, useEffect, useCallback } from 'react';
import type { NavigationSection } from '../constants/navigation';
import { ENVELOPE_LENGTH } from '../constants/music';
import { useEnvelopeValueHandling } from '../hooks/useEnvelopeValueHandling';

interface EnvelopePanelProps {
  type: 'volume' | 'shift' | 'pitch' | 'noise' | 'mode';
  activeSection: NavigationSection;
  setActiveSection: (section: NavigationSection) => void;
  data?: number[];
  onChange?: (data: number[]) => void;
  sustainIndex?: number | null;
  onSustainChange?: (index: number | null) => void;
}

export const EnvelopePanel: React.FC<EnvelopePanelProps> = ({
  type,
  activeSection,
  setActiveSection,
  data,
  onChange,
  sustainIndex,
  onSustainChange
}) => {
  const envelopeRef = useRef<HTMLDivElement>(null);
  const lastPositionRef = useRef<number | null>(null);

  const sectionName = type === 'mode' ? 'mode' : type;
  const isActive = activeSection === sectionName;

  // Use the envelope value handling hook
  const {
    envelopeData,
    currentPosition,
    setCurrentPosition,
    handleValueChange,
    clampEnvelopeValue,
    formatValue,
    getBarHeight,
    getCenteredBarPosition,
    getFullEnvelope,
    updateData
  } = useEnvelopeValueHandling({
    type,
    data,
    onChange
  });

  useEffect(() => {
    if (isActive && envelopeRef.current) {
      envelopeRef.current.focus();
    }
  }, [isActive]);

  useEffect(() => {
    if (data) {
      /* eslint-disable react-hooks/set-state-in-effect */
      updateData(data);
    }
  }, [data, updateData]);

  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (!isActive) return;

    const key = event.key.toUpperCase();
    const digitMatch = event.code.match(/^Digit([0-9])$/);
    const hexKey = digitMatch ? digitMatch[1] : key;

    if (event.ctrlKey && event.shiftKey) {
      if (key === 'BACKSPACE') {
        event.preventDefault();
        const newData = Array(ENVELOPE_LENGTH).fill(0);
        updateData(newData);
        onChange?.(newData);
        return;
      }

      if (key === 'ARROWLEFT' || key === 'ARROWRIGHT') {
        event.preventDefault();
        const source = getFullEnvelope(envelopeData);
        const newData =
          key === 'ARROWLEFT'
            ? [...source.slice(1), source[0]]
            : [source[ENVELOPE_LENGTH - 1], ...source.slice(0, ENVELOPE_LENGTH - 1)];
        updateData(newData);
        onChange?.(newData);
        return;
      }

      if (key === 'ARROWUP' || key === 'ARROWDOWN') {
        event.preventDefault();
        const delta = key === 'ARROWUP' ? 1 : -1;
        const source = getFullEnvelope(envelopeData);
        const newData = source.map(value => clampEnvelopeValue(value + delta));
        updateData(newData);
        onChange?.(newData);
        return;
      }

      if (type === 'shift' && key === 'ENTER') {
        event.preventDefault();
        const source = getFullEnvelope(envelopeData);
        const pattern = source.slice(0, Math.min(ENVELOPE_LENGTH, currentPosition + 1));
        const newData = Array.from({ length: ENVELOPE_LENGTH }, (_, index) => {
          return pattern.length > 0 ? pattern[index % pattern.length] : 0;
        });
        updateData(newData);
        onChange?.(newData);
        return;
      }
    }
    
    if (key === 'ARROWLEFT') {
      event.preventDefault();
      lastPositionRef.current = currentPosition;
      setCurrentPosition(Math.max(0, currentPosition - 1));
    } else if (key === 'ARROWRIGHT') {
      event.preventDefault();
      lastPositionRef.current = currentPosition;
      setCurrentPosition(Math.min(ENVELOPE_LENGTH - 1, currentPosition + 1));
    } else if (key === 'ARROWUP') {
      event.preventDefault();
      handleValueChange(1);
    } else if (key === 'ARROWDOWN') {
      event.preventDefault();
      handleValueChange(-1);
    } else if (key === 'BACKSPACE' || key === 'DELETE') {
      event.preventDefault();
      // Zero out the current position value
      if (onChange) {
        const newData = [...envelopeData];
        newData[currentPosition] = 0;
        updateData(newData);
        onChange(newData);
      }
      if (type === 'volume' || type === 'shift' || type === 'noise' || type === 'pitch') {
        lastPositionRef.current = currentPosition;
        const nextPosition = (currentPosition + 1) % ENVELOPE_LENGTH;
        setCurrentPosition(nextPosition);
      }
    } else if (type === 'volume' && /^[0-9A-F]$/.test(hexKey)) {
      event.preventDefault();
      if (onChange) {
        const newData = [...envelopeData];
        const newValue = parseInt(hexKey, 16);
        newData[currentPosition] = newValue;
        updateData(newData);
        onChange(newData);
      }
      lastPositionRef.current = currentPosition;
      const nextPosition = (currentPosition + 1) % ENVELOPE_LENGTH;
      setCurrentPosition(nextPosition);
    } else if (type === 'shift' && /^[0-9A-F]$/.test(hexKey)) {
      event.preventDefault();
      if (onChange) {
        const newData = [...envelopeData];
        let newValue = parseInt(hexKey, 16);
        if (event.shiftKey && hexKey !== '0') {
          newValue = -newValue;
        }
        newData[currentPosition] = newValue;
        updateData(newData);
        onChange(newData);
      }
      lastPositionRef.current = currentPosition;
      const nextPosition = (currentPosition + 1) % ENVELOPE_LENGTH;
      setCurrentPosition(nextPosition);
    } else if (type === 'noise' && /^[0-9A-F]$/.test(hexKey)) {
      event.preventDefault();
      if (onChange) {
        const newData = [...envelopeData];
        let newValue = parseInt(hexKey, 16);
        if (event.shiftKey) {
          newValue = Math.min(31, newValue + 16); // NOISE_MAX = 31
        }
        newData[currentPosition] = newValue;
        updateData(newData);
        onChange(newData);
      }
      lastPositionRef.current = currentPosition;
      const nextPosition = (currentPosition + 1) % ENVELOPE_LENGTH;
      setCurrentPosition(nextPosition);
    } else if (type === 'mode' && (key === 'T' || key === 'N' || key === 'B')) {
      event.preventDefault();
      if (onChange) {
        const newData = [...envelopeData];
        const newValue = key === 'T' ? 0 : key === 'N' ? 1 : 2;
        newData[currentPosition] = newValue;
        updateData(newData);
        onChange(newData);
      }
      lastPositionRef.current = currentPosition;
      const nextPosition = (currentPosition + 1) % ENVELOPE_LENGTH;
      setCurrentPosition(nextPosition);
    } else if ((type === 'pitch' || type === 'noise' || type === 'shift' || type === 'volume') && event.key === ' ') {
      event.preventDefault();
      if (onChange && lastPositionRef.current !== null) {
        const sourceIndex = lastPositionRef.current;
        const newData = getFullEnvelope(envelopeData);
        newData[currentPosition] = newData[sourceIndex];
        updateData(newData);
        onChange(newData);
      }
    } else if (type === 'volume' && key === 'S' && onSustainChange) {
      event.preventDefault();
      const current = typeof sustainIndex === 'number' && sustainIndex >= 0 ? sustainIndex : null;
      if (current === currentPosition) {
        onSustainChange(null);
      } else {
        onSustainChange(currentPosition);
      }
    }
  }, [
    isActive,
    handleValueChange,
    currentPosition,
    envelopeData,
    onChange,
    sustainIndex,
    onSustainChange,
    type,
    getFullEnvelope,
    clampEnvelopeValue
  ]);

  const handlePositionClick = useCallback((position: number) => {
    lastPositionRef.current = currentPosition;
    setCurrentPosition(position);
    setActiveSection(sectionName);
  }, [setActiveSection, sectionName, currentPosition]);

  const getTitle = useCallback(() => {
    switch (type) {
      case 'volume': return 'Volume';
      case 'shift': return 'Arpeggio';
      case 'pitch': return 'Pitch';
      case 'noise': return 'Noise';
      case 'mode': return 'Mode';
      default: return type;
    }
  }, [type]);

  if (type === 'mode') {
    return (
      <div 
        ref={envelopeRef}
        className={`envelope-panel mode ${isActive ? 'active' : ''}`}
        tabIndex={0}
        onKeyDown={handleKeyDown}
        onClick={() => setActiveSection(sectionName)}
      >
        <div className="envelope-header">{getTitle()}</div>
        <div className="mode-content">
          {envelopeData.slice(0, 16).map((value, index) => (
            <div
              key={index}
              className={`mode-cell ${index === currentPosition && isActive ? 'current' : ''}`}
              onClick={() => handlePositionClick(index)}
            >
              {formatValue(value)}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={envelopeRef}
      className={`envelope-panel ${type} ${isActive ? 'active' : ''}`}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onClick={() => setActiveSection(sectionName)}
    >
      <div className="envelope-header">{getTitle()}</div>
      
      {(type === 'shift' || type === 'pitch') ? (
        // Thin horizontal line rendering for shift and pitch
        <div className="envelope-content">
          <div className="envelope-graph centered">
            <div className="neutral-line"></div>
            {envelopeData.map((value, index) => (
              <div
                key={index}
                className={`envelope-bar centered ${index === currentPosition && isActive ? 'current' : ''}`}
                style={{ 
                  top: `${getCenteredBarPosition(value)}%`,
                  left: `${(index / envelopeData.length) * 100}%`,
                  height: '3px'
                }}
                onClick={() => handlePositionClick(index)}
                title={`Pos: ${index.toString(16).toUpperCase()} Value: ${formatValue(value)}`}
              >
              </div>
            ))}
          </div>
          
          <div className="envelope-values">
            {envelopeData.map((value, index) => (
              <div
                key={index}
                className={`envelope-value ${index === currentPosition && isActive ? 'current' : ''}`}
                onClick={() => handlePositionClick(index)}
              >
                {formatValue(value)}
              </div>
            ))}
          </div>
        </div>
      ) : (
        // Bar rendering for volume and noise
        <div className="envelope-content">
          <div
            className="envelope-graph"
            onContextMenu={event => {
              if (type !== 'volume' || !onSustainChange) {
                return;
              }

              event.preventDefault();

              const rect = event.currentTarget.getBoundingClientRect();
              const x = event.clientX - rect.left;
              const relative = rect.width > 0 ? x / rect.width : 0;

              let index = Math.floor(relative * envelopeData.length);
              if (index < 0) index = 0;
              if (index >= envelopeData.length) index = envelopeData.length - 1;

              handlePositionClick(index);

              const current =
                typeof sustainIndex === 'number' && sustainIndex >= 0 ? sustainIndex : null;

              if (current === index) {
                onSustainChange(null);
              } else {
                onSustainChange(index);
              }
            }}
          >
            {envelopeData.map((value, index) => {
              const isCurrent = index === currentPosition && isActive;
              const isSustain = typeof sustainIndex === 'number' && sustainIndex === index;
              return (
                <div
                  key={index}
                  className={`envelope-bar ${isCurrent ? 'current' : ''} ${isSustain ? 'sustain' : ''}`}
                  style={{ height: `${getBarHeight(value)}%` }}
                  onClick={() => handlePositionClick(index)}
                  title={`Pos: ${index.toString(16).toUpperCase()} Value: ${formatValue(value)}`}
                >
                </div>
              );
            })}

            {typeof sustainIndex === 'number' && sustainIndex >= 0 && sustainIndex < envelopeData.length && (
              <div
                className="envelope-sustain-dot"
                style={{
                  left: `${((sustainIndex + 0.5) / envelopeData.length) * 100}%`
                }}
              />
            )}
          </div>
          
          <div className="envelope-values">
            {envelopeData.map((value, index) => (
              <div
                key={index}
                className={`envelope-value ${index === currentPosition && isActive ? 'current' : ''}`}
                onClick={() => handlePositionClick(index)}
              >
                {formatValue(value)}
              </div>
            ))}
          </div>
        </div>
      )}
      
      <div className="envelope-footer">
        <span>Pos: {currentPosition.toString(16).toUpperCase()}</span>
        <span>Val: {formatValue(envelopeData[currentPosition])}</span>
      </div>
    </div>
  );
};

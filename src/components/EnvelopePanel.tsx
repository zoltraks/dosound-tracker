import React, { useState, useRef, useEffect, useCallback } from 'react';
import type { NavigationSection } from '../constants/navigation';
import { ENVELOPE_LENGTH, VOLUME_MAX, NOISE_MAX, ARPEGGIO_MIN, ARPEGGIO_MAX, PITCH_MIN, PITCH_MAX } from '../constants/music';

interface EnvelopePanelProps {
  type: 'volume' | 'arpeggio' | 'pitch' | 'noise' | 'mode';
  activeSection: NavigationSection;
  setActiveSection: (section: NavigationSection) => void;
  data?: number[];
  onChange?: (data: number[]) => void;
  // Optional sustain position (volume envelope only). When defined, a dot is
  // rendered on the corresponding bar. onChangeSustain is invoked when the
  // user sets or clears sustain via mouse or keyboard.
  sustainPosition?: number | null;
  onChangeSustain?: (position: number | null) => void;
}

export const EnvelopePanel: React.FC<EnvelopePanelProps> = ({
  type,
  activeSection,
  setActiveSection,
  data,
  onChange,
  sustainPosition,
  onChangeSustain
}) => {
  const [currentPosition, setCurrentPosition] = useState(0);
  const [envelopeData, setEnvelopeData] = useState<number[]>(
    data || Array(ENVELOPE_LENGTH).fill(0)
  );
  const envelopeRef = useRef<HTMLDivElement>(null);
  const lastPositionRef = useRef<number | null>(null);

  const sectionName = type === 'mode' ? 'mode' : type;
  const isActive = activeSection === sectionName;

  useEffect(() => {
    if (isActive && envelopeRef.current) {
      envelopeRef.current.focus();
    }
  }, [isActive]);

  useEffect(() => {
    if (data) {
      setEnvelopeData(data);
    }
  }, [data]);

  const handleValueChange = useCallback((delta: number) => {
    if (!onChange) return;

    const newData = [...envelopeData];
    let currentValue = newData[currentPosition];
    let newValue = currentValue;

    switch (type) {
      case 'volume':
        newValue = Math.max(0, Math.min(VOLUME_MAX, currentValue + delta));
        break;
      case 'noise':
        newValue = Math.max(0, Math.min(NOISE_MAX, currentValue + delta));
        break;
      case 'arpeggio':
        newValue = Math.max(ARPEGGIO_MIN, Math.min(ARPEGGIO_MAX, currentValue + delta));
        break;
      case 'pitch':
        newValue = Math.max(PITCH_MIN, Math.min(PITCH_MAX, currentValue + delta));
        break;
      case 'mode':
        // Toggle between tone and noise
        newValue = currentValue === 0 ? 1 : 0;
        break;
    }

    newData[currentPosition] = newValue;
    setEnvelopeData(newData);
    onChange(newData);
  }, [envelopeData, currentPosition, type, onChange]);

  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (!isActive) return;

    const key = event.key.toUpperCase();
    
    if (key === 'ARROWLEFT') {
      event.preventDefault();
      lastPositionRef.current = currentPosition;
      setCurrentPosition(prev => Math.max(0, prev - 1));
    } else if (key === 'ARROWRIGHT') {
      event.preventDefault();
      lastPositionRef.current = currentPosition;
      setCurrentPosition(prev => Math.min(ENVELOPE_LENGTH - 1, prev + 1));
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
        setEnvelopeData(newData);
        onChange(newData);
      }
      if (type === 'volume' || type === 'arpeggio' || type === 'noise') {
        const nextPosition = (currentPosition + 1) % ENVELOPE_LENGTH;
        setCurrentPosition(nextPosition);
      }
    } else if (type === 'volume' && /^[0-9A-F]$/.test(key)) {
      event.preventDefault();
      if (onChange) {
        const newData = [...envelopeData];
        const newValue = parseInt(key, 16);
        newData[currentPosition] = newValue;
        setEnvelopeData(newData);
        onChange(newData);
      }
      const nextPosition = (currentPosition + 1) % ENVELOPE_LENGTH;
      setCurrentPosition(nextPosition);
    } else if (type === 'arpeggio' && /^[0-9A-F]$/.test(key)) {
      event.preventDefault();
      if (onChange) {
        const newData = [...envelopeData];
        let newValue = parseInt(key, 16);
        if (event.shiftKey && key !== '0') {
          newValue = -newValue;
        }
        newData[currentPosition] = newValue;
        setEnvelopeData(newData);
        onChange(newData);
      }
      const nextPosition = (currentPosition + 1) % ENVELOPE_LENGTH;
      setCurrentPosition(nextPosition);
    } else if (type === 'noise' && /^[0-9A-F]$/.test(key)) {
      event.preventDefault();
      if (onChange) {
        const newData = [...envelopeData];
        let newValue = parseInt(key, 16);
        if (event.shiftKey && key !== '0') {
          newValue = Math.min(NOISE_MAX, newValue + 16);
        }
        newData[currentPosition] = newValue;
        setEnvelopeData(newData);
        onChange(newData);
      }
      const nextPosition = (currentPosition + 1) % ENVELOPE_LENGTH;
      setCurrentPosition(nextPosition);
    } else if (type === 'pitch' && event.key === ' ') {
      event.preventDefault();
      if (onChange && lastPositionRef.current !== null) {
        const sourceIndex = lastPositionRef.current;
        const newData = [...envelopeData];
        newData[currentPosition] = newData[sourceIndex];
        setEnvelopeData(newData);
        onChange(newData);
      }
    } else if (type === 'volume' && key === 'S' && onChangeSustain) {
      event.preventDefault();
      // Toggle sustain at the current position: if sustain is already here,
      // clear it; otherwise, move sustain to this position.
      const current = sustainPosition ?? null;
      if (current === currentPosition) {
        onChangeSustain(null);
      } else {
        onChangeSustain(currentPosition);
      }
    }
  }, [
    isActive,
    handleValueChange,
    currentPosition,
    envelopeData,
    onChange,
    sustainPosition,
    onChangeSustain
  ]);

  const handlePositionClick = useCallback((position: number) => {
    lastPositionRef.current = currentPosition;
    setCurrentPosition(position);
    setActiveSection(sectionName);
  }, [setActiveSection, sectionName, currentPosition]);

  const formatValue = useCallback((value: number) => {
    switch (type) {
      case 'volume':
        return value.toString(16).toUpperCase();
      case 'noise':
        return value.toString(16).toUpperCase();
      case 'arpeggio':
        return value >= 0 ? `+${value}` : value.toString();
      case 'pitch':
        return value >= 0 ? `+${value}` : value.toString();
      case 'mode':
        return value === 0 ? 'TONE' : 'NOISE';
      default:
        return value.toString();
    }
  }, [type]);

  const getBarHeight = useCallback((value: number) => {
    switch (type) {
      case 'volume':
        return (value / VOLUME_MAX) * 100;
      case 'noise':
        return (value / NOISE_MAX) * 100;
      case 'arpeggio':
        return Math.abs(value) / Math.max(Math.abs(ARPEGGIO_MIN), ARPEGGIO_MAX) * 100;
      case 'pitch':
        return Math.abs(value) / Math.max(Math.abs(PITCH_MIN), PITCH_MAX) * 100;
      case 'mode':
        return value * 100;
      default:
        return 0;
    }
  }, [type]);

  const getCenteredBarPosition = useCallback((value: number) => {
    switch (type) {
      case 'arpeggio':
        // Position: 50% for 0, less for positive (go up), more for negative (go down)
        return 50 - (value / ARPEGGIO_MAX) * 50;
      case 'pitch':
        // Position: 50% for 0, less for positive (go up), more for negative (go down)
        return 50 - (value / PITCH_MAX) * 50;
      default:
        return 50;
    }
  }, [type]);

  const getTitle = useCallback(() => {
    switch (type) {
      case 'volume': return 'Volume';
      case 'arpeggio': return 'Arpeggio';
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
        <div className="tone-noise-content">
          {envelopeData.slice(0, 16).map((value, index) => (
            <div
              key={index}
              className={`tone-noise-cell ${index === currentPosition && isActive ? 'current' : ''}`}
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
      
      {(type === 'arpeggio' || type === 'pitch') ? (
        // Thin horizontal line rendering for arpeggio and pitch
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
          <div className="envelope-graph">
            {envelopeData.map((value, index) => (
              <div
                key={index}
                className={`envelope-bar ${index === currentPosition && isActive ? 'current' : ''}`}
                style={{ height: `${getBarHeight(value)}%` }}
                onMouseDown={(event) => {
                  event.preventDefault();
                  // Left click: just move cursor (no sustain change).
                  if (event.button === 0) {
                    handlePositionClick(index);
                  }
                }}
                onContextMenu={(event) => {
                  // Right click / context menu: toggle sustain for volume envelope
                  event.preventDefault();
                  handlePositionClick(index);
                  if (type === 'volume' && onChangeSustain) {
                    if (sustainPosition === index) {
                      onChangeSustain(null);
                    } else {
                      onChangeSustain(index);
                    }
                  }
                }}
                title={`Pos: ${index.toString(16).toUpperCase()} Value: ${formatValue(value)}`}
              >
                {type === 'volume' && sustainPosition === index && (
                  <div className="envelope-sustain-dot" />
                )}
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
      )}
      
      <div className="envelope-footer">
        <span>Pos: {currentPosition.toString(16).toUpperCase()}</span>
        <span>Val: {formatValue(envelopeData[currentPosition])}</span>
      </div>
    </div>
  );
};

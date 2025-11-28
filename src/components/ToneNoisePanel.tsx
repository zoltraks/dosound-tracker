import React, { useState, useRef, useEffect, useCallback } from 'react';
import type { NavigationSection } from '../constants/navigation';

interface ToneNoisePanelProps {
  activeSection: NavigationSection;
  setActiveSection: (section: NavigationSection) => void;
  data?: number[];
  onChange?: (data: number[]) => void;
}

export const ToneNoisePanel: React.FC<ToneNoisePanelProps> = ({
  activeSection,
  setActiveSection,
  data,
  onChange
}) => {
  const [currentPosition, setCurrentPosition] = useState(0);
  const panelRef = useRef<HTMLDivElement>(null);

  const sectionName = 'mode';
  const isActive = activeSection === sectionName;

  const defaultToneNoiseData: number[] = [
    0, 1, 0, 1, 0, 1, 0, 1,
    0, 1, 0, 1, 0, 1, 0, 1,
    0, 1, 0, 1, 0, 1, 0, 1,
    0, 1, 0, 1, 0, 1, 0, 1
  ];

  const toneNoiseData = (data && data.length > 0) ? data : defaultToneNoiseData;

  useEffect(() => {
    if (isActive && panelRef.current) {
      panelRef.current.focus();
    }
  }, [isActive]);

  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (!isActive) return;

    const key = event.key.toUpperCase();
    
    if (key === 'ARROWLEFT') {
      event.preventDefault();
      setCurrentPosition(prev => Math.max(0, prev - 1));
    } else if (key === 'ARROWRIGHT') {
      event.preventDefault();
      setCurrentPosition(prev => Math.min(31, prev + 1));
    } else if (key === 'ARROWUP') {
      event.preventDefault();
      if (onChange) {
        const source = toneNoiseData;
        const newData = [...source];
        const currentValue = newData[currentPosition] ?? 0;
        newData[currentPosition] = Math.min(2, currentValue + 1);
        onChange(newData);
      }
    } else if (key === 'ARROWDOWN') {
      event.preventDefault();
      if (onChange) {
        const source = toneNoiseData;
        const newData = [...source];
        const currentValue = newData[currentPosition] ?? 0;
        newData[currentPosition] = Math.max(0, currentValue - 1);
        onChange(newData);
      }
    } else if (key === 'T' || key === 'N' || key === 'B') {
      event.preventDefault();
      if (onChange) {
        const source = toneNoiseData;
        const newData = [...source];
        const newValue = key === 'T' ? 0 : key === 'N' ? 1 : 2;
        newData[currentPosition] = newValue;
        onChange(newData);
      }
      const length = toneNoiseData.length > 0 ? toneNoiseData.length : 32;
      const nextPosition = (currentPosition + 1) % length;
      setCurrentPosition(nextPosition);
    } else if (key === ' ') {
      event.preventDefault();
      if (onChange) {
        const source = toneNoiseData;
        const newData = [...source];
        const currentValue = newData[currentPosition] ?? 0;
        newData[currentPosition] = (currentValue + 1) % 3;
        onChange(newData);
      }
    }
  }, [isActive, currentPosition, onChange, toneNoiseData]);

  const handlePositionClick = useCallback((index: number) => {
    setCurrentPosition(index);
    setActiveSection(sectionName);
  }, [setActiveSection]);

  const handleBarClick = useCallback((index: number) => {
    if (onChange) {
      const source = toneNoiseData;
      const newData = [...source];
      const currentValue = newData[index] ?? 0;
      newData[index] = (currentValue + 1) % 3;
      onChange(newData);
    }
    setCurrentPosition(index);
    setActiveSection(sectionName);
  }, [onChange, toneNoiseData, setActiveSection]);

  const getBarEmoji = () => {
    return '🎵'; // Always use music note emoji
  };

  const getBarColor = (value: number) => {
    // Use different colors based on mode value: 0=T, 1=N, 2=T+N
    if (value === 0) {
      return '#f59e0b'; // Orange for T (tone)
    }
    if (value === 1) {
      return '#3fbbc8'; // Cyan for N (noise)
    }
    return '#a855f7'; // Purple for B (both)
  };

  const getModeLabel = (value: number) => {
    if (value === 0) return 'Tone';
    if (value === 1) return 'Noise';
    return 'Tone+Noise';
  };

  const getTitle = () => {
    return 'Mode'; // Simplified header title
  };

  return (
    <div 
      ref={panelRef}
      className={`envelope-panel mode ${isActive ? 'active' : ''}`}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onClick={() => setActiveSection(sectionName)}
    >
      <div className="envelope-header">{getTitle()}</div>
      
      <div className="envelope-content">
        <div className="envelope-graph">
          {toneNoiseData.map((value, index) => (
            <div
              key={index}
              className={`envelope-bar mode-bar ${index === currentPosition && isActive ? 'current' : ''}`}
              style={{ 
                backgroundColor: getBarColor(value)
              }}
              onClick={() => handleBarClick(index)}
              title={`Pos: ${index.toString(16).toUpperCase()} Mode: ${getModeLabel(value)}`}
            >
              <div className="mode-emoji">
                {getBarEmoji()}
              </div>
            </div>
          ))}
        </div>
        
        <div className="envelope-values">
          {toneNoiseData.map((value, index) => (
            <div
              key={index}
              className={`envelope-value ${index === currentPosition && isActive ? 'current' : ''}`}
              onClick={() => handlePositionClick(index)}
            >
              {value === 0 ? 'T' : value === 1 ? 'N' : 'B'}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

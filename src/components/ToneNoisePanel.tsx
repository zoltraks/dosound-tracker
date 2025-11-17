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
  const [toneNoiseData, setToneNoiseData] = useState<number[]>(
    data || [0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1] // Alternating T/N for testing
  );
  const panelRef = useRef<HTMLDivElement>(null);

  const sectionName = 'mode';
  const isActive = activeSection === sectionName;

  useEffect(() => {
    if (isActive && panelRef.current) {
      panelRef.current.focus();
    }
  }, [isActive]);

  useEffect(() => {
    if (data) {
      setToneNoiseData(data);
    }
  }, [data]);

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
      setToneNoiseData(prev => {
        const newData = [...prev];
        newData[currentPosition] = Math.min(1, newData[currentPosition] + 1);
        if (onChange) onChange(newData);
        return newData;
      });
    } else if (key === 'ARROWDOWN') {
      event.preventDefault();
      setToneNoiseData(prev => {
        const newData = [...prev];
        newData[currentPosition] = Math.max(0, newData[currentPosition] - 1);
        if (onChange) onChange(newData);
        return newData;
      });
    } else if (key === ' ') {
      event.preventDefault();
      // Toggle between tone and noise
      setToneNoiseData(prev => {
        const newData = [...prev];
        newData[currentPosition] = newData[currentPosition] === 0 ? 1 : 0;
        if (onChange) onChange(newData);
        return newData;
      });
    }
  }, [isActive, currentPosition, onChange]);

  const handlePositionClick = useCallback((index: number) => {
    setCurrentPosition(index);
    setActiveSection(sectionName);
  }, [setActiveSection]);

  const handleBarClick = useCallback((index: number) => {
    setToneNoiseData(prev => {
      const newData = [...prev];
      newData[index] = newData[index] === 0 ? 1 : 0;
      if (onChange) onChange(newData);
      return newData;
    });
    setCurrentPosition(index);
  }, [onChange]);

  const getBarEmoji = () => {
    return '🎵'; // Always use music note emoji
  };

  const getBarColor = (value: number) => {
    // Use different colors based on T (0) or N (1) value
    const color = value === 0 ? '#f59e0b' : '#3fbbc8'; // Orange for T (tone), cyan for N (noise)
    return color;
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
              className={`envelope-bar tone-noise-bar ${index === currentPosition && isActive ? 'current' : ''}`}
              style={{ 
                backgroundColor: getBarColor(value)
              }}
              onClick={() => handleBarClick(index)}
              title={`Pos: ${index.toString(16).toUpperCase()} Mode: ${value === 0 ? 'Tone' : 'Noise'}`}
            >
              <div className="tone-noise-emoji">
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
              {value === 0 ? 'T' : 'N'}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

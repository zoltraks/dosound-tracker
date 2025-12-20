import React, { useRef, useEffect, useCallback } from 'react';
import type { NavigationSection } from '../constants/navigation';
import { useEnvelopeEditor } from '../hooks/useEnvelopeEditor';

interface ToneNoisePanelProps {
  activeSection: NavigationSection;
  setActiveSection: (section: NavigationSection) => void;
  data?: number[];
  onChange?: (data: number[]) => void;
}

const DEFAULT_MODE_ENVELOPE: number[] = [
  0, 1, 0, 1, 0, 1, 0, 1,
  0, 1, 0, 1, 0, 1, 0, 1,
  0, 1, 0, 1, 0, 1, 0, 1,
  0, 1, 0, 1, 0, 1, 0, 1,
];

export const ToneNoisePanel: React.FC<ToneNoisePanelProps> = ({
  activeSection,
  setActiveSection,
  data,
  onChange
}) => {
  const panelRef = useRef<HTMLDivElement>(null);

  const {
    sectionName,
    isActive,
    envelopeData,
    currentPosition,
    handleKeyDown,
    handlePositionClick,
    cycleValueAt,
  } = useEnvelopeEditor({
    type: 'mode',
    activeSection,
    setActiveSection,
    data,
    onChange,
    fallbackData: DEFAULT_MODE_ENVELOPE,
    advanceOnDelete: true,
  });

  useEffect(() => {
    if (isActive && panelRef.current) {
      panelRef.current.focus();
    }
  }, [isActive]);

  const handleBarClick = useCallback((index: number) => {
    handlePositionClick(index);
    cycleValueAt(index, currentValue => (currentValue + 1) % 3);
  }, [handlePositionClick, cycleValueAt]);

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
          {envelopeData.map((value, index) => (
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
          {envelopeData.map((value, index) => (
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

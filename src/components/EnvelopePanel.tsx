import React, { useRef, useEffect, useCallback } from 'react';
import type { NavigationSection } from '../constants/navigation';
import { type EnvelopePanelType, getEnvelopeTitle } from '../utils/envelopeTypes';
import { getEnvelopeBarHeight, getEnvelopeCenteredBarPosition } from '../utils/barRendering';
import { formatEnvelopeValue } from '../utils/valueFormatting';
import { useEnvelopeEditor } from '../hooks/useEnvelopeEditor';

interface EnvelopePanelProps {
  type: EnvelopePanelType;
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

  const {
    sectionName,
    isActive,
    envelopeData,
    currentPosition,
    handleKeyDown,
    handlePositionClick,
  } = useEnvelopeEditor({
    type,
    activeSection,
    setActiveSection,
    data,
    onChange,
    sustainIndex,
    onSustainChange,
  });

  useEffect(() => {
    if (isActive && envelopeRef.current) {
      envelopeRef.current.focus();
    }
  }, [isActive]);

  const formatValue = useCallback((value: number) => {
    return formatEnvelopeValue(type, value);
  }, [type]);

  const getBarHeight = useCallback((value: number) => {
    return getEnvelopeBarHeight(type, value);
  }, [type]);

  const getCenteredBarPosition = useCallback((value: number) => {
    return getEnvelopeCenteredBarPosition(type, value);
  }, [type]);

  const getTitle = useCallback(() => {
    return getEnvelopeTitle(type);
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

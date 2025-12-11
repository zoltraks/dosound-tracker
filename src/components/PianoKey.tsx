import React from 'react';
import type { PianoKeyConfig } from '../utils/pianoUtils';

interface PianoKeyProps {
  keyData: PianoKeyConfig;
  className: string;
  isBaseKey: boolean;
  onKeyDown: (note: string, octave: number) => void;
  onKeyUp: (note: string, octave: number) => void;
  onContextMenu: (note: string, octave: number) => void;
}

export const PianoKey: React.FC<PianoKeyProps> = ({
  keyData,
  className,
  isBaseKey,
  onKeyDown,
  onKeyUp,
  onContextMenu,
}) => {
  const { note, octave, isBlackKey, position } = keyData;

  return (
    <div
      className={className}
      style={{
        left: isBlackKey ? `${Math.floor(position) * 25 + 28}px` : 'auto',
        position: isBlackKey ? 'absolute' : 'relative',
      }}
      onMouseDown={(event) => {
        if (event.button === 0) {
          onKeyDown(note, octave);
        }
      }}
      onMouseUp={(event) => {
        if (event.button === 0) {
          onKeyUp(note, octave);
        }
      }}
      onMouseLeave={() => onKeyUp(note, octave)}
      onTouchStart={() => {
        onKeyDown(note, octave);
      }}
      onTouchEnd={() => {
        onKeyUp(note, octave);
      }}
      onTouchCancel={() => onKeyUp(note, octave)}
      onContextMenu={(event) => {
        event.preventDefault();
        onContextMenu(note, octave);
      }}
      title={`${note}${octave}`}
    >
      {!isBlackKey && (
        <span className="key-label">
          {note}
          {octave}
        </span>
      )}
      {isBaseKey && <span className="base-key-dot" />}
    </div>
  );
};

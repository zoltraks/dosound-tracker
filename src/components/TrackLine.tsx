import React from 'react';
import type { CSSProperties, MouseEvent } from 'react';
import type { Note } from '../synth/SoundDriver.ts';
import { clampVolumeNibble } from '../utils/panel/volumeUtils.ts';

interface TrackLineProps {
  lineIndex: number;
  noteData: Note | null;
  volume: number | null | undefined;
  lineClassName: string;
  lineStyle?: CSSProperties;
  noteIsActive: boolean;
  volumeIsActive: boolean;
  onLineClick: (lineIndex: number, column: 'note' | 'volume') => void;
  formatNoteDisplay: (noteData: Note | null) => string;
}

export const TrackLine: React.FC<TrackLineProps> = ({
  lineIndex,
  noteData,
  volume,
  lineClassName,
  lineStyle,
  noteIsActive,
  volumeIsActive,
  onLineClick,
  formatNoteDisplay,
}) => {
  const handleRowClick = () => {
    onLineClick(lineIndex, 'note');
  };

  const handleNoteClick = (event: MouseEvent<HTMLSpanElement>) => {
    event.stopPropagation();
    onLineClick(lineIndex, 'note');
  };

  const handleVolumeClick = (event: MouseEvent<HTMLSpanElement>) => {
    event.stopPropagation();
    onLineClick(lineIndex, 'volume');
  };

  const displayVolume =
    volume === undefined || volume === null
      ? '.'
      : clampVolumeNibble(volume).toString(16).toUpperCase();

  return (
    <div className={lineClassName} style={lineStyle} onClick={handleRowClick}>
      <span className="note-data">
        <span className={`note-text ${noteIsActive ? 'active' : ''}`} onClick={handleNoteClick}>
          {formatNoteDisplay(noteData)}
        </span>
        <span
          className={`volume-data ${volumeIsActive ? 'active' : ''}`}
          onClick={handleVolumeClick}
        >
          {displayVolume}
        </span>
      </span>
    </div>
  );
};

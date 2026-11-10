import { Formatter } from '../utils/format/formatters.ts';
import React from 'react';
import type { CSSProperties, MouseEvent } from 'react';
import type { Note } from '../synth/SoundDriver.ts';
import { clampVolumeNibble } from '../utils/panel/volumeUtils.ts';
import { getTrackLineClass } from '../utils/track/trackRendering.ts';

interface TrackLineProps {
  lineIndex: number;
  noteData: Note | null;
  volume: number | null | undefined;
  isCurrent: boolean;
  instrumentColor: string | null;
  noteIsActive: boolean;
  volumeIsActive: boolean;
  onLineClick: (lineIndex: number, column: 'note' | 'volume') => void;
  formatNoteDisplay: (noteData: Note | null) => string;
}

export const TrackLine: React.FC<TrackLineProps> = React.memo(function TrackLine({
  lineIndex,
  noteData,
  volume,
  isCurrent,
  instrumentColor,
  noteIsActive,
  volumeIsActive,
  onLineClick,
  formatNoteDisplay,
}) {
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
      : Formatter.hex(clampVolumeNibble(volume), { padWidth: 0 });

  const lineClassName =
    `${getTrackLineClass(lineIndex, isCurrent)}${instrumentColor ? ' track-line-colored' : ''}`.trim();
  const lineStyle = instrumentColor
    ? ({ ['--track-line-color' as string]: instrumentColor } as CSSProperties)
    : undefined;

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
});

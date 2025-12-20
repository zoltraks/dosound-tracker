import React from 'react';
import type { CSSProperties } from 'react';
import type { Note, Step } from '../synth/SoundDriver';
import { TrackLine } from './TrackLine';
import {
  formatTrackNoteDisplay,
  getInstrumentColorForNote,
  getTrackLineClass,
} from '../utils/trackRendering';

interface TrackLinesProps {
  trackNotes: (Note | null)[];
  patternSteps: Step[];
  currentLine: number;
  currentColumn: 'note' | 'volume';
  isActive: boolean;
  instrumentColorMap: Map<string, string>;
  onLineClick: (lineIndex: number, column: 'note' | 'volume') => void;
}

export const TrackLines: React.FC<TrackLinesProps> = ({
  trackNotes,
  patternSteps,
  currentLine,
  currentColumn,
  isActive,
  instrumentColorMap,
  onLineClick,
}) => {
  return (
    <>
      {trackNotes.map((noteData, lineIndex) => {
        const volume = patternSteps[lineIndex]?.volume ?? null;
        const isCurrentLine = lineIndex === currentLine && isActive;
        const volumeIsActive = isCurrentLine && currentColumn === 'volume';
        const noteIsActive = isCurrentLine && currentColumn === 'note';

        const instrumentColor = getInstrumentColorForNote(noteData, instrumentColorMap);
        const lineClassName = `${getTrackLineClass(lineIndex, currentLine)}${
          instrumentColor ? ' track-line-colored' : ''
        }`.trim();
        const lineStyle = instrumentColor
          ? ({ ['--track-line-color' as string]: instrumentColor } as CSSProperties)
          : undefined;

        return (
          <TrackLine
            key={lineIndex}
            lineIndex={lineIndex}
            noteData={noteData}
            volume={volume}
            lineClassName={lineClassName}
            lineStyle={lineStyle}
            noteIsActive={noteIsActive}
            volumeIsActive={volumeIsActive}
            onLineClick={onLineClick}
            formatNoteDisplay={formatTrackNoteDisplay}
          />
        );
      })}
    </>
  );
};

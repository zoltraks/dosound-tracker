import React from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { formatHexId } from '../utils/hexFormatting';

interface PlaylistEntry {
  A: string;
  B: string;
  C: string;
}

const formatPatternDisplay = (patternId: string): string => {
  if (patternId === '--') return '--';
  return patternId;
};

interface PlaylistLineProps {
  index: number;
  entry: PlaylistEntry;
  lineClassName: string;
  patternClassA: string;
  patternClassB: string;
  patternClassC: string;
  isCurrentLine: boolean;
  currentTrack: 'A' | 'B' | 'C';
  isEditing: boolean;
  editingPattern: string;
  onEditingPatternChange: (value: string) => void;
  onFinishEditingPattern: (options?: { refocusPlaylist?: boolean }) => void;
  onLineClick: (index: number) => void;
  onPatternClick: (index: number, track: 'A' | 'B' | 'C') => void;
  onPatternRightClick: (
    index: number,
    track: 'A' | 'B' | 'C',
    event: React.MouseEvent<HTMLSpanElement | HTMLDivElement>,
  ) => void;
  onCreatePatternAt: (index: number, track: 'A' | 'B' | 'C') => void;
  onMoveLine: (index: number, direction: 'up' | 'down') => void;
  playlistLength: number;
  onTrackHeaderClick: (track: 'A' | 'B' | 'C') => void;
}

export const PlaylistLine: React.FC<PlaylistLineProps> = ({
  index,
  entry,
  lineClassName,
  patternClassA,
  patternClassB,
  patternClassC,
  isCurrentLine,
  currentTrack,
  isEditing,
  editingPattern,
  onEditingPatternChange,
  onFinishEditingPattern,
  onLineClick,
  onPatternClick,
  onPatternRightClick,
  onCreatePatternAt,
  onMoveLine,
  playlistLength,
  onTrackHeaderClick,
}) => {
  const handleInputKeyDown = (
    event: React.KeyboardEvent<HTMLInputElement>,
    track: 'A' | 'B' | 'C',
  ) => {
    const key = event.key.toUpperCase();
    if (event.key === 'Enter' && event.ctrlKey) {
      event.preventDefault();
      event.stopPropagation();
      onFinishEditingPattern({ refocusPlaylist: false });
      onTrackHeaderClick(track);
    } else if (event.key === 'Enter') {
      onFinishEditingPattern();
    } else if (event.key === 'Escape') {
      onEditingPatternChange('');
    } else if (key === 'N') {
      event.preventDefault();
      onEditingPatternChange('');
      onCreatePatternAt(index, track);
    }
  };

  const renderPatternCell = (track: 'A' | 'B' | 'C') => {
    const patternClass =
      track === 'A' ? patternClassA : track === 'B' ? patternClassB : patternClassC;
    const patternValue = track === 'A' ? entry.A : track === 'B' ? entry.B : entry.C;

    if (isCurrentLine && currentTrack === track && isEditing) {
      return (
        <input
          type="text"
          className="pattern-input"
          value={editingPattern}
          onChange={(event) =>
            onEditingPatternChange(event.target.value.toUpperCase().slice(0, 2))
          }
          onBlur={() => onFinishEditingPattern()}
          onKeyDown={(event) => handleInputKeyDown(event, track)}
          autoFocus
          maxLength={2}
        />
      );
    }

    return (
      <span
        className={patternClass}
        onClick={(event) => {
          event.stopPropagation();
          onPatternClick(index, track);
        }}
        onContextMenu={(event) => onPatternRightClick(index, track, event)}
      >
        {formatPatternDisplay(patternValue)}
      </span>
    );
  };

  return (
    <div
      className={lineClassName}
      onClick={() => onLineClick(index)}
      onContextMenu={(event) => {
        event.preventDefault();
        event.stopPropagation();
        onPatternClick(index, currentTrack);
        onTrackHeaderClick(currentTrack);
      }}
    >
      <span className="line-number">
        {formatHexId(index)}
      </span>

      {renderPatternCell('A')}
      {renderPatternCell('B')}
      {renderPatternCell('C')}

      <div
        className="playlist-move-buttons"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          onClick={() => onMoveLine(index, 'down')}
          aria-label="Move position down"
          disabled={index === playlistLength - 1}
        >
          <ChevronDown className="h-3 w-3 rotate-90" />
        </button>
        <button
          type="button"
          onClick={() => onMoveLine(index, 'up')}
          aria-label="Move position up"
          disabled={index === 0}
        >
          <ChevronUp className="h-3 w-3 rotate-90" />
        </button>
      </div>
    </div>
  );
};

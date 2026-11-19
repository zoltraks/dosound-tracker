import React from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { Formatter } from '../../utils/format/formatters.ts';
import type { PlaylistEntry } from '../../types/playlist.ts';
import type { SongChannelId } from '../../synth/SoundDriver.ts';

interface PlaylistLineProps {
  index: number;
  entry: PlaylistEntry;
  lineClassName: string;
  patternClasses: Partial<Record<SongChannelId, string>>;
  tracks: readonly SongChannelId[];
  isCurrentLine: boolean;
  currentTrack: SongChannelId;
  isEditing: boolean;
  editingPattern: string | null;
  onEditingPatternChange: (value: string | null) => void;
  onFinishEditingPattern: (options?: { refocusPlaylist?: boolean }) => void;
  onLineClick: (index: number) => void;
  onPatternClick: (index: number, track: SongChannelId) => void;
  onPatternRightClick: (
    index: number,
    track: SongChannelId,
    event: React.MouseEvent<HTMLSpanElement | HTMLDivElement>,
  ) => void;
  onCreatePatternAt: (index: number, track: SongChannelId) => void;
  onMoveLine: (index: number, direction: 'up' | 'down') => void;
  playlistLength: number;
  onTrackHeaderClick: (track: SongChannelId) => void;
}

export const PlaylistLine: React.FC<PlaylistLineProps> = ({
  index,
  entry,
  lineClassName,
  patternClasses,
  tracks,
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
    track: SongChannelId,
  ) => {
    const key = event.key.toUpperCase();
    if (event.key === 'Enter' && event.altKey && !event.ctrlKey && !event.metaKey) {
      event.preventDefault();
      event.stopPropagation();
      onFinishEditingPattern({ refocusPlaylist: false });
      onTrackHeaderClick(track);
    } else if (event.key === 'Enter') {
      event.preventDefault();
      event.stopPropagation();
      onFinishEditingPattern();
    } else if (event.key === 'Escape') {
      onEditingPatternChange(null);
    } else if (key === 'N') {
      event.preventDefault();
      onEditingPatternChange(null);
      onCreatePatternAt(index, track);
    }
  };

  const renderPatternCell = (track: SongChannelId) => {
    const patternClass = patternClasses[track] ?? '';
    const patternValue = entry[track];

    if (isCurrentLine && currentTrack === track && isEditing) {
      return (
        <input
          type="text"
          className="pattern-input"
          value={editingPattern ?? ''}
          onChange={(event) => onEditingPatternChange(event.target.value.toUpperCase().slice(0, 2))}
          onBlur={() => onFinishEditingPattern()}
          onKeyDown={(event) => handleInputKeyDown(event, track)}
          autoFocus
          maxLength={2}
          size={2}
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
        {patternValue}
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
      <span className="line-number">{Formatter.hex(index, { padWidth: 2, uppercase: true })}</span>

      {tracks.map((track) => (
        <React.Fragment key={track}>{renderPatternCell(track)}</React.Fragment>
      ))}

      <div className="playlist-move-buttons" onClick={(event) => event.stopPropagation()}>
        <button
          type="button"
          onClick={() => onMoveLine(index, 'down')}
          aria-label="Move position down"
          disabled={index === playlistLength - 1}
        >
          <ChevronDown size={12} />
        </button>
        <button
          type="button"
          onClick={() => onMoveLine(index, 'up')}
          aria-label="Move position up"
          disabled={index === 0}
        >
          <ChevronUp size={12} />
        </button>
      </div>
    </div>
  );
};

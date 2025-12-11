import React from 'react';

interface PlaylistHeaderProps {
  targetTrack: 'A' | 'B' | 'C';
  onTrackHeaderClick: (track: 'A' | 'B' | 'C') => void;
}

export const PlaylistHeader: React.FC<PlaylistHeaderProps> = ({
  targetTrack,
  onTrackHeaderClick,
}) => {
  return (
    <div className="playlist-header-row">
      <span className="track-header-left" />
      {(['A', 'B', 'C'] as const).map((track) => (
        <span
          key={track}
          className={`track-header ${targetTrack === track ? 'target-track' : ''}`}
          onClick={(event) => {
            event.stopPropagation();
            onTrackHeaderClick(track);
          }}
          onContextMenu={(event) => {
            event.preventDefault();
            event.stopPropagation();
            onTrackHeaderClick(track);
          }}
        >
          {track}
        </span>
      ))}
      <span className="track-header-right" />
    </div>
  );
};

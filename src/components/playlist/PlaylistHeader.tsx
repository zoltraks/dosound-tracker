import React from 'react';
import type { SongChannelId } from '../../synth/SoundDriver.ts';

interface PlaylistHeaderProps {
  targetTrack: SongChannelId;
  tracks: readonly SongChannelId[];
  onTrackHeaderClick: (track: SongChannelId) => void;
}

export const PlaylistHeader: React.FC<PlaylistHeaderProps> = ({
  targetTrack,
  tracks,
  onTrackHeaderClick,
}) => {
  return (
    <div className="playlist-header-row">
      <span className="track-header-left" />
      {tracks.map((track) => (
        <span
          key={track}
          className={`track-header ${targetTrack === track ? 'target-track' : ''}`}
          role="button"
          aria-label={`Select target track ${track}`}
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

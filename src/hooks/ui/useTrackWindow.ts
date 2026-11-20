import { useEffect, useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import type { SongChannelId } from '../../synth/SoundDriver.ts';
import { SONG_CHANNEL_IDS } from '../../constants/song.ts';
import {
  CHIP1_TRACK_IDS,
  nextTrackWindowStart,
  visibleTrackIds,
} from '../../utils/song/visibleTracks.ts';
import { loadSettings } from '../../utils/settings/settingsState.ts';

export interface UseTrackWindowParams {
  chipCount: 1 | 2;
  targetTrackId: SongChannelId;
  previewChannel: number;
}

export interface UseTrackWindowResult {
  visibleTracks: 3 | 6;
  setVisibleTracks: Dispatch<SetStateAction<3 | 6>>;
  songTracks: SongChannelId[];
  effectiveTargetTrackId: SongChannelId;
  effectivePreviewChannel: number;
  trackChannelCount: number;
}

// The sliding three-track window over the song's channels. The window
// start persists as the hysteresis anchor while the visible projection is
// derived during render so the first commit already frames the focused
// channel; resolving it in an effect would paint one stale frame per
// channel hop.
export function useTrackWindow({
  chipCount,
  targetTrackId,
  previewChannel,
}: UseTrackWindowParams): UseTrackWindowResult {
  const twoChip = chipCount === 2;
  const [visibleTracks, setVisibleTracks] = useState<3 | 6>(
    () => loadSettings().general.visibleTracks,
  );
  const [trackWindowStart, setTrackWindowStart] = useState(0);

  const targetChannelIndex = SONG_CHANNEL_IDS.indexOf(targetTrackId);
  const effectiveWindowStart =
    twoChip && visibleTracks === 3 && targetChannelIndex >= 0
      ? nextTrackWindowStart(trackWindowStart, targetChannelIndex)
      : trackWindowStart;
  const songTracks = visibleTrackIds(twoChip, visibleTracks, effectiveWindowStart);

  // A persisted cursor or focus on a hidden channel (stored six-track state
  // on a single-chip song, or the inactive chip group) falls back to the
  // first visible track so focus never lands on an unrendered panel.
  const effectiveTargetTrackId = songTracks.includes(targetTrackId)
    ? targetTrackId
    : (songTracks[0] ?? 'A');
  const previewChannelTrack = SONG_CHANNEL_IDS[previewChannel] ?? 'A';
  const effectivePreviewChannel = songTracks.includes(previewChannelTrack)
    ? previewChannel
    : SONG_CHANNEL_IDS.indexOf(songTracks[0] ?? 'A');

  // Persist the render-derived window as the hysteresis anchor; the visible
  // projection above already applied the shift in the same commit.
  useEffect(() => {
    if (!twoChip || visibleTracks !== 3) {
      return;
    }
    const targetIndex = SONG_CHANNEL_IDS.indexOf(targetTrackId);
    if (targetIndex < 0) {
      return;
    }
    /* eslint-disable-next-line react-hooks/set-state-in-effect */
    setTrackWindowStart((start) => nextTrackWindowStart(start, targetIndex));
  }, [twoChip, visibleTracks, targetTrackId]);

  const trackChannelCount = twoChip ? SONG_CHANNEL_IDS.length : CHIP1_TRACK_IDS.length;

  return {
    visibleTracks,
    setVisibleTracks,
    songTracks,
    effectiveTargetTrackId,
    effectivePreviewChannel,
    trackChannelCount,
  };
}

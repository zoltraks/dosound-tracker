import { useCallback, useEffect, useMemo, useState } from 'react';
import { StorageKeys } from '../../utils/storage/storageKeys.ts';
import type { NavigationSection } from '../../constants/navigation.ts';
import type { SongChannelId } from '../../synth/SoundDriver.ts';
import { SONG_CHANNEL_IDS } from '../../constants/song.ts';

const TRACK_SECTION_TO_CHANNEL: Record<string, SongChannelId> = {
  trackA: 'A',
  trackB: 'B',
  trackC: 'C',
  trackD: 'D',
  trackE: 'E',
  trackF: 'F',
};

export const useTrackFocus = ({ activeSection }: { activeSection: NavigationSection }) => {
  const [lastTrackId, setLastTrackId] = useState<SongChannelId>('A');
  const [currentTrackColumn, setCurrentTrackColumn] = useState<'note' | 'volume'>('note');
  const [trackFocusRevision, setTrackFocusRevision] = useState(0);
  const [instrumentPanelFocusRevision, setInstrumentPanelFocusRevision] = useState(0);
  const [playlistFocusRevision, setPlaylistFocusRevision] = useState(0);
  const [trackBackgroundEnabled, setTrackBackgroundEnabled] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem(StorageKeys.TRACK_BACKGROUND_ENABLED);
      if (stored === '0' || stored === '1') {
        return stored === '1';
      }
    } catch {
      // ignore
    }
    return true;
  });

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    const channel = TRACK_SECTION_TO_CHANNEL[activeSection];
    if (channel) {
      setLastTrackId(channel);
    }
  }, [activeSection]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const targetTrackId = useMemo<SongChannelId>(() => {
    return TRACK_SECTION_TO_CHANNEL[activeSection] ?? lastTrackId;
  }, [activeSection, lastTrackId]);

  const handleToggleTrackBackground = useCallback(() => {
    setTrackBackgroundEnabled((prev) => !prev);
  }, []);

  const previewChannel = useMemo(() => {
    const channelId = TRACK_SECTION_TO_CHANNEL[activeSection] ?? lastTrackId;
    const index = SONG_CHANNEL_IDS.indexOf(channelId);
    return index >= 0 ? index : 0;
  }, [activeSection, lastTrackId]);

  return {
    lastTrackId,
    setLastTrackId,
    currentTrackColumn,
    setCurrentTrackColumn,
    trackFocusRevision,
    setTrackFocusRevision,
    instrumentPanelFocusRevision,
    setInstrumentPanelFocusRevision,
    playlistFocusRevision,
    setPlaylistFocusRevision,
    trackBackgroundEnabled,
    setTrackBackgroundEnabled,
    handleToggleTrackBackground,
    targetTrackId,
    previewChannel,
  };
};

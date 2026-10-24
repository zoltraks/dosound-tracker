import { useCallback, useEffect, useMemo, useState } from 'react';
import { StorageKeys } from '../../utils/storage/storageKeys.ts';
import type { NavigationSection } from '../../constants/navigation.ts';

export const useTrackFocus = ({ activeSection }: { activeSection: NavigationSection }) => {
  const [lastTrackId, setLastTrackId] = useState<'A' | 'B' | 'C'>('A');
  const [currentTrackColumn, setCurrentTrackColumn] = useState<'note' | 'volume'>('note');
  const [trackFocusRevision, setTrackFocusRevision] = useState(0);
  const [instrumentPanelFocusRevision, setInstrumentPanelFocusRevision] = useState(0);
  const [trackBackgroundEnabled, setTrackBackgroundEnabled] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem(StorageKeys.TRACK_BACKGROUND_ENABLED);
      if (stored === '0' || stored === '1') {
        return stored === '1';
      }
    } catch {
      // ignore
    }
    // Default: enabled (use per-track backgrounds)
    return true;
  });

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (activeSection === 'trackA') {
      setLastTrackId('A');
    } else if (activeSection === 'trackB') {
      setLastTrackId('B');
    } else if (activeSection === 'trackC') {
      setLastTrackId('C');
    }
  }, [activeSection]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const targetTrackId = useMemo<'A' | 'B' | 'C'>(() => {
    if (activeSection === 'trackA') return 'A';
    if (activeSection === 'trackB') return 'B';
    if (activeSection === 'trackC') return 'C';
    return lastTrackId;
  }, [activeSection, lastTrackId]);

  const handleToggleTrackBackground = useCallback(() => {
    setTrackBackgroundEnabled((prev) => !prev);
  }, []);

  const previewChannel =
    activeSection === 'trackA'
      ? 0
      : activeSection === 'trackB'
        ? 1
        : activeSection === 'trackC'
          ? 2
          : lastTrackId === 'B'
            ? 1
            : lastTrackId === 'C'
              ? 2
              : 0;

  return {
    lastTrackId,
    setLastTrackId,
    currentTrackColumn,
    setCurrentTrackColumn,
    trackFocusRevision,
    setTrackFocusRevision,
    instrumentPanelFocusRevision,
    setInstrumentPanelFocusRevision,
    trackBackgroundEnabled,
    handleToggleTrackBackground,
    targetTrackId,
    previewChannel,
  };
};

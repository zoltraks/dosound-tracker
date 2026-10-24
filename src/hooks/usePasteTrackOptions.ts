import { useCallback, useEffect, useRef, useState } from 'react';
import type { TrackPasteMode } from './useTrackOperations';
import { StorageKeys } from '../utils/storageKeys';

export interface UsePasteTrackOptionsResult {
  pasteTrackMode: TrackPasteMode;
  pasteTrackPendingMode: TrackPasteMode;
  setPasteTrackPendingMode: (mode: TrackPasteMode) => void;
  isPasteTrackModalOpen: boolean;
  getPasteTrackMode: (options: { hasExistingData: boolean }) => Promise<TrackPasteMode | null>;
  handleConfirmPasteTrackModal: () => void;
  handleCancelPasteTrackModal: () => void;
}

export function usePasteTrackOptions(): UsePasteTrackOptionsResult {
  const [pasteTrackMode, setPasteTrackMode] = useState<TrackPasteMode>(() => {
    try {
      const stored = localStorage.getItem(StorageKeys.PASTE_TRACK_MODE);
      if (stored === 'replace' || stored === 'overwriteAll' || stored === 'overwriteEmpty') {
        return stored as TrackPasteMode;
      }
    } catch {
      // ignore
    }
    return 'replace';
  });

  const [pasteTrackPendingMode, setPasteTrackPendingMode] =
    useState<TrackPasteMode>(pasteTrackMode);
  const [isPasteTrackModalOpen, setIsPasteTrackModalOpen] = useState(false);
  const pasteTrackModalResolveRef = useRef<((mode: TrackPasteMode | null) => void) | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(StorageKeys.PASTE_TRACK_MODE, pasteTrackMode);
    } catch {
      // ignore
    }
  }, [pasteTrackMode]);

  const getPasteTrackMode = useCallback(
    (_options: { hasExistingData: boolean }): Promise<TrackPasteMode | null> => {
      // Explicitly reference _options so it is considered used by lint, even
      // though the current implementation does not depend on its value.
      void _options;

      return new Promise((resolve) => {
        pasteTrackModalResolveRef.current = resolve;
        setPasteTrackPendingMode(pasteTrackMode);
        setIsPasteTrackModalOpen(true);
      });
    },
    [pasteTrackMode],
  );

  const handleConfirmPasteTrackModal = useCallback(() => {
    const resolver = pasteTrackModalResolveRef.current;
    pasteTrackModalResolveRef.current = null;
    setIsPasteTrackModalOpen(false);
    setPasteTrackMode(pasteTrackPendingMode);
    if (resolver) {
      resolver(pasteTrackPendingMode);
    }
  }, [pasteTrackPendingMode]);

  const handleCancelPasteTrackModal = useCallback(() => {
    const resolver = pasteTrackModalResolveRef.current;
    pasteTrackModalResolveRef.current = null;
    setIsPasteTrackModalOpen(false);
    if (resolver) {
      resolver(null);
    }
  }, []);

  return {
    pasteTrackMode,
    pasteTrackPendingMode,
    setPasteTrackPendingMode,
    isPasteTrackModalOpen,
    getPasteTrackMode,
    handleConfirmPasteTrackModal,
    handleCancelPasteTrackModal,
  };
}

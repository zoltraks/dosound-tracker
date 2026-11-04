/**
 * Persists the view-state snapshot (docs/change/1.3.7/ui-state-restoration.md).
 * One hook does both directions: `restoreView` re-opens the saved modal on
 * mount through the existing open handlers, and an effect rewrites the
 * snapshot whenever a restorable flag or the cursor line changes. Writes are
 * trailing-throttled because `sharedCurrentLine` moves at playback rate.
 */
import { useEffect, useRef } from 'react';
import {
  loadUiState,
  saveUiState,
  updateWindowScroll,
  type RestorableModal,
} from '../../utils/storage/uiState.ts';

export interface UiStatePersistenceFlags {
  isManualOpen: boolean;
  isChangelogOpen: boolean;
  isAboutOpen: boolean;
  isDownloadOpen: boolean;
  isDebugInfoOpen: boolean;
  isMidiModalOpen: boolean;
  isInstrumentMidiOpen: boolean;
  isInstrumentColorOpen: boolean;
  isExportModalOpen: boolean;
}

export interface UiStatePersistenceActions {
  restoreView: () => void;
}

const deriveOpenModal = (f: UiStatePersistenceFlags): RestorableModal | null => {
  if (f.isManualOpen) return 'manual';
  if (f.isChangelogOpen) return 'changelog';
  if (f.isAboutOpen) return 'about';
  if (f.isDownloadOpen) return 'download';
  if (f.isDebugInfoOpen) return 'debugInfo';
  if (f.isMidiModalOpen) return 'midi';
  if (f.isInstrumentMidiOpen) return 'instrumentMidi';
  if (f.isInstrumentColorOpen) return 'instrumentColor';
  if (f.isExportModalOpen) return 'export';
  return null;
};

export function useUiStatePersistence(
  flags: UiStatePersistenceFlags,
  sharedCurrentLine: number,
  openHandlers: Record<RestorableModal, () => void>,
): UiStatePersistenceActions {
  const restored = useRef(false);

  const restoreView = () => {
    if (restored.current) {
      return;
    }
    restored.current = true;
    const saved = loadUiState();
    if (saved.openModal) {
      openHandlers[saved.openModal]?.();
    }
    if (saved.windowScroll > 0) {
      window.scrollTo(0, saved.windowScroll);
    }
  };

  useEffect(() => {
    const onScroll = () => updateWindowScroll(window.scrollY);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      const current = loadUiState();
      saveUiState({
        openModal: deriveOpenModal(flags),
        sharedCurrentLine,
        markdownScroll: current.markdownScroll,
        windowScroll: window.scrollY,
      });
    }, 300);
    return () => clearTimeout(timer);
  });

  return { restoreView };
}

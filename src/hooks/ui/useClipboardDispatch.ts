import { useCallback } from 'react';

export interface UseClipboardDispatchParams {
  isEnvelopeSectionActive: boolean;
  handleCopyEnvelope: () => Promise<void>;
  handlePasteEnvelope: () => Promise<void>;
  handleCopyTrackShortcut: () => void;
  handlePasteTrackShortcut: () => void;
}

export interface UseClipboardDispatchResult {
  handleCopyClipboard: () => void;
  handlePasteClipboard: () => void;
}

// Clipboard routing at the composition root: CTRL+C/CTRL+V land on the
// envelope clipboard while an envelope section is active and on the track
// clipboard everywhere else.
export function useClipboardDispatch({
  isEnvelopeSectionActive,
  handleCopyEnvelope,
  handlePasteEnvelope,
  handleCopyTrackShortcut,
  handlePasteTrackShortcut,
}: UseClipboardDispatchParams): UseClipboardDispatchResult {
  const handleCopyClipboard = useCallback(() => {
    if (isEnvelopeSectionActive) {
      void handleCopyEnvelope();
      return;
    }
    handleCopyTrackShortcut();
  }, [isEnvelopeSectionActive, handleCopyEnvelope, handleCopyTrackShortcut]);

  const handlePasteClipboard = useCallback(() => {
    if (isEnvelopeSectionActive) {
      void handlePasteEnvelope();
      return;
    }
    handlePasteTrackShortcut();
  }, [isEnvelopeSectionActive, handlePasteEnvelope, handlePasteTrackShortcut]);

  return { handleCopyClipboard, handlePasteClipboard };
}

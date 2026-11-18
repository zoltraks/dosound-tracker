import React from 'react';
import type { TrackPasteMode } from '../../hooks/song/useTrackOperations.ts';

const PasteTrackModal = React.lazy(async () => {
  const { PasteTrackModal } = await import('../../modals/track/PasteTrackModal.tsx');
  return { default: PasteTrackModal };
});

export interface PasteTrackModalGroupParams {
  isPasteTrackModalOpen: boolean;
  pasteTrackPendingMode: TrackPasteMode;
  setPasteTrackPendingMode: (mode: TrackPasteMode) => void;
  onConfirmPasteTrackModal: () => void;
  onCancelPasteTrackModal: () => void;
}

export type PasteTrackModalGroupProps = PasteTrackModalGroupParams;

export function PasteTrackModalGroup({
  isPasteTrackModalOpen,
  pasteTrackPendingMode,
  setPasteTrackPendingMode,
  onConfirmPasteTrackModal,
  onCancelPasteTrackModal,
}: PasteTrackModalGroupProps) {
  if (!isPasteTrackModalOpen) {
    return null;
  }

  return (
    <React.Suspense fallback={null}>
      <PasteTrackModal
        isOpen={isPasteTrackModalOpen}
        mode={pasteTrackPendingMode}
        onModeChange={setPasteTrackPendingMode}
        onConfirm={onConfirmPasteTrackModal}
        onCancel={onCancelPasteTrackModal}
      />
    </React.Suspense>
  );
}

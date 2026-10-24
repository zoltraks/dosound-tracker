import { useCallback, useMemo } from 'react';
import { SUPPORTED_SONG_CHIPS, SUPPORTED_SONG_FRAMES } from '../../constants/song.ts';
import type { PendingSongImport } from './useDataManagement.ts';

type UseSongImportWarningParams = {
  pendingSongImport: PendingSongImport | null;
  confirmPendingSongImport: () => void;
  cancelPendingSongImport: () => void;
};

export const useSongImportWarning = ({
  pendingSongImport,
  confirmPendingSongImport,
  cancelPendingSongImport,
}: UseSongImportWarningParams) => {
  const configurationWarningMessage = useMemo(() => {
    if (!pendingSongImport) {
      return '';
    }

    const warnings: string[] = [];
    const { metadata } = pendingSongImport;

    if (metadata.hasChipField && !metadata.isChipSupported) {
      const provided = metadata.providedChipValue ?? metadata.normalizedChip;
      warnings.push(
        `Chip value "${String(provided)}" is not supported.\n\nSupported chips: ${SUPPORTED_SONG_CHIPS.join(', ')}.`,
      );
    }

    if (metadata.hasFrameField && !metadata.isFrameSupported) {
      const provided = metadata.providedFrameValue ?? metadata.normalizedFrame;
      warnings.push(
        `Frame value "${String(provided)}" is not supported.\n\nSupported frame rates: ${SUPPORTED_SONG_FRAMES.join(', ')}.`,
      );
    }

    if (warnings.length === 0) {
      return '';
    }

    return `${warnings.join('\n\n')}\n\nLoad the song anyway?`;
  }, [pendingSongImport]);

  const handleConfirmSongConfigurationWarning = useCallback(() => {
    confirmPendingSongImport();
  }, [confirmPendingSongImport]);

  const handleCancelSongConfigurationWarning = useCallback(() => {
    cancelPendingSongImport();
  }, [cancelPendingSongImport]);

  return {
    configurationWarningMessage,
    handleConfirmSongConfigurationWarning,
    handleCancelSongConfigurationWarning,
  };
};

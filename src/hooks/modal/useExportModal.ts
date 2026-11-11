/* eslint-disable react-hooks/exhaustive-deps */
import { useCallback, useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import type { ExportType, ExportStrategy, ExportFormat } from '../../constants/export.ts';
import type { ExportContext } from '../file/useExportOperations.ts';
import type { Instrument } from '../../synth/SoundDriver.ts';

export interface UseExportModalParams {
  exportType: ExportType;
  setExportType: Dispatch<SetStateAction<ExportType>>;
  exportStrategy: ExportStrategy;
  setExportStrategy: Dispatch<SetStateAction<ExportStrategy>>;
  setIsExportModalOpen: (open: boolean) => void;
  clampedPlaybackPosition: number;
  sharedCurrentLine: number;
  currentInstrument: Instrument;
  exportDataWithContext: (ctx: ExportContext) => void;
  exportBinWithContext: (ctx: ExportContext) => void;
  exportVgmWithContext: (ctx: ExportContext) => void;
  exportWavWithContext: (ctx: ExportContext) => void;
  exportDumpWithContext: (ctx: ExportContext) => void;
  exportMaxWithContext: (ctx: ExportContext) => void;
  exportMidiWithContext: (ctx: ExportContext) => void;
  exportModWithContext: (ctx: ExportContext) => void;
}

export interface UseExportModalResult {
  pendingExportType: ExportType;
  pendingExportStrategy: ExportStrategy;
  handleOpenExport: () => void;
  handleCancelExport: () => void;
  handleConfirmExport: () => void;
  handleExportTypeChange: (type: ExportType) => void;
  handleExportStrategyChange: (strategy: ExportStrategy) => void;
  handleExportFormatFromModal: (format: ExportFormat) => void;
}

export function useExportModal({
  exportType,
  setExportType,
  exportStrategy,
  setExportStrategy,
  setIsExportModalOpen,
  clampedPlaybackPosition,
  sharedCurrentLine,
  currentInstrument,
  exportDataWithContext,
  exportBinWithContext,
  exportVgmWithContext,
  exportWavWithContext,
  exportDumpWithContext,
  exportMaxWithContext,
  exportMidiWithContext,
  exportModWithContext,
}: UseExportModalParams): UseExportModalResult {
  const [pendingExportType, setPendingExportType] = useState<ExportType>(exportType);
  const [pendingExportStrategy, setPendingExportStrategy] =
    useState<ExportStrategy>(exportStrategy);

  const handleOpenExport = useCallback(() => {
    setPendingExportType(exportType);
    setPendingExportStrategy(exportStrategy);
    setIsExportModalOpen(true);
  }, [exportType, exportStrategy]);

  const handleCancelExport = useCallback(() => {
    setIsExportModalOpen(false);
  }, []);

  const handleConfirmExport = useCallback(() => {
    setExportType(pendingExportType);
    setExportStrategy(pendingExportStrategy);
    setIsExportModalOpen(false);
  }, [pendingExportType, pendingExportStrategy, setExportType, setExportStrategy]);

  const handleExportTypeChange = useCallback((type: ExportType) => {
    setPendingExportType(type);
  }, []);

  const handleExportStrategyChange = useCallback((strategy: ExportStrategy) => {
    setPendingExportStrategy(strategy);
  }, []);

  const buildExportContext = useCallback(
    (): ExportContext => ({
      type: pendingExportType,
      strategy: pendingExportStrategy,
      playlistIndex: clampedPlaybackPosition,
      currentLine: sharedCurrentLine,
      instrument: currentInstrument ?? null,
    }),
    [
      pendingExportType,
      pendingExportStrategy,
      clampedPlaybackPosition,
      sharedCurrentLine,
      currentInstrument,
    ],
  );

  const exportFormatHandlers: Record<ExportFormat, (ctx: ExportContext) => void> = {
    data: exportDataWithContext,
    bin: exportBinWithContext,
    vgm: exportVgmWithContext,
    wav: exportWavWithContext,
    max: exportMaxWithContext,
    midi: exportMidiWithContext,
    mod: exportModWithContext,
    dump: exportDumpWithContext,
  };

  const handleExportFormatFromModal = useCallback(
    (format: ExportFormat) => {
      exportFormatHandlers[format](buildExportContext());
    },
    [
      buildExportContext,
      exportDataWithContext,
      exportBinWithContext,
      exportVgmWithContext,
      exportWavWithContext,
      exportMaxWithContext,
      exportMidiWithContext,
      exportModWithContext,
      exportDumpWithContext,
    ],
  );

  return {
    pendingExportType,
    pendingExportStrategy,
    handleOpenExport,
    handleCancelExport,
    handleConfirmExport,
    handleExportTypeChange,
    handleExportStrategyChange,
    handleExportFormatFromModal,
  };
}

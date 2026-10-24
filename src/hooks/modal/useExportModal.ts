/* eslint-disable react-hooks/exhaustive-deps */
import { useCallback, useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import type { ExportType, ExportStrategy } from '../../constants/export.ts';
import type { ExportContext } from '../file/useFileOperations.ts';
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
}

export interface UseExportModalResult {
  pendingExportType: ExportType;
  pendingExportStrategy: ExportStrategy;
  handleOpenExport: () => void;
  handleCancelExport: () => void;
  handleConfirmExport: () => void;
  handleExportTypeChange: (type: ExportType) => void;
  handleExportStrategyChange: (strategy: ExportStrategy) => void;
  handleExportDumpFromModal: () => void;
  handleExportDataFromModal: () => void;
  handleExportBinFromModal: () => void;
  handleExportVgmFromModal: () => void;
  handleExportWavFromModal: () => void;
  handleExportMaxFromModal: () => void;
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

  const handleExportDumpFromModal = useCallback(() => {
    exportDumpWithContext(buildExportContext());
  }, [buildExportContext, exportDumpWithContext]);

  const handleExportDataFromModal = useCallback(() => {
    exportDataWithContext(buildExportContext());
  }, [buildExportContext, exportDataWithContext]);

  const handleExportBinFromModal = useCallback(() => {
    exportBinWithContext(buildExportContext());
  }, [buildExportContext, exportBinWithContext]);

  const handleExportVgmFromModal = useCallback(() => {
    exportVgmWithContext(buildExportContext());
  }, [buildExportContext, exportVgmWithContext]);

  const handleExportWavFromModal = useCallback(() => {
    exportWavWithContext(buildExportContext());
  }, [buildExportContext, exportWavWithContext]);

  const handleExportMaxFromModal = useCallback(() => {
    exportMaxWithContext(buildExportContext());
  }, [buildExportContext, exportMaxWithContext]);

  return {
    pendingExportType,
    pendingExportStrategy,
    handleOpenExport,
    handleCancelExport,
    handleConfirmExport,
    handleExportTypeChange,
    handleExportStrategyChange,
    handleExportDumpFromModal,
    handleExportDataFromModal,
    handleExportBinFromModal,
    handleExportVgmFromModal,
    handleExportWavFromModal,
    handleExportMaxFromModal,
  };
}

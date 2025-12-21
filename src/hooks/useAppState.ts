import { useEffect, useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import type { ExportType, ExportStrategy } from '../constants/export';
import { StorageKeys } from '../utils/storageKeys';

export interface UseAppStateResult {
  isDebugMode: boolean;
  setIsDebugMode: Dispatch<SetStateAction<boolean>>;
  exportType: ExportType;
  setExportType: Dispatch<SetStateAction<ExportType>>;
  exportStrategy: ExportStrategy;
  setExportStrategy: Dispatch<SetStateAction<ExportStrategy>>;
  transposeScope: 'line' | 'song';
  setTransposeScope: Dispatch<SetStateAction<'line' | 'song'>>;
  transposeTrackScope: 'current' | 'all';
  setTransposeTrackScope: Dispatch<SetStateAction<'current' | 'all'>>;
  transposeInstrumentScope: 'all' | 'selected';
  setTransposeInstrumentScope: Dispatch<SetStateAction<'all' | 'selected'>>;
  transposeAmount: number;
  setTransposeAmount: Dispatch<SetStateAction<number>>;
  transposeAmountInput: string;
  setTransposeAmountInput: Dispatch<SetStateAction<string>>;
}

export function useAppState(): UseAppStateResult {
  const [isDebugMode, setIsDebugMode] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem(StorageKeys.DEBUG_MODE);
      if (stored === 'on') return true;
      if (stored === 'off') return false;
    } catch {
      // ignore
    }
    return false;
  });

  const [exportType, setExportType] = useState<ExportType>(() => {
    try {
      const stored = localStorage.getItem(StorageKeys.EXPORT_TYPE);
      if (stored === 'song' || stored === 'pattern' || stored === 'instrument') {
        return stored;
      }
    } catch {
      // ignore
    }
    return 'song';
  });

  const [exportStrategy, setExportStrategy] = useState<ExportStrategy>(() => {
    try {
      const savedDumpMode = localStorage.getItem(StorageKeys.DUMP_MODE);
      if (savedDumpMode === 'simple' || savedDumpMode === 'complex' || savedDumpMode === 'optimized') {
        return savedDumpMode;
      }
    } catch {
      // ignore
    }
    return 'complex';
  });

  useEffect(() => {
    try {
      localStorage.setItem(StorageKeys.DUMP_MODE, exportStrategy);
    } catch {
      // ignore
    }
  }, [exportStrategy]);

  const [transposeScope, setTransposeScope] = useState<'line' | 'song'>(() => {
    try {
      const settings = JSON.parse(localStorage.getItem(StorageKeys.TRANSPOSE_SETTINGS) || 'null');
      if (settings?.scope === 'line' || settings?.scope === 'song') {
        return settings.scope;
      }
    } catch { /* ignore */ }
    return 'line';
  });

  const [transposeTrackScope, setTransposeTrackScope] = useState<'current' | 'all'>(() => {
    try {
      const settings = JSON.parse(localStorage.getItem(StorageKeys.TRANSPOSE_SETTINGS) || 'null');
      if (settings?.trackScope === 'current' || settings?.trackScope === 'all') {
        return settings.trackScope;
      }
    } catch { /* ignore */ }
    return 'current';
  });

  const [transposeInstrumentScope, setTransposeInstrumentScope] = useState<'all' | 'selected'>(() => {
    try {
      const settings = JSON.parse(localStorage.getItem(StorageKeys.TRANSPOSE_SETTINGS) || 'null');
      if (settings?.instrumentScope === 'all' || settings?.instrumentScope === 'selected') {
        return settings.instrumentScope;
      }
    } catch { /* ignore */ }
    return 'all';
  });

  const [transposeAmount, setTransposeAmount] = useState<number>(() => {
    try {
      const settings = JSON.parse(localStorage.getItem(StorageKeys.TRANSPOSE_SETTINGS) || 'null');
      if (typeof settings?.amount === 'number' && Number.isFinite(settings.amount)) {
        return settings.amount;
      }
    } catch { /* ignore */ }
    return 0;
  });

  const [transposeAmountInput, setTransposeAmountInput] = useState<string>(() => {
    try {
      const settings = JSON.parse(localStorage.getItem(StorageKeys.TRANSPOSE_SETTINGS) || 'null');
      if (typeof settings?.amount === 'number' && Number.isFinite(settings.amount)) {
        return String(settings.amount);
      }
    } catch { /* ignore */ }
    return '0';
  });

  // Persist transpose settings whenever they change so they survive reloads
  // until the RESET action clears localStorage.
  useEffect(() => {
    try {
      const payload = {
        scope: transposeScope,
        trackScope: transposeTrackScope,
        instrumentScope: transposeInstrumentScope,
        amount: transposeAmount,
      };
      localStorage.setItem(StorageKeys.TRANSPOSE_SETTINGS, JSON.stringify(payload));
    } catch {
      // ignore
    }
  }, [transposeScope, transposeTrackScope, transposeInstrumentScope, transposeAmount]);

  return {
    isDebugMode,
    setIsDebugMode,
    exportType,
    setExportType,
    exportStrategy,
    setExportStrategy,
    transposeScope,
    setTransposeScope,
    transposeTrackScope,
    setTransposeTrackScope,
    transposeInstrumentScope,
    setTransposeInstrumentScope,
    transposeAmount,
    setTransposeAmount,
    transposeAmountInput,
    setTransposeAmountInput,
  };
}

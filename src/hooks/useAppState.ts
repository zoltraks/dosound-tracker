import { useEffect, useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import type { ExportType, ExportStrategy } from '../constants/export';
import { StorageKeys } from '../utils/storageKeys';
import { useLocalStorageState } from './useLocalStorageState';

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
  const [isDebugMode, setIsDebugMode] = useLocalStorageState<boolean>(
    StorageKeys.DEBUG_MODE,
    false,
    {
      read: (stored) => stored === 'on' ? true : stored === 'off' ? false : false,
      write: (value) => value ? 'on' : 'off',
    }
  );

  const [exportType, setExportType] = useLocalStorageState<ExportType>(
    StorageKeys.EXPORT_TYPE,
    'song',
    {
      read: (stored) => stored === 'song' || stored === 'pattern' || stored === 'instrument' ? stored : 'song',
      write: (value) => value,
    }
  );

  const [exportStrategy, setExportStrategy] = useLocalStorageState<ExportStrategy>(
    StorageKeys.DUMP_MODE,
    'complex',
    {
      read: (stored) => stored === 'simple' || stored === 'complex' || stored === 'optimized' ? stored : 'complex',
      write: (value) => value,
    }
  );

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

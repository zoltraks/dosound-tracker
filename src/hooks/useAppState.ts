import { useCallback, useEffect, useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import type { ExportType, ExportStrategy } from '../constants/export';

export interface UseAppStateResult {
  isDebugMode: boolean;
  setIsDebugMode: Dispatch<SetStateAction<boolean>>;
  exportType: ExportType;
  setExportType: Dispatch<SetStateAction<ExportType>>;
  exportStrategy: ExportStrategy;
  setExportStrategy: Dispatch<SetStateAction<ExportStrategy>>;
  isComplexDumpMode: boolean;
  setIsComplexDumpMode: Dispatch<SetStateAction<boolean>>;
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
      const stored = localStorage.getItem('dosound-tracker-debug-mode');
      if (stored === 'on') return true;
      if (stored === 'off') return false;
    } catch {
      // ignore
    }
    return false;
  });

  const [exportType, setExportType] = useState<ExportType>(() => {
    try {
      const stored = localStorage.getItem('dosound-tracker-export-type');
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
      const savedDumpMode = localStorage.getItem('dosound-tracker-dump-mode');
      if (savedDumpMode === 'simple' || savedDumpMode === 'complex' || savedDumpMode === 'optimized') {
        return savedDumpMode;
      }
    } catch {
      // ignore
    }
    return 'complex';
  });

  const isComplexDumpMode = exportStrategy !== 'simple';

  const setIsComplexDumpMode: Dispatch<SetStateAction<boolean>> = useCallback(
    (valueOrUpdater) => {
      setExportStrategy(prevStrategy => {
        const prevIsComplex = prevStrategy !== 'simple';
        const nextIsComplex =
          typeof valueOrUpdater === 'function'
            ? (valueOrUpdater as (prev: boolean) => boolean)(prevIsComplex)
            : valueOrUpdater;

        if (!nextIsComplex) {
          return 'simple';
        }

        // When switching to a complex-style mode, preserve "optimized" if it
        // was already selected; otherwise fall back to "complex".
        return prevStrategy === 'optimized' ? 'optimized' : 'complex';
      });
    },
    []
  );

  const [transposeScope, setTransposeScope] = useState<'line' | 'song'>('line');
  const [transposeTrackScope, setTransposeTrackScope] = useState<'current' | 'all'>('current');
  const [transposeInstrumentScope, setTransposeInstrumentScope] = useState<'all' | 'selected'>('all');
  const [transposeAmount, setTransposeAmount] = useState<number>(0);
  const [transposeAmountInput, setTransposeAmountInput] = useState<string>('0');

  useEffect(() => {
    try {
      localStorage.setItem('dosound-tracker-debug-mode', isDebugMode ? 'on' : 'off');
    } catch {
      // ignore
    }
  }, [isDebugMode]);

  useEffect(() => {
    try {
      localStorage.setItem('dosound-tracker-export-type', exportType);
    } catch {
      // ignore
    }
  }, [exportType]);

  useEffect(() => {
    try {
      localStorage.setItem('dosound-tracker-dump-mode', exportStrategy);
    } catch {
      // ignore
    }
  }, [exportStrategy]);

  // Load transpose settings from localStorage on startup so they persist
  // until the application is fully reset (RESET clears localStorage and reloads).
  useEffect(() => {
    try {
      const raw = localStorage.getItem('dosound-tracker-transpose-settings');
      if (!raw) return;

      const parsed: unknown = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        const obj = parsed as {
          scope?: 'line' | 'song';
          trackScope?: 'current' | 'all';
          instrumentScope?: 'all' | 'selected';
          amount?: number;
        };

        if (obj.scope === 'line' || obj.scope === 'song') {
          // eslint-disable-next-line react-hooks/set-state-in-effect
          setTransposeScope(obj.scope);
        }
        if (obj.trackScope === 'current' || obj.trackScope === 'all') {
          // eslint-disable-next-line react-hooks/set-state-in-effect
          setTransposeTrackScope(obj.trackScope);
        }
        if (obj.instrumentScope === 'all' || obj.instrumentScope === 'selected') {
          // eslint-disable-next-line react-hooks/set-state-in-effect
          setTransposeInstrumentScope(obj.instrumentScope);
        }
        if (typeof obj.amount === 'number' && Number.isFinite(obj.amount)) {
          // eslint-disable-next-line react-hooks/set-state-in-effect
          setTransposeAmount(obj.amount);
          // eslint-disable-next-line react-hooks/set-state-in-effect
          setTransposeAmountInput(String(obj.amount));
        }
      }
    } catch {
      // ignore
    }
  }, []);

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
      localStorage.setItem('dosound-tracker-transpose-settings', JSON.stringify(payload));
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
    isComplexDumpMode,
    setIsComplexDumpMode,
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

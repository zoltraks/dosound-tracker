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
  const initialTransposeSettings = useCallback(() => {
    try {
      const raw = localStorage.getItem('dosound-tracker-transpose-settings');
      if (!raw) return null;

      const parsed: unknown = JSON.parse(raw);
      if (!parsed || typeof parsed !== 'object') return null;

      const obj = parsed as {
        scope?: 'line' | 'song';
        trackScope?: 'current' | 'all';
        instrumentScope?: 'all' | 'selected';
        amount?: number;
      };

      return {
        scope: obj.scope,
        trackScope: obj.trackScope,
        instrumentScope: obj.instrumentScope,
        amount: obj.amount,
      };
    } catch {
      return null;
    }
  }, []);

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

  const [transposeScope, setTransposeScope] = useState<'line' | 'song'>(() => {
    const settings = initialTransposeSettings();
    return settings?.scope === 'line' || settings?.scope === 'song' ? settings.scope : 'line';
  });
  const [transposeTrackScope, setTransposeTrackScope] = useState<'current' | 'all'>(() => {
    const settings = initialTransposeSettings();
    return settings?.trackScope === 'current' || settings?.trackScope === 'all'
      ? settings.trackScope
      : 'current';
  });
  const [transposeInstrumentScope, setTransposeInstrumentScope] = useState<'all' | 'selected'>(() => {
    const settings = initialTransposeSettings();
    return settings?.instrumentScope === 'all' || settings?.instrumentScope === 'selected'
      ? settings.instrumentScope
      : 'all';
  });
  const [transposeAmount, setTransposeAmount] = useState<number>(() => {
    const settings = initialTransposeSettings();
    return typeof settings?.amount === 'number' && Number.isFinite(settings.amount) ? settings.amount : 0;
  });
  const [transposeAmountInput, setTransposeAmountInput] = useState<string>(() => {
    const settings = initialTransposeSettings();
    return typeof settings?.amount === 'number' && Number.isFinite(settings.amount)
      ? String(settings.amount)
      : '0';
  });

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

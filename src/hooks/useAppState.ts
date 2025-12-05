import { useEffect, useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';

export interface UseAppStateResult {
  isDebugMode: boolean;
  setIsDebugMode: Dispatch<SetStateAction<boolean>>;
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

  const [isComplexDumpMode, setIsComplexDumpMode] = useState<boolean>(() => {
    const savedDumpMode = localStorage.getItem('dosound-tracker-dump-mode');
    if (savedDumpMode === 'complex') return true;
    if (savedDumpMode === 'simple') return false;
    return true;
  });

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
      localStorage.setItem('dosound-tracker-dump-mode', isComplexDumpMode ? 'complex' : 'simple');
    } catch {
      // ignore
    }
  }, [isComplexDumpMode]);

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
          setTransposeScope(obj.scope);
        }
        if (obj.trackScope === 'current' || obj.trackScope === 'all') {
          setTransposeTrackScope(obj.trackScope);
        }
        if (obj.instrumentScope === 'all' || obj.instrumentScope === 'selected') {
          setTransposeInstrumentScope(obj.instrumentScope);
        }
        if (typeof obj.amount === 'number' && Number.isFinite(obj.amount)) {
          setTransposeAmount(obj.amount);
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

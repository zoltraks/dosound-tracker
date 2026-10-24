/* eslint-disable react-hooks/exhaustive-deps */
import { useCallback } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import { StorageKeys } from '../utils/storageKeys';

export interface UseSongToolDialogsParams {
  setIsDebugMode: Dispatch<SetStateAction<boolean>>;
  setIsDebugInfoOpen: (open: boolean) => void;
  optimizeSong: () => string;
  renumberSong: () => string;
  setIsOptimizeConfirmOpen: (open: boolean) => void;
  setOptimizeSummary: (value: string) => void;
  setIsRenumberConfirmOpen: (open: boolean) => void;
  setRenumberSummary: (value: string) => void;
  setInstrumentOperationSummary: (value: string) => void;
}

export interface UseSongToolDialogsResult {
  handleToggleDebugMode: () => void;
  handleOptimizeSong: () => void;
  handleConfirmOptimize: () => void;
  handleCancelOptimize: () => void;
  handleCloseOptimizeSummary: () => void;
  handleRenumberSong: () => void;
  handleConfirmRenumber: () => void;
  handleCancelRenumber: () => void;
  handleCloseRenumberSummary: () => void;
  handleCloseInstrumentOperationSummary: () => void;
}

export function useSongToolDialogs({
  setIsDebugMode,
  setIsDebugInfoOpen,
  optimizeSong,
  renumberSong,
  setIsOptimizeConfirmOpen,
  setOptimizeSummary,
  setIsRenumberConfirmOpen,
  setRenumberSummary,
  setInstrumentOperationSummary,
}: UseSongToolDialogsParams): UseSongToolDialogsResult {
  const handleToggleDebugMode = useCallback(() => {
    setIsDebugMode((prev) => {
      const next = !prev;

      if (!prev && next) {
        let alreadyShown = false;
        try {
          alreadyShown = localStorage.getItem(StorageKeys.DEBUG_INFO_SHOWN) === '1';
        } catch {
          // ignore
        }

        if (!alreadyShown) {
          setIsDebugInfoOpen(true);
          try {
            localStorage.setItem(StorageKeys.DEBUG_INFO_SHOWN, '1');
          } catch {
            // ignore
          }
        }
      }

      return next;
    });
  }, []);

  const handleOptimizeSong = useCallback(() => {
    setIsOptimizeConfirmOpen(true);
  }, [optimizeSong]);

  const handleConfirmOptimize = useCallback(() => {
    const summary = optimizeSong();
    setIsOptimizeConfirmOpen(false);
    setOptimizeSummary(summary);
  }, [optimizeSong]);

  const handleCancelOptimize = useCallback(() => {
    setIsOptimizeConfirmOpen(false);
  }, []);

  const handleCloseOptimizeSummary = useCallback(() => {
    setOptimizeSummary('');
  }, []);

  const handleRenumberSong = useCallback(() => {
    setIsRenumberConfirmOpen(true);
  }, []);

  const handleConfirmRenumber = useCallback(() => {
    const summary = renumberSong();
    setIsRenumberConfirmOpen(false);
    setRenumberSummary(summary);
  }, [renumberSong]);

  const handleCancelRenumber = useCallback(() => {
    setIsRenumberConfirmOpen(false);
  }, []);

  const handleCloseRenumberSummary = useCallback(() => {
    setRenumberSummary('');
  }, []);

  const handleCloseInstrumentOperationSummary = useCallback(() => {
    setInstrumentOperationSummary('');
  }, []);

  return {
    handleToggleDebugMode,
    handleOptimizeSong,
    handleConfirmOptimize,
    handleCancelOptimize,
    handleCloseOptimizeSummary,
    handleRenumberSong,
    handleConfirmRenumber,
    handleCancelRenumber,
    handleCloseRenumberSummary,
    handleCloseInstrumentOperationSummary,
  };
}

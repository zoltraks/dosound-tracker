import { useCallback, useEffect, useRef } from 'react';
import type { Dispatch, SetStateAction } from 'react';

export interface UseTrackInstrumentStateParams {
  currentInstrumentId?: string | null;
}

export interface UseTrackInstrumentStateResult {
  setTrackInstrumentId: Dispatch<SetStateAction<string>>;
}

export function useTrackInstrumentState({
  currentInstrumentId,
}: UseTrackInstrumentStateParams): UseTrackInstrumentStateResult {
  const trackInstrumentIdRef = useRef(currentInstrumentId ?? '00');

  const setTrackInstrumentId = useCallback<Dispatch<SetStateAction<string>>>((value) => {
    trackInstrumentIdRef.current =
      typeof value === 'function'
        ? (value as (prev: string) => string)(trackInstrumentIdRef.current)
        : value;
  }, []);

  useEffect(() => {
    trackInstrumentIdRef.current = currentInstrumentId ?? '00';
  }, [currentInstrumentId]);

  return { setTrackInstrumentId };
}

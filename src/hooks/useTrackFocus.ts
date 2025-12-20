import { useEffect } from 'react';
import type { MutableRefObject } from 'react';

export interface UseTrackFocusParams {
  isActive: boolean;
  focusRevision: number;
  trackRef: MutableRefObject<HTMLElement | null>;
  stopPreview: () => void;
}

export function useTrackFocus({
  isActive,
  focusRevision,
  trackRef,
  stopPreview,
}: UseTrackFocusParams): void {
  useEffect(() => {
    if (isActive && trackRef.current) {
      trackRef.current.focus();
    }
  }, [isActive, focusRevision, trackRef]);

  useEffect(() => {
    if (!isActive) {
      stopPreview();
    }
  }, [isActive, stopPreview]);

  useEffect(() => {
    return () => {
      stopPreview();
    };
  }, [stopPreview]);
}

import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTrackInstrumentState } from '../../src/hooks/useTrackInstrumentState';

describe('useTrackInstrumentState', () => {
  it('initializes with provided instrument id', () => {
    const { result } = renderHook(() =>
      useTrackInstrumentState({ currentInstrumentId: '0A' })
    );

    act(() => {
      result.current.setTrackInstrumentId((prev) => {
        expect(prev).toBe('0A');
        return prev;
      });
    });
  });

  it('updates ref when setter called with value', () => {
    const { result } = renderHook(() =>
      useTrackInstrumentState({ currentInstrumentId: '00' })
    );

    act(() => {
      result.current.setTrackInstrumentId('0F');
    });

    act(() => {
      result.current.setTrackInstrumentId((prev) => {
        expect(prev).toBe('0F');
        return prev;
      });
    });
  });

  it('syncs ref when currentInstrumentId changes', () => {
    const { result, rerender } = renderHook(
      ({ currentInstrumentId }: { currentInstrumentId?: string | null }) =>
        useTrackInstrumentState({ currentInstrumentId }),
      { initialProps: { currentInstrumentId: '01' } }
    );

    rerender({ currentInstrumentId: '02' });

    act(() => {
      result.current.setTrackInstrumentId((prev) => {
        expect(prev).toBe('02');
        return prev;
      });
    });
  });
});

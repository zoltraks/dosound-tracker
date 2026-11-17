import { describe, it, expect, vi, afterEach } from 'vitest';
import { renderHook, act, cleanup } from '@testing-library/react';
import { useInstrumentOctaves } from '../../../src/hooks/instrument/useInstrumentOctaves.ts';
import type { Instrument } from '../../../src/synth/SoundDriver.ts';
import { StorageKeys } from '../../../src/utils/storage/storageKeys.ts';

const makeInstrument = (overrides: Partial<Instrument> = {}): Instrument => ({
  id: '00',
  name: 'Test',
  volume: [15],
  shift: [0],
  pitch: [0],
  noise: [0],
  mode: [0],
  ...overrides,
});

const makeParams = (overrides: Record<string, unknown> = {}) => ({
  currentInstrument: makeInstrument(),
  setCurrentOctave: vi.fn(),
  updateInstrument: vi.fn(),
  ...overrides,
});

describe('useInstrumentOctaves', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('restores stored per-instrument octaves from localStorage', () => {
    localStorage.setItem(StorageKeys.INSTRUMENT_OCTAVES, JSON.stringify({ '00': 5 }));
    const params = makeParams({ currentInstrument: makeInstrument({ octave: undefined }) });
    const { result } = renderHook(() => useInstrumentOctaves(params));

    expect(result.current.instrumentOctaves).toEqual({ '00': 5 });
    expect(params.setCurrentOctave).toHaveBeenCalledWith(5);
  });

  it('falls back to an empty map on missing or malformed storage', () => {
    localStorage.setItem(StorageKeys.INSTRUMENT_OCTAVES, 'not-json{');
    const params = makeParams();
    const { result } = renderHook(() => useInstrumentOctaves(params));

    expect(result.current.instrumentOctaves).toEqual({});
  });

  it('prefers the instrument octave over the stored value and clamps it', () => {
    localStorage.setItem(StorageKeys.INSTRUMENT_OCTAVES, JSON.stringify({ '00': 5 }));
    const params = makeParams({ currentInstrument: makeInstrument({ octave: 9.7 }) });
    renderHook(() => useInstrumentOctaves(params));

    expect(params.setCurrentOctave).toHaveBeenCalledWith(7);
  });

  it('uses the default octave when neither instrument nor storage has one', () => {
    const params = makeParams({ currentInstrument: makeInstrument({ octave: undefined }) });
    renderHook(() => useInstrumentOctaves(params));

    expect(params.setCurrentOctave).toHaveBeenCalledWith(3);
  });

  it('does nothing without a current instrument id', () => {
    const params = makeParams({ currentInstrument: undefined });
    const { result } = renderHook(() => useInstrumentOctaves(params));

    act(() => {
      result.current.handleOctaveChange(6);
    });

    expect(params.setCurrentOctave).toHaveBeenCalledWith(6);
    expect(params.updateInstrument).not.toHaveBeenCalled();
    expect(result.current.instrumentOctaves).toEqual({});
  });

  it('handleOctaveChange updates octave state, the per-instrument map, and the instrument', () => {
    const params = makeParams();
    const { result } = renderHook(() => useInstrumentOctaves(params));

    act(() => {
      result.current.handleOctaveChange(2);
    });

    expect(params.setCurrentOctave).toHaveBeenCalledWith(2);
    expect(params.updateInstrument).toHaveBeenCalledWith({ octave: 2 });
    expect(result.current.instrumentOctaves).toEqual({ '00': 2 });
  });
});

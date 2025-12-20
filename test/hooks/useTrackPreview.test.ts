import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import type { Instrument } from '../../src/synth/SoundDriver';
import type { YM2149 } from '../../src/synth/YM2149';
import { useTrackPreview, type UseTrackPreviewParams } from '../../src/hooks/useTrackPreview';

const createInstrument = (): Instrument => ({
  id: '01',
  name: 'Instrument 01',
  volume: [0x0f, 0x0e, 0x0d],
  shift: [],
  pitch: [],
  noise: [],
  mode: [],
  sustain: null,
});

const createYmMock = () =>
  ({
    updateChannelWithInstrument: vi.fn(),
    writeRegister: vi.fn(),
  }) as unknown as YM2149;

const setupHook = (overrides: Partial<UseTrackPreviewParams> = {}) => {
  const ym2149 = overrides.ym2149 ?? createYmMock();
  const onPreviewMidiNoteOn = overrides.onPreviewMidiNoteOn ?? vi.fn();
  const onPreviewMidiNoteOff = overrides.onPreviewMidiNoteOff ?? vi.fn();
  const onHardStopLivePreview = overrides.onHardStopLivePreview ?? vi.fn();
  const onRegisterStopPreview = overrides.onRegisterStopPreview ?? vi.fn();

  const props: UseTrackPreviewParams = {
    trackId: overrides.trackId ?? 'A',
    ym2149,
    currentInstrumentData: overrides.currentInstrumentData ?? createInstrument(),
    onPreviewMidiNoteOn,
    onPreviewMidiNoteOff,
    onHardStopLivePreview,
    onRegisterStopPreview,
  };

  const hook = renderHook((hookProps: UseTrackPreviewParams) => useTrackPreview(hookProps), {
    initialProps: props,
  });

  return {
    result: hook.result,
    unmount: hook.unmount,
    props,
    ym2149,
    spies: {
      onPreviewMidiNoteOn,
      onPreviewMidiNoteOff,
      onHardStopLivePreview,
      onRegisterStopPreview,
    },
  };
};

describe('useTrackPreview', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.spyOn(performance, 'now').mockReturnValue(1_000);
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('registers stopPreview callback when provided', () => {
    const onRegisterStopPreview = vi.fn();
    setupHook({ onRegisterStopPreview });
    expect(onRegisterStopPreview).toHaveBeenCalledTimes(1);
    expect(onRegisterStopPreview).toHaveBeenCalledWith('A', expect.any(Function));
  });

  it('plays a preview note and notifies listeners', () => {
    const { result, ym2149, spies } = setupHook();

    act(() => {
      result.current.playPreviewNote('C', 4);
    });

    expect(ym2149.updateChannelWithInstrument).toHaveBeenCalledWith(
      0,
      expect.any(Object),
      { note: 'C', octave: 4 },
      0,
      0x0f
    );
    expect(spies.onPreviewMidiNoteOn).toHaveBeenCalledWith(0, expect.any(Object), 'C', 4);
    expect(result.current.activePreviewKeyRef.current).toBe('C4');
  });

  it('stops preview and writes zero volume when stopPreview is called', () => {
    const { result, ym2149, spies } = setupHook();

    act(() => {
      result.current.playPreviewNote('D', 5);
    });

    act(() => {
      result.current.stopPreview();
    });

    expect(ym2149.writeRegister).toHaveBeenCalledWith(0x08, 0x00);
    expect(spies.onPreviewMidiNoteOff).toHaveBeenCalledWith(0);
  });

  it('cleans up previews on unmount', () => {
    const { result, unmount, ym2149 } = setupHook();

    act(() => {
      result.current.playPreviewNote('E', 3);
    });

    unmount();

    expect(ym2149.writeRegister).toHaveBeenCalledWith(0x08, 0x00);
  });
});

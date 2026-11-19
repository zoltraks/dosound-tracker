import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { renderHook, cleanup, act, waitFor } from '@testing-library/react';
import type { SoundEngine } from '../../../src/synth/soundEngine.ts';
import type { SoundEngineId } from '../../../src/constants/sound.ts';

const createSoundEngine = vi.fn();
vi.mock('../../../src/synth/soundEngine.ts', () => ({
  createSoundEngine: (...args: unknown[]) => createSoundEngine(...args),
}));

const YM2149Mock = vi.fn();
vi.mock('../../../src/synth/YM2149.ts', () => ({
  YM2149: function (...args: unknown[]) {
    return YM2149Mock(...args);
  },
}));

const audioContextStub = {
  state: 'running',
  sampleRate: 44100,
  currentTime: 0,
  resume: vi.fn(() => Promise.resolve()),
  createOscillator: vi.fn(() => ({
    type: '',
    frequency: { value: 0, setValueAtTime: vi.fn() },
    connect: vi.fn(),
    start: vi.fn(),
    stop: vi.fn(),
  })),
  createGain: vi.fn(() => ({
    gain: {
      value: 0,
      setValueAtTime: vi.fn(),
      setTargetAtTime: vi.fn(),
    },
    connect: vi.fn(),
    disconnect: vi.fn(),
  })),
  createChannelSplitter: vi.fn(() => ({
    connect: vi.fn(),
    disconnect: vi.fn(),
  })),
  createChannelMerger: vi.fn(() => ({
    connect: vi.fn(),
    disconnect: vi.fn(),
  })),
  destination: {},
} as unknown as AudioContext;

vi.mock('../../../src/hooks/audio/useAudioContext.ts', () => ({
  useAudioContext: () => ({ audioContext: audioContextStub, error: null }),
}));

import { useAudioSetup } from '../../../src/hooks/audio/useAudioSetup.ts';

const makeEngine = (name: string) =>
  ({
    name,
    writeRegister: vi.fn(),
    setClock: vi.fn(),
    silenceAll: vi.fn(),
    dispose: vi.fn(),
    beginBatch: vi.fn(),
    endBatch: vi.fn(),
    readRegister: vi.fn(() => 0),
    getRegisters: vi.fn(() => ({})),
    getRegistersArray: vi.fn(() => []),
    getState: vi.fn(),
    reset: vi.fn(),
    getClock: vi.fn(() => 2000000),
    setChip: vi.fn(),
    setChannelPans: vi.fn(),
    routeOutput: vi.fn(),
    updateChannelWithInstrument: vi.fn(),
    getModeValueForTick: vi.fn(),
    getToneNoiseState: vi.fn(),
    updateMixerForChannel: vi.fn(),
    applyNoiseEnvelopeValue: vi.fn(),
  }) as unknown as SoundEngine & { name: string };

describe('useAudioSetup', () => {
  beforeEach(() => {
    createSoundEngine.mockReset();
    YM2149Mock.mockReset();
    localStorage.clear();
    delete (window as unknown as { ym2149?: SoundEngine }).ym2149;
  });

  afterEach(() => cleanup());

  it('creates the persisted engine when no id is provided', async () => {
    localStorage.setItem('dosound-tracker-sound-engine', 'ayumi');
    const engine = makeEngine('ayumi');
    createSoundEngine.mockResolvedValue(engine);

    const { result } = renderHook(() => useAudioSetup(2_000_000));

    await waitFor(() => expect(result.current.ym2149).toBe(engine));
    expect(createSoundEngine).toHaveBeenCalledWith('ayumi', audioContextStub, 2_000_000);
  });

  it('falls back to internal on an unrecognised stored value', async () => {
    localStorage.setItem('dosound-tracker-sound-engine', 'bogus');
    const engine = makeEngine('internal');
    YM2149Mock.mockReturnValue(engine);

    const { result } = renderHook(() => useAudioSetup(2_000_000));

    await waitFor(() => expect(result.current.ym2149).toBe(engine));
    expect(YM2149Mock).toHaveBeenCalledWith(audioContextStub, 2_000_000);
    expect(createSoundEngine).not.toHaveBeenCalled();
  });

  it('silences and disposes the old engine when the id changes', async () => {
    const first = makeEngine('internal');
    const second = makeEngine('ayumi');
    YM2149Mock.mockReturnValueOnce(first);
    createSoundEngine.mockResolvedValueOnce(second);

    const { result, rerender } = renderHook(
      ({ engineId }: { engineId: SoundEngineId }) => useAudioSetup(2_000_000, engineId),
      { initialProps: { engineId: 'internal' } },
    );

    await waitFor(() => expect(result.current.ym2149).toBe(first));
    expect(first.dispose).not.toHaveBeenCalled();

    rerender({ engineId: 'ayumi' });

    await waitFor(() => expect(result.current.ym2149).toBe(second));
    expect(first.silenceAll).toHaveBeenCalledTimes(1);
    expect(first.dispose).toHaveBeenCalledTimes(1);
    expect(createSoundEngine).toHaveBeenLastCalledWith('ayumi', audioContextStub, 2_000_000);
  });

  it('applies channel pans to the landed engine and re-pans in place', async () => {
    const engine = makeEngine('internal');
    YM2149Mock.mockReturnValue(engine);

    const { result, rerender } = renderHook(
      ({ pans }: { pans: number[] }) => useAudioSetup(2_000_000, 'internal', pans),
      { initialProps: { pans: [0, 0.5, 1] } },
    );

    await waitFor(() => expect(result.current.ym2149).toBe(engine));
    expect(engine.setChannelPans).toHaveBeenLastCalledWith([0, 0.5, 1]);

    rerender({ pans: [0.5, 0.5, 0.5] });
    expect(engine.setChannelPans).toHaveBeenLastCalledWith([0.5, 0.5, 0.5]);
  });

  it('applies the song chip to the landed engine and re-applies on change', async () => {
    const engine = makeEngine('internal');
    YM2149Mock.mockReturnValue(engine);

    const { result, rerender } = renderHook(
      ({ chip }: { chip: string }) => useAudioSetup(2_000_000, 'internal', undefined, chip),
      { initialProps: { chip: 'AY' } },
    );

    await waitFor(() => expect(result.current.ym2149).toBe(engine));
    expect(engine.setChip).toHaveBeenLastCalledWith('AY');

    rerender({ chip: 'YM' });
    expect(engine.setChip).toHaveBeenLastCalledWith('YM');
  });

  it('disposes a stale engine when an older resolve lands after a newer run', async () => {
    const first = makeEngine('internal');
    const stale = makeEngine('stale-ayumi');
    const last = makeEngine('internal-again');
    let resolveStale: (engine: SoundEngine) => void = () => {};
    YM2149Mock.mockReturnValueOnce(first).mockReturnValueOnce(last);
    createSoundEngine.mockImplementationOnce(
      () => new Promise<SoundEngine>((resolve) => (resolveStale = resolve)),
    );

    const { result, rerender } = renderHook(
      ({ engineId }: { engineId: SoundEngineId }) => useAudioSetup(2_000_000, engineId),
      { initialProps: { engineId: 'internal' } },
    );

    await waitFor(() => expect(result.current.ym2149).toBe(first));
    rerender({ engineId: 'ayumi' });
    rerender({ engineId: 'internal' });
    await waitFor(() => expect(result.current.ym2149).toBe(last));

    act(() => resolveStale(stale));

    await waitFor(() => expect(stale.dispose).toHaveBeenCalledTimes(1));
    expect(result.current.ym2149).toBe(last);
  });

  it('splits six-channel pans across the two chip engines', async () => {
    const first = makeEngine('internal-1');
    const second = makeEngine('internal-2');
    YM2149Mock.mockReturnValueOnce(first).mockReturnValueOnce(second);

    const { result } = renderHook(() =>
      useAudioSetup(2_000_000, 'internal', [0, 0, 0, 1, 1, 1], 'YM', 2),
    );

    await waitFor(() => expect(result.current.ym21492).toBe(second));
    expect(first.setChannelPans).toHaveBeenLastCalledWith([0, 0, 0]);
    expect(second.setChannelPans).toHaveBeenLastCalledWith([1, 1, 1]);
  });

  it('routes engine output through the crosstalk bus as a normalized crossfade', async () => {
    const engine = makeEngine('internal');
    YM2149Mock.mockReturnValue(engine);
    const createGain = audioContextStub.createGain as ReturnType<typeof vi.fn>;
    createGain.mockClear();

    const { result, rerender } = renderHook(
      ({ crosstalk }: { crosstalk: number }) =>
        useAudioSetup(2_000_000, 'internal', undefined, 'YM', 1, crosstalk),
      { initialProps: { crosstalk: 0.5 } },
    );

    await waitFor(() => expect(result.current.ym2149).toBe(engine));
    expect(engine.routeOutput).toHaveBeenCalledTimes(1);

    // mixIn is the first gain created in the effect; the two dry gains and
    // the two bleed gains follow in creation order.
    const mixIn = createGain.mock.results[0]?.value as { gain: { value: number } };
    const gainAt = (index: number) =>
      createGain.mock.results[index]?.value as {
        gain: {
          setValueAtTime: ReturnType<typeof vi.fn>;
          setTargetAtTime: ReturnType<typeof vi.fn>;
        };
      };
    const dryLeft = gainAt(1);
    const dryRight = gainAt(2);
    const bleedRight = gainAt(3);
    const bleedLeft = gainAt(4);
    expect((engine.routeOutput as ReturnType<typeof vi.fn>).mock.calls[0]?.[0]).toBe(mixIn);

    // Crosstalk 0.5 -> dry 0.75, bleed 0.25 on every path.
    for (const gain of [dryLeft, dryRight]) {
      expect(gain.gain.setValueAtTime).toHaveBeenCalledWith(0.75, expect.any(Number));
    }
    for (const gain of [bleedRight, bleedLeft]) {
      expect(gain.gain.setValueAtTime).toHaveBeenCalledWith(0.25, expect.any(Number));
    }

    rerender({ crosstalk: 0.25 });
    for (const gain of [dryLeft, dryRight]) {
      expect(gain.gain.setTargetAtTime).toHaveBeenCalledWith(0.875, expect.any(Number), 0.05);
    }
    for (const gain of [bleedRight, bleedLeft]) {
      expect(gain.gain.setTargetAtTime).toHaveBeenCalledWith(0.125, expect.any(Number), 0.05);
    }
  });
});

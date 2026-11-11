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
  resume: vi.fn(() => Promise.resolve()),
  createOscillator: vi.fn(() => ({
    type: '',
    frequency: { value: 0, setValueAtTime: vi.fn() },
    connect: vi.fn(),
    start: vi.fn(),
    stop: vi.fn(),
  })),
  createGain: vi.fn(() => ({
    gain: { value: 0, setValueAtTime: vi.fn() },
    connect: vi.fn(),
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
});

import React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, cleanup, act } from '@testing-library/react';
import { usePreviewEnvelope } from '../../../src/hooks/playback/usePreviewEnvelope.ts';
import type {
  PreviewEnvelopeOptions,
  PreviewEnvelopeResult,
  PreviewEnvelopeStartOptions,
} from '../../../src/hooks/playback/usePreviewEnvelope.ts';
import type { Instrument } from '../../../src/synth/SoundDriver.ts';
import type { YM2149 } from '../../../src/synth/YM2149.ts';

const EngineHarness: React.FC<{
  options: PreviewEnvelopeOptions;
  onReady: (result: PreviewEnvelopeResult) => void;
}> = ({ options, onReady }) => {
  onReady(usePreviewEnvelope(options));
  return null;
};

const makeInstrument = (overrides: Partial<Instrument> = {}): Instrument => ({
  id: '00',
  name: 'i',
  volume: [15],
  shift: [0],
  pitch: [0],
  noise: [0],
  mode: [0],
  ...overrides,
});

const setup = (options: { onAutoStop?: (keyId: string) => void } = {}) => {
  const ym = { updateChannelWithInstrument: vi.fn(), writeRegister: vi.fn() };
  let engine: PreviewEnvelopeResult | null = null;
  render(
    <EngineHarness
      options={{ ym2149: ym as unknown as YM2149, onAutoStop: options.onAutoStop }}
      onReady={(result) => {
        engine = result;
      }}
    />,
  );
  return { ym, engine: engine as unknown as PreviewEnvelopeResult };
};

const startArgs = (
  instrument: Instrument,
  overrides: Partial<PreviewEnvelopeStartOptions> = {},
): PreviewEnvelopeStartOptions => ({
  channel: 0,
  instrument,
  noteData: { note: 'C', octave: 4 },
  tickIntervalMs: 20,
  ...overrides,
});

const appliedSteps = (ym: { updateChannelWithInstrument: ReturnType<typeof vi.fn> }): number[] =>
  ym.updateChannelWithInstrument.mock.calls.map((call) => call[3] as number);

describe('usePreviewEnvelope', () => {
  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it('applies step 0 on start and advances the envelope every two ticks', () => {
    vi.useFakeTimers();
    const { ym, engine } = setup();
    try {
      act(() => {
        engine.start('k', startArgs(makeInstrument()));
      });
      expect(appliedSteps(ym)).toEqual([0]);

      act(() => {
        vi.advanceTimersByTime(20);
      });
      expect(appliedSteps(ym)).toEqual([0, 0]);

      act(() => {
        vi.advanceTimersByTime(20);
      });
      expect(appliedSteps(ym)).toEqual([0, 0, 1]);

      act(() => {
        vi.advanceTimersByTime(40);
      });
      expect(appliedSteps(ym)).toEqual([0, 0, 1, 1, 2]);
    } catch (error) {
      console.log('advance mismatch', ym.updateChannelWithInstrument.mock.calls);
      throw error;
    }
  });

  it('clamps at the sustain step until release, then fades to the tail and auto-stops', () => {
    vi.useFakeTimers();
    const onAutoStop = vi.fn();
    const { ym, engine } = setup({ onAutoStop });
    const instrument = makeInstrument({ sustain: 1, volume: [15, 15, 0] });
    try {
      act(() => {
        engine.start('k', startArgs(instrument));
      });
      act(() => {
        vi.advanceTimersByTime(200);
      });

      const steps = appliedSteps(ym);
      expect(Math.max(...steps)).toBe(1);
      expect(ym.writeRegister).not.toHaveBeenCalled();
      expect(engine.hasState('k')).toBe(true);

      let released = false;
      act(() => {
        released = engine.release('k');
      });
      expect(released).toBe(true);

      act(() => {
        vi.advanceTimersByTime(200);
      });
      expect(ym.writeRegister).toHaveBeenCalledWith(0x08, 0x00);
      expect(onAutoStop).toHaveBeenCalledWith('k');
      expect(engine.hasState('k')).toBe(false);

      const callCount = ym.updateChannelWithInstrument.mock.calls.length;
      act(() => {
        vi.advanceTimersByTime(200);
      });
      expect(ym.updateChannelWithInstrument.mock.calls.length).toBe(callCount);
    } catch (error) {
      console.log('sustain-release mismatch', ym.updateChannelWithInstrument.mock.calls);
      throw error;
    }
  });

  it('auto-stops when rawStep reaches the stopAfterStep cap', () => {
    vi.useFakeTimers();
    const onAutoStop = vi.fn();
    const { ym, engine } = setup({ onAutoStop });
    try {
      act(() => {
        engine.start(
          'k',
          startArgs(makeInstrument(), { channel: 1, honorSustain: false, stopAfterStep: 4 }),
        );
      });
      act(() => {
        vi.advanceTimersByTime(160);
      });

      const steps = appliedSteps(ym);
      expect(Math.max(...steps)).toBe(4);
      expect(ym.writeRegister).toHaveBeenCalledWith(0x09, 0x00);
      expect(onAutoStop).toHaveBeenCalledWith('k');
      expect(engine.hasState()).toBe(false);

      const callCount = ym.updateChannelWithInstrument.mock.calls.length;
      act(() => {
        vi.advanceTimersByTime(200);
      });
      expect(ym.updateChannelWithInstrument.mock.calls.length).toBe(callCount);
    } catch (error) {
      console.log('stop-after-step mismatch', ym.updateChannelWithInstrument.mock.calls);
      throw error;
    }
  });

  it('stop clears the voice and writes the channel volume register', () => {
    vi.useFakeTimers();
    const { ym, engine } = setup();
    try {
      act(() => {
        engine.start('k', startArgs(makeInstrument(), { channel: 2 }));
      });
      expect(engine.hasState('k')).toBe(true);

      act(() => {
        engine.stop('k');
      });
      expect(ym.writeRegister).toHaveBeenCalledWith(0x0a, 0x00);
      expect(engine.hasState('k')).toBe(false);
      expect(engine.hasState()).toBe(false);

      act(() => {
        vi.advanceTimersByTime(200);
      });
      expect(ym.updateChannelWithInstrument).toHaveBeenCalledTimes(1);
    } catch (error) {
      console.log('stop mismatch', ym.writeRegister.mock.calls);
      throw error;
    }
  });

  it('release returns false for sustain-less or unknown voices', () => {
    vi.useFakeTimers();
    const { engine } = setup();
    try {
      act(() => {
        engine.start('k', startArgs(makeInstrument({ sustain: null })));
      });
      expect(engine.release('k')).toBe(false);
      expect(engine.release('missing')).toBe(false);

      act(() => {
        engine.stop();
      });
    } catch (error) {
      console.log('release mismatch');
      throw error;
    }
  });
});

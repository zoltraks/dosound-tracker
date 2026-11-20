// @vitest-environment node
import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import type { AyumiWorkletMessage } from '../../src/workers/ayumiWorklet.ts';

// The worklet module reads AudioWorklet-scope globals at load and call
// time, so fakes are installed before the dynamic import - the same
// harness test/workers/sequencerWorklet.test.ts uses. Each test builds a
// fresh processor so register state never leaks between cases.

const SAMPLE_RATE = 44100;
const BLOCK = 128;

class FakePort {
  onmessage: ((event: MessageEvent) => void) | null = null;
  postMessage = (_message: unknown): void => {};
  close = (): void => {};
}

class FakeProcessorBase {
  readonly port = new FakePort();
}

interface FakeProcessor {
  port: FakePort;
  process(inputs: Float32Array[][], outputs: Float32Array[][]): boolean;
}

let processorCtor: new () => FakeProcessor;
let registeredName: string | undefined;

const globalScope = globalThis as Record<string, unknown>;
globalScope.AudioWorkletProcessor = FakeProcessorBase;
globalScope.sampleRate = SAMPLE_RATE;
globalScope.registerProcessor = (name: string, ctor: new () => FakeProcessor) => {
  registeredName = name;
  processorCtor = ctor;
};

let processor: FakeProcessor;

const dispatch = (message: AyumiWorkletMessage) => {
  processor.port.onmessage?.(new MessageEvent('message', { data: message }));
};

// MessageEvent.data is untyped at runtime - raw payloads exercise the
// worklet's defensive branches the way a malformed port message would.
const dispatchRaw = (data: unknown) => {
  processor.port.onmessage?.(new MessageEvent('message', { data }));
};

// One process() call renders one 128-sample quantum. `stereoOut` controls
// whether the output carries a right channel - the worklet treats a
// mono bus and a stereo bus differently in both pan states.
const render = (blocks: number, stereoOut = true): { left: number[]; right: number[] } => {
  const left: number[] = [];
  const right: number[] = [];
  for (let i = 0; i < blocks; i++) {
    const leftBuffer = new Float32Array(BLOCK);
    const rightBuffer = stereoOut ? new Float32Array(BLOCK) : undefined;
    const outputs: Float32Array[][] = rightBuffer ? [[leftBuffer, rightBuffer]] : [[leftBuffer]];
    processor.process([], outputs);
    left.push(...leftBuffer);
    if (rightBuffer) {
      right.push(...rightBuffer);
    }
  }
  return { left, right };
};

const peak = (samples: number[]): number =>
  samples.reduce((max, v) => Math.max(max, Math.abs(v)), 0);

// Register image for a hot three-channel mix: R7 clears every tone/noise
// off bit so tone and noise run together, R8-R10 set volume 15 with the
// envelope off, and R0-R5 give each channel tone period 284 - the same
// configuration test/synth/ayumiOutputGain.test.ts proves exceeds the
// soft knee once the 1.2 output gain is applied.
const enableHotMix = () => {
  dispatch({
    type: 'writes',
    pairs: [
      [7, 0x00],
      [8, 0x0f],
      [9, 0x0f],
      [10, 0x0f],
      [0, 0x1c],
      [1, 0x01],
      [2, 0x1c],
      [3, 0x01],
      [4, 0x1c],
      [5, 0x01],
    ],
  });
};

beforeAll(async () => {
  await import('../../src/workers/ayumiWorklet.ts');
});

beforeEach(() => {
  processor = new processorCtor();
});

describe('ayumi worklet registration', () => {
  it('registers under the ayumi-processor name the engine requests', () => {
    try {
      expect(registeredName).toBe('ayumi-processor');
    } catch (error) {
      console.log('registered name:', registeredName);
      throw error;
    }
  });
});

describe('ayumi worklet register writes', () => {
  it('renders audio after a batched register write', () => {
    enableHotMix();
    const { left, right } = render(64);
    try {
      expect(peak(left)).toBeGreaterThan(0);
      expect(peak(right)).toBeGreaterThan(0);
    } catch (error) {
      console.log('mono-mix peaks:', peak(left), peak(right));
      throw error;
    }
  });

  it('applies a single write on top of the register image', () => {
    enableHotMix();
    dispatch({
      type: 'writes',
      pairs: [
        [8, 0x00],
        [9, 0x00],
        [10, 0x00],
      ],
    });
    const muted = render(32);
    dispatch({ type: 'write', register: 8, value: 0x0f });
    const audible = render(32);
    try {
      // Zeroing every volume register silences the mix exactly; restoring
      // channel A's volume through a single write makes it audible again.
      expect(muted.left.every((sample) => sample === 0)).toBe(true);
      expect(muted.right.every((sample) => sample === 0)).toBe(true);
      expect(peak(audible.left)).toBeGreaterThan(0);
    } catch (error) {
      console.log('mute comparison:', peak(muted.left), peak(audible.left));
      throw error;
    }
  });

  it('replays the register image on a clock change', () => {
    enableHotMix();
    dispatch({ type: 'clock', clock: 1000000 });
    const { left } = render(64);
    try {
      expect(peak(left)).toBeGreaterThan(0);
    } catch (error) {
      console.log('post-clock peak:', peak(left));
      throw error;
    }
  });

  it('keeps rendering after a chip switch in both directions', () => {
    enableHotMix();
    dispatch({ type: 'chip', chip: 'AY' });
    const ay = render(32);
    dispatch({ type: 'chip', chip: 'YM' });
    const ym = render(32);
    try {
      expect(peak(ay.left)).toBeGreaterThan(0);
      expect(peak(ym.left)).toBeGreaterThan(0);
    } catch (error) {
      console.log('chip peaks:', peak(ay.left), peak(ym.left));
      throw error;
    }
  });

  it('silences every channel on reset', () => {
    enableHotMix();
    dispatch({ type: 'reset' });
    const { left, right } = render(32);
    try {
      expect(left.every((sample) => sample === 0)).toBe(true);
      expect(right.every((sample) => sample === 0)).toBe(true);
    } catch (error) {
      console.log('post-reset peak:', peak(left), peak(right));
      throw error;
    }
  });

  it('ignores unknown messages and out-of-range registers', () => {
    enableHotMix();
    dispatchRaw({ type: 'mystery' });
    dispatch({ type: 'write', register: -1, value: 5 });
    const { left } = render(16);
    try {
      expect(peak(left)).toBeGreaterThan(0);
    } catch (error) {
      console.log('post-raw peak:', peak(left));
      throw error;
    }
  });
});

describe('ayumi worklet output stage', () => {
  it('bounds the limited output under 1.0 at maximum output', () => {
    enableHotMix();
    const { left } = render(345); // 44160 samples - matches the proven peak window
    const leftPeak = peak(left);
    try {
      // The raw folded peak times the 1.2 gain exceeds 1.0 - values above
      // the 0.9 knee prove the tanh branch ran, and nothing may exceed 1.
      expect(leftPeak).toBeGreaterThan(0.9);
      expect(leftPeak).toBeLessThanOrEqual(1.0);
    } catch (error) {
      console.log('limited peak:', leftPeak);
      throw error;
    }
  });

  it('mirrors the folded mono signal on both outputs while centred', () => {
    enableHotMix();
    const { left, right } = render(32);
    try {
      expect(left.every((sample, index) => sample === right[index])).toBe(true);
    } catch (error) {
      console.log(
        'mono divergence at',
        left.findIndex((v, i) => v !== right[i]),
      );
      throw error;
    }
  });

  it('writes the folded mono signal to a mono bus only', () => {
    enableHotMix();
    const { left, right } = render(32, false);
    try {
      expect(peak(left)).toBeGreaterThan(0);
      expect(right).toEqual([]);
    } catch (error) {
      console.log('mono-bus peak:', peak(left), 'right length:', right.length);
      throw error;
    }
  });
});

describe('ayumi worklet stereo panning', () => {
  // Channel A alone: mixer off bits silence B and C, volume 0 on R9/R10.
  const enableChannelA = () => {
    dispatch({
      type: 'writes',
      pairs: [
        [7, 0x62],
        [8, 0x0f],
        [9, 0x00],
        [10, 0x00],
        [0, 0x1c],
        [1, 0x01],
      ],
    });
  };

  it('routes a hard-left pan entirely to the left output', () => {
    enableChannelA();
    dispatch({ type: 'pans', pans: [0, 0.5, 0.5] });
    const { left, right } = render(32);
    try {
      expect(peak(left)).toBeGreaterThan(0);
      expect(right.every((sample) => sample === 0)).toBe(true);
    } catch (error) {
      console.log('hard-left peaks:', peak(left), peak(right));
      throw error;
    }
  });

  it('routes a hard-right pan entirely to the right output', () => {
    enableChannelA();
    dispatch({ type: 'pans', pans: [1, 0.5, 0.5] });
    const { left, right } = render(32);
    try {
      expect(left.every((sample) => sample === 0)).toBe(true);
      expect(peak(right)).toBeGreaterThan(0);
    } catch (error) {
      console.log('hard-right peaks:', peak(left), peak(right));
      throw error;
    }
  });

  it('writes only the left output for a panned mono bus', () => {
    enableChannelA();
    dispatch({ type: 'pans', pans: [0, 0.5, 0.5] });
    const { left, right } = render(32, false);
    try {
      expect(peak(left)).toBeGreaterThan(0);
      expect(right).toEqual([]);
    } catch (error) {
      console.log('panned mono-bus peak:', peak(left));
      throw error;
    }
  });

  it('clamps out-of-range and non-finite pans to the 0..1 domain', () => {
    enableChannelA();
    dispatch({ type: 'pans', pans: [Number.NaN, 2, -1] });
    const { left, right } = render(32);
    try {
      // NaN falls back to centre, 2 clamps to hard right, -1 to hard left:
      // channel A stays centred so the folded signal reaches both sides.
      expect(peak(left)).toBeGreaterThan(0);
      expect(peak(right)).toBeGreaterThan(0);
    } catch (error) {
      console.log('clamped-pan peaks:', peak(left), peak(right));
      throw error;
    }
  });

  it('treats missing and short pan arrays as centre', () => {
    enableChannelA();
    dispatch({ type: 'pans', pans: [0] });
    const short = render(16);
    dispatchRaw({ type: 'pans' });
    const missing = render(16);
    try {
      // [0] pans channel A hard left; the absent entry re-centres it, so
      // the right output goes silent then returns to the folded signal.
      expect(peak(short.left)).toBeGreaterThan(0);
      expect(short.right.every((sample) => sample === 0)).toBe(true);
      expect(peak(missing.left)).toBeGreaterThan(0);
      expect(peak(missing.right)).toBeGreaterThan(0);
    } catch (error) {
      console.log('pan-array peaks:', peak(short.left), peak(short.right), peak(missing.right));
      throw error;
    }
  });

  it('returns to the folded mono signal when every pan is centre', () => {
    enableChannelA();
    dispatch({ type: 'pans', pans: [0, 0.5, 0.5] });
    dispatch({ type: 'pans', pans: [0.5, 0.5, 0.5] });
    const { left, right } = render(32);
    try {
      expect(left.every((sample, index) => sample === right[index])).toBe(true);
    } catch (error) {
      console.log(
        're-centred divergence at',
        left.findIndex((v, i) => v !== right[i]),
      );
      throw error;
    }
  });
});

describe('ayumi worklet process edges', () => {
  it('returns true and renders nothing without output channels', () => {
    enableHotMix();
    try {
      expect(processor.process([], [])).toBe(true);
      expect(processor.process([], [[]])).toBe(true);
    } catch (error) {
      console.log('empty-output process failed');
      throw error;
    }
  });
});

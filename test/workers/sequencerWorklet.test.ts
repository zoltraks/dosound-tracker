// @vitest-environment node
import { describe, it, expect, vi, beforeAll, beforeEach, afterEach } from 'vitest';
import type { SequencerWorkletIncomingMessage } from '../../src/workers/sequencerWorklet.ts';

// The worklet module reads AudioWorklet-scope globals at load and call
// time, so fakes are installed before the dynamic import. Module state
// is shared across tests - every test resets the processor by dispatching
// messages and driving process() with fixed 128-sample render quanta.

const SAMPLE_RATE = 48000;
const BLOCK = 128;

interface OutgoingData {
  isPlaying: boolean;
  currentPattern: number;
  currentLine: number;
  currentTick: number;
}

interface OutgoingMessage {
  type: string;
  data: OutgoingData;
}

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

const globalScope = globalThis as Record<string, unknown>;
globalScope.AudioWorkletProcessor = FakeProcessorBase;
globalScope.sampleRate = SAMPLE_RATE;
globalScope.registerProcessor = (_name: string, ctor: new () => FakeProcessor) => {
  processorCtor = ctor;
};

let processor: FakeProcessor;
let postSpy: { mock: { calls: unknown[][] }; mockClear: () => void };

const dispatch = (message: SequencerWorkletIncomingMessage) => {
  processor.port.onmessage?.(new MessageEvent('message', { data: message }));
};

// One process() call is one 128-sample render quantum on the audio
// thread - block counts replace the fake-timer advances the worker
// suite used.
const advanceBlocks = (count: number) => {
  for (let i = 0; i < count; i++) {
    processor.process([], [[new Float32Array(BLOCK)]]);
  }
};

const messages = (): OutgoingMessage[] =>
  postSpy.mock.calls.map((call) => call[0] as OutgoingMessage);

const tickMessages = (): OutgoingMessage[] => messages().filter((m) => m.type === 'tick');

const resetProcessor = () => {
  dispatch({ type: 'stop' });
  dispatch({ type: 'update', data: { pattern: 0, line: 0, tick: 0 } });
  dispatch({
    type: 'setParams',
    data: {
      ticksPerRow: 3,
      patternLength: 64,
      tickInterval: 20,
      playlistLength: 0,
      loopIndex: 0,
      hasLoop: false,
      patternLoop: false,
    },
  });
  postSpy.mockClear();
};

beforeAll(async () => {
  await import('../../src/workers/sequencerWorklet.ts');
});

beforeEach(() => {
  processor = new processorCtor();
  postSpy = vi.spyOn(processor.port, 'postMessage').mockImplementation(() => {});
  resetProcessor();
});

afterEach(() => {
  dispatch({ type: 'stop' });
  vi.restoreAllMocks();
});

describe('sequencer worklet start and tick emission', () => {
  it('emits the starting tick immediately, then advances on the sample boundary', () => {
    dispatch({ type: 'start' });
    try {
      expect(tickMessages()).toHaveLength(1);
      expect(tickMessages()[0].data).toEqual({
        isPlaying: true,
        currentPattern: 0,
        currentLine: 0,
        currentTick: 0,
      });
    } catch (error) {
      console.log('immediate tick', messages());
      throw error;
    }
    // 960 samples per tick - the boundary lands inside the 8th quantum.
    advanceBlocks(8);
    try {
      expect(tickMessages()).toHaveLength(2);
      expect(tickMessages()[1].data).toEqual({
        isPlaying: true,
        currentPattern: 0,
        currentLine: 0,
        currentTick: 1,
      });
    } catch (error) {
      console.log('first interval tick', messages());
      throw error;
    }
  });

  it('advances tick within a row, then wraps to the next line', () => {
    dispatch({ type: 'start' });
    advanceBlocks(38); // 4864 samples - five 960-sample intervals
    const ticks = tickMessages();
    try {
      expect(ticks).toHaveLength(6);
      expect(ticks.map((t) => t.data.currentTick)).toEqual([0, 1, 2, 0, 1, 2]);
      expect(ticks.map((t) => t.data.currentLine)).toEqual([0, 0, 0, 1, 1, 1]);
      expect(ticks.map((t) => t.data.currentPattern)).toEqual([0, 0, 0, 0, 0, 0]);
    } catch (error) {
      console.log('progression', JSON.stringify(ticks));
      throw error;
    }
  });

  it('honors the starting position passed in the start message', () => {
    dispatch({ type: 'start', data: { pattern: 2, line: 5, tick: 1 } });
    advanceBlocks(15); // 1920 samples - two intervals
    const ticks = tickMessages();
    try {
      expect(ticks).toHaveLength(3);
      expect(ticks[0].data).toEqual({
        isPlaying: true,
        currentPattern: 2,
        currentLine: 5,
        currentTick: 1,
      });
      expect(ticks[1].data).toEqual({
        isPlaying: true,
        currentPattern: 2,
        currentLine: 5,
        currentTick: 2,
      });
      expect(ticks[2].data).toEqual({
        isPlaying: true,
        currentPattern: 2,
        currentLine: 6,
        currentTick: 0,
      });
    } catch (error) {
      console.log('start position', JSON.stringify(ticks));
      throw error;
    }
  });

  it('emits every owed tick when several boundaries fall inside one quantum', () => {
    dispatch({ type: 'setParams', data: { tickInterval: 1 } });
    dispatch({ type: 'start' });
    postSpy.mockClear();
    advanceBlocks(1); // 128 samples covers 2.66 one-millisecond intervals
    const ticks = tickMessages();
    try {
      expect(ticks).toHaveLength(2);
      expect(ticks[0].data.currentTick).toBe(1);
      expect(ticks[1].data.currentTick).toBe(2);
    } catch (error) {
      console.log('catch-up ticks', JSON.stringify(ticks));
      throw error;
    }
  });
});

describe('sequencer worklet boundaries', () => {
  it('advances the pattern after ticksPerRow * patternLength ticks', () => {
    dispatch({ type: 'setParams', data: { ticksPerRow: 2, patternLength: 2 } });
    dispatch({ type: 'start' });
    advanceBlocks(38); // immediate tick + five interval ticks
    const ticks = tickMessages();
    try {
      expect(ticks).toHaveLength(6);
      const wrap = ticks[4].data;
      expect(wrap.currentPattern).toBe(1);
      expect(wrap.currentLine).toBe(0);
      expect(wrap.currentTick).toBe(0);
    } catch (error) {
      console.log('pattern advance', JSON.stringify(ticks));
      throw error;
    }
  });

  it('keeps the same pattern when patternLoop is set', () => {
    dispatch({ type: 'setParams', data: { ticksPerRow: 2, patternLength: 2 } });
    dispatch({ type: 'start', data: { pattern: 1, patternLoop: true } });
    advanceBlocks(38);
    const ticks = tickMessages();
    try {
      expect(ticks).toHaveLength(6);
      expect(ticks[4].data.currentPattern).toBe(1);
      expect(ticks[4].data.currentLine).toBe(0);
      expect(ticks[4].data.currentTick).toBe(0);
    } catch (error) {
      console.log('pattern loop', JSON.stringify(ticks));
      throw error;
    }
  });

  it('advances through the playlist and wraps to loopIndex at the last entry', () => {
    dispatch({
      type: 'setParams',
      data: { ticksPerRow: 2, patternLength: 2, playlistLength: 3, hasLoop: true, loopIndex: 1 },
    });
    dispatch({ type: 'start', data: { pattern: 1 } });
    advanceBlocks(38); // immediate tick + wrap once: pattern 1 -> 2
    let ticks = tickMessages();
    try {
      expect(ticks[4].data.currentPattern).toBe(2);
    } catch (error) {
      console.log('playlist advance', JSON.stringify(ticks));
      throw error;
    }
    advanceBlocks(30); // four more intervals - wrap again: last index -> loopIndex 1
    ticks = tickMessages();
    try {
      expect(ticks[8].data.currentPattern).toBe(1);
      expect(ticks[8].data.currentLine).toBe(0);
    } catch (error) {
      console.log('loop wrap', JSON.stringify(ticks));
      throw error;
    }
  });

  it('increments past the last playlist index when no loop is defined', () => {
    dispatch({
      type: 'setParams',
      data: { ticksPerRow: 2, patternLength: 2, playlistLength: 3, hasLoop: false },
    });
    dispatch({ type: 'start', data: { pattern: 2 } });
    advanceBlocks(38);
    const ticks = tickMessages();
    try {
      expect(ticks[4].data.currentPattern).toBe(3);
    } catch (error) {
      console.log('past end', JSON.stringify(ticks));
      throw error;
    }
  });
});

describe('sequencer worklet stop and update', () => {
  it('resets the tick but preserves line and pattern on stop', () => {
    dispatch({ type: 'setParams', data: { ticksPerRow: 2, patternLength: 8 } });
    dispatch({ type: 'start', data: { pattern: 1, line: 3 } });
    advanceBlocks(23); // 2944 samples - three intervals, line reaches 4
    dispatch({ type: 'stop' });
    const stops = messages().filter((m) => m.type === 'stop');
    try {
      expect(stops).toHaveLength(1);
      expect(stops[0].data).toEqual({
        isPlaying: false,
        currentPattern: 1,
        currentLine: 4,
        currentTick: 0,
      });
    } catch (error) {
      console.log('stop payload', JSON.stringify(stops));
      throw error;
    }
    postSpy.mockClear();
    advanceBlocks(200);
    try {
      expect(messages()).toHaveLength(0);
    } catch (error) {
      console.log('post-stop messages', JSON.stringify(messages()));
      throw error;
    }
  });

  it('echoes the position through the update message', () => {
    dispatch({ type: 'update', data: { pattern: 2, line: 3, tick: 1 } });
    const updates = messages().filter((m) => m.type === 'update');
    try {
      expect(updates).toHaveLength(1);
      expect(updates[0].data).toEqual({
        isPlaying: false,
        currentPattern: 2,
        currentLine: 3,
        currentTick: 1,
      });
    } catch (error) {
      console.log('update echo', JSON.stringify(updates));
      throw error;
    }
  });
});

describe('sequencer worklet setParams', () => {
  it('reschedules on a tickInterval change while playing without emitting stop', () => {
    dispatch({ type: 'start' });
    advanceBlocks(15); // immediate tick + two interval ticks at 20 ms
    postSpy.mockClear();
    dispatch({ type: 'setParams', data: { tickInterval: 50 } });
    const sentDuringChange = messages();
    try {
      expect(sentDuringChange.some((m) => m.type === 'stop')).toBe(false);
    } catch (error) {
      console.log('unexpected stop', JSON.stringify(sentDuringChange));
      throw error;
    }
    // 50 ms = 2400 samples; the reschedule lands the first new tick two
    // intervals (4800 samples) after the change, mirroring the worker.
    advanceBlocks(37); // 1920 + 4736 = 6656 - still below 6720
    try {
      expect(tickMessages()).toHaveLength(0);
    } catch (error) {
      console.log('early tick', JSON.stringify(tickMessages()));
      throw error;
    }
    advanceBlocks(1); // 6784 samples - crosses the 6720 boundary
    const ticks = tickMessages();
    try {
      expect(ticks).toHaveLength(1);
      expect(ticks[0].data.currentTick).toBe(0);
      expect(ticks[0].data.currentLine).toBe(1);
    } catch (error) {
      console.log('reschedule ticks', JSON.stringify(ticks));
      throw error;
    }
  });

  it('uses a newly configured tickInterval on the next start', () => {
    dispatch({ type: 'setParams', data: { tickInterval: 40 } });
    dispatch({ type: 'start' });
    advanceBlocks(15); // 40 ms = 1920 samples - one interval tick
    try {
      expect(tickMessages()).toHaveLength(2);
      expect(tickMessages()[0].data.currentTick).toBe(0);
      expect(tickMessages()[1].data.currentTick).toBe(1);
    } catch (error) {
      console.log('new interval', JSON.stringify(messages()));
      throw error;
    }
  });

  it('emits silence on its output channel', () => {
    const output = new Float32Array(BLOCK).fill(1);
    processor.process([], [[output]]);
    try {
      expect(output.every((sample) => sample === 0)).toBe(true);
    } catch (error) {
      console.log('non-silent output', output.slice(0, 8));
      throw error;
    }
  });

  it('keeps cadence sample-exact at the 60 Hz interval', () => {
    dispatch({ type: 'setParams', data: { tickInterval: 1000 / 60 } });
    dispatch({ type: 'start' });
    // 16.66 ms = 800 samples at 48 kHz - 50 ticks span 40000 samples.
    advanceBlocks(313); // 40064 samples
    try {
      expect(tickMessages()).toHaveLength(51); // immediate tick + 50 intervals
    } catch (error) {
      console.log('60 Hz tick count', tickMessages().length);
      throw error;
    }
  });
});

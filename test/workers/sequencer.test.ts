import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Importing the worker module registers its message listener once for the
// whole file. Module state is shared across tests, so every test resets it by
// dispatching messages - never re-import via vi.resetModules().
import '../../src/workers/sequencer.ts';

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

type IncomingMessage =
  | {
      type: 'start';
      data?: { pattern?: number; line?: number; tick?: number; patternLoop?: boolean };
    }
  | { type: 'stop' }
  | { type: 'update'; data: { pattern: number; line: number; tick: number } }
  | {
      type: 'setParams';
      data: {
        ticksPerRow?: number;
        patternLength?: number;
        tickInterval?: number;
        playlistLength?: number;
        loopIndex?: number;
        hasLoop?: boolean;
        patternLoop?: boolean;
      };
    };

const dispatch = (message: IncomingMessage) => {
  self.dispatchEvent(new MessageEvent('message', { data: message }));
};

let postSpy: { mock: { calls: unknown[][] }; mockClear: () => void };

const messages = (): OutgoingMessage[] =>
  postSpy.mock.calls.map((call) => call[0] as OutgoingMessage);

const tickMessages = (): OutgoingMessage[] => messages().filter((m) => m.type === 'tick');

const resetWorker = () => {
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

beforeEach(() => {
  vi.useFakeTimers();
  postSpy = vi.spyOn(self, 'postMessage').mockImplementation(() => {});
  resetWorker();
});

afterEach(() => {
  dispatch({ type: 'stop' });
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('sequencer start and tick emission', () => {
  it('emits the starting tick immediately, then advances on the interval', () => {
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
    vi.advanceTimersByTime(20);
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
    vi.advanceTimersByTime(20 * 5); // ticks at +20, +40, +60, +80, +100
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
    vi.advanceTimersByTime(40);
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
});

describe('sequencer boundaries', () => {
  it('advances the pattern after ticksPerRow * patternLength ticks', () => {
    dispatch({ type: 'setParams', data: { ticksPerRow: 2, patternLength: 2 } });
    dispatch({ type: 'start' });
    vi.advanceTimersByTime(20 * 5); // immediate tick + 5 interval ticks
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
    vi.advanceTimersByTime(20 * 5); // immediate tick + 5 interval ticks
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
    vi.advanceTimersByTime(20 * 5); // immediate tick + wrap once: pattern 1 -> 2
    let ticks = tickMessages();
    try {
      expect(ticks[4].data.currentPattern).toBe(2);
    } catch (error) {
      console.log('playlist advance', JSON.stringify(ticks));
      throw error;
    }
    vi.advanceTimersByTime(20 * 4); // wrap again: last index -> loopIndex 1
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
    vi.advanceTimersByTime(20 * 5);
    const ticks = tickMessages();
    try {
      expect(ticks[4].data.currentPattern).toBe(3);
    } catch (error) {
      console.log('past end', JSON.stringify(ticks));
      throw error;
    }
  });
});

describe('sequencer stop and update', () => {
  it('resets the tick but preserves line and pattern on stop', () => {
    dispatch({ type: 'setParams', data: { ticksPerRow: 2, patternLength: 8 } });
    dispatch({ type: 'start', data: { pattern: 1, line: 3 } });
    vi.advanceTimersByTime(20 * 3); // 2 ticks -> line 4
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
    vi.advanceTimersByTime(200);
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

describe('sequencer setParams', () => {
  it('reschedules on a tickInterval change while playing without emitting stop', () => {
    dispatch({ type: 'start' });
    vi.advanceTimersByTime(40); // immediate tick + two interval ticks emitted
    postSpy.mockClear();
    dispatch({ type: 'setParams', data: { tickInterval: 50 } });
    const sentDuringChange = messages();
    try {
      expect(sentDuringChange.some((m) => m.type === 'stop')).toBe(false);
    } catch (error) {
      console.log('unexpected stop', JSON.stringify(sentDuringChange));
      throw error;
    }
    vi.advanceTimersByTime(100); // first tick lands two intervals after reschedule
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
    vi.advanceTimersByTime(40); // immediate tick + first interval tick
    try {
      expect(tickMessages()).toHaveLength(2);
      expect(tickMessages()[0].data.currentTick).toBe(0);
      expect(tickMessages()[1].data.currentTick).toBe(1);
    } catch (error) {
      console.log('new interval', JSON.stringify(messages()));
      throw error;
    }
  });
});

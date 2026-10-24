import { describe, it, expect } from 'vitest';
import { optimizeEvents, type SoundEventLike } from '../../src/synth/EventOptimizer';

const reg = (register: number, value: number): SoundEventLike => ({
  type: 'register',
  register,
  value,
});
const del = (delay: number): SoundEventLike => ({ type: 'delay', delay });

describe('optimizeEvents', () => {
  it('drops a register write that repeats the last value', () => {
    try {
      expect(optimizeEvents([reg(8, 0x0f), reg(8, 0x0f), reg(8, 0x0e)])).toEqual([
        reg(8, 0x0f),
        reg(8, 0x0e),
      ]);
    } catch (error) {
      console.log('dedup mismatch');
      throw error;
    }
  });

  it('keeps identical writes separated by a delay', () => {
    try {
      expect(optimizeEvents([reg(8, 0x0f), del(2), reg(8, 0x0f)])).toEqual([
        reg(8, 0x0f),
        del(2),
        reg(8, 0x0f),
      ]);
    } catch (error) {
      console.log('delay reset mismatch');
      throw error;
    }
  });

  it('tracks registers independently', () => {
    try {
      expect(optimizeEvents([reg(8, 1), reg(9, 1), reg(8, 1), reg(9, 2)])).toEqual([
        reg(8, 1),
        reg(9, 1),
        reg(9, 2),
      ]);
    } catch (error) {
      console.log('independent tracking mismatch');
      throw error;
    }
  });

  it('passes malformed events through untouched positions', () => {
    const weird: SoundEventLike[] = [
      { type: 'register' },
      { type: 'register', register: 8 },
      reg(8, 1),
      { type: 'delay' },
      del(0),
    ];
    try {
      // malformed register events are dropped, delays still pass through
      expect(optimizeEvents(weird)).toEqual([reg(8, 1), { type: 'delay' }, del(0)]);
    } catch (error) {
      console.log('malformed passthrough mismatch', optimizeEvents(weird));
      throw error;
    }
  });

  it('returns an empty list for empty input', () => {
    try {
      expect(optimizeEvents([])).toEqual([]);
    } catch (error) {
      console.log('empty mismatch');
      throw error;
    }
  });
});

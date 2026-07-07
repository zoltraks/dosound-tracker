import { describe, expect, it, vi } from 'vitest';
import { clearIntervalRef } from '../../src/utils/timerUtils';

describe('clearIntervalRef', () => {
  it('clears the interval and resets ref to null', () => {
    const ref = { current: 123 as number | null };
    const spy = vi.spyOn(window, 'clearInterval');
    clearIntervalRef(ref);
    expect(spy).toHaveBeenCalledWith(123);
    expect(ref.current).toBeNull();
    spy.mockRestore();
  });

  it('does nothing when ref is already null', () => {
    const ref = { current: null };
    const spy = vi.spyOn(window, 'clearInterval');
    clearIntervalRef(ref);
    expect(spy).not.toHaveBeenCalled();
    expect(ref.current).toBeNull();
    spy.mockRestore();
  });
});

import { describe, it, expect, afterEach, vi } from 'vitest';
import { renderHook, act, cleanup } from '@testing-library/react';
import { useMidiMonitors } from '../../../src/hooks/midi/useMidiMonitors.ts';
import { MAX_MONITOR_ENTRIES } from '../../../src/utils/midi/midiUtils.ts';

const entry = (data: string) => ({
  data,
  device: 'dev',
  channel: '01',
  type: 'Note On',
  note: 'C-4',
  value: 64,
});

describe('useMidiMonitors', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('appends entries with increasing ids and a formatted time', () => {
    const { result } = renderHook(() => useMidiMonitors());
    act(() => {
      result.current.addInMonitorEntry(entry('90 3C 40'));
      result.current.addOutMonitorEntry(entry('B0 07 64'));
    });
    try {
      expect(result.current.inMonitor).toHaveLength(1);
      expect(result.current.outMonitor).toHaveLength(1);
      expect(result.current.inMonitor[0].id).toBe(1);
      expect(result.current.outMonitor[0].id).toBe(2);
      expect(result.current.inMonitor[0].time).toMatch(/^\d{2}:\d{2}:\d{2}\.\d{3}$/);
      expect(result.current.inMonitor[0].data).toBe('90 3C 40');
    } catch (error) {
      console.log('append mismatch', result.current.inMonitor, result.current.outMonitor);
      throw error;
    }
  });

  it('truncates the in monitor at the entry bound and keeps the newest', () => {
    const { result } = renderHook(() => useMidiMonitors());
    act(() => {
      for (let i = 0; i < MAX_MONITOR_ENTRIES + 1; i += 1) {
        result.current.addInMonitorEntry(entry(`msg-${i}`));
      }
    });
    try {
      expect(result.current.inMonitor).toHaveLength(MAX_MONITOR_ENTRIES);
      expect(result.current.inMonitor[0].data).toBe('msg-1');
      expect(result.current.inMonitor[MAX_MONITOR_ENTRIES - 1].data).toBe(
        `msg-${MAX_MONITOR_ENTRIES}`,
      );
    } catch (error) {
      console.log('in truncation mismatch', result.current.inMonitor.length);
      throw error;
    }
  });

  it('truncates the out monitor at the entry bound and keeps the newest', () => {
    const { result } = renderHook(() => useMidiMonitors());
    act(() => {
      for (let i = 0; i < MAX_MONITOR_ENTRIES + 1; i += 1) {
        result.current.addOutMonitorEntry(entry(`msg-${i}`));
      }
    });
    try {
      expect(result.current.outMonitor).toHaveLength(MAX_MONITOR_ENTRIES);
      expect(result.current.outMonitor[0].data).toBe('msg-1');
    } catch (error) {
      console.log('out truncation mismatch', result.current.outMonitor.length);
      throw error;
    }
  });

  it('clears both monitors while the id counter keeps advancing', () => {
    const { result } = renderHook(() => useMidiMonitors());
    act(() => {
      result.current.addInMonitorEntry(entry('a'));
      result.current.clearMonitors();
    });
    try {
      expect(result.current.inMonitor).toEqual([]);
      expect(result.current.outMonitor).toEqual([]);
    } catch (error) {
      console.log('clear mismatch', result.current.inMonitor);
      throw error;
    }
    act(() => {
      result.current.addInMonitorEntry(entry('b'));
    });
    try {
      expect(result.current.inMonitor[0].id).toBe(2);
    } catch (error) {
      console.log('id continuation mismatch', result.current.inMonitor);
      throw error;
    }
  });
});

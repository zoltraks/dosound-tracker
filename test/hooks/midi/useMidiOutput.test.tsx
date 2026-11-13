import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act, cleanup } from '@testing-library/react';
import { useMidiOutput } from '../../../src/hooks/midi/useMidiOutput.ts';
import { logger } from '../../../src/utils/log/logger.ts';
import { StorageKeys } from '../../../src/utils/storage/storageKeys.ts';
import type {
  MidiConfiguration,
  MidiDeviceInfo,
  MidiMonitorEntry,
} from '../../../src/utils/midi/midiUtils.ts';

const makeConfig = (overrides: Partial<MidiConfiguration> = {}): MidiConfiguration => ({
  inputEnabled: false,
  outputEnabled: true,
  inputId: null,
  outputId: 'out-1',
  ignoreInputVolume: false,
  ignoreOutputVolume: false,
  ...overrides,
});

const makeDevice = () => ({ send: vi.fn(), close: vi.fn(), open: vi.fn() });

type MonitorEntry = Omit<MidiMonitorEntry, 'id' | 'time'>;

const setup = (
  config: MidiConfiguration,
  options: { outputs?: MidiDeviceInfo[]; monitors?: boolean; device?: unknown } = {},
) => {
  const device = options.device === undefined ? makeDevice() : options.device;
  const addOutMonitorEntry = vi.fn<(entry: MonitorEntry) => void>();
  const currentOutputRef = { current: device } as { current: MIDIOutput | null };
  const { result } = renderHook(() =>
    useMidiOutput(
      config,
      options.outputs ?? [],
      options.monitors ?? false,
      addOutMonitorEntry,
      currentOutputRef,
    ),
  );
  return { result, addOutMonitorEntry, device: device as ReturnType<typeof makeDevice> | null };
};

const setDebug = (on: boolean) => {
  if (on) {
    localStorage.setItem(StorageKeys.DEBUG_MODE, 'on');
  } else {
    localStorage.removeItem(StorageKeys.DEBUG_MODE);
  }
  window.dispatchEvent(new StorageEvent('storage', { key: StorageKeys.DEBUG_MODE }));
};

describe('useMidiOutput', () => {
  beforeEach(() => {
    localStorage.clear();
    setDebug(false);
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('does nothing while output is disabled', () => {
    const { result, addOutMonitorEntry, device } = setup(makeConfig({ outputEnabled: false }));
    act(() => result.current.sendNoteOn(1, 60, 100));
    act(() => result.current.sendProgramChange(1, 10));
    act(() => result.current.sendSystemReset());
    try {
      expect(addOutMonitorEntry).not.toHaveBeenCalled();
      expect(device?.send).not.toHaveBeenCalled();
    } catch (error) {
      console.log('disabled gate mismatch', addOutMonitorEntry.mock.calls);
      throw error;
    }
  });

  it('sends a note on and records the monitor entry', () => {
    const { result, addOutMonitorEntry, device } = setup(makeConfig(), {
      outputs: [{ id: 'out-1', name: 'Synth' }],
    });
    act(() => result.current.sendNoteOn(2, 60, 100));
    try {
      expect(device?.send).toHaveBeenCalledWith(new Uint8Array([0x91, 60, 100]));
      expect(addOutMonitorEntry).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'Note On', device: 'Synth', note: 'C-4' }),
      );
    } catch (error) {
      console.log('note on mismatch', addOutMonitorEntry.mock.calls);
      throw error;
    }
  });

  it('forces full velocity when output volume is ignored', () => {
    const { result, device } = setup(makeConfig({ ignoreOutputVolume: true }));
    act(() => result.current.sendNoteOn(1, 60, 20));
    try {
      expect(device?.send).toHaveBeenCalledWith(new Uint8Array([0x90, 60, 0x7f]));
    } catch (error) {
      console.log('velocity override mismatch', device?.send.mock.calls);
      throw error;
    }
  });

  it('records a note off with the default velocity', () => {
    const { result, addOutMonitorEntry, device } = setup(makeConfig());
    act(() => result.current.sendNoteOff(1, 60));
    try {
      expect(device?.send).toHaveBeenCalledWith(new Uint8Array([0x80, 60, 0x40]));
      expect(addOutMonitorEntry).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'Note Off' }),
      );
    } catch (error) {
      console.log('note off mismatch', addOutMonitorEntry.mock.calls);
      throw error;
    }
  });

  it('falls back to the generic device name when no output id is configured', () => {
    const { result, addOutMonitorEntry } = setup(makeConfig({ outputId: null }));
    act(() => result.current.sendNoteOn(1, 60, 100));
    try {
      expect(addOutMonitorEntry).toHaveBeenCalledWith(
        expect.objectContaining({ device: 'MIDI Out' }),
      );
    } catch (error) {
      console.log('device fallback mismatch', addOutMonitorEntry.mock.calls);
      throw error;
    }
  });

  it('records the entry but skips the send when no output device is attached', () => {
    const { result, addOutMonitorEntry } = setup(makeConfig(), { device: null });
    act(() => result.current.sendNoteOn(1, 60, 100));
    act(() => result.current.sendProgramChange(1, 10));
    try {
      expect(addOutMonitorEntry).toHaveBeenCalledTimes(2);
    } catch (error) {
      console.log('missing output mismatch', addOutMonitorEntry.mock.calls);
      throw error;
    }
  });

  it('skips the send when the device lacks a send method', () => {
    const { result, addOutMonitorEntry } = setup(makeConfig(), {
      device: { close: vi.fn() },
    });
    act(() => result.current.sendNoteOn(1, 60, 100));
    try {
      expect(addOutMonitorEntry).toHaveBeenCalledTimes(1);
    } catch (error) {
      console.log('missing send mismatch', addOutMonitorEntry.mock.calls);
      throw error;
    }
  });

  it('emits the debug log only when the flag and monitors are both on', () => {
    const debugSpy = vi.spyOn(logger, 'debug').mockImplementation(() => {});
    setDebug(true);
    const enabled = setup(makeConfig(), { monitors: true });
    act(() => enabled.result.current.sendNoteOn(1, 60, 100));
    cleanup();
    const disabled = setup(makeConfig(), { monitors: false });
    act(() => disabled.result.current.sendNoteOn(1, 60, 100));
    try {
      expect(debugSpy).toHaveBeenCalledTimes(1);
      expect(debugSpy).toHaveBeenCalledWith(
        'MIDI OUT',
        expect.objectContaining({ type: 'Note On' }),
      );
    } catch (error) {
      console.log('debug gate mismatch', debugSpy.mock.calls);
      throw error;
    }
  });

  it('sends a program change with monitor and debug entries', () => {
    const debugSpy = vi.spyOn(logger, 'debug').mockImplementation(() => {});
    setDebug(true);
    const { result, addOutMonitorEntry, device } = setup(makeConfig({ outputId: null }), {
      monitors: true,
    });
    act(() => result.current.sendProgramChange(3, 10));
    try {
      expect(device?.send).toHaveBeenCalledWith(new Uint8Array([0xc2, 10]));
      expect(addOutMonitorEntry).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'Program Change', note: 'PC 10', device: 'MIDI Out' }),
      );
      expect(debugSpy).toHaveBeenCalledWith(
        'MIDI OUT',
        expect.objectContaining({ type: 'Program Change' }),
      );
    } catch (error) {
      console.log('program change mismatch', addOutMonitorEntry.mock.calls);
      throw error;
    }
  });

  it('returns early from the system reset when no output device is attached', () => {
    const { result, addOutMonitorEntry } = setup(makeConfig(), { device: null });
    act(() => result.current.sendSystemReset());
    try {
      expect(addOutMonitorEntry).not.toHaveBeenCalled();
    } catch (error) {
      console.log('reset guard mismatch', addOutMonitorEntry.mock.calls);
      throw error;
    }
  });

  it('sends the system reset byte and records the entry', () => {
    const debugSpy = vi.spyOn(logger, 'debug').mockImplementation(() => {});
    setDebug(true);
    const { result, addOutMonitorEntry, device } = setup(makeConfig({ outputId: null }), {
      monitors: true,
    });
    act(() => result.current.sendSystemReset());
    try {
      expect(device?.send).toHaveBeenCalledWith(new Uint8Array([0xff]));
      expect(addOutMonitorEntry).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'System Reset', channel: '--', device: 'MIDI Out' }),
      );
      expect(debugSpy).toHaveBeenCalledWith(
        'MIDI OUT',
        expect.objectContaining({ type: 'System Reset' }),
      );
    } catch (error) {
      console.log('reset mismatch', addOutMonitorEntry.mock.calls);
      throw error;
    }
  });

  it('warns when the device send throws', () => {
    const warnSpy = vi.spyOn(logger, 'warn').mockImplementation(() => {});
    const failing = {
      send: vi.fn(() => {
        throw new Error('closed');
      }),
    };
    const { result } = setup(makeConfig(), { device: failing });
    act(() => result.current.sendNoteOn(1, 60, 100));
    try {
      expect(warnSpy).toHaveBeenCalledWith('Failed to send MIDI output', expect.any(Error));
    } catch (error) {
      console.log('send failure mismatch', warnSpy.mock.calls);
      throw error;
    }
  });
});

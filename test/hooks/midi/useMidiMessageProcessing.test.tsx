import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useMidiMessageProcessing } from '../../../src/hooks/midi/useMidiMessageProcessing.ts';
import type { MidiConfiguration } from '../../../src/utils/midi/midiUtils.ts';
import type { MutableRefObject } from 'react';

interface FakeInput {
  id: string;
  name: string;
  onmidimessage: ((event: { data: Uint8Array; target: unknown }) => void) | null;
  open: () => Promise<void>;
  close: () => Promise<void>;
  addEventListener?: (type: string, handler: unknown) => void;
  removeEventListener?: (type: string, handler: unknown) => void;
}

const baseConfig = (overrides: Partial<MidiConfiguration> = {}): MidiConfiguration => ({
  inputEnabled: true,
  outputEnabled: true,
  inputId: 'in-1',
  outputId: 'out-1',
  ignoreInputVolume: false,
  ignoreOutputVolume: false,
  ...overrides,
});

const setup = (configOverrides: Partial<MidiConfiguration> = {}) => {
  const input: FakeInput = {
    id: 'in-1',
    name: 'Keys',
    onmidimessage: null,
    open: vi.fn(() => Promise.resolve()),
    close: vi.fn(() => Promise.resolve()),
  };
  const output = {
    id: 'out-1',
    name: 'Synth',
    send: vi.fn(),
    open: vi.fn(() => Promise.resolve()),
    close: vi.fn(() => Promise.resolve()),
  };
  const access = {
    inputs: new Map([['in-1', input]]),
    outputs: new Map([['out-1', output]]),
  };
  const midiAccessRef: MutableRefObject<typeof access | null> = { current: access as never };
  const onNoteEvent = vi.fn();
  const devices = {
    inputs: [{ id: 'in-1', name: 'Keys' }],
    outputs: [{ id: 'out-1', name: 'Synth' }],
  };
  const hook = renderHook(
    (props: { configuration: MidiConfiguration }) =>
      useMidiMessageProcessing(
        midiAccessRef as never,
        devices,
        props.configuration,
        true,
        onNoteEvent,
      ),
    { initialProps: { configuration: baseConfig(configOverrides) } },
  );
  return { hook, input, output, onNoteEvent };
};

const fire = (input: FakeInput, bytes: number[]) => {
  act(() => {
    input.onmidimessage?.({ data: new Uint8Array(bytes), target: input });
  });
};

describe('useMidiMessageProcessing input decode', () => {
  it('decodes note on into a noteOn event with monitor entry', () => {
    const { input, onNoteEvent, hook } = setup();
    try {
      fire(input, [0x90, 60, 100]);
      expect(onNoteEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'noteOn',
          noteNumber: 60,
          noteName: 'C',
          octave: 4,
          velocity: 100,
          channel: 1,
          deviceId: 'in-1',
        }),
      );
      expect(hook.result.current.inMonitor[0]).toEqual(
        expect.objectContaining({ type: 'Note On', note: 'C-4', value: 100, data: '90 3C 64' }),
      );
    } catch (error) {
      console.log('noteOn decode mismatch', hook.result.current.inMonitor);
      throw error;
    }
  });

  it('treats note-on with zero velocity as note off', () => {
    const { input, onNoteEvent, hook } = setup();
    try {
      fire(input, [0x90, 60, 0]);
      expect(onNoteEvent).toHaveBeenCalledWith(expect.objectContaining({ type: 'noteOff' }));
      expect(hook.result.current.inMonitor[0].type).toBe('Note Off');
    } catch (error) {
      console.log('zero-velocity mismatch');
      throw error;
    }
  });

  it('decodes note off, control change, and other messages', () => {
    const { input, hook } = setup();
    try {
      fire(input, [0x80, 61, 64]);
      fire(input, [0xb0, 7, 100]);
      fire(input, [0xc0, 5]);
      const monitor = hook.result.current.inMonitor;
      expect(monitor[0].type).toBe('Note Off');
      expect(monitor[0].note).toBe('C#4');
      expect(monitor[1].type).toBe('Control Change');
      expect(monitor[1].note).toBe('CC 7');
      expect(monitor[2].type).toBe('Other');
    } catch (error) {
      console.log('decode mismatch', hook.result.current.inMonitor);
      throw error;
    }
  });

  it('ignores malformed events and encodes channel from status', () => {
    const { input, hook } = setup();
    try {
      act(() => {
        input.onmidimessage?.({ data: new Uint8Array(0), target: input });
        input.onmidimessage?.({ data: null as unknown as Uint8Array, target: input });
      });
      expect(hook.result.current.inMonitor).toHaveLength(0);
      fire(input, [0x9f, 48, 90]);
      expect(hook.result.current.inMonitor[0].channel).toBe('10');
    } catch (error) {
      console.log('malformed mismatch');
      throw error;
    }
  });

  it('resolves the configured device id when the event has no target', () => {
    const { input, hook } = setup();
    try {
      fire(input, [0x90, 60, 90]);
      expect(hook.result.current.inMonitor[0].device).toBe('Keys');
      fire(input, [0x90, 60, 90]);
      act(() => {
        input.onmidimessage?.({ data: new Uint8Array([0x90, 60, 90]), target: null });
      });
      expect(hook.result.current.inMonitor.at(-1)?.device).toBe('Keys');
    } catch (error) {
      console.log('device mismatch');
      throw error;
    }
  });

  it('clearMonitors empties both monitors', () => {
    const { input, hook } = setup();
    try {
      fire(input, [0x90, 60, 90]);
      act(() => hook.result.current.clearMonitors());
      expect(hook.result.current.inMonitor).toHaveLength(0);
      expect(hook.result.current.outMonitor).toHaveLength(0);
    } catch (error) {
      console.log('clear mismatch');
      throw error;
    }
  });
});

describe('useMidiMessageProcessing output send', () => {
  it('sends note on with clamped channel and velocity', () => {
    const { hook, output } = setup();
    try {
      act(() => hook.result.current.sendNoteOn(3, 60, 200));
      expect(output.send).toHaveBeenCalledWith(new Uint8Array([0x92, 60, 127]));
      expect(hook.result.current.outMonitor).toContainEqual(
        expect.objectContaining({ type: 'Note On', note: 'C-4', value: 127 }),
      );
    } catch (error) {
      console.log('sendNoteOn mismatch');
      throw error;
    }
  });

  it('sends note off and honors ignoreOutputVolume by forcing full velocity', () => {
    const { hook, output } = setup({ ignoreOutputVolume: true });
    try {
      act(() => hook.result.current.sendNoteOff(1, 60, 30));
      expect(output.send).toHaveBeenCalledWith(new Uint8Array([0x80, 60, 30]));
      act(() => hook.result.current.sendNoteOn(1, 60, 30));
      expect(output.send).toHaveBeenLastCalledWith(new Uint8Array([0x90, 60, 0x7f]));
    } catch (error) {
      console.log('sendNoteOff mismatch');
      throw error;
    }
  });

  it('blocks sends when output is disabled', () => {
    const { hook, output } = setup({ outputEnabled: false });
    try {
      act(() => {
        hook.result.current.sendNoteOn(1, 60, 90);
        hook.result.current.sendProgramChange(1, 5);
        hook.result.current.sendSystemReset();
      });
      expect(output.send).not.toHaveBeenCalled();
      expect(hook.result.current.outMonitor).toHaveLength(0);
    } catch (error) {
      console.log('disabled-output mismatch');
      throw error;
    }
  });

  it('sends program change and system reset bytes', () => {
    const { hook, output } = setup();
    try {
      act(() => hook.result.current.sendProgramChange(2, 5));
      expect(output.send).toHaveBeenCalledWith(new Uint8Array([0xc1, 5]));
      act(() => hook.result.current.sendSystemReset());
      expect(output.send).toHaveBeenLastCalledWith(new Uint8Array([0xff]));
      const monitor = hook.result.current.outMonitor;
      expect(monitor).toContainEqual(expect.objectContaining({ type: 'Program Change' }));
      expect(monitor).toContainEqual(expect.objectContaining({ type: 'System Reset' }));
    } catch (error) {
      console.log('pc/reset mismatch');
      throw error;
    }
  });

  it('survives a missing output device and a throwing send', () => {
    const { hook, output } = setup();
    try {
      act(() => hook.result.current.sendSystemReset());
      expect(hook.result.current.outMonitor).toContainEqual(
        expect.objectContaining({ type: 'System Reset' }),
      );
      output.send.mockImplementation(() => {
        throw new Error('x');
      });
      act(() => hook.result.current.sendNoteOn(1, 60, 90));
      expect(hook.result.current.outMonitor).toContainEqual(
        expect.objectContaining({ type: 'Note On' }),
      );
    } catch (error) {
      console.log('send-error mismatch');
      throw error;
    }
  });
});

describe('device switching and cleanup', () => {
  it('re-attaches the handler when the input id changes', () => {
    const inputA = {
      id: 'in-1',
      name: 'A',
      onmidimessage: null as unknown,
      open: vi.fn(() => Promise.resolve()),
      close: vi.fn(() => Promise.resolve()),
    };
    const inputB = {
      id: 'in-2',
      name: 'B',
      onmidimessage: null as unknown,
      open: vi.fn(() => Promise.resolve()),
      close: vi.fn(() => Promise.resolve()),
    };
    const access = {
      inputs: new Map([
        ['in-1', inputA],
        ['in-2', inputB],
      ]),
      outputs: new Map(),
    };
    const midiAccessRef = { current: access as never };
    const devices = {
      inputs: [
        { id: 'in-1', name: 'A' },
        { id: 'in-2', name: 'B' },
      ],
      outputs: [],
    };
    const { rerender } = renderHook(
      (props: { configuration: MidiConfiguration }) =>
        useMidiMessageProcessing(
          midiAccessRef as never,
          devices,
          props.configuration,
          true,
          vi.fn(),
        ),
      { initialProps: { configuration: baseConfig() } },
    );
    try {
      expect(inputA.onmidimessage).toBeTypeOf('function');
      rerender({ configuration: baseConfig({ inputId: 'in-2' }) });
      expect(inputA.onmidimessage).toBeNull();
      expect(inputB.onmidimessage).toBeTypeOf('function');
    } catch (error) {
      console.log('switch mismatch');
      throw error;
    }
  });

  it('prefers addEventListener when the device supports it', () => {
    const listener = vi.fn();
    const remover = vi.fn();
    const input = {
      id: 'in-1',
      name: 'A',
      onmidimessage: null as unknown,
      addEventListener: listener,
      removeEventListener: remover,
      open: vi.fn(() => Promise.resolve()),
      close: vi.fn(() => Promise.resolve()),
    };
    const access = { inputs: new Map([['in-1', input]]), outputs: new Map() };
    const midiAccessRef = { current: access as never };
    const devices = { inputs: [{ id: 'in-1', name: 'A' }], outputs: [] };
    const { unmount } = renderHook(() =>
      useMidiMessageProcessing(midiAccessRef as never, devices, baseConfig(), true, vi.fn()),
    );
    try {
      expect(listener).toHaveBeenCalledWith('midimessage', expect.any(Function));
      unmount();
      expect(input.close).toHaveBeenCalled();
    } catch (error) {
      console.log('listener mismatch');
      throw error;
    }
  });

  it('survives a rejected open() and a missing midi access', () => {
    const input = {
      id: 'in-1',
      name: 'A',
      onmidimessage: null as unknown,
      open: vi.fn(() => Promise.reject(new Error('x'))),
      close: vi.fn(() => Promise.resolve()),
    };
    const access = { inputs: new Map([['in-1', input]]), outputs: new Map() };
    const midiAccessRef = { current: access as never };
    const devices = { inputs: [{ id: 'in-1', name: 'A' }], outputs: [] };
    try {
      renderHook(() =>
        useMidiMessageProcessing(midiAccessRef as never, devices, baseConfig(), true, vi.fn()),
      );
      const emptyRef = { current: null as never };
      const { result } = renderHook(() =>
        useMidiMessageProcessing(emptyRef as never, devices, baseConfig(), true, vi.fn()),
      );
      expect(result.current.inMonitor).toEqual([]);
    } catch (error) {
      console.log('open-reject mismatch');
      throw error;
    }
  });
});

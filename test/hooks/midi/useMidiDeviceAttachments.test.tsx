import { describe, it, expect, afterEach, vi } from 'vitest';
import { renderHook, act, cleanup, waitFor } from '@testing-library/react';
import { useMidiDeviceAttachments } from '../../../src/hooks/midi/useMidiDeviceAttachments.ts';
import { logger } from '../../../src/utils/log/logger.ts';
import type { MidiConfiguration } from '../../../src/utils/midi/midiUtils.ts';

const makeConfig = (overrides: Partial<MidiConfiguration> = {}): MidiConfiguration => ({
  inputEnabled: true,
  outputEnabled: true,
  inputId: 'in-1',
  outputId: 'out-1',
  ignoreInputVolume: false,
  ignoreOutputVolume: false,
  ...overrides,
});

const makeInput = (overrides: Record<string, unknown> = {}) => ({
  open: vi.fn(),
  close: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  ...overrides,
});

const makeOutput = (overrides: Record<string, unknown> = {}) => ({
  open: vi.fn(),
  close: vi.fn(),
  ...overrides,
});

const makeAccess = (inputs: Record<string, unknown>, outputs: Record<string, unknown>) =>
  ({ inputs, outputs }) as unknown as MIDIAccess;

const setup = (access: unknown, config: MidiConfiguration, output: unknown = null) => {
  const midiAccessRef = { current: access } as { current: MIDIAccess | null };
  const currentOutputRef = { current: output } as { current: MIDIOutput | null };
  const onMessage = vi.fn();
  const sendSystemReset = vi.fn();
  const rendered = renderHook(
    (props: { configuration: MidiConfiguration }) =>
      useMidiDeviceAttachments(
        midiAccessRef,
        props.configuration,
        onMessage,
        sendSystemReset,
        currentOutputRef,
      ),
    { initialProps: { configuration: config } },
  );
  return { ...rendered, midiAccessRef, currentOutputRef, onMessage, sendSystemReset };
};

describe('useMidiDeviceAttachments', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('attaches the configured input, opens the output, and fires the system reset', () => {
    const input = makeInput();
    const output = makeOutput();
    const access = makeAccess({ get: vi.fn(() => input) }, { get: vi.fn(() => output) });
    const { sendSystemReset, currentOutputRef } = setup(access, makeConfig());
    try {
      expect(input.open).toHaveBeenCalled();
      expect(input.addEventListener).toHaveBeenCalledWith('midimessage', expect.any(Function));
      expect(output.open).toHaveBeenCalled();
      expect(currentOutputRef.current).toBe(output);
      expect(sendSystemReset).toHaveBeenCalledTimes(1);
    } catch (error) {
      console.log('attach mismatch', input.addEventListener.mock.calls);
      throw error;
    }
  });

  it('closes the previous output and clears the ref when access is absent', () => {
    const previous = makeOutput();
    const { currentOutputRef } = setup(null, makeConfig(), previous);
    try {
      expect(previous.close).toHaveBeenCalled();
      expect(currentOutputRef.current).toBeNull();
    } catch (error) {
      console.log('no-access cleanup mismatch', currentOutputRef.current);
      throw error;
    }
  });

  it('warns when the input lookup throws', () => {
    const warnSpy = vi.spyOn(logger, 'warn').mockImplementation(() => {});
    const access = makeAccess(
      {
        get: () => {
          throw new Error('lookup');
        },
      },
      { get: vi.fn(() => makeOutput()) },
    );
    setup(access, makeConfig());
    try {
      expect(warnSpy).toHaveBeenCalledWith('Failed to look up MIDI input', expect.any(Error));
    } catch (error) {
      console.log('lookup warn mismatch', warnSpy.mock.calls);
      throw error;
    }
  });

  it('warns when the output lookup throws', () => {
    const warnSpy = vi.spyOn(logger, 'warn').mockImplementation(() => {});
    const access = makeAccess(
      { get: vi.fn(() => makeInput()) },
      {
        get: () => {
          throw new Error('lookup');
        },
      },
    );
    setup(access, makeConfig());
    try {
      expect(warnSpy).toHaveBeenCalledWith('Failed to look up MIDI output', expect.any(Error));
    } catch (error) {
      console.log('output lookup mismatch', warnSpy.mock.calls);
      throw error;
    }
  });

  it('detaches and closes the previous input when the selection changes', () => {
    const first = makeInput();
    const second = makeInput();
    const access = makeAccess(
      { get: vi.fn((id: string) => (id === 'in-1' ? first : second)) },
      { get: vi.fn(() => makeOutput()) },
    );
    const { rerender } = setup(access, makeConfig());
    act(() => {
      rerender({ configuration: makeConfig({ inputId: 'in-2' }) });
    });
    try {
      expect(first.removeEventListener).toHaveBeenCalledWith('midimessage', expect.any(Function));
      expect(first.close).toHaveBeenCalled();
      expect(second.addEventListener).toHaveBeenCalledWith('midimessage', expect.any(Function));
    } catch (error) {
      console.log('input swap mismatch', first.removeEventListener.mock.calls);
      throw error;
    }
  });

  it('falls back to the onmidimessage property when listener methods are absent', () => {
    const legacy = {
      open: vi.fn(),
      close: vi.fn(),
      onmidimessage: null as null | ((event: unknown) => void),
    };
    const next = makeInput();
    const access = makeAccess(
      { get: vi.fn((id: string) => (id === 'in-1' ? legacy : next)) },
      { get: vi.fn(() => makeOutput()) },
    );
    const { rerender, onMessage } = setup(access, makeConfig());
    try {
      expect(legacy.onmidimessage).toBe(onMessage);
    } catch (error) {
      console.log('legacy attach mismatch', legacy.onmidimessage);
      throw error;
    }
    act(() => {
      rerender({ configuration: makeConfig({ inputId: 'in-2' }) });
    });
    try {
      expect(legacy.onmidimessage).toBeNull();
    } catch (error) {
      console.log('legacy detach mismatch', legacy.onmidimessage);
      throw error;
    }
  });

  it('warns when detaching the previous input listener throws', () => {
    const warnSpy = vi.spyOn(logger, 'warn').mockImplementation(() => {});
    const first = makeInput({
      removeEventListener: vi.fn(() => {
        throw new Error('detach');
      }),
    });
    const access = makeAccess(
      { get: vi.fn((id: string) => (id === 'in-1' ? first : makeInput())) },
      { get: vi.fn(() => makeOutput()) },
    );
    const { rerender } = setup(access, makeConfig());
    act(() => {
      rerender({ configuration: makeConfig({ inputId: 'in-2' }) });
    });
    try {
      expect(warnSpy).toHaveBeenCalledWith(
        'Failed to detach MIDI input listener',
        expect.any(Error),
      );
    } catch (error) {
      console.log('detach warn mismatch', warnSpy.mock.calls);
      throw error;
    }
  });

  it('warns when closing the previous input throws', () => {
    const warnSpy = vi.spyOn(logger, 'warn').mockImplementation(() => {});
    const first = makeInput({
      close: vi.fn(() => {
        throw new Error('close');
      }),
    });
    const access = makeAccess(
      { get: vi.fn((id: string) => (id === 'in-1' ? first : makeInput())) },
      { get: vi.fn(() => makeOutput()) },
    );
    const { rerender } = setup(access, makeConfig());
    act(() => {
      rerender({ configuration: makeConfig({ inputId: 'in-2' }) });
    });
    try {
      expect(warnSpy).toHaveBeenCalledWith(
        'Failed to detach MIDI input listener',
        expect.any(Error),
      );
    } catch (error) {
      console.log('close warn mismatch', warnSpy.mock.calls);
      throw error;
    }
  });

  it('warns when the input open call throws synchronously', () => {
    const warnSpy = vi.spyOn(logger, 'warn').mockImplementation(() => {});
    const input = makeInput({
      open: vi.fn(() => {
        throw new Error('open');
      }),
    });
    const access = makeAccess({ get: vi.fn(() => input) }, { get: vi.fn(() => makeOutput()) });
    setup(access, makeConfig());
    try {
      expect(warnSpy).toHaveBeenCalledWith('MIDI operation failed', expect.any(Error));
      expect(input.addEventListener).toHaveBeenCalled();
    } catch (error) {
      console.log('open throw mismatch', warnSpy.mock.calls);
      throw error;
    }
  });

  it('warns when the input open promise rejects', async () => {
    const warnSpy = vi.spyOn(logger, 'warn').mockImplementation(() => {});
    const input = makeInput({ open: vi.fn(() => Promise.reject(new Error('rejected'))) });
    const access = makeAccess({ get: vi.fn(() => input) }, { get: vi.fn(() => makeOutput()) });
    setup(access, makeConfig());
    try {
      await waitFor(() =>
        expect(warnSpy).toHaveBeenCalledWith('Failed to open MIDI input', expect.any(Error)),
      );
    } catch (error) {
      console.log('open reject mismatch', warnSpy.mock.calls);
      throw error;
    }
  });

  it('warns when attaching the input listener throws', () => {
    const warnSpy = vi.spyOn(logger, 'warn').mockImplementation(() => {});
    const input = makeInput({
      addEventListener: vi.fn(() => {
        throw new Error('attach');
      }),
    });
    const access = makeAccess({ get: vi.fn(() => input) }, { get: vi.fn(() => makeOutput()) });
    setup(access, makeConfig());
    try {
      expect(warnSpy).toHaveBeenCalledWith(
        'Failed to attach MIDI input listener',
        expect.any(Error),
      );
    } catch (error) {
      console.log('attach warn mismatch', warnSpy.mock.calls);
      throw error;
    }
  });

  it('closes the replaced output and fires the reset only for a fresh device', () => {
    const first = makeOutput();
    const second = makeOutput();
    const access = makeAccess(
      { get: vi.fn(() => makeInput()) },
      { get: vi.fn((id: string) => (id === 'out-1' ? first : second)) },
    );
    const { rerender, sendSystemReset } = setup(access, makeConfig());
    act(() => {
      rerender({ configuration: makeConfig({ outputId: 'out-2' }) });
    });
    try {
      expect(first.close).toHaveBeenCalled();
      expect(second.open).toHaveBeenCalled();
      expect(sendSystemReset).toHaveBeenCalledTimes(2);
    } catch (error) {
      console.log('output swap mismatch', sendSystemReset.mock.calls);
      throw error;
    }
  });

  it('warns when closing the replaced output throws', () => {
    const warnSpy = vi.spyOn(logger, 'warn').mockImplementation(() => {});
    const first = makeOutput({
      close: vi.fn(() => {
        throw new Error('close');
      }),
    });
    const access = makeAccess(
      { get: vi.fn(() => makeInput()) },
      { get: vi.fn((id: string) => (id === 'out-1' ? first : makeOutput())) },
    );
    const { rerender } = setup(access, makeConfig());
    act(() => {
      rerender({ configuration: makeConfig({ outputId: 'out-2' }) });
    });
    try {
      expect(warnSpy).toHaveBeenCalledWith('Failed to close MIDI output', expect.any(Error));
    } catch (error) {
      console.log('output close mismatch', warnSpy.mock.calls);
      throw error;
    }
  });

  it('warns when the output open call throws synchronously', () => {
    const warnSpy = vi.spyOn(logger, 'warn').mockImplementation(() => {});
    const output = makeOutput({
      open: vi.fn(() => {
        throw new Error('open');
      }),
    });
    const access = makeAccess({ get: vi.fn(() => makeInput()) }, { get: vi.fn(() => output) });
    setup(access, makeConfig());
    try {
      expect(warnSpy).toHaveBeenCalledWith('MIDI operation failed', expect.any(Error));
    } catch (error) {
      console.log('output open throw mismatch', warnSpy.mock.calls);
      throw error;
    }
  });

  it('warns when the output open promise rejects', async () => {
    const warnSpy = vi.spyOn(logger, 'warn').mockImplementation(() => {});
    const output = makeOutput({ open: vi.fn(() => Promise.reject(new Error('rejected'))) });
    const access = makeAccess({ get: vi.fn(() => makeInput()) }, { get: vi.fn(() => output) });
    setup(access, makeConfig());
    try {
      await waitFor(() =>
        expect(warnSpy).toHaveBeenCalledWith('Failed to open MIDI output', expect.any(Error)),
      );
    } catch (error) {
      console.log('output reject mismatch', warnSpy.mock.calls);
      throw error;
    }
  });

  it('detaches listeners and closes both devices on unmount', () => {
    const input = makeInput();
    const output = makeOutput();
    const access = makeAccess({ get: vi.fn(() => input) }, { get: vi.fn(() => output) });
    const { unmount } = setup(access, makeConfig());
    unmount();
    try {
      expect(input.removeEventListener).toHaveBeenCalledWith('midimessage', expect.any(Function));
      expect(input.close).toHaveBeenCalled();
      expect(output.close).toHaveBeenCalled();
    } catch (error) {
      console.log('unmount mismatch', input.close.mock.calls);
      throw error;
    }
  });

  it('warns when unmount cleanup detachment and close calls throw', () => {
    const warnSpy = vi.spyOn(logger, 'warn').mockImplementation(() => {});
    const input = makeInput({
      removeEventListener: vi.fn(() => {
        throw new Error('detach');
      }),
      close: vi.fn(() => {
        throw new Error('close');
      }),
    });
    const output = makeOutput({
      close: vi.fn(() => {
        throw new Error('close');
      }),
    });
    const access = makeAccess({ get: vi.fn(() => input) }, { get: vi.fn(() => output) });
    const { unmount } = setup(access, makeConfig());
    unmount();
    try {
      expect(warnSpy).toHaveBeenCalledWith(
        'Failed to detach MIDI input listener',
        expect.any(Error),
      );
      expect(warnSpy).toHaveBeenCalledWith('Failed to close MIDI input', expect.any(Error));
    } catch (error) {
      console.log('unmount warn mismatch', warnSpy.mock.calls);
      throw error;
    }
  });
});

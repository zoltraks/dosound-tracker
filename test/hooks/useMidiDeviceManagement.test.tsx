import { describe, it, expect, vi, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useMidiDeviceManagement } from '../../src/hooks/midi/useMidiDeviceManagement.ts';

type NavigatorWithMidi = Navigator & {
  requestMIDIAccess?: (options?: { sysex: boolean }) => Promise<unknown>;
};

const nav = (): NavigatorWithMidi => navigator as NavigatorWithMidi;

const makeAccess = (
  inputs: { id: string; name?: string }[] = [],
  outputs: { id: string; name?: string }[] = [],
) => ({
  inputs: new Map(inputs.map((i) => [i.id, i])),
  outputs: new Map(outputs.map((o) => [o.id, o])),
  onstatechange: null as null | (() => void),
});

const setRequest = (impl?: (options: { sysex: boolean }) => Promise<unknown>) => {
  const n = nav() as unknown as {
    requestMIDIAccess?: (options: { sysex: boolean }) => Promise<unknown>;
  };
  if (impl) {
    n.requestMIDIAccess = impl;
  } else {
    delete n.requestMIDIAccess;
  }
};

describe('useMidiDeviceManagement', () => {
  afterEach(() => {
    delete (nav() as unknown as { requestMIDIAccess?: unknown }).requestMIDIAccess;
    vi.restoreAllMocks();
  });

  it('marks unsupported when requestMIDIAccess is missing', async () => {
    setRequest(undefined);
    const { result } = renderHook(() => useMidiDeviceManagement());
    try {
      await waitFor(() => expect(result.current.accessError).not.toBeNull());
      expect(result.current.accessError).toContain('not supported');
      expect(result.current.devices).toEqual({ inputs: [], outputs: [] });
    } catch (error) {
      console.log('unsupported mismatch');
      throw error;
    }
  });

  it('enumerates inputs and outputs after access resolves', async () => {
    const access = makeAccess(
      [
        { id: 'in-1', name: 'Keys' },
        { id: 'in-2', name: '  ' },
      ],
      [{ id: 'out-1', name: 'Synth' }],
    );
    setRequest(() => Promise.resolve(access));
    const { result } = renderHook(() => useMidiDeviceManagement());
    try {
      await waitFor(() => expect(result.current.isSupported).toBe(true));
      expect(result.current.accessError).toBeNull();
      expect(result.current.devices.inputs).toHaveLength(2);
      expect(result.current.devices.inputs[0].name).toBe('Keys');
      expect(result.current.devices.inputs[1].name).toBe('Input 2');
      expect(result.current.devices.outputs[0].name).toBe('Synth');
      expect(result.current.midiAccessRef.current).toBe(access);
    } catch (error) {
      console.log('enumerate mismatch', result.current.devices);
      throw error;
    }
  });

  it('rescans devices on statechange', async () => {
    const access = makeAccess([{ id: 'in-1', name: 'Keys' }], []);
    setRequest(() => Promise.resolve(access));
    const { result } = renderHook(() => useMidiDeviceManagement());
    try {
      await waitFor(() => expect(result.current.devices.inputs).toHaveLength(1));
      access.inputs.set('in-2', { id: 'in-2', name: 'Pad' });
      act(() => access.onstatechange?.());
      expect(result.current.devices.inputs).toHaveLength(2);
    } catch (error) {
      console.log('statechange mismatch');
      throw error;
    }
  });

  it('records the error message when access is denied', async () => {
    setRequest(() => Promise.reject(new Error('denied by user')));
    const { result } = renderHook(() => useMidiDeviceManagement());
    try {
      await waitFor(() => expect(result.current.accessError).toBe('denied by user'));
      expect(result.current.isSupported).toBe(false);
    } catch (error) {
      console.log('denied mismatch');
      throw error;
    }
  });

  it('refreshDevices requests access on demand', async () => {
    const access = makeAccess([{ id: 'in-9', name: 'Late' }], []);
    const request = vi.fn(() => Promise.resolve(access));
    setRequest(request);
    const { result } = renderHook(() => useMidiDeviceManagement());
    try {
      await waitFor(() => expect(result.current.isSupported).toBe(true));
      act(() => result.current.refreshDevices());
      expect(request).toHaveBeenCalledTimes(1);
      expect(result.current.devices.inputs).toHaveLength(1);
    } catch (error) {
      console.log('refresh mismatch');
      throw error;
    }
  });
});

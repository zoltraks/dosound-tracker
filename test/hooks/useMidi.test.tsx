import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, waitFor, act } from '@testing-library/react';
import { useMidi, type MidiConfiguration } from '../../src/hooks/useMidi';

const STORAGE_KEY = 'dosound-tracker-midi-configuration';

type HookResult = ReturnType<typeof useMidi>;

const MidiHookHarness: React.FC<{ onReady: (value: HookResult) => void }> = ({ onReady }) => {
  const result = useMidi(() => {
    // no-op for tests
  });

  React.useEffect(() => {
    onReady(result);
  }, [result, onReady]);

  return null;
};

describe('useMidi', () => {
  it('initializes configuration with safe defaults when no localStorage value is present', async () => {
    window.localStorage.removeItem(STORAGE_KEY);

    let hook: HookResult | null = null;
    render(<MidiHookHarness onReady={value => { hook = value; }} />);

    await waitFor(() => {
      expect(hook).not.toBeNull();
    });

    expect(hook!.configuration).toEqual({
      inputEnabled: false,
      outputEnabled: false,
      inputId: null,
      outputId: null,
      ignoreInputVolume: true,
      ignoreOutputVolume: true,
    });
  });

  it('restores persisted configuration from localStorage when available', async () => {
    const stored = {
      inputEnabled: true,
      outputEnabled: true,
      inputId: 'input-1',
      outputId: 'output-1',
      ignoreInputVolume: false,
      ignoreOutputVolume: false,
    } satisfies Partial<MidiConfiguration>;

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));

    let hook: HookResult | null = null;
    render(<MidiHookHarness onReady={value => { hook = value; }} />);

    await waitFor(() => {
      expect(hook).not.toBeNull();
    });

    expect(hook!.configuration).toEqual({
      inputEnabled: true,
      outputEnabled: true,
      inputId: 'input-1',
      outputId: 'output-1',
      ignoreInputVolume: false,
      ignoreOutputVolume: false,
    });
  });

  it('persists sanitized configuration back to localStorage when setConfiguration is called', async () => {
    window.localStorage.removeItem(STORAGE_KEY);

    let hook: HookResult | null = null;
    render(<MidiHookHarness onReady={value => { hook = value; }} />);

    await waitFor(() => {
      expect(hook).not.toBeNull();
    });

    const nextConfig: MidiConfiguration = {
      inputEnabled: true,
      outputEnabled: true,
      inputId: 'in-device',
      outputId: 'out-device',
      ignoreInputVolume: false,
      ignoreOutputVolume: false,
    };

    await act(async () => {
      hook!.setConfiguration(nextConfig);
    });

    const raw = window.localStorage.getItem(STORAGE_KEY);
    expect(raw).toBeTruthy();

    const parsed = JSON.parse(raw || '{}');
    expect(parsed).toEqual({
      inputEnabled: true,
      outputEnabled: true,
      inputId: 'in-device',
      outputId: 'out-device',
      ignoreInputVolume: false,
      ignoreOutputVolume: false,
    });
  });
});

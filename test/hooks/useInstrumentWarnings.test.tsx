import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { render, waitFor, act } from '@testing-library/react';
import { useInstrumentWarnings } from '../../src/hooks/useInstrumentWarnings';

const STORAGE_KEY = 'dosound-tracker-ignore-inst-type-warning';

type HookResult = ReturnType<typeof useInstrumentWarnings>;

const InstrumentWarningsHarness: React.FC<{ onReady: (value: HookResult) => void }> = ({ onReady }) => {
  const value = useInstrumentWarnings();

  React.useEffect(() => {
    onReady(value);
  }, [value, onReady]);

  return null;
};

describe('useInstrumentWarnings', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('initializes ignoreInstrumentTypeWarning from localStorage', async () => {
    localStorage.setItem(STORAGE_KEY, '1');

    let hook: HookResult | null = null;

    render(<InstrumentWarningsHarness onReady={value => { hook = value; }} />);

    await waitFor(() => {
      expect(hook).not.toBeNull();
    });

    expect(hook!.ignoreInstrumentTypeWarning).toBe(true);
    expect(hook!.isInstrumentTypeWarningOpen).toBe(false);
    expect(hook!.pendingInstrumentTypeInfo).toBeNull();
    expect(hook!.instrumentTypeWarningIgnoreChecked).toBe(false);
  });

  it('opens the warning and populates type info when openInstrumentTypeWarning is called', async () => {
    let hook: HookResult | null = null;

    render(<InstrumentWarningsHarness onReady={value => { hook = value; }} />);

    await waitFor(() => {
      expect(hook).not.toBeNull();
    });

    const info = { hasTypeField: true, detectedType: 'dosound' as string | null };

    await act(async () => {
      hook!.openInstrumentTypeWarning('instrument-yaml', info);
    });

    await waitFor(() => {
      expect(hook!.isInstrumentTypeWarningOpen).toBe(true);
    });

    expect(hook!.pendingInstrumentTypeInfo).toEqual(info);
    expect(hook!.instrumentTypeWarningIgnoreChecked).toBe(false);
    expect(hook!.ignoreInstrumentTypeWarning).toBe(false);
  });

  it('confirmInstrumentTypeWarning returns content and can persist ignore flag', async () => {
    let hook: HookResult | null = null;

    render(<InstrumentWarningsHarness onReady={value => { hook = value; }} />);

    await waitFor(() => {
      expect(hook).not.toBeNull();
    });

    await act(async () => {
      hook!.openInstrumentTypeWarning('instrument-yaml', { hasTypeField: false, detectedType: null });
    });

    await waitFor(() => {
      expect(hook!.isInstrumentTypeWarningOpen).toBe(true);
    });

    await act(async () => {
      hook!.setInstrumentTypeWarningIgnoreChecked(true);
    });

    let confirmed: string | null = null;

    await act(async () => {
      confirmed = hook!.confirmInstrumentTypeWarning();
    });

    expect(confirmed).toBe('instrument-yaml');
    expect(hook!.isInstrumentTypeWarningOpen).toBe(false);
    expect(hook!.pendingInstrumentTypeInfo).toBeNull();
    expect(hook!.ignoreInstrumentTypeWarning).toBe(true);

    await waitFor(() => {
      expect(localStorage.getItem(STORAGE_KEY)).toBe('1');
    });
  });

  it('cancelInstrumentTypeWarning closes the dialog without changing ignore flag', async () => {
    localStorage.setItem(STORAGE_KEY, '0');

    let hook: HookResult | null = null;

    render(<InstrumentWarningsHarness onReady={value => { hook = value; }} />);

    await waitFor(() => {
      expect(hook).not.toBeNull();
    });

    expect(hook!.ignoreInstrumentTypeWarning).toBe(false);

    await act(async () => {
      hook!.openInstrumentTypeWarning('instrument-yaml', { hasTypeField: true, detectedType: 'other' });
    });

    await waitFor(() => {
      expect(hook!.isInstrumentTypeWarningOpen).toBe(true);
    });

    await act(async () => {
      hook!.setInstrumentTypeWarningIgnoreChecked(true);
      hook!.cancelInstrumentTypeWarning();
    });

    expect(hook!.isInstrumentTypeWarningOpen).toBe(false);
    expect(hook!.pendingInstrumentTypeInfo).toBeNull();
    expect(hook!.ignoreInstrumentTypeWarning).toBe(false);

    await waitFor(() => {
      expect(localStorage.getItem(STORAGE_KEY)).toBe('0');
    });
  });
});

import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, waitFor, act } from '@testing-library/react';
import { useDataManagement } from '../../src/hooks/useDataManagement';

type HookResult = ReturnType<typeof useDataManagement>;

const DataManagementHarness: React.FC<{ onReady: (value: HookResult) => void }> = ({ onReady }) => {
  const value = useDataManagement();

  React.useEffect(() => {
    onReady(value);
  }, [value, onReady]);

  return null;
};

describe('useDataManagement (hook behavior)', () => {
  it('exposes isSongDirty and marks song as dirty when updateSong is called', async () => {
    let hook: HookResult | null = null;

    render(<DataManagementHarness onReady={value => { hook = value; }} />);

    await waitFor(() => {
      expect(hook).not.toBeNull();
    });

    expect(hook!.isSongDirty).toBe(false);

    await act(async () => {
      hook!.updateSong({ title: 'Changed Title' });
    });

    await waitFor(() => {
      expect(hook!.isSongDirty).toBe(true);
    });
  });

  it('resets isSongDirty to false when createNewSong is called', async () => {
    let hook: HookResult | null = null;

    render(<DataManagementHarness onReady={value => { hook = value; }} />);

    await waitFor(() => {
      expect(hook).not.toBeNull();
    });

    await act(async () => {
      hook!.updateSong({ title: 'Dirty' });
    });

    await waitFor(() => {
      expect(hook!.isSongDirty).toBe(true);
    });

    await act(async () => {
      hook!.createNewSong();
    });

    await waitFor(() => {
      expect(hook!.isSongDirty).toBe(false);
    });
  });

  it('optimizeSong returns a human-readable summary and marks song as dirty', async () => {
    let hook: HookResult | null = null;

    render(<DataManagementHarness onReady={value => { hook = value; }} />);

    await waitFor(() => {
      expect(hook).not.toBeNull();
    });

    let summary = '';

    await act(async () => {
      summary = hook!.optimizeSong();
    });

    expect(summary).toContain('Optimization complete.');
    expect(hook!.isSongDirty).toBe(true);
  });

  it('renumberSong returns a human-readable summary and marks song as dirty', async () => {
    let hook: HookResult | null = null;

    render(<DataManagementHarness onReady={value => { hook = value; }} />);

    await waitFor(() => {
      expect(hook).not.toBeNull();
    });

    let summary = '';

    await act(async () => {
      summary = hook!.renumberSong();
    });

    expect(summary).toContain('Renumbering complete.');
    expect(hook!.isSongDirty).toBe(true);
  });
});

import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, waitFor, act } from '@testing-library/react';
import { useDataManagement } from '../../../src/hooks/song/useDataManagement.ts';

type HookResult = ReturnType<typeof useDataManagement>;

const DataManagementHarness: React.FC<{ onReady: (value: HookResult) => void }> = ({ onReady }) => {
  const value = useDataManagement();

  React.useEffect(() => {
    onReady(value);
  }, [value, onReady]);

  return null;
};

const renderHookValue = async (): Promise<{ current: HookResult | null }> => {
  const ref: { current: HookResult | null } = { current: null };

  render(
    <DataManagementHarness
      onReady={(value) => {
        ref.current = value;
      }}
    />,
  );

  await waitFor(() => {
    expect(ref.current).not.toBeNull();
  });

  return ref;
};

describe('useDataManagement (edit history)', () => {
  it('starts with nothing to undo or redo', async () => {
    const hook = await renderHookValue();

    expect(hook.current!.canUndo).toBe(false);
    expect(hook.current!.canRedo).toBe(false);
  });

  it('undoes and redoes an updateSong edit', async () => {
    const hook = await renderHookValue();
    const originalTitle = hook.current!.currentSong.title;

    await act(async () => {
      hook.current!.updateSong({ title: 'Edited Title' });
    });

    await waitFor(() => {
      expect(hook.current!.currentSong.title).toBe('Edited Title');
      expect(hook.current!.canUndo).toBe(true);
    });

    await act(async () => {
      hook.current!.undo();
    });

    await waitFor(() => {
      expect(hook.current!.currentSong.title).toBe(originalTitle);
      expect(hook.current!.canRedo).toBe(true);
    });

    await act(async () => {
      hook.current!.redo();
    });

    await waitFor(() => {
      expect(hook.current!.currentSong.title).toBe('Edited Title');
      expect(hook.current!.canRedo).toBe(false);
    });
  });

  it('clears the redo branch when a new edit lands after undo', async () => {
    const hook = await renderHookValue();

    await act(async () => {
      hook.current!.updateSong({ title: 'First' });
    });
    await act(async () => {
      hook.current!.undo();
    });
    await waitFor(() => {
      expect(hook.current!.canRedo).toBe(true);
    });

    await act(async () => {
      hook.current!.updateSong({ title: 'Second' });
    });

    await waitFor(() => {
      expect(hook.current!.currentSong.title).toBe('Second');
      expect(hook.current!.canRedo).toBe(false);
      expect(hook.current!.canUndo).toBe(true);
    });
  });

  it('does not record an updateSong call that changes nothing', async () => {
    const hook = await renderHookValue();

    await act(async () => {
      hook.current!.updateSong({ title: hook.current!.currentSong.title });
    });

    await waitFor(() => {
      expect(hook.current!.canUndo).toBe(false);
    });
  });

  it('skips recording when the record option is false', async () => {
    const hook = await renderHookValue();

    await act(async () => {
      hook.current!.updateSong({ title: 'Silent' }, { record: false });
    });

    await waitFor(() => {
      expect(hook.current!.currentSong.title).toBe('Silent');
      expect(hook.current!.canUndo).toBe(false);
    });
  });

  it('coalesces a burst of same-key updates into one entry', async () => {
    const hook = await renderHookValue();
    const originalTitle = hook.current!.currentSong.title;

    await act(async () => {
      hook.current!.updateSong({ title: 'A' }, { coalesceKey: 'title' });
      hook.current!.updateSong({ title: 'AB' }, { coalesceKey: 'title' });
      hook.current!.updateSong({ title: 'ABC' }, { coalesceKey: 'title' });
    });

    await waitFor(() => {
      expect(hook.current!.currentSong.title).toBe('ABC');
      expect(hook.current!.canUndo).toBe(true);
    });

    await act(async () => {
      hook.current!.undo();
    });

    await waitFor(() => {
      expect(hook.current!.currentSong.title).toBe(originalTitle);
    });
  });

  it('restores the current instrument on undo', async () => {
    const hook = await renderHookValue();

    // The hook syncs currentInstrument to the loaded song's instrument on a
    // microtask - wait for that sync before capturing the baseline.
    await waitFor(() => {
      const songInstrument = hook.current!.currentSong.instrument.find(
        (inst) => inst && inst.name && inst.name.trim(),
      );
      expect(hook.current!.currentInstrument.name).toBe(songInstrument?.name);
    });
    const originalName = hook.current!.currentInstrument.name;

    await act(async () => {
      hook.current!.updateInstrument({ name: 'Renamed Instrument' });
    });

    await waitFor(() => {
      expect(hook.current!.currentInstrument.name).toBe('Renamed Instrument');
    });

    await act(async () => {
      hook.current!.undo();
    });

    await waitFor(() => {
      expect(hook.current!.currentInstrument.name).toBe(originalName);
    });
  });

  it('restores the previous song when undoing createNewSong', async () => {
    const hook = await renderHookValue();

    await act(async () => {
      hook.current!.updateSong({ title: 'Keep Me' });
    });
    await waitFor(() => {
      expect(hook.current!.currentSong.title).toBe('Keep Me');
    });

    await act(async () => {
      hook.current!.createNewSong();
    });
    await waitFor(() => {
      expect(hook.current!.currentSong.title).not.toBe('Keep Me');
    });

    await act(async () => {
      hook.current!.undo();
    });

    await waitFor(() => {
      expect(hook.current!.currentSong.title).toBe('Keep Me');
    });
  });
});

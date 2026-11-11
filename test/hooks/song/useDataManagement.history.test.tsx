import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, waitFor, act } from '@testing-library/react';
import {
  useDataManagement,
  type EditPositionBridge,
} from '../../../src/hooks/song/useDataManagement.ts';
import { StorageKeys } from '../../../src/utils/storage/storageKeys.ts';

const SONG_YAML = `
song:
  title: Loaded
  speed: 4
  length: 4
  line:
    - A: "00"
  pattern:
    - number: "00"
      steps:
        - note: "C-4"
          instrument: "00"
  instrument:
    - number: "00"
      name: "Named Inst"
      volume: [15]
`;

type HookResult = ReturnType<typeof useDataManagement>;

const DataManagementHarness: React.FC<{
  onReady: (value: HookResult) => void;
  positionBridge?: EditPositionBridge;
}> = ({ onReady, positionBridge }) => {
  const value = useDataManagement(positionBridge);

  React.useEffect(() => {
    onReady(value);
  }, [value, onReady]);

  return null;
};

const renderHookValue = async (
  positionBridge?: EditPositionBridge,
): Promise<{ current: HookResult | null }> => {
  const ref: { current: HookResult | null } = { current: null };

  render(
    <DataManagementHarness
      onReady={(value) => {
        ref.current = value;
      }}
      positionBridge={positionBridge}
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

  it('clears the history on createNewSong instead of recording it', async () => {
    const hook = await renderHookValue();

    await act(async () => {
      hook.current!.updateSong({ title: 'Keep Me' });
    });
    await waitFor(() => {
      expect(hook.current!.currentSong.title).toBe('Keep Me');
      expect(hook.current!.canUndo).toBe(true);
    });

    await act(async () => {
      hook.current!.createNewSong();
    });
    await waitFor(() => {
      expect(hook.current!.currentSong.title).not.toBe('Keep Me');
      expect(hook.current!.canUndo).toBe(false);
      expect(hook.current!.canRedo).toBe(false);
    });

    await act(async () => {
      hook.current!.undo();
    });

    expect(hook.current!.currentSong.title).not.toBe('Keep Me');
  });

  it('clears the history on loadSongFromText instead of recording it', async () => {
    const hook = await renderHookValue();

    await act(async () => {
      hook.current!.updateSong({ title: 'Before Load' });
    });
    await waitFor(() => {
      expect(hook.current!.canUndo).toBe(true);
    });

    await act(async () => {
      hook.current!.loadSongFromText(SONG_YAML);
    });
    await waitFor(() => {
      expect(hook.current!.currentSong.title).toBe('Loaded');
      expect(hook.current!.canUndo).toBe(false);
      expect(hook.current!.canRedo).toBe(false);
    });
  });

  it('persists the stacks to localStorage on each committed change', async () => {
    const hook = await renderHookValue();

    await act(async () => {
      hook.current!.updateSong({ title: 'Persisted' });
    });

    await waitFor(() => {
      const raw = localStorage.getItem(StorageKeys.EDIT_HISTORY);
      expect(raw).not.toBeNull();
      const parsed = JSON.parse(raw!) as { undo: unknown[]; redo: unknown[] };
      expect(parsed.undo).toHaveLength(1);
      expect(parsed.redo).toEqual([]);
    });
  });

  it('restores the recorded cursor position on undo and redo', async () => {
    let livePosition = { pattern: 0, line: 0 };
    const applied: { pattern: number; line: number }[] = [];
    const hook = await renderHookValue({
      getPosition: () => livePosition,
      applyPosition: (position) => {
        applied.push(position);
      },
    });

    // The edit is recorded while the cursor sits at row 2; the operation
    // then moves it to row 5, the way a playlist operation would.
    livePosition = { pattern: 2, line: 0 };
    await act(async () => {
      hook.current!.updateSong({ title: 'Moved Cursor' });
    });
    livePosition = { pattern: 5, line: 0 };

    await act(async () => {
      hook.current!.undo();
    });

    await waitFor(() => {
      expect(applied).toEqual([{ pattern: 2, line: 0 }]);
      expect(hook.current!.canRedo).toBe(true);
    });

    await act(async () => {
      hook.current!.redo();
    });

    await waitFor(() => {
      expect(applied).toEqual([
        { pattern: 2, line: 0 },
        { pattern: 5, line: 0 },
      ]);
    });
  });

  it('hydrates the undo and redo flags from persisted stacks', async () => {
    localStorage.setItem(
      StorageKeys.EDIT_HISTORY,
      JSON.stringify({
        undo: [{ song: {}, instrument: {} }],
        redo: [{ song: {}, instrument: {} }],
      }),
    );

    const hook = await renderHookValue();

    expect(hook.current!.canUndo).toBe(true);
    expect(hook.current!.canRedo).toBe(true);
  });
});

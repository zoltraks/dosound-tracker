import { describe, it, expect, vi } from 'vitest';

const STORAGE_KEY = 'dosound-tracker-eq-mutes';
const OCTAVE_KEY = 'dosound-tracker-octave';
const DEFAULT_OCTAVE = 3;

// We import the store inside each test after resetting modules so that
// the initial channelMutes state is derived from the current localStorage
// contents for that test.

describe('useUiStore', () => {
  it('initializes channelMutes to all false when no localStorage value is present', async () => {
    vi.resetModules();
    window.localStorage.removeItem(STORAGE_KEY);

    const { useUiStore } = await import('../../src/hooks/ui/useUiStore.ts');

    expect(useUiStore.getState().channelMutes).toEqual([false, false, false]);
  });

  it('initializes channelMutes from a valid stored boolean array', async () => {
    vi.resetModules();
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify([true, false, true]));

    const { useUiStore } = await import('../../src/hooks/ui/useUiStore.ts');

    expect(useUiStore.getState().channelMutes).toEqual([true, false, true]);
  });

  it('falls back to all false when stored value is invalid', async () => {
    vi.resetModules();
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(['x', 1, null]));

    const { useUiStore } = await import('../../src/hooks/ui/useUiStore.ts');

    expect(useUiStore.getState().channelMutes).toEqual([false, false, false]);
  });

  it('toggles only the requested channel mute flag', async () => {
    vi.resetModules();
    window.localStorage.removeItem(STORAGE_KEY);

    const { useUiStore } = await import('../../src/hooks/ui/useUiStore.ts');

    const { toggleChannelMute } = useUiStore.getState();

    toggleChannelMute(1);
    expect(useUiStore.getState().channelMutes).toEqual([false, true, false]);

    toggleChannelMute(1);
    expect(useUiStore.getState().channelMutes).toEqual([false, false, false]);

    toggleChannelMute(0);
    toggleChannelMute(2);
    expect(useUiStore.getState().channelMutes).toEqual([true, false, true]);
  });

  it('ignores out-of-range indices when toggling', async () => {
    vi.resetModules();
    window.localStorage.removeItem(STORAGE_KEY);

    const { useUiStore } = await import('../../src/hooks/ui/useUiStore.ts');

    const initial = useUiStore.getState().channelMutes;
    useUiStore.getState().toggleChannelMute(-1);
    useUiStore.getState().toggleChannelMute(3);

    expect(useUiStore.getState().channelMutes).toEqual(initial);
  });

  it('updates octave and shared current line through actions', async () => {
    vi.resetModules();
    window.localStorage.removeItem(STORAGE_KEY);

    const { useUiStore } = await import('../../src/hooks/ui/useUiStore.ts');
    const store = useUiStore.getState();

    store.setCurrentOctave(5);
    expect(useUiStore.getState().currentOctave).toBe(5);

    store.setSharedCurrentLine(10);
    expect(useUiStore.getState().sharedCurrentLine).toBe(10);
  });

  it('initializes currentOctave to the default when no stored value is present', async () => {
    vi.resetModules();
    window.localStorage.removeItem(OCTAVE_KEY);

    const { useUiStore } = await import('../../src/hooks/ui/useUiStore.ts');

    expect(useUiStore.getState().currentOctave).toBe(DEFAULT_OCTAVE);
  });

  it('initializes currentOctave from a valid stored value', async () => {
    vi.resetModules();
    window.localStorage.setItem(OCTAVE_KEY, '5');

    const { useUiStore } = await import('../../src/hooks/ui/useUiStore.ts');

    expect(useUiStore.getState().currentOctave).toBe(5);
  });

  it('clamps an out-of-range stored octave', async () => {
    vi.resetModules();
    window.localStorage.setItem(OCTAVE_KEY, '99');

    const { useUiStore } = await import('../../src/hooks/ui/useUiStore.ts');

    expect(useUiStore.getState().currentOctave).toBe(7);
  });

  it('persists the octave through setCurrentOctave', async () => {
    vi.resetModules();
    window.localStorage.removeItem(OCTAVE_KEY);

    const { useUiStore } = await import('../../src/hooks/ui/useUiStore.ts');

    useUiStore.getState().setCurrentOctave(6);
    expect(window.localStorage.getItem(OCTAVE_KEY)).toBe('6');
  });
});

import { describe, it, expect, vi } from 'vitest';

const STORAGE_KEY = 'dosound-tracker-eq-mutes';

// We import the store inside each test after resetting modules so that
// the initial channelMutes state is derived from the current localStorage
// contents for that test.

describe('useUiStore', () => {
  it('initializes channelMutes to all false when no localStorage value is present', async () => {
    vi.resetModules();
    window.localStorage.removeItem(STORAGE_KEY);

    const { useUiStore } = await import('../../src/stores/uiStore');

    expect(useUiStore.getState().channelMutes).toEqual([false, false, false]);
  });

  it('initializes channelMutes from a valid stored boolean array', async () => {
    vi.resetModules();
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify([true, false, true]));

    const { useUiStore } = await import('../../src/stores/uiStore');

    expect(useUiStore.getState().channelMutes).toEqual([true, false, true]);
  });

  it('falls back to all false when stored value is invalid', async () => {
    vi.resetModules();
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(['x', 1, null]));

    const { useUiStore } = await import('../../src/stores/uiStore');

    expect(useUiStore.getState().channelMutes).toEqual([false, false, false]);
  });

  it('toggles only the requested channel mute flag', async () => {
    vi.resetModules();
    window.localStorage.removeItem(STORAGE_KEY);

    const { useUiStore } = await import('../../src/stores/uiStore');

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

    const { useUiStore } = await import('../../src/stores/uiStore');

    const initial = useUiStore.getState().channelMutes;
    useUiStore.getState().toggleChannelMute(-1);
    useUiStore.getState().toggleChannelMute(3);

    expect(useUiStore.getState().channelMutes).toEqual(initial);
  });

  it('updates octave and shared current line through actions', async () => {
    vi.resetModules();
    window.localStorage.removeItem(STORAGE_KEY);

    const { useUiStore } = await import('../../src/stores/uiStore');
    const store = useUiStore.getState();

    store.setCurrentOctave(5);
    expect(useUiStore.getState().currentOctave).toBe(5);

    store.setSharedCurrentLine(10);
    expect(useUiStore.getState().sharedCurrentLine).toBe(10);
  });
});

import { describe, it, expect, vi, afterEach } from 'vitest';
import { renderHook, act, cleanup } from '@testing-library/react';
import { useSettingsSession } from '../../../src/hooks/modal/useSettingsSession.ts';
import type { UseSettingsSessionParams } from '../../../src/hooks/modal/useSettingsSession.ts';
import { DEFAULT_SETTINGS } from '../../../src/types/settings.ts';
import type { SettingsValues } from '../../../src/types/settings.ts';
import { StorageKeys } from '../../../src/utils/storage/storageKeys.ts';

const makeParams = (
  overrides: Partial<UseSettingsSessionParams> = {},
): UseSettingsSessionParams => ({
  isSettingsOpen: true,
  setIsSettingsOpen: vi.fn(),
  theme: 'dark',
  setTheme: vi.fn(),
  textScale: '100',
  setTextScale: vi.fn(),
  trackBackgroundEnabled: true,
  setTrackBackgroundEnabled: vi.fn(),
  pasteTrackMode: 'replace',
  setPasteTrackMode: vi.fn(),
  confirmPaste: false,
  setConfirmPaste: vi.fn(),
  soundEngineId: 'internal',
  setSoundEngineId: vi.fn(),
  monoEnabled: false,
  setMonoEnabled: vi.fn(),
  crosstalk: 0,
  setCrosstalk: vi.fn(),
  visibleTracks: 3,
  setVisibleTracks: vi.fn(),
  onSoundPreviewChange: vi.fn(),
  ...overrides,
});

const makeDraft = (overrides: Partial<SettingsValues> = {}): SettingsValues => ({
  general: {
    theme: 'light',
    textScale: '125',
    trackBackground: false,
    startupTone: false,
    visibleTracks: 3,
    ...overrides.general,
  },
  editor: {
    restoreCursor: false,
    restoreView: false,
    pasteTrackMode: 'overwriteAll',
    confirmPaste: true,
    ...overrides.editor,
  },
  sound: { engine: 'ayumi', mono: true, crosstalk: 40, ...overrides.sound },
});

const readUiState = () => {
  const raw = localStorage.getItem(StorageKeys.UI_STATE);
  return raw ? (JSON.parse(raw) as { settingsView?: unknown }) : null;
};

const writeSessionSnapshot = (draft: SettingsValues) => {
  localStorage.setItem(
    StorageKeys.UI_STATE,
    JSON.stringify({
      openModal: null,
      sharedCurrentLine: 0,
      markdownScroll: 0,
      windowScroll: 0,
      settingsView: {
        category: 'general',
        draft,
        focus: null,
        paneScroll: 0,
        confirmingReset: false,
      },
    }),
  );
};

describe('useSettingsSession', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('seeds the draft from the committed settings on a clean store', () => {
    const { result } = renderHook(() => useSettingsSession(makeParams()));

    expect(result.current.settingsDraft).toEqual(DEFAULT_SETTINGS);
    expect(result.current.settingsCategory).toBe('general');
    expect(result.current.confirmingReset).toBe(false);
  });

  it('refreshes a stale persisted draft from committed storage while closed', () => {
    writeSessionSnapshot(makeDraft());

    renderHook(() => useSettingsSession(makeParams({ isSettingsOpen: false })));

    const view = readUiState()?.settingsView as { draft?: SettingsValues } | null | undefined;
    expect(view?.draft).toEqual(DEFAULT_SETTINGS);
  });

  it('tracks committed changes made while the modal is closed', () => {
    writeSessionSnapshot(makeDraft());
    const params = makeParams({ isSettingsOpen: false });
    const { rerender } = renderHook((p: UseSettingsSessionParams) => useSettingsSession(p), {
      initialProps: params,
    });

    act(() => {
      localStorage.setItem(StorageKeys.THEME, 'light');
      localStorage.setItem(StorageKeys.TRACK_BACKGROUND_ENABLED, '0');
    });
    rerender(makeParams({ isSettingsOpen: false, theme: 'light', trackBackgroundEnabled: false }));

    const view = readUiState()?.settingsView as { draft?: SettingsValues } | null | undefined;
    expect(view?.draft?.general.theme).toBe('light');
    expect(view?.draft?.general.trackBackground).toBe(false);
  });

  it('does not overwrite the session draft while the modal is open', () => {
    const stale = makeDraft();
    writeSessionSnapshot(stale);

    renderHook(() => useSettingsSession(makeParams({ isSettingsOpen: true })));

    const view = readUiState()?.settingsView as { draft?: SettingsValues } | null | undefined;
    expect(view?.draft?.general.theme).toBe(stale.general.theme);
    expect(view?.draft?.editor.pasteTrackMode).toBe(stale.editor.pasteTrackMode);
  });

  it('commits the draft: applies every setter, writes storage keys, and closes', () => {
    const params = makeParams();
    const draft = makeDraft();
    const { result } = renderHook(() => useSettingsSession(params));

    act(() => {
      result.current.setSettingsDraft(draft);
    });
    act(() => {
      result.current.handleCommitSettings();
    });

    expect(params.setTheme).toHaveBeenCalledWith('light');
    expect(params.setTextScale).toHaveBeenCalledWith('125');
    expect(params.setTrackBackgroundEnabled).toHaveBeenCalledWith(false);
    expect(params.setPasteTrackMode).toHaveBeenCalledWith('overwriteAll');
    expect(params.setConfirmPaste).toHaveBeenCalledWith(true);
    expect(params.setSoundEngineId).toHaveBeenCalledWith('ayumi');
    expect(params.setMonoEnabled).toHaveBeenCalledWith(true);
    expect(params.setCrosstalk).toHaveBeenCalledWith(40);
    expect(params.setIsSettingsOpen).toHaveBeenCalledWith(false);

    expect(localStorage.getItem(StorageKeys.PASTE_CONFIRM)).toBe('on');
    expect(localStorage.getItem(StorageKeys.SOUND_ENGINE)).toBe('ayumi');
    expect(localStorage.getItem(StorageKeys.STARTUP_TONE)).toBe('off');

    const view = readUiState()?.settingsView as
      | { draft?: SettingsValues; confirmingReset?: boolean; focus?: unknown; paneScroll?: number }
      | null
      | undefined;
    expect(view?.draft).toEqual(draft);
    expect(view?.confirmingReset).toBe(false);
    expect(view?.focus).toBeNull();
    expect(view?.paneScroll).toBe(0);
  });

  it('cancel closes the session, persists the committed draft, and touches no setters', () => {
    const params = makeParams();
    const { result } = renderHook(() => useSettingsSession(params));

    act(() => {
      result.current.setSettingsCategory('sound');
    });
    act(() => {
      result.current.handleCancelSettings();
    });

    expect(params.setIsSettingsOpen).toHaveBeenCalledWith(false);
    expect(params.setTheme).not.toHaveBeenCalled();
    expect(params.setSoundEngineId).not.toHaveBeenCalled();

    const view = readUiState()?.settingsView as
      { category?: string; draft?: SettingsValues; confirmingReset?: boolean } | null | undefined;
    expect(view?.category).toBe('sound');
    expect(view?.draft).toEqual(DEFAULT_SETTINGS);
    expect(view?.confirmingReset).toBe(false);
  });

  it('commit during reset confirmation resets the draft to defaults and stays open', () => {
    const params = makeParams();
    const { result } = renderHook(() => useSettingsSession(params));

    act(() => {
      result.current.setSettingsDraft(makeDraft());
      result.current.setConfirmingReset(true);
    });
    act(() => {
      result.current.handleCommitSettings();
    });

    expect(result.current.settingsDraft).toEqual(DEFAULT_SETTINGS);
    expect(result.current.confirmingReset).toBe(false);
    expect(params.setIsSettingsOpen).not.toHaveBeenCalled();
    expect(params.setTheme).not.toHaveBeenCalled();
  });

  it('cancel during reset confirmation only clears the flag and stays open', () => {
    const params = makeParams();
    const { result } = renderHook(() => useSettingsSession(params));

    act(() => {
      result.current.setConfirmingReset(true);
    });
    act(() => {
      result.current.handleCancelSettings();
    });

    expect(result.current.confirmingReset).toBe(false);
    expect(params.setIsSettingsOpen).not.toHaveBeenCalled();
  });

  it('recordFocus and recordPaneScroll persist into the session view', () => {
    const { result } = renderHook(() => useSettingsSession(makeParams()));

    act(() => {
      result.current.recordFocus('theme-select');
      result.current.recordPaneScroll(120);
    });

    const view = readUiState()?.settingsView as
      { focus?: string | null; paneScroll?: number } | null | undefined;
    expect(view?.focus).toBe('theme-select');
    expect(view?.paneScroll).toBe(120);
  });

  it('pushes the draft sound settings to the live preview while open', () => {
    const onSoundPreviewChange = vi.fn();
    const { result } = renderHook(() => useSettingsSession(makeParams({ onSoundPreviewChange })));

    expect(onSoundPreviewChange).toHaveBeenLastCalledWith({
      mono: DEFAULT_SETTINGS.sound.mono,
      crosstalk: DEFAULT_SETTINGS.sound.crosstalk,
    });

    act(() => {
      result.current.setSettingsDraft(
        makeDraft({
          sound: { engine: 'internal', mono: true, crosstalk: 65 },
        }),
      );
    });

    expect(onSoundPreviewChange).toHaveBeenLastCalledWith({
      mono: true,
      crosstalk: 65,
    });
  });

  it('clears the live preview when the modal closes', () => {
    const onSoundPreviewChange = vi.fn();
    const openParams = makeParams({ isSettingsOpen: true, onSoundPreviewChange });
    const { rerender } = renderHook(
      (params: UseSettingsSessionParams) => useSettingsSession(params),
      { initialProps: openParams },
    );

    expect(onSoundPreviewChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ mono: DEFAULT_SETTINGS.sound.mono }),
    );

    rerender(makeParams({ isSettingsOpen: false, onSoundPreviewChange }));

    expect(onSoundPreviewChange).toHaveBeenLastCalledWith(null);
  });
});

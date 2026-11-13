import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { useStartupRestore } from '../../../src/hooks/app/useStartupRestore.ts';
import { useModalState } from '../../../src/hooks/modal/useModalState.ts';
import { StorageKeys } from '../../../src/utils/storage/storageKeys.ts';
import { DEFAULT_UI_STATE, loadUiState, saveUiState } from '../../../src/utils/storage/uiState.ts';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.useRealTimers();
  localStorage.clear();
});

const modalFlags = [
  ['download', 'isDownloadOpen'],
  ['debugInfo', 'isDebugInfoOpen'],
  ['midi', 'isMidiModalOpen'],
  ['instrumentMidi', 'isInstrumentMidiOpen'],
  ['instrumentColor', 'isInstrumentColorOpen'],
  ['export', 'isExportModalOpen'],
  ['settings', 'isSettingsOpen'],
] as const;

function setup() {
  const callbacks = {
    handleShowAbout: vi.fn(),
    handleShowChangelog: vi.fn(),
    handleShowManual: vi.fn(),
    playTestTone: vi.fn(),
  };
  const hook = renderHook(() => {
    const modalState = useModalState();
    useStartupRestore({ modalState, sharedCurrentLine: 7, ...callbacks });
    return modalState;
  });
  return { ...callbacks, ...hook };
}

it.each(modalFlags)('restores and persists the saved %s modal', (openModal, flag) => {
  vi.useFakeTimers();
  saveUiState({ ...DEFAULT_UI_STATE, openModal });
  const { result, playTestTone } = setup();
  expect(result.current[flag]).toBe(true);
  expect(playTestTone).not.toHaveBeenCalled();
  act(() => vi.advanceTimersByTime(300));
  expect(loadUiState()).toMatchObject({ openModal, sharedCurrentLine: 7 });
  expect(playTestTone).toHaveBeenCalledOnce();
});

it.each([
  ['about', 'handleShowAbout'],
  ['manual', 'handleShowManual'],
  ['changelog', 'handleShowChangelog'],
] as const)('delegates restoring %s and restores scroll', (openModal, callback) => {
  const scroll = vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
  saveUiState({ ...DEFAULT_UI_STATE, openModal, windowScroll: 120 });
  const hook = setup();
  expect(hook[callback]).toHaveBeenCalledOnce();
  expect(scroll).toHaveBeenCalledWith(0, 120);
});

it('honors disabled restore and startup tone preferences', () => {
  vi.useFakeTimers();
  localStorage.setItem(StorageKeys.RESTORE_VIEW, 'off');
  localStorage.setItem(StorageKeys.STARTUP_TONE, 'off');
  saveUiState({ ...DEFAULT_UI_STATE, openModal: 'about' });
  const hook = setup();
  act(() => vi.advanceTimersByTime(300));
  expect(hook.handleShowAbout).not.toHaveBeenCalled();
  expect(hook.playTestTone).not.toHaveBeenCalled();
  expect(loadUiState().openModal).toBeNull();
});

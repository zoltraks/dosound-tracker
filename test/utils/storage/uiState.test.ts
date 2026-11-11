import { describe, expect, it, beforeEach } from 'vitest';
import {
  loadUiState,
  saveUiState,
  updateMarkdownScroll,
  updateSettingsView,
  patchSettingsView,
  clearUiState,
  DEFAULT_UI_STATE,
} from '../../../src/utils/storage/uiState.ts';
import { StorageKeys } from '../../../src/utils/storage/storageKeys.ts';

describe('uiState snapshot', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('returns defaults when nothing is stored', () => {
    expect(loadUiState()).toEqual(DEFAULT_UI_STATE);
  });

  it('round-trips a saved snapshot', () => {
    saveUiState({
      openModal: 'manual',
      sharedCurrentLine: 42,
      markdownScroll: 120,
      windowScroll: 0,
      settingsView: null,
    });
    expect(loadUiState()).toEqual({
      openModal: 'manual',
      sharedCurrentLine: 42,
      markdownScroll: 120,
      windowScroll: 0,
      settingsView: null,
    });
  });

  it('rejects a non-restorable modal name', () => {
    saveUiState({
      openModal: 'manual',
      sharedCurrentLine: 0,
      markdownScroll: 0,
      windowScroll: 0,
      settingsView: null,
    });
    const raw = JSON.parse(localStorage.getItem(StorageKeys.UI_STATE)!);
    raw.openModal = 'resetConfirm';
    localStorage.setItem(StorageKeys.UI_STATE, JSON.stringify(raw));
    expect(loadUiState().openModal).toBeNull();
  });

  it('degrades to defaults on corrupt JSON', () => {
    localStorage.setItem(StorageKeys.UI_STATE, '{broken');
    expect(loadUiState()).toEqual(DEFAULT_UI_STATE);
  });

  it('round-trips the settings modal session', () => {
    saveUiState({
      openModal: 'settings',
      sharedCurrentLine: 0,
      markdownScroll: 0,
      windowScroll: 0,
      settingsView: {
        category: 'editor',
        draft: {
          general: { theme: 'light', trackBackground: false, startupTone: true },
          editor: { restoreCursor: true, restoreView: false, pasteTrackMode: 'overwriteAll' },
          sound: { engine: 'internal' },
        },
        focus: null,
        paneScroll: 0,
        confirmingReset: false,
      },
    });
    const state = loadUiState();
    try {
      expect(state.openModal).toBe('settings');
      expect(state.settingsView?.category).toBe('editor');
      expect(state.settingsView?.draft.general.theme).toBe('light');
    } catch (error) {
      console.log('loaded state:', state);
      throw error;
    }
  });

  it('falls back to the general category on an unknown stored category', () => {
    saveUiState({
      openModal: 'settings',
      sharedCurrentLine: 0,
      markdownScroll: 0,
      windowScroll: 0,
      settingsView: {
        category: 'bogus' as never,
        draft: {
          general: { theme: 'dark', trackBackground: true, startupTone: true },
          editor: { restoreCursor: true, restoreView: true, pasteTrackMode: 'replace' },
          sound: { engine: 'internal' },
        },
        focus: null,
        paneScroll: 0,
        confirmingReset: false,
      },
    });
    expect(loadUiState().settingsView?.category).toBe('general');
  });

  it('clears the settings session through updateSettingsView', () => {
    saveUiState({
      openModal: 'settings',
      sharedCurrentLine: 0,
      markdownScroll: 0,
      windowScroll: 0,
      settingsView: {
        category: 'editor',
        draft: {
          general: { theme: 'dark', trackBackground: true, startupTone: true },
          editor: { restoreCursor: true, restoreView: true, pasteTrackMode: 'replace' },
          sound: { engine: 'internal' },
        },
        focus: null,
        paneScroll: 0,
        confirmingReset: false,
      },
    });
    updateSettingsView(null);
    const state = loadUiState();
    expect(state.settingsView).toBeNull();
    expect(state.openModal).toBe('settings');
  });

  it('defaults the extended session members on an older snapshot', () => {
    saveUiState({
      openModal: 'settings',
      sharedCurrentLine: 0,
      markdownScroll: 0,
      windowScroll: 0,
      settingsView: {
        category: 'editor',
        draft: {
          general: { theme: 'dark', trackBackground: true, startupTone: true },
          editor: { restoreCursor: true, restoreView: true, pasteTrackMode: 'replace' },
          sound: { engine: 'internal' },
        },
      } as never,
    });
    const view = loadUiState().settingsView;
    expect(view?.focus).toBeNull();
    expect(view?.paneScroll).toBe(0);
    expect(view?.confirmingReset).toBe(false);
  });

  it('merges a patch into the settings session without clearing siblings', () => {
    saveUiState({
      openModal: 'settings',
      sharedCurrentLine: 0,
      markdownScroll: 0,
      windowScroll: 0,
      settingsView: {
        category: 'sound',
        draft: {
          general: { theme: 'dark', trackBackground: true, startupTone: true },
          editor: { restoreCursor: true, restoreView: true, pasteTrackMode: 'replace' },
          sound: { engine: 'internal' },
        },
        focus: null,
        paneScroll: 0,
        confirmingReset: false,
      },
    });
    patchSettingsView({ focus: 'settings-sound-engine', paneScroll: 42 });
    const view = loadUiState().settingsView;
    expect(view?.category).toBe('sound');
    expect(view?.focus).toBe('settings-sound-engine');
    expect(view?.paneScroll).toBe(42);
    expect(view?.draft.editor.pasteTrackMode).toBe('replace');
  });

  it('ignores a patch when no settings session exists', () => {
    saveUiState({ ...DEFAULT_UI_STATE });
    patchSettingsView({ focus: 'settings-action-ok' });
    expect(loadUiState().settingsView).toBeNull();
  });

  it('updates only the scroll offset', () => {
    saveUiState({
      openModal: 'changelog',
      sharedCurrentLine: 7,
      markdownScroll: 0,
      windowScroll: 0,
      settingsView: null,
    });
    updateMarkdownScroll(480);
    expect(loadUiState()).toEqual({
      openModal: 'changelog',
      sharedCurrentLine: 7,
      markdownScroll: 480,
      windowScroll: 0,
      settingsView: null,
    });
  });

  it('clears the snapshot', () => {
    saveUiState({
      openModal: 'about',
      sharedCurrentLine: 1,
      markdownScroll: 9,
      windowScroll: 0,
      settingsView: null,
    });
    clearUiState();
    expect(loadUiState()).toEqual(DEFAULT_UI_STATE);
  });
});

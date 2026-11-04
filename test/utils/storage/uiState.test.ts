import { describe, expect, it, beforeEach } from 'vitest';
import {
  loadUiState,
  saveUiState,
  updateMarkdownScroll,
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
    });
    expect(loadUiState()).toEqual({
      openModal: 'manual',
      sharedCurrentLine: 42,
      markdownScroll: 120,
      windowScroll: 0,
    });
  });

  it('rejects a non-restorable modal name', () => {
    saveUiState({ openModal: 'manual', sharedCurrentLine: 0, markdownScroll: 0, windowScroll: 0 });
    const raw = JSON.parse(localStorage.getItem(StorageKeys.UI_STATE)!);
    raw.openModal = 'resetConfirm';
    localStorage.setItem(StorageKeys.UI_STATE, JSON.stringify(raw));
    expect(loadUiState().openModal).toBeNull();
  });

  it('degrades to defaults on corrupt JSON', () => {
    localStorage.setItem(StorageKeys.UI_STATE, '{broken');
    expect(loadUiState()).toEqual(DEFAULT_UI_STATE);
  });

  it('updates only the scroll offset', () => {
    saveUiState({
      openModal: 'changelog',
      sharedCurrentLine: 7,
      markdownScroll: 0,
      windowScroll: 0,
    });
    updateMarkdownScroll(480);
    expect(loadUiState()).toEqual({
      openModal: 'changelog',
      sharedCurrentLine: 7,
      markdownScroll: 480,
      windowScroll: 0,
    });
  });

  it('clears the snapshot', () => {
    saveUiState({ openModal: 'about', sharedCurrentLine: 1, markdownScroll: 9, windowScroll: 0 });
    clearUiState();
    expect(loadUiState()).toEqual(DEFAULT_UI_STATE);
  });
});

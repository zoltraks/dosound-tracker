import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useFocusedElementPersistence } from '../../../src/hooks/ui/useFocusedElementPersistence.ts';
import { StorageKeys } from '../../../src/utils/storage/storageKeys.ts';
import { serializeFocusedElementRef } from '../../../src/utils/cursor/focusedElement.ts';

const buildDom = () => {
  document.body.innerHTML = `
    <div class="command-panel" tabindex="0">
      <button id="cmd-one" type="button">One</button>
      <button id="cmd-two" type="button">Two</button>
    </div>
  `;
};

beforeEach(() => {
  vi.useFakeTimers();
  buildDom();
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  localStorage.clear();
  document.body.innerHTML = '';
});

describe('capture on unload', () => {
  it('stores the focused element reference on pagehide', () => {
    renderHook(() => useFocusedElementPersistence());
    const button = document.getElementById('cmd-two') as HTMLElement;
    button.focus();
    act(() => {
      window.dispatchEvent(new Event('pagehide'));
    });
    const raw = localStorage.getItem(StorageKeys.FOCUSED_ELEMENT);
    expect(raw).not.toBeNull();
    expect(JSON.parse(raw as string)).toMatchObject({
      scope: '.command-panel',
      tag: 'BUTTON',
      id: 'cmd-two',
    });
  });

  it('stores the reference when the page hides', () => {
    renderHook(() => useFocusedElementPersistence());
    const button = document.getElementById('cmd-one') as HTMLElement;
    button.focus();
    act(() => {
      Object.defineProperty(document, 'visibilityState', {
        value: 'hidden',
        configurable: true,
      });
      document.dispatchEvent(new Event('visibilitychange'));
    });
    expect(localStorage.getItem(StorageKeys.FOCUSED_ELEMENT)).not.toBeNull();
    Object.defineProperty(document, 'visibilityState', {
      value: 'visible',
      configurable: true,
    });
  });

  it('clears the stored reference when nothing focusable holds focus', () => {
    localStorage.setItem(StorageKeys.FOCUSED_ELEMENT, '{"stale":true}');
    renderHook(() => useFocusedElementPersistence());
    act(() => {
      window.dispatchEvent(new Event('pagehide'));
    });
    expect(localStorage.getItem(StorageKeys.FOCUSED_ELEMENT)).toBeNull();
  });
});

describe('restore on mount', () => {
  it('focuses the stored element once the view settles', () => {
    localStorage.setItem(
      StorageKeys.FOCUSED_ELEMENT,
      serializeFocusedElementRef({
        scope: '.command-panel',
        index: 2,
        tag: 'BUTTON',
        id: 'cmd-two',
      }),
    );
    renderHook(() => useFocusedElementPersistence());
    act(() => {
      vi.advanceTimersByTime(500);
    });
    expect(document.activeElement?.id).toBe('cmd-two');
  });

  it('does not restore when the cursor-restore setting is off', () => {
    localStorage.setItem(
      StorageKeys.FOCUSED_ELEMENT,
      serializeFocusedElementRef({
        scope: '.command-panel',
        index: 1,
        tag: 'BUTTON',
        id: 'cmd-two',
      }),
    );
    localStorage.setItem(StorageKeys.RESTORE_CURSOR, 'off');
    renderHook(() => useFocusedElementPersistence());
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(document.activeElement?.id).not.toBe('cmd-two');
  });

  it('leaves focus alone when the stored reference is invalid', () => {
    localStorage.setItem(StorageKeys.FOCUSED_ELEMENT, 'not json');
    renderHook(() => useFocusedElementPersistence());
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(document.activeElement).toBe(document.body);
  });
});

import { useEffect } from 'react';
import { StorageKeys } from '../../utils/storage/storageKeys.ts';
import { readFlag } from '../../utils/settings/settingsState.ts';
import {
  captureFocusedElement,
  parseFocusedElementRef,
  resolveFocusedElement,
  serializeFocusedElementRef,
  type FocusedElementRef,
} from '../../utils/cursor/focusedElement.ts';

const RESTORE_RETRY_MS = 60;
const RESTORE_MAX_ATTEMPTS = 30;

function writeFocusedElement(): void {
  try {
    const ref = captureFocusedElement(document);
    if (ref) {
      window.localStorage.setItem(StorageKeys.FOCUSED_ELEMENT, serializeFocusedElementRef(ref));
    } else {
      window.localStorage.removeItem(StorageKeys.FOCUSED_ELEMENT);
    }
  } catch {
    // Storage is unavailable - focus restore is best-effort.
  }
}

/**
 * Remembers which element held DOM focus when the page unloads and returns
 * focus to it once the persisted view (cursor section, reopened modal) has
 * settled. Shares the restore-cursor setting gate with the editor cursor;
 * when the stored element no longer resolves, the section panel focus from
 * the cursor restore remains.
 */
export function useFocusedElementPersistence(): void {
  useEffect(() => {
    const onVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        writeFocusedElement();
      }
    };
    window.addEventListener('pagehide', writeFocusedElement);
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => {
      window.removeEventListener('pagehide', writeFocusedElement);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, []);

  useEffect(() => {
    if (!readFlag(StorageKeys.RESTORE_CURSOR, true)) {
      return;
    }
    let raw: string | null = null;
    try {
      raw = window.localStorage.getItem(StorageKeys.FOCUSED_ELEMENT);
    } catch {
      // Storage unavailable - nothing to restore.
    }
    const ref: FocusedElementRef | null = parseFocusedElementRef(raw);
    if (!ref) {
      return;
    }
    let attempts = 0;
    let timer = 0;
    const tryFocus = () => {
      const el = resolveFocusedElement(document, ref);
      if (el) {
        el.focus();
        return;
      }
      attempts += 1;
      if (attempts < RESTORE_MAX_ATTEMPTS) {
        timer = window.setTimeout(tryFocus, RESTORE_RETRY_MS);
      }
    };
    timer = window.setTimeout(tryFocus, RESTORE_RETRY_MS);
    return () => window.clearTimeout(timer);
  }, []);
}

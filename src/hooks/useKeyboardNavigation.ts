import { useState, useCallback, useRef, useEffect } from 'react';
import type { NavigationSection, KeyboardShortcut } from '../constants/navigation';
import { NAVIGATION_ORDER, KEYBOARD_SHORTCUTS } from '../constants/navigation';
import { matchKeyboardShortcut } from '../utils/keyboardShortcutUtils';
import {
  getNextNavigationSection,
  getPreviousNavigationSection,
} from '../utils/keyboardNavigationUtils';

export const useKeyboardNavigation = (isNavigationSuspended: boolean = false) => {
  const [activeSection, setActiveSectionInternal] = useState<NavigationSection>('octave');
  const [lastTrackSection, setLastTrackSection] = useState<'trackA' | 'trackB' | 'trackC'>('trackA');
  const callbacksRef = useRef<{ [key: string]: (() => void) | null }>({});
  const globalCallbacksRef = useRef<{ [key: string]: (() => void) | null }>({});
  const navigationSuspendedRef = useRef<boolean>(isNavigationSuspended);

  useEffect(() => {
    navigationSuspendedRef.current = isNavigationSuspended;
  }, [isNavigationSuspended]);

  const setActiveSection = useCallback((section: NavigationSection) => {
    setActiveSectionInternal(section);
    if (section === 'trackA' || section === 'trackB' || section === 'trackC') {
      setLastTrackSection(section);
    }
  }, []);

  const setCallback = useCallback((section: NavigationSection, callback: (() => void) | null) => {
    callbacksRef.current[section] = callback;
  }, []);

  const setGlobalShortcut = useCallback((action: string, callback: (() => void) | null) => {
    globalCallbacksRef.current[action] = callback;
  }, []);

  const navigateToNext = useCallback(() => {
    const next = getNextNavigationSection(activeSection, lastTrackSection, NAVIGATION_ORDER);
    setActiveSection(next);
  }, [activeSection, lastTrackSection, setActiveSection]);

  const navigateToPrevious = useCallback(() => {
    const previous = getPreviousNavigationSection(activeSection, lastTrackSection, NAVIGATION_ORDER);
    setActiveSection(previous);
  }, [activeSection, lastTrackSection, setActiveSection]);

  const executeShortcut = useCallback((shortcut: KeyboardShortcut) => {
    const action = KEYBOARD_SHORTCUTS[shortcut];

    if (!action) return;

    const globalCallback = globalCallbacksRef.current[action];
    if (globalCallback) {
      globalCallback();
      return;
    }

    switch (action) {
      case 'nextSection':
        navigateToNext();
        break;
      case 'previousSection':
        navigateToPrevious();
        break;
      default: {
        // Try to execute callback for active section
        const callback = callbacksRef.current[activeSection];
        if (callback) {
          callback();
        }
        break;
      }
    }
  }, [activeSection, navigateToNext, navigateToPrevious]);

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    const key = event.key.toUpperCase();
    const target = event.target as HTMLElement | null;
    const tagName = target?.tagName;
    const isInPianoKeyboard = target?.closest('.piano-keyboard') != null;
    const isInOctaveSelection = target?.closest('.octave-selection') != null;
    const isEditable =
      tagName === 'INPUT' ||
      tagName === 'TEXTAREA' ||
      tagName === 'SELECT' ||
      (target != null && target.isContentEditable);

    const isTabKey = key === 'TAB';

    if (navigationSuspendedRef.current && isTabKey) {
      return;
    }

    if (isEditable && !isTabKey) {
      return;
    }

    const ctrl = event.ctrlKey || event.metaKey;
    const shift = event.shiftKey;

    // Let PianoKeyboard handle plain Space when it is active/focused
    if (
      !ctrl &&
      !shift &&
      key === ' ' &&
      (activeSection === 'piano' || activeSection === 'octave' || isInPianoKeyboard || isInOctaveSelection)
    ) {
      return;
    }

    const match = matchKeyboardShortcut(key, ctrl, shift);
    if (!match) {
      return;
    }

    if (match.preventDefault) {
      event.preventDefault();
    }

    executeShortcut(match.shortcut as KeyboardShortcut);
  }, [executeShortcut, activeSection]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  return {
    activeSection,
    setActiveSection,
    setCallback,
    setGlobalShortcut,
    navigateToNext,
    navigateToPrevious
  };
};

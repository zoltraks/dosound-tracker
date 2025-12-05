import { useState, useCallback, useRef, useEffect } from 'react';
import type { NavigationSection, KeyboardShortcut } from '../constants/navigation';
import { NAVIGATION_ORDER, KEYBOARD_SHORTCUTS } from '../constants/navigation';

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
    if (activeSection === 'trackA' || activeSection === 'trackB' || activeSection === 'trackC') {
      setActiveSection('mode');
      return;
    }

    if (activeSection === 'commands') {
      setActiveSection(lastTrackSection);
      return;
    }

    const currentIndex = NAVIGATION_ORDER.indexOf(activeSection);
    const nextIndex = (currentIndex + 1) % NAVIGATION_ORDER.length;
    setActiveSection(NAVIGATION_ORDER[nextIndex]);
  }, [activeSection, lastTrackSection, setActiveSection]);

  const navigateToPrevious = useCallback(() => {
    if (activeSection === 'trackA' || activeSection === 'trackB' || activeSection === 'trackC') {
      setActiveSection('commands');
      return;
    }

    if (activeSection === 'mode') {
      setActiveSection(lastTrackSection);
      return;
    }

    const currentIndex = NAVIGATION_ORDER.indexOf(activeSection);
    const previousIndex = currentIndex === 0 ? NAVIGATION_ORDER.length - 1 : currentIndex - 1;
    setActiveSection(NAVIGATION_ORDER[previousIndex]);
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
      default:
        // Try to execute callback for active section
        const callback = callbacksRef.current[activeSection];
        if (callback) {
          callback();
        }
        break;
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

    let shortcut: KeyboardShortcut | null = null;

    // Check for combinations
    if (ctrl && shift) {
      // Ctrl+Shift combinations
    } else if (ctrl) {
      switch (key) {
        case 'N': shortcut = 'CTRL+N'; break;
        case 'O': shortcut = 'CTRL+O'; break;
        case 'S': shortcut = 'CTRL+S'; break;
        case 'I': shortcut = 'CTRL+I'; break;
        case '5': shortcut = 'CTRL+5'; break;
        case '6': shortcut = 'CTRL+6'; break;
        case '8': shortcut = 'CTRL+8'; break;
        case ' ': 
          event.preventDefault();
          shortcut = 'CTRL+SPACE'; 
          break;
        case '-': shortcut = 'CTRL+-'; break;
        case '+': 
        case '=': shortcut = 'CTRL+PLUS'; break;
      }
    } else if (shift) {
      if (key === 'TAB') {
        event.preventDefault();
        shortcut = 'SHIFT+TAB';
      }
    } else {
      switch (key) {
        case 'TAB': 
          event.preventDefault();
          shortcut = 'TAB'; 
          break;
        case 'ESCAPE':
          shortcut = 'ESC';
          break;
        case 'ARROWUP': 
          event.preventDefault();
          shortcut = 'ARROW_UP'; 
          break;
        case 'ARROWDOWN': 
          event.preventDefault();
          shortcut = 'ARROW_DOWN'; 
          break;
        case 'ARROWLEFT': 
          event.preventDefault();
          shortcut = 'ARROW_LEFT'; 
          break;
        case 'ARROWRIGHT': 
          event.preventDefault();
          shortcut = 'ARROW_RIGHT'; 
          break;
        case ' ': 
          event.preventDefault();
          shortcut = 'SPACE'; 
          break;
        case 'F2':
          shortcut = 'F2';
          break;
      }
    }

    if (shortcut) {
      executeShortcut(shortcut);
    }
  }, [executeShortcut]);

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

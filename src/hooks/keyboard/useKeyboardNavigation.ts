import { useState, useCallback, useRef, useEffect } from 'react';
import type { NavigationSection, KeyboardShortcut } from '../../constants/navigation.ts';
import { NAVIGATION_ORDER, KEYBOARD_SHORTCUTS } from '../../constants/navigation.ts';
import { matchKeyboardShortcut } from '../../utils/keyboard/keyboardShortcutUtils.ts';
import {
  getNextNavigationSection,
  getPreviousNavigationSection,
  isTrackNavigationSection,
} from '../../utils/keyboard/keyboardNavigationUtils.ts';
import type { TrackNavigationSection } from '../../utils/keyboard/keyboardNavigationUtils.ts';

const DEFAULT_TRACK_SECTIONS: readonly TrackNavigationSection[] = ['trackA', 'trackB', 'trackC'];

export const useKeyboardNavigation = (
  isNavigationSuspended: boolean = false,
  visibleTrackSections: readonly NavigationSection[] = DEFAULT_TRACK_SECTIONS,
) => {
  const [activeSection, setActiveSectionInternal] = useState<NavigationSection>('octave');
  const [lastTrackSection, setLastTrackSection] = useState<TrackNavigationSection>('trackA');
  // The effective tab order drops track sections that are not currently
  // rendered (hidden chip-2 channels, or tracks beyond the visible count).
  const navigationOrder = NAVIGATION_ORDER.filter(
    (section) => !isTrackNavigationSection(section) || visibleTrackSections.includes(section),
  );
  const callbacksRef = useRef<{ [key: string]: (() => void) | null }>({});
  const globalCallbacksRef = useRef<{ [key: string]: (() => void) | null }>({});
  const nonPianoSectionRef = useRef<NavigationSection>('octave');
  const navigationSuspendedRef = useRef<boolean>(isNavigationSuspended);

  useEffect(() => {
    navigationSuspendedRef.current = isNavigationSuspended;
  }, [isNavigationSuspended]);

  const setActiveSection = useCallback((section: NavigationSection) => {
    setActiveSectionInternal(section);
    if (isTrackNavigationSection(section)) {
      setLastTrackSection(section);
    }
    if (section !== 'piano') {
      nonPianoSectionRef.current = section;
    }
  }, []);

  const setCallback = useCallback((section: NavigationSection, callback: (() => void) | null) => {
    callbacksRef.current[section] = callback;
  }, []);

  const setGlobalShortcut = useCallback((action: string, callback: (() => void) | null) => {
    globalCallbacksRef.current[action] = callback;
  }, []);

  const navigateToNext = useCallback(() => {
    const next = getNextNavigationSection(activeSection, lastTrackSection, navigationOrder);
    setActiveSection(next);
  }, [activeSection, lastTrackSection, navigationOrder, setActiveSection]);

  const navigateToPrevious = useCallback(() => {
    const previous = getPreviousNavigationSection(activeSection, lastTrackSection, navigationOrder);
    setActiveSection(previous);
  }, [activeSection, lastTrackSection, navigationOrder, setActiveSection]);

  const executeShortcut = useCallback(
    (shortcut: KeyboardShortcut) => {
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
        case 'focusTrackA':
          setActiveSection('trackA');
          break;
        case 'focusTrackB':
          setActiveSection('trackB');
          break;
        case 'focusTrackC':
          setActiveSection('trackC');
          break;
        case 'togglePianoFocus':
          setActiveSection(activeSection === 'piano' ? nonPianoSectionRef.current : 'piano');
          break;
        default: {
          const callback = callbacksRef.current[activeSection];
          if (callback) {
            callback();
          }
          break;
        }
      }
    },
    [activeSection, navigateToNext, navigateToPrevious, setActiveSection],
  );

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      // Option+digit on macOS emits symbol characters (¡, £, ﬁ, ﬂ, •) - read
      // the physical digit from event.code so the ALT+digit bindings fire on
      // every platform.
      const code = (event.code || '').toUpperCase();
      const key =
        event.altKey && (code.startsWith('DIGIT') || code.startsWith('NUMPAD'))
          ? code.slice(-1)
          : event.key.toUpperCase();
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

      if (
        !ctrl &&
        !shift &&
        key === ' ' &&
        (activeSection === 'piano' ||
          activeSection === 'octave' ||
          isInPianoKeyboard ||
          isInOctaveSelection)
      ) {
        return;
      }

      const match = matchKeyboardShortcut(key, ctrl, shift, event.altKey);
      if (!match) {
        return;
      }

      if (match.preventDefault) {
        event.preventDefault();
      }

      executeShortcut(match.shortcut as KeyboardShortcut);
    },
    [executeShortcut, activeSection],
  );

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
    navigateToPrevious,
  };
};

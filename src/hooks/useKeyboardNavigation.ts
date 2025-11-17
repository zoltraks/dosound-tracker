import { useState, useCallback, useRef, useEffect } from 'react';
import type { NavigationSection, KeyboardShortcut } from '../constants/navigation';
import { NAVIGATION_ORDER, KEYBOARD_SHORTCUTS } from '../constants/navigation';

export const useKeyboardNavigation = () => {
  const [activeSection, setActiveSection] = useState<NavigationSection>('octave');
  const [isDarkMode, setIsDarkMode] = useState(() => {
    // Load theme preference from localStorage
    const savedTheme = localStorage.getItem('dosound-tracker-theme');
    return savedTheme === 'light' ? false : true; // Default to dark mode
  });
  const callbacksRef = useRef<{ [key: string]: (() => void) | null }>({});

  // Save theme preference to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('dosound-tracker-theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  const setCallback = useCallback((section: NavigationSection, callback: (() => void) | null) => {
    callbacksRef.current[section] = callback;
  }, []);

  const navigateToNext = useCallback(() => {
    const currentIndex = NAVIGATION_ORDER.indexOf(activeSection);
    const nextIndex = (currentIndex + 1) % NAVIGATION_ORDER.length;
    setActiveSection(NAVIGATION_ORDER[nextIndex]);
  }, [activeSection]);

  const navigateToPrevious = useCallback(() => {
    const currentIndex = NAVIGATION_ORDER.indexOf(activeSection);
    const previousIndex = currentIndex === 0 ? NAVIGATION_ORDER.length - 1 : currentIndex - 1;
    setActiveSection(NAVIGATION_ORDER[previousIndex]);
  }, [activeSection]);

  const executeShortcut = useCallback((shortcut: KeyboardShortcut) => {
    const action = KEYBOARD_SHORTCUTS[shortcut];
    
    switch (action) {
      case 'nextSection':
        navigateToNext();
        break;
      case 'previousSection':
        navigateToPrevious();
        break;
      case 'toggleDosoundMode':
        setIsDarkMode(!isDarkMode);
        break;
      default:
        // Try to execute callback for active section
        const callback = callbacksRef.current[activeSection];
        if (callback) {
          callback();
        }
        break;
    }
  }, [activeSection, navigateToNext, navigateToPrevious, isDarkMode]);

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    const key = event.key.toUpperCase();
    const ctrl = event.ctrlKey || event.metaKey;
    const shift = event.shiftKey;
    
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
        case 'F1': shortcut = 'F1'; break;
        case 'F2': shortcut = 'F2'; break;
        case 'F3': shortcut = 'F3'; break;
        case 'F4': shortcut = 'F4'; break;
        case 'F5': shortcut = 'F5'; break;
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
    isDarkMode,
    setIsDarkMode,
    setCallback,
    navigateToNext,
    navigateToPrevious
  };
};

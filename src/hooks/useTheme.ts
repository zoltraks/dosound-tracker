import { useState, useEffect, startTransition } from 'react';
import { StorageKeys } from '../utils/storageKeys';

export const useTheme = () => {
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    try {
      const savedTheme = localStorage.getItem(StorageKeys.THEME);
      if (savedTheme === 'dark') return true;
      if (savedTheme === 'light') return false;
    } catch {
      // ignore
    }
    return true; // Default to dark mode
  });

  useEffect(() => {
    try {
      localStorage.setItem(StorageKeys.THEME, isDarkMode ? 'dark' : 'light');
    } catch {
      // ignore
    }
  }, [isDarkMode]);

  const toggleTheme = () => {
    startTransition(() => {
      setIsDarkMode(prev => !prev);
    });
  };

  return {
    isDarkMode,
    setIsDarkMode,
    toggleTheme
  } as const;
};

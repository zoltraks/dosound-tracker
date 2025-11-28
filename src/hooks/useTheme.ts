import { useState, useEffect } from 'react';

export const useTheme = () => {
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    try {
      const savedTheme = localStorage.getItem('dosound-tracker-theme');
      if (savedTheme === 'dark') return true;
      if (savedTheme === 'light') return false;
    } catch {
      // ignore
    }
    return true; // Default to dark mode
  });

  useEffect(() => {
    try {
      localStorage.setItem('dosound-tracker-theme', isDarkMode ? 'dark' : 'light');
    } catch {
      // ignore
    }
  }, [isDarkMode]);

  const toggleTheme = () => {
    setIsDarkMode(prev => !prev);
  };

  return {
    isDarkMode,
    setIsDarkMode,
    toggleTheme
  } as const;
};

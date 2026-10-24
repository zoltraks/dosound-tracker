import { startTransition } from 'react';
import { StorageKeys } from '../../utils/storage/storageKeys.ts';
import { useLocalStorageState } from '../storage/useLocalStorageState.ts';

export const useTheme = () => {
  const [isDarkMode, setIsDarkMode] = useLocalStorageState<boolean>(StorageKeys.THEME, true, {
    read: (stored) => (stored === 'dark' ? true : stored === 'light' ? false : true),
    write: (value) => (value ? 'dark' : 'light'),
  });

  const toggleTheme = () => {
    startTransition(() => {
      setIsDarkMode((prev) => !prev);
    });
  };

  return {
    isDarkMode,
    setIsDarkMode,
    toggleTheme,
  } as const;
};

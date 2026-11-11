import { startTransition } from 'react';
import { StorageKeys } from '../../utils/storage/storageKeys.ts';
import type { ThemeVariant } from '../../types/settings.ts';
import { useLocalStorageState } from '../storage/useLocalStorageState.ts';

export const useTheme = () => {
  const [theme, setTheme] = useLocalStorageState<ThemeVariant>(StorageKeys.THEME, 'dark', {
    read: (stored) =>
      stored === 'light' || stored === 'contrast' || stored === 'dark' ? stored : 'dark',
    write: (value) => value,
  });

  const toggleTheme = () => {
    startTransition(() => {
      // Day/night switcher only - the high-contrast variant is reached through
      // the settings modal, so toggling off it lands on the light theme.
      setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
    });
  };

  return {
    theme,
    setTheme,
    toggleTheme,
  } as const;
};

import { StorageKeys } from '../../utils/storage/storageKeys.ts';
import type { TextScale } from '../../types/settings.ts';
import { useLocalStorageState } from '../storage/useLocalStorageState.ts';

export const useTextScale = () => {
  const [textScale, setTextScale] = useLocalStorageState<TextScale>(StorageKeys.TEXT_SCALE, '100', {
    read: (stored) => (stored === '125' || stored === '150' ? stored : '100'),
    write: (value) => value,
  });

  return {
    textScale,
    setTextScale,
  } as const;
};

// Loads the persisted edit history stacks from localStorage. There is no
// mirror and no fallback - losing persisted history only loses undo depth.

import { StorageKeys } from './storageKeys.ts';
import {
  createEditHistory,
  deserializeEditHistory,
  type EditHistory,
  type EditSnapshot,
} from '../song/editHistory.ts';

export const loadPersistedEditHistory = (): EditHistory<EditSnapshot> => {
  try {
    const raw = localStorage.getItem(StorageKeys.EDIT_HISTORY);
    return raw === null
      ? createEditHistory<EditSnapshot>()
      : deserializeEditHistory<EditSnapshot>(JSON.parse(raw));
  } catch {
    return createEditHistory<EditSnapshot>();
  }
};

// Loads the persisted edit history stacks from localStorage. There is no
// mirror and no fallback - losing persisted history only loses undo depth.

import { StorageKeys } from './storageKeys.ts';
import {
  createEditHistory,
  deserializeEditHistory,
  type EditHistory,
  type EditSnapshot,
} from '../song/editHistory.ts';
import { validateSongData } from '../validation/validation.ts';

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const ENVELOPE_KEYS = ['volume', 'shift', 'pitch', 'noise', 'mode'] as const;

const isValidInstrumentSnapshot = (value: unknown): boolean => {
  if (!isRecord(value)) {
    return false;
  }
  if (typeof value.id !== 'string' || typeof value.name !== 'string') {
    return false;
  }
  for (const key of ENVELOPE_KEYS) {
    const envelope = value[key];
    if (!Array.isArray(envelope)) {
      return false;
    }
    const entries = envelope as unknown[];
    if (entries.some((entry) => typeof entry !== 'number' || !Number.isFinite(entry))) {
      return false;
    }
  }
  if (value.base !== undefined && typeof value.base !== 'string') {
    return false;
  }
  if (value.octave !== undefined && typeof value.octave !== 'number') {
    return false;
  }
  if (value.sustain !== undefined && value.sustain !== null && typeof value.sustain !== 'number') {
    return false;
  }
  if (value.color !== undefined && value.color !== null && typeof value.color !== 'string') {
    return false;
  }
  if (value.midi !== undefined && (typeof value.midi !== 'object' || value.midi === null)) {
    return false;
  }
  return true;
};

// A persisted snapshot restores the live song and instrument pair, so it
// must satisfy the same song contract the import parser ends with plus the
// instrument shape the live model always carries.
const isValidEditSnapshot = (entry: unknown): entry is EditSnapshot => {
  if (!isRecord(entry)) {
    return false;
  }
  try {
    validateSongData(entry.song);
  } catch {
    return false;
  }
  if (!isValidInstrumentSnapshot(entry.instrument)) {
    return false;
  }
  const position = entry.position;
  if (position !== undefined) {
    if (!isRecord(position)) {
      return false;
    }
    if (typeof position.pattern !== 'number' || !Number.isFinite(position.pattern)) {
      return false;
    }
    if (typeof position.line !== 'number' || !Number.isFinite(position.line)) {
      return false;
    }
  }
  return true;
};

export const loadPersistedEditHistory = (): EditHistory<EditSnapshot> => {
  try {
    const raw = localStorage.getItem(StorageKeys.EDIT_HISTORY);
    return raw === null
      ? createEditHistory<EditSnapshot>()
      : deserializeEditHistory<EditSnapshot>(JSON.parse(raw), isValidEditSnapshot);
  } catch {
    return createEditHistory<EditSnapshot>();
  }
};

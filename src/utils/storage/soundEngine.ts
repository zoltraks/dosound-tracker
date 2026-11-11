import { StorageKeys } from './storageKeys.ts';
import {
  SOUND_ENGINE_IDS,
  DEFAULT_SOUND_ENGINE_ID,
  type SoundEngineId,
} from '../../constants/sound.ts';

// Validates a raw value against the engine-id vocabulary, falling back when
// the value is absent or unrecognised.
export function normalizeSoundEngineId(
  raw: unknown,
  fallback: SoundEngineId = DEFAULT_SOUND_ENGINE_ID,
): SoundEngineId {
  return (SOUND_ENGINE_IDS as readonly string[]).includes(raw as string)
    ? (raw as SoundEngineId)
    : fallback;
}

// Reads the persisted sound-engine selection, validating the stored value
// against the id vocabulary and falling back to the default engine when the
// key is missing or holds an unrecognised value.
export function loadSoundEngineId(): SoundEngineId {
  return normalizeSoundEngineId(localStorage.getItem(StorageKeys.SOUND_ENGINE));
}

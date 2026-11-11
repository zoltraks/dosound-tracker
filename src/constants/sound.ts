export const SOUND_ENGINE_IDS = ['internal', 'ayumi'] as const;
export type SoundEngineId = (typeof SOUND_ENGINE_IDS)[number];
export const DEFAULT_SOUND_ENGINE_ID: SoundEngineId = 'internal';
export const SOUND_ENGINE_LABELS: Record<SoundEngineId, string> = {
  internal: 'Internal',
  ayumi: 'Ayumi',
};

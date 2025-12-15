import type { Pattern } from '../synth/SoundDriver';

const DEFAULT_VOLUME = 0x0f;

export function computeEffectiveVolume(pattern: Pattern | null, currentLine: number): number {
  if (!pattern) return DEFAULT_VOLUME;

  const lines = (pattern.step ?? (pattern as unknown as { lines?: Pattern['step'] }).lines ?? []) as Pattern['step'];
  if (lines.length === 0) return DEFAULT_VOLUME;

  const maxIndex = Math.min(currentLine, lines.length - 1);
  let current = DEFAULT_VOLUME;

  for (let i = 0; i <= maxIndex; i += 1) {
    const line = lines[i];
    const vol = line?.volume;
    if (vol !== undefined && vol !== null) {
      const clamped = Math.max(0, Math.min(0x0f, vol | 0));
      current = clamped;
    }
  }

  return current;
}

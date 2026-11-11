// Song-structure lookups shared by playback simulation and the track
// exporters. First-wins map insertion mirrors the Array.find
// resolution the maps replaced: a duplicate pattern id keeps the
// first entry, never the last.
import type { Pattern } from '../../synth/SoundDriver.ts';

// True when a playlist slot references a pattern: a non-empty string
// other than the '--' empty-track marker. The id is not trimmed for
// comparison - ' --' is not the marker and resolves as a miss.
export const isPatternTrackId = (id: unknown): id is string =>
  typeof id === 'string' && id.trim() !== '' && id !== '--';

// Index a song's patterns by id, first occurrence winning on a
// duplicate id and falsy entries skipped.
export const buildPatternLookup = (
  patterns: readonly (Pattern | null | undefined)[],
): Map<string, Pattern> => {
  const map = new Map<string, Pattern>();
  for (const pattern of patterns) {
    if (!pattern) continue;
    if (!map.has(pattern.id)) {
      map.set(pattern.id, pattern);
    }
  }
  return map;
};

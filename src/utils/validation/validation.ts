import type { Song } from '../../synth/SoundDriver.ts';

export class ValidationError extends Error {
  field?: string;

  constructor(message: string, field?: string) {
    super(message);
    this.name = 'ValidationError';
    this.field = field;
  }
}

const isSongData = (data: unknown): data is Song => {
  if (typeof data !== 'object' || data === null) return false;
  const song = data as Song;

  return (
    typeof song.title === 'string' &&
    Array.isArray(song.pattern) &&
    Array.isArray(song.instrument) &&
    Array.isArray(song.line)
  );
};

export const validateSongData = (data: unknown): Song => {
  if (!data || typeof data !== 'object') {
    throw new ValidationError('Song data must be an object');
  }

  if (!isSongData(data)) {
    throw new ValidationError('Invalid song data structure');
  }

  const song = data as Song;

  if (!song.title || typeof song.title !== 'string') {
    throw new ValidationError('Song must have a title', 'title');
  }

  if (!Array.isArray(song.pattern) || song.pattern.length === 0) {
    throw new ValidationError('Song must have at least one pattern', 'pattern');
  }

  song.pattern.forEach((pattern, index) => {
    if (!pattern.id || !pattern.name) {
      throw new ValidationError(`Pattern ${index} must have id and name`, `pattern[${index}]`);
    }
  });

  // Channel shape: A-C are required strings on every playlist row; the
  // optional second-chip keys D-F must be strings when present.
  song.line.forEach((entry, index) => {
    if (!entry || typeof entry !== 'object') {
      throw new ValidationError(`Playlist entry ${index} must be an object`, `line[${index}]`);
    }
    for (const key of ['A', 'B', 'C'] as const) {
      if (typeof entry[key] !== 'string') {
        throw new ValidationError(
          `Playlist entry ${index} must carry a string "${key}"`,
          `line[${index}].${key}`,
        );
      }
    }
    for (const key of ['D', 'E', 'F'] as const) {
      const value = entry[key];
      if (value !== undefined && typeof value !== 'string') {
        throw new ValidationError(
          `Playlist entry ${index} "${key}" must be a string when present`,
          `line[${index}].${key}`,
        );
      }
    }
  });

  if (song.chipCount !== undefined && song.chipCount !== 1 && song.chipCount !== 2) {
    throw new ValidationError('Song chipCount must be 1 or 2', 'chipCount');
  }

  return song;
};

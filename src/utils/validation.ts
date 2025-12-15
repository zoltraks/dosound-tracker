import type { Song } from '../synth/SoundDriver';

export class ValidationError extends Error {
  field?: string;

  constructor(message: string, field?: string) {
    super(message);
    this.name = 'ValidationError';
    this.field = field;
  }
}

export const isSongData = (data: unknown): data is Song => {
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

  return song;
};

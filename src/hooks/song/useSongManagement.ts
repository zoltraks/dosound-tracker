import type { Instrument, Song, Pattern, Step, Note } from '../../synth/SoundDriver.ts';
import { PATTERN_LENGTH, ENVELOPE_LENGTH } from '../../constants/music.ts';
import defaultSongYaml from '../../assets/song/song.yaml?raw';
import {
  DEFAULT_BASE_KEY,
  DEFAULT_SONG_TITLE,
  DEFAULT_SONG_AUTHOR,
  parseSongFromYaml,
} from '../../utils/song/songParser.ts';
import { DEFAULT_SONG_CHIP, DEFAULT_SONG_FRAME, DEFAULT_SONG_CLOCK } from '../../constants/song.ts';
import { normalizeSongSpeed } from '../../utils/song/songSpeed.ts';
import { normalizeSongStereo } from '../../utils/song/songStereo.ts';
import { logger } from '../../utils/log/logger.ts';
import { StorageKeys } from '../../utils/storage/storageKeys.ts';
import { removeMirroredSnapshot } from '../../utils/storage/persistenceMirror.ts';
export type StoredInstrumentForMigration = {
  volume?: unknown;
  volumeEnvelope?: unknown;
};

export type StoredSongForMigration = {
  instruments?: StoredInstrumentForMigration[] | undefined;
  speed?: unknown;
  [key: string]: unknown;
};

export const SONG_STORAGE_KEY = StorageKeys.SONG;

function normalizeStoredSongToCurrentSchema(rawSong: unknown): Song {
  const song = (rawSong || {}) as Record<string, unknown>;

  const lengthRaw = song.length;
  const legacyLengthRaw = song.patternLength;
  const length =
    typeof lengthRaw === 'number' && Number.isFinite(lengthRaw)
      ? Math.floor(lengthRaw)
      : typeof legacyLengthRaw === 'number' && Number.isFinite(legacyLengthRaw)
        ? Math.floor(legacyLengthRaw)
        : PATTERN_LENGTH;

  const rawPatterns = (song.pattern ?? song.patterns) as unknown;
  const patternSource = Array.isArray(rawPatterns) ? rawPatterns : [];
  const pattern = patternSource.map((raw) => {
    const p = (raw || {}) as Record<string, unknown>;
    const rawSteps = (p.step ?? p.lines) as unknown;
    const stepSource = Array.isArray(rawSteps) ? rawSteps : [];
    const step = stepSource.map((rawStep) => {
      const s = (rawStep || {}) as Record<string, unknown>;
      const legacyNote = (s.note ??
        s.A ??
        s.trackA ??
        s.B ??
        s.trackB ??
        s.C ??
        s.trackC ??
        null) as Note | null;
      return {
        note: legacyNote,
        volume: (s.volume as number | null | undefined) ?? undefined,
      } as Step;
    });

    return {
      ...(p as unknown as Pattern),
      step,
    };
  });

  const rawLine = (song.line ?? song.playlist) as unknown;
  const lineSource = Array.isArray(rawLine) ? rawLine : [];
  const line = lineSource.map((rawEntry) => {
    const entry = (rawEntry || {}) as Record<string, unknown>;
    return {
      A: String((entry.A ?? entry.trackA ?? '--') as string),
      B: String((entry.B ?? entry.trackB ?? '--') as string),
      C: String((entry.C ?? entry.trackC ?? '--') as string),
    };
  });

  const rawInstruments = (song.instrument ?? song.instruments) as unknown;
  const instrumentSource = Array.isArray(rawInstruments) ? rawInstruments : [];
  const instrument = instrumentSource.map((rawInst) => {
    const inst = (rawInst || {}) as Record<string, unknown>;
    const noise = (inst.noise ?? inst.noiseEnvelope ?? []) as number[];

    const rawShift = inst.shift;
    const rawArpeggio = inst.arpeggio;

    const shiftValues = Array.isArray(rawShift)
      ? (rawShift as unknown[]).map((v) => Number(v)).filter((v) => Number.isFinite(v))
      : Array.isArray(rawArpeggio)
        ? (rawArpeggio as unknown[]).map((v) => Number(v)).filter((v) => Number.isFinite(v))
        : [];

    const shift =
      shiftValues.length > 0
        ? Array.from({ length: ENVELOPE_LENGTH }, (_v, i) => shiftValues[i % shiftValues.length])
        : Array(ENVELOPE_LENGTH).fill(0);

    const rest = { ...inst } as Record<string, unknown>;
    delete rest.arpeggio;

    return {
      ...(rest as unknown as Instrument),
      noise,
      shift,
    };
  });

  const rawChip = typeof song.chip === 'string' ? song.chip.trim().toUpperCase() : '';
  const normalizedChip = rawChip || DEFAULT_SONG_CHIP;
  const frameCandidate = Number(song.frame);
  const normalizedFrame = Number.isFinite(frameCandidate)
    ? Math.floor(frameCandidate)
    : DEFAULT_SONG_FRAME;
  const clockCandidate = Number(song.clock);
  const normalizedClock = Number.isFinite(clockCandidate)
    ? Math.floor(clockCandidate)
    : DEFAULT_SONG_CLOCK;

  const stereo = normalizeSongStereo(song.stereo);

  return {
    ...(song as unknown as Song),
    length,
    pattern,
    line,
    instrument,
    chip: normalizedChip,
    frame: normalizedFrame,
    clock: normalizedClock,
    ...(stereo ? { stereo } : { stereo: undefined }),
  };
}

export const createDefaultSong = (): Song => {
  const defaultPatternLength = PATTERN_LENGTH;

  const defaultPatternA: Pattern = {
    id: '01',
    name: 'Pattern 01',
    step: Array.from({ length: defaultPatternLength }, (_, i) => {
      const line: Step = { note: null };

      if (i % 8 === 0) line.note = { note: 'C', octave: 4, instrument: '00' };
      if (i % 8 === 2) line.note = { note: 'E', octave: 4, instrument: '00' };
      if (i % 8 === 4) line.note = { note: 'G', octave: 4, instrument: '00' };
      if (i % 8 === 6) line.note = { note: 'E', octave: 4, instrument: '00' };

      return line;
    }),
  };

  const defaultPatternB: Pattern = {
    id: '02',
    name: 'Pattern 02',
    step: Array.from({ length: defaultPatternLength }, (_, i) => {
      const line: Step = { note: null };

      if (i % 4 === 0) line.note = { note: 'C', octave: 3, instrument: '00' };

      return line;
    }),
  };

  const defaultPatternC: Pattern = {
    id: '03',
    name: 'Pattern 03',
    step: Array.from({ length: defaultPatternLength }, (_, i) => {
      const line: Step = { note: null };

      if (i % 8 === 1) line.note = { note: 'G', octave: 5, instrument: '00' };
      if (i % 8 === 3) line.note = { note: 'E', octave: 5, instrument: '00' };
      if (i % 8 === 5) line.note = { note: 'C', octave: 5, instrument: '00' };
      if (i % 8 === 7) line.note = { note: 'E', octave: 5, instrument: '00' };

      return line;
    }),
  };

  return {
    title: DEFAULT_SONG_TITLE,
    author: DEFAULT_SONG_AUTHOR,
    year: new Date().getFullYear(),
    speed: 6,
    length: defaultPatternLength,
    loop: null,
    pattern: [defaultPatternA, defaultPatternB, defaultPatternC],
    line: [{ A: '01', B: '02', C: '03' }],
    instrument: [
      {
        id: '00',
        name: 'Default Instrument',
        volume: Array(32).fill(0x0f),
        shift: [
          0,
          4,
          8,
          12,
          16,
          20,
          24,
          20,
          16,
          12,
          8,
          4,
          0,
          -4,
          -8,
          -12,
          -16,
          -20,
          -24,
          -20,
          -16,
          -12,
          -8,
          -4,
          ...Array(8).fill(0),
        ],
        pitch: Array(32).fill(0),
        noise: Array(32).fill(0),
        mode: Array(32).fill(0),
        base: DEFAULT_BASE_KEY,
        sustain: null,
      },
      {
        id: '01',
        name: 'Bass Instrument',
        volume: [15, 15, 12, 8, 4, 0, ...Array(26).fill(0)],
        shift: [12, 8, 4, 0, -4, -8, -12, -8, -4, 0, 4, 8, 12, ...Array(19).fill(0)],
        pitch: Array(32).fill(0),
        noise: Array(32).fill(0),
        mode: Array(32).fill(0),
        base: DEFAULT_BASE_KEY,
        sustain: null,
      },
      {
        id: '02',
        name: 'Lead Instrument',
        volume: [8, 12, 15, 12, 8, 4, ...Array(26).fill(0)],
        shift: [24, 20, 16, 12, 8, 4, 0, -4, -8, -12, -16, -20, -24, ...Array(19).fill(0)],
        pitch: Array(32).fill(0),
        noise: Array(32).fill(0),
        mode: Array(32).fill(0),
        base: DEFAULT_BASE_KEY,
        sustain: null,
      },
    ],
    chip: DEFAULT_SONG_CHIP,
    frame: DEFAULT_SONG_FRAME,
    clock: DEFAULT_SONG_CLOCK,
  };
};

export function normalizeRestoredSong(rawSong: unknown): Song {
  const parsedSong = (rawSong || {}) as StoredSongForMigration;
  const evenSpeed = normalizeSongSpeed(parsedSong.speed);
  const normalized = normalizeStoredSongToCurrentSchema(parsedSong);
  return {
    ...normalized,
    speed: evenSpeed,
  };
}

export function loadInitialSong(): Song {
  try {
    const savedSong = localStorage.getItem(SONG_STORAGE_KEY);
    if (savedSong) {
      const parsedSong = JSON.parse(savedSong) as StoredSongForMigration;
      const instruments = parsedSong.instruments;
      const hasLegacyInstruments =
        Array.isArray(instruments) &&
        instruments.some(
          (inst) => inst && !Array.isArray(inst.volume) && Array.isArray(inst.volumeEnvelope),
        );

      if (!hasLegacyInstruments) {
        return normalizeRestoredSong(parsedSong);
      }

      localStorage.removeItem(SONG_STORAGE_KEY);
      removeMirroredSnapshot('song');
    }
  } catch (error) {
    logger.warn('Failed to load song from localStorage', error);
  }

  try {
    return parseSongFromYaml(defaultSongYaml);
  } catch (error) {
    logger.error('Failed to parse bundled default song YAML', error);
    return createDefaultSong();
  }
}

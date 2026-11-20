import type { Instrument, Song, Pattern, Step, Note } from '../../synth/SoundDriver.ts';
import {
  PATTERN_LENGTH,
  MAX_PATTERN_LENGTH,
  ENVELOPE_LENGTH,
  DEFAULT_OCTAVE,
  MIN_OCTAVE,
  MAX_OCTAVE,
} from '../../constants/music.ts';
import defaultSongYaml from '../../assets/song/song.yaml?raw';
import {
  DEFAULT_BASE_KEY,
  DEFAULT_SONG_TITLE,
  DEFAULT_SONG_AUTHOR,
  formatBaseKey,
  parseBaseKey,
  normalizeInstrumentColor,
  parseSongFromYaml,
} from '../../utils/song/songParser.ts';
import {
  DEFAULT_SONG_CHIP,
  DEFAULT_SONG_FRAME,
  DEFAULT_SONG_CLOCK,
  SECOND_CHIP_CHANNEL_IDS,
} from '../../constants/song.ts';
import { normalizeSongSpeed } from '../../utils/song/songSpeed.ts';
import { normalizeSongStereo } from '../../utils/song/songStereo.ts';
import { logger } from '../../utils/log/logger.ts';
import { StorageKeys } from '../../utils/storage/storageKeys.ts';
import { removeMirroredSnapshot } from '../../utils/storage/persistenceMirror.ts';
import { validateSongData } from '../../utils/validation/validation.ts';
import { coerceYamlNumber } from '../../utils/yaml/yamlUtils.ts';
import { normalizePatternId } from '../../utils/pattern/patternUtils.ts';
import {
  formatInstrumentSlotId,
  normalizeInstrumentId,
} from '../../utils/instrument/instrumentSelection.ts';
import { expandEnvelope, expandLoopingEnvelope } from '../../utils/envelope/envelopeUtils.ts';
import { clampVolumeNibble } from '../../utils/panel/volumeUtils.ts';
import { clampMidiChannel, clampMidiProgram } from '../../utils/midi/midiUtils.ts';
import { Formatter } from '../../utils/format/formatters.ts';
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

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

// Field-level members repair to the same defaults the import parser applies;
// only structural failures (non-object entries, empty collections) reject the
// whole snapshot further down in normalizeRestoredSong.
const restoreNote = (value: unknown): Note | null => {
  if (!isRecord(value)) {
    return null;
  }
  const noteName = value.note;
  const octave = coerceYamlNumber(value.octave);
  if (typeof noteName !== 'string' || !noteName.trim() || octave === null) {
    return null;
  }
  const instrument = value.instrument;
  return {
    note: noteName.trim().toUpperCase(),
    octave: Math.floor(octave),
    instrument:
      typeof instrument === 'string' && instrument.trim()
        ? normalizeInstrumentId(instrument)
        : '00',
  };
};

const restoreStep = (rawStep: unknown): Step => {
  const step = isRecord(rawStep) ? rawStep : {};
  const legacyNote =
    step.note ?? step.A ?? step.trackA ?? step.B ?? step.trackB ?? step.C ?? step.trackC ?? null;
  const volume = step.volume;
  return {
    note: restoreNote(legacyNote),
    ...(typeof volume === 'number' && Number.isFinite(volume)
      ? { volume: clampVolumeNibble(volume) }
      : {}),
  };
};

const restorePattern = (rawPattern: unknown, index: number, length: number): Pattern => {
  if (!isRecord(rawPattern)) {
    throw new Error(`Invalid pattern at index ${index}`);
  }
  const pattern = rawPattern;
  const rawId = pattern.id ?? pattern.number;
  const normalizedId = normalizePatternId(rawId as string | number | null | undefined);
  const id = normalizedId || Formatter.hex(index, { padWidth: 2, uppercase: true });
  const name =
    typeof pattern.name === 'string' && pattern.name.trim() ? pattern.name : `Pattern ${id}`;
  const rawSteps = pattern.step ?? pattern.steps ?? pattern.lines;
  const stepSource = Array.isArray(rawSteps) ? rawSteps : [];
  const step = stepSource.map(restoreStep);
  // Pad short step arrays to the song length; longer arrays survive a
  // shrink untouched, matching the live mutation contract.
  while (step.length < length) {
    step.push({ note: null });
  }
  return { id, name, step };
};

const restoreLineEntry = (rawEntry: unknown, index: number): Song['line'][number] => {
  if (!isRecord(rawEntry)) {
    throw new Error(`Invalid line entry at index ${index}`);
  }
  const entry = rawEntry;
  const channel = (primary: 'A' | 'B' | 'C', legacy: 'trackA' | 'trackB' | 'trackC'): string => {
    const value = entry[primary] ?? entry[legacy];
    return typeof value === 'string' ? value : '--';
  };
  const row: Song['line'][number] = {
    A: channel('A', 'trackA'),
    B: channel('B', 'trackB'),
    C: channel('C', 'trackC'),
  };
  // Second-chip keys pass through only when the source names a pattern,
  // keeping single-chip rows free of empty D/E/F members.
  for (const key of SECOND_CHIP_CHANNEL_IDS) {
    const value = entry[key];
    if (typeof value === 'string' && value !== '--') {
      row[key] = value;
    }
  }
  return row;
};

const restoreInstrument = (rawInstrument: unknown, index: number): Instrument => {
  if (!isRecord(rawInstrument)) {
    throw new Error(`Invalid instrument at index ${index}`);
  }
  const inst = rawInstrument;
  const rawId = inst.id ?? inst.number;
  const normalizedId = normalizeInstrumentId(rawId as string | number | null | undefined);
  const id = normalizedId || formatInstrumentSlotId(index);
  const name = typeof inst.name === 'string' && inst.name.trim() ? inst.name : '';
  const baseParsed = parseBaseKey(inst.base);
  const base = baseParsed ? formatBaseKey(baseParsed.note, baseParsed.octave) : DEFAULT_BASE_KEY;
  const coercedOctave = coerceYamlNumber(inst.octave);
  const octave = Math.max(
    MIN_OCTAVE,
    Math.min(MAX_OCTAVE, Math.floor(coercedOctave ?? DEFAULT_OCTAVE)),
  );
  const coercedSustain = coerceYamlNumber(inst.sustain);
  const sustainFloor = coercedSustain !== null ? Math.floor(coercedSustain) : null;
  const sustain = sustainFloor !== null && sustainFloor >= 0 ? sustainFloor : null;
  const color = normalizeInstrumentColor(inst.color);
  let midi: Instrument['midi'];
  if (isRecord(inst.midi)) {
    const midiNode = inst.midi;
    const coercedChannel = coerceYamlNumber(midiNode.channel);
    const coercedProgram = coerceYamlNumber(midiNode.program);
    const channel = coercedChannel !== null ? clampMidiChannel(coercedChannel) : null;
    const program = coercedProgram !== null ? clampMidiProgram(coercedProgram) : null;
    if (channel !== null || program !== null) {
      midi = { channel, program };
    }
  }
  const noiseSource = Array.isArray(inst.noise) ? inst.noise : inst.noiseEnvelope;
  return {
    id,
    name,
    volume: expandEnvelope(inst.volume, ENVELOPE_LENGTH, 0x0f),
    shift: Array.isArray(inst.shift)
      ? expandEnvelope(inst.shift, ENVELOPE_LENGTH, 0)
      : expandLoopingEnvelope(inst.arpeggio, ENVELOPE_LENGTH, 0),
    pitch: expandEnvelope(inst.pitch, ENVELOPE_LENGTH, 0),
    noise: expandEnvelope(noiseSource, ENVELOPE_LENGTH, 0),
    mode: expandEnvelope(inst.mode, ENVELOPE_LENGTH, 0),
    base,
    octave,
    sustain,
    ...(color ? { color } : {}),
    ...(midi ? { midi } : {}),
  };
};

function normalizeStoredSongToCurrentSchema(rawSong: unknown): Song {
  const song = isRecord(rawSong) ? rawSong : {};

  const lengthRaw = song.length;
  const legacyLengthRaw = song.patternLength;
  const lengthCandidate =
    typeof lengthRaw === 'number' && Number.isFinite(lengthRaw)
      ? lengthRaw
      : typeof legacyLengthRaw === 'number' && Number.isFinite(legacyLengthRaw)
        ? legacyLengthRaw
        : PATTERN_LENGTH;
  const length = Math.max(4, Math.min(MAX_PATTERN_LENGTH, Math.floor(lengthCandidate)));

  const title =
    typeof song.title === 'string' && song.title.trim() ? song.title.trim() : DEFAULT_SONG_TITLE;
  const author =
    typeof song.author === 'string' && song.author.trim()
      ? song.author.trim()
      : DEFAULT_SONG_AUTHOR;
  const year = coerceYamlNumber(song.year) ?? new Date().getFullYear();
  const speed = normalizeSongSpeed(song.speed);

  const coercedLoop = coerceYamlNumber(song.loop);
  let loop: number | null = coercedLoop !== null ? Math.max(0, Math.floor(coercedLoop)) : null;

  const rawLine = song.line ?? song.playlist;
  const lineSource = Array.isArray(rawLine) ? rawLine : [];
  const line = lineSource.map(restoreLineEntry);
  if (loop !== null) {
    loop = line.length === 0 ? null : Math.max(0, Math.min(line.length - 1, loop));
  }

  const rawPatterns = song.pattern ?? song.patterns;
  const patternSource = Array.isArray(rawPatterns) ? rawPatterns : [];
  const pattern = patternSource.map((raw, index) => restorePattern(raw, index, length));

  const rawInstruments = song.instrument ?? song.instruments;
  const instrumentSource = Array.isArray(rawInstruments) ? rawInstruments : [];
  const instrument = instrumentSource.map(restoreInstrument);

  const chipRaw =
    typeof song.chip === 'string'
      ? song.chip.trim()
      : typeof song.chip === 'number' && Number.isFinite(song.chip)
        ? String(song.chip)
        : '';
  const normalizedChip = chipRaw ? chipRaw.toUpperCase() : DEFAULT_SONG_CHIP;
  const frameCandidate = Number(song.frame);
  const normalizedFrame = Number.isFinite(frameCandidate)
    ? Math.floor(frameCandidate)
    : DEFAULT_SONG_FRAME;
  const clockCandidate = Number(song.clock);
  const normalizedClock = Number.isFinite(clockCandidate)
    ? Math.floor(clockCandidate)
    : DEFAULT_SONG_CLOCK;

  const stereo = normalizeSongStereo(song.stereo);

  const chipCountRaw = coerceYamlNumber(song.chipCount);
  const derivedChipCount = line.some((entry) =>
    SECOND_CHIP_CHANNEL_IDS.some((key) => entry[key] !== undefined),
  )
    ? 2
    : 1;
  const chipCount: 1 | 2 =
    chipCountRaw === 1 || chipCountRaw === 2 ? chipCountRaw : derivedChipCount;

  return {
    title,
    author,
    year,
    speed,
    length,
    loop,
    pattern,
    line,
    instrument,
    chip: normalizedChip,
    ...(chipCountRaw === 1 || chipCountRaw === 2 || chipCount === 2 ? { chipCount } : {}),
    frame: normalizedFrame,
    clock: normalizedClock,
    ...(stereo ? { stereo } : {}),
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
  const normalized = normalizeStoredSongToCurrentSchema(rawSong);
  // The same presence gates and contract check the import parser applies -
  // a snapshot that fails them is corrupt and takes the caller's fallback.
  if (normalized.line.length === 0) {
    throw new Error('Song line is missing or empty');
  }
  if (normalized.pattern.length === 0) {
    throw new Error('Song patterns are missing');
  }
  if (normalized.instrument.length === 0) {
    throw new Error('Song instruments are missing');
  }
  return validateSongData(normalized);
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

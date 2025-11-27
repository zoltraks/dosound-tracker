import yaml from 'js-yaml';
import type { Instrument, Song, Pattern, PatternLine } from '../synth/SoundDriver';
import { MAX_INSTRUMENTS, ENVELOPE_LENGTH, PATTERN_LENGTH, DEFAULT_OCTAVE, MIN_OCTAVE, MAX_OCTAVE } from '../constants/music';
import { validateSongData } from './validation';

type SongYamlRoot = {
  song?: unknown;
};

interface SongYamlNode {
  title?: unknown;
  author?: unknown;
  length?: unknown;
  speed?: unknown;
  year?: unknown;
  loop?: unknown;
  playlist?: unknown;
  pattern?: unknown;
  patterns?: unknown;
  instrument?: unknown;
  instruments?: unknown;
}

interface InstrumentNodeYaml {
  number?: unknown;
  name?: unknown;
  base?: unknown;
  octave?: unknown;
  sustain?: unknown;
  volume?: unknown;
  arpeggio?: unknown;
  pitch?: unknown;
  noise?: unknown;
  mode?: unknown;
}

interface PatternNodeYaml {
  number?: unknown;
  name?: unknown;
  steps?: unknown;
  lines?: unknown;
}

interface PatternStepNodeYaml {
  space?: unknown;
  off?: unknown;
  volume?: unknown;
  note?: unknown;
  instrument?: unknown;
  [key: string]: unknown;
}

export const DEFAULT_BASE_KEY = 'C-4';
export const DEFAULT_SONG_TITLE = 'New Song';
export const DEFAULT_SONG_AUTHOR = 'Author Name';

export const formatBaseKey = (note: string, octave: number): string => {
  const upperNote = note.toUpperCase();
  return upperNote.endsWith('#')
    ? `${upperNote}${octave}`
    : `${upperNote}-${octave}`;
};

export const parseBaseKey = (value: unknown): { note: string; octave: number } | null => {
  if (typeof value !== 'string') return null;
  const raw = value.trim().toUpperCase();
  if (!raw) return null;

  let notePart = raw.charAt(0);
  let rest = raw.slice(1);

  if (rest.startsWith('#')) {
    notePart += '#';
    rest = rest.slice(1);
  }

  if (rest.startsWith('-')) {
    rest = rest.slice(1);
  }

  const octave = parseInt(rest, 10);
  if (!Number.isFinite(octave)) return null;

  return { note: notePart, octave };
};

const parseVolumeNibble = (value: unknown): number | null => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    const n = Math.max(0, Math.min(0x0f, Math.floor(value)));
    return n;
  }

  if (typeof value === 'string') {
    const raw = value.trim();
    if (!raw) return null;

    let text = raw.toUpperCase();
    if (text.startsWith('$')) {
      text = text.slice(1);
    }

    const n = parseInt(text, 16);
    if (Number.isFinite(n)) {
      const clamped = Math.max(0, Math.min(0x0f, n));
      return clamped;
    }
  }

  return null;
};

export const parseSongFromYaml = (content: string): Song => {
  const parsed = yaml.load(content) as unknown;

  if (!parsed || typeof parsed !== 'object' || !('song' in parsed)) {
    throw new Error('Root "song" key not found.');
  }

  const root = parsed as SongYamlRoot;
  const node = root.song;
  if (!node || typeof node !== 'object') {
    throw new Error('Invalid song file format');
  }

  const songNode = node as SongYamlNode;

  const rawLength = Number(songNode.length);
  const patternLengthRaw = Number.isFinite(rawLength) ? rawLength : PATTERN_LENGTH;
  const clampedLength = Math.max(4, Math.min(256, Math.floor(patternLengthRaw)));

  const title =
    typeof songNode.title === 'string' && songNode.title.trim() ? songNode.title : DEFAULT_SONG_TITLE;
  const author =
    typeof songNode.author === 'string' && songNode.author.trim() ? songNode.author : DEFAULT_SONG_AUTHOR;

  const speedRaw = Number(songNode.speed);
  const baseSpeed = Number.isFinite(speedRaw) && speedRaw > 0 ? Math.floor(speedRaw) : 6;
  const clampedSpeed = Math.max(2, baseSpeed);
  const speed = clampedSpeed & ~1; // enforce even speed (2,4,6,...)

  const yearRaw = Number(songNode.year);
  const year = Number.isFinite(yearRaw) ? yearRaw : new Date().getFullYear();

  // Optional loop position (0-based playlist index)
  let loop: number | null = null;
  const rawLoop = songNode.loop;
  if (typeof rawLoop === 'number' && Number.isFinite(rawLoop)) {
    loop = Math.max(0, Math.floor(rawLoop));
  } else if (typeof rawLoop === 'string') {
    const trimmed = rawLoop.trim();
    if (trimmed) {
      const parsed = Number(trimmed);
      if (Number.isFinite(parsed)) {
        loop = Math.max(0, Math.floor(parsed));
      }
    }
  }

  const playlistNodes = Array.isArray(songNode.playlist) ? songNode.playlist : [];
  if (playlistNodes.length === 0) {
    throw new Error('Song playlist is missing or empty');
  }

  const playlist = playlistNodes.map((entry, index: number) => {
    if (!entry || typeof entry !== 'object') {
      throw new Error(`Invalid playlist entry at index ${index}`);
    }

    const e = entry as { A?: unknown; B?: unknown; C?: unknown };
    const trackA = typeof e.A === 'string' ? e.A : '--';
    const trackB = typeof e.B === 'string' ? e.B : '--';
    const trackC = typeof e.C === 'string' ? e.C : '--';

    return { trackA, trackB, trackC };
  });

  const rawPatternNodes = Array.isArray(songNode.pattern) ? songNode.pattern : songNode.patterns;
  const patternNodes = Array.isArray(rawPatternNodes) ? rawPatternNodes : [];
  if (patternNodes.length === 0) {
    throw new Error('Song patterns are missing');
  }

  const patterns: Pattern[] = patternNodes.map((pNode, patternIndex: number) => {
    if (!pNode || typeof pNode !== 'object') {
      throw new Error(`Invalid pattern at index ${patternIndex}`);
    }

    const patternNode = pNode as PatternNodeYaml;

    const rawNumber = patternNode.number;
    const number =
      typeof rawNumber === 'string' && rawNumber.trim()
        ? rawNumber.trim().toUpperCase()
        : patternIndex.toString(16).padStart(2, '0').toUpperCase();

    const name =
      typeof patternNode.name === 'string' && patternNode.name.trim()
        ? patternNode.name
        : `Pattern ${number}`;

    const rawLineNodes = Array.isArray(patternNode.steps)
      ? patternNode.steps
      : Array.isArray(patternNode.lines)
        ? patternNode.lines
        : [];
    const expandedLineNodes: unknown[] = [];

    // Expand compressed space/off runs (space: N / off: N) into individual logical lines.
    // Support both pure runs and volume-only runs, e.g. `space: 3` or
    // `space: 3, volume: 14`.
    for (const nodeLine of rawLineNodes) {
      if (nodeLine && typeof nodeLine === 'object') {
        const ln = nodeLine as PatternStepNodeYaml;

        const keys = Object.keys(ln);
        const hasVolume = Object.prototype.hasOwnProperty.call(ln, 'volume');
        const onlySpaceOrOff = keys.every(k => k === 'space' || k === 'off');
        const onlySpaceOffVolume = keys.every(k => k === 'space' || k === 'off' || k === 'volume');

        const spaceVal = ln.space;
        const offVal = ln.off;

        const isNumericSpace = typeof spaceVal === 'number' && Number.isFinite(spaceVal) && spaceVal > 0;
        const isNumericOff = typeof offVal === 'number' && Number.isFinite(offVal) && offVal > 0;

        // Pure runs without volume
        if (!hasVolume && onlySpaceOrOff && (isNumericSpace || isNumericOff)) {
          const count = (isNumericSpace ? spaceVal : offVal) as number;
          const isOff = isNumericOff && !isNumericSpace;
          for (let i = 0; i < count; i++) {
            expandedLineNodes.push(isOff ? { off: true } : { space: true });
          }
          continue;
        }

        // Volume-only runs: replicate the volume onto each expanded step.
        if (hasVolume && onlySpaceOffVolume && (isNumericSpace || isNumericOff)) {
          const count = (isNumericSpace ? spaceVal : offVal) as number;
          const isOff = isNumericOff && !isNumericSpace;
          const vol = ln.volume;
          for (let i = 0; i < count; i++) {
            expandedLineNodes.push(
              isOff ? { off: true, volume: vol } : { space: true, volume: vol }
            );
          }
          continue;
        }

        expandedLineNodes.push(nodeLine);
      } else {
        expandedLineNodes.push(nodeLine);
      }
    }

    const lines: PatternLine[] = [];

    for (let i = 0; i < clampedLength; i++) {
      const rawLineNode = expandedLineNodes[i];
      const line: PatternLine = { trackA: null, trackB: null, trackC: null };

      if (rawLineNode && typeof rawLineNode === 'object') {
        const ln = rawLineNode as PatternStepNodeYaml;

        if (ln.off === true) {
          // Empty or note-off line: currently treated as space
          line.trackA = {
            note: '===',
            octave: 0,
            instrument: '00',
          };
        } else if (ln.space === true) {
          // Empty or note-off line: currently treated as space
        } else if (typeof ln.note === 'string') {
          const parsedKey = parseBaseKey(ln.note);
          if (!parsedKey) {
            throw new Error(
              `Invalid note value "${ln.note}" in pattern ${number} at line ${i}`
            );
          }

          const instId =
            typeof ln.instrument === 'string' && ln.instrument.trim()
              ? ln.instrument.trim().toUpperCase()
              : '00';

          line.trackA = {
            note: parsedKey.note,
            octave: parsedKey.octave,
            instrument: instId,
          };
        }

        const vol = parseVolumeNibble(ln.volume);
        if (vol !== null) {
          line.volume = vol;
        }
      }

      lines.push(line);
    }

    return {
      id: number,
      name,
      lines,
    };
  });

  const rawInstrumentNodes = Array.isArray(songNode.instrument) ? songNode.instrument : songNode.instruments;
  const instrumentNodes = Array.isArray(rawInstrumentNodes) ? rawInstrumentNodes : [];
  if (instrumentNodes.length === 0) {
    throw new Error('Song instruments are missing');
  }

  const instruments: Instrument[] = [];

  const expandEnvelope = (values: unknown, length: number, defaultValue: number): number[] => {
    const rawArray = Array.isArray(values) ? (values as unknown[]) : [];
    const numericValues = rawArray
      .map((v) => Number(v))
      .filter((v) => Number.isFinite(v));

    if (numericValues.length === 0) {
      return Array(length).fill(defaultValue);
    }

    const result: number[] = [];
    for (let i = 0; i < length; i++) {
      if (i < numericValues.length) {
        result[i] = numericValues[i];
      } else {
        result[i] = numericValues[numericValues.length - 1];
      }
    }
    return result;
  };

  instrumentNodes.forEach((instNode, index: number) => {
    if (!instNode || typeof instNode !== 'object') {
      throw new Error(`Invalid instrument at index ${index}`);
    }

    const nodeObj = instNode as InstrumentNodeYaml;

    const rawNumber = nodeObj.number;
    const number =
      typeof rawNumber === 'string' && rawNumber.trim()
        ? rawNumber.trim().toUpperCase()
        : index.toString(16).padStart(2, '0').toUpperCase();

    const slotIndex = parseInt(number, 16);
    if (!Number.isFinite(slotIndex) || slotIndex < 0 || slotIndex >= MAX_INSTRUMENTS) {
      throw new Error(`Invalid instrument number "${rawNumber}"`);
    }

    const rawName = typeof nodeObj.name === 'string' ? nodeObj.name : '';
    const name = rawName.trim() ? rawName : '';

    const baseParsed = parseBaseKey(nodeObj.base);
    const base = baseParsed
      ? formatBaseKey(baseParsed.note, baseParsed.octave)
      : DEFAULT_BASE_KEY;

    const rawOctave = nodeObj.octave;
    let octave = DEFAULT_OCTAVE;
    if (typeof rawOctave === 'number' && Number.isFinite(rawOctave)) {
      octave = rawOctave;
    } else if (typeof rawOctave === 'string') {
      const trimmed = rawOctave.trim();
      if (trimmed) {
        const parsed = Number(trimmed);
        if (Number.isFinite(parsed)) {
          octave = parsed;
        }
      }
    }
    octave = Math.max(MIN_OCTAVE, Math.min(MAX_OCTAVE, Math.floor(octave)));

    const volumeEnvelope = expandEnvelope(nodeObj.volume, ENVELOPE_LENGTH, 0x0f);
    const arpeggioEnvelope = expandEnvelope(nodeObj.arpeggio, ENVELOPE_LENGTH, 0);
    const pitchEnvelope = expandEnvelope(nodeObj.pitch, ENVELOPE_LENGTH, 0);
    const noiseEnvelope = expandEnvelope(nodeObj.noise, ENVELOPE_LENGTH, 0);
    const modeEnvelope = expandEnvelope(nodeObj.mode, ENVELOPE_LENGTH, 0);

    // Optional sustain position for this instrument (0-based envelope index).
    // Accept either numeric or string values in YAML and clamp to a
    // non-negative integer. If out of range or invalid, treat as unset.
    let sustain: number | null = null;
    const rawSustain = nodeObj.sustain;
    if (typeof rawSustain === 'number' && Number.isFinite(rawSustain)) {
      const s = Math.floor(rawSustain);
      if (s >= 0) {
        sustain = s;
      }
    } else if (typeof rawSustain === 'string') {
      const trimmed = rawSustain.trim();
      if (trimmed) {
        const parsed = Number(trimmed);
        if (Number.isFinite(parsed)) {
          const s = Math.floor(parsed);
          if (s >= 0) {
            sustain = s;
          }
        }
      }
    }

    for (let i = instruments.length; i <= slotIndex; i++) {
      if (!instruments[i]) {
        const slotId = i.toString(16).padStart(2, '0').toUpperCase();
        instruments[i] = {
          id: slotId,
          name: '',
          volumeEnvelope: Array(ENVELOPE_LENGTH).fill(0),
          arpeggioEnvelope: Array(ENVELOPE_LENGTH).fill(0),
          pitchEnvelope: Array(ENVELOPE_LENGTH).fill(0),
          noiseEnvelope: Array(ENVELOPE_LENGTH).fill(0),
          modeEnvelope: Array(ENVELOPE_LENGTH).fill(0),
          base: DEFAULT_BASE_KEY,
          octave: DEFAULT_OCTAVE,
          sustain: null,
        };
      }
    }

    instruments[slotIndex] = {
      id: number,
      name,
      volumeEnvelope,
      arpeggioEnvelope,
      pitchEnvelope,
      noiseEnvelope,
      modeEnvelope,
      base,
      octave,
      sustain: sustain,
    };
  });

  // Ensure loop index stays within playlist bounds
  if (loop != null) {
    if (playlist.length === 0) {
      loop = null;
    } else {
      loop = Math.max(0, Math.min(playlist.length - 1, loop | 0));
    }
  }

  const song: Song = {
    title,
    author,
    year,
    speed,
    patternLength: clampedLength,
    loop,
    patterns,
    playlist,
    instruments,
  };

  return validateSongData(song);
};

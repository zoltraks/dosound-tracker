import yaml from 'js-yaml';
import type { Instrument, Song, Pattern, PatternLine } from '../synth/SoundDriver';
import { MAX_INSTRUMENTS, ENVELOPE_LENGTH, PATTERN_LENGTH, DEFAULT_OCTAVE, MIN_OCTAVE, MAX_OCTAVE } from '../constants/music';

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
  const parsed = yaml.load(content) as any;

  if (!parsed || typeof parsed !== 'object' || !parsed.song) {
    throw new Error('Root "song" key not found.');
  }

  const node = parsed.song as any;
  if (!node || typeof node !== 'object') {
    throw new Error('Invalid song file format');
  }

  const rawLength = Number(node.length);
  const patternLengthRaw = Number.isFinite(rawLength) ? rawLength : PATTERN_LENGTH;
  const clampedLength = Math.max(4, Math.min(256, Math.floor(patternLengthRaw)));

  const title =
    typeof node.title === 'string' && node.title.trim() ? node.title : DEFAULT_SONG_TITLE;
  const author =
    typeof node.author === 'string' && node.author.trim() ? node.author : DEFAULT_SONG_AUTHOR;

  const speedRaw = Number(node.speed);
  const baseSpeed = Number.isFinite(speedRaw) && speedRaw > 0 ? Math.floor(speedRaw) : 6;
  const clampedSpeed = Math.max(2, baseSpeed);
  const speed = clampedSpeed & ~1; // enforce even speed (2,4,6,...)

  const yearRaw = Number(node.year);
  const year = Number.isFinite(yearRaw) ? yearRaw : new Date().getFullYear();

  // Optional loop position (0-based playlist index)
  let loop: number | null = null;
  const rawLoop = (node as any).loop;
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

  const playlistNodes = Array.isArray(node.playlist) ? node.playlist : [];
  if (playlistNodes.length === 0) {
    throw new Error('Song playlist is missing or empty');
  }

  const playlist = playlistNodes.map((entry: any, index: number) => {
    if (!entry || typeof entry !== 'object') {
      throw new Error(`Invalid playlist entry at index ${index}`);
    }

    const trackA = typeof entry.A === 'string' ? entry.A : '--';
    const trackB = typeof entry.B === 'string' ? entry.B : '--';
    const trackC = typeof entry.C === 'string' ? entry.C : '--';

    return { trackA, trackB, trackC };
  });

  const rawPatternNodes = Array.isArray(node.pattern) ? node.pattern : node.patterns;
  const patternNodes = Array.isArray(rawPatternNodes) ? rawPatternNodes : [];
  if (patternNodes.length === 0) {
    throw new Error('Song patterns are missing');
  }

  const patterns: Pattern[] = patternNodes.map((pNode: any, patternIndex: number) => {
    if (!pNode || typeof pNode !== 'object') {
      throw new Error(`Invalid pattern at index ${patternIndex}`);
    }

    const rawNumber = pNode.number;
    const number =
      typeof rawNumber === 'string' && rawNumber.trim()
        ? rawNumber.trim().toUpperCase()
        : patternIndex.toString(16).padStart(2, '0').toUpperCase();

    const name =
      typeof pNode.name === 'string' && pNode.name.trim()
        ? pNode.name
        : `Pattern ${number}`;

    const rawLineNodes = Array.isArray(pNode.steps)
      ? pNode.steps
      : Array.isArray(pNode.lines)
        ? pNode.lines
        : [];
    const expandedLineNodes: any[] = [];

    // Expand compressed space/off runs (space: N / off: N) into individual logical lines.
    // Support both pure runs and volume-only runs, e.g. `space: 3` or
    // `space: 3, volume: 14`.
    for (const nodeLine of rawLineNodes) {
      if (nodeLine && typeof nodeLine === 'object') {
        const ln: any = nodeLine;

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
          const count = isNumericSpace ? spaceVal : offVal;
          const isOff = isNumericOff && !isNumericSpace;
          for (let i = 0; i < count; i++) {
            expandedLineNodes.push(isOff ? { off: true } : { space: true });
          }
          continue;
        }

        // Volume-only runs: replicate the volume onto each expanded step.
        if (hasVolume && onlySpaceOffVolume && (isNumericSpace || isNumericOff)) {
          const count = isNumericSpace ? spaceVal : offVal;
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
        const ln: any = rawLineNode;

        if (ln.off === true) {
          // Explicit note-off event
          const instId =
            typeof ln.instrument === 'string' && ln.instrument.trim()
              ? ln.instrument.trim().toUpperCase()
              : '00';

          line.trackA = {
            note: '===',
            octave: 0,
            instrument: instId,
          };
        } else if (ln.space === true) {
          // Pure space/rest line: leave trackA as null
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

  const rawInstrumentNodes = Array.isArray(node.instrument) ? node.instrument : node.instruments;
  const instrumentNodes = Array.isArray(rawInstrumentNodes) ? rawInstrumentNodes : [];
  if (instrumentNodes.length === 0) {
    throw new Error('Song instruments are missing');
  }

  const instruments: Instrument[] = [];

  const expandEnvelope = (values: any, length: number, defaultValue: number): number[] => {
    const rawArray = Array.isArray(values) ? (values as any[]) : [];
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

  instrumentNodes.forEach((instNode: any, index: number) => {
    if (!instNode || typeof instNode !== 'object') {
      throw new Error(`Invalid instrument at index ${index}`);
    }

    const rawNumber = instNode.number;
    const number =
      typeof rawNumber === 'string' && rawNumber.trim()
        ? rawNumber.trim().toUpperCase()
        : index.toString(16).padStart(2, '0').toUpperCase();

    const slotIndex = parseInt(number, 16);
    if (!Number.isFinite(slotIndex) || slotIndex < 0 || slotIndex >= MAX_INSTRUMENTS) {
      throw new Error(`Invalid instrument number "${rawNumber}"`);
    }

    const rawName = typeof instNode.name === 'string' ? instNode.name : '';
    const name = rawName.trim() ? rawName : '';

    const baseParsed = parseBaseKey((instNode as any).base);
    const base = baseParsed
      ? formatBaseKey(baseParsed.note, baseParsed.octave)
      : DEFAULT_BASE_KEY;

    const rawOctave = (instNode as any).octave;
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

    const volumeEnvelope = expandEnvelope(instNode.volume, ENVELOPE_LENGTH, 0x0f);
    const arpeggioEnvelope = expandEnvelope(instNode.arpeggio, ENVELOPE_LENGTH, 0);
    const pitchEnvelope = expandEnvelope(instNode.pitch, ENVELOPE_LENGTH, 0);
    const noiseEnvelope = expandEnvelope(instNode.noise, ENVELOPE_LENGTH, 0);
    const modeEnvelope = expandEnvelope(instNode.mode, ENVELOPE_LENGTH, 0);

    let sustain: number | undefined;
    const rawSustain = (instNode as any).sustain;
    if (typeof rawSustain === 'number' && Number.isFinite(rawSustain)) {
      sustain = rawSustain;
    } else if (typeof rawSustain === 'string') {
      const trimmed = rawSustain.trim();
      if (trimmed) {
        const parsed = Number(trimmed);
        if (Number.isFinite(parsed)) {
          sustain = parsed;
        }
      }
    }
    if (typeof sustain === 'number' && Number.isFinite(sustain)) {
      const maxIndex = ENVELOPE_LENGTH - 1;
      const clamped = Math.max(0, Math.min(maxIndex, Math.floor(sustain)));
      sustain = clamped;
    } else {
      sustain = undefined;
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
      sustain,
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

  return {
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
};

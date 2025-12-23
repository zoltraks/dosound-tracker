import yaml from 'js-yaml';
import type { Instrument, Song, Pattern, Step } from '../synth/SoundDriver';
import {
  MAX_INSTRUMENTS,
  ENVELOPE_LENGTH,
  PATTERN_LENGTH,
  DEFAULT_OCTAVE,
  MIN_OCTAVE,
  MAX_OCTAVE,
} from '../constants/music';
import { validateSongData } from './validation';
import {
  DEFAULT_BASE_KEY,
  formatBaseKey,
  parseBaseKey,
  normalizeInstrumentColor,
} from './songFormat';
import { formatHexId } from './hexFormatting';
import { formatInstrumentSlotId } from './instrumentSelection';
import {
  DEFAULT_SONG_CHIP,
  DEFAULT_SONG_FRAME,
  SUPPORTED_SONG_CHIPS,
  SUPPORTED_SONG_FRAMES,
} from '../constants/song';
import { expandEnvelope, expandLoopingEnvelope } from './envelopeUtils';

type SongYamlRoot = {
  song?: unknown;
  music?: unknown;
};

interface SongYamlNode {
  title?: unknown;
  author?: unknown;
  length?: unknown;
  speed?: unknown;
  year?: unknown;
  loop?: unknown;
  chip?: unknown;
  frame?: unknown;
  line?: unknown;
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
  shift?: unknown;
  arpeggio?: unknown;
  pitch?: unknown;
  noise?: unknown;
  mode?: unknown;
  /** Optional display color, accepts 3- or 6-digit hex and normalizes to 3-digit. */
  color?: unknown;
  midi?: unknown;
}

interface PatternNodeYaml {
  number?: unknown;
  name?: unknown;
  step?: unknown;
  steps?: unknown;
  lines?: unknown;
}

interface PatternStepNodeYaml {
  wait?: unknown;
  space?: unknown;
  off?: unknown;
  volume?: unknown;
  note?: unknown;
  instrument?: unknown;
  [key: string]: unknown;
}

export const DEFAULT_SONG_TITLE = 'New Song';
export const DEFAULT_SONG_AUTHOR = 'Author Name';

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

/**
 * Re-export shared formatting helpers for compatibility with existing imports.
 */
export { DEFAULT_BASE_KEY, formatBaseKey, parseBaseKey, normalizeInstrumentColor } from './songFormat';

export interface SongParseMetadata {
  hasChipField: boolean;
  providedChipValue: unknown;
  normalizedChip: string;
  isChipSupported: boolean;
  hasFrameField: boolean;
  providedFrameValue: unknown;
  normalizedFrame: number;
  isFrameSupported: boolean;
}

export interface ParseSongOptions {
  onMetadata?: (metadata: SongParseMetadata) => void;
}

export const parseSongFromYaml = (content: string, options?: ParseSongOptions): Song => {
  const parsed = yaml.load(content) as unknown;

  if (!parsed || typeof parsed !== 'object' || (!('song' in parsed) && !('music' in parsed))) {
    throw new Error('Root "song" or "music" key not found.');
  }

  const root = parsed as SongYamlRoot;
  const node = root.song ?? root.music;
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

  const lineNodes = Array.isArray(songNode.line)
    ? songNode.line
    : Array.isArray(songNode.playlist)
      ? songNode.playlist
      : [];
  if (lineNodes.length === 0) {
    throw new Error('Song line is missing or empty');
  }

  const line = lineNodes.map((entry, index: number) => {
    if (!entry || typeof entry !== 'object') {
      throw new Error(`Invalid line entry at index ${index}`);
    }

    const e = entry as { A?: unknown; B?: unknown; C?: unknown };
    const A = typeof e.A === 'string' ? e.A : '--';
    const B = typeof e.B === 'string' ? e.B : '--';
    const C = typeof e.C === 'string' ? e.C : '--';

    return { A, B, C };
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
        : formatHexId(patternIndex);

    const name =
      typeof patternNode.name === 'string' && patternNode.name.trim()
        ? patternNode.name
        : `Pattern ${number}`;

    const rawLineNodes = Array.isArray(patternNode.step)
      ? patternNode.step
      : Array.isArray(patternNode.steps)
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
        const onlySpaceOrOff = keys.every(k => k === 'wait' || k === 'space' || k === 'off');
        const onlySpaceOffVolume = keys.every(
          k => k === 'wait' || k === 'space' || k === 'off' || k === 'volume'
        );

        const spaceVal = ln.wait ?? ln.space;
        const offVal = ln.off;

        const isNumericSpace = typeof spaceVal === 'number' && Number.isFinite(spaceVal) && spaceVal > 0;
        const isNumericOff = typeof offVal === 'number' && Number.isFinite(offVal) && offVal > 0;

        // Pure runs without volume
        if (!hasVolume && onlySpaceOrOff && (isNumericSpace || isNumericOff)) {
          const count = (isNumericSpace ? spaceVal : offVal) as number;
          const isOff = isNumericOff && !isNumericSpace;
          for (let i = 0; i < count; i++) {
            expandedLineNodes.push(isOff ? { off: true } : { wait: true });
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
              isOff ? { off: true, volume: vol } : { wait: true, volume: vol }
            );
          }
          continue;
        }

        expandedLineNodes.push(nodeLine);
      } else {
        expandedLineNodes.push(nodeLine);
      }
    }

    const step: Step[] = [];

    for (let i = 0; i < clampedLength; i++) {
      const rawLineNode = expandedLineNodes[i];
      const line: Step = { note: null };

      if (rawLineNode && typeof rawLineNode === 'object') {
        const ln = rawLineNode as PatternStepNodeYaml;

        const rawNote = ln.note;
        const isOffNote =
          typeof rawNote === 'string' && rawNote.trim().toUpperCase() === 'OFF';

        if (ln.off === true || isOffNote) {
          // Empty or note-off line: currently treated as space
          line.note = {
            note: '===',
            octave: 0,
            instrument: '00',
          };
        } else if (ln.wait === true || ln.space === true) {
          // Empty or note-off line: currently treated as space
        } else if (typeof rawNote === 'string') {
          const parsedKey = parseBaseKey(rawNote);
          if (!parsedKey) {
            throw new Error(
              `Invalid note value "${rawNote}" in pattern ${number} at line ${i}`
            );
          }

          const instId =
            typeof ln.instrument === 'string' && ln.instrument.trim()
              ? ln.instrument.trim().toUpperCase()
              : '00';

          line.note = {
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

      step.push(line);
    }

    return {
      id: number,
      name,
      step,
    };
  });

  const rawInstrumentNodes = Array.isArray(songNode.instrument) ? songNode.instrument : songNode.instruments;
  const instrumentNodes = Array.isArray(rawInstrumentNodes) ? rawInstrumentNodes : [];
  if (instrumentNodes.length === 0) {
    throw new Error('Song instruments are missing');
  }

  const instruments: Instrument[] = [];

  instrumentNodes.forEach((instNode, index: number) => {
    if (!instNode || typeof instNode !== 'object') {
      throw new Error(`Invalid instrument at index ${index}`);
    }

    const nodeObj = instNode as InstrumentNodeYaml;

    const rawNumber = nodeObj.number;
    const number =
      typeof rawNumber === 'string' && rawNumber.trim()
        ? rawNumber.trim().toUpperCase()
        : formatInstrumentSlotId(index);

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

    const volume = expandEnvelope(nodeObj.volume, ENVELOPE_LENGTH, 0x0f);
    const shift =
      nodeObj.shift !== undefined
        ? expandEnvelope(nodeObj.shift, ENVELOPE_LENGTH, 0)
        : nodeObj.arpeggio !== undefined
          ? expandLoopingEnvelope(nodeObj.arpeggio, ENVELOPE_LENGTH, 0)
          : Array(ENVELOPE_LENGTH).fill(0);
    const pitch = expandEnvelope(nodeObj.pitch, ENVELOPE_LENGTH, 0);
    const noise = expandEnvelope(nodeObj.noise, ENVELOPE_LENGTH, 0);
    const mode = expandEnvelope(nodeObj.mode, ENVELOPE_LENGTH, 0);

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

    // Optional per-instrument MIDI output settings. Accept either numeric or
    // string values in YAML and clamp to valid MIDI ranges. Only attach a
    // midi object when at least one of channel/program is present.
    let midi: Instrument['midi'] | undefined;
    const rawMidi = nodeObj.midi;
    if (rawMidi && typeof rawMidi === 'object') {
      const midiNode = rawMidi as { channel?: unknown; program?: unknown };

      let channel: number | null = null;
      const rawChannel = midiNode.channel;
      if (typeof rawChannel === 'number' && Number.isFinite(rawChannel)) {
        const clamped = Math.max(1, Math.min(16, Math.floor(rawChannel)));
        channel = clamped;
      } else if (typeof rawChannel === 'string') {
        const trimmed = rawChannel.trim();
        if (trimmed) {
          const parsed = Number(trimmed);
          if (Number.isFinite(parsed)) {
            const clamped = Math.max(1, Math.min(16, Math.floor(parsed)));
            channel = clamped;
          }
        }
      }

      let program: number | null = null;
      const rawProgram = midiNode.program;
      if (typeof rawProgram === 'number' && Number.isFinite(rawProgram)) {
        const clamped = Math.max(0, Math.min(127, Math.floor(rawProgram)));
        program = clamped;
      } else if (typeof rawProgram === 'string') {
        const trimmed = rawProgram.trim();
        if (trimmed) {
          const parsed = Number(trimmed);
          if (Number.isFinite(parsed)) {
            const clamped = Math.max(0, Math.min(127, Math.floor(parsed)));
            program = clamped;
          }
        }
      }

      if (channel !== null || program !== null) {
        midi = { channel, program };
      }
    }

    const color = normalizeInstrumentColor(nodeObj.color);

    for (let i = instruments.length; i <= slotIndex; i++) {
      if (!instruments[i]) {
        const slotId = formatInstrumentSlotId(i);
        instruments[i] = {
          id: slotId,
          name: '',
          volume: Array(ENVELOPE_LENGTH).fill(0),
          shift: Array(ENVELOPE_LENGTH).fill(0),
          pitch: Array(ENVELOPE_LENGTH).fill(0),
          noise: Array(ENVELOPE_LENGTH).fill(0),
          mode: Array(ENVELOPE_LENGTH).fill(0),
          base: DEFAULT_BASE_KEY,
          octave: DEFAULT_OCTAVE,
          sustain: null,
        };
      }
    }

    instruments[slotIndex] = {
      id: number,
      name,
      volume,
      shift,
      pitch,
      noise,
      mode,
      base,
      octave,
      sustain,
      ...(color ? { color } : {}),
      ...(midi ? { midi } : {}),
    };
  });

  // Ensure loop index stays within playlist bounds
  if (loop != null) {
    if (line.length === 0) {
      loop = null;
    } else {
      loop = Math.max(0, Math.min(line.length - 1, loop | 0));
    }
  }

  const hasChipField = Object.prototype.hasOwnProperty.call(songNode, 'chip');
  const chipRawValue = hasChipField ? songNode.chip : null;
  const chipRaw =
    typeof songNode.chip === 'string'
      ? songNode.chip.trim()
      : typeof songNode.chip === 'number' && Number.isFinite(songNode.chip)
        ? String(songNode.chip)
        : '';
  const frameRaw = Number(songNode.frame);

  const normalizedChip = chipRaw ? chipRaw.toUpperCase() : DEFAULT_SONG_CHIP;
  const normalizedFrame = Number.isFinite(frameRaw) ? Math.floor(frameRaw) : DEFAULT_SONG_FRAME;
  const hasFrameField = Object.prototype.hasOwnProperty.call(songNode, 'frame');

  const song: Song = {
    title,
    author,
    year,
    speed,
    length: clampedLength,
    loop,
    pattern: patterns,
    line,
    instrument: instruments,
    chip: normalizedChip,
    frame: normalizedFrame,
  };

  if (options?.onMetadata) {
    options.onMetadata({
      hasChipField,
      providedChipValue: chipRawValue,
      normalizedChip,
      isChipSupported: SUPPORTED_SONG_CHIPS.includes(normalizedChip),
      hasFrameField,
      providedFrameValue: hasFrameField ? songNode.frame : null,
      normalizedFrame,
      isFrameSupported: SUPPORTED_SONG_FRAMES.includes(normalizedFrame),
    });
  }

  return validateSongData(song);
};

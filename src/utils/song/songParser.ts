import yaml from 'js-yaml';
import type { Instrument, Song, Pattern, Step } from '../../synth/SoundDriver.ts';
import {
  MAX_INSTRUMENTS,
  MAX_PATTERN_LENGTH,
  ENVELOPE_LENGTH,
  PATTERN_LENGTH,
  DEFAULT_OCTAVE,
  MIN_OCTAVE,
  MAX_OCTAVE,
} from '../../constants/music.ts';
import { assertImportSize } from '../validation/importSize.ts';
import { expandRunNodes } from '../yaml/runLength.ts';
import { coerceYamlNumber } from '../yaml/yamlUtils.ts';
import { validateSongData } from '../validation/validation.ts';
import {
  DEFAULT_BASE_KEY,
  formatBaseKey,
  parseBaseKey,
  normalizeInstrumentColor,
} from './songFormat.ts';
import { Formatter } from '../format/formatters.ts';
import { formatInstrumentSlotId } from '../instrument/instrumentSelection.ts';
import {
  DEFAULT_SONG_CHIP,
  DEFAULT_SONG_FRAME,
  DEFAULT_SONG_CLOCK,
  SUPPORTED_SONG_CHIPS,
  SUPPORTED_SONG_FRAMES,
  SUPPORTED_SONG_CLOCKS,
} from '../../constants/song.ts';
import { expandEnvelope, expandLoopingEnvelope } from '../envelope/envelopeUtils.ts';
import { clampVolumeNibble } from '../panel/volumeUtils.ts';
import { normalizeSongSpeed } from './songSpeed.ts';
import { clampMidiChannel, clampMidiProgram } from '../midi/midiUtils.ts';
import { createNoteOff } from '../track/trackPanelUtils.ts';
import { normalizeInstrumentId } from '../instrument/instrumentSelection.ts';

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
  clock?: unknown;
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
    return clampVolumeNibble(value);
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
      return clampVolumeNibble(n);
    }
  }

  return null;
};

export {
  DEFAULT_BASE_KEY,
  formatBaseKey,
  parseBaseKey,
  normalizeInstrumentColor,
} from './songFormat.ts';

export interface SongParseMetadata {
  hasChipField: boolean;
  providedChipValue: unknown;
  normalizedChip: string;
  isChipSupported: boolean;
  hasFrameField: boolean;
  providedFrameValue: unknown;
  normalizedFrame: number;
  isFrameSupported: boolean;
  hasClockField: boolean;
  providedClockValue: unknown;
  normalizedClock: number;
  isClockSupported: boolean;
}

export interface ParseSongOptions {
  onMetadata?: (metadata: SongParseMetadata) => void;
}

export const parseSongFromYaml = (content: string, options?: ParseSongOptions): Song => {
  assertImportSize(content, 'Song file');

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
  const clampedLength = Math.max(4, Math.min(MAX_PATTERN_LENGTH, Math.floor(patternLengthRaw)));

  const title =
    typeof songNode.title === 'string' && songNode.title.trim()
      ? songNode.title.trim()
      : DEFAULT_SONG_TITLE;
  const author =
    typeof songNode.author === 'string' && songNode.author.trim()
      ? songNode.author.trim()
      : DEFAULT_SONG_AUTHOR;

  const speed = normalizeSongSpeed(songNode.speed);

  const yearRaw = Number(songNode.year);
  const year = Number.isFinite(yearRaw) ? yearRaw : new Date().getFullYear();

  // Optional loop position (0-based playlist index)
  let loop: number | null = null;
  const coercedLoop = coerceYamlNumber(songNode.loop);
  if (coercedLoop !== null) {
    loop = Math.max(0, Math.floor(coercedLoop));
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
        : Formatter.hex(patternIndex, { padWidth: 2, uppercase: true });

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
    // Expand compressed wait/space/off runs into individual logical lines,
    // bounded to the remaining pattern length.
    const expandedLineNodes = expandRunNodes<unknown>(
      rawLineNodes,
      clampedLength,
      (volume) => (volume === undefined ? { wait: true } : { wait: true, volume }),
      (volume) => (volume === undefined ? { off: true } : { off: true, volume }),
    );

    const step: Step[] = [];

    for (let i = 0; i < clampedLength; i++) {
      const rawLineNode = expandedLineNodes[i];
      const line: Step = { note: null };

      if (rawLineNode && typeof rawLineNode === 'object') {
        const ln = rawLineNode as PatternStepNodeYaml;

        const rawNote = ln.note;
        const isOffNote = typeof rawNote === 'string' && rawNote.trim().toUpperCase() === 'OFF';

        if (ln.off === true || isOffNote) {
          // Empty or note-off line: currently treated as space
          line.note = createNoteOff();
        } else if (ln.wait === true || ln.space === true) {
          // Empty or note-off line: currently treated as space
        } else if (typeof rawNote === 'string') {
          const parsedKey = parseBaseKey(rawNote);
          if (!parsedKey) {
            throw new Error(`Invalid note value "${rawNote}" in pattern ${number} at line ${i}`);
          }

          const instId =
            typeof ln.instrument === 'string' && ln.instrument.trim()
              ? normalizeInstrumentId(ln.instrument)
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

  const rawInstrumentNodes = Array.isArray(songNode.instrument)
    ? songNode.instrument
    : songNode.instruments;
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
        ? normalizeInstrumentId(rawNumber)
        : formatInstrumentSlotId(index);

    const slotIndex = parseInt(number, 16);
    if (!Number.isFinite(slotIndex) || slotIndex < 0 || slotIndex >= MAX_INSTRUMENTS) {
      throw new Error(`Invalid instrument number "${rawNumber}"`);
    }

    const rawName = typeof nodeObj.name === 'string' ? nodeObj.name : '';
    const name = rawName.trim() ? rawName : '';

    const baseParsed = parseBaseKey(nodeObj.base);
    const base = baseParsed ? formatBaseKey(baseParsed.note, baseParsed.octave) : DEFAULT_BASE_KEY;

    const coercedOctave = coerceYamlNumber(nodeObj.octave);
    let octave = coercedOctave !== null ? coercedOctave : DEFAULT_OCTAVE;
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
    const coercedSustain = coerceYamlNumber(nodeObj.sustain);
    if (coercedSustain !== null) {
      const s = Math.floor(coercedSustain);
      if (s >= 0) {
        sustain = s;
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
      const coercedChannel = coerceYamlNumber(midiNode.channel);
      if (coercedChannel !== null) {
        channel = clampMidiChannel(coercedChannel);
      }

      let program: number | null = null;
      const coercedProgram = coerceYamlNumber(midiNode.program);
      if (coercedProgram !== null) {
        program = clampMidiProgram(coercedProgram);
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
  const clockRaw = Number(songNode.clock);

  const normalizedChip = chipRaw ? chipRaw.toUpperCase() : DEFAULT_SONG_CHIP;
  const normalizedFrame = Number.isFinite(frameRaw) ? Math.floor(frameRaw) : DEFAULT_SONG_FRAME;
  const hasFrameField = Object.prototype.hasOwnProperty.call(songNode, 'frame');
  const normalizedClock = Number.isFinite(clockRaw) ? Math.floor(clockRaw) : DEFAULT_SONG_CLOCK;
  const hasClockField = Object.prototype.hasOwnProperty.call(songNode, 'clock');

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
    clock: normalizedClock,
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
      hasClockField,
      providedClockValue: hasClockField ? songNode.clock : null,
      normalizedClock,
      isClockSupported: SUPPORTED_SONG_CLOCKS.includes(normalizedClock),
    });
  }

  return validateSongData(song);
};

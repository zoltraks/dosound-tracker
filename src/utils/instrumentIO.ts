import yaml from 'js-yaml';
import type { Instrument } from '../synth/SoundDriver';
import { ENVELOPE_LENGTH, DEFAULT_OCTAVE, MIN_OCTAVE, MAX_OCTAVE } from '../constants/music';
import { DEFAULT_BASE_KEY, formatBaseKey, parseBaseKey, normalizeInstrumentColor } from './songFormat';
import {
  expandEnvelope,
  expandLoopingEnvelope,
  isEnvelopeZeroDefault,
  trimEnvelope,
} from './envelopeUtils';
import { quoteYamlValues } from './yamlUtils';
import { normalizeInstrumentId } from './playbackUtils';
import type { InstrumentId } from '../types/branded';

export const buildInstrumentYamlForExport = (currentInstrument: Instrument): string => {
  const volumeEnv = trimEnvelope(currentInstrument.volume);
  const shiftEnv = trimEnvelope(currentInstrument.shift);
  const pitchEnv = trimEnvelope(currentInstrument.pitch);
  const noiseEnv = trimEnvelope(currentInstrument.noise);
  const modeEnv = trimEnvelope(currentInstrument.mode);

  const instrumentNode: Record<string, unknown> = {};

  const trimmedName = (currentInstrument.name || '').trim();
  if (trimmedName) {
    instrumentNode.name = trimmedName;
  }

  instrumentNode.type = 'dosound';
  instrumentNode.version = 1;

  const baseKey = currentInstrument.base || DEFAULT_BASE_KEY;
  instrumentNode.base = baseKey;

  const normalizedColor = normalizeInstrumentColor(currentInstrument.color ?? null);
  if (normalizedColor) {
    instrumentNode.color = normalizedColor;
  }

  const rawOctave = currentInstrument.octave;
  if (typeof rawOctave === 'number' && Number.isFinite(rawOctave)) {
    const clampedOctave = Math.max(MIN_OCTAVE, Math.min(MAX_OCTAVE, Math.floor(rawOctave)));
    if (clampedOctave !== DEFAULT_OCTAVE) {
      instrumentNode.octave = clampedOctave;
    }
  }

  if (!isEnvelopeZeroDefault(modeEnv)) {
    instrumentNode.mode = modeEnv;
  }

  instrumentNode.volume = volumeEnv;
  if (!isEnvelopeZeroDefault(shiftEnv)) {
    instrumentNode.shift = shiftEnv;
  }

  if (!isEnvelopeZeroDefault(pitchEnv)) {
    instrumentNode.pitch = pitchEnv;
  }
  if (!isEnvelopeZeroDefault(noiseEnv)) {
    instrumentNode.noise = noiseEnv;
  }

  const sustain = currentInstrument.sustain;
  if (typeof sustain === 'number' && Number.isFinite(sustain) && sustain >= 0) {
    instrumentNode.sustain = Math.floor(sustain);
  }

  const exportData = { instrument: instrumentNode };

  let yamlContent = yaml.dump(exportData, {
    indent: 2,
    lineWidth: -1,
    flowLevel: 2,
  });

  const quoteBaseValues = (text: string): string => quoteYamlValues(text, 'base');
  const quoteColorValues = (text: string): string => quoteYamlValues(text, 'color');
  const quoteNameValues = (text: string): string => quoteYamlValues(text, 'name');

  yamlContent = quoteBaseValues(yamlContent);
  yamlContent = quoteNameValues(yamlContent);
  yamlContent = quoteColorValues(yamlContent);

  return yamlContent;
};

export const parseInstrumentFromText = (
  content: string,
  currentInstrumentId: InstrumentId,
): Instrument => {
  const parsed = yaml.load(content) as unknown;

  if (!parsed || typeof parsed !== 'object' || !('instrument' in parsed)) {
    throw new Error('Root "instrument" key not found.');
  }

  type InstrumentFileRoot = {
    instrument?: unknown;
  };

  interface InstrumentFileNode {
    [key: string]: unknown;
    name?: unknown;
    base?: unknown;
    octave?: unknown;
    sustain?: unknown;
    color?: unknown;
    shift?: unknown;
    arpeggio?: unknown;
  }

  const root = parsed as InstrumentFileRoot;
  const node = root.instrument;

  if (!node || typeof node !== 'object') {
    throw new Error('Invalid instrument file format');
  }

  const instNode = node as InstrumentFileNode;

  const rawOctave = instNode.octave;
  let octave = DEFAULT_OCTAVE;
  if (typeof rawOctave === 'number' && Number.isFinite(rawOctave)) {
    octave = rawOctave;
  } else if (typeof rawOctave === 'string') {
    const trimmed = rawOctave.trim();
    if (trimmed) {
      const parsedOct = Number(trimmed);
      if (Number.isFinite(parsedOct)) {
        octave = parsedOct;
      }
    }
  }
  octave = Math.max(MIN_OCTAVE, Math.min(MAX_OCTAVE, Math.floor(octave)));

  let sustain: number | null = null;
  const rawSustain = instNode.sustain;
  if (typeof rawSustain === 'number' && Number.isFinite(rawSustain)) {
    const s = Math.floor(rawSustain);
    if (s >= 0) {
      sustain = s;
    }
  } else if (typeof rawSustain === 'string') {
    const trimmed = rawSustain.trim();
    if (trimmed) {
      const parsedSus = Number(trimmed);
      if (Number.isFinite(parsedSus)) {
        const s = Math.floor(parsedSus);
        if (s >= 0) {
          sustain = s;
        }
      }
    }
  }

  const rawName = typeof instNode.name === 'string' ? instNode.name : '';
  const parsedName = rawName.trim() ? rawName : '';

  const color = normalizeInstrumentColor((instNode as { color?: unknown }).color);

  const instrument: Instrument = {
    id: normalizeInstrumentId(currentInstrumentId),
    name: parsedName,
    mode: expandEnvelope(instNode.mode, ENVELOPE_LENGTH, 0),
    volume: expandEnvelope(instNode.volume, ENVELOPE_LENGTH, 0x0f),
    shift:
      instNode.shift !== undefined
        ? expandEnvelope(instNode.shift, ENVELOPE_LENGTH, 0)
        : instNode.arpeggio !== undefined
          ? expandLoopingEnvelope(instNode.arpeggio, ENVELOPE_LENGTH, 0)
          : Array(ENVELOPE_LENGTH).fill(0),
    pitch: expandEnvelope(instNode.pitch, ENVELOPE_LENGTH, 0),
    noise: expandEnvelope(instNode.noise, ENVELOPE_LENGTH, 0),
    base: (() => {
      const parsedBase = parseBaseKey(instNode.base);
      if (!parsedBase) return DEFAULT_BASE_KEY;
      return formatBaseKey(parsedBase.note, parsedBase.octave);
    })(),
    octave,
    sustain,
    ...(color ? { color } : {}),
  };

  return instrument;
};

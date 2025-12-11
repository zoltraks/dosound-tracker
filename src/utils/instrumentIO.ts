import yaml from 'js-yaml';
import type { Instrument } from '../synth/SoundDriver';
import { ENVELOPE_LENGTH, DEFAULT_OCTAVE, MIN_OCTAVE, MAX_OCTAVE } from '../constants/music';
import { DEFAULT_BASE_KEY, formatBaseKey, parseBaseKey, normalizeInstrumentColor } from './songFormat';

export const buildInstrumentYamlForExport = (currentInstrument: Instrument): string => {
  const trimEnvelopeLocal = (values: number[]): number[] => {
    if (!values || values.length === 0) return [];
    const last = values[values.length - 1];
    let i = values.length - 2;
    while (i >= 0 && values[i] === last) {
      i -= 1;
    }
    return values.slice(0, i + 1).concat(last);
  };

  const volumeEnv = trimEnvelopeLocal(currentInstrument.volume);
  const arpeggioEnv = trimEnvelopeLocal(currentInstrument.arpeggio);
  const pitchEnv = trimEnvelopeLocal(currentInstrument.pitch);
  const noiseEnv = trimEnvelopeLocal(currentInstrument.noiseEnvelope);
  const modeEnv = trimEnvelopeLocal(currentInstrument.mode);

  const isZeroDefaultLocal = (values: number[]): boolean =>
    values.length === 0 || (values.length === 1 && values[0] === 0);

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

  if (!isZeroDefaultLocal(modeEnv)) {
    instrumentNode.mode = modeEnv;
  }

  instrumentNode.volume = volumeEnv;
  if (!isZeroDefaultLocal(arpeggioEnv)) {
    instrumentNode.arpeggio = arpeggioEnv;
  }

  if (!isZeroDefaultLocal(pitchEnv)) {
    instrumentNode.pitch = pitchEnv;
  }
  if (!isZeroDefaultLocal(noiseEnv)) {
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

  const quoteBaseValues = (text: string): string => {
    const baseLineRegex = /^(\s*-\s+|\s+)(base):\s*(.+)$/gm;
    return text.replace(baseLineRegex, (_match, indent: string, key: string, value: string) => {
      let inner = String(value).trim();
      if (
        (inner.startsWith('"') && inner.endsWith('"')) ||
        (inner.startsWith('\'') && inner.endsWith('\''))
      ) {
        inner = inner.slice(1, -1);
      }
      return `${indent}${key}: "${inner}"`;
    });
  };

  const quoteColorValues = (text: string): string => {
    const colorLineRegex = /^(\s*-\s+|\s+)(color):\s*(.+)$/gm;
    return text.replace(colorLineRegex, (_match, indent: string, key: string, value: string) => {
      let inner = String(value).trim();
      if (
        (inner.startsWith('"') && inner.endsWith('"')) ||
        (inner.startsWith('\'') && inner.endsWith('\''))
      ) {
        inner = inner.slice(1, -1);
      }
      return `${indent}${key}: "${inner}"`;
    });
  };

  yamlContent = quoteBaseValues(yamlContent);
  yamlContent = quoteColorValues(yamlContent);

  return yamlContent;
};

export const parseInstrumentFromText = (
  content: string,
  currentInstrumentId: string,
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
  }

  const root = parsed as InstrumentFileRoot;
  const node = root.instrument;

  if (!node || typeof node !== 'object') {
    throw new Error('Invalid instrument file format');
  }

  const instNode = node as InstrumentFileNode;

  const expandEnvelope = (field: string, length: number, defaultValue: number): number[] => {
    const raw = Array.isArray(instNode[field]) ? (instNode[field] as unknown[]) : [];
    const values = raw.map(v => Number(v)).filter(v => Number.isFinite(v));

    if (values.length === 0) {
      return Array(length).fill(defaultValue);
    }

    const result: number[] = [];
    for (let i = 0; i < length; i += 1) {
      if (i < values.length) {
        result[i] = values[i];
      } else {
        result[i] = values[values.length - 1];
      }
    }
    return result;
  };

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
    id: currentInstrumentId,
    name: parsedName,
    mode: expandEnvelope('mode', ENVELOPE_LENGTH, 0),
    volume: expandEnvelope('volume', ENVELOPE_LENGTH, 0x0f),
    arpeggio: expandEnvelope('arpeggio', ENVELOPE_LENGTH, 0),
    pitch: expandEnvelope('pitch', ENVELOPE_LENGTH, 0),
    noiseEnvelope: expandEnvelope('noiseEnvelope', ENVELOPE_LENGTH, 0),
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

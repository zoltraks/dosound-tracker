import yaml from 'js-yaml';
import type { Song, Step } from '../synth/SoundDriver';
import { PATTERN_LENGTH, DEFAULT_OCTAVE, MIN_OCTAVE, MAX_OCTAVE } from '../constants/music';
import { DEFAULT_BASE_KEY, formatBaseKey, normalizeInstrumentColor } from './songFormat';
import { formatHexId } from './hexFormatting';
import { formatInstrumentSlotId } from './instrumentSelection';

const trimEnvelope = (values: number[]): number[] => {
  if (!values || values.length === 0) return [];
  const last = values[values.length - 1];
  let i = values.length - 2;
  while (i >= 0 && values[i] === last) {
    i -= 1;
  }
  return values.slice(0, i + 1).concat(last);
};

const isZeroDefault = (values: number[]): boolean =>
  values.length === 0 || (values.length === 1 && values[0] === 0);

export const buildSongYamlForExport = (currentSong: Song): string => {
  const instrumentSource = currentSong.instrument;
  const instruments = instrumentSource.map((inst, index) => {
    const volumeEnv = trimEnvelope(inst.volume);
    const shiftEnv = trimEnvelope(inst.shift);
    const pitchEnv = trimEnvelope(inst.pitch);
    const noiseEnv = trimEnvelope(inst.noise);
    const modeEnv = trimEnvelope(inst.mode);

    const number =
      typeof inst.id === 'string' && inst.id.trim()
        ? inst.id
        : formatInstrumentSlotId(index);

    const instrumentNode: Record<string, unknown> = {
      number,
    };

    const trimmedName = (inst.name || '').trim();
    if (trimmedName) {
      instrumentNode.name = trimmedName;
    }

    const baseKey = inst.base || DEFAULT_BASE_KEY;
    instrumentNode.base = baseKey;

    const normalizedColor = normalizeInstrumentColor(inst.color ?? null);
    if (normalizedColor) {
      instrumentNode.color = normalizedColor;
    }

    const rawOctave = inst.octave;
    if (typeof rawOctave === 'number' && Number.isFinite(rawOctave)) {
      const clampedOctave = Math.max(MIN_OCTAVE, Math.min(MAX_OCTAVE, Math.floor(rawOctave)));
      if (clampedOctave !== DEFAULT_OCTAVE) {
        instrumentNode.octave = clampedOctave;
      }
    }

    instrumentNode.volume = volumeEnv;
    if (!isZeroDefault(shiftEnv)) {
      instrumentNode.shift = shiftEnv;
    }

    if (!isZeroDefault(pitchEnv)) {
      instrumentNode.pitch = pitchEnv;
    }
    if (!isZeroDefault(noiseEnv)) {
      instrumentNode.noise = noiseEnv;
    }
    if (!isZeroDefault(modeEnv)) {
      instrumentNode.mode = modeEnv;
    }

    const sustain = inst.sustain;
    if (typeof sustain === 'number' && Number.isFinite(sustain) && sustain >= 0) {
      instrumentNode.sustain = Math.floor(sustain);
    }

    const midi = inst.midi;
    if (midi) {
      const midiNode: { channel?: number; program?: number } = {};
      let hasChannel = false;
      let hasProgram = false;

      const rawChannel = midi.channel;
      if (typeof rawChannel === 'number' && Number.isFinite(rawChannel)) {
        const clamped = Math.max(1, Math.min(16, Math.floor(rawChannel)));
        midiNode.channel = clamped;
        hasChannel = true;
      }

      const rawProgram = midi.program;
      if (typeof rawProgram === 'number' && Number.isFinite(rawProgram)) {
        const clamped = Math.max(0, Math.min(127, Math.floor(rawProgram)));
        midiNode.program = clamped;
        hasProgram = true;
      }

      if (hasChannel || hasProgram) {
        instrumentNode.midi = midiNode;
      }
    }

    return instrumentNode;
  });

  // Playlist: A/B/C keys instead of trackA/trackB/trackC.
  // Omit tracks that have no pattern assigned ("--").
  const lineSource = currentSong.line;
  type LegacyLineEntry = {
    A?: string;
    B?: string;
    C?: string;
    trackA?: string;
    trackB?: string;
    trackC?: string;
  };

  const line = lineSource.map((entry: LegacyLineEntry) => {
    const row: { A?: string; B?: string; C?: string } = {};
    const A = entry.A ?? entry.trackA;
    const B = entry.B ?? entry.trackB;
    const C = entry.C ?? entry.trackC;
    if (A && A !== '--') row.A = A;
    if (B && B !== '--') row.B = B;
    if (C && C !== '--') row.C = C;
    return row;
  });

  // Patterns: single-track (track A) steps with note strings or space,
  // plus optional per-line volume modifier.
  const targetLength = currentSong.length ?? PATTERN_LENGTH;
  const patternSource = currentSong.pattern;
  const patterns = patternSource.map((pattern, index) => {
    const number =
      typeof pattern.id === 'string' && pattern.id.trim()
        ? pattern.id
        : formatHexId(index);

    const rawLines = pattern.step;
    type PatternStep = {
      wait?: boolean | number;
      off?: boolean;
      note?: string;
      instrument?: string;
      volume?: number;
    };

    const lines: PatternStep[] = [];

    for (let i = 0; i < targetLength; i += 1) {
      const raw: Step = rawLines[i] || { note: null };
      const cell = raw.note ?? null;

      const volRaw = raw.volume;
      const hasVolume = volRaw !== undefined && volRaw !== null;

      let step: PatternStep;

      if (!cell) {
        step = { wait: hasVolume ? 1 : true };
      } else if (cell.note === '===') {
        // Explicit key-release step: encode as off: true in YAML.
        step = { note: 'OFF' };
      } else {
        const noteText = formatBaseKey(cell.note, cell.octave);
        step = {
          note: noteText,
          instrument: cell.instrument,
        };
      }

      if (hasVolume) {
        const volNum = Number(volRaw);
        if (Number.isFinite(volNum)) {
          const clamped = Math.max(0, Math.min(0x0f, Math.floor(volNum)));
          step.volume = clamped;
        }
      }

      lines.push(step);
    }

    // Trim trailing pure-space lines
    let lastNonSpace = lines.length - 1;
    while (lastNonSpace >= 0) {
      const ln = lines[lastNonSpace];
      if (ln && ln.wait === true && Object.keys(ln).length === 1) {
        lastNonSpace -= 1;
      } else {
        break;
      }
    }

    const trimmedLines = lines.slice(0, lastNonSpace + 1);

    // Compress consecutive pure-space lines and volume-only lines into
    // aggregated runs, e.g. `space: 3` or `space: 3, volume: 14`.
    const compressedLines: PatternStep[] = [];

    type RunType = 'none' | 'wait' | 'volume-wait';
    let runType: RunType = 'none';
    let runCount = 0;
    let runVolume = 0;

    const flushRun = () => {
      if (runCount <= 0) return;
      if (runType === 'wait') {
        compressedLines.push({ wait: runCount });
      } else if (runType === 'volume-wait') {
        if (runCount === 1) {
          // Single volume-only step: omit `space` and write only `volume`.
          compressedLines.push({ volume: runVolume });
        } else {
          // Multiple consecutive volume-only steps with same volume.
          compressedLines.push({ wait: runCount, volume: runVolume });
        }
      }
      runType = 'none';
      runCount = 0;
    };

    const isPureWait = (ln: PatternStep) =>
      ln && ln.wait === true && Object.keys(ln).length === 1;

    const isVolumeWait = (ln: PatternStep) =>
      ln &&
      ln.wait === 1 &&
      typeof ln.volume === 'number' &&
      Object.keys(ln).length === 2;

    for (const ln of trimmedLines) {
      if (isPureWait(ln)) {
        if (runType === 'wait') {
          runCount += 1;
        } else {
          flushRun();
          runType = 'wait';
          runCount = 1;
        }
      } else if (isVolumeWait(ln)) {
        const vol = ln.volume as number;
        if (runType === 'volume-wait' && vol === runVolume) {
          runCount += 1;
        } else {
          flushRun();
          runType = 'volume-wait';
          runVolume = vol;
          runCount = 1;
        }
      } else {
        flushRun();
        compressedLines.push(ln);
      }
    }
    flushRun();

    const patternNode: { number: string; step?: PatternStep[] } = {
      number,
    };

    if (compressedLines.length > 0) {
      patternNode.step = compressedLines;
    }

    return patternNode;
  });

  const hasLoop =
    typeof currentSong.loop === 'number' && Number.isFinite(currentSong.loop);

  const songNode: Record<string, unknown> = {};

  const trimmedTitle = (currentSong.title || '').trim();
  if (trimmedTitle) {
    songNode.title = currentSong.title;
  }

  const trimmedAuthor = (currentSong.author || '').trim();
  if (trimmedAuthor) {
    songNode.author = currentSong.author;
  }

  const yearValue = Number(currentSong.year);
  if (Number.isFinite(yearValue) && yearValue > 0) {
    songNode.year = yearValue;
  }

  songNode.speed = currentSong.speed;
  songNode.length = currentSong.length;
  if (hasLoop) {
    songNode.loop = Math.max(0, Math.floor(currentSong.loop as number));
  }
  songNode.line = line;
  songNode.pattern = patterns;
  songNode.instrument = instruments;

  const exportData = {
    song: songNode,
  };

  let yamlContent = yaml.dump(exportData, {
    indent: 2,
    lineWidth: -1,
    quotingType: '"',
  });

  const compressInstrumentArray = (key: string, text: string): string => {
    const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const pattern = new RegExp(
      `^(\\s*)(${escapedKey}:)\\s*\\n((?:\\1  -\\s*[^\\n]+\\n)+)`,
      'gm',
    );
    return text.replace(pattern, (_match, indent: string, keyText: string, block: string) => {
      const values: string[] = [];
      block.split('\n').forEach((line: string) => {
        const trimmed = line.trim();
        if (!trimmed.startsWith('- ')) return;
        values.push(trimmed.slice(2).trim());
      });
      return `${indent}${keyText} [${values.join(', ')}]\n`;
    });
  };

  const quoteLineValues = (text: string): string => {
    const lineRegex = /^(\s*-\s+|\s+)([ABC]):\s*(.+)$/gm;
    return text.replace(lineRegex, (_match, indent: string, key: string, value: string) => {
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

  const quoteNoteValues = (text: string): string => {
    const noteLineRegex = /^(\s*-\s+|\s+)(note):\s*(.+)$/gm;
    return text.replace(noteLineRegex, (_match, indent: string, key: string, value: string) => {
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

  const quoteNumberValues = (text: string): string => {
    const numberLineRegex = /^(\s*-\s+|\s+)(number):\s*(.+)$/gm;
    return text.replace(numberLineRegex, (_match, indent: string, key: string, value: string) => {
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

  const quoteTitleValues = (text: string): string => {
    const titleLineRegex = /^(\s+)(title):\s*(.+)$/gm;
    return text.replace(titleLineRegex, (_match, indent: string, key: string, value: string) => {
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

  const keys = ['volume', 'shift', 'pitch', 'noise', 'mode'];
  for (const key of keys) {
    yamlContent = compressInstrumentArray(key, yamlContent);
  }

  yamlContent = quoteLineValues(yamlContent);
  yamlContent = quoteNoteValues(yamlContent);
  yamlContent = quoteBaseValues(yamlContent);
  yamlContent = quoteNumberValues(yamlContent);
  yamlContent = quoteTitleValues(yamlContent);
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

  yamlContent = quoteColorValues(yamlContent);

  return yamlContent;
};

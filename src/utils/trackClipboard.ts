import yaml from 'js-yaml';
import type { PatternLine } from '../synth/SoundDriver';
import { PATTERN_LENGTH } from '../constants/music';

export type TrackClipboardStep = {
  space?: boolean | number;
  off?: boolean | number;
  note?: string;
  instrument?: string;
  volume?: number;
  [key: string]: unknown;
};

export function buildTrackClipboardSteps(args: {
  lines: PatternLine[];
  patternLength?: number;
  formatNoteKey: (note: string, octave: number) => string;
}): TrackClipboardStep[] {
  const targetLength = args.patternLength || PATTERN_LENGTH;
  const rawLines = args.lines || [];
  const steps: TrackClipboardStep[] = [];

  for (let i = 0; i < targetLength; i++) {
    const line: PatternLine = rawLines[i] || { trackA: null, trackB: null, trackC: null };
    const cell = line.trackA;

    const volRaw = line.volume;
    const hasVolume = volRaw !== undefined && volRaw !== null;

    let step: TrackClipboardStep;

    if (!cell) {
      step = { space: hasVolume ? 1 : true };
    } else if (cell.note === '===') {
      step = { note: 'OFF' };
    } else {
      const noteText = args.formatNoteKey(cell.note, cell.octave);
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

    steps.push(step);
  }

  return steps;
}

export function trimTrailingPureSpaces(steps: TrackClipboardStep[]): TrackClipboardStep[] {
  let lastNonSpace = steps.length - 1;
  while (lastNonSpace >= 0) {
    const ln = steps[lastNonSpace];
    if (ln && ln.space === true && Object.keys(ln).length === 1) {
      lastNonSpace--;
    } else {
      break;
    }
  }
  return steps.slice(0, lastNonSpace + 1);
}

export function compressTrackClipboardSteps(steps: TrackClipboardStep[]): TrackClipboardStep[] {
  const trimmedSteps = trimTrailingPureSpaces(steps);
  const compressedSteps: TrackClipboardStep[] = [];

  type RunType = 'none' | 'space' | 'volume-space';
  let runType: RunType = 'none';
  let runCount = 0;
  let runVolume = 0;

  const flushRun = () => {
    if (runCount <= 0) return;
    if (runType === 'space') {
      compressedSteps.push({ space: runCount });
    } else if (runType === 'volume-space') {
      if (runCount === 1) {
        compressedSteps.push({ volume: runVolume });
      } else {
        compressedSteps.push({ space: runCount, volume: runVolume });
      }
    }
    runType = 'none';
    runCount = 0;
  };

  const isPureSpace = (ln: TrackClipboardStep) => ln && ln.space === true && Object.keys(ln).length === 1;

  const isVolumeSpace = (ln: TrackClipboardStep) =>
    ln && ln.space === 1 && typeof ln.volume === 'number' && Object.keys(ln).length === 2;

  for (const ln of trimmedSteps) {
    if (isPureSpace(ln)) {
      if (runType === 'space') {
        runCount++;
      } else {
        flushRun();
        runType = 'space';
        runCount = 1;
      }
    } else if (isVolumeSpace(ln)) {
      const vol = ln.volume ?? 0;
      if (runType === 'volume-space' && vol === runVolume) {
        runCount++;
      } else {
        flushRun();
        runType = 'volume-space';
        runVolume = vol;
        runCount = 1;
      }
    } else {
      flushRun();
      compressedSteps.push(ln);
    }
  }

  flushRun();
  return compressedSteps;
}

export function serializeTrackClipboardYaml(steps: TrackClipboardStep[]): string {
  const exportData = { step: steps };
  let yamlContent = yaml.dump(exportData, {
    indent: 2,
    lineWidth: -1,
    quotingType: '"',
  });

  const noteLineRegex = /^(\s*-\s+|\s+)(note):\s*(.+)$/gm;
  yamlContent = yamlContent.replace(noteLineRegex, (_match, indent, key, value) => {
    let inner = String(value).trim();
    if ((inner.startsWith('"') && inner.endsWith('"')) || (inner.startsWith("'") && inner.endsWith("'"))) {
      inner = inner.slice(1, -1);
    }
    return `${indent}${key}: "${inner}"`;
  });

  return yamlContent;
}

export function parseTrackClipboardYaml(text: string): { steps: TrackClipboardStep[] } | { error: string } {
  let parsed: unknown;
  try {
    parsed = yaml.load(text);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { error: 'Failed to parse track data from clipboard.\n\n' + message };
  }

  const stepNode = parsed && typeof parsed === 'object' ? (parsed as { step?: unknown }).step ?? null : null;
  if (!Array.isArray(stepNode)) {
    return { error: 'Track clipboard data is invalid.\n\nExpected YAML with root "step" list.' };
  }

  const rawSteps = stepNode as unknown[];
  const expandedSteps: TrackClipboardStep[] = [];

  for (const node of rawSteps) {
    if (node && typeof node === 'object') {
      const ln = node as TrackClipboardStep;
      const keys = Object.keys(ln);
      const hasVolume = Object.prototype.hasOwnProperty.call(ln, 'volume');
      const onlySpaceOrOff = keys.every((k) => k === 'space' || k === 'off');
      const onlySpaceOffVolume = keys.every((k) => k === 'space' || k === 'off' || k === 'volume');

      const spaceVal = ln.space;
      const offVal = ln.off;
      const isNumericSpace = typeof spaceVal === 'number' && Number.isFinite(spaceVal) && spaceVal > 0;
      const isNumericOff = typeof offVal === 'number' && Number.isFinite(offVal) && offVal > 0;

      if (!hasVolume && onlySpaceOrOff && (isNumericSpace || isNumericOff)) {
        const count = (isNumericSpace ? spaceVal : offVal) as number;
        const isOff = isNumericOff && !isNumericSpace;
        for (let i = 0; i < count; i++) {
          expandedSteps.push(isOff ? { note: 'OFF' } : { space: true });
        }
        continue;
      }

      if (hasVolume && onlySpaceOffVolume && (isNumericSpace || isNumericOff)) {
        const count = (isNumericSpace ? spaceVal : offVal) as number;
        const isOff = isNumericOff && !isNumericSpace;
        const vol = ln.volume;
        for (let i = 0; i < count; i++) {
          expandedSteps.push(isOff ? { note: 'OFF', volume: vol } : { space: true, volume: vol });
        }
        continue;
      }
    }

    expandedSteps.push(node as TrackClipboardStep);
  }

  return { steps: expandedSteps };
}

export function isTrackLineEmptyForClipboard(line: PatternLine | undefined): boolean {
  if (!line) {
    return true;
  }

  if (line.trackA) {
    return false;
  }

  const vol = (line as PatternLine).volume;
  return vol === undefined || vol === null;
}

export function isClipboardStepEmpty(ln: TrackClipboardStep | null | undefined): boolean {
  if (!ln) {
    return true;
  }

  const hasNote = typeof ln.note === 'string' && ln.note.trim() !== '';
  const hasVolume = ln.volume !== undefined && ln.volume !== null;
  const keys = Object.keys(ln);
  const otherKeys = keys.filter(
    (key) => key !== 'note' && key !== 'instrument' && key !== 'space' && key !== 'off' && key !== 'volume'
  );
  const hasOther = otherKeys.length > 0;

  return !hasNote && !hasVolume && !hasOther;
}

export function applyClipboardStepToTrackLine(args: {
  baseLine: PatternLine;
  step: TrackClipboardStep;
  lineIndex: number;
  parseBaseKeyString: (value?: string) => { note: string; octave: number } | null;
}): { line: PatternLine } | { error: string } {
  const line: PatternLine = {
    trackA: args.baseLine.trackA,
    trackB: args.baseLine.trackB,
    trackC: args.baseLine.trackC,
  };

  const rawNote = args.step.note;
  const isOffNote = typeof rawNote === 'string' && rawNote.trim().toUpperCase() === 'OFF';

  if (isOffNote) {
    line.trackA = { note: '===', octave: 0, instrument: '00' };
  } else if (args.step.space === true) {
    line.trackA = null;
  } else if (typeof rawNote === 'string') {
    const parsedKey = args.parseBaseKeyString(rawNote);
    if (!parsedKey) {
      return {
        error: `Invalid note value "${rawNote}" in track clipboard data at line ${args.lineIndex}.`,
      };
    }

    const instId =
      typeof args.step.instrument === 'string' && args.step.instrument.trim()
        ? args.step.instrument.trim().toUpperCase()
        : '00';

    line.trackA = {
      note: parsedKey.note,
      octave: parsedKey.octave,
      instrument: instId,
    };
  } else {
    line.trackA = null;
  }

  const volRaw = args.step.volume;
  if (volRaw !== undefined && volRaw !== null) {
    const volNum = Number(volRaw);
    if (Number.isFinite(volNum)) {
      const clamped = Math.max(0, Math.min(0x0f, Math.floor(volNum)));
      line.volume = clamped;
    }
  }

  return { line };
}

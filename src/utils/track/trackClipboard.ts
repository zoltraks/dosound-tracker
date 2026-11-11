import yaml from 'js-yaml';
import type { Pattern, Step } from '../../synth/SoundDriver.ts';
import { clampVolumeNibble } from '../panel/volumeUtils.ts';
import { PATTERN_LENGTH, MAX_PATTERN_LENGTH } from '../../constants/music.ts';
import { assertImportSize } from '../validation/importSize.ts';
import { expandRunNodes } from '../yaml/runLength.ts';
import { quoteYamlValues, YAML_DUMP_OPTIONS } from '../yaml/yamlUtils.ts';
import { createNoteOff } from './trackPanelUtils.ts';
import { normalizeInstrumentId } from '../instrument/instrumentSelection.ts';

export type TrackClipboardStep = {
  wait?: boolean | number;
  space?: boolean | number;
  off?: boolean | number;
  note?: string;
  instrument?: string;
  volume?: number;
  [key: string]: unknown;
};

export type TrackPasteMode = 'replace' | 'overwriteAll' | 'overwriteEmpty';

export function generateClipboardData(
  pattern: Pattern,
  patternLength: number,
  formatNoteKey: (note: string, octave: number) => string,
): string {
  const targetLength = patternLength || PATTERN_LENGTH;
  const rawLines = pattern.step || [];
  const steps: TrackClipboardStep[] = [];

  for (let i = 0; i < targetLength; i++) {
    const line: Step = rawLines[i] || { note: null };

    const cell = line.note;
    const volRaw = line.volume;
    const hasVolume = volRaw !== undefined && volRaw !== null;

    let step: TrackClipboardStep;

    if (!cell) {
      step = { wait: hasVolume ? 1 : true };
    } else if (cell.note === '===') {
      step = { note: 'OFF' };
    } else {
      const noteText = formatNoteKey(cell.note, cell.octave);
      step = {
        note: noteText,
        instrument: cell.instrument,
      };
    }

    if (hasVolume) {
      const volNum = Number(volRaw);
      if (Number.isFinite(volNum)) {
        step.volume = clampVolumeNibble(volNum);
      }
    }

    steps.push(step);
  }

  let lastNonSpace = steps.length - 1;
  while (lastNonSpace >= 0) {
    const ln = steps[lastNonSpace];
    if (ln && ln.wait === true && Object.keys(ln).length === 1) {
      lastNonSpace--;
    } else {
      break;
    }
  }

  const trimmedSteps = steps.slice(0, lastNonSpace + 1);
  const compressedSteps: TrackClipboardStep[] = [];

  type RunType = 'none' | 'space' | 'volume-space';
  let runType: RunType = 'none';
  let runCount = 0;
  let runVolume = 0;

  const flushRun = () => {
    if (runCount <= 0) return;
    if (runType === 'space') {
      compressedSteps.push({ wait: runCount });
    } else if (runType === 'volume-space') {
      if (runCount === 1) {
        compressedSteps.push({ volume: runVolume });
      } else {
        compressedSteps.push({ wait: runCount, volume: runVolume });
      }
    }
    runType = 'none';
    runCount = 0;
  };

  const isPureSpace = (ln: TrackClipboardStep) =>
    ln && ln.wait === true && Object.keys(ln).length === 1;

  const isVolumeSpace = (ln: TrackClipboardStep) =>
    ln && ln.wait === 1 && typeof ln.volume === 'number' && Object.keys(ln).length === 2;

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

  const exportData = { step: compressedSteps };
  const yamlContent = yaml.dump(exportData, YAML_DUMP_OPTIONS);

  return quoteYamlValues(yamlContent, 'note');
}

export function parseClipboardData(text: string): TrackClipboardStep[] {
  assertImportSize(text, 'Clipboard data');

  let parsed: unknown;
  try {
    parsed = yaml.load(text);
  } catch (error) {
    throw new Error(
      'Failed to parse YAML: ' + (error instanceof Error ? error.message : String(error)),
      { cause: error },
    );
  }

  const stepNode =
    parsed && typeof parsed === 'object' ? ((parsed as { step?: unknown }).step ?? null) : null;

  if (!Array.isArray(stepNode)) {
    throw new Error('Invalid clipboard data: missing "step" list');
  }

  const rawSteps = stepNode as unknown[];

  return expandRunNodes<TrackClipboardStep>(
    rawSteps,
    MAX_PATTERN_LENGTH,
    (volume) => (volume === undefined ? { wait: true } : { wait: true, volume }),
    (volume) => (volume === undefined ? { note: 'OFF' } : { note: 'OFF', volume }),
  );
}

export function applyClipboardToLines(
  existingLines: Step[],
  steps: TrackClipboardStep[],
  mode: TrackPasteMode,
  patternLength: number,
  parseBaseKeyString: (value?: string) => { note: string; octave: number } | null,
): Step[] {
  const targetLength = patternLength || PATTERN_LENGTH;

  const isLineEmptyForTrack = (line: Step | undefined): boolean => {
    if (!line) return true;
    if (line.note) return false;
    const vol = line.volume;
    return vol === undefined || vol === null;
  };

  const isStepEmpty = (ln: TrackClipboardStep | null | undefined): boolean => {
    if (!ln) return true;
    const hasNote = typeof ln.note === 'string' && ln.note.trim() !== '';
    const hasVolume = ln.volume !== undefined && ln.volume !== null;
    const keys = Object.keys(ln);
    const otherKeys = keys.filter(
      (key) =>
        key !== 'note' &&
        key !== 'instrument' &&
        key !== 'wait' &&
        key !== 'space' &&
        key !== 'off' &&
        key !== 'volume',
    );
    const hasOther = otherKeys.length > 0;
    return !hasNote && !hasVolume && !hasOther;
  };

  const applyClipboardStepToLine = (
    baseLine: Step,
    ln: TrackClipboardStep,
    lineIndex: number,
  ): Step => {
    const line: Step = {
      note: baseLine.note,
    };

    const rawNote = ln.note;
    const isOffNote = typeof rawNote === 'string' && rawNote.trim().toUpperCase() === 'OFF';

    if (isOffNote) {
      line.note = createNoteOff();
    } else if (ln.wait === true || ln.space === true) {
      line.note = null;
    } else if (typeof rawNote === 'string') {
      const parsedKey = parseBaseKeyString(rawNote);
      if (!parsedKey) {
        throw new Error(
          `Invalid note value "${rawNote}" in track clipboard data at line ${lineIndex}.`,
        );
      }

      const instId =
        typeof ln.instrument === 'string' && ln.instrument.trim()
          ? normalizeInstrumentId(ln.instrument)
          : '00';

      const noteObj = {
        note: parsedKey.note,
        octave: parsedKey.octave,
        instrument: instId,
      };

      line.note = noteObj;
    } else {
      line.note = null;
    }

    const volRaw = ln.volume;
    if (volRaw !== undefined && volRaw !== null) {
      const volNum = Number(volRaw);
      if (Number.isFinite(volNum)) {
        line.volume = clampVolumeNibble(volNum);
      }
    }

    return line;
  };

  const newLines: Step[] = [];

  for (let i = 0; i < targetLength; i++) {
    const baseLine = existingLines[i] || { note: null };

    const rawStep = i < steps.length ? steps[i] : undefined;

    if (mode === 'replace') {
      if (rawStep && typeof rawStep === 'object') {
        newLines.push(applyClipboardStepToLine(baseLine, rawStep, i));
      } else {
        newLines.push({ ...baseLine, note: null, volume: undefined });
      }
    } else if (mode === 'overwriteAll') {
      if (!rawStep || isStepEmpty(rawStep)) {
        newLines.push({ ...baseLine });
      } else {
        newLines.push(applyClipboardStepToLine(baseLine, rawStep, i));
      }
    } else {
      // overwriteEmpty
      if (!isLineEmptyForTrack(baseLine)) {
        newLines.push({ ...baseLine });
      } else if (rawStep && !isStepEmpty(rawStep)) {
        newLines.push(applyClipboardStepToLine(baseLine, rawStep, i));
      } else {
        newLines.push({ ...baseLine });
      }
    }
  }

  return newLines;
}

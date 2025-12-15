import yaml from 'js-yaml';
import type { Pattern, PatternLine } from '../synth/SoundDriver';
import { PATTERN_LENGTH } from '../constants/music';

export type TrackClipboardStep = {
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
  formatNoteKey: (note: string, octave: number) => string
): string {
  const targetLength = patternLength || PATTERN_LENGTH;
  const rawLines = pattern.lines || [];
  const steps: TrackClipboardStep[] = [];

  for (let i = 0; i < targetLength; i++) {
    const line: PatternLine = rawLines[i] || { trackA: null, trackB: null, trackC: null };
    // We assume the trackId passed allows us to select the correct cell, 
    // BUT PatternLine only has trackA, trackB, trackC properties if we map them.
    // However, the caller usually passes the relevant pattern for the *active* track 
    // and often only looks at 'trackA' of that pattern if the pattern structure is per-track?
    // Wait, looking at `useTrackOperations.ts`:
    // `const cell = line.trackA;` 
    // It seems `getCurrentPatternForTrack` returns a pattern where `trackA` is the relevant data?
    // Let's check `useTrackOperations.ts` copy logic again.
    // It does `const cell = line.trackA;` unconditionally.
    // So yes, we just look at trackA of the lines provided.
    
    const cell = line.trackA;
    const volRaw = line.volume;
    const hasVolume = volRaw !== undefined && volRaw !== null;

    let step: TrackClipboardStep;

    if (!cell) {
      step = { space: hasVolume ? 1 : true };
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
        const clamped = Math.max(0, Math.min(0x0f, Math.floor(volNum)));
        step.volume = clamped;
      }
    }

    steps.push(step);
  }

  let lastNonSpace = steps.length - 1;
  while (lastNonSpace >= 0) {
    const ln = steps[lastNonSpace];
    if (ln && ln.space === true && Object.keys(ln).length === 1) {
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

  const isPureSpace = (ln: TrackClipboardStep) =>
    ln && ln.space === true && Object.keys(ln).length === 1;

  const isVolumeSpace = (ln: TrackClipboardStep) =>
    ln &&
    ln.space === 1 &&
    typeof ln.volume === 'number' &&
    Object.keys(ln).length === 2;

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
  const yamlContent = yaml.dump(exportData, {
    indent: 2,
    lineWidth: -1,
    quotingType: '"',
  });

  const quoteNoteValues = (text: string): string => {
    const noteLineRegex = /^(\s*-\s+|\s+)(note):\s*(.+)$/gm;
    return text.replace(noteLineRegex, (_match, indent, key, value) => {
      let inner = String(value).trim();
      if (
        (inner.startsWith('"') && inner.endsWith('"')) ||
        (inner.startsWith("'") && inner.endsWith("'"))
      ) {
        inner = inner.slice(1, -1);
      }
      return `${indent}${key}: "${inner}"`;
    });
  };

  return quoteNoteValues(yamlContent);
}

export function parseClipboardData(text: string): TrackClipboardStep[] {
  let parsed: unknown;
  try {
    parsed = yaml.load(text);
  } catch (error) {
    throw new Error('Failed to parse YAML: ' + (error instanceof Error ? error.message : String(error)));
  }

  const stepNode =
    parsed && typeof parsed === 'object' ? (parsed as { step?: unknown }).step ?? null : null;
  
  if (!Array.isArray(stepNode)) {
    throw new Error('Invalid clipboard data: missing "step" list');
  }

  const rawSteps = stepNode as unknown[];
  const expandedSteps: TrackClipboardStep[] = [];

  for (const node of rawSteps) {
    if (node && typeof node === 'object') {
      const ln = node as TrackClipboardStep;
      const keys = Object.keys(ln);
      const hasVolume = Object.prototype.hasOwnProperty.call(ln, 'volume');
      const onlySpaceOrOff = keys.every(k => k === 'space' || k === 'off');
      const onlySpaceOffVolume = keys.every(
        k => k === 'space' || k === 'off' || k === 'volume'
      );

      const spaceVal = ln.space;
      const offVal = ln.off;
      const isNumericSpace =
        typeof spaceVal === 'number' && Number.isFinite(spaceVal) && spaceVal > 0;
      const isNumericOff =
        typeof offVal === 'number' && Number.isFinite(offVal) && offVal > 0;

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
          expandedSteps.push(
            isOff ? { note: 'OFF', volume: vol } : { space: true, volume: vol }
          );
        }
        continue;
      }
    }

    expandedSteps.push(node as TrackClipboardStep);
  }

  return expandedSteps;
}

export function applyClipboardToLines(
  existingLines: PatternLine[],
  steps: TrackClipboardStep[],
  mode: TrackPasteMode,
  patternLength: number,
  parseBaseKeyString: (value?: string) => { note: string; octave: number } | null
): PatternLine[] {
  const targetLength = patternLength || PATTERN_LENGTH;
  
  const isLineEmptyForTrack = (line: PatternLine | undefined): boolean => {
    if (!line) return true;
    if (line.trackA) return false;
    const vol = line.volume;
    return vol === undefined || vol === null;
  };

  const isStepEmpty = (ln: TrackClipboardStep | null | undefined): boolean => {
    if (!ln) return true;
    const hasNote = typeof ln.note === 'string' && ln.note.trim() !== '';
    const hasVolume = ln.volume !== undefined && ln.volume !== null;
    const keys = Object.keys(ln);
    const otherKeys = keys.filter(
      key => key !== 'note' && key !== 'instrument' && key !== 'space' && key !== 'off' && key !== 'volume'
    );
    const hasOther = otherKeys.length > 0;
    return !hasNote && !hasVolume && !hasOther;
  };

  const applyClipboardStepToLine = (
    baseLine: PatternLine,
    ln: TrackClipboardStep,
    lineIndex: number
  ): PatternLine => {
    const line: PatternLine = {
      trackA: baseLine.trackA,
      trackB: baseLine.trackB,
      trackC: baseLine.trackC,
    };

    const rawNote = ln.note;
    const isOffNote =
      typeof rawNote === 'string' && rawNote.trim().toUpperCase() === 'OFF';

    if (isOffNote) {
      line.trackA = { note: '===', octave: 0, instrument: '00' };
    } else if (ln.space === true) {
      line.trackA = null;
    } else if (typeof rawNote === 'string') {
      const parsedKey = parseBaseKeyString(rawNote);
      if (!parsedKey) {
        throw new Error(`Invalid note value "${rawNote}" in track clipboard data at line ${lineIndex}.`);
      }

      const instId =
        typeof ln.instrument === 'string' && ln.instrument.trim()
          ? ln.instrument.trim().toUpperCase()
          : '00';

      const noteObj = {
        note: parsedKey.note,
        octave: parsedKey.octave,
        instrument: instId,
      };

      line.trackA = noteObj;
    } else {
      line.trackA = null;
    }

    const volRaw = ln.volume;
    if (volRaw !== undefined && volRaw !== null) {
      const volNum = Number(volRaw);
      if (Number.isFinite(volNum)) {
        const clamped = Math.max(0, Math.min(0x0f, Math.floor(volNum)));
        line.volume = clamped;
      }
    }

    return line;
  };

  const newLines: PatternLine[] = [];

  for (let i = 0; i < targetLength; i++) {
    const baseLine = existingLines[i] || { trackA: null, trackB: null, trackC: null };
    
    // In replace mode, we take the step if available (or default empty), otherwise we fallback to what?
    // Original logic: "if (mode === 'replace') { ... const rawStep = expandedSteps[i]; ... }"
    // It constructed a completely new line based on step, defaulting to null if step was missing/emptyish?
    // Actually for 'replace' it seems to wipe out anything not in the clipboard if clipboard is shorter?
    // Let's re-read original 'replace' loop.
    // It creates `const line: PatternLine = { ... }` from scratch (copying trackB/C from baseLine but resetting trackA/volume?).
    // Yes: `line.trackA = ...` or `line.trackA = null`.
    // So 'replace' effectively overwrites trackA and volume for the length of the clipboard? 
    // And if `i >= expandedSteps.length`, `rawStep` is undefined -> `line.trackA = null`.
    // So 'replace' clears the track for the whole pattern length?
    
    const rawStep = i < steps.length ? steps[i] : undefined;
    
    if (mode === 'replace') {
      if (rawStep && typeof rawStep === 'object') {
        newLines.push(applyClipboardStepToLine(baseLine, rawStep, i));
      } else {
        // Clear line
        newLines.push({ ...baseLine, trackA: null, volume: undefined }); 
        // Note: Original code set volume to clamped if exists, else it didn't touch it?
        // Wait, original 'replace' else block: `line.trackA = null;` and `newLines.push(line)`.
        // `line` was initialized with `trackA: baseLine.trackA`. 
        // But `line.trackA` was overwritten in if/else blocks. 
        // If `rawStep` undefined, it went to `else { line.trackA = null }`.
        // And volume? `line.volume` was not set in else block.
        // `line` was initialized as `{ trackA: baseLine.trackA, ... }` but `volume` property wasn't copied from baseLine?
        // `const line: PatternLine = { trackA: baseLine.trackA, ... }`
        // It didn't copy `volume` from baseLine explicitly in the `line` init.
        // `baseLine` has `volume`. PatternLine has `volume`.
        // `existingLines[i]` has volume.
        // `const line: PatternLine = { trackA: baseLine.trackA, trackB: baseLine.trackB, trackC: baseLine.trackC }`
        // Volume is missing from init! So volume is `undefined` by default in `line`.
        // So 'replace' CLEARS volume if not present in step.
      }
    } else if (mode === 'overwriteAll') {
      if (!rawStep || isStepEmpty(rawStep)) {
        newLines.push({ ...baseLine });
      } else {
        newLines.push(applyClipboardStepToLine(baseLine, rawStep, i));
      }
    } else { // overwriteEmpty
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

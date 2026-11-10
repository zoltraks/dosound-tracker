import type { Step } from '../../synth/SoundDriver.ts';
import { PATTERN_LENGTH } from '../../constants/music.ts';
import { Formatter } from '../format/formatters.ts';
import { asPatternId } from '../../types/branded.ts';
import type { PatternId } from '../../types/branded.ts';

export function normalizePatternId(value?: string | number | null): PatternId {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return asPatternId(Formatter.hex(value));
  }

  if (typeof value === 'string') {
    return asPatternId(value.trim().toUpperCase());
  }

  return asPatternId('');
}

export function insertPatternStep(
  lines: Step[],
  insertIndex: number,
  patternLength: number,
): Step[] {
  const totalLines = patternLength || PATTERN_LENGTH;
  const safeIndex = Math.max(0, Math.min(insertIndex, totalLines - 1));

  const newLines = [...lines];
  while (newLines.length < totalLines) {
    newLines.push({
      note: null,
    });
  }

  // We only shift trackA property to match existing behavior
  for (let i = totalLines - 1; i > safeIndex; i--) {
    const from = newLines[i - 1] || { note: null };
    const base = newLines[i] || { note: null };

    newLines[i] = {
      ...base,
      note: from.note,
    };
  }

  const base = newLines[safeIndex] || { note: null };
  newLines[safeIndex] = {
    ...base,
    note: null,
  };

  return newLines;
}

export function deletePatternStep(
  lines: Step[],
  deleteIndex: number,
  patternLength: number,
): Step[] {
  const totalLines = patternLength || PATTERN_LENGTH;
  const safeIndex = Math.max(0, Math.min(deleteIndex, totalLines - 1));

  const newLines = [...lines];
  while (newLines.length < totalLines) {
    newLines.push({
      note: null,
    });
  }

  // We only shift trackA property to match existing behavior
  for (let i = safeIndex; i < totalLines - 1; i++) {
    const from = newLines[i + 1] || { note: null };
    const base = newLines[i] || { note: null };

    newLines[i] = {
      ...base,
      note: from.note,
    };
  }

  const lastIndex = totalLines - 1;
  const lastBase = newLines[lastIndex] || { note: null };
  newLines[lastIndex] = {
    ...lastBase,
    note: null,
  };

  return newLines;
}

import type { Step } from '../synth/SoundDriver';
import { PATTERN_LENGTH } from '../constants/music';

export function insertPatternStep(
  lines: Step[],
  insertIndex: number,
  patternLength: number
): Step[] {
  const totalLines = patternLength || PATTERN_LENGTH;
  const safeIndex = Math.max(0, Math.min(insertIndex, totalLines - 1));
  
  // Clone lines to avoid mutation, filling up to totalLines if necessary
  const newLines = [...lines];
  while (newLines.length < totalLines) {
    newLines.push({
      A: null,
      B: null,
      C: null,
    });
  }

  // Shift lines down, starting from the end
  // We only shift trackA property to match existing behavior
  for (let i = totalLines - 1; i > safeIndex; i--) {
    const from = newLines[i - 1] || { A: null, B: null, C: null };
    const base = newLines[i] || { A: null, B: null, C: null };
    
    newLines[i] = {
      ...base,
      A: from.A,
    };
  }

  // Clear the inserted line
  const base = newLines[safeIndex] || { A: null, B: null, C: null };
  newLines[safeIndex] = {
    ...base,
    A: null,
  };

  return newLines;
}

export function deletePatternStep(
  lines: Step[],
  deleteIndex: number,
  patternLength: number
): Step[] {
  const totalLines = patternLength || PATTERN_LENGTH;
  const safeIndex = Math.max(0, Math.min(deleteIndex, totalLines - 1));
  
  // Clone lines
  const newLines = [...lines];
  while (newLines.length < totalLines) {
    newLines.push({
      A: null,
      B: null,
      C: null,
    });
  }

  // Shift lines up
  // We only shift trackA property to match existing behavior
  for (let i = safeIndex; i < totalLines - 1; i++) {
    const from = newLines[i + 1] || { A: null, B: null, C: null };
    const base = newLines[i] || { A: null, B: null, C: null };
    
    newLines[i] = {
      ...base,
      A: from.A,
    };
  }

  // Clear the last line
  const lastIndex = totalLines - 1;
  const lastBase = newLines[lastIndex] || { A: null, B: null, C: null };
  newLines[lastIndex] = {
    ...lastBase,
    A: null,
  };

  return newLines;
}

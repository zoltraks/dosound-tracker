import type { PatternLine } from '../synth/SoundDriver';
import { PATTERN_LENGTH } from '../constants/music';

export function insertPatternStep(
  lines: PatternLine[],
  insertIndex: number,
  patternLength: number
): PatternLine[] {
  const totalLines = patternLength || PATTERN_LENGTH;
  const safeIndex = Math.max(0, Math.min(insertIndex, totalLines - 1));
  
  // Clone lines to avoid mutation, filling up to totalLines if necessary
  const newLines = [...lines];
  while (newLines.length < totalLines) {
    newLines.push({
      trackA: null,
      trackB: null,
      trackC: null,
    });
  }

  // Shift lines down, starting from the end
  // We only shift trackA property to match existing behavior
  for (let i = totalLines - 1; i > safeIndex; i--) {
    const from = newLines[i - 1] || { trackA: null, trackB: null, trackC: null };
    const base = newLines[i] || { trackA: null, trackB: null, trackC: null };
    
    newLines[i] = {
      ...base,
      trackA: from.trackA,
    };
  }

  // Clear the inserted line
  const base = newLines[safeIndex] || { trackA: null, trackB: null, trackC: null };
  newLines[safeIndex] = {
    ...base,
    trackA: null,
  };

  return newLines;
}

export function deletePatternStep(
  lines: PatternLine[],
  deleteIndex: number,
  patternLength: number
): PatternLine[] {
  const totalLines = patternLength || PATTERN_LENGTH;
  const safeIndex = Math.max(0, Math.min(deleteIndex, totalLines - 1));
  
  // Clone lines
  const newLines = [...lines];
  while (newLines.length < totalLines) {
    newLines.push({
      trackA: null,
      trackB: null,
      trackC: null,
    });
  }

  // Shift lines up
  // We only shift trackA property to match existing behavior
  for (let i = safeIndex; i < totalLines - 1; i++) {
    const from = newLines[i + 1] || { trackA: null, trackB: null, trackC: null };
    const base = newLines[i] || { trackA: null, trackB: null, trackC: null };
    
    newLines[i] = {
      ...base,
      trackA: from.trackA,
    };
  }

  // Clear the last line
  const lastIndex = totalLines - 1;
  const lastBase = newLines[lastIndex] || { trackA: null, trackB: null, trackC: null };
  newLines[lastIndex] = {
    ...lastBase,
    trackA: null,
  };

  return newLines;
}

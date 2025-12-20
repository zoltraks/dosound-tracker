import type { NavigationSection } from '../constants/navigation';

export { clampOctave, getKeyboardMappedNote } from './keyboardNoteMapping';

export function isNavigationKey(keyUpper: string): boolean {
  return (
    keyUpper === 'ARROWUP' ||
    keyUpper === 'ARROWDOWN' ||
    keyUpper === 'ARROWLEFT' ||
    keyUpper === 'ARROWRIGHT' ||
    keyUpper === 'PAGEUP' ||
    keyUpper === 'PAGEDOWN' ||
    keyUpper === 'HOME' ||
    keyUpper === 'END'
  );
}

export function wrapIndex(index: number, patternLength: number): number {
  const length = Math.max(1, patternLength || 1);
  return ((index % length) + length) % length;
}

export function stepLineIndex(currentLine: number, patternLength: number, delta: number): number {
  return wrapIndex(currentLine + delta, patternLength);
}

export function getPreviousTrackSection(trackId: 'A' | 'B' | 'C'): NavigationSection {
  if (trackId === 'A') return 'trackC';
  if (trackId === 'B') return 'trackA';
  return 'trackB';
}

export function getNextTrackSection(trackId: 'A' | 'B' | 'C'): NavigationSection {
  if (trackId === 'A') return 'trackB';
  if (trackId === 'B') return 'trackC';
  return 'trackA';
}

export function parseVolumeNibble(keyUpper: string): number | null {
  if (!/^[0-9A-F]$/.test(keyUpper)) {
    return null;
  }
  const value = parseInt(keyUpper, 16);
  if (!Number.isFinite(value)) {
    return null;
  }
  return Math.max(0, Math.min(0x0f, value));
}

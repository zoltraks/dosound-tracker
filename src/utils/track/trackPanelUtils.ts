import type { NavigationSection } from '../../constants/navigation.ts';
import type { Note, Pattern, Step, SongChannelId } from '../../synth/SoundDriver.ts';
import { SONG_CHANNEL_IDS } from '../../constants/song.ts';

import { clampVolumeNibble } from '../panel/volumeUtils.ts';

export { clampOctave, getKeyboardMappedNote } from '../keyboard/keyboardNoteMapping.ts';

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

// Arrow-key track hops cycle through the song's navigable channels - A-C on
// a single-chip setup, A-F once the second chip is enabled - wrapping at the
// ends. The three-track view slides its window to keep the target visible.
function trackSectionAt(
  trackId: SongChannelId,
  channelCount: number,
  delta: number,
): NavigationSection {
  const ids = SONG_CHANNEL_IDS.slice(0, Math.max(1, channelCount));
  const index = Math.max(0, ids.indexOf(trackId));
  const next = ids[(index + delta + ids.length) % ids.length];
  return `track${next}` as NavigationSection;
}

export function getPreviousTrackSection(
  trackId: SongChannelId,
  channelCount = 3,
): NavigationSection {
  return trackSectionAt(trackId, channelCount, -1);
}

export function getNextTrackSection(trackId: SongChannelId, channelCount = 3): NavigationSection {
  return trackSectionAt(trackId, channelCount, 1);
}

function ensureStep(step: Step | null | undefined): Step {
  if (!step) {
    return { note: null };
  }
  return { ...step };
}

export function updatePatternStep(
  pattern: Pattern,
  lineIndex: number,
  updater: (step: Step) => Step,
): Pattern {
  const newPattern = { ...pattern };
  newPattern.step = [...newPattern.step];

  const existing = ensureStep(newPattern.step[lineIndex]);
  const nextStep = updater(existing);
  newPattern.step[lineIndex] = nextStep;

  return newPattern;
}

export function createNoteOff(): Note {
  return { note: '===', octave: 0, instrument: '00' };
}

export function parseVolumeNibble(keyUpper: string): number | null {
  if (!/^[0-9A-F]$/.test(keyUpper)) {
    return null;
  }
  const value = parseInt(keyUpper, 16);
  if (!Number.isFinite(value)) {
    return null;
  }
  return clampVolumeNibble(value);
}

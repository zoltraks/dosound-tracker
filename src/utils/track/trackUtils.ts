import type { Pattern, Step } from '../../synth/SoundDriver.ts';
import { PATTERN_LENGTH } from '../../constants/music.ts';
import { clampVolumeNibble } from '../panel/volumeUtils.ts';

const DEFAULT_VOLUME = 0x0f;

export function resolvePatternLength(songLength: number | undefined): number {
  return songLength || PATTERN_LENGTH;
}

export function emptyTrackStep(): Step {
  return { note: null } as Step;
}

export function cloneTrackStep(step: Step): Step {
  return {
    note: step.note ? { ...step.note } : null,
    ...(step.volume !== undefined ? { volume: step.volume } : {}),
  };
}

export function getClipboardApiOrReport(
  kind: 'read' | 'write',
  onError: (message: string) => void,
): Clipboard | null {
  const api = typeof navigator === 'undefined' ? undefined : navigator.clipboard;
  if (!api || (kind === 'write' ? !api.writeText : !api.readText)) {
    onError('Clipboard API is not available in this browser.');
    return null;
  }
  return api;
}

export function computeEffectiveVolume(pattern: Pattern | null, currentLine: number): number {
  if (!pattern) return DEFAULT_VOLUME;

  const lines = (pattern.step ??
    (pattern as unknown as { lines?: Pattern['step'] }).lines ??
    []) as Pattern['step'];
  if (lines.length === 0) return DEFAULT_VOLUME;

  const maxIndex = Math.min(currentLine, lines.length - 1);
  let current = DEFAULT_VOLUME;

  for (let i = 0; i <= maxIndex; i += 1) {
    const line = lines[i];
    const vol = line?.volume;
    if (vol !== undefined && vol !== null) {
      current = clampVolumeNibble(vol);
    }
  }

  return current;
}

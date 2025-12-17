import { ENVELOPE_LENGTH, NOISE_MAX } from '../constants/music';
import type { EnvelopePanelType } from './envelopeTypes';
import { clampEnvelopeValue, getFullEnvelope } from './envelopeTypes';

export type RotateDirection = 'left' | 'right';

export function rotateEnvelopeData(
  envelopeData: number[],
  direction: RotateDirection,
  length: number = ENVELOPE_LENGTH
): number[] {
  const source = getFullEnvelope(envelopeData, length);

  if (direction === 'left') {
    return [...source.slice(1), source[0]];
  }

  return [source[length - 1], ...source.slice(0, length - 1)];
}

export function shiftEnvelopeDataValues(
  type: EnvelopePanelType,
  envelopeData: number[],
  delta: number,
  length: number = ENVELOPE_LENGTH
): number[] {
  const source = getFullEnvelope(envelopeData, length);
  return source.map(value => clampEnvelopeValue(type, value + delta));
}

export function repeatEnvelopePatternToLength(
  envelopeData: number[],
  endIndexInclusive: number,
  length: number = ENVELOPE_LENGTH
): number[] {
  const source = getFullEnvelope(envelopeData, length);
  const pattern = source.slice(0, Math.min(length, endIndexInclusive + 1));

  return Array.from({ length }, (_, index) => {
    return pattern.length > 0 ? pattern[index % pattern.length] : 0;
  });
}

export function getNextEnvelopePosition(currentPosition: number, length: number = ENVELOPE_LENGTH): number {
  return (currentPosition + 1) % length;
}

export function getMovedEnvelopePosition(
  currentPosition: number,
  direction: 'left' | 'right',
  length: number = ENVELOPE_LENGTH
): number {
  if (direction === 'left') {
    return Math.max(0, currentPosition - 1);
  }

  return Math.min(length - 1, currentPosition + 1);
}

export function parseEnvelopeHexValue(
  type: EnvelopePanelType,
  hexKey: string,
  shiftKey: boolean,
  noiseMax: number = NOISE_MAX
): number | null {
  if (!/^[0-9A-F]$/.test(hexKey)) {
    return null;
  }

  const raw = parseInt(hexKey, 16);

  if (type === 'volume') {
    return raw;
  }

  if (type === 'shift') {
    if (shiftKey && hexKey !== '0') {
      return -raw;
    }
    return raw;
  }

  if (type === 'noise') {
    if (shiftKey) {
      return Math.min(noiseMax, raw + 16);
    }
    return raw;
  }

  return null;
}

export function parseEnvelopeModeValue(keyUpper: string): number | null {
  if (keyUpper === 'T') return 0;
  if (keyUpper === 'N') return 1;
  if (keyUpper === 'B') return 2;
  return null;
}

export function copyEnvelopeValueFromLastPosition(
  envelopeData: number[],
  targetPosition: number,
  sourcePosition: number,
  length: number = ENVELOPE_LENGTH
): number[] {
  const source = getFullEnvelope(envelopeData, length);
  const next = [...source];
  next[targetPosition] = next[sourcePosition];
  return next;
}

export function toggleSustainIndex(
  currentPosition: number,
  sustainIndex: number | null | undefined
): number | null {
  const current = typeof sustainIndex === 'number' && sustainIndex >= 0 ? sustainIndex : null;
  return current === currentPosition ? null : currentPosition;
}

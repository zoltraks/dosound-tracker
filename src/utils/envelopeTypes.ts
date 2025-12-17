import {
  ENVELOPE_LENGTH,
  NOISE_MAX,
  PITCH_MAX,
  PITCH_MIN,
  SHIFT_MAX,
  SHIFT_MIN,
  VOLUME_MAX,
} from '../constants/music';

export type EnvelopePanelType = 'volume' | 'shift' | 'pitch' | 'noise' | 'mode';

export function getEnvelopeSectionName(type: EnvelopePanelType): EnvelopePanelType {
  return type === 'mode' ? 'mode' : type;
}

export function getEnvelopeTitle(type: EnvelopePanelType): string {
  switch (type) {
    case 'volume':
      return 'Volume';
    case 'shift':
      return 'Arpeggio';
    case 'pitch':
      return 'Pitch';
    case 'noise':
      return 'Noise';
    case 'mode':
      return 'Mode';
    default:
      return type;
  }
}

export function clampEnvelopeValue(type: EnvelopePanelType, value: number): number {
  switch (type) {
    case 'volume':
      return Math.max(0, Math.min(VOLUME_MAX, value));
    case 'noise':
      return Math.max(0, Math.min(NOISE_MAX, value));
    case 'shift':
      return Math.max(SHIFT_MIN, Math.min(SHIFT_MAX, value));
    case 'pitch':
      return Math.max(PITCH_MIN, Math.min(PITCH_MAX, value));
    case 'mode':
      return Math.max(0, Math.min(2, value));
    default:
      return value;
  }
}

export function applyEnvelopeDelta(
  type: EnvelopePanelType,
  currentValue: number,
  delta: number
): number {
  return clampEnvelopeValue(type, currentValue + delta);
}

export function getFullEnvelope(input: number[], length: number = ENVELOPE_LENGTH): number[] {
  const trimmed = input.slice(0, length);
  if (trimmed.length === 0) {
    return Array(length).fill(0);
  }
  const last = trimmed[trimmed.length - 1];
  while (trimmed.length < length) {
    trimmed.push(last);
  }
  return trimmed;
}

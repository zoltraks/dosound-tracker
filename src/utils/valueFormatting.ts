import type { EnvelopePanelType } from './envelopeTypes';

export function formatEnvelopeValue(type: EnvelopePanelType, value: number): string {
  switch (type) {
    case 'volume':
      return value.toString(16).toUpperCase();
    case 'noise':
      return value.toString(16).toUpperCase();
    case 'shift':
      return value >= 0 ? `+${value}` : value.toString();
    case 'pitch':
      return value >= 0 ? `+${value}` : value.toString();
    case 'mode':
      if (value === 0) return 'TONE';
      if (value === 1) return 'NOISE';
      return 'BOTH';
    default:
      return value.toString();
  }
}

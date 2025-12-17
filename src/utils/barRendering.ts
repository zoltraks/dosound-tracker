import {
  NOISE_MAX,
  PITCH_MAX,
  PITCH_MIN,
  SHIFT_MAX,
  SHIFT_MIN,
  VOLUME_MAX,
} from '../constants/music';
import type { EnvelopePanelType } from './envelopeTypes';

export function getEnvelopeBarHeight(type: EnvelopePanelType, value: number): number {
  switch (type) {
    case 'volume':
      return (value / VOLUME_MAX) * 100;
    case 'noise':
      return (value / NOISE_MAX) * 100;
    case 'shift':
      return (Math.abs(value) / Math.max(Math.abs(SHIFT_MIN), SHIFT_MAX)) * 100;
    case 'pitch':
      return (Math.abs(value) / Math.max(Math.abs(PITCH_MIN), PITCH_MAX)) * 100;
    case 'mode':
      return value * 100;
    default:
      return 0;
  }
}

export function getEnvelopeCenteredBarPosition(type: EnvelopePanelType, value: number): number {
  switch (type) {
    case 'shift':
      return 50 - (value / SHIFT_MAX) * 50;
    case 'pitch':
      return 50 - (value / PITCH_MAX) * 50;
    default:
      return 50;
  }
}

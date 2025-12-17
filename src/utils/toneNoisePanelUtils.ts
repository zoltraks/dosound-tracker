import { ENVELOPE_LENGTH } from '../constants/music';
import { clampEnvelopeValue } from './envelopeTypes';
import {
  getMovedEnvelopePosition,
  parseEnvelopeModeValue,
  rotateEnvelopeData,
  shiftEnvelopeDataValues,
} from './envelopePanelUtils';

export const MODE_ENVELOPE_LENGTH = ENVELOPE_LENGTH;

export function clampModeValue(value: number): number {
  return clampEnvelopeValue('mode', value);
}

export function cycleModeValue(value: number): number {
  return (value + 1) % 3;
}

export function parseToneNoiseModeKey(keyUpper: string): number | null {
  return parseEnvelopeModeValue(keyUpper);
}

export function getEmptyModeEnvelope(length: number = MODE_ENVELOPE_LENGTH): number[] {
  return Array(length).fill(0);
}

export function rotateModeEnvelopeData(data: number[], direction: 'left' | 'right'): number[] {
  return rotateEnvelopeData(data, direction, MODE_ENVELOPE_LENGTH);
}

export function shiftModeEnvelopeDataValues(data: number[], delta: number): number[] {
  return shiftEnvelopeDataValues('mode', data, delta, MODE_ENVELOPE_LENGTH);
}

export function getMovedModePosition(currentPosition: number, direction: 'left' | 'right'): number {
  return getMovedEnvelopePosition(currentPosition, direction, MODE_ENVELOPE_LENGTH);
}

export function getNextModePosition(currentPosition: number, length: number = MODE_ENVELOPE_LENGTH): number {
  return (currentPosition + 1) % length;
}

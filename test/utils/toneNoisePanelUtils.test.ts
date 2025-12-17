import { describe, expect, it } from 'vitest';
import {
  clampModeValue,
  cycleModeValue,
  getEmptyModeEnvelope,
  getMovedModePosition,
  getNextModePosition,
  parseToneNoiseModeKey,
  rotateModeEnvelopeData,
  shiftModeEnvelopeDataValues,
} from '../../src/utils/toneNoisePanelUtils';

describe('toneNoisePanelUtils', () => {
  it('clampModeValue clamps to 0..2', () => {
    expect(clampModeValue(-10)).toBe(0);
    expect(clampModeValue(0)).toBe(0);
    expect(clampModeValue(1)).toBe(1);
    expect(clampModeValue(2)).toBe(2);
    expect(clampModeValue(10)).toBe(2);
  });

  it('cycleModeValue cycles through 0..2', () => {
    expect(cycleModeValue(0)).toBe(1);
    expect(cycleModeValue(1)).toBe(2);
    expect(cycleModeValue(2)).toBe(0);
  });

  it('parseToneNoiseModeKey maps T/N/B', () => {
    expect(parseToneNoiseModeKey('T')).toBe(0);
    expect(parseToneNoiseModeKey('N')).toBe(1);
    expect(parseToneNoiseModeKey('B')).toBe(2);
    expect(parseToneNoiseModeKey('X')).toBeNull();
  });

  it('getEmptyModeEnvelope creates the default length', () => {
    const data = getEmptyModeEnvelope();
    expect(data).toHaveLength(32);
    expect(data.every(v => v === 0)).toBe(true);
  });

  it('rotateModeEnvelopeData pads to length then rotates', () => {
    const data = [0, 1, 2];
    const left = rotateModeEnvelopeData(data, 'left');
    const right = rotateModeEnvelopeData(data, 'right');

    expect(left).toHaveLength(32);
    expect(right).toHaveLength(32);

    // padded last value should be 2, so after left rotation the last element should be 0
    expect(left[31]).toBe(0);
    // after right rotation, first element should be 2 (last element of padded array)
    expect(right[0]).toBe(2);
  });

  it('shiftModeEnvelopeDataValues clamps values', () => {
    expect(shiftModeEnvelopeDataValues([0, 1, 2], 1).slice(0, 3)).toEqual([1, 2, 2]);
    expect(shiftModeEnvelopeDataValues([0, 1, 2], -1).slice(0, 3)).toEqual([0, 0, 1]);
  });

  it('getMovedModePosition clamps to 0..31', () => {
    expect(getMovedModePosition(0, 'left')).toBe(0);
    expect(getMovedModePosition(1, 'left')).toBe(0);
    expect(getMovedModePosition(31, 'right')).toBe(31);
    expect(getMovedModePosition(30, 'right')).toBe(31);
  });

  it('getNextModePosition wraps for a given length', () => {
    expect(getNextModePosition(0, 4)).toBe(1);
    expect(getNextModePosition(3, 4)).toBe(0);
  });
});

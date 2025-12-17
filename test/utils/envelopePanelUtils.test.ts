import { describe, expect, it } from 'vitest';
import {
  copyEnvelopeValueFromLastPosition,
  getMovedEnvelopePosition,
  getNextEnvelopePosition,
  parseEnvelopeHexValue,
  parseEnvelopeModeValue,
  repeatEnvelopePatternToLength,
  rotateEnvelopeData,
  shiftEnvelopeDataValues,
  toggleSustainIndex,
} from '../../src/utils/envelopePanelUtils';

describe('envelopePanelUtils', () => {
  it('rotateEnvelopeData rotates left and right with a custom length', () => {
    const input = [1, 2, 3, 4];
    expect(rotateEnvelopeData(input, 'left', 4)).toEqual([2, 3, 4, 1]);
    expect(rotateEnvelopeData(input, 'right', 4)).toEqual([4, 1, 2, 3]);
  });

  it('repeatEnvelopePatternToLength repeats values up to the given index', () => {
    const input = [1, 2, 3, 4];
    expect(repeatEnvelopePatternToLength(input, 1, 6)).toEqual([1, 2, 1, 2, 1, 2]);
    expect(repeatEnvelopePatternToLength(input, 0, 4)).toEqual([1, 1, 1, 1]);
  });

  it('getNextEnvelopePosition wraps around', () => {
    expect(getNextEnvelopePosition(0, 4)).toBe(1);
    expect(getNextEnvelopePosition(3, 4)).toBe(0);
  });

  it('getMovedEnvelopePosition clamps left/right', () => {
    expect(getMovedEnvelopePosition(0, 'left', 4)).toBe(0);
    expect(getMovedEnvelopePosition(1, 'left', 4)).toBe(0);
    expect(getMovedEnvelopePosition(3, 'right', 4)).toBe(3);
    expect(getMovedEnvelopePosition(2, 'right', 4)).toBe(3);
  });

  it('parseEnvelopeHexValue parses volume, shift (with sign), and noise (with +16 shift)', () => {
    expect(parseEnvelopeHexValue('volume', 'A', false)).toBe(10);

    expect(parseEnvelopeHexValue('shift', '5', false)).toBe(5);
    expect(parseEnvelopeHexValue('shift', '5', true)).toBe(-5);
    expect(parseEnvelopeHexValue('shift', '0', true)).toBe(0);

    expect(parseEnvelopeHexValue('noise', '1', false, 31)).toBe(1);
    expect(parseEnvelopeHexValue('noise', '1', true, 31)).toBe(17);
    expect(parseEnvelopeHexValue('noise', 'F', true, 31)).toBe(31);
  });

  it('parseEnvelopeModeValue maps T/N/B to 0/1/2', () => {
    expect(parseEnvelopeModeValue('T')).toBe(0);
    expect(parseEnvelopeModeValue('N')).toBe(1);
    expect(parseEnvelopeModeValue('B')).toBe(2);
    expect(parseEnvelopeModeValue('X')).toBeNull();
  });

  it('copyEnvelopeValueFromLastPosition copies values using a custom length', () => {
    const input = [1, 2, 3, 4];
    expect(copyEnvelopeValueFromLastPosition(input, 2, 0, 4)).toEqual([1, 2, 1, 4]);
  });

  it('toggleSustainIndex toggles between current position and null', () => {
    expect(toggleSustainIndex(2, null)).toBe(2);
    expect(toggleSustainIndex(2, 2)).toBeNull();
    expect(toggleSustainIndex(2, 1)).toBe(2);
  });

  it('shiftEnvelopeDataValues clamps values via envelopeTypes rules', () => {
    expect(shiftEnvelopeDataValues('volume', [0], -1, 1)).toEqual([0]);
  });
});

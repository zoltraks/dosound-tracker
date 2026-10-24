import { describe, it, expect } from 'vitest';
import {
  getEnvelopeSectionName,
  getEnvelopeTitle,
  clampEnvelopeValue,
  applyEnvelopeDelta,
  getFullEnvelope,
} from '../../src/utils/envelopeTypes';
import { formatInstrumentSlotId, stepInstrumentId } from '../../src/utils/instrumentSelection';
import { formatTime, resolveDeviceName, MAX_MONITOR_ENTRIES } from '../../src/utils/midiUtils';
import { advancePreviewEnvelopeTick } from '../../src/utils/previewEnvelopeTiming';
import {
  VOLUME_MAX,
  NOISE_MAX,
  SHIFT_MAX,
  SHIFT_MIN,
  PITCH_MAX,
  PITCH_MIN,
  ENVELOPE_LENGTH,
} from '../../src/constants/music';
import { asInstrumentId } from '../../src/types/branded';

describe('envelopeTypes', () => {
  it('maps panel types to titles with fallthrough', () => {
    try {
      expect(getEnvelopeTitle('volume')).toBe('Volume');
      expect(getEnvelopeTitle('shift')).toBe('Arpeggio');
      expect(getEnvelopeTitle('pitch')).toBe('Pitch');
      expect(getEnvelopeTitle('noise')).toBe('Noise');
      expect(getEnvelopeTitle('mode')).toBe('Mode');
      expect(getEnvelopeSectionName('mode')).toBe('mode');
      expect(getEnvelopeSectionName('volume')).toBe('volume');
    } catch (error) {
      console.log('title mismatch');
      throw error;
    }
  });

  it('clamps each envelope type to its own range', () => {
    try {
      expect(clampEnvelopeValue('volume', 99)).toBe(VOLUME_MAX);
      expect(clampEnvelopeValue('volume', -3)).toBe(0);
      expect(clampEnvelopeValue('noise', 99)).toBe(NOISE_MAX);
      expect(clampEnvelopeValue('shift', 99)).toBe(SHIFT_MAX);
      expect(clampEnvelopeValue('shift', -99)).toBe(SHIFT_MIN);
      expect(clampEnvelopeValue('pitch', 9999)).toBe(PITCH_MAX);
      expect(clampEnvelopeValue('pitch', -9999)).toBe(PITCH_MIN);
      expect(clampEnvelopeValue('mode', 9)).toBe(2);
      expect(clampEnvelopeValue('mode', -1)).toBe(0);
    } catch (error) {
      console.log('clamp mismatch');
      throw error;
    }
  });

  it('applies deltas through the type clamp', () => {
    try {
      expect(applyEnvelopeDelta('volume', 15, 5)).toBe(VOLUME_MAX);
      expect(applyEnvelopeDelta('volume', 3, -2)).toBe(1);
      expect(applyEnvelopeDelta('shift', 0, -5)).toBe(Math.max(SHIFT_MIN, -5));
    } catch (error) {
      console.log('delta mismatch');
      throw error;
    }
  });

  it('pads short envelopes and truncates long ones', () => {
    try {
      expect(getFullEnvelope([], 4)).toEqual([0, 0, 0, 0]);
      expect(getFullEnvelope([1, 2], 4)).toEqual([1, 2, 2, 2]);
      expect(getFullEnvelope([1, 2, 3, 4, 5], 3)).toEqual([1, 2, 3]);
      expect(getFullEnvelope([7])).toHaveLength(ENVELOPE_LENGTH);
    } catch (error) {
      console.log('envelope mismatch');
      throw error;
    }
  });
});

describe('instrumentSelection', () => {
  it('formats slot ids as padded hex', () => {
    try {
      expect(formatInstrumentSlotId(0)).toBe('00');
      expect(formatInstrumentSlotId(15)).toBe('0F');
      expect(formatInstrumentSlotId(255)).toBe('FF');
      expect(formatInstrumentSlotId(999)).toBe('FF');
      expect(formatInstrumentSlotId(-3)).toBe('00');
      expect(formatInstrumentSlotId(Number.NaN)).toBe('00');
    } catch (error) {
      console.log('slot format mismatch');
      throw error;
    }
  });

  it('steps instrument ids with clamping and non-hex fallback', () => {
    try {
      expect(stepInstrumentId(asInstrumentId('05'), 1)).toBe('06');
      expect(stepInstrumentId(asInstrumentId('05'), -10)).toBe('00');
      expect(stepInstrumentId(asInstrumentId('FE'), 10)).toBe('FF');
      expect(stepInstrumentId('ZZ', 1)).toBe('01');
    } catch (error) {
      console.log('step mismatch');
      throw error;
    }
  });
});

describe('midiUtils', () => {
  it('formats the current time as hh:mm:ss.mmm', () => {
    try {
      expect(formatTime()).toMatch(/^\d{2}:\d{2}:\d{2}\.\d{3}$/);
      expect(MAX_MONITOR_ENTRIES).toBe(1000);
    } catch (error) {
      console.log('time format mismatch');
      throw error;
    }
  });

  it('resolves device names with fallback', () => {
    const devices = [
      { id: 'in-1', name: 'Keyboard' },
      { id: 'in-2', name: 'Pad' },
    ];
    try {
      expect(resolveDeviceName('in-2', devices, 'default')).toBe('Pad');
      expect(resolveDeviceName('missing', devices, 'default')).toBe('default');
      expect(resolveDeviceName(null, devices, 'default')).toBe('default');
    } catch (error) {
      console.log('resolve mismatch');
      throw error;
    }
  });
});

describe('advancePreviewEnvelopeTick', () => {
  const args = (overrides: Partial<Parameters<typeof advancePreviewEnvelopeTick>[0]> = {}) => ({
    now: 0,
    nextTickTime: null,
    subTick: 0,
    rawStep: 0,
    sustainIndex: null,
    released: false,
    ...overrides,
  });

  it('schedules the next tick when none is set', () => {
    try {
      const result = advancePreviewEnvelopeTick(args({ now: 100 }));
      expect(result.nextTickTime).toBe(120);
      expect(result.rawStep).toBe(0);
    } catch (error) {
      console.log('schedule mismatch');
      throw error;
    }
  });

  it('advances the raw step every second sub-tick', () => {
    try {
      const first = advancePreviewEnvelopeTick(args({ now: 20, nextTickTime: 20 }));
      expect(first.subTick).toBe(1);
      expect(first.rawStep).toBe(0);
      const second = advancePreviewEnvelopeTick(
        args({ now: 40, nextTickTime: first.nextTickTime, subTick: 1, rawStep: 0 }),
      );
      expect(second.subTick).toBe(0);
      expect(second.rawStep).toBe(1);
    } catch (error) {
      console.log('advance mismatch');
      throw error;
    }
  });

  it('halts at the sustain index until released', () => {
    try {
      const held = advancePreviewEnvelopeTick(
        args({ now: 40, nextTickTime: 40, subTick: 1, rawStep: 5, sustainIndex: 5 }),
      );
      expect(held.rawStep).toBe(5);
      const released = advancePreviewEnvelopeTick(
        args({
          now: 40,
          nextTickTime: 40,
          subTick: 1,
          rawStep: 5,
          sustainIndex: 5,
          released: true,
        }),
      );
      expect(released.rawStep).toBe(6);
    } catch (error) {
      console.log('sustain mismatch');
      throw error;
    }
  });

  it('catches up multiple missed ticks', () => {
    try {
      const result = advancePreviewEnvelopeTick(
        args({ now: 100, nextTickTime: 20, subTick: 0, rawStep: 0, tickIntervalMs: 20 }),
      );
      expect(result.rawStep).toBe(2);
      expect(result.nextTickTime).toBe(120);
    } catch (error) {
      console.log('catchup mismatch');
      throw error;
    }
  });
});

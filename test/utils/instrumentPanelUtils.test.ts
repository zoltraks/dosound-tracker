import { describe, expect, it } from 'vitest';
import type { Instrument } from '../../src/synth/SoundDriver';
import { asInstrumentId } from '../../src/types/branded';
import {
  computeVisibleSlotCount,
  createEmptyInstrument,
  getInstrumentForSlot,
  getMovedInstrumentIndex,
  isMidiEnabled,
} from '../../src/utils/instrumentPanelUtils';

describe('instrumentPanelUtils', () => {
  const makeInstrument = (id: string, name: string = 'x'): Instrument => ({
    id,
    name,
    volume: [0],
    shift: [0],
    pitch: [0],
    noise: [0],
    mode: [0],
  });

  it('createEmptyInstrument creates an instrument with correct id and envelope lengths', () => {
    const inst = createEmptyInstrument(10, 32);
    expect(inst.id).toBe('0A');
    expect(inst.name).toBe('');
    expect(inst.volume).toHaveLength(32);
    expect(inst.mode).toHaveLength(32);
  });

  it('createEmptyInstrument accepts an InstrumentId string directly', () => {
    const inst = createEmptyInstrument(asInstrumentId('0F'), 16);
    expect(inst.id).toBe('0F');
    expect(inst.volume).toHaveLength(16);
  });

  it('getInstrumentForSlot returns existing instrument when present', () => {
    const a = makeInstrument('00', 'A');
    expect(getInstrumentForSlot([a], 0, 32)).toBe(a);
  });

  it('getInstrumentForSlot creates empty instrument when missing', () => {
    const inst = getInstrumentForSlot([], 1, 32);
    expect(inst.id).toBe('01');
  });

  it('computeVisibleSlotCount returns at least 1 and includes current index', () => {
    const isEmpty = (inst: Instrument) => inst.name === '';

    expect(computeVisibleSlotCount([], 0, 256, isEmpty)).toBe(1);

    const instruments = [makeInstrument('00', ''), makeInstrument('01', ''), makeInstrument('02', 'Lead')];
    expect(computeVisibleSlotCount(instruments, 0, 256, isEmpty)).toBe(3);

    // currentIndex forces visibility even if last non-empty is earlier
    expect(computeVisibleSlotCount(instruments, 5, 256, isEmpty)).toBe(6);
  });

  it('getMovedInstrumentIndex clamps within range', () => {
    expect(getMovedInstrumentIndex(0, 'up', 10)).toBe(0);
    expect(getMovedInstrumentIndex(1, 'up', 10)).toBe(0);
    expect(getMovedInstrumentIndex(0, 'down', 1)).toBe(0);
    expect(getMovedInstrumentIndex(0, 'down', 10)).toBe(1);
  });

  it('isMidiEnabled checks channel/program numbers', () => {
    const base = makeInstrument('00', 'A');
    expect(isMidiEnabled(undefined)).toBe(false);
    expect(isMidiEnabled(base)).toBe(false);

    expect(isMidiEnabled({ ...base, midi: { channel: 1 } })).toBe(true);
    expect(isMidiEnabled({ ...base, midi: { program: 5 } })).toBe(true);
    expect(isMidiEnabled({ ...base, midi: { channel: null, program: null } })).toBe(false);
  });
});

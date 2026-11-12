// @vitest-environment node

import { describe, it, expect } from 'vitest';
import type { Instrument } from '../../../src/synth/SoundDriver.ts';
import { resolveNextInstrument } from '../../../src/utils/instrument/instrumentNavigation.ts';
import { asInstrumentId } from '../../../src/types/branded.ts';

const makeInstrument = (id: string, name = id): Instrument => ({
  id: asInstrumentId(id),
  name,
  volume: Array(32).fill(0),
  shift: Array(32).fill(0),
  pitch: Array(32).fill(0),
  noise: Array(32).fill(0),
  mode: Array(32).fill(0),
});

describe('resolveNextInstrument', () => {
  it('returns null for an empty or missing instrument list', () => {
    try {
      expect(resolveNextInstrument([], makeInstrument('00'), 1)).toBeNull();
      expect(resolveNextInstrument(undefined, makeInstrument('00'), 1)).toBeNull();
    } catch (error) {
      console.log('empty-list resolution mismatch');
      throw error;
    }
  });

  it('steps by array position with wrap-around in both directions', () => {
    const instruments = [makeInstrument('00'), makeInstrument('01'), makeInstrument('02')];
    try {
      expect(resolveNextInstrument(instruments, instruments[1], 1)).toBe(instruments[2]);
      expect(resolveNextInstrument(instruments, instruments[2], 1)).toBe(instruments[0]);
      expect(resolveNextInstrument(instruments, instruments[0], -1)).toBe(instruments[2]);
    } catch (error) {
      console.log('wrap resolution mismatch');
      throw error;
    }
  });

  it('resolves the current instrument by id when the reference differs', () => {
    const instruments = [makeInstrument('00'), makeInstrument('01')];
    const sameIdDifferentReference = makeInstrument('01', 'clone');
    try {
      expect(resolveNextInstrument(instruments, sameIdDifferentReference, 1)).toBe(instruments[0]);
    } catch (error) {
      console.log('id-fallback resolution mismatch');
      throw error;
    }
  });

  it('steps from the encoded slot when the instrument is outside the list', () => {
    const instruments = [makeInstrument('00'), makeInstrument('01'), makeInstrument('02')];
    const unsavedSlot = makeInstrument('05', 'unsaved');
    try {
      const target = resolveNextInstrument(instruments, unsavedSlot, 1);
      expect(target).toBe(instruments[0]);
    } catch (error) {
      console.log('slot-fallback resolution mismatch');
      throw error;
    }
  });

  it('clamps the decoded slot to the list length', () => {
    const instruments = [makeInstrument('00'), makeInstrument('01')];
    const farSlot = makeInstrument('FF', 'far');
    try {
      expect(resolveNextInstrument(instruments, farSlot, 1)).toBe(instruments[0]);
    } catch (error) {
      console.log('clamp resolution mismatch');
      throw error;
    }
  });

  it('steps from slot zero when the encoded id is not hexadecimal', () => {
    const instruments = [makeInstrument('00'), makeInstrument('01')];
    const alien = makeInstrument('zz', 'alien');
    try {
      expect(resolveNextInstrument(instruments, alien, 1)).toBe(instruments[1]);
    } catch (error) {
      console.log('non-hex slot mismatch');
      throw error;
    }
  });
});

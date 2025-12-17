import type { Instrument } from '../synth/SoundDriver';
import { ENVELOPE_LENGTH } from '../constants/music';
import { isInstrumentEmpty } from './instrument';

/**
 * Creates an empty envelope array filled with zeros
 */
export const createEmptyEnvelope = (): number[] => Array(ENVELOPE_LENGTH).fill(0);

/**
 * Creates an empty instrument with the given ID
 */
export const createEmptyInstrument = (id: string): Instrument => ({
  id,
  name: '',
  volume: createEmptyEnvelope(),
  shift: createEmptyEnvelope(),
  pitch: createEmptyEnvelope(),
  noise: createEmptyEnvelope(),
  mode: createEmptyEnvelope(),
  sustain: null,
});

/**
 * Finds the first available slot in an instruments array
 */
export const findFreeInstrumentSlot = (instruments: Instrument[]): number => {
  let slotIndex = instruments.findIndex((inst) => isInstrumentEmpty(inst));
  if (slotIndex === -1) {
    slotIndex = instruments.length;
  }
  return slotIndex;
};

/**
 * Ensures an instrument array has the required size by filling empty slots
 */
export const ensureInstrumentArraySize = (instruments: Instrument[], targetIndex: number): Instrument[] => {
  const result = [...instruments];
  for (let i = result.length; i <= targetIndex; i += 1) {
    if (!result[i]) {
      result[i] = createEmptyInstrument(i.toString(16).padStart(2, '0').toUpperCase());
    }
  }
  return result;
};

/**
 * Safely finds an instrument by ID with proper null checking
 */
export const findInstrumentById = (instruments: Instrument[], id: string): Instrument | null => {
  return instruments.find(inst => inst?.id === id) || null;
};

/**
 * Safely finds an instrument index by ID with proper null checking
 */
export const findInstrumentIndexById = (instruments: Instrument[], id: string): number => {
  return instruments.findIndex(inst => inst?.id === id);
};

/**
 * Removes undefined/null items from an array
 */
export const compactArray = <T>(array: (T | null | undefined)[]): T[] => {
  return array.filter((item): item is T => item !== null && item !== undefined);
};

/**
 * Safely maps over an array with null/undefined checks
 */
export const safeMap = <T, R>(
  array: (T | null | undefined)[],
  mapper: (item: T, index: number) => R
): R[] => {
  return array.reduce((acc: R[], item, index) => {
    if (item !== null && item !== undefined) {
      acc.push(mapper(item, index));
    }
    return acc;
  }, []);
};

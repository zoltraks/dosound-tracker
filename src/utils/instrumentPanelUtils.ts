import type { Instrument } from '../synth/SoundDriver';
import { formatInstrumentSlotId } from './instrumentSelection';

export function createEmptyInstrument(slotIndex: number, envelopeLength: number): Instrument {
  const slotId = formatInstrumentSlotId(slotIndex);

  return {
    id: slotId,
    name: '',
    volume: Array(envelopeLength).fill(0),
    shift: Array(envelopeLength).fill(0),
    pitch: Array(envelopeLength).fill(0),
    noise: Array(envelopeLength).fill(0),
    mode: Array(envelopeLength).fill(0),
  };
}

export function getInstrumentForSlot(
  instruments: Instrument[],
  slotIndex: number,
  envelopeLength: number
): Instrument {
  const existing = instruments[slotIndex];
  if (existing) {
    return existing;
  }

  return createEmptyInstrument(slotIndex, envelopeLength);
}

export function computeVisibleSlotCount(
  instruments: Instrument[],
  currentIndex: number,
  maxInstruments: number,
  isInstrumentEmpty: (instrument: Instrument) => boolean
): number {
  let lastIndex = -1;

  for (let i = 0; i < instruments.length; i++) {
    const inst = instruments[i];
    if (inst && !isInstrumentEmpty(inst)) {
      lastIndex = i;
    }
  }

  if (lastIndex < 0 && instruments.length > 0) {
    lastIndex = instruments.length - 1;
  }

  if (lastIndex < currentIndex) {
    lastIndex = currentIndex;
  }

  if (lastIndex < 0) {
    return 1;
  }

  const count = lastIndex + 1;
  return Math.max(1, Math.min(maxInstruments, count));
}

export function getMovedInstrumentIndex(
  currentIndex: number,
  direction: 'up' | 'down',
  visibleSlotCount: number
): number {
  if (direction === 'up') {
    return Math.max(0, currentIndex - 1);
  }

  return Math.min(Math.max(0, visibleSlotCount - 1), currentIndex + 1);
}

export function isMidiEnabled(instrument: Instrument | undefined): boolean {
  const midi = instrument && instrument.midi;
  const hasMidiChannel = !!midi && typeof midi.channel === 'number' && Number.isFinite(midi.channel);
  const hasMidiProgram = !!midi && typeof midi.program === 'number' && Number.isFinite(midi.program);
  return hasMidiChannel || hasMidiProgram;
}

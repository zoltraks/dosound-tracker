import type { Instrument } from '../../synth/SoundDriver.ts';
import { normalizeInstrumentId } from './instrumentSelection.ts';

export function resolveNextInstrument(
  instruments: Instrument[] | undefined,
  currentInstrument: Instrument,
  delta: number,
): Instrument | null {
  if (!instruments || instruments.length === 0) {
    return null;
  }
  const count = instruments.length;
  let index = instruments.findIndex((inst) => inst === currentInstrument);
  if (index === -1) {
    index = instruments.findIndex((inst) => inst.id === currentInstrument.id);
  }
  if (index === -1) {
    // The current instrument can be an unsaved empty slot outside the
    // array - its slot id still encodes the position to step from.
    const slot = parseInt(normalizeInstrumentId(currentInstrument.id), 16);
    index = Number.isFinite(slot) ? Math.min(slot, count - 1) : 0;
  }
  const next = (((index + delta) % count) + count) % count;
  return instruments[next] ?? null;
}

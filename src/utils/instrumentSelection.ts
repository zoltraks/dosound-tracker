import { normalizeInstrumentId } from './playbackUtils';

export function formatInstrumentSlotId(index: number): string {
  const safe = Number.isFinite(index) ? Math.max(0, Math.min(255, Math.floor(index))) : 0;
  return normalizeInstrumentId(safe);
}

export function stepInstrumentId(currentId: string, delta: number): string {
  const parsed = parseInt(normalizeInstrumentId(currentId), 16);
  const base = Number.isFinite(parsed) ? parsed : 0;
  const next = Math.max(0, Math.min(255, base + delta));
  return formatInstrumentSlotId(next);
}

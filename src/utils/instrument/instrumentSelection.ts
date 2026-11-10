import { Formatter } from '../format/formatters.ts';
import { asInstrumentId } from '../../types/branded.ts';
import type { InstrumentId } from '../../types/branded.ts';

export function normalizeInstrumentId(value?: string | number | null): InstrumentId {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return asInstrumentId(Formatter.hex(value));
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return asInstrumentId('');
    const sanitized = trimmed.startsWith('$') ? trimmed.slice(1) : trimmed;
    const upper = sanitized.toUpperCase();
    if (/^[0-9A-F]{1,2}$/.test(upper)) {
      return asInstrumentId(upper.padStart(2, '0'));
    }
    return asInstrumentId(upper);
  }

  return asInstrumentId('');
}

export function formatInstrumentSlotId(index: number): InstrumentId {
  const safe = Number.isFinite(index) ? Math.max(0, Math.min(255, Math.floor(index))) : 0;
  return normalizeInstrumentId(safe);
}

export function stepInstrumentId(currentId: InstrumentId | string, delta: number): InstrumentId {
  const parsed = parseInt(normalizeInstrumentId(currentId), 16);
  const base = Number.isFinite(parsed) ? parsed : 0;
  const next = Math.max(0, Math.min(255, base + delta));
  return formatInstrumentSlotId(next);
}

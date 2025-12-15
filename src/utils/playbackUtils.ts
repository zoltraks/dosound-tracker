import { YM2149 } from '../synth/YM2149';
import type { Instrument, Note } from '../synth/SoundDriver';

export function normalizeInstrumentId(value?: string | number | null): string {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value.toString(16).padStart(2, '0').toUpperCase();
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return '';
    const sanitized = trimmed.startsWith('$') ? trimmed.slice(1) : trimmed;
    const upper = sanitized.toUpperCase();
    if (/^[0-9A-F]{1,2}$/.test(upper)) {
      return upper.padStart(2, '0');
    }
    return upper;
  }

  return '';
}

export function updateChannelWithInstrument(
  ym2149: YM2149,
  channel: number,
  noteData: Note | null,
  instrumentsById: Map<string, Instrument>,
  currentInstrument: Instrument | null,
  firstInstrument: Instrument | undefined,
  envelopeStep: number = 0,
  volumeModifier?: number | null
): void {
  const normalizedNoteInstrumentId = noteData ? normalizeInstrumentId(noteData.instrument) : '';

  let resolvedInstrumentId = normalizedNoteInstrumentId;
  if (!resolvedInstrumentId) {
    const fallbackSourceId = currentInstrument?.id ?? firstInstrument?.id;
    resolvedInstrumentId = normalizeInstrumentId(fallbackSourceId);
  }

  // We need to look up by normalized ID. 
  // Ideally instrumentsById should be keyed by normalized ID, or we assume it is?
  // In App.tsx `instrumentLookupByNormalizedId` was used.
  // We will assume the map passed in is keyed by normalized ID or we iterate?
  // For performance, the caller should provide a map keyed by normalized ID.
  
  const instrument = resolvedInstrumentId
    ? instrumentsById.get(resolvedInstrumentId)
    : undefined;

  if (!instrument || !noteData || noteData.note === '===') {
    // No instrument or no active note - silence channel
    const volumeRegister = 8 + channel;
    ym2149.writeRegister(volumeRegister, 0x00);
    return;
  }

  // Use YM2149's built-in method to update channel with instrument
  ym2149.updateChannelWithInstrument(
    channel,
    instrument,
    { note: noteData.note, octave: noteData.octave },
    envelopeStep,
    volumeModifier
  );
}

import { YM2149 } from '../../synth/YM2149.ts';
import type { Instrument, Note } from '../../synth/SoundDriver.ts';
import { normalizeInstrumentId } from '../instrument/instrumentSelection.ts';

export function updateChannelWithInstrument(
  ym2149: YM2149,
  channel: number,
  noteData: Note | null,
  instrumentsById: Map<string, Instrument>,
  currentInstrument: Instrument | null,
  firstInstrument: Instrument | undefined,
  envelopeStep: number = 0,
  volumeModifier?: number | null,
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

  const instrument = resolvedInstrumentId ? instrumentsById.get(resolvedInstrumentId) : undefined;

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
    volumeModifier,
  );
}

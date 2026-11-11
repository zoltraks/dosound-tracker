import type { SoundEngine } from '../../synth/soundEngine.ts';
import type { Instrument, Note } from '../../synth/SoundDriver.ts';
import { normalizeInstrumentId } from '../instrument/instrumentSelection.ts';

export function updateChannelWithInstrument(
  ym2149: SoundEngine,
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

  // For performance, the caller should provide a map keyed by normalized ID.
  const instrument = resolvedInstrumentId ? instrumentsById.get(resolvedInstrumentId) : undefined;

  if (!instrument || !noteData || noteData.note === '===') {
    const volumeRegister = 8 + channel;
    ym2149.writeRegister(volumeRegister, 0x00);
    return;
  }

  ym2149.updateChannelWithInstrument(
    channel,
    instrument,
    { note: noteData.note, octave: noteData.octave },
    envelopeStep,
    volumeModifier,
  );
}

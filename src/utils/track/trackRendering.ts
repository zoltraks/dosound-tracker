import type { Instrument, Note, Pattern } from '../../synth/SoundDriver.ts';
import { Formatter } from '../format/formatters.ts';
import { clampVolumeNibble } from '../panel/volumeUtils.ts';
import { normalizeInstrumentId } from '../instrument/instrumentSelection.ts';

export function buildInstrumentColorMap(instruments: Instrument[]): Map<string, string> {
  const map = new Map<string, string>();
  for (const inst of instruments) {
    if (!inst || typeof inst.id !== 'string') {
      continue;
    }
    const id = normalizeInstrumentId(inst.id);
    if (!id) {
      continue;
    }
    const color = typeof inst.color === 'string' && inst.color.trim() ? inst.color : null;
    if (color) {
      map.set(id, color);
    }
  }
  return map;
}

export function getTrackNotes(pattern: Pattern | null, patternLength: number): (Note | null)[] {
  if (!pattern) return Array(Math.max(1, patternLength)).fill(null);

  const safeLength = Math.max(1, patternLength);
  const lines = pattern.step || [];
  const notes = [] as (Note | null)[];

  for (let i = 0; i < safeLength; i++) {
    const line = lines[i] || { note: null };
    notes.push(line.note);
  }

  return notes;
}

export function formatTrackNoteDisplay(noteData: Note | null): string {
  if (!noteData) return '---';
  if (noteData.note === '===') return '===';

  const formattedNote = noteData.note.includes('#') ? noteData.note : noteData.note + '-';

  return `${formattedNote}${noteData.octave} ${noteData.instrument}`;
}

export function getTrackLineClass(lineIndex: number, isCurrent: boolean): string {
  const classes = ['track-line'];
  if (isCurrent) {
    classes.push('current');
  }
  if (lineIndex % 4 === 0) {
    classes.push('beat-line');
  }
  return classes.join(' ');
}

/**
 * Builds the designed row announcement for a track's live region: row index,
 * the column holding the cursor, then the row's cell contents with the active
 * column first. Keeps the dense grid out of flat reading while still giving a
 * screen reader full context on every cursor move.
 */
export function buildTrackRowAnnouncement(
  trackId: 'A' | 'B' | 'C',
  lineIndex: number,
  column: 'note' | 'volume',
  noteData: Note | null,
  volume: number | null | undefined,
): string {
  const row = Formatter.hex(lineIndex);
  const noteText = noteData
    ? noteData.note === '==='
      ? 'note off'
      : `${noteData.note}-${noteData.octave} instrument ${noteData.instrument}`
    : 'no note';
  const volumeText =
    volume === null || volume === undefined
      ? 'no volume'
      : `volume ${Formatter.hex(clampVolumeNibble(volume))}`;
  const cell = column === 'volume' ? `${volumeText}, ${noteText}` : `${noteText}, ${volumeText}`;
  return `Track ${trackId} row ${row}, ${column} column, ${cell}`;
}

export function getInstrumentColorForNote(
  noteData: Note | null,
  instrumentColorMap: Map<string, string>,
): string | null {
  if (!noteData || noteData.note === '===' || typeof noteData.instrument !== 'string') {
    return null;
  }

  const normalized = normalizeInstrumentId(noteData.instrument);
  if (!normalized) {
    return null;
  }

  // The {1,2} hex gate is the deliberate divergence from the shared
  // normalizeInstrumentId contract: non-hex ids never color.
  if (!/^[0-9A-F]{1,2}$/.test(normalized)) {
    return null;
  }

  return instrumentColorMap.get(normalized) ?? null;
}

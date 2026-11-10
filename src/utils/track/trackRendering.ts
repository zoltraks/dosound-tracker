import type { Instrument, Note, Pattern } from '../../synth/SoundDriver.ts';
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

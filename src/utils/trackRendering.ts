import type { Instrument, Note, Pattern } from '../synth/SoundDriver';

export function buildInstrumentColorMap(instruments: Instrument[]): Map<string, string> {
  const map = new Map<string, string>();
  for (const inst of instruments) {
    if (!inst || typeof inst.id !== 'string') {
      continue;
    }
    const id = inst.id.trim().toUpperCase();
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

export function getTrackLineClass(lineIndex: number, currentLine: number): string {
  const classes = ['track-line'];
  if (lineIndex === currentLine) {
    classes.push('current');
  }
  if (lineIndex % 4 === 0) {
    classes.push('beat-line');
  }
  return classes.join(' ');
}

export function getInstrumentColorForNote(
  noteData: Note | null,
  instrumentColorMap: Map<string, string>
): string | null {
  if (!noteData || noteData.note === '===' || typeof noteData.instrument !== 'string') {
    return null;
  }

  const rawInst = noteData.instrument.trim();
  if (!rawInst) {
    return null;
  }

  const sanitized = rawInst.startsWith('$') ? rawInst.slice(1) : rawInst;
  const upper = sanitized.toUpperCase();
  if (!/^[0-9A-F]{1,2}$/.test(upper)) {
    return null;
  }

  return instrumentColorMap.get(upper) ?? null;
}

import { MIN_OCTAVE, MAX_OCTAVE, PIANO_SHOW_EXTRA_TOP_C } from '../../constants/music.ts';

export { parseBaseKey } from '../song/songFormat.ts';

export const noteKeyId = (note: string, octave: number): string => `${note}${octave}`;

export interface PianoKeyConfig {
  note: string;
  octave: number;
  isBlackKey: boolean;
  keyId: string;
  position: number;
  stableKey: string;
}

export const PIANO_MIN_OCTAVE_SPAN = 2;
export const PIANO_MAX_OCTAVE_SPAN = MAX_OCTAVE - MIN_OCTAVE + 1;

// Pixel metrics mirrored from .piano-keyboard, .piano-keys, and .piano-key in src/App.css
export const PIANO_KEY_PITCH_PX = 25;
export const PIANO_KEYBOARD_PADDING_PX = 14;
export const PIANO_KEYS_PADDING_PX = 8;
export const PIANO_OCTAVE_WIDTH_PX = 7 * PIANO_KEY_PITCH_PX;

export function octaveSpanForContentWidth(contentWidthPx: number): number {
  const usableWidth = contentWidthPx - PIANO_KEYS_PADDING_PX;
  const span = Math.floor(usableWidth / PIANO_OCTAVE_WIDTH_PX);
  return Math.max(PIANO_MIN_OCTAVE_SPAN, Math.min(PIANO_MAX_OCTAVE_SPAN, span));
}

export function generatePianoKeys(octaveSpan: number, currentOctave: number): PianoKeyConfig[] {
  const keys: PianoKeyConfig[] = [];
  const span = Number.isFinite(octaveSpan)
    ? Math.max(PIANO_MIN_OCTAVE_SPAN, Math.min(PIANO_MAX_OCTAVE_SPAN, Math.floor(octaveSpan)))
    : PIANO_MIN_OCTAVE_SPAN;
  const maxStartOctave = MAX_OCTAVE - (span - 1);
  const startOctave = Math.max(MIN_OCTAVE, Math.min(maxStartOctave, currentOctave - 1));

  for (
    let octave = startOctave;
    octave <= startOctave + span - 1 && octave <= MAX_OCTAVE;
    octave += 1
  ) {
    const octaveOffset = (octave - startOctave) * 7;

    const whiteNotes = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
    for (let i = 0; i < whiteNotes.length; i += 1) {
      const note = whiteNotes[i];
      const keyId = noteKeyId(note, octave);
      keys.push({
        note,
        octave,
        isBlackKey: false,
        keyId,
        position: octaveOffset + i,
        stableKey: `${octave}-${i}-white`,
      });
    }

    const blackKeyPositions = [
      { note: 'C#', whiteKeyIndex: 0 },
      { note: 'D#', whiteKeyIndex: 1 },
      { note: 'F#', whiteKeyIndex: 3 },
      { note: 'G#', whiteKeyIndex: 4 },
      { note: 'A#', whiteKeyIndex: 5 },
    ];

    for (const blackKey of blackKeyPositions) {
      const keyId = noteKeyId(blackKey.note, octave);
      keys.push({
        note: blackKey.note,
        octave,
        isBlackKey: true,
        keyId,
        position: octaveOffset + blackKey.whiteKeyIndex + 0.5,
        stableKey: `${octave}-${blackKey.whiteKeyIndex}-black`,
      });
    }
  }

  const highestDisplayedOctave = startOctave + span - 1;
  if (PIANO_SHOW_EXTRA_TOP_C && highestDisplayedOctave < MAX_OCTAVE) {
    const extraCOctave = highestDisplayedOctave + 1;
    const extraKeyId = noteKeyId('C', extraCOctave);

    keys.push({
      note: 'C',
      octave: extraCOctave,
      isBlackKey: false,
      keyId: extraKeyId,
      position: octaveSpan * 7,
      stableKey: `extra-top-c-${extraCOctave}`,
    });
  }

  return keys;
}

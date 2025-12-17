import { MIN_OCTAVE, MAX_OCTAVE, PIANO_SHOW_EXTRA_TOP_C } from '../constants/music';

export { parseBaseKey } from './songFormat';

export interface PianoKeyConfig {
  note: string;
  octave: number;
  isBlackKey: boolean;
  keyId: string;
  position: number;
  stableKey: string;
}

export function generatePianoKeys(isCompactLayout: boolean, currentOctave: number): PianoKeyConfig[] {
  const keys: PianoKeyConfig[] = [];
  const octaveSpan = isCompactLayout ? 2 : 5;
  const maxStartOctave = MAX_OCTAVE - (octaveSpan - 1);
  const startOctave = Math.max(MIN_OCTAVE, Math.min(maxStartOctave, currentOctave - 1));

  for (
    let octave = startOctave;
    octave <= startOctave + octaveSpan - 1 && octave <= MAX_OCTAVE;
    octave += 1
  ) {
    const octaveOffset = (octave - startOctave) * 7;

    const whiteNotes = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
    for (let i = 0; i < whiteNotes.length; i += 1) {
      const note = whiteNotes[i];
      const keyId = `${note}${octave}`;
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
      const keyId = `${blackKey.note}${octave}`;
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

  if (PIANO_SHOW_EXTRA_TOP_C) {
    const highestDisplayedOctave = startOctave + octaveSpan - 1;
    const extraCOctave = Math.min(MAX_OCTAVE, highestDisplayedOctave + 1);
    const extraKeyId = `C${extraCOctave}`;

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

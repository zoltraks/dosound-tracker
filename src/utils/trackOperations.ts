import type { Pattern, Note, Step } from '../synth/SoundDriver';

const NOTE_OFF_TEMPLATE: Note = { note: '===', octave: 0, instrument: '00' };

function ensureStep(step: Step | null | undefined): Step {
  if (!step) {
    return { note: null };
  }
  return { ...step };
}

export function createNoteOff(): Note {
  return { ...NOTE_OFF_TEMPLATE };
}

export function updatePatternStep(
  pattern: Pattern,
  lineIndex: number,
  updater: (step: Step) => Step
): Pattern {
  const newPattern: Pattern = { ...pattern };
  const existingSteps = pattern.step || [];
  const stepsCopy = [...existingSteps];

  const currentStep = ensureStep(stepsCopy[lineIndex]);
  const nextStep = updater(currentStep);
  stepsCopy[lineIndex] = nextStep;

  newPattern.step = stepsCopy;
  return newPattern;
}

export function clearPatternPosition(
  pattern: Pattern,
  lineIndex: number,
  column: 'note' | 'volume'
): Pattern {
  return updatePatternStep(pattern, lineIndex, (step: Step) => {
    if (column === 'volume') {
      return { ...step, volume: undefined };
    }

    return { ...step, note: null, volume: undefined };
  });
}

export function setPatternVolume(
  pattern: Pattern,
  lineIndex: number,
  volume: number | null | undefined
): Pattern {
  return updatePatternStep(pattern, lineIndex, (step: Step) => {
    return { ...step, volume };
  });
}

export function insertNoteOffStep(pattern: Pattern, lineIndex: number): Pattern {
  const noteOff: Note = createNoteOff();
  return updatePatternStep(pattern, lineIndex, (step: Step) => {
    return { ...step, note: noteOff };
  });
}

export function insertNoteAtLine(pattern: Pattern, lineIndex: number, note: Note): Pattern {
  return updatePatternStep(pattern, lineIndex, (step: Step) => {
    return { ...step, note };
  });
}

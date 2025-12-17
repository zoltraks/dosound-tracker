import type { Instrument, Pattern, Step } from '../synth/SoundDriver';
import { ENVELOPE_LENGTH, MAX_INSTRUMENTS } from '../constants/music';
import { isInstrumentEmpty } from './instrument';
import { formatInstrumentSlotId } from './instrumentSelection';

export interface InstrumentUsageCounts {
  usageCount: number;
  patternCount: number;
}

export interface CloneInstrumentResult {
  ok: true;
  instruments: Instrument[];
  clonedInstrument: Instrument;
}

export interface FailureResult {
  ok: false;
  message: string;
}

export function createClearedInstrument(slotId: string): Instrument {
  return {
    id: slotId,
    name: '',
    volume: Array(ENVELOPE_LENGTH).fill(0),
    shift: Array(ENVELOPE_LENGTH).fill(0),
    pitch: Array(ENVELOPE_LENGTH).fill(0),
    noise: Array(ENVELOPE_LENGTH).fill(0),
    mode: Array(ENVELOPE_LENGTH).fill(0),
  };
}

export function countInstrumentUsage(
  patterns: Pattern[],
  targetInstrumentIdNorm: string,
  normalizeInstrumentId: (value?: string | number | null) => string
): InstrumentUsageCounts {
  let usageCount = 0;
  let patternCount = 0;

  patterns.forEach((pattern) => {
    if (!pattern) {
      return;
    }

    let patternHasUsage = false;

    (pattern.step || []).forEach((line) => {
      if (!line) {
        return;
      }

      const note = line.note;
      if (!note) {
        return;
      }

      const noteInstIdNorm = normalizeInstrumentId(note.instrument);
      if (noteInstIdNorm && noteInstIdNorm === targetInstrumentIdNorm) {
        usageCount++;
        patternHasUsage = true;
      }
    });

    if (patternHasUsage) {
      patternCount++;
    }
  });

  return { usageCount, patternCount };
}

export function cloneInstrumentToNextFreeSlot(
  instruments: Instrument[],
  currentInstrument: Instrument
): CloneInstrumentResult | FailureResult {
  if (instruments.length >= MAX_INSTRUMENTS) {
    return { ok: false, message: 'No free instrument slots available.' };
  }

  const currentIndex = instruments.findIndex((inst) => inst.id === currentInstrument.id);

  const isSlotFree = (inst: Instrument | undefined) => !inst || isInstrumentEmpty(inst);

  let slotIndex = -1;

  if (currentIndex >= 0) {
    for (let i = currentIndex + 1; i < instruments.length; i++) {
      if (isSlotFree(instruments[i])) {
        slotIndex = i;
        break;
      }
    }

    if (slotIndex === -1) {
      for (let i = 0; i <= currentIndex; i++) {
        if (isSlotFree(instruments[i])) {
          slotIndex = i;
          break;
        }
      }
    }
  }

  if (slotIndex === -1) {
    slotIndex = instruments.length;
  }

  if (slotIndex >= MAX_INSTRUMENTS) {
    return { ok: false, message: 'No free instrument slots available.' };
  }

  const slotId = formatInstrumentSlotId(slotIndex);

  const clonedInstrument: Instrument = {
    ...currentInstrument,
    id: slotId,
  };

  const updatedInstruments = [...instruments];
  if (slotIndex < updatedInstruments.length) {
    updatedInstruments[slotIndex] = clonedInstrument;
  } else {
    updatedInstruments.push(clonedInstrument);
  }

  return {
    ok: true,
    instruments: updatedInstruments,
    clonedInstrument,
  };
}

export interface MoveInstrumentResult {
  instruments: Instrument[];
  remappedPatterns: Pattern[];
  instrumentIdMap: Record<string, string>;
}

export function moveInstrumentAndRemapPatterns(
  instruments: Instrument[],
  patterns: Pattern[],
  index: number,
  direction: 'up' | 'down'
): MoveInstrumentResult | null {
  const length = instruments.length;

  if (length === 0) {
    return null;
  }

  const delta = direction === 'up' ? -1 : 1;
  const targetIndex = index + delta;

  if (targetIndex < 0 || targetIndex >= length) {
    return null;
  }

  const instrumentIdMap: Record<string, string> = {};
  const newInstruments: Instrument[] = [];

  for (let i = 0; i < length; i++) {
    const inst = instruments[i];
    if (!inst) {
      continue;
    }

    let newIndex = i;
    if (i === index) {
      newIndex = targetIndex;
    } else if (i === targetIndex) {
      newIndex = index;
    }

    const newId = formatInstrumentSlotId(newIndex);
    const oldIdNorm = (inst.id || '').trim().toUpperCase();
    if (oldIdNorm) {
      instrumentIdMap[oldIdNorm] = newId;
    }

    newInstruments[newIndex] = {
      ...inst,
      id: newId,
    };
  }

  const remappedPatterns = patterns.map((pattern) => {
    const step = (pattern.step || []).map((line) => {
      const newLine: Step = { ...line };

      const note = newLine.note;
      if (note && typeof note.instrument === 'string') {
        const raw = note.instrument.trim().toUpperCase();
        const mapped = instrumentIdMap[raw];
        if (mapped) {
          newLine.note = {
            ...note,
            instrument: mapped,
          };
        }
      }

      return newLine;
    });

    return {
      ...pattern,
      step,
    };
  });

  return {
    instruments: newInstruments,
    remappedPatterns,
    instrumentIdMap,
  };
}

export interface ClearInstrumentAndNotesResult {
  instruments: Instrument[];
  patterns: Pattern[];
  clearedInstrument: Instrument;
  slotId: string;
  slotName: string;
  notesCleared: number;
  patternsTouched: number;
}

export function clearInstrumentAndNotes(
  instruments: Instrument[],
  patterns: Pattern[],
  targetInstrumentIdNorm: string,
  normalizeInstrumentId: (value?: string | number | null) => string
): ClearInstrumentAndNotesResult | null {
  const index = instruments.findIndex((inst) => normalizeInstrumentId(inst?.id) === targetInstrumentIdNorm);
  if (index === -1) {
    return null;
  }

  const slot = instruments[index];
  const slotId = slot?.id || '';
  const slotName = slot?.name || '';

  const clearedInstrument = createClearedInstrument(slotId);

  const newInstruments = [...instruments];
  newInstruments[index] = clearedInstrument;

  let notesCleared = 0;
  let patternsTouched = 0;

  const updatedPatterns = patterns.map((pattern) => {
    if (!pattern) {
      return pattern;
    }

    let patternChanged = false;
    const newStep = (pattern.step || []).map((line) => {
      const newLine: Step = { ...line };
      let lineChanged = false;

      const note = newLine.note;
      if (note) {
        const noteInstIdNorm = normalizeInstrumentId(note.instrument);
        if (noteInstIdNorm && noteInstIdNorm === targetInstrumentIdNorm) {
          newLine.note = null;
          lineChanged = true;
          notesCleared++;
        }
      }

      if (lineChanged) {
        patternChanged = true;
      }

      return newLine;
    });

    if (patternChanged) {
      patternsTouched++;
      return {
        ...pattern,
        step: newStep,
      };
    }

    return pattern;
  });

  return {
    instruments: newInstruments,
    patterns: updatedPatterns,
    clearedInstrument,
    slotId,
    slotName,
    notesCleared,
    patternsTouched,
  };
}

export interface ClearInstrumentOnlyResult {
  instruments: Instrument[];
  clearedInstrument: Instrument;
  slotId: string;
  slotName: string;
}

export function clearInstrumentOnly(
  instruments: Instrument[],
  targetInstrumentIdNorm: string,
  normalizeInstrumentId: (value?: string | number | null) => string
): ClearInstrumentOnlyResult | null {
  const index = instruments.findIndex((inst) => normalizeInstrumentId(inst?.id) === targetInstrumentIdNorm);
  if (index === -1) {
    return null;
  }

  const slot = instruments[index];
  const slotId = slot?.id || '';
  const slotName = slot?.name || '';

  const clearedInstrument = createClearedInstrument(slotId);

  const newInstruments = [...instruments];
  newInstruments[index] = clearedInstrument;

  return {
    instruments: newInstruments,
    clearedInstrument,
    slotId,
    slotName,
  };
}

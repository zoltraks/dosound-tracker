import { useCallback } from 'react';
import type { RefObject, MutableRefObject } from 'react';
import type { Song, Instrument, Step } from '../synth/SoundDriver';
import { MAX_INSTRUMENTS, ENVELOPE_LENGTH } from '../constants/music';
import type { NavigationSection } from '../constants/navigation';
import type { YM2149 } from '../synth/YM2149';
import { isInstrumentEmpty } from '../utils/instrument';
import { DEFAULT_BASE_KEY } from '../utils/songParser';

// Export utility functions for external use
export interface InstrumentCreationResult {
  updatedSong: Song;
  newInstrument: Instrument;
}

export interface InstrumentUpdateResult {
  updatedSong: Song;
  updatedInstrument: Instrument;
}

export function createNewInstrumentForSong(song: Song): InstrumentCreationResult {
  const instruments = song.instrument;

  let slotIndex = instruments.findIndex((inst) => isInstrumentEmpty(inst));
  if (slotIndex === -1) {
    slotIndex = instruments.length;
  }

  const slotId = slotIndex.toString(16).padStart(2, '0').toUpperCase();

  const newInstrument: Instrument = {
    id: slotId,
    name: `Instrument ${slotIndex}`,
    volume: Array(32).fill(0x0f),
    shift: Array(32).fill(0),
    pitch: Array(32).fill(0),
    noise: Array(32).fill(0),
    mode: Array(32).fill(0),
    base: DEFAULT_BASE_KEY,
    sustain: null,
  };

  const updatedInstruments = [...instruments];
  if (slotIndex < instruments.length) {
    updatedInstruments[slotIndex] = newInstrument;
  } else {
    updatedInstruments.push(newInstrument);
  }

  const updatedSong: Song = {
    ...song,
    instrument: updatedInstruments,
  };

  return { updatedSong, newInstrument };
}

export function updateInstrumentInSong(
  song: Song,
  currentInstrument: Instrument,
  updates: Partial<Instrument>,
): InstrumentUpdateResult {
  const instruments = [...song.instrument];

  let targetIndex = instruments.findIndex((inst) => inst.id === currentInstrument.id);
  const updatedInstrument: Instrument = { ...currentInstrument, ...updates } as Instrument;

  if (targetIndex === -1) {
    const slotFromId = parseInt(currentInstrument.id, 16);
    if (Number.isFinite(slotFromId) && slotFromId >= 0 && slotFromId < MAX_INSTRUMENTS) {
      const clamped = slotFromId;

      for (let i = instruments.length; i <= clamped; i += 1) {
        if (!instruments[i]) {
          const slotId = i.toString(16).padStart(2, '0').toUpperCase();
          instruments[i] = {
            id: slotId,
            name: '',
            volume: Array(ENVELOPE_LENGTH).fill(0),
            shift: Array(ENVELOPE_LENGTH).fill(0),
            pitch: Array(ENVELOPE_LENGTH).fill(0),
            noise: Array(ENVELOPE_LENGTH).fill(0),
            mode: Array(ENVELOPE_LENGTH).fill(0),
            sustain: null,
          };
        }
      }

      targetIndex = clamped;
    }
  }

  if (targetIndex >= 0) {
    instruments[targetIndex] = updatedInstrument;
  } else {
    instruments.push(updatedInstrument);
  }

  const updatedSong: Song = {
    ...song,
    instrument: instruments,
  };

  return { updatedSong, updatedInstrument };
}

export function applyLoadedInstrumentToSong(
  song: Song,
  currentInstrumentId: string,
  newInstrument: Instrument,
): Song {
  const instruments = [...song.instrument];

  let targetIndex = instruments.findIndex((inst) => inst.id === currentInstrumentId);

  if (targetIndex === -1) {
    const slotFromId = parseInt(currentInstrumentId, 16);
    if (Number.isFinite(slotFromId) && slotFromId >= 0 && slotFromId < MAX_INSTRUMENTS) {
      const clamped = slotFromId;

      for (let i = instruments.length; i <= clamped; i += 1) {
        if (!instruments[i]) {
          const slotId = i.toString(16).padStart(2, '0').toUpperCase();
          instruments[i] = {
            id: slotId,
            name: '',
            volume: Array(ENVELOPE_LENGTH).fill(0),
            shift: Array(ENVELOPE_LENGTH).fill(0),
            pitch: Array(ENVELOPE_LENGTH).fill(0),
            noise: Array(ENVELOPE_LENGTH).fill(0),
            mode: Array(ENVELOPE_LENGTH).fill(0),
            sustain: null,
          };
        }
      }

      targetIndex = clamped;
    }
  }

  if (targetIndex >= 0) {
    instruments[targetIndex] = newInstrument;
  } else {
    instruments.push(newInstrument);
  }

  return {
    ...song,
    instrument: instruments,
  };
}

type InstrumentDeleteUsage = {
  instrumentId: string;
  instrumentName: string;
  usageCount: number;
  patternCount: number;
};

export interface ConsolidatedInstrumentManagementOptions {
  currentSong: Song;
  currentInstrument: Instrument;
  updateSong: (patch: Partial<Song>) => void;
  updateInstrument: (patch: Partial<Instrument>) => void;
  setCurrentInstrument: (instrument: Instrument) => void;
  activeSection: NavigationSection;
  lastTrackId: 'A' | 'B' | 'C';
  setActiveSection: (section: NavigationSection) => void;
  setInstrumentOperationSummary: (value: string) => void;
  instrumentDeleteUsage: InstrumentDeleteUsage;
  setInstrumentDeleteUsage: (usage: InstrumentDeleteUsage) => void;
  setIsInstrumentDeleteOpen: (open: boolean) => void;
  normalizeInstrumentId: (value?: string | number | null) => string;
  parseBaseKeyString: (value?: string) => { note: string; octave: number } | null;
  ym2149Ref: RefObject<YM2149 | null>;
  playInstTimerRef: MutableRefObject<number | null>;
  playInstStepRef: MutableRefObject<number>;
}

export interface ConsolidatedInstrumentManagementActions {
  // Basic operations
  renameInstrument: (name: string) => void;
  playInstrument: () => void;
  cloneInstrument: () => void;
  deleteInstrument: () => void;
  moveInstrument: (index: number, direction: 'up' | 'down') => void;
  
  // Instrument creation and management
  createNewInstrument: () => { updatedSong: Song; newInstrument: Instrument };
  updateInstrumentInSong: (updates: Partial<Instrument>) => { updatedSong: Song; updatedInstrument: Instrument };
  applyLoadedInstrument: (newInstrument: Instrument) => Song;
  
  // Delete confirmation
  cancelInstrumentDelete: () => void;
  confirmDeleteInstrumentAndNotes: () => void;
  confirmDeleteInstrumentOnly: () => void;
}

export const useInstrument = (
  options: ConsolidatedInstrumentManagementOptions
): ConsolidatedInstrumentManagementActions => {
  const {
    currentSong,
    currentInstrument,
    updateSong,
    updateInstrument,
    setCurrentInstrument,
    activeSection,
    lastTrackId,
    setActiveSection,
    setInstrumentOperationSummary,
    instrumentDeleteUsage,
    setInstrumentDeleteUsage,
    setIsInstrumentDeleteOpen,
    normalizeInstrumentId,
    parseBaseKeyString,
    ym2149Ref,
    playInstTimerRef,
    playInstStepRef,
  } = options;

  // Utility functions
  const createEmptyInstrument = useCallback((slotIndex: number): Instrument => ({
    id: slotIndex.toString(16).padStart(2, '0').toUpperCase(),
    name: '',
    volume: Array(ENVELOPE_LENGTH).fill(0),
    shift: Array(ENVELOPE_LENGTH).fill(0),
    pitch: Array(ENVELOPE_LENGTH).fill(0),
    noise: Array(ENVELOPE_LENGTH).fill(0),
    mode: Array(ENVELOPE_LENGTH).fill(0),
    sustain: null,
  }), []);

  const createDefaultInstrument = useCallback((slotIndex: number): Instrument => ({
    id: slotIndex.toString(16).padStart(2, '0').toUpperCase(),
    name: `Instrument ${slotIndex}`,
    volume: Array(ENVELOPE_LENGTH).fill(0x0f),
    shift: Array(ENVELOPE_LENGTH).fill(0),
    pitch: Array(ENVELOPE_LENGTH).fill(0),
    noise: Array(ENVELOPE_LENGTH).fill(0),
    mode: Array(ENVELOPE_LENGTH).fill(0),
    base: DEFAULT_BASE_KEY,
    sustain: null,
  }), []);

  const findFreeSlot = useCallback((instruments: Instrument[]): number => {
    let slotIndex = instruments.findIndex((inst) => isInstrumentEmpty(inst));
    if (slotIndex === -1) {
      slotIndex = instruments.length;
    }
    return slotIndex;
  }, []);

  const ensureInstrumentArraySize = useCallback((instruments: Instrument[], targetIndex: number): Instrument[] => {
    const result = [...instruments];
    for (let i = result.length; i <= targetIndex; i += 1) {
      if (!result[i]) {
        result[i] = createEmptyInstrument(i);
      }
    }
    return result;
  }, [createEmptyInstrument]);

  const getChannelFromSection = useCallback((): number => {
    if (activeSection === 'trackA') return 0;
    if (activeSection === 'trackB') return 1;
    if (activeSection === 'trackC') return 2;
    if (lastTrackId === 'B') return 1;
    if (lastTrackId === 'C') return 2;
    return 0;
  }, [activeSection, lastTrackId]);

  // Basic operations
  const renameInstrument = useCallback(
    (name: string) => {
      updateInstrument({ name });
    },
    [updateInstrument]
  );

  const playInstrument = useCallback(() => {
    if (!ym2149Ref.current) return;

    const base = parseBaseKeyString(currentInstrument.base || 'C-4');
    if (!base) return;

    const ym2149 = ym2149Ref.current;
    const channel = getChannelFromSection();

    if (playInstTimerRef.current !== null) {
      window.clearInterval(playInstTimerRef.current);
      playInstTimerRef.current = null;
    }

    playInstStepRef.current = 0;
    let playInstSubTick = 0;

    const noteData = { note: base.note, octave: base.octave };
    ym2149.updateChannelWithInstrument(channel, currentInstrument, noteData, 0, 0x0f);

    playInstTimerRef.current = window.setInterval(() => {
      const step = playInstStepRef.current;
      ym2149.updateChannelWithInstrument(channel, currentInstrument, noteData, step, 0x0f);

      playInstSubTick = (playInstSubTick + 1) % 2;
      if (playInstSubTick === 0) {
        playInstStepRef.current = playInstStepRef.current + 1;
      }

      if (playInstStepRef.current >= 64) {
        if (playInstTimerRef.current !== null) {
          window.clearInterval(playInstTimerRef.current);
          playInstTimerRef.current = null;
        }
        ym2149.writeRegister(0x08 + channel, 0x00);
      }
    }, 20);
  }, [currentInstrument, getChannelFromSection, parseBaseKeyString, playInstStepRef, playInstTimerRef, ym2149Ref]);

  const cloneInstrument = useCallback(() => {
    const instruments = currentSong.instrument;
    if (instruments.length >= MAX_INSTRUMENTS) {
      setInstrumentOperationSummary('No free instrument slots available.');
      return;
    }

    const currentIndex = instruments.findIndex(inst => inst.id === currentInstrument.id);
    const isSlotFree = (inst: Instrument | undefined) => !inst || isInstrumentEmpty(inst);

    let slotIndex = -1;

    if (currentIndex >= 0) {
      for (let i = currentIndex + 1; i < instruments.length; i++) {
        if (isSlotFree(instruments[i])) {
          slotIndex = i;
          break;
        }
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

    if (slotIndex === -1) {
      slotIndex = instruments.length;
    }

    if (slotIndex >= MAX_INSTRUMENTS) {
      setInstrumentOperationSummary('No free instrument slots available.');
      return;
    }

    const clonedInstrument: Instrument = {
      ...currentInstrument,
      id: slotIndex.toString(16).padStart(2, '0').toUpperCase(),
    };

    const updatedInstruments = [...instruments];
    if (slotIndex < updatedInstruments.length) {
      updatedInstruments[slotIndex] = clonedInstrument;
    } else {
      updatedInstruments.push(clonedInstrument);
    }

    updateSong({ instrument: updatedInstruments });
    setCurrentInstrument(clonedInstrument);
    setActiveSection('instrumentList');
  }, [currentSong.instrument, currentInstrument, updateSong, setCurrentInstrument, setActiveSection, setInstrumentOperationSummary]);

  const moveInstrument = useCallback((index: number, direction: 'up' | 'down') => {
    const instruments = currentSong.instrument;
    const length = instruments.length;

    if (length === 0) return;

    const delta = direction === 'up' ? -1 : 1;
    const targetIndex = index + delta;

    if (targetIndex < 0 || targetIndex >= length) return;

    const instrumentIdMap: Record<string, string> = {};
    const newInstruments: Instrument[] = [];

    for (let i = 0; i < length; i++) {
      const inst = instruments[i];
      if (!inst) continue;

      let newIndex = i;
      if (i === index) newIndex = targetIndex;
      else if (i === targetIndex) newIndex = index;

      const newId = newIndex.toString(16).padStart(2, '0').toUpperCase();
      const oldIdNorm = (inst.id || '').trim().toUpperCase();
      if (oldIdNorm) {
        instrumentIdMap[oldIdNorm] = newId;
      }

      newInstruments[newIndex] = { ...inst, id: newId };
    }

    const remappedPatterns = currentSong.pattern.map(pattern => {
      const step = (pattern.step || []).map(line => {
        const newLine: Step = { ...line };
        const note = newLine.note;
        if (note && typeof note.instrument === 'string') {
          const raw = note.instrument.trim().toUpperCase();
          const mapped = instrumentIdMap[raw];
          if (mapped) {
            newLine.note = { ...note, instrument: mapped };
          }
        }
        return newLine;
      });
      return { ...pattern, step };
    });

    updateSong({ instrument: newInstruments, pattern: remappedPatterns });

    let nextCurrentInstrument = currentInstrument;
    if (currentInstrument) {
      const currentIdNorm = (currentInstrument.id || '').trim().toUpperCase();
      const mappedId = instrumentIdMap[currentIdNorm];
      if (mappedId) {
        const updatedFromList = newInstruments.find(inst => inst && inst.id === mappedId);
        if (updatedFromList) {
          nextCurrentInstrument = updatedFromList;
        } else {
          nextCurrentInstrument = { ...currentInstrument, id: mappedId };
        }
      }
    }

    if (nextCurrentInstrument) setCurrentInstrument(nextCurrentInstrument);
    setActiveSection('instrumentList');
  }, [currentSong.instrument, currentSong.pattern, currentInstrument, updateSong, setCurrentInstrument, setActiveSection]);

  // Instrument creation and management
  const createNewInstrument = useCallback((): { updatedSong: Song; newInstrument: Instrument } => {
    const instruments = currentSong.instrument;
    const slotIndex = findFreeSlot(instruments);
    const newInstrument = createDefaultInstrument(slotIndex);

    const updatedInstruments = [...instruments];
    if (slotIndex < instruments.length) {
      updatedInstruments[slotIndex] = newInstrument;
    } else {
      updatedInstruments.push(newInstrument);
    }

    const updatedSong = { ...currentSong, instrument: updatedInstruments };
    return { updatedSong, newInstrument };
  }, [currentSong, findFreeSlot, createDefaultInstrument]);

  const updateInstrumentInSong = useCallback((updates: Partial<Instrument>): { updatedSong: Song; updatedInstrument: Instrument } => {
    const instruments = [...currentSong.instrument];
    const updatedInstrument: Instrument = { ...currentInstrument, ...updates } as Instrument;

    let targetIndex = instruments.findIndex((inst) => inst.id === currentInstrument.id);

    if (targetIndex === -1) {
      const slotFromId = parseInt(currentInstrument.id, 16);
      if (Number.isFinite(slotFromId) && slotFromId >= 0 && slotFromId < MAX_INSTRUMENTS) {
        const clamped = slotFromId;
        const updatedInstruments = ensureInstrumentArraySize(instruments, clamped);
        targetIndex = clamped;
        instruments.length = 0;
        instruments.push(...updatedInstruments);
      }
    }

    if (targetIndex >= 0) {
      instruments[targetIndex] = updatedInstrument;
    } else {
      instruments.push(updatedInstrument);
    }

    const updatedSong = { ...currentSong, instrument: instruments };
    return { updatedSong, updatedInstrument };
  }, [currentSong, currentInstrument, ensureInstrumentArraySize]);

  const applyLoadedInstrument = useCallback((newInstrument: Instrument): Song => {
    const instruments = [...currentSong.instrument];
    let targetIndex = instruments.findIndex((inst) => inst.id === currentInstrument.id);

    if (targetIndex === -1) {
      const slotFromId = parseInt(currentInstrument.id, 16);
      if (Number.isFinite(slotFromId) && slotFromId >= 0 && slotFromId < MAX_INSTRUMENTS) {
        const clamped = slotFromId;
        const updatedInstruments = ensureInstrumentArraySize(instruments, clamped);
        targetIndex = clamped;
        instruments.length = 0;
        instruments.push(...updatedInstruments);
      }
    }

    if (targetIndex >= 0) {
      instruments[targetIndex] = newInstrument;
    } else {
      instruments.push(newInstrument);
    }

    return { ...currentSong, instrument: instruments };
  }, [currentSong, currentInstrument, ensureInstrumentArraySize]);

  // Delete operations
  const deleteInstrument = useCallback(() => {
    const instruments = currentSong.instrument;
    if (!currentInstrument || instruments.length === 0) return;

    const targetIdNorm = normalizeInstrumentId(currentInstrument.id);
    if (!targetIdNorm) return;

    const index = instruments.findIndex(inst => normalizeInstrumentId(inst?.id) === targetIdNorm);
    if (index === -1) {
      setInstrumentOperationSummary('Current instrument not found in song instruments.');
      return;
    }

    let usageCount = 0;
    let patternCount = 0;

    currentSong.pattern.forEach(pattern => {
      if (!pattern) return;
      let patternHasUsage = false;

      (pattern.step || []).forEach(line => {
        if (!line || !line.note) return;
        const noteInstIdNorm = normalizeInstrumentId(line.note.instrument);
        if (noteInstIdNorm && noteInstIdNorm === targetIdNorm) {
          usageCount++;
          patternHasUsage = true;
        }
      });

      if (patternHasUsage) patternCount++;
    });

    if (usageCount === 0) {
      const slot = instruments[index];
      const slotId = slot?.id || currentInstrument.id;
      const clearedInstrument = createEmptyInstrument(parseInt(slotId, 16));

      const newInstruments = [...instruments];
      newInstruments[index] = clearedInstrument;

      updateSong({ instrument: newInstruments });
      setCurrentInstrument(clearedInstrument);
      setActiveSection('instrumentList');
      return;
    }

    const slot = instruments[index];
    const slotId = slot?.id || currentInstrument.id;
    const slotName = slot?.name || currentInstrument.name || '';

    setInstrumentDeleteUsage({
      instrumentId: slotId,
      instrumentName: slotName,
      usageCount,
      patternCount,
    });
    setIsInstrumentDeleteOpen(true);
  }, [currentSong, currentInstrument, normalizeInstrumentId, updateSong, setCurrentInstrument, setActiveSection, setInstrumentOperationSummary, setInstrumentDeleteUsage, setIsInstrumentDeleteOpen, createEmptyInstrument]);

  const cancelInstrumentDelete = useCallback(() => {
    setIsInstrumentDeleteOpen(false);
  }, [setIsInstrumentDeleteOpen]);

  const confirmDeleteInstrumentAndNotes = useCallback(() => {
    if (!instrumentDeleteUsage.instrumentId) {
      setIsInstrumentDeleteOpen(false);
      return;
    }

    const targetIdNorm = normalizeInstrumentId(instrumentDeleteUsage.instrumentId);
    if (!targetIdNorm) {
      setIsInstrumentDeleteOpen(false);
      return;
    }

    const instruments = currentSong.instrument;
    const index = instruments.findIndex(inst => normalizeInstrumentId(inst?.id) === targetIdNorm);
    if (index === -1) {
      setIsInstrumentDeleteOpen(false);
      setInstrumentOperationSummary('Instrument no longer found. No changes were applied.');
      return;
    }

    const slot = instruments[index];
    const slotId = slot?.id || instrumentDeleteUsage.instrumentId;
    const clearedInstrument = createEmptyInstrument(parseInt(slotId, 16));

    const newInstruments = [...instruments];
    newInstruments[index] = clearedInstrument;

    let notesCleared = 0;
    let patternsTouched = 0;

    const updatedPatterns = currentSong.pattern.map(pattern => {
      if (!pattern) return pattern;
      let patternChanged = false;
      const newStep = (pattern.step || []).map(line => {
        const newLine: Step = { ...line };
        let lineChanged = false;
        const note = newLine.note;
        if (note) {
          const noteInstIdNorm = normalizeInstrumentId(note.instrument);
          if (noteInstIdNorm && noteInstIdNorm === targetIdNorm) {
            newLine.note = null;
            lineChanged = true;
            notesCleared++;
          }
        }
        if (lineChanged) patternChanged = true;
        return newLine;
      });

      if (patternChanged) {
        patternsTouched++;
        return { ...pattern, step: newStep };
      }
      return pattern;
    });

    updateSong({ instrument: newInstruments, pattern: updatedPatterns });
    setCurrentInstrument(clearedInstrument);
    setActiveSection('instrumentList');
    setIsInstrumentDeleteOpen(false);

    const lines = [
      'Instrument removal complete.',
      '',
      `Instrument: ${slotId.trim() || '--'}${instrumentDeleteUsage.instrumentName ? ` (${instrumentDeleteUsage.instrumentName})` : ''}`,
      'Mode: Delete notes using this instrument and clear slot.',
      '',
      `Patterns with this instrument before delete: ${instrumentDeleteUsage.patternCount}`,
      `Notes using this instrument before delete: ${instrumentDeleteUsage.usageCount}`,
      '',
      `Patterns changed in this operation: ${patternsTouched}`,
      `Notes cleared in this operation: ${notesCleared}`,
    ];

    setInstrumentOperationSummary(lines.join('\n'));
  }, [currentSong, instrumentDeleteUsage, normalizeInstrumentId, updateSong, setCurrentInstrument, setActiveSection, setIsInstrumentDeleteOpen, setInstrumentOperationSummary, createEmptyInstrument]);

  const confirmDeleteInstrumentOnly = useCallback(() => {
    if (!instrumentDeleteUsage.instrumentId) {
      setIsInstrumentDeleteOpen(false);
      return;
    }

    const targetIdNorm = normalizeInstrumentId(instrumentDeleteUsage.instrumentId);
    if (!targetIdNorm) {
      setIsInstrumentDeleteOpen(false);
      return;
    }

    const instruments = currentSong.instrument;
    const index = instruments.findIndex(inst => normalizeInstrumentId(inst?.id) === targetIdNorm);
    if (index === -1) {
      setIsInstrumentDeleteOpen(false);
      setInstrumentOperationSummary('Instrument no longer found. No changes were applied.');
      return;
    }

    const slot = instruments[index];
    const slotId = slot?.id || instrumentDeleteUsage.instrumentId;
    const clearedInstrument = createEmptyInstrument(parseInt(slotId, 16));

    const newInstruments = [...instruments];
    newInstruments[index] = clearedInstrument;

    updateSong({ instrument: newInstruments });
    setCurrentInstrument(clearedInstrument);
    setActiveSection('instrumentList');
    setIsInstrumentDeleteOpen(false);

    const lines = [
      'Instrument removal complete.',
      '',
      `Instrument: ${slotId.trim() || '--'}${instrumentDeleteUsage.instrumentName ? ` (${instrumentDeleteUsage.instrumentName})` : ''}`,
      'Mode: Clear instrument only (keep notes).',
      '',
      `Patterns that reference this instrument: ${instrumentDeleteUsage.patternCount}`,
      `Notes that reference this instrument: ${instrumentDeleteUsage.usageCount}`,
      '',
      'Patterns changed in this operation: 0',
      'Notes cleared in this operation: 0',
    ];

    setInstrumentOperationSummary(lines.join('\n'));
  }, [currentSong, instrumentDeleteUsage, normalizeInstrumentId, updateSong, setCurrentInstrument, setActiveSection, setIsInstrumentDeleteOpen, setInstrumentOperationSummary, createEmptyInstrument]);

  return {
    renameInstrument,
    playInstrument,
    cloneInstrument,
    deleteInstrument,
    moveInstrument,
    createNewInstrument,
    updateInstrumentInSong,
    applyLoadedInstrument,
    cancelInstrumentDelete,
    confirmDeleteInstrumentAndNotes,
    confirmDeleteInstrumentOnly,
  };
};

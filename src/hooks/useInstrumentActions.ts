import { useCallback } from 'react';
import type { RefObject, MutableRefObject } from 'react';
import type { Song, Instrument, Step } from '../synth/SoundDriver';
import { MAX_INSTRUMENTS } from '../constants/music';
import type { NavigationSection } from '../constants/navigation';
import type { YM2149 } from '../synth/YM2149';
import { isInstrumentEmpty } from '../utils/instrument';

interface InstrumentDeleteUsage {
  instrumentId: string;
  instrumentName: string;
  usageCount: number;
  patternCount: number;
}

interface UseInstrumentActionsArgs {
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

interface UseInstrumentActionsResult {
  handleRenameInstrument: (name: string) => void;
  handlePlayInstrument: () => void;
  handleCloneInstrument: () => void;
  handleDeleteInstrument: () => void;
  handleMoveInstrument: (index: number, direction: 'up' | 'down') => void;
  handleCancelInstrumentDelete: () => void;
  handleConfirmDeleteInstrumentAndNotes: () => void;
  handleConfirmDeleteInstrumentOnly: () => void;
}

export function useInstrumentActions({
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
}: UseInstrumentActionsArgs): UseInstrumentActionsResult {
  const handleRenameInstrument = useCallback(
    (name: string) => {
      updateInstrument({ name });
    },
    [updateInstrument]
  );

  const handlePlayInstrument = useCallback(() => {
    if (!ym2149Ref.current) {
      return;
    }

    const base = parseBaseKeyString(currentInstrument.base || 'C-4');
    if (!base) {
      return;
    }

    const ym2149 = ym2149Ref.current;

    const channel =
      activeSection === 'trackA'
        ? 0
        : activeSection === 'trackB'
        ? 1
        : activeSection === 'trackC'
        ? 2
        : lastTrackId === 'B'
        ? 1
        : lastTrackId === 'C'
        ? 2
        : 0;

    if (playInstTimerRef.current !== null) {
      window.clearInterval(playInstTimerRef.current);
      playInstTimerRef.current = null;
    }

    playInstStepRef.current = 0;
    let playInstSubTick = 0;

    const noteData = { note: base.note, octave: base.octave };

    ym2149.updateChannelWithInstrument(channel, currentInstrument, noteData, 0, 0x0f);

    playInstTimerRef.current = window.setInterval(() => {
      // Advance envelope step every 40ms (every 2 x 20ms ticks)
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
  }, [activeSection, currentInstrument, lastTrackId, parseBaseKeyString, ym2149Ref, playInstTimerRef, playInstStepRef]);

  const handleCloneInstrument = useCallback(() => {
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
      setInstrumentOperationSummary('No free instrument slots available.');
      return;
    }

    const slotId = slotIndex.toString(16).padStart(2, '0').toUpperCase();

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

    updateSong({ instrument: updatedInstruments });
    setCurrentInstrument(clonedInstrument);
    setActiveSection('instrumentList');
  }, [currentSong.instrument, currentInstrument, updateSong, setCurrentInstrument, setActiveSection, setInstrumentOperationSummary]);

  const handleDeleteInstrument = useCallback(() => {
    const instruments = currentSong.instrument;
    if (!currentInstrument || instruments.length === 0) {
      return;
    }

    const targetIdNorm = normalizeInstrumentId(currentInstrument.id);
    if (!targetIdNorm) {
      return;
    }

    const index = instruments.findIndex(inst => normalizeInstrumentId(inst?.id) === targetIdNorm);
    if (index === -1) {
      setInstrumentOperationSummary('Current instrument not found in song instruments.');
      return;
    }

    let usageCount = 0;
    let patternCount = 0;

    currentSong.pattern.forEach(pattern => {
      if (!pattern) {
        return;
      }

      let patternHasUsage = false;

      (pattern.step || []).forEach(line => {
        if (!line) {
          return;
        }

        const note = line.note;
        if (!note) {
          return;
        }

        const noteInstIdNorm = normalizeInstrumentId(note.instrument);
        if (noteInstIdNorm && noteInstIdNorm === targetIdNorm) {
          usageCount++;
          patternHasUsage = true;
        }
      });

      if (patternHasUsage) {
        patternCount++;
      }
    });

    if (usageCount === 0) {
      const slot = instruments[index];
      const slotId = slot?.id || currentInstrument.id;

      const clearedInstrument: Instrument = {
        id: slotId,
        name: '',
        volume: Array(32).fill(0),
        shift: Array(32).fill(0),
        pitch: Array(32).fill(0),
        noise: Array(32).fill(0),
        mode: Array(32).fill(0),
      };

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
  }, [
    currentSong.instrument,
    currentSong.pattern,
    currentInstrument,
    normalizeInstrumentId,
    updateSong,
    setCurrentInstrument,
    setActiveSection,
    setInstrumentOperationSummary,
    setInstrumentDeleteUsage,
    setIsInstrumentDeleteOpen,
  ]);

  const handleMoveInstrument = useCallback(
    (index: number, direction: 'up' | 'down') => {
      const instruments = currentSong.instrument;
      const length = instruments.length;

      if (length === 0) {
        return;
      }

      const delta = direction === 'up' ? -1 : 1;
      const targetIndex = index + delta;

      if (targetIndex < 0 || targetIndex >= length) {
        return;
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

        const newId = newIndex.toString(16).padStart(2, '0').toUpperCase();
        const oldIdNorm = (inst.id || '').trim().toUpperCase();
        if (oldIdNorm) {
          instrumentIdMap[oldIdNorm] = newId;
        }

        newInstruments[newIndex] = {
          ...inst,
          id: newId,
        };
      }

      const remappedPatterns = currentSong.pattern.map(pattern => {
        const step = (pattern.step || []).map(line => {
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

      updateSong({
        instrument: newInstruments,
        pattern: remappedPatterns,
      });

      let nextCurrentInstrument = currentInstrument;
      if (currentInstrument) {
        const currentIdNorm = (currentInstrument.id || '').trim().toUpperCase();
        const mappedId = instrumentIdMap[currentIdNorm];
        if (mappedId) {
          const updatedFromList = newInstruments.find(inst => inst && inst.id === mappedId);
          if (updatedFromList) {
            nextCurrentInstrument = updatedFromList;
          } else {
            nextCurrentInstrument = {
              ...currentInstrument,
              id: mappedId,
            };
          }
        }
      }

      if (nextCurrentInstrument) {
        setCurrentInstrument(nextCurrentInstrument);
      }

      setActiveSection('instrumentList');
    },
    [currentSong.instrument, currentSong.pattern, currentInstrument, updateSong, setCurrentInstrument, setActiveSection]
  );

  const handleCancelInstrumentDelete = useCallback(() => {
    setIsInstrumentDeleteOpen(false);
  }, [setIsInstrumentDeleteOpen]);

  const handleConfirmDeleteInstrumentAndNotes = useCallback(() => {
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
    const patterns = currentSong.pattern;

    const index = instruments.findIndex(inst => normalizeInstrumentId(inst?.id) === targetIdNorm);
    if (index === -1) {
      setIsInstrumentDeleteOpen(false);
      setInstrumentOperationSummary('Instrument no longer found. No changes were applied.');
      return;
    }

    const slot = instruments[index];
    const slotId = slot?.id || instrumentDeleteUsage.instrumentId;
    const slotName = slot?.name || instrumentDeleteUsage.instrumentName || '';

    const clearedInstrument: Instrument = {
      id: slotId,
      name: '',
      volume: Array(32).fill(0),
      shift: Array(32).fill(0),
      pitch: Array(32).fill(0),
      noise: Array(32).fill(0),
      mode: Array(32).fill(0),
    };

    const newInstruments = [...instruments];
    newInstruments[index] = clearedInstrument;

    let notesCleared = 0;
    let patternsTouched = 0;

    const updatedPatterns = patterns.map(pattern => {
      if (!pattern) {
        return pattern;
      }

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

    updateSong({
      instrument: newInstruments,
      pattern: updatedPatterns,
    });

    setCurrentInstrument(clearedInstrument);
    setActiveSection('instrumentList');
    setIsInstrumentDeleteOpen(false);

    const idLabel = slotId.trim() || '--';
    const nameLabel = slotName || '';

    const lines: string[] = [];
    lines.push('Instrument removal complete.');
    lines.push('');
    lines.push(`Instrument: ${idLabel}${nameLabel ? ` (${nameLabel})` : ''}`);
    lines.push('Mode: Delete notes using this instrument and clear slot.');
    lines.push('');
    lines.push(`Patterns with this instrument before delete: ${instrumentDeleteUsage.patternCount}`);
    lines.push(`Notes using this instrument before delete: ${instrumentDeleteUsage.usageCount}`);
    lines.push('');
    lines.push(`Patterns changed in this operation: ${patternsTouched}`);
    lines.push(`Notes cleared in this operation: ${notesCleared}`);

    setInstrumentOperationSummary(lines.join('\n'));
  }, [
    currentSong.instrument,
    currentSong.pattern,
    instrumentDeleteUsage.instrumentId,
    instrumentDeleteUsage.instrumentName,
    instrumentDeleteUsage.patternCount,
    instrumentDeleteUsage.usageCount,
    normalizeInstrumentId,
    updateSong,
    setCurrentInstrument,
    setActiveSection,
    setIsInstrumentDeleteOpen,
    setInstrumentOperationSummary,
  ]);

  const handleConfirmDeleteInstrumentOnly = useCallback(() => {
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
    const index = instruments.findIndex((inst: Instrument | undefined) => normalizeInstrumentId(inst?.id) === targetIdNorm);
    if (index === -1) {
      setIsInstrumentDeleteOpen(false);
      setInstrumentOperationSummary('Instrument no longer found. No changes were applied.');
      return;
    }

    const slot = instruments[index];
    const slotId = slot?.id || instrumentDeleteUsage.instrumentId;
    const slotName = slot?.name || instrumentDeleteUsage.instrumentName || '';

    const clearedInstrument: Instrument = {
      id: slotId,
      name: '',
      volume: Array(32).fill(0),
      shift: Array(32).fill(0),
      pitch: Array(32).fill(0),
      noise: Array(32).fill(0),
      mode: Array(32).fill(0),
    };

    const newInstruments = [...instruments];
    newInstruments[index] = clearedInstrument;

    updateSong({ instrument: newInstruments });
    setCurrentInstrument(clearedInstrument);
    setActiveSection('instrumentList');
    setIsInstrumentDeleteOpen(false);

    const idLabel = slotId.trim() || '--';
    const nameLabel = slotName || '';

    const lines: string[] = [];
    lines.push('Instrument removal complete.');
    lines.push('');
    lines.push(`Instrument: ${idLabel}${nameLabel ? ` (${nameLabel})` : ''}`);
    lines.push('Mode: Clear instrument only (keep notes).');
    lines.push('');
    lines.push(`Patterns that reference this instrument: ${instrumentDeleteUsage.patternCount}`);
    lines.push(`Notes that reference this instrument: ${instrumentDeleteUsage.usageCount}`);
    lines.push('');
    lines.push('Patterns changed in this operation: 0');
    lines.push('Notes cleared in this operation: 0');

    setInstrumentOperationSummary(lines.join('\n'));
  }, [
    currentSong.instrument,
    instrumentDeleteUsage.instrumentId,
    instrumentDeleteUsage.instrumentName,
    instrumentDeleteUsage.patternCount,
    instrumentDeleteUsage.usageCount,
    normalizeInstrumentId,
    updateSong,
    setCurrentInstrument,
    setActiveSection,
    setIsInstrumentDeleteOpen,
    setInstrumentOperationSummary,
  ]);

  return {
    handleRenameInstrument,
    handlePlayInstrument,
    handleCloneInstrument,
    handleDeleteInstrument,
    handleMoveInstrument,
    handleCancelInstrumentDelete,
    handleConfirmDeleteInstrumentAndNotes,
    handleConfirmDeleteInstrumentOnly,
  };
}

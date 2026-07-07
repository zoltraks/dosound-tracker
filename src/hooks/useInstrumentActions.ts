import { useCallback, useEffect, useRef } from 'react';
import type { RefObject, MutableRefObject } from 'react';
import type { Song, Instrument } from '../synth/SoundDriver';
import type { NavigationSection } from '../constants/navigation';
import type { YM2149 } from '../synth/YM2149';
import { DEFAULT_SONG_FRAME } from '../constants/song';
import {
  clearInstrumentAndNotes,
  clearInstrumentOnly,
  cloneInstrumentToNextFreeSlot,
  countInstrumentUsage,
  createClearedInstrument,
  moveInstrumentAndRemapPatterns,
} from '../utils/instrumentOperations';
import {
  buildInstrumentRemovalSummary,
  getInstrumentPlaybackChannel,
} from '../utils/instrumentActionUtils';
import type { InstrumentId } from '../types/branded';
import type { InstrumentDeleteUsage } from './useModalState';

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
  normalizeInstrumentId: (value?: string | number | null) => InstrumentId;
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
  const tickIntervalMs = 1000 / (currentSong.frame ?? DEFAULT_SONG_FRAME);
  const tickIntervalMsRef = useRef(tickIntervalMs);
  useEffect(() => {
    tickIntervalMsRef.current = tickIntervalMs;
  }, [tickIntervalMs]);

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

    const channel = getInstrumentPlaybackChannel(activeSection, lastTrackId);

    if (playInstTimerRef.current !== null) {
      window.clearInterval(playInstTimerRef.current);
      playInstTimerRef.current = null;
    }

    playInstStepRef.current = 0;
    let playInstSubTick = 0;

    const noteData = { note: base.note, octave: base.octave };

    ym2149.updateChannelWithInstrument(channel, currentInstrument, noteData, 0, 0x0f);

    playInstTimerRef.current = window.setInterval(() => {
      // Advance envelope step every 2 ticks
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
    }, tickIntervalMsRef.current);
  }, [activeSection, currentInstrument, lastTrackId, parseBaseKeyString, ym2149Ref, playInstTimerRef, playInstStepRef]);

  const handleCloneInstrument = useCallback(() => {
    const result = cloneInstrumentToNextFreeSlot(currentSong.instrument, currentInstrument);
    if (!result.ok) {
      setInstrumentOperationSummary(result.message);
      return;
    }

    updateSong({ instrument: result.instruments });
    setCurrentInstrument(result.clonedInstrument);
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

    const { usageCount, patternCount } = countInstrumentUsage(
      currentSong.pattern,
      targetIdNorm,
      normalizeInstrumentId
    );

    if (usageCount === 0) {
      const slot = instruments[index];
      const slotId = normalizeInstrumentId(slot?.id || currentInstrument.id);

      const clearedInstrument = createClearedInstrument(slotId);

      const newInstruments = [...instruments];
      newInstruments[index] = clearedInstrument;

      updateSong({ instrument: newInstruments });
      setCurrentInstrument(clearedInstrument);
      setActiveSection('instrumentList');
      return;
    }

    const slot = instruments[index];
    const slotId = normalizeInstrumentId(slot?.id || currentInstrument.id);
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
      const moved = moveInstrumentAndRemapPatterns(
        currentSong.instrument,
        currentSong.pattern,
        index,
        direction
      );

      if (!moved) {
        return;
      }

      updateSong({ instrument: moved.instruments, pattern: moved.remappedPatterns });

      let nextCurrentInstrument = currentInstrument;
      if (currentInstrument) {
        const currentIdNorm = (currentInstrument.id || '').trim().toUpperCase();
        const mappedId = moved.instrumentIdMap[currentIdNorm];
        if (mappedId) {
          const updatedFromList = moved.instruments.find(inst => inst && inst.id === mappedId);
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

    const cleared = clearInstrumentAndNotes(instruments, patterns, targetIdNorm, normalizeInstrumentId);
    if (!cleared) {
      setIsInstrumentDeleteOpen(false);
      setInstrumentOperationSummary('Instrument no longer found. No changes were applied.');
      return;
    }

    updateSong({ instrument: cleared.instruments, pattern: cleared.patterns });

    setCurrentInstrument(cleared.clearedInstrument);
    setActiveSection('instrumentList');
    setIsInstrumentDeleteOpen(false);

    const slotId = cleared.slotId || instrumentDeleteUsage.instrumentId;
    const slotName = cleared.slotName || instrumentDeleteUsage.instrumentName || '';

    const idLabel = slotId.trim() || '--';
    const nameLabel = slotName || '';

    const summary = buildInstrumentRemovalSummary({
      slotId: idLabel,
      slotName: nameLabel,
      modeLabel: 'Delete notes using this instrument and clear slot.',
      patternsBeforeLabel: 'Patterns with this instrument before delete',
      notesBeforeLabel: 'Notes using this instrument before delete',
      patternsBefore: instrumentDeleteUsage.patternCount,
      notesBefore: instrumentDeleteUsage.usageCount,
      patternsChanged: cleared.patternsTouched,
      notesCleared: cleared.notesCleared,
    });

    setInstrumentOperationSummary(summary);
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

    const cleared = clearInstrumentOnly(instruments, targetIdNorm, normalizeInstrumentId);
    if (!cleared) {
      setIsInstrumentDeleteOpen(false);
      setInstrumentOperationSummary('Instrument no longer found. No changes were applied.');
      return;
    }

    updateSong({ instrument: cleared.instruments });
    setCurrentInstrument(cleared.clearedInstrument);
    setActiveSection('instrumentList');
    setIsInstrumentDeleteOpen(false);

    const slotId = cleared.slotId || instrumentDeleteUsage.instrumentId;
    const slotName = cleared.slotName || instrumentDeleteUsage.instrumentName || '';

    const idLabel = slotId.trim() || '--';
    const nameLabel = slotName || '';

    const summary = buildInstrumentRemovalSummary({
      slotId: idLabel,
      slotName: nameLabel,
      modeLabel: 'Clear instrument only (keep notes).',
      patternsBeforeLabel: 'Patterns that reference this instrument',
      notesBeforeLabel: 'Notes that reference this instrument',
      patternsBefore: instrumentDeleteUsage.patternCount,
      notesBefore: instrumentDeleteUsage.usageCount,
      patternsChanged: 0,
      notesCleared: 0,
    });

    setInstrumentOperationSummary(summary);
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

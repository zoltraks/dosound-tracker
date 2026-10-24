/* eslint-disable react-hooks/exhaustive-deps */
import { useCallback, useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import type { NavigationSection } from '../../constants/navigation.ts';
import type { Instrument, Song } from '../../synth/SoundDriver.ts';

export interface UseInstrumentDialogsParams {
  currentSong: Song;
  currentInstrument: Instrument;
  updateSong: (updates: Partial<Song>) => void;
  updateInstrument: (updates: Partial<Instrument>) => void;
  setCurrentInstrument: (instrument: Instrument) => void;
  setActiveSection: (section: NavigationSection) => void;
  setInstrumentPanelFocusRevision: Dispatch<SetStateAction<number>>;
  setIsInstrumentMidiOpen: (open: boolean) => void;
  setIsInstrumentColorOpen: (open: boolean) => void;
}

export interface UseInstrumentDialogsResult {
  instrumentMidiTarget: Instrument | null;
  instrumentColorTarget: Instrument | null;
  handleInstrumentSelect: (instrument: Instrument) => void;
  handleOpenInstrumentMidi: (instrument: Instrument) => void;
  handleCloseInstrumentMidi: () => void;
  handleSaveInstrumentMidi: (midi: { channel: number | null; program: number | null }) => void;
  handleOpenInstrumentColor: (instrument: Instrument) => void;
  handleCloseInstrumentColor: () => void;
  handleSaveInstrumentColor: (color: string | null) => void;
  handleClearInstrumentColor: () => void;
  handleChangeBaseKey: (note: string, octave: number) => void;
}

export function useInstrumentDialogs({
  currentSong,
  currentInstrument,
  updateSong,
  updateInstrument,
  setCurrentInstrument,
  setActiveSection,
  setInstrumentPanelFocusRevision,
  setIsInstrumentMidiOpen,
  setIsInstrumentColorOpen,
}: UseInstrumentDialogsParams): UseInstrumentDialogsResult {
  const [instrumentMidiTarget, setInstrumentMidiTarget] = useState<Instrument | null>(null);
  const [instrumentColorTarget, setInstrumentColorTarget] = useState<Instrument | null>(null);

  // Handle instrument selection
  const handleInstrumentSelect = useCallback((instrument: Instrument) => {
    setCurrentInstrument(instrument);
  }, []);

  const handleOpenInstrumentMidi = useCallback((instrument: Instrument) => {
    setInstrumentMidiTarget(instrument);
    setIsInstrumentMidiOpen(true);
  }, []);

  const handleCloseInstrumentMidi = useCallback(() => {
    setIsInstrumentMidiOpen(false);
    setInstrumentMidiTarget(null);
    setActiveSection('instrumentList');
    setInstrumentPanelFocusRevision((prev) => prev + 1);
  }, [setActiveSection, setInstrumentPanelFocusRevision]);

  const handleSaveInstrumentMidi = useCallback(
    (midi: { channel: number | null; program: number | null }) => {
      if (!instrumentMidiTarget) {
        setIsInstrumentMidiOpen(false);
        setActiveSection('instrumentList');
        setInstrumentPanelFocusRevision((prev) => prev + 1);
        return;
      }

      const targetId = instrumentMidiTarget.id;

      const nextInstruments = currentSong.instrument.map((inst) => {
        if (!inst || inst.id !== targetId) {
          return inst;
        }

        const hasChannel = typeof midi.channel === 'number' && Number.isFinite(midi.channel);
        const hasProgram = typeof midi.program === 'number' && Number.isFinite(midi.program);

        let nextMidi: Instrument['midi'] | undefined;
        if (hasChannel || hasProgram) {
          nextMidi = {
            channel: hasChannel ? midi.channel : null,
            program: hasProgram ? midi.program : null,
          };
        } else {
          nextMidi = undefined;
        }

        return {
          ...inst,
          midi: nextMidi,
        };
      });

      updateSong({ instrument: nextInstruments });

      if (currentInstrument && currentInstrument.id === targetId) {
        const updated = nextInstruments.find((inst) => inst && inst.id === targetId);
        if (updated) {
          setCurrentInstrument(updated);
        }
      }

      setIsInstrumentMidiOpen(false);
      setInstrumentMidiTarget(null);
      setActiveSection('instrumentList');
      setInstrumentPanelFocusRevision((prev) => prev + 1);
    },
    [
      instrumentMidiTarget,
      currentSong.instrument,
      updateSong,
      currentInstrument,
      setCurrentInstrument,
      setActiveSection,
      setInstrumentPanelFocusRevision,
    ],
  );

  const handleOpenInstrumentColor = useCallback((instrument: Instrument) => {
    setInstrumentColorTarget(instrument);
    setIsInstrumentColorOpen(true);
  }, []);

  const handleCloseInstrumentColor = useCallback(() => {
    setIsInstrumentColorOpen(false);
    setInstrumentColorTarget(null);
    setActiveSection('instrumentList');
    setInstrumentPanelFocusRevision((prev) => prev + 1);
  }, [setActiveSection, setInstrumentPanelFocusRevision]);

  const handleSaveInstrumentColor = useCallback(
    (color: string | null) => {
      if (!instrumentColorTarget) {
        setIsInstrumentColorOpen(false);
        setActiveSection('instrumentList');
        setInstrumentPanelFocusRevision((prev) => prev + 1);
        return;
      }

      const targetId = instrumentColorTarget.id;

      const nextInstruments = currentSong.instrument.map((inst) => {
        if (!inst || inst.id !== targetId) {
          return inst;
        }

        const nextColor = color && color.trim() ? color : null;

        return {
          ...inst,
          color: nextColor,
        };
      });

      updateSong({ instrument: nextInstruments });

      if (currentInstrument && currentInstrument.id === targetId) {
        const updated = nextInstruments.find((inst) => inst && inst.id === targetId);
        if (updated) {
          setCurrentInstrument(updated);
        }
      }

      setIsInstrumentColorOpen(false);
      setInstrumentColorTarget(null);
      setActiveSection('instrumentList');
      setInstrumentPanelFocusRevision((prev) => prev + 1);
    },
    [
      instrumentColorTarget,
      currentSong.instrument,
      updateSong,
      currentInstrument,
      setCurrentInstrument,
      setActiveSection,
      setInstrumentPanelFocusRevision,
    ],
  );

  const handleClearInstrumentColor = useCallback(() => {
    if (!instrumentColorTarget) {
      setIsInstrumentColorOpen(false);
      setActiveSection('instrumentList');
      setInstrumentPanelFocusRevision((prev) => prev + 1);
      return;
    }

    const targetId = instrumentColorTarget.id;

    const nextInstruments = currentSong.instrument.map((inst) => {
      if (!inst || inst.id !== targetId) {
        return inst;
      }

      return {
        ...inst,
        color: null,
      };
    });

    updateSong({ instrument: nextInstruments });

    if (currentInstrument && currentInstrument.id === targetId) {
      const updated = nextInstruments.find((inst) => inst && inst.id === targetId);
      if (updated) {
        setCurrentInstrument(updated);
      }
    }

    setIsInstrumentColorOpen(false);
    setInstrumentColorTarget(null);
    setActiveSection('instrumentList');
    setInstrumentPanelFocusRevision((prev) => prev + 1);
  }, [
    instrumentColorTarget,
    currentSong.instrument,
    updateSong,
    currentInstrument,
    setCurrentInstrument,
    setActiveSection,
    setInstrumentPanelFocusRevision,
  ]);

  const handleChangeBaseKey = useCallback(
    (note: string, octave: number) => {
      const upper = note.toUpperCase();
      const formatted = upper.endsWith('#') ? `${upper}${octave}` : `${upper}-${octave}`;
      updateInstrument({ base: formatted });
    },
    [updateInstrument],
  );

  return {
    instrumentMidiTarget,
    instrumentColorTarget,
    handleInstrumentSelect,
    handleOpenInstrumentMidi,
    handleCloseInstrumentMidi,
    handleSaveInstrumentMidi,
    handleOpenInstrumentColor,
    handleCloseInstrumentColor,
    handleSaveInstrumentColor,
    handleClearInstrumentColor,
    handleChangeBaseKey,
  };
}

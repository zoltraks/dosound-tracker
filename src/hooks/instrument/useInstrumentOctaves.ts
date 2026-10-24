/* eslint-disable react-hooks/exhaustive-deps */
import { useCallback, useEffect, useState } from 'react';
import { StorageKeys } from '../../utils/storage/storageKeys.ts';
import { DEFAULT_OCTAVE, MAX_OCTAVE, MIN_OCTAVE } from '../../constants/music.ts';
import type { Instrument } from '../../synth/SoundDriver.ts';

type UseInstrumentOctavesParams = {
  currentInstrument: Instrument | undefined;
  setCurrentOctave: (octave: number) => void;
  updateInstrument: (updates: Partial<Instrument>) => void;
};

export const useInstrumentOctaves = ({
  currentInstrument,
  setCurrentOctave,
  updateInstrument,
}: UseInstrumentOctavesParams) => {
  const [instrumentOctaves, setInstrumentOctaves] = useState<Record<string, number>>(() => {
    try {
      const stored = localStorage.getItem(StorageKeys.INSTRUMENT_OCTAVES);
      if (!stored) return {};
      const parsed = JSON.parse(stored);
      if (parsed && typeof parsed === 'object') {
        return parsed as Record<string, number>;
      }
    } catch {
      // ignore
    }
    return {};
  });

  useEffect(() => {
    const id = currentInstrument?.id;
    if (!id) return;

    const instOctave = currentInstrument.octave;
    if (typeof instOctave === 'number' && Number.isFinite(instOctave)) {
      const clamped = Math.max(MIN_OCTAVE, Math.min(MAX_OCTAVE, Math.floor(instOctave)));
      setCurrentOctave(clamped);
      return;
    }

    const storedOctave = instrumentOctaves[id];
    if (typeof storedOctave === 'number' && Number.isFinite(storedOctave)) {
      const clamped = Math.max(MIN_OCTAVE, Math.min(MAX_OCTAVE, Math.floor(storedOctave)));
      setCurrentOctave(clamped);
    } else {
      setCurrentOctave(DEFAULT_OCTAVE);
    }
  }, [currentInstrument, instrumentOctaves]);

  const handleOctaveChange = useCallback(
    (octave: number) => {
      setCurrentOctave(octave);
      const id = currentInstrument?.id;
      if (!id) return;
      setInstrumentOctaves((prev) => ({ ...prev, [id]: octave }));
      updateInstrument({ octave });
    },
    [currentInstrument?.id, setCurrentOctave, updateInstrument],
  );

  return { instrumentOctaves, handleOctaveChange };
};

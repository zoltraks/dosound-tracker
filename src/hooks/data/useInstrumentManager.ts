import { useCallback, useMemo } from 'react';
import type { Instrument } from '../../synth/SoundDriver';
import type { IInstrumentService } from '../../services';
import { InstrumentService } from '../../services';
import { useInstrumentStore } from '../../stores/instrumentStore';

export function useInstrumentManager() {
  const currentInstrument = useInstrumentStore(state => state.currentInstrument);
  const instruments = useInstrumentStore(state => state.instruments);
  const setCurrentInstrument = useInstrumentStore(state => state.setCurrentInstrument);
  const setInstruments = useInstrumentStore(state => state.setInstruments);

  const instrumentService: IInstrumentService = useMemo(() => new InstrumentService(), []);

  const createInstrument = useCallback(
    (template?: Partial<Instrument>) => {
      const created = instrumentService.createInstrument(template);
      const nextList = [...instruments, created];
      setInstruments(nextList);
      setCurrentInstrument(created);
      return created;
    },
    [instrumentService, instruments, setCurrentInstrument, setInstruments]
  );

  const updateInstrument = useCallback(
    (updates: Partial<Instrument>) => {
      if (!currentInstrument) {
        return null;
      }
      const updated = instrumentService.updateInstrument(currentInstrument, updates);
      const nextList = instruments.map(inst => (inst.id === updated.id ? updated : inst));
      setInstruments(nextList);
      setCurrentInstrument(updated);
      return updated;
    },
    [currentInstrument, instrumentService, instruments, setCurrentInstrument, setInstruments]
  );

  const deleteInstrument = useCallback(
    (instrumentId: string) => {
      const nextList = instrumentService.deleteInstrument(instrumentId, instruments);
      setInstruments(nextList);
      if (currentInstrument && currentInstrument.id === instrumentId) {
        setCurrentInstrument(null);
      }
    },
    [currentInstrument, instrumentService, instruments, setCurrentInstrument, setInstruments]
  );

  return {
    currentInstrument,
    instruments,
    createInstrument,
    updateInstrument,
    deleteInstrument,
  };
}

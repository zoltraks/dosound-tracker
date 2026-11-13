import { useCallback, useRef, useState } from 'react';
import type { MidiMonitorEntry } from '../../utils/midi/midiUtils.ts';
import { formatTime, MAX_MONITOR_ENTRIES } from '../../utils/midi/midiUtils.ts';

// The in/out monitor lists share one entry-id counter and the
// MAX_MONITOR_ENTRIES truncation bound.
export const useMidiMonitors = () => {
  const [inMonitor, setInMonitor] = useState<MidiMonitorEntry[]>([]);
  const [outMonitor, setOutMonitor] = useState<MidiMonitorEntry[]>([]);
  const nextEntryIdRef = useRef<number>(1);

  const addInMonitorEntry = useCallback((entry: Omit<MidiMonitorEntry, 'id' | 'time'>) => {
    const id = nextEntryIdRef.current++;
    const time = formatTime();
    setInMonitor((prev) => {
      const next = [...prev, { ...entry, id, time }];
      if (next.length > MAX_MONITOR_ENTRIES) {
        return next.slice(next.length - MAX_MONITOR_ENTRIES);
      }
      return next;
    });
  }, []);

  const addOutMonitorEntry = useCallback((entry: Omit<MidiMonitorEntry, 'id' | 'time'>) => {
    const id = nextEntryIdRef.current++;
    const time = formatTime();
    setOutMonitor((prev) => {
      const next = [...prev, { ...entry, id, time }];
      if (next.length > MAX_MONITOR_ENTRIES) {
        return next.slice(next.length - MAX_MONITOR_ENTRIES);
      }
      return next;
    });
  }, []);

  const clearMonitors = useCallback(() => {
    setInMonitor([]);
    setOutMonitor([]);
  }, []);

  return { inMonitor, outMonitor, addInMonitorEntry, addOutMonitorEntry, clearMonitors };
};

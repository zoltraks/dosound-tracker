import { useState, useEffect, useRef, useCallback } from 'react';
import type { MidiDeviceInfo } from '../utils/midiUtils';

type NavigatorWithMidi = Navigator & {
  requestMIDIAccess?: (options?: { sysex: boolean }) => Promise<MIDIAccess>;
};

export function useMidiDeviceManagement() {
  const [isSupported, setIsSupported] = useState<boolean>(false);
  const [accessError, setAccessError] = useState<string | null>(null);
  const [devices, setDevices] = useState<{ inputs: MidiDeviceInfo[]; outputs: MidiDeviceInfo[] }>(
    { inputs: [], outputs: [] }
  );
  
  // We keep the MIDIAccess object in a ref so we can access it without triggering re-renders,
  // but we also need to expose it to other hooks.
  const midiAccessRef = useRef<MIDIAccess | null>(null);

  const scanDevices = useCallback(() => {
    const access = midiAccessRef.current;
    if (!access) {
      setDevices({ inputs: [], outputs: [] });
      return;
    }

    const inputs: MidiDeviceInfo[] = [];
    const outputs: MidiDeviceInfo[] = [];

    try {
      const inputIterator: IterableIterator<MIDIInput> | null =
        access.inputs && typeof access.inputs.values === 'function'
          ? access.inputs.values()
          : null;
      if (inputIterator) {
        while (true) {
          const result = inputIterator.next();
          if (result.done) break;
          const input = result.value;
          if (input && typeof input.id === 'string') {
            inputs.push({
              id: input.id,
              name: typeof input.name === 'string' && input.name.trim().length > 0
                ? input.name
                : `Input ${inputs.length + 1}`,
            });
          }
        }
      }

      const outputIterator: IterableIterator<MIDIOutput> | null =
        access.outputs && typeof access.outputs.values === 'function'
          ? access.outputs.values()
          : null;
      if (outputIterator) {
        while (true) {
          const result = outputIterator.next();
          if (result.done) break;
          const output = result.value;
          if (output && typeof output.id === 'string') {
            outputs.push({
              id: output.id,
              name: typeof output.name === 'string' && output.name.trim().length > 0
                ? output.name
                : `Output ${outputs.length + 1}`,
            });
          }
        }
      }
    } catch {
      // Ignore device enumeration errors
    }

    setDevices({ inputs, outputs });
  }, []);

  const refreshDevices = useCallback(() => {
    const access = midiAccessRef.current;
    if (access) {
      scanDevices();
      return;
    }

    if (typeof navigator === 'undefined') {
      return;
    }

    const nav = navigator as NavigatorWithMidi;
    if (typeof nav.requestMIDIAccess !== 'function') {
      return;
    }

    nav.requestMIDIAccess({ sysex: false })
      .then(newAccess => {
        midiAccessRef.current = newAccess;
        setIsSupported(true);
        setAccessError(null);
        scanDevices();

        try {
          newAccess.onstatechange = () => {
            scanDevices();
          };
        } catch {
          // ignore onstatechange errors
        }
      })
      .catch((error: unknown) => {
        setIsSupported(false);
        const message = error instanceof Error ? error.message : String(error);
        setAccessError(message);
        setDevices({ inputs: [], outputs: [] });
      });
  }, [scanDevices]);

  useEffect(() => {
    let cancelled = false;

    const markUnsupported = (message: string) => {
      Promise.resolve().then(() => {
        if (cancelled) {
          return;
        }
        setIsSupported(false);
        setAccessError(message);
        setDevices({ inputs: [], outputs: [] });
      });
    };

    if (typeof navigator === 'undefined') {
      markUnsupported('Navigator is not available in this environment.');
      return () => {
        cancelled = true;
      };
    }

    const nav = navigator as NavigatorWithMidi;
    if (typeof nav.requestMIDIAccess !== 'function') {
      markUnsupported('Web MIDI API is not supported in this browser.');
      return () => {
        cancelled = true;
      };
    }

    nav.requestMIDIAccess({ sysex: false })
      .then(access => {
        if (cancelled) return;
        midiAccessRef.current = access;
        setIsSupported(true);
        setAccessError(null);
        scanDevices();

        try {
          access.onstatechange = () => {
            scanDevices();
          };
        } catch {
          // ignore onstatechange errors
        }
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        setIsSupported(false);
        const message = error instanceof Error ? error.message : String(error);
        setAccessError(message);
      });

    return () => {
      cancelled = true;
      // We do NOT close midiAccess here because it might be shared or reused.
      // However, usually MIDIAccess doesn't have a close method. 
      // The individual inputs/outputs will be managed by the message processing hook.
    };
  }, [scanDevices]);

  return {
    isSupported,
    accessError,
    devices,
    refreshDevices,
    midiAccessRef,
  };
}

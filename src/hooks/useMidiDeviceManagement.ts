import { useCallback, useEffect } from 'react';
import type { MidiConfig, MidiDeviceInfo } from './useMidi';

type NavigatorWithMidi = Navigator & {
  requestMIDIAccess?: (options?: { sysex: boolean }) => Promise<MIDIAccess>;
};

export function useMidiDeviceManagement(args: {
  config: MidiConfig;
  midiAccessRef: React.MutableRefObject<MIDIAccess | null>;
  currentInputRef: React.MutableRefObject<MIDIInput | null>;
  currentOutputRef: React.MutableRefObject<MIDIOutput | null>;
  currentInputHandlerRef: React.MutableRefObject<((event: MIDIMessageEvent) => void) | null>;
  setIsSupported: (supported: boolean) => void;
  setAccessError: (error: string | null) => void;
  setDevices: (devices: { inputs: MidiDeviceInfo[]; outputs: MidiDeviceInfo[] }) => void;
  handleMidiMessage: (event: MIDIMessageEvent) => void;
  isElectronEnv: boolean;
  sendSystemReset: () => void;
}): {
  refreshDevices: () => void;
} {
  const {
    config,
    midiAccessRef,
    currentInputRef,
    currentOutputRef,
    currentInputHandlerRef,
    setIsSupported,
    setAccessError,
    setDevices,
    handleMidiMessage,
    isElectronEnv,
    sendSystemReset,
  } = args;

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
        access.inputs && typeof access.inputs.values === 'function' ? access.inputs.values() : null;
      if (inputIterator) {
        while (true) {
          const result = inputIterator.next();
          if (result.done) break;
          const input = result.value;
          if (input && typeof input.id === 'string') {
            inputs.push({
              id: input.id,
              name:
                typeof input.name === 'string' && input.name.trim().length > 0
                  ? input.name
                  : `Input ${inputs.length + 1}`,
            });
          }
        }
      }

      const outputIterator: IterableIterator<MIDIOutput> | null =
        access.outputs && typeof access.outputs.values === 'function' ? access.outputs.values() : null;
      if (outputIterator) {
        while (true) {
          const result = outputIterator.next();
          if (result.done) break;
          const output = result.value;
          if (output && typeof output.id === 'string') {
            outputs.push({
              id: output.id,
              name:
                typeof output.name === 'string' && output.name.trim().length > 0
                  ? output.name
                  : `Output ${outputs.length + 1}`,
            });
          }
        }
      }
    } catch {
      // ignore
    }

    setDevices({ inputs, outputs });
  }, [setDevices]);

  const refreshDevices = () => {
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
      .then((newAccess) => {
        midiAccessRef.current = newAccess;
        setIsSupported(true);
        setAccessError(null);
        scanDevices();

        try {
          newAccess.onstatechange = () => {
            scanDevices();
          };
        } catch {
          // ignore
        }
      })
      .catch((error: unknown) => {
        setIsSupported(false);
        const message = error instanceof Error ? error.message : String(error);
        setAccessError(message);
        setDevices({ inputs: [], outputs: [] });
      });
  };

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
      .then((access) => {
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
          // ignore
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
      const input = currentInputRef.current;
      const handler = currentInputHandlerRef.current;
      if (input && handler) {
        if (typeof input.removeEventListener === 'function') {
          try {
            input.removeEventListener('midimessage', handler);
          } catch {
            // ignore
          }
        } else if ('onmidimessage' in input) {
          try {
            (input as MIDIInput).onmidimessage = null;
          } catch {
            // ignore
          }
        }
      }

      try {
        if (input && typeof input.close === 'function') {
          input.close();
        }
      } catch {
        // ignore
      }

      const output = currentOutputRef.current;
      try {
        if (output && typeof output.close === 'function') {
          output.close();
        }
      } catch {
        // ignore
      }
      currentInputRef.current = null;
      currentOutputRef.current = null;
    };
  }, [scanDevices, setAccessError, setDevices, setIsSupported]);

  useEffect(() => {
    const access = midiAccessRef.current;
    if (!access) {
      return;
    }

    let nextInput: MIDIInput | null = null;
    if (config.inputEnabled && config.inputId) {
      try {
        const rawInput =
          access.inputs && typeof access.inputs.get === 'function' ? access.inputs.get(config.inputId) : null;
        nextInput = rawInput ?? null;
      } catch {
        nextInput = null;
      }
    }

    const previousInput = currentInputRef.current;
    const previousHandler = currentInputHandlerRef.current;

    if (previousInput && previousHandler) {
      if (typeof previousInput.removeEventListener === 'function') {
        try {
          previousInput.removeEventListener('midimessage', previousHandler);
        } catch {
          // ignore
        }
      } else if ('onmidimessage' in previousInput) {
        try {
          (previousInput as MIDIInput).onmidimessage = null;
        } catch {
          // ignore
        }
      }
    }

    if (previousInput && previousInput !== nextInput) {
      try {
        if (typeof previousInput.close === 'function') {
          previousInput.close();
        }
      } catch {
        // ignore
      }
    }

    currentInputRef.current = nextInput;
    currentInputHandlerRef.current = null;

    if (nextInput && config.inputEnabled) {
      try {
        try {
          if (typeof nextInput.open === 'function') {
            const result = nextInput.open();
            if (result && typeof (result as Promise<unknown>).then === 'function') {
              (result as Promise<unknown>).catch(() => {
                // ignore
              });
            }
          }
        } catch {
          // ignore
        }

        if (typeof nextInput.addEventListener === 'function') {
          nextInput.addEventListener('midimessage', handleMidiMessage);
        } else {
          (nextInput as MIDIInput).onmidimessage = handleMidiMessage;
        }
        currentInputHandlerRef.current = handleMidiMessage;
      } catch {
        // ignore
      }
    }
  }, [config.inputEnabled, config.inputId, handleMidiMessage]);

  useEffect(() => {
    const access = midiAccessRef.current;
    if (!access) {
      const previousOutput = currentOutputRef.current;
      if (previousOutput) {
        try {
          if (typeof previousOutput.close === 'function') {
            previousOutput.close();
          }
        } catch {
          // ignore
        }
      }
      currentOutputRef.current = null;
      return;
    }

    let nextOutput: MIDIOutput | null = null;
    if (config.outputEnabled && config.outputId) {
      try {
        const rawOutput =
          access.outputs && typeof access.outputs.get === 'function'
            ? access.outputs.get(config.outputId)
            : null;
        nextOutput = rawOutput ?? null;
      } catch {
        nextOutput = null;
      }
    }

    const previousOutput = currentOutputRef.current;
    if (previousOutput && previousOutput !== nextOutput) {
      try {
        if (typeof previousOutput.close === 'function') {
          previousOutput.close();
        }
      } catch {
        // ignore
      }
    }

    if (nextOutput && config.outputEnabled) {
      try {
        if (typeof nextOutput.open === 'function') {
          const result = nextOutput.open();
          if (result && typeof (result as Promise<unknown>).then === 'function') {
            (result as Promise<unknown>).catch(() => {
              // ignore
            });
          }
        }
      } catch {
        // ignore
      }
    }

    currentOutputRef.current = nextOutput;

    if (!isElectronEnv && nextOutput && config.outputEnabled && nextOutput !== previousOutput) {
      sendSystemReset();
    }
  }, [config.outputEnabled, config.outputId, isElectronEnv, sendSystemReset]);

  return {
    refreshDevices,
  };
}

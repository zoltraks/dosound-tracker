import { useEffect, useRef, type MutableRefObject } from 'react';
import { logger } from '../../utils/log/logger.ts';
import type { MidiConfiguration } from '../../utils/midi/midiUtils.ts';

const isElectronEnv =
  typeof window !== 'undefined' && !!(window as unknown as { electronAPI?: unknown }).electronAPI;

// Owns the physical MIDI device wiring: the input attach effect subscribes
// the message handler, the output attach effect opens the device and fires
// the system reset, and the cleanup effect detaches everything on unmount.
export const useMidiDeviceAttachments = (
  midiAccessRef: MutableRefObject<MIDIAccess | null>,
  configuration: MidiConfiguration,
  handleMidiMessage: (event: MIDIMessageEvent) => void,
  sendSystemReset: () => void,
  currentOutputRef: MutableRefObject<MIDIOutput | null>,
): void => {
  const currentInputRef = useRef<MIDIInput | null>(null);
  const currentInputHandlerRef = useRef<((event: MIDIMessageEvent) => void) | null>(null);

  useEffect(() => {
    const access = midiAccessRef.current;
    if (!access) {
      return;
    }

    let nextInput: MIDIInput | null = null;
    if (configuration.inputEnabled && configuration.inputId) {
      try {
        const rawInput =
          access.inputs && typeof access.inputs.get === 'function'
            ? access.inputs.get(configuration.inputId)
            : null;
        nextInput = rawInput ?? null;
      } catch (error) {
        logger.warn('Failed to look up MIDI input', error);
        nextInput = null;
      }
    }

    const previousInput = currentInputRef.current;
    const previousHandler = currentInputHandlerRef.current;

    if (previousInput && previousHandler) {
      if (typeof previousInput.removeEventListener === 'function') {
        try {
          previousInput.removeEventListener('midimessage', previousHandler);
        } catch (error) {
          logger.warn('Failed to detach MIDI input listener', error);
        }
      } else if ('onmidimessage' in previousInput) {
        try {
          (previousInput as MIDIInput).onmidimessage = null;
        } catch (error) {
          logger.warn('Failed to detach MIDI input listener', error);
        }
      }
    }

    if (previousInput && previousInput !== nextInput) {
      try {
        if (typeof previousInput.close === 'function') {
          previousInput.close();
        }
      } catch (error) {
        logger.warn('Failed to detach MIDI input listener', error);
      }
    }

    currentInputRef.current = nextInput;
    currentInputHandlerRef.current = null;

    if (nextInput && configuration.inputEnabled) {
      try {
        try {
          if (typeof nextInput.open === 'function') {
            const result = nextInput.open();
            if (result && typeof result.then === 'function') {
              result.catch((error) => {
                logger.warn('Failed to open MIDI input', error);
              });
            }
          }
        } catch (error) {
          logger.warn('MIDI operation failed', error);
        }

        if (typeof nextInput.addEventListener === 'function') {
          nextInput.addEventListener('midimessage', handleMidiMessage);
        } else {
          (nextInput as MIDIInput).onmidimessage = handleMidiMessage;
        }
        currentInputHandlerRef.current = handleMidiMessage;
      } catch (error) {
        logger.warn('Failed to attach MIDI input listener', error);
      }
    }
  }, [configuration.inputEnabled, configuration.inputId, handleMidiMessage, midiAccessRef]);

  useEffect(() => {
    const access = midiAccessRef.current;
    if (!access) {
      const previousOutput = currentOutputRef.current;
      if (previousOutput) {
        try {
          if (typeof previousOutput.close === 'function') {
            previousOutput.close();
          }
        } catch (error) {
          logger.warn('Failed to close MIDI output', error);
        }
      }
      currentOutputRef.current = null;
      return;
    }

    let nextOutput: MIDIOutput | null = null;
    if (configuration.outputEnabled && configuration.outputId) {
      try {
        const rawOutput =
          access.outputs && typeof access.outputs.get === 'function'
            ? access.outputs.get(configuration.outputId)
            : null;
        nextOutput = rawOutput ?? null;
      } catch (error) {
        logger.warn('Failed to look up MIDI output', error);
        nextOutput = null;
      }
    }

    const previousOutput = currentOutputRef.current;
    if (previousOutput && previousOutput !== nextOutput) {
      try {
        if (typeof previousOutput.close === 'function') {
          previousOutput.close();
        }
      } catch (error) {
        logger.warn('Failed to close MIDI output', error);
      }
    }

    if (nextOutput && configuration.outputEnabled) {
      try {
        if (typeof nextOutput.open === 'function') {
          const result = nextOutput.open();
          if (result && typeof result.then === 'function') {
            result.catch((error) => {
              logger.warn('Failed to open MIDI output', error);
            });
          }
        }
      } catch (error) {
        logger.warn('MIDI operation failed', error);
      }
    }

    currentOutputRef.current = nextOutput;

    if (
      !isElectronEnv &&
      nextOutput &&
      configuration.outputEnabled &&
      nextOutput !== previousOutput
    ) {
      sendSystemReset();
    }
  }, [
    configuration.outputEnabled,
    configuration.outputId,
    sendSystemReset,
    midiAccessRef,
    currentOutputRef,
  ]);

  useEffect(() => {
    return () => {
      const input = currentInputRef.current;
      const handler = currentInputHandlerRef.current;
      if (input && handler) {
        if (typeof input.removeEventListener === 'function') {
          try {
            input.removeEventListener('midimessage', handler);
          } catch (error) {
            logger.warn('Failed to detach MIDI input listener', error);
          }
        } else if ('onmidimessage' in input) {
          try {
            (input as MIDIInput).onmidimessage = null;
          } catch (error) {
            logger.warn('Failed to detach MIDI input listener', error);
          }
        }
      }

      try {
        if (input && typeof input.close === 'function') {
          input.close();
        }
      } catch (error) {
        logger.warn('Failed to detach MIDI input listener', error);
      }

      const output = currentOutputRef.current;
      try {
        if (output && typeof output.close === 'function') {
          output.close();
        }
      } catch (error) {
        logger.warn('Failed to close MIDI output', error);
      }
      currentInputRef.current = null;
      currentOutputRef.current = null;
    };
  }, [currentOutputRef]);
};

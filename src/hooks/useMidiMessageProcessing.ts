import { useState, useEffect, useRef, useCallback, type MutableRefObject } from 'react';
import type {
  MidiConfiguration,
  MidiMonitorEntry,
  MidiNoteEvent,
  MidiDeviceInfo,
} from '../utils/midiUtils';
import { resolveDeviceName, formatTime, MAX_MONITOR_ENTRIES } from '../utils/midiUtils';

const isElectronEnv =
  typeof window !== 'undefined' &&
  !!(window as unknown as { electronAPI?: unknown }).electronAPI;

export function useMidiMessageProcessing(
  midiAccessRef: MutableRefObject<MIDIAccess | null>,
  devices: { inputs: MidiDeviceInfo[]; outputs: MidiDeviceInfo[] },
  configuration: MidiConfiguration,
  enableMonitors: boolean,
  onNoteEvent: (event: MidiNoteEvent) => void
) {
  const [inMonitor, setInMonitor] = useState<MidiMonitorEntry[]>([]);
  const [outMonitor, setOutMonitor] = useState<MidiMonitorEntry[]>([]);

  const currentInputRef = useRef<MIDIInput | null>(null);
  const currentOutputRef = useRef<MIDIOutput | null>(null);
  const currentInputHandlerRef = useRef<((event: MIDIMessageEvent) => void) | null>(null);
  const nextEntryIdRef = useRef<number>(1);

  const addInMonitorEntry = useCallback((entry: Omit<MidiMonitorEntry, 'id' | 'time'>) => {
    const id = nextEntryIdRef.current++;
    const time = formatTime();
    setInMonitor(prev => {
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
    setOutMonitor(prev => {
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

  const handleMidiMessage = useCallback((event: MIDIMessageEvent) => {
    if (!event || !event.data || !(event.data instanceof Uint8Array)) {
      return;
    }

    const data: number[] = Array.from(event.data);
    if (data.length === 0) return;

    const status = data[0] | 0;
    const data1 = data.length >= 2 ? data[1] | 0 : 0;
    const data2 = data.length >= 3 ? data[2] | 0 : 0;

    const command = status & 0xf0;
    const channel = (status & 0x0f) + 1; // 1-16

    const dataHex = data
      .map(byte => byte.toString(16).toUpperCase().padStart(2, '0'))
      .join(' ');

    const channelHex = channel.toString(16).toUpperCase().padStart(2, '0');

    const time = formatTime();

    let debugOn = false;
    try {
      debugOn = localStorage.getItem('dosound-tracker-debug-mode') === 'on';
    } catch {
      debugOn = false;
    }

    let type = 'Unknown';
    let noteLabel = '';
    let value: number | null = null;

    let deviceId: string = configuration.inputId || '';
    const target = event.target as MIDIInput | null;
    if (target && typeof target.id === 'string') {
      deviceId = target.id;
    }
    const deviceName = resolveDeviceName(deviceId || null, devices.inputs, 'MIDI In');

    if (command === 0x80 || (command === 0x90 && data2 === 0)) {
      type = 'Note Off';
      const noteNumber = data1;
      const midiOctave = Math.floor(noteNumber / 12) - 1;
      const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
      const noteName = noteNames[noteNumber % 12] || 'C';
      const noteBase = noteName.length === 1 ? `${noteName}-` : noteName;
      noteLabel = `${noteBase}${midiOctave}`;
      value = data2;

      addInMonitorEntry({
        data: dataHex,
        device: deviceName,
        channel: channelHex,
        type,
        note: noteLabel,
        value,
      });

      if (debugOn && enableMonitors) {
        console.log('MIDI IN', {
          time,
          note: noteLabel,
          channel,
          velocity: data2,
          type,
          status,
          data: dataHex,
          device: deviceName,
        });
      }

      onNoteEvent({
        type: 'noteOff',
        noteNumber,
        noteName,
        octave: midiOctave,
        velocity: data2,
        channel,
        deviceId,
        deviceName,
      });
    } else if (command === 0x90) {
      type = 'Note On';
      const noteNumber = data1;
      const midiOctave = Math.floor(noteNumber / 12) - 1;
      const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
      const noteName = noteNames[noteNumber % 12] || 'C';
      const noteBase = noteName.length === 1 ? `${noteName}-` : noteName;
      noteLabel = `${noteBase}${midiOctave}`;
      value = data2;

      addInMonitorEntry({
        data: dataHex,
        device: deviceName,
        channel: channelHex,
        type,
        note: noteLabel,
        value,
      });

      if (debugOn && enableMonitors) {
        console.log('MIDI IN', {
          time,
          note: noteLabel,
          channel,
          velocity: data2,
          type,
          status,
          data: dataHex,
          device: deviceName,
        });
      }

      onNoteEvent({
        type: 'noteOn',
        noteNumber,
        noteName,
        octave: midiOctave,
        velocity: data2,
        channel,
        deviceId,
        deviceName,
      });
    } else if (command === 0xb0) {
      type = 'Control Change';
      noteLabel = `CC ${data1}`;
      value = data2;

      addInMonitorEntry({
        data: dataHex,
        device: deviceName,
        channel: channelHex,
        type,
        note: noteLabel,
        value,
      });

      if (debugOn && enableMonitors) {
        console.log('MIDI IN', {
          time,
          note: noteLabel,
          channel,
          value,
          type,
          status,
          data: dataHex,
          device: deviceName,
        });
      }
    } else {
      type = 'Other';
      noteLabel = '';
      value = null;

      addInMonitorEntry({
        data: dataHex,
        device: deviceName,
        channel: channelHex,
        type,
        note: noteLabel,
        value,
      });

      if (debugOn && enableMonitors) {
        console.log('MIDI IN', {
          time,
          type,
          data: dataHex,
          channel,
          device: deviceName,
          note: noteLabel,
          value,
          status,
        });
      }
    }
  }, [
    addInMonitorEntry,
    configuration.inputId,
    devices.inputs,
    enableMonitors,
    onNoteEvent,
  ]);

  const sendNoteMessage = useCallback(
    (
      kind: 'noteOn' | 'noteOff',
      channel: number,
      noteNumber: number,
      velocity: number = 0x40
    ) => {
      if (!configuration.outputEnabled) {
        return;
      }

      const safeChannel = Math.max(1, Math.min(16, channel | 0));
      const clampedNote = Math.max(0, Math.min(127, noteNumber | 0));

      let vel = Math.max(0, Math.min(127, velocity | 0));
      if (kind === 'noteOn' && configuration.ignoreOutputVolume) {
        vel = 0x7f;
      }

      const statusBase = kind === 'noteOn' ? 0x90 : 0x80;
      const status = statusBase | ((safeChannel - 1) & 0x0f);

      const bytes = [status, clampedNote, vel];

      const dataHex = bytes
        .map(byte => byte.toString(16).toUpperCase().padStart(2, '0'))
        .join(' ');

      const channelHex = safeChannel.toString(16).toUpperCase().padStart(2, '0');
      const outputDeviceName = resolveDeviceName(
        configuration.outputId ?? null,
        devices.outputs,
        'MIDI Out'
      );

      const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
      const midiOctave = Math.floor(clampedNote / 12) - 1;
      const noteName = noteNames[clampedNote % 12] || 'C';
      const noteBase = noteName.length === 1 ? `${noteName}-` : noteName;
      const noteLabel = `${noteBase}${midiOctave}`;

      const type = kind === 'noteOn' ? 'Note On' : 'Note Off';

      addOutMonitorEntry({
        data: dataHex,
        device: outputDeviceName,
        channel: channelHex,
        type,
        note: noteLabel,
        value: vel,
      });

      let debugOn = false;
      try {
        debugOn = localStorage.getItem('dosound-tracker-debug-mode') === 'on';
      } catch {
        debugOn = false;
      }

      if (debugOn && enableMonitors) {
        const time = formatTime();
        console.log('MIDI OUT', {
          time,
          note: noteLabel,
          channel: safeChannel,
          velocity: vel,
          type,
          status,
          data: dataHex,
          device: outputDeviceName,
        });
      }

      const output = currentOutputRef.current;
      if (!output || typeof output.send !== 'function') {
        return;
      }

      try {
        const buffer = new Uint8Array(bytes);
        output.send(buffer);
      } catch {
        // Ignore send errors
      }
    }, [
      addOutMonitorEntry,
      configuration.ignoreOutputVolume,
      configuration.outputEnabled,
      configuration.outputId,
      devices.outputs,
      enableMonitors,
    ]);

  const sendNoteOn = useCallback(
    (channel: number, noteNumber: number, velocity: number) => {
      sendNoteMessage('noteOn', channel, noteNumber, velocity);
    },
    [sendNoteMessage]
  );

  const sendNoteOff = useCallback(
    (channel: number, noteNumber: number, velocity: number = 0x40) => {
      sendNoteMessage('noteOff', channel, noteNumber, velocity);
    },
    [sendNoteMessage]
  );

  const sendProgramChange = useCallback(
    (channel: number, program: number) => {
      if (!configuration.outputEnabled) {
        return;
      }

      const safeChannel = Math.max(1, Math.min(16, channel | 0));
      const clampedProgram = Math.max(0, Math.min(127, program | 0));

      const status = 0xc0 | ((safeChannel - 1) & 0x0f);
      const bytes = [status, clampedProgram];

      const dataHex = bytes
        .map(byte => byte.toString(16).toUpperCase().padStart(2, '0'))
        .join(' ');

      const channelHex = safeChannel.toString(16).toUpperCase().padStart(2, '0');
      const outputDeviceName = resolveDeviceName(
        configuration.outputId ?? null,
        devices.outputs,
        'MIDI Out'
      );

      const type = 'Program Change';
      const noteLabel = `PC ${clampedProgram}`;

      addOutMonitorEntry({
        data: dataHex,
        device: outputDeviceName,
        channel: channelHex,
        type,
        note: noteLabel,
        value: clampedProgram,
      });

      let debugOn = false;
      try {
        debugOn = localStorage.getItem('dosound-tracker-debug-mode') === 'on';
      } catch {
        debugOn = false;
      }

      if (debugOn && enableMonitors) {
        const time = formatTime();
        console.log('MIDI OUT', {
          time,
          note: noteLabel,
          channel: safeChannel,
          value: clampedProgram,
          type,
          status,
          data: dataHex,
          device: outputDeviceName,
        });
      }

      const output = currentOutputRef.current;
      if (!output || typeof output.send !== 'function') {
        return;
      }

      try {
        const buffer = new Uint8Array(bytes);
        output.send(buffer);
      } catch {
        // Ignore send errors
      }
    },
    [
      addOutMonitorEntry,
      configuration.outputEnabled,
      configuration.outputId,
      devices.outputs,
      enableMonitors,
    ]
  );

  const sendSystemReset = useCallback(() => {
    if (!configuration.outputEnabled) {
      return;
    }

    const output = currentOutputRef.current;
    if (!output || typeof output.send !== 'function') {
      return;
    }

    const status = 0xff;
    const bytes = [status];

    const dataHex = bytes
      .map(byte => byte.toString(16).toUpperCase().padStart(2, '0'))
      .join(' ');

    const outputDeviceName = resolveDeviceName(
      configuration.outputId ?? null,
      devices.outputs,
      'MIDI Out'
    );

    addOutMonitorEntry({
      data: dataHex,
      device: outputDeviceName,
      channel: '--',
      type: 'System Reset',
      note: '',
      value: null,
    });

    let debugOn = false;
    try {
      debugOn = localStorage.getItem('dosound-tracker-debug-mode') === 'on';
    } catch {
      debugOn = false;
    }

    if (debugOn && enableMonitors) {
      const time = formatTime();
      console.log('MIDI OUT', {
        time,
        type: 'System Reset',
        status,
        data: dataHex,
        device: outputDeviceName,
      });
    }

    try {
      const buffer = new Uint8Array(bytes);
      output.send(buffer);
    } catch {
      // Ignore send errors
    }
  }, [
    addOutMonitorEntry,
    configuration.outputEnabled,
    configuration.outputId,
    devices.outputs,
    enableMonitors,
  ]);

  // Handle Input Changes
  useEffect(() => {
    const access = midiAccessRef.current;
    if (!access) {
      return;
    }

    let nextInput: MIDIInput | null = null;
    if (configuration.inputEnabled && configuration.inputId) {
      try {
        const rawInput = access.inputs && typeof access.inputs.get === 'function'
          ? access.inputs.get(configuration.inputId)
          : null;
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

    if (nextInput && configuration.inputEnabled) {
      try {
        try {
          if (typeof nextInput.open === 'function') {
            const result = nextInput.open();
            if (result && typeof result.then === 'function') {
              result.catch(() => {
                // ignore open errors
              });
            }
          }
        } catch {
          // ignore open errors
        }

        if (typeof nextInput.addEventListener === 'function') {
          nextInput.addEventListener('midimessage', handleMidiMessage);
        } else {
          (nextInput as MIDIInput).onmidimessage = handleMidiMessage;
        }
        currentInputHandlerRef.current = handleMidiMessage;
      } catch {
        // ignore listener errors
      }
    }
  }, [configuration.inputEnabled, configuration.inputId, handleMidiMessage, midiAccessRef]);

  // Handle Output Changes
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
    if (configuration.outputEnabled && configuration.outputId) {
      try {
        const rawOutput = access.outputs && typeof access.outputs.get === 'function'
          ? access.outputs.get(configuration.outputId)
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

    if (nextOutput && configuration.outputEnabled) {
      try {
        if (typeof nextOutput.open === 'function') {
          const result = nextOutput.open();
          if (result && typeof result.then === 'function') {
            result.catch(() => {
              // ignore open errors
            });
          }
        }
      } catch {
        // ignore open errors
      }
    }

    currentOutputRef.current = nextOutput;

    if (!isElectronEnv && nextOutput && configuration.outputEnabled && nextOutput !== previousOutput) {
      sendSystemReset();
    }
  }, [configuration.outputEnabled, configuration.outputId, sendSystemReset, midiAccessRef]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
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
  }, []);

  return {
    inMonitor,
    outMonitor,
    clearMonitors,
    sendNoteOn,
    sendNoteOff,
    sendProgramChange,
    sendSystemReset,
  };
}

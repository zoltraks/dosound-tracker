import { useCallback, useEffect, useRef, useState } from 'react';

export interface MidiConfig {
  inputEnabled: boolean;
  outputEnabled: boolean;
  inputId: string | null;
  outputId: string | null;
  ignoreInputVolume: boolean;
  ignoreOutputVolume: boolean;
}

export interface MidiDeviceInfo {
  id: string;
  name: string;
}

export interface MidiMonitorEntry {
  id: number;
  time: string;
  data: string;
  device: string;
  channel: string;
  type: string;
  note: string;
  value: number | null;
}

export interface MidiNoteEvent {
  type: 'noteOn' | 'noteOff';
  noteNumber: number;
  noteName: string;
  octave: number;
  velocity: number;
  channel: number;
  deviceId: string;
  deviceName: string;
}

interface UseMidiResult {
  isSupported: boolean;
  accessError: string | null;
  devices: {
    inputs: MidiDeviceInfo[];
    outputs: MidiDeviceInfo[];
  };
  config: MidiConfig;
  setConfig: (config: MidiConfig) => void;
  inMonitor: MidiMonitorEntry[];
  outMonitor: MidiMonitorEntry[];
  clearMonitors: () => void;
  refreshDevices: () => void;
  sendNoteOn: (channel: number, noteNumber: number, velocity: number) => void;
  sendNoteOff: (channel: number, noteNumber: number, velocity?: number) => void;
  sendProgramChange: (channel: number, program: number) => void;
  sendSystemReset: () => void;
}

const MAX_MONITOR_ENTRIES = 1000;
const STORAGE_KEY = 'dosound-tracker-midi-config';

interface RawMidiConfig {
  inputEnabled?: boolean;
  outputEnabled?: boolean;
  inputId?: string | null;
  outputId?: string | null;
  ignoreInputVolume?: boolean;
  ignoreOutputVolume?: boolean;
}

type NavigatorWithMidi = Navigator & {
  requestMIDIAccess?: (options?: { sysex: boolean }) => Promise<MIDIAccess>;
};

const isElectronEnv =
  typeof window !== 'undefined' &&
  !!(window as unknown as { electronAPI?: unknown }).electronAPI;

export function useMidi(
  onNoteEvent: (event: MidiNoteEvent) => void,
  options?: { enableMonitors?: boolean }
): UseMidiResult {
  const enableMonitors = options?.enableMonitors ?? true;
  const [isSupported, setIsSupported] = useState<boolean>(false);
  const [accessError, setAccessError] = useState<string | null>(null);
  const [devices, setDevices] = useState<{ inputs: MidiDeviceInfo[]; outputs: MidiDeviceInfo[] }>(
    { inputs: [], outputs: [] }
  );
  const [config, setConfigState] = useState<MidiConfig>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        return {
          inputEnabled: false,
          outputEnabled: false,
          inputId: null,
          outputId: null,
          ignoreInputVolume: true,
          ignoreOutputVolume: true,
        };
      }
      const parsed = JSON.parse(raw) as RawMidiConfig;
      return {
        inputEnabled: !!parsed.inputEnabled,
        outputEnabled: !!parsed.outputEnabled,
        inputId: parsed.inputId ?? null,
        outputId: parsed.outputId ?? null,
        ignoreInputVolume:
          typeof parsed.ignoreInputVolume === 'boolean' ? parsed.ignoreInputVolume : true,
        ignoreOutputVolume:
          typeof parsed.ignoreOutputVolume === 'boolean' ? parsed.ignoreOutputVolume : true,
      };
    } catch {
      return {
        inputEnabled: false,
        outputEnabled: false,
        inputId: null,
        outputId: null,
        ignoreInputVolume: true,
        ignoreOutputVolume: true,
      };
    }
  });

  const [inMonitor, setInMonitor] = useState<MidiMonitorEntry[]>([]);
  const [outMonitor, setOutMonitor] = useState<MidiMonitorEntry[]>([]);

  const midiAccessRef = useRef<MIDIAccess | null>(null);
  const currentInputRef = useRef<MIDIInput | null>(null);
  const currentOutputRef = useRef<MIDIOutput | null>(null);
  const currentInputHandlerRef = useRef<((event: MIDIMessageEvent) => void) | null>(null);
  const nextEntryIdRef = useRef<number>(1);

  const formatTime = () => {
    const now = new Date();
    const hh = now.getHours().toString().padStart(2, '0');
    const mm = now.getMinutes().toString().padStart(2, '0');
    const ss = now.getSeconds().toString().padStart(2, '0');
    const ms = now.getMilliseconds().toString().padStart(3, '0');
    return `${hh}:${mm}:${ss}.${ms}`;
  };

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

  const setConfig = useCallback((next: MidiConfig) => {
    setConfigState(next);
    try {
      const toStore: RawMidiConfig = {
        inputEnabled: !!next.inputEnabled,
        outputEnabled: !!next.outputEnabled,
        inputId: next.inputId ?? null,
        outputId: next.outputId ?? null,
        ignoreInputVolume: !!next.ignoreInputVolume,
        ignoreOutputVolume: !!next.ignoreOutputVolume,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(toStore));
    } catch {
      // ignore storage errors
    }
  }, []);

  const resolveDeviceName = useCallback(
    (id: string | null, fallback: string): string => {
      if (!id) return fallback;
      const all = [...devices.inputs, ...devices.outputs];
      const found = all.find(d => d.id === id);
      return found?.name || fallback;
    },
    [devices.inputs, devices.outputs]
  );

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

    let deviceId: string = config.inputId || '';
    const target = event.target as MIDIInput | null;
    if (target && typeof target.id === 'string') {
      deviceId = target.id;
    }
    const deviceName = resolveDeviceName(deviceId || null, 'MIDI In');

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
    addOutMonitorEntry,
    config.outputEnabled,
    config.outputId,
    config.inputId,
    config.ignoreOutputVolume,
    enableMonitors,
    onNoteEvent,
    resolveDeviceName,
  ]);

  const sendNoteMessage = useCallback(
    (
      kind: 'noteOn' | 'noteOff',
      channel: number,
      noteNumber: number,
      velocity: number = 0x40
    ) => {
      if (!config.outputEnabled) {
        return;
      }

      const safeChannel = Math.max(1, Math.min(16, channel | 0));
      const clampedNote = Math.max(0, Math.min(127, noteNumber | 0));

      let vel = Math.max(0, Math.min(127, velocity | 0));
      if (kind === 'noteOn' && config.ignoreOutputVolume) {
        vel = 0x7f;
      }

      const statusBase = kind === 'noteOn' ? 0x90 : 0x80;
      const status = statusBase | ((safeChannel - 1) & 0x0f);

      const bytes = [status, clampedNote, vel];

      const dataHex = bytes
        .map(byte => byte.toString(16).toUpperCase().padStart(2, '0'))
        .join(' ');

      const channelHex = safeChannel.toString(16).toUpperCase().padStart(2, '0');
      const outputDeviceName = resolveDeviceName(config.outputId ?? null, 'MIDI Out');

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
        // eslint-disable-next-line no-console
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
      config.ignoreOutputVolume,
      config.outputEnabled,
      config.outputId,
      enableMonitors,
      resolveDeviceName,
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
      if (!config.outputEnabled) {
        return;
      }

      const safeChannel = Math.max(1, Math.min(16, channel | 0));
      const clampedProgram = Math.max(0, Math.min(127, program | 0));

      const status = 0xC0 | ((safeChannel - 1) & 0x0f);
      const bytes = [status, clampedProgram];

      const dataHex = bytes
        .map(byte => byte.toString(16).toUpperCase().padStart(2, '0'))
        .join(' ');

      const channelHex = safeChannel.toString(16).toUpperCase().padStart(2, '0');
      const outputDeviceName = resolveDeviceName(config.outputId ?? null, 'MIDI Out');

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
        // eslint-disable-next-line no-console
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
    }, [
      addOutMonitorEntry,
      config.outputEnabled,
      config.outputId,
      enableMonitors,
      resolveDeviceName,
    ]);

  const sendSystemReset = useCallback(() => {
    if (!config.outputEnabled) {
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

    const outputDeviceName = resolveDeviceName(config.outputId ?? null, 'MIDI Out');

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
      // eslint-disable-next-line no-console
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
    config.outputEnabled,
    config.outputId,
    enableMonitors,
    resolveDeviceName,
  ]);

  useEffect(() => {
    if (typeof navigator === 'undefined') {
      setIsSupported(false);
      setAccessError('Navigator is not available in this environment.');
      return;
    }

    const nav = navigator as NavigatorWithMidi;
    if (typeof nav.requestMIDIAccess !== 'function') {
      setIsSupported(false);
      setAccessError('Web MIDI API is not supported in this browser.');
      return;
    }

    let cancelled = false;

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

      // Explicitly close the currently active input and output ports so the
      // underlying MIDI devices can be reused by other applications once the
      // tracker is no longer using them.
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
  }, [scanDevices]);

  useEffect(() => {
    const access = midiAccessRef.current;
    if (!access) {
      return;
    }

    let nextInput: MIDIInput | null = null;
    if (config.inputEnabled && config.inputId) {
      try {
        const rawInput = access.inputs && typeof access.inputs.get === 'function'
          ? access.inputs.get(config.inputId)
          : null;
        nextInput = rawInput ?? null;
      } catch {
        nextInput = null;
      }
    }

    const previousInput = currentInputRef.current;
    const previousHandler = currentInputHandlerRef.current;

    // Always detach the previous handler if present to avoid duplicates.
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

    // When switching away from a previously selected input (or disabling
    // input altogether), close the old port so the OS can release the
    // underlying device for other software.
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
        // Ensure the selected input port is opened before attaching the
        // message listener so we only actively acquire the device when it is
        // enabled in the configuration.
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
  }, [config.inputEnabled, config.inputId, handleMidiMessage]);

  useEffect(() => {
    const access = midiAccessRef.current;
    if (!access) {
      const previousOutput = currentOutputRef.current;
      if (previousOutput) {
        // If MIDI access disappears (e.g. permissions revoked), make sure any
        // previously selected output port is closed so the device is released.
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
        const rawOutput = access.outputs && typeof access.outputs.get === 'function'
          ? access.outputs.get(config.outputId)
          : null;
        nextOutput = rawOutput ?? null;
      } catch {
        nextOutput = null;
      }
    }

    const previousOutput = currentOutputRef.current;
    if (previousOutput && previousOutput !== nextOutput) {
      // Close the previously selected output port when changing devices or
      // disabling output so that the underlying MIDI device is no longer held
      // exclusively by this application.
      try {
        if (typeof previousOutput.close === 'function') {
          previousOutput.close();
        }
      } catch {
        // ignore
      }
    }

    if (nextOutput && config.outputEnabled) {
      // Explicitly open the selected output port only when output is enabled
      // so we avoid acquiring devices that are not in active use.
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

    // Automatically send a System Reset whenever output becomes active on a
    // specific device in browser builds. In Electron on macOS this can cause
    // freezes on some systems, so we skip the auto-reset there.
    if (!isElectronEnv && nextOutput && config.outputEnabled && nextOutput !== previousOutput) {
      sendSystemReset();
    }
  }, [config.outputEnabled, config.outputId, sendSystemReset]);

  return {
    isSupported,
    accessError,
    devices,
    config,
    setConfig,
    inMonitor,
    outMonitor,
    clearMonitors,
    refreshDevices,
    sendNoteOn,
    sendNoteOff,
    sendProgramChange,
    sendSystemReset,
  };
}

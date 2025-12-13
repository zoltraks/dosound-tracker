import { useCallback, useRef, useState } from 'react';
import { useMidiDeviceManagement } from './useMidiDeviceManagement';
import { useMidiMessageProcessing } from './useMidiMessageProcessing';
import {
  bytesToHex,
  formatMidiChannelHex,
  formatMidiTime,
  midiNoteNumberToLabel,
  resolveMidiDeviceName,
} from '../utils/midiUtils';

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

  const addInMonitorEntry = useCallback((entry: Omit<MidiMonitorEntry, 'id' | 'time'>) => {
    const id = nextEntryIdRef.current++;
    const time = formatMidiTime();
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
    const time = formatMidiTime();
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


  const { handleMidiMessage } = useMidiMessageProcessing({
    config,
    devices,
    enableMonitors,
    addInMonitorEntry,
    onNoteEvent,
  });

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

      const dataHex = bytesToHex(bytes);

      const channelHex = formatMidiChannelHex(safeChannel);
      const outputDeviceName = resolveMidiDeviceName(devices, config.outputId ?? null, 'MIDI Out');

      const noteInfo = midiNoteNumberToLabel(clampedNote);
      const noteLabel = noteInfo.label;

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
        const time = formatMidiTime();
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
      devices,
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
      if (!config.outputEnabled) {
        return;
      }

      const safeChannel = Math.max(1, Math.min(16, channel | 0));
      const clampedProgram = Math.max(0, Math.min(127, program | 0));

      const status = 0xC0 | ((safeChannel - 1) & 0x0f);
      const bytes = [status, clampedProgram];

      const dataHex = bytesToHex(bytes);

      const channelHex = formatMidiChannelHex(safeChannel);
      const outputDeviceName = resolveMidiDeviceName(devices, config.outputId ?? null, 'MIDI Out');

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
        const time = formatMidiTime();
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
      devices,
      enableMonitors,
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

    const dataHex = bytesToHex(bytes);

    const outputDeviceName = resolveMidiDeviceName(devices, config.outputId ?? null, 'MIDI Out');

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
      const time = formatMidiTime();
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
    devices,
    enableMonitors,
  ]);

  const deviceManagement = useMidiDeviceManagement({
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
  });

  return {
    isSupported,
    accessError,
    devices,
    config,
    setConfig,
    inMonitor,
    outMonitor,
    clearMonitors,
    refreshDevices: deviceManagement.refreshDevices,
    sendNoteOn,
    sendNoteOff,
    sendProgramChange,
    sendSystemReset,
  };
}

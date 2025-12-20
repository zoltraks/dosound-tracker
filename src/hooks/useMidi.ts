import { useCallback, useState } from 'react';
import type {
  MidiConfiguration,
  MidiDeviceInfo,
  MidiMonitorEntry,
  MidiNoteEvent,
} from '../utils/midiUtils';
import { STORAGE_KEY } from '../utils/midiUtils';
import { useMidiDeviceManagement } from './useMidiDeviceManagement';
import { useMidiMessageProcessing } from './useMidiMessageProcessing';

// Re-export types for backward compatibility
export type { MidiConfiguration, MidiDeviceInfo, MidiMonitorEntry, MidiNoteEvent };

export interface UseMidiResult {
  isSupported: boolean;
  accessError: string | null;
  devices: {
    inputs: MidiDeviceInfo[];
    outputs: MidiDeviceInfo[];
  };
  configuration: MidiConfiguration;
  setConfiguration: (configuration: MidiConfiguration) => void;
  inMonitor: MidiMonitorEntry[];
  outMonitor: MidiMonitorEntry[];
  clearMonitors: () => void;
  refreshDevices: () => void;
  sendNoteOn: (channel: number, noteNumber: number, velocity: number) => void;
  sendNoteOff: (channel: number, noteNumber: number, velocity?: number) => void;
  sendProgramChange: (channel: number, program: number) => void;
  sendSystemReset: () => void;
}

interface RawMidiConfiguration {
  inputEnabled?: boolean;
  outputEnabled?: boolean;
  inputId?: string | null;
  outputId?: string | null;
  ignoreInputVolume?: boolean;
  ignoreOutputVolume?: boolean;
}

export function useMidi(
  onNoteEvent: (event: MidiNoteEvent) => void,
  options?: { enableMonitors?: boolean }
): UseMidiResult {
  const enableMonitors = options?.enableMonitors ?? true;

  // 1. Device Management
  const {
    isSupported,
    accessError,
    devices,
    refreshDevices,
    midiAccessRef
  } = useMidiDeviceManagement();

  // 2. Configuration Management
  const [configuration, setConfigurationState] = useState<MidiConfiguration>(() => {
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
      const parsed = JSON.parse(raw) as RawMidiConfiguration;
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

  const setConfiguration = useCallback((next: MidiConfiguration) => {
    setConfigurationState(next);
    try {
      const toStore: RawMidiConfiguration = {
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

  // 3. Message Processing
  const {
    inMonitor,
    outMonitor,
    clearMonitors,
    sendNoteOn,
    sendNoteOff,
    sendProgramChange,
    sendSystemReset,
  } = useMidiMessageProcessing(
    midiAccessRef,
    devices,
    configuration,
    enableMonitors,
    onNoteEvent
  );

  return {
    isSupported,
    accessError,
    devices,
    configuration,
    setConfiguration,
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

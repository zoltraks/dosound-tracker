import { useCallback, useState } from 'react';
import type { MidiConfiguration, MidiMonitorEntry, MidiNoteEvent, MidiDeviceInfo } from '../utils/midiUtils';
import { STORAGE_KEY } from '../utils/midiUtils';
import { useMidiDeviceManagement } from './useMidiDeviceManagement';
import { useMidiMessageProcessing } from './useMidiMessageProcessing';

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

  const {
    isSupported,
    accessError,
    devices,
    refreshDevices,
    midiAccessRef
  } = useMidiDeviceManagement();

  const OLD_STORAGE_KEY = 'dosound-tracker-midi-config';

  // 2. Configuration Management
  // 2. Configuration Management
  const [configuration, setConfigurationState] = useState<MidiConfiguration>(() => {
    try {
      let raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        raw = localStorage.getItem(OLD_STORAGE_KEY);
        if (raw) {
          localStorage.setItem(STORAGE_KEY, raw);
          localStorage.removeItem(OLD_STORAGE_KEY);
        }
      }
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

  const setConfiguration = useCallback((configuration: MidiConfiguration) => {
    setConfigurationState(configuration);
    try {
      const toStore: RawMidiConfiguration = {
        inputEnabled: !!configuration.inputEnabled,
        outputEnabled: !!configuration.outputEnabled,
        inputId: configuration.inputId ?? null,
        outputId: configuration.outputId ?? null,
        ignoreInputVolume: !!configuration.ignoreInputVolume,
        ignoreOutputVolume: !!configuration.ignoreOutputVolume,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(toStore));
    } catch {
      // ignore storage errors
    }
  }, []);

  const {
    inMonitor,
    outMonitor,
    clearMonitors,
    sendNoteOn,
    sendNoteOff,
    sendProgramChange,
    sendSystemReset
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

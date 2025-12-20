export interface MidiConfiguration {
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

export const MAX_MONITOR_ENTRIES = 1000;
export const STORAGE_KEY = 'dosound-tracker-midi-configuration';

export function formatTime(): string {
  const now = new Date();
  const hh = now.getHours().toString().padStart(2, '0');
  const mm = now.getMinutes().toString().padStart(2, '0');
  const ss = now.getSeconds().toString().padStart(2, '0');
  const ms = now.getMilliseconds().toString().padStart(3, '0');
  return `${hh}:${mm}:${ss}.${ms}`;
}

export function resolveDeviceName(
  id: string | null,
  devices: MidiDeviceInfo[],
  fallback: string
): string {
  if (!id) return fallback;
  const found = devices.find(d => d.id === id);
  return found?.name || fallback;
}

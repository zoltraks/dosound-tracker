import { useCallback } from 'react';
import type { MidiConfig, MidiDeviceInfo, MidiMonitorEntry, MidiNoteEvent } from './useMidi';
import {
  bytesToHex,
  formatMidiChannelHex,
  formatMidiTime,
  midiNoteNumberToLabel,
  resolveMidiDeviceName,
} from '../utils/midiUtils';

interface UseMidiMessageProcessingArgs {
  config: MidiConfig;
  devices: { inputs: MidiDeviceInfo[]; outputs: MidiDeviceInfo[] };
  enableMonitors: boolean;
  addInMonitorEntry: (entry: Omit<MidiMonitorEntry, 'id' | 'time'>) => void;
  onNoteEvent: (event: MidiNoteEvent) => void;
}

export function useMidiMessageProcessing({
  config,
  devices,
  enableMonitors,
  addInMonitorEntry,
  onNoteEvent,
}: UseMidiMessageProcessingArgs): {
  handleMidiMessage: (event: MIDIMessageEvent) => void;
} {
  const handleMidiMessage = useCallback(
    (event: MIDIMessageEvent) => {
      if (!event || !event.data || !(event.data instanceof Uint8Array)) {
        return;
      }

      const data: number[] = Array.from(event.data);
      if (data.length === 0) return;

      const status = data[0] | 0;
      const data1 = data.length >= 2 ? data[1] | 0 : 0;
      const data2 = data.length >= 3 ? data[2] | 0 : 0;

      const command = status & 0xf0;
      const channel = (status & 0x0f) + 1;

      const dataHex = bytesToHex(data);
      const channelHex = formatMidiChannelHex(channel);
      const time = formatMidiTime();

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
      const deviceName = resolveMidiDeviceName(devices, deviceId || null, 'MIDI In');

      if (command === 0x80 || (command === 0x90 && data2 === 0)) {
        type = 'Note Off';
        const noteNumber = data1;
        const noteInfo = midiNoteNumberToLabel(noteNumber);
        noteLabel = noteInfo.label;
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
          noteName: noteInfo.noteName,
          octave: noteInfo.octave,
          velocity: data2,
          channel,
          deviceId,
          deviceName,
        });
      } else if (command === 0x90) {
        type = 'Note On';
        const noteNumber = data1;
        const noteInfo = midiNoteNumberToLabel(noteNumber);
        noteLabel = noteInfo.label;
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
          noteName: noteInfo.noteName,
          octave: noteInfo.octave,
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
    },
    [addInMonitorEntry, config.inputId, devices, enableMonitors, onNoteEvent]
  );

  return { handleMidiMessage };
}

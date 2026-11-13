import { Formatter } from '../../utils/format/formatters.ts';
import { useRef, useCallback, type MutableRefObject } from 'react';
import { logger } from '../../utils/log/logger.ts';
import type {
  MidiConfiguration,
  MidiNoteEvent,
  MidiDeviceInfo,
} from '../../utils/midi/midiUtils.ts';
import {
  bytesToHex,
  resolveDeviceName,
  resolveMidiNote,
  formatTime,
} from '../../utils/midi/midiUtils.ts';
import { isDebugEnabled } from './midiDebugFlag.ts';
import { useMidiMonitors } from './useMidiMonitors.ts';
import { useMidiOutput } from './useMidiOutput.ts';
import { useMidiDeviceAttachments } from './useMidiDeviceAttachments.ts';

export function useMidiMessageProcessing(
  midiAccessRef: MutableRefObject<MIDIAccess | null>,
  devices: { inputs: MidiDeviceInfo[]; outputs: MidiDeviceInfo[] },
  configuration: MidiConfiguration,
  enableMonitors: boolean,
  onNoteEvent: (event: MidiNoteEvent) => void,
) {
  const { inMonitor, outMonitor, addInMonitorEntry, addOutMonitorEntry, clearMonitors } =
    useMidiMonitors();

  const currentOutputRef = useRef<MIDIOutput | null>(null);

  const { sendNoteOn, sendNoteOff, sendProgramChange, sendSystemReset } = useMidiOutput(
    configuration,
    devices.outputs,
    enableMonitors,
    addOutMonitorEntry,
    currentOutputRef,
  );

  const handleMidiMessage = useCallback(
    (event: MIDIMessageEvent) => {
      if (!event || !event.data || !(event.data instanceof Uint8Array)) {
        return;
      }

      const data = event.data;
      if (data.length === 0) return;

      const status = data[0] | 0;
      const data1 = data.length >= 2 ? data[1] | 0 : 0;
      const data2 = data.length >= 3 ? data[2] | 0 : 0;

      const command = status & 0xf0;
      const channel = (status & 0x0f) + 1;

      const dataHex = bytesToHex(data);

      const channelHex = Formatter.hex(channel);

      const time = formatTime();

      const debugOn = isDebugEnabled();

      let type: string;
      let noteLabel: string;
      let value: number | null;

      let deviceId: string = configuration.inputId || '';
      const target = event.target as MIDIInput | null;
      if (target && typeof target.id === 'string') {
        deviceId = target.id;
      }
      const deviceName = resolveDeviceName(deviceId || null, devices.inputs, 'MIDI In');

      if (command === 0x80 || (command === 0x90 && data2 === 0)) {
        type = 'Note Off';
        const noteNumber = data1;
        const { noteName, octave: midiOctave, label } = resolveMidiNote(noteNumber);
        noteLabel = label;
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
          logger.debug('MIDI IN', {
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
        const { noteName, octave: midiOctave, label } = resolveMidiNote(noteNumber);
        noteLabel = label;
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
          logger.debug('MIDI IN', {
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
          logger.debug('MIDI IN', {
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
          logger.debug('MIDI IN', {
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
    [addInMonitorEntry, configuration.inputId, devices.inputs, enableMonitors, onNoteEvent],
  );

  useMidiDeviceAttachments(
    midiAccessRef,
    configuration,
    handleMidiMessage,
    sendSystemReset,
    currentOutputRef,
  );

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

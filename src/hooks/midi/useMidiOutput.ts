import { useCallback, type MutableRefObject } from 'react';
import { Formatter } from '../../utils/format/formatters.ts';
import { logger } from '../../utils/log/logger.ts';
import type {
  MidiConfiguration,
  MidiDeviceInfo,
  MidiMonitorEntry,
} from '../../utils/midi/midiUtils.ts';
import {
  bytesToHex,
  formatTime,
  resolveDeviceName,
  resolveMidiNote,
} from '../../utils/midi/midiUtils.ts';
import { isDebugEnabled } from './midiDebugFlag.ts';

const sendBuffer = (output: MIDIOutput, bytes: number[]): void => {
  try {
    output.send(new Uint8Array(bytes));
  } catch (error) {
    logger.warn('Failed to send MIDI output', error);
  }
};

// The MIDI output senders share one pipeline: build the message bytes,
// record the out-monitor entry, emit the debug log, then send through
// the current output device.
export const useMidiOutput = (
  configuration: MidiConfiguration,
  outputs: MidiDeviceInfo[],
  enableMonitors: boolean,
  addOutMonitorEntry: (entry: Omit<MidiMonitorEntry, 'id' | 'time'>) => void,
  currentOutputRef: MutableRefObject<MIDIOutput | null>,
) => {
  const sendNoteMessage = useCallback(
    (kind: 'noteOn' | 'noteOff', channel: number, noteNumber: number, velocity: number = 0x40) => {
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

      const dataHex = bytesToHex(bytes);

      const channelHex = Formatter.hex(safeChannel);
      const outputDeviceName = resolveDeviceName(
        configuration.outputId ?? null,
        outputs,
        'MIDI Out',
      );

      const { label: noteLabel } = resolveMidiNote(clampedNote);

      const type = kind === 'noteOn' ? 'Note On' : 'Note Off';

      addOutMonitorEntry({
        data: dataHex,
        device: outputDeviceName,
        channel: channelHex,
        type,
        note: noteLabel,
        value: vel,
      });

      const debugOn = isDebugEnabled();

      if (debugOn && enableMonitors) {
        const time = formatTime();
        logger.debug('MIDI OUT', {
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

      sendBuffer(output, bytes);
    },
    [
      addOutMonitorEntry,
      configuration.ignoreOutputVolume,
      configuration.outputEnabled,
      configuration.outputId,
      outputs,
      enableMonitors,
      currentOutputRef,
    ],
  );

  const sendNoteOn = useCallback(
    (channel: number, noteNumber: number, velocity: number) => {
      sendNoteMessage('noteOn', channel, noteNumber, velocity);
    },
    [sendNoteMessage],
  );

  const sendNoteOff = useCallback(
    (channel: number, noteNumber: number, velocity: number = 0x40) => {
      sendNoteMessage('noteOff', channel, noteNumber, velocity);
    },
    [sendNoteMessage],
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

      const dataHex = bytesToHex(bytes);

      const channelHex = Formatter.hex(safeChannel);
      const outputDeviceName = resolveDeviceName(
        configuration.outputId ?? null,
        outputs,
        'MIDI Out',
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

      const debugOn = isDebugEnabled();

      if (debugOn && enableMonitors) {
        const time = formatTime();
        logger.debug('MIDI OUT', {
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

      sendBuffer(output, bytes);
    },
    [
      addOutMonitorEntry,
      configuration.outputEnabled,
      configuration.outputId,
      outputs,
      enableMonitors,
      currentOutputRef,
    ],
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

    const dataHex = bytes.map((byte) => Formatter.hex(byte)).join(' ');

    const outputDeviceName = resolveDeviceName(configuration.outputId ?? null, outputs, 'MIDI Out');

    addOutMonitorEntry({
      data: dataHex,
      device: outputDeviceName,
      channel: '--',
      type: 'System Reset',
      note: '',
      value: null,
    });

    const debugOn = isDebugEnabled();

    if (debugOn && enableMonitors) {
      const time = formatTime();
      logger.debug('MIDI OUT', {
        time,
        type: 'System Reset',
        status,
        data: dataHex,
        device: outputDeviceName,
      });
    }

    sendBuffer(output, bytes);
  }, [
    addOutMonitorEntry,
    configuration.outputEnabled,
    configuration.outputId,
    outputs,
    enableMonitors,
    currentOutputRef,
  ]);

  return { sendNoteOn, sendNoteOff, sendProgramChange, sendSystemReset };
};

import { useCallback, useRef } from 'react';
import { useMidi } from './useMidi';
import type { MidiConfiguration, MidiNoteEvent, MidiMonitorEntry, MidiDeviceInfo } from './useMidi';
import type { Instrument } from '../synth/SoundDriver';
import { NOTES } from '../constants/music';

interface UseMidiHandlingOptions {
  onNoteEvent: (event: MidiNoteEvent) => void;
  monitorsEnabled: boolean;
}

interface UseMidiHandlingResult {
  isMidiSupported: boolean;
  midiAccessError: string | null;
  midiDevices: {
    inputs: MidiDeviceInfo[];
    outputs: MidiDeviceInfo[];
  };
  midiConfiguration: MidiConfiguration;
  setMidiConfiguration: (configuration: MidiConfiguration) => void;
  midiInMonitor: MidiMonitorEntry[];
  midiOutMonitor: MidiMonitorEntry[];
  clearMidiMonitors: () => void;
  refreshMidiDevices: () => void;
  sendInstrumentMidiNoteOn: (
    ymChannel: number,
    instrument: Instrument | undefined,
    note: string,
    octave: number,
    volumeFromStep?: number | null,
    velocityOverride?: number | null
  ) => void;
  sendInstrumentMidiNoteOffForChannel: (ymChannel: number) => void;
  previewInstrumentMidiNoteOn: (
    ymChannel: number,
    instrument: Instrument,
    note: string,
    octave: number
  ) => void;
  previewInstrumentMidiNoteOff: (ymChannel: number) => void;
  midiInputEnabled: boolean;
  midiOutputEnabled: boolean;
  resetMidiProgramCache: () => void;
  sendSystemReset: () => void;
}

export function useMidiHandling(options: UseMidiHandlingOptions): UseMidiHandlingResult {
  const {
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
  } = useMidi(options.onNoteEvent, { enableMonitors: options.monitorsEnabled });

  const playbackMidiNotesRef = useRef<Array<{ midiChannel: number; noteNumber: number } | null>>([
    null,
    null,
    null,
  ]);

  const midiProgramByChannelRef = useRef<Array<number | null>>(Array(16).fill(null));

  const resetMidiProgramCache = useCallback(() => {
    midiProgramByChannelRef.current = Array(16).fill(null);
  }, []);

  const sendInstrumentMidiNoteOffForChannel = (ymChannel: number) => {
    if (ymChannel < 0 || ymChannel > 2) {
      return;
    }

    const entry = playbackMidiNotesRef.current[ymChannel];
    if (!entry) {
      return;
    }

    sendNoteOff(entry.midiChannel, entry.noteNumber);
    playbackMidiNotesRef.current[ymChannel] = null;
  };

  const sendInstrumentMidiNoteOn = (
    ymChannel: number,
    instrument: Instrument | undefined,
    note: string,
    octave: number,
    volumeFromStep?: number | null,
    velocityOverride?: number | null
  ) => {
    if (!instrument || !instrument.midi) {
      return;
    }

    const rawChannel = instrument.midi.channel;
    if (rawChannel === null || rawChannel === undefined || !Number.isFinite(rawChannel as number)) {
      return;
    }

    const safeChannel = Math.max(1, Math.min(16, Math.floor(rawChannel as number)));

    const upperNote = note.toUpperCase();
    const noteIndex = NOTES.indexOf(upperNote);
    if (noteIndex < 0) {
      return;
    }

    const noteNumber = (octave + 1) * 12 + noteIndex;

    const rawProgram = instrument.midi.program;
    if (typeof rawProgram === 'number' && Number.isFinite(rawProgram)) {
      const clampedProgram = Math.max(0, Math.min(127, Math.floor(rawProgram)));
      const lastProgram = midiProgramByChannelRef.current[safeChannel - 1];
      if (lastProgram !== clampedProgram) {
        sendProgramChange(safeChannel, clampedProgram);
        midiProgramByChannelRef.current[safeChannel - 1] = clampedProgram;
      }
    }

    let velocity = 0x7f;

    if (velocityOverride !== undefined && velocityOverride !== null) {
      const raw = velocityOverride | 0;
      velocity = Math.max(1, Math.min(127, raw));
    } else {
      const rawVolume = volumeFromStep !== undefined && volumeFromStep !== null
        ? ((volumeFromStep as number) | 0)
        : null;

      if (rawVolume !== null) {
        const volumeNibble = Math.max(0, Math.min(0x0f, rawVolume));
        velocity = Math.max(1, Math.min(127, Math.round((volumeNibble / 15) * 127)));
      }
    }

    const lastEntry = ymChannel >= 0 && ymChannel <= 2 ? playbackMidiNotesRef.current[ymChannel] : null;
    if (lastEntry) {
      sendNoteOff(lastEntry.midiChannel, lastEntry.noteNumber);
      if (ymChannel >= 0 && ymChannel <= 2) {
        playbackMidiNotesRef.current[ymChannel] = null;
      }
    }

    sendNoteOn(safeChannel, noteNumber, velocity);

    if (ymChannel >= 0 && ymChannel <= 2) {
      playbackMidiNotesRef.current[ymChannel] = {
        midiChannel: safeChannel,
        noteNumber,
      };
    }
  };

  const previewInstrumentMidiNoteOn = (
    ymChannel: number,
    instrument: Instrument,
    note: string,
    octave: number
  ) => {
    sendInstrumentMidiNoteOn(ymChannel, instrument, note, octave, null);
  };

  const previewInstrumentMidiNoteOff = (ymChannel: number) => {
    sendInstrumentMidiNoteOffForChannel(ymChannel);
  };

  const midiInputEnabled = configuration.inputEnabled && !!configuration.inputId;
  const midiOutputEnabled = configuration.outputEnabled && !!configuration.outputId;

  return {
    isMidiSupported: isSupported,
    midiAccessError: accessError,
    midiDevices: devices,
    midiConfiguration: configuration,
    setMidiConfiguration: setConfiguration,
    midiInMonitor: inMonitor,
    midiOutMonitor: outMonitor,
    clearMidiMonitors: clearMonitors,
    refreshMidiDevices: refreshDevices,
    sendInstrumentMidiNoteOn,
    sendInstrumentMidiNoteOffForChannel,
    previewInstrumentMidiNoteOn,
    previewInstrumentMidiNoteOff,
    midiInputEnabled,
    midiOutputEnabled,
    resetMidiProgramCache,
    sendSystemReset,
  };
}

import { cleanup, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { useMidi, type UseMidiResult } from '../../../src/hooks/midi/useMidi.ts';
import { useMidiHandling } from '../../../src/hooks/midi/useMidiHandling.ts';
import type { Instrument } from '../../../src/synth/SoundDriver.ts';

vi.mock('../../../src/hooks/midi/useMidi.ts', () => ({ useMidi: vi.fn() }));

const instrument: Instrument = {
  id: '01',
  name: 'MIDI',
  volume: [],
  shift: [],
  pitch: [],
  noise: [],
  mode: [],
  midi: { channel: 3, program: 17 },
};
const midi = {
  isSupported: true,
  accessError: null,
  devices: { inputs: [], outputs: [] },
  configuration: {
    inputEnabled: true,
    inputId: 'in',
    outputEnabled: true,
    outputId: 'out',
    ignoreInputVolume: false,
    ignoreOutputVolume: false,
  },
  setConfiguration: vi.fn(),
  inMonitor: [],
  outMonitor: [],
  clearMonitors: vi.fn(),
  refreshDevices: vi.fn(),
  sendNoteOn: vi.fn(),
  sendNoteOff: vi.fn(),
  sendProgramChange: vi.fn(),
  sendSystemReset: vi.fn(),
} satisfies UseMidiResult;

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(useMidi).mockReturnValue(midi);
});
afterEach(cleanup);

const setup = () =>
  renderHook(() => useMidiHandling({ onNoteEvent: vi.fn(), monitorsEnabled: true }));

it('replaces and releases playback notes and caches the instrument program', () => {
  const { result } = setup();
  result.current.sendInstrumentMidiNoteOn(0, instrument, 'c', 4, 8);
  result.current.sendInstrumentMidiNoteOn(0, instrument, 'D', 4, 15, 42);
  expect(midi.sendProgramChange.mock.calls).toEqual([[3, 17]]);
  expect(midi.sendNoteOn.mock.calls).toEqual([
    [3, 60, 68],
    [3, 62, 42],
  ]);
  expect(midi.sendNoteOff.mock.calls).toEqual([[3, 60]]);

  result.current.sendInstrumentMidiNoteOffForChannel(0);
  result.current.sendInstrumentMidiNoteOffForChannel(0);
  expect(midi.sendNoteOff.mock.calls).toEqual([
    [3, 60],
    [3, 62],
  ]);
  result.current.resetMidiProgramCache();
  result.current.previewInstrumentMidiNoteOn(1, instrument, 'E', 4);
  result.current.previewInstrumentMidiNoteOff(1);
  expect(midi.sendProgramChange).toHaveBeenCalledTimes(2);
  expect(midi.sendNoteOn).toHaveBeenLastCalledWith(3, 64, 127);
  expect(midi.sendNoteOff).toHaveBeenLastCalledWith(3, 64);
});

it.each([undefined, {}, { channel: undefined }, { channel: null }, { channel: NaN }])(
  'does not transmit an instrument without a usable channel (%j)',
  (assignment) => {
    const { result } = setup();
    result.current.sendInstrumentMidiNoteOn(0, undefined, 'C', 4);
    result.current.sendInstrumentMidiNoteOn(0, { ...instrument, midi: assignment }, 'C', 4);
    result.current.sendInstrumentMidiNoteOn(0, instrument, 'invalid', 4);
    expect(midi.sendNoteOn).not.toHaveBeenCalled();
    expect(midi.sendProgramChange).not.toHaveBeenCalled();
  },
);

it('clamps channel, program, and velocity and leaves an untracked note alone on release', () => {
  const { result } = setup();
  result.current.sendInstrumentMidiNoteOn(
    3,
    { ...instrument, midi: { channel: 19, program: 200 } },
    'C',
    4,
    0,
  );
  result.current.sendInstrumentMidiNoteOffForChannel(3);
  result.current.sendInstrumentMidiNoteOffForChannel(-1);
  expect(midi.sendProgramChange).toHaveBeenCalledExactlyOnceWith(16, 127);
  expect(midi.sendNoteOn).toHaveBeenCalledExactlyOnceWith(16, 60, 1);
  expect(midi.sendNoteOff).not.toHaveBeenCalled();
  result.current.sendInstrumentMidiNoteOn(
    2,
    { ...instrument, midi: { channel: 0, program: NaN } },
    'G',
    3,
    null,
    200,
  );
  expect(midi.sendNoteOn).toHaveBeenLastCalledWith(1, 55, 127);
  expect(midi.sendProgramChange).toHaveBeenCalledOnce();
});

it('requires both an enabled direction and its selected device', () => {
  vi.mocked(useMidi).mockReturnValue({
    ...midi,
    configuration: { ...midi.configuration, inputId: null, outputEnabled: false },
  });
  const { result } = setup();
  expect(result.current.midiInputEnabled).toBe(false);
  expect(result.current.midiOutputEnabled).toBe(false);
  expect(result.current.sendSystemReset).toBe(midi.sendSystemReset);
});

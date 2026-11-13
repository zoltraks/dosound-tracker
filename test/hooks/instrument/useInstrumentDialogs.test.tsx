import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { useInstrumentDialogs } from '../../../src/hooks/instrument/useInstrumentDialogs.ts';
import type { Instrument, Song } from '../../../src/synth/SoundDriver.ts';

afterEach(cleanup);

const selected: Instrument = {
  id: '01',
  name: 'Selected',
  mode: [],
  volume: [],
  pitch: [],
  shift: [],
  noise: [],
};
const other = { ...selected, id: '02', name: 'Other' };
const currentSong: Song = {
  title: '',
  author: '',
  year: 2026,
  speed: 2,
  length: 4,
  line: [],
  pattern: [],
  instrument: [selected, other],
};

function setup() {
  const params = {
    currentSong,
    currentInstrument: selected,
    updateSong: vi.fn<(patch: Partial<Song>) => void>(),
    updateInstrument: vi.fn(),
    setCurrentInstrument: vi.fn(),
    setActiveSection: vi.fn(),
    setInstrumentPanelFocusRevision: vi.fn(),
    setIsInstrumentMidiOpen: vi.fn(),
    setIsInstrumentColorOpen: vi.fn(),
  };
  return { ...params, ...renderHook(() => useInstrumentDialogs(params)) };
}

it.each([
  { channel: 1, program: null },
  { channel: null, program: 0 },
  { channel: 16, program: 127 },
  { channel: null, program: null },
])('stores MIDI channel and program independently (%j)', (midi) => {
  const hook = setup();
  act(() => hook.result.current.handleOpenInstrumentMidi(selected));
  expect(hook.setIsInstrumentMidiOpen).toHaveBeenLastCalledWith(true);
  act(() => hook.result.current.handleSaveInstrumentMidi(midi));
  const updated = {
    ...selected,
    midi: midi.channel === null && midi.program === null ? undefined : midi,
  };
  expect(hook.updateSong).toHaveBeenCalledWith({ instrument: [updated, other] });
  expect(hook.setCurrentInstrument).toHaveBeenCalledWith(updated);
  expect(hook.setIsInstrumentMidiOpen).toHaveBeenLastCalledWith(false);
  expect(hook.setActiveSection).toHaveBeenCalledWith('instrumentList');
});

it('edits a different instrument without changing the selection', () => {
  const hook = setup();
  act(() => hook.result.current.handleOpenInstrumentMidi(other));
  act(() => hook.result.current.handleSaveInstrumentMidi({ channel: NaN, program: 4 }));
  expect(hook.updateSong).toHaveBeenCalledWith({
    instrument: [selected, { ...other, midi: { channel: null, program: 4 } }],
  });
  expect(hook.setCurrentInstrument).not.toHaveBeenCalled();
});

it.each(['#abc', '', null])('normalizes the saved instrument color (%j)', (color) => {
  const hook = setup();
  act(() => hook.result.current.handleOpenInstrumentColor(selected));
  act(() => hook.result.current.handleSaveInstrumentColor(color));
  const updated = { ...selected, color: color || null };
  expect(hook.updateSong).toHaveBeenCalledWith({ instrument: [updated, other] });
  expect(hook.setCurrentInstrument).toHaveBeenCalledWith(updated);
  expect(hook.result.current.instrumentColorTarget).toBeNull();
});

it.each([selected, other])('clears only the target instrument color ($id)', (target) => {
  const hook = setup();
  act(() => hook.result.current.handleOpenInstrumentColor(target));
  act(() => hook.result.current.handleClearInstrumentColor());
  const updated = { ...target, color: null };
  expect(hook.updateSong).toHaveBeenCalledWith({
    instrument: target === selected ? [updated, other] : [selected, updated],
  });
  expect(hook.setCurrentInstrument.mock.calls).toEqual(target === selected ? [[updated]] : []);
});

it('returns focus after a dismissed dialog and discards saves without a target', () => {
  const hook = setup();
  act(() => hook.result.current.handleOpenInstrumentMidi(selected));
  act(() => hook.result.current.handleCloseInstrumentMidi());
  act(() => hook.result.current.handleOpenInstrumentColor(other));
  act(() => hook.result.current.handleCloseInstrumentColor());
  act(() => {
    hook.result.current.handleSaveInstrumentMidi({ channel: 1, program: 2 });
    hook.result.current.handleSaveInstrumentColor('#abc');
    hook.result.current.handleClearInstrumentColor();
  });
  expect(hook.updateSong).not.toHaveBeenCalled();
  expect(
    hook.setInstrumentPanelFocusRevision.mock.calls.map(([increment]) => increment(2)),
  ).toEqual([3, 3, 3, 3, 3]);
  expect(hook.result.current.instrumentMidiTarget).toBeNull();
  expect(hook.result.current.instrumentColorTarget).toBeNull();
});

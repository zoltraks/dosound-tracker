import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { useInstrumentActions } from '../../../src/hooks/instrument/useInstrumentActions.ts';
import { useModalState } from '../../../src/hooks/modal/useModalState.ts';
import { normalizeInstrumentId } from '../../../src/utils/instrument/instrumentSelection.ts';
import type { Instrument, Song } from '../../../src/synth/SoundDriver.ts';

afterEach(cleanup);

const lead: Instrument = {
  id: '01',
  name: 'Lead',
  volume: [],
  shift: [],
  pitch: [],
  noise: [],
  mode: [],
};
const bass: Instrument = { ...lead, id: '02', name: 'Bass' };
const note = { note: 'C', octave: 4, instrument: '01' };
const song: Song = {
  title: '',
  author: '',
  year: 2026,
  speed: 2,
  length: 4,
  line: [],
  instrument: [lead, bass],
  pattern: [{ id: '00', name: 'Pattern', step: [{ note }] }],
};

function setup(currentInstrument = lead) {
  const callbacks = {
    updateSong: vi.fn<(patch: Partial<Song>) => void>(),
    updateInstrument: vi.fn(),
    setCurrentInstrument: vi.fn(),
    setActiveSection: vi.fn(),
    setInstrumentOperationSummary: vi.fn(),
  };
  const hook = renderHook(
    (currentSong) => {
      const modal = useModalState();
      const actions = useInstrumentActions({
        currentSong,
        currentInstrument,
        ...callbacks,
        activeSection: 'instrumentList',
        lastTrackId: 'A',
        instrumentDeleteUsage: modal.instrumentDeleteUsage,
        setInstrumentDeleteUsage: modal.setInstrumentDeleteUsage,
        setIsInstrumentDeleteOpen: modal.setIsInstrumentDeleteOpen,
        normalizeInstrumentId,
        parseBaseKeyString: () => null,
        ym2149Ref: { current: null },
      });
      return {
        ...actions,
        isOpen: modal.isInstrumentDeleteOpen,
        usage: modal.instrumentDeleteUsage,
      };
    },
    { initialProps: song },
  );
  return { ...callbacks, ...hook };
}

it.each([true, false])('clears a used instrument with delete-notes set to %s', (deleteNotes) => {
  const hook = setup();
  act(() => hook.result.current.handleDeleteInstrument());
  expect(hook.result.current.isOpen).toBe(true);
  expect(hook.result.current.usage).toMatchObject({
    instrumentId: '01',
    usageCount: 1,
    patternCount: 1,
  });
  expect(hook.updateSong).not.toHaveBeenCalled();

  act(() => {
    if (deleteNotes) hook.result.current.handleConfirmDeleteInstrumentAndNotes();
    else hook.result.current.handleConfirmDeleteInstrumentOnly();
  });
  const patch = hook.updateSong.mock.calls[0][0];
  expect(patch.instrument?.map(({ name }) => name)).toEqual(['', 'Bass']);
  expect(patch.pattern?.[0].step).toEqual(deleteNotes ? [{ note: null }] : undefined);
  expect(hook.result.current.isOpen).toBe(false);
  expect(hook.setActiveSection).toHaveBeenCalledWith('instrumentList');
  expect(hook.setInstrumentOperationSummary).toHaveBeenCalledWith(
    expect.stringContaining(
      deleteNotes ? 'Delete notes using this instrument' : 'Clear instrument only',
    ),
  );
});

it('clears an unused slot directly and leaves the song patterns alone', () => {
  const hook = setup(bass);
  act(() => hook.result.current.handleDeleteInstrument());
  expect(hook.result.current.isOpen).toBe(false);
  expect(hook.updateSong.mock.calls[0][0]).toEqual({
    instrument: [lead, expect.objectContaining({ id: '02', name: '' })],
  });
});

it('handles cancellation and a target removed while confirmation is open', () => {
  const hook = setup();
  act(() => {
    hook.result.current.handleConfirmDeleteInstrumentAndNotes();
    hook.result.current.handleConfirmDeleteInstrumentOnly();
  });
  act(() => hook.result.current.handleDeleteInstrument());
  act(() => hook.result.current.handleCancelInstrumentDelete());
  expect(hook.result.current.isOpen).toBe(false);
  act(() => hook.result.current.handleDeleteInstrument());
  hook.rerender({ ...song, instrument: [bass] });
  act(() => hook.result.current.handleConfirmDeleteInstrumentAndNotes());
  expect(hook.setInstrumentOperationSummary).toHaveBeenCalledWith(
    'Instrument no longer found. No changes were applied.',
  );
  act(() => hook.result.current.handleConfirmDeleteInstrumentOnly());
  expect(hook.updateSong).not.toHaveBeenCalled();
  expect(hook.result.current.isOpen).toBe(false);
});

it('remaps notes and keeps the moved instrument selected', () => {
  const hook = setup();
  act(() => hook.result.current.handleMoveInstrument(0, 'up'));
  expect(hook.updateSong).not.toHaveBeenCalled();
  act(() => hook.result.current.handleMoveInstrument(0, 'down'));
  const patch = hook.updateSong.mock.calls[0][0];
  expect(patch.instrument?.map(({ name }) => name)).toEqual(['Bass', 'Lead']);
  expect(patch.pattern?.[0].step[0].note?.instrument).toBe(patch.instrument?.[1].id);
  expect(hook.setCurrentInstrument).toHaveBeenCalledWith(patch.instrument?.[1]);
});

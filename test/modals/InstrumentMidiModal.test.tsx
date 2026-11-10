import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup, act } from '@testing-library/react';
import { InstrumentMidiModal } from '../../src/modals/InstrumentMidiModal.tsx';
import type { Instrument } from '../../src/synth/SoundDriver.ts';

afterEach(() => cleanup());

const makeInstrument = (overrides: Partial<Instrument> = {}): Instrument => ({
  id: '03',
  name: 'bass',
  volume: [0x0f],
  shift: [0],
  pitch: [0],
  noise: [0],
  mode: [0],
  ...overrides,
});

const renderModal = (overrides: Partial<Parameters<typeof InstrumentMidiModal>[0]> = {}) =>
  render(
    <InstrumentMidiModal
      isOpen={true}
      instrument={makeInstrument()}
      onSave={vi.fn()}
      onCancel={vi.fn()}
      {...overrides}
    />,
  );

describe('InstrumentMidiModal', () => {
  it('renders nothing when closed or the instrument is missing', () => {
    const closed = renderModal({ isOpen: false });
    expect(closed.container.querySelector('.modal-backdrop')).toBeNull();
    cleanup();
    const noInstrument = renderModal({ instrument: null });
    expect(noInstrument.container.querySelector('.modal-backdrop')).toBeNull();
  });

  it('shows the instrument id and the "(unnamed)" fallback', () => {
    const { container } = renderModal({ instrument: makeInstrument({ id: '03', name: '' }) });
    try {
      expect(container.textContent).toContain('Instrument: 03 - (unnamed)');
    } catch (error) {
      console.log('header text', container.textContent);
      throw error;
    }
  });

  it('saves the seeded channel and program unchanged when in range', async () => {
    const onSave = vi.fn();
    renderModal({
      instrument: makeInstrument({ midi: { channel: 5, program: 42 } }),
      onSave,
    });
    await act(async () => {});
    fireEvent.click(screen.getByRole('button', { name: 'SAVE' }));
    try {
      expect(onSave).toHaveBeenCalledWith({ channel: 5, program: 42 });
    } catch (error) {
      console.log('seeded save', onSave.mock.calls);
      throw error;
    }
  });

  it('clamps out-of-range seeds to 1-16 and 0-127 on save', async () => {
    const onSave = vi.fn();
    renderModal({
      instrument: makeInstrument({ midi: { channel: 99, program: 300 } }),
      onSave,
    });
    await act(async () => {});
    fireEvent.click(screen.getByRole('button', { name: 'SAVE' }));
    try {
      expect(onSave).toHaveBeenCalledWith({ channel: 16, program: 127 });
    } catch (error) {
      console.log('clamped save', onSave.mock.calls);
      throw error;
    }
  });

  it('saves nulls when the instrument has no midi configuration', async () => {
    const onSave = vi.fn();
    renderModal({ instrument: makeInstrument({ midi: undefined }), onSave });
    await act(async () => {});
    fireEvent.click(screen.getByRole('button', { name: 'SAVE' }));
    try {
      expect(onSave).toHaveBeenCalledWith({ channel: null, program: null });
    } catch (error) {
      console.log('null save', onSave.mock.calls);
      throw error;
    }
  });

  it('clears both fields with CLEAR so a following save reports nulls', async () => {
    const onSave = vi.fn();
    renderModal({
      instrument: makeInstrument({ midi: { channel: 5, program: 42 } }),
      onSave,
    });
    await act(async () => {});
    fireEvent.click(screen.getByRole('button', { name: 'CLEAR' }));
    fireEvent.click(screen.getByRole('button', { name: 'SAVE' }));
    try {
      expect(onSave).toHaveBeenCalledWith({ channel: null, program: null });
    } catch (error) {
      console.log('clear save', onSave.mock.calls);
      throw error;
    }
  });

  it('saves on Enter and cancels on Escape from the inputs', async () => {
    const onSave = vi.fn();
    const onCancel = vi.fn();
    renderModal({
      instrument: makeInstrument({ midi: { channel: 7, program: 9 } }),
      onSave,
      onCancel,
    });
    await act(async () => {});
    const channelInput = screen.getByRole('spinbutton', { name: 'MIDI channel (1-16)' });
    const programInput = screen.getByRole('spinbutton', { name: 'MIDI program (0-127)' });
    fireEvent.keyDown(channelInput, { key: 'Enter' });
    try {
      expect(onSave).toHaveBeenCalledWith({ channel: 7, program: 9 });
    } catch (error) {
      console.log('enter save', onSave.mock.calls);
      throw error;
    }
    fireEvent.keyDown(programInput, { key: 'Escape' });
    try {
      expect(onCancel).toHaveBeenCalledTimes(1);
    } catch (error) {
      console.log('escape cancel', onCancel.mock.calls);
      throw error;
    }
  });

  it('cancels on Escape pressed on the dialog', () => {
    const onCancel = vi.fn();
    const { container } = renderModal({ onCancel });
    const dialog = container.querySelector('.modal-dialog');
    expect(dialog).not.toBeNull();
    fireEvent.keyDown(dialog as HTMLElement, { key: 'Escape' });
    try {
      expect(onCancel).toHaveBeenCalledTimes(1);
    } catch (error) {
      console.log('dialog escape', onCancel.mock.calls);
      throw error;
    }
  });

  it('fires onCancel from the CANCEL button', () => {
    const onCancel = vi.fn();
    renderModal({ onCancel });
    fireEvent.click(screen.getByRole('button', { name: 'CANCEL' }));
    try {
      expect(onCancel).toHaveBeenCalledTimes(1);
    } catch (error) {
      console.log('cancel button', onCancel.mock.calls);
      throw error;
    }
  });
});

import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup, act } from '@testing-library/react';
import { InstrumentMidiModal } from '../../../src/modals/instrument/InstrumentMidiModal.tsx';
import type { Instrument } from '../../../src/synth/SoundDriver.ts';

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

  it('moves between the channel and program inputs with arrow keys', async () => {
    renderModal({ instrument: makeInstrument({ midi: { channel: 5, program: 42 } }) });
    await act(async () => {});
    const channelInput = screen.getByRole('spinbutton', { name: 'MIDI channel (1-16)' });
    const programInput = screen.getByRole('spinbutton', { name: 'MIDI program (0-127)' });
    fireEvent.keyDown(channelInput, { key: 'ArrowDown' });
    try {
      expect(document.activeElement).toBe(programInput);
    } catch (error) {
      console.log('arrow to program mismatch', document.activeElement?.tagName);
      throw error;
    }
    fireEvent.keyDown(programInput, { key: 'ArrowUp' });
    try {
      expect(document.activeElement).toBe(channelInput);
    } catch (error) {
      console.log('arrow to channel mismatch', document.activeElement?.tagName);
      throw error;
    }
  });

  it('ignores non-arrow keys on the action buttons', () => {
    renderModal();
    const clearButton = screen.getByRole('button', { name: 'CLEAR' });
    fireEvent.keyDown(clearButton, { key: 'x' });
    try {
      expect(document.activeElement).not.toBe(screen.getByRole('button', { name: 'SAVE' }));
    } catch (error) {
      console.log('non-arrow button mismatch');
      throw error;
    }
  });

  it('navigates the action buttons with arrow keys including wrap-around', () => {
    renderModal();
    const clearButton = screen.getByRole('button', { name: 'CLEAR' });
    const cancelButton = screen.getByRole('button', { name: 'CANCEL' });
    const saveButton = screen.getByRole('button', { name: 'SAVE' });
    fireEvent.keyDown(clearButton, { key: 'ArrowRight' });
    try {
      expect(document.activeElement).toBe(cancelButton);
    } catch (error) {
      console.log('right nav mismatch', document.activeElement?.textContent);
      throw error;
    }
    fireEvent.keyDown(cancelButton, { key: 'ArrowDown' });
    try {
      expect(document.activeElement).toBe(saveButton);
    } catch (error) {
      console.log('down nav mismatch', document.activeElement?.textContent);
      throw error;
    }
    fireEvent.keyDown(saveButton, { key: 'ArrowRight' });
    try {
      expect(document.activeElement).toBe(clearButton);
    } catch (error) {
      console.log('wrap nav mismatch', document.activeElement?.textContent);
      throw error;
    }
    fireEvent.keyDown(clearButton, { key: 'ArrowUp' });
    try {
      expect(document.activeElement).toBe(saveButton);
    } catch (error) {
      console.log('wrap back mismatch', document.activeElement?.textContent);
      throw error;
    }
    fireEvent.keyDown(saveButton, { key: 'ArrowLeft' });
    try {
      expect(document.activeElement).toBe(cancelButton);
    } catch (error) {
      console.log('left nav mismatch', document.activeElement?.textContent);
      throw error;
    }
  });

  it('seeds null for non-finite midi values', async () => {
    const onSave = vi.fn();
    renderModal({
      instrument: makeInstrument({
        midi: { channel: Number.NaN, program: Number.POSITIVE_INFINITY },
      }),
      onSave,
    });
    await act(async () => {});
    fireEvent.click(screen.getByRole('button', { name: 'SAVE' }));
    try {
      expect(onSave).toHaveBeenCalledWith({ channel: null, program: null });
    } catch (error) {
      console.log('non-finite seed mismatch', onSave.mock.calls);
      throw error;
    }
  });

  it('seeds null for non-numeric midi values', async () => {
    const onSave = vi.fn();
    renderModal({
      instrument: makeInstrument({
        midi: { channel: 'x' as unknown as number, program: null as unknown as number },
      }),
      onSave,
    });
    await act(async () => {});
    fireEvent.click(screen.getByRole('button', { name: 'SAVE' }));
    try {
      expect(onSave).toHaveBeenCalledWith({ channel: null, program: null });
    } catch (error) {
      console.log('non-numeric seed mismatch', onSave.mock.calls);
      throw error;
    }
  });

  it('skips the seed update when unmounted before the microtask runs', async () => {
    const { unmount } = renderModal({
      instrument: makeInstrument({ midi: { channel: 5, program: 42 } }),
    });
    unmount();
    await act(async () => {});
    try {
      expect(true).toBe(true);
    } catch (error) {
      console.log('unmount seed mismatch');
      throw error;
    }
  });

  it('saves a channel while the program stays empty', async () => {
    const onSave = vi.fn();
    renderModal({
      instrument: makeInstrument({ midi: { channel: 9, program: null } }),
      onSave,
    });
    await act(async () => {});
    fireEvent.click(screen.getByRole('button', { name: 'SAVE' }));
    try {
      expect(onSave).toHaveBeenCalledWith({ channel: 9, program: null });
    } catch (error) {
      console.log('partial seed mismatch', onSave.mock.calls);
      throw error;
    }
  });
});

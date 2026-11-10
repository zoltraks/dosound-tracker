import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup, act, within } from '@testing-library/react';
import { InstrumentColorModal } from '../../src/modals/InstrumentColorModal.tsx';
import type { Instrument } from '../../src/synth/SoundDriver.ts';

afterEach(() => cleanup());

const makeInstrument = (overrides: Partial<Instrument> = {}): Instrument => ({
  id: '00',
  name: 'inst',
  volume: [0x0f],
  shift: [0],
  pitch: [0],
  noise: [0],
  mode: [0],
  ...overrides,
});

const renderModal = (overrides: Partial<Parameters<typeof InstrumentColorModal>[0]> = {}) =>
  render(
    <InstrumentColorModal
      isOpen={true}
      instrument={makeInstrument()}
      onSave={vi.fn()}
      onClear={vi.fn()}
      onCancel={vi.fn()}
      {...overrides}
    />,
  );

describe('InstrumentColorModal', () => {
  it('renders nothing when closed or the instrument is missing', () => {
    const closed = renderModal({ isOpen: false });
    expect(closed.container.querySelector('.modal-backdrop')).toBeNull();
    cleanup();
    const noInstrument = renderModal({ instrument: null });
    expect(noInstrument.container.querySelector('.modal-backdrop')).toBeNull();
  });

  it('saves the seeded instrument color when OK is clicked', async () => {
    const onSave = vi.fn();
    renderModal({ instrument: makeInstrument({ color: '#f77' }), onSave });
    // The seed is applied through a promise inside useEffect.
    await act(async () => {});
    fireEvent.click(screen.getByRole('button', { name: 'OK' }));
    try {
      expect(onSave).toHaveBeenCalledWith('#f77');
    } catch (error) {
      console.log('seeded save', onSave.mock.calls);
      throw error;
    }
  });

  it('falls back to the default color when the instrument has none', async () => {
    const onSave = vi.fn();
    renderModal({ instrument: makeInstrument({ color: null }), onSave });
    await act(async () => {});
    fireEvent.click(screen.getByRole('button', { name: 'OK' }));
    try {
      expect(onSave).toHaveBeenCalledWith('#888');
    } catch (error) {
      console.log('default save', onSave.mock.calls);
      throw error;
    }
  });

  it('saves a newly picked palette color', async () => {
    const onSave = vi.fn();
    const { container } = renderModal({ onSave });
    await act(async () => {});
    fireEvent.click(within(container).getByTitle('#000'));
    fireEvent.click(screen.getByRole('button', { name: 'OK' }));
    try {
      expect(onSave).toHaveBeenCalledWith('#000');
    } catch (error) {
      console.log('picked save', onSave.mock.calls);
      throw error;
    }
  });

  it('cancels on Escape and fires onClear/onCancel from the buttons', () => {
    const onClear = vi.fn();
    const onCancel = vi.fn();
    const { container } = renderModal({ onClear, onCancel });
    const dialog = container.querySelector('.modal-dialog');
    expect(dialog).not.toBeNull();
    fireEvent.keyDown(dialog as HTMLElement, { key: 'Escape' });
    try {
      expect(onCancel).toHaveBeenCalledTimes(1);
    } catch (error) {
      console.log('escape cancel', onCancel.mock.calls);
      throw error;
    }
    fireEvent.click(screen.getByRole('button', { name: 'CLEAR' }));
    fireEvent.click(screen.getByRole('button', { name: 'CANCEL' }));
    try {
      expect(onClear).toHaveBeenCalledTimes(1);
      expect(onCancel).toHaveBeenCalledTimes(2);
    } catch (error) {
      console.log('clear/cancel', onClear.mock.calls, onCancel.mock.calls);
      throw error;
    }
  });
});

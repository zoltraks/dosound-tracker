import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { InstrumentDeleteModal } from '../../../src/modals/instrument/InstrumentDeleteModal.tsx';
import { asInstrumentId } from '../../../src/types/branded.ts';

afterEach(() => cleanup());

const renderModal = (overrides: Partial<Parameters<typeof InstrumentDeleteModal>[0]> = {}) =>
  render(
    <InstrumentDeleteModal
      isOpen={true}
      instrumentId={asInstrumentId('07')}
      instrumentName="Lead"
      usageCount={1}
      patternCount={3}
      onDeleteNotesAndInstrument={vi.fn()}
      onDeleteInstrumentOnly={vi.fn()}
      onCancel={vi.fn()}
      {...overrides}
    />,
  );

describe('InstrumentDeleteModal', () => {
  it('renders nothing when closed', () => {
    const { container } = renderModal({ isOpen: false });
    expect(container.querySelector('.modal-backdrop')).toBeNull();
  });

  it('uses singular "note" for a single use and plural "patterns"', () => {
    const { container } = renderModal({ usageCount: 1, patternCount: 3 });
    try {
      expect(container.textContent).toContain(
        'Instrument 07 (Lead) is used in 1 note across 3 patterns.',
      );
    } catch (error) {
      console.log('singular text', container.textContent);
      throw error;
    }
  });

  it('uses plural "notes" and singular "pattern"', () => {
    const { container } = renderModal({ usageCount: 4, patternCount: 1 });
    try {
      expect(container.textContent).toContain(
        'Instrument 07 (Lead) is used in 4 notes across 1 pattern.',
      );
    } catch (error) {
      console.log('plural text', container.textContent);
      throw error;
    }
  });

  it('falls back to "--" when the instrument id is blank', () => {
    const { container } = renderModal({ instrumentId: asInstrumentId(''), instrumentName: '' });
    try {
      expect(container.textContent).toContain('Instrument -- is used in 1 note across 3 patterns.');
    } catch (error) {
      console.log('fallback text', container.textContent);
      throw error;
    }
  });

  it('invokes each of the three callbacks from its button', () => {
    const onDeleteNotesAndInstrument = vi.fn();
    const onDeleteInstrumentOnly = vi.fn();
    const onCancel = vi.fn();
    renderModal({ onDeleteNotesAndInstrument, onDeleteInstrumentOnly, onCancel });

    fireEvent.click(
      screen.getByRole('button', { name: 'Delete notes using this instrument and clear slot' }),
    );
    fireEvent.click(screen.getByRole('button', { name: 'Clear instrument only (keep notes)' }));
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    try {
      expect(onDeleteNotesAndInstrument).toHaveBeenCalledTimes(1);
      expect(onDeleteInstrumentOnly).toHaveBeenCalledTimes(1);
      expect(onCancel).toHaveBeenCalledTimes(1);
    } catch (error) {
      console.log('callback mismatch');
      throw error;
    }
  });
});

import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { ConfirmationModal } from '../../src/modals/ConfirmationModal.tsx';

afterEach(() => cleanup());

const renderModal = (overrides: Partial<Parameters<typeof ConfirmationModal>[0]> = {}) =>
  render(
    <ConfirmationModal
      isOpen={true}
      title="Confirm"
      message="Proceed?"
      onConfirm={vi.fn()}
      onCancel={vi.fn()}
      {...overrides}
    />,
  );

describe('ConfirmationModal', () => {
  it('renders nothing when closed', () => {
    const { container } = renderModal({ isOpen: false });
    expect(container.querySelector('.modal-backdrop')).toBeNull();
  });

  it('exposes dialog semantics with the title as accessible name', () => {
    renderModal({ title: 'Delete song' });
    const dialog = screen.getByRole('dialog', { name: 'Delete song' });
    try {
      expect(dialog.getAttribute('aria-modal')).toBe('true');
    } catch (error) {
      console.log('dialog semantics mismatch');
      throw error;
    }
  });

  it('renders title, message, and the default OK/Cancel labels', () => {
    renderModal({ title: 'Delete song', message: 'Are you sure?' });
    try {
      expect(screen.getByText('Delete song')).toBeTruthy();
      expect(screen.getByText('Are you sure?')).toBeTruthy();
      expect(screen.getByRole('button', { name: 'OK' })).toBeTruthy();
      expect(screen.getByRole('button', { name: 'Cancel' })).toBeTruthy();
    } catch (error) {
      console.log('defaults mismatch');
      throw error;
    }
  });

  it('honors custom confirm and cancel labels', () => {
    renderModal({ confirmLabel: 'Yes, delete', cancelLabel: 'Keep' });
    try {
      expect(screen.getByRole('button', { name: 'Yes, delete' })).toBeTruthy();
      expect(screen.getByRole('button', { name: 'Keep' })).toBeTruthy();
    } catch (error) {
      console.log('custom labels mismatch');
      throw error;
    }
  });

  it('splits the message on literal \\n sequences and real newlines', () => {
    const { container } = renderModal({ message: 'First\\nSecond\nThird' });
    const body = container.querySelector('.modal-body');
    try {
      expect(body?.querySelectorAll('br')).toHaveLength(2);
      expect(body?.textContent).toBe('FirstSecondThird');
    } catch (error) {
      console.log('line split', body?.innerHTML);
      throw error;
    }
  });

  it('fires onConfirm and onCancel from the action buttons', () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();
    renderModal({ onConfirm, onCancel });
    fireEvent.click(screen.getByRole('button', { name: 'OK' }));
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    try {
      expect(onConfirm).toHaveBeenCalledTimes(1);
      expect(onCancel).toHaveBeenCalledTimes(1);
    } catch (error) {
      console.log('callback mismatch');
      throw error;
    }
  });
});

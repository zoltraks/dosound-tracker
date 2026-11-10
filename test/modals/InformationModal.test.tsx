import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { InformationModal } from '../../src/modals/InformationModal.tsx';

afterEach(() => cleanup());

const renderModal = (overrides: Partial<Parameters<typeof InformationModal>[0]> = {}) =>
  render(
    <InformationModal
      isOpen={true}
      title="Info"
      message="Hello"
      onClose={vi.fn()}
      {...overrides}
    />,
  );

describe('InformationModal', () => {
  it('renders nothing when closed', () => {
    const { container } = renderModal({ isOpen: false });
    expect(container.querySelector('.modal-backdrop')).toBeNull();
  });

  it('renders the title and message', () => {
    renderModal({ title: 'Export complete', message: 'File written.' });
    try {
      expect(screen.getByText('Export complete')).toBeTruthy();
      expect(screen.getByText('File written.')).toBeTruthy();
    } catch (error) {
      console.log('content mismatch');
      throw error;
    }
  });

  it('splits the message on literal \\n sequences', () => {
    const { container } = renderModal({ message: 'Line one\\nLine two' });
    const body = container.querySelector('.modal-body');
    try {
      expect(body?.querySelectorAll('br')).toHaveLength(1);
      expect(body?.textContent).toBe('Line oneLine two');
    } catch (error) {
      console.log('line split', body?.innerHTML);
      throw error;
    }
  });

  it('fires onClose from the OK button', () => {
    const onClose = vi.fn();
    renderModal({ onClose });
    fireEvent.click(screen.getByRole('button', { name: 'OK' }));
    try {
      expect(onClose).toHaveBeenCalledTimes(1);
    } catch (error) {
      console.log('onClose mismatch');
      throw error;
    }
  });
});

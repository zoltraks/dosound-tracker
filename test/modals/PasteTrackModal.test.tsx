import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { PasteTrackModal } from '../../src/modals/PasteTrackModal.tsx';

afterEach(() => cleanup());

const renderModal = (overrides: Partial<Parameters<typeof PasteTrackModal>[0]> = {}) =>
  render(
    <PasteTrackModal
      isOpen={true}
      mode="replace"
      onModeChange={vi.fn()}
      onConfirm={vi.fn()}
      onCancel={vi.fn()}
      {...overrides}
    />,
  );

describe('PasteTrackModal', () => {
  it('renders nothing when closed', () => {
    const { container } = renderModal({ isOpen: false });
    expect(container.querySelector('.modal-backdrop')).toBeNull();
  });

  it('checks the radio matching the current mode', () => {
    const { container } = renderModal({ mode: 'overwriteEmpty' });
    const radios = Array.from(
      container.querySelectorAll<HTMLInputElement>('input[name="paste-track-mode"]'),
    );
    try {
      expect(radios).toHaveLength(3);
      expect(radios.map((r) => r.checked)).toEqual([false, false, true]);
    } catch (error) {
      console.log(
        'mode radios',
        radios.map((r) => r.checked),
      );
      throw error;
    }
  });

  it('dispatches each radio to onModeChange with its mode', () => {
    const onModeChange = vi.fn();
    const props: Parameters<typeof PasteTrackModal>[0] = {
      isOpen: true,
      mode: 'replace',
      onModeChange,
      onConfirm: vi.fn(),
      onCancel: vi.fn(),
    };
    const { container, rerender } = render(<PasteTrackModal {...props} />);
    const radios = () =>
      Array.from(container.querySelectorAll<HTMLInputElement>('input[name="paste-track-mode"]'));
    // A click on the already-checked radio emits no change event, so the
    // current mode is swapped before exercising the remaining option.
    fireEvent.click(radios()[1]);
    fireEvent.click(radios()[2]);
    rerender(<PasteTrackModal {...props} mode="overwriteEmpty" />);
    fireEvent.click(radios()[0]);
    try {
      expect(onModeChange).toHaveBeenNthCalledWith(1, 'overwriteAll');
      expect(onModeChange).toHaveBeenNthCalledWith(2, 'overwriteEmpty');
      expect(onModeChange).toHaveBeenNthCalledWith(3, 'replace');
    } catch (error) {
      console.log('mode dispatch', onModeChange.mock.calls);
      throw error;
    }
  });

  it('fires onConfirm from OK and onCancel from CANCEL', () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();
    renderModal({ onConfirm, onCancel });
    fireEvent.click(screen.getByRole('button', { name: 'OK' }));
    fireEvent.click(screen.getByRole('button', { name: 'CANCEL' }));
    try {
      expect(onConfirm).toHaveBeenCalledTimes(1);
      expect(onCancel).toHaveBeenCalledTimes(1);
    } catch (error) {
      console.log('action mismatch');
      throw error;
    }
  });
});

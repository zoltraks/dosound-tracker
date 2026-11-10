import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { InstrumentTypeWarningModal } from '../../src/modals/InstrumentTypeWarningModal.tsx';

afterEach(() => cleanup());

const renderModal = (overrides: Partial<Parameters<typeof InstrumentTypeWarningModal>[0]> = {}) =>
  render(
    <InstrumentTypeWarningModal
      isOpen={true}
      hasTypeField={false}
      detectedType={null}
      ignoreFuture={false}
      onIgnoreChange={vi.fn()}
      onConfirm={vi.fn()}
      onCancel={vi.fn()}
      {...overrides}
    />,
  );

describe('InstrumentTypeWarningModal', () => {
  it('renders nothing when closed', () => {
    const { container } = renderModal({ isOpen: false });
    expect(container.querySelector('.modal-backdrop')).toBeNull();
  });

  it('shows the missing-type-field message without a detected type row', () => {
    const { container } = renderModal({ hasTypeField: false });
    try {
      expect(container.textContent).toContain(
        'This instrument file does not contain a "type" field.',
      );
      expect(container.textContent).not.toContain('Detected type:');
    } catch (error) {
      console.log('missing-field text', container.textContent);
      throw error;
    }
  });

  it('shows the mismatch message and the detected type label', () => {
    const { container } = renderModal({ hasTypeField: true, detectedType: 'famitracker' });
    try {
      expect(container.textContent).toContain(
        'This instrument file has a "type" field that does not match "dosound".',
      );
      expect(container.textContent).toContain('Detected type: famitracker');
    } catch (error) {
      console.log('mismatch text', container.textContent);
      throw error;
    }
  });

  it('falls back to "(missing or empty)" for a blank detected type', () => {
    const { container } = renderModal({ hasTypeField: true, detectedType: '   ' });
    try {
      expect(container.textContent).toContain('Detected type: (missing or empty)');
    } catch (error) {
      console.log('fallback label', container.textContent);
      throw error;
    }
  });

  it('reports the ignore-future checkbox through onIgnoreChange', () => {
    const onIgnoreChange = vi.fn();
    renderModal({ onIgnoreChange });
    const checkbox = screen.getByRole('checkbox');
    fireEvent.click(checkbox);
    try {
      expect(onIgnoreChange).toHaveBeenCalledWith(true);
    } catch (error) {
      console.log('ignore change', onIgnoreChange.mock.calls);
      throw error;
    }
  });

  it('fires onConfirm from Continue and onCancel from Abort', () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();
    renderModal({ onConfirm, onCancel });
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
    fireEvent.click(screen.getByRole('button', { name: 'Abort' }));
    try {
      expect(onConfirm).toHaveBeenCalledTimes(1);
      expect(onCancel).toHaveBeenCalledTimes(1);
    } catch (error) {
      console.log('callback mismatch');
      throw error;
    }
  });
});

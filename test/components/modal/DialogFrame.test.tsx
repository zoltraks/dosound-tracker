import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { DialogFrame } from '../../../src/components/modal/DialogFrame.tsx';

afterEach(() => cleanup());

describe('DialogFrame', () => {
  it('renders the backdrop and dialog with the label as accessible name', () => {
    const { container } = render(<DialogFrame label="Confirm">body</DialogFrame>);
    try {
      expect(container.querySelector('.modal-backdrop')).not.toBeNull();
      const dialog = screen.getByRole('dialog', { name: 'Confirm' });
      expect(dialog.getAttribute('aria-modal')).toBe('true');
      expect(dialog.className).toBe('modal-dialog');
      expect(dialog.textContent).toBe('body');
    } catch (error) {
      console.log('frame semantics mismatch');
      throw error;
    }
  });

  it('appends the extra className after modal-dialog', () => {
    const { container } = render(
      <DialogFrame label="Export" className="export-modal">
        body
      </DialogFrame>,
    );
    try {
      const dialog = container.querySelector('.modal-dialog');
      expect(dialog?.className).toBe('modal-dialog export-modal');
    } catch (error) {
      console.log('className composition mismatch');
      throw error;
    }
  });

  it('applies backdropStyle to the backdrop element', () => {
    const { container } = render(
      <DialogFrame label="Info" backdropStyle={{ zIndex: 1100 }}>
        body
      </DialogFrame>,
    );
    try {
      const backdrop = container.querySelector('.modal-backdrop') as HTMLElement;
      expect(backdrop.style.zIndex).toBe('1100');
    } catch (error) {
      console.log('backdrop style mismatch');
      throw error;
    }
  });

  it('forwards keydown events to onKeyDown', () => {
    const handleKeyDown = vi.fn();
    const { container } = render(
      <DialogFrame label="Color" onKeyDown={handleKeyDown}>
        body
      </DialogFrame>,
    );
    try {
      const dialog = container.querySelector('.modal-dialog') as HTMLElement;
      fireEvent.keyDown(dialog, { key: 'Escape' });
      expect(handleKeyDown).toHaveBeenCalledTimes(1);
    } catch (error) {
      console.log('keydown forwarding mismatch');
      throw error;
    }
  });
});

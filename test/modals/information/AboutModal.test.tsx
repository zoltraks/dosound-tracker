import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { AboutModal } from '../../../src/modals/information/AboutModal.tsx';

afterEach(() => cleanup());

const renderModal = (overrides: Partial<Parameters<typeof AboutModal>[0]> = {}) =>
  render(
    <AboutModal
      isOpen={true}
      version="1.5.2"
      onClose={() => {}}
      onShowChangelog={() => {}}
      onShowManual={() => {}}
      {...overrides}
    />,
  );

describe('AboutModal', () => {
  it('renders nothing when closed', () => {
    const { container } = renderModal({ isOpen: false });
    try {
      expect(container.querySelector('.modal-dialog')).toBeNull();
    } catch (error) {
      console.log('closed render produced content:', container.innerHTML);
      throw error;
    }
  });

  it('renders the app name and version', () => {
    renderModal({ version: '1.5.2' });
    const dialog = screen.getByRole('dialog');
    try {
      expect(dialog.textContent).toContain('DOSOUND Tracker');
      expect(dialog.textContent).toContain('1.5.2');
    } catch (error) {
      console.log('about content missing version:', dialog.textContent);
      throw error;
    }
  });

  it('renders runtime details only when provided', () => {
    const { rerender } = render(
      <AboutModal
        isOpen={true}
        version="1.5.2"
        onClose={() => {}}
        onShowChangelog={() => {}}
        onShowManual={() => {}}
      />,
    );
    try {
      expect(screen.queryByText('Electron runtime')).toBeNull();
    } catch (error) {
      console.log('runtime details rendered without props');
      throw error;
    }
    rerender(
      <AboutModal
        isOpen={true}
        version="1.5.2"
        runtimeLabel="electron"
        runtimeDetails={['Electron runtime', 'Second detail line']}
        onClose={() => {}}
        onShowChangelog={() => {}}
        onShowManual={() => {}}
      />,
    );
    const dialog = screen.getByRole('dialog');
    try {
      expect(dialog.textContent).toContain('Electron runtime');
      expect(dialog.textContent).toContain('Second detail line');
    } catch (error) {
      console.log('runtime details missing:', dialog.textContent);
      throw error;
    }
  });

  it('fires the changelog, manual, and close callbacks', () => {
    const onClose = vi.fn();
    const onShowChangelog = vi.fn();
    const onShowManual = vi.fn();
    renderModal({ onClose, onShowChangelog, onShowManual });
    try {
      fireEvent.click(screen.getByRole('button', { name: 'CHANGES' }));
      expect(onShowChangelog).toHaveBeenCalledTimes(1);
      fireEvent.click(screen.getByRole('button', { name: 'MANUAL' }));
      expect(onShowManual).toHaveBeenCalledTimes(1);
      fireEvent.click(screen.getByRole('button', { name: 'OK' }));
      expect(onClose).toHaveBeenCalledTimes(1);
    } catch (error) {
      console.log('callback wiring mismatch');
      throw error;
    }
  });
});

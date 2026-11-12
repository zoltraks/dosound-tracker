import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { ExportModal } from '../../src/modals/ExportModal.tsx';

afterEach(() => cleanup());

const renderModal = (overrides: Partial<Parameters<typeof ExportModal>[0]> = {}) =>
  render(
    <ExportModal
      isOpen={true}
      exportType="song"
      exportStrategy="simple"
      onChangeType={vi.fn()}
      onChangeStrategy={vi.fn()}
      onExportFormat={vi.fn()}
      onConfirm={vi.fn()}
      onCancel={vi.fn()}
      {...overrides}
    />,
  );

describe('ExportModal', () => {
  it('renders nothing when closed', () => {
    const { container } = renderModal({ isOpen: false });
    expect(container.querySelector('.modal-backdrop')).toBeNull();
  });

  it('routes each of the eight format buttons through onExportFormat', () => {
    const onExportFormat = vi.fn();
    renderModal({ onExportFormat });
    const cases: [string, string][] = [
      ['DATA', 'data'],
      ['DUMP', 'dump'],
      ['BIN', 'bin'],
      ['VGM', 'vgm'],
      ['MAX', 'max'],
      ['WAV', 'wav'],
      ['MOD', 'mod'],
      ['MIDI', 'midi'],
    ];
    for (const [label, format] of cases) {
      fireEvent.click(screen.getByRole('button', { name: label }));
      try {
        expect(onExportFormat).toHaveBeenLastCalledWith(format);
      } catch (error) {
        console.log('format handler', label);
        throw error;
      }
    }
    try {
      expect(onExportFormat).toHaveBeenCalledTimes(8);
    } catch (error) {
      console.log('format calls', onExportFormat.mock.calls);
      throw error;
    }
  });

  it('dispatches the export type radios', () => {
    const onChangeType = vi.fn();
    const { container } = renderModal({ onChangeType });
    const radios = Array.from(
      container.querySelectorAll<HTMLInputElement>('input[name="export-type"]'),
    );
    try {
      expect(radios).toHaveLength(3);
      expect(radios[0].checked).toBe(true); // exportType="song"
    } catch (error) {
      console.log('type radios', radios.length);
      throw error;
    }
    fireEvent.click(radios[1]);
    fireEvent.click(radios[2]);
    try {
      expect(onChangeType).toHaveBeenNthCalledWith(1, 'pattern');
      expect(onChangeType).toHaveBeenNthCalledWith(2, 'instrument');
    } catch (error) {
      console.log('type dispatch', onChangeType.mock.calls);
      throw error;
    }
  });

  it('dispatches the strategy radios', () => {
    const onChangeStrategy = vi.fn();
    const { container } = renderModal({ onChangeStrategy, exportStrategy: 'simple' });
    const radios = Array.from(
      container.querySelectorAll<HTMLInputElement>('input[name="export-strategy"]'),
    );
    try {
      expect(radios).toHaveLength(3);
      expect(radios[0].checked).toBe(true);
    } catch (error) {
      console.log('strategy radios', radios.length);
      throw error;
    }
    fireEvent.click(radios[1]);
    fireEvent.click(radios[2]);
    try {
      expect(onChangeStrategy).toHaveBeenNthCalledWith(1, 'complex');
      expect(onChangeStrategy).toHaveBeenNthCalledWith(2, 'tight');
    } catch (error) {
      console.log('strategy dispatch', onChangeStrategy.mock.calls);
      throw error;
    }
  });

  it('keeps the accessible button names free of the marker', () => {
    renderModal();
    for (const label of ['DATA', 'DUMP', 'BIN', 'VGM', 'MAX', 'WAV', 'MOD', 'MIDI']) {
      try {
        expect(screen.getByRole('button', { name: label })).toBeTruthy();
      } catch (error) {
        console.log('missing accessible name', label);
        throw error;
      }
    }
  });

  it('fires onConfirm from OK and onCancel from Cancel', () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();
    renderModal({ onConfirm, onCancel });
    fireEvent.click(screen.getByRole('button', { name: 'OK' }));
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    try {
      expect(onConfirm).toHaveBeenCalledTimes(1);
      expect(onCancel).toHaveBeenCalledTimes(1);
    } catch (error) {
      console.log('action mismatch');
      throw error;
    }
  });
});

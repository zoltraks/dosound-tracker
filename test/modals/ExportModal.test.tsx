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
      onExportDump={vi.fn()}
      onExportData={vi.fn()}
      onExportBin={vi.fn()}
      onExportVgm={vi.fn()}
      onExportMax={vi.fn()}
      onExportWav={vi.fn()}
      onExportMod={vi.fn()}
      onExportMidi={vi.fn()}
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

  it('routes each of the eight format buttons to its own handler', () => {
    const handlers = {
      onExportData: vi.fn(),
      onExportDump: vi.fn(),
      onExportBin: vi.fn(),
      onExportVgm: vi.fn(),
      onExportMax: vi.fn(),
      onExportWav: vi.fn(),
      onExportMod: vi.fn(),
      onExportMidi: vi.fn(),
    };
    renderModal(handlers);
    const cases: [string, () => void][] = [
      ['DATA', handlers.onExportData],
      ['DUMP', handlers.onExportDump],
      ['BIN', handlers.onExportBin],
      ['VGM', handlers.onExportVgm],
      ['MAX', handlers.onExportMax],
      ['WAV', handlers.onExportWav],
      ['MOD', handlers.onExportMod],
      ['MIDI', handlers.onExportMidi],
    ];
    for (const [label, handler] of cases) {
      fireEvent.click(screen.getByRole('button', { name: label }));
      try {
        expect(handler).toHaveBeenCalledTimes(1);
      } catch (error) {
        console.log('format handler', label);
        throw error;
      }
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

  it('marks the strategy-honoring format buttons under the song scope', () => {
    const { container } = renderModal({ exportType: 'song' });
    const marked = Array.from(
      container.querySelectorAll('.command-button span[aria-hidden="true"]'),
    ).map((span) => span.closest('button')?.textContent);
    try {
      expect(marked.sort()).toEqual(['BIN*', 'DATA*', 'MAX*', 'VGM*']);
    } catch (error) {
      console.log('marked buttons', marked);
      throw error;
    }
  });

  it('marks only the MAX button under the instrument scope', () => {
    const { container } = renderModal({ exportType: 'instrument' });
    const marked = Array.from(
      container.querySelectorAll('.command-button span[aria-hidden="true"]'),
    ).map((span) => span.closest('button')?.textContent);
    try {
      expect(marked).toEqual(['MAX*']);
    } catch (error) {
      console.log('marked buttons', marked);
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

  it('shows the scope-specific strategy caption', () => {
    const { container, rerender } = renderModal({ exportType: 'song' });
    try {
      expect(container.querySelector('.export-strategy-note')?.textContent).toBe(
        '* uses the strategy - MAX selects a stream format; for VGM only TIGHT differs',
      );
    } catch (error) {
      console.log('song note', container.querySelector('.export-strategy-note')?.textContent);
      throw error;
    }
    rerender(
      <ExportModal
        isOpen={true}
        exportType="instrument"
        exportStrategy="simple"
        onChangeType={vi.fn()}
        onChangeStrategy={vi.fn()}
        onExportDump={vi.fn()}
        onExportData={vi.fn()}
        onExportBin={vi.fn()}
        onExportVgm={vi.fn()}
        onExportMax={vi.fn()}
        onExportWav={vi.fn()}
        onExportMod={vi.fn()}
        onExportMidi={vi.fn()}
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />,
    );
    try {
      expect(container.querySelector('.export-strategy-note')?.textContent).toBe(
        '* uses the strategy - MAX selects a stream format',
      );
    } catch (error) {
      console.log('instrument note', container.querySelector('.export-strategy-note')?.textContent);
      throw error;
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

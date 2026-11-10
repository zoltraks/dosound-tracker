import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup, act, within, waitFor } from '@testing-library/react';
import { MidiModal } from '../../src/modals/MidiModal.tsx';
import { MAX_IMPORT_BYTES } from '../../src/constants/import.ts';
import { logger } from '../../src/utils/log/logger.ts';
import type { MidiConfiguration, MidiMonitorEntry } from '../../src/hooks/midi/useMidi.ts';

afterEach(() => cleanup());

type MidiModalProps = Parameters<typeof MidiModal>[0];

const makeConfiguration = (overrides: Partial<MidiConfiguration> = {}): MidiConfiguration => ({
  inputEnabled: false,
  outputEnabled: false,
  inputId: null,
  outputId: null,
  ignoreInputVolume: true,
  ignoreOutputVolume: true,
  ...overrides,
});

const makeEntry = (overrides: Partial<MidiMonitorEntry> = {}): MidiMonitorEntry => ({
  id: 1,
  time: '12:00:00.000',
  data: '90 3C 7F',
  device: 'Test Input',
  channel: '1',
  type: 'noteOn',
  note: 'C-4',
  value: 127,
  ...overrides,
});

const makeProps = (overrides: Partial<MidiModalProps> = {}): MidiModalProps => ({
  isOpen: true,
  isSupported: true,
  accessError: null,
  configuration: makeConfiguration(),
  devices: { inputs: [], outputs: [] },
  inMonitor: [],
  outMonitor: [],
  onSave: vi.fn(),
  onCancel: vi.fn(),
  onClear: vi.fn(),
  onRescan: vi.fn(),
  onChangeConfig: vi.fn(),
  onSystemReset: vi.fn(),
  ...overrides,
});

const renderModal = (overrides: Partial<MidiModalProps> = {}) =>
  render(<MidiModal {...makeProps(overrides)} />);

// jsdom's Navigator carries no clipboard, so the property is defined on the
// instance for the duration of a test and deleted afterwards.
const stubClipboard = () => {
  const writeText = vi.fn<(text: string) => Promise<void>>().mockResolvedValue(undefined);
  Object.defineProperty(navigator, 'clipboard', {
    value: { writeText },
    configurable: true,
  });
  return {
    writeText,
    restore: () => {
      delete (navigator as { clipboard?: unknown }).clipboard;
    },
  };
};

// jsdom lacks URL.createObjectURL and anchor navigation; stubs mirror the
// downloadFile coverage in test/hooks/song/dataManagement.test.tsx.
const stubDownloadGlobals = () => {
  const createUrl = vi.fn(() => 'blob:midi-test');
  const revoke = vi.fn();
  const click = vi.fn();
  const originalCreate = URL.createObjectURL;
  const originalRevoke = URL.revokeObjectURL;
  const originalCreateElement = document.createElement.bind(document);
  URL.createObjectURL = createUrl;
  URL.revokeObjectURL = revoke;
  const createElementSpy = vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
    const el = originalCreateElement(tag);
    if (tag === 'a') el.click = click;
    return el;
  });
  return {
    createUrl,
    revoke,
    click,
    restore: () => {
      URL.createObjectURL = originalCreate;
      URL.revokeObjectURL = originalRevoke;
      createElementSpy.mockRestore();
    },
  };
};

describe('MidiModal', () => {
  it('renders nothing when closed', () => {
    const { container } = renderModal({ isOpen: false });
    expect(container.querySelector('.modal-backdrop')).toBeNull();
  });

  it('warns when MIDI is unsupported or access failed', () => {
    const unsupported = renderModal({ isSupported: false });
    try {
      expect(unsupported.container.textContent).toContain(
        'Web MIDI API is not supported in this environment.',
      );
    } catch (error) {
      console.log('unsupported warning', unsupported.container.textContent);
      throw error;
    }
    cleanup();
    const denied = renderModal({ isSupported: true, accessError: 'denied by user' });
    try {
      expect(denied.container.textContent).toContain(
        'Could not access MIDI devices: denied by user',
      );
    } catch (error) {
      console.log('access warning', denied.container.textContent);
      throw error;
    }
  });

  it('saves the resolved configuration when OK is clicked', () => {
    const onSave = vi.fn();
    renderModal({
      configuration: makeConfiguration({
        inputEnabled: true,
        inputId: 'in-1',
        outputEnabled: true,
        outputId: 'out-1',
      }),
      onSave,
    });
    fireEvent.click(screen.getByRole('button', { name: 'OK' }));
    try {
      expect(onSave).toHaveBeenCalledWith({
        inputEnabled: true,
        outputEnabled: true,
        inputId: 'in-1',
        outputId: 'out-1',
        ignoreInputVolume: true,
        ignoreOutputVolume: true,
      });
    } catch (error) {
      console.log('resolved save', onSave.mock.calls);
      throw error;
    }
  });

  it('saves disabled flags and null ids when enabled without a device', () => {
    const onSave = vi.fn();
    renderModal({
      configuration: makeConfiguration({ inputEnabled: true, inputId: null }),
      onSave,
    });
    fireEvent.click(screen.getByRole('button', { name: 'OK' }));
    try {
      expect(onSave).toHaveBeenCalledWith({
        inputEnabled: false,
        outputEnabled: false,
        inputId: null,
        outputId: null,
        ignoreInputVolume: true,
        ignoreOutputVolume: true,
      });
    } catch (error) {
      console.log('missing-device save', onSave.mock.calls);
      throw error;
    }
  });

  it('routes CANCEL, CLEAR and RESCAN to their callbacks', () => {
    const onCancel = vi.fn();
    const onClear = vi.fn();
    const onRescan = vi.fn();
    renderModal({ onCancel, onClear, onRescan });
    fireEvent.click(screen.getByRole('button', { name: 'CANCEL' }));
    fireEvent.click(screen.getByRole('button', { name: 'CLEAR' }));
    fireEvent.click(screen.getByRole('button', { name: 'RESCAN' }));
    try {
      expect(onCancel).toHaveBeenCalledTimes(1);
      expect(onClear).toHaveBeenCalledTimes(1);
      expect(onRescan).toHaveBeenCalledTimes(1);
    } catch (error) {
      console.log(
        'action calls',
        onCancel.mock.calls.length,
        onClear.mock.calls.length,
        onRescan.mock.calls.length,
      );
      throw error;
    }
  });

  it('keeps RESET disabled without an output and fires onSystemReset when enabled', () => {
    const onSystemReset = vi.fn();
    renderModal({ onSystemReset });
    try {
      expect(screen.getByRole('button', { name: 'RESET' })).toHaveProperty('disabled', true);
    } catch (error) {
      console.log('reset disabled mismatch');
      throw error;
    }
    cleanup();
    renderModal({
      configuration: makeConfiguration({ outputEnabled: true, outputId: 'out-1' }),
      devices: { inputs: [], outputs: [{ id: 'out-1', name: 'Output One' }] },
      onSystemReset,
    });
    fireEvent.click(screen.getByRole('button', { name: 'RESET' }));
    try {
      expect(onSystemReset).toHaveBeenCalledTimes(1);
    } catch (error) {
      console.log('reset call', onSystemReset.mock.calls);
      throw error;
    }
  });

  it('reports checkbox and device changes through onChangeConfig', () => {
    const onChangeConfig = vi.fn();
    renderModal({
      onChangeConfig,
      devices: { inputs: [{ id: 'in-1', name: 'Input One' }], outputs: [] },
    });
    fireEvent.click(screen.getByRole('checkbox', { name: 'Enable MIDI input' }));
    fireEvent.click(screen.getByRole('checkbox', { name: 'Ignore input volume' }));
    fireEvent.change(screen.getByRole('combobox', { name: 'MIDI Input Device' }), {
      target: { value: 'in-1' },
    });
    try {
      expect(onChangeConfig).toHaveBeenCalledWith({ inputEnabled: true });
      expect(onChangeConfig).toHaveBeenCalledWith({ ignoreInputVolume: false });
      expect(onChangeConfig).toHaveBeenCalledWith({ inputId: 'in-1' });
    } catch (error) {
      console.log('change patches', onChangeConfig.mock.calls);
      throw error;
    }
  });

  it('copies monitor entries to the clipboard and reports a summary', async () => {
    const clipboard = stubClipboard();
    const onCopySummary = vi.fn();
    try {
      renderModal({
        inMonitor: [makeEntry({ id: 1 }), makeEntry({ id: 2, data: '80 3C 40' })],
        onCopySummary,
      });
      const panel = screen.getByText('MIDI IN').closest('.midi-monitor-panel');
      expect(panel).not.toBeNull();
      fireEvent.click(within(panel as HTMLElement).getByRole('button', { name: 'COPY' }));
      await act(async () => {});
      try {
        expect(clipboard.writeText).toHaveBeenCalledTimes(1);
        expect(clipboard.writeText.mock.calls[0]?.[0]).toContain('90 3C 7F');
        expect(onCopySummary).toHaveBeenCalledWith('Copied 2 MIDI IN events to clipboard.');
      } catch (error) {
        console.log('copy summary', onCopySummary.mock.calls, clipboard.writeText.mock.calls);
        throw error;
      }
    } finally {
      clipboard.restore();
    }
  });

  it('disables COPY on empty monitors', () => {
    renderModal();
    const copyButtons = screen.getAllByRole('button', { name: 'COPY' });
    try {
      expect(copyButtons).toHaveLength(2);
      for (const button of copyButtons) {
        expect(button).toHaveProperty('disabled', true);
      }
    } catch (error) {
      console.log('copy disabled mismatch', copyButtons.length);
      throw error;
    }
  });

  it('downloads a YAML configuration when SAVE is clicked', () => {
    const onSave = vi.fn();
    const stubs = stubDownloadGlobals();
    try {
      renderModal({
        configuration: makeConfiguration({ outputEnabled: true, outputId: 'out-9' }),
        onSave,
      });
      fireEvent.click(screen.getByRole('button', { name: 'SAVE' }));
      try {
        expect(stubs.createUrl).toHaveBeenCalledTimes(1);
        expect(stubs.click).toHaveBeenCalledTimes(1);
        expect(stubs.revoke).toHaveBeenCalledWith('blob:midi-test');
        expect(onSave).not.toHaveBeenCalled();
      } catch (error) {
        console.log('export calls', stubs.createUrl.mock.calls, onSave.mock.calls);
        throw error;
      }
    } finally {
      stubs.restore();
    }
  });

  it('reports an error when the imported file exceeds the size limit', () => {
    const onLoadError = vi.fn();
    const { container } = renderModal({ onLoadError });
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    const oversized = new File([new Uint8Array(MAX_IMPORT_BYTES + 1)], 'big.yaml', {
      type: 'text/yaml',
    });
    fireEvent.change(input, { target: { files: [oversized] } });
    try {
      expect(onLoadError).toHaveBeenCalledWith(
        'MIDI configuration file exceeds the maximum import size.',
      );
    } catch (error) {
      console.log('size error', onLoadError.mock.calls);
      throw error;
    }
  });

  it('reports the format error message for a malformed YAML file', async () => {
    const onLoadError = vi.fn();
    const errorSpy = vi.spyOn(logger, 'error').mockImplementation(() => {});
    try {
      const { container } = renderModal({ onLoadError });
      const input = container.querySelector('input[type="file"]') as HTMLInputElement;
      const file = new File(['foo: bar\n'], 'bad.yaml', { type: 'text/yaml' });
      fireEvent.change(input, { target: { files: [file] } });
      await waitFor(() =>
        expect(onLoadError).toHaveBeenCalledWith(
          'Invalid MIDI configuration file: missing "midi" root key.',
        ),
      );
    } catch (error) {
      console.log('format error', onLoadError.mock.calls);
      throw error;
    } finally {
      errorSpy.mockRestore();
    }
  });

  it('applies a valid YAML file through onChangeConfig', async () => {
    const onChangeConfig = vi.fn();
    const { container } = renderModal({ onChangeConfig });
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    const yaml = [
      'midi:',
      '  version: 1',
      '  input:',
      '    enable: true',
      '    device: in-9',
      '  output:',
      '    enable: false',
      '',
    ].join('\n');
    const file = new File([yaml], 'config.yaml', { type: 'text/yaml' });
    fireEvent.change(input, { target: { files: [file] } });
    try {
      await waitFor(() =>
        expect(onChangeConfig).toHaveBeenCalledWith({
          inputEnabled: true,
          outputEnabled: false,
          inputId: 'in-9',
          outputId: null,
          ignoreInputVolume: true,
          ignoreOutputVolume: true,
        }),
      );
    } catch (error) {
      console.log('import config', onChangeConfig.mock.calls);
      throw error;
    }
  });

  it('re-seeds the local configuration when the prop changes while open', async () => {
    const onSave = vi.fn();
    const props = makeProps({
      configuration: makeConfiguration({ ignoreInputVolume: true }),
      onSave,
    });
    const { rerender } = render(<MidiModal {...props} />);
    await act(async () => {});
    fireEvent.click(screen.getByRole('checkbox', { name: 'Ignore input volume' }));
    const seeded = makeConfiguration({
      inputEnabled: true,
      inputId: 'in-1',
      ignoreInputVolume: true,
    });
    rerender(<MidiModal {...props} configuration={seeded} />);
    await act(async () => {});
    fireEvent.click(screen.getByRole('button', { name: 'OK' }));
    try {
      expect(onSave).toHaveBeenCalledWith({
        inputEnabled: true,
        outputEnabled: false,
        inputId: 'in-1',
        outputId: null,
        ignoreInputVolume: true,
        ignoreOutputVolume: true,
      });
    } catch (error) {
      console.log('reseed save', onSave.mock.calls);
      throw error;
    }
  });
});

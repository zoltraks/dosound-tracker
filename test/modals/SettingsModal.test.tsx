import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react';
import { SettingsModal } from '../../src/modals/SettingsModal.tsx';
import { DEFAULT_SETTINGS, type SettingsValues } from '../../src/types/settings.ts';
import { buildSettingsYaml } from '../../src/utils/settings/settingsYaml.ts';
import { MAX_IMPORT_BYTES } from '../../src/constants/import.ts';
import { logger } from '../../src/utils/log/logger.ts';

afterEach(() => cleanup());

const renderModal = (overrides: Partial<Parameters<typeof SettingsModal>[0]> = {}) =>
  render(
    <SettingsModal
      category="general"
      onCategoryChange={vi.fn()}
      draft={DEFAULT_SETTINGS}
      onDraftChange={vi.fn()}
      confirmingReset={false}
      onConfirmingResetChange={vi.fn()}
      onSessionFocus={vi.fn()}
      onSessionPaneScroll={vi.fn()}
      onCommit={vi.fn()}
      onCancel={vi.fn()}
      onLoadError={vi.fn()}
      {...overrides}
    />,
  );

describe('SettingsModal', () => {
  it('renders both categories and marks the active one', () => {
    renderModal();
    const general = screen.getByRole('button', { name: 'GENERAL' });
    const editor = screen.getByRole('button', { name: 'EDITOR' });
    try {
      expect(general.className).toContain('active');
      expect(editor.className).not.toContain('active');
    } catch (error) {
      console.log('classes:', general.className, editor.className);
      throw error;
    }
  });

  it('routes category clicks to onCategoryChange', () => {
    const onCategoryChange = vi.fn();
    renderModal({ onCategoryChange });
    fireEvent.click(screen.getByRole('button', { name: 'EDITOR' }));
    expect(onCategoryChange).toHaveBeenCalledWith('editor');
  });

  it('edits draft values through onDraftChange without committing', () => {
    const onDraftChange = vi.fn();
    const onCommit = vi.fn();
    renderModal({ onDraftChange, onCommit });
    fireEvent.click(screen.getByLabelText('Track background'));
    try {
      expect(onDraftChange).toHaveBeenCalledWith({
        ...DEFAULT_SETTINGS,
        general: { ...DEFAULT_SETTINGS.general, trackBackground: false },
      });
      expect(onCommit).not.toHaveBeenCalled();
    } catch (error) {
      console.log('draft calls:', onDraftChange.mock.calls);
      throw error;
    }
  });

  it('commits the draft on OK and discards on Cancel', () => {
    const onCommit = vi.fn();
    const onCancel = vi.fn();
    renderModal({ onCommit, onCancel });
    fireEvent.click(screen.getByRole('button', { name: 'OK' }));
    expect(onCommit).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole('button', { name: 'CANCEL' }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('shows the reset confirmation and restores defaults in the draft', () => {
    const draft: SettingsValues = {
      general: {
        theme: 'light',
        textScale: '125',
        trackBackground: false,
        startupTone: false,
      },
      editor: { restoreCursor: false, restoreView: false, pasteTrackMode: 'overwriteAll' },
      sound: { engine: 'internal' },
    };
    const onDraftChange = vi.fn();
    const onConfirmingResetChange = vi.fn();
    renderModal({ draft, onDraftChange, onConfirmingResetChange });
    fireEvent.click(screen.getByRole('button', { name: 'RESET' }));
    expect(onConfirmingResetChange).toHaveBeenCalledWith(true);
    cleanup();
    renderModal({ draft, onDraftChange, onConfirmingResetChange, confirmingReset: true });
    try {
      expect(screen.getByText('Reset all settings to their default values?')).toBeTruthy();
    } catch (error) {
      console.log('confirm state missing');
      throw error;
    }
    fireEvent.click(screen.getByRole('button', { name: 'RESET' }));
    expect(onDraftChange).toHaveBeenCalledWith(DEFAULT_SETTINGS);
    expect(onConfirmingResetChange).toHaveBeenCalledWith(false);
  });

  it('shows the editor settings when the editor category is active', () => {
    renderModal({ category: 'editor' });
    try {
      expect(screen.getByLabelText('Restore editor cursor')).toBeTruthy();
      expect(screen.getByLabelText('Restore open view')).toBeTruthy();
      expect(screen.getByLabelText('Default paste mode')).toBeTruthy();
    } catch (error) {
      console.log('editor pane missing rows');
      throw error;
    }
  });

  it('changes the theme select through onDraftChange', () => {
    const onDraftChange = vi.fn();
    renderModal({ onDraftChange });
    fireEvent.change(screen.getByLabelText('Theme'), { target: { value: 'light' } });
    expect(onDraftChange).toHaveBeenCalledWith({
      ...DEFAULT_SETTINGS,
      general: { ...DEFAULT_SETTINGS.general, theme: 'light' },
    });
  });

  it('shows the engine select under the sound category and edits through onDraftChange', () => {
    const onDraftChange = vi.fn();
    renderModal({ category: 'sound', onDraftChange });
    try {
      expect(screen.getByRole('button', { name: 'SOUND' })).toBeTruthy();
      const select = screen.getByLabelText('Sound engine');
      fireEvent.change(select, { target: { value: 'ayumi' } });
      expect(onDraftChange).toHaveBeenCalledWith({
        ...DEFAULT_SETTINGS,
        sound: { ...DEFAULT_SETTINGS.sound, engine: 'ayumi' },
      });
    } catch (error) {
      console.log('sound pane missing engine select');
      throw error;
    }
  });

  it('selects the high contrast theme through onDraftChange', () => {
    const onDraftChange = vi.fn();
    renderModal({ onDraftChange });
    fireEvent.change(screen.getByLabelText('Theme'), { target: { value: 'contrast' } });
    try {
      expect(onDraftChange).toHaveBeenCalledWith({
        ...DEFAULT_SETTINGS,
        general: { ...DEFAULT_SETTINGS.general, theme: 'contrast' },
      });
    } catch (error) {
      console.log('theme contrast mismatch', onDraftChange.mock.calls);
      throw error;
    }
  });

  it('changes the text size select through onDraftChange', () => {
    const onDraftChange = vi.fn();
    renderModal({ onDraftChange });
    fireEvent.change(screen.getByLabelText('Text size'), { target: { value: '150' } });
    try {
      expect(onDraftChange).toHaveBeenCalledWith({
        ...DEFAULT_SETTINGS,
        general: { ...DEFAULT_SETTINGS.general, textScale: '150' },
      });
    } catch (error) {
      console.log('text scale mismatch', onDraftChange.mock.calls);
      throw error;
    }
  });

  it('maps a non-light theme selection back to dark', () => {
    const onDraftChange = vi.fn();
    renderModal({
      onDraftChange,
      draft: { ...DEFAULT_SETTINGS, general: { ...DEFAULT_SETTINGS.general, theme: 'light' } },
    });
    fireEvent.change(screen.getByLabelText('Theme'), { target: { value: 'dark' } });
    try {
      expect(onDraftChange).toHaveBeenCalledWith({
        ...DEFAULT_SETTINGS,
        general: { ...DEFAULT_SETTINGS.general, theme: 'dark' },
      });
    } catch (error) {
      console.log('theme dark mismatch', onDraftChange.mock.calls);
      throw error;
    }
  });

  it('edits the startup tone and editor checkboxes and the paste mode', () => {
    const onDraftChange = vi.fn();
    renderModal({ onDraftChange });
    fireEvent.click(screen.getByLabelText('Startup test tone'));
    try {
      expect(onDraftChange).toHaveBeenCalledWith({
        ...DEFAULT_SETTINGS,
        general: { ...DEFAULT_SETTINGS.general, startupTone: false },
      });
    } catch (error) {
      console.log('startup tone mismatch', onDraftChange.mock.calls);
      throw error;
    }
    cleanup();
    onDraftChange.mockClear();
    renderModal({ category: 'editor', onDraftChange });
    fireEvent.click(screen.getByLabelText('Restore editor cursor'));
    fireEvent.click(screen.getByLabelText('Restore open view'));
    fireEvent.change(screen.getByLabelText('Default paste mode'), {
      target: { value: 'overwriteAll' },
    });
    try {
      expect(onDraftChange).toHaveBeenCalledWith({
        ...DEFAULT_SETTINGS,
        editor: { ...DEFAULT_SETTINGS.editor, restoreCursor: false },
      });
      expect(onDraftChange).toHaveBeenCalledWith({
        ...DEFAULT_SETTINGS,
        editor: { ...DEFAULT_SETTINGS.editor, restoreView: false },
      });
      expect(onDraftChange).toHaveBeenCalledWith({
        ...DEFAULT_SETTINGS,
        editor: { ...DEFAULT_SETTINGS.editor, pasteTrackMode: 'overwriteAll' },
      });
    } catch (error) {
      console.log('editor edits mismatch', onDraftChange.mock.calls);
      throw error;
    }
  });

  it('leaves the reset confirmation through its own CANCEL button', () => {
    const onConfirmingResetChange = vi.fn();
    renderModal({ confirmingReset: true, onConfirmingResetChange });
    fireEvent.click(screen.getByRole('button', { name: 'CANCEL' }));
    try {
      expect(onConfirmingResetChange).toHaveBeenCalledWith(false);
    } catch (error) {
      console.log('confirm cancel mismatch', onConfirmingResetChange.mock.calls);
      throw error;
    }
  });

  it('reports focused element ids through onSessionFocus', () => {
    const onSessionFocus = vi.fn();
    const { container } = renderModal({ onSessionFocus });
    fireEvent.focusIn(screen.getByLabelText('Theme'));
    try {
      expect(onSessionFocus).toHaveBeenCalledWith('settings-theme');
    } catch (error) {
      console.log('focus id mismatch', onSessionFocus.mock.calls);
      throw error;
    }
    const dialog = container.querySelector('.modal-dialog') as HTMLElement;
    fireEvent.focusIn(dialog);
    try {
      expect(onSessionFocus).toHaveBeenCalledWith(null);
    } catch (error) {
      console.log('focus null mismatch', onSessionFocus.mock.calls);
      throw error;
    }
  });

  it('debounces pane scroll and clears pending timers on unmount', () => {
    vi.useFakeTimers();
    try {
      const onSessionPaneScroll = vi.fn();
      const { container, unmount } = renderModal({ onSessionPaneScroll });
      const pane = container.querySelector('#settings-pane') as HTMLElement;
      pane.scrollTop = 42;
      fireEvent.scroll(pane);
      pane.scrollTop = 84;
      fireEvent.scroll(pane);
      vi.advanceTimersByTime(150);
      try {
        expect(onSessionPaneScroll).toHaveBeenCalledTimes(1);
        expect(onSessionPaneScroll).toHaveBeenCalledWith(84);
      } catch (error) {
        console.log('scroll debounce mismatch', onSessionPaneScroll.mock.calls);
        throw error;
      }
      fireEvent.scroll(pane);
      unmount();
      vi.advanceTimersByTime(300);
      try {
        expect(onSessionPaneScroll).toHaveBeenCalledTimes(1);
      } catch (error) {
        console.log('unmount timer mismatch', onSessionPaneScroll.mock.calls);
        throw error;
      }
    } finally {
      vi.useRealTimers();
    }
  });

  it('clicks the hidden file input when LOAD is pressed', () => {
    const { container } = renderModal();
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    const clickSpy = vi.spyOn(input, 'click');
    fireEvent.click(screen.getByRole('button', { name: 'LOAD' }));
    try {
      expect(clickSpy).toHaveBeenCalledTimes(1);
    } catch (error) {
      console.log('load click mismatch', clickSpy.mock.calls.length);
      throw error;
    }
  });

  it('downloads the settings YAML when SAVE is pressed', () => {
    const createUrl = vi.fn(() => 'blob:settings-test');
    const revoke = vi.fn();
    const click = vi.fn();
    const originalCreate = URL.createObjectURL;
    const originalRevoke = URL.revokeObjectURL;
    const originalCreateElement = document.createElement.bind(document);
    URL.createObjectURL = createUrl;
    URL.revokeObjectURL = revoke;
    const createElementSpy = vi
      .spyOn(document, 'createElement')
      .mockImplementation((tag: string) => {
        const el = originalCreateElement(tag);
        if (tag === 'a') el.click = click;
        return el;
      });
    try {
      renderModal();
      fireEvent.click(screen.getByRole('button', { name: 'SAVE' }));
      try {
        expect(createUrl).toHaveBeenCalledTimes(1);
        expect(click).toHaveBeenCalledTimes(1);
        expect(revoke).toHaveBeenCalledWith('blob:settings-test');
      } catch (error) {
        console.log('save download mismatch', createUrl.mock.calls);
        throw error;
      }
    } finally {
      URL.createObjectURL = originalCreate;
      URL.revokeObjectURL = originalRevoke;
      createElementSpy.mockRestore();
    }
  });

  it('ignores a file change with no file selected', () => {
    const onLoadError = vi.fn();
    const { container } = renderModal({ onLoadError });
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(input, { target: { files: [] } });
    try {
      expect(onLoadError).not.toHaveBeenCalled();
    } catch (error) {
      console.log('empty change mismatch', onLoadError.mock.calls);
      throw error;
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
      expect(onLoadError).toHaveBeenCalledWith('Settings file exceeds the maximum import size.');
      expect(input.value).toBe('');
    } catch (error) {
      console.log('size error mismatch', onLoadError.mock.calls);
      throw error;
    }
  });

  it('applies a valid settings file through onDraftChange', async () => {
    const onDraftChange = vi.fn();
    const { container } = renderModal({ onDraftChange });
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    const yaml = buildSettingsYaml({
      ...DEFAULT_SETTINGS,
      general: { ...DEFAULT_SETTINGS.general, theme: 'light' },
    });
    const file = new File([yaml], 'settings.yaml', { type: 'text/yaml' });
    fireEvent.change(input, { target: { files: [file] } });
    try {
      await waitFor(() => expect(onDraftChange).toHaveBeenCalled());
      const applied = onDraftChange.mock.calls[0]?.[0] as SettingsValues;
      expect(applied.general.theme).toBe('light');
    } catch (error) {
      console.log('valid import mismatch', onDraftChange.mock.calls);
      throw error;
    }
  });

  it('reports the format error message for a malformed file', async () => {
    const onLoadError = vi.fn();
    const errorSpy = vi.spyOn(logger, 'error').mockImplementation(() => {});
    try {
      const { container } = renderModal({ onLoadError });
      const input = container.querySelector('input[type="file"]') as HTMLInputElement;
      const file = new File(['foo: bar\n'], 'bad.yaml', { type: 'text/yaml' });
      fireEvent.change(input, { target: { files: [file] } });
      try {
        await waitFor(() =>
          expect(onLoadError).toHaveBeenCalledWith(
            'Invalid settings file: missing "settings" root key.',
          ),
        );
      } catch (error) {
        console.log('format error mismatch', onLoadError.mock.calls);
        throw error;
      }
    } finally {
      errorSpy.mockRestore();
    }
  });

  it('reports a generic error when applying the draft fails', async () => {
    const onLoadError = vi.fn();
    const onDraftChange = vi.fn(() => {
      throw new Error('draft boom');
    });
    const errorSpy = vi.spyOn(logger, 'error').mockImplementation(() => {});
    try {
      const { container } = renderModal({ onDraftChange, onLoadError });
      const input = container.querySelector('input[type="file"]') as HTMLInputElement;
      const file = new File([buildSettingsYaml(DEFAULT_SETTINGS)], 'settings.yaml', {
        type: 'text/yaml',
      });
      fireEvent.change(input, { target: { files: [file] } });
      try {
        await waitFor(() =>
          expect(onLoadError).toHaveBeenCalledWith('Failed to load settings file: draft boom'),
        );
      } catch (error) {
        console.log('generic error mismatch', onLoadError.mock.calls);
        throw error;
      }
    } finally {
      errorSpy.mockRestore();
    }
  });

  it('reports a read failure from the file reader', () => {
    const onLoadError = vi.fn();
    class ErrorReader {
      error: Error | null = new Error('read boom');
      onload: ((event: unknown) => void) | null = null;
      onerror: (() => void) | null = null;
      readAsText() {
        this.onerror?.();
      }
    }
    vi.stubGlobal('FileReader', ErrorReader);
    try {
      const { container } = renderModal({ onLoadError });
      const input = container.querySelector('input[type="file"]') as HTMLInputElement;
      const file = new File(['x'], 'settings.yaml', { type: 'text/yaml' });
      fireEvent.change(input, { target: { files: [file] } });
      try {
        expect(onLoadError).toHaveBeenCalledWith('Failed to read settings file: read boom');
      } catch (error) {
        console.log('reader error mismatch', onLoadError.mock.calls);
        throw error;
      }
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it('reports an unknown read failure when the reader error is missing', () => {
    const onLoadError = vi.fn();
    class SilentErrorReader {
      error: Error | null = null;
      onload: ((event: unknown) => void) | null = null;
      onerror: (() => void) | null = null;
      readAsText() {
        this.onerror?.();
      }
    }
    vi.stubGlobal('FileReader', SilentErrorReader);
    try {
      const { container } = renderModal({ onLoadError });
      const input = container.querySelector('input[type="file"]') as HTMLInputElement;
      const file = new File(['x'], 'settings.yaml', { type: 'text/yaml' });
      fireEvent.change(input, { target: { files: [file] } });
      try {
        expect(onLoadError).toHaveBeenCalledWith('Failed to read settings file: Unknown error');
      } catch (error) {
        console.log('unknown reader error mismatch', onLoadError.mock.calls);
        throw error;
      }
    } finally {
      vi.unstubAllGlobals();
    }
  });
});

import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { SettingsModal } from '../../src/modals/SettingsModal.tsx';
import { DEFAULT_SETTINGS, type SettingsValues } from '../../src/types/settings.ts';

afterEach(() => cleanup());

const renderModal = (overrides: Partial<Parameters<typeof SettingsModal>[0]> = {}) =>
  render(
    <SettingsModal
      category="general"
      onCategoryChange={vi.fn()}
      draft={DEFAULT_SETTINGS}
      onDraftChange={vi.fn()}
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
      general: { theme: 'light', trackBackground: false, startupTone: false },
      editor: { restoreCursor: false, restoreView: false, pasteTrackMode: 'overwriteAll' },
    };
    const onDraftChange = vi.fn();
    renderModal({ draft, onDraftChange });
    fireEvent.click(screen.getByRole('button', { name: 'RESET' }));
    try {
      expect(screen.getByText('Reset all settings to their default values?')).toBeTruthy();
    } catch (error) {
      console.log('confirm state missing');
      throw error;
    }
    fireEvent.click(screen.getByRole('button', { name: 'RESET' }));
    expect(onDraftChange).toHaveBeenCalledWith(DEFAULT_SETTINGS);
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
});

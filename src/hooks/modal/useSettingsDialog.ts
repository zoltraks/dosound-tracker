import { useCallback, useEffect, useState } from 'react';
import type { SettingsCategory, SettingsValues } from '../../types/settings.ts';
import { normalizeSettings } from '../../utils/settings/settingsState.ts';
import { loadUiState, patchSettingsView, updateSettingsView } from '../../utils/storage/uiState.ts';

export interface UseSettingsDialogResult {
  settingsCategory: SettingsCategory;
  setSettingsCategory: (category: SettingsCategory) => void;
  settingsDraft: SettingsValues;
  setSettingsDraft: (draft: SettingsValues) => void;
  confirmingReset: boolean;
  setConfirmingReset: (confirming: boolean) => void;
  recordFocus: (elementId: string | null) => void;
  recordPaneScroll: (scrollTop: number) => void;
}

/**
 * Owns the settings modal's working state: the active category, the
 * uncommitted draft, and the reset-confirmation view. Seeds from the
 * persisted session snapshot when one exists (reload restore) and from the
 * committed settings otherwise, then replays the recorded view - pane
 * scroll and focused control - once the seeded render commits. Every
 * mutation patches the session snapshot directly, so focus and scroll
 * reporting never re-renders.
 */
export function useSettingsDialog(
  isOpen: boolean,
  committedSettings: SettingsValues,
): UseSettingsDialogResult {
  const [settingsCategory, setCategoryState] = useState<SettingsCategory>('general');
  const [settingsDraft, setDraftState] = useState<SettingsValues>(committedSettings);
  const [confirmingReset, setConfirmingState] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const session = loadUiState().settingsView;
    const category = session?.category ?? 'general';
    const draft = session ? normalizeSettings(session.draft) : committedSettings;
    const confirming = session?.confirmingReset ?? false;
    const focus = session?.focus ?? null;
    const paneScroll = session?.paneScroll ?? 0;
    /* eslint-disable react-hooks/set-state-in-effect */
    setCategoryState(category);
    setDraftState(draft);
    setConfirmingState(confirming);
    /* eslint-enable react-hooks/set-state-in-effect */
    updateSettingsView({ category, draft, confirmingReset: confirming, focus, paneScroll });
    const frame = requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        const pane = document.getElementById('settings-pane');
        if (pane && paneScroll > 0) {
          pane.scrollTop = paneScroll;
        }
        const target = focus ? document.getElementById(focus) : null;
        (target ?? document.querySelector<HTMLElement>('.modal-dialog.settings-modal'))?.focus();
      }),
    );
    return () => cancelAnimationFrame(frame);
  }, [isOpen, committedSettings]);

  const setSettingsCategory = useCallback((category: SettingsCategory) => {
    setCategoryState(category);
    patchSettingsView({ category });
  }, []);

  const setSettingsDraft = useCallback((draft: SettingsValues) => {
    setDraftState(draft);
    patchSettingsView({ draft });
  }, []);

  const setConfirmingReset = useCallback((confirming: boolean) => {
    setConfirmingState(confirming);
    patchSettingsView({ confirmingReset: confirming });
  }, []);

  const recordFocus = useCallback((elementId: string | null) => {
    patchSettingsView({ focus: elementId });
  }, []);

  const recordPaneScroll = useCallback((scrollTop: number) => {
    patchSettingsView({ paneScroll: scrollTop });
  }, []);

  return {
    settingsCategory,
    setSettingsCategory,
    settingsDraft,
    setSettingsDraft,
    confirmingReset,
    setConfirmingReset,
    recordFocus,
    recordPaneScroll,
  };
}

import { useEffect, useState } from 'react';
import type { SettingsCategory, SettingsValues } from '../../types/settings.ts';
import { normalizeSettings } from '../../utils/settings/settingsState.ts';
import { loadUiState, updateSettingsView } from '../../utils/storage/uiState.ts';

export interface UseSettingsDialogResult {
  settingsCategory: SettingsCategory;
  setSettingsCategory: (category: SettingsCategory) => void;
  settingsDraft: SettingsValues;
  setSettingsDraft: (draft: SettingsValues) => void;
}

/**
 * Owns the settings modal's working state: the active category and the
 * uncommitted draft. Seeds from the persisted session snapshot when one
 * exists (reload restore) and from the committed settings otherwise, then
 * mirrors every change back into `settingsView` while the modal is open.
 */
export function useSettingsDialog(
  isOpen: boolean,
  committedSettings: SettingsValues,
): UseSettingsDialogResult {
  const [settingsCategory, setSettingsCategory] = useState<SettingsCategory>('general');
  const [settingsDraft, setSettingsDraft] = useState<SettingsValues>(committedSettings);

  useEffect(() => {
    if (!isOpen) return;
    const session = loadUiState().settingsView;
    /* eslint-disable react-hooks/set-state-in-effect */
    if (session) {
      setSettingsCategory(session.category);
      setSettingsDraft(normalizeSettings(session.draft));
    } else {
      setSettingsCategory('general');
      setSettingsDraft(committedSettings);
    }
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [isOpen, committedSettings]);

  useEffect(() => {
    if (!isOpen) return;
    updateSettingsView({ category: settingsCategory, draft: settingsDraft });
  }, [isOpen, settingsCategory, settingsDraft]);

  return {
    settingsCategory,
    setSettingsCategory,
    settingsDraft,
    setSettingsDraft,
  };
}

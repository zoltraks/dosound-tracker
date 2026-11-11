import { useMemo } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import type { SoundEngineId } from '../../constants/sound.ts';
import { DEFAULT_SETTINGS } from '../../types/settings.ts';
import type { SettingsValues, TextScale, ThemeVariant } from '../../types/settings.ts';
import type { TrackPasteMode } from '../../utils/track/trackClipboard.ts';
import { loadSettings, writeSettingKeys } from '../../utils/settings/settingsState.ts';
import { updateSettingsView } from '../../utils/storage/uiState.ts';
import { useSettingsDialog } from './useSettingsDialog.ts';
import type { UseSettingsDialogResult } from './useSettingsDialog.ts';

export interface UseSettingsSessionParams {
  isSettingsOpen: boolean;
  setIsSettingsOpen: (open: boolean) => void;
  theme: ThemeVariant;
  setTheme: Dispatch<SetStateAction<ThemeVariant>>;
  textScale: TextScale;
  setTextScale: Dispatch<SetStateAction<TextScale>>;
  trackBackgroundEnabled: boolean;
  setTrackBackgroundEnabled: Dispatch<SetStateAction<boolean>>;
  pasteTrackMode: TrackPasteMode;
  setPasteTrackMode: (mode: TrackPasteMode) => void;
  soundEngineId: SoundEngineId;
  setSoundEngineId: Dispatch<SetStateAction<SoundEngineId>>;
}

export interface UseSettingsSessionResult extends UseSettingsDialogResult {
  handleCommitSettings: () => void;
  handleCancelSettings: () => void;
}

/**
 * Owns the settings session at the composition root: reloads the committed
 * settings whenever a watched value or the open flag changes, delegates the
 * dialog working state to `useSettingsDialog`, and carries the commit and
 * cancel handlers that write the draft back to the per-key storage and close
 * the modal.
 */
export function useSettingsSession({
  isSettingsOpen,
  setIsSettingsOpen,
  theme,
  setTheme,
  textScale,
  setTextScale,
  trackBackgroundEnabled,
  setTrackBackgroundEnabled,
  pasteTrackMode,
  setPasteTrackMode,
  soundEngineId,
  setSoundEngineId,
}: UseSettingsSessionParams): UseSettingsSessionResult {
  const committedSettings = useMemo(
    () => loadSettings(),
    // The dependency list is the refresh trigger set, not the read set -
    // loadSettings re-reads storage whenever a committed value or the open
    // flag changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [theme, textScale, trackBackgroundEnabled, pasteTrackMode, soundEngineId, isSettingsOpen],
  );

  const {
    settingsCategory,
    setSettingsCategory,
    settingsDraft,
    setSettingsDraft,
    confirmingReset,
    setConfirmingReset,
    recordFocus,
    recordPaneScroll,
  } = useSettingsDialog(isSettingsOpen, committedSettings);

  const closeSettingsSession = (draft: SettingsValues) =>
    updateSettingsView({
      category: settingsCategory,
      draft,
      confirmingReset: false,
      focus: null,
      paneScroll: 0,
    });

  const handleCommitSettings = () => {
    if (confirmingReset) {
      setSettingsDraft(DEFAULT_SETTINGS);
      setConfirmingReset(false);
      return;
    }
    const next = settingsDraft;
    setTheme(next.general.theme);
    setTextScale(next.general.textScale);
    setTrackBackgroundEnabled(next.general.trackBackground);
    writeSettingKeys(next);
    setPasteTrackMode(next.editor.pasteTrackMode);
    setSoundEngineId(next.sound.engine);
    closeSettingsSession(next);
    setIsSettingsOpen(false);
  };

  const handleCancelSettings = () => {
    if (confirmingReset) {
      setConfirmingReset(false);
      return;
    }
    closeSettingsSession(committedSettings);
    setIsSettingsOpen(false);
  };

  return {
    settingsCategory,
    setSettingsCategory,
    settingsDraft,
    setSettingsDraft,
    confirmingReset,
    setConfirmingReset,
    recordFocus,
    recordPaneScroll,
    handleCommitSettings,
    handleCancelSettings,
  };
}

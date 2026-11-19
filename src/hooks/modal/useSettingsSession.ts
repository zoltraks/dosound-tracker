import { useEffect, useMemo } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import type { SoundEngineId } from '../../constants/sound.ts';
import { DEFAULT_SETTINGS } from '../../types/settings.ts';
import type { SettingsValues, TextScale, ThemeVariant } from '../../types/settings.ts';
import type { TrackPasteMode } from '../../utils/track/trackClipboard.ts';
import { loadSettings, writeSettingKeys } from '../../utils/settings/settingsState.ts';
import { patchSettingsView, updateSettingsView } from '../../utils/storage/uiState.ts';
import { useSettingsDialog } from './useSettingsDialog.ts';
import type { UseSettingsDialogResult } from './useSettingsDialog.ts';

export interface SettingsSoundPreview {
  mono: boolean;
  crosstalk: number;
}

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
  confirmPaste: boolean;
  setConfirmPaste: (confirm: boolean) => void;
  soundEngineId: SoundEngineId;
  setSoundEngineId: Dispatch<SetStateAction<SoundEngineId>>;
  monoEnabled: boolean;
  setMonoEnabled: Dispatch<SetStateAction<boolean>>;
  crosstalk: number;
  setCrosstalk: Dispatch<SetStateAction<number>>;
  visibleTracks: 3 | 6;
  setVisibleTracks: Dispatch<SetStateAction<3 | 6>>;
  onSoundPreviewChange: (preview: SettingsSoundPreview | null) => void;
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
  confirmPaste,
  setConfirmPaste,
  soundEngineId,
  setSoundEngineId,
  monoEnabled,
  setMonoEnabled,
  crosstalk,
  setCrosstalk,
  visibleTracks,
  setVisibleTracks,
  onSoundPreviewChange,
}: UseSettingsSessionParams): UseSettingsSessionResult {
  const committedSettings = useMemo(
    () => loadSettings(),
    // The dependency list is the refresh trigger set, not the read set -
    // loadSettings re-reads storage whenever a committed value or the open
    // flag changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      theme,
      textScale,
      trackBackgroundEnabled,
      pasteTrackMode,
      confirmPaste,
      soundEngineId,
      monoEnabled,
      crosstalk,
      visibleTracks,
      isSettingsOpen,
    ],
  );

  // While the modal is closed, keep the persisted session draft aligned with
  // the committed settings so values changed by other actions - the track
  // background toggle, the theme button, the paste-track dialog - are what
  // the next open restores. committedSettings is the refresh trigger; the
  // draft re-reads storage inside the effect because the per-key writes it
  // depends on flush in earlier persistence effects.
  useEffect(() => {
    if (isSettingsOpen) {
      return;
    }
    patchSettingsView({ draft: loadSettings() });
  }, [isSettingsOpen, committedSettings]);

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

  // The sound controls audition live: while the modal is open the draft's
  // mono and crosstalk values feed the audio pipeline as they move, so
  // playback reflects the settings before commit. The closed draft is
  // stale session state and never reaches the pipeline; closing restores
  // the committed values through the gated preview.
  useEffect(() => {
    onSoundPreviewChange(
      isSettingsOpen
        ? {
            mono: settingsDraft.sound.mono,
            crosstalk: settingsDraft.sound.crosstalk,
          }
        : null,
    );
  }, [isSettingsOpen, settingsDraft, onSoundPreviewChange]);

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
    setConfirmPaste(next.editor.confirmPaste);
    setSoundEngineId(next.sound.engine);
    setMonoEnabled(next.sound.mono);
    setCrosstalk(next.sound.crosstalk);
    setVisibleTracks(next.general.visibleTracks);
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

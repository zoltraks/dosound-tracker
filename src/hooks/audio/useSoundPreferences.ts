import { useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import type { SoundEngineId } from '../../constants/sound.ts';
import type { SettingsSoundPreview } from '../../types/settings.ts';
import { loadSettings } from '../../utils/settings/settingsState.ts';

export interface UseSoundPreferencesParams {
  isSettingsOpen: boolean;
}

export interface UseSoundPreferencesResult {
  soundEngineId: SoundEngineId;
  setSoundEngineId: Dispatch<SetStateAction<SoundEngineId>>;
  monoEnabled: boolean;
  setMonoEnabled: Dispatch<SetStateAction<boolean>>;
  crosstalk: number;
  setCrosstalk: Dispatch<SetStateAction<number>>;
  setSettingsSoundPreview: Dispatch<SetStateAction<SettingsSoundPreview | null>>;
  effectiveMono: boolean;
  effectiveCrosstalk: number;
}

// Sound preferences owned at the composition root: the committed engine,
// mono, and crosstalk values plus the settings-draft preview that resolves
// into the effective pair while the modal is open. One loadSettings() parse
// feeds all three initializers; the draft preview never reaches the audio
// path while the modal is closed.
export function useSoundPreferences({
  isSettingsOpen,
}: UseSoundPreferencesParams): UseSoundPreferencesResult {
  const [storedSettings] = useState(loadSettings);
  const [soundEngineId, setSoundEngineId] = useState<SoundEngineId>(storedSettings.sound.engine);
  const [monoEnabled, setMonoEnabled] = useState<boolean>(storedSettings.sound.mono);
  const [crosstalk, setCrosstalk] = useState<number>(storedSettings.sound.crosstalk);
  const [settingsSoundPreview, setSettingsSoundPreview] = useState<SettingsSoundPreview | null>(
    null,
  );

  // While the settings modal is open its draft sound values preview live:
  // mono and crosstalk drive the audio path before commit, and closing
  // restores the committed settings.
  const liveSoundSettings = isSettingsOpen ? settingsSoundPreview : null;
  const effectiveMono = liveSoundSettings?.mono ?? monoEnabled;
  const effectiveCrosstalk = liveSoundSettings?.crosstalk ?? crosstalk;

  return {
    soundEngineId,
    setSoundEngineId,
    monoEnabled,
    setMonoEnabled,
    crosstalk,
    setCrosstalk,
    setSettingsSoundPreview,
    effectiveMono,
    effectiveCrosstalk,
  };
}

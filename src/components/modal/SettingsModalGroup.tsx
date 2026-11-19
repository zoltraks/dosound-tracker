import React from 'react';
import type { SettingsCategory, SettingsValues } from '../../types/settings.ts';
import type { SongStereo } from '../../synth/SoundDriver.ts';

const SettingsModal = React.lazy(async () => {
  const { SettingsModal } = await import('../../modals/settings/SettingsModal.tsx');
  return { default: SettingsModal };
});

export interface SettingsModalGroupParams {
  settingsCategory: SettingsCategory;
  settingsDraft: SettingsValues;
  settingsConfirmingReset: boolean;
  onSettingsCategoryChange: (category: SettingsCategory) => void;
  onSettingsDraftChange: (draft: SettingsValues) => void;
  onSettingsConfirmingResetChange: (confirming: boolean) => void;
  onSettingsSessionFocus: (elementId: string | null) => void;
  onSettingsPaneScroll: (scrollTop: number) => void;
  onCommitSettings: () => void;
  onCancelSettings: () => void;
  onSettingsLoadError: (message: string) => void;
  songStereo: SongStereo | undefined;
  songTwoChip: boolean;
  secondChipVisible: boolean;
  onSongStereoChange: (stereo: SongStereo | undefined) => void;
  onSongTwoChipChange: (on: boolean) => void;
}

export interface SettingsModalGroupProps extends SettingsModalGroupParams {
  isSettingsOpen: boolean;
}

export function SettingsModalGroup({
  isSettingsOpen,
  settingsCategory,
  settingsDraft,
  settingsConfirmingReset,
  onSettingsCategoryChange,
  onSettingsDraftChange,
  onSettingsConfirmingResetChange,
  onSettingsSessionFocus,
  onSettingsPaneScroll,
  onCommitSettings,
  onCancelSettings,
  onSettingsLoadError,
  songStereo,
  songTwoChip,
  secondChipVisible,
  onSongStereoChange,
  onSongTwoChipChange,
}: SettingsModalGroupProps) {
  if (!isSettingsOpen) {
    return null;
  }

  return (
    <React.Suspense fallback={null}>
      <SettingsModal
        category={settingsCategory}
        onCategoryChange={onSettingsCategoryChange}
        draft={settingsDraft}
        onDraftChange={onSettingsDraftChange}
        confirmingReset={settingsConfirmingReset}
        onConfirmingResetChange={onSettingsConfirmingResetChange}
        onSessionFocus={onSettingsSessionFocus}
        onSessionPaneScroll={onSettingsPaneScroll}
        onCommit={onCommitSettings}
        onCancel={onCancelSettings}
        onLoadError={onSettingsLoadError}
        songStereo={songStereo}
        songTwoChip={songTwoChip}
        secondChipVisible={secondChipVisible}
        onSongStereoChange={onSongStereoChange}
        onSongTwoChipChange={onSongTwoChipChange}
      />
    </React.Suspense>
  );
}

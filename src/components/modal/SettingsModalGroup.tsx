import React from 'react';
import type { SettingsCategory, SettingsValues } from '../../types/settings.ts';

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
      />
    </React.Suspense>
  );
}

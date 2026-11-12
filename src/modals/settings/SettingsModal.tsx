import React, { useEffect, useRef } from 'react';
import { DialogFrame } from '../../components/modal/DialogFrame.tsx';
import { logger } from '../../utils/log/logger.ts';
import {
  SETTINGS_CATEGORIES,
  DEFAULT_SETTINGS,
  type SettingsCategory,
  type SettingsValues,
  type TextScale,
  type ThemeVariant,
} from '../../types/settings.ts';
import type { TrackPasteMode } from '../../utils/track/trackClipboard.ts';
import {
  SOUND_ENGINE_IDS,
  SOUND_ENGINE_LABELS,
  type SoundEngineId,
} from '../../constants/sound.ts';
import {
  buildSettingsYaml,
  parseSettingsFromYaml,
  SettingsFormatError,
} from '../../utils/settings/settingsYaml.ts';
import { MAX_IMPORT_BYTES } from '../../constants/import.ts';
import { downloadFile } from '../../utils/file/fileOperations.ts';

interface SettingsModalProps {
  category: SettingsCategory;
  onCategoryChange: (category: SettingsCategory) => void;
  draft: SettingsValues;
  onDraftChange: (draft: SettingsValues) => void;
  confirmingReset: boolean;
  onConfirmingResetChange: (confirming: boolean) => void;
  onSessionFocus: (elementId: string | null) => void;
  onSessionPaneScroll: (scrollTop: number) => void;
  onCommit: () => void;
  onCancel: () => void;
  onLoadError?: (message: string) => void;
}

const CATEGORY_LABELS: Record<SettingsCategory, string> = {
  general: 'GENERAL',
  editor: 'EDITOR',
  sound: 'SOUND',
};

const PASTE_MODE_OPTIONS: { value: TrackPasteMode; label: string }[] = [
  { value: 'replace', label: 'Replace track data entirely' },
  { value: 'overwriteAll', label: 'Overwrite all steps' },
  { value: 'overwriteEmpty', label: 'Overwrite only empty steps' },
];

const THEME_OPTIONS: { value: ThemeVariant; label: string }[] = [
  { value: 'dark', label: 'Dark' },
  { value: 'light', label: 'Light' },
  { value: 'contrast', label: 'High Contrast' },
];

const TEXT_SCALE_OPTIONS: { value: TextScale; label: string }[] = [
  { value: '100', label: 'Standard (100%)' },
  { value: '125', label: 'Large (125%)' },
  { value: '150', label: 'Extra large (150%)' },
];

export const SettingsModal: React.FC<SettingsModalProps> = ({
  category,
  onCategoryChange,
  draft,
  onDraftChange,
  confirmingReset,
  onConfirmingResetChange,
  onSessionFocus,
  onSessionPaneScroll,
  onCommit,
  onCancel,
  onLoadError,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const scrollTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (scrollTimer.current) {
        clearTimeout(scrollTimer.current);
      }
    },
    [],
  );

  const handleDialogFocus: React.FocusEventHandler<HTMLDivElement> = (event) => {
    onSessionFocus((event.target as HTMLElement).id || null);
  };

  const handlePaneScroll = (event: React.UIEvent<HTMLDivElement>) => {
    const pane = event.currentTarget;
    if (scrollTimer.current) {
      clearTimeout(scrollTimer.current);
    }
    scrollTimer.current = setTimeout(() => {
      onSessionPaneScroll(pane.scrollTop);
    }, 150);
  };

  const handleSave = () => {
    try {
      downloadFile(buildSettingsYaml(draft), 'settings.yaml', 'text/yaml');
    } catch (error) {
      logger.error('Failed to export settings', error);
    }
  };

  const handleLoadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange: React.ChangeEventHandler<HTMLInputElement> = (event) => {
    const input = event.target;
    const file = input.files && input.files[0];
    if (!file) {
      return;
    }

    if (file.size > MAX_IMPORT_BYTES) {
      if (onLoadError) {
        onLoadError('Settings file exceeds the maximum import size.');
      }
      input.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = (e.target?.result ?? '') as string;
        onDraftChange(parseSettingsFromYaml(text, draft));
      } catch (error) {
        if (error instanceof SettingsFormatError) {
          logger.error(error.message);
          if (onLoadError) {
            onLoadError(error.message);
          }
        } else {
          logger.error('Failed to load settings file', error);
          if (onLoadError) {
            const message = error instanceof Error ? error.message : String(error);
            onLoadError(`Failed to load settings file: ${message}`);
          }
        }
      } finally {
        input.value = '';
      }
    };
    reader.onerror = () => {
      const error = reader.error;
      if (onLoadError) {
        const message = error instanceof Error ? error.message : String(error ?? 'Unknown error');
        onLoadError(`Failed to read settings file: ${message}`);
      }
    };
    reader.readAsText(file);
  };

  const handleResetConfirm = () => {
    onDraftChange(DEFAULT_SETTINGS);
    onConfirmingResetChange(false);
  };

  return (
    <DialogFrame label="Settings" className="settings-modal" onFocus={handleDialogFocus}>
      <div className="modal-title">SETTINGS</div>
      <div className="modal-body settings-modal-body">
        {confirmingReset ? (
          <div className="settings-confirm">
            <div>Reset all settings to their default values?</div>
            <div>This action cannot be undone.</div>
          </div>
        ) : (
          <div className="settings-layout">
            <div className="settings-categories">
              {SETTINGS_CATEGORIES.map((id) => (
                <button
                  key={id}
                  id={`settings-category-${id}`}
                  type="button"
                  className={`settings-category-button ${category === id ? 'active' : ''}`}
                  onClick={() => onCategoryChange(id)}
                >
                  {CATEGORY_LABELS[id]}
                </button>
              ))}
            </div>

            <div id="settings-pane" className="settings-pane" onScroll={handlePaneScroll}>
              {category === 'general' && (
                <>
                  <div className="settings-row">
                    <label htmlFor="settings-theme" className="settings-label">
                      Theme
                    </label>
                    <select
                      id="settings-theme"
                      value={draft.general.theme}
                      onChange={(e) =>
                        onDraftChange({
                          ...draft,
                          general: {
                            ...draft.general,
                            theme: e.target.value as ThemeVariant,
                          },
                        })
                      }
                    >
                      {THEME_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="settings-row">
                    <label htmlFor="settings-text-scale" className="settings-label">
                      Text size
                    </label>
                    <select
                      id="settings-text-scale"
                      value={draft.general.textScale}
                      onChange={(e) =>
                        onDraftChange({
                          ...draft,
                          general: {
                            ...draft.general,
                            textScale: e.target.value as TextScale,
                          },
                        })
                      }
                    >
                      {TEXT_SCALE_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="settings-row">
                    <label htmlFor="settings-track-background" className="settings-label">
                      Track background
                    </label>
                    <input
                      id="settings-track-background"
                      type="checkbox"
                      checked={draft.general.trackBackground}
                      onChange={(e) =>
                        onDraftChange({
                          ...draft,
                          general: { ...draft.general, trackBackground: e.target.checked },
                        })
                      }
                    />
                  </div>
                  <div className="settings-row">
                    <label htmlFor="settings-startup-tone" className="settings-label">
                      Startup test tone
                    </label>
                    <input
                      id="settings-startup-tone"
                      type="checkbox"
                      checked={draft.general.startupTone}
                      onChange={(e) =>
                        onDraftChange({
                          ...draft,
                          general: { ...draft.general, startupTone: e.target.checked },
                        })
                      }
                    />
                  </div>
                </>
              )}

              {category === 'editor' && (
                <>
                  <div className="settings-row">
                    <label htmlFor="settings-restore-cursor" className="settings-label">
                      Restore editor cursor
                    </label>
                    <input
                      id="settings-restore-cursor"
                      type="checkbox"
                      checked={draft.editor.restoreCursor}
                      onChange={(e) =>
                        onDraftChange({
                          ...draft,
                          editor: { ...draft.editor, restoreCursor: e.target.checked },
                        })
                      }
                    />
                  </div>
                  <div className="settings-row">
                    <label htmlFor="settings-restore-view" className="settings-label">
                      Restore open view
                    </label>
                    <input
                      id="settings-restore-view"
                      type="checkbox"
                      checked={draft.editor.restoreView}
                      onChange={(e) =>
                        onDraftChange({
                          ...draft,
                          editor: { ...draft.editor, restoreView: e.target.checked },
                        })
                      }
                    />
                  </div>
                  <div className="settings-row">
                    <label htmlFor="settings-paste-mode" className="settings-label">
                      Default paste mode
                    </label>
                    <select
                      id="settings-paste-mode"
                      value={draft.editor.pasteTrackMode}
                      onChange={(e) =>
                        onDraftChange({
                          ...draft,
                          editor: {
                            ...draft.editor,
                            pasteTrackMode: e.target.value as TrackPasteMode,
                          },
                        })
                      }
                    >
                      {PASTE_MODE_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="settings-row">
                    <label htmlFor="settings-confirm-paste" className="settings-label">
                      Confirm paste overwrite
                    </label>
                    <input
                      id="settings-confirm-paste"
                      type="checkbox"
                      checked={draft.editor.confirmPaste}
                      onChange={(e) =>
                        onDraftChange({
                          ...draft,
                          editor: { ...draft.editor, confirmPaste: e.target.checked },
                        })
                      }
                    />
                  </div>
                </>
              )}

              {category === 'sound' && (
                <div className="settings-row">
                  <label htmlFor="settings-sound-engine" className="settings-label">
                    Sound engine
                  </label>
                  <select
                    id="settings-sound-engine"
                    value={draft.sound.engine}
                    onChange={(e) =>
                      onDraftChange({
                        ...draft,
                        sound: { ...draft.sound, engine: e.target.value as SoundEngineId },
                      })
                    }
                  >
                    {SOUND_ENGINE_IDS.map((engineId) => (
                      <option key={engineId} value={engineId}>
                        {SOUND_ENGINE_LABELS[engineId]}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="modal-actions settings-actions">
        {confirmingReset ? (
          <>
            <div className="settings-actions-left">
              <button
                id="settings-confirm-cancel"
                className="command-button"
                type="button"
                onClick={() => onConfirmingResetChange(false)}
              >
                CANCEL
              </button>
            </div>
            <div className="settings-actions-right">
              <button
                id="settings-confirm-reset"
                className="command-button"
                type="button"
                onClick={handleResetConfirm}
              >
                RESET
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="settings-actions-left">
              <button
                id="settings-action-cancel"
                className="command-button"
                type="button"
                onClick={onCancel}
              >
                CANCEL
              </button>
              <button
                id="settings-action-reset"
                className="command-button"
                type="button"
                onClick={() => onConfirmingResetChange(true)}
              >
                RESET
              </button>
            </div>
            <div className="settings-actions-right">
              <button
                id="settings-action-load"
                className="command-button"
                type="button"
                onClick={handleLoadClick}
              >
                LOAD
              </button>
              <button
                id="settings-action-save"
                className="command-button"
                type="button"
                onClick={handleSave}
              >
                SAVE
              </button>
              <button
                id="settings-action-ok"
                className="command-button"
                type="button"
                onClick={onCommit}
              >
                OK
              </button>
            </div>
          </>
        )}
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept=".yaml,.yml,text/yaml,text/x-yaml"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />
    </DialogFrame>
  );
};

import React, { useRef, useState } from 'react';
import { DialogFrame } from '../components/DialogFrame.tsx';
import { logger } from '../utils/log/logger.ts';
import {
  SETTINGS_CATEGORIES,
  DEFAULT_SETTINGS,
  type SettingsCategory,
  type SettingsValues,
} from '../types/settings.ts';
import type { TrackPasteMode } from '../utils/track/trackClipboard.ts';
import {
  buildSettingsYaml,
  parseSettingsFromYaml,
  SettingsFormatError,
} from '../utils/settings/settingsYaml.ts';
import { MAX_IMPORT_BYTES } from '../constants/import.ts';
import { downloadFile } from '../utils/file/fileOperations.ts';

interface SettingsModalProps {
  category: SettingsCategory;
  onCategoryChange: (category: SettingsCategory) => void;
  draft: SettingsValues;
  onDraftChange: (draft: SettingsValues) => void;
  onCommit: () => void;
  onCancel: () => void;
  onLoadError?: (message: string) => void;
}

const CATEGORY_LABELS: Record<SettingsCategory, string> = {
  general: 'GENERAL',
  editor: 'EDITOR',
};

const PASTE_MODE_OPTIONS: { value: TrackPasteMode; label: string }[] = [
  { value: 'replace', label: 'Replace track data entirely' },
  { value: 'overwriteAll', label: 'Overwrite all steps' },
  { value: 'overwriteEmpty', label: 'Overwrite only empty steps' },
];

export const SettingsModal: React.FC<SettingsModalProps> = ({
  category,
  onCategoryChange,
  draft,
  onDraftChange,
  onCommit,
  onCancel,
  onLoadError,
}) => {
  const [confirmingReset, setConfirmingReset] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

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
    setConfirmingReset(false);
  };

  return (
    <DialogFrame label="Settings" className="settings-modal">
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
                  type="button"
                  className={`settings-category-btn ${category === id ? 'active' : ''}`}
                  onClick={() => onCategoryChange(id)}
                >
                  {CATEGORY_LABELS[id]}
                </button>
              ))}
            </div>

            <div className="settings-pane">
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
                            theme: e.target.value === 'light' ? 'light' : 'dark',
                          },
                        })
                      }
                    >
                      <option value="dark">Dark</option>
                      <option value="light">Light</option>
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
                </>
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
                className="command-btn"
                type="button"
                onClick={() => setConfirmingReset(false)}
              >
                CANCEL
              </button>
            </div>
            <div className="settings-actions-right">
              <button className="command-btn" type="button" onClick={handleResetConfirm}>
                RESET
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="settings-actions-left">
              <button className="command-btn" type="button" onClick={onCancel}>
                CANCEL
              </button>
              <button
                className="command-btn"
                type="button"
                onClick={() => setConfirmingReset(true)}
              >
                RESET
              </button>
            </div>
            <div className="settings-actions-right">
              <button className="command-btn" type="button" onClick={handleLoadClick}>
                LOAD
              </button>
              <button className="command-btn" type="button" onClick={handleSave}>
                SAVE
              </button>
              <button className="command-btn" type="button" onClick={onCommit}>
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

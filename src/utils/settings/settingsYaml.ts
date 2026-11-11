import yaml from 'js-yaml';
import type { SettingsValues } from '../../types/settings.ts';
import { assertImportSize } from '../validation/importSize.ts';
import { YAML_DUMP_OPTIONS } from '../yaml/yamlUtils.ts';
import { normalizeSettings } from './settingsState.ts';

export class SettingsFormatError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SettingsFormatError';
  }
}

export const buildSettingsYaml = (settings: SettingsValues): string => {
  const exportData = {
    settings: {
      version: 1,
      general: {
        theme: settings.general.theme,
        textScale: settings.general.textScale,
        trackBackground: settings.general.trackBackground,
        startupTone: settings.general.startupTone,
      },
      editor: {
        restoreCursor: settings.editor.restoreCursor,
        restoreView: settings.editor.restoreView,
        pasteTrackMode: settings.editor.pasteTrackMode,
      },
      sound: {
        engine: settings.sound.engine,
      },
    },
  };

  return yaml.dump(exportData, YAML_DUMP_OPTIONS);
};

export const parseSettingsFromYaml = (text: string, fallback: SettingsValues): SettingsValues => {
  assertImportSize(text, 'Settings file');

  let parsed: unknown;
  try {
    parsed = yaml.load(text);
  } catch (error) {
    throw new SettingsFormatError(
      `Invalid settings file: ${error instanceof Error ? error.message : String(error)}`,
    );
  }

  if (
    !parsed ||
    typeof parsed !== 'object' ||
    !('settings' in (parsed as Record<string, unknown>))
  ) {
    throw new SettingsFormatError('Invalid settings file: missing "settings" root key.');
  }

  const node = (parsed as { settings?: unknown }).settings;
  if (!node || typeof node !== 'object') {
    throw new SettingsFormatError('Invalid settings file: "settings" section is not an object.');
  }

  const version = (node as { version?: unknown }).version;
  if (version !== 1) {
    throw new SettingsFormatError(
      `Invalid settings file: unsupported version "${String(version)}".`,
    );
  }

  return normalizeSettings(node, fallback);
};

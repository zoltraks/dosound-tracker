import { describe, it, expect } from 'vitest';
import {
  buildSettingsYaml,
  parseSettingsFromYaml,
  SettingsFormatError,
} from '../../../src/utils/settings/settingsYaml.ts';
import { DEFAULT_SETTINGS } from '../../../src/types/settings.ts';

describe('settingsYaml', () => {
  it('round-trips all settings values', () => {
    const settings = {
      general: {
        theme: 'contrast' as const,
        textScale: '150' as const,
        trackBackground: false,
        startupTone: false,
      },
      editor: {
        restoreCursor: false,
        restoreView: true,
        pasteTrackMode: 'overwriteAll' as const,
        confirmPaste: true,
      },
      sound: { engine: 'ayumi' as const },
    };
    const parsed = parseSettingsFromYaml(buildSettingsYaml(settings), DEFAULT_SETTINGS);
    try {
      expect(parsed).toEqual(settings);
    } catch (error) {
      console.log('parsed:', parsed);
      throw error;
    }
  });

  it('emits the settings root with version and both maps', () => {
    const text = buildSettingsYaml(DEFAULT_SETTINGS);
    try {
      expect(text).toContain('settings:');
      expect(text).toContain('version: 1');
      expect(text).toContain('general:');
      expect(text).toContain('editor:');
      expect(text).toContain('pasteTrackMode: replace');
      expect(text).toContain('sound:');
      expect(text).toContain('engine: internal');
    } catch (error) {
      console.log('yaml text:', text);
      throw error;
    }
  });

  it('throws SettingsFormatError on non-YAML input', () => {
    expect(() => parseSettingsFromYaml(':::{{{', DEFAULT_SETTINGS)).toThrow(SettingsFormatError);
  });

  it('throws SettingsFormatError on a missing settings root', () => {
    expect(() => parseSettingsFromYaml('song: {}', DEFAULT_SETTINGS)).toThrow(SettingsFormatError);
    expect(() => parseSettingsFromYaml('42', DEFAULT_SETTINGS)).toThrow(SettingsFormatError);
  });

  it('throws SettingsFormatError on a non-object settings node', () => {
    expect(() => parseSettingsFromYaml('settings: 7', DEFAULT_SETTINGS)).toThrow(
      SettingsFormatError,
    );
  });

  it('throws SettingsFormatError on an unsupported version', () => {
    expect(() => parseSettingsFromYaml('settings:\n  version: 2', DEFAULT_SETTINGS)).toThrow(
      SettingsFormatError,
    );
  });

  it('keeps fallback members for missing fields and normalizes unknown ones', () => {
    const fallback = {
      general: {
        theme: 'light' as const,
        textScale: '125' as const,
        trackBackground: false,
        startupTone: true,
      },
      editor: {
        restoreCursor: false,
        restoreView: true,
        pasteTrackMode: 'overwriteEmpty' as const,
        confirmPaste: true,
      },
      sound: { engine: 'ayumi' as const },
    };
    const parsed = parseSettingsFromYaml(
      'settings:\n  version: 1\n  general:\n    theme: dark\n',
      fallback,
    );
    try {
      expect(parsed).toEqual({
        general: { theme: 'dark', textScale: '125', trackBackground: false, startupTone: true },
        editor: fallback.editor,
        sound: fallback.sound,
      });
    } catch (error) {
      console.log('parsed with fallback:', parsed);
      throw error;
    }
  });
});

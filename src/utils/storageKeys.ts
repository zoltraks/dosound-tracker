/**
 * Centralized localStorage key definitions for the DOSOUND Tracker application.
 * This class consolidates all localStorage key usage to ensure consistency
 * and make it easier to manage key names across the application.
 */
export class StorageKeys {
  // Debug and development settings
  static readonly DEBUG_MODE = 'dosound-tracker-debug-mode' as const;

  // Export settings
  static readonly EXPORT_TYPE = 'dosound-tracker-export-type' as const;
  static readonly DUMP_MODE = 'dosound-tracker-dump-mode' as const;

  // UI preferences
  static readonly THEME = 'dosound-tracker-theme' as const;
  static readonly TRANSPOSE_SETTINGS = 'dosound-tracker-transpose-settings' as const;
  static readonly EDITOR_CURSOR = 'dosound-tracker-editor-cursor' as const;
  static readonly CURRENT_INSTRUMENT = 'dosound-tracker-current-instrument' as const;
  static readonly SONG_INFO_FIELD = 'dosound-tracker-song-info-field' as const;
  static readonly PLAYLIST_TRACK = 'dosound-tracker-playlist-track' as const;
  static readonly OCTAVE = 'dosound-tracker-octave' as const;
  static readonly ENVELOPE_CURSOR_PREFIX = 'dosound-tracker-envelope-cursor-' as const;
  static readonly INSTRUMENT_OCTAVES = 'dosound-tracker-instrument-octaves' as const;
  static readonly PASTE_TRACK_MODE = 'dosound-tracker-paste-track-mode' as const;
  static readonly TRACK_BACKGROUND_ENABLED = 'dosound-tracker-track-background-enabled' as const;
  static readonly EQ_MUTES = 'dosound-tracker-eq-mutes' as const;
  static readonly COMMAND_PANEL_MOBILE = 'dosound-tracker-command-panel-mobile' as const;
  static readonly DEBUG_INFO_SHOWN = 'dosound-tracker-debug-info-shown' as const;
  static readonly IGNORE_INST_TYPE_WARNING = 'dosound-tracker-ignore-inst-type-warning' as const;

  // Data persistence
  static readonly SONG = 'dosound-tracker-song' as const;
  static readonly INSTRUMENT = 'dosound-tracker-instrument' as const;
}

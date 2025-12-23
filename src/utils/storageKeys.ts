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

  // Data persistence
  static readonly SONG = 'dosound-tracker-song' as const;
  static readonly INSTRUMENT = 'dosound-tracker-instrument' as const;
}

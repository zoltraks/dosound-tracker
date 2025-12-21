/**
 * Centralized localStorage key definitions for the DOSOUND Tracker application.
 * This class consolidates all localStorage key usage to ensure consistency
 * and make it easier to manage key names across the application.
 */
export class StorageKeys {
  // Debug and development settings
  static readonly DEBUG_MODE = 'dosound-tracker-debug-mode';

  // Export settings
  static readonly EXPORT_TYPE = 'dosound-tracker-export-type';
  static readonly DUMP_MODE = 'dosound-tracker-dump-mode';

  // UI preferences
  static readonly THEME = 'dosound-tracker-theme';
  static readonly TRANSPOSE_SETTINGS = 'dosound-tracker-transpose-settings';

  // Data persistence
  static readonly SONG = 'dosound-tracker-song';
  static readonly INSTRUMENT = 'dosound-tracker-instrument';
}

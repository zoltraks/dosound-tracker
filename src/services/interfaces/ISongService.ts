import type { Song, Pattern } from '../../synth/SoundDriver';
import type { ExportFormat } from '../../constants/export';

export type SongTemplate = Partial<Song>;

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface SongOptimizationDetails {
  optimizedSong: Song;
  removedPatternIds: string[];
  removedInstrumentIds: string[];
  trimmedLinesInfo: { id: string; name: string; removed: number }[];
}

export interface ISongService {
  createSong(template?: SongTemplate): Promise<Song>;
  updateSong(current: Song, updates: Partial<Song>): Promise<Song>;
  deleteSong(song: Song): Promise<void>;
  validateSong(song: Song): ValidationResult;
  optimizeSong(song: Song): SongOptimizationDetails;
  exportSong(song: Song, format: ExportFormat): Promise<Blob>;
}

import type { Song, Instrument, Pattern, Step } from '../synth/SoundDriver';
import { PATTERN_LENGTH } from '../constants/music';
import {
  exportToAssembly as _exportToAssembly,
  exportInstrumentToAssembly as _exportInstrumentToAssembly,
  exportSongRegisterDump as _exportSongRegisterDump,
  downloadAssemblyFile as _downloadAssemblyFile,
} from './asm';
import {
  parseAssemblyToBinary as _parseAssemblyToBinary,
  exportToBinary as _exportToBinary,
  downloadBinaryFile as _downloadBinaryFile,
  exportInstrumentToBinary as _exportInstrumentToBinary,
} from './bin';
import {
  exportSongToMax as _exportSongToMax,
  exportInstrumentToMax as _exportInstrumentToMax,
  downloadMaxFile as _downloadMaxFile,
  type MaxExportResult,
} from './max';
import {
  exportSongToVgm as _exportSongToVgm,
  exportInstrumentToVgm as _exportInstrumentToVgm,
  downloadVgmFile as _downloadVgmFile,
  type VgmExportResult,
} from './vgm';
import {
  exportSongToWav as _exportSongToWav,
  exportInstrumentToWav as _exportInstrumentToWav,
  downloadWavFile as _downloadWavFile,
  type WavExportResult,
} from './wav';

export function downloadFile(
  content: string | Uint8Array,
  filename: string,
  mimeType: string
): void {
  const blob = new Blob([content as BlobPart], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function normalizeSongForExport(song: Song): Song {
  return {
    ...song,
    length: song.length ?? PATTERN_LENGTH,
    line: song.line ?? [],
    pattern: song.pattern ?? [],
    instrument: song.instrument ?? [],
  };
}

export function parseBaseKeyForExport(baseKey: string): { note: string; octave: number } {
  const match = baseKey.match(/^([A-G]#?)(\d+)$/);
  if (!match) {
    return { note: 'C', octave: 4 };
  }
  const note = match[1];
  const octave = parseInt(match[2], 10);
  return { note, octave };
}

export function buildInstrumentPreviewSong(instrument: Instrument, sourceSong: Song): Song {
  const normalizedSong = normalizeSongForExport(sourceSong);
  const patternLength = normalizedSong.length || PATTERN_LENGTH;
  const speed = normalizedSong.speed || 6;

  const base = parseBaseKeyForExport(instrument.base || 'C-4');

  const step: Step[] = [];
  for (let i = 0; i < patternLength; i++) {
    step.push({
      note: i === 0 ? { note: base.note, octave: base.octave, instrument: instrument.id } : null,
      volume: undefined,
    });
  }

  const patternId = 'IP';
  const pattern: Pattern = {
    id: patternId,
    name: instrument.name || `Instrument ${instrument.id || ''}`,
    step,
  };

  const titleBase = sourceSong.title || '';
  const suffix = instrument.name
    ? ` - ${instrument.name}`
    : instrument.id
    ? ` - INST ${instrument.id}`
    : ' - Instrument';
  const title = titleBase ? `${titleBase}${suffix}` : `Instrument Preview${suffix}`;

  return {
    ...normalizedSong,
    title,
    speed,
    length: patternLength,
    pattern: [pattern],
    line: [{ A: patternId, B: '--', C: '--' }],
    loop: null,
    instrument: [instrument],
  };
}

// Re-export assembly functions from asm.ts for backward compatibility
export const exportToAssembly = _exportToAssembly;
export const exportInstrumentToAssembly = _exportInstrumentToAssembly;
export const exportSongRegisterDump = _exportSongRegisterDump;
export const downloadAssemblyFile = _downloadAssemblyFile;

// Re-export binary functions from bin.ts for backward compatibility
export const parseAssemblyToBinary = _parseAssemblyToBinary;
export const exportToBinary = _exportToBinary;
export const downloadBinaryFile = _downloadBinaryFile;
export const exportInstrumentToBinary = _exportInstrumentToBinary;

// Re-export MAX functions from max.ts for backward compatibility
export const exportSongToMax = _exportSongToMax;
export const exportInstrumentToMax = _exportInstrumentToMax;
export const downloadMaxFile = _downloadMaxFile;
export type { MaxExportResult };

// Re-export VGM functions from vgm.ts for backward compatibility
export const exportSongToVgm = _exportSongToVgm;
export const exportInstrumentToVgm = _exportInstrumentToVgm;
export const downloadVgmFile = _downloadVgmFile;
export type { VgmExportResult };

// Re-export WAV functions from wav.ts for backward compatibility
export const exportSongToWav = _exportSongToWav;
export const exportInstrumentToWav = _exportInstrumentToWav;
export const downloadWavFile = _downloadWavFile;
export type { WavExportResult };

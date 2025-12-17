import type { Song, Instrument, Pattern, Step } from '../synth/SoundDriver';
import { PATTERN_LENGTH } from '../constants/music';
import type { ExportStrategy } from '../constants/export';
import { normalizeSongForExport, parseBaseKeyForExport } from './core';
import { exportToAssembly } from './asm';
import { downloadFile } from './core';

export function parseAssemblyToBinary(assembly: string): Uint8Array {
  const lines = assembly.split(/\r?\n/);
  const bytes: number[] = [];

  for (const line of lines) {
    const idx = line.indexOf('dc.b');
    if (idx === -1) {
      continue;
    }

    const after = line.slice(idx + 'dc.b'.length);
    const codePart = after.split(';', 1)[0];
    const tokens = codePart
      .split(',')
      .map(token => token.trim())
      .filter(token => token.length > 0);

    for (const token of tokens) {
      if (!token.startsWith('$')) {
        continue;
      }

      const hex = token.slice(1);
      if (!hex) {
        continue;
      }

      const value = parseInt(hex, 16);
      if (!Number.isFinite(value)) {
        continue;
      }

      bytes.push(value & 0xff);
    }
  }

  return new Uint8Array(bytes);
}

export function exportToBinary(
  song: Song,
  isComplexDumpMode: boolean | ExportStrategy = false
): Uint8Array {
  const assembly = exportToAssembly(song, isComplexDumpMode);
  return parseAssemblyToBinary(assembly);
}

export function downloadBinaryFile(bytes: Uint8Array, filename: string = 'music.bin'): void {
  downloadFile(bytes, filename, 'application/octet-stream');
}

function buildInstrumentPreviewSong(instrument: Instrument, sourceSong: Song): Song {
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

export function exportInstrumentToBinary(instrument: Instrument, song: Song): Uint8Array {
  const previewSong = buildInstrumentPreviewSong(instrument, song);
  return exportToBinary(previewSong);
}

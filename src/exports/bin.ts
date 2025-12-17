import type { Song } from '../synth/SoundDriver';
import type { ExportStrategy } from '../constants/export';
import { downloadFile } from './core';
import { exportToAssembly } from './asm';

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
      .map((token) => token.trim())
      .filter((token) => token.length > 0);

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

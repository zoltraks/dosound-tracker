import type { Instrument, Song } from '../synth/SoundDriver';
import { VBLANK_RATE } from '../synth/SoundDriver';
import { YM_CLOCK } from '../synth/YM2149';
import type { ExportStrategy } from '../constants/export';
import { buildInstrumentPreviewSong, downloadFile } from './core';
import { exportSongRegisterDump } from './asm';
import { parseAssemblyToBinary } from './bin';

export interface MaxExportResult {
  buffer: ArrayBuffer;
  frameCount: number;
}

function buildMaxShortChunk(typeChar: string, data: number[]): number[] {
  const typeCode = typeChar.charCodeAt(0) & 0xff;
  const length = data.length;
  const sizeByte = length > 0 ? (length - 1) & 0xff : 0;
  const chunk: number[] = [typeCode, sizeByte];
  chunk.push(...data);
  return chunk;
}

function buildMaxLongChunk(typeChar: string, data: number[]): number[] {
  const typeCode = typeChar.charCodeAt(0) & 0xff;
  const length = data.length;
  const size = length > 0 ? length - 1 : 0;
  const b0 = (size >>> 16) & 0xff;
  const b1 = (size >>> 8) & 0xff;
  const b2 = size & 0xff;
  const chunk: number[] = [typeCode, b0, b1, b2];
  chunk.push(...data);
  return chunk;
}

function buildMaxInfoChunk(song: Song): number[] | null {
  const title = (song.title || '').trim();
  const author = (song.author || '').trim();
  const yearValue = typeof song.year === 'number' && Number.isFinite(song.year) ? song.year : null;
  const year = yearValue !== null ? String(yearValue) : '';

  const lines: string[] = [];
  if (title) {
    lines.push(`T ${title}`);
  }
  if (author) {
    lines.push(`A ${author}`);
  }
  if (year) {
    lines.push(`Y ${year}`);
  }

  if (lines.length === 0) {
    return null;
  }

  const data: number[] = [];
  const encoder = typeof TextEncoder !== 'undefined' ? new TextEncoder() : null;

  for (const line of lines) {
    if (encoder) {
      const encoded = encoder.encode(line);
      for (let i = 0; i < encoded.length; i++) {
        data.push(encoded[i]);
      }
    } else {
      for (let i = 0; i < line.length; i++) {
        const code = line.charCodeAt(i) & 0xff;
        data.push(code);
      }
    }
    data.push(0x00);
  }

  return buildMaxShortChunk('I', data);
}

function buildMaxStreamFromDumpBytes(
  dumpBytes: Uint8Array,
  strategy: ExportStrategy
): { streamFormat: number; streamData: number[]; frameCount: number } {
  const frameWidth = 11;
  if (dumpBytes.length === 0 || dumpBytes.length % frameWidth !== 0) {
    return { streamFormat: 0x08, streamData: [], frameCount: 0 };
  }

  const frameCount = dumpBytes.length / frameWidth;

  if (strategy === 'simple') {
    const data: number[] = [];
    for (let i = 0; i < dumpBytes.length; i++) {
      data.push(dumpBytes[i] & 0xff);
    }
    return { streamFormat: 0x08, streamData: data, frameCount };
  }

  const regCount = frameWidth;
  const regNumbers: number[] = [];
  for (let i = 0; i < regCount; i++) {
    regNumbers.push(i);
  }
  const prev: number[] = new Array(regCount).fill(0);
  const data: number[] = [];

  for (let frame = 0; frame < frameCount; frame++) {
    const base = frame * frameWidth;

    for (let i = 0; i < regCount; i++) {
      const value = dumpBytes[base + i] & 0xff;
      if (frame === 0 || value !== prev[i]) {
        const reg = regNumbers[i] & 0x7f;
        data.push(reg, value);
        prev[i] = value;
      }
    }

    // End-of-frame marker: use a register byte with the high bit set and
    // value $80 to indicate the end of the data frame with no extra delay.
    data.push(0x80, 0x80);
  }

  const streamData = strategy === 'optimized' ? optimizeReg7Delays(data) : data;

  return { streamFormat: 0x07, streamData, frameCount };
}

function optimizeReg7Delays(input: number[]): number[] {
  const out: number[] = [];
  const len = input.length;
  let i = 0;

  while (i < len) {
    const cmd = input[i] & 0xff;

    if (cmd === 0x80 && i + 1 < len) {
      let frames = 0;

      while (i < len && input[i] === 0x80 && i + 1 < len) {
        const value = input[i + 1] & 0xff;
        if ((value & 0x80) === 0) {
          break;
        }

        const extra = value & 0x7f;
        frames += 1 + extra;
        i += 2;
      }

      while (frames > 0) {
        const chunk = frames > 128 ? 128 : frames;
        const extra = chunk - 1;
        const value = 0x80 | (extra & 0x7f);
        out.push(0x80, value);
        frames -= chunk;
      }

      continue;
    }

    out.push(cmd);
    i++;
  }

  return out;
}

export function exportSongToMax(song: Song, strategy: ExportStrategy = 'simple'): MaxExportResult {
  const dump = exportSongRegisterDump(song);
  const dumpBytes = parseAssemblyToBinary(dump.content);

  const { streamFormat, streamData, frameCount } = buildMaxStreamFromDumpBytes(
    dumpBytes,
    strategy
  );

  const fileBytes: number[] = [];

  // File header: magic "MAX "
  fileBytes.push(0x4d, 0x41, 0x58, 0x20);

  // Version chunk: 'V', size 0, version 1
  fileBytes.push(...buildMaxShortChunk('V', [0x01]));

  const infoChunk = buildMaxInfoChunk(song);
  if (infoChunk) {
    fileBytes.push(...infoChunk);
  }

  const chipData: number[] = [];
  chipData.push(0xa9);
  chipData.push(0x00);
  chipData.push((VBLANK_RATE >>> 8) & 0xff, VBLANK_RATE & 0xff);

  const ymClock = YM_CLOCK >>> 0;
  chipData.push((ymClock >>> 24) & 0xff, (ymClock >>> 16) & 0xff, (ymClock >>> 8) & 0xff, ymClock & 0xff);

  fileBytes.push(...buildMaxShortChunk('C', chipData));

  const compression = 0x00;

  let streamDefData: number[];
  if (streamFormat === 0x08) {
    const frameSize = 11; // RAW8 AY/YM frame size in bytes
    streamDefData = [
      streamFormat & 0xff,
      compression,
      0x00,
      0x00,
      0x00,
      frameSize & 0xff,
    ];
  } else {
    streamDefData = [streamFormat & 0xff, compression];
  }

  fileBytes.push(...buildMaxShortChunk('S', streamDefData));

  fileBytes.push(...buildMaxLongChunk('d', streamData));

  const buffer = new Uint8Array(fileBytes).buffer;

  return {
    buffer,
    frameCount,
  };
}

export function exportInstrumentToMax(
  instrument: Instrument,
  song: Song,
  strategy: ExportStrategy = 'simple'
): MaxExportResult {
  const previewSong = buildInstrumentPreviewSong(instrument, song);
  return exportSongToMax(previewSong, strategy);
}

export function downloadMaxFile(buffer: ArrayBuffer, filename: string = 'music.max'): void {
  downloadFile(buffer, filename, 'application/octet-stream');
}

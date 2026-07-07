import type { Instrument, Song } from '../synth/SoundDriver';
import { DEFAULT_SONG_FRAME, DEFAULT_SONG_CLOCK } from '../constants/song';
import type { ExportStrategy } from '../constants/export';
import { buildInstrumentPreviewSong, downloadFile, normalizeSongForExport } from './core';
import { simulateSong } from '../utils/playbackSimulation';
import { compressZX0 } from '../utils/zx0';

// Number of YM2149 registers captured per frame (R0-R13).
const YM_REGISTER_COUNT = 14;
// ZX0 ring-buffer window expected by hardware MAX players (1024 bytes).
const MAX_ZX0_OFFSET = 1023;
// REG7 frame delimiter base value (high bit set, 1 frame delay).
const REG7_DELIMITER_BASE = 0x80;
// Maximum frames encodable in a single REG7 delimiter byte (0xFF = 128).
const REG7_MAX_DELAY_PER_BYTE = 128;

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

function captureMaxFrames(song: Song, chipClock: number): { frames: number[][]; frameCount: number } {
  const frames: number[][] = [];

  simulateSong(song, (frame) => {
    const regs = frame.registers;
    const snapshot: number[] = new Array(YM_REGISTER_COUNT).fill(0);
    for (let reg = 0; reg < YM_REGISTER_COUNT; reg++) {
      const value = regs[reg];
      snapshot[reg] = value === undefined ? 0 : value & 0xff;
    }
    frames.push(snapshot);
  }, { clock: chipClock });

  return { frames, frameCount: frames.length };
}

function buildRaw8Stream(frames: number[][]): number[] {
  const data: number[] = [];
  for (const frame of frames) {
    for (let reg = 0; reg < YM_REGISTER_COUNT; reg++) {
      data.push(frame[reg] & 0xff);
    }
  }
  return data;
}

function buildReg7Stream(frames: number[][]): number[] {
  const data: number[] = [];
  const prev: number[] = new Array(YM_REGISTER_COUNT).fill(0);

  for (let frameIndex = 0; frameIndex < frames.length; frameIndex++) {
    const frame = frames[frameIndex];

    for (let reg = 0; reg < YM_REGISTER_COUNT; reg++) {
      const value = frame[reg] & 0xff;
      // The player zeroes all registers before replay starts, so the initial
      // "previous" state is all zeros. Only write registers that differ from
      // the previous frame (including the first frame, where only non-zero
      // registers are emitted).
      if (value !== prev[reg]) {
        data.push(reg & 0x7f, value);
        prev[reg] = value;
      }
    }

    // Single-byte frame delimiter: 0x80 = end of frame, 1 frame delay.
    data.push(REG7_DELIMITER_BASE);
  }

  return data;
}

function optimizeReg7Delays(input: number[]): number[] {
  const out: number[] = [];
  const len = input.length;
  let i = 0;

  while (i < len) {
    const byte = input[i] & 0xff;

    if (byte < REG7_DELIMITER_BASE) {
      // Register write pair: address (0x00-0x7F) followed by value byte.
      out.push(byte);
      if (i + 1 < len) {
        out.push(input[i + 1] & 0xff);
        i += 2;
      } else {
        i += 1;
      }
      continue;
    }

    // Collect consecutive single-byte frame delimiters and coalesce their delays.
    let delay = 0;
    while (i < len && (input[i] & 0xff) >= REG7_DELIMITER_BASE) {
      delay += (input[i] & 0x7f) + 1;
      i += 1;
    }

    while (delay > 0) {
      const chunk = delay > REG7_MAX_DELAY_PER_BYTE ? REG7_MAX_DELAY_PER_BYTE : delay;
      out.push(REG7_DELIMITER_BASE | ((chunk - 1) & 0x7f));
      delay -= chunk;
    }
  }

  return out;
}

function buildMaxStream(
  song: Song,
  strategy: ExportStrategy,
  chipClock: number
): { streamFormat: number; streamData: number[]; frameCount: number } {
  const { frames, frameCount } = captureMaxFrames(song, chipClock);

  if (strategy === 'simple') {
    return { streamFormat: 0x08, streamData: buildRaw8Stream(frames), frameCount };
  }

  const reg7Data = buildReg7Stream(frames);
  const streamData = strategy === 'optimized' ? optimizeReg7Delays(reg7Data) : reg7Data;

  return { streamFormat: 0x07, streamData, frameCount };
}

export function exportSongToMax(song: Song, strategy: ExportStrategy = 'simple'): MaxExportResult {
  const normalizedSong = normalizeSongForExport(song);
  const frameRate = normalizedSong.frame ?? DEFAULT_SONG_FRAME;
  const chipClock = normalizedSong.clock ?? DEFAULT_SONG_CLOCK;
  const { streamFormat, streamData, frameCount } = buildMaxStream(normalizedSong, strategy, chipClock);

  const uncompressedSize = streamData.length;
  const compressed =
    uncompressedSize > 0
      ? compressZX0(new Uint8Array(streamData), { maxOffset: MAX_ZX0_OFFSET })
      : new Uint8Array(0);
  const compressedData: number[] = [];
  for (let i = 0; i < compressed.length; i++) {
    compressedData.push(compressed[i] & 0xff);
  }

  const fileBytes: number[] = [];

  // File header: magic "MAX "
  fileBytes.push(0x4d, 0x41, 0x58, 0x20);

  // Version chunk: 'V', size 0, version 1
  fileBytes.push(...buildMaxShortChunk('V', [0x01]));

  const infoChunk = buildMaxInfoChunk(normalizedSong);
  if (infoChunk) {
    fileBytes.push(...infoChunk);
  }

  const chipData: number[] = [];
  chipData.push(0xa9);
  chipData.push(0x00);
  chipData.push((frameRate >>> 8) & 0xff, frameRate & 0xff);

  const ymClock = chipClock >>> 0;
  chipData.push((ymClock >>> 24) & 0xff, (ymClock >>> 16) & 0xff, (ymClock >>> 8) & 0xff, ymClock & 0xff);

  fileBytes.push(...buildMaxShortChunk('C', chipData));

  // Stream definition: format, ZX0 compression (0x08), 3-byte big-endian
  // uncompressed size, and frame size for RAW8 dumps.
  const compression = 0x08; // ZX0
  const sizeHi = (uncompressedSize >>> 16) & 0xff;
  const sizeMid = (uncompressedSize >>> 8) & 0xff;
  const sizeLo = uncompressedSize & 0xff;

  let streamDefData: number[];
  if (streamFormat === 0x08) {
    streamDefData = [
      streamFormat & 0xff,
      compression,
      sizeHi,
      sizeMid,
      sizeLo,
      YM_REGISTER_COUNT & 0xff,
    ];
  } else {
    streamDefData = [streamFormat & 0xff, compression, sizeHi, sizeMid, sizeLo];
  }

  fileBytes.push(...buildMaxShortChunk('S', streamDefData));

  fileBytes.push(...buildMaxLongChunk('d', compressedData));

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

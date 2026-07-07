import type { Instrument, Song } from '../synth/SoundDriver';
import { DEFAULT_SONG_FRAME, DEFAULT_SONG_CLOCK } from '../constants/song';
import type { ExportStrategy } from '../constants/export';
import { simulateSong } from '../utils/playbackSimulation';
import { buildInstrumentPreviewSong, downloadFile, normalizeSongForExport } from './core';

export interface VgmExportResult {
  buffer: ArrayBuffer;
  totalSamples: number;
}

function optimizeVgmDelays(
  commands: number[],
  loopCommandOffset: number,
  waitCommand: number,
  samplesPerTick: number
): { commands: number[]; loopCommandOffset: number } {
  if (commands.length === 0) {
    return { commands, loopCommandOffset };
  }

  // If no valid loop point, just optimize the whole stream.
  if (loopCommandOffset < 0 || loopCommandOffset > commands.length) {
    const merged = mergeVgmDelaySequence(commands, waitCommand, samplesPerTick);
    return { commands: merged, loopCommandOffset };
  }

  // Preserve the exact byte position of the loop command by optimizing the
  // prefix and suffix separately, then recomputing the loop offset as the
  // length of the optimized prefix.
  const pre = commands.slice(0, loopCommandOffset);
  const post = commands.slice(loopCommandOffset);

  const preMerged = mergeVgmDelaySequence(pre, waitCommand, samplesPerTick);
  const postMerged = mergeVgmDelaySequence(post, waitCommand, samplesPerTick);

  return {
    commands: preMerged.concat(postMerged),
    loopCommandOffset: preMerged.length,
  };
}

function mergeVgmDelaySequence(
  commands: number[],
  waitCommand: number,
  samplesPerTick: number
): number[] {
  const out: number[] = [];
  const len = commands.length;
  let i = 0;

  while (i < len) {
    const cmd = commands[i];

    // Merge runs of the VBLANK wait command into a single 0x61 (arbitrary sample wait)
    if (cmd === waitCommand) {
      let run = 0;
      while (i < len && commands[i] === waitCommand) {
        run++;
        i++;
      }

      if (run >= 4) {
        const total = run * samplesPerTick;
        out.push(0x61, total & 0xff, (total >>> 8) & 0xff);
      } else {
        for (let k = 0; k < run; k++) {
          out.push(waitCommand);
        }
      }
      continue;
    }

    // AY8910 write (0xA0 rr vv)
    if (cmd === 0xa0) {
      if (i + 2 < len) {
        out.push(commands[i], commands[i + 1], commands[i + 2]);
        i += 3;
      } else {
        // Truncated command - copy remainder verbatim
        while (i < len) {
          out.push(commands[i++]);
        }
      }
      continue;
    }

    // Generic wait with explicit sample count (0x61 nn nn) - already optimal
    if (cmd === 0x61) {
      if (i + 2 < len) {
        out.push(commands[i], commands[i + 1], commands[i + 2]);
        i += 3;
      } else {
        while (i < len) {
          out.push(commands[i++]);
        }
      }
      continue;
    }

    // Other single-byte commands (including 0x62 and 0x66)
    out.push(cmd);
    i++;
  }

  return out;
}

function encodeUtf16LeNullTerminated(value: string): number[] {
  const bytes: number[] = [];
  const text = value || '';

  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i);
    bytes.push(code & 0xff, (code >>> 8) & 0xff);
  }

  bytes.push(0x00, 0x00);
  return bytes;
}

function buildGd3Tag(song: Song): Uint8Array | null {
  if (!song) {
    return null;
  }

  const title = (song.title || '').trim();
  const author = (song.author || '').trim();
  const yearValue = typeof song.year === 'number' && Number.isFinite(song.year) ? song.year : null;
  const release = yearValue !== null ? String(yearValue) : '';

  const fields: string[] = [
    title,
    '',
    'DOSOUND Tracker',
    '',
    '',
    '',
    author,
    '',
    release,
    '',
    '',
  ];

  if (!title && !author && !release) {
    return null;
  }

  const payloadBytes: number[] = [];
  for (const field of fields) {
    payloadBytes.push(...encodeUtf16LeNullTerminated(field));
  }

  const length = payloadBytes.length;
  const bytes: number[] = [];

  bytes.push(0x47, 0x64, 0x33, 0x20);
  bytes.push(0x00, 0x01, 0x00, 0x00);
  bytes.push(length & 0xff, (length >>> 8) & 0xff, (length >>> 16) & 0xff, (length >>> 24) & 0xff);
  bytes.push(...payloadBytes);

  return new Uint8Array(bytes);
}

export function exportSongToVgm(song: Song, strategy: ExportStrategy = 'simple'): VgmExportResult {
  const normalizedSong = normalizeSongForExport(song);
  const frameRate = normalizedSong.frame ?? DEFAULT_SONG_FRAME;
  const chipClock = normalizedSong.clock ?? DEFAULT_SONG_CLOCK;
  let commands: number[] = [];
  const SAMPLES_PER_TICK = Math.round(44100 / frameRate);
  // VGM wait command: 0x63 for 50 Hz, 0x62 for 60 Hz, 0x61 (explicit samples) for other rates
  const waitCommand = frameRate === 50 ? 0x63 : frameRate === 60 ? 0x62 : 0x61;
  let totalSamples = 0;

  const relevantRegs = [0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08, 0x09, 0x0a];
  const lastRegs: { [register: number]: number } = {};

  const playlistLength = normalizedSong.line.length;
  let loopPlaylistIndex: number | null = null;
  if (normalizedSong.loop != null && playlistLength > 0) {
    const rawLoop = normalizedSong.loop as number;
    if (typeof rawLoop === 'number' && Number.isFinite(rawLoop)) {
      loopPlaylistIndex = Math.max(0, Math.min(playlistLength - 1, rawLoop | 0));
    }
  }

  let loopCommandOffset = -1;
  let loopSampleOffset = 0;

  const writeAyRegister = (register: number, value: number): void => {
    commands.push(0xa0, register & 0xff, value & 0xff);
  };

  simulateSong(normalizedSong, (frame) => {
    const { registers, isFirstFrame, playlistIndex, patternLineIndex, tick } = frame;

    if (
      loopCommandOffset < 0 &&
      loopPlaylistIndex !== null &&
      playlistIndex === loopPlaylistIndex &&
      patternLineIndex === 0 &&
      tick === 0
    ) {
      loopCommandOffset = commands.length;
      loopSampleOffset = totalSamples;
    }

    for (let i = 0; i < relevantRegs.length; i++) {
      const reg = relevantRegs[i];
      const defaultValue = reg === 0x07 ? 0x38 : 0x00;
      const current = registers[reg] !== undefined ? registers[reg] : defaultValue;
      const previous = lastRegs[reg];
      if (isFirstFrame || previous !== current) {
        writeAyRegister(reg, current);
        lastRegs[reg] = current;
      }
    }

    if (waitCommand === 0x61) {
      commands.push(0x61, SAMPLES_PER_TICK & 0xff, (SAMPLES_PER_TICK >>> 8) & 0xff);
    } else {
      commands.push(waitCommand);
    }
    totalSamples += SAMPLES_PER_TICK;
  }, { clock: chipClock });

  commands.push(0x66);

  if (strategy === 'optimized') {
    const optimized = optimizeVgmDelays(commands, loopCommandOffset, waitCommand, SAMPLES_PER_TICK);
    commands = optimized.commands;
    loopCommandOffset = optimized.loopCommandOffset;
  }

  const dataOffset = 0x100;
  const headerSize = 0x100;

  const gd3Tag = buildGd3Tag(normalizedSong);
  const gd3Length = gd3Tag ? gd3Tag.length : 0;

  const fileSize = headerSize + commands.length + gd3Length;
  const eofOffset = fileSize - 4;

  const header = new Uint8Array(headerSize);
  header[0] = 0x56;
  header[1] = 0x67;
  header[2] = 0x6d;
  header[3] = 0x20;

  const writeUint32LE = (offset: number, value: number): void => {
    header[offset] = value & 0xff;
    header[offset + 1] = (value >>> 8) & 0xff;
    header[offset + 2] = (value >>> 16) & 0xff;
    header[offset + 3] = (value >>> 24) & 0xff;
  };

  writeUint32LE(0x04, eofOffset);
  writeUint32LE(0x08, 0x00000171);
  writeUint32LE(0x18, totalSamples);

  if (gd3Tag && gd3Length > 0) {
    const gd3Offset = headerSize + commands.length;
    const gd3OffsetRel = gd3Offset - 0x14;
    writeUint32LE(0x14, gd3OffsetRel);
  } else {
    writeUint32LE(0x14, 0);
  }

  if (loopCommandOffset >= 0 && loopSampleOffset > 0 && totalSamples > loopSampleOffset) {
    const loopDataOffset = dataOffset + loopCommandOffset;
    const loopOffset = loopDataOffset - 0x1c;
    const loopSamples = totalSamples - loopSampleOffset;
    writeUint32LE(0x1c, loopOffset);
    writeUint32LE(0x20, loopSamples);
  } else {
    writeUint32LE(0x1c, 0);
    writeUint32LE(0x20, 0);
  }
  writeUint32LE(0x24, frameRate);

  const relativeDataOffset = dataOffset - 0x34;
  writeUint32LE(0x34, relativeDataOffset);

  writeUint32LE(0x74, chipClock);

  const fileBytes = new Uint8Array(fileSize);
  fileBytes.set(header, 0);
  fileBytes.set(new Uint8Array(commands), headerSize);

  if (gd3Tag && gd3Length > 0) {
    fileBytes.set(gd3Tag, headerSize + commands.length);
  }

  const buffer = fileBytes.buffer;

  return {
    buffer,
    totalSamples,
  };
}

export function downloadVgmFile(buffer: ArrayBuffer, filename: string = 'music.vgm'): void {
  downloadFile(buffer, filename, 'application/octet-stream');
}

export function exportInstrumentToVgm(instrument: Instrument, song: Song): VgmExportResult {
  const previewSong = buildInstrumentPreviewSong(instrument, song);
  return exportSongToVgm(previewSong);
}

import type { Song, Instrument } from '../synth/SoundDriver';
import { VBLANK_RATE } from '../synth/SoundDriver';
import { YM_CLOCK } from '../synth/YM2149';
import type { ExportStrategy } from '../constants/export';
import { normalizeSongForExport, buildInstrumentPreviewSong, downloadFile, exportSongRegisterDump, parseAssemblyToBinary } from './core';

export interface VgmExportResult {
  buffer: ArrayBuffer;
  totalSamples: number;
}

function optimizeVgmDelays(
  commands: number[],
  loopCommandOffset: number
): { commands: number[]; loopCommandOffset: number } {
  if (commands.length === 0) {
    return { commands, loopCommandOffset };
  }

  // If no valid loop point, just optimize the whole stream.
  if (loopCommandOffset < 0 || loopCommandOffset > commands.length) {
    const merged = mergeVgmDelaySequence(commands);
    return { commands: merged, loopCommandOffset };
  }

  // Preserve the exact byte position of the loop command by optimizing the
  // prefix and suffix separately, then recomputing the loop offset as the
  // length of the optimized prefix.
  const pre = commands.slice(0, loopCommandOffset);
  const post = commands.slice(loopCommandOffset);

  const preMerged = mergeVgmDelaySequence(pre);
  const postMerged = mergeVgmDelaySequence(post);

  return {
    commands: preMerged.concat(postMerged),
    loopCommandOffset: preMerged.length,
  };
}

function mergeVgmDelaySequence(commands: number[]): number[] {
  const out: number[] = [];
  const len = commands.length;
  let i = 0;
  const SAMPLES_PER_TICK = 882; // Must match SAMPLES_PER_TICK in exportSongToVgm

  while (i < len) {
    const cmd = commands[i];

    // Merge runs of 0x63 (wait 1/50s) into a single 0x61 (arbitrary sample wait)
    if (cmd === 0x63) {
      let run = 0;
      while (i < len && commands[i] === 0x63) {
        run++;
        i++;
      }

      if (run >= 4) {
        const total = run * SAMPLES_PER_TICK;
        out.push(0x61, total & 0xff, (total >>> 8) & 0xff);
      } else {
        for (let k = 0; k < run; k++) {
          out.push(0x63);
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
  const yearValue =
    typeof song.year === 'number' && Number.isFinite(song.year) ? song.year : null;
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
    ''
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

export function exportSongToVgm(
  song: Song,
  strategy: ExportStrategy = 'simple'
): VgmExportResult {
  const normalizedSong = normalizeSongForExport(song);
  let commands: number[] = [];
  const SAMPLES_PER_TICK = 882; // 1/50 second at 44100 Hz
  let totalSamples = 0;
  let loopSampleOffset = 0;
  let loopCommandOffset = -1;

  commands.push(0x66); // STOP
  commands.push(0x62); // WAIT 735 samples (1/60 second)
  commands.push(0x63); // WAIT 882 samples (1/50 second)

  const dump = exportSongRegisterDump(song);
  const dumpBytes = parseAssemblyToBinary(dump.content);

  if (dumpBytes.length > 0 && dumpBytes.length % 11 === 0) {
    const frameCount = dumpBytes.length / 11;
    for (let frame = 0; frame < frameCount; frame++) {
      const base = frame * 11;
      for (let reg = 0; reg < 11; reg++) {
        const value = dumpBytes[base + reg];
        commands.push(0xa0, reg, value);
      }
      commands.push(0x63); // WAIT 882 samples (1/50 second)
      totalSamples += SAMPLES_PER_TICK;
    }

    // Set loop information if song has a loop point
    if (normalizedSong.loop !== null && normalizedSong.loop !== undefined) {
      const loopLine = normalizedSong.loop;
      if (loopLine >= 0 && loopLine < normalizedSong.line.length) {
        // Calculate loop command offset based on the loop line
        const loopCommandsBefore = (loopLine * normalizedSong.speed || 6) * 12; // Approximate
        loopCommandOffset = 12 + loopCommandsBefore; // After initial commands
        loopSampleOffset = loopLine * SAMPLES_PER_TICK * (normalizedSong.speed || 6);
      }
    }
  }

  commands.push(0x66); // STOP

  let optimizedCommands = commands;
  if (strategy === 'optimized') {
    const result = optimizeVgmDelays(commands, loopCommandOffset);
    optimizedCommands = result.commands;
    loopCommandOffset = result.loopCommandOffset;
  }

  const dataOffset = 0x100;
  const headerSize = 0x100;

  const gd3Tag = buildGd3Tag(normalizedSong);
  const gd3Length = gd3Tag ? gd3Tag.length : 0;

  const fileSize = headerSize + optimizedCommands.length + gd3Length;
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
    const gd3Offset = headerSize + optimizedCommands.length;
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
  writeUint32LE(0x24, VBLANK_RATE);

  const relativeDataOffset = dataOffset - 0x34;
  writeUint32LE(0x34, relativeDataOffset);

  writeUint32LE(0x74, YM_CLOCK);

  const fileBytes = new Uint8Array(fileSize);
  fileBytes.set(header, 0);
  fileBytes.set(new Uint8Array(optimizedCommands), headerSize);

  if (gd3Tag && gd3Length > 0) {
    fileBytes.set(gd3Tag, headerSize + optimizedCommands.length);
  }

  const buffer = fileBytes.buffer;

  return {
    buffer,
    totalSamples,
  };
}

export function exportInstrumentToVgm(
  instrument: Instrument,
  song: Song,
  strategy: ExportStrategy = 'simple'
): VgmExportResult {
  const previewSong = buildInstrumentPreviewSong(instrument, song);
  return exportSongToVgm(previewSong, strategy);
}

export function downloadVgmFile(buffer: ArrayBuffer, filename: string = 'music.vgm'): void {
  downloadFile(new Uint8Array(buffer), filename, 'application/octet-stream');
}

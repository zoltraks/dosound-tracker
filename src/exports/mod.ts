import type { Instrument, Song } from '../synth/SoundDriver.ts';
import { PATTERN_LENGTH } from '../constants/music.ts';
import { simulateSong } from '../utils/playback/playbackSimulation.ts';
import { buildPatternLookup, isPatternTrackId } from '../utils/song/songLookup.ts';
import {
  downloadFile,
  exportInstrumentWith,
  normalizeSongForExport,
  resolveExportTiming,
} from './core.ts';

export interface ModExportResult {
  buffer: ArrayBuffer;
  warnings: string[];
}

// Amiga color-clock rate feeding the period formula rate = CLOCK / (2 * period).
const MOD_AMIGA_CLOCK = 7093789.2;
// One square-wave cycle in bytes; the looped sample makes a named period
// sound at the note's real frequency.
const MOD_SAMPLE_CYCLE = 32;
const MOD_NOISE_SAMPLE_LENGTH = 512;
const MOD_ROWS_PER_PATTERN = 64;
const MOD_MAX_POSITIONS = 128;
const MOD_MAX_SPEED = 31;
const MOD_MIN_BPM = 32;
const MOD_MAX_BPM = 255;
const MOD_SAMPLE_COUNT = 31;
const MOD_SAMPLE_RECORD_SIZE = 30;
const MOD_SAMPLE_NAME_SIZE = 22;
const MOD_TITLE_SIZE = 20;
const MOD_NOISE_NOTE_PERIOD = 428;
const MOD_RESTART_NO_LOOP = 0x7f;

// ProTracker finetune-0 period table, C-1 through B-3.
const MOD_PERIOD_TABLE = [
  856, 808, 762, 720, 678, 640, 604, 570, 538, 508, 480, 453, 428, 404, 381, 360, 339, 320, 302,
  285, 269, 254, 240, 226, 214, 202, 190, 180, 170, 160, 151, 143, 135, 127, 120, 113,
];
const MOD_PERIOD_MIN = MOD_PERIOD_TABLE[MOD_PERIOD_TABLE.length - 1];
const MOD_PERIOD_MAX = MOD_PERIOD_TABLE[0];

function nearestModPeriod(period: number): number {
  let best = MOD_PERIOD_TABLE[0];
  let bestDiff = Math.abs(period - best);
  for (const candidate of MOD_PERIOD_TABLE) {
    const diff = Math.abs(period - candidate);
    if (diff < bestDiff) {
      best = candidate;
      bestDiff = diff;
    }
  }
  return best;
}

function writeAscii(bytes: number[], offset: number, text: string, width: number): void {
  for (let i = 0; i < width; i++) {
    if (i >= text.length) {
      bytes[offset + i] = 0x00;
      continue;
    }
    const code = text.charCodeAt(i);
    bytes[offset + i] = code >= 0x20 && code <= 0x7e ? code : 0x3f;
  }
}

function writeWordBE(bytes: number[], offset: number, value: number): void {
  bytes[offset] = (value >>> 8) & 0xff;
  bytes[offset + 1] = value & 0xff;
}

function buildSquareSample(): number[] {
  const data: number[] = [];
  for (let i = 0; i < MOD_SAMPLE_CYCLE; i++) {
    // Signed 8-bit: +64 for the first half-cycle, -64 for the second.
    data.push(i < MOD_SAMPLE_CYCLE / 2 ? 0x40 : 0xc0);
  }
  return data;
}

function buildNoiseSample(): number[] {
  // Deterministic 17-bit LFSR noise (fixed seed, YM-style taps).
  const data: number[] = [];
  let lfsr = 0x1ffff;
  for (let i = 0; i < MOD_NOISE_SAMPLE_LENGTH; i++) {
    const bit = (lfsr ^ (lfsr >>> 3)) & 1;
    lfsr = (lfsr >>> 1) | (bit << 16);
    // Signed 8-bit output: the low LFSR byte recentered to -128..127.
    data.push(((lfsr & 0xff) - 0x80) & 0xff);
  }
  return data;
}

function setCellEffect(cells: Uint8Array, cellOffset: number, effect: number, param: number): void {
  // Preserve the sample low nibble already stored in byte 2's high nibble.
  cells[cellOffset + 2] = (cells[cellOffset + 2] & 0xf0) | (effect & 0x0f);
  cells[cellOffset + 3] = param & 0xff;
}

export function exportSongToMod(song: Song): ModExportResult {
  const normalizedSong = normalizeSongForExport(song);
  const { frameRate, chipClock, speed } = resolveExportTiming(normalizedSong);
  const warnings = new Set<string>();

  warnings.add(
    'All instruments render through two generated samples (square for tone, noise for noise); envelopes are approximated at row granularity.',
  );
  warnings.add(
    'Intra-row envelope movement (volume, pitch, shift, noise between rows) is dropped.',
  );
  warnings.add('The fourth MOD channel, stereo, and song metadata are not carried.');

  const patternsById = buildPatternLookup(normalizedSong.pattern);

  const rowLineIndexes: number[] = [];
  const rowRegisters: {
    regs: { [register: number]: number };
    playlistIndex: number;
    patternLineIndex: number;
  }[] = [];

  simulateSong(
    normalizedSong,
    (frame) => {
      if (frame.tick === 0) {
        rowLineIndexes.push(frame.lineIndex);
        rowRegisters.push({
          regs: frame.registers,
          playlistIndex: frame.playlistIndex,
          patternLineIndex: frame.patternLineIndex,
        });
      }
    },
    { clock: chipClock },
  );

  const totalRows = rowLineIndexes.length;
  let numPatterns = Math.max(1, Math.ceil(totalRows / MOD_ROWS_PER_PATTERN));
  if (numPatterns > MOD_MAX_POSITIONS) {
    numPatterns = MOD_MAX_POSITIONS;
    warnings.add('Song exceeds 128 MOD positions; trailing rows were truncated.');
  }

  const cells = new Uint8Array(numPatterns * MOD_ROWS_PER_PATTERN * 4 * 4);
  const lastVolume = [0x40, 0x40, 0x40];
  const channelHasNote = [false, false, false];
  let periodClamped = false;

  const trackKeys: ('A' | 'B' | 'C')[] = ['A', 'B', 'C'];

  for (let row = 0; row < totalRows; row++) {
    const lineIndex = rowLineIndexes[row];
    const patternIndex = Math.floor(lineIndex / MOD_ROWS_PER_PATTERN);
    if (patternIndex >= numPatterns) {
      break;
    }
    const modRow = lineIndex % MOD_ROWS_PER_PATTERN;
    const { regs, playlistIndex, patternLineIndex } = rowRegisters[row];
    const entry = normalizedSong.line[playlistIndex];
    const lineIdx = patternLineIndex;

    for (let ch = 0; ch < 3; ch++) {
      const trackId = entry?.[trackKeys[ch]];
      const hasPattern = isPatternTrackId(trackId);
      const pattern = hasPattern ? patternsById.get(trackId) : undefined;
      const rowNote = pattern?.step[lineIdx]?.note || null;

      const cellOffset = (patternIndex * MOD_ROWS_PER_PATTERN + modRow) * 16 + ch * 4;
      const volume = Math.round(((regs[0x08 + ch] ?? 0) & 0x0f) * (0x40 / 15));

      if (rowNote && rowNote.note === '===') {
        // Note cut at tick 0 - the MOD approximation of a release row.
        setCellEffect(cells, cellOffset, 0x0e, 0xc0);
        channelHasNote[ch] = false;
        continue;
      }

      if (rowNote && rowNote.note) {
        const mixer = regs[0x07] ?? 0x38;
        const toneActive = (mixer & (1 << ch)) === 0;
        const noiseActive = (mixer & (0x08 << ch)) === 0;
        const sample = noiseActive && !toneActive ? 2 : 1;

        let period = MOD_NOISE_NOTE_PERIOD;
        if (sample === 1) {
          const ymPeriod = (((regs[ch * 2 + 1] ?? 0) & 0x0f) << 8) | ((regs[ch * 2] ?? 0) & 0xff);
          if (ymPeriod > 0) {
            const frequency = chipClock / (16 * ymPeriod);
            const rawPeriod = MOD_AMIGA_CLOCK / (MOD_SAMPLE_CYCLE * 2 * frequency);
            if (rawPeriod > MOD_PERIOD_MAX || rawPeriod < MOD_PERIOD_MIN) {
              periodClamped = true;
            }
            period = nearestModPeriod(rawPeriod);
          }
        }

        cells[cellOffset] = ((sample & 0xf0) | ((period >>> 8) & 0x0f)) & 0xff;
        cells[cellOffset + 1] = period & 0xff;
        cells[cellOffset + 2] = ((sample & 0x0f) << 4) | 0x0c;
        cells[cellOffset + 3] = volume & 0xff;
        lastVolume[ch] = volume;
        channelHasNote[ch] = true;
        continue;
      }

      if (channelHasNote[ch] && volume !== lastVolume[ch]) {
        cells[cellOffset + 2] = 0x0c;
        cells[cellOffset + 3] = volume & 0xff;
        lastVolume[ch] = volume;
      }
    }
  }

  if (periodClamped) {
    warnings.add('Periods outside the ProTracker range were clamped to the nearest table value.');
  }

  // Timing commands on channel D, the always-empty fourth MOD channel: row 0
  // carries the tick speed, row 1 the BPM. Channel D never holds notes, so
  // the F effects can never displace a Cxx volume on a real channel.
  const speedParam = Math.max(1, Math.min(MOD_MAX_SPEED, speed | 0));
  if (speed > MOD_MAX_SPEED) {
    warnings.add('Song speed above 31 ticks per row was clamped to 31.');
  }
  setCellEffect(cells, 3 * 4, 0x0f, speedParam);
  const bpmParam = Math.max(MOD_MIN_BPM, Math.min(MOD_MAX_BPM, Math.round(frameRate * 2.5)));
  setCellEffect(cells, 16 + 3 * 4, 0x0f, bpmParam);

  return finishModFile(normalizedSong, cells, numPatterns, warnings);
}

function finishModFile(
  song: Song,
  cells: Uint8Array,
  numPatterns: number,
  warnings: Set<string>,
): ModExportResult {
  const bytes: number[] = [];

  // Title field (20 bytes).
  const title = new Array(MOD_TITLE_SIZE).fill(0);
  writeAscii(title, 0, song.title || '', MOD_TITLE_SIZE);
  bytes.push(...title);

  // Sample records.
  for (let slot = 1; slot <= MOD_SAMPLE_COUNT; slot++) {
    const record = new Array(MOD_SAMPLE_RECORD_SIZE).fill(0);
    if (slot === 1) {
      writeAscii(record, 0, 'DSND SQUARE', MOD_SAMPLE_NAME_SIZE);
      writeWordBE(record, 22, MOD_SAMPLE_CYCLE / 2);
      record[24] = 0x00;
      record[25] = 0x40;
      writeWordBE(record, 26, 0);
      writeWordBE(record, 28, MOD_SAMPLE_CYCLE / 2);
    } else if (slot === 2) {
      writeAscii(record, 0, 'DSND NOISE', MOD_SAMPLE_NAME_SIZE);
      writeWordBE(record, 22, MOD_NOISE_SAMPLE_LENGTH / 2);
      record[24] = 0x00;
      record[25] = 0x40;
      writeWordBE(record, 26, 0);
      writeWordBE(record, 28, MOD_NOISE_SAMPLE_LENGTH / 2);
    }
    bytes.push(...record);
  }

  // Song length and restart byte.
  bytes.push(numPatterns & 0xff);
  const lineCount = song.length || PATTERN_LENGTH;
  let restart = MOD_RESTART_NO_LOOP;
  if (song.loop != null && song.line.length > 0) {
    const rawLoop = song.loop;
    if (typeof rawLoop === 'number' && Number.isFinite(rawLoop)) {
      const loopIndex = Math.max(0, Math.min(song.line.length - 1, rawLoop | 0));
      restart = Math.max(
        0,
        Math.min(numPatterns - 1, Math.floor((loopIndex * lineCount) / MOD_ROWS_PER_PATTERN)),
      );
    }
  }
  bytes.push(restart & 0xff);

  // Order table - positions play patterns in sequence.
  for (let i = 0; i < MOD_MAX_POSITIONS; i++) {
    bytes.push(i < numPatterns ? i : 0);
  }

  // 'M.K.' tag.
  bytes.push(0x4d, 0x2e, 0x4b, 0x2e);

  for (let i = 0; i < cells.length; i++) {
    bytes.push(cells[i]);
  }

  bytes.push(...buildSquareSample());
  bytes.push(...buildNoiseSample());

  return {
    buffer: new Uint8Array(bytes).buffer,
    warnings: Array.from(warnings),
  };
}

export function downloadModFile(buffer: ArrayBuffer, filename: string = 'music.mod'): void {
  downloadFile(buffer, filename, 'application/octet-stream');
}

export function exportInstrumentToMod(instrument: Instrument, song: Song): ModExportResult {
  return exportInstrumentWith(instrument, song, exportSongToMod);
}

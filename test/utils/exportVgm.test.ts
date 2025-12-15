import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { parseSongFromYaml } from '../../src/utils/songParser';
import { exportSongToVgm, exportInstrumentToVgm } from '../../src/exports/vgm';
import { YM_CLOCK } from '../../src/synth/YM2149';
import { VBLANK_RATE, type Song } from '../../src/synth/SoundDriver';

function readUtf16LeString(bytes: Uint8Array, offset: number): { value: string; nextOffset: number } {
  let value = '';
  let pos = offset;

  while (pos + 1 < bytes.length) {
    const lo = bytes[pos];
    const hi = bytes[pos + 1];

    if (lo === 0 && hi === 0) {
      pos += 2;
      break;
    }

    value += String.fromCharCode(lo | (hi << 8));
    pos += 2;
  }

  return { value, nextOffset: pos };
}

function countVgmDelayCommands(bytes: Uint8Array, view: DataView): { count61: number; count63: number } {
  const dataOffsetRel = view.getUint32(0x34, true);
  const dataStart = 0x34 + dataOffsetRel;
  const gd3OffsetRel = view.getUint32(0x14, true);
  const gd3Start = gd3OffsetRel > 0 ? 0x14 + gd3OffsetRel : bytes.length;

  let count61 = 0;
  let count63 = 0;
  let pos = dataStart;

  while (pos < gd3Start) {
    const cmd = bytes[pos++];
    if (cmd === 0xa0) {
      pos += 2;
    } else if (cmd === 0x61) {
      count61++;
      pos += 2;
    } else if (cmd === 0x62 || cmd === 0x63) {
      if (cmd === 0x63) {
        count63++;
      }
    } else if (cmd === 0x66) {
      break;
    } else {
      break;
    }
  }

  return { count61, count63 };
}

describe('exportSongToVgm', () => {
  it('exports valid VGM data for the default song YAML', () => {
    const yamlContent = readFileSync('test/fixtures/song-vgm-tone.yaml', 'utf-8');

    const song = parseSongFromYaml(yamlContent);
    const { buffer, totalSamples } = exportSongToVgm(song);

    const bytes = new Uint8Array(buffer);
    expect(bytes.length).toBeGreaterThan(0x100);

    // Header magic "Vgm " (0x56 0x67 0x6D 0x20)
    expect(bytes[0]).toBe(0x56);
    expect(bytes[1]).toBe(0x67);
    expect(bytes[2]).toBe(0x6d);
    expect(bytes[3]).toBe(0x20);

    const view = new DataView(buffer);

    // EOF offset = fileSize - 4
    const eofOffset = view.getUint32(0x04, true);
    expect(eofOffset + 4).toBe(bytes.length);

    // Version 1.71
    const version = view.getUint32(0x08, true);
    expect(version).toBe(0x00000171);

    // Total samples field should match export result and be > 0
    const headerTotalSamples = view.getUint32(0x18, true);
    expect(headerTotalSamples).toBe(totalSamples);
    expect(totalSamples).toBeGreaterThan(0);

    // Loop information should be present for the default song (loop field in YAML)
    const loopOffset = view.getUint32(0x1c, true);
    const loopSamples = view.getUint32(0x20, true);
    expect(loopOffset).toBeGreaterThan(0);
    expect(loopSamples).toBeGreaterThan(0);

    // Rate field should match VBLANK_RATE (50 Hz)
    const rate = view.getUint32(0x24, true);
    expect(rate).toBe(VBLANK_RATE);

    // Data offset: for our files data starts at 0x100
    const dataOffsetRel = view.getUint32(0x34, true);
    const dataStart = 0x34 + dataOffsetRel;
    expect(dataStart).toBe(0x100);

    // AY8910 clock in header should match YM_CLOCK
    const ayClock = view.getUint32(0x74, true);
    expect(ayClock).toBe(YM_CLOCK);

    // There should be at least one AY8910 register write command (0xA0) in the data stream
    let hasAyWrite = false;
    for (let i = dataStart; i < bytes.length; i++) {
      if (bytes[i] === 0xa0) {
        hasAyWrite = true;
        break;
      }
    }
    expect(hasAyWrite).toBe(true);

    const gd3OffsetRel = view.getUint32(0x14, true);
    expect(gd3OffsetRel).toBeGreaterThan(0);

    const gd3Start = 0x14 + gd3OffsetRel;
    expect(gd3Start).toBeGreaterThan(dataStart);

    // The stream should end with 0x66 (end of sound data)
    expect(bytes[gd3Start - 1]).toBe(0x66);

    expect(bytes[gd3Start]).toBe(0x47);
    expect(bytes[gd3Start + 1]).toBe(0x64);
    expect(bytes[gd3Start + 2]).toBe(0x33);
    expect(bytes[gd3Start + 3]).toBe(0x20);

    const gd3Version = view.getUint32(gd3Start + 4, true);
    expect(gd3Version).toBe(0x00000100);

    const gd3Length = view.getUint32(gd3Start + 8, true);
    const gd3DataStart = gd3Start + 12;
    expect(gd3DataStart + gd3Length).toBe(bytes.length);

    let pos = gd3DataStart;
    const trackNameEn = readUtf16LeString(bytes, pos);
    pos = trackNameEn.nextOffset;

    const trackNameJp = readUtf16LeString(bytes, pos);
    pos = trackNameJp.nextOffset;

    const gameNameEn = readUtf16LeString(bytes, pos);
    pos = gameNameEn.nextOffset;

    const gameNameJp = readUtf16LeString(bytes, pos);
    pos = gameNameJp.nextOffset;

    const systemNameEn = readUtf16LeString(bytes, pos);
    pos = systemNameEn.nextOffset;

    const systemNameJp = readUtf16LeString(bytes, pos);
    pos = systemNameJp.nextOffset;

    const authorEn = readUtf16LeString(bytes, pos);
    pos = authorEn.nextOffset;

    const authorJp = readUtf16LeString(bytes, pos);
    pos = authorJp.nextOffset;

    const releaseDate = readUtf16LeString(bytes, pos);

    expect(trackNameEn.value).toBe(song.title);
    expect(gameNameEn.value).toBe('DOSOUND Tracker');
    expect(authorEn.value).toBe(song.author);
    expect(releaseDate.value).toBe(String(song.year));
  });

  it('exports valid VGM data for a noise-only song without loop', () => {
    const yamlContent = readFileSync('test/fixtures/song-vgm-noise.yaml', 'utf-8');

    const song = parseSongFromYaml(yamlContent);
    const { buffer, totalSamples } = exportSongToVgm(song);

    const bytes = new Uint8Array(buffer);
    expect(bytes.length).toBeGreaterThan(0x100);

    const view = new DataView(buffer);

    // No loop information should be present for this song
    const loopOffset = view.getUint32(0x1c, true);
    const loopSamples = view.getUint32(0x20, true);
    expect(loopOffset).toBe(0);
    expect(loopSamples).toBe(0);

    // Data offset: for our files data starts at 0x100
    const dataOffsetRel = view.getUint32(0x34, true);
    const dataStart = 0x34 + dataOffsetRel;
    expect(dataStart).toBe(0x100);

    // Ensure there is at least one AY8910 noise period write (R6) with non-zero value
    let hasNoiseWrite = false;
    for (let i = dataStart; i < bytes.length - 2; i++) {
      if (bytes[i] === 0xa0) {
        const reg = bytes[i + 1];
        const value = bytes[i + 2];
        if (reg === 0x06 && value > 0) {
          hasNoiseWrite = true;
          break;
        }
        i += 2;
      }
    }
    expect(hasNoiseWrite).toBe(true);

    const gd3OffsetRel = view.getUint32(0x14, true);
    let gd3Start = bytes.length;
    if (gd3OffsetRel > 0) {
      gd3Start = 0x14 + gd3OffsetRel;
      expect(gd3Start).toBeGreaterThan(dataStart);
    }

    // The stream should end with 0x66 (end of sound data)
    expect(bytes[gd3Start - 1]).toBe(0x66);

    // Total samples should still be consistent and > 0
    const headerTotalSamples = view.getUint32(0x18, true);
    expect(headerTotalSamples).toBe(totalSamples);
    expect(totalSamples).toBeGreaterThan(0);
  });

  it('uses only a single playlist entry worth of samples when scoped to one pattern', () => {
    const yamlContent = readFileSync('test/fixtures/song-vgm-tone.yaml', 'utf-8');

    const song = parseSongFromYaml(yamlContent);
    const playlistLength = song.line.length;
    expect(playlistLength).toBeGreaterThan(1);

    const full = exportSongToVgm(song);

    const scopedSong: Song = {
      ...song,
      line: [song.line[1]],
      loop: null,
    };

    const scoped = exportSongToVgm(scopedSong);

    expect(scoped.totalSamples).toBeGreaterThan(0);
    expect(full.totalSamples).toBe(playlistLength * scoped.totalSamples);
  });

  it('exports instrument-preview VGM without loop information even if the song has a loop', () => {
    const yamlContent = readFileSync('test/fixtures/song-vgm-tone.yaml', 'utf-8');

    const song = parseSongFromYaml(yamlContent);
    expect(song.loop).not.toBeNull();
    expect(song.instrument.length).toBeGreaterThan(0);

    const instrument = song.instrument[0];
    const { buffer, totalSamples } = exportInstrumentToVgm(instrument, song);

    const bytes = new Uint8Array(buffer);
    expect(bytes.length).toBeGreaterThan(0x100);
    expect(totalSamples).toBeGreaterThan(0);

    const view = new DataView(buffer);

    // Loop information should be disabled for instrument preview exports
    const loopOffset = view.getUint32(0x1c, true);
    const loopSamples = view.getUint32(0x20, true);
    expect(loopOffset).toBe(0);
    expect(loopSamples).toBe(0);
  });

  it('preserves total samples when using optimized strategy', () => {
    const yamlContent = readFileSync('test/fixtures/song-vgm-tone.yaml', 'utf-8');

    const song = parseSongFromYaml(yamlContent);

    const simple = exportSongToVgm(song, 'simple');
    const optimized = exportSongToVgm(song, 'optimized');

    expect(simple.totalSamples).toBeGreaterThan(0);
    expect(optimized.totalSamples).toBeGreaterThan(0);
    expect(optimized.totalSamples).toBe(simple.totalSamples);

    const simpleBytes = new Uint8Array(simple.buffer);
    const optimizedBytes = new Uint8Array(optimized.buffer);

    // Sanity: optimized output should still look like a valid VGM file
    expect(optimizedBytes[0]).toBe(0x56); // 'V'
    expect(optimizedBytes[1]).toBe(0x67); // 'g'
    expect(optimizedBytes[2]).toBe(0x6d); // 'm'
    expect(optimizedBytes[3]).toBe(0x20); // ' '

    // Both streams must end with 0x66 (end of sound data)
    const simpleView = new DataView(simple.buffer);
    const optView = new DataView(optimized.buffer);

    const simpleGd3OffsetRel = simpleView.getUint32(0x14, true);
    const optGd3OffsetRel = optView.getUint32(0x14, true);

    if (simpleGd3OffsetRel > 0) {
      const simpleGd3Start = 0x14 + simpleGd3OffsetRel;
      expect(simpleBytes[simpleGd3Start - 1]).toBe(0x66);
    }
    if (optGd3OffsetRel > 0) {
      const optGd3Start = 0x14 + optGd3OffsetRel;
      expect(optimizedBytes[optGd3Start - 1]).toBe(0x66);
    }
  });

  it('uses merged delay commands for optimized strategy', () => {
    const yamlContent = readFileSync('test/fixtures/song-vgm-tone.yaml', 'utf-8');

    const song = parseSongFromYaml(yamlContent);

    const simple = exportSongToVgm(song, 'simple');
    const optimized = exportSongToVgm(song, 'optimized');

    const simpleBytes = new Uint8Array(simple.buffer);
    const optimizedBytes = new Uint8Array(optimized.buffer);

    const simpleStats = countVgmDelayCommands(simpleBytes, new DataView(simple.buffer));
    const optStats = countVgmDelayCommands(optimizedBytes, new DataView(optimized.buffer));

    expect(simpleStats.count63).toBeGreaterThan(0);
    expect(optStats.count61).toBeGreaterThan(0);
    expect(optStats.count63).toBeLessThan(simpleStats.count63);
  });
});

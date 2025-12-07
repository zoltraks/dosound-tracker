import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { parseSongFromYaml } from '../../src/utils/songParser';
import { exportSongToWav, exportInstrumentToWav } from '../../src/utils/assemblyExport';
import { VBLANK_RATE, type Instrument, type Song } from '../../src/synth/SoundDriver';

describe('WAV export context', () => {
  it('uses only a single playlist entry worth of samples when scoped to one pattern', () => {
    const yamlContent = readFileSync('test/fixtures/song-vgm-tone.yaml', 'utf-8');

    const song = parseSongFromYaml(yamlContent);
    const playlistLength = song.playlist.length;
    expect(playlistLength).toBeGreaterThan(1);

    const full = exportSongToWav(song);

    const scopedSong: Song = {
      ...song,
      playlist: [song.playlist[1]],
      loop: null,
    };

    const scoped = exportSongToWav(scopedSong);

    expect(scoped.sampleRate).toBeGreaterThan(0);
    expect(scoped.totalSamples).toBeGreaterThan(0);
    expect(full.totalSamples).toBe(playlistLength * scoped.totalSamples);
  });

  it('exports instrument-preview WAV with duration derived from patternLength and speed', () => {
    const instrument: Instrument = {
      id: '00',
      name: '',
      volume: [
        1, 2, 3, 4, 5, 6, 7, 8, 9, 10,
        11, 12, 13, 14, 15, 14, 13, 12, 11, 10,
        9, 8, 7, 6, 5, 4, 3, 2, 1, 0,
      ],
      arpeggio: [],
      pitch: [],
      noiseEnvelope: [
        4, 5, 6, 7, 8, 9, 10, 11, 12, 13,
        14, 15, 16, 15, 14, 13, 12, 11, 10, 9,
        8, 7, 6, 5, 4, 3, 2, 1, 0,
      ],
      mode: [
        1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
        1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
        1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
        0,
      ],
      base: 'C-4',
      sustain: null,
    };

    const song: Song = {
      title: 'Test Song',
      author: 'Test',
      year: 2025,
      speed: 2,
      patternLength: 4,
      loop: null,
      patterns: [],
      playlist: [],
      instruments: [],
    };

    const result = exportInstrumentToWav(instrument, song);

    expect(result.sampleRate).toBe(44100);
    expect(result.totalSamples).toBeGreaterThan(0);

    const expectedTicks = song.patternLength * song.speed;
    const expectedDuration = expectedTicks / VBLANK_RATE;
    const diff = Math.abs(result.durationSeconds - expectedDuration);
    expect(diff).toBeLessThan(1 / VBLANK_RATE);
  });
});

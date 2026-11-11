// @vitest-environment node

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { parseSongFromYaml } from '../../src/utils/song/songParser.ts';
import { exportSongToMidi, exportInstrumentToMidi } from '../../src/exports/midi.ts';
import type { Song } from '../../src/synth/SoundDriver.ts';

interface ParsedTrack {
  events: { tick: number; status: number; data: number[] }[];
}

function readVarLen(bytes: Uint8Array, pos: number): { value: number; next: number } {
  let value = 0;
  let p = pos;
  for (;;) {
    const b = bytes[p++];
    value = (value << 7) | (b & 0x7f);
    if ((b & 0x80) === 0) {
      return { value, next: p };
    }
  }
}

function parseTracks(bytes: Uint8Array): ParsedTrack[] {
  const tracks: ParsedTrack[] = [];
  let pos = 8 + 6;

  while (pos < bytes.length) {
    const magic = String.fromCharCode(bytes[pos], bytes[pos + 1], bytes[pos + 2], bytes[pos + 3]);
    expect(magic).toBe('MTrk');
    const length =
      (bytes[pos + 4] << 24) | (bytes[pos + 5] << 16) | (bytes[pos + 6] << 8) | bytes[pos + 7];
    const track: ParsedTrack = { events: [] };
    let p = pos + 8;
    const end = p + length;
    let tick = 0;

    while (p < end) {
      const delta = readVarLen(bytes, p);
      tick += delta.value;
      p = delta.next;
      const status = bytes[p++];
      if (status === 0xff) {
        const meta = bytes[p++];
        const len = readVarLen(bytes, p);
        p = len.next + len.value;
        track.events.push({ tick, status, data: [meta] });
        if (meta === 0x2f) break;
      } else {
        const size = status >= 0xc0 && status <= 0xdf ? 1 : 2;
        const data: number[] = [];
        for (let i = 0; i < size; i++) {
          data.push(bytes[p++]);
        }
        track.events.push({ tick, status, data });
      }
    }

    tracks.push(track);
    pos = end;
  }

  return tracks;
}

function loadToneSong(): Song {
  const yamlContent = readFileSync('test/fixtures/song-vgm-tone.yaml', 'utf-8');
  return parseSongFromYaml(yamlContent);
}

describe('exportSongToMidi', () => {
  it('exports a valid SMF type 1 file for the default song', () => {
    const song = loadToneSong();
    const { buffer } = exportSongToMidi(song);
    const bytes = new Uint8Array(buffer);

    try {
      expect(String.fromCharCode(...bytes.subarray(0, 4))).toBe('MThd');
      const view = new DataView(buffer);
      expect(view.getUint32(4)).toBe(6);
      expect(view.getUint16(8)).toBe(1);
      expect(view.getUint16(10)).toBe(4);
      expect(view.getUint16(12)).toBe(96);
    } catch (error) {
      console.log('header bytes:', Array.from(bytes.subarray(0, 16)));
      throw error;
    }
  });

  it('encodes row timing into the tempo meta event', () => {
    const song = loadToneSong();
    const speed = song.speed;
    const frame = song.frame ?? 50;
    const expectedTempo = Math.round((4 * speed * 1e6) / frame);

    const { buffer } = exportSongToMidi(song);
    const bytes = new Uint8Array(buffer);

    let tempoValue: number | null = null;
    for (let i = 0; i < bytes.length - 5; i++) {
      if (bytes[i] === 0xff && bytes[i + 1] === 0x51 && bytes[i + 2] === 0x03) {
        tempoValue = (bytes[i + 3] << 16) | (bytes[i + 4] << 8) | bytes[i + 5];
        break;
      }
    }
    try {
      expect(tempoValue).toBe(expectedTempo);
    } catch (error) {
      console.log('tempo bytes:', tempoValue, 'expected:', expectedTempo);
      throw error;
    }
  });

  it('writes tempo 400000 us per quarter for a speed-6 60 Hz song (150 BPM)', () => {
    const song = loadToneSong();
    const { buffer } = exportSongToMidi({ ...song, speed: 6, frame: 60 });
    const bytes = new Uint8Array(buffer);

    let tempoValue: number | null = null;
    for (let i = 0; i < bytes.length - 5; i++) {
      if (bytes[i] === 0xff && bytes[i + 1] === 0x51 && bytes[i + 2] === 0x03) {
        tempoValue = (bytes[i + 3] << 16) | (bytes[i + 4] << 8) | bytes[i + 5];
        break;
      }
    }
    expect(tempoValue).toBe(400000);
  });

  it('emits note-on and note-off pairs spaced by 24 ticks per row', () => {
    const song = loadToneSong();
    const { buffer } = exportSongToMidi(song);
    const tracks = parseTracks(new Uint8Array(buffer));

    const channelTrack = tracks[1];
    const noteOns = channelTrack.events.filter(
      (e) => (e.status & 0xf0) === 0x90 && e.data[1] !== 0x00,
    );
    const noteOffs = channelTrack.events.filter(
      (e) => (e.status & 0xf0) === 0x90 && e.data[1] === 0x00,
    );

    try {
      expect(noteOns.length).toBeGreaterThan(0);
      expect(noteOffs.length).toBeGreaterThan(0);
      for (const event of channelTrack.events) {
        expect(event.tick % 24).toBe(0);
      }
    } catch (error) {
      console.log('channel events:', channelTrack.events.slice(0, 20));
      throw error;
    }
  });

  it('produces byte-identical output across runs', () => {
    const song = loadToneSong();
    const first = new Uint8Array(exportSongToMidi(song).buffer);
    const second = new Uint8Array(exportSongToMidi(song).buffer);
    expect(Array.from(first)).toEqual(Array.from(second));
  });

  it('reports mapping losses in the warnings list', () => {
    const song = loadToneSong();
    const { warnings } = exportSongToMidi(song);
    expect(warnings.length).toBeGreaterThan(0);
    expect(warnings.some((w) => w.includes('envelope'))).toBe(true);
  });

  it('honors instrument midi channel and program overrides', () => {
    const song = loadToneSong();
    const instrument = { ...song.instrument[0], midi: { channel: 5, program: 42 } };
    const custom: Song = {
      ...song,
      instrument: [instrument],
    };

    const { buffer } = exportSongToMidi(custom);
    const tracks = parseTracks(new Uint8Array(buffer));

    const channelTrack = tracks[1];
    const programChange = channelTrack.events.find((e) => (e.status & 0xf0) === 0xc0);
    const noteOn = channelTrack.events.find(
      (e) => (e.status & 0xf0) === 0x90 && e.data[1] !== 0x00,
    );

    try {
      expect(programChange).toBeDefined();
      expect(programChange!.status & 0x0f).toBe(4);
      expect(programChange!.data[0]).toBe(42);
      expect(noteOn).toBeDefined();
      expect(noteOn!.status & 0x0f).toBe(4);
    } catch (error) {
      console.log('channel events:', channelTrack.events.slice(0, 10));
      throw error;
    }
  });

  it('closes held notes at song end', () => {
    const song = loadToneSong();
    const { buffer } = exportSongToMidi(song);
    const tracks = parseTracks(new Uint8Array(buffer));

    for (let i = 1; i <= 3; i++) {
      const noteOns = tracks[i].events.filter(
        (e) => (e.status & 0xf0) === 0x90 && e.data[1] !== 0x00,
      ).length;
      const noteOffs = tracks[i].events.filter(
        (e) => (e.status & 0xf0) === 0x90 && e.data[1] === 0x00,
      ).length;
      try {
        expect(noteOffs).toBe(noteOns);
      } catch (error) {
        console.log(`track ${i} ons/offs:`, noteOns, noteOffs);
        throw error;
      }
    }
  });
});

describe('exportInstrumentToMidi', () => {
  it('exports a valid SMF for an instrument preview', () => {
    const song = loadToneSong();
    const instrument = song.instrument[0];
    const { buffer } = exportInstrumentToMidi(instrument, song);
    const bytes = new Uint8Array(buffer);
    expect(String.fromCharCode(...bytes.subarray(0, 4))).toBe('MThd');
  });
});

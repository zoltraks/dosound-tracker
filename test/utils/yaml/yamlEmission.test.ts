// @vitest-environment node

/**
 * Emitted-YAML byte-equivalence harness.
 *
 * Every YAML saver output is pinned against a golden file under
 * `test/fixtures/emission/` via `toMatchFileSnapshot`, so the comparison
 * covers the exact emitted text - quoting, spacing, wrapping, and flow
 * style - not just the parsed values. Regenerating goldens with
 * `vitest --update` re-baselines the file-format contract and is a
 * deliberate act, never part of a routine run (see TESTING.md).
 */

import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { buildSongYamlForExport } from '../../../src/utils/song/songIO.ts';
import { parseSongFromYaml } from '../../../src/utils/song/songParser.ts';
import {
  buildInstrumentYamlForExport,
  parseInstrumentFromText,
} from '../../../src/utils/instrument/instrumentIO.ts';
import { buildSettingsYaml } from '../../../src/utils/settings/settingsYaml.ts';
import { buildMidiConfigurationYaml } from '../../../src/utils/midi/midiConfiguration.ts';
import { generateClipboardData } from '../../../src/utils/track/trackClipboard.ts';
import { formatBaseKey } from '../../../src/utils/song/songFormat.ts';
import { DEFAULT_SETTINGS } from '../../../src/types/settings.ts';
import type { SettingsValues } from '../../../src/types/settings.ts';
import type { MidiConfiguration } from '../../../src/utils/midi/midiUtils.ts';
import { asInstrumentId } from '../../../src/types/branded.ts';
import type { Instrument, Pattern, Song } from '../../../src/synth/SoundDriver.ts';

const SONG_FIXTURES = ['bundled-song', 'song-vgm-noise', 'song-vgm-tone'] as const;

const golden = (name: string): string => `../../fixtures/emission/${name}.yaml`;

const edgeSong = (): Song => ({
  title: 'Edge: "Quoted" #Hash [Brackets] {Braces} <Angle> Ångström',
  author: '  Author & Co.  ',
  year: 2026,
  speed: 6,
  length: 16,
  loop: 1,
  chip: 'YM',
  frame: 50,
  clock: 2000000,
  stereo: { layout: 'abc', A: 0, B: 0.5, C: 1 },
  line: [
    { A: '00', B: '01', C: '00' },
    { A: '01', B: '--', C: '--' },
  ],
  pattern: [
    {
      id: '00',
      name: 'Lead "Theme" #1',
      step: [
        { note: { note: 'C', octave: 4, instrument: '00' }, volume: 15 },
        { note: { note: 'C#', octave: 4, instrument: '00' } },
        { note: { note: '===', octave: 0, instrument: '00' } },
        { note: null, volume: 10 },
        { note: null, volume: 10 },
        { note: null, volume: 10 },
        { note: null },
        { note: null },
        { note: { note: 'F#', octave: 2, instrument: '01' }, volume: 0 },
      ],
    },
    {
      id: '01',
      name: '',
      step: [
        { note: { note: 'A', octave: 5, instrument: '01' } },
        { note: null },
        { note: null },
        { note: null },
        { note: null },
        { note: null },
        { note: null },
        { note: null },
        { note: null },
        { note: null },
        { note: null },
        { note: null },
        { note: null },
        { note: null },
        { note: null },
        { note: null },
      ],
    },
  ],
  instrument: [
    {
      id: '00',
      name: 'Weird "Name" \\ Test: #1',
      base: 'C-3',
      color: '#a1b',
      octave: 5,
      sustain: 4,
      volume: [15, 15, 15, 15],
      shift: [1, 2, 3, 3, 3],
      pitch: [0, 1, 0, -1, -1],
      noise: [0, 0, 5, 5],
      mode: [1, 1, 0, 0],
      midi: { channel: 16, program: 127 },
    },
    {
      id: '01',
      name: 'Plain',
      volume: [13, 13, 13, 13, 0],
      shift: new Array(32).fill(0),
      pitch: new Array(32).fill(0),
      noise: new Array(32).fill(0),
      mode: new Array(32).fill(0),
    },
  ],
});

const edgeInstrument = (): Instrument => ({
  id: '00',
  name: 'Edge "Case" & <Instrument>',
  base: 'F#2',
  color: '#5d5',
  octave: 0,
  sustain: 0,
  volume: [15, 14, 13, 13, 13],
  shift: [-2, -2, 2, 2],
  pitch: [7, 0, 7, 0],
  noise: [9],
  mode: [1, 1, 1, 1],
});

const edgeSettings = (): SettingsValues => ({
  general: {
    theme: 'contrast',
    textScale: '150',
    trackBackground: false,
    startupTone: false,
  },
  editor: {
    restoreCursor: false,
    restoreView: true,
    pasteTrackMode: 'overwriteAll',
    confirmPaste: true,
  },
  sound: { engine: 'ayumi' },
});

const edgeMidi = (withDevices: boolean): MidiConfiguration => ({
  inputEnabled: true,
  outputEnabled: false,
  inputId: withDevices ? 'IAC Driver Bus 1' : null,
  outputId: withDevices ? 'USB MIDI Interface' : null,
  ignoreInputVolume: true,
  ignoreOutputVolume: false,
});

const clipboardPattern = (): Pattern => ({
  id: '00',
  name: 'Clipboard',
  step: [
    { note: { note: 'C', octave: 4, instrument: '00' }, volume: 15 },
    { note: { note: '===', octave: 0, instrument: '00' } },
    { note: null },
    { note: null },
    { note: null, volume: 12 },
    { note: null, volume: 12 },
    { note: { note: 'G#', octave: 3, instrument: '01' } },
    { note: null },
    { note: null },
    { note: null },
    { note: null },
    { note: null },
    { note: null },
    { note: null },
    { note: null },
    { note: null },
  ],
});

describe('emitted YAML byte equivalence', () => {
  describe('song corpus', () => {
    for (const fixture of SONG_FIXTURES) {
      it(`emits ${fixture} byte-identically`, async () => {
        const text = readFileSync(`test/fixtures/song/${fixture}.yaml`, 'utf-8');
        const emitted = buildSongYamlForExport(parseSongFromYaml(text));
        try {
          await expect(emitted).toMatchFileSnapshot(golden(`song-${fixture}`));
        } catch (error) {
          console.log(`emitted drift for ${fixture}`);
          throw error;
        }
      });
    }
  });

  describe('instrument corpus', () => {
    const names = readdirSync('test/fixtures/instrument').filter((name) => name.endsWith('.yaml'));

    for (const file of names) {
      const base = file.replace(/\.yaml$/, '');
      it(`emits ${base} byte-identically`, async () => {
        const text = readFileSync(`test/fixtures/instrument/${file}`, 'utf-8');
        const instrument = parseInstrumentFromText(text, asInstrumentId('00'));
        const emitted = buildInstrumentYamlForExport(instrument);
        try {
          await expect(emitted).toMatchFileSnapshot(golden(`instrument-${base}`));
        } catch (error) {
          console.log(`emitted drift for instrument ${base}`);
          throw error;
        }
      });
    }
  });

  describe('constructed edge cases', () => {
    it('emits a song with special characters, envelopes, midi, and stereo byte-identically', async () => {
      const emitted = buildSongYamlForExport(edgeSong());
      try {
        await expect(emitted).toMatchFileSnapshot(golden('song-edge-cases'));
      } catch (error) {
        console.log('emitted drift for constructed song');
        throw error;
      }
    });

    it('emits an instrument with special characters byte-identically', async () => {
      const emitted = buildInstrumentYamlForExport(edgeInstrument());
      try {
        await expect(emitted).toMatchFileSnapshot(golden('instrument-edge-cases'));
      } catch (error) {
        console.log('emitted drift for constructed instrument');
        throw error;
      }
    });

    it('emits settings documents byte-identically', async () => {
      try {
        await expect(buildSettingsYaml(DEFAULT_SETTINGS)).toMatchFileSnapshot(
          golden('settings-default'),
        );
        await expect(buildSettingsYaml(edgeSettings())).toMatchFileSnapshot(
          golden('settings-nondefault'),
        );
      } catch (error) {
        console.log('emitted drift for settings');
        throw error;
      }
    });

    it('emits midi configuration documents byte-identically', async () => {
      try {
        await expect(buildMidiConfigurationYaml(edgeMidi(true))).toMatchFileSnapshot(
          golden('midi-devices'),
        );
        await expect(buildMidiConfigurationYaml(edgeMidi(false))).toMatchFileSnapshot(
          golden('midi-nodevices'),
        );
      } catch (error) {
        console.log('emitted drift for midi configuration');
        throw error;
      }
    });

    it('emits clipboard step data byte-identically', async () => {
      const emitted = generateClipboardData(clipboardPattern(), 16, formatBaseKey);
      try {
        await expect(emitted).toMatchFileSnapshot(golden('clipboard-steps'));
      } catch (error) {
        console.log('emitted drift for clipboard data');
        throw error;
      }
      expect(emitted).toContain('step:');
    });
  });
});

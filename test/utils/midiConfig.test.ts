import { describe, it, expect } from 'vitest';
import type { MidiConfiguration } from '../../src/hooks/useMidi';
import {
  buildMidiConfigurationYaml,
  parseMidiConfigurationFromYaml,
  MidiConfigurationFormatError,
} from '../../src/utils/midiConfig';

const makeConfig = (overrides: Partial<MidiConfiguration> = {}): MidiConfiguration => ({
  inputEnabled: false,
  outputEnabled: false,
  inputId: null,
  outputId: null,
  ignoreInputVolume: true,
  ignoreOutputVolume: true,
  ...overrides,
});

describe('midiConfig YAML helpers', () => {
  it('round-trips MIDI config through YAML export and import', () => {
    const original = makeConfig({
      inputEnabled: true,
      outputEnabled: true,
      inputId: 'input-1',
      outputId: 'output-1',
      ignoreInputVolume: false,
      ignoreOutputVolume: true,
    });

    const yaml = buildMidiConfigurationYaml(original);

    // Use a different current config to verify YAML fully drives the result
    const fallback = makeConfig({
      inputEnabled: false,
      outputEnabled: false,
      inputId: 'fallback-input',
      outputId: 'fallback-output',
      ignoreInputVolume: true,
      ignoreOutputVolume: false,
    });

    const parsed = parseMidiConfigurationFromYaml(yaml, fallback);

    expect(parsed).toEqual(original);
  });

  it('parses boolean fields from various representations and falls back when unknown', () => {
    const yaml = `
      midi:
        version: 1
        input:
          enable: "yes"
          agnostic: "no"
        output:
          enable: "0"
          agnostic: "1"
    `;

    const fallback = makeConfig({
      inputEnabled: false,
      outputEnabled: true,
      ignoreInputVolume: true,
      ignoreOutputVolume: false,
    });

    const parsed = parseMidiConfigurationFromYaml(yaml, fallback);

    expect(parsed.inputEnabled).toBe(true); // "yes" -> true
    expect(parsed.ignoreInputVolume).toBe(false); // "no" -> false
    expect(parsed.outputEnabled).toBe(false); // "0" -> false
    expect(parsed.ignoreOutputVolume).toBe(true); // "1" -> true
  });

  it('parses device IDs with trimming and null handling', () => {
    const yaml = `
      midi:
        input:
          enable: true
          device: "  input-device  "
        output:
          enable: true
          device: "  "
    `;

    const fallback = makeConfig({
      inputId: 'fallback-input',
      outputId: 'fallback-output',
    });

    const parsed = parseMidiConfigurationFromYaml(yaml, fallback);

    expect(parsed.inputId).toBe('input-device');
    expect(parsed.outputId).toBeNull();
  });

  it('throws MidiConfigurationFormatError when root midi key is missing', () => {
    const yaml = 'root: {}';
    const current = makeConfig();

    expect(() => parseMidiConfigurationFromYaml(yaml, current)).toThrowError(MidiConfigurationFormatError);
    expect(() => parseMidiConfigurationFromYaml(yaml, current)).toThrowError(
      /Invalid MIDI configuration file: missing "midi" root key\./,
    );
  });

  it('throws MidiConfigurationFormatError when midi section is not an object', () => {
    const yaml = 'midi: 123';
    const current = makeConfig();

    expect(() => parseMidiConfigurationFromYaml(yaml, current)).toThrowError(MidiConfigurationFormatError);
    expect(() => parseMidiConfigurationFromYaml(yaml, current)).toThrowError(
      /Invalid MIDI configuration file: "midi" section is not an object\./,
    );
  });
});

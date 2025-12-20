import yaml from 'js-yaml';
import type { MidiConfiguration } from '../hooks/useMidi';

export class MidiConfigurationFormatError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'MidiConfigurationFormatError';
  }
}

export const buildMidiConfigurationYaml = (configuration: MidiConfiguration): string => {
  const inputNode: Record<string, unknown> = {
    enable: !!configuration.inputEnabled,
    agnostic: !!configuration.ignoreInputVolume,
  };
  if (configuration.inputId) {
    inputNode.device = configuration.inputId;
  }

  const outputNode: Record<string, unknown> = {
    enable: !!configuration.outputEnabled,
    agnostic: !!configuration.ignoreOutputVolume,
  };
  if (configuration.outputId) {
    outputNode.device = configuration.outputId;
  }

  const exportData = {
    midi: {
      version: 1,
      input: inputNode,
      output: outputNode,
    },
  };

  const yamlContent = yaml.dump(exportData, {
    indent: 2,
    lineWidth: -1,
    quotingType: '"',
  });

  return yamlContent;
};

export const parseMidiConfigurationFromYaml = (
  text: string,
  currentConfiguration: MidiConfiguration,
): MidiConfiguration => {
  const parsed = yaml.load(text) as unknown;

  if (!parsed || typeof parsed !== 'object' || !('midi' in (parsed as Record<string, unknown>))) {
    throw new MidiConfigurationFormatError('Invalid MIDI configuration file: missing "midi" root key.');
  }

  type MidiFileRoot = {
    midi?: unknown;
  };

  const root = parsed as MidiFileRoot;
  const node = root.midi;

  if (!node || typeof node !== 'object') {
    throw new MidiConfigurationFormatError('Invalid MIDI configuration file: "midi" section is not an object.');
  }

  const midiNode = node as {
    version?: unknown;
    input?: unknown;
    output?: unknown;
  };

  const inputNode =
    midiNode.input && typeof midiNode.input === 'object'
      ? (midiNode.input as Record<string, unknown>)
      : {};
  const outputNode =
    midiNode.output && typeof midiNode.output === 'object'
      ? (midiNode.output as Record<string, unknown>)
      : {};

  const parseBool = (value: unknown, fallback: boolean): boolean => {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'number') {
      if (!Number.isFinite(value)) return fallback;
      return value !== 0;
    }
    if (typeof value === 'string') {
      const trimmed = value.trim().toLowerCase();
      if (trimmed === 'true' || trimmed === 'yes' || trimmed === 'y' || trimmed === '1') {
        return true;
      }
      if (trimmed === 'false' || trimmed === 'no' || trimmed === 'n' || trimmed === '0') {
        return false;
      }
      return fallback;
    }
    return fallback;
  };

  const parseDeviceId = (value: unknown, fallback: string | null): string | null => {
    if (value === null || value === undefined) return null;
    if (typeof value === 'string') {
      const trimmed = value.trim();
      return trimmed || null;
    }
    return fallback;
  };

  const nextConfig: MidiConfiguration = {
    inputEnabled: parseBool(inputNode.enable, currentConfiguration.inputEnabled),
    outputEnabled: parseBool(outputNode.enable, currentConfiguration.outputEnabled),
    inputId: parseDeviceId(inputNode.device, currentConfiguration.inputId),
    outputId: parseDeviceId(outputNode.device, currentConfiguration.outputId),
    ignoreInputVolume: parseBool(inputNode.agnostic, currentConfiguration.ignoreInputVolume),
    ignoreOutputVolume: parseBool(outputNode.agnostic, currentConfiguration.ignoreOutputVolume),
  };

  return nextConfig;
};

import * as yaml from 'js-yaml';
import { ENVELOPE_LENGTH } from '../../constants/music.ts';
import { assertImportSize } from '../validation/importSize.ts';
import { YAML_DUMP_OPTIONS } from '../yaml/yamlUtils.ts';
import { expandEnvelope, expandLoopingEnvelope } from './envelopeUtils.ts';
import { clampEnvelopeValue, getEnvelopeTitle, type EnvelopePanelType } from './envelopeTypes.ts';

export interface EnvelopeClipboardData {
  data: number[];
  sustain?: number | null;
}

export function generateEnvelopeClipboardData(
  type: EnvelopePanelType,
  data: number[] | undefined,
  sustain?: number | null,
): string {
  const payload: Record<string, unknown> = {
    [type]: Array.isArray(data) ? data : [],
  };

  if (
    type === 'volume' &&
    typeof sustain === 'number' &&
    Number.isFinite(sustain) &&
    sustain >= 0
  ) {
    payload.sustain = Math.floor(sustain);
  }

  return yaml.dump(payload, YAML_DUMP_OPTIONS);
}

export function parseEnvelopeClipboardData(
  text: string,
  type: EnvelopePanelType,
): EnvelopeClipboardData {
  assertImportSize(text, 'Clipboard data');

  let parsed: unknown;
  try {
    parsed = yaml.load(text);
  } catch (error) {
    throw new Error(
      'Failed to parse YAML: ' + (error instanceof Error ? error.message : String(error)),
      { cause: error },
    );
  }

  const root = parsed && typeof parsed === 'object' ? (parsed as Record<string, unknown>) : null;
  const useArpeggioAlias = type === 'shift' && root?.[type] === undefined;
  const rawValues = useArpeggioAlias ? (root?.arpeggio ?? null) : (root?.[type] ?? null);

  if (rawValues === null || rawValues === undefined) {
    throw new Error(`Clipboard does not contain a ${getEnvelopeTitle(type)} envelope.`);
  }

  const rawArray = Array.isArray(rawValues) ? rawValues : [rawValues];
  const numericValues: number[] = [];
  for (const raw of rawArray) {
    const value = Number(raw);
    if (!Number.isFinite(value)) {
      throw new Error(
        `Invalid ${getEnvelopeTitle(type)} envelope value "${String(raw)}" in clipboard data.`,
      );
    }
    numericValues.push(clampEnvelopeValue(type, Math.trunc(value)));
  }

  if (numericValues.length === 0) {
    throw new Error(`Clipboard does not contain a ${getEnvelopeTitle(type)} envelope.`);
  }

  const expand = useArpeggioAlias ? expandLoopingEnvelope : expandEnvelope;
  const result: EnvelopeClipboardData = {
    data: expand(numericValues, ENVELOPE_LENGTH, 0),
  };

  if (type === 'volume') {
    const rawSustain = root?.sustain;
    const sustain = Number(rawSustain);
    if (Number.isFinite(sustain) && sustain >= 0) {
      result.sustain = Math.min(Math.floor(sustain), ENVELOPE_LENGTH - 1);
    }
  }

  return result;
}
